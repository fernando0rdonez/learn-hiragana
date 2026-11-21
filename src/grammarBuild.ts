// Ejercicio «Armar sílaba por sílaba» (Fase 2 de docs/GRAMATICA_PLAN.md).
//
// El usuario forma la oración tocando fichas de sílabas (moras), sin teclado
// japonés. Este módulo es lógica pura (sin React) para poder testearla:
//   - splitMora: corta una palabra en moras (きょ y しゃ son UNA ficha; っ, ん y ー van solas).
//   - makePuzzle: arma las casillas por palabra y el banco de fichas con sílabas extra.
//   - isBuildCorrect / wrongSlots: comprueban la respuesta.

import type { GrammarOrderExercise } from "./grammar";
import { CONFUSED_PAIRS, getConfusablePairs } from "./confusedPairs";
import { KATAKANA_CONFUSED_PAIRS } from "./confusedPairsKatakana";

export interface GrammarBuildExercise {
  type: "build" | "dictation"; // "dictation" (Fase 3): se escucha la frase en vez de leer la traducción
  tokens: string[];        // palabras de la oración en el orden canónico
  accept?: string[][];     // otros órdenes válidos (mismo significado)
  translation: string;
  alt?: string[];          // partículas alternativas válidas en la oración (nunca salen como extra)
  sid?: number;
}

export function toBuildExercise(ex: GrammarOrderExercise, alt?: string[], type: GrammarBuildExercise["type"] = "build"): GrammarBuildExercise {
  return {
    type,
    tokens: ex.tokens,
    translation: ex.translation,
    ...(ex.accept ? { accept: ex.accept } : {}),
    ...(alt?.length ? { alt } : {}),
    ...(ex.sid !== undefined ? { sid: ex.sid } : {}),
  };
}

// ── Moras ────────────────────────────────────────────────────────────────────

const SMALL_KANA = new Set([..."ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ"]);

