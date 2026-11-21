import { useState, useCallback } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { GrammarLesson, GrammarExercise, GrammarOrderExercise, GrammarParticleExercise, GrammarQAExercise } from "../grammar";
import { advanceBox } from "../leitner";
import { grammarProgressKey, type GrammarPracticeMode } from "../utils";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import AnswerReveal from "./AnswerReveal";
import GrammarTokenChip from "./GrammarTokenChip";
import GrammarTokenSlots from "./GrammarTokenSlots";
import ParticleTrain from "./ParticleTrain";
import SyllableBuildDrill from "./SyllableBuildDrill";
import SpotErrorDrill from "./SpotErrorDrill";
import { toExtraOrder, toSpot, type GrammarExtraOrderExercise, type GrammarSpotExercise } from "../grammarGames";
import { toBuildExercise, BUILD_LEVELS, type GrammarBuildExercise, type BuildLevel } from "../grammarBuild";
import { particleColor } from "../particleTrain";
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

/** Ejercicios por sesión: cada lección tiene más oraciones de las que entran en una sesión. */
const SESSION_SIZE = 12;

/**
 * Ejercicio de una sesión: los de grammar.ts + los derivados de cada oración
 * (sílabas, dictado, ordenar con trampas, encuentra el error) + pregunta→respuesta.
 */
type SessionExercise =
  | GrammarExercise
  | GrammarBuildExercise
  | GrammarExtraOrderExercise
  | GrammarSpotExercise
  | GrammarQAExercise;
type ExerciseType = SessionExercise["type"];

/**
 * Tipo de juego elegido al empezar la lección. Cada juego nuevo de las fases 2-3
 * (docs/GRAMATICA_PLAN.md) se agrega aquí y entra también en «Mezclado».
 */
type GrammarGameMode = "mix" | ExerciseType;

const GAME_MODES: { id: GrammarGameMode; label: string; hint: string }[] = [
  { id: "mix",       label: "Mezclado",             hint: "Todos los juegos, al azar" },
  { id: "order",     label: "Ordenar",              hint: "Arma la frase con fichas" },
  { id: "extra",     label: "Ordenar con trampas",  hint: "Sobran 1–2 fichas" },
  { id: "particle",  label: "Huecos",               hint: "Elige la partícula o la forma" },
  { id: "qa",        label: "Pregunta y respuesta", hint: "Responde con la partícula de la pregunta" },
  { id: "spot",      label: "Encuentra el error",   hint: "Toca la ficha que está mal" },
  { id: "build",     label: "Sílabas",              hint: "Arma las palabras sílaba por sílaba" },
  { id: "dictation", label: "Dictado",              hint: "Escucha y arma la frase con sílabas" },
];

/** Tipos que se rotan en «Mezclado» (pregunta→respuesta se intercala aparte: tiene sus propios datos). */
const MIX_TYPES: ExerciseType[] = ["order", "particle", "build", "extra", "spot", "dictation"];
const MIX_QA_COUNT = 2;
const USES_SYLLABLES: GrammarGameMode[] = ["build", "dictation", "mix"];

const MODE_STORAGE_KEY = "grammar-game-mode";
const LEVEL_STORAGE_KEY = "grammar-build-level";
const AUDIO_STORAGE_KEY = "grammar-build-tile-audio";

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return (allowed as readonly string[]).includes(v ?? "") ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* sin almacenamiento: no pasa nada */ }
}

/**
 * Elige hasta SESSION_SIZE oraciones distintas al azar. En "mix" rota los tipos
 * de ejercicio (ordenar / hueco / sílabas) para que una misma oración no salga
 * dos veces; en los otros modos usa solo ese tipo.
 */
