import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { TimeValue } from "../dateTime";
import {
  randomTimeValue,
  timeToChips,
  timeToKana,
  timeToRomaji,
  formatTimeValue,
  hourProgressKey,
  minuteProgressKey,
} from "../dateTime";
import { advanceBox } from "../leitner";
import { playChime, playBuzz } from "../utils/audio";
import { fireConfetti } from "../components/ConfettiOverlay";
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

// Ignora espacios y puntuación al comparar la lectura tecleada.
function normalizeReading(s: string): string {
  return s.normalize("NFKC").replace(/[\s。、！？!?,.．，]/g, "");
}

type GamePhase = "playing" | "correct" | "wrong" | "done";

const SLATE      = "#475569";
const SLATE_DARK = "#334155";

/** Colorea cada kana de la lectura correcta según si lo tecleado coincide en esa posición. */
function ReadingDiff({ expected, given }: { expected: string; given: string }) {
  const exp = Array.from(expected);
  const giv = Array.from(normalizeReading(given));
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
  progress: ProgressItems;
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
  /** Reto en curso — pool fijo de horas en vez de generar al azar. */
  items?: TimeValue[];
  onComplete?: (results: SessionResult[]) => void;
  onViewCompetitionResult?: () => void;
}

export default function DateTimeWriteGame({
  progress,
  sessionLimit = 10,
  onProgressUpdate,
  onBack,
  items,
  onComplete,
  onViewCompetitionResult,
}: Props) {
  const [queue, setQueue] = useState<TimeValue[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [input, setInput] = useState("");
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" ? foxSadImg :
    foxNeutralImg;

  useEffect(() => {
    const built = items && items.length > 0 ? items : Array.from({ length: sessionLimit }, randomTimeValue);
    setQueue(built);
    setQueueIndex(0);
    if (built.length > 0) initRound();
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === "done") onComplete?.(sessionResults);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function initRound() {
    setInput("");
    setPhase("playing");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const currentTime = queue[queueIndex] ?? null;

  function advanceToNext() {
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      setPhase("done");
      return;
    }
    setQueueIndex(nextIndex);
    initRound();
  }

  function recordResult(t: TimeValue, isCorrect: boolean) {
    const updates: ProgressItems = {};
    const chips = timeToChips(t.hour, t.minute, t.period);
    for (const chip of chips) {
      for (const value of chip.credits) {
        const key = chip.kind === "hour" ? hourProgressKey(value) : minuteProgressKey(value);
        const prevP: ItemProgress = updates[key] ?? progress[key] ?? { box: 0, nextDue: today, attempts: 0, correct: 0 };
        const { box, nextDue } = advanceBox(prevP, isCorrect, today);
        updates[key] = {
          box,
          nextDue,
          attempts: prevP.attempts + 1,
          correct: prevP.correct + (isCorrect ? 1 : 0),
        };
      }
    }
    onProgressUpdate(updates);
    setSessionResults((prev) => [...prev, {
      word: { hiragana: timeToKana(t), romaji: timeToRomaji(t), meaning: formatTimeValue(t) },
      correct: isCorrect,
    }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "playing" || !currentTime || input.trim() === "") return;
    const isCorrect = normalizeReading(input) === normalizeReading(timeToKana(currentTime));
    if (isCorrect) {
      playChime();
      fireConfetti();
      setPhase("correct");
    } else {
      playBuzz();
      setPhase("wrong");
    }
    recordResult(currentTime, isCorrect);
  }

  if (phase === "done" || queue.length === 0) {
    return <VocabSessionSummary sessionResults={sessionResults} onBack={onBack} onViewCompetitionResult={onViewCompetitionResult} />;
  }

  if (!currentTime) return null;

  const totalTimes = queue.length;
  const progressPct = (queueIndex / totalTimes) * 100;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>
          {queueIndex + 1} / {totalTimes}
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${SLATE}, ${SLATE_DARK})` }}
        />
      </div>

      {/* Prompt visual — sin audio */}
      <div className="flex flex-col items-center gap-1 mt-2">
        <p className="text-sm" style={{ color: "#8B7FA8" }}>Escribe la hora en hiragana</p>
        <p
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1A1A2E" }}
        >
          {formatTimeValue(currentTime)}
        </p>
      </div>

      <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0 transition-opacity" />

      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={phase !== "playing"}
          placeholder="escribe la lectura en hiragana"
          autoComplete="off"
          autoCapitalize="off"
          className="w-full h-[52px] text-center text-lg rounded-[14px] outline-none border-2 transition-colors"
          style={{
            fontFamily: "'Noto Sans JP', sans-serif",
            borderColor: phase === "correct" ? "#15C0A0" : phase === "wrong" ? "#E85D3A" : "#F1F5F9",
            backgroundColor: phase === "correct" ? "#E3FAF3" : phase === "wrong" ? "#FFEEEA" : "#FFFFFF",
            color: phase === "correct" ? "#0A6E54" : phase === "wrong" ? "#C03A1E" : "#1A1A2E",
          }}
        />
        {phase === "playing" && (
          <button
            type="submit"
            disabled={input.trim() === ""}
            className="w-full h-[50px] rounded-[14px] text-white font-bold disabled:opacity-40"
            style={{ background: `linear-gradient(90deg, ${SLATE}, ${SLATE_DARK})` }}
          >
            Comprobar
          </button>
        )}
      </form>

      {/* Feedback: revela la lectura + diff kana por kana de lo tecleado */}
      {phase !== "playing" && (
        <AnswerReveal
          status={phase}
          kana={timeToKana(currentTime)}
          romaji={timeToRomaji(currentTime)}
          meaning={formatTimeValue(currentTime)}
          accent={{ text: SLATE_DARK, bg: "#F1F5F9" }}
          extra={
            phase === "wrong" ? (
              <div className="mt-3">
                <p className="text-xs mb-1" style={{ opacity: 0.75 }}>Tu respuesta:</p>
                <ReadingDiff expected={timeToKana(currentTime)} given={input} />
              </div>
            ) : undefined
          }
          onContinue={advanceToNext}
        />
      )}
    </div>
  );
}
