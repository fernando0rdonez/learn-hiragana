/**
 * Words built only from base hiragana (no っ, no は-as-"wa" particle, no long vowels).
 * `rows` lists the distinct row ids (from App.tsx's ROWS) needed to read every kana in the word.
 * Note: ん belongs to row "wa".
 */
export interface WordEntry {
  kana: string;
  romaji: string;
  rows: string[];
  meaning: string;
}

export const WORDS: WordEntry[] = [
  // ── 2 kana ──────────────────────────────────────────────────────────────────
  { kana: "あさ",     romaji: "asa",       rows: ["a", "sa"],             meaning: "mañana" },
  { kana: "いえ",     romaji: "ie",        rows: ["a"],                   meaning: "casa" },
  { kana: "うた",     romaji: "uta",       rows: ["a", "ta"],             meaning: "canción" },
  { kana: "いぬ",     romaji: "inu",       rows: ["a", "na"],             meaning: "perro" },
  { kana: "うみ",     romaji: "umi",       rows: ["a", "ma"],             meaning: "mar" },
  { kana: "いわ",     romaji: "iwa",       rows: ["a", "wa"],             meaning: "roca" },
  { kana: "おか",     romaji: "oka",       rows: ["a", "ka"],             meaning: "colina" },
  { kana: "かさ",     romaji: "kasa",      rows: ["ka", "sa"],            meaning: "sombrilla" },
  { kana: "きく",     romaji: "kiku",      rows: ["ka"],                  meaning: "escuchar" },
  { kana: "くさ",     romaji: "kusa",      rows: ["ka", "sa"],            meaning: "hierba" },
  { kana: "くも",     romaji: "kumo",      rows: ["ka", "ma"],            meaning: "nube" },
  { kana: "こえ",     romaji: "koe",       rows: ["ka", "a"],             meaning: "voz" },
  { kana: "かわ",     romaji: "kawa",      rows: ["ka", "wa"],            meaning: "río" },
  { kana: "かに",     romaji: "kani",      rows: ["ka", "na"],            meaning: "cangrejo" },
  { kana: "まき",     romaji: "maki",      rows: ["ma", "ka"],            meaning: "rollo" },
  { kana: "さる",     romaji: "saru",      rows: ["sa", "ra"],            meaning: "mono" },
  { kana: "しか",     romaji: "shika",     rows: ["sa", "ka"],            meaning: "ciervo" },
  { kana: "すな",     romaji: "suna",      rows: ["sa", "na"],            meaning: "arena" },
  { kana: "そら",     romaji: "sora",      rows: ["sa", "ra"],            meaning: "cielo" },
  { kana: "たこ",     romaji: "tako",      rows: ["ta", "ka"],            meaning: "pulpo" },
  { kana: "つき",     romaji: "tsuki",     rows: ["ta", "ka"],            meaning: "luna" },
  { kana: "てら",     romaji: "tera",      rows: ["ta", "ra"],            meaning: "templo" },
  { kana: "ちち",     romaji: "chichi",    rows: ["ta"],                  meaning: "padre" },
  { kana: "とり",     romaji: "tori",      rows: ["ta", "ra"],            meaning: "pájaro" },
  { kana: "なつ",     romaji: "natsu",     rows: ["na", "ta"],            meaning: "verano" },
  { kana: "なか",     romaji: "naka",      rows: ["na", "ka"],            meaning: "interior" },
  { kana: "なみ",     romaji: "nami",      rows: ["na", "ma"],            meaning: "ola" },
  { kana: "にわ",     romaji: "niwa",      rows: ["na", "wa"],            meaning: "jardín" },
  { kana: "のり",     romaji: "nori",      rows: ["na", "ra"],            meaning: "alga nori" },
  { kana: "ねこ",     romaji: "neko",      rows: ["na", "ka"],            meaning: "gato" },
  { kana: "はな",     romaji: "hana",      rows: ["ha", "na"],            meaning: "flor" },
  { kana: "はこ",     romaji: "hako",      rows: ["ha", "ka"],            meaning: "caja" },
  { kana: "はは",     romaji: "haha",      rows: ["ha"],                  meaning: "madre" },
  { kana: "はる",     romaji: "haru",      rows: ["ha", "ra"],            meaning: "primavera" },
  { kana: "ひる",     romaji: "hiru",      rows: ["ha", "ra"],            meaning: "mediodía" },
  { kana: "ひま",     romaji: "hima",      rows: ["ha", "ma"],            meaning: "tiempo libre" },
  { kana: "ふね",     romaji: "fune",      rows: ["ha", "na"],            meaning: "barco" },
  { kana: "ふゆ",     romaji: "fuyu",      rows: ["ha", "ya"],            meaning: "invierno" },
  { kana: "ほし",     romaji: "hoshi",     rows: ["ha", "sa"],            meaning: "estrella" },
  { kana: "まめ",     romaji: "mame",      rows: ["ma"],                  meaning: "frijol" },
  { kana: "まち",     romaji: "machi",     rows: ["ma", "ta"],            meaning: "ciudad" },
  { kana: "みち",     romaji: "michi",     rows: ["ma", "ta"],            meaning: "camino" },
  { kana: "もの",     romaji: "mono",      rows: ["ma", "na"],            meaning: "cosa" },
  { kana: "もも",     romaji: "momo",      rows: ["ma"],                  meaning: "durazno" },
  { kana: "むし",     romaji: "mushi",     rows: ["ma", "sa"],            meaning: "insecto" },
  { kana: "むら",     romaji: "mura",      rows: ["ma", "ra"],            meaning: "pueblo" },
  { kana: "もり",     romaji: "mori",      rows: ["ma", "ra"],            meaning: "bosque" },
  { kana: "やま",     romaji: "yama",      rows: ["ya", "ma"],            meaning: "montaña" },
  { kana: "やね",     romaji: "yane",      rows: ["ya", "na"],            meaning: "techo" },
  { kana: "ゆき",     romaji: "yuki",      rows: ["ya", "ka"],            meaning: "nieve" },
  { kana: "ゆか",     romaji: "yuka",      rows: ["ya", "ka"],            meaning: "suelo" },
  { kana: "ゆめ",     romaji: "yume",      rows: ["ya", "ma"],            meaning: "sueño" },
  { kana: "よる",     romaji: "yoru",      rows: ["ya", "ra"],            meaning: "noche" },
  { kana: "らく",     romaji: "raku",      rows: ["ra", "ka"],            meaning: "cómodo" },
  { kana: "りす",     romaji: "risu",      rows: ["ra", "sa"],            meaning: "ardilla" },
  { kana: "わに",     romaji: "wani",      rows: ["wa", "na"],            meaning: "cocodrilo" },

  // ── 3 kana ──────────────────────────────────────────────────────────────────
  { kana: "さかな",   romaji: "sakana",    rows: ["sa", "ka", "na"],      meaning: "pez" },
  { kana: "たぬき",   romaji: "tanuki",    rows: ["ta", "na", "ka"],      meaning: "tejón" },
  { kana: "みかん",   romaji: "mikan",     rows: ["ma", "ka", "wa"],      meaning: "mandarina" },
  { kana: "わたし",   romaji: "watashi",   rows: ["wa", "ta", "sa"],      meaning: "yo" },
  { kana: "くるま",   romaji: "kuruma",    rows: ["ka", "ra", "ma"],      meaning: "coche" },
  { kana: "あした",   romaji: "ashita",    rows: ["a", "sa", "ta"],       meaning: "mañana (día)" },
  { kana: "あたま",   romaji: "atama",     rows: ["a", "ta", "ma"],       meaning: "cabeza" },
  { kana: "あおい",   romaji: "aoi",       rows: ["a"],                   meaning: "azul" },
  { kana: "いのち",   romaji: "inochi",    rows: ["a", "na", "ta"],       meaning: "vida" },
  { kana: "いなか",   romaji: "inaka",     rows: ["a", "na", "ka"],       meaning: "campo" },
  { kana: "うしろ",   romaji: "ushiro",    rows: ["a", "sa", "ra"],       meaning: "detrás" },
  { kana: "うまれ",   romaji: "umare",     rows: ["a", "ma", "ra"],       meaning: "nacimiento" },
  { kana: "おかし",   romaji: "okashi",    rows: ["a", "ka", "sa"],       meaning: "dulce" },
  { kana: "おなか",   romaji: "onaka",     rows: ["a", "na", "ka"],       meaning: "barriga" },
  { kana: "おとこ",   romaji: "otoko",     rows: ["a", "ta", "ka"],       meaning: "hombre" },
  { kana: "からす",   romaji: "karasu",    rows: ["ka", "ra", "sa"],      meaning: "cuervo" },
  { kana: "かたち",   romaji: "katachi",   rows: ["ka", "ta"],            meaning: "forma" },
  { kana: "きもの",   romaji: "kimono",    rows: ["ka", "ma", "na"],      meaning: "kimono" },
  { kana: "きのこ",   romaji: "kinoko",    rows: ["ka", "na"],            meaning: "hongo" },
  { kana: "くすり",   romaji: "kusuri",    rows: ["ka", "sa", "ra"],      meaning: "medicina" },
  { kana: "こころ",   romaji: "kokoro",    rows: ["ka", "ra"],            meaning: "corazón" },
  { kana: "こたえ",   romaji: "kotae",     rows: ["ka", "ta", "a"],       meaning: "respuesta" },
  { kana: "こたつ",   romaji: "kotatsu",   rows: ["ka", "ta"],            meaning: "kotatsu" },
  { kana: "さくら",   romaji: "sakura",    rows: ["sa", "ka", "ra"],      meaning: "cerezo" },
  { kana: "すもう",   romaji: "sumo",      rows: ["sa", "ma", "a"],       meaning: "sumo" },
  { kana: "たから",   romaji: "takara",    rows: ["ta", "ka", "ra"],      meaning: "tesoro" },
  { kana: "たわし",   romaji: "tawashi",   rows: ["ta", "wa", "sa"],      meaning: "estropajo" },
  { kana: "てんき",   romaji: "tenki",     rows: ["ta", "wa", "ka"],      meaning: "clima" },
  { kana: "なかま",   romaji: "nakama",    rows: ["na", "ka", "ma"],      meaning: "compañero" },
  { kana: "はなみ",   romaji: "hanami",    rows: ["ha", "na", "ma"],      meaning: "hanami" },
  { kana: "はしら",   romaji: "hashira",   rows: ["ha", "sa", "ra"],      meaning: "columna" },
  { kana: "はたけ",   romaji: "hatake",    rows: ["ha", "ta", "ka"],      meaning: "campo de cultivo" },
  { kana: "ひかり",   romaji: "hikari",    rows: ["ha", "ka", "ra"],      meaning: "luz" },
  { kana: "ひとり",   romaji: "hitori",    rows: ["ha", "ta", "ra"],      meaning: "solo" },
  { kana: "ひなた",   romaji: "hinata",    rows: ["ha", "na", "ta"],      meaning: "lugar soleado" },
  { kana: "ほたる",   romaji: "hotaru",    rows: ["ha", "ta", "ra"],      meaning: "luciérnaga" },
  { kana: "まくら",   romaji: "makura",    rows: ["ma", "ka", "ra"],      meaning: "almohada" },
  { kana: "まつり",   romaji: "matsuri",   rows: ["ma", "ta", "ra"],      meaning: "festival" },
  { kana: "まるい",   romaji: "marui",     rows: ["ma", "ra", "a"],       meaning: "redondo" },
  { kana: "まわり",   romaji: "mawari",    rows: ["ma", "wa", "ra"],      meaning: "alrededor" },
  { kana: "みなみ",   romaji: "minami",    rows: ["ma", "na"],            meaning: "sur" },
  { kana: "むかし",   romaji: "mukashi",   rows: ["ma", "ka", "sa"],      meaning: "antaño" },
  { kana: "ねむり",   romaji: "nemuri",    rows: ["na", "ma", "ra"],      meaning: "sueño (dormir)" },
  { kana: "のこり",   romaji: "nokori",    rows: ["na", "ka", "ra"],      meaning: "resto" },
  { kana: "のはら",   romaji: "nohara",    rows: ["na", "ha", "ra"],      meaning: "pradera" },
  { kana: "わかれ",   romaji: "wakare",    rows: ["wa", "ka", "ra"],      meaning: "despedida" },
  { kana: "わかめ",   romaji: "wakame",    rows: ["wa", "ka", "ma"],      meaning: "alga wakame" },
  { kana: "やさい",   romaji: "yasai",     rows: ["ya", "sa", "a"],       meaning: "verdura" },
  { kana: "ゆかた",   romaji: "yukata",    rows: ["ya", "ka", "ta"],      meaning: "yukata" },

  // ── 4 kana ──────────────────────────────────────────────────────────────────
  { kana: "しまうま", romaji: "shimauma",  rows: ["sa", "ma", "a"],       meaning: "cebra" },
  { kana: "さむらい", romaji: "samurai",   rows: ["sa", "ma", "ra", "a"], meaning: "samurái" },
  { kana: "たてもの", romaji: "tatemono",  rows: ["ta", "ma", "na"],      meaning: "edificio" },
  { kana: "むらさき", romaji: "murasaki",  rows: ["ma", "ra", "sa", "ka"],meaning: "morado" },
  { kana: "わかもの", romaji: "wakamono",  rows: ["wa", "ka", "ma", "na"],meaning: "joven" },
  { kana: "はたらく", romaji: "hataraku",  rows: ["ha", "ta", "ra", "ka"],meaning: "trabajar" },
  { kana: "なかよし", romaji: "nakayoshi", rows: ["na", "ka", "ya", "sa"],meaning: "buen amigo" },
  { kana: "にわとり", romaji: "niwatori",  rows: ["na", "wa", "ta", "ra"],meaning: "gallina" },
  { kana: "ふるさと", romaji: "furusato",  rows: ["ha", "ra", "sa", "ta"],meaning: "tierra natal" },
  { kana: "かわうそ", romaji: "kawauso",   rows: ["ka", "wa", "a", "sa"], meaning: "nutria" },

  // ── Dakuten / Handakuten ─────────────────────────────────────────────────────
  { kana: "ぶた",   romaji: "buta",   rows: ["ba", "ta"],          meaning: "cerdo" },
  { kana: "ぞう",   romaji: "zou",    rows: ["za", "a"],           meaning: "elefante" },
  { kana: "げた",   romaji: "geta",   rows: ["ga", "ta"],          meaning: "sandalias" },
  { kana: "ばら",   romaji: "bara",   rows: ["ba", "ra"],          meaning: "rosa" },
  { kana: "どろ",   romaji: "doro",   rows: ["da", "ra"],          meaning: "barro" },
  { kana: "がか",   romaji: "gaka",   rows: ["ga", "ka"],          meaning: "pintor" },
  { kana: "ごみ",   romaji: "gomi",   rows: ["ga", "ma"],          meaning: "basura" },
  { kana: "びわ",   romaji: "biwa",   rows: ["ba", "wa"],          meaning: "laúd biwa" },
  { kana: "ぱん",   romaji: "pan",    rows: ["pa", "wa"],          meaning: "pan" },
  { kana: "どこ",   romaji: "doko",   rows: ["da", "ka"],          meaning: "dónde" },
  { kana: "だれ",   romaji: "dare",   rows: ["da", "ra"],          meaning: "quién" },
  { kana: "ごはん", romaji: "gohan",  rows: ["ga", "ha", "wa"],    meaning: "arroz/comida" },
  { kana: "じかん", romaji: "jikan",  rows: ["za", "ka", "wa"],    meaning: "tiempo" },
  { kana: "ぼたん", romaji: "botan",  rows: ["ba", "ta", "wa"],    meaning: "peonía" },
  { kana: "ぎんか", romaji: "ginka",  rows: ["ga", "wa", "ka"],    meaning: "moneda de plata" },
  { kana: "だいず", romaji: "daizu",  rows: ["da", "a", "za"],     meaning: "soja" },

  // ── Combinaciones (拗音) ──────────────────────────────────────────────────────
  { kana: "おちゃ",   romaji: "ocha",    rows: ["a", "cha"],          meaning: "té" },
  { kana: "きゃく",   romaji: "kyaku",   rows: ["kya", "ka"],         meaning: "huésped" },
  { kana: "じゃり",   romaji: "jari",    rows: ["ja", "ra"],          meaning: "grava" },
  { kana: "ひゃく",   romaji: "hyaku",   rows: ["hya", "ka"],         meaning: "cien" },
  { kana: "りゅう",   romaji: "ryuu",    rows: ["rya", "a"],          meaning: "dragón" },
  { kana: "しゃしん", romaji: "shashin", rows: ["sha", "sa", "wa"],   meaning: "foto" },
  { kana: "ちゃわん", romaji: "chawan",  rows: ["cha", "wa"],         meaning: "tazón de arroz" },
  { kana: "みゃく",   romaji: "myaku",   rows: ["mya", "ka"],         meaning: "pulso" },
  { kana: "にゃん",   romaji: "nyan",    rows: ["nya", "wa"],         meaning: "miau" },
];

