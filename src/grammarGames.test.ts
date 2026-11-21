import { test } from "node:test";
import assert from "node:assert/strict";
import { GRAMMAR_LESSONS, QUESTION_WORDS, type GrammarOrderExercise, type GrammarParticleExercise } from "./grammar";
import { toExtraOrder, toSpot } from "./grammarGames";
import { forbiddenSwaps } from "./grammarBuild";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Pares (ordenar, hueco) de cada oración de todas las lecciones. */
function pairs() {
  const out: { lesson: string; order: GrammarOrderExercise; particle: GrammarParticleExercise }[] = [];
  for (const l of GRAMMAR_LESSONS) {
    for (const order of l.exercises) {
      if (order.type !== "order") continue;
      const particle = l.exercises.find((e): e is GrammarParticleExercise => e.type === "particle" && e.sid === order.sid);
      if (particle) out.push({ lesson: l.id, order, particle });
    }
  }
  return out;
}

// ── Cambios prohibidos ───────────────────────────────────────────────────────

test("forbiddenSwaps: に⇄へ, に⇄と, は⇄が⇄も, を→は y las alternativas declaradas", () => {
  assert.deepEqual([...forbiddenSwaps(["がっこう", "へ", "いきます"])].sort(), ["に"]);
  assert.deepEqual([...forbiddenSwaps(["わたし", "は", "がくせい", "です"])].sort(), ["が", "も"].sort());
  assert.ok(forbiddenSwaps(["はは", "と", "はなしました"]).has("に"));
  assert.ok(forbiddenSwaps(["パン", "を", "たべます"]).has("は"));
  assert.ok(forbiddenSwaps(["パン", "を", "たべます"], ["で"]).has("で"));
});

test("ordenar con trampas: «はは と はなしました» nunca trae un に de más", () => {
  for (const { order, particle } of pairs()) {
    if (!order.tokens.includes("と")) continue;
    const ex = toExtraOrder(order, particle);
    if (ex) assert.ok(!ex.extras.includes("に"), order.tokens.join(" "));
  }
});

// ── Ordenar con trampas ──────────────────────────────────────────────────────

test("ordenar con trampas: 1–2 fichas sobrantes, nunca la respuesta ni un cambio válido", () => {
  for (const { lesson, order, particle } of pairs()) {
    const ex = toExtraOrder(order, particle);
    if (!ex) continue; // sin trampas seguras para esta oración: el juego usa otra
    assert.deepEqual(ex.tokens, order.tokens);
    assert.ok(ex.extras.length >= 1 && ex.extras.length <= 2);
    const forbidden = forbiddenSwaps(order.tokens, particle.alt);
    for (const e of ex.extras) {
      assert.notEqual(e, particle.answer);
      assert.ok(!forbidden.has(e), `${lesson}: ${order.tokens.join(" ")} + ${e}`);
    }
  }
});

test("ordenar con trampas: en へ nunca sobra un に (sería igual de válido)", () => {
  for (const { order, particle } of pairs()) {
    if (!order.tokens.includes("へ")) continue;
    assert.ok(!toExtraOrder(order, particle)!.extras.includes("に"), order.tokens.join(" "));
  }
});

// ── Encuentra el error ───────────────────────────────────────────────────────

test("encuentra el error: una sola ficha cambiada, por un distractor no válido", () => {
  for (const { lesson, order, particle } of pairs()) {
    for (let seed = 0; seed < 5; seed++) {
      const ex = toSpot(order, particle, seeded(seed));
      assert.ok(ex, `${lesson}: ${order.tokens.join(" ")}`);
      assert.deepEqual(ex.correctTokens, order.tokens);
      const diffs = ex.tokens.map((t, i) => (t !== ex.correctTokens[i] ? i : -1)).filter((i) => i >= 0);
      assert.deepEqual(diffs, [ex.wrongIndex], `${lesson}: ${ex.tokens.join(" ")}`);
      assert.equal(ex.correct, particle.answer);
      const wrong = ex.tokens[ex.wrongIndex];
      assert.ok(particle.options.includes(wrong));
      assert.ok(!forbiddenSwaps(order.tokens, particle.alt).has(wrong), `${lesson}: ${wrong}`);
    }
  }
});

// ── Pregunta → respuesta ─────────────────────────────────────────────────────

test("pregunta→respuesta: hay pares en las lecciones de partículas del curso 2", () => {
  for (const id of ["particula-ni", "kara-made", "particula-to", "particula-de", "particula-he", "lugar-ni-he-de", "particula-wo", "particula-ga", "existencia-arimasu-imasu"]) {
    const l = GRAMMAR_LESSONS.find((x) => x.id === id)!;
    assert.ok(l.qaExercises.length >= 4, `${id}: ${l.qaExercises.length}`);
  }
});

test("pregunta→respuesta: 4 opciones únicas con la respuesta y sin alternativas válidas", () => {
  for (const l of GRAMMAR_LESSONS) {
    for (const ex of l.qaExercises) {
      const where = `${l.id}: ${ex.question.join("")} → ${ex.sentence}`;
      assert.equal(ex.options.length, 4, where);
      assert.equal(new Set(ex.options).size, 4, where);
      assert.ok(ex.options.includes(ex.answer), where);
      for (const a of ex.alt ?? []) assert.ok(!ex.options.includes(a), where);
      assert.equal(ex.parts.filter((p) => p === "＿").length, 1, where);
      assert.equal(ex.question[ex.question.length - 1], "か", `${where}: la pregunta termina en か`);
    }
  }
});

test("pregunta→respuesta: el hueco es la partícula que acompaña a la palabra de pregunta", () => {
  for (const l of GRAMMAR_LESSONS) {
    for (const ex of l.qaExercises) {
      if (ex.kind !== "particle") continue;
      const i = ex.question.findIndex((t) => QUESTION_WORDS.includes(t));
      assert.ok(i >= 0, `${l.id}: ${ex.question.join(" ")}`);
      assert.equal(ex.question[i + 1], ex.answer, `${l.id}: ${ex.question.join(" ")} → ${ex.sentence}`);
    }
  }
});
