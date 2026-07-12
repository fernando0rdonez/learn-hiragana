import { useState, useEffect } from "react";
import { ArrowLeft, Volume2, Turtle } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { ListeningSentence } from "../listening";
import { LISTENING_SENTENCES } from "../listening";
import { advanceBox, isDue } from "../leitner";
import { listeningProgressKey } from "../utils";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import { AudioUnavailableHint } from "./AudioButton";
import AnswerReveal from "./AnswerReveal";
import VocabSessionSummary, { type SessionResult } from "./VocabSessionSummary";
import foxNeutralImg from "../assets/character/fox-neutral.png";
import foxCelebratingImg from "../assets/character/fox-celebrating.png";
import foxSadImg from "../assets/character/fox-sad.png";

function toISODate(d: Date = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

type GamePhase = "playing" | "correct" | "wrong" | "done";

const MAX_LISTENS = 3;
const CYAN      = "#0891B2";
const CYAN_DARK = "#0E7490";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 4 opciones: la traducción correcta + 3 distractores de otras frases. */
function buildOptions(sentence: ListeningSentence): string[] {
  const others = shuffle(
    LISTENING_SENTENCES.filter((s) => s.id !== sentence.id && s.translation !== sentence.translation)
  );
  const distractors = others.slice(0, 3).map((s) => s.translation);
  return shuffle([sentence.translation, ...distractors]);
}

interface Props {
  sentences: ListeningSentence[];
  progress: ProgressItems;
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

export default function ListeningComprehensionGame({
  sentences,
  progress,
  sessionLimit = 50,
  onProgressUpdate,
  onBack,
}: Props) {
  const [queue, setQueue] = useState<ListeningSentence[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAudioHelp, setShowAudioHelp] = useState(false);
  const [listenCount, setListenCount] = useState(1);
  const [totalListens, setTotalListens] = useState(0);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const { speak } = useSpeech();

  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" ? foxSadImg :
    foxNeutralImg;

  useEffect(() => {
    const due: ListeningSentence[] = [];
    const notDue: ListeningSentence[] = [];
    for (const s of sentences) {
      const prog = progress[listeningProgressKey("listen-sentence", s.id)];
      if (!prog || prog.attempts === 0 || isDue(prog.nextDue, today)) {
        due.push(s);
      } else {
        notDue.push(s);
      }
    }
    const sentenceQueue = [...shuffle(due), ...shuffle(notDue)].slice(0, sessionLimit);
    setQueue(sentenceQueue);
    setQueueIndex(0);
    if (sentenceQueue.length > 0) initSentence(sentenceQueue[0]);
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initSentence(sentence: ListeningSentence) {
    setOptions(buildOptions(sentence));
    setSelected(null);
    setListenCount(1);
    setPhase("playing");
    setShowAudioHelp(false);
    const played = await speak(sentence.kana);
    if (!played) setShowAudioHelp(true);
  }

  async function handleReplay(rate?: number) {
    if (listenCount >= MAX_LISTENS) return;
    setListenCount((c) => c + 1);
    const played = await speak(currentSentence!.kana, rate);
    if (!played) setShowAudioHelp(true);
  }

  const currentSentence = queue[queueIndex] ?? null;

  function advanceToNext() {
    setTotalListens((t) => t + listenCount);
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      setPhase("done");
      return;
    }
    setQueueIndex(nextIndex);
    initSentence(queue[nextIndex]);
  }

  function recordResult(sentence: ListeningSentence, isCorrect: boolean) {
    const key = listeningProgressKey("listen-sentence", sentence.id);
    const prevP: ItemProgress = progress[key] ?? {
      box: 0,
      nextDue: today,
      attempts: 0,
      correct: 0,
    };
    const { box, nextDue } = advanceBox(prevP, isCorrect, today);
    const newP: ItemProgress = {
      box,
      nextDue,
      attempts: prevP.attempts + 1,
      correct: prevP.correct + (isCorrect ? 1 : 0),
    };
    onProgressUpdate({ [key]: newP });
    setSessionResults((prev) => [...prev, { word: { hiragana: sentence.kana, romaji: "", meaning: sentence.translation }, correct: isCorrect }]);
  }

  function handleAnswer(option: string) {
    if (phase !== "playing" || !currentSentence) return;
    setSelected(option);
    const isCorrect = option === currentSentence.translation;
    if (isCorrect) {
      playChime();
      fireConfetti();
      setPhase("correct");
    } else {
      playBuzz();
      setPhase("wrong");
    }
    recordResult(currentSentence, isCorrect);
  }

  if (phase === "done" || queue.length === 0) {
    return (
      <VocabSessionSummary
        sessionResults={sessionResults}
        onBack={onBack}
        footer={sessionResults.length > 0 ? `Escuchaste las frases ${totalListens} veces en total` : undefined}
      />
    );
  }

  if (!currentSentence) return null;

  const totalSentences = queue.length;
  const progressPct = (queueIndex / totalSentences) * 100;
  const listensLeft = MAX_LISTENS - listenCount;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>
          {queueIndex + 1} / {totalSentences}
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#E0F7FA] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${CYAN}, ${CYAN_DARK})` }}
        />
      </div>

      {/* Solo audio — sin texto hasta responder */}
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={() => handleReplay()}
          disabled={phase === "playing" && listenCount >= MAX_LISTENS}
          aria-label="Escuchar pronunciación"
          className="flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-transform active:scale-95 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${CYAN}, ${CYAN_DARK})`, color: "#FFFFFF" }}
        >
          <Volume2 size={26} />
        </button>
        <button
          onClick={() => handleReplay(0.6)}
          disabled={phase === "playing" && listenCount >= MAX_LISTENS}
          aria-label="Escuchar más lento"
          className="flex items-center justify-center w-11 h-11 rounded-full border-2 transition-transform active:scale-95 disabled:opacity-30"
          style={{ borderColor: "#E0F7FA", color: CYAN_DARK }}
        >
          <Turtle size={20} />
        </button>
      </div>
      {showAudioHelp && <AudioUnavailableHint className="-mt-2" />}
      <p className="text-xs" style={{ color: "#8B7FA8" }}>
        {listensLeft > 0 ? `Puedes reescuchar ${listensLeft} ${listensLeft === 1 ? "vez" : "veces"} más` : "Sin más escuchas — responde"}
      </p>

      <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0 transition-opacity" />

      {/* 4 opciones de traducción */}
      <div className="w-full flex flex-col gap-2.5">
        {options.map((opt) => {
          const isCorrectOpt = opt === currentSentence.translation;
          const isSelectedOpt = opt === selected;
          let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF", color: "#1A1A2E" };
          if (phase !== "playing") {
            if (isCorrectOpt) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1", color: "#0A6E54" };
            else if (isSelectedOpt) style = { borderColor: CYAN_DARK, backgroundColor: "#E0F7FA", color: CYAN_DARK };
          }
          return (
            <button
              key={opt}
              disabled={phase !== "playing"}
              onClick={() => handleAnswer(opt)}
              className="w-full py-3.5 px-4 rounded-2xl border-2 text-sm font-medium text-left transition-colors disabled:opacity-100"
              style={style}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback: revela la frase escrita */}
      {phase !== "playing" && (
        <AnswerReveal
          status={phase}
          kana={currentSentence.kana}
          meaning={currentSentence.translation}
          onContinue={advanceToNext}
        />
      )}
    </div>
  );
}
