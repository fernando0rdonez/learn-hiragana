import { useState, useEffect } from "react";
import { ArrowLeft, Check } from "lucide-react";
import type { KanjiEntry } from "../kanji";
import { playChime, playBuzz } from "../utils/audio";
import { fireConfetti } from "./ConfettiOverlay";

const ROUND_SIZE = 5;

const CRIMSON      = "#B3261E";
const CRIMSON_DARK = "#8C1D17";
const CRIMSON_LIGHT = "#FBEAEA";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function meaningLabel(k: KanjiEntry): string {
  return k.meanings.join(" / ");
}

interface Props {
  kanjiList: KanjiEntry[];
  onBack: () => void;
}

export default function KanjiMatchGame({ kanjiList, onBack }: Props) {
  const [pool, setPool] = useState<KanjiEntry[]>(() => shuffle(kanjiList));
  const [round, setRound] = useState<KanjiEntry[]>([]);
  const [leftOrder, setLeftOrder] = useState<string[]>([]);
  const [rightOrder, setRightOrder] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selectedKanji, setSelectedKanji] = useState<string | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<{ kanji: string; meaning: string } | null>(null);
  const [roundsCompleted, setRoundsCompleted] = useState(0);

  function startRound(currentPool: KanjiEntry[]) {
    let nextPool = currentPool;
    if (nextPool.length < ROUND_SIZE) {
      nextPool = shuffle(kanjiList);
    }
    const batch = nextPool.slice(0, ROUND_SIZE);
    const rest = nextPool.slice(ROUND_SIZE);
    setRound(batch);
    setLeftOrder(shuffle(batch.map((k) => k.kanji)));
    setRightOrder(shuffle(batch.map((k) => meaningLabel(k))));
    setMatched(new Set());
    setSelectedKanji(null);
    setSelectedMeaning(null);
    setPool(rest);
  }

  useEffect(() => {
    startRound(pool);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roundDone = round.length > 0 && matched.size === round.length;

  function tryMatch(kanjiChar: string | null, meaning: string | null) {
    if (!kanjiChar || !meaning) return;
    const entry = round.find((k) => k.kanji === kanjiChar);
    const isMatch = !!entry && meaningLabel(entry) === meaning;
    if (isMatch) {
      playChime();
      fireConfetti();
      setMatched((prev) => new Set(prev).add(kanjiChar));
      setSelectedKanji(null);
      setSelectedMeaning(null);
    } else {
      playBuzz();
      setWrongPair({ kanji: kanjiChar, meaning });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedKanji(null);
        setSelectedMeaning(null);
      }, 500);
    }
  }

  function handleKanjiClick(kanjiChar: string) {
    if (matched.has(kanjiChar) || wrongPair) return;
    setSelectedKanji(kanjiChar);
    tryMatch(kanjiChar, selectedMeaning);
  }

  function handleMeaningClick(meaning: string) {
    if (wrongPair) return;
    const alreadyMatched = round.some((k) => matched.has(k.kanji) && meaningLabel(k) === meaning);
    if (alreadyMatched) return;
    setSelectedMeaning(meaning);
    tryMatch(selectedKanji, meaning);
  }

  function handleNextRound() {
    setRoundsCompleted((n) => n + 1);
    startRound(pool);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>Ronda {roundsCompleted + 1} · {matched.size} / {round.length}</span>
      </div>

      <h2 className="text-lg font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1A1A2E" }}>
        Empareja kanji y significado
      </h2>

      <div className="w-full grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {leftOrder.map((kanjiChar) => {
            const isMatched = matched.has(kanjiChar);
            const isSelected = selectedKanji === kanjiChar && !isMatched;
            const isWrong = wrongPair?.kanji === kanjiChar;
            let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF", color: "#1A1A2E" };
            if (isMatched) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1", color: "#0A6E54" };
            else if (isWrong) style = { borderColor: CRIMSON_DARK, backgroundColor: "#FDEAEA", color: CRIMSON_DARK };
            else if (isSelected) style = { borderColor: CRIMSON, backgroundColor: CRIMSON_LIGHT, color: CRIMSON_DARK };
            return (
              <button
                key={kanjiChar}
                disabled={isMatched}
                onClick={() => handleKanjiClick(kanjiChar)}
                className="py-4 rounded-2xl border-2 text-3xl font-semibold text-center transition-colors disabled:opacity-70 flex items-center justify-center gap-1"
                style={{ ...style, fontFamily: "'Shippori Mincho', serif" }}
              >
                {kanjiChar}
                {isMatched && <Check size={16} className="shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          {rightOrder.map((meaning) => {
            const isMatched = round.some((k) => matched.has(k.kanji) && meaningLabel(k) === meaning);
            const isSelected = selectedMeaning === meaning && !isMatched;
            const isWrong = wrongPair?.meaning === meaning;
            let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF", color: "#1A1A2E" };
            if (isMatched) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1", color: "#0A6E54" };
            else if (isWrong) style = { borderColor: CRIMSON_DARK, backgroundColor: "#FDEAEA", color: CRIMSON_DARK };
            else if (isSelected) style = { borderColor: CRIMSON, backgroundColor: CRIMSON_LIGHT, color: CRIMSON_DARK };
            return (
              <button
                key={meaning}
                disabled={isMatched}
                onClick={() => handleMeaningClick(meaning)}
                className="py-4 px-2 rounded-2xl border-2 text-xs font-medium text-center transition-colors disabled:opacity-70"
                style={style}
              >
                {meaning}
              </button>
            );
          })}
        </div>
      </div>

      {roundDone && (
        <button
          onClick={handleNextRound}
          className="w-full py-3.5 rounded-2xl text-white font-semibold"
          style={{ backgroundColor: CRIMSON }}
        >
          Siguiente ronda
        </button>
      )}
    </div>
  );
}
