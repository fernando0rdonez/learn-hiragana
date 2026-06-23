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

const COMPOUND_KANA = [
  "きゃ","きゅ","きょ",
  "ぎゃ","ぎゅ","ぎょ",
  "しゃ","しゅ","しょ",
  "じゃ","じゅ","じょ",
  "ちゃ","ちゅ","ちょ",
  "にゃ","にゅ","にょ",
  "ひゃ","ひゅ","ひょ",
  "びゃ","びゅ","びょ",
  "ぴゃ","ぴゅ","ぴょ",
  "みゃ","みゅ","みょ",
  "りゃ","りゅ","りょ",
];

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns `count` distractor kana for a word.
 * Pass `units` when the word uses compound kana (e.g. ["お","ちゃ"]) so that
 * compound kana are included in the distractor pool.
 */
export function getDistractors(wordKana: string, count = 3, units?: string[]): string[] {
  const chars = units ?? [...wordKana];
  const charSet = new Set(chars);

  const hasCompound = chars.some((c) => c.length > 1);
  const pool = hasCompound ? [...BASE_KANA, ...COMPOUND_KANA] : BASE_KANA;

  // Priority: confused-pair alternatives for single-char kana
  const confused: string[] = [];
  for (const ch of chars) {
    if (ch.length === 1) {
      for (const group of CONFUSED_PAIRS) {
        if (group.includes(ch)) {
          group.filter((k) => k !== ch && !charSet.has(k)).forEach((k) => confused.push(k));
        }
      }
    }
  }

  const seen = new Set(charSet);
  const result: string[] = [];

  for (const k of shuffle([...new Set(confused)])) {
    if (result.length >= count) break;
    if (!seen.has(k)) { seen.add(k); result.push(k); }
  }

  for (const k of shuffle(pool.filter((k) => !seen.has(k)))) {
    if (result.length >= count) break;
    result.push(k);
  }

  return result;
}
