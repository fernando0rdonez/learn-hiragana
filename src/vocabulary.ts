export interface VocabWord {
  hiragana: string;    // characters to spell
  romaji: string;      // shown as hint
  meaning: string;     // Spanish, shown ONLY after answering
  imageQuery: string;  // English keyword for Unsplash
  emojiBackup: string; // fallback if Unsplash fails
  category: string;    // category id
}

export interface VocabCategory {
  id: string;
  label: string;
  emoji: string;
}

export const VOCAB_CATEGORIES: VocabCategory[] = [
  { id: "numeros",    label: "Números",     emoji: "🔢" },
  { id: "tiempo",     label: "Tiempo",      emoji: "⏰" },
  { id: "familia",    label: "Familia",     emoji: "👨‍👩‍👧" },
  { id: "comida",     label: "Comida",      emoji: "🍱" },
  { id: "animales",   label: "Animales",    emoji: "🐾" },
  { id: "lugares",    label: "Lugares",     emoji: "🗺️" },
  { id: "transporte", label: "Transporte",  emoji: "🚗" },
  { id: "objetos",    label: "Objetos",     emoji: "🎒" },
  { id: "ropa",       label: "Ropa",        emoji: "👗" },
  { id: "colores",    label: "Colores",     emoji: "🎨" },
  { id: "naturaleza", label: "Naturaleza",  emoji: "🌿" },
  { id: "cuerpo",     label: "Cuerpo",      emoji: "🫀" },
  { id: "verbos",     label: "Verbos",      emoji: "⚡" },
  { id: "adjetivos",  label: "Adjetivos",   emoji: "✨" },
  { id: "saludos",    label: "Saludos",     emoji: "👋" },
  { id: "pronombres", label: "Pronombres",  emoji: "👤" },
  { id: "cantidades", label: "Cantidades",  emoji: "📏" },
  { id: "preguntas",  label: "Preguntas",   emoji: "❓" },
  { id: "casa",       label: "Casa",        emoji: "🏠" },
  { id: "misc",       label: "Misceláneos", emoji: "🎯" },
];

