export interface VocabWord {
  hiragana: string;    // characters to spell
  romaji: string;      // shown as hint
  meaning: string;     // Spanish, shown ONLY after answering
  imageQuery: string;  // English keyword for Unsplash
  emojiBackup: string; // fallback if Unsplash fails
  category: string;    // category id
  generated?: boolean; // true once an AI-generated vocab image exists
  imagePath?: string;  // slug key into getVocabImageUrl() (src/vocabImages.ts), e.g. "taberu" — NOT a URL
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
  { hiragana: "いち",       romaji: "ichi",     meaning: "uno",            imageQuery: "number one",        emojiBackup: "1️⃣", category: "numeros" , generated: true, imagePath: "numeros-ichi" },
  { hiragana: "に",         romaji: "ni",       meaning: "dos",            imageQuery: "number two",        emojiBackup: "2️⃣", category: "numeros" , generated: true, imagePath: "numeros-ni" },
  { hiragana: "さん",       romaji: "san",      meaning: "tres",           imageQuery: "number three",      emojiBackup: "3️⃣", category: "numeros" , generated: true, imagePath: "numeros-san" },
  { hiragana: "し",         romaji: "shi",      meaning: "cuatro",         imageQuery: "number four",       emojiBackup: "4️⃣", category: "numeros" , generated: true, imagePath: "numeros-shi" },
  { hiragana: "ご",         romaji: "go",       meaning: "cinco",          imageQuery: "number five",       emojiBackup: "5️⃣", category: "numeros" , generated: true, imagePath: "numeros-go" },
  { hiragana: "ろく",       romaji: "roku",     meaning: "seis",           imageQuery: "number six",        emojiBackup: "6️⃣", category: "numeros" , generated: true, imagePath: "numeros-roku" },
  { hiragana: "なな",       romaji: "nana",     meaning: "siete",          imageQuery: "number seven",      emojiBackup: "7️⃣", category: "numeros" , generated: true, imagePath: "numeros-nana" },
  { hiragana: "はち",       romaji: "hachi",    meaning: "ocho",           imageQuery: "number eight",      emojiBackup: "8️⃣", category: "numeros" , generated: true, imagePath: "numeros-hachi" },
  { hiragana: "きゅう",     romaji: "kyuu",     meaning: "nueve",          imageQuery: "number nine",       emojiBackup: "9️⃣", category: "numeros" , generated: true, imagePath: "numeros-kyuu" },
  { hiragana: "じゅう",     romaji: "juu",      meaning: "diez",           imageQuery: "number ten",        emojiBackup: "🔟", category: "numeros" , generated: true, imagePath: "numeros-juu" },

  // --- TIEMPO ---
  { hiragana: "きょう",     romaji: "kyou",     meaning: "hoy",            imageQuery: "today calendar",    emojiBackup: "📅", category: "tiempo" , generated: true, imagePath: "tiempo-kyou" },
  { hiragana: "あした",     romaji: "ashita",   meaning: "mañana",         imageQuery: "tomorrow sunrise",  emojiBackup: "🌅", category: "tiempo" , generated: true, imagePath: "tiempo-ashita" },
  { hiragana: "きのう",     romaji: "kinou",    meaning: "ayer",           imageQuery: "yesterday memory",  emojiBackup: "⬅️", category: "tiempo" , generated: true, imagePath: "tiempo-kinou" },
  { hiragana: "いま",       romaji: "ima",      meaning: "ahora",          imageQuery: "clock now",         emojiBackup: "🕐", category: "tiempo" , generated: true, imagePath: "tiempo-ima" },
  { hiragana: "まいにち",   romaji: "mainichi", meaning: "todos los días",  imageQuery: "daily routine",     emojiBackup: "📆", category: "tiempo" , generated: true, imagePath: "tiempo-mainichi" },
  { hiragana: "あさ",       romaji: "asa",      meaning: "mañana (hora)",  imageQuery: "morning sunrise",   emojiBackup: "🌄", category: "tiempo" , generated: true, imagePath: "tiempo-asa" },
  { hiragana: "ひる",       romaji: "hiru",     meaning: "mediodía",       imageQuery: "noon sun",          emojiBackup: "☀️", category: "tiempo" , generated: true, imagePath: "tiempo-hiru" },
  { hiragana: "よる",       romaji: "yoru",     meaning: "noche",          imageQuery: "night city",        emojiBackup: "🌃", category: "tiempo" , generated: true, imagePath: "tiempo-yoru" },
  { hiragana: "ことし",     romaji: "kotoshi",  meaning: "este año",       imageQuery: "new year",          emojiBackup: "🗓️", category: "tiempo" , generated: true, imagePath: "tiempo-kotoshi" },
  { hiragana: "らいねん",   romaji: "rainen",   meaning: "el año que viene", imageQuery: "future year",     emojiBackup: "⏭️", category: "tiempo" , generated: true, imagePath: "tiempo-rainen" },

