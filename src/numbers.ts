import type { ProgressItems, CharStatus } from "./types";

// ── Números clave ────────────────────────────────────────────────────────────
// Los ~29 bloques con los que se construye cualquier número: unidades 1–10,
// centenas, millares y 10000. Las 5 formas irregulares (rendaku/sokuon) llevan
// `irregular: true` y reciben trato preferente en UI y generación de ejercicios.

export interface KeyNumber {
  value: number;
  hiragana: string;
  romaji: string;
  irregular?: boolean;
}

// Lecturas de compuesto (4=よん, 7=なな, 9=きゅう): son las que se usan al
// formar números grandes, y las que entrena el modo "Números clave".
const DIGIT_KANA   = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];
const DIGIT_ROMAJI = ["", "ichi", "ni", "san", "yon", "go", "roku", "nana", "hachi", "kyuu"];

/** Centena d×100 en kana — irregulares: 300 さんびゃく, 600 ろっぴゃく, 800 はっぴゃく. */
export function hundredsKana(d: number): string {
  if (d === 1) return "ひゃく";
  if (d === 3) return "さんびゃく";
  if (d === 6) return "ろっぴゃく";
  if (d === 8) return "はっぴゃく";
  return DIGIT_KANA[d] + "ひゃく";
}

/** Millar d×1000 en kana — irregulares: 3000 さんぜん, 8000 はっせん. */
export function thousandsKana(d: number): string {
  if (d === 1) return "せん";
  if (d === 3) return "さんぜん";
  if (d === 8) return "はっせん";
  return DIGIT_KANA[d] + "せん";
}

function hundredsRomaji(d: number): string {
  if (d === 1) return "hyaku";
  if (d === 3) return "sanbyaku";
  if (d === 6) return "roppyaku";
  if (d === 8) return "happyaku";
  return DIGIT_ROMAJI[d] + "hyaku";
}

function thousandsRomaji(d: number): string {
  if (d === 1) return "sen";
  if (d === 3) return "sanzen";
  if (d === 8) return "hassen";
  return DIGIT_ROMAJI[d] + "sen";
}

const IRREGULAR_VALUES = new Set([300, 600, 800, 3000, 8000]);

export const KEY_NUMBERS: KeyNumber[] = [
  ...Array.from({ length: 10 }, (_, i) => {
    const d = i + 1;
    return d === 10
      ? { value: 10, hiragana: "じゅう", romaji: "juu" }
      : { value: d, hiragana: DIGIT_KANA[d], romaji: DIGIT_ROMAJI[d] };
  }),
  ...Array.from({ length: 9 }, (_, i) => {
    const d = i + 1;
    return { value: d * 100, hiragana: hundredsKana(d), romaji: hundredsRomaji(d), irregular: IRREGULAR_VALUES.has(d * 100) || undefined };
  }),
  ...Array.from({ length: 9 }, (_, i) => {
    const d = i + 1;
    return { value: d * 1000, hiragana: thousandsKana(d), romaji: thousandsRomaji(d), irregular: IRREGULAR_VALUES.has(d * 1000) || undefined };
  }),
  { value: 10000, hiragana: "いちまん", romaji: "ichiman" },
];

// ── Grupos para el setup (tabla de estudio) ─────────────────────────────────

export interface KeyNumberGroup {
  id: string;
  label: string;
  numbers: KeyNumber[];
}

export const KEY_NUMBER_GROUPS: KeyNumberGroup[] = [
  { id: "unidades", label: "1 – 10",        numbers: KEY_NUMBERS.filter((k) => k.value <= 10) },
  { id: "centenas", label: "100 – 900",     numbers: KEY_NUMBERS.filter((k) => k.value >= 100 && k.value <= 900) },
  { id: "millares", label: "1000 – 9000",   numbers: KEY_NUMBERS.filter((k) => k.value >= 1000 && k.value <= 9000) },
  { id: "man",      label: "10000",         numbers: KEY_NUMBERS.filter((k) => k.value === 10000) },
];

// ── Conversor número → kana ─────────────────────────────────────────────────

export interface NumberChip {
  kana: string;
  romaji: string;
  /** Números clave a los que acredita el SRS este bloque. */
  credits: number[];
}

/**
 * Descompone 1–99 999 en bloques kana (4638 → よんせん・ろっぴゃく・さんじゅう・はち),
 * cada uno con los números clave a los que acredita su acierto/fallo.
 */
