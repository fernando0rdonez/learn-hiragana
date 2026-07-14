import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { TimeValue } from "../dateTime";
import {
  randomTimeValue,
  buildTimeOptions,
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

const SLATE      = "#475569";
const SLATE_DARK = "#334155";

function timeKey(t: TimeValue): string {
  return `${t.period}-${t.hour}-${t.minute}`;
}

interface Round {
  correct: TimeValue;
  options: TimeValue[];
}

function buildRound(): Round {
  const correct = randomTimeValue();
  return { correct, options: buildTimeOptions(correct) };
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

export default function DateTimeRecognizeGame({
  progress,
  sessionLimit = 10,
  onProgressUpdate,
  onBack,
  items,
  onComplete,
  onViewCompetitionResult,
}: Props) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [selected, setSelected] = useState<TimeValue | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const { speak } = useSpeech();

  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" ? foxSadImg :
    foxNeutralImg;

  useEffect(() => {
    const built = items && items.length > 0
      ? items.map((t): Round => ({ correct: t, options: buildTimeOptions(t) }))
      : Array.from({ length: sessionLimit }, buildRound);
    setRounds(built);
    setRoundIndex(0);
    if (built.length > 0) initRound();
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === "done") onComplete?.(sessionResults);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function initRound() {
    setSelected(null);
    setPhase("playing");
  }

  const currentRound = rounds[roundIndex] ?? null;

  function advanceToNext() {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= rounds.length) {
      setPhase("done");
      return;
    }
    setRoundIndex(nextIndex);
    initRound();
  }

  function recordResult(round: Round, isCorrect: boolean) {
    const updates: ProgressItems = {};
    const chips = timeToChips(round.correct.hour, round.correct.minute, round.correct.period);
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
      word: { hiragana: timeToKana(round.correct), romaji: timeToRomaji(round.correct), meaning: formatTimeValue(round.correct) },
      correct: isCorrect,
    }]);
  }

  function handleAnswer(option: TimeValue) {
    if (phase !== "playing" || !currentRound) return;
    setSelected(option);
    const isCorrect = timeKey(option) === timeKey(currentRound.correct);
    if (isCorrect) {
      playChime();
      fireConfetti();
      setPhase("correct");
    } else {
      playBuzz();
      setPhase("wrong");
    }
    recordResult(currentRound, isCorrect);
    speak(timeToKana(currentRound.correct));
  }

  function handleContinue() {
    advanceToNext();
  }

  if (phase === "done" || rounds.length === 0) {
    return <VocabSessionSummary sessionResults={sessionResults} onBack={onBack} onViewCompetitionResult={onViewCompetitionResult} />;
  }

  if (!currentRound) return null;

  const totalRounds = rounds.length;
  const progressPct = (roundIndex / totalRounds) * 100;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>
          {roundIndex + 1} / {totalRounds}
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
          {timeToKana(currentRound.correct)}
        </p>
      </div>

      <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0 transition-opacity" />

      {/* 4 opciones de hora */}
      <div className="w-full grid grid-cols-2 gap-2.5">
        {currentRound.options.map((opt) => {
          const isCorrectOpt = timeKey(opt) === timeKey(currentRound.correct);
          const isSelectedOpt = selected !== null && timeKey(opt) === timeKey(selected);
          let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF", color: "#1A1A2E" };
          if (phase !== "playing") {
            if (isCorrectOpt) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1", color: "#0A6E54" };
            else if (isSelectedOpt) style = { borderColor: SLATE_DARK, backgroundColor: "#F1F5F9", color: SLATE_DARK };
          }
          return (
            <button
              key={timeKey(opt)}
              disabled={phase !== "playing"}
              onClick={() => handleAnswer(opt)}
              className="w-full py-4 rounded-2xl border-2 text-lg font-semibold text-center transition-colors disabled:opacity-100"
              style={style}
            >
              {formatTimeValue(opt)}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {phase !== "playing" && (
        <AnswerReveal
          status={phase}
          kana={timeToKana(currentRound.correct)}
          romaji={timeToRomaji(currentRound.correct)}
          meaning={formatTimeValue(currentRound.correct)}
          accent={{ text: SLATE_DARK, bg: "#F1F5F9" }}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
