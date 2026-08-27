import type { ProgressItems, CharStatus } from "./types";
import { numberToKana, numberToRomaji, numberToChips, numberKeyProgressKey, IRREGULAR_TRAPS, KEY_NUMBERS } from "./numbers";

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
  kind: "period" | "hour" | "minute" | "weekday" | "month" | "day" | "year";
  /** Números clave (hora, minuto, mes, día, año...) a los que acredita este bloque; vacío para vocabulario fijo. */
  credits: number[];
}

/** Alias — mismo shape que TimeChip, usado por fichas de fecha/combo (#17 fast-follow). */
export type DateTimeChip = TimeChip;

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
const IRREGULAR_BIAS = 0.3; // probabilidad de forzar una forma irregular

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

function randomPeriod(): TimePeriod {
  return Math.random() < 0.5 ? "am" : "pm";
}

export function randomTimeForLevel(level: TimeBuildLevel): RandomTime {
  const hour = randomHour();
  switch (level) {
    case "hour":
      return { hour, minute: 0, period: randomPeriod(), useHan: false };
    case "half":
      return { hour, minute: 30, period: randomPeriod(), useHan: Math.random() < 0.5 };
    case "minute":
      return { hour, minute: randomMinute(), period: randomPeriod(), useHan: false };
    case "ampm":
      return {
        hour,
        minute: Math.random() < 0.25 ? 0 : randomMinute(),
        period: randomPeriod(),
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

// ── Días de la semana (曜日 -youbi), 1–7 — sin irregulares ──────────────────

export interface KeyWeekday {
  value: number; // 1 (月) – 7 (日)
  hiragana: string;
  romaji: string;
}

export const KEY_WEEKDAYS: KeyWeekday[] = [
  { value: 1, hiragana: "げつようび", romaji: "getsuyoubi" },
  { value: 2, hiragana: "かようび",   romaji: "kayoubi" },
  { value: 3, hiragana: "すいようび", romaji: "suiyoubi" },
  { value: 4, hiragana: "もくようび", romaji: "mokuyoubi" },
  { value: 5, hiragana: "きんようび", romaji: "kinyoubi" },
  { value: 6, hiragana: "どようび",   romaji: "doyoubi" },
  { value: 7, hiragana: "にちようび", romaji: "nichiyoubi" },
];

const WEEKDAY_ES = ["", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

// ── Meses (月 -gatsu), 1–12 — solo 3 irregulares (4, 7, 9) ──────────────────

export interface KeyMonth {
  value: number; // 1–12
  hiragana: string;
  romaji: string;
  irregular?: boolean;
}

export const KEY_MONTHS: KeyMonth[] = [
  { value: 1,  hiragana: "いちがつ",       romaji: "ichigatsu" },
  { value: 2,  hiragana: "にがつ",         romaji: "nigatsu" },
  { value: 3,  hiragana: "さんがつ",       romaji: "sangatsu" },
  { value: 4,  hiragana: "しがつ",         romaji: "shigatsu",   irregular: true },
  { value: 5,  hiragana: "ごがつ",         romaji: "gogatsu" },
  { value: 6,  hiragana: "ろくがつ",       romaji: "rokugatsu" },
  { value: 7,  hiragana: "しちがつ",       romaji: "shichigatsu", irregular: true },
  { value: 8,  hiragana: "はちがつ",       romaji: "hachigatsu" },
  { value: 9,  hiragana: "くがつ",         romaji: "kugatsu",    irregular: true },
  { value: 10, hiragana: "じゅうがつ",     romaji: "juugatsu" },
  { value: 11, hiragana: "じゅういちがつ", romaji: "juuichigatsu" },
  { value: 12, hiragana: "じゅうにがつ",   romaji: "juunigatsu" },
];

const MONTH_ES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// Lecturas "tentadoras" de aplicar la regla regular a un irregular (4/7/9).
const MONTH_TRAPS: Record<number, string[]> = {
  4: ["よんがつ"],
  7: ["なながつ"],
  9: ["きゅうがつ"],
};

// ── Días del mes (日 -nichi/irregular), 1–31 ────────────────────────────────
// Tabulado a mano completo (no derivado de numberToKana): 9/19/29 usan く y no
// きゅう, lo que rompería una derivación mecánica. ~15 lecturas son vocabulario
// puro (1–10, 14, 20, 24) sin relación con el número que representan.

export interface KeyDayOfMonth {
  value: number; // 1–31
  hiragana: string;
  romaji: string;
  irregular?: boolean;
}

const DAY_OF_MONTH_DATA: [number, string, string, boolean?][] = [
  [1,  "ついたち",         "tsuitachi",       true],
  [2,  "ふつか",           "futsuka",         true],
  [3,  "みっか",           "mikka",           true],
  [4,  "よっか",           "yokka",           true],
  [5,  "いつか",           "itsuka",          true],
  [6,  "むいか",           "muika",           true],
  [7,  "なのか",           "nanoka",          true],
  [8,  "ようか",           "youka",           true],
  [9,  "ここのか",         "kokonoka",        true],
  [10, "とおか",           "tooka",           true],
  [11, "じゅういちにち",   "juuichinichi"],
  [12, "じゅうににち",     "juuninichi"],
  [13, "じゅうさんにち",   "juusannichi"],
  [14, "じゅうよっか",     "juuyokka",        true],
  [15, "じゅうごにち",     "juugonichi"],
  [16, "じゅうろくにち",   "juurokunichi"],
  [17, "じゅうしちにち",   "juushichinichi"],
  [18, "じゅうはちにち",   "juuhachinichi"],
  [19, "じゅうくにち",     "juukunichi",      true],
  [20, "はつか",           "hatsuka",         true],
  [21, "にじゅういちにち", "nijuuichinichi"],
  [22, "にじゅうににち",   "nijuuninichi"],
  [23, "にじゅうさんにち", "nijuusannichi"],
  [24, "にじゅうよっか",   "nijuuyokka",      true],
  [25, "にじゅうごにち",   "nijuugonichi"],
  [26, "にじゅうろくにち", "nijuurokunichi"],
  [27, "にじゅうしちにち", "nijuushichinichi"],
  [28, "にじゅうはちにち", "nijuuhachinichi"],
  [29, "にじゅうくにち",   "nijuukunichi",    true],
  [30, "さんじゅうにち",   "sanjuunichi"],
  [31, "さんじゅういちにち", "sanjuuichinichi"],
];

export const KEY_DAYS_OF_MONTH: KeyDayOfMonth[] = DAY_OF_MONTH_DATA.map(([value, hiragana, romaji, irregular]) => ({
  value, hiragana, romaji, irregular,
}));

// Lecturas "tentadoras" de aplicar la regla mecánica (numberToKana + にち) a un irregular.
const DAY_TRAPS: Record<number, string[]> = {
  1: ["いちにち"], 2: ["ににち"], 3: ["さんにち"], 4: ["よんにち"], 5: ["ごにち"],
  6: ["ろくにち"], 7: ["しちにち"], 8: ["はちにち"], 9: ["きゅうにち"], 10: ["じゅうにち"],
  14: ["じゅうよんにち"], 19: ["じゅうきゅうにち"], 20: ["にじゅうにち"],
  24: ["にじゅうよんにち"], 29: ["にじゅうきゅうにち"],
};

// ── Vocabulario fijo — contador de año ──────────────────────────────────────

export const NEN = { hiragana: "ねん", romaji: "nen", meaning: "año (contador)" };

// ── Fecha completa → fichas (reutiliza numberToChips de #11 para el año) ────

export interface DateValue {
  weekday?: number; // 1–7
  month?: number;   // 1–12
  day?: number;     // 1–31
  year?: number;
}

export function dateToChips(d: DateValue): DateTimeChip[] {
  const chips: DateTimeChip[] = [];
  if (d.year !== undefined) {
    for (const c of numberToChips(d.year)) {
      chips.push({ kana: c.kana, romaji: c.romaji, kind: "year", credits: c.credits });
    }
    chips.push({ kana: NEN.hiragana, romaji: NEN.romaji, kind: "year", credits: [] });
  }
  if (d.month !== undefined) {
    const m = KEY_MONTHS.find((k) => k.value === d.month)!;
    chips.push({ kana: m.hiragana, romaji: m.romaji, kind: "month", credits: [d.month] });
  }
  if (d.day !== undefined) {
    const dd = KEY_DAYS_OF_MONTH.find((k) => k.value === d.day)!;
    chips.push({ kana: dd.hiragana, romaji: dd.romaji, kind: "day", credits: [d.day] });
  }
  if (d.weekday !== undefined) {
    const w = KEY_WEEKDAYS.find((k) => k.value === d.weekday)!;
    chips.push({ kana: w.hiragana, romaji: w.romaji, kind: "weekday", credits: [d.weekday] });
  }
  return chips;
}

export function dateToKana(d: DateValue): string {
  return dateToChips(d).map((c) => c.kana).join("");
}

export function dateToRomaji(d: DateValue): string {
  return dateToChips(d).map((c) => c.romaji).join(" ");
}

/** "15/03/2024" para fecha completa; "martes"/"marzo"/"2024" para un solo campo. */
export function formatDateValue(d: DateValue): string {
  if (d.year !== undefined && d.month !== undefined && d.day !== undefined) {
    return `${String(d.day).padStart(2, "0")}/${String(d.month).padStart(2, "0")}/${d.year}`;
  }
  if (d.weekday !== undefined) return WEEKDAY_ES[d.weekday];
  if (d.month !== undefined) return MONTH_ES[d.month];
  if (d.day !== undefined) return `Día ${d.day}`;
  if (d.year !== undefined) return `${d.year}`;
  return "";
}

export function dateKey(d: DateValue): string {
  return `${d.weekday ?? "x"}-${d.month ?? "x"}-${d.day ?? "x"}-${d.year ?? "x"}`;
}

function clampWeekday(w: number): number {
  if (w < 1) return 7;
  if (w > 7) return 1;
  return w;
}
function clampMonth(m: number): number {
  if (m < 1) return 12;
  if (m > 12) return 1;
  return m;
}
function clampDay(d: number): number {
  if (d < 1) return 31;
  if (d > 31) return 1;
  return d;
}
/** Igual que clampDay pero limitado a 1–28 — evita fechas inválidas (30 de febrero) en 'full'. */
function clampDay28(d: number): number {
  if (d < 1) return 28;
  if (d > 28) return 1;
  return d;
}

// ── Niveles del modo "Fecha" ─────────────────────────────────────────────────
// A diferencia de TIME_BUILD_LEVELS (que solo gobierna Construir), el nivel de
// fecha determina el contenido en los 4 modos por igual.

export type DateBuildLevel = "weekday" | "month" | "day" | "year" | "full";

export interface DateBuildLevelDef {
  id: DateBuildLevel;
  label: string;
}

export const DATE_BUILD_LEVELS: DateBuildLevelDef[] = [
  { id: "weekday", label: "Día de la semana" },
  { id: "month",   label: "Mes" },
  { id: "day",     label: "Día del mes" },
  { id: "year",    label: "Año" },
  { id: "full",    label: "Fecha completa" },
];

const IRREGULAR_MONTHS = [4, 7, 9];
const IRREGULAR_DAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 19, 20, 24, 29];

function randomWeekday(): number {
  return randomInt(1, 7);
}

function randomMonth(): number {
  return Math.random() < IRREGULAR_BIAS ? pick(IRREGULAR_MONTHS) : randomInt(1, 12);
}

/** capTo28: cuando la fecha lleva año+mes (nivel 'full'), evita 29–31 para no depender del mes. */
function randomDayValue(capTo28: boolean): number {
  const pool = capTo28 ? IRREGULAR_DAYS.filter((d) => d <= 28) : IRREGULAR_DAYS;
  if (Math.random() < IRREGULAR_BIAS) return pick(pool);
  return randomInt(1, capTo28 ? 28 : 31);
}

function randomYear(): number {
  return randomInt(1950, 2035);
}

export function randomDateForLevel(level: DateBuildLevel): DateValue {
  switch (level) {
    case "weekday": return { weekday: randomWeekday() };
    case "month":   return { month: randomMonth() };
    case "day":     return { day: randomDayValue(false) };
    case "year":    return { year: randomYear() };
    case "full":    return { year: randomYear(), month: randomMonth(), day: randomDayValue(true) };
  }
}

function randomDateLike(correct: DateValue): DateValue {
  const soloWeekday = correct.weekday !== undefined && correct.month === undefined && correct.day === undefined && correct.year === undefined;
  const soloMonth   = correct.month !== undefined && correct.day === undefined && correct.year === undefined && correct.weekday === undefined;
  const soloDay     = correct.day !== undefined && correct.month === undefined && correct.year === undefined && correct.weekday === undefined;
  const soloYear    = correct.year !== undefined && correct.month === undefined && correct.day === undefined && correct.weekday === undefined;
  if (soloWeekday) return { weekday: randomWeekday() };
  if (soloMonth) return { month: randomMonth() };
  if (soloDay) return { day: randomDayValue(false) };
  if (soloYear) return { year: randomYear() };
  return { year: randomYear(), month: randomMonth(), day: randomDayValue(true) };
}

// ── Distractores de fecha (modo Reconocer) ──────────────────────────────────

export function buildDateDistractors(correct: DateValue, count = 3): DateValue[] {
  const used = new Set<string>([dateKey(correct)]);
  const distractors: DateValue[] = [];

  function tryAdd(d: DateValue) {
    const key = dateKey(d);
    if (distractors.length >= count || used.has(key)) return;
    used.add(key);
    distractors.push(d);
  }

  const soloWeekday = correct.weekday !== undefined && correct.month === undefined && correct.day === undefined && correct.year === undefined;
  const soloMonth   = correct.month !== undefined && correct.day === undefined && correct.year === undefined && correct.weekday === undefined;
  const soloDay     = correct.day !== undefined && correct.month === undefined && correct.year === undefined && correct.weekday === undefined;
  const soloYear    = correct.year !== undefined && correct.month === undefined && correct.day === undefined && correct.weekday === undefined;

  if (soloWeekday) {
    tryAdd({ weekday: clampWeekday(correct.weekday! + 1) });
    tryAdd({ weekday: clampWeekday(correct.weekday! - 1) });
    tryAdd({ weekday: clampWeekday(correct.weekday! + 3) });
  } else if (soloMonth) {
    tryAdd({ month: clampMonth(correct.month! + 1) });
    tryAdd({ month: clampMonth(correct.month! - 1) });
    tryAdd({ month: clampMonth(correct.month! + 6) });
  } else if (soloDay) {
    tryAdd({ day: clampDay(correct.day! + 1) });
    tryAdd({ day: clampDay(correct.day! - 1) });
    tryAdd({ day: clampDay(correct.day! + 10) });
  } else if (soloYear) {
    tryAdd({ year: correct.year! + 1 });
    tryAdd({ year: correct.year! - 1 });
    tryAdd({ year: correct.year! + 5 });
  } else {
    tryAdd({ ...correct, day: clampDay28((correct.day ?? 1) + 1) });
    tryAdd({ ...correct, month: clampMonth((correct.month ?? 1) + 1) });
    tryAdd({ ...correct, year: (correct.year ?? 2000) + 1 });
  }

  let guard = 0;
  while (distractors.length < count && guard < 200) {
    guard++;
    tryAdd(randomDateLike(correct));
  }
  return distractors;
}

/** 4 opciones (correcta + 3 distractores) para el modo Reconocer — nunca repite una fecha. */
export function buildDateOptions(correct: DateValue, count = 4): DateValue[] {
  const distractors = buildDateDistractors(correct, count - 1);
  return shuffle([correct, ...distractors]);
}

/** Trampas por tipo de ficha — compartido entre fecha y combo. */
function trapsForChip(chip: DateTimeChip): string[] | undefined {
  switch (chip.kind) {
    case "hour":    return HOUR_TRAPS[chip.credits[0]];
    case "minute":  return MINUTE_TRAPS[chip.credits[0]];
    case "month":   return MONTH_TRAPS[chip.credits[0]];
    case "day":     return DAY_TRAPS[chip.credits[0]];
    case "year":    return IRREGULAR_TRAPS[chip.credits[0]];
    default:        return undefined;
  }
}

/**
 * Fichas-distractor para "Formar la fecha": si algún bloque correcto es
 * irregular, incluye su trampa; el resto son bloques de fecha plausibles
 * (nunca de hora) que no pertenecen a la fecha objetivo.
 */
export function buildDateChipDistractors(chips: DateTimeChip[], count = 3): DateTimeChip[] {
  const used = new Set(chips.map((c) => c.kana));
  const distractors: DateTimeChip[] = [];

  for (const chip of chips) {
    if (distractors.length >= count) break;
    const traps = trapsForChip(chip);
    if (!traps) continue;
    const trap = pick(traps);
    if (!used.has(trap)) {
      used.add(trap);
      distractors.push({ kana: trap, romaji: "?", kind: chip.kind, credits: [] });
    }
  }

  const fillerPool: DateTimeChip[] = [
    ...KEY_WEEKDAYS.map((w): DateTimeChip => ({ kana: w.hiragana, romaji: w.romaji, kind: "weekday", credits: [] })),
    ...KEY_MONTHS.map((m): DateTimeChip => ({ kana: m.hiragana, romaji: m.romaji, kind: "month", credits: [] })),
    ...KEY_DAYS_OF_MONTH.map((d): DateTimeChip => ({ kana: d.hiragana, romaji: d.romaji, kind: "day", credits: [] })),
    ...KEY_NUMBERS.map((n): DateTimeChip => ({ kana: n.hiragana, romaji: n.romaji, kind: "year", credits: [] })),
  ];
  for (const f of shuffle(fillerPool)) {
    if (distractors.length >= count) break;
    if (used.has(f.kana)) continue;
    used.add(f.kana);
    distractors.push(f);
  }
  return distractors;
}

// ── SRS — día de la semana / mes / día del mes ──────────────────────────────
// El año reutiliza las claves number-key:{value} ya existentes del módulo
// Números (numberKeyProgressKey), no lleva clave propia.

export function weekdayProgressKey(value: number): string {
  return `datetime:weekday:${value}`;
}
export function monthProgressKey(value: number): string {
  return `datetime:month:${value}`;
}
export function dayProgressKey(value: number): string {
  return `datetime:day:${value}`;
}

export function weekdayKeyStatus(progress: ProgressItems, value: number): CharStatus {
  return keyStatus(progress, weekdayProgressKey(value));
}
export function monthKeyStatus(progress: ProgressItems, value: number): CharStatus {
  return keyStatus(progress, monthProgressKey(value));
}
export function dayKeyStatus(progress: ProgressItems, value: number): CharStatus {
  return keyStatus(progress, dayProgressKey(value));
}

// ── Combo "Fecha y hora" — fecha completa (año+mes+día) + hora ──────────────

export interface DateTimeComboValue {
  date: DateValue; // siempre 'full': year+month+day
  time: TimeValue;
}

export function randomDateTimeCombo(): DateTimeComboValue {
  return { date: randomDateForLevel("full"), time: randomTimeValue() };
}

export function comboKey(c: DateTimeComboValue): string {
  return `${dateKey(c.date)}::${timeKey(c.time)}`;
}

export function comboToChips(c: DateTimeComboValue): DateTimeChip[] {
  return [...dateToChips(c.date), ...timeToChips(c.time.hour, c.time.minute, c.time.period)];
}

export function comboToKana(c: DateTimeComboValue): string {
  return comboToChips(c).map((x) => x.kana).join("");
}

export function comboToRomaji(c: DateTimeComboValue): string {
  return comboToChips(c).map((x) => x.romaji).join(" ");
}

export function formatCombo(c: DateTimeComboValue): string {
  return `${formatDateValue(c.date)} ${formatTimeValue(c.time)}`;
}

function buildComboDistractors(correct: DateTimeComboValue, count = 3): DateTimeComboValue[] {
  const used = new Set<string>([comboKey(correct)]);
  const distractors: DateTimeComboValue[] = [];

  function tryAdd(c: DateTimeComboValue) {
    const key = comboKey(c);
    if (distractors.length >= count || used.has(key)) return;
    used.add(key);
    distractors.push(c);
  }

  tryAdd({ date: correct.date, time: { ...correct.time, period: correct.time.period === "am" ? "pm" : "am" } });
  tryAdd({ date: { ...correct.date, day: clampDay28((correct.date.day ?? 1) + 1) }, time: correct.time });
  tryAdd({ date: correct.date, time: { ...correct.time, hour: clampHour(correct.time.hour + 1) } });
  tryAdd({ date: { ...correct.date, month: clampMonth((correct.date.month ?? 1) + 1) }, time: correct.time });

  let guard = 0;
  while (distractors.length < count && guard < 200) {
    guard++;
    tryAdd({ date: randomDateForLevel("full"), time: randomTimeValue() });
  }
  return distractors;
}

export function buildComboOptions(correct: DateTimeComboValue, count = 4): DateTimeComboValue[] {
  const distractors = buildComboDistractors(correct, count - 1);
  return shuffle([correct, ...distractors]);
}

function buildComboChipDistractors(chips: DateTimeChip[], count = 3): DateTimeChip[] {
  const used = new Set(chips.map((c) => c.kana));
  const distractors: DateTimeChip[] = [];

  for (const chip of chips) {
    if (distractors.length >= count) break;
    const traps = trapsForChip(chip);
    if (!traps) continue;
    const trap = pick(traps);
    if (!used.has(trap)) {
      used.add(trap);
      distractors.push({ kana: trap, romaji: "?", kind: chip.kind, credits: [] });
    }
  }

  const fillerPool: DateTimeChip[] = [
    ...KEY_HOURS.map((h): DateTimeChip => ({ kana: h.hiragana, romaji: h.romaji, kind: "hour", credits: [] })),
    ...KEY_MINUTE_UNITS.map((m): DateTimeChip => ({ kana: m.hiragana, romaji: m.romaji, kind: "minute", credits: [] })),
    ...KEY_MONTHS.map((m): DateTimeChip => ({ kana: m.hiragana, romaji: m.romaji, kind: "month", credits: [] })),
    ...KEY_DAYS_OF_MONTH.map((d): DateTimeChip => ({ kana: d.hiragana, romaji: d.romaji, kind: "day", credits: [] })),
    ...KEY_NUMBERS.map((n): DateTimeChip => ({ kana: n.hiragana, romaji: n.romaji, kind: "year", credits: [] })),
  ];
  for (const f of shuffle(fillerPool)) {
    if (distractors.length >= count) break;
    if (used.has(f.kana)) continue;
    used.add(f.kana);
    distractors.push(f);
  }
  return distractors;
}

// ── Dispatchers genéricos — para que los componentes de juego no dupliquen
// lógica entre Hora / Fecha / Fecha y hora ──────────────────────────────────

export type ContentType = "hora" | "fecha" | "fechaHora";

export type Entry = RandomTime | TimeValue | DateValue | DateTimeComboValue;

export function randomEntry(contentType: ContentType, dateLevel: DateBuildLevel): Entry {
  switch (contentType) {
    case "fecha":     return randomDateForLevel(dateLevel);
    case "fechaHora": return randomDateTimeCombo();
    default:          return randomTimeValue();
  }
}

export function randomEntryForBuild(contentType: ContentType, timeLevel: TimeBuildLevel, dateLevel: DateBuildLevel): Entry {
  switch (contentType) {
    case "fecha":     return randomDateForLevel(dateLevel);
    case "fechaHora": return randomDateTimeCombo();
    default:          return randomTimeForLevel(timeLevel);
  }
}

/**
 * `count` entradas para una sesión de Construir, evitando en lo posible repetir
 * la misma entrada dentro de la serie (el espacio de "En punto" es de solo ~24
 * combinaciones, así que sin esto la misma hora salía 2–3 veces por sesión).
 * Si el espacio es más pequeño que `count`, rellena permitiendo repeticiones.
 */
export function randomEntriesForBuild(
  contentType: ContentType,
  timeLevel: TimeBuildLevel,
  dateLevel: DateBuildLevel,
  count: number,
): Entry[] {
  const used = new Set<string>();
  const entries: Entry[] = [];
  let guard = 0;
  while (entries.length < count && guard < count * 40) {
    guard++;
    const entry = randomEntryForBuild(contentType, timeLevel, dateLevel);
    const key = entryKey(contentType, entry);
    if (used.has(key)) continue;
    used.add(key);
    entries.push(entry);
  }
  while (entries.length < count) {
    entries.push(randomEntryForBuild(contentType, timeLevel, dateLevel));
  }
  return entries;
}

export function entryToChips(contentType: ContentType, entry: Entry): DateTimeChip[] {
  switch (contentType) {
    case "fecha":     return dateToChips(entry as DateValue);
    case "fechaHora": return comboToChips(entry as DateTimeComboValue);
    default: {
      const t = entry as RandomTime;
      return timeToChips(t.hour, t.minute, t.period, t.useHan ?? false);
    }
  }
}

export function entryToKana(contentType: ContentType, entry: Entry): string {
  return entryToChips(contentType, entry).map((c) => c.kana).join("");
}

export function entryToRomaji(contentType: ContentType, entry: Entry): string {
  return entryToChips(contentType, entry).map((c) => c.romaji).join(" ");
}

export function formatEntry(contentType: ContentType, entry: Entry): string {
  switch (contentType) {
    case "fecha":     return formatDateValue(entry as DateValue);
    case "fechaHora": return formatCombo(entry as DateTimeComboValue);
    default:          return formatTimeValue(entry as TimeValue);
  }
}

export function entryKey(contentType: ContentType, entry: Entry): string {
  switch (contentType) {
    case "fecha":     return dateKey(entry as DateValue);
    case "fechaHora": return comboKey(entry as DateTimeComboValue);
    default:          return timeKey(entry as TimeValue);
  }
}

export function buildEntryOptions(contentType: ContentType, entry: Entry, count = 4): Entry[] {
  switch (contentType) {
    case "fecha":     return buildDateOptions(entry as DateValue, count);
    case "fechaHora": return buildComboOptions(entry as DateTimeComboValue, count);
    default:          return buildTimeOptions(entry as TimeValue, count);
  }
}

export function buildEntryChipDistractors(contentType: ContentType, chips: DateTimeChip[], count = 3): DateTimeChip[] {
  switch (contentType) {
    case "fecha":     return buildDateChipDistractors(chips, count);
    case "fechaHora": return buildComboChipDistractors(chips, count);
    default:          return buildTimeChipDistractors(chips, count);
  }
}

/** Mapea cada tipo de ficha a su clave SRS correcta — el año acredita al módulo Números. */
export function progressKeyForChip(chip: DateTimeChip, value: number): string {
  switch (chip.kind) {
    case "hour":    return hourProgressKey(value);
    case "minute":  return minuteProgressKey(value);
    case "weekday": return weekdayProgressKey(value);
    case "month":   return monthProgressKey(value);
    case "day":     return dayProgressKey(value);
    case "year":    return numberKeyProgressKey(value);
    default:        throw new Error(`progressKeyForChip: kind sin clave SRS: ${chip.kind}`);
  }
}
