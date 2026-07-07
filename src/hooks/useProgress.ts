import { useState, useEffect } from "react";
import type { ProgressData, ProgressItems, StreakData, DailyProgress } from "../types";
import { loadProgress, saveProgress, parseImportedProgress, CURRENT_SCHEMA_VERSION } from "../storage";
import { DEFAULT_STREAK, DEFAULT_DAILY_PROGRESS } from "../streak";
import { toISODate } from "../utils";

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
  const [importError, setImportError]     = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<ProgressData | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

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

  function exportProgress() {
    const data: ProgressData = { items: progress, streak, dailyProgress, settings: { showRomaji }, schemaVersion: CURRENT_SCHEMA_VERSION };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hiragana-progress-${toISODate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function stageImport(file: File) {
    setImportError(null);
    setImportSuccess(false);
    setPendingImport(null);
    try {
      setPendingImport(parseImportedProgress(await file.text()));
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "No se pudo leer el archivo.");
    }
  }

  function confirmImport() {
    if (!pendingImport) return;
    const items       = pendingImport.items;
    const newStreak   = pendingImport.streak ?? DEFAULT_STREAK;
    const newDaily    = pendingImport.dailyProgress ?? DEFAULT_DAILY_PROGRESS;
    const newRomaji   = pendingImport.settings?.showRomaji ?? false;
    const ok = saveProgress({ items, streak: newStreak, dailyProgress: newDaily, settings: { showRomaji: newRomaji } });
    setProgress(items);
    setShowRomaji(newRomaji);
    setStreak(newStreak);
    setDailyProgress(newDaily);
    setSaveError(!ok);
    setPendingImport(null);
    setImportSuccess(ok);
  }

  function cancelImport() {
    setPendingImport(null);
    setImportError(null);
  }

  return {
    loading, saveError, progress, setProgress, showRomaji, persist, updateShowRomaji,
    exportProgress, importError, pendingImport, importSuccess, stageImport, confirmImport, cancelImport,
  };
}
