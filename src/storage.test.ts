import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeProgressData } from "./storage";
import type { ItemProgress, ProgressData } from "./types";

function item(overrides: Partial<ItemProgress> = {}): ItemProgress {
  return { box: 1, nextDue: "2026-07-12", attempts: 1, correct: 1, ...overrides };
}

// ── ítems: no se pierde progreso practicado en solo un dispositivo ──────────

test("une ítems que solo existen de un lado, sin perder ninguno", () => {
  const a: ProgressData = { items: { "あ": item() } };
  const b: ProgressData = { items: { "い": item() } };
  const merged = mergeProgressData(a, b);
  assert.deepEqual(Object.keys(merged.items).sort(), ["あ", "い"]);
});

test("mismo ítem en ambos lados: gana el de más attempts", () => {
  const a: ProgressData = { items: { "あ": item({ attempts: 5, correct: 4, box: 2 }) } };
  const b: ProgressData = { items: { "あ": item({ attempts: 2, correct: 2, box: 3 }) } };
  const merged = mergeProgressData(a, b);
  assert.equal(merged.items["あ"].attempts, 5);
});

test("empate en attempts: gana el de mayor box", () => {
  const a: ProgressData = { items: { "あ": item({ attempts: 3, box: 1 }) } };
  const b: ProgressData = { items: { "あ": item({ attempts: 3, box: 4 }) } };
  const merged = mergeProgressData(a, b);
  assert.equal(merged.items["あ"].box, 4);
});

test("es conmutativa: mergeProgressData(a, b) === mergeProgressData(b, a)", () => {
  const a: ProgressData = { items: { "あ": item({ attempts: 5 }), "い": item() } };
  const b: ProgressData = { items: { "あ": item({ attempts: 2 }), "う": item() } };
  assert.deepEqual(mergeProgressData(a, b), mergeProgressData(b, a));
});

test("es idempotente: fusionar consigo mismo no cambia nada", () => {
  const a: ProgressData = { items: { "あ": item({ attempts: 5 }) }, streak: { current: 3, longest: 5, lastSuccessDate: "2026-07-12" }, dailyProgress: { date: "2026-07-12", correctToday: 8 } };
  assert.deepEqual(mergeProgressData(a, a), mergeProgressData(mergeProgressData(a, a), a));
});

// ── streak ───────────────────────────────────────────────────────────────

test("streak: misma fecha, toma el current/longest más alto", () => {
  const a: ProgressData = { items: {}, streak: { current: 3, longest: 10, lastSuccessDate: "2026-07-12" } };
  const b: ProgressData = { items: {}, streak: { current: 5, longest: 6, lastSuccessDate: "2026-07-12" } };
  const merged = mergeProgressData(a, b);
  assert.deepEqual(merged.streak, { current: 5, longest: 10, lastSuccessDate: "2026-07-12" });
});

test("streak: fechas distintas, gana el estado más reciente pero longest es el máximo global", () => {
  const a: ProgressData = { items: {}, streak: { current: 2, longest: 20, lastSuccessDate: "2026-07-10" } };
  const b: ProgressData = { items: {}, streak: { current: 4, longest: 6, lastSuccessDate: "2026-07-12" } };
  const merged = mergeProgressData(a, b);
  assert.deepEqual(merged.streak, { current: 4, longest: 20, lastSuccessDate: "2026-07-12" });
});

// ── dailyProgress ────────────────────────────────────────────────────────

test("dailyProgress: misma fecha, toma el correctToday más alto (no suma)", () => {
  const a: ProgressData = { items: {}, dailyProgress: { date: "2026-07-12", correctToday: 8 } };
  const b: ProgressData = { items: {}, dailyProgress: { date: "2026-07-12", correctToday: 5 } };
  const merged = mergeProgressData(a, b);
  assert.deepEqual(merged.dailyProgress, { date: "2026-07-12", correctToday: 8 });
});

test("dailyProgress: fechas distintas, gana la más reciente", () => {
  const a: ProgressData = { items: {}, dailyProgress: { date: "2026-07-11", correctToday: 20 } };
  const b: ProgressData = { items: {}, dailyProgress: { date: "2026-07-12", correctToday: 1 } };
  const merged = mergeProgressData(a, b);
  assert.deepEqual(merged.dailyProgress, { date: "2026-07-12", correctToday: 1 });
});