  // --- FAMILIA ---
  { hiragana: "おかあさん", romaji: "okaasan",  meaning: "mamá",           imageQuery: "mother",            emojiBackup: "👩", category: "familia" , generated: true, imagePath: "familia-okaasan" },
  { hiragana: "おとうさん", romaji: "otousan",  meaning: "papá",           imageQuery: "father",            emojiBackup: "👨", category: "familia" , generated: true, imagePath: "familia-otousan" },
  { hiragana: "おにいさん", romaji: "oniisan",  meaning: "hermano mayor",  imageQuery: "older brother",     emojiBackup: "👦", category: "familia" , generated: true, imagePath: "familia-oniisan" },
  { hiragana: "おねえさん", romaji: "oneesan",  meaning: "hermana mayor",  imageQuery: "older sister",      emojiBackup: "👧", category: "familia" , generated: true, imagePath: "familia-oneesan" },
  { hiragana: "おとうと",   romaji: "otouto",   meaning: "hermano menor",  imageQuery: "little brother",    emojiBackup: "👶", category: "familia" , generated: true, imagePath: "familia-otouto" },
  { hiragana: "いもうと",   romaji: "imouto",   meaning: "hermana menor",  imageQuery: "little sister",     emojiBackup: "👶", category: "familia" , generated: true, imagePath: "familia-imouto" },
  { hiragana: "おじいさん", romaji: "ojiisan",  meaning: "abuelo",         imageQuery: "grandfather",       emojiBackup: "👴", category: "familia" , generated: true, imagePath: "familia-ojiisan" },
  { hiragana: "おばあさん", romaji: "obaasan",  meaning: "abuela",         imageQuery: "grandmother",       emojiBackup: "👵", category: "familia" , generated: true, imagePath: "familia-obaasan" },
  { hiragana: "こども",     romaji: "kodomo",   meaning: "niño/a",         imageQuery: "child playing",     emojiBackup: "🧒", category: "familia" , generated: true, imagePath: "familia-kodomo" },
  { hiragana: "ともだち",   romaji: "tomodachi", meaning: "amigo/a",       imageQuery: "friends",           emojiBackup: "👫", category: "familia" , generated: true, imagePath: "familia-tomodachi" },

  // --- COMIDA Y BEBIDA ---
  { hiragana: "みず",       romaji: "mizu",     meaning: "agua",           imageQuery: "glass of water",    emojiBackup: "💧", category: "comida" , generated: true, imagePath: "comida-mizu" },
  { hiragana: "おちゃ",     romaji: "ocha",     meaning: "té",             imageQuery: "green tea",         emojiBackup: "🍵", category: "comida" , generated: true, imagePath: "comida-ocha" },
  { hiragana: "コーヒー",   romaji: "koohii",   meaning: "café",           imageQuery: "coffee cup",        emojiBackup: "☕", category: "comida" , generated: true, imagePath: "comida-koohii" },
  { hiragana: "ごはん",     romaji: "gohan",    meaning: "arroz / comida", imageQuery: "rice bowl",         emojiBackup: "🍚", category: "comida" , generated: true, imagePath: "comida-gohan" },
  { hiragana: "パン",       romaji: "pan",      meaning: "pan",            imageQuery: "bread",             emojiBackup: "🍞", category: "comida" , generated: true, imagePath: "comida-pan" },
  { hiragana: "たまご",     romaji: "tamago",   meaning: "huevo",          imageQuery: "egg",               emojiBackup: "🥚", category: "comida" , generated: true, imagePath: "comida-tamago" },
  { hiragana: "さかな",     romaji: "sakana",   meaning: "pescado",        imageQuery: "fish",              emojiBackup: "🐟", category: "comida" , generated: true, imagePath: "comida-sakana" },
  { hiragana: "にく",       romaji: "niku",     meaning: "carne",          imageQuery: "meat",              emojiBackup: "🥩", category: "comida" , generated: true, imagePath: "comida-niku" },
  { hiragana: "やさい",     romaji: "yasai",    meaning: "verdura",        imageQuery: "vegetables",        emojiBackup: "🥦", category: "comida" , generated: true, imagePath: "comida-yasai" },
  { hiragana: "くだもの",   romaji: "kudamono", meaning: "fruta",          imageQuery: "fruit",             emojiBackup: "🍎", category: "comida" , generated: true, imagePath: "comida-kudamono" },
  { hiragana: "りんご",     romaji: "ringo",    meaning: "manzana",        imageQuery: "apple",             emojiBackup: "🍎", category: "comida" , generated: true, imagePath: "comida-ringo" },
  { hiragana: "みかん",     romaji: "mikan",    meaning: "mandarina",      imageQuery: "mandarin orange",   emojiBackup: "🍊", category: "comida" , generated: true, imagePath: "comida-mikan" },
  { hiragana: "バナナ",     romaji: "banana",   meaning: "plátano",        imageQuery: "banana",            emojiBackup: "🍌", category: "comida" , generated: true, imagePath: "comida-banana" },
  { hiragana: "すし",       romaji: "sushi",    meaning: "sushi",          imageQuery: "sushi",             emojiBackup: "🍣", category: "comida" , generated: true, imagePath: "comida-sushi" },
  { hiragana: "ラーメン",   romaji: "raamen",   meaning: "ramen",          imageQuery: "ramen noodles",     emojiBackup: "🍜", category: "comida" , generated: true, imagePath: "comida-raamen" },
  { hiragana: "そば",       romaji: "soba",     meaning: "fideos soba",    imageQuery: "soba noodles",      emojiBackup: "🍜", category: "comida" , generated: true, imagePath: "comida-soba" },
  { hiragana: "うどん",     romaji: "udon",     meaning: "fideos udon",    imageQuery: "udon noodles",      emojiBackup: "🍝", category: "comida" , generated: true, imagePath: "comida-udon" },
  { hiragana: "ケーキ",     romaji: "keeki",    meaning: "pastel",         imageQuery: "cake",              emojiBackup: "🎂", category: "comida" , generated: true, imagePath: "comida-keeki" },
  { hiragana: "アイスクリーム", romaji: "aisukuriimu", meaning: "helado",  imageQuery: "ice cream",         emojiBackup: "🍦", category: "comida" , generated: true, imagePath: "comida-aisukuriimu" },
  { hiragana: "しお",       romaji: "shio",     meaning: "sal",            imageQuery: "salt",              emojiBackup: "🧂", category: "comida" , generated: true, imagePath: "comida-shio" },

