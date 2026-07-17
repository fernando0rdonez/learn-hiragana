import { ChevronRight, Flame, BookOpen, Mic, PenLine, Hash, HelpCircle, Settings, MessageCircle, GraduationCap, SpellCheck2, Headphones, Trophy, Clock } from "lucide-react";
import { useState } from "react";
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
import foxStudying from "../assets/character/fox-studying.png";
import foxStudyingHappy from "../assets/character/fox-studying-happy.png";
import foxCheering from "../assets/character/fox-cheering.png";
import foxLocked from "../assets/character/fox-locked.png";
import foxSleepy from "../assets/character/fox-sleepy.png";

interface Props {
  streak: StreakData;
  masteredTotal: number;
  masteredKataTotal: number;
  masteredNumberKeys: number;
  masteredDateTimeKeys: number;
  masteredVocabTotal: number;
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

function readLastUsedModule(): ModuleId {
  const stored = localStorage.getItem(LAST_USED_MODULE_KEY);
  if (stored === "hiragana" || stored === "vocab") return stored;
  return "hiragana";
}

function pct(mastered: number, total: number): number {
  return total > 0 ? Math.round((mastered / total) * 100) : 0;
}

export default function HomeView({ streak, masteredTotal, masteredKataTotal, masteredNumberKeys, masteredDateTimeKeys, masteredVocabTotal, masteredPhrasesTotal, masteredKanjiTotal, masteredGrammarTotal, masteredListeningTotal, saveError, setView }: Props) {
  const [heroModule] = useState(readLastUsedModule);

  function goTo(view: ViewName, moduleId?: ModuleId) {
    if (moduleId) localStorage.setItem(LAST_USED_MODULE_KEY, moduleId);
    setView(view);
  }

  const hiraganaPct = pct(masteredTotal, ALL_CHARS.length);
  const hiraganaRemaining = ALL_CHARS.length - masteredTotal;
  const vocabPct = pct(masteredVocabTotal, VOCABULARY.length);

  // El módulo que más se está quedando atrás — el zorro "dormido" lo señala en la grilla.
  const moduleStats: { id: string; pct: number }[] = [
    { id: "hiragana", pct: hiraganaPct },
    { id: "vocab", pct: vocabPct },
    { id: "katakana", pct: pct(masteredKataTotal, KATAKANA_ALL_CHARS.length) },
    { id: "numbers", pct: pct(masteredNumberKeys, KEY_NUMBERS.length) },
    { id: "datetime", pct: pct(masteredDateTimeKeys, KEY_HOURS.length + KEY_MINUTE_UNITS.length) },
    { id: "phrases", pct: pct(masteredPhrasesTotal, PHRASES.length) },
    { id: "kanji", pct: pct(masteredKanjiTotal, KANJI.length) },
    { id: "grammar", pct: pct(masteredGrammarTotal, GRAMMAR_LESSONS.length) },
    { id: "listening", pct: pct(masteredListeningTotal, LISTENING_SENTENCES.length) },
  ];
  const neediestModuleId = moduleStats.reduce((min, m) => (m.pct < min.pct ? m : min)).id;

  return (
    <div className="pb-24">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <span style={{ color: "#1A1A2E" }}>かな</span>
          <span style={{ color: "#7B4FD4" }}>道</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("streakDetail")}
            aria-label="Ver detalle de tu racha"
            className="flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: "#FFF4E5", color: "#F5A623" }}
          >
            <Flame size={14} />
            {streak.current} día{streak.current === 1 ? "" : "s"}
          </button>
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

      {/* ── Hero: el zorro recomienda el siguiente paso ── */}
      <div
        className="relative mt-6 rounded-3xl pt-5 px-5 pb-24 text-white shadow-lg"
        style={{ background: HERO_GRADIENT[heroModule], overflow: "visible" }}
      >
        <div className="text-xs font-semibold tracking-wide uppercase opacity-80">Siguiente paso recomendado</div>

        {heroModule === "hiragana" ? (
          <>
            <div className="mt-2.5 bg-white/15 border border-white/20 rounded-2xl px-4 py-3 text-[14.5px] font-semibold leading-snug">
              {hiraganaRemaining > 0
                ? <>¡Vamos con <b>Hiragana</b>! Te quedan {hiraganaRemaining} caracteres por dominar.</>
                : <>¡Dominaste <b>Hiragana</b>! Un repaso corto mantiene la racha viva.</>}
            </div>

            <div className="mt-3.5">
              <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${hiraganaPct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs opacity-80 font-semibold">
                <span>{hiraganaPct}% completado</span>
                <span>{masteredTotal} de {ALL_CHARS.length}</span>
              </div>
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
            <div className="mt-2.5 bg-white/15 border border-white/20 rounded-2xl px-4 py-3 text-[14.5px] font-semibold leading-snug">
              ¡Vamos con <b>Vocabulario</b>! {VOCABULARY.length} palabras en {VOCAB_CATEGORIES.length} categorías te esperan.
            </div>

            <button
              onClick={() => goTo("vocabCategory", "vocab")}
              className="mt-4 flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              <span className="text-[10px]">▶</span> Comenzar sesión
            </button>
          </>
        )}

        <img
          src={foxStudyingHappy}
          alt="Kitsu estudiando feliz con sus cuadernos"
          className="absolute pointer-events-none select-none"
          style={{ width: 140, height: "auto", bottom: -56, right: 14, zIndex: 2, filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.25))" }}
        />
      </div>

      {/* ── Módulos: grilla compacta ── */}
      <div className="mt-8">
        <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#8B7FA8" }}>Tus módulos</div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <ModuleTile
            bg="#EDE7F9" fg="#7B4FD4"
            icon={<span className="text-lg font-bold" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>あ</span>}
            title="Hiragana"
            meta={`${hiraganaPct}%`}
            pctValue={hiraganaPct}
            onClick={() => goTo("hiraganaSetup", "hiragana")}
            badgeImg={heroModule === "hiragana" ? foxStudying : undefined}
            badgeAlt="En progreso"
          />

          <ModuleTile
            bg="#FFEEEA" fg="#E85D3A"
            icon={<BookOpen size={18} />}
            title="Vocabulario"
            meta={`${vocabPct}%`}
            pctValue={vocabPct}
            onClick={() => goTo("vocabCategory", "vocab")}
            badgeImg={heroModule === "vocab" ? foxStudying : neediestModuleId === "vocab" ? foxSleepy : undefined}
            badgeAlt={heroModule === "vocab" ? "En progreso" : "Necesita repaso"}
          />

          <ModuleTile
            bg="#E7EFFD" fg="#2F6FE4"
            icon={<span className="text-lg font-bold" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>ア</span>}
            title="Katakana"
            meta={`${pct(masteredKataTotal, KATAKANA_ALL_CHARS.length)}%`}
            pctValue={pct(masteredKataTotal, KATAKANA_ALL_CHARS.length)}
            onClick={() => goTo("katakanaSetup")}
            badgeImg={neediestModuleId === "katakana" ? foxSleepy : undefined}
            badgeAlt="Necesita repaso"
          />

          <ModuleTile
            bg="#FFF4E5" fg="#C97F0B"
            icon={<Hash size={18} />}
            title="Números"
            meta={`${pct(masteredNumberKeys, KEY_NUMBERS.length)}%`}
            pctValue={pct(masteredNumberKeys, KEY_NUMBERS.length)}
            onClick={() => goTo("numberSetup")}
            badgeImg={neediestModuleId === "numbers" ? foxSleepy : undefined}
            badgeAlt="Necesita repaso"
          />

          <ModuleTile
            bg="#FCEAF3" fg="#D14B8F"
            icon={<MessageCircle size={18} />}
            title="Frases"
            meta={`${pct(masteredPhrasesTotal, PHRASES.length)}%`}
            pctValue={pct(masteredPhrasesTotal, PHRASES.length)}
            onClick={() => goTo("phraseSetup")}
            badgeImg={neediestModuleId === "phrases" ? foxSleepy : undefined}
            badgeAlt="Necesita repaso"
          />

          <ModuleTile
            bg="#FBEAEA" fg="#B3261E"
            icon={<GraduationCap size={18} />}
            title="Kanji"
            meta={`${pct(masteredKanjiTotal, KANJI.length)}%`}
            pctValue={pct(masteredKanjiTotal, KANJI.length)}
            onClick={() => goTo("kanjiSetup")}
            badgeImg={neediestModuleId === "kanji" ? foxSleepy : undefined}
            badgeAlt="Necesita repaso"
          />

          <ModuleTile
            bg="#EDEFFB" fg="#4C5FBF"
            icon={<SpellCheck2 size={18} />}
            title="Gramática"
            meta={`${pct(masteredGrammarTotal, GRAMMAR_LESSONS.length)}%`}
            pctValue={pct(masteredGrammarTotal, GRAMMAR_LESSONS.length)}
            onClick={() => goTo("grammarSetup")}
            badgeImg={neediestModuleId === "grammar" ? foxSleepy : undefined}
            badgeAlt="Necesita repaso"
          />

          <ModuleTile
            bg="#E0F7FA" fg="#0891B2"
            icon={<Headphones size={18} />}
            title="Listening"
            meta={`${pct(masteredListeningTotal, LISTENING_SENTENCES.length)}%`}
            pctValue={pct(masteredListeningTotal, LISTENING_SENTENCES.length)}
            onClick={() => goTo("listeningSetup")}
            badgeImg={neediestModuleId === "listening" ? foxSleepy : undefined}
            badgeAlt="Necesita repaso"
          />

          {/* Fechas y Horas y Fonética: al final de la lista, son el complemento menos frecuentado */}
          <ModuleTile
            bg="#F1F5F9" fg="#475569"
            icon={<Clock size={18} />}
            title="Fechas y Horas"
            meta={`${pct(masteredDateTimeKeys, KEY_HOURS.length + KEY_MINUTE_UNITS.length)}%`}
            pctValue={pct(masteredDateTimeKeys, KEY_HOURS.length + KEY_MINUTE_UNITS.length)}
            onClick={() => goTo("dateTimeSetup")}
            badgeImg={neediestModuleId === "datetime" ? foxSleepy : undefined}
            badgeAlt="Necesita repaso"
          />

          <ModuleTile
            bg="#E3FAF3" fg="#15C0A0"
            icon={<Mic size={18} />}
            title="Fonética"
            meta="Cómo suenan"
            onClick={() => goTo("phoneticSetup")}
          />
        </div>

        {isSupabaseConfigured && (
          <div className="relative mt-3 mb-4">
            <button
              onClick={() => setView("competeHome")}
              className="relative w-full flex items-center gap-3 rounded-2xl pl-4 pr-16 py-3 text-left"
              style={{ border: "1.5px dashed #BFE6D3", backgroundColor: "#F4FCF8" }}
            >
              <Trophy size={18} style={{ color: "#178A5C" }} className="shrink-0" />
              <div className="min-w-0">
                <div className="text-[13px] font-bold" style={{ color: "#178A5C" }}>Reta a un amigo</div>
                <div className="text-[11px] font-semibold" style={{ color: "#4E9C7C" }}>Hasta 6 jugadores · opcional</div>
              </div>
              <ChevronRight size={16} className="shrink-0 ml-auto mr-8" style={{ color: "#178A5C" }} />
            </button>
            <img
              src={foxCheering}
              alt=""
              className="absolute -right-1 -bottom-4 w-14 h-auto pointer-events-none select-none"
            />
          </div>
        )}

        <div className="flex items-center gap-2.5 mt-2.5 px-1 py-2">
          <img src={foxLocked} alt="" className="w-6 h-auto opacity-90 shrink-0" />
          <span className="text-xs font-semibold" style={{ color: "#A69FBB" }}>
            <PenLine size={12} className="inline mr-1 -mt-0.5" />
            Lectura — se desbloquea al completar vocabulario base
          </span>
        </div>
      </div>

      {saveError && (
        <p className="text-xs text-rose-600 mt-3 text-center">No se pudo guardar el progreso. Tus respuestas de esta sesión podrían no persistir.</p>
      )}
    </div>
  );
}

// ── Tarjeta compacta de módulo ──────────────────────────────────────────────

interface ModuleTileProps {
  bg: string;
  fg: string;
  icon: React.ReactNode;
  title: string;
  meta: string;
  pctValue?: number;
  onClick?: () => void;
  badgeImg?: string;
  badgeAlt?: string;
}

function ModuleTile({ bg, fg, icon, title, meta, pctValue, onClick, badgeImg, badgeAlt }: ModuleTileProps) {
  return (
    <button
      onClick={onClick}
      className="relative text-left rounded-2xl p-3 bg-white shadow-sm hover:shadow-md transition-shadow"
      style={{ border: `1.5px solid ${fg}26` }}
    >
      {badgeImg && (
        <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white shadow-sm overflow-hidden border-2 border-white">
          <img src={badgeImg} alt={badgeAlt ?? ""} className="w-full h-full object-cover" style={{ objectPosition: "50% 15%", transform: "scale(1.7)" }} />
        </span>
      )}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: bg, color: fg }}>
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-[13.5px] font-bold truncate" style={{ color: "#1A1A2E" }}>{title}</div>
          <div className="text-[11px] font-semibold" style={{ color: "#8B7FA8" }}>{meta}</div>
        </div>
      </div>
      {pctValue !== undefined && (
        <div className="h-[3px] rounded-full mt-2.5 overflow-hidden" style={{ backgroundColor: "#F1EEF7" }}>
          <div className="h-full rounded-full" style={{ width: `${pctValue}%`, backgroundColor: fg }} />
        </div>
      )}
    </button>
  );
}
