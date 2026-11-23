import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays, daysBetween, goalDays, goalEndDate, goalPhase, goalDayNumber,
  taskLabel, goalTitle, validateTasks, taskMatchesEvent, matchingTasks,
  type GoalTask, type StudyEvent,
} from "./goals";
import { GRAMMAR_LESSONS } from "./grammar";

const goal = { start_date: "2026-11-28", duration_days: 7 as const };

function task(overrides: Partial<GoalTask> = {}): GoalTask {
  return { id: "t1", module: "grammar", target: {}, perDay: 1, ...overrides };
}

test("addDays and daysBetween cross month and year boundaries", () => {
  assert.equal(addDays("2026-11-28", 3), "2026-12-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(daysBetween("2026-11-28", "2026-12-04"), 6);
});

test("goal window covers exactly duration_days days", () => {
  assert.equal(goalEndDate(goal), "2026-12-04");
  const days = goalDays(goal);
  assert.equal(days.length, 7);
  assert.equal(days[0], "2026-11-28");
  assert.equal(days[6], "2026-12-04");
});

test("goalPhase and goalDayNumber", () => {
  assert.equal(goalPhase(goal, "2026-11-27"), "upcoming");
  assert.equal(goalPhase(goal, "2026-11-28"), "active");
  assert.equal(goalPhase(goal, "2026-12-04"), "active");
  assert.equal(goalPhase(goal, "2026-12-05"), "finished");
  assert.equal(goalDayNumber(goal, "2026-11-28"), 1);
  assert.equal(goalDayNumber(goal, "2026-12-01"), 4);
  assert.equal(goalDayNumber(goal, "2027-01-01"), 7);
});

test("task labels name the target", () => {
  const lesson = GRAMMAR_LESSONS[0];
  assert.equal(taskLabel(task({ target: { lessonId: lesson.id }, perDay: 2 })), `2 sesiones · Gramática — ${lesson.title}`);
  assert.equal(taskLabel(task({ target: { book: "Japonés Básico II" } })), "1 sesión · Gramática — Japonés Básico II");
  assert.equal(taskLabel(task({ module: "vocab", target: { category: "familia" } })), "1 sesión · Vocabulario — Familia");
  assert.equal(taskLabel(task({ module: "hiragana" })), "1 sesión · Hiragana");
});

test("goalTitle joins tasks and caps length at 120", () => {
  assert.equal(
    goalTitle([task({ perDay: 2 }), task({ id: "t2", module: "vocab" })]),
    "2 de Gramática + 1 de Vocabulario",
  );
  const long = goalTitle(GRAMMAR_LESSONS.slice(0, 3).map((l, i) => task({ id: `t${i}`, target: { lessonId: l.id } })));
  assert.ok(long.length <= 120);
});

test("validateTasks rejects empty, too many and duplicate targets", () => {
  assert.equal(validateTasks([task()]), null);
  assert.ok(validateTasks([]));
  assert.ok(validateTasks([task({ id: "a" }), task({ id: "b", module: "vocab" }), task({ id: "c", module: "hiragana" }), task({ id: "d", target: { book: "Extra" } })]));
  assert.ok(validateTasks([task({ id: "a" }), task({ id: "b" })]));
  assert.equal(validateTasks([task({ id: "a" }), task({ id: "b", target: { book: "Extra" } })]), null);
});

test("grammar tasks match by lesson, book or any", () => {
  const lesson = GRAMMAR_LESSONS.find((l) => l.id === "particula-ni")!;
  const event: StudyEvent = { module: "grammar", lessonId: lesson.id, book: lesson.section };
  assert.ok(taskMatchesEvent(task({ target: { lessonId: "particula-ni" } }), event));
  assert.ok(!taskMatchesEvent(task({ target: { lessonId: "particula-wo" } }), event));
  assert.ok(taskMatchesEvent(task({ target: { book: lesson.section } }), event));
  assert.ok(!taskMatchesEvent(task({ target: { book: "Extra" } }), event));
  assert.ok(taskMatchesEvent(task(), event));
  assert.ok(!taskMatchesEvent(task({ module: "vocab" }), event));
});

test("the particle train only counts for 'any grammar'", () => {
  const train: StudyEvent = { module: "grammarTrain" };
  assert.ok(taskMatchesEvent(task(), train));
  assert.ok(!taskMatchesEvent(task({ target: { book: "Extra" } }), train));
  assert.ok(!taskMatchesEvent(task({ target: { lessonId: "particula-ni" } }), train));
});

test("vocab category tasks need at least half the session's words in that category", () => {
  const vocab = task({ module: "vocab", target: { category: "familia" } });
  assert.ok(taskMatchesEvent(vocab, { module: "vocab", categories: ["familia", "familia", "gente", "tiempo"] }));
  assert.ok(!taskMatchesEvent(vocab, { module: "vocab", categories: ["familia", "gente", "tiempo"] }));
  assert.ok(taskMatchesEvent(task({ module: "vocab" }), { module: "vocab", categories: ["gente"] }));
  assert.ok(!taskMatchesEvent(task({ module: "vocab" }), { module: "vocab", categories: [] }));
});

test("hiragana tasks match hiragana sessions only", () => {
  assert.ok(taskMatchesEvent(task({ module: "hiragana" }), { module: "hiragana" }));
  assert.ok(!taskMatchesEvent(task({ module: "hiragana" }), { module: "grammarTrain" }));
});

test("matchingTasks spans goals and skips goals outside their window", () => {
  const goals = [
    { id: "g1", start_date: "2026-11-28", duration_days: 7 as const, tasks: [task({ id: "a" }), task({ id: "b", module: "hiragana" })] },
    { id: "g2", start_date: "2026-11-20", duration_days: 14 as const, tasks: [task({ id: "c", target: { book: "Japonés Básico I" } })] },
    { id: "g3", start_date: "2026-11-01", duration_days: 7 as const, tasks: [task({ id: "d" })] }, // finished
  ];
  const event: StudyEvent = { module: "grammar", lessonId: "estructura-desu", book: "Japonés Básico I" };
  assert.deepEqual(matchingTasks(goals, event, "2026-11-30"), [
    { goalId: "g1", taskId: "a" },
    { goalId: "g2", taskId: "c" },
  ]);
  assert.deepEqual(matchingTasks(goals, event, "2026-11-25"), [{ goalId: "g2", taskId: "c" }]);
});
