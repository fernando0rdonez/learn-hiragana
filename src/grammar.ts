// Módulo Gramática (BACKLOG #6, ampliado en docs/GRAMATICA_PLAN.md).
//
// Las lecciones siguen el orden de los libros del curso (Japonés Básico I y II);
// las que no están en los libros van al final como "Extra". Las oraciones son
// PROPIAS (no copiadas del PDF): el libro solo define los temas y su orden.
//
// Cada oración se escribe una sola vez, con sus fichas separadas por espacios,
// y `buildLesson` genera a partir de ella los ejercicios:
//   - "order":    ordenar las fichas.
//   - "particle": completar un hueco (partícula o forma gramatical).
//
// Vocabulario (anclaje i+1, METODOLOGIA §2.4): las palabras de contenido existen
// en src/vocabulary.ts (las formas conjugadas —たべます, たかくない…— son la misma
// palabra con la flexión que enseña la lección). Se permiten además nombres
// propios de personas (たなかさん, マリアさん…) y de lugares (にほん, とうきょう…),
// y las horas/fechas del módulo Fechas y Horas (しちじ, げつようび…).

// ── Tipos de ejercicio (los consumen el juego, listening y el examen) ─────────

export interface GrammarOrderExercise {
  type: "order";
  tokens: string[];       // orden correcto; la UI los baraja para el usuario
  translation: string;    // significado en español, mostrado como pista
  accept?: string[][];    // otros órdenes igual de válidos (ej. きのう わたしは… = わたしは きのう…)
  sid?: number;           // índice de la oración de origen dentro de la lección
}

export interface GrammarParticleExercise {
  type: "particle";
  sentence: string;       // frase con un hueco marcado por "＿"
  parts?: string[];       // la misma frase en fichas (una de ellas es "＿"), para mostrarla separada
  answer: string;         // respuesta correcta
  options: string[];      // incluye `answer`
  translation: string;
  kind?: "particle" | "form"; // partícula (は, を…) o forma gramatical (たべません, この…)
  alt?: string[];         // otras respuestas también válidas (nunca se ofrecen como opción)
  sid?: number;
}

export type GrammarExercise = GrammarOrderExercise | GrammarParticleExercise;

/**
 * Pregunta → respuesta (Fase 3): se muestra la pregunta y hay que completar la
 * respuesta con la partícula (o forma) que corresponde a la palabra de pregunta:
 * どこで…か → としょかん「で」. Mismos campos que el hueco, más la pregunta.
 */
export interface GrammarQAExercise extends Omit<GrammarParticleExercise, "type"> {
  type: "qa";
  question: string[];     // fichas de la pregunta
  parts: string[];
}

export interface GrammarQAPair {
  q: string;              // pregunta, fichas separadas por espacios
  a: string;              // respuesta, fichas separadas por espacios
  es: string;             // «—pregunta —respuesta» en español
  blank?: string;         // ficha a vaciar en la respuesta (por defecto: la partícula que sigue a la palabra de pregunta)
  alt?: string[];
}

export interface GrammarSentence {
  jp: string;             // fichas separadas por espacios
  es: string;             // traducción (con contexto entre paréntesis si hace falta)
  blank?: string;         // ficha a vaciar en el ejercicio de hueco (por defecto: la 1.ª de `focus`)
  options?: string[];     // opciones explícitas del hueco (incluyen la respuesta)
  alt?: string[];         // respuestas alternativas válidas para el hueco
  orders?: string[];      // otros órdenes válidos de las mismas fichas (ej. "ねこ と いぬ が います")
}

export type GrammarBook = "Japonés Básico I" | "Japonés Básico II" | "Extra";

export interface GrammarLesson {
  id: string;
  title: string;
  explanation: string;    // 2-5 líneas, en español
  pattern: string;
  section: GrammarBook;   // libro al que pertenece (agrupación en GrammarSetupView)
  tip?: string;           // truco para recordar
  train?: boolean;        // mostrar el tren de partículas en la explicación
  focus: string[];        // fichas que se practican en el ejercicio de hueco
  pool?: string[];        // partículas distractoras, por prioridad (la 1.ª siempre aparece)
  adjective?: "i";        // activa el conjunto de formas de adjetivo い
  sentences: GrammarSentence[];
  qa?: GrammarQAPair[];   // pares pregunta → respuesta (Fase 3)
  exercises: GrammarExercise[];
  qaExercises: GrammarQAExercise[];
}

type LessonDef = Omit<GrammarLesson, "exercises" | "qaExercises">;

// ── Conjuntos de opciones automáticos ────────────────────────────────────────

export const PARTICLES = ["は", "が", "を", "に", "へ", "で", "と", "も", "の", "か", "から", "まで"];

const FIXED_SETS: string[][] = [
  ["これ", "それ", "あれ", "どれ"],
  ["この", "その", "あの", "どの"],
  ["なん", "だれ", "どこ", "いつ"],
  ["あります", "います", "ありません", "いません"],
  ["ありました", "いました", "ありませんでした", "いませんでした"],
  ["うえ", "した", "なか", "まえ", "うしろ"],
  ["です", "でした", "ではありません", "ではありませんでした"],
  ["です", "でした", "じゃないです", "じゃなかったです"],
];

function rotate<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return arr;
  const k = n % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

/** Conjugaciones ます del mismo verbo: たべません → [たべます, たべません, たべました, たべませんでした]. */
function masuSet(word: string): string[] | null {
  for (const suf of ["ませんでした", "ません", "ました", "ます"]) {
    if (word.endsWith(suf) && word.length > suf.length) {
      const stem = word.slice(0, -suf.length);
      return [stem + "ます", stem + "ません", stem + "ました", stem + "ませんでした"];
    }
  }
  return null;
}

/** Querer hacer: たべたい → [たべたい, たべます, たべました, たべません]. */
function taiSet(word: string): string[] | null {
  if (!word.endsWith("たい") || word.length <= 2) return null;
  const stem = word.slice(0, -2);
  return [stem + "たい", stem + "ます", stem + "ました", stem + "ません"];
}

/** Adjetivo い: さむくない → [さむい, さむくない, さむかった, さむくなかった]. */
function iAdjSet(word: string): string[] | null {
  for (const suf of ["くなかった", "かった", "くない", "い"]) {
    if (word.endsWith(suf) && word.length > suf.length) {
      const stem = word.slice(0, -suf.length);
      return [stem + "い", stem + "くない", stem + "かった", stem + "くなかった"];
    }
  }
  return null;
}

function formSetFor(answer: string, lesson: LessonDef): string[] | null {
  // Cópula: です está en el conjunto formal y en el coloquial; las lecciones con
  // じゃない usan el coloquial (adjetivos な), el resto el formal.
  const casualFirst = lesson.id === "adjetivos-na";
  const sets = casualFirst ? [...FIXED_SETS].reverse() : FIXED_SETS;
  for (const set of sets) if (set.includes(answer)) return set;
  if (lesson.adjective === "i") return iAdjSet(answer);
  return masuSet(answer) ?? taiSet(answer);
}

function pickOptions(answer: string, set: string[], exclude: string[], seed: number): string[] {
  const rest = set.filter((o) => o !== answer && !exclude.includes(o));
  return [answer, ...rotate(rest, seed).slice(0, 3)];
}

function optionsFor(answer: string, s: GrammarSentence, lesson: LessonDef, seed: number): string[] {
  if (s.options) return s.options;
  const alt = s.alt ?? [];
  const set = formSetFor(answer, lesson);
  if (set) return pickOptions(answer, set, alt, seed);
  // Partículas: la primera del pool es el contraste clave y siempre aparece.
  const pool = (lesson.pool ?? ["を", "に", "で", "へ"]).filter((p) => p !== answer && !alt.includes(p));
  const [first, ...others] = pool;
  return [answer, first, ...rotate(others, seed).slice(0, 2)].filter((o) => o !== undefined);
}

