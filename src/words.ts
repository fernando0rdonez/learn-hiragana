/**
 * Seed words built only from base hiragana (no っ, no は-as-"wa" particle, no long vowels).
 * `rows` lists the row ids (from App.tsx's ROWS) needed to read every kana in the word.
 */
export interface WordEntry {
  kana: string;
  romaji: string;
  rows: string[];
  meaning: string;
}

export const WORDS: WordEntry[] = [
  { kana: "あさ",   romaji: "asa",     rows: ["a", "sa"],         meaning: "mañana" },
  { kana: "いえ",   romaji: "ie",      rows: ["a"],               meaning: "casa" },
  { kana: "うた",   romaji: "uta",     rows: ["a", "ta"],         meaning: "canción" },
  { kana: "かさ",   romaji: "kasa",    rows: ["ka", "sa"],        meaning: "sombrilla" },
  { kana: "きく",   romaji: "kiku",    rows: ["ka"],              meaning: "escuchar" },
  { kana: "さかな", romaji: "sakana",  rows: ["sa", "ka", "na"],  meaning: "pez" },
  { kana: "そら",   romaji: "sora",    rows: ["sa", "ra"],        meaning: "cielo" },
  { kana: "たぬき", romaji: "tanuki",  rows: ["ta", "na", "ka"],  meaning: "tejón" },
  { kana: "とり",   romaji: "tori",    rows: ["ta", "ra"],        meaning: "pájaro" },
  { kana: "なつ",   romaji: "natsu",   rows: ["na", "ta"],        meaning: "verano" },
  { kana: "ねこ",   romaji: "neko",    rows: ["na", "ka"],        meaning: "gato" },
  { kana: "はな",   romaji: "hana",    rows: ["ha", "na"],        meaning: "flor" },
  { kana: "まめ",   romaji: "mame",    rows: ["ma"],              meaning: "frijol" },
  { kana: "みかん", romaji: "mikan",   rows: ["ma", "ka", "wa"],  meaning: "mandarina" },
  { kana: "やま",   romaji: "yama",    rows: ["ya", "ma"],        meaning: "montaña" },
  { kana: "ゆき",   romaji: "yuki",    rows: ["ya", "ka"],        meaning: "nieve" },
  { kana: "よる",   romaji: "yoru",    rows: ["ya", "ra"],        meaning: "noche" },
  { kana: "わたし", romaji: "watashi", rows: ["wa", "ta", "sa"],  meaning: "yo" },
  { kana: "くるま", romaji: "kuruma",  rows: ["ka", "ra", "ma"],  meaning: "coche" },
];

/** Returns words whose every required row passes `isRowReady` (selected or already mastered). */
export function getAvailableWords(isRowReady: (rowId: string) => boolean): WordEntry[] {
  return WORDS.filter((w) => w.rows.every(isRowReady));
}
