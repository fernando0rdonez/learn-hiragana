import type { ProgressItems, CharStatus } from "./types";
import { numberToKana, numberToRomaji } from "./numbers";

// ── Horas (時 -ji), 1–12 — solo 3 irregulares (4, 7, 9) ──────────────────────

export interface KeyHour {
  value: number; // 1–12
  hiragana: string;
  romaji: string;
  irregular?: boolean;
}

export const KEY_HOURS: KeyHour[] = [
  { value: 1,  hiragana: "いちじ",       romaji: "ichiji" },
  { value: 2,  hiragana: "にじ",         romaji: "niji" },
  { value: 3,  hiragana: "さんじ",       romaji: "sanji" },
  { value: 4,  hiragana: "よじ",         romaji: "yoji",     irregular: true },
  { value: 5,  hiragana: "ごじ",         romaji: "goji" },
  { value: 6,  hiragana: "ろくじ",       romaji: "rokuji" },
  { value: 7,  hiragana: "しちじ",       romaji: "shichiji", irregular: true },
  { value: 8,  hiragana: "はちじ",       romaji: "hachiji" },
  { value: 9,  hiragana: "くじ",         romaji: "kuji",     irregular: true },
  { value: 10, hiragana: "じゅうじ",     romaji: "juuji" },
  { value: 11, hiragana: "じゅういちじ", romaji: "juuichiji" },
  { value: 12, hiragana: "じゅうにじ",   romaji: "juuniji" },
];

// Lecturas "tentadoras" de aplicar la regla regular a un irregular (4/7/9).
const HOUR_TRAPS: Record<number, string[]> = {
  4: ["よんじ"],
  7: ["ななじ"],
  9: ["きゅうじ"],
};

// ── Minutos (分 -fun/-pun), composicional 1–59 ───────────────────────────────
// Familia de rendaku: unidades 1–9 con su propia forma ふん/ぷん, decenas que
// también toman っぷん — solo la decena "10" desnuda es irregular (じゅっぷん,
// no いちじゅっぷん), igual que じゅう en numbers.ts.

export interface KeyMinuteUnit {
  value: number; // 1–9, 10, 20, 30, 40, 50
  hiragana: string;
  romaji: string;
  irregular?: boolean;
}

const UNIT_MINUTE_KANA: Record<number, string> = {
  1: "いっぷん", 2: "にふん", 3: "さんぷん", 4: "よんぷん", 5: "ごふん",
  6: "ろっぷん", 7: "ななふん", 8: "はっぷん", 9: "きゅうふん",
};
const UNIT_MINUTE_ROMAJI: Record<number, string> = {
  1: "ippun", 2: "nifun", 3: "sanpun", 4: "yonpun", 5: "gofun",
  6: "roppun", 7: "nanafun", 8: "happun", 9: "kyuufun",
};
const UNIT_MINUTE_IRREGULAR = new Set([1, 3, 4, 6, 8]);

const DECADE_MINUTE_KANA: Record<number, string> = {
  10: "じゅっぷん", 20: "にじゅっぷん", 30: "さんじゅっぷん", 40: "よんじゅっぷん", 50: "ごじゅっぷん",
};
const DECADE_MINUTE_ROMAJI: Record<number, string> = {
  10: "juppun", 20: "nijuppun", 30: "sanjuppun", 40: "yonjuppun", 50: "gojuppun",
};
const DECADE_MINUTE_IRREGULAR = new Set([10]);

export const KEY_MINUTE_UNITS: KeyMinuteUnit[] = [
  ...Array.from({ length: 9 }, (_, i): KeyMinuteUnit => {
    const v = i + 1;
    return { value: v, hiragana: UNIT_MINUTE_KANA[v], romaji: UNIT_MINUTE_ROMAJI[v], irregular: UNIT_MINUTE_IRREGULAR.has(v) || undefined };
  }),
  ...[10, 20, 30, 40, 50].map((v): KeyMinuteUnit => ({
    value: v, hiragana: DECADE_MINUTE_KANA[v], romaji: DECADE_MINUTE_ROMAJI[v], irregular: DECADE_MINUTE_IRREGULAR.has(v) || undefined,
  })),
];

// Lecturas "tentadoras" de aplicar ふ sin el rendaku de sokuon/nasalización.
const MINUTE_TRAPS: Record<number, string[]> = {
  1:  ["いちふん"],
  3:  ["さんふん"],
  4:  ["よんふん"],
  6:  ["ろくふん"],
  8:  ["はちふん"],
  10: ["じゅうふん"],
};