function buildSession(lesson: GrammarLesson, mode: GrammarGameMode): SessionExercise[] {
  if (mode === "qa") return shuffle(lesson.qaExercises).slice(0, SESSION_SIZE);
  const bySid = new Map<number, SessionExercise[]>();
  lesson.exercises.forEach((ex, i) => {
    const sid = ex.sid ?? -1 - i;
    bySid.set(sid, [...(bySid.get(sid) ?? []), ex]);
  });
  // Juegos derivados de cada oración; las partículas alternativas del hueco nunca salen como extra.
  for (const group of bySid.values()) {
    const order = group.find((ex): ex is GrammarOrderExercise => ex.type === "order");
    const particle = group.find((ex): ex is GrammarParticleExercise => ex.type === "particle");
    if (!order) continue;
    group.push(toBuildExercise(order, particle?.alt));
    group.push(toBuildExercise(order, particle?.alt, "dictation"));
    const extra = toExtraOrder(order, particle);
    if (extra) group.push(extra);
    const spot = toSpot(order, particle);
    if (spot) group.push(spot);
  }
  const sids = shuffle([...bySid.keys()]);
  if (mode !== "mix") {
    return sids
      .map((sid) => bySid.get(sid)!.find((ex) => ex.type === mode))
      .filter((ex): ex is SessionExercise => !!ex)
      .slice(0, SESSION_SIZE);
  }
  const start = Math.floor(Math.random() * MIX_TYPES.length);
  const session = sids.slice(0, SESSION_SIZE).map((sid, i) => {
    const group = bySid.get(sid)!;
    const want = MIX_TYPES[(start + i) % MIX_TYPES.length];
    return group.find((ex) => ex.type === want) ?? group[0];
  });
  // Unas pocas preguntas→respuesta, en posiciones al azar (sin la primera, para no empezar con la más rara).
  const qas = shuffle(lesson.qaExercises).slice(0, Math.min(MIX_QA_COUNT, session.length - 1));
  const positions = shuffle(session.map((_, i) => i).slice(1)).slice(0, qas.length);
  qas.forEach((q, k) => { session[positions[k]] = q; });
  return session;
}

/** Fichas del banco de un ejercicio de ordenar (con trampas, las que sobran). */
function chipTokens(ex: GrammarOrderExercise | GrammarExtraOrderExercise): string[] {
  return ex.type === "extra" ? [...ex.tokens, ...ex.extras] : ex.tokens;
}

function buildChips(tokens: string[]): Chip[] {
  return shuffle(tokens.map((token, id) => ({ id, token, used: false })));
}

/** Frase completa (sin espacios) que corresponde a un ejercicio ya resuelto — usada para el resumen y el TTS al corregir. */
function fullSentence(ex: SessionExercise): string {
  if (ex.type === "particle" || ex.type === "qa") return ex.sentence.replace("＿", ex.answer);
  if (ex.type === "spot") return ex.correctTokens.join("");
  return ex.tokens.join("");
}

const PROGRESS_MODE: Record<ExerciseType, GrammarPracticeMode> = {
  order: "grammar-order",
  particle: "grammar-particle",
  build: "grammar-build",
  dictation: "grammar-dictation",
  extra: "grammar-extra",
  spot: "grammar-spot",
  qa: "grammar-qa",
};

