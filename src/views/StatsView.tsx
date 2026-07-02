import { ArrowLeft } from "lucide-react";
import type { ProgressItems, StreakData, DailyProgress, CharStatus } from "../types";
import type { ViewName } from "../data";
import { ROWS, DAKUTEN_ROWS, COMPOUND_ROWS, ALL_CHARS } from "../data";
import { charStatus } from "../utils";
import { DAILY_GOAL } from "../streak";

const STATUS_STYLE: Record<CharStatus, string> = {
  untested:   "bg-stone-100 text-stone-400 border-stone-200",
  developing: "bg-amber-100 text-amber-800 border-amber-200",
  weak:       "bg-rose-100 text-rose-700 border-rose-300",
  mastered:   "bg-emerald-100 text-emerald-700 border-emerald-300",
};

interface Props {
  progress: ProgressItems;
  streak: StreakData;
  dailyProgress: DailyProgress;
  masteredTotal: number;
  today: string;
  setView: (v: ViewName) => void;
}

export default function StatsView({ progress, streak, dailyProgress, masteredTotal, today, setView }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "'Shippori Mincho', serif" }}>Tu progreso</h2>
        <button onClick={() => setView("home")} className="text-sm text-indigo-700 flex items-center gap-1">
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>
      <p className="text-stone-500 text-sm mb-4">{masteredTotal}/{ALL_CHARS.length} dominados (3+ intentos, ≥85% acierto)</p>
      <p className="text-stone-500 text-sm mb-4">
        Racha actual: {streak.current} día{streak.current === 1 ? "" : "s"} · Récord: {streak.longest} ·
        Hoy: {Math.min(dailyProgress.date === today ? dailyProgress.correctToday : 0, DAILY_GOAL)}/{DAILY_GOAL} aciertos
      </p>

      {/* Basic rows */}
      <div className="text-sm font-semibold text-stone-600 mb-2">Hiragana básico</div>
      {ROWS.map((row) => (
        <div key={row.id} className="mb-4">
          <div className="text-xs font-medium text-stone-500 mb-1">{row.title}</div>
          <div className="flex flex-wrap gap-1.5">
            {row.chars.map((ch) => {
              const status = charStatus(progress, ch.kana);
              return (
                <div key={ch.kana} className={`w-12 h-14 rounded-lg border flex flex-col items-center justify-center ${STATUS_STYLE[status]}`}>
                  <span className="text-lg" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{ch.kana}</span>
                  <span className="text-[10px]">{ch.romaji}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Dakuten / Handakuten rows */}
      <div className="text-sm font-semibold text-stone-600 mt-2 mb-2">Dakuten y Handakuten</div>
      {DAKUTEN_ROWS.map((row) => (
        <div key={row.id} className="mb-4">
          <div className="text-xs font-medium text-stone-500 mb-1">{row.title}</div>
          <div className="flex flex-wrap gap-1.5">
            {row.chars.map((ch) => {
              const status = charStatus(progress, ch.kana);
              return (
                <div key={ch.kana} className={`w-12 h-14 rounded-lg border flex flex-col items-center justify-center ${STATUS_STYLE[status]}`}>
                  <span className="text-lg" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{ch.kana}</span>
                  <span className="text-[10px]">{ch.romaji}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Compound (拗音) rows */}
      <div className="text-sm font-semibold text-stone-600 mt-2 mb-2">Combinaciones (拗音)</div>
      {COMPOUND_ROWS.map((row) => (
        <div key={row.id} className="mb-4">
          <div className="text-xs font-medium text-stone-500 mb-1">{row.title}</div>
          <div className="flex flex-wrap gap-1.5">
            {row.chars.map((ch) => {
              const status = charStatus(progress, ch.kana);
              return (
                <div key={ch.kana} className={`w-12 h-14 rounded-lg border flex flex-col items-center justify-center ${STATUS_STYLE[status]}`}>
                  <span className="text-lg" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{ch.kana}</span>
                  <span className="text-[10px]">{ch.romaji}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
