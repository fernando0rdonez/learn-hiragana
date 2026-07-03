import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Volume2 } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { VocabWord } from "../vocabulary";
import { VOCABULARY } from "../vocabulary";
import { advanceBox, isDue } from "../leitner";
import { vocabProgressKey } from "../utils";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
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

const TIME_LIMIT = 12; // segundos por pregunta (algo más que otros modos: hay 4 imágenes que escanear)
const WORRIED_AT = 4;
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ANSWER_DELAY = 1800; // pausa tras responder, antes de avanzar

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

function firstChar(s: string): string {
  return [...s][0] ?? "";
}

function sharedCharCount(a: string, b: string): number {
  const setA = new Set(a);
  let count = 0;
  for (const ch of b) if (setA.has(ch)) count++;
  return count;
}

/**
 * 4 opciones: la palabra correcta + 3 distractores, priorizados por qué tan
 * fácil sería confundirlos con la respuesta correcta (misma sílaba inicial,
 * misma categoría, caracteres compartidos) — así las imágenes no bastan por
 * sí solas y hay que reconocer el hiragana/audio de verdad.
 */
function buildOptions(word: VocabWord): VocabWord[] {
  const candidates = VOCABULARY.filter((w) => w.hiragana !== word.hiragana);
  const scored = shuffle(candidates).map((w) => ({
    w,
    score:
      (firstChar(w.hiragana) === firstChar(word.hiragana) ? 5 : 0) +
      (w.category === word.category ? 2 : 0) +
      sharedCharCount(word.hiragana, w.hiragana),
  }));
  scored.sort((a, b) => b.score - a.score);

  const seen = new Set([word.hiragana]);
  const distractors: VocabWord[] = [];
  for (const { w } of scored) {
    if (distractors.length >= 3) break;
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

export default function VocabListeningGame({
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
  const { speak } = useSpeech();

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
      const p = progress[vocabProgressKey("listening", w.hiragana)];
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
    speak(word.hiragana);
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
    const key = vocabProgressKey("listening", word.hiragana);
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
    (word: VocabWord, isCorrect: boolean) => {
      recordResult(word, isCorrect);
      setTimeout(() => advanceToNext(), ANSWER_DELAY);
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
      fireConfetti();
      setPhase("correct");
    } else {
      playBuzz();
      setPhase("wrong");
    }
    finishAnswer(currentWord, isCorrect);
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
    if (phase === "playing" && timeLeft <= 0 && currentWord) {
      playBuzz();
      setPhase("timeout");
      finishAnswer(currentWord, false);
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
    <div className="flex flex-col items-center gap-5">
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

      {/* Palabra en hiragana + audio */}
      <div className="flex flex-col items-center gap-2 mt-1">
        <div
          className="select-none text-center leading-none text-5xl"
          style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#1A1A2E" }}
        >
          {currentWord.hiragana}
        </div>
        <button
          onClick={() => speak(currentWord.hiragana)}
          aria-label="Escuchar pronunciación"
          className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#F0EDF8] text-[#8B7FA8] hover:border-[#E85D3A] transition-colors"
        >
          <Volume2 size={16} />
        </button>
      </div>

      {/* Temporizador + zorro */}
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

      {/* 4 opciones en imágenes */}
      <div className="w-full grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isCorrectOpt = opt.hiragana === currentWord.hiragana;
          const isSelectedOpt = opt.hiragana === selected;
          let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF" };
          if (phase !== "playing") {
            if (isCorrectOpt) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1" };
            else if (isSelectedOpt) style = { borderColor: CORAL_DARK, backgroundColor: "#FDEDEA" };
          }
          return (
            <button
              key={opt.hiragana}
              disabled={phase !== "playing"}
              onClick={() => handleAnswer(opt)}
              className="rounded-2xl border-2 p-2 transition-colors disabled:opacity-100"
              style={style}
            >
              <VocabImage
                hiragana={opt.hiragana}
                imageQuery={opt.imageQuery}
                emojiBackup={opt.emojiBackup}
                label={opt.meaning}
                imagePath={opt.generated ? opt.imagePath : undefined}
                size="w-full aspect-square"
                hideAttribution
              />
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
