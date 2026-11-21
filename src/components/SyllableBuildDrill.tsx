import { useState, useRef, useEffect } from "react";
import { Lightbulb, RotateCcw, Volume2, Turtle } from "lucide-react";
import {
  makePuzzle, isBuildCorrect, wrongSlots, BUILD_LEVELS,
  type GrammarBuildExercise, type BuildLevel, type BuildPuzzle,
} from "../grammarBuild";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import AnswerReveal from "./AnswerReveal";
import foxNeutralImg from "../assets/character/fox-neutral.png";
import foxCelebratingImg from "../assets/character/fox-celebrating.png";
import foxSadImg from "../assets/character/fox-sad.png";

const INDIGO = "#4C5FBF";
const JP_FONT = "'Noto Sans JP', sans-serif";

type Status = "playing" | "wrong" | "correct" | "reveal";

interface Props {
  ex: GrammarBuildExercise;
  level: BuildLevel;
  /** Nivel Fácil: si el usuario lo activó, cada ficha suena al tocarla. */
  speakTiles: boolean;
  /** Se llama UNA vez por ejercicio, al acertar o al agotar los intentos. */
  onResult: (correct: boolean) => void;
  onContinue: () => void;
}

/**
 * «Armar sílaba por sílaba» (Fase 2, docs/GRAMATICA_PLAN.md): se forma la oración
 * tocando fichas de sílabas, sin teclado japonés. Tocar una ficha la pone en la
 * siguiente casilla libre; tocar una casilla la devuelve al banco.
 */
