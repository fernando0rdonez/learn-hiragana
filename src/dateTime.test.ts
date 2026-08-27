import { test } from "node:test";
import assert from "node:assert/strict";
import {
  minuteToKana,
  minuteToChips,
  timeToChips,
  timeToKana,
  KEY_HOURS,
  KEY_MINUTE_UNITS,
  buildTimeOptions,
  buildTimeChipDistractors,
  randomTimeForLevel,
  TIME_BUILD_LEVELS,
  KEY_WEEKDAYS,
  KEY_MONTHS,
  KEY_DAYS_OF_MONTH,
  dateToKana,
  formatDateValue,
  buildDateOptions,
  dateKey,
  DATE_BUILD_LEVELS,
  randomDateForLevel,
  comboToKana,
  formatCombo,
  randomDateTimeCombo,
  randomEntriesForBuild,
  entryKey,
} from "./dateTime";

// ── minuteToKana: ejemplos de la spec ────────────────────────────────────────

test("minuteToKana: ejemplos de la spec (1,6,10,11,16,20,24,30,45,59)", () => {
  assert.equal(minuteToKana(1), "いっぷん");
  assert.equal(minuteToKana(6), "ろっぷん");
  assert.equal(minuteToKana(10), "じゅっぷん");
  assert.equal(minuteToKana(11), "じゅういっぷん");
  assert.equal(minuteToKana(16), "じゅうろっぷん");
  assert.equal(minuteToKana(20), "にじゅっぷん"); // no にじゅう＋いっぷん
  assert.equal(minuteToKana(24), "にじゅうよんぷん");
  assert.equal(minuteToKana(30), "さんじゅっぷん");
  assert.equal(minuteToKana(45), "よんじゅうごふん");
  assert.equal(minuteToKana(59), "ごじゅうきゅうふん");
});

test("minuteToKana: fuera de rango lanza error", () => {
  assert.throws(() => minuteToKana(0));
  assert.throws(() => minuteToKana(60));
  assert.throws(() => minuteToKana(1.5));
});

// ── Horas ────────────────────────────────────────────────────────────────────

test("KEY_HOURS: 12 horas, 3 irregulares (4, 7, 9)", () => {
  assert.equal(KEY_HOURS.length, 12);
  const irregulares = KEY_HOURS.filter((h) => h.irregular).map((h) => h.value).sort((a, b) => a - b);
  assert.deepEqual(irregulares, [4, 7, 9]);
  assert.equal(KEY_HOURS.find((h) => h.value === 4)!.hiragana, "よじ");
  assert.equal(KEY_HOURS.find((h) => h.value === 7)!.hiragana, "しちじ");
  assert.equal(KEY_HOURS.find((h) => h.value === 9)!.hiragana, "くじ");
});

// ── Minutos: datos ────────────────────────────────────────────────────────────

test("KEY_MINUTE_UNITS: 14 bloques (9 unidades + 5 decenas), 6 irregulares", () => {
  assert.equal(KEY_MINUTE_UNITS.length, 14);
  const irregulares = KEY_MINUTE_UNITS.filter((m) => m.irregular).map((m) => m.value).sort((a, b) => a - b);
  assert.deepEqual(irregulares, [1, 3, 4, 6, 8, 10]);
});

// ── minuteToChips ─────────────────────────────────────────────────────────────

test("minuteToChips: 24 = にじゅう(20) + よんぷん(4)", () => {
  const chips = minuteToChips(24);
  assert.deepEqual(chips.map((c) => c.kana), ["にじゅう", "よんぷん"]);
  assert.deepEqual(chips.map((c) => c.value), [20, 4]);
});

test("minuteToChips: 20 en punto de decena = un solo bloque", () => {
  const chips = minuteToChips(20);
  assert.deepEqual(chips.map((c) => c.kana), ["にじゅっぷん"]);
  assert.deepEqual(chips.map((c) => c.value), [20]);
});

// ── timeToChips / timeToKana ──────────────────────────────────────────────────

test("timeToChips: 17:00 pm → ごご・ごじ (sin ficha de minuto)", () => {
  const chips = timeToChips(5, 0, "pm");
  assert.deepEqual(chips.map((c) => c.kana), ["ごご", "ごじ"]);
  assert.equal(timeToKana({ hour: 5, minute: 0, period: "pm" }), "ごごごじ");
});

test("timeToChips: 19:26 pm → ごご・しちじ・にじゅう・ろっぷん", () => {
  const chips = timeToChips(7, 26, "pm");
  assert.deepEqual(chips.map((c) => c.kana), ["ごご", "しちじ", "にじゅう", "ろっぷん"]);
});

