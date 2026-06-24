import type { ProgressItems, ItemProgress } from "./types";

export const INTERVALS = [0, 1, 3, 7, 14]; // days per box (0–4)

/** Returns the updated box + nextDue after an answer. */
export function advanceBox(
  prev: ItemProgress,
  isCorrect: boolean,
  today: string
): Pick<ItemProgress, "box" | "nextDue"> {
  if (isCorrect) {
    const newBox = Math.min(prev.box + 1, INTERVALS.length - 1);
    return { box: newBox, nextDue: addDays(today, INTERVALS[newBox]) };
  }
  return { box: 0, nextDue: today };
}

export function isDue(nextDue: string, today: string): boolean {
  return nextDue <= today;
}

/**
 * Builds an ordered session queue:
 *   1. Due items (shuffled)
 *   2. New items — no attempts yet (shuffled)
 *   3. Not-yet-due items (shuffled) — included so practice is never blocked
 * Returns at most `sessionLength` items.
 */
export function buildSessionQueue<T extends { kana: string }>(
  pool: T[],
  items: ProgressItems,
  mode: string,
  sessionLength: number,
  today: string
): T[] {
  const due: T[] = [];
  const fresh: T[] = [];
  const notDue: T[] = [];

  for (const char of pool) {
    const item = items[`${mode}:${char.kana}`];
    if (!item || item.attempts === 0) {
      fresh.push(char);
    } else if (isDue(item.nextDue, today)) {
      due.push(char);
    } else {
      notDue.push(char);
    }
  }

  shuffle(due);
  shuffle(fresh);
  shuffle(notDue);

  return [...due, ...fresh, ...notDue].slice(0, sessionLength);
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + days); // local date arithmetic, avoids UTC offset issues
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
