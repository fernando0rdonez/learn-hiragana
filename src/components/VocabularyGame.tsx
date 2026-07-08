import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import AudioButton from "./AudioButton";
import type { ProgressItems, ItemProgress } from "../types";
import type { VocabWord } from "../vocabulary";
import { findKanjiSpelling } from "../kanji";
import { INTERVALS, isDue } from "../leitner";
import { vocabProgressKey } from "../utils";
import { getDistractors } from "../utils/distractors";
import { playChime, playBuzz } from "../utils/audio";
import { fireConfetti } from "./ConfettiOverlay";
import AnswerReveal from "./AnswerReveal";
import VocabImage from "./VocabImage";
import KanaChip from "./KanaChip";
import WordSlots from "./WordSlots";
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
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function VocabularyGame({
  vocabulary,
  progress,
  showRomaji,
  sessionLimit = 50,
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
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [audioUsed, setAudioUsed] = useState(false);
  const [helpedCount, setHelpedCount] = useState(0);

  // Escuchar el audio (o ver el romaji en pantalla) revela cómo suena/se
  // escribe la palabra sin que el usuario tenga que asociarla con su
  // significado — así que un acierto obtenido con esa ayuda no cuenta para
  // el progreso (SRS) de la palabra.
  const helpUsed = showRomaji || audioUsed;

  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" || phase === "reveal" ? foxSadImg :
    foxNeutralImg;

  // Build session queue on mount: due/new words first, then not-yet-due — always include all
  useEffect(() => {
    const due: VocabWord[] = [];
    const notDue: VocabWord[] = [];
    for (const w of vocabulary) {
      const p = progress[vocabProgressKey("spell", w.hiragana)];
      if (!p || p.attempts === 0 || isDue(p.nextDue, today)) {
        due.push(w);
      } else {
        notDue.push(w);
      }
    }
    const wordQueue = [...shuffle(due), ...shuffle(notDue)].slice(0, sessionLimit);
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
    setPhase("playing");
    setAnimClass("");
    setAudioUsed(false);
  }

  // skipSRS: un acierto obtenido escuchando el audio o viendo el romaji sigue
  // apareciendo en el resumen de la sesión (fue correcto), pero no debe mover
  // la palabra en el sistema de repetición espaciada — el usuario no demostró
  // que la reconoce sin ayuda.
  function recordResult(word: VocabWord, isCorrect: boolean, skipSRS = false) {
    setSessionResults((prev) => [...prev, { word, correct: isCorrect }]);
    if (skipSRS) return;

    const key = vocabProgressKey("spell", word.hiragana);
    const prevP: ItemProgress = progress[key] ?? {
      box: 0,
      nextDue: today,
      attempts: 0,
      correct: 0,
    };

    let newBox = prevP.box;
    let newNextDue = prevP.nextDue;
    if (isCorrect) {
      newBox = Math.min(prevP.box + 1, INTERVALS.length - 1);
      newNextDue = addDays(today, INTERVALS[newBox]);
    } else {
      newBox = Math.max(prevP.box - 1, 0);
      newNextDue = today;
    }

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
    (filledSlots: (string | null)[], word: VocabWord, currentFail: number) => {
      const answer = filledSlots.join("");
      const isCorrect = answer === word.hiragana;

      if (isCorrect) {
        playChime();
        fireConfetti();
        triggerAnim("correct-flash", 600);
        setPhase("correct");
        if (helpUsed) setHelpedCount((prev) => prev + 1);
        recordResult(word, true, helpUsed);
      } else {
        playBuzz();
        const newFail = currentFail + 1;
        setFailCount(newFail);
        if (newFail >= 2) {
          triggerAnim("error-shake", 500);
          setPhase("reveal");
          recordResult(word, false);
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
    [queueIndex, queue, helpUsed]
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
    const wordLen = [...currentWord.hiragana].length;
    setChips(buildChips(currentWord));
    setSlots(Array(wordLen).fill(null));
    setSlotChipIds(Array(wordLen).fill(null));
  }

  function handleContinue() {
    advanceToNext();
  }

  // ── Done screen ──────────────────────────────────────────────────────────────

  if (phase === "done" || queue.length === 0) {
    return (
      <VocabSessionSummary
        sessionResults={sessionResults}
        onBack={onBack}
        footer={
          helpedCount > 0
            ? `${helpedCount} palabra${helpedCount === 1 ? "" : "s"} no contaron para tu progreso por usar audio o romaji`
            : undefined
        }
      />
    );
  }

  if (!currentWord) return null;

  const totalWords = queue.length;
  const progressPct = (queueIndex / totalWords) * 100;

  // ── Game screen ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>
          {queueIndex + 1} / {totalWords}
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#F0EDF8] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #7B4FD4, #9B7CE8)" }}
        />
      </div>

      {/* Image */}
      <div className="mt-2">
        <VocabImage
          hiragana={currentWord.hiragana}
          imageQuery={currentWord.imageQuery}
          emojiBackup={currentWord.emojiBackup}
          label={currentWord.meaning}
          imagePath={currentWord.generated ? currentWord.imagePath : undefined}
        />
      </div>

      {/* Palabra (romaji + significado, siempre visible para reforzar la asociación imagen–palabra) + audio + fox */}
      <div className="w-full flex items-end justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 rounded-2xl px-4 py-3 flex-1 min-w-0" style={{ backgroundColor: "#F5F3FF" }}>
          {showRomaji && (
            <>
              <span
                className="text-lg font-bold tracking-wide"
                style={{ color: "#7B4FD4", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {currentWord.romaji}
              </span>
              <span className="text-sm" style={{ color: "#C9C0E8" }}>·</span>
            </>
          )}
          <span className="text-sm font-medium" style={{ color: "#8B7FA8" }}>
            {currentWord.meaning}
          </span>
        </div>
        <AudioButton
          text={currentWord.hiragana}
          className="shrink-0"
          onPlay={() => setAudioUsed(true)}
        />
        <img src={foxPose} alt="" className="w-20 h-20 object-contain shrink-0 transition-opacity" />
      </div>

      {/* Word slots */}
      <WordSlots
        slots={slots}
        animClass={animClass}
        status={phase === "correct" ? "correct" : phase === "wrong" || phase === "reveal" ? "wrong" : "idle"}
        onTapSlot={handleSlotTap}
      />

      {/* Phase feedback */}
      {phase === "wrong" && (
        <p className="text-[#C03A1E] font-semibold text-sm">❌ Inténtalo de nuevo</p>
      )}
      {(phase === "correct" || phase === "reveal") && (
        <AnswerReveal
          status={phase === "correct" ? "correct" : "wrong"}
          kana={currentWord.hiragana}
          kanji={findKanjiSpelling(currentWord.hiragana)}
          romaji={currentWord.romaji}
          meaning={currentWord.meaning}
          extra={
            phase === "correct" && helpUsed ? (
              <p className="text-xs mt-2" style={{ color: "#0A6E54", opacity: 0.75 }}>
                No cuenta para tu progreso — usaste audio o romaji
              </p>
            ) : undefined
          }
          onContinue={handleContinue}
        />
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
