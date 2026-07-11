import { useState, useEffect, useRef, type FormEvent } from "react";
import type {
  CharWithRow, CharData,
  ProgressItems, ItemProgress,
  SessionMode, QueueItem, QuizMode,
  StreakData, DailyProgress,
  Feedback, MissedItem,
} from "../types";
import { advanceBox, buildSessionQueue } from "../leitner";
import { recordCorrectAnswer } from "../streak";
import { ALL_ROW_GROUPS } from "../data";
import { KATAKANA_ALL_ROW_GROUPS, isKatakanaRow } from "../dataKatakana";
import { toISODate, normalize, buildQueueItems, getChoices, findQueueChar } from "../utils";
import type { ViewName } from "../data";

interface UseSessionParams {
  progress: ProgressItems;
  setProgress: (p: ProgressItems) => void;
  streak: StreakData;
  dailyProgress: DailyProgress;
  persist: (items: ProgressItems, streak?: StreakData, daily?: DailyProgress) => void;
  setView: (v: ViewName) => void;
  sessionMode: SessionMode;
}

export function useSession({ progress, setProgress, streak, dailyProgress, persist, setView, sessionMode }: UseSessionParams) {
  const [previewRows, setPreviewRows] = useState<{ id: string; title: string; chars: CharData[] }[]>([]);
  const pendingStartRef = useRef<(() => void) | null>(null);

  // Session state
  const [sessionQueue, setSessionQueue] = useState<QueueItem[]>([]);
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
    if (feedback?.status === "wrong" && nextBtnRef.current) nextBtnRef.current.focus();
  }, [feedback]);

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

  function getNewRows(pool: CharWithRow[]): { id: string; title: string; chars: CharData[] }[] {
    const rowGroups     = pool[0] && isKatakanaRow(pool[0].row) ? KATAKANA_ALL_ROW_GROUPS : ALL_ROW_GROUPS;
    const rowIdsInPool = new Set(pool.map((c) => c.row));
    return rowGroups.filter((row) =>
      rowIdsInPool.has(row.id) &&
      row.chars.every((ch) => {
        const p = progress[`recognition:${ch.kana}`];
        return !p || p.attempts === 0;
      })
    );
  }

  function launchSession(pool: CharWithRow[], startFn: () => void) {
    const newRows = getNewRows(pool);
    if (newRows.length === 0) {
      startFn();
      return;
    }
    setPreviewRows(newRows);
    pendingStartRef.current = startFn;
    setView("preview");
  }

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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
    const { streak: nextStreak, daily: nextDaily } = isCorrect
      ? recordCorrectAnswer(streak, dailyProgress, today)
      : { streak, daily: dailyProgress };
    setProgress(newProgress);
    persist(newProgress, nextStreak, nextDaily);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setFeedback({ status: "correct", expected: cur.romaji });
      sessionIndexRef.current += 1;
      // "word": el usuario avanza a mano con el banner inferior (AnswerReveal), sin auto-advance.
      if (mode !== "word") {
        setTimeout(() => goNext(), 600);
      }
    } else {
      const newQueue: QueueItem[] = [...sessionQueueRef.current, { char: cur, mode }];
      updateQueue(newQueue);
      setMissedList((prev) => [...prev, { kana: cur.kana, mode, given: input.trim() || "(vacío)", expected: cur.romaji }]);
      setFeedback({ status: "wrong", expected: cur.romaji });
    }
  }

  /** Avanzar tras el banner de feedback (AnswerReveal) en modo "word". */
  function handleWordContinue() {
    if (feedback?.status === "wrong") {
      sessionIndexRef.current += 1;
    }
    goNext();
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
    const { streak: nextStreak, daily: nextDaily } = isCorrect
      ? recordCorrectAnswer(streak, dailyProgress, today)
      : { streak, daily: dailyProgress };
    setProgress(newProgress);
    persist(newProgress, nextStreak, nextDaily);

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

  return {
    previewRows, pendingStartRef,
    sessionQueue, sessionQueueRef, sessionPoolRef, sessionIndexRef,
    currentMode, correctCount, missedList, current, input, setInput, feedback,
    choices, selectedOption,
    inputRef, nextBtnRef,
    launchSession, startSession, startWordSession,
    handleSubmit, handleProductionAnswer, handleProductionNext, handleWordContinue,
    reviewMisses,
  };
}
