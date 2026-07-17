import type { StreakData, DailyProgress } from "./types";

export const DAILY_GOAL = 10;
const TOLERANCE_DAYS = 2;
const HISTORY_DAYS = 14;

export const DEFAULT_STREAK: StreakData = { current: 0, longest: 0, lastSuccessDate: "", practiceDates: [] };
export const DEFAULT_DAILY_PROGRESS: DailyProgress = { date: "", correctToday: 0 };

/** Hitos de racha con nombre propio de la app (no genéricos) — "reached" se evalúa contra streak.longest. */
export const STREAK_MILESTONES: { days: number; name: string }[] = [
  { days: 3, name: "Chispa" },
  { days: 7, name: "Constancia" },
  { days: 30, name: "Escudo" },
  { days: 100, name: "Leyenda" },
  { days: 200, name: "Dorada" },
  { days: 365, name: "Eterna" },
];

/** Rellena streak.practiceDates si viene de datos guardados antes de que existiera el campo. */
export function normalizeStreak(streak?: StreakData | null): StreakData {
  if (!streak) return DEFAULT_STREAK;
  return { ...DEFAULT_STREAK, ...streak, practiceDates: streak.practiceDates ?? [] };
}

function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** Une y recorta el historial de fechas practicadas a los últimos HISTORY_DAYS. */
export function addPracticeDate(dates: string[], date: string): string[] {
  const merged = new Set(dates);
  merged.add(date);
  return [...merged].sort().slice(-HISTORY_DAYS);
}

/** Llamar solo cuando una respuesta es correcta. Devuelve el streak/daily actualizados. */
export function recordCorrectAnswer(
  streak: StreakData,
  daily: DailyProgress,
  today: string
): { streak: StreakData; daily: DailyProgress; justCompletedGoal: boolean } {
  const sameDay = daily.date === today;
  const correctToday = (sameDay ? daily.correctToday : 0) + 1;
  const newDaily: DailyProgress = { date: today, correctToday };

  const alreadyCompletedToday = sameDay && daily.correctToday >= DAILY_GOAL;
  if (correctToday < DAILY_GOAL || alreadyCompletedToday) {
    return { streak, daily: newDaily, justCompletedGoal: false };
  }

  const gap = streak.lastSuccessDate ? daysBetween(streak.lastSuccessDate, today) : Infinity;
  const current = gap <= TOLERANCE_DAYS ? streak.current + 1 : 1;
  return {
    streak: {
      current,
      longest: Math.max(streak.longest, current),
      lastSuccessDate: today,
      practiceDates: addPracticeDate(streak.practiceDates, today),
    },
    daily: newDaily,
    justCompletedGoal: true,
  };
}

export interface WeekDay {
  label: string;
  date: string;
  done: boolean;
  isToday: boolean;
  isFuture: boolean;
}

const WEEKDAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

/** Domingo a sábado de la semana calendario que contiene `today`. */
export function weekAroundToday(practiceDates: string[], today: string): WeekDay[] {
  const [y, m, d] = today.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const sunday = new Date(base);
  sunday.setDate(base.getDate() - base.getDay());
  const done = new Set(practiceDates);

  return WEEKDAY_LABELS.map((label, i) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    const iso = [day.getFullYear(), String(day.getMonth() + 1).padStart(2, "0"), String(day.getDate()).padStart(2, "0")].join("-");
    return { label, date: iso, done: done.has(iso), isToday: iso === today, isFuture: iso > today };
  });
}
