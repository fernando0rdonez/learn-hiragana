import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RotateCcw, Lightbulb } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { VocabWord } from "../vocabulary";
import { INTERVALS, isDue } from "../leitner";
import { getDistractors } from "../utils/distractors";
import { playChime, playBuzz } from "../utils/audio";
import VocabImage from "./VocabImage";
import KanaChip from "./KanaChip";
import WordSlots from "./WordSlots";

function toISODate(d: Date = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

// ── Types ──────────────────────────────────────────────────────────────────────

type GamePhase = "playing" | "correct" | "wrong" | "reveal" | "done";

interface Chip {
  id: number;
  kana: string;
  used: boolean;
}

interface SessionResult {
  word: VocabWord;
  correct: boolean;
  hintUsed: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildChips(word: VocabWord): Chip[] {
  const syllables = [...word.hiragana];
  const kanas = [...syllables, ...getDistractors(word.hiragana, 4)];
  return shuffle(kanas.map((kana, id) => ({ id, kana, used: false })));
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  vocabulary: VocabWord[];
  progress: ProgressItems;
  showRomaji: boolean;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function VocabularyGame({
  vocabulary,
  progress,
  showRomaji,
  onProgressUpdate,
  onBack,
}: Props) {
  const [queue, setQueue] = useState<VocabWord[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [chips, setChips] = useState<Chip[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [slotChipIds, setSlotChipIds] = useState<(number | null)[]>([]);
  const [failCount, setFailCount] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [animClass, setAnimClass] = useState("");
  const [hintUsed, setHintUsed] = useState(false);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);

  const today = toISODate();

  // Build session queue on mount: due/new words first, then not-yet-due — always include all
  useEffect(() => {
    const due: VocabWord[] = [];
    const notDue: VocabWord[] = [];
    for (const w of vocabulary) {
      const p = progress[`word:${w.hiragana}`];
      if (!p || p.attempts === 0 || isDue(p.nextDue, today)) {
        due.push(w);
      } else {
        notDue.push(w);
      }
    }
    const wordQueue = [...shuffle(due), ...shuffle(notDue)].slice(0, 50);
    setQueue(wordQueue);
    setQueueIndex(0);
    if (wordQueue.length > 0) initWord(wordQueue[0]);
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initWord(word: VocabWord) {
    const wordLen = [...word.hiragana].length;
    setChips(buildChips(word));
    setSlots(Array(wordLen).fill(null));
    setSlotChipIds(Array(wordLen).fill(null));
    setFailCount(0);
    setHintUsed(false);
    setPhase("playing");
    setAnimClass("");
  }

  function recordResult(word: VocabWord, isCorrect: boolean, usedHint: boolean) {
    const key = `word:${word.hiragana}`;
    const prevP: ItemProgress = progress[key] ?? {
      box: 0,
      nextDue: today,
      attempts: 0,
      correct: 0,
    };

    let newBox = prevP.box;
    let newNextDue = prevP.nextDue;
    if (isCorrect && !usedHint) {
      newBox = Math.min(prevP.box + 1, INTERVALS.length - 1);
      newNextDue = addDays(today, INTERVALS[newBox]);
    } else if (!isCorrect) {
      newBox = Math.max(prevP.box - 1, 0);
      newNextDue = today;
    }
    // isCorrect && usedHint → neutral: box/nextDue stay the same

    const newP: ItemProgress = {
      box: newBox,
      nextDue: newNextDue,
      attempts: prevP.attempts + 1,
      correct: prevP.correct + (isCorrect ? 1 : 0),
    };
    onProgressUpdate({ [key]: newP });
    setSessionResults((prev) => [...prev, { word, correct: isCorrect, hintUsed: usedHint }]);
  }

  const currentWord = queue[queueIndex] ?? null;

  function advanceToNext() {
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      setPhase("done");
      return;
    }
    setQueueIndex(nextIndex);
    initWord(queue[nextIndex]);
  }

  function triggerAnim(cls: string, duration: number) {
    setAnimClass(cls);
    setTimeout(() => setAnimClass(""), duration);
  }

  const checkAnswer = useCallback(
    (filledSlots: (string | null)[], word: VocabWord, currentFail: number, usedHint: boolean) => {
      const answer = filledSlots.join("");
      const isCorrect = answer === word.hiragana;

      if (isCorrect) {
        playChime();
        triggerAnim("correct-flash", 600);
        setPhase("correct");
        recordResult(word, true, usedHint);
        setTimeout(() => advanceToNext(), 1500);
      } else {
        playBuzz();
        const newFail = currentFail + 1;
        setFailCount(newFail);
        if (newFail >= 2) {
          triggerAnim("error-shake", 500);
          setPhase("reveal");
          recordResult(word, false, usedHint);
          setTimeout(() => advanceToNext(), 2500);
        } else {
          triggerAnim("error-shake", 500);
          setPhase("wrong");
          // Reset chips back to pool after shake
          setTimeout(() => {
            const wordLen = [...word.hiragana].length;
            setChips(buildChips(word));
            setSlots(Array(wordLen).fill(null));
            setSlotChipIds(Array(wordLen).fill(null));
            setPhase("playing");
          }, 800);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queueIndex, queue]
  );

  function handleChipTap(chipId: number) {
    if (phase !== "playing" || !currentWord) return;

    const emptyIdx = slots.findIndex((s) => s === null);
    if (emptyIdx === -1) return;

    const chip = chips.find((c) => c.id === chipId);
    if (!chip || chip.used) return;

    const newSlots = [...slots];
    const newSlotChipIds = [...slotChipIds];
    const newChips = chips.map((c) => (c.id === chipId ? { ...c, used: true } : c));

    newSlots[emptyIdx] = chip.kana;
    newSlotChipIds[emptyIdx] = chipId;

    setSlots(newSlots);
    setSlotChipIds(newSlotChipIds);
    setChips(newChips);

    if (newSlots.every((s) => s !== null)) {
      checkAnswer(newSlots, currentWord, failCount, hintUsed);
    }
  }

  function handleSlotTap(index: number) {
    if (phase !== "playing") return;

    const newSlots = [...slots];
    const newSlotChipIds = [...slotChipIds];
    const newChips = [...chips];

    // Undo from this index rightward
    for (let i = index; i < newSlots.length; i++) {
      const chipId = newSlotChipIds[i];
      if (chipId !== null) {
        const chipIdx = newChips.findIndex((c) => c.id === chipId);
        if (chipIdx !== -1) newChips[chipIdx] = { ...newChips[chipIdx], used: false };
      }
      newSlots[i] = null;
      newSlotChipIds[i] = null;
    }

    setSlots(newSlots);
    setSlotChipIds(newSlotChipIds);
    setChips(newChips);
  }

  function handleClear() {
    if (!currentWord || phase !== "playing") return;
    const wordLen = [...currentWord.hiragana].length;
    setChips(buildChips(currentWord));
    setSlots(Array(wordLen).fill(null));
    setSlotChipIds(Array(wordLen).fill(null));
  }

  // ── Done screen ──────────────────────────────────────────────────────────────

  if (phase === "done" || queue.length === 0) {
    const missed = sessionResults.filter((r) => !r.correct);
    return (
      <div className="flex flex-col items-center gap-6 pt-8">
        <div className="text-5xl">🎉</div>
        <h2
          className="text-2xl font-bold text-stone-800"
          style={{ fontFamily: "'Shippori Mincho', serif" }}
        >
          Sesión completa
        </h2>
        <p className="text-stone-500 text-sm">
          {queue.length === 0
            ? "No hay palabras disponibles."
            : `Completaste ${queue.length} palabra${queue.length === 1 ? "" : "s"} de esta sesión.`}
        </p>
        {missed.length > 0 && (
          <div className="w-full max-w-xs">
            <p className="text-xs font-medium text-stone-600 mb-2">Palabras falladas:</p>
            <ul className="space-y-1">
              {missed.map((r, i) => (
                <li key={i} className="flex items-center justify-between text-sm text-stone-600">
                  <span style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{r.word.hiragana}</span>
                  <span className="text-stone-400">{r.word.meaning}</span>
                  {r.hintUsed && <span title="Usó pista">💡</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={onBack}
          className="mt-4 px-8 py-3 rounded-xl bg-indigo-700 text-white font-semibold"
        >
          Volver
        </button>
      </div>
    );
  }

  if (!currentWord) return null;

  const totalWords = queue.length;
  const progressPct = (queueIndex / totalWords) * 100;

  // ── Game screen ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-stone-500">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-stone-700">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>
          {queueIndex + 1} / {totalWords}
        </span>
      </div>
      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-700 transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Image */}
      <div className="mt-2">
        <VocabImage
          hiragana={currentWord.hiragana}
          imageQuery={currentWord.imageQuery}
          emojiBackup={currentWord.emojiBackup}
          label={currentWord.meaning}
        />
      </div>

      {/* Romaji hint */}
      {showRomaji && (
        <p className="text-stone-400 text-sm tracking-wide">{currentWord.romaji}</p>
      )}

      {/* Hint button / meaning reveal */}
      {phase === "playing" && !hintUsed && (
        <button
          onClick={() => setHintUsed(true)}
          className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
        >
          <Lightbulb size={14} /> Ver pista 💡
        </button>
      )}
      {hintUsed && phase === "playing" && (
        <p className="text-xs text-amber-600">{currentWord.meaning}</p>
      )}

      {/* Word slots */}
      <WordSlots
        slots={slots}
        animClass={animClass}
        onTapSlot={handleSlotTap}
      />

      {/* Phase feedback */}
      {phase === "correct" && (
        <p className="text-emerald-600 font-semibold text-sm">
          ✅ ¡Correcto! — {currentWord.meaning}
        </p>
      )}
      {phase === "wrong" && (
        <p className="text-rose-600 font-semibold text-sm">❌ Inténtalo de nuevo</p>
      )}
      {phase === "reveal" && (
        <div className="text-center">
          <p className="text-rose-600 font-semibold text-sm mb-1">❌ La respuesta era:</p>
          <p
            className="text-4xl"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
          >
            {currentWord.hiragana}
          </p>
          <p className="text-stone-400 text-sm mt-1">{currentWord.meaning}</p>
        </div>
      )}

      {/* Kana chip pool — all chips visible at once */}
      <div className="flex flex-wrap gap-2 justify-center px-2">
        {chips.map((chip) => (
          <KanaChip
            key={chip.id}
            kana={chip.kana}
            used={chip.used}
            onClick={() => handleChipTap(chip.id)}
          />
        ))}
      </div>

      {/* Clear button */}
      {phase === "playing" && slots.some((s) => s !== null) && (
        <button
          onClick={handleClear}
          className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600"
        >
          <RotateCcw size={12} /> Limpiar
        </button>
      )}
    </div>
  );
}
