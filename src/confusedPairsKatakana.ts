/**
 * Pares de katakana visualmente similares, análogo a `src/confusedPairs.ts`.
 * `getConfusablePairs` (definida allí) recibe esta lista como segundo argumento.
 */
export const KATAKANA_CONFUSED_PAIRS: readonly (readonly string[])[] = [
  ["シ", "ツ"],
  ["ソ", "ン"],
  ["ク", "ワ", "フ"],
  ["コ", "ユ"],
  ["チ", "テ"],
  ["ノ", "メ"],
  ["ウ", "ワ"],
  ["ヲ", "オ"],
  ["ナ", "メ"],
  ["マ", "ム"],
  // Dakuten pairs (sordo ↔ sonoro — misma forma base)
  ["カ", "ガ"],
  ["キ", "ギ"],
  ["ク", "グ"],
  ["コ", "ゴ"],
  ["サ", "ザ"],
  ["シ", "ジ"],
  ["タ", "ダ"],
  ["テ", "デ"],
  ["ト", "ド"],
  // Handakuten pairs (バ ↔ パ — difieren solo en ° vs ″)
  ["バ", "パ"],
  ["ビ", "ピ"],
  ["ブ", "プ"],
  ["ボ", "ポ"],
];
