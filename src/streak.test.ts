import { test } from "node:test";
import assert from "node:assert/strict";
import { recordCorrectAnswer, addPracticeDate, weekAroundToday, DAILY_GOAL, DEFAULT_STREAK, DEFAULT_DAILY_PROGRESS } from "./streak";
import type { StreakData, DailyProgress } from "./types";

function streak(overrides: Partial<StreakData> = {}): StreakData {
  return { ...DEFAULT_STREAK, ...overrides };
}

function daily(overrides: Partial<DailyProgress> = {}): DailyProgress {
  return { ...DEFAULT_DAILY_PROGRESS, ...overrides };
}

// ── justCompletedGoal: el disparador de la pantalla de racha ───────────────

test("justCompletedGoal es false mientras no se llega a DAILY_GOAL", () => {
  let d = daily();
  let result;
  for (let i = 0; i < DAILY_GOAL - 1; i++) {
    result = recordCorrectAnswer(streak(), d, "2026-07-17");
    d = result.daily;
    assert.equal(result.justCompletedGoal, false);
  }
  assert.equal(d.correctToday, DAILY_GOAL - 1);
});

test("justCompletedGoal es true exactamente en la respuesta que cumple la meta", () => {
  const d = daily({ date: "2026-07-17", correctToday: DAILY_GOAL - 1 });
  const result = recordCorrectAnswer(streak(), d, "2026-07-17");
  assert.equal(result.justCompletedGoal, true);
  assert.equal(result.streak.current, 1);
});

test("justCompletedGoal es false en respuestas correctas posteriores el mismo día", () => {
  const alreadyDoneToday = streak({ current: 3, longest: 3, lastSuccessDate: "2026-07-17", practiceDates: ["2026-07-17"] });
  const d = daily({ date: "2026-07-17", correctToday: DAILY_GOAL });
  const result = recordCorrectAnswer(alreadyDoneToday, d, "2026-07-17");
  assert.equal(result.justCompletedGoal, false);
  assert.equal(result.streak.current, 3);
});

test("cumplir la meta al día siguiente (dentro de tolerancia) suma la racha y marca practiceDates", () => {
  const s = streak({ current: 4, longest: 4, lastSuccessDate: "2026-07-16", practiceDates: ["2026-07-16"] });
  const d = daily({ date: "2026-07-17", correctToday: DAILY_GOAL - 1 });
  const result = recordCorrectAnswer(s, d, "2026-07-17");
  assert.equal(result.justCompletedGoal, true);
  assert.equal(result.streak.current, 5);
  assert.deepEqual(result.streak.practiceDates, ["2026-07-16", "2026-07-17"]);
});

test("romper la racha (fuera de tolerancia) reinicia current a 1 pero sigue marcando justCompletedGoal", () => {
  const s = streak({ current: 9, longest: 9, lastSuccessDate: "2026-07-01", practiceDates: ["2026-07-01"] });
  const d = daily({ date: "2026-07-17", correctToday: DAILY_GOAL - 1 });
  const result = recordCorrectAnswer(s, d, "2026-07-17");
  assert.equal(result.justCompletedGoal, true);
  assert.equal(result.streak.current, 1);
  assert.equal(result.streak.longest, 9);
});

// ── addPracticeDate ──────────────────────────────────────────────────────────

test("addPracticeDate deduplica y ordena", () => {
  const result = addPracticeDate(["2026-07-15", "2026-07-16"], "2026-07-15");
  assert.deepEqual(result, ["2026-07-15", "2026-07-16"]);
});

test("addPracticeDate recorta al historial reciente", () => {
  const dates = Array.from({ length: 14 }, (_, i) => `2026-06-${String(i + 1).padStart(2, "0")}`);
  const result = addPracticeDate(dates, "2026-07-01");
  assert.equal(result.length, 14);
  assert.equal(result[0], "2026-06-02");
  assert.equal(result.at(-1), "2026-07-01");
});

// ── weekAroundToday ──────────────────────────────────────────────────────────

test("weekAroundToday devuelve 7 días de domingo a sábado con hoy marcado", () => {
  // 2026-07-17 es viernes; el domingo de esa semana es 2026-07-12, el sábado 2026-07-18
  const week = weekAroundToday(["2026-07-12", "2026-07-14", "2026-07-17"], "2026-07-17");
  assert.equal(week.length, 7);
  assert.deepEqual(week.map((d) => d.label), ["D", "L", "M", "X", "J", "V", "S"]);
  const today = week.find((d) => d.isToday);
  assert.equal(today?.date, "2026-07-17");
  assert.equal(today?.done, true);
  assert.equal(week[0].done, true); // domingo 2026-07-12
  assert.equal(week[6].isFuture, true); // sábado 2026-07-18, aún no llega
});
