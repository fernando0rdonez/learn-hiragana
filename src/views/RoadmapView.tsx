import { ArrowLeft, CheckCircle2, Circle, Clock, Lock, UserCheck } from "lucide-react";
import type { ProgressItems } from "../types";
import type { ViewName } from "../data";
import { ROADMAP_PHASES, criterionStatus, phaseGateComplete, type GateCriterion, type RoadmapPhase } from "../roadmapGates";
import { summaryMascot } from "../mascot";

const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const TEXT_MUTED  = "#AAAAAA";
const GREEN       = "#059669";
const AMBER       = "#D97706";
const LOCKED_BG   = "#F5F5F5";

interface PhaseTheme { emoji: string; accent: string; accentDark: string; tint: string }

const PHASE_THEME: Record<string, PhaseTheme> = {
  kana:          { emoji: "あ",  accent: "#7B4FD4", accentDark: "#5533A8", tint: "#F7F4FD" },
  fundamentos:   { emoji: "🌱", accent: "#E85D3A", accentDark: "#C03A1E", tint: "#FFF3EE" },
  consolidacion: { emoji: "🌿", accent: "#2F6FE4", accentDark: "#1D4FB0", tint: "#EEF3FE" },
  independencia: { emoji: "🏆", accent: "#B3261E", accentDark: "#7A1A15", tint: "#FBEAEA" },
};

interface Props {
  progress: ProgressItems;
  setView: (v: ViewName) => void;
}

function heroCaption(completedCount: number, activePhase: RoadmapPhase | undefined): string {
  if (completedCount >= ROADMAP_PHASES.length) return "¡Meta cumplida! Ya deberías estar listo para el N3.";
  if (completedCount === 0) return `Construyendo la base — ${activePhase?.title ?? ""} es el primer escalón.`;
  const fases = completedCount === 1 ? "1 fase cumplida" : `${completedCount} fases cumplidas`;
  return `${fases} — ahora toca ${activePhase?.title ?? ""}.`;
}

