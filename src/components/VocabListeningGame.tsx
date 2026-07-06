import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { VocabWord } from "../vocabulary";
import { VOCABULARY, isEligibleForListening } from "../vocabulary";
import { findKanjiSpelling } from "../kanji";
import { advanceBox, isDue } from "../leitner";
import { vocabProgressKey } from "../utils";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import AudioButton from "./AudioButton";
import AnswerReveal from "./AnswerReveal";
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

// Palabras de "gente" (persona, persona formal, adulto, empleado...) no tienen
// un referente visual distinto y sus ilustraciones terminan siendo casi
// indistinguibles entre sí. Solo para esta categoría se prefieren distractores
// de OTRA categoría (misma dificultad fonética, arte distinto). El resto de
// categorías (colores, animales, comida...) sí tienen referentes visuales
// claros, así que ahí los distractores deben seguir siendo de la MISMA
// categoría — si no, basta con ver cuál imagen "combina" para adivinar.
const CROSS_CATEGORY_DISTRACTORS = new Set(["gente"]);

/**
 * 4 opciones: la palabra correcta + 3 distractores, priorizados por qué tan
 * fácil sería confundirlos con la respuesta correcta a nivel fonético (misma
 * sílaba inicial, caracteres compartidos) — así las imágenes no bastan por
 * sí solas y hay que reconocer el hiragana/audio de verdad.
 */
function buildOptions(word: VocabWord): VocabWord[] {
  const candidates = VOCABULARY.filter((w) => w.hiragana !== word.hiragana && isEligibleForListening(w));
  const scored = shuffle(candidates).map((w) => ({
    w,
    sameCategory: w.category === word.category,
    score:
      (firstChar(w.hiragana) === firstChar(word.hiragana) ? 5 : 0) +
      sharedCharCount(word.hiragana, w.hiragana),
  }));
  scored.sort((a, b) => b.score - a.score);

  const preferOtherCategory = CROSS_CATEGORY_DISTRACTORS.has(word.category);
  const primary = scored.filter((s) => s.sameCategory !== preferOtherCategory);
  const fallback = scored.filter((s) => s.sameCategory === preferOtherCategory);

  const seen = new Set([word.hiragana]);
  const distractors: VocabWord[] = [];
  for (const { w } of [...primary, ...fallback]) {
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
    for (const w of vocabulary.filter(isEligibleForListening)) {
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
    recordResult(currentWord, isCorrect);
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
    if (phase === "playing" && timeLeft <= 0 && currentWord) {
      playBuzz();
      setPhase("timeout");
      recordResult(currentWord, false);
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
        <AudioButton
          text={currentWord.hiragana}
          size={36}
          iconSize={16}
          accent="#E85D3A"
          idleBorder="#F0EDF8"
          idleText="#8B7FA8"
        />
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
      {phase !== "playing" && (
        <AnswerReveal
          status={phase}
          kana={currentWord.hiragana}
          kanji={findKanjiSpelling(currentWord.hiragana)}
          romaji={currentWord.romaji}
          meaning={currentWord.meaning}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
