import { test } from "node:test";
import assert from "node:assert/strict";
import { GRAMMAR_LESSONS, PARTICLES, type GrammarParticleExercise } from "./grammar";
import { PARTICLE_TRAIN } from "./particleTrain";

const LESSON_IDS = new Set(GRAMMAR_LESSONS.map((l) => l.id));

test("ids de lección únicos", () => {
  assert.equal(LESSON_IDS.size, GRAMMAR_LESSONS.length);
});

test("se conservan los ids existentes (el progreso guardado depende de ellos)", () => {
  for (const id of [
    "estructura-desu", "negacion-janai", "copula-pasado-negativo", "pregunta-ka",
    "particula-ga", "particula-wo", "particula-ni", "particula-de", "particula-he",
    "particula-to", "particula-mo", "particula-no", "verbos-masu", "verbos-masen",
    "verbos-mashita", "verbos-masendeshita", "adjetivos-i", "adjetivos-na",
    "demostrativos-kosoare", "existencia-arimasu-imasu", "gustos-suki-hoshii-tai",
  ]) {
    assert.ok(LESSON_IDS.has(id), `falta la lección ${id}`);
  }
});

test("orden del libro: Básico I → Básico II → Extra", () => {
  const order = ["Japonés Básico I", "Japonés Básico II", "Extra"];
  const ranks = GRAMMAR_LESSONS.map((l) => order.indexOf(l.section));
  assert.ok(ranks.every((r) => r >= 0));
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
});

test("cada lección tiene suficientes oraciones y ninguna repetida", () => {
  for (const l of GRAMMAR_LESSONS) {
    assert.ok(l.sentences.length >= 10, `${l.id}: solo ${l.sentences.length} oraciones`);
    const jp = l.sentences.map((s) => s.jp);
    assert.equal(new Set(jp).size, jp.length, `${l.id}: oración repetida`);
  }
});

test("cada oración genera un ejercicio de ordenar y uno de hueco", () => {
  for (const l of GRAMMAR_LESSONS) {
    l.sentences.forEach((s, sid) => {
      const exs = l.exercises.filter((e) => e.sid === sid);
      assert.ok(exs.some((e) => e.type === "order"), `${l.id}#${sid}: sin "order"`);
      assert.ok(exs.some((e) => e.type === "particle"), `${l.id}#${sid}: sin hueco («${s.jp}»)`);
    });
  }
});

test("los huecos tienen 4 opciones únicas, con la respuesta y sin alternativas válidas", () => {
  for (const l of GRAMMAR_LESSONS) {
    for (const ex of l.exercises) {
      if (ex.type !== "particle") continue;
      const where = `${l.id}: ${ex.sentence}`;
      assert.equal(ex.options.length, 4, `${where} → ${ex.options.join(",")}`);
      assert.equal(new Set(ex.options).size, 4, `${where}: opciones repetidas`);
      assert.ok(ex.options.includes(ex.answer), `${where}: falta la respuesta`);
      for (const a of ex.alt ?? []) assert.ok(!ex.options.includes(a), `${where}: ofrece la alternativa ${a}`);
      assert.equal((ex.sentence.match(/＿/g) ?? []).length, 1, `${where}: debe tener un solo hueco`);
    }
  }
});

test("kind distingue partículas de formas gramaticales", () => {
  for (const l of GRAMMAR_LESSONS) {
    for (const ex of l.exercises.filter((e): e is GrammarParticleExercise => e.type === "particle")) {
      assert.equal(ex.kind, PARTICLES.includes(ex.answer) ? "particle" : "form");
    }
  }
});

test("las opciones de una forma son del mismo tipo (no se mezclan partículas)", () => {
  for (const l of GRAMMAR_LESSONS) {
    for (const ex of l.exercises.filter((e): e is GrammarParticleExercise => e.type === "particle")) {
      const particleOpts = ex.options.filter((o) => PARTICLES.includes(o)).length;
      if (ex.kind === "form") assert.equal(particleOpts, 0, `${l.id}: ${ex.sentence} → ${ex.options}`);
      else assert.equal(particleOpts, 4, `${l.id}: ${ex.sentence} → ${ex.options}`);
    }
  }
});

