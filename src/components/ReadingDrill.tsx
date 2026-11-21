import { useState } from "react";
import { Volume2, Languages } from "lucide-react";
import type { GrammarReading, GrammarReadingQuestion } from "../grammar";
import { particleColor } from "../particleTrain";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import foxNeutralImg from "../assets/character/fox-neutral.png";
import foxCelebratingImg from "../assets/character/fox-celebrating.png";
import foxSadImg from "../assets/character/fox-sad.png";

const INDIGO = "#4C5FBF";
const INDIGO_DARK = "#33408C";
const JP_FONT = "'Noto Sans JP', sans-serif";
const JP_RE = /[぀-ヿ]/;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fichas separadas por un pequeño espacio, con las partículas en su color del tren. */
function Tokens({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((t, i) => (
        <span key={i} className="mx-[0.12em]" style={particleColor(t) ? { color: particleColor(t)!.fg, fontWeight: 700 } : undefined}>
          {t}
        </span>
      ))}
    </>
  );
}

interface Props {
  reading: GrammarReading;
  question: GrammarReadingQuestion;
  questionNumber: number;
  totalQuestions: number;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  /** Se llama UNA vez por pregunta. */
  onResult: (correct: boolean) => void;
  onContinue: () => void;
}

/**
 * Lectura de repaso (Fase 4, docs/GRAMATICA_PLAN.md): el texto queda a la vista
 * mientras se responden sus preguntas de comprensión, una por una.
 */
export default function ReadingDrill({
  reading, question, questionNumber, totalQuestions, showTranslation, onToggleTranslation, onResult, onContinue,
}: Props) {
  const [options] = useState(() => shuffle(question.options));
  const [selected, setSelected] = useState<string | null>(null);
  const { speak } = useSpeech();

  const answered = selected !== null;
  const correct = selected === question.answer;
  const fox = !answered ? foxNeutralImg : correct ? foxCelebratingImg : foxSadImg;
  const fullText = reading.lines.map((l) => l.jp.replace(/ /g, "")).join("。");

  function answer(opt: string) {
    if (answered) return;
    setSelected(opt);
    const ok = opt === question.answer;
    if (ok) { playChime(); fireConfetti(); } else { playBuzz(); }
    onResult(ok);
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0 rounded-2xl px-4 py-3" style={{ backgroundColor: "#EDEFFB" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: INDIGO }}>
            Lectura · {reading.titleEs}
          </p>
          <p className="text-sm font-medium mt-0.5" style={{ color: INDIGO_DARK }}>
            Pregunta {questionNumber} de {totalQuestions}
          </p>
        </div>
        <img src={fox} alt="" className="w-16 h-16 object-contain shrink-0" />
      </div>

      <div className="rounded-3xl border-2 p-4" style={{ borderColor: "#EDEFFB" }}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-lg font-bold" style={{ fontFamily: JP_FONT, color: "#1A1A2E" }}>{reading.title}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => speak(fullText)}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: INDIGO }}
            >
              <Volume2 size={13} /> Escuchar todo
            </button>
            <button
              onClick={onToggleTranslation}
              aria-pressed={showTranslation}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border"
              style={{ borderColor: INDIGO, color: INDIGO, backgroundColor: showTranslation ? "#EDEFFB" : "#FFFFFF" }}
            >
              <Languages size={13} /> {showTranslation ? "Ocultar traducción" : "Ver traducción"}
            </button>
          </div>
        </div>
        <ol className="flex flex-col gap-1.5">
          {reading.lines.map((line, i) => (
            <li key={i}>
              <button
                onClick={() => speak(line.jp.replace(/ /g, ""))}
                className="w-full text-left rounded-xl px-2 py-1 hover:bg-[#FAFAFF]"
                title="Escuchar esta línea"
              >
                <span className="text-lg leading-snug" style={{ fontFamily: JP_FONT, color: "#1A1A2E" }}>
                  <Tokens text={line.jp} />。
                </span>
                {showTranslation && (
                  <span className="block text-xs mt-0.5" style={{ color: "#8B7FA8" }}>{line.es}</span>
                )}
              </button>
            </li>
          ))}
        </ol>
        <p className="text-[11px] mt-2" style={{ color: "#B5ADC9" }}>Toca una línea para escucharla.</p>
      </div>

      <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: "#FAFAFF" }}>
        {question.jp ? (
          <>
            <p className="text-lg" style={{ fontFamily: JP_FONT, color: "#1A1A2E" }}><Tokens text={question.jp} /></p>
            <p className="text-xs mt-0.5" style={{ color: "#8B7FA8" }}>{question.q}</p>
          </>
        ) : (
          <p className="text-base font-semibold" style={{ color: "#1A1A2E" }}>{question.q}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const isAnswer = opt === question.answer;
          const isSelected = opt === selected;
          let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF", color: "#1A1A2E" };
          if (answered && isAnswer) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1", color: "#0A6E54" };
          else if (answered && isSelected) style = { borderColor: "#E85D3A", backgroundColor: "#FFEEEA", color: "#C03A1E" };
          const jp = JP_RE.test(opt);
          return (
            <button
              key={opt}
              disabled={answered}
              onClick={() => answer(opt)}
              className={`w-full rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-colors disabled:opacity-100 ${jp ? "text-lg" : "text-sm"}`}
              style={{ ...style, fontFamily: jp ? JP_FONT : undefined }}
            >
              {jp ? <Tokens text={opt} /> : opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: correct ? "#E9F7F1" : "#FDEDEA" }}>
          <p className="text-sm font-bold" style={{ color: correct ? "#0A6E54" : "#C03A1E" }}>
            {correct ? "¡Correcto!" : `La respuesta es: ${question.answer}`}
          </p>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: "#33408C", fontFamily: JP_FONT }}>💡 {question.why}</p>
          <button
            onClick={onContinue}
            className="mt-3 w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ backgroundColor: correct ? "#0A6E54" : INDIGO }}
          >
            CONTINUAR
          </button>
        </div>
      )}
    </div>
  );
}
