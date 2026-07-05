import { ArrowLeft, Target, Repeat, BookOpen } from "lucide-react";
import type { ViewName } from "../data";
import { GOAL, PRINCIPLES, DAILY_ROUTINE, SKILLS_COVERAGE, HONESTY_NOTE, PHASES } from "../content/methodology";

// ── Design tokens (mismo sistema que StatsView/HomeView) ───────────────────

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";

interface Props {
  setView: (v: ViewName) => void;
}

export default function MethodologyView({ setView }: Props) {
  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>

      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
        Cómo estudiar
      </h2>
      <p className="text-sm mt-1" style={{ color: TEXT_SECOND }}>
        La idea detrás de la app y cómo sacarle el máximo provecho.
      </p>

      {/* ── Meta y expectativas ── */}
      <div
        className="relative rounded-3xl p-5 mt-5 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase opacity-80">
          <Target size={13} /> Meta
        </div>
        <p className="text-sm mt-2 leading-relaxed opacity-95">{GOAL.intro}</p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {GOAL.stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-white/15 p-2.5">
              <div className="text-[10px] opacity-80">{s.label}</div>
              <div className="text-xs font-semibold mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3 opacity-90 leading-relaxed">{GOAL.rule}</p>
      </div>

      {/* ── Principios ── */}
      <SectionTitle icon={<Repeat size={14} />}>Por qué funciona el método</SectionTitle>
      <div className="flex flex-col gap-2.5 mt-3">
        {PRINCIPLES.map((p) => (
          <div key={p.title} className="rounded-2xl border p-4" style={{ borderColor: BORDER }}>
            <div className="text-sm font-semibold" style={{ color: TEXT_MAIN }}>{p.title}</div>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: TEXT_SECOND }}>{p.body}</p>
          </div>
        ))}
      </div>

      {/* ── Rutina diaria ── */}
      <SectionTitle icon={<span className="text-sm">⏱️</span>}>
        Tu rutina diaria ({DAILY_ROUTINE.totalTime})
      </SectionTitle>
      <div className="rounded-2xl border mt-3 overflow-hidden" style={{ borderColor: BORDER }}>
        {DAILY_ROUTINE.blocks.map((b, i) => (
          <div
            key={b.block}
            className="flex items-start justify-between gap-3 p-3.5"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${BORDER}` }}
          >
            <div>
              <div className="text-sm font-semibold" style={{ color: TEXT_MAIN }}>{b.block}</div>
              <div className="text-xs mt-0.5" style={{ color: TEXT_SECOND }}>{b.what}</div>
            </div>
            <span
              className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "#F0EAF9", color: PURPLE_DARK }}
            >
              {b.time}
            </span>
          </div>
        ))}
      </div>
      <ul className="flex flex-col gap-1.5 mt-3">
        {DAILY_ROUTINE.rules.map((r) => (
          <li key={r} className="text-xs flex gap-2" style={{ color: TEXT_SECOND }}>
            <span style={{ color: PURPLE }}>•</span> {r}
          </li>
        ))}
      </ul>

      {/* ── Lo que la app cubre y no cubre ── */}
      <SectionTitle icon={<BookOpen size={14} />}>Lo que la app cubre — y lo que no</SectionTitle>
      <div className="flex flex-col gap-2.5 mt-3">
        {SKILLS_COVERAGE.map((s) => (
          <div key={s.skill} className="rounded-2xl border p-4" style={{ borderColor: BORDER }}>
            <div className="text-sm font-semibold" style={{ color: TEXT_MAIN }}>{s.skill}</div>
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="text-xs" style={{ color: TEXT_SECOND }}>
                <span className="font-semibold" style={{ color: "#059669" }}>En la app: </span>
                {s.inApp}
              </div>
              <div className="text-xs" style={{ color: TEXT_SECOND }}>
                <span className="font-semibold" style={{ color: "#D97706" }}>Fuera de la app: </span>
                {s.outsideApp}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl mt-3 p-4" style={{ backgroundColor: "#FFF4E5" }}>
        <p className="text-xs leading-relaxed" style={{ color: "#8A6D1F" }}>{HONESTY_NOTE}</p>
      </div>

      {/* ── Fases del camino ── */}
      <SectionTitle icon={<span className="text-sm">🗺️</span>}>El camino en 4 fases</SectionTitle>
      <div className="flex flex-col gap-2 mt-3">
        {PHASES.map((p) => (
          <div key={p.phase} className="flex items-center justify-between rounded-xl border px-3.5 py-2.5" style={{ borderColor: BORDER }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: TEXT_MAIN }}>{p.phase}</div>
              <div className="text-xs mt-0.5" style={{ color: TEXT_SECOND }}>{p.focus}</div>
            </div>
            <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F0EAF9", color: PURPLE_DARK }}>
              {p.level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-7 text-sm font-semibold" style={{ color: TEXT_MAIN }}>
      <span style={{ color: PURPLE }}>{icon}</span>
      {children}
    </div>
  );
}
