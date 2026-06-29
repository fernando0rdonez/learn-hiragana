export interface VocabWord {
  hiragana: string;    // characters to spell
  romaji: string;      // shown as hint
  meaning: string;     // Spanish, shown ONLY after answering
  imageQuery: string;  // English keyword for Unsplash
  emojiBackup: string; // fallback if Unsplash fails
}

// 200 most common JLPT N5 words written entirely in hiragana
// Sorted by frequency of use, all writable in hiragana only (no kanji required)
export const VOCABULARY: VocabWord[] = [
  // --- NÚMEROS ---
  { hiragana: "いち",       romaji: "ichi",     meaning: "uno",            imageQuery: "number one",        emojiBackup: "1️⃣" },
  { hiragana: "に",         romaji: "ni",       meaning: "dos",            imageQuery: "number two",        emojiBackup: "2️⃣" },
  { hiragana: "さん",       romaji: "san",      meaning: "tres",           imageQuery: "number three",      emojiBackup: "3️⃣" },
  { hiragana: "し",         romaji: "shi",      meaning: "cuatro",         imageQuery: "number four",       emojiBackup: "4️⃣" },
  { hiragana: "ご",         romaji: "go",       meaning: "cinco",          imageQuery: "number five",       emojiBackup: "5️⃣" },
  { hiragana: "ろく",       romaji: "roku",     meaning: "seis",           imageQuery: "number six",        emojiBackup: "6️⃣" },
  { hiragana: "なな",       romaji: "nana",     meaning: "siete",          imageQuery: "number seven",      emojiBackup: "7️⃣" },
  { hiragana: "はち",       romaji: "hachi",    meaning: "ocho",           imageQuery: "number eight",      emojiBackup: "8️⃣" },
  { hiragana: "きゅう",     romaji: "kyuu",     meaning: "nueve",          imageQuery: "number nine",       emojiBackup: "9️⃣" },
  { hiragana: "じゅう",     romaji: "juu",      meaning: "diez",           imageQuery: "number ten",        emojiBackup: "🔟" },

  // --- TIEMPO ---
  { hiragana: "きょう",     romaji: "kyou",     meaning: "hoy",            imageQuery: "today calendar",    emojiBackup: "📅" },
  { hiragana: "あした",     romaji: "ashita",   meaning: "mañana",         imageQuery: "tomorrow sunrise",  emojiBackup: "🌅" },
  { hiragana: "きのう",     romaji: "kinou",    meaning: "ayer",           imageQuery: "yesterday memory",  emojiBackup: "⬅️" },
  { hiragana: "いま",       romaji: "ima",      meaning: "ahora",          imageQuery: "clock now",         emojiBackup: "🕐" },
  { hiragana: "まいにち",   romaji: "mainichi", meaning: "todos los días",  imageQuery: "daily routine",     emojiBackup: "📆" },
  { hiragana: "あさ",       romaji: "asa",      meaning: "mañana (hora)",  imageQuery: "morning sunrise",   emojiBackup: "🌄" },
  { hiragana: "ひる",       romaji: "hiru",     meaning: "mediodía",       imageQuery: "noon sun",          emojiBackup: "☀️" },
  { hiragana: "よる",       romaji: "yoru",     meaning: "noche",          imageQuery: "night city",        emojiBackup: "🌃" },
  { hiragana: "ことし",     romaji: "kotoshi",  meaning: "este año",       imageQuery: "new year",          emojiBackup: "🗓️" },
  { hiragana: "らいねん",   romaji: "rainen",   meaning: "el año que viene", imageQuery: "future year",     emojiBackup: "⏭️" },

  // --- FAMILIA ---
  { hiragana: "おかあさん", romaji: "okaasan",  meaning: "mamá",           imageQuery: "mother",            emojiBackup: "👩" },
  { hiragana: "おとうさん", romaji: "otousan",  meaning: "papá",           imageQuery: "father",            emojiBackup: "👨" },
  { hiragana: "おにいさん", romaji: "oniisan",  meaning: "hermano mayor",  imageQuery: "older brother",     emojiBackup: "👦" },
  { hiragana: "おねえさん", romaji: "oneesan",  meaning: "hermana mayor",  imageQuery: "older sister",      emojiBackup: "👧" },
  { hiragana: "おとうと",   romaji: "otouto",   meaning: "hermano menor",  imageQuery: "little brother",    emojiBackup: "👶" },
  { hiragana: "いもうと",   romaji: "imouto",   meaning: "hermana menor",  imageQuery: "little sister",     emojiBackup: "👶" },
  { hiragana: "おじいさん", romaji: "ojiisan",  meaning: "abuelo",         imageQuery: "grandfather",       emojiBackup: "👴" },
  { hiragana: "おばあさん", romaji: "obaasan",  meaning: "abuela",         imageQuery: "grandmother",       emojiBackup: "👵" },
  { hiragana: "こども",     romaji: "kodomo",   meaning: "niño/a",         imageQuery: "child playing",     emojiBackup: "🧒" },
  { hiragana: "ともだち",   romaji: "tomodachi", meaning: "amigo/a",       imageQuery: "friends",           emojiBackup: "👫" },

  // --- COMIDA Y BEBIDA ---
  { hiragana: "みず",       romaji: "mizu",     meaning: "agua",           imageQuery: "glass of water",    emojiBackup: "💧" },
  { hiragana: "おちゃ",     romaji: "ocha",     meaning: "té",             imageQuery: "green tea",         emojiBackup: "🍵" },
  { hiragana: "コーヒー",   romaji: "koohii",   meaning: "café",           imageQuery: "coffee cup",        emojiBackup: "☕" },
  { hiragana: "ごはん",     romaji: "gohan",    meaning: "arroz / comida", imageQuery: "rice bowl",         emojiBackup: "🍚" },
  { hiragana: "パン",       romaji: "pan",      meaning: "pan",            imageQuery: "bread",             emojiBackup: "🍞" },
  { hiragana: "たまご",     romaji: "tamago",   meaning: "huevo",          imageQuery: "egg",               emojiBackup: "🥚" },
  { hiragana: "さかな",     romaji: "sakana",   meaning: "pescado",        imageQuery: "fish",              emojiBackup: "🐟" },
  { hiragana: "にく",       romaji: "niku",     meaning: "carne",          imageQuery: "meat",              emojiBackup: "🥩" },
  { hiragana: "やさい",     romaji: "yasai",    meaning: "verdura",        imageQuery: "vegetables",        emojiBackup: "🥦" },
  { hiragana: "くだもの",   romaji: "kudamono", meaning: "fruta",          imageQuery: "fruit",             emojiBackup: "🍎" },
  { hiragana: "りんご",     romaji: "ringo",    meaning: "manzana",        imageQuery: "apple",             emojiBackup: "🍎" },
  { hiragana: "みかん",     romaji: "mikan",    meaning: "mandarina",      imageQuery: "mandarin orange",   emojiBackup: "🍊" },
  { hiragana: "バナナ",     romaji: "banana",   meaning: "plátano",        imageQuery: "banana",            emojiBackup: "🍌" },
  { hiragana: "すし",       romaji: "sushi",    meaning: "sushi",          imageQuery: "sushi",             emojiBackup: "🍣" },
  { hiragana: "ラーメン",   romaji: "raamen",   meaning: "ramen",          imageQuery: "ramen noodles",     emojiBackup: "🍜" },
  { hiragana: "そば",       romaji: "soba",     meaning: "fideos soba",    imageQuery: "soba noodles",      emojiBackup: "🍜" },
  { hiragana: "うどん",     romaji: "udon",     meaning: "fideos udon",    imageQuery: "udon noodles",      emojiBackup: "🍝" },
  { hiragana: "ケーキ",     romaji: "keeki",    meaning: "pastel",         imageQuery: "cake",              emojiBackup: "🎂" },
  { hiragana: "アイスクリーム", romaji: "aisukuriimu", meaning: "helado",  imageQuery: "ice cream",         emojiBackup: "🍦" },
  { hiragana: "しお",       romaji: "shio",     meaning: "sal",            imageQuery: "salt",              emojiBackup: "🧂" },

  // --- ANIMALES ---
  { hiragana: "いぬ",       romaji: "inu",      meaning: "perro",          imageQuery: "dog",               emojiBackup: "🐕" },
  { hiragana: "ねこ",       romaji: "neko",     meaning: "gato",           imageQuery: "cat",               emojiBackup: "🐈" },
  { hiragana: "とり",       romaji: "tori",     meaning: "pájaro",         imageQuery: "bird",              emojiBackup: "🐦" },
  { hiragana: "さる",       romaji: "saru",     meaning: "mono",           imageQuery: "monkey",            emojiBackup: "🐒" },
  { hiragana: "うし",       romaji: "ushi",     meaning: "vaca",           imageQuery: "cow",               emojiBackup: "🐄" },
  { hiragana: "うま",       romaji: "uma",      meaning: "caballo",        imageQuery: "horse",             emojiBackup: "🐴" },
  { hiragana: "ぶた",       romaji: "buta",     meaning: "cerdo",          imageQuery: "pig",               emojiBackup: "🐷" },
  { hiragana: "うさぎ",     romaji: "usagi",    meaning: "conejo",         imageQuery: "rabbit",            emojiBackup: "🐰" },
  { hiragana: "くま",       romaji: "kuma",     meaning: "oso",            imageQuery: "bear",              emojiBackup: "🐻" },
  { hiragana: "へび",       romaji: "hebi",     meaning: "serpiente",      imageQuery: "snake",             emojiBackup: "🐍" },

  // --- LUGARES ---
  { hiragana: "うち",       romaji: "uchi",     meaning: "casa (mi casa)", imageQuery: "home house",        emojiBackup: "🏠" },
  { hiragana: "がっこう",   romaji: "gakkou",   meaning: "escuela",        imageQuery: "school building",   emojiBackup: "🏫" },
  { hiragana: "びょういん", romaji: "byouin",   meaning: "hospital",       imageQuery: "hospital",          emojiBackup: "🏥" },
  { hiragana: "ぎんこう",   romaji: "ginkou",   meaning: "banco",          imageQuery: "bank building",     emojiBackup: "🏦" },
  { hiragana: "ゆうびんきょく", romaji: "yuubinkyoku", meaning: "correos", imageQuery: "post office",       emojiBackup: "📮" },
  { hiragana: "えき",       romaji: "eki",      meaning: "estación (tren)", imageQuery: "train station",    emojiBackup: "🚉" },
  { hiragana: "みせ",       romaji: "mise",     meaning: "tienda",         imageQuery: "shop store",        emojiBackup: "🏪" },
  { hiragana: "レストラン", romaji: "resutoran", meaning: "restaurante",   imageQuery: "restaurant",        emojiBackup: "🍽️" },
  { hiragana: "こうえん",   romaji: "kouen",    meaning: "parque",         imageQuery: "park",              emojiBackup: "🌳" },
  { hiragana: "やま",       romaji: "yama",     meaning: "montaña",        imageQuery: "mountain",          emojiBackup: "⛰️" },
  { hiragana: "かわ",       romaji: "kawa",     meaning: "río",            imageQuery: "river",             emojiBackup: "🏞️" },
  { hiragana: "うみ",       romaji: "umi",      meaning: "mar",            imageQuery: "sea ocean",         emojiBackup: "🌊" },
  { hiragana: "そら",       romaji: "sora",     meaning: "cielo",          imageQuery: "blue sky",          emojiBackup: "🌤️" },

  // --- TRANSPORTE ---
  { hiragana: "くるま",     romaji: "kuruma",   meaning: "coche",          imageQuery: "car",               emojiBackup: "🚗" },
  { hiragana: "でんしゃ",   romaji: "densha",   meaning: "tren eléctrico", imageQuery: "train",             emojiBackup: "🚃" },
  { hiragana: "バス",       romaji: "basu",     meaning: "autobús",        imageQuery: "bus",               emojiBackup: "🚌" },
  { hiragana: "じてんしゃ", romaji: "jitensha", meaning: "bicicleta",      imageQuery: "bicycle",           emojiBackup: "🚲" },
  { hiragana: "ひこうき",   romaji: "hikouki",  meaning: "avión",          imageQuery: "airplane",          emojiBackup: "✈️" },
  { hiragana: "ふね",       romaji: "fune",     meaning: "barco",          imageQuery: "ship boat",         emojiBackup: "🚢" },

  // --- OBJETOS COTIDIANOS ---
  { hiragana: "ほん",       romaji: "hon",      meaning: "libro",          imageQuery: "book",              emojiBackup: "📚" },
  { hiragana: "かばん",     romaji: "kaban",    meaning: "bolso / mochila", imageQuery: "bag",              emojiBackup: "👜" },
  { hiragana: "かぎ",       romaji: "kagi",     meaning: "llave",          imageQuery: "key",               emojiBackup: "🔑" },
  { hiragana: "とけい",     romaji: "tokei",    meaning: "reloj",          imageQuery: "watch clock",       emojiBackup: "⌚" },
  { hiragana: "かさ",       romaji: "kasa",     meaning: "paraguas",       imageQuery: "umbrella",          emojiBackup: "☂️" },
  { hiragana: "めがね",     romaji: "megane",   meaning: "gafas",          imageQuery: "glasses",           emojiBackup: "👓" },
  { hiragana: "でんわ",     romaji: "denwa",    meaning: "teléfono",       imageQuery: "telephone",         emojiBackup: "📞" },
  { hiragana: "テレビ",     romaji: "terebi",   meaning: "televisión",     imageQuery: "television",        emojiBackup: "📺" },
  { hiragana: "カメラ",     romaji: "kamera",   meaning: "cámara",         imageQuery: "camera",            emojiBackup: "📷" },
  { hiragana: "つくえ",     romaji: "tsukue",   meaning: "escritorio",     imageQuery: "desk",              emojiBackup: "🪑" },
  { hiragana: "いす",       romaji: "isu",      meaning: "silla",          imageQuery: "chair",             emojiBackup: "🪑" },
  { hiragana: "まど",       romaji: "mado",     meaning: "ventana",        imageQuery: "window",            emojiBackup: "🪟" },
  { hiragana: "ドア",       romaji: "doa",      meaning: "puerta",         imageQuery: "door",              emojiBackup: "🚪" },
  { hiragana: "かみ",       romaji: "kami",     meaning: "papel",          imageQuery: "paper",             emojiBackup: "📄" },
  { hiragana: "えんぴつ",   romaji: "enpitsu",  meaning: "lápiz",          imageQuery: "pencil",            emojiBackup: "✏️" },

  // --- ROPA ---
  { hiragana: "シャツ",     romaji: "shatsu",   meaning: "camisa",         imageQuery: "shirt",             emojiBackup: "👔" },
  { hiragana: "ズボン",     romaji: "zubon",    meaning: "pantalón",       imageQuery: "trousers pants",    emojiBackup: "👖" },
  { hiragana: "くつ",       romaji: "kutsu",    meaning: "zapatos",        imageQuery: "shoes",             emojiBackup: "👟" },
  { hiragana: "ぼうし",     romaji: "boushi",   meaning: "sombrero",       imageQuery: "hat",               emojiBackup: "🎩" },
  { hiragana: "コート",     romaji: "kooto",    meaning: "abrigo",         imageQuery: "coat",              emojiBackup: "🧥" },

  // --- COLORES ---
  { hiragana: "あか",       romaji: "aka",      meaning: "rojo",           imageQuery: "red color",         emojiBackup: "🔴" },
  { hiragana: "あお",       romaji: "ao",       meaning: "azul",           imageQuery: "blue color",        emojiBackup: "🔵" },
  { hiragana: "しろ",       romaji: "shiro",    meaning: "blanco",         imageQuery: "white background",  emojiBackup: "⬜" },
  { hiragana: "くろ",       romaji: "kuro",     meaning: "negro",          imageQuery: "black background",  emojiBackup: "⬛" },
  { hiragana: "きいろ",     romaji: "kiiro",    meaning: "amarillo",       imageQuery: "yellow color",      emojiBackup: "🟡" },
  { hiragana: "みどり",     romaji: "midori",   meaning: "verde",          imageQuery: "green color",       emojiBackup: "🟢" },
  { hiragana: "ちゃいろ",   romaji: "chairo",   meaning: "marrón",         imageQuery: "brown color",       emojiBackup: "🟤" },

  // --- NATURALEZA ---
  { hiragana: "はな",       romaji: "hana",     meaning: "flor",           imageQuery: "flower",            emojiBackup: "🌸" },
  { hiragana: "き",         romaji: "ki",       meaning: "árbol",          imageQuery: "tree",              emojiBackup: "🌳" },
  { hiragana: "くさ",       romaji: "kusa",     meaning: "hierba",         imageQuery: "grass",             emojiBackup: "🌿" },
  { hiragana: "あめ",       romaji: "ame",      meaning: "lluvia",         imageQuery: "rain",              emojiBackup: "🌧️" },
  { hiragana: "ゆき",       romaji: "yuki",     meaning: "nieve",          imageQuery: "snow",              emojiBackup: "❄️" },
  { hiragana: "かぜ",       romaji: "kaze",     meaning: "viento",         imageQuery: "wind",              emojiBackup: "💨" },
  { hiragana: "つき",       romaji: "tsuki",    meaning: "luna",           imageQuery: "moon",              emojiBackup: "🌙" },
  { hiragana: "ほし",       romaji: "hoshi",    meaning: "estrella",       imageQuery: "star",              emojiBackup: "⭐" },

  // --- CUERPO ---
  { hiragana: "あたま",     romaji: "atama",    meaning: "cabeza",         imageQuery: "head",              emojiBackup: "🗣️" },
  { hiragana: "め",         romaji: "me",       meaning: "ojo",            imageQuery: "eye",               emojiBackup: "👁️" },
  { hiragana: "みみ",       romaji: "mimi",     meaning: "oreja",          imageQuery: "ear",               emojiBackup: "👂" },
  { hiragana: "はな",       romaji: "hana",     meaning: "nariz",          imageQuery: "nose",              emojiBackup: "👃" },
  { hiragana: "くち",       romaji: "kuchi",    meaning: "boca",           imageQuery: "mouth lips",        emojiBackup: "👄" },
  { hiragana: "て",         romaji: "te",       meaning: "mano",           imageQuery: "hand",              emojiBackup: "✋" },
  { hiragana: "あし",       romaji: "ashi",     meaning: "pie / pierna",   imageQuery: "foot leg",          emojiBackup: "🦶" },

  // --- VERBOS COMUNES ---
  { hiragana: "たべる",     romaji: "taberu",   meaning: "comer",          imageQuery: "eating food",       emojiBackup: "🍽️" },
  { hiragana: "のむ",       romaji: "nomu",     meaning: "beber",          imageQuery: "drinking water",    emojiBackup: "🥤" },
  { hiragana: "みる",       romaji: "miru",     meaning: "ver / mirar",    imageQuery: "watching",          emojiBackup: "👀" },
  { hiragana: "きく",       romaji: "kiku",     meaning: "escuchar",       imageQuery: "listening music",   emojiBackup: "🎧" },
  { hiragana: "はなす",     romaji: "hanasu",   meaning: "hablar",         imageQuery: "talking people",    emojiBackup: "💬" },
  { hiragana: "かく",       romaji: "kaku",     meaning: "escribir",       imageQuery: "writing",           emojiBackup: "✍️" },
  { hiragana: "よむ",       romaji: "yomu",     meaning: "leer",           imageQuery: "reading book",      emojiBackup: "📖" },
  { hiragana: "かう",       romaji: "kau",      meaning: "comprar",        imageQuery: "shopping",          emojiBackup: "🛒" },
  { hiragana: "うる",       romaji: "uru",      meaning: "vender",         imageQuery: "selling market",    emojiBackup: "💰" },
  { hiragana: "あるく",     romaji: "aruku",    meaning: "caminar",        imageQuery: "walking person",    emojiBackup: "🚶" },
  { hiragana: "はしる",     romaji: "hashiru",  meaning: "correr",         imageQuery: "running person",    emojiBackup: "🏃" },
  { hiragana: "のる",       romaji: "noru",     meaning: "montar / subir", imageQuery: "riding bus",        emojiBackup: "🚌" },
  { hiragana: "おきる",     romaji: "okiru",    meaning: "levantarse",     imageQuery: "waking up morning", emojiBackup: "⏰" },
  { hiragana: "ねる",       romaji: "neru",     meaning: "dormir",         imageQuery: "sleeping",          emojiBackup: "😴" },
  { hiragana: "いく",       romaji: "iku",      meaning: "ir",             imageQuery: "going walking",     emojiBackup: "➡️" },
  { hiragana: "くる",       romaji: "kuru",     meaning: "venir",          imageQuery: "arriving",          emojiBackup: "🔙" },
  { hiragana: "かえる",     romaji: "kaeru",    meaning: "regresar",       imageQuery: "going home",        emojiBackup: "🏠" },
  { hiragana: "あう",       romaji: "au",       meaning: "encontrarse",    imageQuery: "meeting friends",   emojiBackup: "🤝" },
  { hiragana: "まつ",       romaji: "matsu",    meaning: "esperar",        imageQuery: "waiting person",    emojiBackup: "⏳" },
  { hiragana: "しごとする", romaji: "shigoto suru", meaning: "trabajar",   imageQuery: "working office",    emojiBackup: "💼" },
  { hiragana: "べんきょうする", romaji: "benkyou suru", meaning: "estudiar", imageQuery: "studying",        emojiBackup: "📚" },
  { hiragana: "あそぶ",     romaji: "asobu",    meaning: "jugar",          imageQuery: "playing children",  emojiBackup: "🎮" },
  { hiragana: "つかう",     romaji: "tsukau",   meaning: "usar",           imageQuery: "using phone",       emojiBackup: "📱" },
  { hiragana: "あける",     romaji: "akeru",    meaning: "abrir",          imageQuery: "opening door",      emojiBackup: "🚪" },
  { hiragana: "しめる",     romaji: "shimeru",  meaning: "cerrar",         imageQuery: "closing door",      emojiBackup: "🔒" },

  // --- ADJETIVOS COMUNES ---
  { hiragana: "おおきい",   romaji: "ookii",    meaning: "grande",         imageQuery: "big large size",    emojiBackup: "🔲" },
  { hiragana: "ちいさい",   romaji: "chiisai",  meaning: "pequeño",        imageQuery: "small tiny",        emojiBackup: "🔹" },
  { hiragana: "たかい",     romaji: "takai",    meaning: "alto / caro",    imageQuery: "tall building",     emojiBackup: "🏢" },
  { hiragana: "ひくい",     romaji: "hikui",    meaning: "bajo",           imageQuery: "low short",         emojiBackup: "📉" },
  { hiragana: "あたらしい", romaji: "atarashii", meaning: "nuevo",         imageQuery: "new product",       emojiBackup: "✨" },
  { hiragana: "ふるい",     romaji: "furui",    meaning: "viejo / antiguo", imageQuery: "old vintage",      emojiBackup: "🏚️" },
  { hiragana: "いい",       romaji: "ii",       meaning: "bueno",          imageQuery: "good thumbs up",    emojiBackup: "👍" },
  { hiragana: "わるい",     romaji: "warui",    meaning: "malo",           imageQuery: "bad thumbs down",   emojiBackup: "👎" },
  { hiragana: "あつい",     romaji: "atsui",    meaning: "caliente",       imageQuery: "hot temperature",   emojiBackup: "🔥" },
  { hiragana: "さむい",     romaji: "samui",    meaning: "frío",           imageQuery: "cold winter",       emojiBackup: "🥶" },
  { hiragana: "はやい",     romaji: "hayai",    meaning: "rápido",         imageQuery: "fast speed",        emojiBackup: "⚡" },
  { hiragana: "おそい",     romaji: "osoi",     meaning: "lento",          imageQuery: "slow turtle",       emojiBackup: "🐢" },
  { hiragana: "むずかしい", romaji: "muzukashii", meaning: "difícil",      imageQuery: "difficult problem", emojiBackup: "😤" },
  { hiragana: "やさしい",   romaji: "yasashii", meaning: "fácil / amable", imageQuery: "easy simple",       emojiBackup: "😊" },
  { hiragana: "たのしい",   romaji: "tanoshii", meaning: "divertido",      imageQuery: "fun happy",         emojiBackup: "😄" },
  { hiragana: "つまらない", romaji: "tsumaranai", meaning: "aburrido",     imageQuery: "bored boring",      emojiBackup: "😑" },
  { hiragana: "おいしい",   romaji: "oishii",   meaning: "delicioso",      imageQuery: "delicious food",    emojiBackup: "😋" },
  { hiragana: "まずい",     romaji: "mazui",    meaning: "malo (sabor)",   imageQuery: "bad taste",         emojiBackup: "🤢" },
  { hiragana: "きれい",     romaji: "kirei",    meaning: "bonito / limpio", imageQuery: "beautiful scenery", emojiBackup: "😍" },
  { hiragana: "きたない",   romaji: "kitanai",  meaning: "sucio / feo",    imageQuery: "dirty messy",       emojiBackup: "🗑️" },

  // --- SALUDOS Y EXPRESIONES ---
  { hiragana: "おはよう",   romaji: "ohayou",   meaning: "buenos días",    imageQuery: "good morning",      emojiBackup: "🌞" },
  { hiragana: "こんにちは", romaji: "konnichiwa", meaning: "hola / buenas tardes", imageQuery: "hello greeting", emojiBackup: "👋" },
  { hiragana: "こんばんは", romaji: "konbanwa",  meaning: "buenas noches", imageQuery: "good evening night", emojiBackup: "🌙" },
  { hiragana: "ありがとう", romaji: "arigatou",  meaning: "gracias",       imageQuery: "thank you",         emojiBackup: "🙏" },
  { hiragana: "すみません", romaji: "sumimasen", meaning: "perdón / disculpe", imageQuery: "excuse me sorry", emojiBackup: "🙇" },
  { hiragana: "はい",       romaji: "hai",       meaning: "sí",            imageQuery: "yes agree",         emojiBackup: "✅" },
  { hiragana: "いいえ",     romaji: "iie",       meaning: "no",            imageQuery: "no disagree",       emojiBackup: "❌" },

  // --- PRONOMBRES Y PARTÍCULAS COMUNES ---
  { hiragana: "わたし",     romaji: "watashi",  meaning: "yo",             imageQuery: "person self",       emojiBackup: "🙋" },
  { hiragana: "あなた",     romaji: "anata",    meaning: "tú",             imageQuery: "pointing you",      emojiBackup: "👉" },
  { hiragana: "かれ",       romaji: "kare",     meaning: "él",             imageQuery: "man",               emojiBackup: "👨" },
  { hiragana: "かのじょ",   romaji: "kanojo",   meaning: "ella",           imageQuery: "woman",             emojiBackup: "👩" },
  { hiragana: "みんな",     romaji: "minna",    meaning: "todos",          imageQuery: "group people",      emojiBackup: "👥" },

  // --- CANTIDADES Y MEDIDAS ---
  { hiragana: "すこし",     romaji: "sukoshi",  meaning: "un poco",        imageQuery: "small amount",      emojiBackup: "🤏" },
  { hiragana: "たくさん",   romaji: "takusan",  meaning: "mucho",          imageQuery: "many lots",         emojiBackup: "💯" },
  { hiragana: "ぜんぶ",     romaji: "zenbu",    meaning: "todo",           imageQuery: "everything all",    emojiBackup: "🌐" },
  { hiragana: "なにも",     romaji: "nanimo",   meaning: "nada",           imageQuery: "empty nothing",     emojiBackup: "🈳" },

  // --- PREGUNTAS ---
  { hiragana: "なに",       romaji: "nani",     meaning: "qué",            imageQuery: "question mark",     emojiBackup: "❓" },
  { hiragana: "どこ",       romaji: "doko",     meaning: "dónde",          imageQuery: "location map",      emojiBackup: "📍" },
  { hiragana: "いつ",       romaji: "itsu",     meaning: "cuándo",         imageQuery: "calendar when",     emojiBackup: "📅" },
  { hiragana: "だれ",       romaji: "dare",     meaning: "quién",          imageQuery: "person silhouette", emojiBackup: "🧑" },
  { hiragana: "なぜ",       romaji: "naze",     meaning: "por qué",        imageQuery: "why question",      emojiBackup: "🤔" },
  { hiragana: "どうやって", romaji: "douyatte", meaning: "cómo",           imageQuery: "how to guide",      emojiBackup: "🛠️" },

  // --- CASA ---
  { hiragana: "へや",       romaji: "heya",     meaning: "habitación",     imageQuery: "room bedroom",      emojiBackup: "🛏️" },
  { hiragana: "トイレ",     romaji: "toire",    meaning: "baño / WC",      imageQuery: "bathroom toilet",   emojiBackup: "🚽" },
  { hiragana: "だいどころ", romaji: "daidokoro", meaning: "cocina",        imageQuery: "kitchen",           emojiBackup: "🍳" },
  { hiragana: "にわ",       romaji: "niwa",     meaning: "jardín",         imageQuery: "garden",            emojiBackup: "🌱" },

  // --- MISCELÁNEOS FRECUENTES ---
  { hiragana: "おかね",     romaji: "okane",    meaning: "dinero",         imageQuery: "money cash",        emojiBackup: "💴" },
  { hiragana: "しごと",     romaji: "shigoto",  meaning: "trabajo",        imageQuery: "work office",       emojiBackup: "💼" },
  { hiragana: "べんきょう", romaji: "benkyou",  meaning: "estudio",        imageQuery: "studying desk",     emojiBackup: "📝" },
  { hiragana: "おんがく",   romaji: "ongaku",   meaning: "música",         imageQuery: "music",             emojiBackup: "🎵" },
  { hiragana: "えいが",     romaji: "eiga",     meaning: "película",       imageQuery: "movie cinema",      emojiBackup: "🎬" },
  { hiragana: "スポーツ",   romaji: "supootsu", meaning: "deporte",        imageQuery: "sports",            emojiBackup: "⚽" },
  { hiragana: "てんき",     romaji: "tenki",    meaning: "clima / tiempo", imageQuery: "weather",           emojiBackup: "🌤️" },
];