export interface Phrase {
  id: string;        // slug único, p.ej. "ohayou-gozaimasu"
  kana: string;       // texto a leer/escuchar
  romaji: string;     // shown as hint
  meaning: string;    // significado en español
  context: string;    // cuándo/cómo se usa, en español
  category: string;   // category id
}

export interface PhraseCategory {
  id: string;
  label: string;
  emoji: string;
}

export const PHRASE_CATEGORIES: PhraseCategory[] = [
  { id: "saludos",     label: "Saludos",     emoji: "👋" },
  { id: "cortesia",    label: "Cortesía",    emoji: "🙏" },
  { id: "restaurante", label: "Restaurante", emoji: "🍜" },
  { id: "compras",     label: "Compras",     emoji: "🛍️" },
  { id: "emergencia",  label: "Emergencia",  emoji: "🚨" },
];

export const PHRASES: Phrase[] = [
  // ── Saludos ──────────────────────────────────────────────────────────────
  { id: "ohayou",              kana: "おはよう",                 romaji: "ohayou",                meaning: "buenos días (informal)",        context: "Con amigos o familia, antes del mediodía.", category: "saludos" },
  { id: "ohayou-gozaimasu",    kana: "おはようございます",       romaji: "ohayou gozaimasu",      meaning: "buenos días (formal)",           context: "Al llegar al trabajo o con desconocidos, antes del mediodía.", category: "saludos" },
  { id: "konnichiwa",          kana: "こんにちは",               romaji: "konnichiwa",            meaning: "buenas tardes / hola",           context: "Saludo general durante el día.", category: "saludos" },
  { id: "konbanwa",            kana: "こんばんは",               romaji: "konbanwa",              meaning: "buenas noches (al llegar)",      context: "Al saludar por la noche, no para despedirse.", category: "saludos" },
  { id: "oyasumi",             kana: "おやすみ",                 romaji: "oyasumi",               meaning: "buenas noches (al dormir)",      context: "Antes de irse a dormir, informal.", category: "saludos" },
  { id: "oyasuminasai",        kana: "おやすみなさい",           romaji: "oyasuminasai",          meaning: "buenas noches (al dormir, formal)", context: "Antes de irse a dormir, con más respeto.", category: "saludos" },
  { id: "sayounara",           kana: "さようなら",               romaji: "sayounara",             meaning: "adiós",                          context: "Despedida algo formal o definitiva.", category: "saludos" },
  { id: "jaa-ne",              kana: "じゃあね",                 romaji: "jaa ne",                meaning: "nos vemos (informal)",           context: "Despedida casual entre amigos.", category: "saludos" },
  { id: "mata-ne",             kana: "またね",                   romaji: "mata ne",               meaning: "hasta luego",                    context: "Despedida informal, esperando verse pronto.", category: "saludos" },
  { id: "mata-ashita",         kana: "またあした",               romaji: "mata ashita",           meaning: "hasta mañana",                   context: "Al despedirse sabiendo que se verán mañana.", category: "saludos" },
  { id: "hajimemashite",       kana: "はじめまして",             romaji: "hajimemashite",         meaning: "mucho gusto",                    context: "Al conocer a alguien por primera vez.", category: "saludos" },
  { id: "yoroshiku",           kana: "よろしくおねがいします",   romaji: "yoroshiku onegaishimasu", meaning: "encantado / cuento contigo",   context: "Tras presentarse, o al pedir un favor o colaboración.", category: "saludos" },
  { id: "ogenki-desu-ka",      kana: "おげんきですか",           romaji: "ogenki desu ka",        meaning: "¿cómo estás?",                   context: "Pregunta cortés por el bienestar de alguien.", category: "saludos" },
  { id: "genki-desu",          kana: "げんきです",               romaji: "genki desu",            meaning: "estoy bien",                     context: "Respuesta típica a おげんきですか。", category: "saludos" },
  { id: "hisashiburi",         kana: "おひさしぶりです",         romaji: "ohisashiburi desu",     meaning: "cuánto tiempo sin verte",        context: "Al reencontrarse con alguien tras mucho tiempo.", category: "saludos" },
  { id: "itterasshai",         kana: "いってらっしゃい",         romaji: "itterasshai",           meaning: "que te vaya bien (al salir)",    context: "Se dice a quien sale de casa/trabajo.", category: "saludos" },
  { id: "ittekimasu",          kana: "いってきます",             romaji: "ittekimasu",            meaning: "ya vuelvo / me voy",             context: "Lo dice quien sale, antes de salir de casa.", category: "saludos" },
  { id: "tadaima",             kana: "ただいま",                 romaji: "tadaima",               meaning: "ya volví",                       context: "Al regresar a casa.", category: "saludos" },
  { id: "okaeri",              kana: "おかえりなさい",           romaji: "okaerinasai",           meaning: "bienvenido a casa",              context: "Se dice a quien acaba de volver.", category: "saludos" },

  // ── Cortesía ─────────────────────────────────────────────────────────────
  { id: "arigatou",            kana: "ありがとう",               romaji: "arigatou",              meaning: "gracias (informal)",             context: "Con amigos o en situaciones casuales.", category: "cortesia" },
  { id: "arigatou-gozaimasu",  kana: "ありがとうございます",     romaji: "arigatou gozaimasu",    meaning: "muchas gracias (formal)",        context: "Con desconocidos, clientes o superiores.", category: "cortesia" },
  { id: "doumo",               kana: "どうも",                   romaji: "doumo",                 meaning: "gracias (muy informal/breve)",   context: "Agradecimiento rápido, casual.", category: "cortesia" },
  { id: "sumimasen",           kana: "すみません",               romaji: "sumimasen",             meaning: "disculpe / perdón",              context: "Para pedir perdón, llamar la atención o agradecer con humildad.", category: "cortesia" },
  { id: "gomen",               kana: "ごめん",                   romaji: "gomen",                 meaning: "perdón (informal)",              context: "Disculpa casual entre amigos.", category: "cortesia" },
  { id: "gomennasai",          kana: "ごめんなさい",             romaji: "gomennasai",            meaning: "lo siento mucho",                context: "Disculpa más sentida o formal.", category: "cortesia" },
  { id: "shitsurei-shimasu",   kana: "しつれいします",           romaji: "shitsurei shimasu",     meaning: "con permiso / disculpe la molestia", context: "Al entrar/salir de una sala, o interrumpir.", category: "cortesia" },
  { id: "onegai-shimasu",      kana: "おねがいします",           romaji: "onegaishimasu",         meaning: "por favor",                      context: "Al pedir algo formalmente.", category: "cortesia" },
  { id: "kudasai",             kana: "ください",                 romaji: "kudasai",               meaning: "por favor, deme...",             context: "Se añade tras un sustantivo para pedir algo.", category: "cortesia" },
  { id: "doitashimashite",    kana: "どういたしまして",         romaji: "douitashimashite",      meaning: "de nada",                        context: "Respuesta a un agradecimiento.", category: "cortesia" },
  { id: "daijoubu-desu",       kana: "だいじょうぶです",         romaji: "daijoubu desu",         meaning: "está bien / no hay problema",    context: "Para tranquilizar o declinar algo cortésmente.", category: "cortesia" },
  { id: "hai",                 kana: "はい",                     romaji: "hai",                   meaning: "sí",                             context: "Afirmación, también usada para mostrar que escuchas.", category: "cortesia" },
  { id: "iie",                 kana: "いいえ",                   romaji: "iie",                   meaning: "no",                             context: "Negación cortés.", category: "cortesia" },
  { id: "wakarimashita",       kana: "わかりました",             romaji: "wakarimashita",         meaning: "entendido",                      context: "Para confirmar que se entendió algo.", category: "cortesia" },
  { id: "wakarimasen",         kana: "わかりません",             romaji: "wakarimasen",           meaning: "no entiendo / no sé",            context: "Cuando no se comprende algo.", category: "cortesia" },
  { id: "mou-ichido",          kana: "もういちどおねがいします", romaji: "mou ichido onegaishimasu", meaning: "una vez más, por favor",      context: "Para pedir que repitan algo.", category: "cortesia" },
  { id: "yukkuri",             kana: "ゆっくりおねがいします",   romaji: "yukkuri onegaishimasu", meaning: "más despacio, por favor",       context: "Cuando alguien habla demasiado rápido.", category: "cortesia" },
  { id: "omedetou",            kana: "おめでとう",               romaji: "omedetou",              meaning: "felicidades",                    context: "Para celebrar un logro o evento.", category: "cortesia" },
  { id: "ganbatte",            kana: "がんばって",               romaji: "ganbatte",              meaning: "¡ánimo! / esfuérzate",           context: "Para animar a alguien antes de un reto.", category: "cortesia" },
  { id: "otsukaresama",        kana: "おつかれさまです",         romaji: "otsukaresama desu",     meaning: "buen trabajo / gracias por el esfuerzo", context: "Al terminar el trabajo o una tarea conjunta.", category: "cortesia" },

  // ── Restaurante ──────────────────────────────────────────────────────────
  { id: "itadakimasu",         kana: "いただきます",             romaji: "itadakimasu",           meaning: "¡a comer! (antes de comer)",     context: "Se dice siempre antes de empezar a comer.", category: "restaurante" },
  { id: "gochisousama",        kana: "ごちそうさまでした",       romaji: "gochisousama deshita",  meaning: "gracias por la comida",          context: "Se dice al terminar de comer.", category: "restaurante" },
  { id: "irasshaimase",        kana: "いらっしゃいませ",         romaji: "irasshaimase",          meaning: "¡bienvenido!",                   context: "Lo dice el personal al entrar a una tienda o restaurante.", category: "restaurante" },
  { id: "menyuu-onegaishimasu",kana: "メニューをおねがいします", romaji: "menyuu o onegaishimasu",meaning: "el menú, por favor",             context: "Al pedir la carta en un restaurante.", category: "restaurante" },
  { id: "kore-o-kudasai",      kana: "これをください",           romaji: "kore o kudasai",        meaning: "esto, por favor",                context: "Al señalar y pedir un plato del menú.", category: "restaurante" },
  { id: "osusume-wa",          kana: "おすすめはなんですか",     romaji: "osusume wa nan desu ka",meaning: "¿qué recomienda?",               context: "Para pedir una recomendación al camarero.", category: "restaurante" },
  { id: "oishii",              kana: "おいしいです",             romaji: "oishii desu",           meaning: "está delicioso",                 context: "Para elogiar la comida.", category: "restaurante" },
  { id: "okaikei-onegaishimasu",kana: "おかいけいおねがいします",romaji: "okaikei onegaishimasu", meaning: "la cuenta, por favor",           context: "Al pedir la cuenta.", category: "restaurante" },
  { id: "ikura-desu-ka",       kana: "いくらですか",             romaji: "ikura desu ka",         meaning: "¿cuánto cuesta?",                context: "Para preguntar el precio.", category: "restaurante" },
  { id: "mizu-kudasai",        kana: "みずをください",           romaji: "mizu o kudasai",        meaning: "agua, por favor",                context: "Al pedir agua en un restaurante.", category: "restaurante" },
  { id: "toriaezu-biiru",      kana: "とりあえずビールをください",romaji: "toriaezu biiru o kudasai",meaning: "para empezar, una cerveza",   context: "Frase típica al llegar a un izakaya.", category: "restaurante" },
  { id: "nanmeisama",          kana: "なんめいさまですか",       romaji: "nanmeisama desu ka",    meaning: "¿cuántas personas?",             context: "Lo pregunta el personal al llegar al restaurante.", category: "restaurante" },
  { id: "futari-desu",         kana: "ふたりです",               romaji: "futari desu",           meaning: "somos dos",                      context: "Respuesta a なんめいさまですか。", category: "restaurante" },
  { id: "arerugii-arimasu",    kana: "アレルギーがあります",     romaji: "arerugii ga arimasu",   meaning: "tengo alergia",                  context: "Para avisar de una alergia alimentaria.", category: "restaurante" },
  { id: "omochikaeri-de",      kana: "おもちかえりで",           romaji: "omochikaeri de",        meaning: "para llevar",                    context: "Al pedir comida para llevar.", category: "restaurante" },

  // ── Compras ──────────────────────────────────────────────────────────────
  { id: "kore-wa-ikura",       kana: "これはいくらですか",       romaji: "kore wa ikura desu ka", meaning: "¿cuánto cuesta esto?",           context: "Al preguntar el precio de un producto.", category: "compras" },
  { id: "chotto-mite-imasu",   kana: "ちょっとみています",       romaji: "chotto mite imasu",     meaning: "solo estoy mirando",             context: "Cuando el personal pregunta si necesitas ayuda.", category: "compras" },
  { id: "kore-o-kudasai-2",    kana: "これをください",           romaji: "kore o kudasai",        meaning: "esto, por favor (para comprar)", context: "Al decidir comprar un artículo.", category: "compras" },
  { id: "kaado-tsukaemasu-ka", kana: "カードがつかえますか",     romaji: "kaado ga tsukaemasu ka",meaning: "¿aceptan tarjeta?",              context: "Al preguntar el método de pago.", category: "compras" },
  { id: "fukuro-irimasen",     kana: "ふくろはいりません",       romaji: "fukuro wa irimasen",    meaning: "no necesito bolsa",              context: "Para declinar una bolsa en la tienda.", category: "compras" },
  { id: "betsubetsu-de",       kana: "べつべつでおねがいします",romaji: "betsubetsu de onegaishimasu",meaning: "por separado, por favor",   context: "Al pedir empaquetar los productos por separado.", category: "compras" },
  { id: "mou-sukoshi-yasui",   kana: "もうすこしやすいのはありますか", romaji: "mou sukoshi yasui no wa arimasu ka", meaning: "¿hay algo más barato?", context: "Al buscar una opción más económica.", category: "compras" },
  { id: "shichaku-shitemo",    kana: "しちゃくしてもいいですか", romaji: "shichaku shitemo ii desu ka", meaning: "¿puedo probármelo?",       context: "Al pedir probarse ropa en una tienda.", category: "compras" },
  { id: "kore-ni-shimasu",     kana: "これにします",             romaji: "kore ni shimasu",       meaning: "me quedo con esto",              context: "Al decidir qué comprar.", category: "compras" },
  { id: "kekkou-desu",         kana: "けっこうです",             romaji: "kekkou desu",           meaning: "no, gracias / está bien así",    context: "Para declinar una oferta cortésmente.", category: "compras" },
  { id: "reshiito-kudasai",    kana: "レシートをください",       romaji: "reshiito o kudasai",    meaning: "el recibo, por favor",           context: "Al pedir el ticket de compra.", category: "compras" },
  { id: "henpin-dekimasu-ka",  kana: "へんぴんできますか",       romaji: "henpin dekimasu ka",    meaning: "¿puedo devolverlo?",             context: "Al preguntar por la política de devoluciones.", category: "compras" },

  // ── Emergencia ───────────────────────────────────────────────────────────
  { id: "tasukete",            kana: "たすけて",                 romaji: "tasukete",              meaning: "¡ayuda!",                        context: "Grito de auxilio en una emergencia.", category: "emergencia" },
  { id: "kyuukyuusha",         kana: "きゅうきゅうしゃをよんでください", romaji: "kyuukyuusha o yonde kudasai", meaning: "llame una ambulancia, por favor", context: "En caso de emergencia médica.", category: "emergencia" },
  { id: "keisatsu-yonde",      kana: "けいさつをよんでください", romaji: "keisatsu o yonde kudasai", meaning: "llame a la policía, por favor", context: "En caso de robo o incidente.", category: "emergencia" },
  { id: "byouin-wa-doko",      kana: "びょういんはどこですか",   romaji: "byouin wa doko desu ka",meaning: "¿dónde está el hospital?",       context: "Al necesitar atención médica.", category: "emergencia" },
  { id: "guai-ga-warui",       kana: "ぐあいがわるいです",       romaji: "guai ga warui desu",    meaning: "me siento mal",                  context: "Para indicar malestar físico.", category: "emergencia" },
  { id: "michi-ni-mayoi",      kana: "みちにまよいました",       romaji: "michi ni mayoimashita", meaning: "me perdí",                       context: "Cuando no sabes dónde estás.", category: "emergencia" },
  { id: "nihongo-ga-hanasemasen", kana: "にほんごがはなせません",romaji: "nihongo ga hanasemasen",meaning: "no hablo japonés",              context: "Para avisar de la barrera del idioma.", category: "emergencia" },
  { id: "eigo-wakarimasu-ka",  kana: "えいごがわかりますか",     romaji: "eigo ga wakarimasu ka", meaning: "¿habla usted inglés?",           context: "Para preguntar si pueden comunicarse en inglés.", category: "emergencia" },
  { id: "saifu-o-nakushimashita", kana: "さいふをなくしました",  romaji: "saifu o nakushimashita",meaning: "perdí mi cartera",              context: "Al reportar un objeto perdido.", category: "emergencia" },
  { id: "toire-wa-doko",       kana: "トイレはどこですか",       romaji: "toire wa doko desu ka", meaning: "¿dónde está el baño?",           context: "Pregunta esencial en cualquier situación.", category: "emergencia" },
  { id: "kaji-desu",           kana: "かじです",                 romaji: "kaji desu",             meaning: "¡hay un incendio!",              context: "Para alertar de un incendio.", category: "emergencia" },
  { id: "jishin-desu",         kana: "じしんです",               romaji: "jishin desu",           meaning: "¡es un terremoto!",              context: "Para alertar durante un terremoto.", category: "emergencia" },
];
