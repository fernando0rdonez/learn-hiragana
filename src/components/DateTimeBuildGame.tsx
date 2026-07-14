import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { TimeBuildLevel, TimeChip, RandomTime } from "../dateTime";
import {
  timeToChips,
  timeToKana,
  timeToRomaji,
  formatTimeValue,
  buildTimeChipDistractors,
  randomTimeForLevel,
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

interface TileChip extends TimeChip {
  id: number;
  used: boolean;
}

interface Round {
  target: RandomTime;
  expected: TimeChip[];
  tiles: TileChip[];
}

const SLATE      = "#475569";
const SLATE_DARK = "#334155";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function roundFromTarget(target: RandomTime): Round {
  const expected = timeToChips(target.hour, target.minute, target.period, target.useHan);
  const distractorCount = Math.min(3, Math.max(2, 5 - expected.length));
  const tiles = shuffle([...expected, ...buildTimeChipDistractors(expected, distractorCount)])
    .map((chip, id): TileChip => ({ ...chip, id, used: false }));
  return { target, expected, tiles };
}

function buildRound(level: TimeBuildLevel): Round {
  return roundFromTarget(randomTimeForLevel(level));
}

interface Props {
  level: TimeBuildLevel;
  progress: ProgressItems;
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
  /** Reto en curso — pool fijo de horas en vez de generar al azar. */
  items?: RandomTime[];
  onComplete?: (results: SessionResult[]) => void;
  onViewCompetitionResult?: () => void;
}

export default function DateTimeBuildGame({
  level,
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
  const [tiles, setTiles] = useState<TileChip[]>([]);
  const [placed, setPlaced] = useState<TileChip[]>([]);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const { speak } = useSpeech();

  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" ? foxSadImg :
    foxNeutralImg;

  useEffect(() => {
    const built = items && items.length > 0
      ? items.map(roundFromTarget)
      : Array.from({ length: sessionLimit }, () => buildRound(level));
    setRounds(built);
    setRoundIndex(0);
    if (built.length > 0) initRound(built[0]);
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === "done") onComplete?.(sessionResults);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function initRound(round: Round) {
    setTiles(round.tiles.map((t) => ({ ...t, used: false })));
    setPlaced([]);
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
    initRound(rounds[nextIndex]);
  }

  function recordResult(round: Round, isCorrect: boolean) {
    const updates: ProgressItems = {};
    for (const chip of round.expected) {
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
      word: {
        hiragana: timeToKana(round.target, round.target.useHan),
        romaji: timeToRomaji(round.target, round.target.useHan),
        meaning: formatTimeValue(round.target),
      },
      correct: isCorrect,
    }]);
  }

  const checkAnswer = useCallback(
    (round: Round, sequence: TileChip[]) => {
      const isCorrect =
        sequence.length === round.expected.length &&
        sequence.every((tile, i) => tile.kana === round.expected[i].kana);
      recordResult(round, isCorrect);
      if (isCorrect) {
        playChime();
        fireConfetti();
        setPhase("correct");
      } else {
        playBuzz();
        setPhase("wrong");
      }
      speak(timeToKana(round.target, round.target.useHan));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roundIndex, rounds, progress]
  );

  function handleContinue() {
    advanceToNext();
  }

  function handleTileTap(tile: TileChip) {
    if (phase !== "playing" || tile.used || !currentRound) return;
    const nextPlaced = [...placed, tile];
    setPlaced(nextPlaced);
    setTiles((prev) => prev.map((t) => (t.id === tile.id ? { ...t, used: true } : t)));
    if (nextPlaced.length === currentRound.expected.length) {
      checkAnswer(currentRound, nextPlaced);
    }
  }

  function handlePlacedTap(index: number) {
    if (phase !== "playing") return;
    const tile = placed[index];
    setPlaced((prev) => prev.filter((_, i) => i !== index));
    setTiles((prev) => prev.map((t) => (t.id === tile.id ? { ...t, used: false } : t)));
  }

  if (phase === "done" || rounds.length === 0) {
    return <VocabSessionSummary sessionResults={sessionResults} onBack={onBack} onViewCompetitionResult={onViewCompetitionResult} />;
  }

  if (!currentRound) return null;

  const totalRounds = rounds.length;
  const progressPct = (roundIndex / totalRounds) * 100;
  const slotCount = currentRound.expected.length;

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

      {/* Hora objetivo */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm" style={{ color: "#8B7FA8" }}>Forma la hora en hiragana</p>
        <p
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1A1A2E" }}
        >
          {formatTimeValue(currentRound.target)}
        </p>
      </div>

      {/* Huecos */}
      <div className="w-full flex flex-wrap gap-2 justify-center min-h-14">
        {Array.from({ length: slotCount }, (_, i) => {
          const tile = placed[i] ?? null;
          let cls = "border-[#D8D2E8] bg-white text-[#D8D2E8]";
          if (tile) {
            cls =
              phase === "correct" ? "border-[#15C0A0] bg-[#E3FAF3] text-[#0A6E54]" :
              phase === "wrong" ? "border-[#E85D3A] bg-[#FFEEEA] text-[#C03A1E]" :
              "border-[#475569] bg-[#F1F5F9] text-[#334155]";
          }
          return (
            <button
              key={i}
              onClick={() => tile !== null && handlePlacedTap(i)}
              className={`min-w-14 px-3 h-12 rounded-xl border-2 text-lg font-medium flex items-center justify-center transition-all ${cls} ${tile === null ? "cursor-default" : ""}`}
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {tile?.kana ?? ""}
            </button>
          );
        })}
      </div>

      <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0 transition-opacity" />

      {/* Fichas-bloque */}
      <div className="w-full flex flex-wrap gap-2 justify-center">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            disabled={tile.used || phase !== "playing"}
            onClick={() => handleTileTap(tile)}
            className="px-4 py-3 rounded-xl border-2 text-lg font-semibold transition-colors disabled:opacity-30"
            style={{
              fontFamily: "'Noto Sans JP', sans-serif",
              borderColor: "#EEEEEE",
              backgroundColor: "#FFFFFF",
              color: "#1A1A2E",
            }}
          >
            {tile.kana}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {phase !== "playing" && (
        <AnswerReveal
          status={phase}
          kana={timeToKana(currentRound.target, currentRound.target.useHan)}
          romaji={timeToRomaji(currentRound.target, currentRound.target.useHan)}
          meaning={formatTimeValue(currentRound.target)}
          accent={{ text: SLATE_DARK, bg: "#F1F5F9" }}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
