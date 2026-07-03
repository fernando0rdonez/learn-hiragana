import { useEffect, useState } from "react";
import type { FormEvent, RefObject } from "react";
import { RotateCcw, ArrowLeft, Volume2 } from "lucide-react";
import type { CharWithRow, CharData, QuizMode, QueueItem, Feedback, MissedItem } from "../types";
import type { ViewName } from "../data";
import { WORDS } from "../words";
import ProductionCard from "../components/ProductionCard";
import { useSpeech } from "../hooks/useSpeech";
import { fireConfetti } from "../components/ConfettiOverlay";
import foxCalmImg from "../assets/character/fox-calm.png";
import foxNeutral from "../assets/character/fox-neutral.png";
import foxCelebrating from "../assets/character/fox-celebrating.png";
import foxSad from "../assets/character/fox-sad.png";
import foxProud from "../assets/character/fox-proud.png";
import foxWorried from "../assets/character/fox-worried.png";

function summaryMascot(pct: number) {
  if (pct >= 90) return foxCelebrating;
  if (pct >= 70) return foxProud;
  if (pct >= 50) return foxNeutral;
  if (pct >= 30) return foxWorried;
  return foxSad;
}

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
  const { speak } = useSpeech();

  const [foxPose, setFoxPose] = useState(foxNeutral);
  useEffect(() => {
    if (!feedback) { setFoxPose(foxNeutral); return; }
    if (feedback.status === "correct") {
      setFoxPose(foxCelebrating);
      fireConfetti();
    } else {
      setFoxPose(foxSad);
    }
  }, [feedback]);

  if (view === "preview") {
    return <PreviewView previewRows={previewRows} pendingStartRef={pendingStartRef} setView={setView} />;
  }

  if (view === "quiz" && current) {
    return (
      <div className="flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between text-xs text-[#8B7FA8] mb-2">
          <button onClick={() => setView("home")} className="flex items-center gap-1 hover:opacity-70">
            <ArrowLeft size={14} /> Salir
          </button>
          <span>Pregunta {Math.min(questionNum, queueLen)} de {queueLen}</span>
        </div>
        <div className="w-full h-1.5 bg-[#F0EDF8] rounded-full overflow-hidden mb-10">
          <div
            className="h-full transition-all"
            style={{
              width: `${((questionNum - 1) / queueLen) * 100}%`,
              background: "linear-gradient(90deg, #7B4FD4, #9B7CE8)",
            }}
          />
        </div>

        {currentMode !== "production" ? (
          /* ── Recognition / word: kana → romaji ── */
          <>
            <div className="flex flex-col items-center gap-3">
              <div
                key={current.kana + "-rec"}
                className={`select-none text-center leading-none text-[96px] transition-colors ${
                  feedback?.status === "correct" ? "text-[#15C0A0]" :
                  feedback?.status === "wrong"   ? "text-[#E85D3A]" :
                  "text-[#1A1A2E]"
                }`}
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                {current.kana}
              </div>
              <button
                onClick={() => speak(current.kana)}
                aria-label="Escuchar pronunciación"
                className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#F0EDF8] text-[#8B7FA8] hover:border-[#7B4FD4] transition-colors"
              >
                <Volume2 size={16} />
              </button>
            </div>

            {/* Fox */}
            <div className="w-full h-20 flex items-end justify-end pr-2 mb-1">
              <img src={foxPose} alt="" className="w-20 h-20 object-contain transition-opacity" />
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!!feedback}
                placeholder="romaji"
                autoComplete="off"
                autoCapitalize="off"
                className={`w-full h-[52px] text-center text-[18px] rounded-[14px] outline-none border-2 transition-colors ${
                  feedback?.status === "correct" ? "border-[#15C0A0] bg-[#E3FAF3] text-[#0A6E54]" :
                  feedback?.status === "wrong"   ? "border-[#E85D3A] bg-[#FFEEEA] text-[#C03A1E]" :
                  "border-[#E0D8F8] focus:border-[#7B4FD4]"
                }`}
              />

              <div className="flex items-center gap-2 text-sm min-h-[20px]">
                {feedback?.status === "correct" && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#15C0A0]" />
                    <span className="text-[#0A6E54]">
                      ¡Correcto!{currentMode === "word" && ` — ${WORDS.find((w) => w.kana === current.kana)?.meaning}`}
                    </span>
                  </>
                )}
                {feedback?.status === "wrong" && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#E85D3A]" />
                    <span className="text-[#C03A1E]">
                      Era "{feedback.expected}"{currentMode === "word" && ` — ${WORDS.find((w) => w.kana === current.kana)?.meaning}`}
                    </span>
                  </>
                )}
              </div>

              <button
                ref={feedback?.status === "wrong" ? nextBtnRef : undefined}
                type="submit"
                className={`w-full h-[50px] rounded-[14px] text-white font-bold ${
                  feedback?.status === "correct" ? "bg-[#15C0A0]" :
                  feedback?.status === "wrong"   ? "bg-[#E85D3A]" :
                  ""
                }`}
                style={feedback ? undefined : { background: "linear-gradient(90deg, #7B4FD4, #5533A8)" }}
              >
                {feedback ? "Siguiente →" : "Comprobar"}
              </button>
            </form>
          </>
        ) : (
          /* ── Production: romaji → kana ── */
          <>
            <div className="w-full h-20 flex items-end justify-end pr-2 mb-1">
              <img src={foxPose} alt="" className="w-20 h-20 object-contain transition-opacity" />
            </div>
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
          </>
        )}

        <p className="mt-10 text-center text-[11px] text-[#CCCCCC]">
          {correctCount}/{sessionIndexRef.current} correctas
        </p>
      </div>
    );
  }

  const total = sessionIndexRef.current;
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="pb-4">
      {/* Hero card */}
      <div
        className="relative rounded-3xl pt-6 px-6 pb-9 text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, #7B4FD4, #5533A8)", overflow: "visible" }}
      >
        <div className="text-xs font-semibold tracking-wide uppercase opacity-80">Sesión completa</div>
        <div className="mt-2 text-5xl font-bold" style={{ fontFamily: "'Shippori Mincho', serif" }}>{pct}%</div>
        <div className="text-sm opacity-90 mt-1">{correctCount} de {total} correctas</div>

        <img
          src={summaryMascot(pct)}
          alt=""
          className="absolute pointer-events-none select-none"
          style={{ width: 110, height: 110, bottom: -30, right: 14, objectFit: "contain" }}
        />
      </div>

      {missedList.length > 0 && (
        <div className="mt-10">
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#8B7FA8" }}>Fallos de esta sesión</span>
          <div className="mt-2 space-y-2">
            {[...new Map(missedList.map((m) => [`${m.mode}:${m.kana}`, m])).values()].map((m) => (
              <div
                key={`${m.mode}:${m.kana}`}
                className="flex items-center justify-between gap-2 text-sm rounded-2xl px-3 py-2.5"
                style={{ backgroundColor: "#FFEEEA", border: "1.5px solid #F4C4B4" }}
              >
                <span className="text-xl shrink-0" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#1A1A2E" }}>{m.kana}</span>
                <span className="text-xs shrink-0" style={{ color: "#8B7FA8" }}>{m.mode === "production" ? "→ kana" : "→ romaji"}</span>
                <span className="truncate" style={{ color: "#8B7FA8" }}>{m.mode === "production" ? "elegiste" : "escribiste"} "{m.given}"</span>
                <span className="font-medium shrink-0" style={{ color: "#C03A1E" }}>
                  era "{m.expected}"{m.mode === "word" && ` — ${WORDS.find((w) => w.kana === m.kana)?.meaning}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 mt-6">
        {missedList.length > 0 && (
          <button
            onClick={reviewMisses}
            className="w-full h-[50px] rounded-[14px] text-white font-bold flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(90deg, #E85D3A, #C03A1E)" }}
          >
            <RotateCcw size={16} /> Repasar fallos ({uniqueMissed})
          </button>
        )}
        <button
          onClick={() => setView("home")}
          className="w-full h-[50px] rounded-[14px] text-white font-bold"
          style={{ background: "linear-gradient(90deg, #7B4FD4, #5533A8)" }}
        >
          Nueva sesión
        </button>
        <button onClick={() => setView("stats")} className="w-full py-2 rounded-xl text-sm" style={{ color: "#8B7FA8" }}>
          Ver estadísticas
        </button>
      </div>
    </div>
  );
}

// ── Preview: nuevos kana antes de practicar ─────────────────────────────────

interface PreviewViewProps {
  previewRows: { id: string; title: string; chars: CharData[] }[];
  pendingStartRef: RefObject<(() => void) | null>;
  setView: (v: ViewName) => void;
}

function PreviewView({ previewRows, pendingStartRef, setView }: PreviewViewProps) {
  const [playedKanas, setPlayedKanas] = useState<Set<string>>(new Set());
  const totalChars = previewRows.reduce((sum, r) => sum + r.chars.length, 0);
  const { speak } = useSpeech();

  function handleTileClick(kana: string) {
    setPlayedKanas((prev) => new Set(prev).add(kana));
    speak(kana);
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 4rem)" }}>
      {/* Header */}
      <div className="flex items-start justify-between pb-4">
        <button onClick={() => setView("hiraganaSetup")} className="flex items-center gap-1 text-sm mt-1" style={{ color: "#8B7FA8" }}>
          <ArrowLeft size={14} /> Volver
        </button>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1A1A2E" }}>Nuevos kana</div>
          <div className="text-xs mt-0.5" style={{ color: "#8B7FA8" }}>Toca cada uno para escuchar</div>
        </div>
      </div>

      {/* Hero strip */}
      <div
        className="relative rounded-2xl px-5 pt-4 text-white"
        style={{ background: "linear-gradient(135deg, #7B4FD4, #5533A8)", overflow: "visible", paddingBottom: 80 }}
      >
        <div className="text-[11px] font-semibold tracking-wide uppercase opacity-80">Conoce antes de practicar</div>
        <div className="mt-1 pr-16">
          <span className="text-xl font-bold">{totalChars} caracteres</span>
          <span className="text-sm opacity-80"> · {previewRows.length} fila{previewRows.length === 1 ? "" : "s"} nueva{previewRows.length === 1 ? "" : "s"}</span>
        </div>
        <img
          src={foxCalmImg}
          alt=""
          className="absolute pointer-events-none select-none"
          style={{ width: 95, height: 95, bottom: -28, right: 10, objectFit: "contain" }}
        />
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto mt-6 pb-4">
        {previewRows.map((row) => (
          <div key={row.id} className="mb-6">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#8B7FA8" }}>
              {row.title.split("—")[1].trim()}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {row.chars.map((ch) => {
                const played = playedKanas.has(ch.kana);
                return (
                  <button
                    key={ch.kana}
                    onClick={() => handleTileClick(ch.kana)}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition-colors"
                    style={{
                      paddingTop: 18, paddingBottom: 18,
                      borderColor: played ? "#7B4FD4" : "#EEEEEE",
                      backgroundColor: played ? "#EDE7F9" : "#FFFFFF",
                    }}
                  >
                    <span
                      className="select-none leading-none"
                      style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 42, color: played ? "#5533A8" : "#1A1A2E" }}
                    >
                      {ch.kana}
                    </span>
                    <span className="text-xs" style={{ color: played ? "#7B4FD4" : "#8B7FA8" }}>{ch.romaji}</span>
                    <span className="rounded-full" style={{ width: 7, height: 7, backgroundColor: played ? "#7B4FD4" : "#DDDDDD" }} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white pt-2">
        <p className="text-center" style={{ color: "#BBBBBB", fontSize: 11 }}>Escucha cada kana antes de continuar</p>
        <button
          onClick={() => { pendingStartRef.current?.(); }}
          className="w-full mt-2 rounded-xl font-bold"
          style={{ height: 42, border: "2px solid #E0D8F8", backgroundColor: "#FFFFFF", color: "#7B4FD4" }}
        >
          Continuar al test →
        </button>
      </div>
    </div>
  );
}
