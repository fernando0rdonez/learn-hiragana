import { useState, useEffect } from "react";
import type { ProgressItems, StreakData, DailyProgress } from "../types";
import { loadProgress, saveProgress } from "../storage";
import { DEFAULT_STREAK, DEFAULT_DAILY_PROGRESS } from "../streak";

interface UseProgressParams {
  streak: StreakData;
  dailyProgress: DailyProgress;
  setStreak: (s: StreakData) => void;
  setDailyProgress: (d: DailyProgress) => void;
}

export function useProgress({ streak, dailyProgress, setStreak, setDailyProgress }: UseProgressParams) {
  const [loading, setLoading]       = useState(true);
  const [saveError, setSaveError]   = useState(false);
  const [showRomaji, setShowRomaji] = useState(true);
  const [progress, setProgress]     = useState<ProgressItems>({});

  useEffect(() => {
    const data = loadProgress();
    setProgress(data.items);
    setStreak(data.streak ?? DEFAULT_STREAK);
    setDailyProgress(data.dailyProgress ?? DEFAULT_DAILY_PROGRESS);
    setShowRomaji(data.settings?.showRomaji ?? false);
    setLoading(false);
  }, [setStreak, setDailyProgress]);

  function persist(newItems: ProgressItems, newStreak: StreakData = streak, newDaily: DailyProgress = dailyProgress) {
    const ok = saveProgress({ items: newItems, streak: newStreak, dailyProgress: newDaily, settings: { showRomaji } });
    setSaveError(!ok);
    setStreak(newStreak);
    setDailyProgress(newDaily);
  }

  function updateShowRomaji(val: boolean) {
    setShowRomaji(val);
    saveProgress({ items: progress, streak, dailyProgress, settings: { showRomaji: val } });
  }

  return { loading, saveError, progress, setProgress, showRomaji, persist, updateShowRomaji };
}