/** Corta una palabra en moras: しゃしん → [しゃ, し, ん]; がっこう → [が, っ, こ, う]. */
export function splitMora(word: string): string[] {
  const out: string[] = [];
  for (const ch of word) {
    if (SMALL_KANA.has(ch) && out.length > 0) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

// ── Niveles ──────────────────────────────────────────────────────────────────

export type BuildLevel = "facil" | "normal" | "dificil";

export const BUILD_LEVELS: Record<BuildLevel, { label: string; extras: number; boundaries: boolean; hint: string }> = {
  facil:   { label: "Fácil",   extras: 3,  boundaries: true,  hint: "Casillas por palabra y 3 sílabas extra" },
  normal:  { label: "Normal",  extras: 6,  boundaries: true,  hint: "Casillas por palabra y 6 sílabas extra" },
  dificil: { label: "Difícil", extras: 10, boundaries: false, hint: "Sin separar palabras y 10 sílabas extra" },
};

// ── Sílabas extra ────────────────────────────────────────────────────────────

/** Errores de ortografía típicos de las partículas: は se lee «wa», を «o», へ «e». */
const SPELLING_TRAPS: Record<string, string> = { "は": "わ", "を": "お", "へ": "え" };

/** Trozos que convierten una conjugación en otra (ます ⇄ ません ⇄ ました ⇄ ませんでした, たい). */
const CONJUGATION_PIECES = ["せ", "ん", "し", "た", "で", "ま"];

/** Relleno si faltan extras: kana frecuentes que no son partículas por sí solas. */
const FALLBACK_KANA = [..."あいうえおかきくけこさしすせそたちつてなぬねのまみむめもやゆよらりるれろ"];

const CONJUGATED = /(ます|ません|ました|ませんでした|たい)$/;

type Rng = () => number;

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Fichas que NUNCA deben salir como extra (sílabas o palabras) porque permitirían
 * formar otra oración válida —con el mismo sentido— que el ejercicio marcaría como
 * error: las partículas alternativas de la oración (`alt`), に ⇄ へ con verbos de
 * movimiento, に ⇄ と (はなします), は ⇄ が ⇄ も en el tema/sujeto y を ⇄ は (contraste).
 */
export function forbiddenSwaps(tokens: string[], alt: string[] = []): Set<string> {
  const f = new Set(alt);
  const has = (t: string) => tokens.includes(t);
  if (has("へ")) f.add("に");                         // がっこうへ / がっこうに いきます
  if (has("に")) { f.add("へ"); f.add("と"); }        // ははに / ははと はなしました
  if (has("と")) f.add("に");
  if (has("は")) { f.add("が"); f.add("も"); }        // わたしは / わたしが / わたしも
  if (has("が")) { f.add("は"); f.add("も"); }
  if (has("も")) { f.add("は"); f.add("が"); }
  if (has("を")) f.add("は");                         // パンを / パンは たべます (contraste)
  return f;
}

function forbiddenExtras(ex: GrammarBuildExercise): Set<string> {
  return forbiddenSwaps(ex.tokens, ex.alt);
}

/** Elige `count` sílabas extra para la oración, por prioridad y sin repetir. */
export function buildExtras(ex: GrammarBuildExercise, count: number, rng: Rng = Math.random): string[] {
  const moras = ex.tokens.flatMap(splitMora);
  const present = new Set(moras);
  const forbidden = forbiddenExtras(ex);
  const chosen: string[] = [];
  const add = (m: string, allowPresent = false) => {
    if (chosen.length >= count || (present.has(m) && !allowPresent) || forbidden.has(m) || chosen.includes(m)) return;
    chosen.push(m);
  };

  // 1. Trampas de ortografía de las partículas (siempre primero: es lo que más se equivoca).
  //    Van aunque la sílaba ya esté en la oración: わたし は… con una わ de más es justo la trampa.
  for (const t of ex.tokens) if (SPELLING_TRAPS[t]) add(SPELLING_TRAPS[t], true);

  // 2. Kana que se confunden a la vista + trozos de conjugación, mezclados.
  const confusables = moras.flatMap((m) => [
    ...getConfusablePairs(m, CONFUSED_PAIRS),
    ...getConfusablePairs(m, KATAKANA_CONFUSED_PAIRS),
  ]);
  const conj = ex.tokens.some((t) => CONJUGATED.test(t)) ? CONJUGATION_PIECES : [];
  for (const m of shuffle([...new Set([...confusables, ...conj])], rng)) add(m);

  // 3. Relleno.
  for (const m of shuffle(FALLBACK_KANA, rng)) add(m);
  return chosen;
}

// ── Puzzle ───────────────────────────────────────────────────────────────────

export interface BuildTile {
  id: number;
  mora: string;
}

export interface BuildPuzzle {
  /** Moras de cada palabra en el orden canónico (define las casillas). */
  words: string[][];
  /** Todas las moras en orden, aplanadas: la respuesta canónica casilla por casilla. */
  target: string[];
  /** Banco barajado: las moras de la oración + las extra. */
  tiles: BuildTile[];
}

export function makePuzzle(ex: GrammarBuildExercise, level: BuildLevel, rng: Rng = Math.random): BuildPuzzle {
  const words = ex.tokens.map(splitMora);
  const target = words.flat();
  const extras = buildExtras(ex, BUILD_LEVELS[level].extras, rng);
  const tiles = shuffle([...target, ...extras], rng).map((mora, id) => ({ id, mora }));
  return { words, target, tiles };
}

/** Correcta si coincide con el orden canónico o con cualquier otro orden válido. */
export function isBuildCorrect(filled: string[], ex: GrammarBuildExercise): boolean {
  const built = filled.join("");
  return [ex.tokens, ...(ex.accept ?? [])].some((order) => order.join("") === built);
}

/** Casillas que no coinciden con la respuesta canónica (para marcarlas en rojo). */
export function wrongSlots(filled: (string | null)[], target: string[]): boolean[] {
  return target.map((m, i) => filled[i] !== m);
}