export default function RoadmapView({ progress, setView }: Props) {
  const activeIdx = ROADMAP_PHASES.findIndex((phase) => !phaseGateComplete(phase, progress));
  const completedCount = activeIdx === -1 ? ROADMAP_PHASES.length : activeIdx;
  const activePhase = activeIdx === -1 ? undefined : ROADMAP_PHASES[activeIdx];
  const heroPct = Math.round((completedCount / ROADMAP_PHASES.length) * 100);
  const heroTheme = PHASE_THEME[activePhase?.id ?? ROADMAP_PHASES[ROADMAP_PHASES.length - 1].id];

  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>

      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
        Camino a B1
      </h2>

      {/* ── Hero: mascota + resumen del viaje ── */}
      <div
        className="relative rounded-3xl pt-5 px-5 pb-8 mt-4 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${heroTheme.accent}, ${heroTheme.accentDark})`, overflow: "visible" }}
      >
        <div className="text-[11px] font-semibold tracking-wide uppercase opacity-80">Tu viaje</div>
        <div className="flex items-end justify-between mt-1 pr-20">
          <div>
            <div className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {completedCount}/{ROADMAP_PHASES.length} fases cumplidas
            </div>
            <div className="text-sm opacity-90 mt-1.5 max-w-[220px]">{heroCaption(completedCount, activePhase)}</div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {ROADMAP_PHASES.map((phase, idx) => {
            const done = idx < completedCount;
            const isCurrent = idx === activeIdx;
            return (
              <div
                key={phase.id}
                className="flex-1 h-2 rounded-full"
                style={{
                  backgroundColor: done ? "white" : isCurrent ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.25)",
                }}
              />
            );
          })}
        </div>

        <img
          src={summaryMascot(heroPct)}
          alt=""
          className="absolute pointer-events-none select-none"
          style={{ width: 84, height: "auto", bottom: -18, right: 10, zIndex: 2 }}
        />
      </div>

      {/* ── Camino de fases ── */}
      <div className="flex flex-col mt-2">
        {ROADMAP_PHASES.map((phase, idx) => {
          const complete = phaseGateComplete(phase, progress);
          const isActive = idx === activeIdx;
          const isLast = idx === ROADMAP_PHASES.length - 1;
          const theme = PHASE_THEME[phase.id];

          return (
            <div key={phase.id} className="flex gap-3.5 items-stretch">
              {/* ── Columna del "mapa": nodo + línea conectora ── */}
              <div className="flex flex-col items-center pt-6">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    background: complete
                      ? GREEN
                      : isActive
                      ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`
                      : LOCKED_BG,
                  }}
                >
                  {complete ? (
                    <CheckCircle2 size={19} className="text-white" />
                  ) : isActive ? (
                    <span className="text-base" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{theme.emoji}</span>
                  ) : (
                    <Lock size={15} style={{ color: TEXT_MUTED }} />
                  )}
                </div>
                {!isLast && (
                  <div
                    className="w-1 flex-1 my-1 rounded-full"
                    style={{ backgroundColor: complete ? theme.accent : "#E5E5E5", minHeight: 28 }}
                  />
                )}
              </div>

              {/* ── Tarjeta de la fase ── */}
              <div
                className="flex-1 rounded-3xl border p-5 mb-4"
                style={{
                  borderColor: complete ? GREEN : isActive ? theme.accent : BORDER,
                  backgroundColor: complete ? "#ECFDF5" : isActive ? theme.tint : "#FFFFFF",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-bold" style={{ color: TEXT_MAIN }}>{phase.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: TEXT_SECOND }}>{phase.level} · {phase.duration}</div>
                  </div>
                  {complete ? (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: GREEN, color: "white" }}>
                      <CheckCircle2 size={13} /> Cumplida
                    </span>
                  ) : isActive ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 text-white" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})` }}>
                      En curso
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: LOCKED_BG, color: TEXT_MUTED }}>
                      <Lock size={12} /> Bloqueada
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  {phase.criteria.map((criterion) => (
                    <CriterionRow key={criterion.label} criterion={criterion} progress={progress} accent={theme.accent} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CriterionRow({ criterion, progress, accent }: { criterion: GateCriterion; progress: ProgressItems; accent: string }) {
  if (!criterion.compute) {
    return (
      <div className="flex items-start gap-2.5">
        <UserCheck size={15} className="shrink-0 mt-0.5" style={{ color: TEXT_MUTED }} />
        <div>
          <div className="text-xs font-medium" style={{ color: TEXT_MAIN }}>{criterion.label}</div>
          <div className="text-[11px] mt-0.5" style={{ color: TEXT_SECOND }}>{criterion.manualHint}</div>
        </div>
      </div>
    );
  }

  const result = criterion.compute(progress);
  const status = criterionStatus(result);
  const isPct  = result.unit === "%";

  if (status === "upcoming") {
    return (
      <div className="flex items-start gap-2.5">
        <Clock size={15} className="shrink-0 mt-0.5" style={{ color: TEXT_MUTED }} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium" style={{ color: TEXT_MAIN }}>{criterion.label}</div>
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F5F5F5", color: TEXT_MUTED }}>
              Próximamente
            </span>
          </div>
          {criterion.note && <div className="text-[11px] mt-0.5" style={{ color: TEXT_SECOND }}>{criterion.note}</div>}
        </div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((result.current / result.target) * 100));
  const availablePct = status === "content-blocked" ? Math.min(100, Math.round((result.available / result.target) * 100)) : 100;
  const barColor = status === "met" ? GREEN : status === "content-blocked" ? AMBER : accent;
  const icon = status === "met" ? <CheckCircle2 size={15} style={{ color: GREEN }} /> : <Circle size={15} style={{ color: status === "content-blocked" ? AMBER : accent }} />;

  return (
    <div className="flex items-start gap-2.5">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-medium" style={{ color: TEXT_MAIN }}>{criterion.label}</div>
          <div className="text-[11px] font-semibold shrink-0" style={{ color: TEXT_SECOND }}>
            {isPct ? `${result.current}/${result.target}%` : `${result.current}/${result.target}`}
          </div>
        </div>
        <div className="relative w-full h-1.5 rounded-full overflow-hidden mt-1.5" style={{ backgroundColor: "#F0EAF9" }}>
          {status === "content-blocked" && (
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${availablePct}%`,
                backgroundImage: "repeating-linear-gradient(135deg, #E9E4F5 0 4px, #F0EAF9 4px 8px)",
              }}
            />
          )}
          <div
            className="h-full rounded-full relative"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
        {status === "content-blocked" && criterion.note && (
          <div className="text-[11px] mt-1" style={{ color: AMBER }}>
            {result.available}/{result.target} disponibles hoy — {criterion.note}
          </div>
        )}
      </div>
    </div>
  );
}
