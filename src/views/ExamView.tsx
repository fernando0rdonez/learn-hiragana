import { useState } from "react";
import { ArrowLeft, GraduationCap, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import type { ViewName } from "../data";
import type { ExamAttempt } from "../types";
import {
  buildExam, EXAM_TOPICS, EXAM_TOPIC_LABEL, EXAM_TOPIC_REVIEW_VIEW, EXAM_MODULES,
  type ExamQuestion, type ExamTopic,
} from "../exam/examBank";
import { gradeExam, normalizeAnswer, PASS_THRESHOLD, type ExamResult } from "../exam/grade";
import GrammarTokenChip from "../components/GrammarTokenChip";
import GrammarTokenSlots from "../components/GrammarTokenSlots";
import { fireConfetti } from "../components/ConfettiOverlay";
import { summaryMascot } from "../mascot";

const EXAM_QUESTION_COUNT = 40;

const GOLD      = "#B8860B";
const GOLD_DARK = "#8A6508";
const GOLD_LT   = "#FBF3DE";
const TEXT_MAIN = "#1A1A2E";
const TEXT_SEC  = "#8B7FA8";

interface Props {
  setView: (v: ViewName) => void;
  examHistory: ExamAttempt[];
  recordExamAttempt: (a: ExamAttempt) => void;
}

type Phase = "intro" | "running" | "report";

interface Chip { id: number; token: string; used: boolean; }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toISODate(d = new Date()): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}