export default function SyllableBuildDrill({ ex, level, speakTiles, onResult, onContinue }: Props) {
  const [puzzle] = useState<BuildPuzzle>(() => makePuzzle(ex, level));
  const [slots, setSlots] = useState<(number | null)[]>(() => puzzle.target.map(() => null));
  const [status, setStatus] = useState<Status>("playing");
  const [failCount, setFailCount] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [wrongMask, setWrongMask] = useState<boolean[]>([]);
  const [anim, setAnim] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { speak } = useSpeech();
  const isDictation = ex.type === "dictation";

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Dictado: la frase suena sola al empezar (el usuario ya tocó «Continuar» o «Comenzar»).
  useEffect(() => {
    if (isDictation) speak(ex.tokens.join(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const boundaries = BUILD_LEVELS[level].boundaries;
  const sentence = ex.tokens.join("");
  const moraOf = (id: number | null) => (id === null ? null : puzzle.tiles[id].mora);
  const used = new Set(slots.filter((s): s is number => s !== null));

  function check(next: (number | null)[], hinted: boolean) {
    const filled = next.map(moraOf) as string[];
    if (isBuildCorrect(filled, ex)) {
      playChime();
      fireConfetti();
      setStatus("correct");
      onResult(!hinted);
      speak(sentence);
      return;
    }
    playBuzz();
    setAnim("error-shake");
    setTimeout(() => setAnim(""), 500);
    const fails = failCount + 1;
    setFailCount(fails);
    if (fails >= 2) {
      setStatus("reveal");
      onResult(false);
      speak(sentence);
      return;
    }
    // 1.er fallo: se marcan en rojo las sílabas mal puestas y luego vuelven al banco.
    const mask = wrongSlots(filled, puzzle.target);
    setWrongMask(mask);
    setStatus("wrong");
    timer.current = setTimeout(() => {
      setSlots(next.map((id, i) => (mask[i] ? null : id)));
      setWrongMask([]);
      setStatus("playing");
    }, 1300);
  }

  function place(next: (number | null)[], hinted = hintUsed) {
    setSlots(next);
    if (next.every((s) => s !== null)) check(next, hinted);
  }

  function tapTile(id: number) {
    if (status !== "playing" || used.has(id)) return;
    const empty = slots.indexOf(null);
    if (empty === -1) return;
    if (speakTiles) speak(puzzle.tiles[id].mora);
    const next = [...slots];
    next[empty] = id;
    place(next);
  }

  function tapSlot(i: number) {
    if (status !== "playing" || slots[i] === null) return;
    const next = [...slots];
    next[i] = null;
    setSlots(next);
  }

  function clearAll() {
    if (status !== "playing") return;
    setSlots(puzzle.target.map(() => null));
  }

  /** Pista: completa la siguiente palabra que no esté bien. El ejercicio deja de contar como acierto. */
  function hint() {
    if (status !== "playing") return;
    let offset = 0;
    for (const word of puzzle.words) {
      const range = word.map((_, k) => offset + k);
      offset += word.length;
      if (range.every((p) => moraOf(slots[p]) === puzzle.target[p])) continue;

      const next = [...slots];
      for (const p of range) {
        const need = puzzle.target[p];
        if (moraOf(next[p]) === need) continue;
        next[p] = null;
        const inUse = new Set(next.filter((s): s is number => s !== null));
        let tile = puzzle.tiles.find((t) => t.mora === need && !inUse.has(t.id));
        if (!tile) {
          // La ficha correcta está en otra casilla mal puesta: se toma de allí.
          const q = next.findIndex((id, j) => !range.includes(j) && moraOf(id) === need && puzzle.target[j] !== need);
          if (q !== -1) { tile = puzzle.tiles[next[q]!]; next[q] = null; }
        }
        if (tile) next[p] = tile.id;
      }
      setHintUsed(true);
      place(next, true);
      return;
    }
  }

  const fox = status === "correct" ? foxCelebratingImg : status === "playing" ? foxNeutralImg : foxSadImg;
  const done = status === "correct" || status === "reveal";

  function slotStyle(i: number): React.CSSProperties {
    const filled = slots[i] !== null;
    if (status === "correct") return { borderColor: "#15C0A0", backgroundColor: "#E3FAF3", color: "#0A6E54" };
    if (status === "reveal") return { borderColor: "#E85D3A", backgroundColor: "#FFEEEA", color: "#C03A1E" };
    if (status === "wrong" && wrongMask[i]) return { borderColor: "#E85D3A", backgroundColor: "#FFEEEA", color: "#C03A1E" };
    if (filled) return { borderColor: INDIGO, backgroundColor: "#EDEFFB", color: "#33408C" };
    return { borderColor: "#D8D2E8", backgroundColor: "#FFFFFF", color: "#D8D2E8" };
  }

  function renderSlot(i: number) {
    // Al revelar se muestra la respuesta correcta en las casillas.
    const text = status === "reveal" ? puzzle.target[i] : moraOf(slots[i]) ?? "";
    return (
      <button
        key={i}
        onClick={() => tapSlot(i)}
        aria-label={text ? `Quitar ${text}` : "Casilla vacía"}
        className="min-w-[2.25rem] h-10 px-1 rounded-lg border-2 text-lg font-medium flex items-center justify-center transition-colors"
        style={{ ...slotStyle(i), fontFamily: JP_FONT }}
      >
        {text}
      </button>
    );
  }

  let offset = 0;
  const groups = puzzle.words.map((word) => {
    const start = offset;
    offset += word.length;
    return word.map((_, k) => start + k);
  });

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="w-full flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0 rounded-2xl px-4 py-3" style={{ backgroundColor: "#EDEFFB" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: INDIGO }}>
            {isDictation ? "Dictado" : "Arma la frase sílaba por sílaba"} · {BUILD_LEVELS[level].label}
          </p>
          {isDictation ? (
            // En el dictado la traducción se ve solo al final: hay que guiarse por el oído.
            <div className="flex flex-wrap gap-2 mt-1.5">
              <button
                onClick={() => speak(sentence)}
                className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: INDIGO }}
              >
                <Volume2 size={13} /> Escuchar
              </button>
              <button
                onClick={() => speak(sentence, 0.5)}
                className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border"
                style={{ borderColor: INDIGO, color: INDIGO }}
              >
                <Turtle size={13} /> Más lento
              </button>
            </div>
          ) : (
            <p className="text-sm font-medium mt-0.5" style={{ color: "#33408C" }}>{ex.translation}</p>
          )}
        </div>
        <img src={fox} alt="" className="w-16 h-16 object-contain shrink-0" />
      </div>

      <div className={`w-full flex flex-wrap justify-center ${boundaries ? "gap-x-3 gap-y-2" : "gap-1"} ${anim}`}>
        {boundaries
          ? groups.map((g, w) => (
              <div key={w} className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: "#F7F6FB" }}>
                {g.map(renderSlot)}
              </div>
            ))
          : groups.flat().map(renderSlot)}
      </div>

      {status === "wrong" && (
        <p className="text-[#C03A1E] font-semibold text-sm">❌ Las sílabas en rojo no van ahí</p>
      )}

      {done && (
        <AnswerReveal
          status={status === "correct" ? "correct" : "wrong"}
          kana={sentence}
          meaning={ex.translation}
          extra={status === "correct" && hintUsed ? "Usaste una pista: no cuenta como acierto, pero ¡ya la tienes!" : undefined}
          onContinue={onContinue}
        />
      )}

      {!done && (
        <>
          <div className="flex flex-wrap gap-2 justify-center px-1">
            {puzzle.tiles.map((t) => {
              const isUsed = used.has(t.id);
              return (
                <button
                  key={t.id}
                  disabled={isUsed || status !== "playing"}
                  onClick={() => tapTile(t.id)}
                  className={`min-w-[2.75rem] h-11 px-2 rounded-xl border-2 text-lg font-medium transition-all select-none
                    ${isUsed
                      ? "opacity-25 cursor-not-allowed border-stone-200 bg-stone-50 text-stone-400"
                      : "border-[#DBDFF5] bg-white text-stone-800 hover:border-[#4C5FBF] hover:bg-[#EDEFFB] active:scale-95"}`}
                  style={{ fontFamily: JP_FONT }}
                >
                  {t.mora}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={hint}
              disabled={status !== "playing"}
              className="flex items-center gap-1 text-xs font-medium hover:opacity-70 disabled:opacity-40"
              style={{ color: INDIGO }}
            >
              <Lightbulb size={13} /> Pista (siguiente palabra)
            </button>
            {slots.some((s) => s !== null) && (
              <button onClick={clearAll} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600">
                <RotateCcw size={12} /> Limpiar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
