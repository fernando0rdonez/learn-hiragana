import type { StreakData, DailyProgress } from "./types";

export const DAILY_GOAL = 10;
const TOLERANCE_DAYS = 2;

export const DEFAULT_STREAK: StreakData = { current: 0, longest: 0, lastSuccessDate: "" };
export const DEFAULT_DAILY_PROGRESS: DailyProgress = { date: "", correctToday: 0 };

function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** Llamar solo cuando una respuesta es correcta. Devuelve el streak/daily actualizados. */
export function recordCorrectAnswer(
  streak: StreakData,
  daily: DailyProgress,
  today: string
): { streak: StreakData; daily: DailyProgress } {
  const sameDay = daily.date === today;
  const correctToday = (sameDay ? daily.correctToday : 0) + 1;
  const newDaily: DailyProgress = { date: today, correctToday };

  const alreadyCompletedToday = sameDay && daily.correctToday >= DAILY_GOAL;
  if (correctToday < DAILY_GOAL || alreadyCompletedToday) {
    return { streak, daily: newDaily };
  }

  const gap = streak.lastSuccessDate ? daysBetween(streak.lastSuccessDate, today) : Infinity;
  const current = gap <= TOLERANCE_DAYS ? streak.current + 1 : 1;
  return {
    streak: { current, longest: Math.max(streak.longest, current), lastSuccessDate: today },
    daily: newDaily,
  };
}