export default function ExamView({ setView, examHistory, recordExamAttempt }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [result, setResult] = useState<ExamResult | null>(null);

  const [textInput, setTextInput] = useState("");
  const [chips, setChips] = useState<Chip[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [slotChipIds, setSlotChipIds] = useState<(number | null)[]>([]);

  const current = questions[index] ?? null;
  const best = examHistory.length > 0 ? Math.max(...examHistory.map((a) => a.overallPct)) : null;

  function initQuestion(q: ExamQuestion) {
    setTextInput("");
    if (q.kind === "tokens") {
      const toks = q.tokens ?? [];
      setChips(shuffle(toks.map((token, id) => ({ id, token, used: false }))));
      setSlots(Array(toks.length).fill(null));
      setSlotChipIds(Array(toks.length).fill(null));
    } else {
      setChips([]); setSlots([]); setSlotChipIds([]);
    }
  }

  function start() {
    const qs = buildExam(EXAM_QUESTION_COUNT);
    setQuestions(qs);
    setIndex(0);
    setAnswers({});
    setResult(null);
    initQuestion(qs[0]);
    setPhase("running");
  }

  function currentAnswer(): string | string[] {
    if (!current) return "";
    if (current.kind === "tokens") return slots.filter((s): s is string => s !== null);
    return textInput.trim();
  }

  function goNext() {
    if (!current) return;
    const merged = { ...answers, [current.id]: currentAnswer() };
    setAnswers(merged);

    if (index + 1 >= questions.length) {
      const res = gradeExam(questions, merged);
      setResult(res);
      const byTopic: Record<string, number> = {};
      for (const t of EXAM_TOPICS) byTopic[t] = res.byTopic[t].pct;
      recordExamAttempt({
        date: toISODate(),
        overallPct: res.overall.pct,
        passed: res.overall.passed,
        total: res.overall.total,
        byTopic,
      });
      if (res.overall.passed) fireConfetti();
      setPhase("report");
      return;
    }
    const nextQ = questions[index + 1];
    setIndex(index + 1);
    initQuestion(nextQ);
  }

  function tapChip(chipId: number) {
    const emptyIdx = slots.findIndex((s) => s === null);
    if (emptyIdx === -1) return;
    const chip = chips.find((c) => c.id === chipId);
    if (!chip || chip.used) return;
    const ns = [...slots]; ns[emptyIdx] = chip.token;
    const nc = [...slotChipIds]; nc[emptyIdx] = chipId;
    setSlots(ns);
    setSlotChipIds(nc);
    setChips(chips.map((c) => (c.id === chipId ? { ...c, used: true } : c)));
  }

  function tapSlot(idx: number) {
    const ns = [...slots];
    const nc = [...slotChipIds];
    const releasedChips = [...chips];
    for (let i = idx; i < ns.length; i++) {
      const cid = nc[i];
      if (cid !== null) {
        const ci = releasedChips.findIndex((c) => c.id === cid);
        if (ci !== -1) releasedChips[ci] = { ...releasedChips[ci], used: false };
      }
      ns[i] = null; nc[i] = null;
    }
    setSlots(ns);
    setSlotChipIds(nc);
    setChips(releasedChips);
  }

  // ── Intro ────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="pb-16">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SEC }}>
            <ArrowLeft size={14} /> Inicio
          </button>
        </div>

        <div className="rounded-3xl p-6 text-center" style={{ backgroundColor: GOLD_LT }}>
          <GraduationCap size={40} className="mx-auto" style={{ color: GOLD_DARK }} />
          <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
            Examen del curso
          </h2>
          <p className="text-sm mt-1" style={{ color: GOLD_DARK }}>Repaso general de todo lo aprendido</p>
        </div>

        <ul className="mt-5 flex flex-col gap-2 text-sm" style={{ color: "#44405A" }}>
          <li>• {EXAM_QUESTION_COUNT} preguntas de todo el temario, distintas en cada intento.</li>
          <li>• Respuesta escrita: escribe en hiragana o en español según se pida.</li>
          <li>• No se corrige nada hasta el final. No hay vuelta atrás.</li>
          <li>• Se aprueba con <b>{Math.round(PASS_THRESHOLD * 100)}%</b> o más.</li>
        </ul>

        <div className="mt-5 rounded-2xl p-4" style={{ backgroundColor: "#FFFDF7", border: "1px solid #E4D9B8" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: GOLD_DARK }}>Qué practicar</p>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: "#44405A" }}>
            El examen sale de estos módulos (marcados con ⭐ en Inicio):{" "}
            <b>{EXAM_MODULES.map((m) => m.label).join(" · ")}</b>.
          </p>
          <p className="text-xs mt-1.5" style={{ color: "#A9853A" }}>Katakana, Kanji y Listening no entran.</p>
        </div>

        <div className="mt-3 rounded-2xl p-4 flex gap-2.5" style={{ backgroundColor: "#FDEDEA", border: "1px solid #F1C7BC" }}>
          <span aria-hidden className="text-base leading-none">⌨️</span>
          <p className="text-sm leading-relaxed" style={{ color: "#8A3B27" }}>
            Necesitas un <b>teclado de japonés</b> instalado en tu dispositivo para escribir en
            hiragana. Sin él no podrás responder las preguntas de escritura.
          </p>
        </div>

        {best !== null && (
          <p className="mt-4 text-sm font-semibold text-center" style={{ color: GOLD_DARK }}>
            Tu mejor nota: {best}% · {examHistory.length} intento{examHistory.length === 1 ? "" : "s"}
          </p>
        )}

        <button
          onClick={start}
          className="w-full mt-6 py-3.5 rounded-2xl text-white font-semibold"
          style={{ backgroundColor: GOLD }}
        >
          Empezar examen
        </button>
      </div>
    );
  }

  // ── Running ──────────────────────────────────────────────────────────────
  if (phase === "running" && current) {
    const progressPct = (index / questions.length) * 100;
    const canAdvance =
      current.kind === "tokens" ? slots.every((s) => s !== null) : textInput.trim().length > 0;

    return (
      <div className="flex flex-col items-center gap-6 pb-16">
        <div className="w-full flex items-center justify-between text-xs" style={{ color: TEXT_SEC }}>
          <span className="uppercase tracking-wide font-semibold">{EXAM_TOPIC_LABEL[current.topic]}</span>
          <span>{index + 1} / {questions.length}</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: GOLD_LT }}>
          <div className="h-full transition-all" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_DARK})` }} />
        </div>

        <p className="w-full text-base font-medium leading-snug" style={{ color: TEXT_MAIN }}>
          {current.prompt}
        </p>
        {current.hint && current.kind !== "tokens" && (
          <p className="w-full -mt-3 text-xs" style={{ color: TEXT_SEC }}>Pista: {current.hint}</p>
        )}

        {current.kind === "tokens" ? (
          <div className="w-full flex flex-col items-center gap-4">
            <GrammarTokenSlots slots={slots} animClass="" onTapSlot={tapSlot} />
            <div className="flex flex-wrap gap-2 justify-center">
              {chips.map((c) => (
                <GrammarTokenChip key={c.id} token={c.token} used={c.used} onClick={() => tapChip(c.id)} />
              ))}
            </div>
          </div>
        ) : (
          <input
            autoFocus
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && canAdvance) goNext(); }}
            placeholder="Tu respuesta…"
            className="w-full text-center text-xl py-3 rounded-2xl border-2 outline-none"
            style={{ borderColor: "#E4D9B8", fontFamily: "'Noto Sans JP', sans-serif" }}
          />
        )}

        <button
          onClick={goNext}
          disabled={!canAdvance}
          className="w-full py-3.5 rounded-2xl text-white font-semibold disabled:opacity-40"
          style={{ backgroundColor: GOLD }}
        >
          {index + 1 >= questions.length ? "Terminar y calificar" : "Siguiente"}
        </button>
      </div>
    );
  }

  // ── Report ───────────────────────────────────────────────────────────────
  if (phase === "report" && result) {
    return (
      <div className="pb-20">
        <div className="rounded-3xl p-6 text-center" style={{ backgroundColor: result.overall.passed ? "#E9F7F1" : "#FDEDEA" }}>
          <img src={summaryMascot(result.overall.pct)} alt="" className="w-20 h-20 object-contain mx-auto" />
          <div
            className="stamp-pop inline-block mt-2 px-4 py-1.5 rounded-full text-white font-bold tracking-wide uppercase text-sm"
            style={{ backgroundColor: result.overall.passed ? "#0A6E54" : "#C03A1E" }}
          >
            {result.overall.passed ? "Aprobado" : "No aprobado"}
          </div>
          <div className="text-5xl font-bold mt-3" style={{ color: result.overall.passed ? "#0A6E54" : "#C03A1E" }}>
            {result.overall.pct}%
          </div>
          <p className="text-sm mt-1" style={{ color: TEXT_SEC }}>
            {result.overall.correct} de {result.overall.total} correctas
          </p>
        </div>

        {/* Por tema */}
        <h3 className="text-sm font-bold uppercase tracking-wide mt-6 mb-2" style={{ color: TEXT_SEC }}>Por tema</h3>
        <div className="flex flex-col gap-2.5">
          {EXAM_TOPICS.map((t) => {
            const s = result.byTopic[t];
            if (s.total === 0) return null;
            const weak = s.pct < Math.round(PASS_THRESHOLD * 100);
            return (
              <div key={t}>
                <div className="flex items-center justify-between text-xs font-semibold" style={{ color: TEXT_MAIN }}>
                  <span>{EXAM_TOPIC_LABEL[t]}</span>
                  <span style={{ color: weak ? "#C03A1E" : "#0A6E54" }}>{s.correct}/{s.total} · {s.pct}%</span>
                </div>
                <div className="h-2 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: "#EEE" }}>
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: weak ? "#E85D3A" : "#15C0A0" }} />
                </div>
                {weak && (
                  <button
                    onClick={() => setView(EXAM_TOPIC_REVIEW_VIEW[t as ExamTopic])}
                    className="mt-1 text-xs font-semibold underline"
                    style={{ color: GOLD_DARK }}
                  >
                    Repasar {EXAM_TOPIC_LABEL[t].toLowerCase()} →
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Fallos */}
        {result.wrong.length > 0 && (
          <>
            <h3 className="text-sm font-bold uppercase tracking-wide mt-6 mb-2" style={{ color: TEXT_SEC }}>
              Preguntas falladas ({result.wrong.length})
            </h3>
            <div className="flex flex-col gap-3">
              {result.wrong.map(({ question, given, expected }) => (
                <div key={question.id} className="rounded-2xl border p-3" style={{ borderColor: "#EEE" }}>
                  <p className="text-xs" style={{ color: TEXT_SEC }}>{EXAM_TOPIC_LABEL[question.topic]}</p>
                  <p className="text-sm font-medium mt-0.5" style={{ color: TEXT_MAIN }}>{question.prompt}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-sm">
                    <XCircle size={14} className="shrink-0" style={{ color: "#C03A1E" }} />
                    <span style={{ color: "#C03A1E" }}>
                      {Array.isArray(given) ? given.join(" ") || "(sin responder)" : (given as string) || "(sin responder)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-sm">
                    <CheckCircle2 size={14} className="shrink-0" style={{ color: "#0A6E54" }} />
                    {question.showKanaDiff && typeof given === "string" ? (
                      <KanaDiff expected={expected} given={given} />
                    ) : (
                      <span style={{ color: "#0A6E54", fontFamily: "'Noto Sans JP', sans-serif" }}>{expected}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 mt-8">
          <button onClick={start} className="w-full py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: GOLD }}>
            <RotateCcw size={16} /> Repetir examen
          </button>
          <button onClick={() => setView("home")} className="w-full py-3 rounded-2xl font-semibold border" style={{ borderColor: "#E4D9B8", color: GOLD_DARK }}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return null;
}

/** Diff kana-a-kana: pinta cada carácter de la respuesta correcta según coincida con lo tecleado. */
function KanaDiff({ expected, given }: { expected: string; given: string }) {
  const exp = Array.from(expected);
  const giv = Array.from(normalizeAnswer(given));
  return (
    <span style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      {exp.map((ch, i) => (
        <span key={i} style={{ color: normalizeAnswer(ch) === giv[i] ? "#0A6E54" : "#C03A1E", fontWeight: normalizeAnswer(ch) === giv[i] ? 400 : 700 }}>
          {ch}
        </span>
      ))}
    </span>
  );
}
