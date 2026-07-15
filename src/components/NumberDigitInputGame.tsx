import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { BuildLevelDef } from "../numbers";
import {
  numberToChips,
  numberToKana,
  numberToRomaji,
  randomNumberForLevel,
  numberKeyProgressKey,
  findNumberKanji,
} from "../numbers";
import { advanceBox } from "../leitner";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
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

const AMBER      = "#F5A623";
const AMBER_DARK = "#C77F00";

interface Props {
  level: BuildLevelDef;
  progress: ProgressItems;
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

/** Deja solo dígitos — hasta 5 cifras (99 999 es el mayor número del módulo). */
function sanitizeDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 5);
}

export default function NumberDigitInputGame({
  level,
  progress,
  sessionLimit = 10,
  onProgressUpdate,
  onBack,
}: Props) {
  const [queue, setQueue] = useState<number[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [input, setInput] = useState("");
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { speak } = useSpeech();

  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" ? foxSadImg :
    foxNeutralImg;

  useEffect(() => {
    const built = Array.from({ length: sessionLimit }, () => randomNumberForLevel(level));
    setQueue(built);
    setQueueIndex(0);
    if (built.length > 0) initRound();
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initRound() {
    setInput("");
    setPhase("playing");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const currentTarget = queue[queueIndex] ?? null;

  function advanceToNext() {
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      setPhase("done");
      return;
    }
    setQueueIndex(nextIndex);
    initRound();
  }

  // Mismo criterio de acreditación SRS que "Formar el número": el acierto/fallo
  // va a los números clave que componen la cifra, no a la cifra en sí.
  function recordResult(target: number, isCorrect: boolean) {
    const updates: ProgressItems = {};
    const creditValues = new Set(numberToChips(target).flatMap((c) => c.credits));
    for (const value of creditValues) {
      const key = numberKeyProgressKey(value);
      const prevP: ItemProgress = updates[key] ?? progress[key] ?? { box: 0, nextDue: today, attempts: 0, correct: 0 };
      const { box, nextDue } = advanceBox(prevP, isCorrect, today);
      updates[key] = {
        box,
        nextDue,
        attempts: prevP.attempts + 1,
        correct: prevP.correct + (isCorrect ? 1 : 0),
      };
    }
    onProgressUpdate(updates);
    setSessionResults((prev) => [...prev, {
      word: { hiragana: numberToKana(target), romaji: numberToRomaji(target), meaning: target.toLocaleString("es") },
      correct: isCorrect,
    }]);
  }

  const canSubmit = input !== "" && Number.isInteger(Number(input));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "playing" || currentTarget === null || !canSubmit) return;
    const isCorrect = Number(input) === currentTarget;
    if (isCorrect) {
      playChime();
      fireConfetti();
      setPhase("correct");
    } else {
      playBuzz();
      setPhase("wrong");
    }
    recordResult(currentTarget, isCorrect);
    speak(numberToKana(currentTarget));
  }

  if (phase === "done" || queue.length === 0) {
    return <VocabSessionSummary sessionResults={sessionResults} onBack={onBack} />;
  }

  if (currentTarget === null) return null;

  const totalRounds = queue.length;
  const progressPct = (queueIndex / totalRounds) * 100;

  const fieldStyle: React.CSSProperties = {
    borderColor: phase === "correct" ? "#15C0A0" : phase === "wrong" ? "#E85D3A" : "#F0EDF8",
    backgroundColor: phase === "correct" ? "#E3FAF3" : phase === "wrong" ? "#FFEEEA" : "#FFFFFF",
    color: phase === "correct" ? "#0A6E54" : phase === "wrong" ? "#C03A1E" : "#1A1A2E",
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>
          {queueIndex + 1} / {totalRounds}
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#F0EDF8] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${AMBER}, #F7C05B)` }}
        />
      </div>

      {/* Lectura en hiragana */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm" style={{ color: "#8B7FA8" }}>¿Qué número es?</p>
        <p
          className="text-3xl font-bold tracking-tight text-center"
          style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#1A1A2E" }}
        >
          {numberToKana(currentTarget)}
        </p>
      </div>

      <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0 transition-opacity" />

      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(sanitizeDigits(e.target.value))}
          disabled={phase !== "playing"}
          inputMode="numeric"
          placeholder="0"
          maxLength={5}
          className="w-40 h-14 text-center text-2xl font-bold rounded-xl outline-none border-2 transition-colors"
          style={fieldStyle}
        />

        {phase === "playing" && (
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-[50px] rounded-[14px] text-white font-bold disabled:opacity-40"
            style={{ background: `linear-gradient(90deg, ${AMBER}, #F7C05B)` }}
          >
            Comprobar
          </button>
        )}
      </form>

      {/* Feedback */}
      {phase !== "playing" && (
        <AnswerReveal
          status={phase}
          kana={numberToKana(currentTarget)}
          kanji={findNumberKanji(currentTarget)}
          romaji={numberToRomaji(currentTarget)}
          meaning={currentTarget.toLocaleString("es")}
          accent={{ text: AMBER_DARK, bg: "#FDF2E3" }}
          extra={
            phase === "wrong" ? (
              <p className="text-xs mt-2" style={{ opacity: 0.75 }}>
                Tu respuesta: {input || "?"}
              </p>
            ) : undefined
          }
          onContinue={advanceToNext}
        />
      )}
    </div>
  );
}
