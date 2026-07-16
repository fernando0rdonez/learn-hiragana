import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, Play, Eye, Headphones, Puzzle } from "lucide-react";
import type { Phrase } from "../phrases";
import { PHRASES, PHRASE_CATEGORIES } from "../phrases";
import type { ViewName } from "../data";
import type { ProgressItems, VocabSessionLength } from "../types";
import { phraseCategoryStats, notMasteredPhrases, resolvePhraseSession } from "../utils";
import foxImg from "../assets/character/fox-neutral.png";
import FloatingStartButton from "../components/FloatingStartButton";

interface Props {
  progress: ProgressItems;
  selectedPhraseCategories: Set<string>;
  togglePhraseCategory: (id: string) => void;
  setSelectedPhraseCategories: (ids: Set<string>) => void;
  phraseSessionLength: VocabSessionLength;
  setPhraseSessionLength: (n: VocabSessionLength) => void;
  filteredPhrases: Phrase[];
  setView: (v: ViewName) => void;
}

// ── Design tokens (mismo sistema que HomeView/VocabSetupView — rosa es el color del módulo Frases) ──

const PINK       = "#D14B8F";
const PINK_DARK  = "#A8306E";
const PINK_LIGHT = "#FCEAF3";
const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const TEXT_MUTED  = "#AAAAAA";

const LAST_SESSION_KEY = "phrase_last_session";

type PhraseGameMode = "meaning" | "listen" | "build";

interface PhraseLastSession {
  categoryIds: string[];
  length: VocabSessionLength;
  mode: PhraseGameMode;
}

function isPhraseLastSession(v: unknown): v is PhraseLastSession {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return Array.isArray(o.categoryIds)
    && (o.length === 10 || o.length === 20 || o.length === "all" || o.length === "repasar")
    && (o.mode === "meaning" || o.mode === "listen" || o.mode === "build");
}

function viewForMode(mode: PhraseGameMode): ViewName {
  return mode === "listen" ? "phraseListening" : mode === "build" ? "phraseBuild" : "phraseMeaning";
}

function modeLabel(mode: PhraseGameMode): string {
  return mode === "listen" ? "Escuchar" : mode === "build" ? "Construir" : "Reconocer";
}

function lengthLabel(length: VocabSessionLength): string {
  return length === "all" ? "Todas" : length === "repasar" ? "Repasar" : String(length);
}

