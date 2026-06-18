import { CONFUSED_PAIRS } from "../confusedPairs";

const BASE_KANA = [
  "あ","い","う","え","お",
  "か","き","く","け","こ",
  "さ","し","す","せ","そ",
  "た","ち","つ","て","と",
  "な","に","ぬ","ね","の",
  "は","ひ","ふ","へ","ほ",
  "ま","み","む","め","も",
  "や","ゆ","よ",
  "ら","り","る","れ","ろ",
  "わ","を","ん",
];

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getDistractors(wordKana: string, count = 3): string[] {
  const chars = [...wordKana];
  const charSet = new Set(chars);

  // Priority: confused-pair alternatives for the word's characters
  const confused: string[] = [];
  for (const ch of chars) {
    for (const group of CONFUSED_PAIRS) {
      if (group.includes(ch)) {
        group.filter((k) => k !== ch && !charSet.has(k)).forEach((k) => confused.push(k));
      }
    }
  }

  const seen = new Set(charSet);
  const result: string[] = [];

  for (const k of shuffle([...new Set(confused)])) {
    if (result.length >= count) break;
    if (!seen.has(k)) { seen.add(k); result.push(k); }
  }

  for (const k of shuffle(BASE_KANA.filter((k) => !seen.has(k)))) {
    if (result.length >= count) break;
    result.push(k);
  }

  return result;
}
