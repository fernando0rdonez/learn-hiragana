import { useState, useCallback } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { GrammarLesson, GrammarExercise, GrammarOrderExercise, GrammarParticleExercise } from "../grammar";
import { advanceBox } from "../leitner";
import { grammarProgressKey } from "../utils";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import AnswerReveal from "./AnswerReveal";
import GrammarTokenChip from "./GrammarTokenChip";
import GrammarTokenSlots from "./GrammarTokenSlots";
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

const INDIGO      = "#4C5FBF";
const INDIGO_DARK = "#33408C";

type Phase = "explain" | "playing" | "correct" | "wrong" | "reveal" | "done";

interface Chip {
  id: number;
  token: string;
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

function buildChips(tokens: string[]): Chip[] {
  return shuffle(tokens.map((token, id) => ({ id, token, used: false })));
}

/** Frase completa (sin espacios) que corresponde a un ejercicio ya resuelto — usada para el resumen y el TTS al corregir. */
function fullSentence(ex: GrammarExercise): string {
  return ex.type === "order" ? ex.tokens.join("") : ex.sentence.replace("＿", ex.answer);
}

interface Props {
  lesson: GrammarLesson;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

export default function GrammarLessonGame({ lesson, progress, onProgressUpdate, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("explain");
  const [exercises] = useState<GrammarExercise[]>(() => shuffle(lesson.exercises));
  const [index, setIndex] = useState(0);

  // "order" state
  const [chips, setChips] = useState<Chip[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [slotChipIds, setSlotChipIds] = useState<(number | null)[]>([]);
  const [failCount, setFailCount] = useState(0);
  const [animClass, setAnimClass] = useState("");

  // "particle" state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [particleOptions, setParticleOptions] = useState<string[]>([]);

  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const { speak } = useSpeech();

  const today = toISODate();
  const current: GrammarExercise | null = exercises[index] ?? null;

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" || phase === "reveal" ? foxSadImg :
    foxNeutralImg;

  function initExercise(ex: GrammarExercise) {
    if (ex.type === "order") {
      setChips(buildChips(ex.tokens));
      setSlots(Array(ex.tokens.length).fill(null));
      setSlotChipIds(Array(ex.tokens.length).fill(null));
      setFailCount(0);
      setAnimClass("");
    } else {
      setSelectedOption(null);
      setParticleOptions(shuffle(ex.options));
    }
    setPhase("playing");
  }

  function startLesson() {
    if (exercises.length === 0) { setPhase("done"); return; }
    setIndex(0);
    initExercise(exercises[0]);
  }

  function advanceToNext() {
    const nextIndex = index + 1;
    if (nextIndex >= exercises.length) {
      setPhase("done");
      return;
    }
    setIndex(nextIndex);
    initExercise(exercises[nextIndex]);
  }

  function recordResult(ex: GrammarExercise, isCorrect: boolean) {
    const mode = ex.type === "order" ? "grammar-order" : "grammar-particle";
    const key = grammarProgressKey(mode, lesson.id);
    const prevP: ItemProgress = progress[key] ?? { box: 0, nextDue: today, attempts: 0, correct: 0 };
    const { box, nextDue } = advanceBox(prevP, isCorrect, today);
    const newP: ItemProgress = {
      box,
      nextDue,
      attempts: prevP.attempts + 1,
      correct: prevP.correct + (isCorrect ? 1 : 0),
    };
    onProgressUpdate({ [key]: newP });
    setSessionResults((prev) => [...prev, { word: { hiragana: fullSentence(ex), romaji: "", meaning: ex.translation }, correct: isCorrect }]);
  }

  function triggerAnim(cls: string, duration: number) {
    setAnimClass(cls);
    setTimeout(() => setAnimClass(""), duration);
  }

  const checkOrderAnswer = useCallback(
    (filledSlots: (string | null)[], ex: GrammarOrderExercise, currentFail: number) => {
      const answer = filledSlots as string[];
      const isCorrect = answer.length === ex.tokens.length && answer.every((t, i) => t === ex.tokens[i]);

      if (isCorrect) {
        playChime();
        fireConfetti();
        triggerAnim("correct-flash", 600);
        setPhase("correct");
        recordResult(ex, true);
        speak(fullSentence(ex));
      } else {
        playBuzz();
        const newFail = currentFail + 1;
        setFailCount(newFail);
        triggerAnim("error-shake", 500);
        if (newFail >= 2) {
          setPhase("reveal");
          recordResult(ex, false);
          speak(fullSentence(ex));
        } else {
          setPhase("wrong");
          setTimeout(() => {
            setChips(buildChips(ex.tokens));
            setSlots(Array(ex.tokens.length).fill(null));
            setSlotChipIds(Array(ex.tokens.length).fill(null));
            setPhase("playing");
          }, 800);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, exercises]
  );

  function handleChipTap(chipId: number) {
    if (phase !== "playing" || !current || current.type !== "order") return;

    const emptyIdx = slots.findIndex((s) => s === null);
    if (emptyIdx === -1) return;

    const chip = chips.find((c) => c.id === chipId);
    if (!chip || chip.used) return;

    const newSlots = [...slots];
    const newSlotChipIds = [...slotChipIds];
    const newChips = chips.map((c) => (c.id === chipId ? { ...c, used: true } : c));

    newSlots[emptyIdx] = chip.token;
    newSlotChipIds[emptyIdx] = chipId;

    setSlots(newSlots);
    setSlotChipIds(newSlotChipIds);
    setChips(newChips);

    if (newSlots.every((s) => s !== null)) {
      checkOrderAnswer(newSlots, current, failCount);
    }
  }

  function handleSlotTap(idx: number) {
    if (phase !== "playing") return;

    const newSlots = [...slots];
    const newSlotChipIds = [...slotChipIds];
    const newChips = [...chips];

    for (let i = idx; i < newSlots.length; i++) {
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

  function handleClearOrder() {
    if (!current || current.type !== "order" || phase !== "playing") return;
    setChips(buildChips(current.tokens));
    setSlots(Array(current.tokens.length).fill(null));
    setSlotChipIds(Array(current.tokens.length).fill(null));
  }

  function handleParticleAnswer(option: string) {
    if (phase !== "playing" || !current || current.type !== "particle") return;
    setSelectedOption(option);
    const isCorrect = option === current.answer;
    if (isCorrect) {
      playChime();
      fireConfetti();
      setPhase("correct");
    } else {
      playBuzz();
      setPhase("wrong");
    }
    recordResult(current, isCorrect);
    speak(fullSentence(current));
  }

  // ── Explicación ──────────────────────────────────────────────────────────

  if (phase === "explain") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: "#8B7FA8" }}>
            <ArrowLeft size={14} /> Lecciones
          </button>
        </div>
        <div className="rounded-3xl p-6" style={{ backgroundColor: "#EDEFFB" }}>
          <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: INDIGO }}>{lesson.pattern}</div>
          <h2 className="text-xl font-bold mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1A1A2E" }}>
            {lesson.title}
          </h2>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: "#33408C" }}>{lesson.explanation}</p>
        </div>
        <button
          onClick={startLesson}
          className="w-full py-3.5 rounded-2xl text-white font-semibold"
          style={{ backgroundColor: INDIGO }}
        >
          Comenzar ({exercises.length} ejercicios)
        </button>
      </div>
    );
  }

  // ── Resumen ──────────────────────────────────────────────────────────────

  if (phase === "done" || !current) {
    return <VocabSessionSummary sessionResults={sessionResults} onBack={onBack} />;
  }

  const total = exercises.length;
  const progressPct = (index / total) * 100;

  // ── Ejercicio ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>{index + 1} / {total}</span>
      </div>
      <div className="w-full h-1.5 bg-[#EDEFFB] rounded-full overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${INDIGO}, ${INDIGO_DARK})` }} />
      </div>

      {current.type === "order" ? (
        <OrderDrill
          ex={current}
          chips={chips}
          slots={slots}
          phase={phase}
          animClass={animClass}
          foxPose={foxPose}
          onChipTap={handleChipTap}
          onSlotTap={handleSlotTap}
          onClear={handleClearOrder}
          onContinue={advanceToNext}
        />
      ) : (
        <ParticleDrill
          ex={current}
          options={particleOptions}
          phase={phase}
          selectedOption={selectedOption}
          foxPose={foxPose}
          onAnswer={handleParticleAnswer}
          onContinue={advanceToNext}
        />
      )}
    </div>
  );
}

