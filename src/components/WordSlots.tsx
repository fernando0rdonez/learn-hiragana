interface Props {
  slots: (string | null)[];
  animClass: string;
  onTapSlot: (index: number) => void;
}

export default function WordSlots({ slots, animClass, onTapSlot }: Props) {
  return (
    <div className={`flex gap-2 justify-center ${animClass}`}>
      {slots.map((kana, i) => (
        <button
          key={i}
          onClick={() => kana !== null && onTapSlot(i)}
          className={`w-12 h-12 rounded-xl border-2 text-xl font-medium flex items-center justify-center transition-all
            ${
              kana !== null
                ? "border-indigo-400 bg-indigo-50 text-stone-800 hover:border-rose-400"
                : "border-stone-300 bg-white text-stone-300 cursor-default"
            }`}
          style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
        >
          {kana ?? ""}
        </button>
      ))}
    </div>
  );
}
