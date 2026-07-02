type SlotStatus = "idle" | "correct" | "wrong";

interface Props {
  slots: (string | null)[];
  animClass: string;
  status?: SlotStatus;
  onTapSlot: (index: number) => void;
}

const FILLED_STYLES: Record<SlotStatus, string> = {
  idle: "border-[#7B4FD4] bg-[#F1ECFB] text-[#5533A8] hover:border-[#E85D3A]",
  correct: "border-[#15C0A0] bg-[#E3FAF3] text-[#0A6E54]",
  wrong: "border-[#E85D3A] bg-[#FFEEEA] text-[#C03A1E]",
};

export default function WordSlots({ slots, animClass, status = "idle", onTapSlot }: Props) {
  return (
    <div className={`flex gap-2 justify-center ${animClass}`}>
      {slots.map((kana, i) => (
        <button
          key={i}
          onClick={() => kana !== null && onTapSlot(i)}
          className={`w-12 h-12 rounded-xl border-2 text-xl font-medium flex items-center justify-center transition-all
            ${
              kana !== null
                ? FILLED_STYLES[status]
                : "border-[#D8D2E8] bg-white text-[#D8D2E8] cursor-default"
            }`}
          style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
        >
          {kana ?? ""}
        </button>
      ))}
    </div>
  );
}
