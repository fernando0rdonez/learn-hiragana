import { useState, useEffect, useRef } from "react";
import { Check, X, RotateCcw, BarChart3, Play, Trash2, ArrowLeft, Flame, ChevronRight } from "lucide-react";
import type {
  CharWithRow,
  ProgressItems,
  CharStatus, SessionMode,
} from "./types";
import { buildSessionQueue } from "./leitner";
import { CONFUSED_PAIRS } from "./confusedPairs";
import { WORDS, getAvailableWords } from "./words";
import { VOCABULARY, VOCAB_CATEGORIES } from "./vocabulary";
import { DEFAULT_STREAK, DEFAULT_DAILY_PROGRESS, DAILY_GOAL } from "./streak";
import { PHENOMENON_GROUPS, getAvailablePhonetics } from "./phonetics";
import ProductionCard from "./components/ProductionCard";
import VocabularyGame from "./components/VocabularyGame";
import PhoneticsDrill from "./components/PhoneticsDrill";
import AudioButton from "./components/AudioButton";
import { type ViewName, ROWS, DAKUTEN_ROWS, COMPOUND_ROWS, ALL_ROW_GROUPS, ALL_CHARS } from "./data";
import { toISODate, buildQueueItems, charStatus } from "./utils";
import { useProgress } from "./hooks/useProgress";
import { useStreak } from "./hooks/useStreak";
import { useSession } from "./hooks/useSession";

const STATUS_STYLE: Record<CharStatus, string> = {
  untested:   "bg-stone-100 text-stone-400 border-stone-200",
  developing: "bg-amber-100 text-amber-800 border-amber-200",
  weak:       "bg-rose-100 text-rose-700 border-rose-300",
  mastered:   "bg-emerald-100 text-emerald-700 border-emerald-300",
};

// ── Component ──────────────────────────────────────────────────────────────

