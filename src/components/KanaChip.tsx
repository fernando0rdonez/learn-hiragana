interface Props {
  kana: string;
  used: boolean;
  onClick: () => void;
}

export default function KanaChip({ kana, used, onClick }: Props) {
  return (
    <button
      disabled={used}
      onClick={onClick}
      className={`w-12 h-12 rounded-xl border-2 text-xl font-medium transition-all select-none
        ${
          used
            ? "opacity-25 cursor-not-allowed border-stone-200 bg-stone-50 text-stone-400"
            : "border-indigo-300 bg-white text-stone-800 hover:border-indigo-500 hover:bg-indigo-50 active:scale-95"
        }`}
      style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
    >
      {kana}
    </button>
  );
}
