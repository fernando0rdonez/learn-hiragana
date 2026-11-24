import { useState } from "react";
import { ArrowLeft, Volume2 } from "lucide-react";
import {
  buildTrainSession, misplaced, shuffle, STATIONS, TRAIN_SESSION_SIZE,
  type OrderCard, type TrainChoiceExercise, type TrainExercise, type TrainOrderExercise,
} from "../particleOrder";
import { particleColor, TRAIN_MNEMONIC } from "../particleTrain";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import ParticleTrain from "./ParticleTrain";
import VocabSessionSummary, { type SessionResult } from "./VocabSessionSummary";
import foxNeutralImg from "../assets/character/fox-neutral.png";
import foxCelebratingImg from "../assets/character/fox-celebrating.png";
import foxSadImg from "../assets/character/fox-sad.png";

const INDIGO = "#4C5FBF";
const INDIGO_DARK = "#33408C";
const INDIGO_LIGHT = "#EDEFFB";
const TEXT_MAIN = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const JP_FONT = "'Noto Sans JP', sans-serif";
const VERB_COLOR = { fg: "#1A1A2E", bg: "#F3F1F8" };
/** Role label → particles of that car (the を/へ car shows both). */
const STATION_PARTICLE: Record<string, string> = Object.fromEntries(STATIONS.map((st) => [st.role, st.particle]));
const PARTICLES = new Set(["は", "に", "と", "で", "へ", "を", "から", "まで"]);

interface Props {
  onBack: () => void;
  /** Fires when a full session is finished (shared goals check-in). */
  onComplete?: () => void;
}

/** Summary line for an exercise (used for the missed list at the end). */
function summaryOf(ex: TrainExercise): SessionResult["word"] {
  if (ex.type === "choice") return { hiragana: `${ex.prompt} → ${ex.answer}`, romaji: "", meaning: "Partícula y su rol" };
  if (ex.type === "stations") return { hiragana: ex.cards.map((c) => c.label).join(" → "), romaji: "", meaning: "Orden del tren" };
  return { hiragana: ex.cards.map((c) => c.label.replace(/ /g, "")).join(" "), romaji: "", meaning: ex.translation ?? "" };
}

/**
 * "Ordena el tren": a standalone grammar practice for the particle order
 * (は → に → と → で → へ/を → verb). Not tied to a lesson, so it records no Leitner progress.
 */
export default function ParticleOrderGame({ onBack, onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [exercises, setExercises] = useState<TrainExercise[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);

  function start() {
    setExercises(buildTrainSession());
    setIndex(0);
    setResults([]);
    setPhase("playing");
  }

  function record(ex: TrainExercise, correct: boolean) {
    setResults((prev) => [...prev, { word: summaryOf(ex), correct }]);
  }

  function next() {
    if (index + 1 >= exercises.length) {
      setPhase("done");
      onComplete?.();
    } else setIndex(index + 1);
  }

  if (phase === "intro") {
    return (
      <div className="flex flex-col gap-5">
        <button onClick={onBack} className="self-start flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Gramática
        </button>
        <div className="rounded-3xl p-6" style={{ backgroundColor: INDIGO_LIGHT }}>
          <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: INDIGO }}>Práctica · orden de partículas</div>
          <h2 className="text-xl font-bold mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
            🚃 Ordena el tren
          </h2>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: INDIGO_DARK }}>
            Arma el tren de partículas, ordena los pedazos de una oración (tema, tiempo, compañía, lugar…) y
            relaciona cada partícula con su pregunta.
          </p>
          <p className="text-sm mt-3 rounded-xl px-3 py-2 leading-relaxed" style={{ backgroundColor: "#FFFFFF", color: "#5B5470" }}>
            💡 En japonés algunas partes se pueden mover, pero el orden del tren siempre suena natural. Aquí se practica ese orden.
          </p>
        </div>
        <div className="rounded-3xl border-2 p-4" style={{ borderColor: INDIGO_LIGHT }}>
          <ParticleTrain showMnemonic />
        </div>
        <button onClick={start} className="w-full py-3.5 rounded-2xl text-white font-semibold" style={{ backgroundColor: INDIGO }}>
          Comenzar ({TRAIN_SESSION_SIZE} ejercicios)
        </button>
      </div>
    );
  }

  const current = exercises[index];
  if (phase === "done" || !current) {
    return <VocabSessionSummary sessionResults={results} onBack={onBack} />;
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full flex items-center justify-between text-xs" style={{ color: TEXT_SECOND }}>
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>{index + 1} / {exercises.length}</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: INDIGO_LIGHT }}>
        <div className="h-full transition-all" style={{ width: `${(index / exercises.length) * 100}%`, background: `linear-gradient(90deg, ${INDIGO}, ${INDIGO_DARK})` }} />
      </div>
      {current.type === "choice" ? (
        <ChoiceBoard key={index} ex={current} onResult={(ok) => record(current, ok)} onContinue={next} />
      ) : (
        <OrderBoard key={index} ex={current} onResult={(ok) => record(current, ok)} onContinue={next} />
      )}
    </div>
  );
}

