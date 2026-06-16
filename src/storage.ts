import type { ProgressData } from "./types";

const STORAGE_KEY = "hiragana-progress";

export function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProgressData;
      if (parsed && typeof parsed.items === "object") return parsed;
    }
  } catch {
    // localStorage unavailable or data corrupted — start fresh
  }
  return { items: {} };
}

export function saveProgress(data: ProgressData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    // private mode or quota exceeded
    return false;
  }
}