// ── Drill: ordenar fichas ───────────────────────────────────────────────────

interface OrderDrillProps {
  ex: GrammarOrderExercise;
  chips: Chip[];
  slots: (string | null)[];
  phase: Phase;
  animClass: string;
  foxPose: string;
  onChipTap: (id: number) => void;
  onSlotTap: (idx: number) => void;
  onClear: () => void;
  onContinue: () => void;
}

function OrderDrill({ ex, chips, slots, phase, animClass, foxPose, onChipTap, onSlotTap, onClear, onContinue }: OrderDrillProps) {
  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="w-full flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0 rounded-2xl px-4 py-3" style={{ backgroundColor: "#EDEFFB" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: INDIGO }}>Ordena la frase</p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "#33408C" }}>{ex.translation}</p>
        </div>
        <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0" />
      </div>

      <GrammarTokenSlots
        slots={slots}
        animClass={animClass}
        status={phase === "correct" ? "correct" : phase === "wrong" || phase === "reveal" ? "wrong" : "idle"}
        onTapSlot={onSlotTap}
      />

      {phase === "wrong" && <p className="text-[#C03A1E] font-semibold text-sm">❌ Inténtalo de nuevo</p>}
      {(phase === "correct" || phase === "reveal") && (
        <AnswerReveal
          status={phase === "correct" ? "correct" : "wrong"}
          kana={ex.tokens.join("")}
          meaning={ex.translation}
          onContinue={onContinue}
        />
      )}

      <div className="flex flex-wrap gap-2 justify-center px-2">
        {chips.map((chip) => (
          <GrammarTokenChip key={chip.id} token={chip.token} used={chip.used} onClick={() => onChipTap(chip.id)} />
        ))}
      </div>

      {phase === "playing" && slots.some((s) => s !== null) && (
        <button onClick={onClear} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600">
          <RotateCcw size={12} /> Limpiar
        </button>
      )}
    </div>
  );
}