/** Prefijo compositivo de una decena de minutos (10→じゅう, 20→にじゅう…) — mismo patrón que los `ten` de numberToKana. */
function tensPrefixKana(tens: number): string {
  return numberToKana(tens * 10);
}
function tensPrefixRomaji(tens: number): string {
  return numberToRomaji(tens * 10);
}

/** 24 → "にじゅうよんぷん". Rango 1–59. 20 → "にじゅっぷん" (no にじゅう＋いっぷん). */
export function minuteToKana(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 59) {
    throw new Error(`minuteToKana: fuera de rango (1–59): ${n}`);
  }
  if (n <= 9) return UNIT_MINUTE_KANA[n];
  const tens = Math.floor(n / 10);
  const unit = n % 10;
  if (unit === 0) return DECADE_MINUTE_KANA[tens * 10];
  return tensPrefixKana(tens) + UNIT_MINUTE_KANA[unit];
}

export function minuteToRomaji(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 59) {
    throw new Error(`minuteToRomaji: fuera de rango (1–59): ${n}`);
  }
  if (n <= 9) return UNIT_MINUTE_ROMAJI[n];
  const tens = Math.floor(n / 10);
  const unit = n % 10;
  if (unit === 0) return DECADE_MINUTE_ROMAJI[tens * 10];
  return tensPrefixRomaji(tens) + " " + UNIT_MINUTE_ROMAJI[unit];
}

export interface MinuteChip {
  kana: string;
  romaji: string;
  /** Número clave de minutos (KEY_MINUTE_UNITS.value) al que acredita este bloque. */
  value: number;
}

/** Descompone 1–59 en 1–2 bloques (24 → にじゅう・よんぷん), cada uno con su número clave. */
export function minuteToChips(n: number): MinuteChip[] {
  if (!Number.isInteger(n) || n < 1 || n > 59) {
    throw new Error(`minuteToChips: fuera de rango (1–59): ${n}`);
  }
  if (n <= 9) return [{ kana: UNIT_MINUTE_KANA[n], romaji: UNIT_MINUTE_ROMAJI[n], value: n }];
  const tens = Math.floor(n / 10);
  const unit = n % 10;
  if (unit === 0) return [{ kana: DECADE_MINUTE_KANA[tens * 10], romaji: DECADE_MINUTE_ROMAJI[tens * 10], value: tens * 10 }];
  return [
    { kana: tensPrefixKana(tens), romaji: tensPrefixRomaji(tens), value: tens * 10 },
    { kana: UNIT_MINUTE_KANA[unit], romaji: UNIT_MINUTE_ROMAJI[unit], value: unit },
  ];
}

// ── Vocabulario fijo ──────────────────────────────────────────────────────────
// No llevan SRS individual — se acreditan como parte de la lectura completa.

export type TimePeriod = "am" | "pm";

export const GOZEN = { hiragana: "ごぜん", romaji: "gozen", meaning: "a.m." };
export const GOGO  = { hiragana: "ごご",   romaji: "gogo",  meaning: "p.m." };
export const HAN   = { hiragana: "はん",   romaji: "han",   meaning: "y media" };

// ── Hora completa → fichas (mismo contrato que NumberChip de #11) ───────────

export interface TimeValue {
  hour: number;   // 1–12
  minute: number; // 0–59
  period: TimePeriod;
}

export interface TimeChip {
  kana: string;
  romaji: string;
  kind: "period" | "hour" | "minute";
  /** Números clave (hora o minuto) a los que acredita este bloque; vacío para vocabulario fijo. */
  credits: number[];
}

/**
 * 19:00 (period pm) → ごご・じゅうじ. `useHan`: cuando minute === 30, usa la
 * ficha はん en vez de さんじゅっぷん (misma lectura, vocabulario alternativo).
 */
export function timeToChips(hour: number, minute: number, period: TimePeriod, useHan = false): TimeChip[] {
  if (!Number.isInteger(hour) || hour < 1 || hour > 12) {
    throw new Error(`timeToChips: hora fuera de rango (1–12): ${hour}`);
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error(`timeToChips: minuto fuera de rango (0–59): ${minute}`);
  }
  const periodWord = period === "am" ? GOZEN : GOGO;
  const chips: TimeChip[] = [
    { kana: periodWord.hiragana, romaji: periodWord.romaji, kind: "period", credits: [] },
  ];
  const h = KEY_HOURS.find((k) => k.value === hour)!;
  chips.push({ kana: h.hiragana, romaji: h.romaji, kind: "hour", credits: [hour] });

  if (minute === 0) return chips;
  if (minute === 30 && useHan) {
    chips.push({ kana: HAN.hiragana, romaji: HAN.romaji, kind: "minute", credits: [30] });
    return chips;
  }
  for (const c of minuteToChips(minute)) {
    chips.push({ kana: c.kana, romaji: c.romaji, kind: "minute", credits: [c.value] });
  }
  return chips;
}