  // --- ANIMALES ---
  { hiragana: "いぬ",       romaji: "inu",      meaning: "perro",          imageQuery: "dog",               emojiBackup: "🐕", category: "animales" , generated: true, imagePath: "animales-inu" },
  { hiragana: "ねこ",       romaji: "neko",     meaning: "gato",           imageQuery: "cat",               emojiBackup: "🐈", category: "animales" , generated: true, imagePath: "animales-neko" },
  { hiragana: "とり",       romaji: "tori",     meaning: "pájaro",         imageQuery: "bird",              emojiBackup: "🐦", category: "animales" , generated: true, imagePath: "animales-tori" },
  { hiragana: "さる",       romaji: "saru",     meaning: "mono",           imageQuery: "monkey",            emojiBackup: "🐒", category: "animales" , generated: true, imagePath: "animales-saru" },
  { hiragana: "うし",       romaji: "ushi",     meaning: "vaca",           imageQuery: "cow",               emojiBackup: "🐄", category: "animales" , generated: true, imagePath: "animales-ushi" },
  { hiragana: "うま",       romaji: "uma",      meaning: "caballo",        imageQuery: "horse",             emojiBackup: "🐴", category: "animales" , generated: true, imagePath: "animales-uma" },
  { hiragana: "ぶた",       romaji: "buta",     meaning: "cerdo",          imageQuery: "pig",               emojiBackup: "🐷", category: "animales" , generated: true, imagePath: "animales-buta" },
  { hiragana: "うさぎ",     romaji: "usagi",    meaning: "conejo",         imageQuery: "rabbit",            emojiBackup: "🐰", category: "animales" , generated: true, imagePath: "animales-usagi" },
  { hiragana: "くま",       romaji: "kuma",     meaning: "oso",            imageQuery: "bear",              emojiBackup: "🐻", category: "animales" , generated: true, imagePath: "animales-kuma" },
  { hiragana: "へび",       romaji: "hebi",     meaning: "serpiente",      imageQuery: "snake",             emojiBackup: "🐍", category: "animales" , generated: true, imagePath: "animales-hebi" },

  // --- LUGARES ---
  { hiragana: "うち",       romaji: "uchi",     meaning: "casa (mi casa)", imageQuery: "home house",        emojiBackup: "🏠", category: "lugares" , generated: true, imagePath: "lugares-uchi" },
  { hiragana: "がっこう",   romaji: "gakkou",   meaning: "escuela",        imageQuery: "school building",   emojiBackup: "🏫", category: "lugares" , generated: true, imagePath: "lugares-gakkou" },
  { hiragana: "びょういん", romaji: "byouin",   meaning: "hospital",       imageQuery: "hospital",          emojiBackup: "🏥", category: "lugares" , generated: true, imagePath: "lugares-byouin" },
  { hiragana: "ぎんこう",   romaji: "ginkou",   meaning: "banco",          imageQuery: "bank building",     emojiBackup: "🏦", category: "lugares" , generated: true, imagePath: "lugares-ginkou" },
  { hiragana: "ゆうびんきょく", romaji: "yuubinkyoku", meaning: "correos", imageQuery: "post office",       emojiBackup: "📮", category: "lugares" , generated: true, imagePath: "lugares-yuubinkyoku" },
  { hiragana: "えき",       romaji: "eki",      meaning: "estación (tren)", imageQuery: "train station",    emojiBackup: "🚉", category: "lugares" , generated: true, imagePath: "lugares-eki" },
  { hiragana: "みせ",       romaji: "mise",     meaning: "tienda",         imageQuery: "shop store",        emojiBackup: "🏪", category: "lugares" , generated: true, imagePath: "lugares-mise" },
  { hiragana: "レストラン", romaji: "resutoran", meaning: "restaurante",   imageQuery: "restaurant",        emojiBackup: "🍽️", category: "lugares" , generated: true, imagePath: "lugares-resutoran" },
  { hiragana: "こうえん",   romaji: "kouen",    meaning: "parque",         imageQuery: "park",              emojiBackup: "🌳", category: "lugares" , generated: true, imagePath: "lugares-kouen" },
  { hiragana: "やま",       romaji: "yama",     meaning: "montaña",        imageQuery: "mountain",          emojiBackup: "⛰️", category: "lugares" , generated: true, imagePath: "lugares-yama" },
  { hiragana: "かわ",       romaji: "kawa",     meaning: "río",            imageQuery: "river",             emojiBackup: "🏞️", category: "lugares" , generated: true, imagePath: "lugares-kawa" },
  { hiragana: "うみ",       romaji: "umi",      meaning: "mar",            imageQuery: "sea ocean",         emojiBackup: "🌊", category: "lugares" , generated: true, imagePath: "lugares-umi" },
  { hiragana: "そら",       romaji: "sora",     meaning: "cielo",          imageQuery: "blue sky",          emojiBackup: "🌤️", category: "lugares" , generated: true, imagePath: "lugares-sora" },

