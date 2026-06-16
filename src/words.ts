/**
 * Seed words built only from base hiragana (no っ, no は-as-"wa" particle, no long vowels).
 * `rows` lists the row ids (from App.tsx's ROWS) needed to read every kana in the word.
 */
export interface WordEntry {
  kana: string;
  romaji: string;
  rows: string[];
}

export const WORDS: WordEntry[] = [
  { kana: "あさ",   romaji: "asa",     rows: ["a", "sa"] },
  { kana: "いえ",   romaji: "ie",      rows: ["a"] },
  { kana: "うた",   romaji: "uta",     rows: ["a", "ta"] },
  { kana: "かさ",   romaji: "kasa",    rows: ["ka", "sa"] },
  { kana: "きく",   romaji: "kiku",    rows: ["ka"] },
  { kana: "さかな", romaji: "sakana",  rows: ["sa", "ka", "na"] },
  { kana: "そら",   romaji: "sora",    rows: ["sa", "ra"] },
  { kana: "たぬき", romaji: "tanuki",  rows: ["ta", "na", "ka"] },
  { kana: "とり",   romaji: "tori",    rows: ["ta", "ra"] },
  { kana: "なつ",   romaji: "natsu",   rows: ["na", "ta"] },
  { kana: "ねこ",   romaji: "neko",    rows: ["na", "ka"] },
  { kana: "はな",   romaji: "hana",    rows: ["ha", "na"] },
  { kana: "まめ",   romaji: "mame",    rows: ["ma"] },
  { kana: "みかん", romaji: "mikan",   rows: ["ma", "ka", "wa"] },
  { kana: "やま",   romaji: "yama",    rows: ["ya", "ma"] },
  { kana: "ゆき",   romaji: "yuki",    rows: ["ya", "ka"] },
  { kana: "よる",   romaji: "yoru",    rows: ["ya", "ra"] },
  { kana: "わたし", romaji: "watashi", rows: ["wa", "ta", "sa"] },
  { kana: "くるま", romaji: "kuruma",  rows: ["ka", "ra", "ma"] },
];

/** Returns words whose every required row passes `isRowReady` (selected or already mastered). */
export function getAvailableWords(isRowReady: (rowId: string) => boolean): WordEntry[] {
  return WORDS.filter((w) => w.rows.every(isRowReady));
}
