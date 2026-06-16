// ── Character data ─────────────────────────────────────────────────────────

export interface CharData {
  kana: string;
  romaji: string;
  accept?: string[];
}

export interface CharWithRow extends CharData {
  row: string;
}

// ── Progress ───────────────────────────────────────────────────────────────

export type ItemMode = "recognition" | "production" | "word";

export interface ItemProgress {
  box: number;
  nextDue: string; // "YYYY-MM-DD"
  attempts: number;
  correct: number;
}

export type ProgressItems = Record<string, ItemProgress>;

export interface ProgressData {
  items: ProgressItems;
}

export type CharStatus = "untested" | "developing" | "weak" | "mastered";

// ── Session ────────────────────────────────────────────────────────────────

export type SessionMode = "recognition" | "production" | "both";

export type QuizMode = "recognition" | "production" | "word";

export interface QueueItem {
  char: CharWithRow;
  mode: QuizMode;
}