  // --- TRANSPORTE ---
  { hiragana: "くるま",     romaji: "kuruma",   meaning: "coche",          imageQuery: "car",               emojiBackup: "🚗", category: "transporte" , generated: true, imagePath: "transporte-kuruma" },
  { hiragana: "でんしゃ",   romaji: "densha",   meaning: "tren eléctrico", imageQuery: "train",             emojiBackup: "🚃", category: "transporte" , generated: true, imagePath: "transporte-densha" },
  { hiragana: "バス",       romaji: "basu",     meaning: "autobús",        imageQuery: "bus",               emojiBackup: "🚌", category: "transporte" , generated: true, imagePath: "transporte-basu" },
  { hiragana: "じてんしゃ", romaji: "jitensha", meaning: "bicicleta",      imageQuery: "bicycle",           emojiBackup: "🚲", category: "transporte" , generated: true, imagePath: "transporte-jitensha" },
  { hiragana: "ひこうき",   romaji: "hikouki",  meaning: "avión",          imageQuery: "airplane",          emojiBackup: "✈️", category: "transporte" , generated: true, imagePath: "transporte-hikouki" },
  { hiragana: "ふね",       romaji: "fune",     meaning: "barco",          imageQuery: "ship boat",         emojiBackup: "🚢", category: "transporte" , generated: true, imagePath: "transporte-fune" },

  // --- OBJETOS COTIDIANOS ---
  { hiragana: "ほん",       romaji: "hon",      meaning: "libro",          imageQuery: "book",              emojiBackup: "📚", category: "objetos" , generated: true, imagePath: "objetos-hon" },
  { hiragana: "かばん",     romaji: "kaban",    meaning: "bolso / mochila", imageQuery: "bag",              emojiBackup: "👜", category: "objetos" , generated: true, imagePath: "objetos-kaban" },
  { hiragana: "かぎ",       romaji: "kagi",     meaning: "llave",          imageQuery: "key",               emojiBackup: "🔑", category: "objetos" , generated: true, imagePath: "objetos-kagi" },
  { hiragana: "とけい",     romaji: "tokei",    meaning: "reloj",          imageQuery: "watch clock",       emojiBackup: "⌚", category: "objetos" , generated: true, imagePath: "objetos-tokei" },
  { hiragana: "かさ",       romaji: "kasa",     meaning: "paraguas",       imageQuery: "umbrella",          emojiBackup: "☂️", category: "objetos" , generated: true, imagePath: "objetos-kasa" },
  { hiragana: "めがね",     romaji: "megane",   meaning: "gafas",          imageQuery: "glasses",           emojiBackup: "👓", category: "objetos" , generated: true, imagePath: "objetos-megane" },
  { hiragana: "でんわ",     romaji: "denwa",    meaning: "teléfono",       imageQuery: "telephone",         emojiBackup: "📞", category: "objetos" , generated: true, imagePath: "objetos-denwa" },
  { hiragana: "テレビ",     romaji: "terebi",   meaning: "televisión",     imageQuery: "television",        emojiBackup: "📺", category: "objetos" , generated: true, imagePath: "objetos-terebi" },
  { hiragana: "カメラ",     romaji: "kamera",   meaning: "cámara",         imageQuery: "camera",            emojiBackup: "📷", category: "objetos" , generated: true, imagePath: "objetos-kamera" },
  { hiragana: "つくえ",     romaji: "tsukue",   meaning: "escritorio",     imageQuery: "desk",              emojiBackup: "🪑", category: "objetos" , generated: true, imagePath: "objetos-tsukue" },
  { hiragana: "いす",       romaji: "isu",      meaning: "silla",          imageQuery: "chair",             emojiBackup: "🪑", category: "objetos" , generated: true, imagePath: "objetos-isu" },
  { hiragana: "まど",       romaji: "mado",     meaning: "ventana",        imageQuery: "window",            emojiBackup: "🪟", category: "objetos" , generated: true, imagePath: "objetos-mado" },
  { hiragana: "ドア",       romaji: "doa",      meaning: "puerta",         imageQuery: "door",              emojiBackup: "🚪", category: "objetos" , generated: true, imagePath: "objetos-doa" },
  { hiragana: "かみ",       romaji: "kami",     meaning: "papel",          imageQuery: "paper",             emojiBackup: "📄", category: "objetos" , generated: true, imagePath: "objetos-kami" },
  { hiragana: "えんぴつ",   romaji: "enpitsu",  meaning: "lápiz",          imageQuery: "pencil",            emojiBackup: "✏️", category: "objetos" , generated: true, imagePath: "objetos-enpitsu" },

  // --- ROPA ---
  { hiragana: "シャツ",     romaji: "shatsu",   meaning: "camisa",         imageQuery: "shirt",             emojiBackup: "👔", category: "ropa" , generated: true, imagePath: "ropa-shatsu" },
  { hiragana: "ズボン",     romaji: "zubon",    meaning: "pantalón",       imageQuery: "trousers pants",    emojiBackup: "👖", category: "ropa" , generated: true, imagePath: "ropa-zubon" },
  { hiragana: "くつ",       romaji: "kutsu",    meaning: "zapatos",        imageQuery: "shoes",             emojiBackup: "👟", category: "ropa" , generated: true, imagePath: "ropa-kutsu" },
  { hiragana: "ぼうし",     romaji: "boushi",   meaning: "sombrero",       imageQuery: "hat",               emojiBackup: "🎩", category: "ropa" , generated: true, imagePath: "ropa-boushi" },
  { hiragana: "コート",     romaji: "kooto",    meaning: "abrigo",         imageQuery: "coat",              emojiBackup: "🧥", category: "ropa" , generated: true, imagePath: "ropa-kooto" },

