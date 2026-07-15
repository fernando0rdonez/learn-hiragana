export interface KanjiExample {
  word: string;    // palabra completa con kanji, p.ej. "今日"
  kana: string;    // lectura completa de la palabra, p.ej. "きょう"
  meaning: string; // significado en español de la palabra (no del carácter suelto)
}

export interface KanjiEntry {
  kanji: string;
  meanings: string[];  // significado(s) del carácter en español
  onyomi: string[];    // lecturas on, en katakana
  kunyomi: string[];   // lecturas kun, en hiragana (okurigana entre paréntesis)
  examples: KanjiExample[];
  group: string;       // KanjiGroup.id
}

export interface KanjiGroupIntro {
  title: string;
  body: string;
}

export interface KanjiGroup {
  id: string;
  label: string;
  emoji: string;
  image?: string;      // slug key into getVocabImageUrl() (src/vocabImages.ts); fallback al emoji si no hay imagen generada
  /** Explicación mostrada antes de la primera sesión de Lectura de este grupo (BACKLOG: つ para contar cosas). */
  readingIntro?: KanjiGroupIntro;
}

export const KANJI_GROUPS: KanjiGroup[] = [
  { id: "numeros",    label: "Números",              emoji: "🔢" , image: "category-numeros", readingIntro: {
    title: "Una lectura especial para contar",
    body: "Además del número simple (一 いち, 二 に, 三 さん…), el japonés tiene una serie distinta con 「つ」 para contar cosas en general: 一つ ひとつ, 二つ ふたつ, 三つ みっつ… No es un error ni una lectura rara: es la lectura kun que vas a ver en las palabras de ejemplo de este grupo, y conviene aprenderla como una lectura más de cada kanji.",
  } },
  { id: "calendario", label: "Calendario",           emoji: "📅" },
  { id: "tiempo",     label: "Tiempo",               emoji: "⏰" , image: "category-tiempo" },
  { id: "naturaleza", label: "Naturaleza",           emoji: "🌿" , image: "category-naturaleza" },
  { id: "familia",    label: "Familia",              emoji: "👨‍👩‍👧" , image: "category-familia" },
  { id: "cuerpo",     label: "Cuerpo",               emoji: "🫀" , image: "category-cuerpo" },
  { id: "escuela",    label: "Escuela",              emoji: "🏫" , image: "category-escuela" },
  { id: "lugares",    label: "Lugares y direcciones", emoji: "🧭" , image: "category-lugares" },
  { id: "adjetivos",  label: "Adjetivos",            emoji: "✨" , image: "category-adjetivos" },
  { id: "verbos",     label: "Verbos",               emoji: "⚡" , image: "category-verbos" },
];