interface Props {
  lesson: GrammarLesson;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

export default function GrammarLessonGame({ lesson, progress, onProgressUpdate, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("explain");
  const [mode, setMode] = useState<GrammarGameMode>(() =>
    readStored(MODE_STORAGE_KEY, GAME_MODES.map((m) => m.id), "mix"));
  const [buildLevel, setBuildLevel] = useState<BuildLevel>(() =>
    readStored(LEVEL_STORAGE_KEY, Object.keys(BUILD_LEVELS) as BuildLevel[], "facil"));
  const [tileAudio, setTileAudio] = useState(() => readStored(AUDIO_STORAGE_KEY, ["on", "off"], "off") === "on");
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
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
  const current: SessionExercise | null = exercises[index] ?? null;
  const hasQA = lesson.qaExercises.length > 0;
  // Si el modo guardado no existe en esta lección (pregunta→respuesta), se juega «Mezclado».
  const effectiveMode: GrammarGameMode = mode === "qa" && !hasQA ? "mix" : mode;
  const sessionLength = Math.min(SESSION_SIZE, effectiveMode === "qa" ? lesson.qaExercises.length : lesson.sentences.length);

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" || phase === "reveal" ? foxSadImg :
    foxNeutralImg;

  function initExercise(ex: SessionExercise) {
    if (ex.type === "build" || ex.type === "dictation" || ex.type === "spot") {
      // Estos componentes manejan su propio estado (se montan de nuevo en cada ejercicio).
    } else if (ex.type === "order" || ex.type === "extra") {
      setChips(buildChips(chipTokens(ex)));
      setSlots(Array(ex.tokens.length).fill(null));
      setSlotChipIds(Array(ex.tokens.length).fill(null));
      setFailCount(0);
      setAnimClass("");
    } else if (ex.type === "particle" || ex.type === "qa") {
      setSelectedOption(null);
      setParticleOptions(shuffle(ex.options));
    }
    setPhase("playing");
  }

  function chooseMode(m: GrammarGameMode) {
    setMode(m);
    writeStored(MODE_STORAGE_KEY, m);
  }

  function chooseLevel(l: BuildLevel) {
    setBuildLevel(l);
    writeStored(LEVEL_STORAGE_KEY, l);
  }

  function toggleTileAudio() {
    setTileAudio((on) => {
      writeStored(AUDIO_STORAGE_KEY, on ? "off" : "on");
      return !on;
    });
  }

  function startLesson() {
    const session = buildSession(lesson, effectiveMode);
    setExercises(session);
    if (session.length === 0) { setPhase("done"); return; }
    setIndex(0);
    initExercise(session[0]);
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

  function recordResult(ex: SessionExercise, isCorrect: boolean) {
    const key = grammarProgressKey(PROGRESS_MODE[ex.type], lesson.id);
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
    (filledSlots: (string | null)[], ex: GrammarOrderExercise | GrammarExtraOrderExercise, currentFail: number) => {
      const answer = filledSlots as string[];
      const matches = (order: string[]) => answer.length === order.length && answer.every((t, i) => t === order[i]);
      const isCorrect = matches(ex.tokens) || (ex.accept ?? []).some(matches);

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
            setChips(buildChips(chipTokens(ex)));
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
    if (phase !== "playing" || !current || (current.type !== "order" && current.type !== "extra")) return;

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
    if (!current || (current.type !== "order" && current.type !== "extra") || phase !== "playing") return;
    setChips(buildChips(chipTokens(current)));
    setSlots(Array(current.tokens.length).fill(null));
    setSlotChipIds(Array(current.tokens.length).fill(null));
  }

  function handleParticleAnswer(option: string) {
    if (phase !== "playing" || !current || (current.type !== "particle" && current.type !== "qa")) return;
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
          {lesson.tip && (
            <p className="text-sm mt-3 rounded-xl px-3 py-2 leading-relaxed" style={{ backgroundColor: "#FFFFFF", color: "#5B5470" }}>
              💡 {lesson.tip}
            </p>
          )}
        </div>
        {lesson.train && (
          <div className="rounded-3xl border-2 p-4" style={{ borderColor: "#EDEFFB" }}>
            <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: INDIGO }}>Tren de partículas</div>
            <ParticleTrain currentLessonId={lesson.id} showMnemonic />
          </div>
        )}
        <div>
          <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "#8B7FA8" }}>Tipo de juego</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Tipo de juego">
            {GAME_MODES.map((m) => {
              const selected = m.id === effectiveMode;
              const unavailable = m.id === "qa" && !hasQA;
              return (
                <button
                  key={m.id}
                  role="radio"
                  aria-checked={selected}
                  disabled={unavailable}
                  onClick={() => chooseMode(m.id)}
                  className="rounded-2xl border-2 px-2 py-2.5 text-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    borderColor: selected ? INDIGO : "#EEEEEE",
                    backgroundColor: selected ? "#EDEFFB" : "#FFFFFF",
                  }}
                >
                  <div className="text-sm font-semibold" style={{ color: selected ? INDIGO_DARK : "#1A1A2E" }}>{m.label}</div>
                  <div className="text-[11px] mt-0.5 leading-tight" style={{ color: "#8B7FA8" }}>
                    {unavailable ? "No hay en esta lección" : m.hint}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {USES_SYLLABLES.includes(effectiveMode) && (
          <div>
            <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "#8B7FA8" }}>Nivel de sílabas</div>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Nivel de sílabas">
              {(Object.keys(BUILD_LEVELS) as BuildLevel[]).map((l) => {
                const selected = l === buildLevel;
                return (
                  <button
                    key={l}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => chooseLevel(l)}
                    className="rounded-2xl border-2 px-2 py-2 text-center transition-colors"
                    style={{ borderColor: selected ? INDIGO : "#EEEEEE", backgroundColor: selected ? "#EDEFFB" : "#FFFFFF" }}
                  >
                    <div className="text-sm font-semibold" style={{ color: selected ? INDIGO_DARK : "#1A1A2E" }}>{BUILD_LEVELS[l].label}</div>
                    <div className="text-[11px] mt-0.5 leading-tight" style={{ color: "#8B7FA8" }}>{BUILD_LEVELS[l].hint}</div>
                  </button>
                );
              })}
            </div>
            {buildLevel === "facil" && (
              <label className="mt-3 flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 cursor-pointer" style={{ borderColor: "#EEEEEE" }}>
                <span className="text-sm" style={{ color: "#1A1A2E" }}>
                  🔊 Escuchar cada sílaba al tocarla
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={tileAudio}
                  onChange={toggleTileAudio}
                  className="w-5 h-5 accent-[#4C5FBF]"
                />
              </label>
            )}
          </div>
        )}
        <button
          onClick={startLesson}
          className="w-full py-3.5 rounded-2xl text-white font-semibold"
          style={{ backgroundColor: INDIGO }}
        >
          Comenzar ({sessionLength} ejercicios)
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