export function numberToChips(n: number): NumberChip[] {
  if (!Number.isInteger(n) || n < 1 || n > 99999) {
    throw new Error(`numberToChips: fuera de rango (1–99999): ${n}`);
  }
  const chips: NumberChip[] = [];
  const man = Math.floor(n / 10000);
  const tho = Math.floor((n % 10000) / 1000);
  const hun = Math.floor((n % 1000) / 100);
  const ten = Math.floor((n % 100) / 10);
  const uni = n % 10;

  if (man > 0) {
    chips.push({
      kana: DIGIT_KANA[man] + "まん",
      romaji: DIGIT_ROMAJI[man] + "man",
      credits: man === 1 ? [10000] : [man, 10000],
    });
  }
  if (tho > 0) chips.push({ kana: thousandsKana(tho), romaji: thousandsRomaji(tho), credits: [tho * 1000] });
  if (hun > 0) chips.push({ kana: hundredsKana(hun), romaji: hundredsRomaji(hun), credits: [hun * 100] });
  if (ten > 0) {
    chips.push({
      kana: (ten === 1 ? "" : DIGIT_KANA[ten]) + "じゅう",
      romaji: (ten === 1 ? "" : DIGIT_ROMAJI[ten]) + "juu",
      credits: ten === 1 ? [10] : [ten, 10],
    });
  }
  if (uni > 0) chips.push({ kana: DIGIT_KANA[uni], romaji: DIGIT_ROMAJI[uni], credits: [uni] });
  return chips;
}

/** 4638 → "よんせんろっぴゃくさんじゅうはち". Rango 1–99 999. */
export function numberToKana(n: number): string {
  return numberToChips(n).map((c) => c.kana).join("");
}

export function numberToRomaji(n: number): string {
  return numberToChips(n).map((c) => c.romaji).join(" ");
}

// El módulo Kanji (BACKLOG #5) solo enseña 一–十: mostrar 百/千/万 en la
// revelación de respuesta no tendría ancla (i+1), así que el kanji de números
// se limita a esos 10 valores — el resto de los números (compuestos, con
// centenas/millares/万) se queda sin kanji, igual que si no hubiera match.
const DIGIT_KANJI = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

export function findNumberKanji(value: number): string | undefined {
  return value >= 1 && value <= 10 ? DIGIT_KANJI[value] : undefined;
}

// ── Distractores ─────────────────────────────────────────────────────────────
// Formas "tentadoras" incorrectas de los 5 irregulares — el error natural de
// aplicar la regla regular (さんひゃく) o el rendaku equivocado (さんぴゃく).

