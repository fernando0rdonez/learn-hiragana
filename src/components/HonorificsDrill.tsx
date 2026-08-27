import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { HonorificExercise, HonorificMode } from "../honorifics";
import { HONORIFIC_INTRO } from "../honorifics";
import { advanceBox, buildSessionQueue } from "../leitner";
import { honorificProgressKey, toISODate } from "../utils";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import AnswerReveal from "./AnswerReveal";
import VocabSessionSummary, { type SessionResult } from "./VocabSessionSummary";
import foxNeutralImg from "../assets/character/fox-neutral.png";
import foxCelebratingImg from "../assets/character/fox-celebrating.png";
import foxSadImg from "../assets/character/fox-sad.png";

const TEAL      = "#0E9488";
const TEAL_DARK = "#0B6E66";
const TEAL_LT   = "#E1F5F2";

type Phase = "intro" | "playing" | "correct" | "wrong" | "done";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  exercises: HonorificExercise[];
  sessionLimit: number;
  introModes: HonorificMode[];
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

export default function HonorificsDrill({
  exercises, sessionLimit, introModes, progress, onProgressUpdate, onBack,
}: Props) {
  const today = toISODate();
  const { speak } = useSpeech();

  const [queue] = useState<HonorificExercise[]>(() => {
    const suffix = exercises.filter((e) => e.mode === "honorific-suffix").map((e) => ({ ...e, kana: e.id }));
    const family = exercises.filter((e) => e.mode === "honorific-family").map((e) => ({ ...e, kana: e.id }));
    const q1 = buildSessionQueue(suffix, progress, "honorific-suffix", suffix.length, today);
    const q2 = buildSessionQueue(family, progress, "honorific-family", family.length, today);
    return shuffle([...q1, ...q2]).slice(0, Math.max(1, sessionLimit));
  });

  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<SessionResult[]>([]);

  const current: HonorificExercise | null = queue[index] ?? null;
  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" ? foxSadImg :
    foxNeutralImg;

  function startExercise(i: number) {
    const ex = queue[i];
    if (!ex) { setPhase("done"); return; }
    setOptions(shuffle(ex.options));
    setSelected(null);
    setPhase("playing");
  }

  function begin() {
    setIndex(0);
    startExercise(0);
  }

  function recordResult(ex: HonorificExercise, isCorrect: boolean) {
    const key = honorificProgressKey(ex.mode, ex.id);
    const prevP: ItemProgress = progress[key] ?? { box: 0, nextDue: today, attempts: 0, correct: 0 };
    const { box, nextDue } = advanceBox(prevP, isCorrect, today);
    onProgressUpdate({
      [key]: {
        box, nextDue,
        attempts: prevP.attempts + 1,
        correct: prevP.correct + (isCorrect ? 1 : 0),
      },
    });
    setResults((prev) => [...prev, {
      word: { hiragana: ex.answer, romaji: "", meaning: ex.situation },
      correct: isCorrect,
    }]);
  }

  function answer(option: string) {
    if (phase !== "playing" || !current) return;
    setSelected(option);
    const isCorrect = option === current.answer;
    if (isCorrect) { playChime(); fireConfetti(); setPhase("correct"); }
    else { playBuzz(); setPhase("wrong"); }
    recordResult(current, isCorrect);
    speak(current.answer);
  }

  function next() {
    const n = index + 1;
    if (n >= queue.length) { setPhase("done"); return; }
    setIndex(n);
    startExercise(n);
  }

  // ── Intro ────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="flex flex-col gap-5">
        <button onClick={onBack} className="flex items-center gap-1 text-sm hover:opacity-70 self-start" style={{ color: "#8B7FA8" }}>
          <ArrowLeft size={14} /> Volver
        </button>
        {introModes.map((m) => (
          <div key={m} className="rounded-3xl p-6" style={{ backgroundColor: TEAL_LT }}>
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1A1A2E" }}>
              {HONORIFIC_INTRO[m].title}
            </h2>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: TEAL_DARK }}>{HONORIFIC_INTRO[m].text}</p>
          </div>
        ))}
        <button onClick={begin} className="w-full py-3.5 rounded-2xl text-white font-semibold" style={{ backgroundColor: TEAL }}>
          Comenzar ({queue.length} preguntas)
        </button>
      </div>
    );
  }

  // ── Resumen ──────────────────────────────────────────────────────────────
  if (phase === "done" || !current) {
    return <VocabSessionSummary sessionResults={results} onBack={onBack} />;
  }

  const progressPct = (index / queue.length) * 100;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>{index + 1} / {queue.length}</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: TEAL_LT }}>
        <div className="h-full transition-all" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${TEAL}, ${TEAL_DARK})` }} />
      </div>

      <div className="w-full flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 rounded-2xl px-4 py-3" style={{ backgroundColor: TEAL_LT }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEAL_DARK }}>
            {current.mode === "honorific-suffix" ? "Elige el sufijo" : "Elige la forma correcta"}
          </p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "#33408C" }}>{current.situation}</p>
        </div>
        <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0" />
      </div>

      <div className="w-full grid grid-cols-2 gap-2.5">
        {options.map((opt) => {
          const isCorrectOpt = opt === current.answer;
          const isSelectedOpt = opt === selected;
          let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF", color: "#1A1A2E" };
          if (phase !== "playing") {
            if (isCorrectOpt) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1", color: "#0A6E54" };
            else if (isSelectedOpt) style = { borderColor: TEAL_DARK, backgroundColor: TEAL_LT, color: TEAL_DARK };
          }
          return (
            <button
              key={opt}
              disabled={phase !== "playing"}
              onClick={() => answer(opt)}
              className="py-3.5 rounded-2xl border-2 text-xl font-semibold text-center transition-colors disabled:opacity-100"
              style={{ ...style, fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {phase !== "playing" && (
        <AnswerReveal
          status={phase === "correct" ? "correct" : "wrong"}
          kana={current.answer}
          meaning={current.situation}
          extra={current.note}
          onContinue={next}
        />
      )}
    </div>
  );
}
