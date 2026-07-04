import type { CharData, CharWithRow } from "./types";

// ── Views ──────────────────────────────────────────────────────────────────

export type ViewName = "home" | "hiraganaSetup" | "quiz" | "preview" | "summary" | "stats" | "vocabCategory" | "spellIt" | "recognizeIt" | "listenIt" | "countIt" | "phoneticSetup" | "phonetics";

// ── Kana data ──────────────────────────────────────────────────────────────

export const ROWS: { id: string; title: string; chars: CharData[] }[] = [
  { id: "a",  title: "あ — fila A",      chars: [{ kana: "あ", romaji: "a" }, { kana: "い", romaji: "i" }, { kana: "う", romaji: "u" }, { kana: "え", romaji: "e" }, { kana: "お", romaji: "o" }] },
  { id: "ka", title: "か — fila KA",     chars: [{ kana: "か", romaji: "ka" }, { kana: "き", romaji: "ki" }, { kana: "く", romaji: "ku" }, { kana: "け", romaji: "ke" }, { kana: "こ", romaji: "ko" }] },
  { id: "sa", title: "さ — fila SA",     chars: [{ kana: "さ", romaji: "sa" }, { kana: "し", romaji: "shi" }, { kana: "す", romaji: "su" }, { kana: "せ", romaji: "se" }, { kana: "そ", romaji: "so" }] },
  { id: "ta", title: "た — fila TA",     chars: [{ kana: "た", romaji: "ta" }, { kana: "ち", romaji: "chi" }, { kana: "つ", romaji: "tsu" }, { kana: "て", romaji: "te" }, { kana: "と", romaji: "to" }] },
  { id: "na", title: "な — fila NA",     chars: [{ kana: "な", romaji: "na" }, { kana: "に", romaji: "ni" }, { kana: "ぬ", romaji: "nu" }, { kana: "ね", romaji: "ne" }, { kana: "の", romaji: "no" }] },
  { id: "ha", title: "は — fila HA",     chars: [{ kana: "は", romaji: "ha" }, { kana: "ひ", romaji: "hi" }, { kana: "ふ", romaji: "fu" }, { kana: "へ", romaji: "he" }, { kana: "ほ", romaji: "ho" }] },
  { id: "ma", title: "ま — fila MA",     chars: [{ kana: "ま", romaji: "ma" }, { kana: "み", romaji: "mi" }, { kana: "む", romaji: "mu" }, { kana: "め", romaji: "me" }, { kana: "も", romaji: "mo" }] },
  { id: "ya", title: "や — fila YA",     chars: [{ kana: "や", romaji: "ya" }, { kana: "ゆ", romaji: "yu" }, { kana: "よ", romaji: "yo" }] },
  { id: "ra", title: "ら — fila RA",     chars: [{ kana: "ら", romaji: "ra" }, { kana: "り", romaji: "ri" }, { kana: "る", romaji: "ru" }, { kana: "れ", romaji: "re" }, { kana: "ろ", romaji: "ro" }] },
  { id: "wa", title: "わ — fila WA / N", chars: [{ kana: "わ", romaji: "wa" }, { kana: "を", romaji: "wo", accept: ["wo", "o"] }, { kana: "ん", romaji: "n" }] },
];

export const DAKUTEN_ROWS: { id: string; title: string; chars: CharData[] }[] = [
  { id: "ga", title: "が — fila GA", chars: [{ kana: "が", romaji: "ga" }, { kana: "ぎ", romaji: "gi" }, { kana: "ぐ", romaji: "gu" }, { kana: "げ", romaji: "ge" }, { kana: "ご", romaji: "go" }] },
  { id: "za", title: "ざ — fila ZA", chars: [{ kana: "ざ", romaji: "za" }, { kana: "じ", romaji: "ji" }, { kana: "ず", romaji: "zu" }, { kana: "ぜ", romaji: "ze" }, { kana: "ぞ", romaji: "zo" }] },
  { id: "da", title: "だ — fila DA", chars: [{ kana: "だ", romaji: "da" }, { kana: "ぢ", romaji: "di", accept: ["ji"] }, { kana: "づ", romaji: "du", accept: ["zu"] }, { kana: "で", romaji: "de" }, { kana: "ど", romaji: "do" }] },
  { id: "ba", title: "ば — fila BA", chars: [{ kana: "ば", romaji: "ba" }, { kana: "び", romaji: "bi" }, { kana: "ぶ", romaji: "bu" }, { kana: "べ", romaji: "be" }, { kana: "ぼ", romaji: "bo" }] },
  { id: "pa", title: "ぱ — fila PA", chars: [{ kana: "ぱ", romaji: "pa" }, { kana: "ぴ", romaji: "pi" }, { kana: "ぷ", romaji: "pu" }, { kana: "ぺ", romaji: "pe" }, { kana: "ぽ", romaji: "po" }] },
];

export const COMPOUND_ROWS: { id: string; title: string; chars: CharData[] }[] = [
  { id: "kya", title: "きゃ — KY", chars: [{ kana: "きゃ", romaji: "kya" }, { kana: "きゅ", romaji: "kyu" }, { kana: "きょ", romaji: "kyo" }] },
  { id: "gya", title: "ぎゃ — GY", chars: [{ kana: "ぎゃ", romaji: "gya" }, { kana: "ぎゅ", romaji: "gyu" }, { kana: "ぎょ", romaji: "gyo" }] },
  { id: "sha", title: "しゃ — SH", chars: [{ kana: "しゃ", romaji: "sha" }, { kana: "しゅ", romaji: "shu" }, { kana: "しょ", romaji: "sho" }] },
  { id: "ja",  title: "じゃ — J",  chars: [{ kana: "じゃ", romaji: "ja" }, { kana: "じゅ", romaji: "ju" }, { kana: "じょ", romaji: "jo" }] },
  { id: "cha", title: "ちゃ — CH", chars: [{ kana: "ちゃ", romaji: "cha" }, { kana: "ちゅ", romaji: "chu" }, { kana: "ちょ", romaji: "cho" }] },
  { id: "nya", title: "にゃ — NY", chars: [{ kana: "にゃ", romaji: "nya" }, { kana: "にゅ", romaji: "nyu" }, { kana: "にょ", romaji: "nyo" }] },
  { id: "hya", title: "ひゃ — HY", chars: [{ kana: "ひゃ", romaji: "hya" }, { kana: "ひゅ", romaji: "hyu" }, { kana: "ひょ", romaji: "hyo" }] },
  { id: "bya", title: "びゃ — BY", chars: [{ kana: "びゃ", romaji: "bya" }, { kana: "びゅ", romaji: "byu" }, { kana: "びょ", romaji: "byo" }] },
  { id: "pya", title: "ぴゃ — PY", chars: [{ kana: "ぴゃ", romaji: "pya" }, { kana: "ぴゅ", romaji: "pyu" }, { kana: "ぴょ", romaji: "pyo" }] },
  { id: "mya", title: "みゃ — MY", chars: [{ kana: "みゃ", romaji: "mya" }, { kana: "みゅ", romaji: "myu" }, { kana: "みょ", romaji: "myo" }] },
  { id: "rya", title: "りゃ — RY", chars: [{ kana: "りゃ", romaji: "rya" }, { kana: "りゅ", romaji: "ryu" }, { kana: "りょ", romaji: "ryo" }] },
];

export const ALL_ROW_GROUPS = [...ROWS, ...DAKUTEN_ROWS, ...COMPOUND_ROWS];

export const ALL_CHARS: CharWithRow[] = ALL_ROW_GROUPS.flatMap((row) =>
  row.chars.map((ch) => ({ ...ch, row: row.id }))
);
