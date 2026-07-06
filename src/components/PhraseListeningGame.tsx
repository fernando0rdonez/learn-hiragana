import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { Phrase } from "../phrases";
import { PHRASES } from "../phrases";
import { findKanjiSpelling } from "../kanji";
import { advanceBox, isDue } from "../leitner";
import { phraseProgressKey } from "../utils";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import { AudioUnavailableHint } from "./AudioButton";
import AnswerReveal from "./AnswerReveal";
import VocabSessionSummary, { type SessionResult } from "./VocabSessionSummary";
import foxNeutralImg from "../assets/character/fox-neutral.png";
import foxWorriedImg from "../assets/character/fox-worried.png";
import foxCelebratingImg from "../assets/character/fox-celebrating.png";
import foxSadImg from "../assets/character/fox-sad.png";

function toISODate(d: Date = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

type GamePhase = "playing" | "correct" | "wrong" | "timeout" | "done";

const TIME_LIMIT = 14; // segundos por pregunta: hay que escuchar y leer 4 frases largas
const WORRIED_AT = 4;
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ANSWER_DELAY = 2200;

const PINK      = "#D14B8F";
const PINK_DARK = "#A8306E";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 4 opciones: la frase correcta + 3 distractores (prioriza la misma categoría). */
function buildOptions(phrase: Phrase): Phrase[] {
  const sameCategory = shuffle(PHRASES.filter((p) => p.category === phrase.category && p.id !== phrase.id));
  const restCategory = shuffle(PHRASES.filter((p) => p.category !== phrase.category && p.id !== phrase.id));

  const seen = new Set([phrase.id]);
  const distractors: Phrase[] = [];
  for (const p of [...sameCategory, ...restCategory]) {
    if (distractors.length >= 3) break;
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    distractors.push(p);
  }
  return shuffle([phrase, ...distractors]);
}

interface Props {
  phrases: Phrase[];
  progress: ProgressItems;
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

export default function PhraseListeningGame({
  phrases,
  progress,
  sessionLimit = 50,
  onProgressUpdate,
  onBack,
}: Props) {
  const [queue, setQueue] = useState<Phrase[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [options, setOptions] = useState<Phrase[]>([]);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAudioHelp, setShowAudioHelp] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const { speak, isAvailable } = useSpeech();

  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" || phase === "timeout" ? foxSadImg :
    timeLeft <= WORRIED_AT ? foxWorriedImg :
    foxNeutralImg;

  useEffect(() => {
    const due: Phrase[] = [];
    const notDue: Phrase[] = [];
    for (const p of phrases) {
      const prog = progress[phraseProgressKey("phrase-listening", p.id)];
      if (!prog || prog.attempts === 0 || isDue(prog.nextDue, today)) {
        due.push(p);
      } else {
        notDue.push(p);
      }
    }
    const phraseQueue = [...shuffle(due), ...shuffle(notDue)].slice(0, sessionLimit);
    setQueue(phraseQueue);
    setQueueIndex(0);
    if (phraseQueue.length > 0) initPhrase(phraseQueue[0]);
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initPhrase(phrase: Phrase) {
    setOptions(buildOptions(phrase));
    setSelected(null);
    setTimeLeft(TIME_LIMIT);
    setPhase("playing");
    if (isAvailable) speak(phrase.kana);
  }

  function handleReplay() {
    if (!isAvailable) {
      setShowAudioHelp((prev) => !prev);
      return;
    }
    speak(currentPhrase!.kana);
  }

  const currentPhrase = queue[queueIndex] ?? null;

  function advanceToNext() {
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      setPhase("done");
      return;
    }
    setQueueIndex(nextIndex);
    initPhrase(queue[nextIndex]);
  }

  function recordResult(phrase: Phrase, isCorrect: boolean) {
    const key = phraseProgressKey("phrase-listening", phrase.id);
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
    setSessionResults((prev) => [...prev, { word: { hiragana: phrase.kana, romaji: phrase.romaji, meaning: phrase.meaning }, correct: isCorrect }]);
  }

  const finishAnswer = useCallback(
    (phrase: Phrase, isCorrect: boolean) => {
      recordResult(phrase, isCorrect);
      setTimeout(() => advanceToNext(), ANSWER_DELAY);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queueIndex, queue]
  );

  function handleAnswer(option: Phrase) {
    if (phase !== "playing" || !currentPhrase) return;
    setSelected(option.id);
    const isCorrect = option.id === currentPhrase.id;
    if (isCorrect) {
      playChime();
      fireConfetti();
      setPhase("correct");
    } else {
      playBuzz();
      setPhase("wrong");
    }
    finishAnswer(currentPhrase, isCorrect);
  }

  // Countdown ticker
  useEffect(() => {
    if (phase !== "playing") return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setTimeLeft(Math.max(0, +(TIME_LIMIT - elapsed).toFixed(1)));
    }, 100);
    return () => clearInterval(interval);
  }, [phase, queueIndex]);

  // Timeout — sin selección: cuenta como fallo
  useEffect(() => {
    if (phase === "playing" && timeLeft <= 0 && currentPhrase) {
      playBuzz();
      setPhase("timeout");
      finishAnswer(currentPhrase, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  if (phase === "done" || queue.length === 0) {
    return <VocabSessionSummary sessionResults={sessionResults} onBack={onBack} />;
  }

  if (!currentPhrase) return null;

  const totalPhrases = queue.length;
  const progressPct = (queueIndex / totalPhrases) * 100;
  const ringPct = Math.max(timeLeft, 0) / TIME_LIMIT;
  const ringOffset = RING_CIRCUMFERENCE * (1 - ringPct);
  const ringColor = timeLeft <= WORRIED_AT ? PINK_DARK : PINK;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>
          {queueIndex + 1} / {totalPhrases}
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#F9E9F1] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${PINK}, ${PINK_DARK})` }}
        />
      </div>

      {/* Solo audio — sin texto hasta responder */}
      <button
        onClick={handleReplay}
        aria-label={isAvailable ? "Escuchar pronunciación" : "Voz japonesa no disponible"}
        className="mt-2 flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-transform active:scale-95"
        style={isAvailable
          ? { background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`, color: "#FFFFFF" }
          : { backgroundColor: "#FAFAF9", border: "2px solid #E7E5E4", color: "#D6D3D1" }
        }
      >
        {isAvailable ? <Volume2 size={26} /> : <VolumeX size={26} />}
      </button>
      {!isAvailable && showAudioHelp && <AudioUnavailableHint className="-mt-2" />}

      {/* Temporizador + zorro */}
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
            <circle cx={32} cy={32} r={RING_RADIUS} fill="none" stroke="#F9E9F1" strokeWidth={6} />
            <circle
              cx={32} cy={32} r={RING_RADIUS} fill="none"
              stroke={ringColor} strokeWidth={6} strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.3s" }}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-lg font-bold"
            style={{ color: ringColor }}
          >
            {Math.ceil(timeLeft)}
          </span>
        </div>
        <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0 transition-opacity" />
      </div>

      {/* 4 opciones de frases escritas */}
      <div className="w-full flex flex-col gap-2.5">
        {options.map((opt) => {
          const isCorrectOpt = opt.id === currentPhrase.id;
          const isSelectedOpt = opt.id === selected;
          let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF", color: "#1A1A2E" };
          if (phase !== "playing") {
            if (isCorrectOpt) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1", color: "#0A6E54" };
            else if (isSelectedOpt) style = { borderColor: PINK_DARK, backgroundColor: "#FCEAF3", color: PINK_DARK };
          }
          return (
            <button
              key={opt.id}
              disabled={phase !== "playing"}
              onClick={() => handleAnswer(opt)}
              className="w-full py-3.5 px-4 rounded-2xl border-2 text-center transition-colors disabled:opacity-100"
              style={{ ...style, fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {opt.kana}
            </button>
          );
        })}
      </div>

      {/* Feedback + contexto de uso */}
      {phase !== "playing" && (
        <AnswerReveal
          status={phase}
          kana={currentPhrase.kana}
          kanji={findKanjiSpelling(currentPhrase.kana)}
          romaji={currentPhrase.romaji}
          meaning={currentPhrase.meaning}
          extra={
            <>
              <p className="text-[#8B7FA8] text-xs mt-1">{currentPhrase.context}</p>
              {phase !== "timeout" && (
                <p className="text-[#8B7FA8] text-xs mt-1 italic">Repítela en voz alta 🗣️</p>
              )}
            </>
          }
        />
      )}
    </div>
  );
}
