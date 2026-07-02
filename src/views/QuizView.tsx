import type { FormEvent, RefObject } from "react";
import { Check, X, RotateCcw, Play, ArrowLeft } from "lucide-react";
import type { CharWithRow, CharData, QuizMode, QueueItem, Feedback, MissedItem } from "../types";
import type { ViewName } from "../data";
import { WORDS } from "../words";
import ProductionCard from "../components/ProductionCard";
import AudioButton from "../components/AudioButton";

interface Props {
  view: "quiz" | "preview" | "summary";
  setView: (v: ViewName) => void;

  // Preview
  previewRows: { id: string; title: string; chars: CharData[] }[];
  pendingStartRef: RefObject<(() => void) | null>;

  // Quiz / summary
  current: CharWithRow | null;
  currentMode: QuizMode;
  feedback: Feedback | null;
  input: string;
  setInput: (v: string) => void;
  choices: CharWithRow[];
  selectedOption: string | null;
  correctCount: number;
  sessionQueue: QueueItem[];
  sessionIndexRef: RefObject<number>;
  missedList: MissedItem[];
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  handleProductionAnswer: (kana: string) => void;
  handleProductionNext: () => void;
  reviewMisses: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  nextBtnRef: RefObject<HTMLButtonElement | null>;
}

export default function QuizView({
  view, setView,
  previewRows, pendingStartRef,
  current, currentMode, feedback, input, setInput, choices, selectedOption,
  correctCount, sessionQueue, sessionIndexRef, missedList,
  handleSubmit, handleProductionAnswer, handleProductionNext, reviewMisses,
  inputRef, nextBtnRef,
}: Props) {
  const queueLen    = sessionQueue.length;
  const questionNum = sessionIndexRef.current + 1;
  const uniqueMissed = new Set(missedList.map((m) => `${m.mode}:${m.kana}`)).size;

  if (view === "preview") {
    return (
      <div className="flex flex-col items-center">
        <div className="w-full flex items-center justify-between text-xs text-stone-500 mb-6">
          <button onClick={() => setView("hiraganaSetup")} className="flex items-center gap-1 hover:text-stone-700">
            <ArrowLeft size={14} /> Volver
          </button>
          <span>Repaso previo</span>
        </div>

        <p className="text-sm text-stone-500 mb-6 text-center">
          {previewRows.length === 1
            ? `La siguiente sesión incluye la fila "${previewRows[0].title.split("—")[1].trim()}", que es nueva para ti.`
            : `La siguiente sesión incluye ${previewRows.length} filas nuevas para ti.`}
        </p>

        {previewRows.map((row) => (
          <div key={row.id} className="w-full mb-8">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-4 text-center">
              {row.title.split("—")[1].trim()}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {row.chars.map((ch) => (
                <div key={ch.kana} className="flex flex-col items-center gap-1 w-16">
                  <span className="text-5xl select-none" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                    {ch.kana}
                  </span>
                  <span className="text-sm text-stone-500">{ch.romaji}</span>
                  <AudioButton text={ch.kana} className="mt-1" />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="w-full flex flex-col gap-2 mt-4">
          <button
            onClick={() => { pendingStartRef.current?.(); }}
            className="w-full py-3 rounded-xl bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2"
          >
            <Play size={18} /> Empezar test
          </button>
          <button
            onClick={() => { pendingStartRef.current?.(); }}
            className="w-full py-3 rounded-xl border-2 border-stone-300 text-stone-500 font-medium text-sm"
          >
            Ya me los sé, saltar repaso
          </button>
        </div>
      </div>
    );
  }

  if (view === "quiz" && current) {
    return (
      <div className="flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between text-xs text-stone-500 mb-2">
          <button onClick={() => setView("home")} className="flex items-center gap-1 hover:text-stone-700">
            <ArrowLeft size={14} /> Salir
          </button>
          <span>Pregunta {Math.min(questionNum, queueLen)} de {queueLen}</span>
        </div>
        <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden mb-10">
          <div className="h-full bg-indigo-700 transition-all" style={{ width: `${((questionNum - 1) / queueLen) * 100}%` }} />
        </div>

        {currentMode !== "production" ? (
          /* ── Recognition / word: kana → romaji ── */
          <>
            <div className="flex flex-col items-center mb-10 gap-3">
              <div
                key={current.kana + "-rec"}
                className={`select-none ${currentMode === "word" ? "text-6xl" : "text-9xl"}`}
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                {current.kana}
              </div>
              <AudioButton text={current.kana} />
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!!feedback}
                placeholder="romaji"
                autoComplete="off"
                autoCapitalize="off"
                className={`w-48 text-center text-xl py-2 px-3 rounded-lg border-2 outline-none transition-colors ${
                  feedback?.status === "correct" ? "border-emerald-400 bg-emerald-50" :
                  feedback?.status === "wrong"   ? "border-rose-400 bg-rose-50" :
                  "border-stone-300 focus:border-indigo-600"
                }`}
              />

              {feedback?.status === "correct" && (
                <div className="stamp-pop flex items-center gap-2 text-emerald-700 font-semibold">
                  <span className="rounded-full border-2 border-emerald-600 p-1"><Check size={16} /></span>
                  ¡Correcto!{currentMode === "word" && ` — ${WORDS.find((w) => w.kana === current.kana)?.meaning}`}
                </div>
              )}
              {feedback?.status === "wrong" && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-rose-700 font-semibold">
                    <span className="rounded-full border-2 border-rose-600 p-1"><X size={16} /></span>
                    Era "{feedback.expected}"{currentMode === "word" && ` — ${WORDS.find((w) => w.kana === current.kana)?.meaning}`}
                  </div>
                  <button ref={nextBtnRef} type="submit" className="px-6 py-3 rounded-lg bg-rose-700 text-white text-sm font-medium">
                    Siguiente →
                  </button>
                </div>
              )}
              {!feedback && (
                <button type="submit" className="px-6 py-3 rounded-lg bg-indigo-700 text-white text-sm font-medium">
                  Comprobar
                </button>
              )}
            </form>
          </>
        ) : (
          /* ── Production: romaji → kana ── */
          <ProductionCard
            key={current.kana + "-prod"}
            romaji={current.romaji}
            choices={choices}
            correctKana={current.kana}
            selectedKana={selectedOption}
            feedback={feedback}
            onSelect={handleProductionAnswer}
            onNext={handleProductionNext}
            nextBtnRef={nextBtnRef}
          />
        )}

        <p className="text-xs text-stone-400 mt-10">
          {correctCount}/{sessionIndexRef.current} correctas en esta sesión
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold" style={{ fontFamily: "'Shippori Mincho', serif" }}>Sesión completa</h2>
      <div className="mt-4 rounded-xl bg-white border border-stone-200 p-5 text-center">
        <span className="text-5xl font-bold text-indigo-700">
          {sessionIndexRef.current > 0 ? Math.round((correctCount / sessionIndexRef.current) * 100) : 0}%
        </span>
        <p className="text-stone-500 text-sm mt-1">{correctCount} de {sessionIndexRef.current} correctas</p>
      </div>

      {missedList.length > 0 && (
        <div className="mt-5">
          <span className="text-sm font-medium text-stone-600">Fallos de esta sesión</span>
          <div className="mt-2 space-y-1">
            {[...new Map(missedList.map((m) => [`${m.mode}:${m.kana}`, m])).values()].map((m) => (
              <div key={`${m.mode}:${m.kana}`} className="flex items-center justify-between gap-2 text-sm bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                <span className="text-xl shrink-0" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{m.kana}</span>
                <span className="text-stone-400 text-xs shrink-0">{m.mode === "production" ? "→ kana" : "→ romaji"}</span>
                <span className="text-stone-500 truncate">{m.mode === "production" ? "elegiste" : "escribiste"} "{m.given}"</span>
                <span className="text-rose-700 font-medium shrink-0">
                  era "{m.expected}"{m.mode === "word" && ` — ${WORDS.find((w) => w.kana === m.kana)?.meaning}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 mt-6">
        {missedList.length > 0 && (
          <button onClick={reviewMisses} className="w-full py-3 rounded-xl bg-rose-700 text-white font-semibold flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Repasar fallos ({uniqueMissed})
          </button>
        )}
        <button onClick={() => setView("home")} className="w-full py-3 rounded-xl bg-indigo-700 text-white font-semibold">
          Nueva sesión
        </button>
        <button onClick={() => setView("stats")} className="w-full py-2 rounded-xl text-stone-500 text-sm">
          Ver estadísticas
        </button>
      </div>
    </div>
  );
}
