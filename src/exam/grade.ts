import type { ExamQuestion, ExamTopic } from "./examBank";
import { EXAM_TOPICS } from "./examBank";

/** Porcentaje mínimo (0–1) para aprobar el Examen del curso. */
export const PASS_THRESHOLD = 0.85;

/**
 * Normaliza una respuesta escrita para comparar: NFKC, minúsculas, sin espacios
 * ni signos de puntuación y sin tildes combinadas (á → a, ē → e). Mantiene los
 * kana intactos. Mismo espíritu que `normalizeReading` de DateTimeWriteGame.
 */
export function normalizeAnswer(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tildes latinas combinantes (á→a, ē→e); no toca ゙゚ de los kana
    .normalize("NFC")               // recompone が, ぱ… tras el paso NFD
    .replace(/[\s。、，！？!?¡¿.,·・_/\\\-–—−ー]/g, "")
    .trim();
}

export interface QuestionGrade {
  correct: boolean;
  /** Respuesta canónica, para el informe. */
  expected: string;
}

export function gradeQuestion(q: ExamQuestion, given: string | string[]): QuestionGrade {
  if (q.kind === "tokens") {
    const expected = (q.tokens ?? []).join(" ");
    const g = Array.isArray(given) ? given : [];
    const correct =
      g.length === (q.tokens ?? []).length &&
      g.every((t, i) => t === q.tokens![i]);
    return { correct, expected };
  }
  const typed = typeof given === "string" ? normalizeAnswer(given) : "";
  const pool = [q.answer, ...(q.accepted ?? [])].map(normalizeAnswer);
  return { correct: typed.length > 0 && pool.includes(typed), expected: q.answer };
}

export interface TopicScore {
  correct: number;
  total: number;
  pct: number; // 0–100
}

export interface ExamResult {
  overall: { correct: number; total: number; pct: number; passed: boolean };
  byTopic: Record<ExamTopic, TopicScore>;
  wrong: { question: ExamQuestion; given: string | string[]; expected: string }[];
}

export function gradeExam(
  questions: ExamQuestion[],
  answers: Record<string, string | string[]>,
): ExamResult {
  const byTopic = {} as Record<ExamTopic, TopicScore>;
  for (const t of EXAM_TOPICS) byTopic[t] = { correct: 0, total: 0, pct: 0 };

  const wrong: ExamResult["wrong"] = [];
  let correctTotal = 0;

  for (const q of questions) {
    const given = answers[q.id] ?? "";
    const { correct, expected } = gradeQuestion(q, given);
    byTopic[q.topic].total += 1;
    if (correct) {
      byTopic[q.topic].correct += 1;
      correctTotal += 1;
    } else {
      wrong.push({ question: q, given, expected });
    }
  }

  for (const t of EXAM_TOPICS) {
    const s = byTopic[t];
    s.pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
  }

  const total = questions.length;
  const pct = total > 0 ? Math.round((correctTotal / total) * 100) : 0;
  return {
    overall: { correct: correctTotal, total, pct, passed: total > 0 && correctTotal / total >= PASS_THRESHOLD },
    byTopic,
    wrong,
  };
}
