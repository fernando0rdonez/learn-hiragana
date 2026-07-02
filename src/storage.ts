import type { ProgressData, ProgressItems } from "./types";
import { WORDS } from "./words";
import { VOCABULARY } from "./vocabulary";

const STORAGE_KEY = "hiragana-progress";
const CURRENT_SCHEMA_VERSION = 2;

const WORD_KANA = new Set(WORDS.map((w) => w.kana));
const VOCAB_KANA = new Set(VOCABULARY.map((w) => w.hiragana));

/**
 * Pre-v2, Vocabulario's "spell the word" game and Hiragana's word-reading
 * quiz both wrote progress under the same `word:${kana}` key. 33 hiragana
 * strings exist in both WORDS and VOCABULARY, so for those the key is
 * ambiguous — left untouched (Vocabulario's spell progress for those words
 * starts fresh) rather than duplicated or guessed at, to avoid fabricating
 * accuracy from a different feature's attempts.
 */
function migrateWordToSpellKeys(items: ProgressItems): ProgressItems {
  const next: ProgressItems = { ...items };
  for (const key of Object.keys(items)) {
    if (!key.startsWith("word:")) continue;
    const hiragana = key.slice("word:".length);
    if (VOCAB_KANA.has(hiragana) && !WORD_KANA.has(hiragana)) {
      next[`spell:${hiragana}`] = next[key];
      delete next[key];
    }
  }
  return next;
}

export function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProgressData;
      if (parsed && typeof parsed.items === "object") {
        if ((parsed.schemaVersion ?? 1) < CURRENT_SCHEMA_VERSION) {
          const migrated: ProgressData = {
            ...parsed,
            items: migrateWordToSpellKeys(parsed.items),
            schemaVersion: CURRENT_SCHEMA_VERSION,
          };
          saveProgress(migrated);
          return migrated;
        }
        return parsed;
      }
    }
  } catch {
    // localStorage unavailable or data corrupted — start fresh
  }
  return { items: {}, schemaVersion: CURRENT_SCHEMA_VERSION };
}

export function saveProgress(data: ProgressData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    // private mode or quota exceeded
    return false;
  }
}
