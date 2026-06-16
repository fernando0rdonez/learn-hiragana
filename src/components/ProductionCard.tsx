import { Check } from "lucide-react";
import type { CharWithRow } from "../types";

interface Props {
  romaji: string;
  choices: CharWithRow[];
  correctKana: string;
  selectedKana: string | null;
  feedback: { status: "correct" | "wrong" } | null;
  onSelect: (kana: string) => void;
  onNext: () => void;
  nextBtnRef: React.RefObject<HTMLButtonElement | null>;
}

export default function ProductionCard({
  romaji,
  choices,
  correctKana,
  selectedKana,
  feedback,
  onSelect,
  onNext,
  nextBtnRef,
}: Props) {
  return (
    <div className="flex flex-col items-center w-full gap-6">
      <p className="text-xs text-stone-400 uppercase tracking-widest">¿Cuál es este sonido?</p>

      <div className="text-5xl font-semibold text-stone-800">{romaji}</div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {choices.map((ch) => {
          const isSelected = selectedKana === ch.kana;
          const isCorrect = ch.kana === correctKana;

          let cls = "border-stone-200 bg-white text-stone-800";
          if (feedback) {
            if (isCorrect)       cls = "border-emerald-400 bg-emerald-50 text-emerald-800";
            else if (isSelected) cls = "border-rose-400 bg-rose-50 text-rose-700";
            else                 cls = "border-stone-100 bg-stone-50 text-stone-300";
          }

          return (
            <button
              key={ch.kana}
              disabled={!!feedback}
              onClick={() => onSelect(ch.kana)}
              className={`h-20 rounded-xl border-2 text-5xl font-medium transition-colors disabled:cursor-default ${cls}`}
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {ch.kana}
            </button>
          );
        })}
      </div>

      {feedback?.status === "correct" && (
        <div className="stamp-pop flex items-center gap-2 text-emerald-700 font-semibold">
          <span className="rounded-full border-2 border-emerald-600 p-1"><Check size={16} /></span>
          ¡Correcto!
        </div>
      )}

      {feedback?.status === "wrong" && (
        <button
          ref={nextBtnRef}
          onClick={onNext}
          className="px-6 py-3 rounded-lg bg-rose-700 text-white text-sm font-medium"
        >
          Siguiente →
        </button>
      )}
    </div>
  );
}