// Palabras de tiempo que van sin partícula y pueden ir antes o después del tema.
const BARE_TIME_WORDS = new Set([
  "きょう", "きのう", "あした", "いま", "けさ", "ゆうべ", "おととい", "まいにち", "まいあさ", "まいばん",
  "せんしゅう", "らいしゅう", "こんしゅう",
]);

/** Órdenes alternativos válidos: los explícitos de la oración + «TIEMPO X は…» ⇄ «X は TIEMPO…». */
function alternativeOrders(tokens: string[], s: GrammarSentence): string[][] {
  const alts = (s.orders ?? []).map((o) => o.split(" ").filter(Boolean));
  if (tokens[1] === "は" && BARE_TIME_WORDS.has(tokens[2])) {
    alts.push([tokens[2], tokens[0], tokens[1], ...tokens.slice(3)]);
  }
  return alts;
}

export const QUESTION_WORDS = ["なん", "なに", "だれ", "どこ", "いつ", "なんじ", "なんようび", "なんがつ", "どれ"];

/** Hueco por defecto de la respuesta: la partícula que sigue a la palabra de pregunta (どこ「で」 → としょかん「で」). */
function qaBlank(pair: GrammarQAPair): string | undefined {
  if (pair.blank) return pair.blank;
  const q = pair.q.split(" ");
  const i = q.findIndex((t) => QUESTION_WORDS.includes(t));
  const particle = i >= 0 ? q[i + 1] : undefined;
  return particle && PARTICLES.includes(particle) && particle !== "か" ? particle : undefined;
}

function buildQA(def: LessonDef): GrammarQAExercise[] {
  return (def.qa ?? []).map((pair, i) => {
    const tokens = pair.a.split(" ").filter(Boolean);
    const blank = qaBlank(pair);
    const idx = blank ? tokens.indexOf(blank) : -1;
    if (idx === -1) throw new Error(`${def.id}: sin hueco en la respuesta «${pair.a}»`);
    const answer = tokens[idx];
    const parts = tokens.map((t, k) => (k === idx ? "＿" : t));
    const s: GrammarSentence = { jp: pair.a, es: pair.es, ...(pair.alt ? { alt: pair.alt } : {}) };
    return {
      type: "qa",
      question: pair.q.split(" ").filter(Boolean),
      sentence: parts.join(""),
      parts,
      answer,
      options: optionsFor(answer, s, def, i),
      translation: pair.es,
      kind: PARTICLES.includes(answer) ? "particle" : "form",
      ...(pair.alt ? { alt: pair.alt } : {}),
    };
  });
}

function buildLesson(def: LessonDef): GrammarLesson {
  const exercises: GrammarExercise[] = [];
  def.sentences.forEach((s, sid) => {
    const tokens = s.jp.split(" ").filter(Boolean);
    const accept = alternativeOrders(tokens, s);
    exercises.push({ type: "order", tokens, translation: s.es, ...(accept.length ? { accept } : {}), sid });

    const blankIdx = s.blank !== undefined
      ? tokens.indexOf(s.blank)
      : tokens.findIndex((t) => def.focus.includes(t));
    if (blankIdx === -1) return;
    const answer = tokens[blankIdx];
    const parts = tokens.map((t, i) => (i === blankIdx ? "＿" : t));
    exercises.push({
      type: "particle",
      sentence: parts.join(""),
      parts,
      answer,
      options: optionsFor(answer, s, def, sid),
      translation: s.es,
      kind: PARTICLES.includes(answer) ? "particle" : "form",
      ...(s.alt ? { alt: s.alt } : {}),
      sid,
    });
  });
  return { ...def, exercises, qaExercises: buildQA(def) };
}

const s = (jp: string, es: string, extra: Partial<GrammarSentence> = {}): GrammarSentence => ({ jp, es, ...extra });
const qa = (q: string, a: string, es: string, extra: Partial<GrammarQAPair> = {}): GrammarQAPair => ({ q, a, es, ...extra });

// ── Lecciones ────────────────────────────────────────────────────────────────

