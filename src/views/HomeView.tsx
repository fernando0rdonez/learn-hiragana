import { useState } from "react";
import { BarChart3, Trash2, ChevronRight, Flame, BookOpen, Mic, PenLine, Hash } from "lucide-react";
import type { StreakData } from "../types";
import type { ViewName } from "../data";
import { ALL_CHARS } from "../data";
import { KATAKANA_ALL_CHARS } from "../dataKatakana";
import { VOCABULARY, VOCAB_CATEGORIES } from "../vocabulary";
import { KEY_NUMBERS } from "../numbers";
import foxImg from "../assets/character/fox-neutral.png";

interface Props {
  streak: StreakData;
  masteredTotal: number;
  masteredKataTotal: number;
  masteredNumberKeys: number;
  saveError: boolean;
  resetConfirm: boolean;
  setResetConfirm: (v: boolean) => void;
  resetProgress: () => void;
  setView: (v: ViewName) => void;
}

// ── Module visual config ────────────────────────────────────────────────────

type ModuleId = "hiragana" | "vocab";
const LAST_USED_MODULE_KEY = "lastUsedModule";

const HERO_GRADIENT: Record<ModuleId, string> = {
  hiragana: "linear-gradient(135deg, #7B4FD4, #5533A8)",
  vocab: "linear-gradient(135deg, #E85D3A, #C03A1E)",
};

function readLastUsedModule(): { moduleId: ModuleId; wasStored: boolean } {
  const stored = localStorage.getItem(LAST_USED_MODULE_KEY);
  if (stored === "hiragana" || stored === "vocab") return { moduleId: stored, wasStored: true };
  return { moduleId: "hiragana", wasStored: false };
}

