import { useState } from "react";
import { ArrowLeft, Flame, Check, AlertTriangle, ChevronDown, Info } from "lucide-react";
import type { ProgressItems, StreakData, DailyProgress, CharStatus } from "../types";
import type { ViewName } from "../data";
import { ROWS, DAKUTEN_ROWS, COMPOUND_ROWS, ALL_CHARS } from "../data";
import { charStatus } from "../utils";
import { DAILY_GOAL } from "../streak";

// ── Design tokens (mismo sistema que HomeView/HiraganaSetupView) ───────────

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const TEXT_MUTED  = "#AAAAAA";

const STATUS_STYLE: Record<CharStatus, string> = {
  untested:   "bg-stone-100 text-stone-400 border-stone-200",
  developing: "bg-amber-100 text-amber-800 border-amber-200",
  weak:       "bg-rose-100 text-rose-700 border-rose-300",
  mastered:   "bg-emerald-100 text-emerald-700 border-emerald-300",
};

const STATUS_LABEL: Record<CharStatus, string> = {
  untested: "Nuevo",
  developing: "Aprendiendo",
  weak: "Débil",
  mastered: "Dominado",
};

const STATUS_CRITERIA: Record<CharStatus, string> = {
  untested: "Todavía no lo has practicado.",
  developing: "Ya practicaste, pero aún no llega al umbral de dominado.",
  weak: "Menos del 50% de aciertos — necesita más práctica.",
  mastered: "3 o más intentos y al menos 85% de aciertos.",
};

const STATUS_DOT: Record<CharStatus, string> = {
  untested: "#D6D3D1",
  developing: "#D97706",
  weak: "#E11D48",
  mastered: "#059669",
};

type RowGroup = { id: string; title: string; chars: { kana: string; romaji: string }[] };

interface Props {
  progress: ProgressItems;
  streak: StreakData;
  dailyProgress: DailyProgress;
  masteredTotal: number;
  today: string;
  setView: (v: ViewName) => void;
}

function categoryTotals(progress: ProgressItems, rows: RowGroup[]) {
  let total = 0, mastered = 0;
  rows.forEach((row) => row.chars.forEach((ch) => {
    total++;
    if (charStatus(progress, ch.kana) === "mastered") mastered++;
  }));
  return { total, mastered };
}

function rowMasteredCount(progress: ProgressItems, chars: { kana: string }[]) {
  return chars.filter((ch) => charStatus(progress, ch.kana) === "mastered").length;
}

