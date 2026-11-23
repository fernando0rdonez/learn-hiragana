// Shared Goals ("Metas compartidas") — pure helpers, no Supabase (docs/GOALS_PLAN.md).
import { GRAMMAR_LESSONS, type GrammarBook } from "./grammar";
import { VOCAB_CATEGORIES } from "./vocabulary";

export type GoalModule = "grammar" | "vocab" | "hiragana";
export type GoalDuration = 7 | 14 | 30;
export type GoalPerDay = 1 | 2 | 3;

export const GOAL_DURATIONS: GoalDuration[] = [7, 14, 30];
export const GOAL_PER_DAY_OPTIONS: GoalPerDay[] = [1, 2, 3];
export const MAX_GOAL_TASKS = 3;
export const GRAMMAR_BOOKS: GrammarBook[] = ["Japonés Básico I", "Japonés Básico II", "Extra"];

/** What a task points at. Empty target = any session of that module. */
export interface GoalTarget {
  lessonId?: string;
  book?: GrammarBook;
  category?: string;
}

export interface GoalTask {
  id: string;
  module: GoalModule;
  target: GoalTarget;
  perDay: GoalPerDay;
}

export interface GoalRow {
  id: string;
  created_by: string;
  title: string;
  tasks: GoalTask[];
  duration_days: GoalDuration;
  start_date: string; // YYYY-MM-DD, creator's local date
  invite_code: string;
  created_at: string;
}

// ── Dates (local YYYY-MM-DD strings, compared as calendar days) ───────────

function parseISODate(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(date: string, days: number): string {
  return new Date(parseISODate(date) + days * 86_400_000).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseISODate(to) - parseISODate(from)) / 86_400_000);
}

export function goalEndDate(goal: Pick<GoalRow, "start_date" | "duration_days">): string {
  return addDays(goal.start_date, goal.duration_days - 1);
}

/** Every calendar day of the goal, in order. */
export function goalDays(goal: Pick<GoalRow, "start_date" | "duration_days">): string[] {
  return Array.from({ length: goal.duration_days }, (_, i) => addDays(goal.start_date, i));
}

export type GoalPhase = "upcoming" | "active" | "finished";

export function goalPhase(goal: Pick<GoalRow, "start_date" | "duration_days">, today: string): GoalPhase {
  if (today < goal.start_date) return "upcoming";
  if (today > goalEndDate(goal)) return "finished";
  return "active";
}

/** 1-based day number within the goal, clamped to [1, duration]. */
export function goalDayNumber(goal: Pick<GoalRow, "start_date" | "duration_days">, today: string): number {
  return Math.min(goal.duration_days, Math.max(1, daysBetween(goal.start_date, today) + 1));
}

// ── Labels ───────────────────────────────────────────────────────────────

export function targetLabel(task: Pick<GoalTask, "module" | "target">): string {
  if (task.module === "grammar") {
    if (task.target.lessonId) {
      const lesson = GRAMMAR_LESSONS.find((l) => l.id === task.target.lessonId);
      return `Gramática — ${lesson?.title ?? "lección"}`;
    }
    if (task.target.book) return `Gramática — ${task.target.book}`;
    return "Gramática";
  }
  if (task.module === "vocab") {
    if (task.target.category) {
      const category = VOCAB_CATEGORIES.find((c) => c.id === task.target.category);
      return `Vocabulario — ${category?.label ?? "categoría"}`;
    }
    return "Vocabulario";
  }
  return "Hiragana";
}

export function taskLabel(task: GoalTask): string {
  return `${task.perDay} ${task.perDay === 1 ? "sesión" : "sesiones"} · ${targetLabel(task)}`;
}

/** Auto-generated goal title, e.g. "2 de Gramática: Partícula に + 1 de Vocabulario". */
export function goalTitle(tasks: GoalTask[]): string {
  const title = tasks.map((t) => `${t.perDay} de ${targetLabel(t)}`).join(" + ");
  return title.length > 120 ? `${title.slice(0, 117)}…` : title;
}

export function newTaskId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Client-side shape check before inserting (the DB only checks it's a 1–3 element array). */
export function validateTasks(tasks: GoalTask[]): string | null {
  if (tasks.length === 0) return "Agrega al menos una tarea.";
  if (tasks.length > MAX_GOAL_TASKS) return `Máximo ${MAX_GOAL_TASKS} tareas por meta.`;
  if (new Set(tasks.map((t) => t.id)).size !== tasks.length) return "Tareas duplicadas.";
  const keys = tasks.map((t) => `${t.module}|${t.target.lessonId ?? ""}|${t.target.book ?? ""}|${t.target.category ?? ""}`);
  if (new Set(keys).size !== keys.length) return "Hay dos tareas iguales — combina las sesiones en una.";
  return null;
}

// ── Check-ins: which goal tasks does a finished session advance? ──────────

/** A finished study session, as reported by the game that just ended. */
export type StudyEvent =
  | { module: "grammar"; lessonId: string; book: GrammarBook }
  | { module: "grammarTrain" } // "Ordena el tren" — not tied to a lesson
  | { module: "vocab"; categories: string[] } // one entry per word in the session
  | { module: "hiragana" };

/**
 * A vocab session counts for a category task when at least half of its words are from
 * that category — mixing in a few other words is fine, "all categories" is not.
 */
export const VOCAB_CATEGORY_SHARE = 0.5;

export function taskMatchesEvent(task: GoalTask, event: StudyEvent): boolean {
  if (task.module === "grammar") {
    if (event.module === "grammar") {
      if (task.target.lessonId) return task.target.lessonId === event.lessonId;
      if (task.target.book) return task.target.book === event.book;
      return true;
    }
    // The particle train isn't a lesson, so it only counts for "any grammar".
    return event.module === "grammarTrain" && !task.target.lessonId && !task.target.book;
  }
  if (task.module === "vocab") {
    if (event.module !== "vocab" || event.categories.length === 0) return false;
    if (!task.target.category) return true;
    const inCategory = event.categories.filter((c) => c === task.target.category).length;
    return inCategory / event.categories.length >= VOCAB_CATEGORY_SHARE;
  }
  return event.module === "hiragana";
}

export interface GoalTaskRef {
  goalId: string;
  taskId: string;
}

/** Every (goal, task) that this session advances today, across all of the user's active goals. */
export function matchingTasks(
  goals: Pick<GoalRow, "id" | "tasks" | "start_date" | "duration_days">[],
  event: StudyEvent,
  today: string,
): GoalTaskRef[] {
  return goals
    .filter((g) => goalPhase(g, today) === "active")
    .flatMap((g) => g.tasks.filter((t) => taskMatchesEvent(t, event)).map((t) => ({ goalId: g.id, taskId: t.id })));
}
