import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { BuildLevelDef, NumberChip } from "../numbers";
import {
  numberToChips,
  numberToKana,
  numberToRomaji,
  buildChipDistractors,
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

// ── Types ──────────────────────────────────────────────────────────────────────

type GamePhase = "playing" | "correct" | "wrong" | "done";

interface TileChip extends NumberChip {
  id: number;
  used: boolean;
}

interface Round {
  target: number;
  expected: NumberChip[]; // bloques correctos en orden
  tiles: TileChip[];      // correctos + distractores, barajados
}

// ── Constants ──────────────────────────────────────────────────────────────────

const POST_ANSWER_SPEECH_DELAY = 500;
const WRONG_ANSWER_DELAY = 2200; // tiempo para leer la corrección

const AMBER      = "#F5A623";
const AMBER_DARK = "#C77F00";

// ── Helpers ────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(level: BuildLevelDef): Round {
  const target = randomNumberForLevel(level);
  const expected = numberToChips(target);
  const distractorCount = Math.min(3, Math.max(2, 5 - expected.length));
  const tiles = shuffle([...expected, ...buildChipDistractors(expected, distractorCount)])
    .map((chip, id): TileChip => ({ ...chip, id, used: false }));
  return { target, expected, tiles };
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  level: BuildLevelDef;
  progress: ProgressItems;
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function NumberBuildGame({
  level,
  progress,
  sessionLimit = 10,
  onProgressUpdate,
  onBack,
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
    const built = Array.from({ length: sessionLimit }, () => buildRound(level));
    setRounds(built);
    setRoundIndex(0);
    if (built.length > 0) initRound(built[0]);
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // El SRS se acredita a cada número clave usado por el número (no al número
  // generado, que no es un ítem estable): acierto/fallo va a los bloques.
  function recordResult(round: Round, isCorrect: boolean) {
    const updates: ProgressItems = {};
    const creditValues = new Set(round.expected.flatMap((c) => c.credits));
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
      word: {
        hiragana: numberToKana(round.target),
        romaji: numberToRomaji(round.target),
        meaning: round.target.toLocaleString("es"),
      },
      correct: isCorrect,
    }]);
  }

  const speakAndWait = useCallback(
    (text: string) => speak(text).then(() => new Promise<void>((resolve) => setTimeout(resolve, POST_ANSWER_SPEECH_DELAY))),
    [speak]
  );

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
        speakAndWait(numberToKana(round.target)).then(() => advanceToNext());
      } else {
        playBuzz();
        setPhase("wrong");
        speak(numberToKana(round.target));
        new Promise<void>((resolve) => setTimeout(resolve, WRONG_ANSWER_DELAY)).then(() => advanceToNext());
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roundIndex, rounds, progress]
  );

  function handleTileTap(tile: TileChip) {
    if (phase !== "playing" || tile.used || !currentRound) return;
    const nextPlaced = [...placed, tile];
    setPlaced(nextPlaced);
    setTiles((prev) => prev.map((t) => (t.id === tile.id ? { ...t, used: true } : t)));
    // Se comprueba en cuanto hay tantos bloques como pide el número
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

  // ── Done screen ──────────────────────────────────────────────────────────────

  if (phase === "done" || rounds.length === 0) {
    return <VocabSessionSummary sessionResults={sessionResults} onBack={onBack} />;
  }

  if (!currentRound) return null;

  const totalRounds = rounds.length;
  const progressPct = (roundIndex / totalRounds) * 100;
  const slotCount = currentRound.expected.length;

  // ── Game screen ──────────────────────────────────────────────────────────────

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
      <div className="w-full h-1.5 bg-[#F0EDF8] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${AMBER}, #F7C05B)` }}
        />
      </div>

      {/* Número objetivo */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm" style={{ color: "#8B7FA8" }}>Forma el número en hiragana</p>
        <p
          className="text-6xl font-bold tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1A1A2E" }}
        >
          {currentRound.target.toLocaleString("es")}
        </p>
      </div>

      {/* Huecos — flex-wrap: un número de 4-5 cifras no cabe en una fila */}
      <div className="w-full flex flex-wrap gap-2 justify-center min-h-14">
        {Array.from({ length: slotCount }, (_, i) => {
          const tile = placed[i] ?? null;
          let cls = "border-[#D8D2E8] bg-white text-[#D8D2E8]";
          if (tile) {
            cls =
              phase === "correct" ? "border-[#15C0A0] bg-[#E3FAF3] text-[#0A6E54]" :
              phase === "wrong" ? "border-[#E85D3A] bg-[#FFEEEA] text-[#C03A1E]" :
              "border-[#F5A623] bg-[#FFF4E5] text-[#C77F00]";
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
          kana={numberToKana(currentRound.target)}
          kanji={findNumberKanji(currentRound.target)}
          romaji={numberToRomaji(currentRound.target)}
          meaning={currentRound.target.toLocaleString("es")}
          accent={{ text: AMBER_DARK, bg: "#FDF2E3" }}
        />
      )}
    </div>
  );
}
