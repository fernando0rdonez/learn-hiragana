// Módulo Gramática (BACKLOG #6): ordenar frases y partículas huecas. Todo el
// vocabulario de contenido (sustantivos, verbos, adjetivos) usado en las
// frases de ejemplo existe en src/vocabulary.ts (anclaje i+1, METODOLOGIA
// §2.4) — las formas conjugadas (たべます, たかくない...) son la misma
// palabra ya conocida, solo con la flexión que enseña la lección. は・が・
// を・に・で・へ・と・も・の, です y sus formas son elementos gramaticales,
// no vocabulario, así que no requieren entrada propia en vocabulary.ts.

export interface GrammarOrderExercise {
  type: "order";
  tokens: string[];       // orden correcto; la UI los baraja para el usuario
  translation: string;    // significado en español, mostrado como pista
}

export interface GrammarParticleExercise {
  type: "particle";
  sentence: string;       // frase con un hueco marcado por "＿"
  answer: string;         // partícula correcta
  options: string[];      // incluye `answer`
  translation: string;
}

export type GrammarExercise = GrammarOrderExercise | GrammarParticleExercise;

export interface GrammarLesson {
  id: string;
  title: string;
  explanation: string;   // 2-4 líneas, en español
  pattern: string;
  section: string;       // agrupación visual en GrammarSetupView (no forma parte del progreso)
  exercises: GrammarExercise[];
}

