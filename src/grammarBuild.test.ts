import { test } from "node:test";
import assert from "node:assert/strict";
import { GRAMMAR_LESSONS, type GrammarParticleExercise } from "./grammar";
import {
  splitMora, buildExtras, makePuzzle, isBuildCorrect, wrongSlots, toBuildExercise,
  BUILD_LEVELS, type GrammarBuildExercise, type BuildLevel,
} from "./grammarBuild";

/** Generador determinista para que los tests no dependan del azar. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const ex = (jp: string, extra: Partial<GrammarBuildExercise> = {}): GrammarBuildExercise =>
  ({ type: "build", tokens: jp.split(" "), translation: "", ...extra });

// ── splitMora ────────────────────────────────────────────────────────────────

test("splitMora: una ficha por kana simple", () => {
  assert.deepEqual(splitMora("わたし"), ["わ", "た", "し"]);
});

test("splitMora: los yōon (きょ, しゃ…) son una sola ficha", () => {
  assert.deepEqual(splitMora("きょう"), ["きょ", "う"]);
  assert.deepEqual(splitMora("しゃしん"), ["しゃ", "し", "ん"]);
  assert.deepEqual(splitMora("べんきょうします"), ["べ", "ん", "きょ", "う", "し", "ま", "す"]);
});

test("splitMora: っ, ん y ー van solas", () => {
  assert.deepEqual(splitMora("がっこう"), ["が", "っ", "こ", "う"]);
  assert.deepEqual(splitMora("コーヒー"), ["コ", "ー", "ヒ", "ー"]);
  assert.deepEqual(splitMora("ジュース"), ["ジュ", "ー", "ス"]);
});

test("splitMora reconstruye la palabra original en todas las oraciones", () => {
  for (const l of GRAMMAR_LESSONS) for (const s of l.sentences) for (const w of s.jp.split(" ")) {
    assert.equal(splitMora(w).join(""), w);
  }
});

// ── Sílabas extra ────────────────────────────────────────────────────────────

test("las trampas de ortografía de partículas salen primero (は→わ, を→お, へ→え)", () => {
  const extras = buildExtras(ex("わたし は パン を たべます"), 2, seeded(1));
  // わ sale aunque わたし ya tenga una わ: esa ficha de más es justo la trampa.
  assert.deepEqual([...extras].sort(), ["お", "わ"].sort());
});

test("nunca se ofrece como extra una partícula alternativa válida ni el cambio は⇄が", () => {
  const e = ex("わたし は がっこう へ いきます", { alt: ["に"] });
  for (let seed = 0; seed < 200; seed++) {
    const extras = buildExtras(e, 10, seeded(seed));
    assert.ok(!extras.includes("に"), `seed ${seed}: ${extras}`);
    assert.ok(!extras.includes("が"), `seed ${seed}: ${extras}`);
  }
});

test("los extras no repiten sílabas ni usan sílabas de la oración", () => {
  const e = ex("わたし は まいにち にほんご を べんきょうします");
  const extras = buildExtras(e, 10, seeded(7));
  assert.equal(extras.length, 10);
  assert.equal(new Set(extras).size, 10);
  const present = new Set(e.tokens.flatMap(splitMora));
  const traps = new Set(["わ", "お"]); // trampas de は y を: pueden repetir una sílaba de la oración
  for (const m of extras) if (!traps.has(m)) assert.ok(!present.has(m), m);
});

test("cada nivel añade su número de extras en todas las oraciones", () => {
  for (const level of Object.keys(BUILD_LEVELS) as BuildLevel[]) {
    for (const l of GRAMMAR_LESSONS) for (const o of l.exercises) {
      if (o.type !== "order") continue;
      const p = makePuzzle(toBuildExercise(o), level, seeded(3));
      assert.equal(p.tiles.length, p.target.length + BUILD_LEVELS[level].extras, `${l.id}: ${o.tokens.join(" ")}`);
    }
  }
});

test("en へ, la alternativa に de la lección nunca aparece como ficha extra", () => {
  const lesson = GRAMMAR_LESSONS.find((l) => l.id === "particula-he")!;
  for (const o of lesson.exercises) {
    if (o.type !== "order") continue;
    const alt = lesson.exercises.find((e): e is GrammarParticleExercise => e.type === "particle" && e.sid === o.sid)?.alt;
    const p = makePuzzle(toBuildExercise(o, alt), "dificil", seeded(11));
    const target = new Set(p.target);
    const extras = p.tiles.map((t) => t.mora).filter((m) => !target.has(m));
    assert.ok(!extras.includes("に"), o.tokens.join(" "));
  }
});

// ── Comprobación ─────────────────────────────────────────────────────────────

test("el banco contiene todas las sílabas de la respuesta", () => {
  const p = makePuzzle(ex("きのう ともだち と えいが を みました"), "normal", seeded(5));
  const bank = p.tiles.map((t) => t.mora);
  for (const m of p.target) {
    const i = bank.indexOf(m);
    assert.ok(i >= 0, m);
    bank.splice(i, 1);
  }
});

test("isBuildCorrect acepta el orden canónico y los alternativos", () => {
  const e = ex("わたし は きのう すし を たべました", { accept: [["きのう", "わたし", "は", "すし", "を", "たべました"]] });
  assert.ok(isBuildCorrect(splitMora("わたしはきのうすしをたべました"), e));
  assert.ok(isBuildCorrect(splitMora("きのうわたしはすしをたべました"), e));
  assert.ok(!isBuildCorrect(splitMora("わたしわきのうすしをたべました"), e));
});

test("wrongSlots marca solo las casillas distintas", () => {
  assert.deepEqual(wrongSlots(["わ", "た", "し", "わ"], ["わ", "た", "し", "は"]), [false, false, false, true]);
  assert.deepEqual(wrongSlots(["わ", null], ["わ", "た"]), [false, true]);
});
