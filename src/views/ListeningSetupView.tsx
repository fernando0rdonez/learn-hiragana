import { useRef, useState } from "react";
import { ArrowLeft, Play, Headphones, PenLine } from "lucide-react";
import type { ViewName } from "../data";
import type { ProgressItems, VocabSessionLength } from "../types";
import { LISTENING_SENTENCES } from "../listening";
import { notMasteredListening, resolveListeningSession } from "../utils";
import FloatingStartButton from "../components/FloatingStartButton";

// ── Design tokens (cian es el color del módulo Listening) ───────────────────

const CYAN       = "#0891B2";
const CYAN_DARK  = "#0E7490";
const CYAN_LIGHT = "#E0F7FA";
const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const TEXT_MUTED  = "#AAAAAA";

export type ListeningGameMode = "comprehension" | "dictation";

interface Props {
  progress: ProgressItems;
  listeningSessionLength: VocabSessionLength;
  setListeningSessionLength: (n: VocabSessionLength) => void;
  setView: (v: ViewName) => void;
}

function viewForMode(mode: ListeningGameMode): ViewName {
  return mode === "dictation" ? "listeningDictation" : "listeningComprehension";
}

export default function ListeningSetupView({
  progress,
  listeningSessionLength, setListeningSessionLength,
  setView,
}: Props) {
  const [gameMode, setGameMode] = useState<ListeningGameMode>("comprehension");
  const startButtonRef = useRef<HTMLButtonElement>(null);

  const notMastered = notMasteredListening(progress, LISTENING_SENTENCES);
  const { limit: sessionSize } = resolveListeningSession(LISTENING_SENTENCES, listeningSessionLength, progress);

  function handleStart() {
    setView(viewForMode(gameMode));
  }

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
        Listening
      </h2>
      <p className="text-sm mt-1" style={{ color: TEXT_SECOND }}>
        Del oído por palabra al oído por oración: escucha y comprende frases completas.
      </p>

      {/* ── Modo ── */}
      <div className="mt-6">
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Modo</span>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => setGameMode("comprehension")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={gameMode === "comprehension"
              ? { borderColor: CYAN, backgroundColor: CYAN_LIGHT, color: CYAN_DARK }
              : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
            }
          >
            <Headphones size={14} /> Comprensión
          </button>
          <button
            onClick={() => setGameMode("dictation")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={gameMode === "dictation"
              ? { borderColor: CYAN, backgroundColor: CYAN_LIGHT, color: CYAN_DARK }
              : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
            }
          >
            <PenLine size={14} /> Dictado
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: TEXT_MUTED }}>
          {gameMode === "comprehension"
            ? "Escucha la frase (hasta 3 veces) y elige su traducción entre 4 opciones."
            : "Escucha la frase (hasta 3 veces) y escríbela en kana."}
        </p>
      </div>

      {/* Preguntas */}
      <div className="mt-6">
        <span className="text-sm font-medium" style={{ color: TEXT_MAIN }}>Frases</span>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {([10, 20] as const).map((n) => (
            <button
              key={n}
              onClick={() => setListeningSessionLength(n)}
              className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors"
              style={listeningSessionLength === n
                ? { borderColor: CYAN, backgroundColor: CYAN_LIGHT, color: CYAN_DARK }
                : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
              }
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setListeningSessionLength("all")}
            className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors"
            style={listeningSessionLength === "all"
              ? { borderColor: CYAN, backgroundColor: CYAN_LIGHT, color: CYAN_DARK }
              : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
            }
          >
            Todas ({LISTENING_SENTENCES.length})
          </button>
          <button
            disabled={notMastered.length === 0}
            onClick={() => setListeningSessionLength("repasar")}
            className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors disabled:opacity-40"
            style={listeningSessionLength === "repasar"
              ? { borderColor: CYAN, backgroundColor: CYAN_LIGHT, color: CYAN_DARK }
              : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
            }
          >
            Repasar ({notMastered.length})
          </button>
        </div>
      </div>

      <button
        ref={startButtonRef}
        disabled={sessionSize === 0}
        onClick={handleStart}
        className="w-full mt-6 py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ backgroundColor: CYAN }}
      >
        <Play size={16} /> Comenzar sesión
      </button>
      <p className="text-center text-xs mt-2" style={{ color: TEXT_MUTED }}>
        {sessionSize} frase{sessionSize === 1 ? "" : "s"} · {notMastered.length} sin dominar
      </p>

      <FloatingStartButton
        count={sessionSize}
        disabled={sessionSize === 0}
        onClick={handleStart}
        accent={CYAN}
        targetRef={startButtonRef}
      />
    </div>
  );
}
