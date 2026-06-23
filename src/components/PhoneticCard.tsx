import { Check } from "lucide-react";

interface Props {
  kana: string;
  choices: string[];
  correctSpoken: string;
  selectedChoice: string | null;
  feedback: { status: "correct" | "wrong" } | null;
  note: string;
  onSelect: (choice: string) => void;
  onNext: () => void;
  nextBtnRef: React.RefObject<HTMLButtonElement | null>;
}

export default function PhoneticCard({
  kana,
  choices,
  correctSpoken,
  selectedChoice,
  feedback,
  note,
  onSelect,
  onNext,
  nextBtnRef,
}: Props) {
  return (
    <div className="flex flex-col items-center w-full gap-6">
      <p className="text-xs text-stone-400 uppercase tracking-widest">¿Cómo suena esta palabra?</p>

      <div
        className="text-5xl font-semibold text-stone-800"
        style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
      >
        {kana}
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {choices.map((choice) => {
          const isSelected = selectedChoice === choice;
          const isCorrect  = choice === correctSpoken;

          let cls = "border-stone-200 bg-white text-stone-800";
          if (feedback) {
            if (isCorrect)       cls = "border-emerald-400 bg-emerald-50 text-emerald-800";
            else if (isSelected) cls = "border-rose-400 bg-rose-50 text-rose-700";
            else                 cls = "border-stone-100 bg-stone-50 text-stone-300";
          }

          return (
            <button
              key={choice}
              disabled={!!feedback}
              onClick={() => onSelect(choice)}
              className={`h-16 rounded-xl border-2 text-base font-medium transition-colors disabled:cursor-default px-2 ${cls}`}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {feedback?.status === "correct" && (
        <div className="flex flex-col items-center gap-1">
          <div className="stamp-pop flex items-center gap-2 text-emerald-700 font-semibold">
            <span className="rounded-full border-2 border-emerald-600 p-1"><Check size={16} /></span>
            ¡Correcto!
          </div>
          <p className="text-xs text-stone-500 text-center max-w-xs">{note}</p>
        </div>
      )}

      {feedback?.status === "wrong" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-stone-500 text-center max-w-xs">{note}</p>
          <button
            ref={nextBtnRef}
            onClick={onNext}
            className="px-6 py-3 rounded-lg bg-rose-700 text-white text-sm font-medium"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