  // --- COLORES ---
  { hiragana: "あか",       romaji: "aka",      meaning: "rojo",           imageQuery: "red color",         emojiBackup: "🔴", category: "colores" , generated: true, imagePath: "colores-aka" },
  { hiragana: "あお",       romaji: "ao",       meaning: "azul",           imageQuery: "blue color",        emojiBackup: "🔵", category: "colores" , generated: true, imagePath: "colores-ao" },
  { hiragana: "しろ",       romaji: "shiro",    meaning: "blanco",         imageQuery: "white background",  emojiBackup: "⬜", category: "colores" , generated: true, imagePath: "colores-shiro" },
  { hiragana: "くろ",       romaji: "kuro",     meaning: "negro",          imageQuery: "black background",  emojiBackup: "⬛", category: "colores" , generated: true, imagePath: "colores-kuro" },
  { hiragana: "きいろ",     romaji: "kiiro",    meaning: "amarillo",       imageQuery: "yellow color",      emojiBackup: "🟡", category: "colores" , generated: true, imagePath: "colores-kiiro" },
  { hiragana: "みどり",     romaji: "midori",   meaning: "verde",          imageQuery: "green color",       emojiBackup: "🟢", category: "colores" , generated: true, imagePath: "colores-midori" },
  { hiragana: "ちゃいろ",   romaji: "chairo",   meaning: "marrón",         imageQuery: "brown color",       emojiBackup: "🟤", category: "colores" , generated: true, imagePath: "colores-chairo" },

  // --- NATURALEZA ---
  { hiragana: "はな",       romaji: "hana",     meaning: "flor",           imageQuery: "flower",            emojiBackup: "🌸", category: "naturaleza" , generated: true, imagePath: "naturaleza-hana" },
  { hiragana: "き",         romaji: "ki",       meaning: "árbol",          imageQuery: "tree",              emojiBackup: "🌳", category: "naturaleza" , generated: true, imagePath: "naturaleza-ki" },
  { hiragana: "くさ",       romaji: "kusa",     meaning: "hierba",         imageQuery: "grass",             emojiBackup: "🌿", category: "naturaleza" , generated: true, imagePath: "naturaleza-kusa" },
  { hiragana: "あめ",       romaji: "ame",      meaning: "lluvia",         imageQuery: "rain",              emojiBackup: "🌧️", category: "naturaleza" , generated: true, imagePath: "naturaleza-ame" },
  { hiragana: "ゆき",       romaji: "yuki",     meaning: "nieve",          imageQuery: "snow",              emojiBackup: "❄️", category: "naturaleza" , generated: true, imagePath: "naturaleza-yuki" },
  { hiragana: "かぜ",       romaji: "kaze",     meaning: "viento",         imageQuery: "wind",              emojiBackup: "💨", category: "naturaleza" , generated: true, imagePath: "naturaleza-kaze" },
  { hiragana: "つき",       romaji: "tsuki",    meaning: "luna",           imageQuery: "moon",              emojiBackup: "🌙", category: "naturaleza" , generated: true, imagePath: "naturaleza-tsuki" },
  { hiragana: "ほし",       romaji: "hoshi",    meaning: "estrella",       imageQuery: "star",              emojiBackup: "⭐", category: "naturaleza" , generated: true, imagePath: "naturaleza-hoshi" },

  // --- CUERPO ---
  { hiragana: "あたま",     romaji: "atama",    meaning: "cabeza",         imageQuery: "head",              emojiBackup: "🗣️", category: "cuerpo" , generated: true, imagePath: "cuerpo-atama" },
  { hiragana: "め",         romaji: "me",       meaning: "ojo",            imageQuery: "eye",               emojiBackup: "👁️", category: "cuerpo" , generated: true, imagePath: "cuerpo-me" },
  { hiragana: "みみ",       romaji: "mimi",     meaning: "oreja",          imageQuery: "ear",               emojiBackup: "👂", category: "cuerpo" , generated: true, imagePath: "cuerpo-mimi" },
  { hiragana: "はな",       romaji: "hana",     meaning: "nariz",          imageQuery: "nose",              emojiBackup: "👃", category: "cuerpo" , generated: true, imagePath: "cuerpo-hana" },
  { hiragana: "くち",       romaji: "kuchi",    meaning: "boca",           imageQuery: "mouth lips",        emojiBackup: "👄", category: "cuerpo" , generated: true, imagePath: "cuerpo-kuchi" },
  { hiragana: "て",         romaji: "te",       meaning: "mano",           imageQuery: "hand",              emojiBackup: "✋", category: "cuerpo" , generated: true, imagePath: "cuerpo-te" },
  { hiragana: "あし",       romaji: "ashi",     meaning: "pie / pierna",   imageQuery: "foot leg",          emojiBackup: "🦶", category: "cuerpo" , generated: true, imagePath: "cuerpo-ashi" },

