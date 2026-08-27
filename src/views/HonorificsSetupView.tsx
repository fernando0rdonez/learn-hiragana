import { useRef } from "react";
import { ArrowLeft, Play, Handshake, Users } from "lucide-react";
import type { ViewName } from "../data";
import type { ProgressItems, VocabSessionLength } from "../types";
import type { HonorificGameMode } from "../honorifics";
import { HONORIFIC_EXERCISES, getHonorificPool, modesFor, honorificNotMasteredCount } from "../honorifics";
import FloatingStartButton from "../components/FloatingStartButton";

const TEAL       = "#0E9488";
const TEAL_DARK  = "#0B6E66";
const TEAL_LIGHT = "#E1F5F2";
const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const TEXT_MUTED  = "#AAAAAA";

interface Props {
  progress: ProgressItems;
  honorificMode: HonorificGameMode;
  setHonorificMode: (m: HonorificGameMode) => void;
  honorificSessionLength: VocabSessionLength;
  setHonorificSessionLength: (n: VocabSessionLength) => void;
  setView: (v: ViewName) => void;
}

export default function HonorificsSetupView({
  progress,
  honorificMode, setHonorificMode,
  honorificSessionLength, setHonorificSessionLength,
  setView,
}: Props) {
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const modes = modesFor(honorificMode);
  const poolSize = getHonorificPool(modes).length;
  const notMastered = honorificNotMasteredCount(progress, modes);
  const sessionSize =
    honorificSessionLength === "all" ? poolSize :
    honorificSessionLength === "repasar" ? notMastered :
    Math.min(honorificSessionLength, poolSize);

  function handleStart() {
    setView("honorifics");
  }

  const MODE_BTN = (m: HonorificGameMode, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setHonorificMode(m)}
      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
      style={honorificMode === m
        ? { borderColor: TEAL, backgroundColor: TEAL_LIGHT, color: TEAL_DARK }
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
      onClick={() => setHonorificSessionLength(n)}
      className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors disabled:opacity-40"
      style={honorificSessionLength === n
        ? { borderColor: TEAL, backgroundColor: TEAL_LIGHT, color: TEAL_DARK }
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
        Trato y Honoríficos
      </h2>
      <p className="text-sm mt-1" style={{ color: TEXT_SECOND }}>
        Sufijos さん・ちゃん・くん・さま y la familia humilde ↔ honorífica.
      </p>

      <div className="mt-6">
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Tema</span>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {MODE_BTN("suffix", "Sufijos", <Handshake size={14} />)}
          {MODE_BTN("family", "Familia", <Users size={14} />)}
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
        style={{ backgroundColor: TEAL }}
      >
        <Play size={16} /> Comenzar sesión
      </button>
      <p className="text-center text-xs mt-2" style={{ color: TEXT_MUTED }}>
        {sessionSize} pregunta{sessionSize === 1 ? "" : "s"} · {notMastered} sin dominar · {HONORIFIC_EXERCISES.length} en total
      </p>

      <FloatingStartButton
        count={sessionSize}
        disabled={sessionSize === 0}
        onClick={handleStart}
        accent={TEAL}
        targetRef={startButtonRef}
      />
    </div>
  );
}
