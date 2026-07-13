import { useState } from "react";
import { ChevronRight, Flame, BookOpen, Mic, PenLine, Hash, HelpCircle, Settings, MessageCircle, GraduationCap, SpellCheck2, Headphones, Trophy, Clock } from "lucide-react";
import type { StreakData } from "../types";
import type { ViewName } from "../data";
import { ALL_CHARS } from "../data";
import { KATAKANA_ALL_CHARS } from "../dataKatakana";
import { VOCABULARY, VOCAB_CATEGORIES } from "../vocabulary";
import { KEY_NUMBERS } from "../numbers";
import { KEY_HOURS, KEY_MINUTE_UNITS } from "../dateTime";
import { PHRASES } from "../phrases";
import { KANJI } from "../kanji";
import { GRAMMAR_LESSONS } from "../grammar";
import { LISTENING_SENTENCES } from "../listening";
import { isSupabaseConfigured } from "../lib/supabase";
import foxImg from "../assets/character/fox-neutral.png";

interface Props {
  streak: StreakData;
  masteredTotal: number;
  masteredKataTotal: number;
  masteredNumberKeys: number;
  masteredDateTimeKeys: number;
  masteredPhrasesTotal: number;
  masteredKanjiTotal: number;
  masteredGrammarTotal: number;
  masteredListeningTotal: number;
  saveError: boolean;
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

export default function HomeView({ streak, masteredTotal, masteredKataTotal, masteredNumberKeys, masteredDateTimeKeys, masteredPhrasesTotal, masteredKanjiTotal, masteredGrammarTotal, masteredListeningTotal, saveError, setView }: Props) {
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
          <span style={{ color: "#1A1A2E" }}>かな</span>
          <span style={{ color: "#7B4FD4" }}>道</span>
        </h1>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: "#FFF4E5", color: "#F5A623" }}
          >
            <Flame size={14} />
            {streak.current} día{streak.current === 1 ? "" : "s"}
          </span>
          <button
            onClick={() => setView("methodology")}
            aria-label="Cómo estudiar"
            className="w-8 h-8 rounded-full flex items-center justify-center border border-stone-200 hover:bg-stone-50 transition-colors"
            style={{ color: "#8B7FA8" }}
          >
            <HelpCircle size={16} />
          </button>
          <button
            onClick={() => setView("settings")}
            aria-label="Configuración"
            className="w-8 h-8 rounded-full flex items-center justify-center border border-stone-200 hover:bg-stone-50 transition-colors"
            style={{ color: "#8B7FA8" }}
          >
            <Settings size={16} />
          </button>
        </div>
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
          {isSupabaseConfigured && (
            <ModuleCard
              bg="#DCFCE7" border="#16A34A"
              icon={<Trophy size={20} style={{ color: "#16A34A" }} />}
              title="Competir"
              subtitle="Reta a tus amigos — hasta 6 jugadores"
              onClick={() => setView("competeHome")}
            />
          )}

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
            bg="#F1F5F9" border="#475569"
            icon={<Clock size={20} style={{ color: "#475569" }} />}
            title="Fechas y Horas"
            subtitle={`${masteredDateTimeKeys} de ${KEY_HOURS.length + KEY_MINUTE_UNITS.length} claves dominadas`}
            onClick={() => goTo("dateTimeSetup")}
          />

          <ModuleCard
            bg="#E3FAF3" border="#15C0A0"
            icon={<Mic size={20} style={{ color: "#15C0A0" }} />}
            title="Fonética"
            subtitle="Cómo suenan las palabras"
            onClick={() => goTo("phoneticSetup")}
          />

          <ModuleCard
            bg="#FCEAF3" border="#D14B8F"
            icon={<MessageCircle size={20} style={{ color: "#D14B8F" }} />}
            title="Frases"
            subtitle={`${masteredPhrasesTotal} de ${PHRASES.length} frases dominadas`}
            onClick={() => goTo("phraseSetup")}
          />

          <ModuleCard
            bg="#FBEAEA" border="#B3261E"
            icon={<GraduationCap size={20} style={{ color: "#B3261E" }} />}
            title="Kanji"
            subtitle={`${masteredKanjiTotal} de ${KANJI.length} kanji dominados`}
            onClick={() => goTo("kanjiSetup")}
          />

          <ModuleCard
            bg="#EDEFFB" border="#4C5FBF"
            icon={<SpellCheck2 size={20} style={{ color: "#4C5FBF" }} />}
            title="Gramática"
            subtitle={`${masteredGrammarTotal} de ${GRAMMAR_LESSONS.length} lecciones dominadas`}
            onClick={() => goTo("grammarSetup")}
          />

          <ModuleCard
            bg="#E0F7FA" border="#0891B2"
            icon={<Headphones size={20} style={{ color: "#0891B2" }} />}
            title="Listening"
            subtitle={`${masteredListeningTotal} de ${LISTENING_SENTENCES.length} frases dominadas`}
            onClick={() => goTo("listeningSetup")}
          />

          <ModuleCard
            bg="#F5F5F5" border="#C9C9C9" dashed disabled
            icon={<PenLine size={20} style={{ color: "#8B7FA8" }} />}
            title="Lectura"
            subtitle="Se desbloquea al completar vocabulario base"
            badge="Próximamente"
          />
        </div>
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
