import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Volume2, Turtle } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { ListeningSentence } from "../listening";
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

// Ignora espacios y puntuación al comparar el dictado con la frase original
// (el usuario no tiene por qué reproducir signos que no se dictan por audio).
function normalizeDictation(s: string): string {
  return s.normalize("NFKC").replace(/[\s。、！？!?,.．，]/g, "");
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

/** Colorea cada kana de la frase correcta según si el dictado del usuario coincide en esa posición. */
function DictationDiff({ expected, given }: { expected: string; given: string }) {
  const exp = Array.from(expected);
  const giv = Array.from(normalizeDictation(given));
  return (
    <div className="flex flex-wrap gap-0.5 justify-center" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      {exp.map((ch, i) => (
        <span key={i} className="text-xl font-semibold" style={{ color: giv[i] === ch ? "#0A6E54" : "#C03A1E" }}>
          {ch}
        </span>
      ))}
    </div>
  );
}

interface Props {
  sentences: ListeningSentence[];
  progress: ProgressItems;
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

export default function ListeningDictationGame({
  sentences,
  progress,
  sessionLimit = 50,
  onProgressUpdate,
  onBack,
}: Props) {
  const [queue, setQueue] = useState<ListeningSentence[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [input, setInput] = useState("");
  const [showAudioHelp, setShowAudioHelp] = useState(false);
  const [listenCount, setListenCount] = useState(1);
  const [totalListens, setTotalListens] = useState(0);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const { speak, isAvailable } = useSpeech();
  const inputRef = useRef<HTMLInputElement>(null);

  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" ? foxSadImg :
    foxNeutralImg;

  useEffect(() => {
    const due: ListeningSentence[] = [];
    const notDue: ListeningSentence[] = [];
    for (const s of sentences) {
      const prog = progress[listeningProgressKey("dictation", s.id)];
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

  function initSentence(sentence: ListeningSentence) {
    setInput("");
    setListenCount(1);
    setPhase("playing");
    speak(sentence.kana);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleReplay(rate?: number) {
    if (phase === "playing" && listenCount >= MAX_LISTENS) return;
    setListenCount((c) => c + 1);
    speak(currentSentence!.kana, rate);
    if (!isAvailable) setShowAudioHelp((prev) => !prev);
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
    const key = listeningProgressKey("dictation", sentence.id);
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "playing" || !currentSentence || input.trim() === "") return;
    const isCorrect = normalizeDictation(input) === normalizeDictation(currentSentence.kana);
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
      {!isAvailable && showAudioHelp && <AudioUnavailableHint className="-mt-2" />}
      <p className="text-xs" style={{ color: "#8B7FA8" }}>
        {listensLeft > 0 ? `Puedes reescuchar ${listensLeft} ${listensLeft === 1 ? "vez" : "veces"} más` : "Sin más escuchas — responde"}
      </p>

      <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0 transition-opacity" />

      {/* Dictado en kana */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={phase !== "playing"}
          placeholder="escribe la frase en kana"
          autoComplete="off"
          autoCapitalize="off"
          className="w-full h-[52px] text-center text-lg rounded-[14px] outline-none border-2 transition-colors"
          style={{
            fontFamily: "'Noto Sans JP', sans-serif",
            borderColor: phase === "correct" ? "#15C0A0" : phase === "wrong" ? "#E85D3A" : "#E0F7FA",
            backgroundColor: phase === "correct" ? "#E3FAF3" : phase === "wrong" ? "#FFEEEA" : "#FFFFFF",
            color: phase === "correct" ? "#0A6E54" : phase === "wrong" ? "#C03A1E" : "#1A1A2E",
          }}
        />
        {phase === "playing" && (
          <button
            type="submit"
            disabled={input.trim() === ""}
            className="w-full h-[50px] rounded-[14px] text-white font-bold disabled:opacity-40"
            style={{ background: `linear-gradient(90deg, ${CYAN}, ${CYAN_DARK})` }}
          >
            Comprobar
          </button>
        )}
      </form>

      {/* Feedback: revela la frase + diff kana por kana del dictado */}
      {phase !== "playing" && (
        <AnswerReveal
          status={phase}
          kana={currentSentence.kana}
          meaning={currentSentence.translation}
          extra={
            phase === "wrong" ? (
              <div className="mt-3">
                <p className="text-xs mb-1" style={{ opacity: 0.75 }}>Tu dictado:</p>
                <DictationDiff expected={currentSentence.kana} given={input} />
              </div>
            ) : undefined
          }
          onContinue={advanceToNext}
        />
      )}
    </div>
  );
}
