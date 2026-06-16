import { useState, useEffect, useRef } from "react";
import { Check, X, RotateCcw, BarChart3, Play, Trash2, ArrowLeft } from "lucide-react";
import type {
  CharWithRow, CharData,
  ProgressItems, ItemProgress,
  CharStatus, SessionMode, QueueItem, QuizMode,
} from "./types";
import { loadProgress, saveProgress } from "./storage";
import { advanceBox, buildSessionQueue } from "./leitner";
import { getConfusablePairs, CONFUSED_PAIRS } from "./confusedPairs";
import { WORDS, getAvailableWords } from "./words";
import ProductionCard from "./components/ProductionCard";

// ── Data ───────────────────────────────────────────────────────────────────

const ROWS: { id: string; title: string; chars: CharData[] }[] = [
  { id: "a",  title: "あ — fila A",      chars: [{ kana: "あ", romaji: "a" }, { kana: "い", romaji: "i" }, { kana: "う", romaji: "u" }, { kana: "え", romaji: "e" }, { kana: "お", romaji: "o" }] },
  { id: "ka", title: "か — fila KA",     chars: [{ kana: "か", romaji: "ka" }, { kana: "き", romaji: "ki" }, { kana: "く", romaji: "ku" }, { kana: "け", romaji: "ke" }, { kana: "こ", romaji: "ko" }] },
  { id: "sa", title: "さ — fila SA",     chars: [{ kana: "さ", romaji: "sa" }, { kana: "し", romaji: "shi" }, { kana: "す", romaji: "su" }, { kana: "せ", romaji: "se" }, { kana: "そ", romaji: "so" }] },
  { id: "ta", title: "た — fila TA",     chars: [{ kana: "た", romaji: "ta" }, { kana: "ち", romaji: "chi" }, { kana: "つ", romaji: "tsu" }, { kana: "て", romaji: "te" }, { kana: "と", romaji: "to" }] },
  { id: "na", title: "な — fila NA",     chars: [{ kana: "な", romaji: "na" }, { kana: "に", romaji: "ni" }, { kana: "ぬ", romaji: "nu" }, { kana: "ね", romaji: "ne" }, { kana: "の", romaji: "no" }] },
  { id: "ha", title: "は — fila HA",     chars: [{ kana: "は", romaji: "ha" }, { kana: "ひ", romaji: "hi" }, { kana: "ふ", romaji: "fu" }, { kana: "へ", romaji: "he" }, { kana: "ほ", romaji: "ho" }] },
  { id: "ma", title: "ま — fila MA",     chars: [{ kana: "ま", romaji: "ma" }, { kana: "み", romaji: "mi" }, { kana: "む", romaji: "mu" }, { kana: "め", romaji: "me" }, { kana: "も", romaji: "mo" }] },
  { id: "ya", title: "や — fila YA",     chars: [{ kana: "や", romaji: "ya" }, { kana: "ゆ", romaji: "yu" }, { kana: "よ", romaji: "yo" }] },
  { id: "ra", title: "ら — fila RA",     chars: [{ kana: "ら", romaji: "ra" }, { kana: "り", romaji: "ri" }, { kana: "る", romaji: "ru" }, { kana: "れ", romaji: "re" }, { kana: "ろ", romaji: "ro" }] },
  { id: "wa", title: "わ — fila WA / N", chars: [{ kana: "わ", romaji: "wa" }, { kana: "を", romaji: "wo", accept: ["wo", "o"] }, { kana: "ん", romaji: "n" }] },
];

const ALL_CHARS: CharWithRow[] = ROWS.flatMap((row) =>
  row.chars.map((ch) => ({ ...ch, row: row.id }))
);

// ── Local types ────────────────────────────────────────────────────────────

type ViewName = "setup" | "quiz" | "summary" | "stats";

interface Feedback {
  status: "correct" | "wrong";
  expected: string;
}

interface MissedItem {
  kana: string;
  mode: QuizMode;
  given: string;    // recognition/word: typed romaji · production: selected kana
  expected: string; // recognition/word: correct romaji · production: correct kana
}