export const IRREGULAR_TRAPS: Record<number, string[]> = {
  300:  ["さんひゃく", "さんぴゃく"],
  600:  ["ろくひゃく", "ろっひゃく"],
  800:  ["はちひゃく", "はっひゃく"],
  3000: ["さんせん"],
  8000: ["はちせん", "はっぜん"],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sameMagnitude(a: number, b: number): boolean {
  const mag = (v: number) => (v >= 10000 ? 4 : v >= 1000 ? 3 : v >= 100 ? 2 : 1);
  return mag(a) === mag(b);
}

/**
 * 4 opciones en hiragana para el modo "Números clave": la correcta, las trampas
 * del irregular (si las hay) y relleno de la misma magnitud.
 */
export function buildKeyOptions(correct: KeyNumber): string[] {
  const options = new Set<string>([correct.hiragana]);
  for (const trap of shuffle(IRREGULAR_TRAPS[correct.value] ?? [])) {
    if (options.size < 4) options.add(trap);
  }
  const sameMag = shuffle(KEY_NUMBERS.filter((k) => k.value !== correct.value && sameMagnitude(k.value, correct.value)));
  const rest = shuffle(KEY_NUMBERS.filter((k) => k.value !== correct.value && !sameMagnitude(k.value, correct.value)));
  for (const k of [...sameMag, ...rest]) {
    if (options.size >= 4) break;
    options.add(k.hiragana);
  }
  return shuffle([...options]);
}

// ── Niveles del modo "Formar el número" ──────────────────────────────────────

export type BuildLevel = "2cifras" | "3cifras" | "4cifras" | "man";

export interface BuildLevelDef {
  id: BuildLevel;
  label: string;
  min: number;
  max: number;
  /** Números clave que deben estar al menos "developing" para desbloquear. */
  requiredKeys: number[];
  /** true → los requiredKeys deben estar "mastered" (nivel まん). */
  requireMastered?: boolean;
}

const UNIT_KEYS     = KEY_NUMBERS.filter((k) => k.value <= 10).map((k) => k.value);
const HUNDRED_KEYS  = KEY_NUMBERS.filter((k) => k.value >= 100 && k.value <= 900).map((k) => k.value);
const THOUSAND_KEYS = KEY_NUMBERS.filter((k) => k.value >= 1000 && k.value <= 9000).map((k) => k.value);

export const BUILD_LEVELS: BuildLevelDef[] = [
  { id: "2cifras", label: "2 cifras", min: 11,    max: 99,    requiredKeys: UNIT_KEYS },
  { id: "3cifras", label: "3 cifras", min: 100,   max: 999,   requiredKeys: HUNDRED_KEYS },
  { id: "4cifras", label: "4 cifras", min: 1000,  max: 9999,  requiredKeys: THOUSAND_KEYS },
  { id: "man",     label: "Con まん", min: 10000, max: 99999, requiredKeys: THOUSAND_KEYS, requireMastered: true },
];

// ── SRS ──────────────────────────────────────────────────────────────────────

export function numberKeyProgressKey(value: number): string {
  return `number-key:${value}`;
}

/** Mismos umbrales que charStatus (utils.ts), sobre la clave number-key:{value}. */
export function numberKeyStatus(progress: ProgressItems, value: number): CharStatus {
  const p = progress[numberKeyProgressKey(value)];
  if (!p || p.attempts === 0) return "untested";
  const acc = p.correct / p.attempts;
  if (p.attempts >= 3 && acc >= 0.85) return "mastered";
  if (acc < 0.5) return "weak";
  return "developing";
}

/** Reconocimiento antes que producción: formar N cifras exige haber visto sus claves. */
export function buildLevelUnlocked(progress: ProgressItems, level: BuildLevelDef): boolean {
  if (level.requireMastered) {
    return level.requiredKeys.every((v) => numberKeyStatus(progress, v) === "mastered");
  }
  return level.requiredKeys.every((v) => numberKeyStatus(progress, v) !== "untested");
}

// ── Generación de ejercicios ─────────────────────────────────────────────────

// Cifras cuyas formas son irregulares, sobre-representadas al generar (mismo
// espíritu que el drill de pares confundibles de kana).
const IRREGULAR_HUNDRED_DIGITS  = [3, 6, 8];
const IRREGULAR_THOUSAND_DIGITS = [3, 8];
const IRREGULAR_BIAS = 0.5; // probabilidad de forzar una cifra irregular

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Número aleatorio del nivel, con sesgo hacia centenas/millares irregulares. */
export function randomNumberForLevel(level: BuildLevelDef): number {
  let n = randomInt(level.min, level.max);
  if (n >= 100 && Math.random() < IRREGULAR_BIAS) {
    const hun = Math.floor((n % 1000) / 100);
    if (n >= 1000) {
      const tho = Math.floor((n % 10000) / 1000);
      if (Math.random() < 0.5) {
        n += (pick(IRREGULAR_THOUSAND_DIGITS) - tho) * 1000;
      } else if (hun > 0) {
        n += (pick(IRREGULAR_HUNDRED_DIGITS) - hun) * 100;
      }
    } else if (hun > 0) {
      n += (pick(IRREGULAR_HUNDRED_DIGITS) - hun) * 100;
    }
  }
  return n;
}

/**
 * Fichas-distractor para "Formar el número": si algún bloque correcto es
 * irregular, incluye su trampa; el resto son bloques plausibles que no
 * pertenecen al número.
 */
export function buildChipDistractors(chips: NumberChip[], count = 3): NumberChip[] {
  const used = new Set(chips.map((c) => c.kana));
  const distractors: NumberChip[] = [];

  for (const chip of chips) {
    const value = chip.credits.find((v) => IRREGULAR_TRAPS[v]);
    if (value !== undefined && distractors.length < count) {
      const trap = pick(IRREGULAR_TRAPS[value]);
      if (!used.has(trap)) {
        used.add(trap);
        distractors.push({ kana: trap, romaji: "?", credits: [] });
      }
    }
  }

  const fillers = shuffle(KEY_NUMBERS.filter((k) => !used.has(k.hiragana)));
  for (const k of fillers) {
    if (distractors.length >= count) break;
    used.add(k.hiragana);
    distractors.push({ kana: k.hiragana, romaji: k.romaji, credits: [] });
  }
  return distractors;
}

// ── Modo Contar (movido de Vocabulario) ──────────────────────────────────────
// Réplica exacta de las 10 palabras que vivían en la categoría "numeros" de
// src/vocabulary.ts, para que el juego conserve sus claves SRS
// `counting:{hiragana}` sin migración (4 = し, la lectura con la que se guardó).

export interface NumberWord {
  hiragana: string;
  romaji: string;
  meaning: string;
  numberValue: number;
}

export const NUMBER_WORDS: NumberWord[] = [
  { hiragana: "いち",   romaji: "ichi",  meaning: "uno",    numberValue: 1 },
  { hiragana: "に",     romaji: "ni",    meaning: "dos",    numberValue: 2 },
  { hiragana: "さん",   romaji: "san",   meaning: "tres",   numberValue: 3 },
  { hiragana: "し",     romaji: "shi",   meaning: "cuatro", numberValue: 4 },
  { hiragana: "ご",     romaji: "go",    meaning: "cinco",  numberValue: 5 },
  { hiragana: "ろく",   romaji: "roku",  meaning: "seis",   numberValue: 6 },
  { hiragana: "なな",   romaji: "nana",  meaning: "siete",  numberValue: 7 },
  { hiragana: "はち",   romaji: "hachi", meaning: "ocho",   numberValue: 8 },
  { hiragana: "きゅう", romaji: "kyuu",  meaning: "nueve",  numberValue: 9 },
  { hiragana: "じゅう", romaji: "juu",   meaning: "diez",   numberValue: 10 },
];
