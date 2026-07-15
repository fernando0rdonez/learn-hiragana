import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { KanjiEntry, KanjiExample } from "../kanji";
import { KANJI } from "../kanji";
import { advanceBox, isDue } from "../leitner";
import { kanjiProgressKey } from "../utils";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import AnswerReveal from "./AnswerReveal";
import VocabSessionSummary, { type SessionResult } from "./VocabSessionSummary";
import foxNeutralImg from "../assets/character/fox-neutral.png";
import foxWorriedImg from "../assets/character/fox-worried.png";
import foxCelebratingImg from "../assets/character/fox-celebrating.png";
import foxSadImg from "../assets/character/fox-sad.png";

function toISODate(d: Date = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

type GamePhase = "playing" | "correct" | "wrong" | "timeout" | "done";

const TIME_LIMIT = 10;
const WORRIED_AT = 4;
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const CRIMSON      = "#B3261E";
const CRIMSON_DARK = "#8C1D17";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface FlatExample extends KanjiExample {
  group: string;
  ownerKanji: string;
}

const ALL_EXAMPLES: FlatExample[] = KANJI.flatMap((k) =>
  k.examples.map((e): FlatExample => ({ ...e, group: k.group, ownerKanji: k.kanji }))
);

/** 4 opciones de lectura: la correcta + 3 lecturas distintas de otras palabras (prioriza el mismo grupo). */
function buildOptions(kanji: KanjiEntry, correct: KanjiExample): KanjiExample[] {
  const sameGroup = shuffle(ALL_EXAMPLES.filter((e) => e.group === kanji.group && e.ownerKanji !== kanji.kanji && e.kana !== correct.kana));
  const restGroup = shuffle(ALL_EXAMPLES.filter((e) => e.group !== kanji.group && e.ownerKanji !== kanji.kanji && e.kana !== correct.kana));

  const seen = new Set([correct.kana]);
  const distractors: KanjiExample[] = [];
  for (const e of [...sameGroup, ...restGroup]) {
    if (distractors.length >= 3) break;
    if (seen.has(e.kana)) continue;
    seen.add(e.kana);
    distractors.push(e);
  }
  return shuffle([correct, ...distractors]);
}

interface Props {
  kanjiList: KanjiEntry[];
  progress: ProgressItems;
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

export default function KanjiReadingGame({
  kanjiList,
  progress,
  sessionLimit = 10,
  onProgressUpdate,
  onBack,
}: Props) {
  const [queue, setQueue] = useState<KanjiEntry[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [currentExample, setCurrentExample] = useState<KanjiExample | null>(null);
  const [options, setOptions] = useState<KanjiExample[]>([]);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const { speak } = useSpeech();

  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" || phase === "timeout" ? foxSadImg :
    timeLeft <= WORRIED_AT ? foxWorriedImg :
    foxNeutralImg;

  useEffect(() => {
    const due: KanjiEntry[] = [];
    const notDue: KanjiEntry[] = [];
    for (const k of kanjiList) {
      const p = progress[kanjiProgressKey("kanji-reading", k.kanji)];
      if (!p || p.attempts === 0 || isDue(p.nextDue, today)) {
        due.push(k);
      } else {
        notDue.push(k);
      }
    }
    const kanjiQueue = [...shuffle(due), ...shuffle(notDue)].slice(0, sessionLimit);
    setQueue(kanjiQueue);
    setQueueIndex(0);
    if (kanjiQueue.length > 0) initKanji(kanjiQueue[0]);
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initKanji(kanji: KanjiEntry) {
    const example = shuffle(kanji.examples)[0];
    setCurrentExample(example);
    setOptions(buildOptions(kanji, example));
    setSelected(null);
    setTimeLeft(TIME_LIMIT);
    setPhase("playing");
  }

  const currentKanji = queue[queueIndex] ?? null;

  function advanceToNext() {
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      setPhase("done");
      return;
    }
    setQueueIndex(nextIndex);
    initKanji(queue[nextIndex]);
  }

  function recordResult(kanji: KanjiEntry, example: KanjiExample, isCorrect: boolean) {
    const key = kanjiProgressKey("kanji-reading", kanji.kanji);
    const prevP: ItemProgress = progress[key] ?? {
      box: 0,
      nextDue: today,
      attempts: 0,
      correct: 0,
    };
    const { box, nextDue } = advanceBox(prevP, isCorrect, today);
    const newP: ItemProgress = {
      box,
      nextDue,
      attempts: prevP.attempts + 1,
      correct: prevP.correct + (isCorrect ? 1 : 0),
    };
    onProgressUpdate({ [key]: newP });
    setSessionResults((prev) => [...prev, { word: { hiragana: example.word, romaji: example.kana, meaning: example.meaning }, correct: isCorrect }]);
  }

  function handleAnswer(option: KanjiExample) {
    if (phase !== "playing" || !currentKanji || !currentExample) return;
    setSelected(option.kana);
    const isCorrect = option.kana === currentExample.kana;
    if (isCorrect) {
      playChime();
      fireConfetti();
      setPhase("correct");
    } else {
      playBuzz();
      setPhase("wrong");
    }
    recordResult(currentKanji, currentExample, isCorrect);
    speak(currentExample.kana);
  }

  function handleContinue() {
    advanceToNext();
  }

  // Countdown ticker
  useEffect(() => {
    if (phase !== "playing") return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setTimeLeft(Math.max(0, +(TIME_LIMIT - elapsed).toFixed(1)));
    }, 100);
    return () => clearInterval(interval);
  }, [phase, queueIndex]);

  // Timeout — sin selección: cuenta como fallo
  useEffect(() => {
    if (phase === "playing" && timeLeft <= 0 && currentKanji && currentExample) {
      playBuzz();
      setPhase("timeout");
      recordResult(currentKanji, currentExample, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  if (phase === "done" || queue.length === 0) {
    return <VocabSessionSummary sessionResults={sessionResults} onBack={onBack} />;
  }

  if (!currentKanji || !currentExample) return null;

  const totalKanji = queue.length;
  const progressPct = (queueIndex / totalKanji) * 100;
  const ringPct = Math.max(timeLeft, 0) / TIME_LIMIT;
  const ringOffset = RING_CIRCUMFERENCE * (1 - ringPct);
  const ringColor = timeLeft <= WORRIED_AT ? CRIMSON_DARK : CRIMSON;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>
          {queueIndex + 1} / {totalKanji}
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#FBEAEA] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${CRIMSON}, ${CRIMSON_DARK})` }}
        />
      </div>

      {/* Palabra de ejemplo con kanji + significado como pista */}
      <div className="flex flex-col items-center gap-2 mt-2 text-center">
        <div
          className="select-none leading-snug"
          style={{ fontFamily: "'Shippori Mincho', serif", fontSize: "3rem", color: "#1A1A2E" }}
        >
          {currentExample.word}
        </div>
        <div className="flex items-baseline gap-1.5 rounded-full px-4 py-1.5" style={{ backgroundColor: "#FBEAEA" }}>
          <span className="text-sm font-medium" style={{ color: "#8C1D17" }}>{currentExample.meaning}</span>
        </div>
      </div>

      {/* Temporizador + zorro */}
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
            <circle cx={32} cy={32} r={RING_RADIUS} fill="none" stroke="#FBEAEA" strokeWidth={6} />
            <circle
              cx={32} cy={32} r={RING_RADIUS} fill="none"
              stroke={ringColor} strokeWidth={6} strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.3s" }}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-lg font-bold"
            style={{ color: ringColor }}
          >
            {Math.ceil(timeLeft)}
          </span>
        </div>
        <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0 transition-opacity" />
      </div>

      {/* 4 opciones de lectura en kana */}
      <div className="w-full flex flex-col gap-2.5">
        {options.map((opt) => {
          const isCorrectOpt = opt.kana === currentExample.kana;
          const isSelectedOpt = opt.kana === selected;
          let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF", color: "#1A1A2E" };
          if (phase !== "playing") {
            if (isCorrectOpt) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1", color: "#0A6E54" };
            else if (isSelectedOpt) style = { borderColor: CRIMSON_DARK, backgroundColor: "#FDEAEA", color: CRIMSON_DARK };
          }
          return (
            <button
              key={opt.kana}
              disabled={phase !== "playing"}
              onClick={() => handleAnswer(opt)}
              className="w-full py-3.5 px-4 rounded-2xl border-2 text-xl font-semibold text-center transition-colors disabled:opacity-100"
              style={{ ...style, fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {opt.kana}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {phase !== "playing" && (
        <AnswerReveal
          status={phase}
          kana={currentExample.kana}
          kanji={currentExample.word}
          meaning={currentExample.meaning}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