test("timeToChips: minute 30 con useHan usa はん en vez de さんじゅっぷん", () => {
  const withHan = timeToChips(3, 30, "am", true);
  assert.deepEqual(withHan.map((c) => c.kana), ["ごぜん", "さんじ", "はん"]);
  const withoutHan = timeToChips(3, 30, "am", false);
  assert.deepEqual(withoutHan.map((c) => c.kana), ["ごぜん", "さんじ", "さんじゅっぷん"]);
});

test("timeToChips: rango inválido lanza error", () => {
  assert.throws(() => timeToChips(0, 0, "am"));
  assert.throws(() => timeToChips(13, 0, "am"));
  assert.throws(() => timeToChips(1, 60, "am"));
});

// ── buildTimeOptions: nunca repite un tiempo ─────────────────────────────────

test("buildTimeOptions: 4 opciones únicas que incluyen la correcta", () => {
  for (let i = 0; i < 50; i++) {
    const correct = { hour: 1 + Math.floor(Math.random() * 12), minute: Math.floor(Math.random() * 60), period: Math.random() < 0.5 ? "am" as const : "pm" as const };
    const options = buildTimeOptions(correct);
    assert.equal(options.length, 4);
    const keys = new Set(options.map((o) => `${o.period}-${o.hour}-${o.minute}`));
    assert.equal(keys.size, 4, "opciones duplicadas");
    assert.ok(options.some((o) => o.hour === correct.hour && o.minute === correct.minute && o.period === correct.period));
  }
});

// ── buildTimeChipDistractors ──────────────────────────────────────────────────

test("buildTimeChipDistractors: no repite bloques de la hora y trae trampas de irregulares", () => {
  const chips = timeToChips(4, 6, "pm"); // よじ (irr) + ろっぷん (irr)
  const distractors = buildTimeChipDistractors(chips);
  assert.equal(distractors.length, 3);
  const usedKana = new Set(chips.map((c) => c.kana));
  for (const d of distractors) assert.ok(!usedKana.has(d.kana));
  assert.ok(distractors.some((d) => d.kana === "よんじ" || d.kana === "ろくふん"), "sin trampa de irregular");
});

// ── randomTimeForLevel ────────────────────────────────────────────────────────

test("randomTimeForLevel: respeta el eje de dificultad de cada nivel", () => {
  for (const level of TIME_BUILD_LEVELS) {
    for (let i = 0; i < 100; i++) {
      const t = randomTimeForLevel(level.id);
      assert.ok(t.hour >= 1 && t.hour <= 12);
      assert.ok(t.minute >= 0 && t.minute <= 59);
      assert.equal(typeof timeToKana(t, t.useHan), "string"); // nunca lanza
      if (level.id === "hour") assert.equal(t.minute, 0);
      if (level.id === "half") assert.equal(t.minute, 30);
    }
  }
});

test("randomTimeForLevel: todos los niveles generan am y pm (no solo pm)", () => {
  for (const level of TIME_BUILD_LEVELS) {
    const periods = new Set<string>();
    for (let i = 0; i < 200; i++) periods.add(randomTimeForLevel(level.id).period);
    assert.deepEqual([...periods].sort(), ["am", "pm"], `nivel ${level.id} solo produce un period`);
  }
});

test("randomEntriesForBuild: sin repetir entradas dentro de una serie de 10 (hora)", () => {
  for (const level of TIME_BUILD_LEVELS) {
    for (let i = 0; i < 20; i++) {
      const entries = randomEntriesForBuild("hora", level.id, "full", 10);
      assert.equal(entries.length, 10);
      const keys = new Set(entries.map((e) => entryKey("hora", e)));
      assert.equal(keys.size, 10, `nivel ${level.id}: entradas repetidas en la serie`);
    }
  }
});

// ── Fechas — días de la semana / meses / días del mes (fast-follow #17) ──────

test("KEY_WEEKDAYS: 7 días, sin irregulares", () => {
  assert.equal(KEY_WEEKDAYS.length, 7);
  assert.equal(KEY_WEEKDAYS.find((w) => w.value === 1)!.hiragana, "げつようび");
  assert.equal(KEY_WEEKDAYS.find((w) => w.value === 7)!.hiragana, "にちようび");
});

test("KEY_MONTHS: 12 meses, 3 irregulares (4, 7, 9)", () => {
  assert.equal(KEY_MONTHS.length, 12);
  const irregulares = KEY_MONTHS.filter((m) => m.irregular).map((m) => m.value).sort((a, b) => a - b);
  assert.deepEqual(irregulares, [4, 7, 9]);
  assert.equal(KEY_MONTHS.find((m) => m.value === 4)!.hiragana, "しがつ");
  assert.equal(KEY_MONTHS.find((m) => m.value === 7)!.hiragana, "しちがつ");
  assert.equal(KEY_MONTHS.find((m) => m.value === 9)!.hiragana, "くがつ");
});