// ── Pure helpers ───────────────────────────────────────────────────────────

export function toISODate(d: Date = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Builds a session queue for the given mode.
 * "both" interleaves recognition + production items shuffled together.
 */
function buildQueueItems(
  pool: CharWithRow[],
  mode: SessionMode,
  length: number,
  items: ProgressItems,
  today: string,
): QueueItem[] {
  if (mode === "both") {
    const half = Math.ceil(length / 2);
    const rec  = buildSessionQueue(pool, items, "recognition", half, today).map((c): QueueItem => ({ char: c, mode: "recognition" }));
    const prod = buildSessionQueue(pool, items, "production",  half, today).map((c): QueueItem => ({ char: c, mode: "production" }));
    const combined = [...rec, ...prod];
    shuffleInPlace(combined);
    return combined.slice(0, length);
  }
  return buildSessionQueue(pool, items, mode, length, today).map((c): QueueItem => ({ char: c, mode }));
}

/**
 * Picks 4 answer choices for a production question:
 *   - 1 correct kana
 *   - ≥1 distractor from the confused-pairs list (when available in pool or ALL_CHARS)
 *   - remaining slots filled from pool, falling back to ALL_CHARS
 */
function getChoices(kana: string, pool: CharWithRow[]): CharWithRow[] {
  const correct = ALL_CHARS.find((c) => c.kana === kana)!;
  const confusedKanas = getConfusablePairs(kana);

  // Confused distractors — prefer pool, fallback to ALL_CHARS
  const confusedChoices = confusedKanas
    .map((k) => pool.find((c) => c.kana === k) ?? ALL_CHARS.find((c) => c.kana === k))
    .filter((c): c is CharWithRow => !!c);
  shuffleInPlace(confusedChoices);

  // Other candidates: deduplicated, not the correct kana, not confused
  const excluded = new Set([kana, ...confusedKanas]);
  const others: CharWithRow[] = [];
  for (const c of [...pool, ...ALL_CHARS]) {
    if (!excluded.has(c.kana)) {
      excluded.add(c.kana);
      others.push(c);
    }
  }
  shuffleInPlace(others);

  const distractors: CharWithRow[] = [];
  if (confusedChoices.length > 0) distractors.push(confusedChoices[0]);
  for (const c of others) {
    if (distractors.length >= 3) break;
    distractors.push(c);
  }

  const result = [correct, ...distractors.slice(0, 3)];
  shuffleInPlace(result);
  return result;
}

function findQueueChar(kana: string, mode: QuizMode): CharWithRow | undefined {
  if (mode === "word") {
    const w = WORDS.find((entry) => entry.kana === kana);
    return w ? { kana: w.kana, romaji: w.romaji, row: "word" } : undefined;
  }
  return ALL_CHARS.find((c) => c.kana === kana);
}

function charStatus(items: ProgressItems, kana: string): CharStatus {
  const p = items[`recognition:${kana}`];
  if (!p || p.attempts === 0) return "untested";
  const acc = p.correct / p.attempts;
  if (p.attempts >= 3 && acc >= 0.85) return "mastered";
  if (acc < 0.5) return "weak";
  return "developing";
}

const STATUS_STYLE: Record<CharStatus, string> = {
  untested:   "bg-stone-100 text-stone-400 border-stone-200",
  developing: "bg-amber-100 text-amber-800 border-amber-200",
  weak:       "bg-rose-100 text-rose-700 border-rose-300",
  mastered:   "bg-emerald-100 text-emerald-700 border-emerald-300",
};

// ── Component ──────────────────────────────────────────────────────────────

export default function HiraganaTrainer() {
  const [loading, setLoading]       = useState(true);
  const [saveError, setSaveError]   = useState(false);
  const [progress, setProgress]     = useState<ProgressItems>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedPairs, setSelectedPairs] = useState<Set<number>>(new Set());
  const [view, setView]             = useState<ViewName>("setup");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [sessionMode, setSessionMode]   = useState<SessionMode>("recognition");

  // Session state
  const [sessionQueue, setSessionQueue]   = useState<QueueItem[]>([]);
  const sessionQueueRef = useRef<QueueItem[]>([]);
  const sessionPoolRef  = useRef<CharWithRow[]>([]);
  const sessionIndexRef = useRef(0);

  const [currentMode, setCurrentMode]   = useState<QuizMode>("recognition");
  const [correctCount, setCorrectCount] = useState(0);
  const [missedList, setMissedList]     = useState<MissedItem[]>([]);
  const [current, setCurrent]           = useState<CharWithRow | null>(null);
  const [input, setInput]               = useState("");
  const [feedback, setFeedback]         = useState<Feedback | null>(null);

  // Production-specific state
  const [choices, setChoices]           = useState<CharWithRow[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const inputRef   = useRef<HTMLInputElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&display=swap";
    document.head.appendChild(link);
    setProgress(loadProgress().items);
    setLoading(false);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (feedback?.status === "wrong" && nextBtnRef.current) nextBtnRef.current.focus();
  }, [feedback]);

  // ── Persistence ──────────────────────────────────────────────────────────

  function persist(newItems: ProgressItems) {
    const ok = saveProgress({ items: newItems });
    setSaveError(!ok);
  }

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

  function rowStats(rowId: string) {
    const chars = ROWS.find((r) => r.id === rowId)?.chars ?? [];
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
    return selectedRows.has(rowId) || rowStats(rowId).mastered;
  }

  // ── Queue management ──────────────────────────────────────────────────────

  function updateQueue(q: QueueItem[]) {
    sessionQueueRef.current = q;
    setSessionQueue(q);
  }

  function goNext() {
    const idx   = sessionIndexRef.current;
    const queue = sessionQueueRef.current;
    if (idx >= queue.length) {
      setView("summary");
      setCurrent(null);
      setFeedback(null);
      return;
    }
    const item = queue[idx];
    setCurrent(item.char);
    setCurrentMode(item.mode);
    setSelectedOption(null);
    setInput("");
    setFeedback(null);
    if (item.mode === "production") {
      setChoices(getChoices(item.char.kana, sessionPoolRef.current));
    }
  }

  // ── Session start ─────────────────────────────────────────────────────────

  function startSession(pool: CharWithRow[], length: number, mode: SessionMode = sessionMode) {
    const today = toISODate();
    const queue = buildQueueItems(pool, mode, length, progress, today);
    if (queue.length === 0) return;

    sessionIndexRef.current = 0;
    sessionPoolRef.current  = pool;
    updateQueue(queue);
    setMissedList([]);
    setCorrectCount(0);
    setSelectedOption(null);
    setInput("");
    setFeedback(null);

    const first = queue[0];
    setCurrent(first.char);
    setCurrentMode(first.mode);
    if (first.mode === "production") {
      setChoices(getChoices(first.char.kana, pool));
    }
    setView("quiz");
  }

  function startWordSession(pool: CharWithRow[], length: number) {
    const today = toISODate();
    const queue: QueueItem[] = buildSessionQueue(pool, progress, "word", length, today)
      .map((char): QueueItem => ({ char, mode: "word" }));
    if (queue.length === 0) return;

    sessionIndexRef.current = 0;
    sessionPoolRef.current  = pool;
    updateQueue(queue);
    setMissedList([]);
    setCorrectCount(0);
    setSelectedOption(null);
    setInput("");
    setFeedback(null);

    setCurrent(queue[0].char);
    setCurrentMode("word");
    setView("quiz");
  }

  // ── Answer handlers ───────────────────────────────────────────────────────

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!current) return;

    // "Siguiente →" press after a wrong recognition answer
    if (feedback) {
      if (feedback.status === "wrong") {
        sessionIndexRef.current += 1;
        goNext();
      }
      return;
    }

    const cur      = current;
    const mode     = currentMode;
    const accepted = [cur.romaji, ...(cur.accept ?? [])];
    const isCorrect = accepted.includes(normalize(input));

    const key   = `${mode}:${cur.kana}`;
    const today = toISODate();
    const prevP = progress[key] ?? { box: 0, nextDue: today, attempts: 0, correct: 0 };
    const { box, nextDue } = advanceBox(prevP, isCorrect, today);
    const newP: ItemProgress = { box, nextDue, attempts: prevP.attempts + 1, correct: prevP.correct + (isCorrect ? 1 : 0) };
    const newProgress: ProgressItems = { ...progress, [key]: newP };
    setProgress(newProgress);
    persist(newProgress);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setFeedback({ status: "correct", expected: cur.romaji });
      sessionIndexRef.current += 1;
      setTimeout(() => goNext(), 600);
    } else {
      const newQueue: QueueItem[] = [...sessionQueueRef.current, { char: cur, mode }];
      updateQueue(newQueue);
      setMissedList((prev) => [...prev, { kana: cur.kana, mode, given: input.trim() || "(vacío)", expected: cur.romaji }]);
      setFeedback({ status: "wrong", expected: cur.romaji });
    }
  }

  function handleProductionAnswer(selectedKana: string) {
    if (!current || feedback) return;
    const cur       = current;
    const isCorrect = selectedKana === cur.kana;

    const key   = `production:${cur.kana}`;
    const today = toISODate();
    const prevP = progress[key] ?? { box: 0, nextDue: today, attempts: 0, correct: 0 };
    const { box, nextDue } = advanceBox(prevP, isCorrect, today);
    const newP: ItemProgress = { box, nextDue, attempts: prevP.attempts + 1, correct: prevP.correct + (isCorrect ? 1 : 0) };
    const newProgress: ProgressItems = { ...progress, [key]: newP };
    setProgress(newProgress);
    persist(newProgress);

    setSelectedOption(selectedKana);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setFeedback({ status: "correct", expected: cur.kana });
      sessionIndexRef.current += 1;
      setTimeout(() => goNext(), 800);
    } else {
      const newQueue: QueueItem[] = [...sessionQueueRef.current, { char: cur, mode: "production" }];
      updateQueue(newQueue);
      setMissedList((prev) => [...prev, { kana: cur.kana, mode: "production", given: selectedKana, expected: cur.kana }]);
      setFeedback({ status: "wrong", expected: cur.kana });
    }
  }

  function handleProductionNext() {
    sessionIndexRef.current += 1;
    goNext();
  }

  // ── Session end ───────────────────────────────────────────────────────────

  function reviewMisses() {
    const seen  = new Set<string>();
    const queue: QueueItem[] = [];
    for (const m of missedList) {
      const key = `${m.mode}:${m.kana}`;
      if (!seen.has(key)) {
        seen.add(key);
        const char = findQueueChar(m.kana, m.mode);
        if (char) queue.push({ char, mode: m.mode });
      }
    }
    if (queue.length === 0) return;

    const pool = [...new Map(queue.map((i) => [i.char.kana, i.char])).values()];

    sessionIndexRef.current = 0;
    sessionPoolRef.current  = pool;
    updateQueue(queue);
    setMissedList([]);
    setCorrectCount(0);
    setSelectedOption(null);
    setInput("");
    setFeedback(null);

    const first = queue[0];
    setCurrent(first.char);
    setCurrentMode(first.mode);
    if (first.mode === "production") {
      setChoices(getChoices(first.char.kana, pool));
    }
    setView("quiz");
  }

  function resetProgress() {
    const empty: ProgressItems = {};
    setProgress(empty);
    persist(empty);
    setResetConfirm(false);
    setView("setup");
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const today           = toISODate();
  const poolForSelected = ALL_CHARS.filter((c) => selectedRows.has(c.row));
  const availableItems  = buildQueueItems(poolForSelected, sessionMode, poolForSelected.length * 2, progress, today);
  const nothingDue      = poolForSelected.length > 0 && availableItems.length === 0;
  const masteredTotal   = ALL_CHARS.filter((c) => charStatus(progress, c.kana) === "mastered").length;

  const pairKanaSet     = new Set([...selectedPairs].flatMap((idx) => CONFUSED_PAIRS[idx]));
  const poolForPairs    = ALL_CHARS.filter((c) => pairKanaSet.has(c.kana));
  const availablePairItems = buildQueueItems(poolForPairs, "recognition", poolForPairs.length * 2, progress, today);
  const nothingDuePairs = poolForPairs.length > 0 && availablePairItems.length === 0;

  const wordPool: CharWithRow[] = getAvailableWords(isRowReady)
    .map((w): CharWithRow => ({ kana: w.kana, romaji: w.romaji, row: "word" }));
  const availableWordItems = buildSessionQueue(wordPool, progress, "word", wordPool.length * 2, today);
  const nothingDueWords     = wordPool.length > 0 && availableWordItems.length === 0;

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

        {/* ── Setup ── */}
        {view === "setup" && (
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              ひらがな trainer
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              {masteredTotal}/{ALL_CHARS.length} caracteres dominados
            </p>
            <div className="w-full h-1.5 bg-stone-200 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-indigo-700 rounded-full transition-all" style={{ width: `${(masteredTotal / ALL_CHARS.length) * 100}%` }} />
            </div>

            {/* Row selector */}
            <div className="flex items-center justify-between mt-6 mb-2">
              <span className="text-sm font-medium text-stone-600">Elige las filas a practicar</span>
              <div className="flex gap-3 text-xs">
                <button onClick={() => setSelectedRows(new Set(ROWS.map((r) => r.id)))} className="text-indigo-700 hover:underline">Todas</button>
                <button onClick={() => setSelectedRows(new Set())} className="text-stone-400 hover:underline">Limpiar</button>
              </div>
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
                      <span className="text-2xl" style={{ fontFamily: "'Shippori Mincho', serif" }}>{row.chars[0].kana}</span>
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

            {/* Confused pairs */}
            <div className="mt-6">
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
                      style={{ fontFamily: "'Shippori Mincho', serif" }}
                    >
                      {group.join("/")}
                    </button>
                  );
                })}
              </div>

              {nothingDuePairs && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                  Nada por repasar hoy en estos pares.
                </p>
              )}

              <button
                disabled={selectedPairs.size === 0 || availablePairItems.length === 0}
                onClick={() => startSession(poolForPairs, availablePairItems.length, "recognition")}
                className="w-full mt-3 py-3 rounded-xl bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Play size={18} /> Comenzar sesión de pares confusos
                {selectedPairs.size > 0 && ` (${availablePairItems.length})`}
              </button>
            </div>

            {/* Words */}
            <div className="mt-6">
              <span className="text-sm font-medium text-stone-600">Palabras</span>
              <p className="text-xs text-stone-400 mt-1">
                Disponibles según las filas elegidas (o ya dominadas): {wordPool.length} palabra{wordPool.length === 1 ? "" : "s"}.
              </p>
              {wordPool.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {wordPool.map((w) => (
                    <span key={w.kana} className="text-sm bg-white border border-stone-200 rounded-lg px-2 py-1" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                      {w.kana}
                    </span>
                  ))}
                </div>
              )}

              {nothingDueWords && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                  Nada por repasar hoy en estas palabras.
                </p>
              )}

              <button
                disabled={availableWordItems.length === 0}
                onClick={() => startWordSession(wordPool, availableWordItems.length)}
                className="w-full mt-3 py-3 rounded-xl bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Play size={18} /> Comenzar sesión de palabras
                {availableWordItems.length > 0 && ` (${availableWordItems.length})`}
              </button>
            </div>

            {/* Session length */}
            <div className="mt-6">
              <span className="text-sm font-medium text-stone-600">Largo de la sesión</span>
              <div className="flex gap-2 mt-2">
                {[10, 20].map((n) => (
                  <button
                    key={n}
                    disabled={availableItems.length === 0}
                    onClick={() => startSession(poolForSelected, n)}
                    className="flex-1 py-2 rounded-lg border-2 border-stone-200 bg-white hover:border-indigo-700 disabled:opacity-40 disabled:hover:border-stone-200 text-sm font-medium"
                  >
                    {n}
                  </button>
                ))}
                <button
                  disabled={availableItems.length === 0}
                  onClick={() => startSession(poolForSelected, availableItems.length)}
                  className="flex-1 py-2 rounded-lg border-2 border-stone-200 bg-white hover:border-indigo-700 disabled:opacity-40 disabled:hover:border-stone-200 text-sm font-medium"
                >
                  Todas ({availableItems.length})
                </button>
              </div>
            </div>

            {nothingDue && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4">
                Nada por repasar hoy en estas filas. Vuelve mañana o selecciona otras filas.
              </p>
            )}

            <button
              disabled={availableItems.length === 0}
              onClick={() => startSession(poolForSelected, Math.min(20, availableItems.length))}
              className="w-full mt-4 py-3 rounded-xl bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Play size={18} /> Comenzar sesión
            </button>

            <div className="flex items-center justify-between mt-4">
              <button onClick={() => setView("stats")} className="text-sm text-stone-500 flex items-center gap-1 hover:text-stone-700">
                <BarChart3 size={14} /> Ver estadísticas completas
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

        {/* ── Quiz ── */}
        {view === "quiz" && current && (
          <div className="flex flex-col items-center">
            {/* Header */}
            <div className="w-full flex items-center justify-between text-xs text-stone-500 mb-2">
              <button onClick={() => setView("setup")} className="flex items-center gap-1 hover:text-stone-700">
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
                <div
                  key={current.kana + "-rec"}
                  className={`mb-10 select-none ${currentMode === "word" ? "text-6xl" : "text-9xl"}`}
                  style={{ fontFamily: "'Shippori Mincho', serif" }}
                >
                  {current.kana}
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
                      <span className="rounded-full border-2 border-emerald-600 p-1"><Check size={16} /></span> ¡Correcto!
                    </div>
                  )}
                  {feedback?.status === "wrong" && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 text-rose-700 font-semibold">
                        <span className="rounded-full border-2 border-rose-600 p-1"><X size={16} /></span>
                        Era "{feedback.expected}"
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
                      <span className="text-xl shrink-0" style={{ fontFamily: "'Shippori Mincho', serif" }}>{m.kana}</span>
                      <span className="text-stone-400 text-xs shrink-0">{m.mode === "production" ? "→ kana" : "→ romaji"}</span>
                      <span className="text-stone-500 truncate">{m.mode === "production" ? "elegiste" : "escribiste"} "{m.given}"</span>
                      <span className="text-rose-700 font-medium shrink-0">era "{m.expected}"</span>
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
              <button onClick={() => setView("setup")} className="w-full py-3 rounded-xl bg-indigo-700 text-white font-semibold">
                Nueva sesión
              </button>
              <button onClick={() => setView("stats")} className="w-full py-2 rounded-xl text-stone-500 text-sm">
                Ver estadísticas
              </button>
            </div>
          </div>
        )}

        {/* ── Stats ── */}
        {view === "stats" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ fontFamily: "'Shippori Mincho', serif" }}>Tu progreso</h2>
              <button onClick={() => setView("setup")} className="text-sm text-indigo-700 flex items-center gap-1">
                <ArrowLeft size={14} /> Volver
              </button>
            </div>
            <p className="text-stone-500 text-sm mb-4">{masteredTotal}/{ALL_CHARS.length} dominados (3+ intentos, ≥85% acierto)</p>

            {ROWS.map((row) => (
              <div key={row.id} className="mb-4">
                <div className="text-xs font-medium text-stone-500 mb-1">{row.title}</div>
                <div className="flex flex-wrap gap-1.5">
                  {row.chars.map((ch) => {
                    const status = charStatus(progress, ch.kana);
                    return (
                      <div key={ch.kana} className={`w-12 h-14 rounded-lg border flex flex-col items-center justify-center ${STATUS_STYLE[status]}`}>
                        <span className="text-lg" style={{ fontFamily: "'Shippori Mincho', serif" }}>{ch.kana}</span>
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
