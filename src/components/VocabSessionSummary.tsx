import { Trophy } from "lucide-react";
import { summaryMascot } from "../mascot";

// Subconjunto estructural de VocabWord — permite que juegos que no usan
// vocabulario (p. ej. el módulo Números) reutilicen este resumen.
export interface SummaryWord {
  hiragana: string;
  romaji: string;
  meaning: string;
}

export interface SessionResult {
  word: SummaryWord;
  correct: boolean;
}

interface Props {
  sessionResults: SessionResult[];
  onBack: () => void;
  /** Nota opcional bajo el porcentaje, p. ej. el conteo de reproducciones de audio de la sesión. */
  footer?: string;
  /** Reto en curso (Fase D) — botón extra para ir al resultado del reto. */
  onViewCompetitionResult?: () => void;
}

export default function VocabSessionSummary({ sessionResults, onBack, footer, onViewCompetitionResult }: Props) {
  const missed = sessionResults.filter((r) => !r.correct);
  const answered = sessionResults.length;
  const correctCount = answered - missed.length;
  const pct = answered > 0 ? Math.round((correctCount / answered) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-6 pt-8">
      {answered > 0 && (
        <img
          src={summaryMascot(pct)}
          alt=""
          className="w-24 h-24 object-contain"
        />
      )}
      <h2
        className="text-2xl font-bold text-stone-800"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        Sesión completa
      </h2>
      {answered > 0 ? (
        <div className="w-full max-w-xs rounded-xl bg-white border border-[#E0D8F8] p-5 text-center">
          <span className="text-5xl font-bold text-[#7B4FD4]">{pct}%</span>
          <p className="text-stone-500 text-sm mt-1">{correctCount} de {answered} correctas</p>
          {footer && <p className="text-stone-400 text-xs mt-2">{footer}</p>}
        </div>
      ) : (
        <p className="text-stone-500 text-sm">No hay palabras disponibles.</p>
      )}
      {missed.length > 0 && (
        <div className="w-full max-w-xs">
          <p className="text-xs font-medium text-stone-600 mb-2">Palabras falladas:</p>
          <ul className="space-y-1">
            {missed.map((r, i) => (
              <li key={i} className="flex items-center justify-between text-sm text-stone-600">
                <span style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{r.word.hiragana}</span>
                <span className="text-stone-400">{r.word.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-2 mt-4 w-full max-w-xs">
        {onViewCompetitionResult && (
          <button
            onClick={onViewCompetitionResult}
            className="px-8 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(90deg, #7B4FD4, #5533A8)" }}
          >
            <Trophy size={16} /> Ver resultado del reto
          </button>
        )}
        <button
          onClick={onBack}
          className="px-8 py-3 rounded-xl font-semibold"
          style={onViewCompetitionResult
            ? { color: "#5533A8", backgroundColor: "#fff", border: "1.5px solid #E0D8F8" }
            : { color: "#fff", background: "linear-gradient(90deg, #7B4FD4, #5533A8)" }}
        >
          Volver
        </button>
      </div>
    </div>
  );
}
