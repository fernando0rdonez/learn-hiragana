import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { VocabWord } from "../vocabulary";
import { VOCABULARY } from "../vocabulary";
import { advanceBox, isDue } from "../leitner";
import { vocabProgressKey } from "../utils";
import { playChime, playBuzz } from "../utils/audio";
import VocabImage from "./VocabImage";
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

// ── Types ──────────────────────────────────────────────────────────────────────

type GamePhase = "playing" | "correct" | "wrong" | "timeout" | "done";

// ── Constants ──────────────────────────────────────────────────────────────────

const TIME_LIMIT = 10; // segundos por pregunta
const WORRIED_AT = 4;  // el zorro se pone nervioso cuando quedan <= 4s
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const CORAL      = "#E85D3A";
const CORAL_DARK = "#C03A1E";

// ── Helpers ────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 3 opciones: la palabra correcta + 2 distractores (prioriza la misma categoría). */
function buildOptions(word: VocabWord): VocabWord[] {
  const sameCategory = shuffle(VOCABULARY.filter((w) => w.category === word.category && w.hiragana !== word.hiragana));
  const restCategory = shuffle(VOCABULARY.filter((w) => w.category !== word.category && w.hiragana !== word.hiragana));

  const seen = new Set([word.hiragana]);
  const distractors: VocabWord[] = [];
  for (const w of [...sameCategory, ...restCategory]) {
    if (distractors.length >= 2) break;
    if (seen.has(w.hiragana)) continue;
    seen.add(w.hiragana);
    distractors.push(w);
  }
  return shuffle([word, ...distractors]);
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  vocabulary: VocabWord[];
  progress: ProgressItems;
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function VocabRecognizeGame({
  vocabulary,
  progress,
  sessionLimit = 50,
  onProgressUpdate,
  onBack,
}: Props) {
  const [queue, setQueue] = useState<VocabWord[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [options, setOptions] = useState<VocabWord[]>([]);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);

  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" || phase === "timeout" ? foxSadImg :
    timeLeft <= WORRIED_AT ? foxWorriedImg :
    foxNeutralImg;

  // Build session queue on mount: due/new words first, then not-yet-due — always include all
  useEffect(() => {
    const due: VocabWord[] = [];
    const notDue: VocabWord[] = [];
    for (const w of vocabulary) {
      const p = progress[vocabProgressKey("meaning", w.hiragana)];
      if (!p || p.attempts === 0 || isDue(p.nextDue, today)) {
        due.push(w);
      } else {
        notDue.push(w);
      }
    }
    const wordQueue = [...shuffle(due), ...shuffle(notDue)].slice(0, sessionLimit);
    setQueue(wordQueue);
    setQueueIndex(0);
    if (wordQueue.length > 0) initWord(wordQueue[0]);
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initWord(word: VocabWord) {
    setOptions(buildOptions(word));
    setSelected(null);
    setTimeLeft(TIME_LIMIT);
    setPhase("playing");
  }

  const currentWord = queue[queueIndex] ?? null;

  function advanceToNext() {
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      setPhase("done");
      return;
    }
    setQueueIndex(nextIndex);
    initWord(queue[nextIndex]);
  }

  function recordResult(word: VocabWord, isCorrect: boolean) {
    const key = vocabProgressKey("meaning", word.hiragana);
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
    setSessionResults((prev) => [...prev, { word, correct: isCorrect }]);
  }

  const finishAnswer = useCallback(
    (word: VocabWord, isCorrect: boolean, delay: number) => {
      recordResult(word, isCorrect);
      setTimeout(() => advanceToNext(), delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queueIndex, queue]
  );

  function handleAnswer(option: VocabWord) {
    if (phase !== "playing" || !currentWord) return;
    setSelected(option.hiragana);
    const isCorrect = option.hiragana === currentWord.hiragana;
    if (isCorrect) {
      playChime();
      setPhase("correct");
      finishAnswer(currentWord, true, 1200);
    } else {
      playBuzz();
      setPhase("wrong");
      finishAnswer(currentWord, false, 2000);
    }
  }

  // Countdown ticker
  useEffect(() => {
    if (phase !== "playing") return;
    // Deriva el tiempo restante del reloj real (no de un contador de ticks) para
    // que no se atrase si el navegador limita setInterval (p.ej. pestaña en segundo plano).
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setTimeLeft(Math.max(0, +(TIME_LIMIT - elapsed).toFixed(1)));
    }, 100);
    return () => clearInterval(interval);
  }, [phase, queueIndex]);

  // Timeout — sin respuesta antes de que se acabe el tiempo cuenta como fallo
  useEffect(() => {
    if (phase === "playing" && timeLeft <= 0 && currentWord) {
      playBuzz();
      setPhase("timeout");
      finishAnswer(currentWord, false, 2000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  // ── Done screen ──────────────────────────────────────────────────────────────

  if (phase === "done" || queue.length === 0) {
    return <VocabSessionSummary sessionResults={sessionResults} onBack={onBack} />;
  }

  if (!currentWord) return null;

  const totalWords = queue.length;
  const progressPct = (queueIndex / totalWords) * 100;
  const ringPct = Math.max(timeLeft, 0) / TIME_LIMIT;
  const ringOffset = RING_CIRCUMFERENCE * (1 - ringPct);
  const ringColor = timeLeft <= WORRIED_AT ? CORAL_DARK : CORAL;

  // ── Game screen ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>
          {queueIndex + 1} / {totalWords}
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#F0EDF8] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #7B4FD4, #9B7CE8)" }}
        />
      </div>

      {/* Image */}
      <div className="mt-2">
        <VocabImage
          hiragana={currentWord.hiragana}
          imageQuery={currentWord.imageQuery}
          emojiBackup={currentWord.emojiBackup}
          label={currentWord.meaning}
          imagePath={currentWord.generated ? currentWord.imagePath : undefined}
        />
      </div>

      {/* Traducción — algunas imágenes solas son ambiguas (conceptos abstractos, categorías como "preguntas" o "adjetivos") */}
      <div className="flex items-baseline gap-1.5 rounded-full px-4 py-1.5" style={{ backgroundColor: "#F5F3FF" }}>
        <span className="text-sm font-medium" style={{ color: "#8B7FA8" }}>{currentWord.meaning}</span>
      </div>

      {/* Temporizador + zorro, uno al lado del otro */}
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
            <circle cx={32} cy={32} r={RING_RADIUS} fill="none" stroke="#F0EDF8" strokeWidth={6} />
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

      {/* 3 opciones en hiragana */}
      <div className="w-full flex flex-col gap-2.5">
        {options.map((opt) => {
          const isCorrectOpt = opt.hiragana === currentWord.hiragana;
          const isSelectedOpt = opt.hiragana === selected;
          let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF", color: "#1A1A2E" };
          if (phase !== "playing") {
            if (isCorrectOpt) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1", color: "#0A6E54" };
            else if (isSelectedOpt) style = { borderColor: CORAL_DARK, backgroundColor: "#FDEDEA", color: CORAL_DARK };
          }
          return (
            <button
              key={opt.hiragana}
              disabled={phase !== "playing"}
              onClick={() => handleAnswer(opt)}
              className="w-full py-4 rounded-2xl border-2 text-2xl font-semibold text-center transition-colors disabled:opacity-100"
              style={{ ...style, fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {opt.hiragana}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {phase === "correct" && (
        <p className="text-[#0A6E54] font-semibold text-sm">✅ ¡Correcto! · {currentWord.romaji} · {currentWord.meaning}</p>
      )}
      {phase === "wrong" && (
        <p className="text-[#C03A1E] font-semibold text-sm">❌ Era {currentWord.romaji} · {currentWord.meaning}</p>
      )}
      {phase === "timeout" && (
        <p className="text-[#C03A1E] font-semibold text-sm">⏱️ ¡Se acabó el tiempo! Era {currentWord.romaji} · {currentWord.meaning}</p>
      )}
    </div>
  );
}