export default function HiraganaTrainer() {
  const { streak, setStreak, dailyProgress, setDailyProgress } = useStreak();
  const { loading, saveError, progress, setProgress, showRomaji, persist, updateShowRomaji } = useProgress({
    streak, dailyProgress, setStreak, setDailyProgress,
  });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedDakutenRows, setSelectedDakutenRows] = useState<Set<string>>(new Set());
  const [selectedCompoundRows, setSelectedCompoundRows] = useState<Set<string>>(new Set());
  const [selectedPairs, setSelectedPairs] = useState<Set<number>>(new Set());
  const [selectedPhenomena, setSelectedPhenomena] = useState<Set<string>>(new Set());
  const [view, setView]             = useState<ViewName>("home");
  const [setupSlide, setSetupSlide] = useState(0);
  const setupTouchX = useRef<number | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [sessionMode, setSessionMode]   = useState<SessionMode>("recognition");
  const [sessionLength, setSessionLength] = useState<10 | 20 | "all">(20);
  const [vocabSessionLimit, setVocabSessionLimit] = useState<20 | 50 | "all">(50);
  const [selectedVocabCategory, setSelectedVocabCategory] = useState<string | null>(null);

  const {
    previewRows, pendingStartRef,
    sessionQueue, sessionIndexRef,
    currentMode, correctCount, missedList, current, input, setInput, feedback,
    choices, selectedOption,
    inputRef, nextBtnRef,
    launchSession, startSession, startWordSession,
    handleSubmit, handleProductionAnswer, handleProductionNext,
    reviewMisses,
  } = useSession({ progress, setProgress, streak, dailyProgress, persist, setView, sessionMode });

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Noto+Sans+JP:wght@500;700&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // ── Setup helpers ─────────────────────────────────────────────────────────

  function toggleRow(id: string) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function togglePair(idx: number) {
    setSelectedPairs((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  function toggleDakutenRow(id: string) {
    setSelectedDakutenRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCompoundRow(id: string) {
    setSelectedCompoundRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function togglePhenomenon(id: string) {
    setSelectedPhenomena((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function rowStats(rowId: string) {
    const chars = ALL_ROW_GROUPS.find((r) => r.id === rowId)?.chars ?? [];
    let attempts = 0, correct = 0, tested = 0;
    chars.forEach((ch) => {
      const p = progress[`recognition:${ch.kana}`];
      if (p && p.attempts > 0) { tested++; attempts += p.attempts; correct += p.correct; }
    });
    const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : null;
    const mastered  = chars.every((ch) => charStatus(progress, ch.kana) === "mastered");
    return { accuracy, tested, total: chars.length, mastered };
  }

  function isRowReady(rowId: string): boolean {
    return selectedRows.has(rowId) || selectedDakutenRows.has(rowId) || selectedCompoundRows.has(rowId) || rowStats(rowId).mastered;
  }

  function resetProgress() {
    const empty: ProgressItems = {};
    setProgress(empty);
    persist(empty, DEFAULT_STREAK, DEFAULT_DAILY_PROGRESS);
    setResetConfirm(false);
    setView("home");
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const today           = toISODate();
  const poolForSelected = ALL_CHARS.filter((c) => selectedRows.has(c.row) || selectedDakutenRows.has(c.row) || selectedCompoundRows.has(c.row));
  const availableItems  = buildQueueItems(poolForSelected, sessionMode, poolForSelected.length * 2, progress, today);
  const masteredTotal   = ALL_CHARS.filter((c) => charStatus(progress, c.kana) === "mastered").length;

  const pairKanaSet     = new Set([...selectedPairs].flatMap((idx) => CONFUSED_PAIRS[idx]));
  const poolForPairs    = ALL_CHARS.filter((c) => pairKanaSet.has(c.kana));
  const availablePairItems = buildQueueItems(poolForPairs, "recognition", poolForPairs.length * 2, progress, today);

  const wordPool: CharWithRow[] = getAvailableWords(isRowReady)
    .map((w): CharWithRow => ({ kana: w.kana, romaji: w.romaji, row: "word" }));
  const availableWordItems = buildSessionQueue(wordPool, progress, "word", wordPool.length * 2, today);

  const phoneticPool = getAvailablePhonetics(selectedPhenomena);

  const filteredVocabulary = selectedVocabCategory
    ? VOCABULARY.filter((w) => w.category === selectedVocabCategory)
    : VOCABULARY;

  const queueLen    = sessionQueue.length;
  const questionNum = sessionIndexRef.current + 1;

  const uniqueMissed = new Set(missedList.map((m) => `${m.mode}:${m.kana}`)).size;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-400">Cargando progreso…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-100 text-stone-900 flex justify-center px-4 py-8">
      <style>{`
        @keyframes stampIn { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .stamp-pop { animation: stampIn 0.35s ease-out; }
      `}</style>
      <div className="w-full max-w-xl">

        {/* ── Home ── */}
        {view === "home" && (
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              ひらがな trainer
            </h1>
            {streak.current > 0 && (
              <p className="text-stone-500 text-sm mt-1 flex items-center gap-1">
                <Flame size={14} className="text-orange-500" />
                Racha de {streak.current} día{streak.current === 1 ? "" : "s"}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3">
              {/* Hiragana card */}
              <button
                onClick={() => setView("hiraganaSetup")}
                className="w-full text-left rounded-2xl border-2 border-stone-200 bg-white p-5 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl shrink-0" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>あ</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold text-stone-800">Hiragana</div>
                    <div className="text-sm text-stone-500 mt-0.5">{masteredTotal}/{ALL_CHARS.length} caracteres dominados</div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-indigo-700 rounded-full transition-all" style={{ width: `${(masteredTotal / ALL_CHARS.length) * 100}%` }} />
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-stone-400 shrink-0" />
                </div>
              </button>

              {/* Vocabulario card */}
              <button
                onClick={() => setView("vocabCategory")}
                className="w-full text-left rounded-2xl border-2 border-stone-200 bg-white p-5 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl shrink-0">🎴</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold text-stone-800">Vocabulario</div>
                    <div className="text-sm text-stone-500 mt-0.5">{VOCABULARY.length} palabras · {VOCAB_CATEGORIES.length} categorías</div>
                  </div>
                  <ChevronRight size={18} className="text-stone-400 shrink-0" />
                </div>
              </button>

              {/* Fonética card */}
              <button
                onClick={() => setView("phoneticSetup")}
                className="w-full text-left rounded-2xl border-2 border-stone-200 bg-white p-5 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl shrink-0">🎤</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold text-stone-800">Fonética</div>
                    <div className="text-sm text-stone-500 mt-0.5">Practica cómo suenan realmente las palabras</div>
                  </div>
                  <ChevronRight size={18} className="text-stone-400 shrink-0" />
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between mt-8">
              <button onClick={() => setView("stats")} className="text-sm text-stone-500 flex items-center gap-1 hover:text-stone-700">
                <BarChart3 size={14} /> Ver estadísticas
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
              <p className="text-xs text-rose-600 mt-3">No se pudo guardar el progreso. Tus respuestas de esta sesión podrían no persistir.</p>
            )}
          </div>
        )}

        {/* ── Hiragana Setup ── */}
        {view === "hiraganaSetup" && (
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
                        const stats    = rowStats(row.id);
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
                        const stats    = rowStats(row.id);
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
                        const stats    = rowStats(row.id);
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
        )}

        {/* ── Preview ── */}
        {view === "preview" && (
          <div className="flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-xs text-stone-500 mb-6">
              <button onClick={() => setView("hiraganaSetup")} className="flex items-center gap-1 hover:text-stone-700">
                <ArrowLeft size={14} /> Volver
              </button>
              <span>Repaso previo</span>
            </div>

            <p className="text-sm text-stone-500 mb-6 text-center">
              {previewRows.length === 1
                ? `La siguiente sesión incluye la fila "${previewRows[0].title.split("—")[1].trim()}", que es nueva para ti.`
                : `La siguiente sesión incluye ${previewRows.length} filas nuevas para ti.`}
            </p>

            {previewRows.map((row) => (
              <div key={row.id} className="w-full mb-8">
                <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-4 text-center">
                  {row.title.split("—")[1].trim()}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {row.chars.map((ch) => (
                    <div key={ch.kana} className="flex flex-col items-center gap-1 w-16">
                      <span className="text-5xl select-none" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                        {ch.kana}
                      </span>
                      <span className="text-sm text-stone-500">{ch.romaji}</span>
                      <AudioButton text={ch.kana} className="mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="w-full flex flex-col gap-2 mt-4">
              <button
                onClick={() => { pendingStartRef.current?.(); }}
                className="w-full py-3 rounded-xl bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Play size={18} /> Empezar test
              </button>
              <button
                onClick={() => { pendingStartRef.current?.(); }}
                className="w-full py-3 rounded-xl border-2 border-stone-300 text-stone-500 font-medium text-sm"
              >
                Ya me los sé, saltar repaso
              </button>
            </div>
          </div>
        )}

        {/* ── Quiz ── */}
        {view === "quiz" && current && (
          <div className="flex flex-col items-center">
            {/* Header */}
            <div className="w-full flex items-center justify-between text-xs text-stone-500 mb-2">
              <button onClick={() => setView("home")} className="flex items-center gap-1 hover:text-stone-700">
                <ArrowLeft size={14} /> Salir
              </button>
              <span>Pregunta {Math.min(questionNum, queueLen)} de {queueLen}</span>
            </div>
            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden mb-10">
              <div className="h-full bg-indigo-700 transition-all" style={{ width: `${((questionNum - 1) / queueLen) * 100}%` }} />
            </div>

            {currentMode !== "production" ? (
              /* ── Recognition / word: kana → romaji ── */
              <>
                <div className="flex flex-col items-center mb-10 gap-3">
                  <div
                    key={current.kana + "-rec"}
                    className={`select-none ${currentMode === "word" ? "text-6xl" : "text-9xl"}`}
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                  >
                    {current.kana}
                  </div>
                  <AudioButton text={current.kana} />
                </div>

                <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={!!feedback}
                    placeholder="romaji"
                    autoComplete="off"
                    autoCapitalize="off"
                    className={`w-48 text-center text-xl py-2 px-3 rounded-lg border-2 outline-none transition-colors ${
                      feedback?.status === "correct" ? "border-emerald-400 bg-emerald-50" :
                      feedback?.status === "wrong"   ? "border-rose-400 bg-rose-50" :
                      "border-stone-300 focus:border-indigo-600"
                    }`}
                  />

                  {feedback?.status === "correct" && (
                    <div className="stamp-pop flex items-center gap-2 text-emerald-700 font-semibold">
                      <span className="rounded-full border-2 border-emerald-600 p-1"><Check size={16} /></span>
                      ¡Correcto!{currentMode === "word" && ` — ${WORDS.find((w) => w.kana === current.kana)?.meaning}`}
                    </div>
                  )}
                  {feedback?.status === "wrong" && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 text-rose-700 font-semibold">
                        <span className="rounded-full border-2 border-rose-600 p-1"><X size={16} /></span>
                        Era "{feedback.expected}"{currentMode === "word" && ` — ${WORDS.find((w) => w.kana === current.kana)?.meaning}`}
                      </div>
                      <button ref={nextBtnRef} type="submit" className="px-6 py-3 rounded-lg bg-rose-700 text-white text-sm font-medium">
                        Siguiente →
                      </button>
                    </div>
                  )}
                  {!feedback && (
                    <button type="submit" className="px-6 py-3 rounded-lg bg-indigo-700 text-white text-sm font-medium">
                      Comprobar
                    </button>
                  )}
                </form>
              </>
            ) : (
              /* ── Production: romaji → kana ── */
              <ProductionCard
                key={current.kana + "-prod"}
                romaji={current.romaji}
                choices={choices}
                correctKana={current.kana}
                selectedKana={selectedOption}
                feedback={feedback}
                onSelect={handleProductionAnswer}
                onNext={handleProductionNext}
                nextBtnRef={nextBtnRef}
              />
            )}

            <p className="text-xs text-stone-400 mt-10">
              {correctCount}/{sessionIndexRef.current} correctas en esta sesión
            </p>
          </div>
        )}

        {/* ── Summary ── */}
        {view === "summary" && (
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Shippori Mincho', serif" }}>Sesión completa</h2>
            <div className="mt-4 rounded-xl bg-white border border-stone-200 p-5 text-center">
              <span className="text-5xl font-bold text-indigo-700">
                {sessionIndexRef.current > 0 ? Math.round((correctCount / sessionIndexRef.current) * 100) : 0}%
              </span>
              <p className="text-stone-500 text-sm mt-1">{correctCount} de {sessionIndexRef.current} correctas</p>
            </div>

            {missedList.length > 0 && (
              <div className="mt-5">
                <span className="text-sm font-medium text-stone-600">Fallos de esta sesión</span>
                <div className="mt-2 space-y-1">
                  {[...new Map(missedList.map((m) => [`${m.mode}:${m.kana}`, m])).values()].map((m) => (
                    <div key={`${m.mode}:${m.kana}`} className="flex items-center justify-between gap-2 text-sm bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                      <span className="text-xl shrink-0" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{m.kana}</span>
                      <span className="text-stone-400 text-xs shrink-0">{m.mode === "production" ? "→ kana" : "→ romaji"}</span>
                      <span className="text-stone-500 truncate">{m.mode === "production" ? "elegiste" : "escribiste"} "{m.given}"</span>
                      <span className="text-rose-700 font-medium shrink-0">
                        era "{m.expected}"{m.mode === "word" && ` — ${WORDS.find((w) => w.kana === m.kana)?.meaning}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-6">
              {missedList.length > 0 && (
                <button onClick={reviewMisses} className="w-full py-3 rounded-xl bg-rose-700 text-white font-semibold flex items-center justify-center gap-2">
                  <RotateCcw size={16} /> Repasar fallos ({uniqueMissed})
                </button>
              )}
              <button onClick={() => setView("home")} className="w-full py-3 rounded-xl bg-indigo-700 text-white font-semibold">
                Nueva sesión
              </button>
              <button onClick={() => setView("stats")} className="w-full py-2 rounded-xl text-stone-500 text-sm">
                Ver estadísticas
              </button>
            </div>
          </div>
        )}

        {/* ── Fonética: selector ── */}
        {view === "phoneticSetup" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
                <ArrowLeft size={14} /> Inicio
              </button>
            </div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              🎤 Fonética
            </h2>
            <p className="text-stone-500 text-sm mt-1">Practica cómo suenan realmente las palabras japonesas.</p>
            <div className="flex flex-col gap-2 mt-5">
              {PHENOMENON_GROUPS.map((pg) => {
                const sel = selectedPhenomena.has(pg.id);
                return (
                  <button
                    key={pg.id}
                    onClick={() => togglePhenomenon(pg.id)}
                    className={`text-left rounded-xl border-2 p-3 transition-colors ${sel ? "border-indigo-700 bg-indigo-50" : "border-stone-200 bg-white hover:border-stone-300"}`}
                  >
                    <div className="text-sm font-medium text-stone-700">{pg.title}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{pg.description}</div>
                  </button>
                );
              })}
            </div>
            <button
              disabled={phoneticPool.length === 0}
              onClick={() => setView("phonetics")}
              className="w-full mt-4 py-3 rounded-xl bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Play size={18} /> Comenzar sesión
              {phoneticPool.length > 0 && ` (${phoneticPool.length})`}
            </button>
          </div>
        )}

        {/* ── Fonética ── */}
        {view === "phonetics" && (
          <PhoneticsDrill
            phoneticWords={phoneticPool}
            progress={progress}
            onProgressUpdate={(updates) => {
              const merged = { ...progress, ...updates };
              setProgress(merged);
              persist(merged);
            }}
            onBack={() => setView("home")}
          />
        )}

        {/* ── Vocabulario: selector de categoría ── */}
        {view === "vocabCategory" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
                <ArrowLeft size={14} /> Inicio
              </button>
            </div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              🎴 Vocabulario
            </h2>

            {/* Category picker */}
            <div className="mt-5">
              <span className="text-sm font-medium text-stone-600">Categoría</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => setSelectedVocabCategory(null)}
                  className={`text-left rounded-xl border-2 p-3 transition-colors ${
                    selectedVocabCategory === null
                      ? "border-indigo-700 bg-indigo-50"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="text-2xl">🌐</div>
                  <div className="text-sm font-medium text-stone-700 mt-1">Todas</div>
                  <div className="text-xs text-stone-400">{VOCABULARY.length} palabras</div>
                </button>
                {VOCAB_CATEGORIES.map((cat) => {
                  const count = VOCABULARY.filter((w) => w.category === cat.id).length;
                  const selected = selectedVocabCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedVocabCategory(cat.id)}
                      className={`text-left rounded-xl border-2 p-3 transition-colors ${
                        selected
                          ? "border-indigo-700 bg-indigo-50"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className="text-2xl">{cat.emoji}</div>
                      <div className="text-sm font-medium text-stone-700 mt-1">{cat.label}</div>
                      <div className="text-xs text-stone-400">{count} palabras</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Session length */}
            <div className="mt-6">
              <span className="text-sm font-medium text-stone-600">Palabras por sesión</span>
              <div className="flex gap-2 mt-2">
                {([20, 50] as const).map((n) => {
                  const max = filteredVocabulary.length;
                  return (
                    <button
                      key={n}
                      disabled={max < n}
                      onClick={() => setVocabSessionLimit(n)}
                      className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors disabled:opacity-40 ${
                        vocabSessionLimit === n
                          ? "border-indigo-700 bg-indigo-50 text-indigo-700"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  onClick={() => setVocabSessionLimit("all")}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    vocabSessionLimit === "all"
                      ? "border-indigo-700 bg-indigo-50 text-indigo-700"
                      : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                  }`}
                >
                  Todas ({filteredVocabulary.length})
                </button>
              </div>
            </div>

            <button
              disabled={filteredVocabulary.length === 0}
              onClick={() => setView("spellIt")}
              className="w-full mt-4 py-3 rounded-xl bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Play size={18} /> Comenzar vocabulario
            </button>
          </div>
        )}

        {/* ── Vocabulario ── */}
        {view === "spellIt" && (
          <VocabularyGame
            vocabulary={filteredVocabulary}
            progress={progress}
            showRomaji={showRomaji}
            sessionLimit={vocabSessionLimit === "all" ? filteredVocabulary.length : vocabSessionLimit}
            onProgressUpdate={(updates) => {
              const merged = { ...progress, ...updates };
              setProgress(merged);
              persist(merged);
            }}
            onBack={() => setView("home")}
          />
        )}

        {/* ── Stats ── */}
        {view === "stats" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ fontFamily: "'Shippori Mincho', serif" }}>Tu progreso</h2>
              <button onClick={() => setView("home")} className="text-sm text-indigo-700 flex items-center gap-1">
                <ArrowLeft size={14} /> Inicio
              </button>
            </div>
            <p className="text-stone-500 text-sm mb-4">{masteredTotal}/{ALL_CHARS.length} dominados (3+ intentos, ≥85% acierto)</p>
            <p className="text-stone-500 text-sm mb-4">
              Racha actual: {streak.current} día{streak.current === 1 ? "" : "s"} · Récord: {streak.longest} ·
              Hoy: {Math.min(dailyProgress.date === today ? dailyProgress.correctToday : 0, DAILY_GOAL)}/{DAILY_GOAL} aciertos
            </p>

            {/* Basic rows */}
            <div className="text-sm font-semibold text-stone-600 mb-2">Hiragana básico</div>
            {ROWS.map((row) => (
              <div key={row.id} className="mb-4">
                <div className="text-xs font-medium text-stone-500 mb-1">{row.title}</div>
                <div className="flex flex-wrap gap-1.5">
                  {row.chars.map((ch) => {
                    const status = charStatus(progress, ch.kana);
                    return (
                      <div key={ch.kana} className={`w-12 h-14 rounded-lg border flex flex-col items-center justify-center ${STATUS_STYLE[status]}`}>
                        <span className="text-lg" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{ch.kana}</span>
                        <span className="text-[10px]">{ch.romaji}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Dakuten / Handakuten rows */}
            <div className="text-sm font-semibold text-stone-600 mt-2 mb-2">Dakuten y Handakuten</div>
            {DAKUTEN_ROWS.map((row) => (
              <div key={row.id} className="mb-4">
                <div className="text-xs font-medium text-stone-500 mb-1">{row.title}</div>
                <div className="flex flex-wrap gap-1.5">
                  {row.chars.map((ch) => {
                    const status = charStatus(progress, ch.kana);
                    return (
                      <div key={ch.kana} className={`w-12 h-14 rounded-lg border flex flex-col items-center justify-center ${STATUS_STYLE[status]}`}>
                        <span className="text-lg" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{ch.kana}</span>
                        <span className="text-[10px]">{ch.romaji}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Compound (拗音) rows */}
            <div className="text-sm font-semibold text-stone-600 mt-2 mb-2">Combinaciones (拗音)</div>
            {COMPOUND_ROWS.map((row) => (
              <div key={row.id} className="mb-4">
                <div className="text-xs font-medium text-stone-500 mb-1">{row.title}</div>
                <div className="flex flex-wrap gap-1.5">
                  {row.chars.map((ch) => {
                    const status = charStatus(progress, ch.kana);
                    return (
                      <div key={ch.kana} className={`w-12 h-14 rounded-lg border flex flex-col items-center justify-center ${STATUS_STYLE[status]}`}>
                        <span className="text-lg" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{ch.kana}</span>
                        <span className="text-[10px]">{ch.romaji}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
