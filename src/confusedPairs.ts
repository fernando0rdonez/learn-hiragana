/**
 * Curated list of visually similar kana groups.
 * Add new groups here — session and distractor logic import this constant directly.
 */
export const CONFUSED_PAIRS: readonly (readonly string[])[] = [
  // Visually similar shapes
  ["か", "け"],
  ["ぬ", "ね", "め"],
  ["る", "ろ"],
  ["わ", "れ", "ね"],
  ["さ", "ち"],
  ["せ", "て"],
  ["は", "ほ"],
  ["り", "い"],
  ["の", "ん"],
  ["あ", "お"],
  ["な", "に"],
  ["め", "ぬ"],
  // Dakuten pairs (voiced ↔ unvoiced — same base shape)
  ["か", "が"],
  ["き", "ぎ"],
  ["く", "ぐ"],
  ["こ", "ご"],
  ["さ", "ざ"],
  ["し", "じ"],
  ["た", "だ"],
  ["て", "で"],
  ["と", "ど"],
  // Handakuten pairs (ば ↔ ぱ — differ only by ° vs ″)
  ["ば", "ぱ"],
  ["び", "ぴ"],
  ["ぶ", "ぷ"],
  ["ぼ", "ぽ"],
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
