import type { CharWithRow, ProgressItems, SessionMode, QueueItem, CharStatus, QuizMode, VocabPracticeMode, VocabSessionLength } from "./types";
import { buildSessionQueue } from "./leitner";
import { CONFUSED_PAIRS, getConfusablePairs } from "./confusedPairs";
import { ALL_ROW_GROUPS, ALL_CHARS } from "./data";
import { KATAKANA_ALL_CHARS, isKatakanaRow } from "./dataKatakana";
import { KATAKANA_CONFUSED_PAIRS } from "./confusedPairsKatakana";
import { WORDS } from "./words";
import { KATAKANA_WORDS } from "./wordsKatakana";
import { VOCABULARY, type VocabWord } from "./vocabulary";
import { PHRASES, type Phrase } from "./phrases";

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
  const kata     = pool[0] ? isKatakanaRow(pool[0].row) : false;
  const universe = kata ? KATAKANA_ALL_CHARS : ALL_CHARS;
  const pairs    = kata ? KATAKANA_CONFUSED_PAIRS : CONFUSED_PAIRS;

  const correct = universe.find((c) => c.kana === kana)!;
  const confusedKanas = getConfusablePairs(kana, pairs);

  // Confused distractors — prefer pool, fallback to the same-charset universe
  const confusedChoices = confusedKanas
    .map((k) => pool.find((c) => c.kana === k) ?? universe.find((c) => c.kana === k))
    .filter((c): c is CharWithRow => !!c);
  shuffleInPlace(confusedChoices);

  // Other candidates: deduplicated, not the correct kana, not confused
  const excluded = new Set([kana, ...confusedKanas]);
  const others: CharWithRow[] = [];
  for (const c of [...pool, ...universe]) {
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
    const w = WORDS.find((entry) => entry.kana === kana) ?? KATAKANA_WORDS.find((entry) => entry.kana === kana);
    return w ? { kana: w.kana, romaji: w.romaji, row: "word" } : undefined;
  }
  return ALL_CHARS.find((c) => c.kana === kana) ?? KATAKANA_ALL_CHARS.find((c) => c.kana === kana);
}

export function charStatus(items: ProgressItems, kana: string): CharStatus {
  const p = items[`recognition:${kana}`];
  if (!p || p.attempts === 0) return "untested";
  const acc = p.correct / p.attempts;
  if (p.attempts >= 3 && acc >= 0.85) return "mastered";
  if (acc < 0.5) return "weak";
  return "developing";
}

const VOCAB_MODES: VocabPracticeMode[] = ["spell", "meaning", "listening", "counting"];

export function vocabProgressKey(mode: VocabPracticeMode, hiragana: string): string {
  return `${mode}:${hiragana}`;
}

/**
 * Same thresholds as charStatus, summed across all VOCAB_MODES that have
 * data. Only "spell" is implemented today ("meaning"/"listening" are
 * unwritten), so this naturally reduces to spell-only for now and picks up
 * the other modes automatically once they exist.
 */
export function vocabStatus(items: ProgressItems, hiragana: string): CharStatus {
  let attempts = 0, correct = 0;
  for (const mode of VOCAB_MODES) {
    const p = items[vocabProgressKey(mode, hiragana)];
    if (p && p.attempts > 0) {
      attempts += p.attempts;
      correct += p.correct;
    }
  }
  if (attempts === 0) return "untested";
  const acc = correct / attempts;
  if (attempts >= 3 && acc >= 0.85) return "mastered";
  if (acc < 0.5) return "weak";
  return "developing";
}

// NOTE: a handful of hiragana strings repeat across categories (e.g. "はな"
// = "flor" in naturaleza and "nariz" in cuerpo). Progress is keyed by
// hiragana alone, so those words share one progress record and will show
// coupled mastery stats — a known, pre-existing data-shape limitation, not
// a bug in the stats below.

/** Per-category mastery aggregate for the vocab category picker cards. */
export function vocabCategoryStats(progress: ProgressItems, categoryId: string): { total: number; mastered: number } {
  const words = VOCABULARY.filter((w) => w.category === categoryId);
  const mastered = words.filter((w) => vocabStatus(progress, w.hiragana) === "mastered").length;
  return { total: words.length, mastered };
}

export function notMasteredVocab(progress: ProgressItems, words: VocabWord[]): VocabWord[] {
  return words.filter((w) => vocabStatus(progress, w.hiragana) !== "mastered");
}

/** Resolves a chosen session length into the actual word pool + count to play. */
export function resolveVocabSession(
  words: VocabWord[],
  length: VocabSessionLength,
  progress: ProgressItems
): { pool: VocabWord[]; limit: number } {
  if (length === "repasar") {
    const pool = notMasteredVocab(progress, words);
    return { pool, limit: pool.length };
  }
  if (length === "all") return { pool: words, limit: words.length };
  return { pool: words, limit: Math.min(length, words.length) };
}

export type PhrasePracticeMode = "phrase-meaning" | "phrase-listening";

const PHRASE_MODES: PhrasePracticeMode[] = ["phrase-meaning", "phrase-listening"];

export function phraseProgressKey(mode: PhrasePracticeMode, id: string): string {
  return `${mode}:${id}`;
}

/** Same thresholds as vocabStatus, summed across both phrase modes. */
export function phraseStatus(items: ProgressItems, id: string): CharStatus {
  let attempts = 0, correct = 0;
  for (const mode of PHRASE_MODES) {
    const p = items[phraseProgressKey(mode, id)];
    if (p && p.attempts > 0) {
      attempts += p.attempts;
      correct += p.correct;
    }
  }
  if (attempts === 0) return "untested";
  const acc = correct / attempts;
  if (attempts >= 3 && acc >= 0.85) return "mastered";
  if (acc < 0.5) return "weak";
  return "developing";
}

/** Per-category mastery aggregate for the phrase category picker cards. */
export function phraseCategoryStats(progress: ProgressItems, categoryId: string): { total: number; mastered: number } {
  const phrases = PHRASES.filter((p) => p.category === categoryId);
  const mastered = phrases.filter((p) => phraseStatus(progress, p.id) === "mastered").length;
  return { total: phrases.length, mastered };
}

export function notMasteredPhrases(progress: ProgressItems, phrases: Phrase[]): Phrase[] {
  return phrases.filter((p) => phraseStatus(progress, p.id) !== "mastered");
}

/** Resolves a chosen session length into the actual phrase pool + count to play. */
export function resolvePhraseSession(
  phrases: Phrase[],
  length: VocabSessionLength,
  progress: ProgressItems
): { pool: Phrase[]; limit: number } {
  if (length === "repasar") {
    const pool = notMasteredPhrases(progress, phrases);
    return { pool, limit: pool.length };
  }
  if (length === "all") return { pool: phrases, limit: phrases.length };
  return { pool: phrases, limit: Math.min(length, phrases.length) };
}

export function rowStats(progress: ProgressItems, rowId: string, rowGroups: typeof ALL_ROW_GROUPS = ALL_ROW_GROUPS) {
  const chars = rowGroups.find((r) => r.id === rowId)?.chars ?? [];
  let attempts = 0, correct = 0, tested = 0;
  chars.forEach((ch) => {
    const p = progress[`recognition:${ch.kana}`];
    if (p && p.attempts > 0) { tested++; attempts += p.attempts; correct += p.correct; }
  });
  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : null;
  const mastered  = chars.every((ch) => charStatus(progress, ch.kana) === "mastered");
  return { accuracy, tested, total: chars.length, mastered };
}
