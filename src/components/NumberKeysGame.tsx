import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { KeyNumber } from "../numbers";
import { buildKeyOptions, numberKeyProgressKey } from "../numbers";
import { advanceBox, isDue } from "../leitner";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import VocabSessionSummary, { type SessionResult } from "./VocabSessionSummary";
import foxNeutralImg from "../assets/character/fox-neutral.png";
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

type GamePhase = "playing" | "correct" | "wrong" | "done";

// ── Constants ──────────────────────────────────────────────────────────────────

const POST_ANSWER_SPEECH_DELAY = 500;

const AMBER      = "#F5A623";
const AMBER_DARK = "#C77F00";

// ── Helpers ────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  pool: KeyNumber[];
  progress: ProgressItems;
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function NumberKeysGame({
  pool,
  progress,
  sessionLimit = 10,
  onProgressUpdate,
  onBack,
}: Props) {
  const [queue, setQueue] = useState<KeyNumber[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [selected, setSelected] = useState<string | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const { speak } = useSpeech();

  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" ? foxSadImg :
    foxNeutralImg;

  // Cola al montar: vencidos/nuevos primero, luego no vencidos — nunca se bloquea
  useEffect(() => {
    const due: KeyNumber[] = [];
    const notDue: KeyNumber[] = [];
    for (const k of pool) {
      const p = progress[numberKeyProgressKey(k.value)];
      if (!p || p.attempts === 0 || isDue(p.nextDue, today)) {
        due.push(k);
      } else {
        notDue.push(k);
      }
    }
    const keyQueue = [...shuffle(due), ...shuffle(notDue)].slice(0, sessionLimit);
    setQueue(keyQueue);
    setQueueIndex(0);
    if (keyQueue.length > 0) initKey(keyQueue[0]);
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initKey(key: KeyNumber) {
    setOptions(buildKeyOptions(key));
    setSelected(null);
    setPhase("playing");
  }

  const currentKey = queue[queueIndex] ?? null;

  function advanceToNext() {
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      setPhase("done");
      return;
    }
    setQueueIndex(nextIndex);
    initKey(queue[nextIndex]);
  }

  function recordResult(key: KeyNumber, isCorrect: boolean) {
    const progressKey = numberKeyProgressKey(key.value);
    const prevP: ItemProgress = progress[progressKey] ?? {
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
    onProgressUpdate({ [progressKey]: newP });
    setSessionResults((prev) => [...prev, {
      word: { hiragana: key.hiragana, romaji: key.romaji, meaning: key.value.toLocaleString("es") },
      correct: isCorrect,
    }]);
  }

  // Lee siempre la forma correcta (la trampa de un irregular no es una palabra
  // real que valga la pena escuchar) y espera antes de avanzar.
  const speakAndWait = useCallback(
    (text: string) => speak(text).then(() => new Promise<void>((resolve) => setTimeout(resolve, POST_ANSWER_SPEECH_DELAY))),
    [speak]
  );

  const finishAnswer = useCallback(
    (key: KeyNumber, isCorrect: boolean, delay: Promise<void>) => {
      recordResult(key, isCorrect);
      delay.then(() => advanceToNext());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queueIndex, queue]
  );

  function handleAnswer(option: string) {
    if (phase !== "playing" || !currentKey) return;
    setSelected(option);
    const isCorrect = option === currentKey.hiragana;
    if (isCorrect) {
      playChime();
      fireConfetti();
      setPhase("correct");
    } else {
      playBuzz();
      setPhase("wrong");
    }
    finishAnswer(currentKey, isCorrect, speakAndWait(currentKey.hiragana));
  }

  // ── Done screen ──────────────────────────────────────────────────────────────

  if (phase === "done" || queue.length === 0) {
    return <VocabSessionSummary sessionResults={sessionResults} onBack={onBack} />;
  }

  if (!currentKey) return null;

  const totalKeys = queue.length;
  const progressPct = (queueIndex / totalKeys) * 100;

  // ── Game screen ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>
          {queueIndex + 1} / {totalKeys}
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#F0EDF8] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${AMBER}, #F7C05B)` }}
        />
      </div>

      {/* Pregunta */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm" style={{ color: "#8B7FA8" }}>¿Cómo se lee?</p>
        <div className="flex items-center gap-2">
          <p
            className="text-6xl font-bold tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1A1A2E" }}
          >
            {currentKey.value.toLocaleString("es")}
          </p>
          {currentKey.irregular && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#FFF4E5", color: AMBER_DARK }}
            >
              ★ irregular
            </span>
          )}
        </div>
      </div>

      <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0 transition-opacity" />

      {/* 4 opciones en hiragana */}
      <div className="w-full grid grid-cols-2 gap-2.5">
        {options.map((opt) => {
          const isCorrectOpt = opt === currentKey.hiragana;
          const isSelectedOpt = opt === selected;
          let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF", color: "#1A1A2E" };
          if (phase !== "playing") {
            if (isCorrectOpt) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1", color: "#0A6E54" };
            else if (isSelectedOpt) style = { borderColor: AMBER_DARK, backgroundColor: "#FDF2E3", color: AMBER_DARK };
          }
          return (
            <button
              key={opt}
              disabled={phase !== "playing"}
              onClick={() => handleAnswer(opt)}
              className="w-full py-4 rounded-2xl border-2 text-xl font-semibold text-center transition-colors disabled:opacity-100"
              style={{ ...style, fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {phase === "correct" && (
        <p className="text-[#0A6E54] font-semibold text-sm">✅ ¡Correcto! · {currentKey.romaji}</p>
      )}
      {phase === "wrong" && (
        <p className="font-semibold text-sm" style={{ color: AMBER_DARK }}>
          ❌ Era {currentKey.hiragana} · {currentKey.romaji}
          {currentKey.irregular ? " · ¡forma irregular!" : ""}
        </p>
      )}
    </div>
  );
}
