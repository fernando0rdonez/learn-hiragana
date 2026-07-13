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
