import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { SpellWordEntry } from "../words";
import { INTERVALS, isDue } from "../leitner";
import { getDistractors } from "../utils/distractors";
import { playChime, playBuzz } from "../utils/audio";
import EmojiDisplay from "./EmojiDisplay";
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

function getSyllables(word: SpellWordEntry): string[] {
  return word.kanaUnits ?? [...word.hiragana];
}

function buildChips(word: SpellWordEntry): Chip[] {
  const syllables = getSyllables(word);
  const kanas = [...syllables, ...getDistractors(word.hiragana, 4, word.kanaUnits)];
  return shuffle(kanas.map((kana, id) => ({ id, kana, used: false })));
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  spellWords: SpellWordEntry[];
  progress: ProgressItems;
  showRomaji: boolean;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SpellItGame({
  spellWords,
  progress,
  showRomaji,
  onProgressUpdate,
  onBack,
}: Props) {
  const [queue, setQueue] = useState<SpellWordEntry[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [chips, setChips] = useState<Chip[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [slotChipIds, setSlotChipIds] = useState<(number | null)[]>([]);
  const [failCount, setFailCount] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [animClass, setAnimClass] = useState("");
  const [chipPage, setChipPage] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const today = toISODate();

  // Build session queue on mount: due/new words first, then not-yet-due — always include all
  useEffect(() => {
    const due: SpellWordEntry[] = [];
    const notDue: SpellWordEntry[] = [];
    for (const w of spellWords) {
      const p = progress[`word:${w.id}`];
      if (!p || p.attempts === 0 || isDue(p.nextDue, today)) {
        due.push(w);
      } else {
        notDue.push(w);
      }
    }
    const wordQueue = [...shuffle(due), ...shuffle(notDue)];
    setQueue(wordQueue);
    setQueueIndex(0);
    if (wordQueue.length > 0) initWord(wordQueue[0]);
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initWord(word: SpellWordEntry) {
    const wordLen = getSyllables(word).length;
    setChips(buildChips(word));
    setSlots(Array(wordLen).fill(null));
    setSlotChipIds(Array(wordLen).fill(null));
    setFailCount(0);
    setPhase("playing");
    setAnimClass("");
    setChipPage(0);
  }

  function recordResult(word: SpellWordEntry, isCorrect: boolean) {
    const key = `word:${word.id}`;
    const prevP: ItemProgress = progress[key] ?? {
      box: 0,
      nextDue: today,
      attempts: 0,
      correct: 0,
    };
    const newBox = isCorrect
      ? Math.min(prevP.box + 1, INTERVALS.length - 1)
      : Math.max(prevP.box - 1, 0);
    const newNextDue = addDays(today, INTERVALS[newBox]);
    const newP: ItemProgress = {
      box: newBox,
      nextDue: newNextDue,
      attempts: prevP.attempts + 1,
      correct: prevP.correct + (isCorrect ? 1 : 0),
    };
    onProgressUpdate({ [key]: newP });
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
    (filledSlots: (string | null)[], word: SpellWordEntry, currentFail: number) => {
      const answer = filledSlots.join("");
      const isCorrect = answer === word.hiragana;

      if (isCorrect) {
        playChime();
        triggerAnim("correct-flash", 600);
        setPhase("correct");
        recordResult(word, true);
        setTimeout(() => advanceToNext(), 1500);
      } else {
        playBuzz();
        const newFail = currentFail + 1;
        setFailCount(newFail);
        if (newFail >= 2) {
          triggerAnim("error-shake", 500);
          setPhase("reveal");
          recordResult(word, false);
          setTimeout(() => advanceToNext(), 2500);
        } else {
          triggerAnim("error-shake", 500);
          setPhase("wrong");
          // Reset chips back to pool after shake
          setTimeout(() => {
            const wordLen = getSyllables(word).length;
            setChips(buildChips(word));
            setSlots(Array(wordLen).fill(null));
            setSlotChipIds(Array(wordLen).fill(null));
            setChipPage(0);
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
      checkAnswer(newSlots, currentWord, failCount);
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
    const wordLen = getSyllables(currentWord).length;
    setChips(buildChips(currentWord));
    setSlots(Array(wordLen).fill(null));
    setSlotChipIds(Array(wordLen).fill(null));
    setChipPage(0);
  }

  // ── Done screen ──────────────────────────────────────────────────────────────

  if (phase === "done" || queue.length === 0) {
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
            ? "No hay palabras disponibles. Selecciona más filas."
            : `Completaste ${queue.length} palabra${queue.length === 1 ? "" : "s"}.`}
        </p>
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

      {/* Emoji */}
      <div className="mt-2">
        <EmojiDisplay emoji={currentWord.emoji} label={currentWord.emojiLabel} size={128} />
      </div>

      {/* Romaji hint */}
      {showRomaji && (
        <p className="text-stone-400 text-sm tracking-wide">{currentWord.romaji}</p>
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
          ¡Correcto! — {currentWord.meaning}
        </p>
      )}
      {phase === "wrong" && (
        <p className="text-rose-600 font-semibold text-sm">Inténtalo de nuevo</p>
      )}
      {phase === "reveal" && (
        <div className="text-center">
          <p className="text-rose-600 font-semibold text-sm mb-1">La respuesta era:</p>
          <p
            className="text-4xl"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
          >
            {currentWord.hiragana}
          </p>
          <p className="text-stone-400 text-sm mt-1">{currentWord.meaning}</p>
        </div>
      )}

      {/* Kana chip pool — paginated swipe carousel */}
      {(() => {
        const total = chips.length;
        // Split evenly into 2 pages max; single page when ≤6 chips
        const perPage = total <= 6 ? total : Math.ceil(total / 2);
        const pages: Chip[][] = [];
        for (let i = 0; i < total; i += perPage) pages.push(chips.slice(i, i + perPage));
        const clampedPage = Math.min(chipPage, pages.length - 1);

        function onTouchStart(e: React.TouchEvent) {
          touchStartX.current = e.touches[0].clientX;
        }
        function onTouchEnd(e: React.TouchEvent) {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(dx) < 40) return;
          if (dx < 0 && clampedPage < pages.length - 1) setChipPage(clampedPage + 1);
          if (dx > 0 && clampedPage > 0) setChipPage(clampedPage - 1);
        }

        return (
          <div className="w-full flex flex-col items-center gap-3">
            <div
              className="w-full overflow-hidden"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${clampedPage * 100}%)` }}
              >
                {pages.map((pageChips, pageIdx) => (
                  <div
                    key={pageIdx}
                    className="w-full flex-shrink-0 flex flex-wrap gap-3 justify-center px-2"
                  >
                    {pageChips.map((chip) => (
                      <KanaChip
                        key={chip.id}
                        kana={chip.kana}
                        used={chip.used}
                        onClick={() => handleChipTap(chip.id)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Page dots */}
            {pages.length > 1 && (
              <div className="flex gap-2">
                {pages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setChipPage(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === clampedPage ? "bg-indigo-600" : "bg-stone-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}

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
