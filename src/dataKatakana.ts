import type { CharData, CharWithRow } from "./types";

/**
 * Mismo silabario que ROWS/DAKUTEN_ROWS/COMPOUND_ROWS (`src/data.ts`), en katakana.
 * Ids con prefijo `kata-` para no colisionar con los ids de hiragana (ambos usan
 * ids cortos como "a", "ka"...); varios módulos detectan el charset mirando
 * este prefijo (ver `utils.ts` y `hooks/useSession.ts`).
 */

export const KATAKANA_ROWS: { id: string; title: string; chars: CharData[] }[] = [
  { id: "kata-a",  title: "ア — fila A",      chars: [{ kana: "ア", romaji: "a" }, { kana: "イ", romaji: "i" }, { kana: "ウ", romaji: "u" }, { kana: "エ", romaji: "e" }, { kana: "オ", romaji: "o" }] },
  { id: "kata-ka", title: "カ — fila KA",     chars: [{ kana: "カ", romaji: "ka" }, { kana: "キ", romaji: "ki" }, { kana: "ク", romaji: "ku" }, { kana: "ケ", romaji: "ke" }, { kana: "コ", romaji: "ko" }] },
  { id: "kata-sa", title: "サ — fila SA",     chars: [{ kana: "サ", romaji: "sa" }, { kana: "シ", romaji: "shi" }, { kana: "ス", romaji: "su" }, { kana: "セ", romaji: "se" }, { kana: "ソ", romaji: "so" }] },
  { id: "kata-ta", title: "タ — fila TA",     chars: [{ kana: "タ", romaji: "ta" }, { kana: "チ", romaji: "chi" }, { kana: "ツ", romaji: "tsu" }, { kana: "テ", romaji: "te" }, { kana: "ト", romaji: "to" }] },
  { id: "kata-na", title: "ナ — fila NA",     chars: [{ kana: "ナ", romaji: "na" }, { kana: "ニ", romaji: "ni" }, { kana: "ヌ", romaji: "nu" }, { kana: "ネ", romaji: "ne" }, { kana: "ノ", romaji: "no" }] },
  { id: "kata-ha", title: "ハ — fila HA",     chars: [{ kana: "ハ", romaji: "ha" }, { kana: "ヒ", romaji: "hi" }, { kana: "フ", romaji: "fu" }, { kana: "ヘ", romaji: "he" }, { kana: "ホ", romaji: "ho" }] },
  { id: "kata-ma", title: "マ — fila MA",     chars: [{ kana: "マ", romaji: "ma" }, { kana: "ミ", romaji: "mi" }, { kana: "ム", romaji: "mu" }, { kana: "メ", romaji: "me" }, { kana: "モ", romaji: "mo" }] },
  { id: "kata-ya", title: "ヤ — fila YA",     chars: [{ kana: "ヤ", romaji: "ya" }, { kana: "ユ", romaji: "yu" }, { kana: "ヨ", romaji: "yo" }] },
  { id: "kata-ra", title: "ラ — fila RA",     chars: [{ kana: "ラ", romaji: "ra" }, { kana: "リ", romaji: "ri" }, { kana: "ル", romaji: "ru" }, { kana: "レ", romaji: "re" }, { kana: "ロ", romaji: "ro" }] },
  { id: "kata-wa", title: "ワ — fila WA / N", chars: [{ kana: "ワ", romaji: "wa" }, { kana: "ヲ", romaji: "wo", accept: ["wo", "o"] }, { kana: "ン", romaji: "n" }] },
];

