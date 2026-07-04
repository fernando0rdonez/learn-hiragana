import { test } from "node:test";
import assert from "node:assert/strict";
import {
  numberToKana,
  numberToChips,
  buildKeyOptions,
  buildChipDistractors,
  randomNumberForLevel,
  KEY_NUMBERS,
  BUILD_LEVELS,
  IRREGULAR_TRAPS,
} from "./numbers";

// ── numberToKana: ejemplos del libro de texto ────────────────────────────────

test("2027 = にせんにじゅうなな", () => {
  assert.equal(numberToKana(2027), "にせんにじゅうなな");
});

test("1523 = せんごひゃくにじゅうさん", () => {
  assert.equal(numberToKana(1523), "せんごひゃくにじゅうさん");
});

test("7286 = ななせんにひゃくはちじゅうろく", () => {
  assert.equal(numberToKana(7286), "ななせんにひゃくはちじゅうろく");
});

test("5438 = ごせんよんひゃくさんじゅうはち", () => {
  assert.equal(numberToKana(5438), "ごせんよんひゃくさんじゅうはち");
});

test("4638 = よんせんろっぴゃくさんじゅうはち", () => {
  assert.equal(numberToKana(4638), "よんせんろっぴゃくさんじゅうはち");
});

// ── Las 5 formas irregulares aisladas ────────────────────────────────────────

test("irregulares: 300, 600, 800, 3000, 8000", () => {
  assert.equal(numberToKana(300), "さんびゃく");
  assert.equal(numberToKana(600), "ろっぴゃく");
  assert.equal(numberToKana(800), "はっぴゃく");
  assert.equal(numberToKana(3000), "さんぜん");
  assert.equal(numberToKana(8000), "はっせん");
});

// ── Regulares y lecturas de compuesto ────────────────────────────────────────

test("básicos: unidades, decenas, centena y millar desnudos", () => {
  assert.equal(numberToKana(1), "いち");
  assert.equal(numberToKana(4), "よん");   // lectura de compuesto, no し
  assert.equal(numberToKana(7), "なな");
  assert.equal(numberToKana(9), "きゅう");
  assert.equal(numberToKana(10), "じゅう");
  assert.equal(numberToKana(14), "じゅうよん");
  assert.equal(numberToKana(40), "よんじゅう");
  assert.equal(numberToKana(100), "ひゃく");  // sin いち
  assert.equal(numberToKana(1000), "せん");   // sin いち
});

test("まん: 10000 lleva いち obligatorio", () => {
  assert.equal(numberToKana(10000), "いちまん");
  assert.equal(numberToKana(20000), "にまん");
  assert.equal(numberToKana(11000), "いちまんせん");
  assert.equal(numberToKana(99999), "きゅうまんきゅうせんきゅうひゃくきゅうじゅうきゅう");
});

test("ceros intermedios se omiten", () => {
  assert.equal(numberToKana(1001), "せんいち");
  assert.equal(numberToKana(5008), "ごせんはち");
  assert.equal(numberToKana(40600), "よんまんろっぴゃく");
});

test("fuera de rango lanza error", () => {
  assert.throws(() => numberToKana(0));
  assert.throws(() => numberToKana(100000));
  assert.throws(() => numberToKana(3.5));
});

// ── numberToChips ────────────────────────────────────────────────────────────

test("chips de 4638: bloques y créditos SRS", () => {
  const chips = numberToChips(4638);
  assert.deepEqual(chips.map((c) => c.kana), ["よんせん", "ろっぴゃく", "さんじゅう", "はち"]);
  assert.deepEqual(chips.map((c) => c.credits), [[4000], [600], [3, 10], [8]]);
});

test("chips de 25010: まん acredita cifra y 10000", () => {
  const chips = numberToChips(25010);
  assert.deepEqual(chips.map((c) => c.kana), ["にまん", "ごせん", "じゅう"]);
  assert.deepEqual(chips.map((c) => c.credits), [[2, 10000], [5000], [10]]);
});

// ── Datos y generación ───────────────────────────────────────────────────────

test("KEY_NUMBERS: 29 bloques, 5 irregulares", () => {
  assert.equal(KEY_NUMBERS.length, 29);
  const irregulares = KEY_NUMBERS.filter((k) => k.irregular).map((k) => k.value).sort((a, b) => a - b);
  assert.deepEqual(irregulares, [300, 600, 800, 3000, 8000]);
});

test("buildKeyOptions: 4 opciones únicas que incluyen la correcta y una trampa del irregular", () => {
  for (const value of [300, 600, 800, 3000, 8000]) {
    const key = KEY_NUMBERS.find((k) => k.value === value)!;
    const options = buildKeyOptions(key);
    assert.equal(options.length, 4);
    assert.equal(new Set(options).size, 4);
    assert.ok(options.includes(key.hiragana));
    assert.ok(options.some((o) => IRREGULAR_TRAPS[value].includes(o)), `sin trampa para ${value}`);
  }
});

test("buildChipDistractors: no repite bloques del número y trae la trampa del irregular", () => {
  const chips = numberToChips(4638); // contiene ろっぴゃく (600, irregular)
  const distractors = buildChipDistractors(chips);
  assert.equal(distractors.length, 3);
  const chipKanas = new Set(chips.map((c) => c.kana));
  for (const d of distractors) assert.ok(!chipKanas.has(d.kana));
  assert.ok(distractors.some((d) => IRREGULAR_TRAPS[600].includes(d.kana)), "sin trampa de 600");
});

test("randomNumberForLevel respeta el rango de cada nivel", () => {
  for (const level of BUILD_LEVELS) {
    for (let i = 0; i < 200; i++) {
      const n = randomNumberForLevel(level);
      assert.ok(n >= level.min && n <= level.max, `${n} fuera de ${level.id}`);
      assert.equal(typeof numberToKana(n), "string"); // nunca lanza
    }
  }
});
