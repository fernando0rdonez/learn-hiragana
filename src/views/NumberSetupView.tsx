import { useState, useRef } from "react";
import { ArrowLeft, Play, Eye, PenLine, Hash, Lock } from "lucide-react";
import type { ViewName } from "../data";
import type { ProgressItems, CharStatus } from "../types";
import type { BuildLevel } from "../numbers";
import {
  KEY_NUMBER_GROUPS,
  BUILD_LEVELS,
  numberKeyStatus,
  buildLevelUnlocked,
} from "../numbers";
import FloatingStartButton from "../components/FloatingStartButton";

// ── Design tokens (ámbar es el color del módulo Números) ────────────────────

const AMBER       = "#F5A623";
const AMBER_DARK  = "#C77F00";
const AMBER_LIGHT = "#FFF4E5";
const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const TEXT_MUTED  = "#AAAAAA";

const STATUS_STYLES: Record<CharStatus, { backgroundColor: string; borderColor: string; color: string }> = {
  untested:   { backgroundColor: "#FFFFFF", borderColor: BORDER,    color: TEXT_SECOND },
  developing: { backgroundColor: AMBER_LIGHT, borderColor: "#F0D9B0", color: AMBER_DARK },
  weak:       { backgroundColor: "#FFEEEA", borderColor: "#F0C4B4", color: "#C03A1E" },
  mastered:   { backgroundColor: "#E3FAF3", borderColor: "#9FE3D2", color: "#0A6E54" },
};

export type NumberGameMode = "keys" | "build" | "count";
export type NumberKeysLength = 10 | 20 | "all";

interface Props {
  progress: ProgressItems;
  selectedGroups: Set<string>;
  toggleGroup: (id: string) => void;
  keysLength: NumberKeysLength;
  setKeysLength: (n: NumberKeysLength) => void;
  buildLevel: BuildLevel;
  setBuildLevel: (l: BuildLevel) => void;
  setView: (v: ViewName) => void;
}