// Los ~100 kanji de N5, agrupados temáticamente (BACKLOG #5). Los `examples`
// son palabras que ya existen en src/vocabulary.ts (anclaje i+1, METODOLOGIA
// §2.4) — la única excepción es el grupo "numeros": los números viven en su
// propio módulo (src/numbers.ts) desde BACKLOG #11 y ya no están en
// vocabulary.ts, así que sus ejemplos usan la serie nativa de conteo
// ひとつ・ふたつ… (la lectura kun de cada kanji), que el alumno ya conoce por
// el módulo Números.
export const KANJI: KanjiEntry[] = [
  // ── Números ──────────────────────────────────────────────────────────────
  { kanji: "一", meanings: ["uno"], onyomi: ["イチ", "イツ"], kunyomi: ["ひと(つ)"], group: "numeros",
    examples: [{ word: "一番", kana: "いちばん", meaning: "el más / número uno" }] },
  { kanji: "二", meanings: ["dos"], onyomi: ["ニ"], kunyomi: ["ふた(つ)"], group: "numeros",
    examples: [{ word: "二つ", kana: "ふたつ", meaning: "dos (cosas)" }] },
  { kanji: "三", meanings: ["tres"], onyomi: ["サン"], kunyomi: ["み(つ)"], group: "numeros",
    examples: [{ word: "三つ", kana: "みっつ", meaning: "tres (cosas)" }] },
  { kanji: "四", meanings: ["cuatro"], onyomi: ["シ"], kunyomi: ["よ", "よ(つ)", "よん"], group: "numeros",
    examples: [{ word: "四つ", kana: "よっつ", meaning: "cuatro (cosas)" }] },
  { kanji: "五", meanings: ["cinco"], onyomi: ["ゴ"], kunyomi: ["いつ(つ)"], group: "numeros",
    examples: [{ word: "五つ", kana: "いつつ", meaning: "cinco (cosas)" }] },
  { kanji: "六", meanings: ["seis"], onyomi: ["ロク"], kunyomi: ["む(つ)"], group: "numeros",
    examples: [{ word: "六つ", kana: "むっつ", meaning: "seis (cosas)" }] },
  { kanji: "七", meanings: ["siete"], onyomi: ["シチ"], kunyomi: ["なな(つ)"], group: "numeros",
    examples: [{ word: "七つ", kana: "ななつ", meaning: "siete (cosas)" }] },
  { kanji: "八", meanings: ["ocho"], onyomi: ["ハチ"], kunyomi: ["や(つ)"], group: "numeros",
    examples: [{ word: "八つ", kana: "やっつ", meaning: "ocho (cosas)" }] },
  { kanji: "九", meanings: ["nueve"], onyomi: ["キュウ", "ク"], kunyomi: ["ここの(つ)"], group: "numeros",
    examples: [{ word: "九つ", kana: "ここのつ", meaning: "nueve (cosas)" }] },
  { kanji: "十", meanings: ["diez"], onyomi: ["ジュウ"], kunyomi: ["とお"], group: "numeros",
    examples: [{ word: "十", kana: "とお", meaning: "diez (cosas)" }] },

  // ── Calendario ───────────────────────────────────────────────────────────
  { kanji: "日", meanings: ["día", "sol"], onyomi: ["ニチ", "ジツ"], kunyomi: ["ひ", "か"], group: "calendario",
    examples: [{ word: "今日", kana: "きょう", meaning: "hoy" }, { word: "毎日", kana: "まいにち", meaning: "todos los días" }] },
  { kanji: "月", meanings: ["mes", "luna"], onyomi: ["ゲツ", "ガツ"], kunyomi: ["つき"], group: "calendario",
    examples: [{ word: "今月", kana: "こんげつ", meaning: "este mes" }, { word: "来月", kana: "らいげつ", meaning: "el mes que viene" }] },
  { kanji: "火", meanings: ["fuego"], onyomi: ["カ"], kunyomi: ["ひ"], group: "calendario",
    examples: [{ word: "火曜日", kana: "かようび", meaning: "martes" }] },
  { kanji: "水", meanings: ["agua"], onyomi: ["スイ"], kunyomi: ["みず"], group: "calendario",
    examples: [{ word: "水曜日", kana: "すいようび", meaning: "miércoles" }] },
  { kanji: "木", meanings: ["árbol"], onyomi: ["モク", "ボク"], kunyomi: ["き"], group: "calendario",
    examples: [{ word: "木曜日", kana: "もくようび", meaning: "jueves" }] },
  { kanji: "金", meanings: ["oro", "dinero"], onyomi: ["キン"], kunyomi: ["かね"], group: "calendario",
    examples: [{ word: "金曜日", kana: "きんようび", meaning: "viernes" }] },
  { kanji: "土", meanings: ["tierra"], onyomi: ["ド", "ト"], kunyomi: ["つち"], group: "calendario",
    examples: [{ word: "土曜日", kana: "どようび", meaning: "sábado" }] },
  { kanji: "曜", meanings: ["día de la semana"], onyomi: ["ヨウ"], kunyomi: [], group: "calendario",
    examples: [{ word: "月曜日", kana: "げつようび", meaning: "lunes" }, { word: "日曜日", kana: "にちようび", meaning: "domingo" }] },
  { kanji: "年", meanings: ["año"], onyomi: ["ネン"], kunyomi: ["とし"], group: "calendario",
    examples: [{ word: "今年", kana: "ことし", meaning: "este año" }, { word: "来年", kana: "らいねん", meaning: "el año que viene" }] },
  { kanji: "今", meanings: ["ahora"], onyomi: ["コン", "キン"], kunyomi: ["いま"], group: "calendario",
    examples: [{ word: "今", kana: "いま", meaning: "ahora" }, { word: "今日", kana: "きょう", meaning: "hoy" }] },

  // ── Tiempo ───────────────────────────────────────────────────────────────
  { kanji: "明", meanings: ["claro", "brillante"], onyomi: ["メイ"], kunyomi: ["あか(るい)"], group: "tiempo",
    examples: [{ word: "明日", kana: "あした", meaning: "mañana" }, { word: "明後日", kana: "あさって", meaning: "pasado mañana" }] },
  { kanji: "昨", meanings: ["pasado", "anterior"], onyomi: ["サク"], kunyomi: [], group: "tiempo",
    examples: [{ word: "昨日", kana: "きのう", meaning: "ayer" }] },
  { kanji: "毎", meanings: ["cada"], onyomi: ["マイ"], kunyomi: [], group: "tiempo",
    examples: [{ word: "毎日", kana: "まいにち", meaning: "todos los días" }, { word: "毎週", kana: "まいしゅう", meaning: "cada semana" }] },
  { kanji: "週", meanings: ["semana"], onyomi: ["シュウ"], kunyomi: [], group: "tiempo",
    examples: [{ word: "今週", kana: "こんしゅう", meaning: "esta semana" }, { word: "先週", kana: "せんしゅう", meaning: "la semana pasada" }] },
  { kanji: "先", meanings: ["antes", "previo"], onyomi: ["セン"], kunyomi: ["さき"], group: "tiempo",
    examples: [{ word: "先週", kana: "せんしゅう", meaning: "la semana pasada" }, { word: "先生", kana: "せんせい", meaning: "maestro / profesor" }] },
  { kanji: "来", meanings: ["venir", "próximo"], onyomi: ["ライ"], kunyomi: ["く(る)"], group: "tiempo",
    examples: [{ word: "来年", kana: "らいねん", meaning: "el año que viene" }, { word: "来週", kana: "らいしゅう", meaning: "la semana que viene" }] },
  { kanji: "午", meanings: ["mediodía"], onyomi: ["ゴ"], kunyomi: [], group: "tiempo",
    examples: [{ word: "午前", kana: "ごぜん", meaning: "por la mañana (a. m.)" }, { word: "午後", kana: "ごご", meaning: "por la tarde (p. m.)" }] },
  { kanji: "前", meanings: ["delante", "antes"], onyomi: ["ゼン"], kunyomi: ["まえ"], group: "tiempo",
    examples: [{ word: "午前", kana: "ごぜん", meaning: "por la mañana (a. m.)" }, { word: "前", kana: "まえ", meaning: "delante / antes" }] },
  { kanji: "後", meanings: ["después", "detrás"], onyomi: ["ゴ", "コウ"], kunyomi: ["あと", "うし(ろ)"], group: "tiempo",
    examples: [{ word: "午後", kana: "ごご", meaning: "por la tarde (p. m.)" }, { word: "後", kana: "あと", meaning: "después" }] },
  { kanji: "時", meanings: ["hora", "tiempo"], onyomi: ["ジ"], kunyomi: ["とき"], group: "tiempo",
    examples: [{ word: "時間", kana: "じかん", meaning: "tiempo / hora" }, { word: "時", kana: "とき", meaning: "momento / ocasión" }] },

  // ── Naturaleza ───────────────────────────────────────────────────────────
  { kanji: "間", meanings: ["intervalo", "entre"], onyomi: ["カン"], kunyomi: ["あいだ"], group: "naturaleza",
    examples: [{ word: "時間", kana: "じかん", meaning: "tiempo / hora" }, { word: "間", kana: "あいだ", meaning: "entre / intervalo" }] },
  { kanji: "春", meanings: ["primavera"], onyomi: ["シュン"], kunyomi: ["はる"], group: "naturaleza",
    examples: [{ word: "春", kana: "はる", meaning: "primavera" }] },
  { kanji: "夏", meanings: ["verano"], onyomi: ["カ"], kunyomi: ["なつ"], group: "naturaleza",
    examples: [{ word: "夏", kana: "なつ", meaning: "verano" }, { word: "夏休み", kana: "なつやすみ", meaning: "vacaciones de verano" }] },
  { kanji: "秋", meanings: ["otoño"], onyomi: ["シュウ"], kunyomi: ["あき"], group: "naturaleza",
    examples: [{ word: "秋", kana: "あき", meaning: "otoño" }] },
  { kanji: "冬", meanings: ["invierno"], onyomi: ["トウ"], kunyomi: ["ふゆ"], group: "naturaleza",
    examples: [{ word: "冬", kana: "ふゆ", meaning: "invierno" }] },
  { kanji: "休", meanings: ["descanso", "descansar"], onyomi: ["キュウ"], kunyomi: ["やす(む)"], group: "naturaleza",
    examples: [{ word: "休み", kana: "やすみ", meaning: "descanso / vacaciones" }, { word: "夏休み", kana: "なつやすみ", meaning: "vacaciones de verano" }] },
  { kanji: "山", meanings: ["montaña"], onyomi: ["サン"], kunyomi: ["やま"], group: "naturaleza",
    examples: [{ word: "山", kana: "やま", meaning: "montaña" }] },
  { kanji: "川", meanings: ["río"], onyomi: ["セン"], kunyomi: ["かわ"], group: "naturaleza",
    examples: [{ word: "川", kana: "かわ", meaning: "río" }] },
  { kanji: "空", meanings: ["cielo", "vacío"], onyomi: ["クウ"], kunyomi: ["そら", "から"], group: "naturaleza",
    examples: [{ word: "空", kana: "そら", meaning: "cielo" }] },
  { kanji: "雨", meanings: ["lluvia"], onyomi: ["ウ"], kunyomi: ["あめ"], group: "naturaleza",
    examples: [{ word: "雨", kana: "あめ", meaning: "lluvia" }] },

  // ── Familia ──────────────────────────────────────────────────────────────
  { kanji: "人", meanings: ["persona"], onyomi: ["ジン", "ニン"], kunyomi: ["ひと"], group: "familia",
    examples: [{ word: "人", kana: "ひと", meaning: "persona" }] },
  { kanji: "子", meanings: ["niño", "hijo"], onyomi: ["シ"], kunyomi: ["こ"], group: "familia",
    examples: [{ word: "子供", kana: "こども", meaning: "niño/a" }] },
  { kanji: "女", meanings: ["mujer"], onyomi: ["ジョ"], kunyomi: ["おんな"], group: "familia",
    examples: [{ word: "女", kana: "おんな", meaning: "mujer" }] },
  { kanji: "男", meanings: ["hombre"], onyomi: ["ダン", "ナン"], kunyomi: ["おとこ"], group: "familia",
    examples: [{ word: "男", kana: "おとこ", meaning: "hombre" }] },
  { kanji: "父", meanings: ["padre"], onyomi: ["フ"], kunyomi: ["ちち"], group: "familia",
    examples: [{ word: "父", kana: "ちち", meaning: "mi padre" }] },
  { kanji: "母", meanings: ["madre"], onyomi: ["ボ"], kunyomi: ["はは"], group: "familia",
    examples: [{ word: "母", kana: "はは", meaning: "mi madre" }] },
  { kanji: "兄", meanings: ["hermano mayor"], onyomi: ["ケイ", "キョウ"], kunyomi: ["あに"], group: "familia",
    examples: [{ word: "兄", kana: "あに", meaning: "mi hermano mayor" }] },
  { kanji: "姉", meanings: ["hermana mayor"], onyomi: ["シ"], kunyomi: ["あね"], group: "familia",
    examples: [{ word: "姉", kana: "あね", meaning: "mi hermana mayor" }] },
  { kanji: "弟", meanings: ["hermano menor"], onyomi: ["ダイ", "テイ"], kunyomi: ["おとうと"], group: "familia",
    examples: [{ word: "弟", kana: "おとうと", meaning: "hermano menor" }] },
  { kanji: "妹", meanings: ["hermana menor"], onyomi: ["マイ"], kunyomi: ["いもうと"], group: "familia",
    examples: [{ word: "妹", kana: "いもうと", meaning: "hermana menor" }] },

  // ── Cuerpo ───────────────────────────────────────────────────────────────
  { kanji: "目", meanings: ["ojo"], onyomi: ["モク"], kunyomi: ["め"], group: "cuerpo",
    examples: [{ word: "目", kana: "め", meaning: "ojo" }] },
  { kanji: "耳", meanings: ["oreja"], onyomi: ["ジ"], kunyomi: ["みみ"], group: "cuerpo",
    examples: [{ word: "耳", kana: "みみ", meaning: "oreja" }] },
  { kanji: "口", meanings: ["boca"], onyomi: ["コウ"], kunyomi: ["くち"], group: "cuerpo",
    examples: [{ word: "口", kana: "くち", meaning: "boca" }] },
  { kanji: "手", meanings: ["mano"], onyomi: ["シュ"], kunyomi: ["て"], group: "cuerpo",
    examples: [{ word: "手", kana: "て", meaning: "mano" }] },
  { kanji: "足", meanings: ["pie", "pierna"], onyomi: ["ソク"], kunyomi: ["あし"], group: "cuerpo",
    examples: [{ word: "足", kana: "あし", meaning: "pie / pierna" }] },
  { kanji: "体", meanings: ["cuerpo"], onyomi: ["タイ"], kunyomi: ["からだ"], group: "cuerpo",
    examples: [{ word: "体", kana: "からだ", meaning: "cuerpo" }] },
  { kanji: "頭", meanings: ["cabeza"], onyomi: ["トウ", "ズ"], kunyomi: ["あたま"], group: "cuerpo",
    examples: [{ word: "頭", kana: "あたま", meaning: "cabeza" }] },
  { kanji: "顔", meanings: ["cara"], onyomi: ["ガン"], kunyomi: ["かお"], group: "cuerpo",
    examples: [{ word: "顔", kana: "かお", meaning: "cara" }] },
  { kanji: "病", meanings: ["enfermedad"], onyomi: ["ビョウ"], kunyomi: ["やまい"], group: "cuerpo",
    examples: [{ word: "病気", kana: "びょうき", meaning: "enfermedad" }] },
  { kanji: "気", meanings: ["energía", "ánimo"], onyomi: ["キ", "ケ"], kunyomi: [], group: "cuerpo",
    examples: [{ word: "天気", kana: "てんき", meaning: "clima / tiempo" }, { word: "元気", kana: "げんき", meaning: "animado / con energía" }] },

  // ── Escuela ──────────────────────────────────────────────────────────────
  { kanji: "学", meanings: ["aprender", "estudio"], onyomi: ["ガク"], kunyomi: ["まな(ぶ)"], group: "escuela",
    examples: [{ word: "学校", kana: "がっこう", meaning: "escuela" }, { word: "学生", kana: "がくせい", meaning: "estudiante" }] },
  { kanji: "校", meanings: ["escuela"], onyomi: ["コウ"], kunyomi: [], group: "escuela",
    examples: [{ word: "学校", kana: "がっこう", meaning: "escuela" }] },
  { kanji: "生", meanings: ["vida", "nacer", "crudo"], onyomi: ["セイ", "ショウ"], kunyomi: ["い(きる)", "う(まれる)", "なま"], group: "escuela",
    examples: [{ word: "先生", kana: "せんせい", meaning: "maestro / profesor" }, { word: "学生", kana: "がくせい", meaning: "estudiante" }, { word: "誕生日", kana: "たんじょうび", meaning: "cumpleaños" }] },
  { kanji: "私", meanings: ["yo", "privado"], onyomi: ["シ"], kunyomi: ["わたし"], group: "escuela",
    examples: [{ word: "私", kana: "わたし", meaning: "yo" }] },
  { kanji: "語", meanings: ["idioma", "palabra"], onyomi: ["ゴ"], kunyomi: ["かた(る)"], group: "escuela",
    examples: [{ word: "英語", kana: "えいご", meaning: "inglés (idioma)" }, { word: "日本語", kana: "にほんご", meaning: "japonés (idioma)" }] },
  { kanji: "何", meanings: ["qué"], onyomi: ["カ"], kunyomi: ["なに", "なん"], group: "escuela",
    examples: [{ word: "何", kana: "なに", meaning: "qué" }] },
  { kanji: "名", meanings: ["nombre"], onyomi: ["メイ", "ミョウ"], kunyomi: ["な"], group: "escuela",
    examples: [{ word: "名前", kana: "なまえ", meaning: "nombre" }] },
  { kanji: "文", meanings: ["texto", "frase"], onyomi: ["ブン", "モン"], kunyomi: ["ふみ"], group: "escuela",
    examples: [{ word: "作文", kana: "さくぶん", meaning: "redacción" }] },
  { kanji: "字", meanings: ["carácter", "letra"], onyomi: ["ジ"], kunyomi: [], group: "escuela",
    examples: [{ word: "字", kana: "じ", meaning: "letra / carácter" }, { word: "漢字", kana: "かんじ", meaning: "kanji" }] },
  { kanji: "本", meanings: ["libro", "origen"], onyomi: ["ホン"], kunyomi: ["もと"], group: "escuela",
    examples: [{ word: "本", kana: "ほん", meaning: "libro" }, { word: "日本語", kana: "にほんご", meaning: "japonés (idioma)" }] },

  // ── Lugares y direcciones ────────────────────────────────────────────────
  { kanji: "上", meanings: ["arriba"], onyomi: ["ジョウ"], kunyomi: ["うえ", "あ(げる)", "のぼ(る)"], group: "lugares",
    examples: [{ word: "上", kana: "うえ", meaning: "arriba / encima" }] },
  { kanji: "下", meanings: ["abajo"], onyomi: ["カ", "ゲ"], kunyomi: ["した", "さ(げる)", "くだ(る)"], group: "lugares",
    examples: [{ word: "下", kana: "した", meaning: "abajo / debajo" }] },
  { kanji: "中", meanings: ["dentro", "medio"], onyomi: ["チュウ"], kunyomi: ["なか"], group: "lugares",
    examples: [{ word: "中", kana: "なか", meaning: "dentro" }] },
  { kanji: "大", meanings: ["grande"], onyomi: ["ダイ", "タイ"], kunyomi: ["おお(きい)"], group: "lugares",
    examples: [{ word: "大きい", kana: "おおきい", meaning: "grande" }, { word: "大学", kana: "だいがく", meaning: "universidad" }] },
  { kanji: "小", meanings: ["pequeño"], onyomi: ["ショウ"], kunyomi: ["ちい(さい)"], group: "lugares",
    examples: [{ word: "小さい", kana: "ちいさい", meaning: "pequeño" }] },
  { kanji: "外", meanings: ["fuera"], onyomi: ["ガイ", "ゲ"], kunyomi: ["そと", "ほか"], group: "lugares",
    examples: [{ word: "外", kana: "そと", meaning: "fuera" }, { word: "外国", kana: "がいこく", meaning: "país extranjero" }] },
  { kanji: "東", meanings: ["este"], onyomi: ["トウ"], kunyomi: ["ひがし"], group: "lugares",
    examples: [{ word: "東", kana: "ひがし", meaning: "este" }] },
  { kanji: "西", meanings: ["oeste"], onyomi: ["セイ", "サイ"], kunyomi: ["にし"], group: "lugares",
    examples: [{ word: "西", kana: "にし", meaning: "oeste" }] },
  { kanji: "南", meanings: ["sur"], onyomi: ["ナン"], kunyomi: ["みなみ"], group: "lugares",
    examples: [{ word: "南", kana: "みなみ", meaning: "sur" }] },
  { kanji: "北", meanings: ["norte"], onyomi: ["ホク"], kunyomi: ["きた"], group: "lugares",
    examples: [{ word: "北", kana: "きた", meaning: "norte" }] },

  // ── Adjetivos ────────────────────────────────────────────────────────────
  { kanji: "高", meanings: ["alto", "caro"], onyomi: ["コウ"], kunyomi: ["たか(い)"], group: "adjetivos",
    examples: [{ word: "高い", kana: "たかい", meaning: "alto / caro" }] },
  { kanji: "安", meanings: ["barato", "tranquilo"], onyomi: ["アン"], kunyomi: ["やす(い)"], group: "adjetivos",
    examples: [{ word: "安い", kana: "やすい", meaning: "barato" }] },
  { kanji: "長", meanings: ["largo", "jefe"], onyomi: ["チョウ"], kunyomi: ["なが(い)"], group: "adjetivos",
    examples: [{ word: "長い", kana: "ながい", meaning: "largo" }] },
  { kanji: "短", meanings: ["corto"], onyomi: ["タン"], kunyomi: ["みじか(い)"], group: "adjetivos",
    examples: [{ word: "短い", kana: "みじかい", meaning: "corto" }] },
  { kanji: "多", meanings: ["mucho"], onyomi: ["タ"], kunyomi: ["おお(い)"], group: "adjetivos",
    examples: [{ word: "多い", kana: "おおい", meaning: "muchos / abundante" }] },
  { kanji: "少", meanings: ["poco"], onyomi: ["ショウ"], kunyomi: ["すく(ない)", "すこ(し)"], group: "adjetivos",
    examples: [{ word: "少ない", kana: "すくない", meaning: "pocos / escaso" }, { word: "少し", kana: "すこし", meaning: "un poco" }] },
  { kanji: "新", meanings: ["nuevo"], onyomi: ["シン"], kunyomi: ["あたら(しい)"], group: "adjetivos",
    examples: [{ word: "新しい", kana: "あたらしい", meaning: "nuevo" }] },
  { kanji: "古", meanings: ["viejo", "antiguo"], onyomi: ["コ"], kunyomi: ["ふる(い)"], group: "adjetivos",
    examples: [{ word: "古い", kana: "ふるい", meaning: "viejo / antiguo" }] },
  { kanji: "早", meanings: ["temprano", "rápido"], onyomi: ["ソウ"], kunyomi: ["はや(い)"], group: "adjetivos",
    examples: [{ word: "早い", kana: "はやい", meaning: "rápido" }] },
  { kanji: "遅", meanings: ["lento", "tarde"], onyomi: ["チ"], kunyomi: ["おそ(い)"], group: "adjetivos",
    examples: [{ word: "遅い", kana: "おそい", meaning: "lento" }] },

  // ── Verbos ───────────────────────────────────────────────────────────────
  { kanji: "食", meanings: ["comer", "comida"], onyomi: ["ショク"], kunyomi: ["た(べる)"], group: "verbos",
    examples: [{ word: "食べる", kana: "たべる", meaning: "comer" }, { word: "食べ物", kana: "たべもの", meaning: "comida (alimento)" }] },
  { kanji: "飲", meanings: ["beber"], onyomi: ["イン"], kunyomi: ["の(む)"], group: "verbos",
    examples: [{ word: "飲む", kana: "のむ", meaning: "beber" }, { word: "飲み物", kana: "のみもの", meaning: "bebida" }] },
  { kanji: "見", meanings: ["ver", "mirar"], onyomi: ["ケン"], kunyomi: ["み(る)"], group: "verbos",
    examples: [{ word: "見る", kana: "みる", meaning: "ver / mirar" }] },
  { kanji: "聞", meanings: ["oír", "escuchar", "preguntar"], onyomi: ["ブン", "モン"], kunyomi: ["き(く)"], group: "verbos",
    examples: [{ word: "聞く", kana: "きく", meaning: "escuchar" }] },
  { kanji: "話", meanings: ["hablar", "conversación"], onyomi: ["ワ"], kunyomi: ["はな(す)", "はなし"], group: "verbos",
    examples: [{ word: "話す", kana: "はなす", meaning: "hablar" }, { word: "話", kana: "はなし", meaning: "conversación / historia" }] },
  { kanji: "書", meanings: ["escribir"], onyomi: ["ショ"], kunyomi: ["か(く)"], group: "verbos",
    examples: [{ word: "書く", kana: "かく", meaning: "escribir" }] },
  { kanji: "読", meanings: ["leer"], onyomi: ["ドク", "トク"], kunyomi: ["よ(む)"], group: "verbos",
    examples: [{ word: "読む", kana: "よむ", meaning: "leer" }] },
  { kanji: "買", meanings: ["comprar"], onyomi: ["バイ"], kunyomi: ["か(う)"], group: "verbos",
    examples: [{ word: "買う", kana: "かう", meaning: "comprar" }, { word: "買い物", kana: "かいもの", meaning: "compras" }] },
  { kanji: "行", meanings: ["ir"], onyomi: ["コウ", "ギョウ"], kunyomi: ["い(く)", "おこな(う)"], group: "verbos",
    examples: [{ word: "行く", kana: "いく", meaning: "ir" }, { word: "旅行", kana: "りょこう", meaning: "viaje" }] },
  { kanji: "帰", meanings: ["regresar", "volver"], onyomi: ["キ"], kunyomi: ["かえ(る)"], group: "verbos",
    examples: [{ word: "帰る", kana: "かえる", meaning: "regresar" }] },
];

// Lectura kana → palabra ejemplo con kanji, para revelar la escritura kanji de
// una palabra/frase ya anclada al módulo Kanji (BACKLOG #5) al responder en
// Vocabulario o Frases. Solo cubre las ~100 palabras ejemplo de arriba a
// propósito: mostrar kanji no enseñado en ese módulo rompería el i+1.
let kanjiByReading: Map<string, string> | null = null;

export function findKanjiSpelling(kana: string): string | undefined {
  if (!kanjiByReading) {
    kanjiByReading = new Map();
    for (const entry of KANJI) {
      for (const ex of entry.examples) {
        if (!kanjiByReading.has(ex.kana)) kanjiByReading.set(ex.kana, ex.word);
      }
    }
  }
  return kanjiByReading.get(kana);
}