export const KATAKANA_DAKUTEN_ROWS: { id: string; title: string; chars: CharData[] }[] = [
  { id: "kata-ga", title: "ガ — fila GA", chars: [{ kana: "ガ", romaji: "ga" }, { kana: "ギ", romaji: "gi" }, { kana: "グ", romaji: "gu" }, { kana: "ゲ", romaji: "ge" }, { kana: "ゴ", romaji: "go" }] },
  { id: "kata-za", title: "ザ — fila ZA", chars: [{ kana: "ザ", romaji: "za" }, { kana: "ジ", romaji: "ji" }, { kana: "ズ", romaji: "zu" }, { kana: "ゼ", romaji: "ze" }, { kana: "ゾ", romaji: "zo" }] },
  { id: "kata-da", title: "ダ — fila DA", chars: [{ kana: "ダ", romaji: "da" }, { kana: "ヂ", romaji: "di", accept: ["ji"] }, { kana: "ヅ", romaji: "du", accept: ["zu"] }, { kana: "デ", romaji: "de" }, { kana: "ド", romaji: "do" }] },
  { id: "kata-ba", title: "バ — fila BA", chars: [{ kana: "バ", romaji: "ba" }, { kana: "ビ", romaji: "bi" }, { kana: "ブ", romaji: "bu" }, { kana: "ベ", romaji: "be" }, { kana: "ボ", romaji: "bo" }] },
  { id: "kata-pa", title: "パ — fila PA", chars: [{ kana: "パ", romaji: "pa" }, { kana: "ピ", romaji: "pi" }, { kana: "プ", romaji: "pu" }, { kana: "ペ", romaji: "pe" }, { kana: "ポ", romaji: "po" }] },
];

export const KATAKANA_COMPOUND_ROWS: { id: string; title: string; chars: CharData[] }[] = [
  { id: "kata-kya", title: "キャ — KY", chars: [{ kana: "キャ", romaji: "kya" }, { kana: "キュ", romaji: "kyu" }, { kana: "キョ", romaji: "kyo" }] },
  { id: "kata-gya", title: "ギャ — GY", chars: [{ kana: "ギャ", romaji: "gya" }, { kana: "ギュ", romaji: "gyu" }, { kana: "ギョ", romaji: "gyo" }] },
  { id: "kata-sha", title: "シャ — SH", chars: [{ kana: "シャ", romaji: "sha" }, { kana: "シュ", romaji: "shu" }, { kana: "ショ", romaji: "sho" }] },
  { id: "kata-ja",  title: "ジャ — J",  chars: [{ kana: "ジャ", romaji: "ja" }, { kana: "ジュ", romaji: "ju" }, { kana: "ジョ", romaji: "jo" }] },
  { id: "kata-cha", title: "チャ — CH", chars: [{ kana: "チャ", romaji: "cha" }, { kana: "チュ", romaji: "chu" }, { kana: "チョ", romaji: "cho" }] },
  { id: "kata-nya", title: "ニャ — NY", chars: [{ kana: "ニャ", romaji: "nya" }, { kana: "ニュ", romaji: "nyu" }, { kana: "ニョ", romaji: "nyo" }] },
  { id: "kata-hya", title: "ヒャ — HY", chars: [{ kana: "ヒャ", romaji: "hya" }, { kana: "ヒュ", romaji: "hyu" }, { kana: "ヒョ", romaji: "hyo" }] },
  { id: "kata-bya", title: "ビャ — BY", chars: [{ kana: "ビャ", romaji: "bya" }, { kana: "ビュ", romaji: "byu" }, { kana: "ビョ", romaji: "byo" }] },
  { id: "kata-pya", title: "ピャ — PY", chars: [{ kana: "ピャ", romaji: "pya" }, { kana: "ピュ", romaji: "pyu" }, { kana: "ピョ", romaji: "pyo" }] },
  { id: "kata-mya", title: "ミャ — MY", chars: [{ kana: "ミャ", romaji: "mya" }, { kana: "ミュ", romaji: "myu" }, { kana: "ミョ", romaji: "myo" }] },
  { id: "kata-rya", title: "リャ — RY", chars: [{ kana: "リャ", romaji: "rya" }, { kana: "リュ", romaji: "ryu" }, { kana: "リョ", romaji: "ryo" }] },
];

export const KATAKANA_ALL_ROW_GROUPS = [...KATAKANA_ROWS, ...KATAKANA_DAKUTEN_ROWS, ...KATAKANA_COMPOUND_ROWS];

export const KATAKANA_ALL_CHARS: CharWithRow[] = KATAKANA_ALL_ROW_GROUPS.flatMap((row) =>
  row.chars.map((ch) => ({ ...ch, row: row.id }))
);

/** True para cualquier id de fila de este módulo — usado para detectar el charset activo. */
export function isKatakanaRow(rowId: string): boolean {
  return rowId.startsWith("kata-");
}
