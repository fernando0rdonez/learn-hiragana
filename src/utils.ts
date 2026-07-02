import type { CharWithRow, ProgressItems, SessionMode, QueueItem, CharStatus, QuizMode } from "./types";
import { buildSessionQueue } from "./leitner";
import { getConfusablePairs } from "./confusedPairs";
import { ALL_CHARS } from "./data";
import { WORDS } from "./words";

export function toISODate(d: Date = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Builds a session queue for the given mode.
 * "both" interleaves recognition + production items shuffled together.
 */
export function buildQueueItems(
  pool: CharWithRow[],
  mode: SessionMode,
  length: number,
  items: ProgressItems,
  today: string,
): QueueItem[] {
  if (mode === "both") {
    const half = Math.ceil(length / 2);
    const rec  = buildSessionQueue(pool, items, "recognition", half, today).map((c): QueueItem => ({ char: c, mode: "recognition" }));
    const prod = buildSessionQueue(pool, items, "production",  half, today).map((c): QueueItem => ({ char: c, mode: "production" }));
    const combined = [...rec, ...prod];
    shuffleInPlace(combined);
    return combined.slice(0, length);
  }
  return buildSessionQueue(pool, items, mode, length, today).map((c): QueueItem => ({ char: c, mode }));
}

/**
 * Picks 4 answer choices for a production question:
 *   - 1 correct kana
 *   - ≥1 distractor from the confused-pairs list (when available in pool or ALL_CHARS)
 *   - remaining slots filled from pool, falling back to ALL_CHARS
 */
export function getChoices(kana: string, pool: CharWithRow[]): CharWithRow[] {
  const correct = ALL_CHARS.find((c) => c.kana === kana)!;
  const confusedKanas = getConfusablePairs(kana);

  // Confused distractors — prefer pool, fallback to ALL_CHARS
  const confusedChoices = confusedKanas
    .map((k) => pool.find((c) => c.kana === k) ?? ALL_CHARS.find((c) => c.kana === k))
    .filter((c): c is CharWithRow => !!c);
  shuffleInPlace(confusedChoices);

  // Other candidates: deduplicated, not the correct kana, not confused
  const excluded = new Set([kana, ...confusedKanas]);
  const others: CharWithRow[] = [];
  for (const c of [...pool, ...ALL_CHARS]) {
    if (!excluded.has(c.kana)) {
      excluded.add(c.kana);
      others.push(c);
    }
  }
  shuffleInPlace(others);

  const distractors: CharWithRow[] = [];
  if (confusedChoices.length > 0) distractors.push(confusedChoices[0]);
  for (const c of others) {
    if (distractors.length >= 3) break;
    distractors.push(c);
  }

  const result = [correct, ...distractors.slice(0, 3)];
  shuffleInPlace(result);
  return result;
}

export function findQueueChar(kana: string, mode: QuizMode): CharWithRow | undefined {
  if (mode === "word") {
    const w = WORDS.find((entry) => entry.kana === kana);
    return w ? { kana: w.kana, romaji: w.romaji, row: "word" } : undefined;
  }
  return ALL_CHARS.find((c) => c.kana === kana);
}

export function charStatus(items: ProgressItems, kana: string): CharStatus {
  const p = items[`recognition:${kana}`];
  if (!p || p.attempts === 0) return "untested";
  const acc = p.correct / p.attempts;
  if (p.attempts >= 3 && acc >= 0.85) return "mastered";
  if (acc < 0.5) return "weak";
  return "developing";
}