export default function HomeView({ streak, masteredTotal, masteredKataTotal, masteredNumberKeys, saveError, resetConfirm, setResetConfirm, resetProgress, setView }: Props) {
  const [{ moduleId: heroModule, wasStored }] = useState(readLastUsedModule);

  function goTo(view: ViewName, moduleId?: ModuleId) {
    if (moduleId) localStorage.setItem(LAST_USED_MODULE_KEY, moduleId);
    setView(view);
  }

  const hiraganaPct = Math.round((masteredTotal / ALL_CHARS.length) * 100);

  return (
    <div className="pb-24">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <span style={{ color: "#1A1A2E" }}>にほん</span>
          <span style={{ color: "#7B4FD4" }}>go</span>
        </h1>
        <span
          className="flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full"
          style={{ backgroundColor: "#FFF4E5", color: "#F5A623" }}
        >
          <Flame size={14} />
          {streak.current} día{streak.current === 1 ? "" : "s"}
        </span>
      </div>

      {/* ── Hero card ── */}
      <div
        className="relative mt-6 rounded-3xl pt-6 px-6 pb-20 text-white shadow-lg"
        style={{ background: HERO_GRADIENT[heroModule], overflow: "visible", zIndex: 1 }}
      >
        <div className="text-xs font-semibold tracking-wide uppercase opacity-80">
          {wasStored ? "Último módulo" : "Empieza aquí"}
        </div>

        {heroModule === "hiragana" ? (
          <>
            <div className="flex items-start justify-between mt-2">
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Hiragana</div>
                <div className="text-sm opacity-90 mt-1">{masteredTotal} de {ALL_CHARS.length} caracteres dominados</div>
              </div>
              <span className="text-4xl shrink-0" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>あ</span>
            </div>

            <div className="w-full h-2 bg-white/25 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${hiraganaPct}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs opacity-80">
              <span>{hiraganaPct}% completado</span>
              <span>{ALL_CHARS.length - masteredTotal} por aprender</span>
            </div>

            <button
              onClick={() => goTo("hiraganaSetup", "hiragana")}
              className="mt-4 flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              <span className="text-[10px]">▶</span> Comenzar sesión
            </button>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between mt-2">
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Vocabulario</div>
                <div className="text-sm opacity-90 mt-1">{VOCABULARY.length} palabras · {VOCAB_CATEGORIES.length} categorías</div>
              </div>
              <span className="shrink-0 w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <BookOpen size={22} />
              </span>
            </div>

            <button
              onClick={() => goTo("vocabCategory", "vocab")}
              className="mt-5 flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              <span className="text-[10px]">▶</span> Comenzar sesión
            </button>
          </>
        )}

        <img
          src={foxImg}
          alt=""
          className="absolute pointer-events-none select-none"
          style={{ width: 130, height: "auto", bottom: -65, right: 12, zIndex: 2 }}
        />
      </div>

      {/* ── Secondary modules ── */}
      <div className="mt-8">
        <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#8B7FA8" }}>Tus módulos</div>

        <div className="mt-3 flex flex-col gap-3">
          {heroModule === "vocab" && (
            <ModuleCard
              bg="#EDE7F9" border="#7B4FD4"
              icon={<span className="text-xl" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>あ</span>}
              title="Hiragana"
              subtitle={`${masteredTotal} de ${ALL_CHARS.length} caracteres dominados`}
              onClick={() => goTo("hiraganaSetup", "hiragana")}
            />
          )}

          <ModuleCard
            bg="#FFEEEA" border="#E85D3A"
            icon={<BookOpen size={20} style={{ color: "#E85D3A" }} />}
            title="Vocabulario"
            subtitle={`${VOCABULARY.length} palabras · ${VOCAB_CATEGORIES.length} categorías`}
            onClick={() => goTo("vocabCategory", "vocab")}
          />

          <ModuleCard
            bg="#E7EFFD" border="#2F6FE4"
            icon={<span className="text-xl" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>ア</span>}
            title="Katakana"
            subtitle={`${masteredKataTotal} de ${KATAKANA_ALL_CHARS.length} caracteres dominados`}
            onClick={() => goTo("katakanaSetup")}
          />

          <ModuleCard
            bg="#FFF4E5" border="#F5A623"
            icon={<Hash size={20} style={{ color: "#F5A623" }} />}
            title="Números"
            subtitle={`${masteredNumberKeys} de ${KEY_NUMBERS.length} números clave dominados`}
            onClick={() => goTo("numberSetup")}
          />

          <ModuleCard
            bg="#E3FAF3" border="#15C0A0"
            icon={<Mic size={20} style={{ color: "#15C0A0" }} />}
            title="Fonética"
            subtitle="Cómo suenan las palabras"
            onClick={() => goTo("phoneticSetup")}
          />

          <ModuleCard
            bg="#F5F5F5" border="#C9C9C9" dashed disabled
            icon={<PenLine size={20} style={{ color: "#8B7FA8" }} />}
            title="Oraciones"
            subtitle="Se desbloquea al completar vocabulario base"
            badge="Próximamente"
          />
        </div>
      </div>

      {/* ── Footer actions ── */}
      <div className="flex flex-col items-center gap-3 mt-8">
        <button
          onClick={() => setView("stats")}
          className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 transition-colors"
          style={{ color: "#1A1A2E" }}
        >
          <BarChart3 size={15} /> Ver estadísticas
        </button>

        {!resetConfirm ? (
          <button onClick={() => setResetConfirm(true)} className="text-xs text-stone-400 hover:text-rose-600 flex items-center gap-1">
            <Trash2 size={12} /> Borrar progreso
          </button>
        ) : (
          <button onClick={resetProgress} className="text-xs text-rose-600 font-medium">
            ¿Seguro? Confirmar borrado
          </button>
        )}
      </div>

      {saveError && (
        <p className="text-xs text-rose-600 mt-3 text-center">No se pudo guardar el progreso. Tus respuestas de esta sesión podrían no persistir.</p>
      )}
    </div>
  );
}

// ── Secondary module card ───────────────────────────────────────────────────

interface ModuleCardProps {
  bg: string;
  border: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  badge?: string;
  dashed?: boolean;
  disabled?: boolean;
}

function ModuleCard({ bg, border, icon, title, subtitle, onClick, badge, dashed, disabled }: ModuleCardProps) {
  const content = (
    <div className="flex items-center gap-3">
      <span className="shrink-0 w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold" style={{ color: "#1A1A2E" }}>{title}</span>
          {badge && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/70" style={{ color: "#8B7FA8" }}>
              {badge}
            </span>
          )}
        </div>
        <div className="text-sm mt-0.5" style={{ color: "#8B7FA8" }}>{subtitle}</div>
      </div>
      {!disabled && <ChevronRight size={18} className="shrink-0" style={{ color: "#8B7FA8" }} />}
    </div>
  );

  const className = "w-full text-left rounded-2xl p-4 shadow-sm transition-transform" + (disabled ? "" : " hover:scale-[1.01]");
  const style: React.CSSProperties = {
    backgroundColor: bg,
    border: `${dashed ? "2px dashed" : "1.5px solid"} ${border}`,
    opacity: disabled ? 0.5 : 1,
  };

  if (disabled) {
    return <div className={className} style={style}>{content}</div>;
  }
  return (
    <button onClick={onClick} className={className} style={style}>
      {content}
    </button>
  );
}
