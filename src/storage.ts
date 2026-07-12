import type { ProgressData, ProgressItems, ItemProgress } from "./types";
import { WORDS } from "./words";
import { VOCABULARY } from "./vocabulary";

const STORAGE_KEY = "hiragana-progress";
export const CURRENT_SCHEMA_VERSION = 2;

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

function isItemProgress(v: unknown): v is ItemProgress {
  if (!v || typeof v !== "object") return false;
  const item = v as Record<string, unknown>;
  return typeof item.box === "number" && typeof item.nextDue === "string"
    && typeof item.attempts === "number" && typeof item.correct === "number";
}

/**
 * Valida y migra un ProgressData ya parseado (de un archivo importado o de una
 * fila de Supabase). Punto único de verdad para "¿esto tiene forma de progreso
 * válido?", usado tanto por parseImportedProgress como por el pull de sync.
 */
export function validateProgressData(parsed: unknown, source: "archivo" | "datos"): ProgressData {
  const items = (parsed as ProgressData | null)?.items;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)
      || !items || typeof items !== "object" || Array.isArray(items)) {
    throw new Error(`El ${source} no tiene la estructura esperada (falta "items").`);
  }
  for (const [key, item] of Object.entries(items)) {
    if (!isItemProgress(item)) {
      throw new Error(`El elemento "${key}" del ${source} tiene un formato inválido.`);
    }
  }

  const data = parsed as ProgressData;
  const version = data.schemaVersion ?? 1;
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new Error(`Este ${source} se guardó con una versión más nueva de la app. Actualiza la app para poder usarlo.`);
  }
  if (version < CURRENT_SCHEMA_VERSION) {
    return { ...data, items: migrateWordToSpellKeys(data.items), schemaVersion: CURRENT_SCHEMA_VERSION };
  }
  return { ...data, schemaVersion: CURRENT_SCHEMA_VERSION };
}

export function parseImportedProgress(raw: string): ProgressData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("El archivo no es un JSON válido.");
  }
  return validateProgressData(parsed, "archivo");
}
