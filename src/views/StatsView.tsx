import { useState } from "react";
import { ArrowLeft, Flame, Check, AlertTriangle, ChevronDown, Info, Map } from "lucide-react";
import type { ProgressItems, StreakData, DailyProgress, CharStatus } from "../types";
import type { ViewName } from "../data";
import { ROWS, DAKUTEN_ROWS, COMPOUND_ROWS, ALL_CHARS } from "../data";
import { KATAKANA_ROWS, KATAKANA_DAKUTEN_ROWS, KATAKANA_COMPOUND_ROWS, KATAKANA_ALL_CHARS } from "../dataKatakana";
import { charStatus } from "../utils";
import { DAILY_GOAL } from "../streak";

// ── Design tokens (mismo sistema que HomeView/HiraganaSetupView) ───────────

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const BLUE        = "#2F6FE4";
const BLUE_DARK   = "#1D4FB0";
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

type ScriptId = "hiragana" | "katakana";

interface ScriptStats {
  id: ScriptId;
  label: string;
  accent: string;
  accentDark: string;
  totalChars: number;
  masteredTotal: number;
  categories: { label: string; rows: RowGroup[] }[];
  rowSections: { label: string; rows: RowGroup[] }[];
}

export default function StatsView({ progress, streak, dailyProgress, masteredTotal, today, setView }: Props) {
  const [showLegend, setShowLegend] = useState(false);
  const [activeScript, setActiveScript] = useState<ScriptId>("hiragana");

  const todayCorrect = Math.min(dailyProgress.date === today ? dailyProgress.correctToday : 0, DAILY_GOAL);

  const masteredKataTotal = KATAKANA_ALL_CHARS.filter((c) => charStatus(progress, c.kana) === "mastered").length;

  const scripts: Record<ScriptId, ScriptStats> = {
    hiragana: {
      id: "hiragana",
      label: "Hiragana",
      accent: PURPLE,
      accentDark: PURPLE_DARK,
      totalChars: ALL_CHARS.length,
      masteredTotal,
      categories: [
        { label: "Básico", rows: ROWS },
        { label: "Dakuten", rows: DAKUTEN_ROWS },
        { label: "Combinaciones", rows: COMPOUND_ROWS },
      ],
      rowSections: [
        { label: "Hiragana básico", rows: ROWS },
        { label: "Dakuten y Handakuten", rows: DAKUTEN_ROWS },
        { label: "Combinaciones (拗音)", rows: COMPOUND_ROWS },
      ],
    },
    katakana: {
      id: "katakana",
      label: "Katakana",
      accent: BLUE,
      accentDark: BLUE_DARK,
      totalChars: KATAKANA_ALL_CHARS.length,
      masteredTotal: masteredKataTotal,
      categories: [
        { label: "Básico", rows: KATAKANA_ROWS },
        { label: "Dakuten", rows: KATAKANA_DAKUTEN_ROWS },
        { label: "Combinaciones", rows: KATAKANA_COMPOUND_ROWS },
      ],
      rowSections: [
        { label: "Katakana básico", rows: KATAKANA_ROWS },
        { label: "Dakuten y Handakuten", rows: KATAKANA_DAKUTEN_ROWS },
        { label: "Combinaciones (拗音)", rows: KATAKANA_COMPOUND_ROWS },
      ],
    },
  };

  const active = scripts[activeScript];
  const overallPct = active.totalChars > 0 ? Math.round((active.masteredTotal / active.totalChars) * 100) : 0;

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Inicio
        </button>
        <button onClick={() => setView("roadmap")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <Map size={14} /> Camino a B1
        </button>
      </div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
        Tu progreso
      </h2>

      {/* ── Racha (global, no depende del silabario activo) ── */}
      <div className="flex items-center gap-4 mt-4 text-sm" style={{ color: TEXT_SECOND }}>
        <span className="flex items-center gap-1.5">
          <Flame size={14} style={{ color: "#F5A623" }} /> {streak.current} día{streak.current === 1 ? "" : "s"} · récord {streak.longest}
        </span>
        <span className="flex items-center gap-1.5">
          <Check size={14} style={{ color: "#059669" }} /> Hoy {todayCorrect}/{DAILY_GOAL}
        </span>
      </div>

      {/* ── Selector de silabario ── */}
      <div className="flex gap-1 rounded-xl p-1 mt-4" style={{ backgroundColor: "#F5F5F7" }}>
        {(Object.keys(scripts) as ScriptId[]).map((id) => (
          <button
            key={id}
            onClick={() => setActiveScript(id)}
            className={`flex-1 py-2 text-sm rounded-lg font-semibold transition-all ${activeScript === id ? "bg-white shadow-sm" : ""}`}
            style={{ color: activeScript === id ? scripts[id].accentDark : TEXT_SECOND }}
          >
            {scripts[id].label}
          </button>
        ))}
      </div>

      {/* ── Resumen del silabario activo ── */}
      <div
        key={active.id}
        className="relative rounded-3xl p-5 mt-4 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${active.accent}, ${active.accentDark})` }}
      >
        <div className="text-[11px] font-semibold tracking-wide uppercase opacity-80">{active.label} dominado</div>
        <div className="flex items-end justify-between mt-1">
          <div className="text-4xl font-bold">{overallPct}%</div>
          <div className="text-sm opacity-90 mb-1">{active.masteredTotal}/{active.totalChars} caracteres</div>
        </div>
        <div className="w-full h-2 bg-white/25 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {/* ── Por categoría ── */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {active.categories.map((cat) => {
          const { total, mastered } = categoryTotals(progress, cat.rows);
          const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
          return (
            <div key={cat.label} className="rounded-2xl border p-3" style={{ borderColor: BORDER, backgroundColor: "#FFFFFF" }}>
              <div className="text-xs font-semibold" style={{ color: TEXT_MAIN }}>{cat.label}</div>
              <div className="text-[11px] mt-0.5" style={{ color: TEXT_SECOND }}>{mastered}/{total} dominados</div>
              <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: "#F0EAF9" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: active.accent }} />
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

      {/* ── Filas del silabario activo ── */}
      {active.rowSections.map((section) => (
        <div key={section.label}>
          <div className="text-sm font-semibold mt-6 mb-2" style={{ color: TEXT_MAIN }}>{section.label}</div>
          {section.rows.map((row) => <RowBlock key={row.id} row={row} progress={progress} accent={active.accent} />)}
        </div>
      ))}
    </div>
  );
}

function RowBlock({ row, progress, accent = PURPLE }: { row: RowGroup; progress: ProgressItems; accent?: string }) {
  const mastered = rowMasteredCount(progress, row.chars);
  const pct = row.chars.length > 0 ? Math.round((mastered / row.chars.length) * 100) : 0;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-medium" style={{ color: TEXT_SECOND }}>{row.title}</div>
        <div className="text-[11px] font-semibold" style={{ color: TEXT_MUTED }}>{mastered}/{row.chars.length}</div>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden mb-2" style={{ backgroundColor: "#F0EAF9" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent }} />
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
