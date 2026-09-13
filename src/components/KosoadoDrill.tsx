import { useCallback, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { KosoadoExercise, KosoadoChoiceExercise, KosoadoOrderExercise, KosoadoMode } from "../kosoado";
import { KOSOADO_INTRO, KOSOADO_DISTANCE_TABLE, kosoadoFullSentence } from "../kosoado";
import { advanceBox, buildSessionQueue } from "../leitner";
import { kosoadoProgressKey, toISODate } from "../utils";
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

const PURPLE      = "#7C4FE0";
const PURPLE_DARK = "#5A38A8";
const PURPLE_LT   = "#F1EAFB";

type Phase = "intro" | "playing" | "correct" | "wrong" | "reveal" | "done";

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

interface Props {
  exercises: KosoadoExercise[];
  sessionLimit: number;
  introModes: KosoadoMode[];
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

export default function KosoadoDrill({
  exercises, sessionLimit, introModes, progress, onProgressUpdate, onBack,
}: Props) {
  const today = toISODate();
  const { speak } = useSpeech();

  const [queue] = useState<KosoadoExercise[]>(() => {
    const re = exercises.filter((e) => e.mode === "kosoado-re").map((e) => ({ ...e, kana: e.id }));
    const no = exercises.filter((e) => e.mode === "kosoado-no").map((e) => ({ ...e, kana: e.id }));
    const q1 = buildSessionQueue(re, progress, "kosoado-re", re.length, today);
    const q2 = buildSessionQueue(no, progress, "kosoado-no", no.length, today);
    return shuffle([...q1, ...q2]).slice(0, Math.max(1, sessionLimit));
  });

  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);

  // "choice" state
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  // "order" state
  const [chips, setChips] = useState<Chip[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [slotChipIds, setSlotChipIds] = useState<(number | null)[]>([]);
  const [failCount, setFailCount] = useState(0);
  const [animClass, setAnimClass] = useState("");

  const current: KosoadoExercise | null = queue[index] ?? null;
  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" || phase === "reveal" ? foxSadImg :
    foxNeutralImg;

  function startExercise(i: number) {
    const ex = queue[i];
    if (!ex) { setPhase("done"); return; }
    if (ex.type === "choice") {
      setOptions(shuffle(ex.options));
      setSelected(null);
    } else {
      setChips(buildChips(ex.tokens));
      setSlots(Array(ex.tokens.length).fill(null));
      setSlotChipIds(Array(ex.tokens.length).fill(null));
      setFailCount(0);
      setAnimClass("");
    }
    setPhase("playing");
  }

  function begin() {
    setIndex(0);
    startExercise(0);
  }

  function recordResult(ex: KosoadoExercise, isCorrect: boolean) {
    const key = kosoadoProgressKey(ex.mode, ex.id);
    const prevP: ItemProgress = progress[key] ?? { box: 0, nextDue: today, attempts: 0, correct: 0 };
    const { box, nextDue } = advanceBox(prevP, isCorrect, today);
    onProgressUpdate({
      [key]: {
        box, nextDue,
        attempts: prevP.attempts + 1,
        correct: prevP.correct + (isCorrect ? 1 : 0),
      },
    });
    setResults((prev) => [...prev, {
      word: { hiragana: kosoadoFullSentence(ex), romaji: "", meaning: ex.translation },
      correct: isCorrect,
    }]);
  }

  function next() {
    const n = index + 1;
    if (n >= queue.length) { setPhase("done"); return; }
    setIndex(n);
    startExercise(n);
  }

  // ── choice ───────────────────────────────────────────────────────────────

  function answerChoice(option: string) {
    if (phase !== "playing" || !current || current.type !== "choice") return;
    setSelected(option);
    const isCorrect = option === current.answer;
    if (isCorrect) { playChime(); fireConfetti(); setPhase("correct"); }
    else { playBuzz(); setPhase("wrong"); }
    recordResult(current, isCorrect);
    speak(kosoadoFullSentence(current));
  }

  // ── order ────────────────────────────────────────────────────────────────

  function triggerAnim(cls: string, duration: number) {
    setAnimClass(cls);
    setTimeout(() => setAnimClass(""), duration);
  }

  const checkOrderAnswer = useCallback(
    (filledSlots: (string | null)[], ex: KosoadoOrderExercise, currentFail: number) => {
      const answer = filledSlots as string[];
      const isCorrect = answer.length === ex.tokens.length && answer.every((t, i) => t === ex.tokens[i]);

      if (isCorrect) {
        playChime();
        fireConfetti();
        triggerAnim("correct-flash", 600);
        setPhase("correct");
        recordResult(ex, true);
        speak(kosoadoFullSentence(ex));
      } else {
        playBuzz();
        const newFail = currentFail + 1;
        setFailCount(newFail);
        triggerAnim("error-shake", 500);
        if (newFail >= 2) {
          setPhase("reveal");
          recordResult(ex, false);
          speak(kosoadoFullSentence(ex));
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
    [index, queue]
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

  // ── Intro ────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="flex flex-col gap-5">
        <button onClick={onBack} className="flex items-center gap-1 text-sm hover:opacity-70 self-start" style={{ color: "#8B7FA8" }}>
          <ArrowLeft size={14} /> Volver
        </button>

        {introModes.map((m) => (
          <div key={m} className="rounded-3xl p-6" style={{ backgroundColor: PURPLE_LT }}>
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1A1A2E" }}>
              {KOSOADO_INTRO[m].title}
            </h2>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: PURPLE_DARK }}>{KOSOADO_INTRO[m].text}</p>
          </div>
        ))}

        <div className="rounded-3xl p-5 border-2" style={{ borderColor: PURPLE_LT }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: PURPLE_DARK }}>
            ¿Cuál forma uso? — por distancia
          </p>
          <div className="flex flex-col gap-2">
            {KOSOADO_DISTANCE_TABLE.map((row) => (
              <div key={row.label} className="flex items-start gap-3">
                <div className="shrink-0 w-24 text-center text-lg font-semibold" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: PURPLE }}>
                  {row.re} / {row.no}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: "#1A1A2E" }}>{row.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#8B7FA8" }}>{row.distance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={begin} className="w-full py-3.5 rounded-2xl text-white font-semibold" style={{ backgroundColor: PURPLE }}>
          Comenzar ({queue.length} preguntas)
        </button>
      </div>
    );
  }

  // ── Resumen ──────────────────────────────────────────────────────────────
  if (phase === "done" || !current) {
    return <VocabSessionSummary sessionResults={results} onBack={onBack} />;
  }

  const progressPct = (index / queue.length) * 100;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>{index + 1} / {queue.length}</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: PURPLE_LT }}>
        <div className="h-full transition-all" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${PURPLE}, ${PURPLE_DARK})` }} />
      </div>

      {current.type === "choice" ? (
        <ChoiceDrill
          ex={current}
          options={options}
          phase={phase}
          selected={selected}
          foxPose={foxPose}
          onAnswer={answerChoice}
          onContinue={next}
        />
      ) : (
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
          onContinue={next}
        />
      )}
    </div>
  );
}

// ── Drill: elegir la forma ───────────────────────────────────────────────────

interface ChoiceDrillProps {
  ex: KosoadoChoiceExercise;
  options: string[];
  phase: Phase;
  selected: string | null;
  foxPose: string;
  onAnswer: (option: string) => void;
  onContinue: () => void;
}

function ChoiceDrill({ ex, options, phase, selected, foxPose, onAnswer, onContinue }: ChoiceDrillProps) {
  const [before, after] = ex.sentence.split("＿");

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="w-full flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 rounded-2xl px-4 py-3" style={{ backgroundColor: PURPLE_LT }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: PURPLE_DARK }}>Elige la forma correcta</p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "#33408C" }}>{ex.situation}</p>
        </div>
        <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0" />
      </div>

      <div
        className="select-none leading-snug text-2xl text-center"
        style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#1A1A2E" }}
      >
        {before}
        <span
          className="inline-block mx-1 min-w-[2ch] px-2 rounded-lg border-2 border-dashed align-middle"
          style={{ borderColor: PURPLE, color: PURPLE }}
        >
          {selected ?? "　"}
        </span>
        {after}
      </div>

      <div className="w-full grid grid-cols-2 gap-2.5">
        {options.map((opt) => {
          const isCorrectOpt = opt === ex.answer;
          const isSelectedOpt = opt === selected;
          let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF", color: "#1A1A2E" };
          if (phase !== "playing") {
            if (isCorrectOpt) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1", color: "#0A6E54" };
            else if (isSelectedOpt) style = { borderColor: PURPLE_DARK, backgroundColor: PURPLE_LT, color: PURPLE_DARK };
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

// ── Drill: ordenar fichas ───────────────────────────────────────────────────

interface OrderDrillProps {
  ex: KosoadoOrderExercise;
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
        <div className="flex-1 min-w-0 rounded-2xl px-4 py-3" style={{ backgroundColor: PURPLE_LT }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: PURPLE_DARK }}>Ordena la frase</p>
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
