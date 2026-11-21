import { useState } from "react";
import type { GrammarSpotExercise } from "../grammarGames";
import { particleColor } from "../particleTrain";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import AnswerReveal from "./AnswerReveal";
import foxNeutralImg from "../assets/character/fox-neutral.png";
import foxCelebratingImg from "../assets/character/fox-celebrating.png";
import foxSadImg from "../assets/character/fox-sad.png";

const INDIGO = "#4C5FBF";
const JP_FONT = "'Noto Sans JP', sans-serif";

type Status = "playing" | "correct" | "reveal";

interface Props {
  ex: GrammarSpotExercise;
  /** Se llama UNA vez: acierto solo si se encontró el error al primer intento. */
  onResult: (correct: boolean) => void;
  onContinue: () => void;
}

/**
 * «Encuentra el error» (Fase 3, docs/GRAMATICA_PLAN.md): la oración tiene UNA ficha
 * equivocada (una partícula o una forma) y hay que tocarla. Dos intentos.
 */
export default function SpotErrorDrill({ ex, onResult, onContinue }: Props) {
  const [status, setStatus] = useState<Status>("playing");
  const [missed, setMissed] = useState<number[]>([]);
  const { speak } = useSpeech();
  const sentence = ex.correctTokens.join("");

  function tap(i: number) {
    if (status !== "playing" || missed.includes(i)) return;
    if (i === ex.wrongIndex) {
      playChime();
      fireConfetti();
      setStatus("correct");
      onResult(missed.length === 0);
      speak(sentence);
      return;
    }
    playBuzz();
    const next = [...missed, i];
    setMissed(next);
    if (next.length >= 2) {
      setStatus("reveal");
      onResult(false);
      speak(sentence);
    }
  }

  const fox = status === "correct" ? foxCelebratingImg : status === "reveal" || missed.length > 0 ? foxSadImg : foxNeutralImg;
  const done = status !== "playing";

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="w-full flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0 rounded-2xl px-4 py-3" style={{ backgroundColor: "#EDEFFB" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: INDIGO }}>Encuentra el error</p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "#33408C" }}>{ex.translation}</p>
        </div>
        <img src={fox} alt="" className="w-16 h-16 object-contain shrink-0" />
      </div>

      <p className="text-xs text-center" style={{ color: "#8B7FA8" }}>
        Una ficha está mal. Tócala.
      </p>

      <div className="flex flex-wrap gap-2 justify-center px-1">
        {ex.tokens.map((t, i) => {
          const isWrong = i === ex.wrongIndex;
          const wasMissed = missed.includes(i);
          const color = particleColor(t);
          let style: React.CSSProperties = color
            ? { color: color.fg, backgroundColor: color.bg, borderColor: color.bg, fontWeight: 700 }
            : { color: "#1A1A2E", backgroundColor: "#FFFFFF", borderColor: "#DBDFF5" };
          if (wasMissed) style = { color: "#B5ADC9", backgroundColor: "#F7F6FB", borderColor: "#EEEEEE" };
          if (done && isWrong) style = { color: "#C03A1E", backgroundColor: "#FFEEEA", borderColor: "#E85D3A", fontWeight: 700 };
          return (
            <button
              key={i}
              onClick={() => tap(i)}
              disabled={done || wasMissed}
              className="min-w-[2.75rem] h-11 px-3 rounded-xl border-2 text-base font-medium transition-all select-none whitespace-nowrap active:scale-95 disabled:active:scale-100"
              style={{ ...style, fontFamily: JP_FONT }}
            >
              {done && isWrong ? <s>{t}</s> : t}
              {done && isWrong && <span className="ml-1.5" style={{ color: "#0A6E54" }}>→ {ex.correct}</span>}
            </button>
          );
        })}
      </div>

      {missed.length === 1 && status === "playing" && (
        <p className="text-[#C03A1E] font-semibold text-sm">❌ Esa está bien. Busca otra.</p>
      )}

      {done && (
        <AnswerReveal
          status={status === "correct" ? "correct" : "wrong"}
          kana={sentence}
          meaning={ex.translation}
          extra={`${ex.tokens[ex.wrongIndex]} → ${ex.correct}${status === "correct" && missed.length > 0 ? " (al segundo intento: no cuenta como acierto)" : ""}`}
          onContinue={onContinue}
        />
      )}
    </div>
  );
}
