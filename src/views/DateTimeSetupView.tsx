import { useRef, useState } from "react";
import { ArrowLeft, Play, Eye, PenLine, Blocks } from "lucide-react";
import type { ViewName } from "../data";
import type { ProgressItems, CharStatus } from "../types";
import type { TimeBuildLevel } from "../dateTime";
import { KEY_HOURS, KEY_MINUTE_UNITS, TIME_BUILD_LEVELS, hourKeyStatus, minuteKeyStatus } from "../dateTime";
import FloatingStartButton from "../components/FloatingStartButton";

// ── Design tokens (gris pizarra es el color del módulo Fechas y Horas) ──────

const SLATE       = "#475569";
const SLATE_DARK  = "#334155";
const SLATE_LIGHT = "#F1F5F9";
const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";

const STATUS_STYLES: Record<CharStatus, { backgroundColor: string; borderColor: string; color: string }> = {
  untested:   { backgroundColor: "#FFFFFF", borderColor: BORDER,      color: TEXT_SECOND },
  developing: { backgroundColor: SLATE_LIGHT, borderColor: "#CBD5E1", color: SLATE_DARK },
  weak:       { backgroundColor: "#FFEEEA", borderColor: "#F0C4B4",   color: "#C03A1E" },
  mastered:   { backgroundColor: "#E3FAF3", borderColor: "#9FE3D2",   color: "#0A6E54" },
};

export type DateTimeGameMode = "recognize" | "write" | "build";

interface Props {
  progress: ProgressItems;
  buildLevel: TimeBuildLevel;
  setBuildLevel: (l: TimeBuildLevel) => void;
  setView: (v: ViewName) => void;
}

export default function DateTimeSetupView({ progress, buildLevel, setBuildLevel, setView }: Props) {
  const [gameMode, setGameMode] = useState<DateTimeGameMode>("recognize");
  const startButtonRef = useRef<HTMLButtonElement>(null);

  function handleStart() {
    if (gameMode === "recognize") setView("dateTimeRecognize");
    else if (gameMode === "write") setView("dateTimeWrite");
    else setView("dateTimeBuild");
  }

  const modeButtonStyle = (active: boolean): React.CSSProperties =>
    active
      ? { borderColor: SLATE, backgroundColor: SLATE_LIGHT, color: SLATE_DARK }
      : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND };

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
        Fechas y Horas
      </h2>
      <p className="text-sm mt-1" style={{ color: TEXT_SECOND }}>
        Aprende a decir y reconocer la hora en japonés — horas, minutos y am/pm.
      </p>

      {/* ── Modo ── */}
      <div className="mt-6">
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Modo</span>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button
            onClick={() => setGameMode("recognize")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={modeButtonStyle(gameMode === "recognize")}
          >
            <Eye size={14} /> Reconocer
          </button>
          <button
            onClick={() => setGameMode("write")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={modeButtonStyle(gameMode === "write")}
          >
            <PenLine size={14} /> Escribir
          </button>
          <button
            onClick={() => setGameMode("build")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={modeButtonStyle(gameMode === "build")}
          >
            <Blocks size={14} /> Construir
          </button>
        </div>
      </div>

      {/* ── Construir: nivel de dificultad ── */}
      {gameMode === "build" && (
        <div className="mt-6">
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Dificultad</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {TIME_BUILD_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setBuildLevel(level.id)}
                className="py-3 rounded-xl border-2 text-sm font-medium transition-colors"
                style={modeButtonStyle(buildLevel === level.id)}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameMode === "recognize" && (
        <p className="text-sm mt-6 rounded-xl p-4" style={{ backgroundColor: SLATE_LIGHT, color: SLATE_DARK }}>
          Verás una lectura en hiragana y elegirás la hora correcta entre 4 opciones parecidas.
        </p>
      )}

      {gameMode === "write" && (
        <p className="text-sm mt-6 rounded-xl p-4" style={{ backgroundColor: SLATE_LIGHT, color: SLATE_DARK }}>
          Verás una hora y escribirás su lectura completa en hiragana.
        </p>
      )}

      {/* ── Tabla de estudio ── */}
      <div className="mt-6">
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>
          Horas <span className="normal-case font-normal">(★ = pronunciación irregular)</span>
        </span>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {KEY_HOURS.map((h) => {
            const status = hourKeyStatus(progress, h.value);
            const style = STATUS_STYLES[status];
            return (
              <span
                key={h.value}
                className="flex flex-col items-center px-2.5 py-1.5 rounded-lg border-2 min-w-16"
                style={h.irregular ? { ...style, borderColor: SLATE } : style}
              >
                <span className="text-[11px] font-semibold">{h.irregular ? "★ " : ""}{h.value}</span>
                <span className="text-sm" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{h.hiragana}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>
          Minutos <span className="normal-case font-normal">(★ = pronunciación irregular)</span>
        </span>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {KEY_MINUTE_UNITS.map((m) => {
            const status = minuteKeyStatus(progress, m.value);
            const style = STATUS_STYLES[status];
            return (
              <span
                key={m.value}
                className="flex flex-col items-center px-2.5 py-1.5 rounded-lg border-2 min-w-16"
                style={m.irregular ? { ...style, borderColor: SLATE } : style}
              >
                <span className="text-[11px] font-semibold">{m.irregular ? "★ " : ""}{m.value}</span>
                <span className="text-sm" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{m.hiragana}</span>
              </span>
            );
          })}
        </div>
      </div>

      <button
        ref={startButtonRef}
        onClick={handleStart}
        className="w-full mt-6 py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
        style={{ backgroundColor: SLATE }}
      >
        <Play size={16} /> Comenzar sesión
      </button>

      <FloatingStartButton
        count={10}
        disabled={false}
        onClick={handleStart}
        accent={SLATE}
        targetRef={startButtonRef}
      />
    </div>
  );
}
