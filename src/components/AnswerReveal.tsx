import type { ReactNode } from "react";

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
}

const CORRECT_ACCENT: AnswerRevealAccent = { text: "#0A6E54", bg: "#E9F7F1" };
const DEFAULT_WRONG_ACCENT: AnswerRevealAccent = { text: "#C03A1E", bg: "#FDEDEA" };

const STATUS_LABEL: Record<AnswerStatus, string> = {
  correct: "✅ ¡Correcto!",
  wrong: "❌ Era",
  timeout: "⏱️ ¡Se acabó el tiempo! Era",
};

/** Tamaño de fuente de la palabra/frase principal, más chico cuanto más larga (frases). */
function mainWordSize(word: string): string {
  const len = [...word].length;
  if (len <= 4) return "2rem";
  if (len <= 8) return "1.5rem";
  if (len <= 14) return "1.15rem";
  return "1rem";
}

export default function AnswerReveal({ status, kana, kanji, meaning, romaji, extra, accent }: Props) {
  const { text, bg } = status === "correct" ? CORRECT_ACCENT : (accent ?? DEFAULT_WRONG_ACCENT);
  const mainWord = kanji ?? kana;

  return (
    <div
      className="w-full rounded-2xl px-4 py-3 flex flex-col items-center gap-1 text-center"
      style={{ backgroundColor: bg }}
    >
      <p className="font-semibold text-sm" style={{ color: text }}>{STATUS_LABEL[status]}</p>
      {kanji && (
        <span className="text-xs" style={{ color: "#8B7FA8" }}>{kana}</span>
      )}
      <span
        className="font-bold leading-snug break-words max-w-full"
        style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#1A1A2E", fontSize: mainWordSize(mainWord) }}
      >
        {mainWord}
      </span>
      <span className="text-sm font-medium" style={{ color: "#8B7FA8" }}>
        {romaji ? `${romaji} · ` : ""}{meaning}
      </span>
      {extra}
    </div>
  );
}
