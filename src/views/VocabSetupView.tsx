import { useState, useEffect } from "react";
import { ArrowLeft, Check, Play, PenLine, Eye, Headphones } from "lucide-react";
import type { VocabWord } from "../vocabulary";
import { VOCABULARY, VOCAB_CATEGORIES } from "../vocabulary";
import type { ViewName } from "../data";
import type { ProgressItems, VocabSessionLength } from "../types";
import { vocabCategoryStats, notMasteredVocab, resolveVocabSession } from "../utils";
import { getVocabImageUrl } from "../vocabImages";
import foxImg from "../assets/character/fox-neutral.png";

interface Props {
  progress: ProgressItems;
  selectedVocabCategories: Set<string>;
  toggleVocabCategory: (id: string) => void;
  setSelectedVocabCategories: (ids: Set<string>) => void;
  vocabSessionLength: VocabSessionLength;
  setVocabSessionLength: (n: VocabSessionLength) => void;
  filteredVocabulary: VocabWord[];
  setView: (v: ViewName) => void;
}

// ── Design tokens (mismo sistema que HomeView/HiraganaSetupView — coral es el color del módulo Vocabulario) ──

const CORAL       = "#E85D3A";
const CORAL_DARK  = "#C03A1E";
const CORAL_LIGHT = "#FFEEEA";
const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const TEXT_MUTED  = "#AAAAAA";

const LAST_SESSION_KEY = "vocab_last_session";

type VocabGameMode = "spell" | "recognize" | "listen";

interface VocabLastSession {
  categoryIds: string[];
  length: VocabSessionLength;
  mode: VocabGameMode;
}

function isVocabLastSession(v: unknown): v is VocabLastSession {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return Array.isArray(o.categoryIds)
    && (o.length === 10 || o.length === 20 || o.length === "all" || o.length === "repasar")
    && (o.mode === "spell" || o.mode === "recognize" || o.mode === "listen" || o.mode === undefined); // undefined = sesión guardada antes de agregar modos
}

function viewForMode(mode: VocabGameMode): ViewName {
  if (mode === "recognize") return "recognizeIt";
  if (mode === "listen") return "listenIt";
  return "spellIt";
}

function lengthLabel(length: VocabSessionLength): string {
  return length === "all" ? "Todas" : length === "repasar" ? "Repasar" : String(length);
}

