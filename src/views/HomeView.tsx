import { BarChart3, Trash2, ChevronRight, Flame } from "lucide-react";
import type { StreakData } from "../types";
import type { ViewName } from "../data";
import { ALL_CHARS } from "../data";
import { VOCABULARY, VOCAB_CATEGORIES } from "../vocabulary";

interface Props {
  streak: StreakData;
  masteredTotal: number;
  saveError: boolean;
  resetConfirm: boolean;
  setResetConfirm: (v: boolean) => void;
  resetProgress: () => void;
  setView: (v: ViewName) => void;
}

export default function HomeView({ streak, masteredTotal, saveError, resetConfirm, setResetConfirm, resetProgress, setView }: Props) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Shippori Mincho', serif" }}>
        ひらがな trainer
      </h1>
      {streak.current > 0 && (
        <p className="text-stone-500 text-sm mt-1 flex items-center gap-1">
          <Flame size={14} className="text-orange-500" />
          Racha de {streak.current} día{streak.current === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {/* Hiragana card */}
        <button
          onClick={() => setView("hiraganaSetup")}
          className="w-full text-left rounded-2xl border-2 border-stone-200 bg-white p-5 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl shrink-0" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>あ</span>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-semibold text-stone-800">Hiragana</div>
              <div className="text-sm text-stone-500 mt-0.5">{masteredTotal}/{ALL_CHARS.length} caracteres dominados</div>
              <div className="w-full h-1.5 bg-stone-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-indigo-700 rounded-full transition-all" style={{ width: `${(masteredTotal / ALL_CHARS.length) * 100}%` }} />
              </div>
            </div>
            <ChevronRight size={18} className="text-stone-400 shrink-0" />
          </div>
        </button>

        {/* Vocabulario card */}
        <button
          onClick={() => setView("vocabCategory")}
          className="w-full text-left rounded-2xl border-2 border-stone-200 bg-white p-5 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl shrink-0">🎴</span>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-semibold text-stone-800">Vocabulario</div>
              <div className="text-sm text-stone-500 mt-0.5">{VOCABULARY.length} palabras · {VOCAB_CATEGORIES.length} categorías</div>
            </div>
            <ChevronRight size={18} className="text-stone-400 shrink-0" />
          </div>
        </button>

        {/* Fonética card */}
        <button
          onClick={() => setView("phoneticSetup")}
          className="w-full text-left rounded-2xl border-2 border-stone-200 bg-white p-5 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl shrink-0">🎤</span>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-semibold text-stone-800">Fonética</div>
              <div className="text-sm text-stone-500 mt-0.5">Practica cómo suenan realmente las palabras</div>
            </div>
            <ChevronRight size={18} className="text-stone-400 shrink-0" />
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between mt-8">
        <button onClick={() => setView("stats")} className="text-sm text-stone-500 flex items-center gap-1 hover:text-stone-700">
          <BarChart3 size={14} /> Ver estadísticas
        </button>
        {!resetConfirm ? (
          <button onClick={() => setResetConfirm(true)} className="text-xs text-stone-400 hover:text-rose-600 flex items-center gap-1">
            <Trash2 size={12} /> Borrar progreso
          </button>
        ) : (
          <button onClick={resetProgress} className="text-xs text-rose-600 font-medium">
            ¿Seguro? Confirmar borrado
          </button>
        )}
      </div>

      {saveError && (
        <p className="text-xs text-rose-600 mt-3">No se pudo guardar el progreso. Tus respuestas de esta sesión podrían no persistir.</p>
      )}
    </div>
  );
}
