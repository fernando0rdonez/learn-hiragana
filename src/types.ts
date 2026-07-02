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

export type VocabPracticeMode = "spell" | "meaning" | "listening";

export type ItemMode = "recognition" | "production" | "word" | "phonetics" | VocabPracticeMode;

export interface ItemProgress {
  box: number;
  nextDue: string; // "YYYY-MM-DD"
  attempts: number;
  correct: number;
}

export type ProgressItems = Record<string, ItemProgress>;

export interface StreakData {
  current: number;
  longest: number;
  lastSuccessDate: string; // "" si nunca se cumplió un día
}

export interface DailyProgress {
  date: string; // "" si nunca hubo progreso; "YYYY-MM-DD"
  correctToday: number;
}

export interface ProgressData {
  items: ProgressItems;
  streak?: StreakData;
  dailyProgress?: DailyProgress;
  settings?: { showRomaji: boolean };
  schemaVersion?: number;
}

export type CharStatus = "untested" | "developing" | "weak" | "mastered";

// ── Session ────────────────────────────────────────────────────────────────

export type SessionMode = "recognition" | "production" | "both";

export type QuizMode = "recognition" | "production" | "word";

export interface QueueItem {
  char: CharWithRow;
  mode: QuizMode;
}

export interface Feedback {
  status: "correct" | "wrong";
  expected: string;
}

export interface MissedItem {
  kana: string;
  mode: QuizMode;
  given: string;    // recognition/word: typed romaji · production: selected kana
  expected: string; // recognition/word: correct romaji · production: correct kana
}