// ── Shared pieces ───────────────────────────────────────────────────────────

function Header({ title, subtitle, fox }: { title: string; subtitle: string; fox: string }) {
  return (
    <div className="w-full flex items-end justify-between gap-3">
      <div className="flex-1 min-w-0 rounded-2xl px-4 py-3" style={{ backgroundColor: INDIGO_LIGHT }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: INDIGO }}>{title}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: INDIGO_DARK }}>{subtitle}</p>
      </div>
      <img src={fox} alt="" className="w-16 h-16 object-contain shrink-0" />
    </div>
  );
}

function Feedback({ correct, title, children, onContinue }: { correct: boolean; title: string; children?: React.ReactNode; onContinue: () => void }) {
  return (
    <div className="w-full rounded-2xl px-4 py-3" style={{ backgroundColor: correct ? "#E9F7F1" : "#FDEDEA" }}>
      <p className="text-sm font-bold" style={{ color: correct ? "#0A6E54" : "#C03A1E" }}>{title}</p>
      {children}
      <button
        onClick={onContinue}
        className="mt-3 w-full py-3 rounded-xl text-white font-semibold text-sm"
        style={{ backgroundColor: correct ? "#0A6E54" : INDIGO }}
      >
        CONTINUAR
      </button>
    </div>
  );
}

/** Chunk text with its particles in their train color, e.g. ともだち と. */
function ChunkText({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((t, i) => {
        const color = PARTICLES.has(t) ? particleColor(t) : null;
        return (
          <span key={i} className="mx-[0.1em]" style={color ? { color: color.fg, fontWeight: 700 } : undefined}>{t}</span>
        );
      })}
    </>
  );
}

function cardStyle(card: OrderCard, chunk: boolean): React.CSSProperties {
  const color = card.particle ? particleColor(card.particle) ?? VERB_COLOR : VERB_COLOR;
  // Chunks are white with a colored border so the particle inside stands out;
  // train cars are filled with their color, like in the train diagram.
  return chunk
    ? { backgroundColor: "#FFFFFF", borderColor: color.bg, color: TEXT_MAIN }
    : { backgroundColor: color.bg, borderColor: color.bg, color: color.fg, fontWeight: 700 };
}

// ── Ordering (train cars or sentence chunks) ───────────────────────────────

type OrderStatus = "playing" | "correct" | "reveal";