/** Returns words whose every required row passes `isRowReady` (selected or already mastered). */
export function getAvailableWords(isRowReady: (rowId: string) => boolean): WordEntry[] {
  return WORDS.filter((w) => w.rows.every(isRowReady));
}

// ── Spell-It words ─────────────────────────────────────────────────────────────

export interface SpellWordEntry {
  id: string;
  hiragana: string;
  romaji: string;
  meaning: string;
  emoji: string;
  emojiLabel: string;
  rows: string[];
  /** Explicit syllable units for compound-kana words (e.g. ["お","ちゃ"] for おちゃ). */
  kanaUnits?: string[];
}

export const SPELL_WORDS: SpellWordEntry[] = [
  { id: "asa",     hiragana: "あさ",   romaji: "asa",     meaning: "mañana",    emoji: "🌅", emojiLabel: "sunrise",     rows: ["a", "sa"] },
  { id: "ie",      hiragana: "いえ",   romaji: "ie",      meaning: "casa",      emoji: "🏠", emojiLabel: "house",       rows: ["a"] },
  { id: "uta",     hiragana: "うた",   romaji: "uta",     meaning: "canción",   emoji: "🎵", emojiLabel: "music note",  rows: ["a", "ta"] },
  { id: "kasa",    hiragana: "かさ",   romaji: "kasa",    meaning: "sombrilla", emoji: "☂️", emojiLabel: "umbrella",    rows: ["ka", "sa"] },
  { id: "kiku",    hiragana: "きく",   romaji: "kiku",    meaning: "escuchar",  emoji: "🌼", emojiLabel: "flower",      rows: ["ka"] },
  { id: "sakana",  hiragana: "さかな", romaji: "sakana",  meaning: "pez",       emoji: "🐟", emojiLabel: "fish",        rows: ["sa", "ka", "na"] },
  { id: "sora",    hiragana: "そら",   romaji: "sora",    meaning: "cielo",     emoji: "🌤️", emojiLabel: "sky",         rows: ["sa", "ra"] },
  { id: "tanuki",  hiragana: "たぬき", romaji: "tanuki",  meaning: "mapache",   emoji: "🦝", emojiLabel: "raccoon",     rows: ["ta", "na", "ka"] },
  { id: "tori",    hiragana: "とり",   romaji: "tori",    meaning: "pájaro",    emoji: "🐦", emojiLabel: "bird",        rows: ["ta", "ra"] },
  { id: "natsu",   hiragana: "なつ",   romaji: "natsu",   meaning: "verano",    emoji: "☀️", emojiLabel: "summer sun",  rows: ["na", "ta"] },
  { id: "neko",    hiragana: "ねこ",   romaji: "neko",    meaning: "gato",      emoji: "🐱", emojiLabel: "cat",         rows: ["na", "ka"] },
  { id: "hana",    hiragana: "はな",   romaji: "hana",    meaning: "flor",      emoji: "🌸", emojiLabel: "cherry blossom", rows: ["ha", "na"] },
  { id: "mame",    hiragana: "まめ",   romaji: "mame",    meaning: "frijol",    emoji: "🫘", emojiLabel: "beans",       rows: ["ma"] },
  { id: "mikan",   hiragana: "みかん", romaji: "mikan",   meaning: "mandarina", emoji: "🍊", emojiLabel: "orange",      rows: ["ma", "ka", "wa"] },
  { id: "yama",    hiragana: "やま",   romaji: "yama",    meaning: "montaña",   emoji: "⛰️", emojiLabel: "mountain",    rows: ["ya", "ma"] },
  { id: "yuki",    hiragana: "ゆき",   romaji: "yuki",    meaning: "nieve",     emoji: "❄️", emojiLabel: "snowflake",   rows: ["ya", "ka"] },
  { id: "yoru",    hiragana: "よる",   romaji: "yoru",    meaning: "noche",     emoji: "🌙", emojiLabel: "moon",        rows: ["ya", "ra"] },
  { id: "watashi", hiragana: "わたし", romaji: "watashi", meaning: "yo",        emoji: "🙋", emojiLabel: "person",      rows: ["wa", "ta", "sa"] },
  { id: "kuruma",  hiragana: "くるま", romaji: "kuruma",  meaning: "coche",     emoji: "🚗", emojiLabel: "car",         rows: ["ka", "ra", "ma"] },

  // ── Dakuten / Handakuten ─────────────────────────────────────────────────────
  { id: "buta",   hiragana: "ぶた",   romaji: "buta",   meaning: "cerdo",     emoji: "🐷", emojiLabel: "pig",         rows: ["ba", "ta"] },
  { id: "zou",    hiragana: "ぞう",   romaji: "zou",    meaning: "elefante",  emoji: "🐘", emojiLabel: "elephant",    rows: ["za", "a"] },
  { id: "bara",   hiragana: "ばら",   romaji: "bara",   meaning: "rosa",      emoji: "🌹", emojiLabel: "rose",        rows: ["ba", "ra"] },
  { id: "gohan",  hiragana: "ごはん", romaji: "gohan",  meaning: "arroz",     emoji: "🍚", emojiLabel: "rice",        rows: ["ga", "ha", "wa"] },
  { id: "pan",    hiragana: "ぱん",   romaji: "pan",    meaning: "pan",       emoji: "🍞", emojiLabel: "bread",       rows: ["pa", "wa"] },
  { id: "jikan",  hiragana: "じかん", romaji: "jikan",  meaning: "tiempo",    emoji: "⏰", emojiLabel: "clock",       rows: ["za", "ka", "wa"] },
  { id: "gomi",   hiragana: "ごみ",   romaji: "gomi",   meaning: "basura",    emoji: "🗑️", emojiLabel: "trash",       rows: ["ga", "ma"] },
  { id: "doko",   hiragana: "どこ",   romaji: "doko",   meaning: "dónde",     emoji: "🗺️", emojiLabel: "map",         rows: ["da", "ka"] },

  // ── Combinaciones (拗音) ──────────────────────────────────────────────────────
  { id: "ocha",    hiragana: "おちゃ",   romaji: "ocha",    meaning: "té",      emoji: "🍵", emojiLabel: "tea",     rows: ["a", "cha"],        kanaUnits: ["お", "ちゃ"] },
  { id: "kyaku",   hiragana: "きゃく",   romaji: "kyaku",   meaning: "huésped", emoji: "🛎️", emojiLabel: "bell",    rows: ["kya", "ka"],        kanaUnits: ["きゃ", "く"] },
  { id: "shashin", hiragana: "しゃしん", romaji: "shashin", meaning: "foto",    emoji: "📷", emojiLabel: "camera",  rows: ["sha", "sa", "wa"], kanaUnits: ["しゃ", "し", "ん"] },
  { id: "chawan",  hiragana: "ちゃわん", romaji: "chawan",  meaning: "tazón",   emoji: "🥣", emojiLabel: "bowl",    rows: ["cha", "wa"],        kanaUnits: ["ちゃ", "わ", "ん"] },
  { id: "ryuu",    hiragana: "りゅう",   romaji: "ryuu",    meaning: "dragón",  emoji: "🐉", emojiLabel: "dragon",  rows: ["rya", "a"],         kanaUnits: ["りゅ", "う"] },
  { id: "hyaku",   hiragana: "ひゃく",   romaji: "hyaku",   meaning: "cien",    emoji: "💯", emojiLabel: "hundred", rows: ["hya", "ka"],        kanaUnits: ["ひゃ", "く"] },
];

export const getSpellWordById = (id: string): SpellWordEntry | undefined =>
  SPELL_WORDS.find((w) => w.id === id);

export function getAvailableSpellWords(isRowReady: (rowId: string) => boolean): SpellWordEntry[] {
  return SPELL_WORDS.filter((w) => w.rows.every(isRowReady));
}