      {current.type === "build" || current.type === "dictation" ? (
        <SyllableBuildDrill
          key={index}
          ex={current}
          level={buildLevel}
          speakTiles={buildLevel === "facil" && tileAudio}
          onResult={(ok) => recordResult(current, ok)}
          onContinue={advanceToNext}
        />
      ) : current.type === "spot" ? (
        <SpotErrorDrill
          key={index}
          ex={current}
          onResult={(ok) => recordResult(current, ok)}
          onContinue={advanceToNext}
        />
      ) : current.type === "order" || current.type === "extra" ? (
        <OrderDrill
          ex={current}
          chips={chips}
          slots={slots}
          phase={phase}
          animClass={animClass}
          foxPose={foxPose}
          showTrain={!!lesson.train && failCount > 0}
          lessonId={lesson.id}
          onChipTap={handleChipTap}
          onSlotTap={handleSlotTap}
          onClear={handleClearOrder}
          onContinue={advanceToNext}
        />
      ) : current.type === "particle" || current.type === "qa" ? (
        <ParticleDrill
          ex={current}
          options={particleOptions}
          phase={phase}
          selectedOption={selectedOption}
          foxPose={foxPose}
          onAnswer={handleParticleAnswer}
          onContinue={advanceToNext}
        />
      ) : null}
    </div>
  );
}

// ── Drill: ordenar fichas ───────────────────────────────────────────────────

