import { test } from "node:test";
import assert from "node:assert/strict";
import { buildExam, EXAM_TOPICS, EXAM_TOPIC_REVIEW_VIEW } from "./exam/examBank";
import { numberToKana } from "./numbers";
import { gradeExam, gradeQuestion, normalizeAnswer, PASS_THRESHOLD } from "./exam/grade";
import type { ExamQuestion } from "./exam/examBank";

// ── examBank ────────────────────────────────────────────────────────────────

test("buildExam(40) devuelve 40 preguntas", () => {
  assert.equal(buildExam(40).length, 40);
});

test("buildExam cubre todos los temas y da respuestas no vacías", () => {
  const qs = buildExam(40);
  const topics = new Set(qs.map((q) => q.topic));
  for (const t of EXAM_TOPICS) assert.ok(topics.has(t), `falta el tema ${t}`);
  for (const q of qs) {
    assert.ok(q.prompt.length > 0, `prompt vacío en ${q.id}`);
    if (q.kind === "tokens") assert.ok((q.tokens ?? []).length > 0, `tokens vacíos en ${q.id}`);
    else assert.ok(q.answer.length > 0, `answer vacía en ${q.id}`);
  }
});

test("cada tema tiene una vista de repaso válida", () => {
  for (const t of EXAM_TOPICS) assert.ok(EXAM_TOPIC_REVIEW_VIEW[t], `sin repaso para ${t}`);
});

test("las preguntas de números concuerdan con numberToKana", () => {
  const qs = buildExam(120).filter((q) => q.topic === "numeros");
  for (const q of qs) {
    const value = Number(q.prompt.match(/(\d+)/)?.[1]);
    assert.equal(q.answer, numberToKana(value));
  }
});

// ── grade ───────────────────────────────────────────────────────────────────

test("normalizeAnswer ignora espacios, puntuación y tildes", () => {
  assert.equal(normalizeAnswer("  Sensē. "), normalizeAnswer("sense"));
  assert.equal(normalizeAnswer("わたし は がくせい です"), "わたしはがくせいです");
});

const textQ = (answer: string, accepted?: string[]): ExamQuestion => ({
  id: "q", topic: "escritura", prompt: "", answer, accepted, kind: "text",
});

test("gradeQuestion acepta variantes y respuesta canónica", () => {
  assert.equal(gradeQuestion(textQ("は"), "は").correct, true);
  assert.equal(gradeQuestion(textQ("わたしはがくせいではありません", ["わたしはがくせいじゃないです"]), "わたしはがくせいじゃないです").correct, true);
  assert.equal(gradeQuestion(textQ("は"), "が").correct, false);
  assert.equal(gradeQuestion(textQ("は"), "").correct, false);
});

test("gradeQuestion tokens compara el orden exacto", () => {
  const q: ExamQuestion = { id: "t", topic: "traduccion", prompt: "", answer: "", kind: "tokens", tokens: ["わたし", "は", "がくせい", "です"] };
  assert.equal(gradeQuestion(q, ["わたし", "は", "がくせい", "です"]).correct, true);
  assert.equal(gradeQuestion(q, ["は", "わたし", "がくせい", "です"]).correct, false);
  assert.equal(gradeQuestion(q, ["わたし", "は", "がくせい"]).correct, false);
});

test("gradeExam agrega por tema y aplica el umbral de aprobado", () => {
  const questions: ExamQuestion[] = [
    textQ("a"), textQ("b"), textQ("c"), textQ("d"),
  ].map((q, i) => ({ ...q, id: `q${i}` }));
  const pass = gradeExam(questions, { q0: "a", q1: "b", q2: "c", q3: "wrong" });
  assert.equal(pass.overall.correct, 3);
  assert.equal(pass.overall.pct, 75);
  assert.equal(pass.overall.passed, 0.75 >= PASS_THRESHOLD);
  assert.equal(pass.byTopic.escritura.total, 4);
  assert.equal(pass.wrong.length, 1);

  const perfect = gradeExam(questions, { q0: "a", q1: "b", q2: "c", q3: "d" });
  assert.equal(perfect.overall.passed, true);
  assert.equal(perfect.overall.pct, 100);
});