function OrderBoard({ ex, onResult, onContinue }: { ex: TrainOrderExercise; onResult: (ok: boolean) => void; onContinue: () => void }) {
  const n = ex.cards.length;
  // Shuffled bank; reshuffle until it is not already in order.
  const [bank] = useState(() => {
    let b = shuffle(ex.cards.map((card, id) => ({ id, card })));
    while (n > 1 && b.every((x, i) => x.id === i)) b = shuffle(b);
    return b;
  });
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(n).fill(null));
  const [failures, setFailures] = useState(0);
  const [flash, setFlash] = useState<number[]>([]);
  const [status, setStatus] = useState<OrderStatus>("playing");
  const { speak } = useSpeech();

  const isChunk = ex.type === "chunks";
  const done = status !== "playing";
  const used = new Set(slots.filter((s): s is number => s !== null));
  const fox = status === "correct" ? foxCelebratingImg : status === "reveal" || failures > 0 ? foxSadImg : foxNeutralImg;

  /** `solved`: the order is right now; `counted`: it was right on the first try. */
  function finish(solved: boolean, counted: boolean) {
    setStatus(solved ? "correct" : "reveal");
    onResult(counted);
    if (solved) { playChime(); fireConfetti(); } else { playBuzz(); }
    if (ex.speech) speak(ex.speech);
  }

  function check(filled: number[]) {
    const placed = filled.map((id) => ex.cards[id]);
    const wrong = misplaced(placed, ex.cards);
    if (wrong.length === 0) {
      finish(true, failures === 0);
      return;
    }
    if (failures >= 1) {
      setSlots(ex.cards.map((_, i) => i));
      setFailures(2);
      finish(false, false);
      return;
    }
    // First failure: wrong cars go back to the bank, right ones stay.
    playBuzz();
    setFailures(1);
    setFlash(wrong);
    setSlots(filled.map((id, i) => (wrong.includes(i) ? null : id)));
  }

  function place(id: number) {
    if (done || used.has(id)) return;
    const at = slots.indexOf(null);
    if (at < 0) return;
    const next = [...slots];
    next[at] = id;
    setFlash([]);
    setSlots(next);
    if (next.every((s) => s !== null)) check(next as number[]);
  }

  function unplace(i: number) {
    if (done || slots[i] === null) return;
    const next = [...slots];
    next[i] = null;
    setSlots(next);
  }

  const subtitle = isChunk
    ? ex.translation ?? ""
    : ex.variant === "roles" ? "Ordena los vagones por su rol" : "Ordena los vagones de partículas";

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <Header title={isChunk ? "Ordena la oración" : "Arma el tren"} subtitle={subtitle} fox={fox} />

      <p className="text-xs text-center" style={{ color: TEXT_SECOND }}>
        {isChunk ? "Pon los pedazos en el orden del tren. El verbo va al final." : "Del primer vagón (tema) al último (verbo)."}
      </p>

      {/* Placed cars: a fixed-height vertical train so the bank never jumps while placing. */}
      <ol className="w-full flex flex-col gap-1.5">
        {slots.map((id, i) => {
          const card = id !== null ? ex.cards[id] : null;
          // After answering, label each car with what the chip did not show: the role, or
          // (when the chips were roles) the particle.
          const note = card ? (!isChunk && ex.variant === "roles" ? (card.particle ? STATION_PARTICLE[card.role] ?? card.particle : "〜ます") : card.role) : "";
          return (
            <li key={i} className="flex items-center gap-2">
              <span
                className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ backgroundColor: INDIGO_LIGHT, color: INDIGO_DARK }}
              >
                {i + 1}
              </span>
              <button
                onClick={() => unplace(i)}
                disabled={done || card === null}
                className={`flex-1 min-w-0 h-11 rounded-xl border-2 px-3 text-base text-left whitespace-nowrap overflow-hidden ${card ? "" : "border-dashed"}`}
                style={{
                  fontFamily: JP_FONT,
                  ...(card ? cardStyle(card, isChunk) : { borderColor: "#DBDFF5" }),
                  ...(flash.includes(i) ? { borderColor: "#E85D3A", backgroundColor: "#FFF6F3" } : {}),
                }}
              >
                {card ? (isChunk ? <ChunkText text={card.label} /> : card.label) : ""}
              </button>
              {done && card && (
                <span
                  className={`w-24 shrink-0 font-semibold text-right leading-tight ${!isChunk && ex.variant === "roles" ? "text-sm" : "text-[11px]"}`}
                  style={{ color: card.particle ? particleColor(card.particle)?.fg : TEXT_SECOND }}
                >
                  {note}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {failures === 1 && !done && (
        <p className="text-sm font-semibold" style={{ color: "#C03A1E" }}>❌ Los que estaban mal volvieron abajo. Inténtalo otra vez.</p>
      )}

      {/* Bank */}
      {!done && (
        <div className="w-full flex flex-wrap justify-center gap-2 pt-2 border-t" style={{ borderColor: "#F1EEF7" }}>
          {bank.map(({ id, card }) => {
            const isUsed = used.has(id);
            return (
              <button
                key={id}
                onClick={() => place(id)}
                disabled={isUsed}
                className="h-11 rounded-xl border-2 px-3 text-base whitespace-nowrap transition-all active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                style={{ fontFamily: JP_FONT, ...cardStyle(card, isChunk) }}
              >
                {isChunk ? <ChunkText text={card.label} /> : card.label}
              </button>
            );
          })}
        </div>
      )}

      {done && (
        <Feedback
          correct={status === "correct"}
          title={status === "correct" ? "¡Correcto!" : "Este es el orden del tren:"}
          onContinue={onContinue}
        >
          {isChunk ? (
            <div className="mt-1 flex items-center gap-2">
              <p className="text-base flex-1" style={{ fontFamily: JP_FONT, color: TEXT_MAIN }}>
                {ex.cards.map((c, i) => <span key={i} className="mr-1"><ChunkText text={c.label} /></span>)}
              </p>
              <button onClick={() => ex.speech && speak(ex.speech)} aria-label="Escuchar" className="shrink-0 rounded-full p-2" style={{ backgroundColor: "#FFFFFF", color: INDIGO }}>
                <Volume2 size={16} />
              </button>
            </div>
          ) : (
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "#5B5470" }}>🐊 {TRAIN_MNEMONIC}</p>
          )}
          {status === "correct" && failures > 0 && (
            <p className="text-xs mt-1" style={{ color: TEXT_SECOND }}>Al segundo intento: no cuenta como acierto.</p>
          )}
        </Feedback>
      )}
    </div>
  );
}

