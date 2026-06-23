import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { PhoneticEntry } from "../phonetics";
import { getPhoneticChoices } from "../phonetics";
import { buildSessionQueue, INTERVALS } from "../leitner";
import PhoneticCard from "./PhoneticCard";

function toISODate(d: Date = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

interface Props {
  phoneticWords: PhoneticEntry[];
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

export default function PhoneticsDrill({
  phoneticWords,
  progress,
  onProgressUpdate,
  onBack,
}: Props) {
  const [queue, setQueue]             = useState<PhoneticEntry[]>([]);
  const [queueIndex, setQueueIndex]   = useState(0);
  const [choices, setChoices]         = useState<string[]>([]);
  const [selected, setSelected]       = useState<string | null>(null);
  const [feedback, setFeedback]       = useState<{ status: "correct" | "wrong" } | null>(null);
  const [done, setDone]               = useState(false);

  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const today = toISODate();

  useEffect(() => {
    type PoolItem = PhoneticEntry & { kana: string };
    const pool: PoolItem[] = phoneticWords.map((e) => ({ ...e, kana: e.id }));
    const ordered = buildSessionQueue(pool, progress, "phonetics", pool.length, today) as PoolItem[];
    const wordQueue = ordered.map((item) => phoneticWords.find((e) => e.id === item.id)!);
    setQueue(wordQueue);
    setQueueIndex(0);
    if (wordQueue.length > 0) {
      setChoices(getPhoneticChoices(wordQueue[0]));
    } else {
      setDone(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (feedback?.status === "wrong" && nextBtnRef.current) {
      nextBtnRef.current.focus();
    }
  }, [feedback]);

  const currentEntry = queue[queueIndex] ?? null;

  function recordResult(entry: PhoneticEntry, isCorrect: boolean) {
    const key = `phonetics:${entry.id}`;
    const prevP: ItemProgress = progress[key] ?? { box: 0, nextDue: today, attempts: 0, correct: 0 };
    const newBox = isCorrect
      ? Math.min(prevP.box + 1, INTERVALS.length - 1)
      : Math.max(prevP.box - 1, 0);
    const newP: ItemProgress = {
      box:      newBox,
      nextDue:  addDays(today, INTERVALS[newBox]),
      attempts: prevP.attempts + 1,
      correct:  prevP.correct + (isCorrect ? 1 : 0),
    };
    onProgressUpdate({ [key]: newP });
  }

  function advanceToNext() {
    const next = queueIndex + 1;
    if (next >= queue.length) {
      setDone(true);
      return;
    }
    setQueueIndex(next);
    setChoices(getPhoneticChoices(queue[next]));
    setSelected(null);
    setFeedback(null);
  }

  function handleSelect(choice: string) {
    if (feedback || !currentEntry) return;
    const isCorrect = choice === currentEntry.spoken;
    setSelected(choice);
    setFeedback({ status: isCorrect ? "correct" : "wrong" });
    recordResult(currentEntry, isCorrect);
    if (isCorrect) setTimeout(() => advanceToNext(), 1400);
  }

  function handleNext() {
    advanceToNext();
  }

  if (done || queue.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "'Shippori Mincho', serif" }}>
          Sesión completa
        </h2>
        <p className="text-stone-500 text-sm">
          {queue.length === 0
            ? "No hay palabras disponibles. Selecciona un fenómeno."
            : `Completaste ${queue.length} palabra${queue.length === 1 ? "" : "s"}.`}
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-8 py-3 rounded-xl bg-indigo-700 text-white font-semibold"
        >
          Volver
        </button>
      </div>
    );
  }

  if (!currentEntry) return null;

  const progressPct = (queueIndex / queue.length) * 100;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-stone-500">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-stone-700">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>{queueIndex + 1} / {queue.length}</span>
      </div>
      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-700 transition-all" style={{ width: `${progressPct}%` }} />
      </div>

      <PhoneticCard
        kana={currentEntry.kana}
        choices={choices}
        correctSpoken={currentEntry.spoken}
        selectedChoice={selected}
        feedback={feedback}
        note={currentEntry.note}
        onSelect={handleSelect}
        onNext={handleNext}
        nextBtnRef={nextBtnRef}
      />
    </div>
  );
}
