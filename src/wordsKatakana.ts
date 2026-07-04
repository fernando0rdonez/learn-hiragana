/**
 * Préstamos (loanwords) escritos en katakana, análogo a `src/words.ts`.
 * `rows` lista los ids de fila katakana (de `dataKatakana.ts`) necesarios para leer
 * cada kana de la palabra. El guion largo ー no pertenece a ninguna fila y no gatea
 * la disponibilidad de la palabra.
 */
export interface KatakanaWordEntry {
  kana: string;
  romaji: string;
  rows: string[];
  meaning: string;
}

export const KATAKANA_WORDS: KatakanaWordEntry[] = [
  { kana: "コーヒー",   romaji: "kōhī",     rows: ["kata-ka", "kata-ha"],                       meaning: "café" },
  { kana: "テレビ",     romaji: "terebi",   rows: ["kata-ta", "kata-ra", "kata-ba"],            meaning: "televisión" },
  { kana: "パン",       romaji: "pan",      rows: ["kata-pa", "kata-wa"],                       meaning: "pan" },
  { kana: "バス",       romaji: "basu",     rows: ["kata-ba", "kata-sa"],                       meaning: "autobús" },
  { kana: "タクシー",   romaji: "takushī",  rows: ["kata-ta", "kata-ka", "kata-sa"],             meaning: "taxi" },
  { kana: "ホテル",     romaji: "hoteru",   rows: ["kata-ha", "kata-ta", "kata-ra"],             meaning: "hotel" },
  { kana: "カメラ",     romaji: "kamera",   rows: ["kata-ka", "kata-ma", "kata-ra"],             meaning: "cámara" },
  { kana: "アイス",     romaji: "aisu",     rows: ["kata-a", "kata-sa"],                         meaning: "helado" },
  { kana: "ケーキ",     romaji: "kēki",     rows: ["kata-ka"],                                   meaning: "pastel" },
  { kana: "ピザ",       romaji: "piza",     rows: ["kata-pa", "kata-za"],                        meaning: "pizza" },
  { kana: "ジュース",   romaji: "jūsu",     rows: ["kata-ja", "kata-sa"],                        meaning: "jugo" },
  { kana: "レストラン", romaji: "resutoran",rows: ["kata-ra", "kata-sa", "kata-ta", "kata-wa"],  meaning: "restaurante" },
  { kana: "スーパー",   romaji: "sūpā",     rows: ["kata-sa", "kata-pa"],                        meaning: "supermercado" },
  { kana: "コンビニ",   romaji: "konbini",  rows: ["kata-ka", "kata-wa", "kata-ba", "kata-na"],  meaning: "tienda de conveniencia" },
  { kana: "エレベーター", romaji: "erebētā", rows: ["kata-a", "kata-ra", "kata-ba", "kata-ta"],  meaning: "ascensor" },
  { kana: "パソコン",   romaji: "pasokon",  rows: ["kata-pa", "kata-sa", "kata-ka", "kata-wa"],  meaning: "computadora" },
  { kana: "ノート",     romaji: "nōto",     rows: ["kata-na", "kata-ta"],                        meaning: "cuaderno" },
  { kana: "ボタン",     romaji: "botan",    rows: ["kata-ba", "kata-ta", "kata-wa"],             meaning: "botón" },
  { kana: "ニュース",   romaji: "nyūsu",    rows: ["kata-nya", "kata-sa"],                       meaning: "noticias" },
  { kana: "シャツ",     romaji: "shatsu",   rows: ["kata-sha", "kata-ta"],                       meaning: "camisa" },
];

/** Devuelve las palabras cuya fila requerida pasa `isRowReady` (seleccionada o ya dominada). */
export function getAvailableKatakanaWords(isRowReady: (rowId: string) => boolean): KatakanaWordEntry[] {
  return KATAKANA_WORDS.filter((w) => w.rows.every(isRowReady));
}