interface OrderDrillProps {
  ex: GrammarOrderExercise | GrammarExtraOrderExercise;
  chips: Chip[];
  slots: (string | null)[];
  phase: Phase;
  animClass: string;
  foxPose: string;
  showTrain: boolean;
  lessonId: string;
  onChipTap: (id: number) => void;
  onSlotTap: (idx: number) => void;
  onClear: () => void;
  onContinue: () => void;
}

function OrderDrill({ ex, chips, slots, phase, animClass, foxPose, showTrain, lessonId, onChipTap, onSlotTap, onClear, onContinue }: OrderDrillProps) {
  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="w-full flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0 rounded-2xl px-4 py-3" style={{ backgroundColor: "#EDEFFB" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: INDIGO }}>
            {ex.type === "extra" ? `Ordena la frase · sobran ${ex.extras.length} ficha${ex.extras.length > 1 ? "s" : ""}` : "Ordena la frase"}
          </p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "#33408C" }}>{ex.translation}</p>
        </div>
        <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0" />
      </div>

      {showTrain && (
        <div className="w-full rounded-2xl px-3 py-2" style={{ backgroundColor: "#FAFAFF" }}>
          <p className="text-[11px] font-semibold mb-1.5 text-center" style={{ color: "#8B7FA8" }}>💡 Sigue el orden del tren</p>
          <ParticleTrain currentLessonId={lessonId} compact />
        </div>
      )}

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
  ex: GrammarParticleExercise | GrammarQAExercise;
  options: string[];
  phase: Phase;
  selectedOption: string | null;
  foxPose: string;
  onAnswer: (option: string) => void;
  onContinue: () => void;
}

function ParticleDrill({ ex, options, phase, selectedOption, foxPose, onAnswer, onContinue }: ParticleDrillProps) {
  const [before, after] = ex.sentence.split("＿");
  const longest = Math.max(...options.map((o) => o.length));
  const blank = (
    <span
      className="inline-block mx-1 min-w-[2ch] px-2 rounded-lg border-2 border-dashed align-middle"
      style={{ borderColor: INDIGO, color: INDIGO }}
    >
      {selectedOption ?? "　"}
    </span>
  );

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="w-full flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0 rounded-2xl px-4 py-3" style={{ backgroundColor: "#EDEFFB" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: INDIGO }}>
            {ex.type === "qa" ? "Responde la pregunta" : ex.kind === "form" ? "Elige la forma correcta" : "Elige la partícula"}
          </p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "#33408C" }}>{ex.translation}</p>
        </div>
        <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0" />
      </div>
      {ex.type === "qa" && (
        <div className="w-full rounded-2xl px-4 py-3 border-2" style={{ borderColor: "#EDEFFB" }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#8B7FA8" }}>Pregunta</div>
          <div className="text-xl leading-snug" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#1A1A2E" }}>
            {ex.question.map((t, i) => (
              <span key={i} className="mx-[0.12em]" style={particleColor(t) ? { color: particleColor(t)!.fg, fontWeight: 700 } : undefined}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col items-center gap-2">
        {ex.type === "qa" && (
          <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#8B7FA8" }}>Respuesta</div>
        )}
        <div
          className="select-none leading-snug text-2xl text-center"
          style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#1A1A2E" }}
        >
          {ex.parts ? (
            // Fichas separadas por un pequeño espacio y partículas con su color del tren.
            ex.parts.map((t, i) =>
              t === "＿" ? (
                <span key={i}>{blank}</span>
              ) : (
                <span key={i} className="mx-[0.15em]" style={particleColor(t) ? { color: particleColor(t)!.fg, fontWeight: 700 } : undefined}>
                  {t}
                </span>
              ),
            )
          ) : (
            <>{before}{blank}{after}</>
          )}
        </div>
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
              className={`py-3.5 px-2 rounded-2xl border-2 font-semibold text-center transition-colors disabled:opacity-100 break-all ${
                ex.kind === "form" ? (longest > 7 ? "text-sm" : "text-lg") : "text-xl"
              }`}
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
