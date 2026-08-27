import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { TimeValue, TimePeriod, DateValue, ContentType, DateBuildLevel, Entry } from "../dateTime";
import {
  randomEntry,
  entryKey,
  entryToChips,
  entryToKana,
  entryToRomaji,
  formatEntry,
  progressKeyForChip,
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

const PROMPT_LABEL: Record<ContentType, string> = {
  hora: "¿Qué hora es?",
  fecha: "¿Qué fecha es?",
  fechaHora: "¿Qué fecha y hora es?",
};

const WEEKDAY_BUTTON_LABELS = ["L", "M", "X", "J", "V", "S", "D"]; // valor 1–7 (lun–dom)

/** Qué campos pide cada combinación de tipo de contenido + nivel de fecha. */
interface RequiredFields {
  weekday: boolean;
  month: boolean;
  day: boolean;
  year: boolean;
  time: boolean;
}

function fieldsFor(contentType: ContentType, dateLevel: DateBuildLevel): RequiredFields {
  if (contentType === "hora") {
    return { weekday: false, month: false, day: false, year: false, time: true };
  }
  if (contentType === "fechaHora") {
    return { weekday: false, month: true, day: true, year: true, time: true };
  }
  return {
    weekday: dateLevel === "weekday",
    month: dateLevel === "month" || dateLevel === "full",
    day: dateLevel === "day" || dateLevel === "full",
    year: dateLevel === "year" || dateLevel === "full",
    time: false,
  };
}

interface Props {
  progress: ProgressItems;
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
  contentType?: ContentType;
  dateLevel?: DateBuildLevel;
  /** Reto en curso — pool fijo de horas en vez de generar al azar (solo modo Hora). */
  items?: TimeValue[];
  onComplete?: (results: SessionResult[]) => void;
  onViewCompetitionResult?: () => void;
}

/** Deja solo dígitos y limita a `maxLen` caracteres. */
function sanitizeDigits(raw: string, maxLen = 2): string {
  return raw.replace(/\D/g, "").slice(0, maxLen);
}

export default function DateTimeClockInputGame({
  progress,
  sessionLimit = 10,
  onProgressUpdate,
  onBack,
  contentType = "hora",
  dateLevel = "full",
  items,
  onComplete,
  onViewCompetitionResult,
}: Props) {
  const [queue, setQueue] = useState<Entry[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [hourInput, setHourInput] = useState("");
  const [minuteInput, setMinuteInput] = useState("");
  const [period, setPeriod] = useState<TimePeriod | null>(null);
  const [dayInput, setDayInput] = useState("");
  const [monthInput, setMonthInput] = useState("");
  const [yearInput, setYearInput] = useState("");
  const [weekday, setWeekday] = useState<number | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const { speak } = useSpeech();

  const fields = fieldsFor(contentType, dateLevel);
  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" ? foxSadImg :
    foxNeutralImg;

  useEffect(() => {
    const built = items && items.length > 0 ? items : Array.from({ length: sessionLimit }, () => randomEntry(contentType, dateLevel));
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
    setDayInput("");
    setMonthInput("");
    setYearInput("");
    setWeekday(null);
    setPhase("playing");
    setTimeout(() => firstFieldRef.current?.focus(), 50);
  }

  const currentEntry = queue[queueIndex] ?? null;

  function advanceToNext() {
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      setPhase("done");
      return;
    }
    setQueueIndex(nextIndex);
    initRound();
  }

  function recordResult(t: Entry, isCorrect: boolean) {
    const updates: ProgressItems = {};
    const chips = entryToChips(contentType, t);
    for (const chip of chips) {
      for (const value of chip.credits) {
        const key = progressKeyForChip(chip, value);
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
      word: { hiragana: entryToKana(contentType, t), romaji: entryToRomaji(contentType, t), meaning: formatEntry(contentType, t) },
      correct: isCorrect,
    }]);
  }

  const hourNum = Number(hourInput);
  const minuteNum = Number(minuteInput);
  const dayNum = Number(dayInput);
  const monthNum = Number(monthInput);
  const yearNum = Number(yearInput);

  const hourValid = !fields.time || (hourInput !== "" && Number.isInteger(hourNum) && hourNum >= 1 && hourNum <= 12);
  const minuteValid = !fields.time || (minuteInput !== "" && Number.isInteger(minuteNum) && minuteNum >= 0 && minuteNum <= 59);
  const periodValid = !fields.time || period !== null;
  const dayValid = !fields.day || (dayInput !== "" && Number.isInteger(dayNum) && dayNum >= 1 && dayNum <= 31);
  const monthValid = !fields.month || (monthInput !== "" && Number.isInteger(monthNum) && monthNum >= 1 && monthNum <= 12);
  const yearValid = !fields.year || (yearInput !== "" && Number.isInteger(yearNum) && yearNum >= 1000 && yearNum <= 9999);
  const weekdayValid = !fields.weekday || weekday !== null;
  const canSubmit = hourValid && minuteValid && periodValid && dayValid && monthValid && yearValid && weekdayValid;

  function buildEnteredEntry(): Entry {
    if (contentType === "hora") return { hour: hourNum, minute: minuteNum, period: period! };
    const date: DateValue = {};
    if (fields.weekday) date.weekday = weekday!;
    if (fields.month) date.month = monthNum;
    if (fields.day) date.day = dayNum;
    if (fields.year) date.year = yearNum;
    if (contentType === "fecha") return date;
    return { date, time: { hour: hourNum, minute: minuteNum, period: period! } };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "playing" || !currentEntry || !canSubmit) return;
    const entered = buildEnteredEntry();
    const isCorrect = entryKey(contentType, entered) === entryKey(contentType, currentEntry);
    if (isCorrect) {
      playChime();
      fireConfetti();
      setPhase("correct");
    } else {
      playBuzz();
      setPhase("wrong");
    }
    recordResult(currentEntry, isCorrect);
    speak(entryToKana(contentType, currentEntry));
  }

  if (phase === "done" || queue.length === 0) {
    return <VocabSessionSummary sessionResults={sessionResults} onBack={onBack} onViewCompetitionResult={onViewCompetitionResult} />;
  }

  if (!currentEntry) return null;

  const totalEntries = queue.length;
  const progressPct = (queueIndex / totalEntries) * 100;

  const periodButtonStyle = (active: boolean): React.CSSProperties =>
    active
      ? { borderColor: SLATE, backgroundColor: SLATE_LIGHT, color: SLATE_DARK }
      : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: "#8B7FA8" };

  const fieldStyle: React.CSSProperties = {
    borderColor: phase === "correct" ? "#15C0A0" : phase === "wrong" ? "#E85D3A" : "#F1F5F9",
    backgroundColor: phase === "correct" ? "#E3FAF3" : phase === "wrong" ? "#FFEEEA" : "#FFFFFF",
    color: phase === "correct" ? "#0A6E54" : phase === "wrong" ? "#C03A1E" : "#1A1A2E",
  };

  const dateFieldOrder = [fields.day, fields.month, fields.year].filter(Boolean).length;
  const isFirstDateField = (which: "day" | "month" | "year") =>
    which === "day" ? fields.day :
    which === "month" ? (!fields.day && fields.month) :
    (!fields.day && !fields.month && fields.year);

  function describeEntered(): string {
    if (contentType === "hora" || contentType === "fechaHora") {
      const h = hourInput || "?";
      const m = minuteInput ? minuteInput.padStart(2, "0") : "??";
      const p = period === "am" ? "a. m." : period === "pm" ? "p. m." : "?";
      const time = `${h}:${m} ${p}`;
      if (contentType === "hora") return time;
      return `${dayInput || "?"}/${monthInput || "?"}/${yearInput || "?"} ${time}`;
    }
    if (fields.weekday) return WEEKDAY_BUTTON_LABELS[(weekday ?? 1) - 1] ?? "?";
    if (dateFieldOrder > 1) return `${dayInput || "?"}/${monthInput || "?"}/${yearInput || "?"}`;
    if (fields.month) return monthInput || "?";
    if (fields.day) return dayInput || "?";
    return yearInput || "?";
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>
          {queueIndex + 1} / {totalEntries}
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
        <p className="text-sm" style={{ color: "#8B7FA8" }}>{PROMPT_LABEL[contentType]}</p>
        <p
          className="text-3xl font-bold tracking-tight text-center"
          style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#1A1A2E" }}
        >
          {entryToKana(contentType, currentEntry)}
        </p>
      </div>

      <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0 transition-opacity" />

      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
        {fields.weekday && (
          <div className="flex gap-1.5">
            {WEEKDAY_BUTTON_LABELS.map((label, i) => {
              const value = i + 1;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={phase !== "playing"}
                  onClick={() => setWeekday(value)}
                  className="w-10 h-10 rounded-xl border-2 text-sm font-semibold transition-colors"
                  style={periodButtonStyle(weekday === value)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {(fields.day || fields.month || fields.year) && (
          <div className="flex items-center gap-2">
            {fields.day && (
              <input
                ref={isFirstDateField("day") ? firstFieldRef : undefined}
                value={dayInput}
                onChange={(e) => setDayInput(sanitizeDigits(e.target.value, 2))}
                disabled={phase !== "playing"}
                inputMode="numeric"
                placeholder="DD"
                maxLength={2}
                className="w-16 h-14 text-center text-2xl font-bold rounded-xl outline-none border-2 transition-colors"
                style={fieldStyle}
              />
            )}
            {fields.day && (fields.month || fields.year) && <span className="text-2xl font-bold" style={{ color: "#1A1A2E" }}>/</span>}
            {fields.month && (
              <input
                ref={isFirstDateField("month") ? firstFieldRef : undefined}
                value={monthInput}
                onChange={(e) => setMonthInput(sanitizeDigits(e.target.value, 2))}
                disabled={phase !== "playing"}
                inputMode="numeric"
                placeholder="MM"
                maxLength={2}
                className="w-16 h-14 text-center text-2xl font-bold rounded-xl outline-none border-2 transition-colors"
                style={fieldStyle}
              />
            )}
            {fields.month && fields.year && <span className="text-2xl font-bold" style={{ color: "#1A1A2E" }}>/</span>}
            {fields.year && (
              <input
                ref={isFirstDateField("year") ? firstFieldRef : undefined}
                value={yearInput}
                onChange={(e) => setYearInput(sanitizeDigits(e.target.value, 4))}
                disabled={phase !== "playing"}
                inputMode="numeric"
                placeholder="AAAA"
                maxLength={4}
                className="w-20 h-14 text-center text-2xl font-bold rounded-xl outline-none border-2 transition-colors"
                style={fieldStyle}
              />
            )}
          </div>
        )}

        {fields.time && (
          <>
            <div className="flex items-center gap-2">
              <input
                ref={!fields.day && !fields.month && !fields.year ? firstFieldRef : undefined}
                value={hourInput}
                onChange={(e) => setHourInput(sanitizeDigits(e.target.value, 2))}
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
                onChange={(e) => setMinuteInput(sanitizeDigits(e.target.value, 2))}
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
          </>
        )}

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
          kana={entryToKana(contentType, currentEntry)}
          romaji={entryToRomaji(contentType, currentEntry)}
          meaning={formatEntry(contentType, currentEntry)}
          accent={{ text: SLATE_DARK, bg: "#F1F5F9" }}
          extra={
            phase === "wrong" ? (
              <p className="text-xs mt-2" style={{ opacity: 0.75 }}>
                Tu respuesta: {describeEntered()}
              </p>
            ) : undefined
          }
          onContinue={advanceToNext}
        />
      )}
    </div>
  );
}
