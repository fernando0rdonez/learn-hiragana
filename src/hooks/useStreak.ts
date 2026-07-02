import { useState } from "react";
import type { StreakData, DailyProgress } from "../types";
import { DEFAULT_STREAK, DEFAULT_DAILY_PROGRESS } from "../streak";

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(DEFAULT_DAILY_PROGRESS);
  return { streak, setStreak, dailyProgress, setDailyProgress };
}