const LESSON_DEFS: LessonDef[] = [
  // ══ Japonés Básico I ══════════════════════════════════════════════════════
  {
    id: "estructura-desu",
    title: "La oración básica: X は Y です",
    explanation: "「X は Y です」dice que X es Y. は marca el TEMA: aquello de lo que vas a hablar («con respecto a X…»). Como partícula se escribe は pero se lee \"wa\". です es el estado de ser en presente y no cambia con la persona: sirve para yo, tú, él, nosotros…",
    pattern: "X は Y です",
    section: "Japonés Básico I",
    tip: "Piensa en は como «con respecto a…». わたしは… = «con respecto a mí…».",
    focus: ["は"],
    pool: ["を", "に", "で", "へ"],
    sentences: [
      s("わたし は がくせい です", "Yo soy estudiante."),
      s("たなかさん は せんせい です", "El Sr. Tanaka es profesor."),
      s("かれ は いしゃ です", "Él es médico."),
      s("かのじょ は かいしゃいん です", "Ella es empleada de empresa."),
      s("わたしたち は ともだち です", "Nosotros somos amigos."),
      s("ちち は ぎんこういん です", "Mi padre es empleado de banco."),
      s("はは は せんせい です", "Mi madre es profesora."),
      s("マリアさん は がいこくじん です", "María es extranjera."),
      s("きょう は にちようび です", "Hoy es domingo."),
      s("あした は やすみ です", "Mañana es día libre."),
      s("カルロスさん は りゅうがくせい です", "Carlos es estudiante de intercambio."),
      s("あに は おまわりさん です", "Mi hermano mayor es policía."),
      s("かれたち は がくせい です", "Ellos son estudiantes."),
      s("いま は ごご さんじ です", "Ahora son las tres de la tarde."),
    ],
  },
  {
    id: "negacion-janai",
    title: "Negar: ではありません / じゃないです",
    explanation: "Para decir que X NO es Y se cambia です por ではありません (formal, escrito) o じゃないです (más común al hablar). Las dos significan lo mismo. Ojo: es una sola pieza al final de la oración, igual que です.",
    pattern: "X は Y ではありません / じゃないです",
    section: "Japonés Básico I",
    tip: "では → じゃ: じゃないです es ではありません «comprimido» para hablar.",
    focus: ["ではありません", "じゃないです", "です"],
    sentences: [
      s("わたし は せんせい ではありません", "Yo no soy profesor/a."),
      s("かれ は がくせい じゃないです", "Él no es estudiante."),
      s("たなかさん は いしゃ ではありません", "El Sr. Tanaka no es médico."),
      s("かのじょ は がいこくじん じゃないです", "Ella no es extranjera."),
      s("きょう は やすみ ではありません", "Hoy no es día libre."),
      s("あした は げつようび じゃないです", "Mañana no es lunes."),
      s("マリアさん は かいしゃいん ではありません", "María no es empleada de empresa."),
      s("ちち は ぎんこういん じゃないです", "Mi padre no es empleado de banco."),
      s("わたしたち は きょうだい ではありません", "Nosotros no somos hermanos."),
      s("カルロスさん は せんせい です", "Carlos sí es profesor."),
      s("あに は がくせい です", "Mi hermano mayor sí es estudiante."),
      s("いま は よる じゃないです", "Ahora no es de noche."),
    ],
  },
  {
    id: "copula-pasado-negativo",
    title: "Pasado: でした / ではありませんでした",
    explanation: "です solo tiene dos tiempos: presente y pasado. Pasado afirmativo: でした (era/fue). Pasado negativo: ではありませんでした (no era/no fue); al hablar se dice じゃなかったです. Igual que です, no cambia según la persona.",
    pattern: "X は Y でした / ではありませんでした",
    section: "Japonés Básico I",
    tip: "Para el pasado se le «pega» でした: です → でした, ではありません → ではありませんでした.",
    focus: ["でした", "ではありませんでした", "じゃなかったです"],
    sentences: [
      s("わたし は がくせい でした", "Yo era estudiante."),
      s("そふ は いしゃ でした", "Mi abuelo era médico."),
      s("きのう は にちようび でした", "Ayer fue domingo."),
      s("おととい は やすみ ではありませんでした", "Anteayer no fue día libre."),
      s("かれ は せんせい ではありませんでした", "Él no era profesor."),
      s("はは は かいしゃいん でした", "Mi madre era empleada de empresa."),
      s("かのじょ は りゅうがくせい ではありませんでした", "Ella no era estudiante de intercambio."),
      s("たなかさん は ぎんこういん でした", "El Sr. Tanaka era empleado de banco."),
      s("せんしゅう は なつやすみ でした", "La semana pasada eran las vacaciones de verano."),
      s("わたしたち は ともだち ではありませんでした", "Nosotros no éramos amigos."),
      s("そぼ は せんせい ではありませんでした", "Mi abuela no era profesora."),
      s("きのう は すいようび ではありませんでした", "Ayer no fue miércoles."),
      s("かれ は がくせい じゃなかったです", "Él no era estudiante (coloquial)."),
      s("きのう は どようび じゃなかったです", "Ayer no fue sábado (coloquial)."),
    ],
  },
  {
    id: "particula-no",
    title: "Partícula の: posesión (B の A)",
    explanation: "の une dos sustantivos y marca pertenencia, como nuestro «de», pero al revés: primero va el poseedor y luego lo poseído. «El libro DE Ana» → アナさん の ほん. También sirve para decir de qué tipo es algo: にほんご の せんせい = profesor de japonés.",
    pattern: "B の A  (= A de B)",
    section: "Japonés Básico I",
    tip: "Léelo de derecha a izquierda: わたし の ともだち → amigo ← de ← yo.",
    focus: ["の"],
    pool: ["を", "に", "で", "へ"],
    sentences: [
      s("わたし の なまえ は マリア です", "Mi nombre es María."),
      s("たなかさん は わたし の せんせい です", "El Sr. Tanaka es mi profesor."),
      s("かれ は わたし の ともだち です", "Él es mi amigo."),
      s("やまださん は だいがく の せんせい です", "La Sra. Yamada es profesora de la universidad."),
      s("かのじょ は にほんご の がくせい です", "Ella es estudiante de japonés."),
      s("かのじょ は わたし の いもうと です", "Ella es mi hermana menor."),
      s("カルロスさん は ともだち の おにいさん です", "Carlos es el hermano mayor de mi amigo."),
      s("わたし の ちち は いしゃ です", "Mi padre es médico."),
      s("せんせい の なまえ は たなか です", "El nombre del profesor es Tanaka."),
      s("かれ は にほん の がくせい です", "Él es un estudiante de Japón."),
      s("わたし の たんじょうび は きょう です", "Mi cumpleaños es hoy."),
      s("ともだち の おかあさん は せんせい です", "La mamá de mi amigo es profesora."),
      s("あね の ともだち は りゅうがくせい です", "La amiga de mi hermana mayor es estudiante de intercambio."),
    ],
  },
  {
    id: "pregunta-ka",
    title: "Preguntas con か (なん・だれ・どこ・いつ)",
    explanation: "Para preguntar basta con poner か al final, sin cambiar el orden: あなたは がくせいですか = ¿Eres estudiante? Las palabras de pregunta van justo donde iría la respuesta: なん (qué), だれ (quién), どこ (dónde), いつ (cuándo).",
    pattern: "X は Y ですか · X は なん/だれ/どこ/いつ ですか",
    section: "Japonés Básico I",
    tip: "La palabra de pregunta ocupa el lugar de la respuesta: これは ほんです → これは なんですか.",
    focus: ["なん", "だれ", "どこ", "いつ", "か"],
    pool: ["を", "に", "は", "で"],
    sentences: [
      s("あなた は がくせい です か", "¿Eres estudiante?"),
      s("たなかさん は せんせい です か", "¿El Sr. Tanaka es profesor?"),
      s("かのじょ は いしゃ です か", "¿Ella es médica?"),
      s("あなた の なまえ は なん です か", "¿Cómo te llamas? (¿Cuál es tu nombre?)"),
      s("かれ は だれ です か", "¿Quién es él?"),
      s("たんじょうび は いつ です か", "¿Cuándo es tu cumpleaños?"),
      s("トイレ は どこ です か", "¿Dónde está el baño?"),
      s("えき は どこ です か", "¿Dónde está la estación?"),
      s("やすみ は いつ です か", "¿Cuándo son las vacaciones?"),
      s("せんせい は だれ です か", "¿Quién es el profesor?"),
      s("きょう は なんようび です か", "¿Qué día de la semana es hoy?"),
      s("マリアさん は がいこくじん です か", "¿María es extranjera?"),
      s("いま は なんじ です か", "¿Qué hora es ahora?"),
      s("あなた の ともだち は だれ です か", "¿Quién es tu amigo?"),
    ],
  },

  // ══ Japonés Básico II ═════════════════════════════════════════════════════
  {
    id: "demostrativos-kosoare",
    title: "Kosoado: これ・この, それ・その, あれ・あの",
    explanation: "こ = cerca de mí, そ = cerca de ti, あ = lejos de los dos, ど = pregunta. Las formas en -れ (これ, それ, あれ, どれ) van SOLAS, como pronombre: これは ほんです. Las formas en -の (この, その, あの, どの) SIEMPRE van pegadas a un sustantivo: この ほんは わたしのです.",
    pattern: "これ は X です · この X は Y です",
    section: "Japonés Básico II",
    tip: "-れ va solo; -の necesita un sustantivo detrás (この + ほん).",
    focus: ["これ", "それ", "あれ", "どれ", "この", "その", "あの", "どの"],
    sentences: [
      s("これ は わたし の ほん です", "Esto es mi libro."),
      s("それ は なん です か", "¿Qué es eso?"),
      s("あれ は がっこう です", "Aquello es una escuela."),
      s("どれ が あなた の かさ です か", "¿Cuál es tu paraguas?"),
      s("この かばん は わたし の です", "Este bolso es mío."),
      s("その じてんしゃ は ともだち の です", "Esa bicicleta es de mi amigo."),
      s("あの ひと は せんせい です", "Aquella persona es el profesor."),
      s("どの ひと が たなかさん です か", "¿Cuál de esas personas es el Sr. Tanaka?"),
      s("これ は ねこ の ごはん です", "Esto es la comida del gato."),
      s("それ は わたし の えんぴつ でした", "Eso era mi lápiz."),
      s("この くるま は ちち の です", "Este coche es de mi padre."),
      s("あの いえ は そぼ の いえ です", "Aquella casa es la casa de mi abuela."),
      s("その ほん は せんせい の ではありません", "Ese libro no es del profesor."),
      s("あれ は なん です か", "¿Qué es aquello?"),
    ],
    qa: [
      qa("これ は なん です か", "それ は ほん です", "—¿Qué es esto? —Eso es un libro.", { blank: "それ" }),
      qa("それ は なん です か", "これ は かぎ です", "—¿Qué es eso? —Esto es una llave.", { blank: "これ" }),
      qa("あれ は なん です か", "あれ は がっこう です", "—¿Qué es aquello? —Aquello es una escuela.", { blank: "あれ" }),
      qa("この かばん は だれ の です か", "その かばん は わたし の です", "—¿De quién es este bolso? —Ese bolso es mío.", { blank: "その" }),
      qa("どれ が あなた の ほん です か", "それ が わたし の ほん です", "—¿Cuál es tu libro? —Ese es mi libro.", { blank: "それ" }),
    ],
  },
  {
    id: "verbos-masu",
    title: "Verbos en ます: presente afirmativo",
    explanation: "En japonés solo hay dos tiempos: presente y pasado. El futuro se entiende por el contexto (あした = mañana). La forma ます sirve igual para todas las personas y el verbo SIEMPRE va al final de la oración: わたしは パンを たべます = Yo como pan / comeré pan.",
    pattern: "X は Verbo-ます",
    section: "Japonés Básico II",
    tip: "ます (sí, ahora) · ません (no) · ました (sí, antes) · ませんでした (no, antes).",
    focus: [],
    sentences: [
      s("わたし は まいにち にほんご を べんきょうします", "Estudio japonés todos los días.", { blank: "べんきょうします" }),
      s("ちち は まいにち はたらきます", "Mi padre trabaja todos los días.", { blank: "はたらきます" }),
      s("わたし は パン を たべます", "Yo como pan.", { blank: "たべます" }),
      s("かのじょ は おちゃ を のみます", "Ella bebe té.", { blank: "のみます" }),
      s("がくせい は ほん を よみます", "El estudiante lee un libro.", { blank: "よみます" }),
      s("わたし は てがみ を かきます", "Escribo una carta.", { blank: "かきます" }),
      s("わたし は あした やすみます", "Mañana descanso.", { blank: "やすみます" }),
      s("こども は まいにち あそびます", "Los niños juegan todos los días.", { blank: "あそびます" }),
      s("わたし は にほんご が わかります", "Entiendo japonés.", { blank: "わかります" }),
      s("わたし は まいばん おんがく を ききます", "Escucho música todas las noches.", { blank: "ききます" }),
      s("はは は まいあさ コーヒー を のみます", "Mi madre bebe café cada mañana.", { blank: "のみます" }),
      s("たなかさん は えいご を はなします", "El Sr. Tanaka habla inglés.", { blank: "はなします" }),
    ],
  },
  {
    id: "verbos-masen",
    title: "Verbos en ません: presente negativo",
    explanation: "Para negar en presente se cambia ます por ません: たべます → たべません (no como). Como el futuro no tiene forma propia, ません también puede significar «no lo haré».",
    pattern: "X は Verbo-ません",
    section: "Japonés Básico II",
    tip: "ます → ません: solo cambia la última sílaba.",
    focus: [],
    sentences: [
      s("わたし は にく を たべません", "No como carne.", { blank: "たべません" }),
      s("かれ は おさけ を のみません", "Él no bebe alcohol.", { blank: "のみません" }),
      s("はは は テレビ を みません", "Mi madre no ve la televisión.", { blank: "みません" }),
      s("にちようび は はたらきません", "Los domingos no trabajo.", { blank: "はたらきません" }),
      s("かのじょ は コーヒー を のみません", "Ella no bebe café.", { blank: "のみません" }),
      s("がくせい は しんぶん を よみません", "El estudiante no lee el periódico.", { blank: "よみません" }),
      s("わたし は えいご が わかりません", "No entiendo inglés.", { blank: "わかりません" }),
      s("こども は やさい を たべません", "El niño no come verduras.", { blank: "たべません" }),
      s("ちち は ラジオ を ききません", "Mi padre no escucha la radio.", { blank: "ききません" }),
      s("あした は やすみません", "Mañana no descanso.", { blank: "やすみません" }),
      s("かれ は にほんご を はなしません", "Él no habla japonés.", { blank: "はなしません" }),
      s("わたし は てがみ を かきません", "No escribo cartas.", { blank: "かきません" }),
    ],
  },
  {
    id: "verbos-mashita",
    title: "Verbos en ました: pasado afirmativo",
    explanation: "Para el pasado se cambia ます por ました: たべます → たべました (comí). Suele acompañarse de palabras de tiempo pasado como きのう (ayer), けさ (esta mañana) o ゆうべ (anoche), que NO llevan partícula.",
    pattern: "X は Verbo-ました",
    section: "Japonés Básico II",
    tip: "ます → ました: la «た» final suena a pasado.",
    focus: [],
    sentences: [
      s("わたし は きのう すし を たべました", "Ayer comí sushi.", { blank: "たべました" }),
      s("かのじょ は きのう えいが を みました", "Ella vio una película ayer.", { blank: "みました" }),
      s("わたし は けさ コーヒー を のみました", "Esta mañana bebí café.", { blank: "のみました" }),
      s("ちち は きのう はたらきました", "Mi padre trabajó ayer.", { blank: "はたらきました" }),
      s("わたし は ゆうべ しゅくだい を しました", "Anoche hice la tarea.", { blank: "しました" }),
      s("かれ は せんしゅう てがみ を かきました", "Él escribió una carta la semana pasada.", { blank: "かきました" }),
      s("がくせい は きのう にほんご を べんきょうしました", "Los estudiantes estudiaron japonés ayer.", { blank: "べんきょうしました" }),
      s("わたし は おととい ほん を よみました", "Anteayer leí un libro.", { blank: "よみました" }),
      s("こども は きのう たくさん あそびました", "Ayer los niños jugaron mucho.", { blank: "あそびました" }),
      s("わたし は せんせい の はなし が わかりました", "Entendí lo que explicó el profesor.", { blank: "わかりました" }),
      s("はは は けさ おんがく を ききました", "Mi madre escuchó música esta mañana.", { blank: "ききました" }),
      s("わたし は きのう やすみました", "Ayer descansé.", { blank: "やすみました" }),
    ],
  },
  {
    id: "verbos-masendeshita",
    title: "Verbos en ませんでした: pasado negativo",
    explanation: "Para decir que algo NO pasó, se añade でした a la forma ません: たべません → たべませんでした (no comí). Es la forma más larga de las cuatro.",
    pattern: "X は Verbo-ませんでした",
    section: "Japonés Básico II",
    tip: "ません + でした = ませんでした («no» + «pasado»).",
    focus: [],
    sentences: [
      s("わたし は きのう べんきょうしませんでした", "Ayer no estudié.", { blank: "べんきょうしませんでした" }),
      s("かれ は けさ あさごはん を たべませんでした", "Él no desayunó esta mañana.", { blank: "たべませんでした" }),
      s("かのじょ は ゆうべ テレビ を みませんでした", "Ella no vio la televisión anoche.", { blank: "みませんでした" }),
      s("ちち は せんしゅう はたらきませんでした", "Mi padre no trabajó la semana pasada.", { blank: "はたらきませんでした" }),
      s("わたし は その えいが が わかりませんでした", "No entendí esa película.", { blank: "わかりませんでした" }),
      s("がくせい は しゅくだい を しませんでした", "Los estudiantes no hicieron la tarea.", { blank: "しませんでした" }),
      s("わたし は きのう コーヒー を のみませんでした", "Ayer no bebí café.", { blank: "のみませんでした" }),
      s("かれ は てがみ を かきませんでした", "Él no escribió la carta.", { blank: "かきませんでした" }),
      s("こども は きのう あそびませんでした", "Ayer el niño no jugó.", { blank: "あそびませんでした" }),
      s("わたし は ゆうべ ねませんでした", "Anoche no dormí.", { blank: "ねませんでした" }),
      s("はは は しんぶん を よみませんでした", "Mi madre no leyó el periódico.", { blank: "よみませんでした" }),
      s("たなかさん は きのう やすみませんでした", "El Sr. Tanaka no descansó ayer.", { blank: "やすみませんでした" }),
    ],
  },
  {
    id: "particula-ni",
    title: "Partícula に: tiempo específico",
    explanation: "に marca un momento concreto: una hora, un día de la semana, un mes (しちじに, どようびに, しがつに). Pero きょう, きのう, あした, いま o まいにち NUNCA llevan に. Para preguntar se usa なん + tiempo + に: なんじに おきますか = ¿A qué hora te levantas?",
    pattern: "(tema) は (tiempo) に Verbo",
    section: "Japonés Básico II",
    tip: "Si puedes poner un número o un nombre de día, lleva に. Si es «hoy / ayer / mañana», va sin nada.",
    train: true,
    focus: ["に"],
    pool: ["で", "を", "へ", "が"],
    sentences: [
      s("わたし は しちじ に おきます", "Me levanto a las siete."),
      s("かれ は じゅういちじ に ねます", "Él se acuesta a las once."),
      s("がくせい は にちようび に べんきょうします", "El estudiante estudia los domingos."),
      s("わたし は ごご さんじ に コーヒー を のみます", "Bebo café a las tres de la tarde."),
      s("かのじょ は どようび に はたらきます", "Ella trabaja los sábados."),
      s("なんじ に おきました か", "¿A qué hora te levantaste?"),
      s("わたし は ろくじ に おきました", "Me levanté a las seis."),
      s("ちち は はちじ に ばんごはん を たべます", "Mi padre cena a las ocho."),
      s("なんようび に やすみます か", "¿Qué día descansas?"),
      s("わたし は きのう くじ に ねました", "Ayer me acosté a las nueve."),
      s("こども は げつようび に がっこう へ いきます", "El niño va a la escuela el lunes."),
      s("あした じゅうじ に べんきょうします", "Mañana estudio a las diez."),
      s("わたし は しがつ に にほん へ いきます", "En abril voy a Japón."),
      s("たんじょうび に ケーキ を たべます", "En mi cumpleaños como pastel."),
    ],
    qa: [
      qa("なんじ に おきます か", "しちじ に おきます", "—¿A qué hora te levantas? —A las siete."),
      qa("なんようび に はたらきます か", "どようび に はたらきます", "—¿Qué día trabajas? —Los sábados."),
      qa("なんじ に ねました か", "じゅうじ に ねました", "—¿A qué hora te acostaste? —A las diez."),
      qa("なんがつ に にほん へ いきます か", "しがつ に いきます", "—¿En qué mes vas a Japón? —En abril."),
      qa("なんじ に ばんごはん を たべます か", "はちじ に たべます", "—¿A qué hora cenas? —A las ocho."),
    ],
  },
  {
    id: "kara-made",
    title: "から〜まで: desde… hasta…",
    explanation: "に marca UN momento; から (desde) y まで (hasta) marcan un RANGO de tiempo o de espacio. Se usan juntas o por separado: くじから ごじまで = de nueve a cinco. Para preguntar: なんじから なんじまで ですか.",
    pattern: "(inicio) から (fin) まで Verbo",
    section: "Japonés Básico II",
    tip: "から = «desde» (sale), まで = «hasta» (llega). Siempre en ese orden.",
    train: true,
    focus: ["から", "まで"],
    pool: ["から", "まで", "に", "を", "で"],
    sentences: [
      s("わたし は くじ から ごじ まで はたらきます", "Trabajo de nueve a cinco."),
      s("がっこう は げつようび から きんようび まで です", "La escuela es de lunes a viernes."),
      s("かれ は ごご いちじ から さんじ まで べんきょうしました", "Él estudió de una a tres de la tarde.", { blank: "まで" }),
      s("やすみ は しちがつ から はちがつ まで です", "Las vacaciones son de julio a agosto."),
      s("ぎんこう は なんじ から なんじ まで です か", "¿De qué hora a qué hora abre el banco?"),
      s("わたし は うち から えき まで あるきます", "Camino de mi casa a la estación.", { blank: "まで" }),
      s("としょかん は じゅうじ まで です", "La biblioteca está abierta hasta las diez."),
      s("じゅぎょう は はちじはん から です", "La clase empieza a las ocho y media."),
      s("かのじょ は あさ から よる まで はたらきます", "Ella trabaja de la mañana a la noche.", { blank: "まで" }),
      s("わたし は きのう よじ から ろくじ まで テレビ を みました", "Ayer vi la tele de cuatro a seis."),
      s("わたし は がっこう から うち まで あるきました", "Caminé de la escuela a casa."),
      s("なつやすみ は いつ から いつ まで です か", "¿Desde cuándo hasta cuándo son las vacaciones de verano?", { blank: "まで" }),
    ],
    qa: [
      qa("なんじ から はたらきます か", "くじ から はたらきます", "—¿Desde qué hora trabajas? —Desde las nueve."),
      qa("なんじ まで べんきょうします か", "じゅうじ まで べんきょうします", "—¿Hasta qué hora estudias? —Hasta las diez."),
      qa("なんようび から やすみ です か", "どようび から やすみ です", "—¿Desde qué día tienes descanso? —Desde el sábado."),
      qa("どこ まで あるきます か", "えき まで あるきます", "—¿Hasta dónde caminas? —Hasta la estación."),
      qa("なんがつ まで にほん に います か", "はちがつ まで います", "—¿Hasta qué mes estás en Japón? —Hasta agosto."),
    ],
  },
  {
    id: "particula-to",
    title: "Partícula と: «y» y «con» (だれと)",
    explanation: "と tiene dos usos: une sustantivos como «y» (パンと たまご = pan y huevo) o marca con quién haces algo (ともだちと = con un amigo). Para preguntar se usa だれと: だれと いきますか = ¿Con quién vas? En el tren va después del tiempo: (tema)は (tiempo)に (compañía)と + verbo.",
    pattern: "(tema) は (tiempo) に (compañía) と Verbo",
    section: "Japonés Básico II",
    tip: "わたしと ちちは = «mi papá y yo» (los dos son el tema). わたしは ちちと = «yo, con mi papá».",
    train: true,
    focus: ["と"],
    pool: ["を", "へ", "が"],
    sentences: [
      s("わたし は ともだち と えいが を みます", "Veo una película con mi amigo."),
      s("かれ は どようび に かのじょ と あそびます", "Él sale con ella el sábado."),
      s("わたし は ちち と はたらきます", "Trabajo con mi papá."),
      s("わたし と あね は がくせい です", "Mi hermana mayor y yo somos estudiantes.", { options: ["と", "を", "へ", "で"], orders: ["あね と わたし は がくせい です"] }),
      s("パン と たまご を たべます", "Como pan y huevo.", { options: ["と", "へ", "を", "まで"], orders: ["たまご と パン を たべます"] }),
      s("だれ と きました か", "¿Con quién viniste?", { options: ["と", "を", "へ", "で"] }),
      s("かぞく と きました", "Vine con mi familia.", { options: ["と", "を", "へ", "の"] }),
      s("マリアさん は にちようび に おかあさん と かいもの を します", "María va de compras con su mamá el domingo."),
      s("いぬ と ねこ が います", "Hay un perro y un gato.", { options: ["と", "を", "へ", "で"], orders: ["ねこ と いぬ が います"] }),
      s("わたし は きのう せんせい と はなしました", "Ayer hablé con el profesor."),
      s("かれ は だれ と ばんごはん を たべます か", "¿Con quién cena él?"),
      s("こども は ともだち と あそびます", "El niño juega con sus amigos."),
      s("ほん と ノート を かいました", "Compré un libro y un cuaderno.", { options: ["と", "へ", "を", "が"], orders: ["ノート と ほん を かいました"] }),
      s("わたし は らいしゅう りょうしん と りょこう を します", "La próxima semana viajo con mis padres."),
    ],
    qa: [
      qa("だれ と いきます か", "ともだち と いきます", "—¿Con quién vas? —Con mi amigo."),
      qa("だれ と ひるごはん を たべました か", "はは と たべました", "—¿Con quién almorzaste? —Con mi madre."),
      qa("だれ と はなしました か", "せんせい と はなしました", "—¿Con quién hablaste? —Con el profesor."),
      qa("だれ と えいが を みます か", "かのじょ と みます", "—¿Con quién ves la película? —Con ella."),
    ],
  },
  {
    id: "particula-de",
    title: "Partícula で: el medio (なにで)",
    explanation: "で marca el MEDIO con el que se hace algo: «en» bus, «con» palillos, «por» teléfono. Para preguntar se usa なにで: なにで きましたか = ¿En qué viniste? En el tren va después de la compañía: (tema)は (tiempo)に (compañía)と (medio)で + verbo.",
    pattern: "(tema) は … (medio) で Verbo",
    section: "Japonés Básico II",
    tip: "で = «a través de / gracias a / mediante».",
    train: true,
    focus: ["で"],
    pool: ["を", "に", "へ"],
    sentences: [
      s("わたし は バス で がっこう へ いきます", "Voy a la escuela en autobús."),
      s("かれ は じてんしゃ で きました", "Él vino en bicicleta."),
      s("わたし は はし で すし を たべます", "Como sushi con palillos."),
      s("がくせい は えんぴつ で かきます", "Los estudiantes escriben con lápiz."),
      s("なに で きました か", "¿En qué viniste?", { options: ["で", "へ", "の", "まで"] }),
      s("わたし は でんしゃ で きました", "Vine en tren."),
      s("ちち は くるま で かいしゃ へ いきます", "Mi padre va a la oficina en coche."),
      s("かのじょ は ひこうき で にほん へ いきました", "Ella fue a Japón en avión."),
      s("わたし は でんわ で はは と はなしました", "Hablé con mi madre por teléfono."),
      s("せんせい は ペン で なまえ を かきました", "El profesor escribió el nombre con bolígrafo."),
      s("かれ は なに で しごと へ いきます か", "¿En qué va él al trabajo?"),
      s("わたし は タクシー で えき へ いきました", "Fui a la estación en taxi."),
      s("わたしたち は ふね で くに へ かえりました", "Regresamos a nuestro país en barco."),
      s("こども は スプーン で カレー を たべます", "El niño come curry con cuchara."),
    ],
    qa: [
      qa("なに で がっこう へ いきます か", "じてんしゃ で いきます", "—¿En qué vas a la escuela? —En bicicleta."),
      qa("なに で たべます か", "はし で たべます", "—¿Con qué comes? —Con palillos."),
      qa("なに で かきました か", "ペン で かきました", "—¿Con qué lo escribiste? —Con bolígrafo."),
      qa("なに で きました か", "でんしゃ で きました", "—¿En qué viniste? —En tren."),
    ],
  },
  {
    id: "particula-he",
    title: "Partícula へ: dirección (どこへ)",
    explanation: "へ marca hacia dónde te mueves. Como partícula se lee \"e\". Solo aparece con verbos de movimiento (いきます, きます, かえります). En su lugar también puede ir に (destino final); en la práctica significan lo mismo. Para preguntar: どこへ いきますか = ¿A dónde vas?",
    pattern: "(tema) は … (destino) へ Verbo de movimiento",
    section: "Japonés Básico II",
    tip: "Si ves へ, busca un verbo de movimiento al final.",
    train: true,
    focus: ["へ"],
    pool: ["で", "を", "と", "の"],
    sentences: [
      s("わたし は がっこう へ いきます", "Voy a la escuela.", { alt: ["に"] }),
      s("かれ は うち へ かえります", "Él regresa a casa.", { alt: ["に"] }),
      s("かのじょ は らいしゅう にほん へ いきます", "Ella va a Japón la próxima semana.", { alt: ["に"] }),
      s("ともだち は きのう わたし の うち へ きました", "Mi amigo vino a mi casa ayer.", { alt: ["に"] }),
      s("どこ へ いきます か", "¿A dónde vas?", { alt: ["に"] }),
      s("わたし は ぎんこう へ いきます", "Voy al banco.", { alt: ["に"] }),
      s("ちち は しちじ に うち へ かえります", "Mi papá vuelve a casa a las siete.", { alt: ["に"] }),
      s("わたしたち は なつやすみ に うみ へ いきます", "En las vacaciones de verano vamos al mar.", { alt: ["に"] }),
      s("がくせい は としょかん へ いきました", "Los estudiantes fueron a la biblioteca.", { alt: ["に"] }),
      s("かれ は どこ へ いきました か", "¿A dónde fue él?", { alt: ["に"] }),
      s("マリアさん は くに へ かえりました", "María regresó a su país.", { alt: ["に"] }),
      s("わたし は あした ともだち と えいがかん へ いきます", "Mañana voy al cine con mi amigo.", { alt: ["に"] }),
    ],
    qa: [
      qa("どこ へ いきます か", "ぎんこう へ いきます", "—¿A dónde vas? —Al banco.", { alt: ["に"] }),
      qa("どこ へ かえります か", "うち へ かえります", "—¿A dónde regresas? —A casa.", { alt: ["に"] }),
      qa("あした どこ へ いきます か", "こうえん へ いきます", "—¿A dónde vas mañana? —Al parque.", { alt: ["に"] }),
      qa("きのう どこ へ いきました か", "としょかん へ いきました", "—¿A dónde fuiste ayer? —A la biblioteca.", { alt: ["に"] }),
    ],
  },
  {
    id: "lugar-ni-he-de",
    title: "El lugar: に, へ o で según el verbo",
    explanation: "El lugar lleva una partícula distinta según el tipo de verbo: EXISTENCIA (すんでいます, います, あります) → に: «estoy EN»; MOVIMIENTO (いきます, きます, かえります) → へ (o に): «me muevo HACIA»; ACCIÓN (はたらきます, べんきょうします, たべます…) → で: «hago algo EN». Por eso también cambia la pregunta: どこに / どこへ / どこで.",
    pattern: "(lugar) に existir · (lugar) へ moverse · (lugar) で hacer",
    section: "Japonés Básico II",
    tip: "Pregúntate: ¿el verbo ESTÁ, VA o HACE? → に · へ · で.",
    train: true,
    focus: ["に", "へ", "で"],
    pool: ["に", "へ", "で", "を", "と"],
    sentences: [
      s("わたし は とうきょう に すんでいます", "Vivo en Tokio."),
      s("かぞく は きょうと に すんでいます", "Mi familia vive en Kioto."),
      s("ねこ は へや に います", "El gato está en la habitación."),
      s("かれ は いま えき に います", "Él está ahora en la estación."),
      s("どこ に すんでいます か", "¿Dónde vives?"),
      s("わたし は おおさか へ いきます", "Voy a Osaka.", { alt: ["に"] }),
      s("あした どこ へ いきます か", "¿A dónde vas mañana?", { alt: ["に"] }),
      s("かれ は きのう ゆうびんきょく へ いきました", "Él fue a correos ayer.", { alt: ["に"] }),
      s("せんせい は がっこう へ きます", "El profesor viene a la escuela.", { alt: ["に"] }),
      s("わたし は としょかん で べんきょうします", "Estudio en la biblioteca."),
      s("ちち は ぎんこう で はたらきます", "Mi padre trabaja en un banco."),
      s("わたしたち は きっさてん で コーヒー を のみました", "Tomamos café en la cafetería."),
      s("どこ で ひるごはん を たべます か", "¿Dónde almuerzas?"),
      s("かのじょ は デパート で ぼうし を かいました", "Ella compró un sombrero en los grandes almacenes."),
      s("こども は こうえん で あそびます", "Los niños juegan en el parque."),
    ],
    qa: [
      qa("どこ に すんでいます か", "おおさか に すんでいます", "—¿Dónde vives? —En Osaka."),
      qa("どこ で はたらきます か", "びょういん で はたらきます", "—¿Dónde trabajas? —En un hospital."),
      qa("どこ へ いきます か", "デパート へ いきます", "—¿A dónde vas? —A los grandes almacenes.", { alt: ["に"] }),
      qa("どこ で べんきょうします か", "としょかん で べんきょうします", "—¿Dónde estudias? —En la biblioteca."),
      qa("ねこ は どこ に います か", "へや に います", "—¿Dónde está el gato? —En la habitación."),
    ],
  },
  {
    id: "particula-wo",
    title: "Partícula を: el objeto directo (なにを)",
    explanation: "を marca el objeto sobre el que recae la acción: パンを たべます = como pan. En español no se traduce, pero en japonés siempre va detrás del objeto. Se escribe を y se lee \"o\". Para preguntar: なにを かいましたか = ¿Qué compraste? Es la última parada del tren antes del verbo de acción.",
    pattern: "(tema) は (tiempo) に (comp) と (lugar) で (objeto) を Verbo",
    section: "Japonés Básico II",
    tip: "Pregunta «¿qué + verbo?»: lo que responde lleva を.",
    train: true,
    focus: ["を"],
    pool: ["に", "が", "へ"],
    sentences: [
      s("わたし は まいあさ パン を たべます", "Como pan cada mañana."),
      s("かれ は としょかん で ほん を よみます", "Él lee libros en la biblioteca."),
      s("かのじょ は ぎゅうにゅう を のみません", "Ella no bebe leche."),
      s("わたし は きのう ともだち と えいが を みました", "Ayer vi una película con mi amigo."),
      s("なに を かいました か", "¿Qué compraste?"),
      s("わたし は スーパー で やさい を かいました", "Compré verduras en el supermercado."),
      s("がくせい は きょうしつ で にほんご を べんきょうします", "Los estudiantes estudian japonés en el aula."),
      s("ちち は まいばん ニュース を みます", "Mi padre ve las noticias cada noche."),
      s("かれ は ゆうべ おんがく を ききました", "Él escuchó música anoche."),
      s("あの みせ は まんが を うっています", "Aquella tienda vende manga."),
      s("わたし は ひるごはん に すし を たべました", "Almorcé sushi."),
      s("かのじょ は なに を のみます か", "¿Qué bebe ella?"),
      s("わたし は にちようび に へや の そうじ を します", "Los domingos limpio mi habitación."),
      s("こども は こうえん で しゃしん を とりました", "El niño sacó fotos en el parque."),
    ],
    qa: [
      qa("なに を たべます か", "すし を たべます", "—¿Qué comes? —Sushi."),
      qa("なに を のみました か", "おちゃ を のみました", "—¿Qué bebiste? —Té."),
      qa("なに を かいました か", "ほん を かいました", "—¿Qué compraste? —Un libro."),
      qa("なに を みます か", "えいが を みます", "—¿Qué ves? —Una película."),
      qa("なに を べんきょうします か", "にほんご を べんきょうします", "—¿Qué estudias? —Japonés."),
    ],
  },
  {
    id: "particula-ga",
    title: "Partícula が vs は",
    explanation: "は presenta un TEMA ya conocido y anuncia información nueva sobre él («con respecto a mí… soy María»). が señala QUIÉN o QUÉ cumple algo cuando eso es lo desconocido («¿quién es María?» → «María soy YO»). Por eso las palabras de pregunta como sujeto (だれ, なに, どれ) siempre van con が, y su respuesta también.",
    pattern: "だれ が …か → X が … · X は …",
    section: "Japonés Básico II",
    tip: "は → la información nueva va DESPUÉS. が → la información nueva es lo que va ANTES.",
    focus: ["は", "が"],
    pool: ["は", "が", "を", "に"],
    sentences: [
      s("だれ が きました か", "¿Quién vino?"),
      s("たなかさん が きました", "(—¿Quién vino?) Vino el Sr. Tanaka."),
      s("わたし は マリア です", "(Al presentarte) Yo soy María."),
      s("わたし が マリア です", "(—¿Quién es María?) María soy yo."),
      s("どれ が あなた の かばん です か", "¿Cuál es tu bolso?"),
      s("これ が わたし の かばん です", "(—¿Cuál es tu bolso?) Este es mi bolso."),
      s("なに が すき です か", "¿Qué te gusta?"),
      s("だれ が この ケーキ を たべました か", "¿Quién se comió este pastel?"),
      s("おとうと が たべました", "(—¿Quién se comió el pastel?) Se lo comió mi hermano menor."),
      s("きょう は あめ です", "(—¿Qué tal el clima hoy?) Hoy llueve."),
      s("わたし は きのう えいが を みました", "(Le cuentas a un amigo) Ayer vi una película."),
      s("だれ が せんせい です か", "¿Quién es el profesor?"),
      s("あの ひと が せんせい です", "(—¿Quién es el profesor?) Aquella persona es el profesor."),
      s("かれ は いしゃ です", "(Hablándote de él) Él es médico."),
    ],
    qa: [
      qa("だれ が きました か", "やまださん が きました", "—¿Quién vino? —Vino la Sra. Yamada."),
      qa("だれ が せんせい です か", "あの ひと が せんせい です", "—¿Quién es el profesor? —Aquella persona es el profesor."),
      qa("どれ が あなた の かさ です か", "これ が わたし の かさ です", "—¿Cuál es tu paraguas? —Este es mi paraguas."),
      qa("なに が すき です か", "ねこ が すき です", "—¿Qué te gusta? —Me gustan los gatos."),
      qa("だれ が この てがみ を かきました か", "あね が かきました", "—¿Quién escribió esta carta? —La escribió mi hermana mayor."),
    ],
  },
  {
    id: "existencia-arimasu-imasu",
    title: "Hay / está: あります・います + posiciones",
    explanation: "あります se usa con cosas y plantas; います con personas y animales. Dos patrones: «(lugar) に X が あります» = HAY un X en el lugar (X es nuevo, «un»); «X は (lugar) に あります» = el X ESTÁ en el lugar (X es conocido, «el»). Posiciones: Y の うえ (encima), した (debajo), なか (dentro), まえ (delante), うしろ (detrás).",
    pattern: "(lugar) に X が あります · X は (lugar) に います",
    section: "Japonés Básico II",
    tip: "¿Se mueve solo? → います. ¿No? → あります. La posición va así: つくえ の うえ に (en lo de arriba del escritorio).",
    focus: ["あります", "います", "ありません", "いません", "ありました", "いました"],
    pool: ["に", "で", "を", "へ"],
    sentences: [
      s("つくえ の うえ に ほん が あります", "Hay un libro encima del escritorio."),
      s("こうえん に いぬ が います", "Hay un perro en el parque."),
      s("かばん の なか に さいふ が あります", "Hay una cartera dentro del bolso.", { blank: "なか" }),
      s("いす の した に ねこ が います", "Hay un gato debajo de la silla.", { blank: "した" }),
      s("がっこう の まえ に バス が あります", "Hay un autobús delante de la escuela.", { blank: "まえ" }),
      s("いえ の うしろ に き が あります", "Hay un árbol detrás de la casa.", { blank: "うしろ" }),
      s("かぎ は つくえ の うえ に あります", "La llave está encima del escritorio.", { blank: "に" }),
      s("せんせい は きょうしつ に います", "El profesor está en el aula."),
      s("わたし は おかね が ありません", "No tengo dinero."),
      s("へや に だれ が います か", "¿Quién está en la habitación?", { blank: "が" }),
      s("れいぞうこ の なか に なに が あります か", "¿Qué hay dentro del refrigerador?", { blank: "なか" }),
      s("えき の まえ に ぎんこう が あります", "Hay un banco delante de la estación.", { blank: "に" }),
      s("にわ に とり が います", "Hay un pájaro en el jardín."),
      s("ねこ は テーブル の した に いません", "El gato no está debajo de la mesa."),
      s("あそこ に かさ が ありました", "Allí había un paraguas."),
    ],
    qa: [
      qa("つくえ の うえ に なに が あります か", "ほん が あります", "—¿Qué hay encima del escritorio? —Hay un libro."),
      qa("いぬ は どこ に います か", "にわ に います", "—¿Dónde está el perro? —En el jardín."),
      qa("きょうしつ に だれ が います か", "せんせい が います", "—¿Quién está en el aula? —Está el profesor."),
      qa("かぎ は どこ に あります か", "かばん の なか に あります", "—¿Dónde está la llave? —Dentro del bolso."),
      qa("へや に なに が います か", "ねこ が います", "—¿Qué hay en la habitación? —Hay un gato."),
    ],
  },

  // ══ Extra (no está en los libros) ═════════════════════════════════════════
  {
    id: "particula-mo",
    title: "Partícula も: también",
    explanation: "も significa «también» y ocupa el lugar de は o が: わたしも がくせいです = Yo también soy estudiante. Cuando reemplaza a を suele ir sola: パンも たべます.",
    pattern: "X も Y です",
    section: "Extra",
    focus: ["も"],
    pool: ["は", "を", "に"],
    sentences: [
      s("わたし も がくせい です", "Yo también soy estudiante."),
      s("かれ も いしゃ です", "Él también es médico."),
      s("わたし も コーヒー が すき です", "A mí también me gusta el café."),
      s("たなかさん も きました", "El Sr. Tanaka también vino."),
      s("いもうと も にほんご を べんきょうします", "Mi hermana menor también estudia japonés."),
      s("きょう も あめ です", "Hoy también llueve."),
      s("この ほん も おもしろい です", "Este libro también es interesante."),
      s("わたし も いきます", "Yo también voy."),
      s("ねこ も います", "También hay un gato."),
      s("あした も はたらきます", "Mañana también trabajo."),
    ],
  },
  {
    id: "adjetivos-i",
    title: "Adjetivos い: afirmativo, negativo y pasado",
    explanation: "Los adjetivos い se conjugan ellos mismos: たかい (es caro) → たかくない (no es caro) → たかかった (era caro) → たかくなかった (no era caro). です se queda al final sin cambiar.",
    pattern: "X は Adj-い / -くない / -かった です",
    section: "Extra",
    tip: "Quita la い final y añade くない, かった o くなかった.",
    adjective: "i",
    focus: [],
    sentences: [
      s("この ラーメン は おいしい です", "Este ramen está delicioso.", { blank: "おいしい" }),
      s("きょう は さむくない です", "Hoy no hace frío.", { blank: "さむくない" }),
      s("きのう は あつかった です", "Ayer hizo calor.", { blank: "あつかった" }),
      s("その ほん は おもしろくなかった です", "Ese libro no era interesante.", { blank: "おもしろくなかった" }),
      s("にほんご は むずかしい です", "El japonés es difícil.", { blank: "むずかしい" }),
      s("この かばん は たかくない です", "Este bolso no es caro.", { blank: "たかくない" }),
      s("えいが は たのしかった です", "La película fue divertida.", { blank: "たのしかった" }),
      s("わたし の へや は ひろくない です", "Mi habitación no es amplia.", { blank: "ひろくない" }),
      s("その みせ は やすい です", "Esa tienda es barata.", { blank: "やすい" }),
      s("テスト は やさしかった です", "El examen fue fácil.", { blank: "やさしかった" }),
      s("あの やま は たかい です", "Aquella montaña es alta.", { blank: "たかい" }),
      s("きのう の じゅぎょう は つまらなかった です", "La clase de ayer fue aburrida.", { blank: "つまらなかった" }),
    ],
  },
  {
    id: "adjetivos-na",
    title: "Adjetivos な: afirmativo, negativo y pasado",
    explanation: "Los adjetivos な (しずか, きれい, げんき…) NO cambian: lo que se conjuga es です. しずかです → しずかじゃないです → しずかでした → しずかじゃなかったです. Ojo con きれい: termina en い pero es adjetivo な.",
    pattern: "X は Adj-な です / じゃないです / でした",
    section: "Extra",
    tip: "Adjetivo な = sustantivo: se conjuga igual que です.",
    focus: ["です", "じゃないです", "でした", "じゃなかったです"],
    sentences: [
      s("この まち は しずか です", "Esta ciudad es tranquila."),
      s("かれ は げんき じゃないです", "Él no está animado."),
      s("わたし は スポーツ が じょうず じゃないです", "No soy hábil en los deportes."),
      s("その こうえん は きれい でした", "Ese parque estaba bonito."),
      s("きのう は ひま じゃなかったです", "Ayer no estaba libre."),
      s("あの せんせい は しんせつ です", "Aquel profesor es amable."),
      s("この へや は きれい じゃないです", "Esta habitación no está limpia."),
      s("えき の ちかく は にぎやか です", "Los alrededores de la estación son animados."),
      s("しゅくだい は かんたん でした", "La tarea fue sencilla."),
      s("かのじょ は ゆうめい じゃなかったです", "Ella no era famosa."),
    ],
  },
  {
    id: "gustos-suki-hoshii-tai",
    title: "Gustos y deseos: すき・ほしい・〜たい",
    explanation: "すきです (gusta), きらいです (no gusta) y ほしいです (quiero algo) marcan la cosa con が, no con を: コーヒーが すきです. Para decir que quieres HACER algo, cambia ます por たい: たべます → たべたいです (quiero comer).",
    pattern: "X が すき/ほしい です · Verbo-たい です",
    section: "Extra",
    tip: "Sentimientos y deseos → が. Querer HACER → raíz + たい.",
    focus: ["が"],
    pool: ["を", "に", "で", "へ"],
    sentences: [
      s("わたし は コーヒー が すき です", "Me gusta el café."),
      s("かれ は ねこ が きらい です", "A él no le gustan los gatos."),
      s("わたし は あたらしい くつ が ほしい です", "Quiero zapatos nuevos."),
      s("かのじょ は おんがく が だいすき です", "A ella le encanta la música."),
      s("わたし は みず が ほしい です", "Quiero agua."),
      s("なに が ほしい です か", "¿Qué quieres?"),
      s("わたし は すし を たべたい です", "Quiero comer sushi.", { blank: "たべたい" }),
      s("わたし は にほん へ いきたい です", "Quiero ir a Japón.", { blank: "いきたい" }),
      s("かれ は えいが を みたい です", "Él quiere ver una película.", { blank: "みたい" }),
      s("わたし は やさい が すき じゃないです", "No me gustan las verduras."),
      s("こども は いぬ が ほしい です", "El niño quiere un perro."),
      s("わたし は ねたい です", "Quiero dormir.", { blank: "ねたい" }),
    ],
  },
];

export const GRAMMAR_LESSONS: GrammarLesson[] = LESSON_DEFS.map(buildLesson);