// ── Role ⇄ particle ─────────────────────────────────────────────────────────

function ChoiceBoard({ ex, onResult, onContinue }: { ex: TrainChoiceExercise; onResult: (ok: boolean) => void; onContinue: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const correct = selected === ex.answer;
  const fox = !answered ? foxNeutralImg : correct ? foxCelebratingImg : foxSadImg;
  const particleOptions = ex.variant === "roleToParticle";

  function answer(opt: string) {
    if (answered) return;
    setSelected(opt);
    const ok = opt === ex.answer;
    if (ok) { playChime(); fireConfetti(); } else { playBuzz(); }
    onResult(ok);
  }

  const promptColor = ex.promptParticle ? particleColor(ex.promptParticle) : null;

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <Header
        title={particleOptions ? "¿Qué partícula responde?" : "¿Qué rol tiene esta partícula?"}
        subtitle="Piensa en su vagón del tren"
        fox={fox}
      />

      {particleOptions ? (
        <p className="text-xl font-bold text-center" style={{ color: TEXT_MAIN }}>{ex.prompt}</p>
      ) : (
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-bold"
          style={{ fontFamily: JP_FONT, color: promptColor?.fg, backgroundColor: promptColor?.bg }}
        >
          {ex.prompt}
        </div>
      )}

      <div className={`w-full grid gap-2 ${particleOptions ? "grid-cols-3" : "grid-cols-2"}`}>
        {ex.options.map((opt) => {
          const isAnswer = opt === ex.answer;
          const isSelected = opt === selected;
          const color = particleOptions ? particleColor(opt) : null;
          let style: React.CSSProperties = color
            ? { backgroundColor: color.bg, borderColor: color.bg, color: color.fg }
            : { backgroundColor: "#FFFFFF", borderColor: "#EEEEEE", color: TEXT_MAIN };
          if (answered && isAnswer) style = { backgroundColor: "#E9F7F1", borderColor: "#0A6E54", color: "#0A6E54" };
          else if (answered && isSelected) style = { backgroundColor: "#FFEEEA", borderColor: "#E85D3A", color: "#C03A1E" };
          else if (answered) style = { ...style, opacity: 0.5 };
          return (
            <button
              key={opt}
              onClick={() => answer(opt)}
              disabled={answered}
              className={`rounded-2xl border-2 font-bold transition-all active:scale-95 disabled:active:scale-100 ${particleOptions ? "h-14 text-2xl" : "py-3 text-sm"}`}
              style={{ ...style, fontFamily: particleOptions ? JP_FONT : undefined }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <Feedback correct={correct} title={correct ? "¡Correcto!" : `La respuesta es: ${ex.answer}`} onContinue={onContinue}>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: INDIGO_DARK, fontFamily: JP_FONT }}>💡 {ex.why}</p>
        </Feedback>
      )}
    </div>
  );
}