export default function NumberSetupView({
  progress,
  selectedGroups, toggleGroup,
  keysLength, setKeysLength,
  buildLevel, setBuildLevel,
  setView,
}: Props) {
  const [gameMode, setGameMode] = useState<NumberGameMode>("keys");
  const startButtonRef = useRef<HTMLButtonElement>(null);

  const selectedNumbers = KEY_NUMBER_GROUPS
    .filter((g) => selectedGroups.has(g.id))
    .flatMap((g) => g.numbers);

  const selectedBuildLevel = BUILD_LEVELS.find((l) => l.id === buildLevel)!;
  const buildUnlocked = buildLevelUnlocked(progress, selectedBuildLevel);

  const canStart =
    gameMode === "keys" ? selectedNumbers.length > 0 :
    gameMode === "build" ? buildUnlocked :
    true;

  const startCount =
    gameMode === "keys" ? Math.min(keysLength === "all" ? selectedNumbers.length : keysLength, selectedNumbers.length) : 10;

  function handleStart() {
    if (!canStart) return;
    if (gameMode === "keys") setView("numberKeys");
    else if (gameMode === "build") setView("numberBuild");
    else setView("countIt");
  }

  const modeButtonStyle = (active: boolean): React.CSSProperties =>
    active
      ? { borderColor: AMBER, backgroundColor: AMBER_LIGHT, color: AMBER_DARK }
      : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND };

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
        Números
      </h2>
      <p className="text-sm mt-1" style={{ color: TEXT_SECOND }}>
        Domina los números clave y forma cualquier cifra en hiragana.
      </p>

      {/* ── Modo ── */}
      <div className="mt-6">
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Modo</span>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button
            onClick={() => setGameMode("keys")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={modeButtonStyle(gameMode === "keys")}
          >
            <Eye size={14} /> Claves
          </button>
          <button
            onClick={() => setGameMode("build")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={modeButtonStyle(gameMode === "build")}
          >
            <PenLine size={14} /> Formar
          </button>
          <button
            onClick={() => setGameMode("count")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={modeButtonStyle(gameMode === "count")}
          >
            <Hash size={14} /> Contar
          </button>
        </div>
      </div>

      {/* ── Claves: grupos + tabla de estudio ── */}
      {gameMode === "keys" && (
        <>
          <div className="mt-6">
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Grupos</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {KEY_NUMBER_GROUPS.map((group) => {
                const isSelected = selectedGroups.has(group.id);
                const mastered = group.numbers.filter((k) => numberKeyStatus(progress, k.value) === "mastered").length;
                return (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className="text-left rounded-2xl border-2 p-3 transition-colors"
                    style={isSelected
                      ? { backgroundColor: AMBER_LIGHT, borderColor: AMBER }
                      : { backgroundColor: "#FFFFFF", borderColor: BORDER }
                    }
                  >
                    <div className="text-sm font-semibold" style={{ color: isSelected ? AMBER_DARK : TEXT_MAIN }}>
                      {group.label}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: isSelected ? AMBER_DARK : TEXT_SECOND }}>
                      {mastered}/{group.numbers.length} dominados
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabla de estudio — los 5 irregulares llevan ★ y borde ámbar */}
          {selectedNumbers.length > 0 && (
            <div className="mt-5">
              <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>
                Tabla de estudio <span className="normal-case font-normal">(★ = pronunciación irregular)</span>
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedNumbers.map((k) => {
                  const status = numberKeyStatus(progress, k.value);
                  const style = STATUS_STYLES[status];
                  return (
                    <span
                      key={k.value}
                      className="flex flex-col items-center px-2.5 py-1.5 rounded-lg border-2 min-w-16"
                      style={k.irregular ? { ...style, borderColor: AMBER } : style}
                    >
                      <span className="text-[11px] font-semibold">
                        {k.irregular ? "★ " : ""}{k.value.toLocaleString("es")}
                      </span>
                      <span className="text-sm" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{k.hiragana}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preguntas */}
          <div className="mt-5">
            <span className="text-sm font-medium" style={{ color: TEXT_MAIN }}>Preguntas</span>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {([10, 20, "all"] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setKeysLength(n)}
                  className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors"
                  style={modeButtonStyle(keysLength === n)}
                >
                  {n === "all" ? `Todos (${selectedNumbers.length})` : n}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Formar: nivel de dificultad con desbloqueo ── */}
      {gameMode === "build" && (
        <div className="mt-6">
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Dificultad</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {BUILD_LEVELS.map((level) => {
              const unlocked = buildLevelUnlocked(progress, level);
              const isSelected = buildLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => setBuildLevel(level.id)}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 text-sm font-medium transition-colors"
                  style={{
                    ...modeButtonStyle(isSelected),
                    opacity: unlocked ? 1 : 0.5,
                  }}
                >
                  {!unlocked && <Lock size={13} />}
                  {level.label}
                </button>
              );
            })}
          </div>
          {!buildUnlocked && (
            <p className="text-xs mt-3 rounded-xl p-3" style={{ backgroundColor: AMBER_LIGHT, color: AMBER_DARK }}>
              🔒 {selectedBuildLevel.requireMastered
                ? "Para formar números con まん primero domina los millares (1000–9000) en el modo Claves."
                : "Primero practica los números clave de esta magnitud en el modo Claves — reconocer antes de formar."}
            </p>
          )}
          {buildUnlocked && (
            <p className="text-xs mt-3" style={{ color: TEXT_MUTED }}>
              Se te mostrará una cifra (p. ej. 4638) y la formarás con bloques en hiragana. Los irregulares aparecen más a menudo.
            </p>
          )}
        </div>
      )}

      {/* ── Contar ── */}
      {gameMode === "count" && (
        <p className="text-sm mt-6 rounded-xl p-4" style={{ backgroundColor: AMBER_LIGHT, color: AMBER_DARK }}>
          Cuenta los objetos de la imagen y elige el número correcto en hiragana (1–10).
        </p>
      )}

      <button
        ref={startButtonRef}
        disabled={!canStart}
        onClick={handleStart}
        className="w-full mt-6 py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ backgroundColor: AMBER }}
      >
        <Play size={16} /> Comenzar sesión
      </button>

      <FloatingStartButton
        count={startCount}
        disabled={!canStart}
        onClick={handleStart}
        accent={AMBER}
        targetRef={startButtonRef}
      />
    </div>
  );
}