test("KEY_DAYS_OF_MONTH: 31 días, lecturas de la spec (1,2,4,9,10,11,14,19,20,24,29,30,31)", () => {
  assert.equal(KEY_DAYS_OF_MONTH.length, 31);
  const readingFor = (v: number) => KEY_DAYS_OF_MONTH.find((d) => d.value === v)!.hiragana;
  assert.equal(readingFor(1), "ついたち");
  assert.equal(readingFor(2), "ふつか");
  assert.equal(readingFor(4), "よっか");
  assert.equal(readingFor(9), "ここのか");
  assert.equal(readingFor(10), "とおか");
  assert.equal(readingFor(11), "じゅういちにち");
  assert.equal(readingFor(14), "じゅうよっか");
  assert.equal(readingFor(19), "じゅうくにち");
  assert.equal(readingFor(20), "はつか");
  assert.equal(readingFor(24), "にじゅうよっか");
  assert.equal(readingFor(29), "にじゅうくにち");
  assert.equal(readingFor(30), "さんじゅうにち");
  assert.equal(readingFor(31), "さんじゅういちにち");
});

// ── dateToKana / formatDateValue — un nivel por eje ──────────────────────────

test("dateToKana/formatDateValue: día de la semana solo", () => {
  assert.equal(dateToKana({ weekday: 6 }), "どようび");
  assert.equal(formatDateValue({ weekday: 6 }), "sábado");
});

test("dateToKana/formatDateValue: mes solo", () => {
  assert.equal(dateToKana({ month: 9 }), "くがつ");
  assert.equal(formatDateValue({ month: 9 }), "septiembre");
});

test("dateToKana/formatDateValue: día del mes solo", () => {
  assert.equal(dateToKana({ day: 20 }), "はつか");
  assert.equal(formatDateValue({ day: 20 }), "Día 20");
});

test("dateToKana/formatDateValue: año solo reutiliza numberToChips + ねん", () => {
  assert.equal(dateToKana({ year: 1989 }), "せんきゅうひゃくはちじゅうきゅうねん");
  assert.equal(formatDateValue({ year: 1989 }), "1989");
});

test("dateToKana/formatDateValue: fecha completa año+mes+día", () => {
  assert.equal(dateToKana({ year: 2024, month: 3, day: 15 }), "にせんにじゅうよんねんさんがつじゅうごにち");
  assert.equal(formatDateValue({ year: 2024, month: 3, day: 15 }), "15/03/2024");
});

// ── buildDateOptions: nunca repite una fecha ─────────────────────────────────

test("buildDateOptions: 4 opciones únicas por nivel, siempre incluye la correcta", () => {
  for (const level of DATE_BUILD_LEVELS) {
    for (let i = 0; i < 30; i++) {
      const correct = randomDateForLevel(level.id);
      const options = buildDateOptions(correct);
      assert.equal(options.length, 4);
      const keys = new Set(options.map(dateKey));
      assert.equal(keys.size, 4, `opciones duplicadas en nivel ${level.id}`);
      assert.ok(options.some((o) => dateKey(o) === dateKey(correct)));
    }
  }
});

test("randomDateForLevel: solo puebla los campos del nivel", () => {
  for (let i = 0; i < 50; i++) {
    const weekdayOnly = randomDateForLevel("weekday");
    assert.equal(weekdayOnly.month, undefined);
    assert.ok(weekdayOnly.weekday! >= 1 && weekdayOnly.weekday! <= 7);
    assert.equal(randomDateForLevel("month").day, undefined);
    const full = randomDateForLevel("full");
    assert.ok(full.year !== undefined && full.month !== undefined && full.day !== undefined);
    assert.ok(full.day! >= 1 && full.day! <= 28); // capado para no depender del mes
  }
});

// ── Combo "Fecha y hora" ──────────────────────────────────────────────────────

test("comboToKana/formatCombo: fecha completa + hora en una sola lectura", () => {
  const combo = { date: { year: 2024, month: 3, day: 15 }, time: { hour: 7, minute: 0, period: "pm" as const } };
  assert.equal(comboToKana(combo), "にせんにじゅうよんねんさんがつじゅうごにちごごしちじ");
  assert.equal(formatCombo(combo), "15/03/2024 7:00 p. m.");
});

test("randomDateTimeCombo: siempre genera fecha completa + hora válidas", () => {
  for (let i = 0; i < 30; i++) {
    const combo = randomDateTimeCombo();
    assert.ok(combo.date.year !== undefined && combo.date.month !== undefined && combo.date.day !== undefined);
    assert.ok(combo.time.hour >= 1 && combo.time.hour <= 12);
    assert.equal(typeof comboToKana(combo), "string");
  }
});