export function timeToKana(t: TimeValue, useHan = false): string {
  return timeToChips(t.hour, t.minute, t.period, useHan).map((c) => c.kana).join("");
}

export function timeToRomaji(t: TimeValue, useHan = false): string {
  return timeToChips(t.hour, t.minute, t.period, useHan).map((c) => c.romaji).join(" ");
}

/** "7:26 p. m." — formato visual para el modo Reconocer/Escribir. */
export function formatTimeValue(t: TimeValue): string {
  const mm = String(t.minute).padStart(2, "0");
  const suffix = t.period === "am" ? "a. m." : "p. m.";
  return `${t.hour}:${mm} ${suffix}`;
}

// ── SRS ──────────────────────────────────────────────────────────────────────

export function hourProgressKey(value: number): string {
  return `datetime:hour:${value}`;
}
export function minuteProgressKey(value: number): string {
  return `datetime:minute:${value}`;
}

/** Mismos umbrales que charStatus (utils.ts), sobre la clave datetime:hour/minute:{value}. */
function keyStatus(progress: ProgressItems, key: string): CharStatus {
  const p = progress[key];
  if (!p || p.attempts === 0) return "untested";
  const acc = p.correct / p.attempts;
  if (p.attempts >= 3 && acc >= 0.85) return "mastered";
  if (acc < 0.5) return "weak";
  return "developing";
}

export function hourKeyStatus(progress: ProgressItems, value: number): CharStatus {
  return keyStatus(progress, hourProgressKey(value));
}
export function minuteKeyStatus(progress: ProgressItems, value: number): CharStatus {
  return keyStatus(progress, minuteProgressKey(value));
}

// ── Generación de ejercicios ─────────────────────────────────────────────────

const IRREGULAR_HOURS = [4, 7, 9];
const IRREGULAR_MINUTES = [1, 3, 4, 6, 8, 10];
const IRREGULAR_BIAS = 0.5; // probabilidad de forzar una forma irregular

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Hora 1–12 sesgada hacia las 3 irregulares (4, 7, 9). */
function randomHour(): number {
  return Math.random() < IRREGULAR_BIAS ? pick(IRREGULAR_HOURS) : randomInt(1, 12);
}

/** Minuto 1–59 sesgado hacia unidades/decena irregulares (1,3,4,6,8,10). */
function randomMinute(): number {
  if (Math.random() < IRREGULAR_BIAS) {
    const v = pick(IRREGULAR_MINUTES);
    if (v === 10) return v;
    const tens = randomInt(0, 5);
    return tens === 0 ? v : tens * 10 + v;
  }
  return randomInt(1, 59);
}

/** Hora + minuto + am/pm aleatorios, sesgados hacia formas irregulares. */
export function randomTimeValue(): TimeValue {
  return {
    hour: randomHour(),
    minute: Math.random() < 0.3 ? 0 : randomMinute(),
    period: Math.random() < 0.5 ? "am" : "pm",
  };
}

// ── Niveles del modo "Formar la hora" ────────────────────────────────────────
// Mismo espíritu que BUILD_LEVELS de #11: cada nivel añade un eje de dificultad
// nuevo mientras mantiene los anteriores fijos.

export type TimeBuildLevel = "hour" | "half" | "minute" | "ampm";

export interface TimeBuildLevelDef {
  id: TimeBuildLevel;
  label: string;
}

export const TIME_BUILD_LEVELS: TimeBuildLevelDef[] = [
  { id: "hour",   label: "En punto" },
  { id: "half",   label: "Y media" },
  { id: "minute", label: "Minutos libres" },
  { id: "ampm",   label: "Con am/pm" },
];

export interface RandomTime extends TimeValue {
  /** Cuando minute === 30: si esta ronda usa はん en vez de さんじゅっぷん. */
  useHan: boolean;
}

export function randomTimeForLevel(level: TimeBuildLevel): RandomTime {
  const hour = randomHour();
  switch (level) {
    case "hour":
      return { hour, minute: 0, period: "pm", useHan: false };
    case "half":
      return { hour, minute: 30, period: "pm", useHan: Math.random() < 0.5 };
    case "minute":
      return { hour, minute: randomMinute(), period: "pm", useHan: false };
    case "ampm":
      return {
        hour,
        minute: Math.random() < 0.25 ? 0 : randomMinute(),
        period: Math.random() < 0.5 ? "am" : "pm",
        useHan: Math.random() < 0.3,
      };
  }
}

