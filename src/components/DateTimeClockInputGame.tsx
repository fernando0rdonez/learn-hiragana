import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { TimeValue, TimePeriod } from "../dateTime";
import {
  randomTimeValue,
  timeKey,
  timeToChips,
  timeToKana,
  timeToRomaji,
  formatTimeValue,
  hourProgressKey,
  minuteProgressKey,
} from "../dateTime";
import { advanceBox } from "../leitner";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
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

type GamePhase = "playing" | "correct" | "wrong" | "done";

const SLATE       = "#475569";
const SLATE_DARK  = "#334155";
const SLATE_LIGHT = "#F1F5F9";
const BORDER      = "#EEEEEE";

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

/** Deja solo dígitos y limita a 2 caracteres (HH o MM). */
function sanitizeDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 2);
}

export default function DateTimeClockInputGame({
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
  const [hourInput, setHourInput] = useState("");
  const [minuteInput, setMinuteInput] = useState("");
  const [period, setPeriod] = useState<TimePeriod | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const hourRef = useRef<HTMLInputElement>(null);
  const { speak } = useSpeech();

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
    setHourInput("");
    setMinuteInput("");
    setPeriod(null);
    setPhase("playing");
    setTimeout(() => hourRef.current?.focus(), 50);
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

  const hourNum = Number(hourInput);
  const minuteNum = Number(minuteInput);
  const hourValid = hourInput !== "" && Number.isInteger(hourNum) && hourNum >= 1 && hourNum <= 12;
  const minuteValid = minuteInput !== "" && Number.isInteger(minuteNum) && minuteNum >= 0 && minuteNum <= 59;
  const canSubmit = hourValid && minuteValid && period !== null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "playing" || !currentTime || !canSubmit) return;
    const entered: TimeValue = { hour: hourNum, minute: minuteNum, period: period! };
    const isCorrect = timeKey(entered) === timeKey(currentTime);
    if (isCorrect) {
      playChime();
      fireConfetti();
      setPhase("correct");
    } else {
      playBuzz();
      setPhase("wrong");
    }
    recordResult(currentTime, isCorrect);
    speak(timeToKana(currentTime));
  }

  if (phase === "done" || queue.length === 0) {
    return <VocabSessionSummary sessionResults={sessionResults} onBack={onBack} onViewCompetitionResult={onViewCompetitionResult} />;
  }

  if (!currentTime) return null;

  const totalTimes = queue.length;
  const progressPct = (queueIndex / totalTimes) * 100;

  const periodButtonStyle = (active: boolean): React.CSSProperties =>
    active
      ? { borderColor: SLATE, backgroundColor: SLATE_LIGHT, color: SLATE_DARK }
      : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: "#8B7FA8" };

  const fieldStyle: React.CSSProperties = {
    borderColor: phase === "correct" ? "#15C0A0" : phase === "wrong" ? "#E85D3A" : "#F1F5F9",
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
          {queueIndex + 1} / {totalTimes}
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${SLATE}, ${SLATE_DARK})` }}
        />
      </div>

      {/* Lectura en hiragana */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm" style={{ color: "#8B7FA8" }}>¿Qué hora es?</p>
        <p
          className="text-3xl font-bold tracking-tight text-center"
          style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#1A1A2E" }}
        >
          {timeToKana(currentTime)}
        </p>
      </div>

      <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0 transition-opacity" />

      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            ref={hourRef}
            value={hourInput}
            onChange={(e) => setHourInput(sanitizeDigits(e.target.value))}
            disabled={phase !== "playing"}
            inputMode="numeric"
            placeholder="HH"
            maxLength={2}
            className="w-16 h-14 text-center text-2xl font-bold rounded-xl outline-none border-2 transition-colors"
            style={fieldStyle}
          />
          <span className="text-2xl font-bold" style={{ color: "#1A1A2E" }}>:</span>
          <input
            value={minuteInput}
            onChange={(e) => setMinuteInput(sanitizeDigits(e.target.value))}
            disabled={phase !== "playing"}
            inputMode="numeric"
            placeholder="MM"
            maxLength={2}
            className="w-16 h-14 text-center text-2xl font-bold rounded-xl outline-none border-2 transition-colors"
            style={fieldStyle}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={phase !== "playing"}
            onClick={() => setPeriod("am")}
            className="px-6 py-2 rounded-xl border-2 text-sm font-semibold transition-colors"
            style={periodButtonStyle(period === "am")}
          >
            AM
          </button>
          <button
            type="button"
            disabled={phase !== "playing"}
            onClick={() => setPeriod("pm")}
            className="px-6 py-2 rounded-xl border-2 text-sm font-semibold transition-colors"
            style={periodButtonStyle(period === "pm")}
          >
            PM
          </button>
        </div>

        {phase === "playing" && (
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-[50px] rounded-[14px] text-white font-bold disabled:opacity-40"
            style={{ background: `linear-gradient(90deg, ${SLATE}, ${SLATE_DARK})` }}
          >
            Comprobar
          </button>
        )}
      </form>

      {/* Feedback */}
      {phase !== "playing" && (
        <AnswerReveal
          status={phase}
          kana={timeToKana(currentTime)}
          romaji={timeToRomaji(currentTime)}
          meaning={formatTimeValue(currentTime)}
          accent={{ text: SLATE_DARK, bg: "#F1F5F9" }}
          extra={
            phase === "wrong" ? (
              <p className="text-xs mt-2" style={{ opacity: 0.75 }}>
                Tu respuesta: {hourInput || "?"}:{minuteInput ? minuteInput.padStart(2, "0") : "??"}{" "}
                {period === "am" ? "a. m." : period === "pm" ? "p. m." : "?"}
              </p>
            ) : undefined
          }
          onContinue={advanceToNext}
        />
      )}
    </div>
  );
}
