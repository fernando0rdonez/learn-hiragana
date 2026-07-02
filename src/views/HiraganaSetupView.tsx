import { useState } from "react";
import { Check, Play, ArrowLeft } from "lucide-react";
import type { CharWithRow, ProgressItems, SessionMode, QueueItem } from "../types";
import type { ViewName } from "../data";
import { ROWS, DAKUTEN_ROWS, COMPOUND_ROWS, ALL_ROW_GROUPS, ALL_CHARS } from "../data";
import { rowStats, buildQueueItems, toISODate } from "../utils";
import { CONFUSED_PAIRS } from "../confusedPairs";
import foxImg from "../assets/character/fox-neutral.png";

interface Props {
  progress: ProgressItems;
  selectedRows: Set<string>;
  toggleRow: (id: string) => void;
  setSelectedRows: (rows: Set<string>) => void;
  selectedDakutenRows: Set<string>;
  toggleDakutenRow: (id: string) => void;
  setSelectedDakutenRows: (rows: Set<string>) => void;
  selectedCompoundRows: Set<string>;
  toggleCompoundRow: (id: string) => void;
  setSelectedCompoundRows: (rows: Set<string>) => void;
  sessionMode: SessionMode;
  setSessionMode: (m: SessionMode) => void;
  sessionLength: 10 | 20 | "all";
  setSessionLength: (n: 10 | 20 | "all") => void;
  availableItems: QueueItem[];
  poolForSelected: CharWithRow[];
  launchSession: (pool: CharWithRow[], startFn: () => void) => void;
  startSession: (pool: CharWithRow[], length: number, mode?: SessionMode) => void;
  selectedPairs: Set<number>;
  togglePair: (idx: number) => void;
  poolForPairs: CharWithRow[];
  availablePairItems: QueueItem[];
  showRomaji: boolean;
  updateShowRomaji: (val: boolean) => void;
  wordPool: CharWithRow[];
  availableWordItems: CharWithRow[];
  startWordSession: (pool: CharWithRow[], length: number) => void;
  setView: (v: ViewName) => void;
}

// ── Design tokens (mismo sistema que HomeView) ──────────────────────────────

const PURPLE       = "#7B4FD4";
const PURPLE_DARK   = "#5533A8";
const PURPLE_LIGHT  = "#EDE7F9";
const CORAL        = "#E85D3A";
const CORAL_LIGHT   = "#FFEEEA";
const CORAL_DARK    = "#C03A1E";
const BORDER        = "#EEEEEE";
const TEXT_MAIN     = "#1A1A2E";
const TEXT_SECOND   = "#8B7FA8";
const TEXT_MUTED    = "#AAAAAA";

type TabId = "basic" | "dakuten" | "compound";

const TAB_LABEL: Record<TabId, string> = { basic: "Básico", dakuten: "Dakuten", compound: "Combinaciones" };
const TAB_ROWS: Record<TabId, typeof ROWS> = { basic: ROWS, dakuten: DAKUTEN_ROWS, compound: COMPOUND_ROWS };

const MODE_LABEL: Record<SessionMode, string> = { recognition: "Reconocer", production: "Producir", both: "Ambos" };
const MODE_SUBTITLE: Record<SessionMode, string> = {
  recognition: "Ves el kana, escribes el romaji.",
  production: "Ves el romaji, produces el kana.",
  both: "Mezcla de ambos modos.",
};

const LAST_SESSION_KEY = "hiragana_last_session";

interface LastSession {
  rowIds: string[];
  tab: TabId;
  mode: SessionMode;
  length: 10 | 20 | "all";
}

function isLastSession(v: unknown): v is LastSession {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return Array.isArray(o.rowIds) && (o.tab === "basic" || o.tab === "dakuten" || o.tab === "compound")
    && (o.mode === "recognition" || o.mode === "production" || o.mode === "both")
    && (o.length === 10 || o.length === 20 || o.length === "all");
}

function shortRowLabel(title: string): string {
  return title.includes("—") ? title.split("—")[1].trim() : title;
}

