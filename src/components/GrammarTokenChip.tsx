interface Props {
  token: string;
  used: boolean;
  onClick: () => void;
}

// Como KanaChip, pero de ancho variable: los tokens de gramática son
// partículas de un carácter (は, を...) y palabras/conjugaciones enteras
// (べんきょうします), así que no caben en la casilla cuadrada fija de KanaChip.
export default function GrammarTokenChip({ token, used, onClick }: Props) {
  return (
    <button
      disabled={used}
      onClick={onClick}
      className={`min-w-[2.75rem] h-11 px-3 rounded-xl border-2 text-base font-medium transition-all select-none whitespace-nowrap
        ${
          used
            ? "opacity-25 cursor-not-allowed border-stone-200 bg-stone-50 text-stone-400"
            : "border-[#DBDFF5] bg-white text-stone-800 hover:border-[#4C5FBF] hover:bg-[#EDEFFB] active:scale-95"
        }`}
      style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
    >
      {token}
    </button>
  );
}