export default function VocabSetupView({
  progress,
  selectedVocabCategories, toggleVocabCategory, setSelectedVocabCategories,
  vocabSessionLength, setVocabSessionLength,
  filteredVocabulary,
  setView,
}: Props) {
  const [lastSession] = useState<VocabLastSession | null>(() => {
    const raw = localStorage.getItem(LAST_SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!isVocabLastSession(parsed)) return null;
      return { ...parsed, mode: parsed.mode ?? "spell" }; // sesiones guardadas antes de agregar modos
    } catch {
      return null; // valor corrupto en localStorage
    }
  });
  const [gameMode, setGameMode] = useState<VocabGameMode>(lastSession?.mode ?? "spell");

  // Pre-select the last session's categories on a fresh load (e.g. after a
  // page reload, when in-memory selection state resets but localStorage
  // doesn't) so the "Última sesión" pills and the grid below agree. Only
  // fires once and only when nothing's been picked yet this page load —
  // never overwrites an in-progress selection.
  useEffect(() => {
    if (lastSession && selectedVocabCategories.size === 0) {
      setSelectedVocabCategories(new Set(lastSession.categoryIds));
      setVocabSessionLength(lastSession.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allSelected = selectedVocabCategories.size === VOCAB_CATEGORIES.length;
  const notMastered = notMasteredVocab(progress, filteredVocabulary);
  const { limit: sessionSize } = resolveVocabSession(filteredVocabulary, vocabSessionLength, progress);

  function toggleSelectAll() {
    setSelectedVocabCategories(allSelected ? new Set() : new Set(VOCAB_CATEGORIES.map((c) => c.id)));
  }

  function handleStartSession() {
    localStorage.setItem(LAST_SESSION_KEY, JSON.stringify({
      categoryIds: [...selectedVocabCategories],
      length: vocabSessionLength,
      mode: gameMode,
    } satisfies VocabLastSession));
    setView(viewForMode(gameMode));
  }

  function handleContinue() {
    if (!lastSession) return;
    const pool = VOCABULARY.filter((w) => lastSession.categoryIds.includes(w.category));
    const { limit } = resolveVocabSession(pool, lastSession.length, progress);
    if (limit === 0) return; // p.ej. "repasar" y ya no queda nada sin dominar
    setSelectedVocabCategories(new Set(lastSession.categoryIds));
    setVocabSessionLength(lastSession.length);
    setGameMode(lastSession.mode);
    setView(viewForMode(lastSession.mode));
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Shippori Mincho', serif", color: TEXT_MAIN }}>
        Vocabulario
      </h2>

      {/* ── Última sesión ── */}
      {lastSession && (
        <div
          className="relative rounded-3xl p-5 pb-7 mt-5 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${CORAL}, ${CORAL_DARK})`, overflow: "visible" }}
        >
          <div className="text-[11px] font-semibold tracking-wide uppercase opacity-80">Última sesión</div>
          <div className="flex flex-wrap gap-1.5 mt-2 pr-14">
            {lastSession.categoryIds.map((id) => {
              const cat = VOCAB_CATEGORIES.find((c) => c.id === id);
              if (!cat) return null;
              return (
                <span key={id} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20">
                  {cat.label}
                </span>
              );
            })}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20">
              ×{lengthLabel(lastSession.length)}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20">
              {lastSession.mode === "recognize" ? "Reconocer" : lastSession.mode === "listen" ? "Escuchar" : "Deletrear"}
            </span>
          </div>
          <button
            onClick={handleContinue}
            className="mt-3 flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{ color: CORAL_DARK }}
          >
            <Play size={14} /> Continuar
          </button>
          <img
            src={foxImg}
            alt=""
            className="absolute pointer-events-none select-none"
            style={{ width: 60, height: "auto", bottom: -14, right: 14, zIndex: 2 }}
          />
        </div>
      )}

      {/* ── Configurar sesión ── */}
      <div className="mt-8">
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Modo</span>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button
            onClick={() => setGameMode("spell")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={gameMode === "spell"
              ? { borderColor: CORAL, backgroundColor: CORAL_LIGHT, color: CORAL_DARK }
              : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
            }
          >
            <PenLine size={14} /> Deletrear
          </button>
          <button
            onClick={() => setGameMode("recognize")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={gameMode === "recognize"
              ? { borderColor: CORAL, backgroundColor: CORAL_LIGHT, color: CORAL_DARK }
              : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
            }
          >
            <Eye size={14} /> Reconocer
          </button>
          <button
            onClick={() => setGameMode("listen")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={gameMode === "listen"
              ? { borderColor: CORAL, backgroundColor: CORAL_LIGHT, color: CORAL_DARK }
              : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
            }
          >
            <Headphones size={14} /> Escuchar
          </button>
        </div>

        <div className="flex items-center justify-between mt-5">
          <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Configurar sesión</div>
          <button onClick={toggleSelectAll} className="text-xs font-semibold" style={{ color: CORAL }}>
            {allSelected ? "Limpiar" : "Seleccionar todas"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          {VOCAB_CATEGORIES.map((cat) => {
            const stats = vocabCategoryStats(progress, cat.id);
            const isSelected = selectedVocabCategories.has(cat.id);
            const imageUrl = cat.image ? getVocabImageUrl(cat.image) : undefined;
            const pct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

            return (
              <button
                key={cat.id}
                onClick={() => toggleVocabCategory(cat.id)}
                className={`relative text-left rounded-2xl border-2 p-3 transition-colors ${!isSelected ? "hover:border-[#F0C4B4] hover:bg-[#FFFAF8]" : ""}`}
                style={isSelected
                  ? { backgroundColor: CORAL_LIGHT, borderColor: CORAL, boxShadow: "0 4px 14px rgba(232,93,58,0.18)" }
                  : { backgroundColor: "#FFFFFF", borderColor: BORDER }
                }
              >
                {isSelected && (
                  <span
                    className="absolute -top-2 -right-2 w-[22px] h-[22px] rounded-full flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: CORAL }}
                  >
                    <Check size={13} className="text-white" strokeWidth={3} />
                  </span>
                )}
                <div className="w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: "#F5F0EA" }}>
                  {imageUrl ? (
                    <img src={imageUrl} alt={cat.label} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{cat.emoji}</span>
                  )}
                </div>
                <div className="text-sm font-semibold mt-2" style={{ color: isSelected ? CORAL_DARK : TEXT_MAIN }}>
                  {cat.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: isSelected ? CORAL_DARK : TEXT_SECOND }}>
                  {stats.mastered}/{stats.total} dominadas
                </div>
                <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: "#F0EAE3" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CORAL }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Preguntas */}
        <div className="mt-5">
          <span className="text-sm font-medium" style={{ color: TEXT_MAIN }}>Preguntas</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {([10, 20] as const).map((n) => (
              <button
                key={n}
                onClick={() => setVocabSessionLength(n)}
                className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors"
                style={vocabSessionLength === n
                  ? { borderColor: CORAL, backgroundColor: CORAL_LIGHT, color: CORAL_DARK }
                  : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
                }
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setVocabSessionLength("all")}
              className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors"
              style={vocabSessionLength === "all"
                ? { borderColor: CORAL, backgroundColor: CORAL_LIGHT, color: CORAL_DARK }
                : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
              }
            >
              Todas ({filteredVocabulary.length})
            </button>
            <button
              disabled={notMastered.length === 0}
              onClick={() => setVocabSessionLength("repasar")}
              className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors disabled:opacity-40"
              style={vocabSessionLength === "repasar"
                ? { borderColor: CORAL, backgroundColor: CORAL_LIGHT, color: CORAL_DARK }
                : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
              }
            >
              Repasar ({notMastered.length})
            </button>
          </div>
        </div>

        <button
          disabled={sessionSize === 0}
          onClick={handleStartSession}
          className="w-full mt-6 py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ backgroundColor: CORAL }}
        >
          <Play size={16} /> Comenzar sesión
        </button>
        <p className="text-center text-xs mt-2" style={{ color: TEXT_MUTED }}>
          {selectedVocabCategories.size} categoría{selectedVocabCategories.size === 1 ? "" : "s"} seleccionada{selectedVocabCategories.size === 1 ? "" : "s"} · {sessionSize} palabra{sessionSize === 1 ? "" : "s"} · {notMastered.length} sin dominar
        </p>
      </div>
    </div>
  );
}
