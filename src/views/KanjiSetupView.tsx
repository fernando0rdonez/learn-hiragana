import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, Play, Eye, BookOpenCheck, Shuffle } from "lucide-react";
import type { KanjiEntry } from "../kanji";
import { KANJI, KANJI_GROUPS } from "../kanji";
import type { ViewName } from "../data";
import type { ProgressItems, VocabSessionLength } from "../types";
import { kanjiGroupStats, notMasteredKanji, resolveKanjiSession } from "../utils";
import { getVocabImageUrl } from "../vocabImages";
import foxImg from "../assets/character/fox-neutral.png";
import FloatingStartButton from "../components/FloatingStartButton";

interface Props {
  progress: ProgressItems;
  selectedKanjiGroups: Set<string>;
  toggleKanjiGroup: (id: string) => void;
  setSelectedKanjiGroups: (ids: Set<string>) => void;
  kanjiSessionLength: VocabSessionLength;
  setKanjiSessionLength: (n: VocabSessionLength) => void;
  filteredKanji: KanjiEntry[];
  setView: (v: ViewName) => void;
}

// ── Design tokens (mismo sistema que HomeView/PhraseSetupView — carmesí es el color del módulo Kanji) ──

const CRIMSON       = "#B3261E";
const CRIMSON_DARK  = "#8C1D17";
const CRIMSON_LIGHT = "#FBEAEA";
const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const TEXT_MUTED  = "#AAAAAA";

const LAST_SESSION_KEY = "kanji_last_session";

type KanjiGameMode = "meaning" | "reading" | "match";

interface KanjiLastSession {
  groupIds: string[];
  length: VocabSessionLength;
  mode: KanjiGameMode;
}

function isKanjiLastSession(v: unknown): v is KanjiLastSession {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return Array.isArray(o.groupIds)
    && (o.length === 10 || o.length === 20 || o.length === "all" || o.length === "repasar")
    && (o.mode === "meaning" || o.mode === "reading" || o.mode === "match");
}

function viewForMode(mode: KanjiGameMode): ViewName {
  if (mode === "reading") return "kanjiReading";
  if (mode === "match") return "kanjiMatch";
  return "kanjiMeaning";
}

function lengthLabel(length: VocabSessionLength): string {
  return length === "all" ? "Todos" : length === "repasar" ? "Repasar" : String(length);
}