// 200 most common JLPT N5 words written entirely in hiragana
export const VOCABULARY: VocabWord[] = [
  // --- NÚMEROS ---
  { hiragana: "いち",       romaji: "ichi",     meaning: "uno",            imageQuery: "number one",        emojiBackup: "1️⃣", category: "numeros" },
  { hiragana: "に",         romaji: "ni",       meaning: "dos",            imageQuery: "number two",        emojiBackup: "2️⃣", category: "numeros" },
  { hiragana: "さん",       romaji: "san",      meaning: "tres",           imageQuery: "number three",      emojiBackup: "3️⃣", category: "numeros" },
  { hiragana: "し",         romaji: "shi",      meaning: "cuatro",         imageQuery: "number four",       emojiBackup: "4️⃣", category: "numeros" },
  { hiragana: "ご",         romaji: "go",       meaning: "cinco",          imageQuery: "number five",       emojiBackup: "5️⃣", category: "numeros" },
  { hiragana: "ろく",       romaji: "roku",     meaning: "seis",           imageQuery: "number six",        emojiBackup: "6️⃣", category: "numeros" },
  { hiragana: "なな",       romaji: "nana",     meaning: "siete",          imageQuery: "number seven",      emojiBackup: "7️⃣", category: "numeros" },
  { hiragana: "はち",       romaji: "hachi",    meaning: "ocho",           imageQuery: "number eight",      emojiBackup: "8️⃣", category: "numeros" },
  { hiragana: "きゅう",     romaji: "kyuu",     meaning: "nueve",          imageQuery: "number nine",       emojiBackup: "9️⃣", category: "numeros" },
  { hiragana: "じゅう",     romaji: "juu",      meaning: "diez",           imageQuery: "number ten",        emojiBackup: "🔟", category: "numeros" },

  // --- TIEMPO ---
  { hiragana: "きょう",     romaji: "kyou",     meaning: "hoy",            imageQuery: "today calendar",    emojiBackup: "📅", category: "tiempo" },
  { hiragana: "あした",     romaji: "ashita",   meaning: "mañana",         imageQuery: "tomorrow sunrise",  emojiBackup: "🌅", category: "tiempo" },
  { hiragana: "きのう",     romaji: "kinou",    meaning: "ayer",           imageQuery: "yesterday memory",  emojiBackup: "⬅️", category: "tiempo" },
  { hiragana: "いま",       romaji: "ima",      meaning: "ahora",          imageQuery: "clock now",         emojiBackup: "🕐", category: "tiempo" },
  { hiragana: "まいにち",   romaji: "mainichi", meaning: "todos los días",  imageQuery: "daily routine",     emojiBackup: "📆", category: "tiempo" },
  { hiragana: "あさ",       romaji: "asa",      meaning: "mañana (hora)",  imageQuery: "morning sunrise",   emojiBackup: "🌄", category: "tiempo" },
  { hiragana: "ひる",       romaji: "hiru",     meaning: "mediodía",       imageQuery: "noon sun",          emojiBackup: "☀️", category: "tiempo" },
  { hiragana: "よる",       romaji: "yoru",     meaning: "noche",          imageQuery: "night city",        emojiBackup: "🌃", category: "tiempo" },
  { hiragana: "ことし",     romaji: "kotoshi",  meaning: "este año",       imageQuery: "new year",          emojiBackup: "🗓️", category: "tiempo" },
  { hiragana: "らいねん",   romaji: "rainen",   meaning: "el año que viene", imageQuery: "future year",     emojiBackup: "⏭️", category: "tiempo" },

  // --- FAMILIA ---
  { hiragana: "おかあさん", romaji: "okaasan",  meaning: "mamá",           imageQuery: "mother",            emojiBackup: "👩", category: "familia" },
  { hiragana: "おとうさん", romaji: "otousan",  meaning: "papá",           imageQuery: "father",            emojiBackup: "👨", category: "familia" },
  { hiragana: "おにいさん", romaji: "oniisan",  meaning: "hermano mayor",  imageQuery: "older brother",     emojiBackup: "👦", category: "familia" },
  { hiragana: "おねえさん", romaji: "oneesan",  meaning: "hermana mayor",  imageQuery: "older sister",      emojiBackup: "👧", category: "familia" },
  { hiragana: "おとうと",   romaji: "otouto",   meaning: "hermano menor",  imageQuery: "little brother",    emojiBackup: "👶", category: "familia" },
  { hiragana: "いもうと",   romaji: "imouto",   meaning: "hermana menor",  imageQuery: "little sister",     emojiBackup: "👶", category: "familia" },
  { hiragana: "おじいさん", romaji: "ojiisan",  meaning: "abuelo",         imageQuery: "grandfather",       emojiBackup: "👴", category: "familia" },
  { hiragana: "おばあさん", romaji: "obaasan",  meaning: "abuela",         imageQuery: "grandmother",       emojiBackup: "👵", category: "familia" },
  { hiragana: "こども",     romaji: "kodomo",   meaning: "niño/a",         imageQuery: "child playing",     emojiBackup: "🧒", category: "familia" },
  { hiragana: "ともだち",   romaji: "tomodachi", meaning: "amigo/a",       imageQuery: "friends",           emojiBackup: "👫", category: "familia" },

  // --- COMIDA Y BEBIDA ---
  { hiragana: "みず",       romaji: "mizu",     meaning: "agua",           imageQuery: "glass of water",    emojiBackup: "💧", category: "comida" },
  { hiragana: "おちゃ",     romaji: "ocha",     meaning: "té",             imageQuery: "green tea",         emojiBackup: "🍵", category: "comida" },
  { hiragana: "コーヒー",   romaji: "koohii",   meaning: "café",           imageQuery: "coffee cup",        emojiBackup: "☕", category: "comida" },
  { hiragana: "ごはん",     romaji: "gohan",    meaning: "arroz / comida", imageQuery: "rice bowl",         emojiBackup: "🍚", category: "comida" },
  { hiragana: "パン",       romaji: "pan",      meaning: "pan",            imageQuery: "bread",             emojiBackup: "🍞", category: "comida" },
  { hiragana: "たまご",     romaji: "tamago",   meaning: "huevo",          imageQuery: "egg",               emojiBackup: "🥚", category: "comida" },
  { hiragana: "さかな",     romaji: "sakana",   meaning: "pescado",        imageQuery: "fish",              emojiBackup: "🐟", category: "comida" },
  { hiragana: "にく",       romaji: "niku",     meaning: "carne",          imageQuery: "meat",              emojiBackup: "🥩", category: "comida" },
  { hiragana: "やさい",     romaji: "yasai",    meaning: "verdura",        imageQuery: "vegetables",        emojiBackup: "🥦", category: "comida" },
  { hiragana: "くだもの",   romaji: "kudamono", meaning: "fruta",          imageQuery: "fruit",             emojiBackup: "🍎", category: "comida" },
  { hiragana: "りんご",     romaji: "ringo",    meaning: "manzana",        imageQuery: "apple",             emojiBackup: "🍎", category: "comida" },
  { hiragana: "みかん",     romaji: "mikan",    meaning: "mandarina",      imageQuery: "mandarin orange",   emojiBackup: "🍊", category: "comida" },
  { hiragana: "バナナ",     romaji: "banana",   meaning: "plátano",        imageQuery: "banana",            emojiBackup: "🍌", category: "comida" },
  { hiragana: "すし",       romaji: "sushi",    meaning: "sushi",          imageQuery: "sushi",             emojiBackup: "🍣", category: "comida" },
  { hiragana: "ラーメン",   romaji: "raamen",   meaning: "ramen",          imageQuery: "ramen noodles",     emojiBackup: "🍜", category: "comida" },
  { hiragana: "そば",       romaji: "soba",     meaning: "fideos soba",    imageQuery: "soba noodles",      emojiBackup: "🍜", category: "comida" },
  { hiragana: "うどん",     romaji: "udon",     meaning: "fideos udon",    imageQuery: "udon noodles",      emojiBackup: "🍝", category: "comida" },
  { hiragana: "ケーキ",     romaji: "keeki",    meaning: "pastel",         imageQuery: "cake",              emojiBackup: "🎂", category: "comida" },
  { hiragana: "アイスクリーム", romaji: "aisukuriimu", meaning: "helado",  imageQuery: "ice cream",         emojiBackup: "🍦", category: "comida" },
  { hiragana: "しお",       romaji: "shio",     meaning: "sal",            imageQuery: "salt",              emojiBackup: "🧂", category: "comida" },

  // --- ANIMALES ---
  { hiragana: "いぬ",       romaji: "inu",      meaning: "perro",          imageQuery: "dog",               emojiBackup: "🐕", category: "animales" },
  { hiragana: "ねこ",       romaji: "neko",     meaning: "gato",           imageQuery: "cat",               emojiBackup: "🐈", category: "animales" },
  { hiragana: "とり",       romaji: "tori",     meaning: "pájaro",         imageQuery: "bird",              emojiBackup: "🐦", category: "animales" },
  { hiragana: "さる",       romaji: "saru",     meaning: "mono",           imageQuery: "monkey",            emojiBackup: "🐒", category: "animales" },
  { hiragana: "うし",       romaji: "ushi",     meaning: "vaca",           imageQuery: "cow",               emojiBackup: "🐄", category: "animales" },
  { hiragana: "うま",       romaji: "uma",      meaning: "caballo",        imageQuery: "horse",             emojiBackup: "🐴", category: "animales" },
  { hiragana: "ぶた",       romaji: "buta",     meaning: "cerdo",          imageQuery: "pig",               emojiBackup: "🐷", category: "animales" },
  { hiragana: "うさぎ",     romaji: "usagi",    meaning: "conejo",         imageQuery: "rabbit",            emojiBackup: "🐰", category: "animales" },
  { hiragana: "くま",       romaji: "kuma",     meaning: "oso",            imageQuery: "bear",              emojiBackup: "🐻", category: "animales" },
  { hiragana: "へび",       romaji: "hebi",     meaning: "serpiente",      imageQuery: "snake",             emojiBackup: "🐍", category: "animales" },

  // --- LUGARES ---
  { hiragana: "うち",       romaji: "uchi",     meaning: "casa (mi casa)", imageQuery: "home house",        emojiBackup: "🏠", category: "lugares" },
  { hiragana: "がっこう",   romaji: "gakkou",   meaning: "escuela",        imageQuery: "school building",   emojiBackup: "🏫", category: "lugares" },
  { hiragana: "びょういん", romaji: "byouin",   meaning: "hospital",       imageQuery: "hospital",          emojiBackup: "🏥", category: "lugares" },
  { hiragana: "ぎんこう",   romaji: "ginkou",   meaning: "banco",          imageQuery: "bank building",     emojiBackup: "🏦", category: "lugares" },
  { hiragana: "ゆうびんきょく", romaji: "yuubinkyoku", meaning: "correos", imageQuery: "post office",       emojiBackup: "📮", category: "lugares" },
  { hiragana: "えき",       romaji: "eki",      meaning: "estación (tren)", imageQuery: "train station",    emojiBackup: "🚉", category: "lugares" },
  { hiragana: "みせ",       romaji: "mise",     meaning: "tienda",         imageQuery: "shop store",        emojiBackup: "🏪", category: "lugares" },
  { hiragana: "レストラン", romaji: "resutoran", meaning: "restaurante",   imageQuery: "restaurant",        emojiBackup: "🍽️", category: "lugares" },
  { hiragana: "こうえん",   romaji: "kouen",    meaning: "parque",         imageQuery: "park",              emojiBackup: "🌳", category: "lugares" },
  { hiragana: "やま",       romaji: "yama",     meaning: "montaña",        imageQuery: "mountain",          emojiBackup: "⛰️", category: "lugares" },
  { hiragana: "かわ",       romaji: "kawa",     meaning: "río",            imageQuery: "river",             emojiBackup: "🏞️", category: "lugares" },
  { hiragana: "うみ",       romaji: "umi",      meaning: "mar",            imageQuery: "sea ocean",         emojiBackup: "🌊", category: "lugares" },
  { hiragana: "そら",       romaji: "sora",     meaning: "cielo",          imageQuery: "blue sky",          emojiBackup: "🌤️", category: "lugares" },

  // --- TRANSPORTE ---
  { hiragana: "くるま",     romaji: "kuruma",   meaning: "coche",          imageQuery: "car",               emojiBackup: "🚗", category: "transporte" },
  { hiragana: "でんしゃ",   romaji: "densha",   meaning: "tren eléctrico", imageQuery: "train",             emojiBackup: "🚃", category: "transporte" },
  { hiragana: "バス",       romaji: "basu",     meaning: "autobús",        imageQuery: "bus",               emojiBackup: "🚌", category: "transporte" },
  { hiragana: "じてんしゃ", romaji: "jitensha", meaning: "bicicleta",      imageQuery: "bicycle",           emojiBackup: "🚲", category: "transporte" },
  { hiragana: "ひこうき",   romaji: "hikouki",  meaning: "avión",          imageQuery: "airplane",          emojiBackup: "✈️", category: "transporte" },
  { hiragana: "ふね",       romaji: "fune",     meaning: "barco",          imageQuery: "ship boat",         emojiBackup: "🚢", category: "transporte" },

  // --- OBJETOS COTIDIANOS ---
  { hiragana: "ほん",       romaji: "hon",      meaning: "libro",          imageQuery: "book",              emojiBackup: "📚", category: "objetos" },
  { hiragana: "かばん",     romaji: "kaban",    meaning: "bolso / mochila", imageQuery: "bag",              emojiBackup: "👜", category: "objetos" },
  { hiragana: "かぎ",       romaji: "kagi",     meaning: "llave",          imageQuery: "key",               emojiBackup: "🔑", category: "objetos" },
  { hiragana: "とけい",     romaji: "tokei",    meaning: "reloj",          imageQuery: "watch clock",       emojiBackup: "⌚", category: "objetos" },
  { hiragana: "かさ",       romaji: "kasa",     meaning: "paraguas",       imageQuery: "umbrella",          emojiBackup: "☂️", category: "objetos" },
  { hiragana: "めがね",     romaji: "megane",   meaning: "gafas",          imageQuery: "glasses",           emojiBackup: "👓", category: "objetos" },
  { hiragana: "でんわ",     romaji: "denwa",    meaning: "teléfono",       imageQuery: "telephone",         emojiBackup: "📞", category: "objetos" },
  { hiragana: "テレビ",     romaji: "terebi",   meaning: "televisión",     imageQuery: "television",        emojiBackup: "📺", category: "objetos" },
  { hiragana: "カメラ",     romaji: "kamera",   meaning: "cámara",         imageQuery: "camera",            emojiBackup: "📷", category: "objetos" },
  { hiragana: "つくえ",     romaji: "tsukue",   meaning: "escritorio",     imageQuery: "desk",              emojiBackup: "🪑", category: "objetos" },
  { hiragana: "いす",       romaji: "isu",      meaning: "silla",          imageQuery: "chair",             emojiBackup: "🪑", category: "objetos" },
  { hiragana: "まど",       romaji: "mado",     meaning: "ventana",        imageQuery: "window",            emojiBackup: "🪟", category: "objetos" },
  { hiragana: "ドア",       romaji: "doa",      meaning: "puerta",         imageQuery: "door",              emojiBackup: "🚪", category: "objetos" },
  { hiragana: "かみ",       romaji: "kami",     meaning: "papel",          imageQuery: "paper",             emojiBackup: "📄", category: "objetos" },
  { hiragana: "えんぴつ",   romaji: "enpitsu",  meaning: "lápiz",          imageQuery: "pencil",            emojiBackup: "✏️", category: "objetos" },

  // --- ROPA ---
  { hiragana: "シャツ",     romaji: "shatsu",   meaning: "camisa",         imageQuery: "shirt",             emojiBackup: "👔", category: "ropa" },
  { hiragana: "ズボン",     romaji: "zubon",    meaning: "pantalón",       imageQuery: "trousers pants",    emojiBackup: "👖", category: "ropa" },
  { hiragana: "くつ",       romaji: "kutsu",    meaning: "zapatos",        imageQuery: "shoes",             emojiBackup: "👟", category: "ropa" },
  { hiragana: "ぼうし",     romaji: "boushi",   meaning: "sombrero",       imageQuery: "hat",               emojiBackup: "🎩", category: "ropa" },
  { hiragana: "コート",     romaji: "kooto",    meaning: "abrigo",         imageQuery: "coat",              emojiBackup: "🧥", category: "ropa" },

  // --- COLORES ---
  { hiragana: "あか",       romaji: "aka",      meaning: "rojo",           imageQuery: "red color",         emojiBackup: "🔴", category: "colores" },
  { hiragana: "あお",       romaji: "ao",       meaning: "azul",           imageQuery: "blue color",        emojiBackup: "🔵", category: "colores" },
  { hiragana: "しろ",       romaji: "shiro",    meaning: "blanco",         imageQuery: "white background",  emojiBackup: "⬜", category: "colores" },
  { hiragana: "くろ",       romaji: "kuro",     meaning: "negro",          imageQuery: "black background",  emojiBackup: "⬛", category: "colores" },
  { hiragana: "きいろ",     romaji: "kiiro",    meaning: "amarillo",       imageQuery: "yellow color",      emojiBackup: "🟡", category: "colores" },
  { hiragana: "みどり",     romaji: "midori",   meaning: "verde",          imageQuery: "green color",       emojiBackup: "🟢", category: "colores" },
  { hiragana: "ちゃいろ",   romaji: "chairo",   meaning: "marrón",         imageQuery: "brown color",       emojiBackup: "🟤", category: "colores" },

  // --- NATURALEZA ---
  { hiragana: "はな",       romaji: "hana",     meaning: "flor",           imageQuery: "flower",            emojiBackup: "🌸", category: "naturaleza" },
  { hiragana: "き",         romaji: "ki",       meaning: "árbol",          imageQuery: "tree",              emojiBackup: "🌳", category: "naturaleza" },
  { hiragana: "くさ",       romaji: "kusa",     meaning: "hierba",         imageQuery: "grass",             emojiBackup: "🌿", category: "naturaleza" },
  { hiragana: "あめ",       romaji: "ame",      meaning: "lluvia",         imageQuery: "rain",              emojiBackup: "🌧️", category: "naturaleza" },
  { hiragana: "ゆき",       romaji: "yuki",     meaning: "nieve",          imageQuery: "snow",              emojiBackup: "❄️", category: "naturaleza" },
  { hiragana: "かぜ",       romaji: "kaze",     meaning: "viento",         imageQuery: "wind",              emojiBackup: "💨", category: "naturaleza" },
  { hiragana: "つき",       romaji: "tsuki",    meaning: "luna",           imageQuery: "moon",              emojiBackup: "🌙", category: "naturaleza" },
  { hiragana: "ほし",       romaji: "hoshi",    meaning: "estrella",       imageQuery: "star",              emojiBackup: "⭐", category: "naturaleza" },

  // --- CUERPO ---
  { hiragana: "あたま",     romaji: "atama",    meaning: "cabeza",         imageQuery: "head",              emojiBackup: "🗣️", category: "cuerpo" },
  { hiragana: "め",         romaji: "me",       meaning: "ojo",            imageQuery: "eye",               emojiBackup: "👁️", category: "cuerpo" },
  { hiragana: "みみ",       romaji: "mimi",     meaning: "oreja",          imageQuery: "ear",               emojiBackup: "👂", category: "cuerpo" },
  { hiragana: "はな",       romaji: "hana",     meaning: "nariz",          imageQuery: "nose",              emojiBackup: "👃", category: "cuerpo" },
  { hiragana: "くち",       romaji: "kuchi",    meaning: "boca",           imageQuery: "mouth lips",        emojiBackup: "👄", category: "cuerpo" },
  { hiragana: "て",         romaji: "te",       meaning: "mano",           imageQuery: "hand",              emojiBackup: "✋", category: "cuerpo" },
  { hiragana: "あし",       romaji: "ashi",     meaning: "pie / pierna",   imageQuery: "foot leg",          emojiBackup: "🦶", category: "cuerpo" },

  // --- VERBOS COMUNES ---
  { hiragana: "たべる",     romaji: "taberu",   meaning: "comer",          imageQuery: "eating food",       emojiBackup: "🍽️", category: "verbos" },
  { hiragana: "のむ",       romaji: "nomu",     meaning: "beber",          imageQuery: "drinking water",    emojiBackup: "🥤", category: "verbos" },
  { hiragana: "みる",       romaji: "miru",     meaning: "ver / mirar",    imageQuery: "watching",          emojiBackup: "👀", category: "verbos" },
  { hiragana: "きく",       romaji: "kiku",     meaning: "escuchar",       imageQuery: "listening music",   emojiBackup: "🎧", category: "verbos" },
  { hiragana: "はなす",     romaji: "hanasu",   meaning: "hablar",         imageQuery: "talking people",    emojiBackup: "💬", category: "verbos" },
  { hiragana: "かく",       romaji: "kaku",     meaning: "escribir",       imageQuery: "writing",           emojiBackup: "✍️", category: "verbos" },
  { hiragana: "よむ",       romaji: "yomu",     meaning: "leer",           imageQuery: "reading book",      emojiBackup: "📖", category: "verbos" },
  { hiragana: "かう",       romaji: "kau",      meaning: "comprar",        imageQuery: "shopping",          emojiBackup: "🛒", category: "verbos" },
  { hiragana: "うる",       romaji: "uru",      meaning: "vender",         imageQuery: "selling market",    emojiBackup: "💰", category: "verbos" },
  { hiragana: "あるく",     romaji: "aruku",    meaning: "caminar",        imageQuery: "walking person",    emojiBackup: "🚶", category: "verbos" },
  { hiragana: "はしる",     romaji: "hashiru",  meaning: "correr",         imageQuery: "running person",    emojiBackup: "🏃", category: "verbos" },
  { hiragana: "のる",       romaji: "noru",     meaning: "montar / subir", imageQuery: "riding bus",        emojiBackup: "🚌", category: "verbos" },
  { hiragana: "おきる",     romaji: "okiru",    meaning: "levantarse",     imageQuery: "waking up morning", emojiBackup: "⏰", category: "verbos" },
  { hiragana: "ねる",       romaji: "neru",     meaning: "dormir",         imageQuery: "sleeping",          emojiBackup: "😴", category: "verbos" },
  { hiragana: "いく",       romaji: "iku",      meaning: "ir",             imageQuery: "going walking",     emojiBackup: "➡️", category: "verbos" },
  { hiragana: "くる",       romaji: "kuru",     meaning: "venir",          imageQuery: "arriving",          emojiBackup: "🔙", category: "verbos" },
  { hiragana: "かえる",     romaji: "kaeru",    meaning: "regresar",       imageQuery: "going home",        emojiBackup: "🏠", category: "verbos" },
  { hiragana: "あう",       romaji: "au",       meaning: "encontrarse",    imageQuery: "meeting friends",   emojiBackup: "🤝", category: "verbos" },
  { hiragana: "まつ",       romaji: "matsu",    meaning: "esperar",        imageQuery: "waiting person",    emojiBackup: "⏳", category: "verbos" },
  { hiragana: "しごとする", romaji: "shigoto suru", meaning: "trabajar",   imageQuery: "working office",    emojiBackup: "💼", category: "verbos" },
  { hiragana: "べんきょうする", romaji: "benkyou suru", meaning: "estudiar", imageQuery: "studying",        emojiBackup: "📚", category: "verbos" },
  { hiragana: "あそぶ",     romaji: "asobu",    meaning: "jugar",          imageQuery: "playing children",  emojiBackup: "🎮", category: "verbos" },
  { hiragana: "つかう",     romaji: "tsukau",   meaning: "usar",           imageQuery: "using phone",       emojiBackup: "📱", category: "verbos" },
  { hiragana: "あける",     romaji: "akeru",    meaning: "abrir",          imageQuery: "opening door",      emojiBackup: "🚪", category: "verbos" },
  { hiragana: "しめる",     romaji: "shimeru",  meaning: "cerrar",         imageQuery: "closing door",      emojiBackup: "🔒", category: "verbos" },

  // --- ADJETIVOS COMUNES ---
  { hiragana: "おおきい",   romaji: "ookii",    meaning: "grande",         imageQuery: "big large size",    emojiBackup: "🔲", category: "adjetivos" },
  { hiragana: "ちいさい",   romaji: "chiisai",  meaning: "pequeño",        imageQuery: "small tiny",        emojiBackup: "🔹", category: "adjetivos" },
  { hiragana: "たかい",     romaji: "takai",    meaning: "alto / caro",    imageQuery: "tall building",     emojiBackup: "🏢", category: "adjetivos" },
  { hiragana: "ひくい",     romaji: "hikui",    meaning: "bajo",           imageQuery: "low short",         emojiBackup: "📉", category: "adjetivos" },
  { hiragana: "あたらしい", romaji: "atarashii", meaning: "nuevo",         imageQuery: "new product",       emojiBackup: "✨", category: "adjetivos" },
  { hiragana: "ふるい",     romaji: "furui",    meaning: "viejo / antiguo", imageQuery: "old vintage",      emojiBackup: "🏚️", category: "adjetivos" },
  { hiragana: "いい",       romaji: "ii",       meaning: "bueno",          imageQuery: "good thumbs up",    emojiBackup: "👍", category: "adjetivos" },
  { hiragana: "わるい",     romaji: "warui",    meaning: "malo",           imageQuery: "bad thumbs down",   emojiBackup: "👎", category: "adjetivos" },
  { hiragana: "あつい",     romaji: "atsui",    meaning: "caliente",       imageQuery: "hot temperature",   emojiBackup: "🔥", category: "adjetivos" },
  { hiragana: "さむい",     romaji: "samui",    meaning: "frío",           imageQuery: "cold winter",       emojiBackup: "🥶", category: "adjetivos" },
  { hiragana: "はやい",     romaji: "hayai",    meaning: "rápido",         imageQuery: "fast speed",        emojiBackup: "⚡", category: "adjetivos" },
  { hiragana: "おそい",     romaji: "osoi",     meaning: "lento",          imageQuery: "slow turtle",       emojiBackup: "🐢", category: "adjetivos" },
  { hiragana: "むずかしい", romaji: "muzukashii", meaning: "difícil",      imageQuery: "difficult problem", emojiBackup: "😤", category: "adjetivos" },
  { hiragana: "やさしい",   romaji: "yasashii", meaning: "fácil / amable", imageQuery: "easy simple",       emojiBackup: "😊", category: "adjetivos" },
  { hiragana: "たのしい",   romaji: "tanoshii", meaning: "divertido",      imageQuery: "fun happy",         emojiBackup: "😄", category: "adjetivos" },
  { hiragana: "つまらない", romaji: "tsumaranai", meaning: "aburrido",     imageQuery: "bored boring",      emojiBackup: "😑", category: "adjetivos" },
  { hiragana: "おいしい",   romaji: "oishii",   meaning: "delicioso",      imageQuery: "delicious food",    emojiBackup: "😋", category: "adjetivos" },
  { hiragana: "まずい",     romaji: "mazui",    meaning: "malo (sabor)",   imageQuery: "bad taste",         emojiBackup: "🤢", category: "adjetivos" },
  { hiragana: "きれい",     romaji: "kirei",    meaning: "bonito / limpio", imageQuery: "beautiful scenery", emojiBackup: "😍", category: "adjetivos" },
  { hiragana: "きたない",   romaji: "kitanai",  meaning: "sucio / feo",    imageQuery: "dirty messy",       emojiBackup: "🗑️", category: "adjetivos" },

  // --- SALUDOS Y EXPRESIONES ---
  { hiragana: "おはよう",   romaji: "ohayou",   meaning: "buenos días",    imageQuery: "good morning",      emojiBackup: "🌞", category: "saludos" },
  { hiragana: "こんにちは", romaji: "konnichiwa", meaning: "hola / buenas tardes", imageQuery: "hello greeting", emojiBackup: "👋", category: "saludos" },
  { hiragana: "こんばんは", romaji: "konbanwa",  meaning: "buenas noches", imageQuery: "good evening night", emojiBackup: "🌙", category: "saludos" },
  { hiragana: "ありがとう", romaji: "arigatou",  meaning: "gracias",       imageQuery: "thank you",         emojiBackup: "🙏", category: "saludos" },
  { hiragana: "すみません", romaji: "sumimasen", meaning: "perdón / disculpe", imageQuery: "excuse me sorry", emojiBackup: "🙇", category: "saludos" },
  { hiragana: "はい",       romaji: "hai",       meaning: "sí",            imageQuery: "yes agree",         emojiBackup: "✅", category: "saludos" },
  { hiragana: "いいえ",     romaji: "iie",       meaning: "no",            imageQuery: "no disagree",       emojiBackup: "❌", category: "saludos" },

  // --- PRONOMBRES Y PARTÍCULAS COMUNES ---
  { hiragana: "わたし",     romaji: "watashi",  meaning: "yo",             imageQuery: "person self",       emojiBackup: "🙋", category: "pronombres" },
  { hiragana: "あなた",     romaji: "anata",    meaning: "tú",             imageQuery: "pointing you",      emojiBackup: "👉", category: "pronombres" },
  { hiragana: "かれ",       romaji: "kare",     meaning: "él",             imageQuery: "man",               emojiBackup: "👨", category: "pronombres" },
  { hiragana: "かのじょ",   romaji: "kanojo",   meaning: "ella",           imageQuery: "woman",             emojiBackup: "👩", category: "pronombres" },
  { hiragana: "みんな",     romaji: "minna",    meaning: "todos",          imageQuery: "group people",      emojiBackup: "👥", category: "pronombres" },

  // --- CANTIDADES Y MEDIDAS ---
  { hiragana: "すこし",     romaji: "sukoshi",  meaning: "un poco",        imageQuery: "small amount",      emojiBackup: "🤏", category: "cantidades" },
  { hiragana: "たくさん",   romaji: "takusan",  meaning: "mucho",          imageQuery: "many lots",         emojiBackup: "💯", category: "cantidades" },
  { hiragana: "ぜんぶ",     romaji: "zenbu",    meaning: "todo",           imageQuery: "everything all",    emojiBackup: "🌐", category: "cantidades" },
  { hiragana: "なにも",     romaji: "nanimo",   meaning: "nada",           imageQuery: "empty nothing",     emojiBackup: "🈳", category: "cantidades" },

  // --- PREGUNTAS ---
  { hiragana: "なに",       romaji: "nani",     meaning: "qué",            imageQuery: "question mark",     emojiBackup: "❓", category: "preguntas" },
  { hiragana: "どこ",       romaji: "doko",     meaning: "dónde",          imageQuery: "location map",      emojiBackup: "📍", category: "preguntas" },
  { hiragana: "いつ",       romaji: "itsu",     meaning: "cuándo",         imageQuery: "calendar when",     emojiBackup: "📅", category: "preguntas" },
  { hiragana: "だれ",       romaji: "dare",     meaning: "quién",          imageQuery: "person silhouette", emojiBackup: "🧑", category: "preguntas" },
  { hiragana: "なぜ",       romaji: "naze",     meaning: "por qué",        imageQuery: "why question",      emojiBackup: "🤔", category: "preguntas" },
  { hiragana: "どうやって", romaji: "douyatte", meaning: "cómo",           imageQuery: "how to guide",      emojiBackup: "🛠️", category: "preguntas" },

  // --- CASA ---
  { hiragana: "へや",       romaji: "heya",     meaning: "habitación",     imageQuery: "room bedroom",      emojiBackup: "🛏️", category: "casa" },
  { hiragana: "トイレ",     romaji: "toire",    meaning: "baño / WC",      imageQuery: "bathroom toilet",   emojiBackup: "🚽", category: "casa" },
  { hiragana: "だいどころ", romaji: "daidokoro", meaning: "cocina",        imageQuery: "kitchen",           emojiBackup: "🍳", category: "casa" },
  { hiragana: "にわ",       romaji: "niwa",     meaning: "jardín",         imageQuery: "garden",            emojiBackup: "🌱", category: "casa" },

  // --- MISCELÁNEOS FRECUENTES ---
  { hiragana: "おかね",     romaji: "okane",    meaning: "dinero",         imageQuery: "money cash",        emojiBackup: "💴", category: "misc" },
  { hiragana: "しごと",     romaji: "shigoto",  meaning: "trabajo",        imageQuery: "work office",       emojiBackup: "💼", category: "misc" },
  { hiragana: "べんきょう", romaji: "benkyou",  meaning: "estudio",        imageQuery: "studying desk",     emojiBackup: "📝", category: "misc" },
  { hiragana: "おんがく",   romaji: "ongaku",   meaning: "música",         imageQuery: "music",             emojiBackup: "🎵", category: "misc" },
  { hiragana: "えいが",     romaji: "eiga",     meaning: "película",       imageQuery: "movie cinema",      emojiBackup: "🎬", category: "misc" },
  { hiragana: "スポーツ",   romaji: "supootsu", meaning: "deporte",        imageQuery: "sports",            emojiBackup: "⚽", category: "misc" },
  { hiragana: "てんき",     romaji: "tenki",    meaning: "clima / tiempo", imageQuery: "weather",           emojiBackup: "🌤️", category: "misc" },
];