export default function PhraseSetupView({
  progress,
  selectedPhraseCategories, togglePhraseCategory, setSelectedPhraseCategories,
  phraseSessionLength, setPhraseSessionLength,
  filteredPhrases,
  setView,
}: Props) {
  const [lastSession] = useState<PhraseLastSession | null>(() => {
    const raw = localStorage.getItem(LAST_SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return isPhraseLastSession(parsed) ? parsed : null;
    } catch {
      return null; // valor corrupto en localStorage
    }
  });
  const [gameMode, setGameMode] = useState<PhraseGameMode>(lastSession?.mode ?? "meaning");
  const startButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (lastSession && selectedPhraseCategories.size === 0) {
      setSelectedPhraseCategories(new Set(lastSession.categoryIds));
      setPhraseSessionLength(lastSession.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allSelected = selectedPhraseCategories.size === PHRASE_CATEGORIES.length;
  const notMastered = notMasteredPhrases(progress, filteredPhrases);
  const { limit: sessionSize } = resolvePhraseSession(filteredPhrases, phraseSessionLength, progress);

  function toggleSelectAll() {
    setSelectedPhraseCategories(allSelected ? new Set() : new Set(PHRASE_CATEGORIES.map((c) => c.id)));
  }

  function handleStartSession() {
    localStorage.setItem(LAST_SESSION_KEY, JSON.stringify({
      categoryIds: [...selectedPhraseCategories],
      length: phraseSessionLength,
      mode: gameMode,
    } satisfies PhraseLastSession));
    setView(viewForMode(gameMode));
  }

  function handleContinue() {
    if (!lastSession) return;
    const pool = PHRASES.filter((p) => lastSession.categoryIds.includes(p.category));
    const { limit } = resolvePhraseSession(pool, lastSession.length, progress);
    if (limit === 0) return; // p.ej. "repasar" y ya no queda nada sin dominar
    setSelectedPhraseCategories(new Set(lastSession.categoryIds));
    setPhraseSessionLength(lastSession.length);
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
      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
        Frases
      </h2>

      {/* ── Última sesión ── */}
      {lastSession && (
        <div
          className="relative rounded-3xl p-5 pb-7 mt-5 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`, overflow: "visible" }}
        >
          <div className="text-[11px] font-semibold tracking-wide uppercase opacity-80">Última sesión</div>
          <div className="flex flex-wrap gap-1.5 mt-2 pr-14">
            {lastSession.categoryIds.map((id) => {
              const cat = PHRASE_CATEGORIES.find((c) => c.id === id);
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
              {modeLabel(lastSession.mode)}
            </span>
          </div>
          <button
            onClick={handleContinue}
            className="mt-3 flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{ color: PINK_DARK }}
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
            onClick={() => setGameMode("meaning")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={gameMode === "meaning"
              ? { borderColor: PINK, backgroundColor: PINK_LIGHT, color: PINK_DARK }
              : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
            }
          >
            <Eye size={14} /> Reconocer
          </button>
          <button
            onClick={() => setGameMode("listen")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={gameMode === "listen"
              ? { borderColor: PINK, backgroundColor: PINK_LIGHT, color: PINK_DARK }
              : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
            }
          >
            <Headphones size={14} /> Escuchar
          </button>
          <button
            onClick={() => setGameMode("build")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={gameMode === "build"
              ? { borderColor: PINK, backgroundColor: PINK_LIGHT, color: PINK_DARK }
              : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
            }
          >
            <Puzzle size={14} /> Construir
          </button>
        </div>

        <div className="flex items-center justify-between mt-5">
          <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Configurar sesión</div>
          <button onClick={toggleSelectAll} className="text-xs font-semibold" style={{ color: PINK }}>
            {allSelected ? "Limpiar" : "Seleccionar todas"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          {PHRASE_CATEGORIES.map((cat) => {
            const stats = phraseCategoryStats(progress, cat.id);
            const isSelected = selectedPhraseCategories.has(cat.id);
            const pct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

            return (
              <button
                key={cat.id}
                onClick={() => togglePhraseCategory(cat.id)}
                className={`relative text-left rounded-2xl border-2 p-3 transition-colors ${!isSelected ? "hover:border-[#F3C4DD] hover:bg-[#FFFAFC]" : ""}`}
                style={isSelected
                  ? { backgroundColor: PINK_LIGHT, borderColor: PINK, boxShadow: "0 4px 14px rgba(209,75,143,0.18)" }
                  : { backgroundColor: "#FFFFFF", borderColor: BORDER }
                }
              >
                {isSelected && (
                  <span
                    className="absolute -top-2 -right-2 w-[22px] h-[22px] rounded-full flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: PINK }}
                  >
                    <Check size={13} className="text-white" strokeWidth={3} />
                  </span>
                )}
                <span className="text-3xl">{cat.emoji}</span>
                <div className="text-sm font-semibold mt-2" style={{ color: isSelected ? PINK_DARK : TEXT_MAIN }}>
                  {cat.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: isSelected ? PINK_DARK : TEXT_SECOND }}>
                  {stats.mastered}/{stats.total} dominadas
                </div>
                <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: "#F5E1EC" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PINK }} />
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
                onClick={() => setPhraseSessionLength(n)}
                className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors"
                style={phraseSessionLength === n
                  ? { borderColor: PINK, backgroundColor: PINK_LIGHT, color: PINK_DARK }
                  : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
                }
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPhraseSessionLength("all")}
              className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors"
              style={phraseSessionLength === "all"
                ? { borderColor: PINK, backgroundColor: PINK_LIGHT, color: PINK_DARK }
                : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
              }
            >
              Todas ({filteredPhrases.length})
            </button>
            <button
              disabled={notMastered.length === 0}
              onClick={() => setPhraseSessionLength("repasar")}
              className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors disabled:opacity-40"
              style={phraseSessionLength === "repasar"
                ? { borderColor: PINK, backgroundColor: PINK_LIGHT, color: PINK_DARK }
                : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
              }
            >
              Repasar ({notMastered.length})
            </button>
          </div>
        </div>

        <button
          ref={startButtonRef}
          disabled={sessionSize === 0}
          onClick={handleStartSession}
          className="w-full mt-6 py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ backgroundColor: PINK }}
        >
          <Play size={16} /> Comenzar sesión
        </button>
        <p className="text-center text-xs mt-2" style={{ color: TEXT_MUTED }}>
          {selectedPhraseCategories.size} categoría{selectedPhraseCategories.size === 1 ? "" : "s"} seleccionada{selectedPhraseCategories.size === 1 ? "" : "s"} · {sessionSize} frase{sessionSize === 1 ? "" : "s"} · {notMastered.length} sin dominar
        </p>
      </div>

      <FloatingStartButton
        count={sessionSize}
        disabled={sessionSize === 0}
        onClick={handleStartSession}
        accent={PINK}
        targetRef={startButtonRef}
      />
    </div>
  );
}