  // --- VERBOS COMUNES ---
  { hiragana: "たべる",     romaji: "taberu",   meaning: "comer",          imageQuery: "eating food",       emojiBackup: "🍽️", category: "verbos" , generated: true, imagePath: "verbos-taberu" },
  { hiragana: "のむ",       romaji: "nomu",     meaning: "beber",          imageQuery: "drinking water",    emojiBackup: "🥤", category: "verbos" , generated: true, imagePath: "verbos-nomu" },
  { hiragana: "みる",       romaji: "miru",     meaning: "ver / mirar",    imageQuery: "watching",          emojiBackup: "👀", category: "verbos" , generated: true, imagePath: "verbos-miru" },
  { hiragana: "きく",       romaji: "kiku",     meaning: "escuchar",       imageQuery: "listening music",   emojiBackup: "🎧", category: "verbos" , generated: true, imagePath: "verbos-kiku" },
  { hiragana: "はなす",     romaji: "hanasu",   meaning: "hablar",         imageQuery: "talking people",    emojiBackup: "💬", category: "verbos" , generated: true, imagePath: "verbos-hanasu" },
  { hiragana: "かく",       romaji: "kaku",     meaning: "escribir",       imageQuery: "writing",           emojiBackup: "✍️", category: "verbos" , generated: true, imagePath: "verbos-kaku" },
  { hiragana: "よむ",       romaji: "yomu",     meaning: "leer",           imageQuery: "reading book",      emojiBackup: "📖", category: "verbos" , generated: true, imagePath: "verbos-yomu" },
  { hiragana: "かう",       romaji: "kau",      meaning: "comprar",        imageQuery: "shopping",          emojiBackup: "🛒", category: "verbos" , generated: true, imagePath: "verbos-kau" },
  { hiragana: "うる",       romaji: "uru",      meaning: "vender",         imageQuery: "selling market",    emojiBackup: "💰", category: "verbos" , generated: true, imagePath: "verbos-uru" },
  { hiragana: "あるく",     romaji: "aruku",    meaning: "caminar",        imageQuery: "walking person",    emojiBackup: "🚶", category: "verbos" , generated: true, imagePath: "verbos-aruku" },
  { hiragana: "はしる",     romaji: "hashiru",  meaning: "correr",         imageQuery: "running person",    emojiBackup: "🏃", category: "verbos" , generated: true, imagePath: "verbos-hashiru" },
  { hiragana: "のる",       romaji: "noru",     meaning: "montar / subir", imageQuery: "riding bus",        emojiBackup: "🚌", category: "verbos" , generated: true, imagePath: "verbos-noru" },
  { hiragana: "おきる",     romaji: "okiru",    meaning: "levantarse",     imageQuery: "waking up morning", emojiBackup: "⏰", category: "verbos" , generated: true, imagePath: "verbos-okiru" },
  { hiragana: "ねる",       romaji: "neru",     meaning: "dormir",         imageQuery: "sleeping",          emojiBackup: "😴", category: "verbos" , generated: true, imagePath: "verbos-neru" },
  { hiragana: "いく",       romaji: "iku",      meaning: "ir",             imageQuery: "going walking",     emojiBackup: "➡️", category: "verbos" , generated: true, imagePath: "verbos-iku" },
  { hiragana: "くる",       romaji: "kuru",     meaning: "venir",          imageQuery: "arriving",          emojiBackup: "🔙", category: "verbos" , generated: true, imagePath: "verbos-kuru" },
  { hiragana: "かえる",     romaji: "kaeru",    meaning: "regresar",       imageQuery: "going home",        emojiBackup: "🏠", category: "verbos" , generated: true, imagePath: "verbos-kaeru" },
  { hiragana: "あう",       romaji: "au",       meaning: "encontrarse",    imageQuery: "meeting friends",   emojiBackup: "🤝", category: "verbos" , generated: true, imagePath: "verbos-au" },
  { hiragana: "まつ",       romaji: "matsu",    meaning: "esperar",        imageQuery: "waiting person",    emojiBackup: "⏳", category: "verbos" , generated: true, imagePath: "verbos-matsu" },
  { hiragana: "しごとする", romaji: "shigoto suru", meaning: "trabajar",   imageQuery: "working office",    emojiBackup: "💼", category: "verbos" , generated: true, imagePath: "verbos-shigoto-suru" },
  { hiragana: "べんきょうする", romaji: "benkyou suru", meaning: "estudiar", imageQuery: "studying",        emojiBackup: "📚", category: "verbos" , generated: true, imagePath: "verbos-benkyou-suru" },
  { hiragana: "あそぶ",     romaji: "asobu",    meaning: "jugar",          imageQuery: "playing children",  emojiBackup: "🎮", category: "verbos" , generated: true, imagePath: "verbos-asobu" },
  { hiragana: "つかう",     romaji: "tsukau",   meaning: "usar",           imageQuery: "using phone",       emojiBackup: "📱", category: "verbos" , generated: true, imagePath: "verbos-tsukau" },
  { hiragana: "あける",     romaji: "akeru",    meaning: "abrir",          imageQuery: "opening door",      emojiBackup: "🚪", category: "verbos" , generated: true, imagePath: "verbos-akeru" },
  { hiragana: "しめる",     romaji: "shimeru",  meaning: "cerrar",         imageQuery: "closing door",      emojiBackup: "🔒", category: "verbos" , generated: true, imagePath: "verbos-shimeru" },