test("conjugaciones: el hueco ofrece las otras formas del mismo verbo", () => {
  const lesson = GRAMMAR_LESSONS.find((l) => l.id === "verbos-masen")!;
  const ex = lesson.exercises.find((e): e is GrammarParticleExercise => e.type === "particle" && e.answer === "たべません")!;
  assert.deepEqual([...ex.options].sort(), ["たべます", "たべません", "たべました", "たべませんでした"].sort());
});

test("へ acepta に como alternativa y no la ofrece como distractor", () => {
  const lesson = GRAMMAR_LESSONS.find((l) => l.id === "particula-he")!;
  for (const ex of lesson.exercises) {
    if (ex.type === "particle") assert.ok(!ex.options.includes("に"));
  }
});

test("el tren de partículas solo apunta a lecciones existentes", () => {
  for (const st of PARTICLE_TRAIN) {
    for (const id of st.lessonIds) assert.ok(LESSON_IDS.has(id), `estación ${st.role} → ${id}`);
  }
});

test("los órdenes alternativos usan exactamente las mismas fichas", () => {
  const key = (t: string[]) => [...t].sort().join("|");
  let withAlt = 0;
  for (const l of GRAMMAR_LESSONS) {
    for (const ex of l.exercises) {
      if (ex.type !== "order" || !ex.accept) continue;
      withAlt++;
      for (const alt of ex.accept) {
        assert.equal(key(alt), key(ex.tokens), `${l.id}: ${alt.join(" ")}`);
        assert.notDeepEqual(alt, ex.tokens);
      }
    }
  }
  assert.ok(withAlt > 0);
});

test("una palabra de tiempo sin partícula puede ir antes del tema", () => {
  const lesson = GRAMMAR_LESSONS.find((l) => l.id === "verbos-mashita")!;
  const ex = lesson.exercises.find((e) => e.type === "order" && e.tokens.join("") === "わたしはきのうすしをたべました");
  assert.ok(ex && ex.type === "order");
  assert.deepEqual(ex.accept, [["きのう", "わたし", "は", "すし", "を", "たべました"]]);
});

// ── Lecturas de repaso (Fase 4) ──────────────────────────────────────────────

test("la lectura de repaso cierra el curso 2 (antes de Extra)", () => {
  const ids = GRAMMAR_LESSONS.map((l) => l.id);
  const i = ids.indexOf("lectura-repaso-2");
  assert.ok(i > 0);
  assert.equal(GRAMMAR_LESSONS[i].section, "Japonés Básico II");
  assert.equal(GRAMMAR_LESSONS[i + 1].section, "Extra");
});

test("las líneas de las lecturas son las oraciones de la lección", () => {
  const l = GRAMMAR_LESSONS.find((x) => x.id === "lectura-repaso-2")!;
  assert.ok((l.readings?.length ?? 0) >= 3);
  assert.deepEqual(l.sentences.map((s) => s.jp), l.readings!.flatMap((r) => r.lines.map((x) => x.jp)));
});

test("cada lectura tiene 5+ preguntas con 4 opciones únicas que incluyen la respuesta", () => {
  const l = GRAMMAR_LESSONS.find((x) => x.id === "lectura-repaso-2")!;
  const readingIds = new Set<string>();
  for (const r of l.readings!) {
    readingIds.add(r.id);
    assert.ok(r.lines.length >= 5, r.id);
    assert.ok(r.questions.length >= 5, r.id);
    for (const q of r.questions) {
      assert.equal(q.options.length, 4, `${r.id}: ${q.q}`);
      assert.equal(new Set(q.options).size, 4, `${r.id}: ${q.q}`);
      assert.ok(q.options.includes(q.answer), `${r.id}: ${q.q}`);
      assert.ok(q.why.length > 0);
    }
  }
  assert.equal(readingIds.size, l.readings!.length, "ids de lectura repetidos");
});

test("las respuestas en japonés de las lecturas salen del texto", () => {
  const l = GRAMMAR_LESSONS.find((x) => x.id === "lectura-repaso-2")!;
  for (const r of l.readings!) {
    const text = r.lines.map((x) => x.jp.replace(/ /g, "")).join("");
    for (const q of r.questions) {
      if (!q.jp) continue;
      // La respuesta (sin espacios) aparece literalmente en el texto, salvo el sujeto omitido.
      const core = q.answer.replace(/ /g, "");
      assert.ok(text.includes(core) || text.includes(core.replace(/^.+?が/, "")), `${r.id}: ${q.answer}`);
    }
  }
});
