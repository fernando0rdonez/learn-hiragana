/**
 * Curated list of visually similar kana groups.
 * Add new groups here — session and distractor logic import this constant directly.
 */
export const CONFUSED_PAIRS: readonly (readonly string[])[] = [
  ["か", "け"],
  ["ぬ", "ね"],
  ["る", "ろ"],
  ["わ", "れ", "ね"],
  ["さ", "ち"],
  ["せ", "て"],
  ["は", "ほ"],
  ["り", "い"],
];

/** Returns all kana that are visually confusable with the given kana. */
export function getConfusablePairs(kana: string): string[] {
  const result: string[] = [];
  for (const group of CONFUSED_PAIRS) {
    if (group.includes(kana)) {
      result.push(...group.filter((k) => k !== kana));
    }
  }
  return [...new Set(result)];
}