  // --- ADJETIVOS COMUNES ---
  { hiragana: "おおきい",   romaji: "ookii",    meaning: "grande",         imageQuery: "big large size",    emojiBackup: "🔲", category: "adjetivos" , generated: true, imagePath: "adjetivos-ookii" },
  { hiragana: "ちいさい",   romaji: "chiisai",  meaning: "pequeño",        imageQuery: "small tiny",        emojiBackup: "🔹", category: "adjetivos" , generated: true, imagePath: "adjetivos-chiisai" },
  { hiragana: "たかい",     romaji: "takai",    meaning: "alto / caro",    imageQuery: "tall building",     emojiBackup: "🏢", category: "adjetivos" , generated: true, imagePath: "adjetivos-takai" },
  { hiragana: "ひくい",     romaji: "hikui",    meaning: "bajo",           imageQuery: "low short",         emojiBackup: "📉", category: "adjetivos" , generated: true, imagePath: "adjetivos-hikui" },
  { hiragana: "あたらしい", romaji: "atarashii", meaning: "nuevo",         imageQuery: "new product",       emojiBackup: "✨", category: "adjetivos" , generated: true, imagePath: "adjetivos-atarashii" },
  { hiragana: "ふるい",     romaji: "furui",    meaning: "viejo / antiguo", imageQuery: "old vintage",      emojiBackup: "🏚️", category: "adjetivos" , generated: true, imagePath: "adjetivos-furui" },
  { hiragana: "いい",       romaji: "ii",       meaning: "bueno",          imageQuery: "good thumbs up",    emojiBackup: "👍", category: "adjetivos" , generated: true, imagePath: "adjetivos-ii" },
  { hiragana: "わるい",     romaji: "warui",    meaning: "malo",           imageQuery: "bad thumbs down",   emojiBackup: "👎", category: "adjetivos" , generated: true, imagePath: "adjetivos-warui" },
  { hiragana: "あつい",     romaji: "atsui",    meaning: "caliente",       imageQuery: "hot temperature",   emojiBackup: "🔥", category: "adjetivos" , generated: true, imagePath: "adjetivos-atsui" },
  { hiragana: "さむい",     romaji: "samui",    meaning: "frío",           imageQuery: "cold winter",       emojiBackup: "🥶", category: "adjetivos" , generated: true, imagePath: "adjetivos-samui" },
  { hiragana: "はやい",     romaji: "hayai",    meaning: "rápido",         imageQuery: "fast speed",        emojiBackup: "⚡", category: "adjetivos" , generated: true, imagePath: "adjetivos-hayai" },
  { hiragana: "おそい",     romaji: "osoi",     meaning: "lento",          imageQuery: "slow turtle",       emojiBackup: "🐢", category: "adjetivos" , generated: true, imagePath: "adjetivos-osoi" },
  { hiragana: "むずかしい", romaji: "muzukashii", meaning: "difícil",      imageQuery: "difficult problem", emojiBackup: "😤", category: "adjetivos" , generated: true, imagePath: "adjetivos-muzukashii" },
  { hiragana: "やさしい",   romaji: "yasashii", meaning: "fácil / amable", imageQuery: "easy simple",       emojiBackup: "😊", category: "adjetivos" , generated: true, imagePath: "adjetivos-yasashii" },
  { hiragana: "たのしい",   romaji: "tanoshii", meaning: "divertido",      imageQuery: "fun happy",         emojiBackup: "😄", category: "adjetivos" , generated: true, imagePath: "adjetivos-tanoshii" },
  { hiragana: "つまらない", romaji: "tsumaranai", meaning: "aburrido",     imageQuery: "bored boring",      emojiBackup: "😑", category: "adjetivos" , generated: true, imagePath: "adjetivos-tsumaranai" },
  { hiragana: "おいしい",   romaji: "oishii",   meaning: "delicioso",      imageQuery: "delicious food",    emojiBackup: "😋", category: "adjetivos" , generated: true, imagePath: "adjetivos-oishii" },
  { hiragana: "まずい",     romaji: "mazui",    meaning: "malo (sabor)",   imageQuery: "bad taste",         emojiBackup: "🤢", category: "adjetivos" , generated: true, imagePath: "adjetivos-mazui" },
  { hiragana: "きれい",     romaji: "kirei",    meaning: "bonito / limpio", imageQuery: "beautiful scenery", emojiBackup: "😍", category: "adjetivos" , generated: true, imagePath: "adjetivos-kirei" },
  { hiragana: "きたない",   romaji: "kitanai",  meaning: "sucio / feo",    imageQuery: "dirty messy",       emojiBackup: "🗑️", category: "adjetivos" , generated: true, imagePath: "adjetivos-kitanai" },

  // --- SALUDOS Y EXPRESIONES ---
  { hiragana: "おはよう",   romaji: "ohayou",   meaning: "buenos días",    imageQuery: "good morning",      emojiBackup: "🌞", category: "saludos" , generated: true, imagePath: "saludos-ohayou" },
  { hiragana: "こんにちは", romaji: "konnichiwa", meaning: "hola / buenas tardes", imageQuery: "hello greeting", emojiBackup: "👋", category: "saludos" , generated: true, imagePath: "saludos-konnichiwa" },
  { hiragana: "こんばんは", romaji: "konbanwa",  meaning: "buenas noches", imageQuery: "good evening night", emojiBackup: "🌙", category: "saludos" , generated: true, imagePath: "saludos-konbanwa" },
  { hiragana: "ありがとう", romaji: "arigatou",  meaning: "gracias",       imageQuery: "thank you",         emojiBackup: "🙏", category: "saludos" , generated: true, imagePath: "saludos-arigatou" },
  { hiragana: "すみません", romaji: "sumimasen", meaning: "perdón / disculpe", imageQuery: "excuse me sorry", emojiBackup: "🙇", category: "saludos" , generated: true, imagePath: "saludos-sumimasen" },
  { hiragana: "はい",       romaji: "hai",       meaning: "sí",            imageQuery: "yes agree",         emojiBackup: "✅", category: "saludos" , generated: true, imagePath: "saludos-hai" },
  { hiragana: "いいえ",     romaji: "iie",       meaning: "no",            imageQuery: "no disagree",       emojiBackup: "❌", category: "saludos" , generated: true, imagePath: "saludos-iie" },

