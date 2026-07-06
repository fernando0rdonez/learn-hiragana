type SlotStatus = "idle" | "correct" | "wrong";

interface Props {
  slots: (string | null)[];
  animClass: string;
  status?: SlotStatus;
  onTapSlot: (index: number) => void;
}

const FILLED_STYLES: Record<SlotStatus, string> = {
  idle: "border-[#4C5FBF] bg-[#EDEFFB] text-[#33408C] hover:border-[#E85D3A]",
  correct: "border-[#15C0A0] bg-[#E3FAF3] text-[#0A6E54]",
  wrong: "border-[#E85D3A] bg-[#FFEEEA] text-[#C03A1E]",
};

// Como WordSlots, pero de ancho variable — ver GrammarTokenChip.
export default function GrammarTokenSlots({ slots, animClass, status = "idle", onTapSlot }: Props) {
  return (
    <div className={`flex flex-wrap gap-2 justify-center ${animClass}`}>
      {slots.map((token, i) => (
        <button
          key={i}
          onClick={() => token !== null && onTapSlot(i)}
          className={`min-w-[2.75rem] h-11 px-3 rounded-xl border-2 text-base font-medium flex items-center justify-center transition-all whitespace-nowrap
            ${
              token !== null
                ? FILLED_STYLES[status]
                : "border-[#D8D2E8] bg-white text-[#D8D2E8] cursor-default"
            }`}
          style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
        >
          {token ?? ""}
        </button>
      ))}
    </div>
  );
}