// ── Distractores de tiempo (modo Reconocer) ──────────────────────────────────
// Dado el tiempo correcto, genera tiempos parecidos pero incorrectos: mismo
// minuto con am/pm invertido, ±1 minuto (cambia de familia de rendaku),
// hora ±1 y relleno aleatorio si hiciera falta.

export function timeKey(t: TimeValue): string {
  return `${t.period}-${t.hour}-${t.minute}`;
}

/** Inversa de timeKey — reconstruye un TimeValue desde su clave codificada. */
export function parseTimeKey(key: string): TimeValue {
  const [period, hour, minute] = key.split("-");
  return { period: period as TimePeriod, hour: Number(hour), minute: Number(minute) };
}

function clampHour(h: number): number {
  if (h < 1) return 12;
  if (h > 12) return 1;
  return h;
}
function clampMinute(m: number): number {
  if (m < 0) return 59;
  if (m > 59) return 0;
  return m;
}

export function buildTimeDistractors(correct: TimeValue, count = 3): TimeValue[] {
  const used = new Set<string>([timeKey(correct)]);
  const distractors: TimeValue[] = [];

  function tryAdd(t: TimeValue) {
    const key = timeKey(t);
    if (distractors.length >= count || used.has(key)) return;
    used.add(key);
    distractors.push(t);
  }

  tryAdd({ ...correct, period: correct.period === "am" ? "pm" : "am" });
  tryAdd({ ...correct, minute: clampMinute(correct.minute + 1) });
  tryAdd({ ...correct, minute: clampMinute(correct.minute - 1) });
  tryAdd({ ...correct, hour: clampHour(correct.hour + 1) });
  tryAdd({ ...correct, hour: clampHour(correct.hour - 1) });

  let guard = 0;
  while (distractors.length < count && guard < 200) {
    guard++;
    tryAdd({ hour: randomInt(1, 12), minute: randomInt(0, 59), period: Math.random() < 0.5 ? "am" : "pm" });
  }
  return distractors;
}

/** 4 opciones (correcta + 3 distractores) para el modo Reconocer — nunca repite un tiempo. */
export function buildTimeOptions(correct: TimeValue, count = 4): TimeValue[] {
  const distractors = buildTimeDistractors(correct, count - 1);
  return shuffle([correct, ...distractors]);
}

// ── Modo Competencia (docs/COMPETITION_PLAN.md) ──────────────────────────────
// El espacio de horas es demasiado grande (12×60×2) para un pool fijo tipo
// ALL_CHARS/VOCABULARY — el snapshot del reto se genera al azar una vez y se
// codifica como string (timeKey) para guardarlo en quiz_config.items.

export type DateTimeCompetitionMode = "recognize" | "write" | "build" | "clock";

/** `size` horas únicas al azar, codificadas — construir usa siempre nivel "minute" (useHan siempre false ahí). */
export function randomCompetitionTimeItems(mode: DateTimeCompetitionMode, size: number): string[] {
  const used = new Set<string>();
  const items: string[] = [];
  let guard = 0;
  while (items.length < size && guard < size * 50) {
    guard++;
    const t: TimeValue = mode === "build" ? randomTimeForLevel("minute") : randomTimeValue();
    const key = timeKey(t);
    if (used.has(key)) continue;
    used.add(key);
    items.push(key);
  }
  return items;
}

/**
 * Fichas-distractor para "Formar la hora": si algún bloque correcto es
 * irregular, incluye su trampa; el resto son bloques de hora/minuto plausibles
 * que no pertenecen a la hora objetivo.
 */
export function buildTimeChipDistractors(chips: TimeChip[], count = 3): TimeChip[] {
  const used = new Set(chips.map((c) => c.kana));
  const distractors: TimeChip[] = [];

  for (const chip of chips) {
    if (distractors.length >= count) break;
    const traps = chip.kind === "hour" ? HOUR_TRAPS[chip.credits[0]]
      : chip.kind === "minute" ? MINUTE_TRAPS[chip.credits[0]]
      : undefined;
    if (!traps) continue;
    const trap = pick(traps);
    if (!used.has(trap)) {
      used.add(trap);
      distractors.push({ kana: trap, romaji: "?", kind: chip.kind, credits: [] });
    }
  }

  const fillerPool: TimeChip[] = [
    ...KEY_HOURS.map((h): TimeChip => ({ kana: h.hiragana, romaji: h.romaji, kind: "hour", credits: [] })),
    ...KEY_MINUTE_UNITS.map((m): TimeChip => ({ kana: m.hiragana, romaji: m.romaji, kind: "minute", credits: [] })),
  ];
  for (const f of shuffle(fillerPool)) {
    if (distractors.length >= count) break;
    if (used.has(f.kana)) continue;
    used.add(f.kana);
    distractors.push(f);
  }
  return distractors;
}