  // --- PRONOMBRES Y PARTÍCULAS COMUNES ---
  { hiragana: "わたし",     romaji: "watashi",  meaning: "yo",             imageQuery: "person self",       emojiBackup: "🙋", category: "pronombres" , generated: true, imagePath: "pronombres-watashi" },
  { hiragana: "あなた",     romaji: "anata",    meaning: "tú",             imageQuery: "pointing you",      emojiBackup: "👉", category: "pronombres" , generated: true, imagePath: "pronombres-anata" },
  { hiragana: "かれ",       romaji: "kare",     meaning: "él",             imageQuery: "man",               emojiBackup: "👨", category: "pronombres" , generated: true, imagePath: "pronombres-kare" },
  { hiragana: "かのじょ",   romaji: "kanojo",   meaning: "ella",           imageQuery: "woman",             emojiBackup: "👩", category: "pronombres" , generated: true, imagePath: "pronombres-kanojo" },
  { hiragana: "みんな",     romaji: "minna",    meaning: "todos",          imageQuery: "group people",      emojiBackup: "👥", category: "pronombres" , generated: true, imagePath: "pronombres-minna" },

  // --- CANTIDADES Y MEDIDAS ---
  { hiragana: "すこし",     romaji: "sukoshi",  meaning: "un poco",        imageQuery: "small amount",      emojiBackup: "🤏", category: "cantidades" , generated: true, imagePath: "cantidades-sukoshi" },
  { hiragana: "たくさん",   romaji: "takusan",  meaning: "mucho",          imageQuery: "many lots",         emojiBackup: "💯", category: "cantidades" , generated: true, imagePath: "cantidades-takusan" },
  { hiragana: "ぜんぶ",     romaji: "zenbu",    meaning: "todo",           imageQuery: "everything all",    emojiBackup: "🌐", category: "cantidades" , generated: true, imagePath: "cantidades-zenbu" },
  { hiragana: "なにも",     romaji: "nanimo",   meaning: "nada",           imageQuery: "empty nothing",     emojiBackup: "🈳", category: "cantidades" , generated: true, imagePath: "cantidades-nanimo" },

  // --- PREGUNTAS ---
  { hiragana: "なに",       romaji: "nani",     meaning: "qué",            imageQuery: "question mark",     emojiBackup: "❓", category: "preguntas" , generated: true, imagePath: "preguntas-nani" },
  { hiragana: "どこ",       romaji: "doko",     meaning: "dónde",          imageQuery: "location map",      emojiBackup: "📍", category: "preguntas" , generated: true, imagePath: "preguntas-doko" },
  { hiragana: "いつ",       romaji: "itsu",     meaning: "cuándo",         imageQuery: "calendar when",     emojiBackup: "📅", category: "preguntas" , generated: true, imagePath: "preguntas-itsu" },
  { hiragana: "だれ",       romaji: "dare",     meaning: "quién",          imageQuery: "person silhouette", emojiBackup: "🧑", category: "preguntas" , generated: true, imagePath: "preguntas-dare" },
  { hiragana: "なぜ",       romaji: "naze",     meaning: "por qué",        imageQuery: "why question",      emojiBackup: "🤔", category: "preguntas" , generated: true, imagePath: "preguntas-naze" },
  { hiragana: "どうやって", romaji: "douyatte", meaning: "cómo",           imageQuery: "how to guide",      emojiBackup: "🛠️", category: "preguntas" , generated: true, imagePath: "preguntas-douyatte" },

  // --- CASA ---
  { hiragana: "へや",       romaji: "heya",     meaning: "habitación",     imageQuery: "room bedroom",      emojiBackup: "🛏️", category: "casa" , generated: true, imagePath: "casa-heya" },
  { hiragana: "トイレ",     romaji: "toire",    meaning: "baño / WC",      imageQuery: "bathroom toilet",   emojiBackup: "🚽", category: "casa" , generated: true, imagePath: "casa-toire" },
  { hiragana: "だいどころ", romaji: "daidokoro", meaning: "cocina",        imageQuery: "kitchen",           emojiBackup: "🍳", category: "casa" , generated: true, imagePath: "casa-daidokoro" },
  { hiragana: "にわ",       romaji: "niwa",     meaning: "jardín",         imageQuery: "garden",            emojiBackup: "🌱", category: "casa" , generated: true, imagePath: "casa-niwa" },

  // --- MISCELÁNEOS FRECUENTES ---
  { hiragana: "おかね",     romaji: "okane",    meaning: "dinero",         imageQuery: "money cash",        emojiBackup: "💴", category: "misc" , generated: true, imagePath: "misc-okane" },
  { hiragana: "しごと",     romaji: "shigoto",  meaning: "trabajo",        imageQuery: "work office",       emojiBackup: "💼", category: "misc" , generated: true, imagePath: "misc-shigoto" },
  { hiragana: "べんきょう", romaji: "benkyou",  meaning: "estudio",        imageQuery: "studying desk",     emojiBackup: "📝", category: "misc" , generated: true, imagePath: "misc-benkyou" },
  { hiragana: "おんがく",   romaji: "ongaku",   meaning: "música",         imageQuery: "music",             emojiBackup: "🎵", category: "misc" , generated: true, imagePath: "misc-ongaku" },
  { hiragana: "えいが",     romaji: "eiga",     meaning: "película",       imageQuery: "movie cinema",      emojiBackup: "🎬", category: "misc" , generated: true, imagePath: "misc-eiga" },
  { hiragana: "スポーツ",   romaji: "supootsu", meaning: "deporte",        imageQuery: "sports",            emojiBackup: "⚽", category: "misc" , generated: true, imagePath: "misc-supootsu" },
  { hiragana: "てんき",     romaji: "tenki",    meaning: "clima / tiempo", imageQuery: "weather",           emojiBackup: "🌤️", category: "misc" , generated: true, imagePath: "misc-tenki" },
];