export const GRAMMAR_LESSONS: GrammarLesson[] = [
  // ── Estructura básica ──────────────────────────────────────────────────────
  {
    id: "estructura-desu",
    title: "La oración básica: X は Y です",
    explanation: "「X は Y です」es la estructura más básica del japonés: dice que X es Y. は marca el tema de la oración (se escribe con la letra ha, pero se lee \"wa\") y です es la cópula, como \"ser/estar\" en presente.",
    pattern: "X は Y です",
    section: "Estructura básica",
    exercises: [
      { type: "order", tokens: ["わたし", "は", "がくせい", "です"], translation: "Yo soy estudiante." },
      { type: "order", tokens: ["あなた", "は", "せんせい", "です"], translation: "Tú eres profesor/a." },
      { type: "order", tokens: ["かれ", "は", "いしゃ", "です"], translation: "Él es médico." },
      { type: "order", tokens: ["かのじょ", "は", "かいしゃいん", "です"], translation: "Ella es empleada de empresa." },
      { type: "particle", sentence: "わたし＿がくせいです", answer: "は", options: ["は", "が", "を", "に"], translation: "Yo soy estudiante." },
      { type: "particle", sentence: "あなた＿せんせいです", answer: "は", options: ["は", "を", "で", "と"], translation: "Tú eres profesor/a." },
      { type: "particle", sentence: "かれ＿いしゃです", answer: "は", options: ["は", "の", "へ", "も"], translation: "Él es médico." },
      { type: "particle", sentence: "かのじょ＿かいしゃいんです", answer: "は", options: ["は", "が", "に", "と"], translation: "Ella es empleada de empresa." },
    ],
  },
  {
    id: "negacion-janai",
    title: "Negar con です: 〜じゃないです",
    explanation: "Para negar \"X は Y です\" se cambia です por じゃないです (informal) o ではありません (formal). Ambas significan \"X no es Y\"; じゃないです es la más usada al hablar.",
    pattern: "X は Y じゃないです",
    section: "Estructura básica",
    exercises: [
      { type: "order", tokens: ["わたし", "は", "せんせい", "じゃない", "です"], translation: "Yo no soy profesor/a." },
      { type: "order", tokens: ["かれ", "は", "がくせい", "じゃない", "です"], translation: "Él no es estudiante." },
      { type: "order", tokens: ["あなた", "は", "いしゃ", "じゃない", "です"], translation: "Tú no eres médico." },
      { type: "order", tokens: ["かのじょ", "は", "がいこくじん", "じゃない", "です"], translation: "Ella no es extranjera." },
      { type: "particle", sentence: "わたし＿せんせいじゃないです", answer: "は", options: ["は", "が", "を", "へ"], translation: "Yo no soy profesor/a." },
      { type: "particle", sentence: "かれ＿がくせいじゃないです", answer: "は", options: ["は", "も", "の", "で"], translation: "Él no es estudiante." },
      { type: "particle", sentence: "あなた＿いしゃじゃないです", answer: "は", options: ["は", "が", "と", "に"], translation: "Tú no eres médico." },
      { type: "particle", sentence: "かのじょ＿がいこくじんじゃないです", answer: "は", options: ["は", "を", "で", "も"], translation: "Ella no es extranjera." },
    ],
  },
  {
    id: "pregunta-ka",
    title: "Preguntas con か",
    explanation: "Para convertir una afirmación en pregunta se añade か al final de です/ます, sin cambiar el orden de la frase. あなたはがくせいですか = \"¿Eres estudiante?\".",
    pattern: "X は Y ですか",
    section: "Estructura básica",
    exercises: [
      { type: "order", tokens: ["あなた", "は", "がくせい", "です", "か"], translation: "¿Eres estudiante?" },
      { type: "order", tokens: ["かれ", "は", "せんせい", "です", "か"], translation: "¿Él es profesor?" },
      { type: "order", tokens: ["これ", "は", "ほん", "です", "か"], translation: "¿Esto es un libro?" },
      { type: "order", tokens: ["それ", "は", "かばん", "です", "か"], translation: "¿Eso es un bolso?" },
      { type: "particle", sentence: "あなた＿がくせいですか", answer: "は", options: ["は", "が", "を", "に"], translation: "¿Eres estudiante?" },
      { type: "particle", sentence: "かれ＿せんせいですか", answer: "は", options: ["は", "の", "で", "と"], translation: "¿Él es profesor?" },
      { type: "particle", sentence: "これ＿ほんですか", answer: "は", options: ["は", "が", "へ", "も"], translation: "¿Esto es un libro?" },
      { type: "particle", sentence: "それ＿かばんですか", answer: "は", options: ["は", "を", "に", "が"], translation: "¿Eso es un bolso?" },
    ],
  },

  // ── Partículas ─────────────────────────────────────────────────────────────
  {
    id: "particula-ga",
    title: "Partícula が: sujeto y gustos",
    explanation: "が marca el sujeto gramatical, sobre todo con verbos de existencia (あります/います) y con expresiones de gusto como すきです/きらいです. A diferencia de は, が no contrasta con otros temas: solo señala qué provoca la sensación.",
    pattern: "X は Y が すきです",
    section: "Partículas",
    exercises: [
      { type: "order", tokens: ["わたし", "は", "コーヒー", "が", "すき", "です"], translation: "Me gusta el café." },
      { type: "order", tokens: ["わたし", "は", "ねこ", "が", "すき", "です"], translation: "Me gustan los gatos." },
      { type: "order", tokens: ["かのじょ", "は", "えいが", "が", "すき", "です"], translation: "A ella le gustan las películas." },
      { type: "order", tokens: ["わたし", "は", "おんがく", "が", "だいすき", "です"], translation: "Me encanta la música." },
      { type: "particle", sentence: "わたしはコーヒー＿すきです", answer: "が", options: ["が", "は", "を", "に"], translation: "Me gusta el café." },
      { type: "particle", sentence: "わたしはねこ＿すきです", answer: "が", options: ["が", "を", "で", "も"], translation: "Me gustan los gatos." },
      { type: "particle", sentence: "かのじょはえいが＿すきです", answer: "が", options: ["が", "の", "へ", "と"], translation: "A ella le gustan las películas." },
      { type: "particle", sentence: "わたしはおんがく＿だいすきです", answer: "が", options: ["が", "は", "に", "を"], translation: "Me encanta la música." },
    ],
  },
  {
    id: "particula-wo",
    title: "Partícula を: el objeto directo",
    explanation: "を marca el objeto directo de un verbo de acción: la cosa que recibe la acción. Se escribe con el carácter を pero se pronuncia igual que お. Ejemplo: パンをたべます = \"como pan\".",
    pattern: "X を Verbo",
    section: "Partículas",
    exercises: [
      { type: "order", tokens: ["わたし", "は", "パン", "を", "たべます"], translation: "Yo como pan." },
      { type: "order", tokens: ["わたし", "は", "みず", "を", "のみます"], translation: "Yo bebo agua." },
      { type: "order", tokens: ["かれ", "は", "ほん", "を", "よみます"], translation: "Él lee un libro." },
      { type: "order", tokens: ["がくせい", "は", "にほんご", "を", "べんきょうします"], translation: "El estudiante estudia japonés." },
      { type: "particle", sentence: "わたしはパン＿たべます", answer: "を", options: ["を", "が", "に", "へ"], translation: "Yo como pan." },
      { type: "particle", sentence: "わたしはみず＿のみます", answer: "を", options: ["を", "は", "で", "と"], translation: "Yo bebo agua." },
      { type: "particle", sentence: "かれはほん＿よみます", answer: "を", options: ["を", "の", "も", "が"], translation: "Él lee un libro." },
      { type: "particle", sentence: "がくせいはにほんご＿べんきょうします", answer: "を", options: ["を", "に", "へ", "が"], translation: "El estudiante estudia japonés." },
    ],
  },
  {
    id: "particula-ni",
    title: "Partícula に: tiempo y destino",
    explanation: "に marca un punto en el tiempo o el destino de un movimiento: がっこうにいきます = \"voy a la escuela\". Es una de las partículas con más usos del japonés.",
    pattern: "X に Verbo",
    section: "Partículas",
    exercises: [
      { type: "order", tokens: ["わたし", "は", "がっこう", "に", "いきます"], translation: "Voy a la escuela." },
      { type: "order", tokens: ["かれ", "は", "かいしゃ", "に", "いきます"], translation: "Él va a la empresa." },
      { type: "order", tokens: ["せんせい", "は", "きょうしつ", "に", "はいります"], translation: "El profesor entra al aula." },
      { type: "order", tokens: ["わたし", "は", "うち", "に", "かえります"], translation: "Yo regreso a casa." },
      { type: "particle", sentence: "わたしはがっこう＿いきます", answer: "に", options: ["に", "で", "を", "と"], translation: "Voy a la escuela." },
      { type: "particle", sentence: "かれはかいしゃ＿いきます", answer: "に", options: ["に", "が", "は", "と"], translation: "Él va a la empresa." },
      { type: "particle", sentence: "せんせいはきょうしつ＿はいります", answer: "に", options: ["に", "を", "の", "も"], translation: "El profesor entra al aula." },
      { type: "particle", sentence: "わたしはうち＿かえります", answer: "に", options: ["に", "で", "が", "と"], translation: "Yo regreso a casa." },
    ],
  },
  {
    id: "particula-de",
    title: "Partícula で: lugar de acción y medio",
    explanation: "で marca el lugar donde ocurre una acción (としょかんでべんきょうします = \"estudio en la biblioteca\") o el medio con el que se hace algo. No se usa para el destino, sino para dónde o cómo pasa la acción.",
    pattern: "X で Verbo",
    section: "Partículas",
    exercises: [
      { type: "order", tokens: ["わたし", "は", "としょかん", "で", "べんきょうします"], translation: "Estudio en la biblioteca." },
      { type: "order", tokens: ["がくせい", "は", "きょうしつ", "で", "はなします"], translation: "El estudiante habla en el aula." },
      { type: "order", tokens: ["かれ", "は", "こうえん", "で", "あそびます"], translation: "Él juega en el parque." },
      { type: "order", tokens: ["わたしたち", "は", "レストラン", "で", "たべます"], translation: "Nosotros comemos en el restaurante." },
      { type: "particle", sentence: "わたしはとしょかん＿べんきょうします", answer: "で", options: ["で", "に", "を", "へ"], translation: "Estudio en la biblioteca." },
      { type: "particle", sentence: "がくせいはきょうしつ＿はなします", answer: "で", options: ["で", "が", "の", "と"], translation: "El estudiante habla en el aula." },
      { type: "particle", sentence: "かれはこうえん＿あそびます", answer: "で", options: ["で", "に", "は", "も"], translation: "Él juega en el parque." },
      { type: "particle", sentence: "わたしたちはレストラン＿たべます", answer: "で", options: ["で", "を", "へ", "に"], translation: "Nosotros comemos en el restaurante." },
    ],
  },
  {
    id: "particula-he",
    title: "Partícula へ: dirección",
    explanation: "へ (se pronuncia \"e\", no \"he\") marca la dirección hacia la que alguien se mueve. Con verbos como いく/くる/かえる, へ y に son intercambiables la mayoría de las veces.",
    pattern: "X へ Verbo",
    section: "Partículas",
    exercises: [
      { type: "order", tokens: ["わたし", "は", "がっこう", "へ", "いきます"], translation: "Voy hacia la escuela." },
      { type: "order", tokens: ["かのじょ", "は", "えき", "へ", "あるきます"], translation: "Ella camina hacia la estación." },
      { type: "order", tokens: ["わたしたち", "は", "やま", "へ", "いきます"], translation: "Nosotros vamos hacia la montaña." },
      { type: "order", tokens: ["かれ", "は", "うち", "へ", "かえります"], translation: "Él regresa hacia casa." },
      { type: "particle", sentence: "わたしはがっこう＿いきます", answer: "へ", options: ["へ", "を", "が", "の"], translation: "Voy hacia la escuela." },
      { type: "particle", sentence: "かのじょはえき＿あるきます", answer: "へ", options: ["へ", "で", "と", "は"], translation: "Ella camina hacia la estación." },
      { type: "particle", sentence: "わたしたちはやま＿いきます", answer: "へ", options: ["へ", "と", "を", "の"], translation: "Nosotros vamos hacia la montaña." },
      { type: "particle", sentence: "かれはうち＿かえります", answer: "へ", options: ["へ", "が", "で", "も"], translation: "Él regresa hacia casa." },
    ],
  },
  {
    id: "particula-to",
    title: "Partícula と: compañía y enumeración",
    explanation: "と une sustantivos como \"y\" (ほんとざっし = \"el libro y la revista\") o indica con quién se hace algo: せんせいとはなします = \"hablo con el profesor\".",
    pattern: "X と Y",
    section: "Partículas",
    exercises: [
      { type: "order", tokens: ["わたし", "は", "せんせい", "と", "はなします"], translation: "Hablo con el profesor." },
      { type: "order", tokens: ["かれ", "は", "がくせい", "と", "あそびます"], translation: "Él juega con el estudiante." },
      { type: "order", tokens: ["ほん", "と", "ざっし", "が", "あります"], translation: "Hay un libro y una revista." },
      { type: "order", tokens: ["いぬ", "と", "ねこ", "が", "すき", "です"], translation: "Me gustan los perros y los gatos." },
      { type: "particle", sentence: "わたしはせんせい＿はなします", answer: "と", options: ["と", "は", "を", "に"], translation: "Hablo con el profesor." },
      { type: "particle", sentence: "かれはがくせい＿あそびます", answer: "と", options: ["と", "が", "で", "も"], translation: "Él juega con el estudiante." },
      { type: "particle", sentence: "ほん＿ざっしがあります", answer: "と", options: ["と", "の", "へ", "を"], translation: "Hay un libro y una revista." },
      { type: "particle", sentence: "いぬ＿ねこがすきです", answer: "と", options: ["と", "は", "に", "が"], translation: "Me gustan los perros y los gatos." },
    ],
  },
  {
    id: "particula-mo",
    title: "Partícula も: también",
    explanation: "も reemplaza a は o が cuando queremos decir \"también\": わたしはがくせいです。かれもがくせいです = \"Yo soy estudiante. Él también es estudiante.\"",
    pattern: "X も Y です",
    section: "Partículas",
    exercises: [
      { type: "order", tokens: ["かれ", "も", "がくせい", "です"], translation: "Él también es estudiante." },
      { type: "order", tokens: ["かのじょ", "も", "にほんご", "を", "べんきょうします"], translation: "Ella también estudia japonés." },
      { type: "order", tokens: ["わたし", "も", "コーヒー", "が", "すき", "です"], translation: "A mí también me gusta el café." },
      { type: "order", tokens: ["あなた", "も", "がっこう", "に", "いきます"], translation: "Tú también vas a la escuela." },
      { type: "particle", sentence: "かれ＿がくせいです", answer: "も", options: ["も", "は", "が", "を"], translation: "Él también es estudiante." },
      { type: "particle", sentence: "かのじょ＿にほんごをべんきょうします", answer: "も", options: ["も", "が", "に", "で"], translation: "Ella también estudia japonés." },
      { type: "particle", sentence: "わたし＿コーヒーがすきです", answer: "も", options: ["も", "は", "と", "の"], translation: "A mí también me gusta el café." },
      { type: "particle", sentence: "あなた＿がっこうにいきます", answer: "も", options: ["も", "へ", "を", "が"], translation: "Tú también vas a la escuela." },
    ],
  },
  {
    id: "particula-no",
    title: "Partícula の: posesión y modificación",
    explanation: "の une dos sustantivos, normalmente para indicar posesión (\"de\"): わたしのほん = \"mi libro\". También puede unir un sustantivo modificador con otro: にほんごのせんせい = \"profesor de japonés\".",
    pattern: "X の Y",
    section: "Partículas",
    exercises: [
      { type: "order", tokens: ["これ", "は", "わたし", "の", "ほん", "です"], translation: "Esto es mi libro." },
      { type: "order", tokens: ["それ", "は", "かれ", "の", "かばん", "です"], translation: "Eso es su bolso (de él)." },
      { type: "order", tokens: ["かのじょ", "は", "にほんご", "の", "せんせい", "です"], translation: "Ella es profesora de japonés." },
      { type: "order", tokens: ["あれ", "は", "がっこう", "の", "としょかん", "です"], translation: "Aquello es la biblioteca de la escuela." },
      { type: "particle", sentence: "これはわたし＿ほんです", answer: "の", options: ["の", "は", "が", "に"], translation: "Esto es mi libro." },
      { type: "particle", sentence: "それはかれ＿かばんです", answer: "の", options: ["の", "を", "と", "も"], translation: "Eso es su bolso (de él)." },
      { type: "particle", sentence: "かのじょはにほんご＿せんせいです", answer: "の", options: ["の", "で", "へ", "が"], translation: "Ella es profesora de japonés." },
      { type: "particle", sentence: "あれはがっこう＿としょかんです", answer: "の", options: ["の", "に", "と", "は"], translation: "Aquello es la biblioteca de la escuela." },
    ],
  },

  // ── Verbos ます ────────────────────────────────────────────────────────────
  {
    id: "verbos-masu",
    title: "Verbos en ます: presente afirmativo",
    explanation: "La forma ます es la forma educada de los verbos en presente/futuro afirmativo, usada en la mayoría de conversaciones formales y con desconocidos. Ejemplo: たべる → たべます.",
    pattern: "Verbo-ます",
    section: "Verbos ます",
    exercises: [
      { type: "order", tokens: ["わたし", "は", "まいにち", "にほんご", "を", "べんきょうします"], translation: "Estudio japonés todos los días." },
      { type: "order", tokens: ["わたし", "は", "まいにち", "みず", "を", "のみます"], translation: "Bebo agua todos los días." },
      { type: "order", tokens: ["かれ", "は", "ほん", "を", "かいます"], translation: "Él compra un libro." },
      { type: "order", tokens: ["わたしたち", "は", "おんがく", "を", "ききます"], translation: "Nosotros escuchamos música." },
      { type: "particle", sentence: "わたしはまいにちにほんご＿べんきょうします", answer: "を", options: ["を", "が", "に", "へ"], translation: "Estudio japonés todos los días." },
      { type: "particle", sentence: "わたしはまいにちみず＿のみます", answer: "を", options: ["を", "は", "で", "と"], translation: "Bebo agua todos los días." },
      { type: "particle", sentence: "かれはほん＿かいます", answer: "を", options: ["を", "の", "も", "が"], translation: "Él compra un libro." },
      { type: "particle", sentence: "わたしたちはおんがく＿ききます", answer: "を", options: ["を", "に", "へ", "が"], translation: "Nosotros escuchamos música." },
    ],
  },
  {
    id: "verbos-masen",
    title: "Verbos en ません: presente negativo",
    explanation: "Para negar un verbo en ます, se cambia la terminación por ません. たべます → たべません (\"no como\").",
    pattern: "Verbo-ません",
    section: "Verbos ます",
    exercises: [
      { type: "order", tokens: ["わたし", "は", "にく", "を", "たべません"], translation: "Yo no como carne." },
      { type: "order", tokens: ["かれ", "は", "コーヒー", "を", "のみません"], translation: "Él no bebe café." },
      { type: "order", tokens: ["がくせい", "は", "がっこう", "に", "いきません"], translation: "El estudiante no va a la escuela." },
      { type: "order", tokens: ["かのじょ", "は", "えいが", "を", "みません"], translation: "Ella no ve la película." },
      { type: "particle", sentence: "わたしはにく＿たべません", answer: "を", options: ["を", "は", "が", "に"], translation: "Yo no como carne." },
      { type: "particle", sentence: "かれはコーヒー＿のみません", answer: "を", options: ["を", "も", "で", "と"], translation: "Él no bebe café." },
      { type: "particle", sentence: "がくせいはがっこう＿いきません", answer: "に", options: ["に", "を", "が", "の"], translation: "El estudiante no va a la escuela." },
      { type: "particle", sentence: "かのじょはえいが＿みません", answer: "を", options: ["を", "へ", "が", "も"], translation: "Ella no ve la película." },
    ],
  },
  {
    id: "verbos-mashita",
    title: "Verbos en ました: pasado afirmativo",
    explanation: "Para hablar de acciones ya terminadas, ます se cambia por ました. たべます → たべました (\"comí\").",
    pattern: "Verbo-ました",
    section: "Verbos ます",
    exercises: [
      { type: "order", tokens: ["わたし", "は", "きのう", "パン", "を", "たべました"], translation: "Ayer comí pan." },
      { type: "order", tokens: ["かれ", "は", "きのう", "がっこう", "に", "いきました"], translation: "Ayer él fue a la escuela." },
      { type: "order", tokens: ["わたしたち", "は", "こうえん", "で", "あそびました"], translation: "Nosotros jugamos en el parque." },
      { type: "order", tokens: ["かのじょ", "は", "ほん", "を", "かいました"], translation: "Ella compró un libro." },
      { type: "particle", sentence: "わたしはきのうパン＿たべました", answer: "を", options: ["を", "は", "に", "で"], translation: "Ayer comí pan." },
      { type: "particle", sentence: "かれはきのうがっこう＿いきました", answer: "に", options: ["に", "を", "が", "も"], translation: "Ayer él fue a la escuela." },
      { type: "particle", sentence: "わたしたちはこうえん＿あそびました", answer: "で", options: ["で", "に", "へ", "の"], translation: "Nosotros jugamos en el parque." },
      { type: "particle", sentence: "かのじょはほん＿かいました", answer: "を", options: ["を", "と", "が", "へ"], translation: "Ella compró un libro." },
    ],
  },
  {
    id: "verbos-masendeshita",
    title: "Verbos en ませんでした: pasado negativo",
    explanation: "Para negar una acción pasada, se usa ませんでした. のみます → のみませんでした (\"no bebí\").",
    pattern: "Verbo-ませんでした",
    section: "Verbos ます",
    exercises: [
      { type: "order", tokens: ["わたし", "は", "きのう", "みず", "を", "のみませんでした"], translation: "Ayer no bebí agua." },
      { type: "order", tokens: ["かれ", "は", "きのう", "がっこう", "に", "いきませんでした"], translation: "Ayer él no fue a la escuela." },
      { type: "order", tokens: ["がくせい", "は", "きのう", "べんきょうしませんでした"], translation: "Ayer el estudiante no estudió." },
      { type: "order", tokens: ["かのじょ", "は", "えいが", "を", "みませんでした"], translation: "Ella no vio la película." },
      { type: "particle", sentence: "わたしはきのうみず＿のみませんでした", answer: "を", options: ["を", "は", "が", "に"], translation: "Ayer no bebí agua." },
      { type: "particle", sentence: "かれはきのうがっこう＿いきませんでした", answer: "に", options: ["に", "を", "が", "の"], translation: "Ayer él no fue a la escuela." },
      { type: "particle", sentence: "わたしたちはこうえん＿あそびませんでした", answer: "で", options: ["で", "に", "の", "も"], translation: "Nosotros no jugamos en el parque." },
      { type: "particle", sentence: "かのじょはえいが＿みませんでした", answer: "を", options: ["を", "が", "と", "へ"], translation: "Ella no vio la película." },
    ],
  },

  // ── Adjetivos ──────────────────────────────────────────────────────────────
  {
    id: "adjetivos-i",
    title: "Adjetivos い: afirmativo y negativo",
    explanation: "Los adjetivos terminados en い (たかい, やすい, おおきい...) van directamente antes de です. Para negar, se quita い y se añade くないです: たかい → たかくないです.",
    pattern: "X は adj-い です / adj-くないです",
    section: "Adjetivos",
    exercises: [
      { type: "order", tokens: ["これ", "は", "たかい", "です"], translation: "Esto es caro." },
      { type: "order", tokens: ["それ", "は", "たかくない", "です"], translation: "Eso no es caro." },
      { type: "order", tokens: ["わたし", "の", "うち", "は", "ちいさい", "です"], translation: "Mi casa es pequeña." },
      { type: "order", tokens: ["きょう", "は", "あたたかい", "です"], translation: "Hoy está templado." },
      { type: "particle", sentence: "これ＿たかいです", answer: "は", options: ["は", "が", "の", "を"], translation: "Esto es caro." },
      { type: "particle", sentence: "それ＿たかくないです", answer: "は", options: ["は", "も", "で", "と"], translation: "Eso no es caro." },
      { type: "particle", sentence: "わたし＿うちはちいさいです", answer: "の", options: ["の", "は", "が", "に"], translation: "Mi casa es pequeña." },
      { type: "particle", sentence: "きょう＿あたたかいです", answer: "は", options: ["は", "を", "へ", "が"], translation: "Hoy está templado." },
    ],
  },
  {
    id: "adjetivos-na",
    title: "Adjetivos な: afirmativo y negativo",
    explanation: "Los adjetivos な (げんき, しずか, にぎやか, すき...) necesitan な antes de un sustantivo, pero antes de です van solos: しずかです. Para negar: しずかじゃないです.",
    pattern: "X は adj-な です / adj-じゃないです",
    section: "Adjetivos",
    exercises: [
      { type: "order", tokens: ["としょかん", "は", "しずか", "です"], translation: "La biblioteca es tranquila." },
      { type: "order", tokens: ["こうえん", "は", "にぎやか", "です"], translation: "El parque es bullicioso." },
      { type: "order", tokens: ["としょかん", "は", "にぎやか", "じゃない", "です"], translation: "La biblioteca no es bulliciosa." },
      { type: "order", tokens: ["かれ", "は", "げんき", "です"], translation: "Él está lleno de energía." },
      { type: "particle", sentence: "としょかん＿しずかです", answer: "は", options: ["は", "が", "の", "を"], translation: "La biblioteca es tranquila." },
      { type: "particle", sentence: "こうえん＿にぎやかです", answer: "は", options: ["は", "も", "で", "と"], translation: "El parque es bullicioso." },
      { type: "particle", sentence: "としょかん＿にぎやかじゃないです", answer: "は", options: ["は", "を", "に", "が"], translation: "La biblioteca no es bulliciosa." },
      { type: "particle", sentence: "かれ＿げんきです", answer: "は", options: ["は", "へ", "の", "も"], translation: "Él está lleno de energía." },
    ],
  },

  // ── Otros ──────────────────────────────────────────────────────────────────
  {
    id: "demostrativos-kosoare",
    title: "Demostrativos これ・それ・あれ",
    explanation: "これ (esto, cerca de mí), それ (eso, cerca de ti) y あれ (aquello, lejos de ambos) señalan objetos según la distancia respecto a quien habla y quien escucha.",
    pattern: "これ/それ/あれ は Y です",
    section: "Otros",
    exercises: [
      { type: "order", tokens: ["これ", "は", "ほん", "です"], translation: "Esto es un libro." },
      { type: "order", tokens: ["それ", "は", "かばん", "です", "か"], translation: "¿Eso es un bolso?" },
      { type: "order", tokens: ["あれ", "は", "がっこう", "です"], translation: "Aquello es una escuela." },
      { type: "order", tokens: ["これ", "は", "わたし", "の", "でんわ", "です"], translation: "Esto es mi teléfono." },
      { type: "particle", sentence: "これ＿ほんです", answer: "は", options: ["は", "が", "の", "を"], translation: "Esto es un libro." },
      { type: "particle", sentence: "それ＿かばんですか", answer: "は", options: ["は", "も", "へ", "と"], translation: "¿Eso es un bolso?" },
      { type: "particle", sentence: "あれ＿がっこうです", answer: "は", options: ["は", "を", "で", "が"], translation: "Aquello es una escuela." },
      { type: "particle", sentence: "これ＿わたしのでんわです", answer: "は", options: ["は", "の", "に", "も"], translation: "Esto es mi teléfono." },
    ],
  },
  {
    id: "existencia-arimasu-imasu",
    title: "Existencia: あります y います",
    explanation: "Para decir que algo \"hay/existe\" se usa あります con cosas y います con personas o animales. El lugar donde está se marca con に: つくえにほんがあります = \"hay un libro en el escritorio\".",
    pattern: "(lugar) に X が あります/います",
    section: "Otros",
    exercises: [
      { type: "order", tokens: ["つくえ", "に", "ほん", "が", "あります"], translation: "Hay un libro en el escritorio." },
      { type: "order", tokens: ["こうえん", "に", "いぬ", "が", "います"], translation: "Hay un perro en el parque." },
      { type: "order", tokens: ["がっこう", "に", "がくせい", "が", "います"], translation: "Hay estudiantes en la escuela." },
      { type: "order", tokens: ["いえ", "に", "ねこ", "が", "います"], translation: "Hay un gato en la casa." },
      { type: "particle", sentence: "つくえ＿ほんがあります", answer: "に", options: ["に", "は", "を", "へ"], translation: "Hay un libro en el escritorio." },
      { type: "particle", sentence: "こうえんにいぬ＿います", answer: "が", options: ["が", "は", "を", "の"], translation: "Hay un perro en el parque." },
      { type: "particle", sentence: "がっこうにがくせい＿います", answer: "が", options: ["が", "で", "と", "も"], translation: "Hay estudiantes en la escuela." },
      { type: "particle", sentence: "いえ＿ねこがいます", answer: "に", options: ["に", "へ", "を", "が"], translation: "Hay un gato en la casa." },
    ],
  },
  {
    id: "gustos-suki-hoshii-tai",
    title: "Gustos y deseos: すき・ほしい・たいです",
    explanation: "すきです (\"gusta\") y ほしいです (\"se desea algo\") se usan con が: コーヒーがすきです, みずがほしいです. Para decir que se quiere HACER algo, se usa la raíz ます del verbo + たいです: たべたいです (\"quiero comer\").",
    pattern: "X が すき/ほしい です · Verbo-たいです",
    section: "Otros",
    exercises: [
      { type: "order", tokens: ["わたし", "は", "くだもの", "が", "すき", "です"], translation: "Me gusta la fruta." },
      { type: "order", tokens: ["わたし", "は", "みず", "が", "ほしい", "です"], translation: "Quiero agua." },
      { type: "order", tokens: ["わたし", "は", "パン", "を", "たべたい", "です"], translation: "Quiero comer pan." },
      { type: "order", tokens: ["かのじょ", "は", "がっこう", "に", "いきたい", "です"], translation: "Ella quiere ir a la escuela." },
      { type: "particle", sentence: "わたしはくだもの＿すきです", answer: "が", options: ["が", "は", "を", "に"], translation: "Me gusta la fruta." },
      { type: "particle", sentence: "わたしはみず＿ほしいです", answer: "が", options: ["が", "を", "で", "と"], translation: "Quiero agua." },
      { type: "particle", sentence: "わたしはパン＿たべたいです", answer: "を", options: ["を", "が", "に", "へ"], translation: "Quiero comer pan." },
      { type: "particle", sentence: "かのじょはがっこう＿いきたいです", answer: "に", options: ["に", "を", "が", "の"], translation: "Ella quiere ir a la escuela." },
    ],
  },
];
