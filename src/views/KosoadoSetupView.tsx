import { useRef } from "react";
import { ArrowLeft, Play, MessageCircleQuestion, PenLine } from "lucide-react";
import type { ViewName } from "../data";
import type { ProgressItems, VocabSessionLength } from "../types";
import type { KosoadoGameMode } from "../kosoado";
import { KOSOADO_EXERCISES, getKosoadoPool, modesFor, kosoadoNotMasteredCount } from "../kosoado";
import FloatingStartButton from "../components/FloatingStartButton";

const PURPLE       = "#7C4FE0";
const PURPLE_DARK  = "#5A38A8";
const PURPLE_LIGHT = "#F1EAFB";
const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const TEXT_MUTED  = "#AAAAAA";

interface Props {
  progress: ProgressItems;
  kosoadoMode: KosoadoGameMode;
  setKosoadoMode: (m: KosoadoGameMode) => void;
  kosoadoSessionLength: VocabSessionLength;
  setKosoadoSessionLength: (n: VocabSessionLength) => void;
  setView: (v: ViewName) => void;
}

export default function KosoadoSetupView({
  progress,
  kosoadoMode, setKosoadoMode,
  kosoadoSessionLength, setKosoadoSessionLength,
  setView,
}: Props) {
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const modes = modesFor(kosoadoMode);
  const poolSize = getKosoadoPool(modes).length;
  const notMastered = kosoadoNotMasteredCount(progress, modes);
  const sessionSize =
    kosoadoSessionLength === "all" ? poolSize :
    kosoadoSessionLength === "repasar" ? notMastered :
    Math.min(kosoadoSessionLength, poolSize);

  function handleStart() {
    setView("kosoado");
  }

  const MODE_BTN = (m: KosoadoGameMode, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setKosoadoMode(m)}
      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
      style={kosoadoMode === m
        ? { borderColor: PURPLE, backgroundColor: PURPLE_LIGHT, color: PURPLE_DARK }
        : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
      }
    >
      {icon} {label}
    </button>
  );

  const LEN_BTN = (n: VocabSessionLength, label: string, disabled = false) => (
    <button
      key={label}
      disabled={disabled}
      onClick={() => setKosoadoSessionLength(n)}
      className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors disabled:opacity-40"
      style={kosoadoSessionLength === n
        ? { borderColor: PURPLE, backgroundColor: PURPLE_LIGHT, color: PURPLE_DARK }
        : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
      }
    >
      {label}
    </button>
  );

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
        Kosoado
      </h2>
      <p className="text-sm mt-1" style={{ color: TEXT_SECOND }}>
        これ・それ・あれ・どれ y この・その・あの・どの — elegir la forma según la distancia.
      </p>

      <div className="mt-6">
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Tema</span>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {MODE_BTN("re", "これ系 (RE)", <MessageCircleQuestion size={14} />)}
          {MODE_BTN("no", "この系 (NO)", <PenLine size={14} />)}
          {MODE_BTN("both", "Ambos", null)}
        </div>
      </div>

      <div className="mt-6">
        <span className="text-sm font-medium" style={{ color: TEXT_MAIN }}>Preguntas</span>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {LEN_BTN(10, "10")}
          {LEN_BTN(20, "20")}
          {LEN_BTN("all", `Todas (${poolSize})`)}
          {LEN_BTN("repasar", `Repasar (${notMastered})`, notMastered === 0)}
        </div>
      </div>

      <button
        ref={startButtonRef}
        disabled={sessionSize === 0}
        onClick={handleStart}
        className="w-full mt-6 py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ backgroundColor: PURPLE }}
      >
        <Play size={16} /> Comenzar sesión
      </button>
      <p className="text-center text-xs mt-2" style={{ color: TEXT_MUTED }}>
        {sessionSize} pregunta{sessionSize === 1 ? "" : "s"} · {notMastered} sin dominar · {KOSOADO_EXERCISES.length} en total
      </p>

      <FloatingStartButton
        count={sessionSize}
        disabled={sessionSize === 0}
        onClick={handleStart}
        accent={PURPLE}
        targetRef={startButtonRef}
      />
    </div>
  );
}