// ── Drill: partícula hueca ───────────────────────────────────────────────────

interface ParticleDrillProps {
  ex: GrammarParticleExercise;
  options: string[];
  phase: Phase;
  selectedOption: string | null;
  foxPose: string;
  onAnswer: (option: string) => void;
  onContinue: () => void;
}

function ParticleDrill({ ex, options, phase, selectedOption, foxPose, onAnswer, onContinue }: ParticleDrillProps) {
  const [before, after] = ex.sentence.split("＿");

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-2">
        <div
          className="select-none leading-snug text-2xl text-center"
          style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#1A1A2E" }}
        >
          {before}
          <span
            className="inline-block mx-1 min-w-[2ch] px-2 rounded-lg border-2 border-dashed align-middle"
            style={{ borderColor: INDIGO, color: INDIGO }}
          >
            {selectedOption ?? "　"}
          </span>
          {after}
        </div>
        <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0" />
      </div>

      <div className="w-full grid grid-cols-2 gap-2.5">
        {options.map((opt) => {
          const isCorrectOpt = opt === ex.answer;
          const isSelectedOpt = opt === selectedOption;
          let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF", color: "#1A1A2E" };
          if (phase !== "playing") {
            if (isCorrectOpt) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1", color: "#0A6E54" };
            else if (isSelectedOpt) style = { borderColor: INDIGO_DARK, backgroundColor: "#EDEFFB", color: INDIGO_DARK };
          }
          return (
            <button
              key={opt}
              disabled={phase !== "playing"}
              onClick={() => onAnswer(opt)}
              className="py-3.5 rounded-2xl border-2 text-xl font-semibold text-center transition-colors disabled:opacity-100"
              style={{ ...style, fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {phase !== "playing" && (
        <AnswerReveal
          status={phase === "correct" ? "correct" : "wrong"}
          kana={ex.sentence.replace("＿", ex.answer)}
          meaning={ex.translation}
          onContinue={onContinue}
        />
      )}
    </div>
  );
}
