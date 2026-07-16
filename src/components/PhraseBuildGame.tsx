import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { Phrase } from "../phrases";
import { findKanjiSpelling } from "../kanji";
import { advanceBox, isDue } from "../leitner";
import { phraseProgressKey } from "../utils";
import { getDistractors } from "../utils/distractors";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import AudioButton from "./AudioButton";
import AnswerReveal from "./AnswerReveal";
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

type GamePhase = "playing" | "correct" | "wrong" | "reveal" | "done";

const PINK      = "#D14B8F";
const PINK_DARK = "#A8306E";

interface Chip {
  id: number;
  kana: string;
  used: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildChips(phrase: Phrase): Chip[] {
  const syllables = [...phrase.kana];
  const kanas = [...syllables, ...getDistractors(phrase.kana, 4)];
  return shuffle(kanas.map((kana, id) => ({ id, kana, used: false })));
}

interface Props {
  phrases: Phrase[];
  progress: ProgressItems;
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

export default function PhraseBuildGame({
  phrases,
  progress,
  sessionLimit = 50,
  onProgressUpdate,
  onBack,
}: Props) {
  const [queue, setQueue] = useState<Phrase[]>([]);
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
  const { speak } = useSpeech();

  // Escuchar el audio revela cómo se escribe la frase antes de resolverla —
  // un acierto obtenido así no cuenta para el progreso (SRS), igual que en
  // el modo Deletrear de Vocabulario.
  const helpUsed = audioUsed;

  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" || phase === "reveal" ? foxSadImg :
    foxNeutralImg;

  useEffect(() => {
    const due: Phrase[] = [];
    const notDue: Phrase[] = [];
    for (const p of phrases) {
      const prog = progress[phraseProgressKey("phrase-build", p.id)];
      if (!prog || prog.attempts === 0 || isDue(prog.nextDue, today)) {
        due.push(p);
      } else {
        notDue.push(p);
      }
    }
    const phraseQueue = [...shuffle(due), ...shuffle(notDue)].slice(0, sessionLimit);
    setQueue(phraseQueue);
    setQueueIndex(0);
    if (phraseQueue.length > 0) initPhrase(phraseQueue[0]);
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initPhrase(phrase: Phrase) {
    const len = [...phrase.kana].length;
    setChips(buildChips(phrase));
    setSlots(Array(len).fill(null));
    setSlotChipIds(Array(len).fill(null));
    setFailCount(0);
    setPhase("playing");
    setAnimClass("");
    setAudioUsed(false);
  }

  function recordResult(phrase: Phrase, isCorrect: boolean, skipSRS = false) {
    setSessionResults((prev) => [...prev, { word: { hiragana: phrase.kana, romaji: phrase.romaji, meaning: phrase.meaning }, correct: isCorrect }]);
    if (skipSRS) return;

    const key = phraseProgressKey("phrase-build", phrase.id);
    const prevP: ItemProgress = progress[key] ?? { box: 0, nextDue: today, attempts: 0, correct: 0 };
    const { box, nextDue } = advanceBox(prevP, isCorrect, today);
    const newP: ItemProgress = {
      box,
      nextDue,
      attempts: prevP.attempts + 1,
      correct: prevP.correct + (isCorrect ? 1 : 0),
    };
    onProgressUpdate({ [key]: newP });
  }

  const currentPhrase = queue[queueIndex] ?? null;

  function advanceToNext() {
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      setPhase("done");
      return;
    }
    setQueueIndex(nextIndex);
    initPhrase(queue[nextIndex]);
  }

  function triggerAnim(cls: string, duration: number) {
    setAnimClass(cls);
    setTimeout(() => setAnimClass(""), duration);
  }

  const checkAnswer = useCallback(
    (filledSlots: (string | null)[], phrase: Phrase, currentFail: number) => {
      const answer = filledSlots.join("");
      const isCorrect = answer === phrase.kana;

      if (isCorrect) {
        playChime();
        fireConfetti();
        triggerAnim("correct-flash", 600);
        setPhase("correct");
        if (helpUsed) setHelpedCount((prev) => prev + 1);
        recordResult(phrase, true, helpUsed);
        speak(phrase.kana);
      } else {
        playBuzz();
        const newFail = currentFail + 1;
        setFailCount(newFail);
        triggerAnim("error-shake", 500);
        if (newFail >= 2) {
          setPhase("reveal");
          recordResult(phrase, false);
          speak(phrase.kana);
        } else {
          setPhase("wrong");
          setTimeout(() => {
            const len = [...phrase.kana].length;
            setChips(buildChips(phrase));
            setSlots(Array(len).fill(null));
            setSlotChipIds(Array(len).fill(null));
            setPhase("playing");
          }, 800);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queueIndex, queue, helpUsed]
  );

  function handleChipTap(chipId: number) {
    if (phase !== "playing" || !currentPhrase) return;

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
      checkAnswer(newSlots, currentPhrase, failCount);
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
    if (!currentPhrase || phase !== "playing") return;
    const len = [...currentPhrase.kana].length;
    setChips(buildChips(currentPhrase));
    setSlots(Array(len).fill(null));
    setSlotChipIds(Array(len).fill(null));
  }

  function handleContinue() {
    advanceToNext();
  }

  // ── Done screen ──────────────────────────────────────────────────────────

  if (phase === "done" || queue.length === 0) {
    return (
      <VocabSessionSummary
        sessionResults={sessionResults}
        onBack={onBack}
        footer={
          helpedCount > 0
            ? `${helpedCount} frase${helpedCount === 1 ? "" : "s"} no contaron para tu progreso por usar audio`
            : undefined
        }
      />
    );
  }

  if (!currentPhrase) return null;

  const totalPhrases = queue.length;
  const progressPct = (queueIndex / totalPhrases) * 100;

  // ── Game screen ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>
          {queueIndex + 1} / {totalPhrases}
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#F9E9F1] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${PINK}, ${PINK_DARK})` }}
        />
      </div>

      {/* Significado (sin la frase en kana) + audio + zorro */}
      <div className="w-full flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0 rounded-2xl px-4 py-3" style={{ backgroundColor: "#FCEAF3" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: PINK_DARK }}>Escribe la frase</p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "#8B7FA8" }}>{currentPhrase.meaning}</p>
        </div>
        <AudioButton
          text={currentPhrase.kana}
          className="shrink-0"
          accent={PINK}
          onPlay={() => setAudioUsed(true)}
        />
        <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0 transition-opacity" />
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
          kana={currentPhrase.kana}
          kanji={findKanjiSpelling(currentPhrase.kana)}
          romaji={currentPhrase.romaji}
          meaning={currentPhrase.meaning}
          extra={
            <>
              <p className="text-[#8B7FA8] text-xs mt-1">{currentPhrase.context}</p>
              {phase === "correct" && helpUsed && (
                <p className="text-xs mt-2" style={{ color: "#0A6E54", opacity: 0.75 }}>
                  No cuenta para tu progreso — usaste el audio
                </p>
              )}
            </>
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
