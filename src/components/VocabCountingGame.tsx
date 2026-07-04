import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import type { ProgressItems, ItemProgress } from "../types";
import type { VocabWord } from "../vocabulary";
import { VOCABULARY } from "../vocabulary";
import { advanceBox } from "../leitner";
import { vocabProgressKey } from "../utils";
import { playChime, playBuzz } from "../utils/audio";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "./ConfettiOverlay";
import { getVocabImageUrl } from "../vocabImages";
import VocabSessionSummary, { type SessionResult } from "./VocabSessionSummary";
import foxNeutralImg from "../assets/character/fox-neutral.png";
import foxCelebratingImg from "../assets/character/fox-celebrating.png";
import foxSadImg from "../assets/character/fox-sad.png";

function toISODate(d: Date = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

// ── Types ──────────────────────────────────────────────────────────────────────

type GamePhase = "playing" | "correct" | "wrong" | "done";

interface Round {
  numberWord: VocabWord; // la respuesta correcta (いち..じゅう)
  object: VocabWord;     // el objeto que se repite en la imagen
  options: VocabWord[];  // 4 números en hiragana, uno correcto
}

// ── Constants ──────────────────────────────────────────────────────────────────

// Categorías cuyas imágenes son un solo objeto concreto — se pueden repetir en
// una grilla sin que quede raro (a diferencia de p.ej. "colores" o "verbos").
const COUNTABLE_CATEGORIES = new Set([
  "comida", "animales", "objetos", "ropa", "transporte", "naturaleza", "familia", "lugares", "casa",
]);

const PROMPT_PHRASE = "いくつ見えますか？";
const POST_ANSWER_SPEECH_DELAY = 500;

const CORAL_DARK = "#C03A1E";

// ── Helpers ────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 4 opciones: el número correcto + 3 distractores tomados del resto de números. */
function buildOptions(numberWords: VocabWord[], correct: VocabWord): VocabWord[] {
  const distractors = shuffle(numberWords.filter((w) => w.hiragana !== correct.hiragana)).slice(0, 3);
  return shuffle([correct, ...distractors]);
}

function buildRound(numberWords: VocabWord[], objectPool: VocabWord[]): Round {
  const numberWord = numberWords[Math.floor(Math.random() * numberWords.length)];
  const object = objectPool[Math.floor(Math.random() * objectPool.length)];
  return { numberWord, object, options: buildOptions(numberWords, numberWord) };
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  vocabulary: VocabWord[];
  progress: ProgressItems;
  sessionLimit?: number;
  onProgressUpdate: (updates: ProgressItems) => void;
  onBack: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function VocabCountingGame({
  vocabulary,
  progress,
  sessionLimit = 10,
  onProgressUpdate,
  onBack,
}: Props) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [selected, setSelected] = useState<string | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const { speak } = useSpeech();

  const today = toISODate();

  const foxPose =
    phase === "correct" ? foxCelebratingImg :
    phase === "wrong" ? foxSadImg :
    foxNeutralImg;

  // Arma la sesión al montar: números 1-10 como respuestas posibles, objetos
  // concretos (con imagen generada) de las categorías seleccionadas como lo
  // que hay que contar. Si la selección no deja objetos contables (p.ej. solo
  // "Números" o "Colores"), cae de vuelta al vocabulario completo.
  useEffect(() => {
    const numberWords = VOCABULARY.filter((w) => w.category === "numeros" && typeof w.numberValue === "number");
    const objectPool = vocabulary.filter((w) => COUNTABLE_CATEGORIES.has(w.category) && w.generated && w.imagePath);
    const fallbackPool = objectPool.length > 0
      ? objectPool
      : VOCABULARY.filter((w) => COUNTABLE_CATEGORIES.has(w.category) && w.generated && w.imagePath);

    const built = Array.from({ length: sessionLimit }, () => buildRound(numberWords, fallbackPool));
    setRounds(built);
    setRoundIndex(0);
    if (built.length > 0) initRound();
    else setPhase("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initRound() {
    setSelected(null);
    setPhase("playing");
    speak(PROMPT_PHRASE);
  }

  const currentRound = rounds[roundIndex] ?? null;

  function advanceToNext() {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= rounds.length) {
      setPhase("done");
      return;
    }
    setRoundIndex(nextIndex);
    initRound();
  }

  function recordResult(numberWord: VocabWord, isCorrect: boolean) {
    const key = vocabProgressKey("counting", numberWord.hiragana);
    const prevP: ItemProgress = progress[key] ?? {
      box: 0,
      nextDue: today,
      attempts: 0,
      correct: 0,
    };
    const { box, nextDue } = advanceBox(prevP, isCorrect, today);
    const newP: ItemProgress = {
      box,
      nextDue,
      attempts: prevP.attempts + 1,
      correct: prevP.correct + (isCorrect ? 1 : 0),
    };
    onProgressUpdate({ [key]: newP });
    setSessionResults((prev) => [...prev, { word: numberWord, correct: isCorrect }]);
  }

  const speakAndWait = useCallback(
    (text: string) => speak(text).then(() => new Promise<void>((resolve) => setTimeout(resolve, POST_ANSWER_SPEECH_DELAY))),
    [speak]
  );

  const finishAnswer = useCallback(
    (numberWord: VocabWord, isCorrect: boolean, delay: Promise<void>) => {
      recordResult(numberWord, isCorrect);
      delay.then(() => advanceToNext());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roundIndex, rounds]
  );

  function handleAnswer(option: VocabWord) {
    if (phase !== "playing" || !currentRound) return;
    setSelected(option.hiragana);
    const isCorrect = option.hiragana === currentRound.numberWord.hiragana;
    if (isCorrect) {
      playChime();
      fireConfetti();
      setPhase("correct");
    } else {
      playBuzz();
      setPhase("wrong");
    }
    finishAnswer(currentRound.numberWord, isCorrect, speakAndWait(option.hiragana));
  }

  // ── Done screen ──────────────────────────────────────────────────────────────

  if (phase === "done" || rounds.length === 0) {
    return <VocabSessionSummary sessionResults={sessionResults} onBack={onBack} />;
  }

  if (!currentRound) return null;

  const totalRounds = rounds.length;
  const progressPct = (roundIndex / totalRounds) * 100;
  const objectImageUrl = getVocabImageUrl(currentRound.object.imagePath!);
  const count = currentRound.numberWord.numberValue!;

  // ── Game screen ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8]">
        <button onClick={onBack} className="flex items-center gap-1 hover:opacity-70">
          <ArrowLeft size={14} /> Salir
        </button>
        <span>
          {roundIndex + 1} / {totalRounds}
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#F0EDF8] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #7B4FD4, #9B7CE8)" }}
        />
      </div>

      {/* Pregunta */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-2xl font-bold" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#1A1A2E" }}>
          {PROMPT_PHRASE}
        </p>
        <p className="text-sm" style={{ color: "#8B7FA8" }}>¿Cuántos ves?</p>
      </div>

      {/* Grilla de objetos a contar */}
      <div
        className="w-full max-w-xs grid grid-cols-5 gap-2 justify-items-center rounded-2xl p-4"
        style={{ backgroundColor: "#F5F0EA" }}
      >
        {Array.from({ length: count }, (_, i) => (
          <img
            key={i}
            src={objectImageUrl}
            alt={currentRound.object.meaning}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ))}
      </div>

      <img src={foxPose} alt="" className="w-16 h-16 object-contain shrink-0 transition-opacity" />

      {/* 4 opciones en hiragana */}
      <div className="w-full grid grid-cols-2 gap-2.5">
        {currentRound.options.map((opt) => {
          const isCorrectOpt = opt.hiragana === currentRound.numberWord.hiragana;
          const isSelectedOpt = opt.hiragana === selected;
          let style: React.CSSProperties = { borderColor: "#EEEEEE", backgroundColor: "#FFFFFF", color: "#1A1A2E" };
          if (phase !== "playing") {
            if (isCorrectOpt) style = { borderColor: "#0A6E54", backgroundColor: "#E9F7F1", color: "#0A6E54" };
            else if (isSelectedOpt) style = { borderColor: CORAL_DARK, backgroundColor: "#FDEDEA", color: CORAL_DARK };
          }
          return (
            <button
              key={opt.hiragana}
              disabled={phase !== "playing"}
              onClick={() => handleAnswer(opt)}
              className="w-full py-4 rounded-2xl border-2 text-2xl font-semibold text-center transition-colors disabled:opacity-100"
              style={{ ...style, fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {opt.hiragana}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {phase === "correct" && (
        <p className="text-[#0A6E54] font-semibold text-sm">✅ ¡Correcto! · {currentRound.numberWord.romaji} · {currentRound.numberWord.meaning}</p>
      )}
      {phase === "wrong" && (
        <p className="text-[#C03A1E] font-semibold text-sm">❌ Era {currentRound.numberWord.romaji} · {currentRound.numberWord.meaning}</p>
      )}
    </div>
  );
}
