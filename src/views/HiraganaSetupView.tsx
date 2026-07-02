import { useState, useRef } from "react";
import { Check, Play, ArrowLeft } from "lucide-react";
import type { CharWithRow, ProgressItems, SessionMode, QueueItem } from "../types";
import type { ViewName } from "../data";
import { ROWS, DAKUTEN_ROWS, COMPOUND_ROWS } from "../data";
import { rowStats } from "../utils";
import { CONFUSED_PAIRS } from "../confusedPairs";

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
  const [setupSlide, setSetupSlide] = useState(0);
  const setupTouchX = useRef<number | null>(null);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Shippori Mincho', serif" }}>
        Hiragana
      </h2>

      {/* Row selector — 3-slide carousel */}
      <div className="mt-5">
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-4">
          {[
            { label: "Básico",        idx: 0 },
            { label: "Dakuten",       idx: 1 },
            { label: "Combinaciones", idx: 2 },
          ].map(({ label, idx }) => (
            <button
              key={idx}
              onClick={() => setSetupSlide(idx)}
              className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${
                setupSlide === idx
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-stone-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          className="overflow-hidden"
          onTouchStart={(e) => { setupTouchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (setupTouchX.current === null) return;
            const dx = e.changedTouches[0].clientX - setupTouchX.current;
            setupTouchX.current = null;
            if (Math.abs(dx) < 40) return;
            if (dx < 0) setSetupSlide((p) => Math.min(p + 1, 2));
            if (dx > 0) setSetupSlide((p) => Math.max(p - 1, 0));
          }}
        >
          <div
            className="flex transition-transform duration-300 ease-in-out items-start"
            style={{ transform: `translateX(-${setupSlide * 100}%)` }}
          >
            {/* Slide 0 — Básico */}
            <div className="w-full flex-shrink-0">
              <div className="flex justify-end mb-2 gap-3 text-xs">
                <button onClick={() => setSelectedRows(new Set(ROWS.map((r) => r.id)))} className="text-indigo-700 hover:underline">Todas</button>
                <button onClick={() => setSelectedRows(new Set())} className="text-stone-400 hover:underline">Limpiar</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ROWS.map((row) => {
                  const stats    = rowStats(progress, row.id);
                  const selected = selectedRows.has(row.id);
                  return (
                    <button
                      key={row.id}
                      onClick={() => toggleRow(row.id)}
                      className={`text-left rounded-xl border-2 p-3 transition-colors ${selected ? "border-indigo-700 bg-indigo-50" : "border-stone-200 bg-white hover:border-stone-300"}`}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{row.chars[0].kana}</span>
                        {stats.mastered ? (
                          <Check size={16} className="text-emerald-600" />
                        ) : stats.accuracy !== null ? (
                          <span className="text-xs text-stone-500">{stats.accuracy}%</span>
                        ) : (
                          <span className="text-xs text-stone-400">nuevo</span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 mt-1">{row.title.split("—")[1].trim()}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slide 1 — Dakuten y Handakuten */}
            <div className="w-full flex-shrink-0">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs text-stone-400">Consonantes sonoras (が・ざ・だ・ば) y semi-sonoras (ぱ).</p>
                <div className="flex gap-3 text-xs ml-2 shrink-0">
                  <button onClick={() => setSelectedDakutenRows(new Set(DAKUTEN_ROWS.map((r) => r.id)))} className="text-indigo-700 hover:underline">Todas</button>
                  <button onClick={() => setSelectedDakutenRows(new Set())} className="text-stone-400 hover:underline">Limpiar</button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DAKUTEN_ROWS.map((row) => {
                  const stats    = rowStats(progress, row.id);
                  const selected = selectedDakutenRows.has(row.id);
                  return (
                    <button
                      key={row.id}
                      onClick={() => toggleDakutenRow(row.id)}
                      className={`text-left rounded-xl border-2 p-3 transition-colors ${selected ? "border-indigo-700 bg-indigo-50" : "border-stone-200 bg-white hover:border-stone-300"}`}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{row.chars[0].kana}</span>
                        {stats.mastered ? (
                          <Check size={16} className="text-emerald-600" />
                        ) : stats.accuracy !== null ? (
                          <span className="text-xs text-stone-500">{stats.accuracy}%</span>
                        ) : (
                          <span className="text-xs text-stone-400">nuevo</span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 mt-1">{row.title.split("—")[1].trim()}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slide 2 — Combinaciones */}
            <div className="w-full flex-shrink-0">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs text-stone-400">Sílabas compuestas con や・ゆ・よ pequeñas.</p>
                <div className="flex gap-3 text-xs ml-2 shrink-0">
                  <button onClick={() => setSelectedCompoundRows(new Set(COMPOUND_ROWS.map((r) => r.id)))} className="text-indigo-700 hover:underline">Todas</button>
                  <button onClick={() => setSelectedCompoundRows(new Set())} className="text-stone-400 hover:underline">Limpiar</button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMPOUND_ROWS.map((row) => {
                  const stats    = rowStats(progress, row.id);
                  const selected = selectedCompoundRows.has(row.id);
                  return (
                    <button
                      key={row.id}
                      onClick={() => toggleCompoundRow(row.id)}
                      className={`text-left rounded-xl border-2 p-3 transition-colors ${selected ? "border-indigo-700 bg-indigo-50" : "border-stone-200 bg-white hover:border-stone-300"}`}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{row.chars[0].kana}</span>
                        {stats.mastered ? (
                          <Check size={16} className="text-emerald-600" />
                        ) : stats.accuracy !== null ? (
                          <span className="text-xs text-stone-500">{stats.accuracy}%</span>
                        ) : (
                          <span className="text-xs text-stone-400">nuevo</span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 mt-1">{row.title.split("—")[1].trim()}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="mt-6">
        <span className="text-sm font-medium text-stone-600">Modo</span>
        <div className="flex gap-2 mt-2">
          {(["recognition", "production", "both"] as SessionMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setSessionMode(m)}
              className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                sessionMode === m
                  ? "border-indigo-700 bg-indigo-50 text-indigo-700"
                  : "border-stone-200 bg-white text-stone-600"
              }`}
            >
              {m === "recognition" ? "Reconocer" : m === "production" ? "Producir" : "Ambos"}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-1">
          {sessionMode === "recognition" && "Ves el kana, escribes el romaji."}
          {sessionMode === "production"  && "Ves el romaji, eliges el kana correcto."}
          {sessionMode === "both"        && "Mezcla de reconocimiento y producción."}
        </p>
      </div>

      {/* Session length */}
      <div className="mt-6">
        <span className="text-sm font-medium text-stone-600">Largo de la sesión</span>
        <div className="flex gap-2 mt-2">
          {([10, 20] as const).map((n) => (
            <button
              key={n}
              onClick={() => setSessionLength(n)}
              className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                sessionLength === n
                  ? "border-indigo-700 bg-indigo-50 text-indigo-700"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setSessionLength("all")}
            className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
              sessionLength === "all"
                ? "border-indigo-700 bg-indigo-50 text-indigo-700"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
            }`}
          >
            Todas ({availableItems.length})
          </button>
        </div>
      </div>

      <button
        disabled={availableItems.length === 0}
        onClick={() => launchSession(poolForSelected, () => startSession(poolForSelected, sessionLength === "all" ? availableItems.length : Math.min(sessionLength, availableItems.length)))}
        className="w-full mt-4 py-3 rounded-xl bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <Play size={18} /> Comenzar sesión
      </button>

      {/* Modos adicionales */}
      <div className="mt-8 pt-6 border-t border-stone-200">
        <span className="text-sm font-medium text-stone-600">Modos adicionales</span>
        <p className="text-xs text-stone-400 mt-1">Usan las mismas filas que elegiste arriba.</p>
      </div>

      {/* Confused pairs */}
      <div className="mt-4">
        <span className="text-sm font-medium text-stone-600">Pares confusos</span>
        <p className="text-xs text-stone-400 mt-1">Practica solo los kana que más se confunden entre sí.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {CONFUSED_PAIRS.map((group, idx) => {
            const selected = selectedPairs.has(idx);
            return (
              <button
                key={idx}
                onClick={() => togglePair(idx)}
                className={`rounded-lg border-2 py-3 text-lg transition-colors ${selected ? "border-indigo-700 bg-indigo-50" : "border-stone-200 bg-white hover:border-stone-300"}`}
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                {group.join("/")}
              </button>
            );
          })}
        </div>
        <button
          disabled={selectedPairs.size === 0 || availablePairItems.length === 0}
          onClick={() => launchSession(poolForPairs, () => startSession(poolForPairs, availablePairItems.length, "recognition"))}
          className="w-full mt-3 py-3 rounded-xl border-2 border-indigo-700 text-indigo-700 bg-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:border-stone-200 disabled:text-stone-400 hover:bg-indigo-50"
        >
          <Play size={18} /> Pares confusos
          {selectedPairs.size > 0 && ` (${availablePairItems.length})`}
        </button>
      </div>

      {/* Sesión de romaji */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-600">Palabras en romaji</span>
          <label className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRomaji}
              onChange={(e) => updateShowRomaji(e.target.checked)}
              className="accent-indigo-700"
            />
            Mostrar romaji
          </label>
        </div>
        <p className="text-xs text-stone-400 mt-1">
          Disponibles según las filas elegidas: {wordPool.length} palabra{wordPool.length === 1 ? "" : "s"}.
        </p>
        <button
          disabled={availableWordItems.length === 0}
          onClick={() => startWordSession(wordPool, availableWordItems.length)}
          className="w-full mt-3 py-3 rounded-xl border-2 border-indigo-700 text-indigo-700 bg-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:border-stone-200 disabled:text-stone-400 hover:bg-indigo-50"
        >
          <Play size={18} /> Sesión de romaji
          {availableWordItems.length > 0 && ` (${availableWordItems.length})`}
        </button>
      </div>
    </div>
  );
}