export default function HiraganaSetupView({
  progress,
  selectedRows, toggleRow, setSelectedRows,
  selectedDakutenRows, toggleDakutenRow, setSelectedDakutenRows,
  selectedCompoundRows, toggleCompoundRow, setSelectedCompoundRows,
  sessionMode, setSessionMode,
  sessionLength, setSessionLength,
  availableItems, poolForSelected,
  launchSession, startSession,
  selectedPairs, togglePair,
  poolForPairs, availablePairItems,
  showRomaji, updateShowRomaji,
  wordPool, availableWordItems, startWordSession,
  setView,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [lastSession] = useState<LastSession | null>(() => {
    const raw = localStorage.getItem(LAST_SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return isLastSession(parsed) ? parsed : null;
    } catch {
      return null; // valor corrupto en localStorage
    }
  });

  const activeRows = TAB_ROWS[activeTab];
  const activeSelected =
    activeTab === "basic" ? selectedRows : activeTab === "dakuten" ? selectedDakutenRows : selectedCompoundRows;
  const setActiveSelected =
    activeTab === "basic" ? setSelectedRows : activeTab === "dakuten" ? setSelectedDakutenRows : setSelectedCompoundRows;
  const toggleActiveRow =
    activeTab === "basic" ? toggleRow : activeTab === "dakuten" ? toggleDakutenRow : toggleCompoundRow;
  const allActiveSelected = activeRows.length > 0 && activeSelected.size === activeRows.length;

  const totalSelectedRows = selectedRows.size + selectedDakutenRows.size + selectedCompoundRows.size;
  const allPairsSelected = selectedPairs.size === CONFUSED_PAIRS.length;

  function toggleSelectAllActive() {
    setActiveSelected(allActiveSelected ? new Set() : new Set(activeRows.map((r) => r.id)));
  }

  function toggleAllPairs() {
    CONFUSED_PAIRS.forEach((_, idx) => {
      if (allPairsSelected === selectedPairs.has(idx)) togglePair(idx);
    });
  }

  function handleStartSession() {
    localStorage.setItem(LAST_SESSION_KEY, JSON.stringify({
      rowIds: [...activeSelected],
      tab: activeTab,
      mode: sessionMode,
      length: sessionLength,
    } satisfies LastSession));
    launchSession(poolForSelected, () =>
      startSession(poolForSelected, sessionLength === "all" ? availableItems.length : Math.min(sessionLength, availableItems.length))
    );
  }

  function handleContinue() {
    if (!lastSession) return;
    setActiveTab(lastSession.tab);
    const setter =
      lastSession.tab === "basic" ? setSelectedRows : lastSession.tab === "dakuten" ? setSelectedDakutenRows : setSelectedCompoundRows;
    setter(new Set(lastSession.rowIds));
    setSessionMode(lastSession.mode);
    setSessionLength(lastSession.length);

    const pool  = ALL_CHARS.filter((c) => lastSession.rowIds.includes(c.row));
    const today = toISODate();
    const items = buildQueueItems(pool, lastSession.mode, pool.length * 2, progress, today);
    const length = lastSession.length === "all" ? items.length : Math.min(lastSession.length, items.length);
    if (length === 0) return;
    launchSession(pool, () => startSession(pool, length, lastSession.mode));
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
        Hiragana
      </h2>

      {/* ── Última sesión ── */}
      {lastSession && (
        <div
          className="relative rounded-3xl p-5 pb-7 mt-5 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})`, overflow: "visible" }}
        >
          <div className="text-[11px] font-semibold tracking-wide uppercase opacity-80">Última sesión</div>
          <div className="flex flex-wrap gap-1.5 mt-2 pr-14">
            {lastSession.rowIds.map((id) => {
              const row = ALL_ROW_GROUPS.find((r) => r.id === id);
              if (!row) return null;
              return (
                <span key={id} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20">
                  {shortRowLabel(row.title)}
                </span>
              );
            })}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20">{MODE_LABEL[lastSession.mode]}</span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20">
              ×{lastSession.length === "all" ? "Todas" : lastSession.length}
            </span>
          </div>
          <button
            onClick={handleContinue}
            className="mt-3 flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{ color: PURPLE_DARK }}
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
        <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Configurar sesión</div>

        <div className="flex gap-1 rounded-xl p-1 mt-3" style={{ backgroundColor: "#F5F3FF" }}>
          {(Object.keys(TAB_LABEL) as TabId[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs rounded-lg font-semibold transition-all ${activeTab === tab ? "bg-white shadow-sm" : ""}`}
              style={{ color: activeTab === tab ? PURPLE_DARK : TEXT_SECOND }}
            >
              {TAB_LABEL[tab]}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 mb-2">
          <span className="text-xs" style={{ color: TEXT_MUTED }}>Toca para seleccionar</span>
          <button onClick={toggleSelectAllActive} className="text-xs font-semibold" style={{ color: PURPLE }}>
            {allActiveSelected ? "Limpiar" : "Seleccionar todas"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {activeRows.map((row) => {
            const stats      = rowStats(progress, row.id);
            const isSelected = activeSelected.has(row.id);
            const badge = stats.mastered
              ? { label: `${stats.accuracy}%`, bg: "#E3FAF3", color: "#0E8F76" }
              : stats.tested > 0
              ? { label: "aprendiendo", bg: "#FFF4E5", color: "#B9790A" }
              : { label: "nuevo", bg: "#F5F5F5", color: TEXT_MUTED };

            return (
              <button
                key={row.id}
                onClick={() => toggleActiveRow(row.id)}
                className={`relative text-left rounded-2xl border-2 p-3 transition-colors ${!isSelected ? "hover:border-[#C9B8F0] hover:bg-[#FAF8FF]" : ""}`}
                style={isSelected
                  ? { backgroundColor: PURPLE_LIGHT, borderColor: PURPLE, boxShadow: "0 4px 14px rgba(123,79,212,0.18)" }
                  : { backgroundColor: "#FFFFFF", borderColor: BORDER }
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: isSelected ? PURPLE_DARK : TEXT_MAIN }}>
                    {row.chars[0].kana}
                  </span>
                  {isSelected ? (
                    <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: PURPLE }}>
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap" style={{ backgroundColor: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <div className="text-xs mt-1" style={{ color: isSelected ? PURPLE_DARK : TEXT_SECOND }}>
                  {shortRowLabel(row.title)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Modo */}
        <div className="flex gap-2 mt-5">
          {(["recognition", "production", "both"] as SessionMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setSessionMode(m)}
              className="flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors"
              style={sessionMode === m
                ? { borderColor: PURPLE, backgroundColor: PURPLE_LIGHT, color: PURPLE_DARK }
                : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
              }
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
        <p className="text-xs mt-1.5" style={{ color: TEXT_MUTED }}>{MODE_SUBTITLE[sessionMode]}</p>

        {/* Preguntas */}
        <div className="flex items-center justify-between mt-5">
          <span className="text-sm font-medium" style={{ color: TEXT_MAIN }}>Preguntas</span>
          <div className="flex gap-2">
            {([10, 20] as const).map((n) => (
              <button
                key={n}
                onClick={() => setSessionLength(n)}
                className="px-4 py-1.5 rounded-full border-2 text-sm font-medium transition-colors"
                style={sessionLength === n
                  ? { borderColor: PURPLE, backgroundColor: PURPLE_LIGHT, color: PURPLE_DARK }
                  : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
                }
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setSessionLength("all")}
              className="px-4 py-1.5 rounded-full border-2 text-sm font-medium transition-colors"
              style={sessionLength === "all"
                ? { borderColor: PURPLE, backgroundColor: PURPLE_LIGHT, color: PURPLE_DARK }
                : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_SECOND }
              }
            >
              Todas ({availableItems.length})
            </button>
          </div>
        </div>

        <button
          disabled={availableItems.length === 0}
          onClick={handleStartSession}
          className="w-full mt-6 py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ backgroundColor: PURPLE }}
        >
          <Play size={16} /> Comenzar sesión
        </button>
        <p className="text-center text-xs mt-2" style={{ color: TEXT_MUTED }}>
          {totalSelectedRows} fila{totalSelectedRows === 1 ? "" : "s"} seleccionada{totalSelectedRows === 1 ? "" : "s"} · {poolForSelected.length} caracteres
        </p>
      </div>

      <div className="h-px my-8" style={{ backgroundColor: "#F5F3FF" }} />

      {/* ── Pares confusos ── */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold" style={{ color: TEXT_MAIN }}>Pares confusos</h3>
            <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>Los kana que más se confunden</p>
          </div>
          <button onClick={toggleAllPairs} className="text-xs font-semibold shrink-0" style={{ color: CORAL }}>
            {allPairsSelected ? "Limpiar" : "Todos"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          {CONFUSED_PAIRS.map((group, idx) => {
            const isSelected = selectedPairs.has(idx);
            return (
              <button
                key={idx}
                onClick={() => togglePair(idx)}
                className="rounded-xl border-2 py-3 text-base font-medium transition-colors"
                style={{
                  fontFamily: "'Noto Sans JP', sans-serif",
                  ...(isSelected
                    ? { borderColor: CORAL, backgroundColor: CORAL_LIGHT, color: CORAL_DARK, boxShadow: "0 4px 12px rgba(232,93,58,0.16)" }
                    : { borderColor: BORDER, backgroundColor: "#FFFFFF", color: TEXT_MAIN }
                  ),
                }}
              >
                {group.join("/")}
              </button>
            );
          })}
        </div>

        <button
          disabled={selectedPairs.size === 0 || availablePairItems.length === 0}
          onClick={() => launchSession(poolForPairs, () => startSession(poolForPairs, availablePairItems.length, "recognition"))}
          className="w-full mt-4 py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ backgroundColor: CORAL }}
        >
          <Play size={16} /> Practicar pares
          {selectedPairs.size > 0 && ` (${availablePairItems.length})`}
        </button>
      </div>

      {/* ── Sesión de romaji ── */}
      <div className="mt-8 pt-6" style={{ borderTop: "1px solid #F5F3FF" }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: TEXT_MAIN }}>Palabras en romaji</span>
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: TEXT_SECOND }}>
            <input
              type="checkbox"
              checked={showRomaji}
              onChange={(e) => updateShowRomaji(e.target.checked)}
              style={{ accentColor: PURPLE }}
            />
            Mostrar romaji
          </label>
        </div>
        <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
          Disponibles según las filas elegidas: {wordPool.length} palabra{wordPool.length === 1 ? "" : "s"}.
        </p>
        <button
          disabled={availableWordItems.length === 0}
          onClick={() => startWordSession(wordPool, availableWordItems.length)}
          className="w-full mt-3 py-3 rounded-2xl border-2 font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ borderColor: PURPLE, color: PURPLE, backgroundColor: "#FFFFFF" }}
        >
          <Play size={16} /> Sesión de romaji
          {availableWordItems.length > 0 && ` (${availableWordItems.length})`}
        </button>
      </div>
    </div>
  );
}
