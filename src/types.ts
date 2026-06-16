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