export default function KanjiSetupView({
  progress,
  selectedKanjiGroups, toggleKanjiGroup, setSelectedKanjiGroups,
  kanjiSessionLength, setKanjiSessionLength,
  filteredKanji,
  setView,
}: Props) {
  const [lastSession] = useState<KanjiLastSession | null>(() => {
    const raw = localStorage.getItem(LAST_SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return isKanjiLastSession(parsed) ? parsed : null;
    } catch {
      return null; // valor corrupto en localStorage
    }
  });
  const [gameMode, setGameMode] = useState<KanjiGameMode>(lastSession?.mode ?? "meaning");
  const startButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (lastSession && selectedKanjiGroups.size === 0) {
      setSelectedKanjiGroups(new Set(lastSession.groupIds));
      setKanjiSessionLength(lastSession.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allSelected = selectedKanjiGroups.size === KANJI_GROUPS.length;
  const notMastered = notMasteredKanji(progress, filteredKanji);
  const { limit: sessionSize } = resolveKanjiSession(filteredKanji, kanjiSessionLength, progress);
  // "Emparejar" no usa SRS ni sesión con límite fijo — solo hace falta que haya kanji seleccionados.
  const canStart = gameMode === "match" ? filteredKanji.length >= 2 : sessionSize > 0;

  function toggleSelectAll() {
    setSelectedKanjiGroups(allSelected ? new Set() : new Set(KANJI_GROUPS.map((g) => g.id)));
  }

  function handleStartSession() {
    localStorage.setItem(LAST_SESSION_KEY, JSON.stringify({
      groupIds: [...selectedKanjiGroups],
      length: kanjiSessionLength,
      mode: gameMode,
    } satisfies KanjiLastSession));
    setView(viewForMode(gameMode));
  }

  function handleContinue() {
    if (!lastSession) return;
    const pool = KANJI.filter((k) => lastSession.groupIds.includes(k.group));
    const canContinue = lastSession.mode === "match" ? pool.length >= 2 : resolveKanjiSession(pool, lastSession.length, progress).limit > 0;
    if (!canContinue) return; // p.ej. "repasar" y ya no queda nada sin dominar
    setSelectedKanjiGroups(new Set(lastSession.groupIds));
    setKanjiSessionLength(lastSession.length);
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
        Kanji
      </h2>

      {/* ── Última sesión ── */}
      {lastSession && (
        <div
          className="relative rounded-3xl p-5 pb-7 mt-5 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${CRIMSON_DARK})`, overflow: "visible" }}
        >
          <div className="text-[11px] font-semibold tracking-wide uppercase opacity-80">Última sesión</div>
          <div className="flex flex-wrap gap-1.5 mt-2 pr-14">
            {lastSession.groupIds.map((id) => {
              const group = KANJI_GROUPS.find((g) => g.id === id);
              if (!group) return null;
              return (
                <span key={id} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20">
                  {group.label}
                </span>
              );
            })}
            {lastSession.mode !== "match" && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20">
                ×{lengthLabel(lastSession.length)}
              </span>
            )}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20">
              {lastSession.mode === "reading" ? "Lectura" : lastSession.mode === "match" ? "Emparejar" : "Significado"}
            </span>
          </div>
          <button
            onClick={handleContinue}
            className="mt-3 flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{ color: CRIMSON_DARK }}
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
              ? { borderColor: CRIMSON, backgroundColor: CRIMSON_LIGHT, color: CRIMSON_DARK }
              : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
            }
          >
            <Eye size={14} /> Significado
          </button>
          <button
            onClick={() => setGameMode("reading")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={gameMode === "reading"
              ? { borderColor: CRIMSON, backgroundColor: CRIMSON_LIGHT, color: CRIMSON_DARK }
              : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
            }
          >
            <BookOpenCheck size={14} /> Lectura
          </button>
          <button
            onClick={() => setGameMode("match")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors"
            style={gameMode === "match"
              ? { borderColor: CRIMSON, backgroundColor: CRIMSON_LIGHT, color: CRIMSON_DARK }
              : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
            }
          >
            <Shuffle size={14} /> Emparejar
          </button>
        </div>

        <div className="flex items-center justify-between mt-5">
          <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Configurar sesión</div>
          <button onClick={toggleSelectAll} className="text-xs font-semibold" style={{ color: CRIMSON }}>
            {allSelected ? "Limpiar" : "Seleccionar todos"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          {KANJI_GROUPS.map((group) => {
            const stats = kanjiGroupStats(progress, group.id);
            const isSelected = selectedKanjiGroups.has(group.id);
            const imageUrl = group.image ? getVocabImageUrl(group.image) : undefined;
            const pct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

            return (
              <button
                key={group.id}
                onClick={() => toggleKanjiGroup(group.id)}
                className={`relative text-left rounded-2xl border-2 p-3 transition-colors ${!isSelected ? "hover:border-[#F3C4C0] hover:bg-[#FFFAFA]" : ""}`}
                style={isSelected
                  ? { backgroundColor: CRIMSON_LIGHT, borderColor: CRIMSON, boxShadow: "0 4px 14px rgba(179,38,30,0.18)" }
                  : { backgroundColor: "#FFFFFF", borderColor: BORDER }
                }
              >
                {isSelected && (
                  <span
                    className="absolute -top-2 -right-2 w-[22px] h-[22px] rounded-full flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: CRIMSON }}
                  >
                    <Check size={13} className="text-white" strokeWidth={3} />
                  </span>
                )}
                <div className="w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: "#F5F0EA" }}>
                  {imageUrl ? (
                    <img src={imageUrl} alt={group.label} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{group.emoji}</span>
                  )}
                </div>
                <div className="text-sm font-semibold mt-2" style={{ color: isSelected ? CRIMSON_DARK : TEXT_MAIN }}>
                  {group.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: isSelected ? CRIMSON_DARK : TEXT_SECOND }}>
                  {stats.mastered}/{stats.total} dominados
                </div>
                <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: "#F5E1DF" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CRIMSON }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Preguntas — no aplica al modo Emparejar (usa rondas de 5 sin límite fijo) */}
        {gameMode !== "match" && (
          <div className="mt-5">
            <span className="text-sm font-medium" style={{ color: TEXT_MAIN }}>Preguntas</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {([10, 20] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setKanjiSessionLength(n)}
                  className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors"
                  style={kanjiSessionLength === n
                    ? { borderColor: CRIMSON, backgroundColor: CRIMSON_LIGHT, color: CRIMSON_DARK }
                    : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
                  }
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setKanjiSessionLength("all")}
                className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors"
                style={kanjiSessionLength === "all"
                  ? { borderColor: CRIMSON, backgroundColor: CRIMSON_LIGHT, color: CRIMSON_DARK }
                  : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
                }
              >
                Todos ({filteredKanji.length})
              </button>
              <button
                disabled={notMastered.length === 0}
                onClick={() => setKanjiSessionLength("repasar")}
                className="py-2.5 rounded-xl border-2 text-sm font-medium transition-colors disabled:opacity-40"
                style={kanjiSessionLength === "repasar"
                  ? { borderColor: CRIMSON, backgroundColor: CRIMSON_LIGHT, color: CRIMSON_DARK }
                  : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
                }
              >
                Repasar ({notMastered.length})
              </button>
            </div>
          </div>
        )}

        <button
          ref={startButtonRef}
          disabled={!canStart}
          onClick={handleStartSession}
          className="w-full mt-6 py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ backgroundColor: CRIMSON }}
        >
          <Play size={16} /> Comenzar sesión
        </button>
        <p className="text-center text-xs mt-2" style={{ color: TEXT_MUTED }}>
          {selectedKanjiGroups.size} grupo{selectedKanjiGroups.size === 1 ? "" : "s"} seleccionado{selectedKanjiGroups.size === 1 ? "" : "s"}
          {gameMode === "match" ? ` · ${filteredKanji.length} kanji` : ` · ${sessionSize} kanji · ${notMastered.length} sin dominar`}
        </p>
      </div>

      <FloatingStartButton
        count={gameMode === "match" ? filteredKanji.length : sessionSize}
        disabled={!canStart}
        onClick={handleStartSession}
        accent={CRIMSON}
        targetRef={startButtonRef}
      />
    </div>
  );
}