export default function StatsView({ progress, streak, dailyProgress, masteredTotal, today, setView }: Props) {
  const [showLegend, setShowLegend] = useState(false);

  const totalChars = ALL_CHARS.length;
  const overallPct = totalChars > 0 ? Math.round((masteredTotal / totalChars) * 100) : 0;
  const todayCorrect = Math.min(dailyProgress.date === today ? dailyProgress.correctToday : 0, DAILY_GOAL);

  const categories: { label: string; rows: RowGroup[] }[] = [
    { label: "Básico", rows: ROWS },
    { label: "Dakuten", rows: DAKUTEN_ROWS },
    { label: "Combinaciones", rows: COMPOUND_ROWS },
  ];

  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
        Tu progreso
      </h2>

      {/* ── Resumen general ── */}
      <div
        className="relative rounded-3xl p-5 mt-5 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
      >
        <div className="text-[11px] font-semibold tracking-wide uppercase opacity-80">Hiragana dominado</div>
        <div className="flex items-end justify-between mt-1">
          <div className="text-4xl font-bold">{overallPct}%</div>
          <div className="text-sm opacity-90 mb-1">{masteredTotal}/{totalChars} caracteres</div>
        </div>
        <div className="w-full h-2 bg-white/25 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${overallPct}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.25)" }}>
          <span className="flex items-center gap-1.5">
            <Flame size={14} /> {streak.current} día{streak.current === 1 ? "" : "s"} · récord {streak.longest}
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={14} /> Hoy {todayCorrect}/{DAILY_GOAL}
          </span>
        </div>
      </div>

      {/* ── Por categoría ── */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {categories.map((cat) => {
          const { total, mastered } = categoryTotals(progress, cat.rows);
          const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
          return (
            <div key={cat.label} className="rounded-2xl border p-3" style={{ borderColor: BORDER, backgroundColor: "#FFFFFF" }}>
              <div className="text-xs font-semibold" style={{ color: TEXT_MAIN }}>{cat.label}</div>
              <div className="text-[11px] mt-0.5" style={{ color: TEXT_SECOND }}>{mastered}/{total} dominados</div>
              <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: "#F0EAF9" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PURPLE }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Leyenda de colores ── */}
      <button
        onClick={() => setShowLegend((v) => !v)}
        className="w-full flex items-center justify-between mt-4 rounded-2xl border px-4 py-3"
        style={{ borderColor: BORDER, backgroundColor: "#FAFAFA" }}
      >
        <span className="flex items-center gap-2 text-sm font-medium" style={{ color: TEXT_MAIN }}>
          <Info size={15} style={{ color: TEXT_SECOND }} />
          ¿Cómo se calculan los colores?
        </span>
        <ChevronDown size={16} className={`transition-transform ${showLegend ? "rotate-180" : ""}`} style={{ color: TEXT_SECOND }} />
      </button>
      {showLegend && (
        <div className="rounded-2xl border mt-2 p-4 flex flex-col gap-3" style={{ borderColor: BORDER }}>
          {(Object.keys(STATUS_LABEL) as CharStatus[]).map((status) => (
            <div key={status} className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: STATUS_DOT[status] }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: TEXT_MAIN }}>{STATUS_LABEL[status]}</div>
                <div className="text-xs" style={{ color: TEXT_SECOND }}>{STATUS_CRITERIA[status]}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Básico ── */}
      <div className="text-sm font-semibold mt-6 mb-2" style={{ color: TEXT_MAIN }}>Hiragana básico</div>
      {ROWS.map((row) => <RowBlock key={row.id} row={row} progress={progress} />)}

      {/* ── Dakuten / Handakuten ── */}
      <div className="text-sm font-semibold mt-2 mb-2" style={{ color: TEXT_MAIN }}>Dakuten y Handakuten</div>
      {DAKUTEN_ROWS.map((row) => <RowBlock key={row.id} row={row} progress={progress} />)}

      {/* ── Combinaciones (拗音) ── */}
      <div className="text-sm font-semibold mt-2 mb-2" style={{ color: TEXT_MAIN }}>Combinaciones (拗音)</div>
      {COMPOUND_ROWS.map((row) => <RowBlock key={row.id} row={row} progress={progress} />)}
    </div>
  );
}

function RowBlock({ row, progress }: { row: RowGroup; progress: ProgressItems }) {
  const mastered = rowMasteredCount(progress, row.chars);
  const pct = row.chars.length > 0 ? Math.round((mastered / row.chars.length) * 100) : 0;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-medium" style={{ color: TEXT_SECOND }}>{row.title}</div>
        <div className="text-[11px] font-semibold" style={{ color: TEXT_MUTED }}>{mastered}/{row.chars.length}</div>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden mb-2" style={{ backgroundColor: "#F0EAF9" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PURPLE }} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {row.chars.map((ch) => {
          const status = charStatus(progress, ch.kana);
          const p = progress[`recognition:${ch.kana}`];
          const accuracy = p && p.attempts > 0 ? Math.round((p.correct / p.attempts) * 100) : null;
          const showAccuracy = (status === "developing" || status === "weak") && accuracy !== null;

          return (
            <div key={ch.kana} className={`relative w-12 h-16 rounded-lg border flex flex-col items-center justify-center ${STATUS_STYLE[status]}`}>
              {status === "mastered" && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </span>
              )}
              {status === "weak" && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center">
                  <AlertTriangle size={9} className="text-white" strokeWidth={3} />
                </span>
              )}
              <span className="text-lg" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{ch.kana}</span>
              <span className="text-[10px]">{ch.romaji}</span>
              <span className="text-[9px] leading-none mt-0.5 opacity-80">{showAccuracy ? `${accuracy}%` : " "}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
