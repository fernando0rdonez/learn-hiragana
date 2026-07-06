import type { ReactNode } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export type AnswerStatus = "correct" | "wrong" | "timeout";

export interface AnswerRevealAccent {
  text: string;
  bg: string;
}

interface Props {
  status: AnswerStatus;
  /** Lectura en kana (o la palabra/frase tal cual, si no aplica kanji). */
  kana: string;
  /** Escritura en kanji — solo si ya está enseñada en el módulo Kanji (BACKLOG #5). */
  kanji?: string;
  meaning: string;
  romaji?: string;
  /** Nota adicional: contexto de una frase, aviso de forma irregular, etc. */
  extra?: ReactNode;
  /** Color de acento para wrong/timeout — por defecto coral, ámbar en Números. */
  accent?: AnswerRevealAccent;
  /** El usuario avanza a mano — nada de auto-advance mientras esto está en pantalla. */
  onContinue: () => void;
}

const CORRECT_ACCENT: AnswerRevealAccent = { text: "#0A6E54", bg: "#E9F7F1" };
const DEFAULT_WRONG_ACCENT: AnswerRevealAccent = { text: "#C03A1E", bg: "#FDEDEA" };

const STATUS_ICON: Record<AnswerStatus, typeof CheckCircle2> = {
  correct: CheckCircle2,
  wrong: XCircle,
  timeout: Clock,
};

const STATUS_LABEL: Record<AnswerStatus, string> = {
  correct: "¡Correcto!",
  wrong: "Incorrecto",
  timeout: "¡Se acabó el tiempo!",
};

/** Tamaño de fuente de la palabra/frase principal, más chico cuanto más larga (frases). */
function mainWordSize(word: string): string {
  const len = [...word].length;
  if (len <= 4) return "2rem";
  if (len <= 8) return "1.5rem";
  if (len <= 14) return "1.15rem";
  return "1rem";
}

/**
 * Barra fija al pie de pantalla, estilo Duolingo: se queda hasta que el
 * usuario toca "Continuar" — con sesiones a contrarreloj, un auto-advance por
 * temporizador no daba tiempo a leer kanji/frases largas.
 */
export default function AnswerReveal({ status, kana, kanji, meaning, romaji, extra, accent, onContinue }: Props) {
  const { text, bg } = status === "correct" ? CORRECT_ACCENT : (accent ?? DEFAULT_WRONG_ACCENT);
  const mainWord = kanji ?? kana;
  const Icon = STATUS_ICON[status];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-xl px-5 pt-4"
        style={{ backgroundColor: bg, paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center gap-2">
          <Icon size={22} style={{ color: text }} />
          <span className="font-bold text-base" style={{ color: text }}>{STATUS_LABEL[status]}</span>
        </div>

        <div className="mt-3">
          {kanji && (
            <p className="text-xs mb-0.5" style={{ color: text, opacity: 0.75 }}>{kana}</p>
          )}
          <p
            className="font-bold leading-snug break-words"
            style={{ fontFamily: "'Noto Sans JP', sans-serif", color: text, fontSize: mainWordSize(mainWord) }}
          >
            {mainWord}
          </p>
        </div>

        <div className="my-3 border-t border-dashed" style={{ borderColor: text, opacity: 0.3 }} />

        <p className="text-sm font-medium" style={{ color: text }}>
          {romaji ? `${romaji} · ` : ""}{meaning}
        </p>
        {extra}

        <button
          onClick={onContinue}
          className="w-full mt-4 py-3.5 rounded-2xl font-bold text-white text-sm tracking-wide uppercase transition-transform active:scale-[0.98]"
          style={{ backgroundColor: text }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
