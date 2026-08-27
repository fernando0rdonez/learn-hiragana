// Banco de preguntas del "Examen del curso" — repaso general de japonés básico.
// Cada generador produce preguntas ALEATORIAS en cada llamada, reutilizando los
// datos y conversores que ya viven en los módulos de la app — aquí no se
// duplica contenido, solo se re-empaqueta como preguntas de examen.

import { ALL_CHARS, type ViewName } from "../data";
import { numberToKana } from "../numbers";
import { randomEntry, entryToKana, formatEntry, type ContentType } from "../dateTime";
import { PHONETIC_WORDS } from "../phonetics";
import { PHRASES } from "../phrases";
import { GRAMMAR_LESSONS, type GrammarOrderExercise, type GrammarParticleExercise } from "../grammar";
import { VOCABULARY } from "../vocabulary";
import { HONORIFIC_EXERCISES } from "../honorifics";

export type ExamTopic =
  | "escritura"
  | "fonetica"
  | "presentacion"
  | "estado-de-ser"
  | "honorificos"
  | "pronombres-familia"
  | "particulas"
  | "numeros"
  | "fechas-horas"
  | "traduccion";

export const EXAM_TOPICS: ExamTopic[] = [
  "escritura", "fonetica", "presentacion", "estado-de-ser", "honorificos",
  "pronombres-familia", "particulas", "numeros", "fechas-horas", "traduccion",
];

export const EXAM_TOPIC_LABEL: Record<ExamTopic, string> = {
  "escritura": "Escritura (hiragana)",
  "fonetica": "Fonética",
  "presentacion": "Presentación y saludos",
  "estado-de-ser": "Estado de ser (です)",
  "honorificos": "Trato y honoríficos",
  "pronombres-familia": "Pronombres y familia",
  "particulas": "Partículas",
  "numeros": "Números",
  "fechas-horas": "Fechas y horas",
  "traduccion": "Traducción de frases",
};

/** Reparto de preguntas por tema para un examen de 40. Editable. */
export const EXAM_TOPIC_WEIGHTS: Record<ExamTopic, number> = {
  "escritura": 5,
  "fonetica": 4,
  "presentacion": 4,
  "estado-de-ser": 4,
  "honorificos": 4,
  "pronombres-familia": 5,
  "particulas": 4,
  "numeros": 4,
  "fechas-horas": 4,
  "traduccion": 2,
};

/**
 * Los módulos de práctica que alimentan el examen (deduplicados, para mostrar en
 * Inicio con una estrella y en la portada del examen). Katakana, Kanji y Listening
 * NO entran en el examen del curso.
 */
export const EXAM_MODULES: { label: string; view: ViewName }[] = [
  { label: "Hiragana", view: "hiraganaSetup" },
  { label: "Vocabulario", view: "vocabCategory" },
  { label: "Números", view: "numberSetup" },
  { label: "Frases", view: "phraseSetup" },
  { label: "Gramática", view: "grammarSetup" },
  { label: "Fechas y Horas", view: "dateTimeSetup" },
  { label: "Fonética", view: "phoneticSetup" },
  { label: "Trato y Honoríficos", view: "honorificsSetup" },
];

/** El módulo de setup al que enlaza el botón "Repasar" del informe. */
export const EXAM_TOPIC_REVIEW_VIEW: Record<ExamTopic, ViewName> = {
  "escritura": "hiraganaSetup",
  "fonetica": "phoneticSetup",
  "presentacion": "phraseSetup",
  "estado-de-ser": "grammarSetup",
  "honorificos": "honorificsSetup",
  "pronombres-familia": "vocabCategory",
  "particulas": "grammarSetup",
  "numeros": "numberSetup",
  "fechas-horas": "dateTimeSetup",
  "traduccion": "grammarSetup",
};

export interface ExamQuestion {
  id: string;
  topic: ExamTopic;
  prompt: string;                 // enunciado en español
  answer: string;                 // respuesta canónica
  accepted?: string[];            // variantes válidas además de `answer`
  kind: "text" | "tokens";        // "tokens" = ordenar fichas
  tokens?: string[];              // orden correcto (kind: "tokens")
  hint?: string;                  // pista opcional
  showKanaDiff?: boolean;         // el informe pinta el diff kana-a-kana
}

// ── Utilidades de azar ──────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** `n` elementos distintos si los hay; si no, rellena permitiendo repetición. */
function sample<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return [];
  const s = shuffle(arr);
  if (s.length >= n) return s.slice(0, n);
  const out = [...s];
  while (out.length < n) out.push(pick(arr));
  return out;
}

// ── Generadores por tema ────────────────────────────────────────────────────

function genEscritura(n: number): ExamQuestion[] {
  return sample(ALL_CHARS, n).map((c, i) => {
    const kanaToRomaji = i % 2 === 0;
    return kanaToRomaji
      ? {
          id: `escritura-r-${i}-${c.kana}`,
          topic: "escritura" as const,
          prompt: `Escribe en rōmaji: ${c.kana}`,
          answer: c.romaji,
          accepted: c.accept,
          kind: "text" as const,
        }
      : {
          id: `escritura-k-${i}-${c.kana}`,
          topic: "escritura" as const,
          prompt: `Escribe en hiragana: ${c.romaji}`,
          answer: c.kana,
          kind: "text" as const,
        };
  });
}

function genFonetica(n: number): ExamQuestion[] {
  return sample(PHONETIC_WORDS, n).map((e, i) => {
    if (e.phenomenon === "pitch") {
      const gloss = (e.meaning ?? "").split("·").pop()?.trim() ?? "";
      return {
        id: `fonetica-p-${i}-${e.id}`,
        topic: "fonetica" as const,
        prompt: `La palabra ${e.kana}, pronunciada «${e.spoken}», significa… (una palabra en español)`,
        answer: gloss,
        kind: "text" as const,
        hint: e.note,
      };
    }
    if (e.phenomenon === "lengthening") {
      return {
        id: `fonetica-l-${i}-${e.id}`,
        topic: "fonetica" as const,
        prompt: `Escribe cómo suena realmente «${e.written}» (${e.kana}), con la vocal larga en doble letra:`,
        answer: e.spoken,
        accepted: [e.written, e.spoken.replace(/(.)\1/, "$1")],
        kind: "text" as const,
        hint: e.note,
      };
    }
    // devoicing
    return {
      id: `fonetica-d-${i}-${e.id}`,
      topic: "fonetica" as const,
      prompt: `Escribe cómo suena «${e.written}» (${e.kana}) al hablar, sin la vocal muda:`,
      answer: e.spoken,
      kind: "text" as const,
      hint: e.note,
    };
  });
}

function genPresentacion(n: number): ExamQuestion[] {
  const saludos = PHRASES.filter((p) => p.category === "saludos");
  return sample(saludos, n).map((p, i) => ({
    id: `presentacion-${i}-${p.id}`,
    topic: "presentacion" as const,
    prompt: `Escribe en hiragana: «${p.romaji}» (${p.meaning})`,
    answer: p.kana,
    kind: "text" as const,
  }));
}

const ESTADO_SUBJECTS: { es: string; ja: string; pres: string; past: string }[] = [
  { es: "Yo", ja: "わたし", pres: "soy", past: "era" },
  { es: "Tú", ja: "あなた", pres: "eres", past: "eras" },
  { es: "Él", ja: "かれ", pres: "es", past: "era" },
  { es: "Ella", ja: "かのじょ", pres: "es", past: "era" },
];
const ESTADO_NOUNS: { es: string; ja: string }[] = [
  { es: "estudiante", ja: "がくせい" },
  { es: "profesor/a", ja: "せんせい" },
  { es: "médico/a", ja: "いしゃ" },
  { es: "empleado/a de empresa", ja: "かいしゃいん" },
];

function genEstadoDeSer(n: number): ExamQuestion[] {
  const forms = ["afirm", "pasado", "neg", "negPasado"] as const;
  return Array.from({ length: n }, (_, i) => {
    const s = pick(ESTADO_SUBJECTS);
    const nn = pick(ESTADO_NOUNS);
    const form = forms[i % forms.length];
    const base = `${s.ja}は${nn.ja}`;
    switch (form) {
      case "afirm":
        return {
          id: `estado-${i}-a`, topic: "estado-de-ser" as const,
          prompt: `Traduce al japonés: «${s.es} ${s.pres} ${nn.es}.»`,
          answer: `${base}です`, kind: "text" as const,
        };
      case "pasado":
        return {
          id: `estado-${i}-p`, topic: "estado-de-ser" as const,
          prompt: `Traduce al japonés: «${s.es} ${s.past} ${nn.es}.»`,
          answer: `${base}でした`, kind: "text" as const,
        };
      case "neg":
        return {
          id: `estado-${i}-n`, topic: "estado-de-ser" as const,
          prompt: `Traduce al japonés (forma formal): «${s.es} no ${s.pres} ${nn.es}.»`,
          answer: `${base}ではありません`,
          accepted: [`${base}じゃないです`, `${base}じゃありません`],
          kind: "text" as const,
        };
      default:
        return {
          id: `estado-${i}-np`, topic: "estado-de-ser" as const,
          prompt: `Traduce al japonés (forma formal): «${s.es} no ${s.past} ${nn.es}.»`,
          answer: `${base}ではありませんでした`,
          accepted: [`${base}じゃなかったです`, `${base}じゃありませんでした`],
          kind: "text" as const,
        };
    }
  });
}

function genHonorificos(n: number): ExamQuestion[] {
  return sample(HONORIFIC_EXERCISES, n).map((e, i) => ({
    id: `honorificos-${i}-${e.id}`,
    topic: "honorificos" as const,
    prompt: `${e.situation} Escribe la palabra correcta en hiragana.`,
    answer: e.answer,
    kind: "text" as const,
    hint: e.note,
  }));
}

function genPronombresFamilia(n: number): ExamQuestion[] {
  const pool = VOCABULARY.filter(
    (w) =>
      (w.category === "pronombres" || w.category === "familia") &&
      !w.meaning.includes("(") &&
      !w.meaning.includes("+"),
  );
  return sample(pool, n).map((w, i) => ({
    id: `pronfam-${i}-${w.hiragana}`,
    topic: "pronombres-familia" as const,
    prompt: `Escribe en hiragana: «${w.meaning}»`,
    answer: w.hiragana,
    kind: "text" as const,
  }));
}

function genParticulas(n: number): ExamQuestion[] {
  const all = GRAMMAR_LESSONS.flatMap((l) =>
    (l.exercises.filter((ex) => ex.type === "particle") as GrammarParticleExercise[])
      .map((ex) => ({ ...ex, lessonId: l.id })),
  );
  return sample(all, n).map((ex, i) => ({
    id: `particulas-${i}-${ex.lessonId}`,
    topic: "particulas" as const,
    prompt: `Completa con la partícula correcta (escríbela): ${ex.sentence.replace("＿", "（＿）")}`,
    answer: ex.answer,
    kind: "text" as const,
    hint: ex.translation,
  }));
}

function genNumeros(n: number): ExamQuestion[] {
  return Array.from({ length: n }, (_, i) => {
    const bucket = i % 3;
    const value =
      bucket === 0 ? randInt(11, 99) :
      bucket === 1 ? pick([300, 600, 800, randInt(100, 999)]) :
      randInt(1000, 9999);
    return {
      id: `numeros-${i}-${value}`,
      topic: "numeros" as const,
      prompt: `Escribe este número en hiragana: ${value}`,
      answer: numberToKana(value),
      kind: "text" as const,
      showKanaDiff: true,
    };
  });
}

function genFechasHoras(n: number): ExamQuestion[] {
  const types: ContentType[] = ["hora", "fecha", "fechaHora"];
  return Array.from({ length: n }, (_, i) => {
    const ct = types[i % types.length];
    const entry = randomEntry(ct, "full");
    return {
      id: `fechashoras-${i}-${ct}`,
      topic: "fechas-horas" as const,
      prompt: `Escribe en hiragana: ${formatEntry(ct, entry)}`,
      answer: entryToKana(ct, entry),
      kind: "text" as const,
      showKanaDiff: true,
    };
  });
}

function genTraduccion(n: number): ExamQuestion[] {
  const all = GRAMMAR_LESSONS.flatMap((l) =>
    (l.exercises.filter((ex) => ex.type === "order") as GrammarOrderExercise[])
      .map((ex) => ({ ...ex, lessonId: l.id })),
  );
  return sample(all, n).map((ex, i) => ({
    id: `traduccion-${i}-${ex.lessonId}`,
    topic: "traduccion" as const,
    prompt: `Ordena las fichas para traducir: «${ex.translation}»`,
    answer: ex.tokens.join(" "),
    tokens: ex.tokens,
    kind: "tokens" as const,
  }));
}

const GENERATORS: Record<ExamTopic, (n: number) => ExamQuestion[]> = {
  "escritura": genEscritura,
  "fonetica": genFonetica,
  "presentacion": genPresentacion,
  "estado-de-ser": genEstadoDeSer,
  "honorificos": genHonorificos,
  "pronombres-familia": genPronombresFamilia,
  "particulas": genParticulas,
  "numeros": genNumeros,
  "fechas-horas": genFechasHoras,
  "traduccion": genTraduccion,
};

/** Reparte `count` preguntas entre los temas según EXAM_TOPIC_WEIGHTS. */
function topicCounts(count: number): Record<ExamTopic, number> {
  const totalWeight = EXAM_TOPICS.reduce((s, t) => s + EXAM_TOPIC_WEIGHTS[t], 0);
  const raw = EXAM_TOPICS.map((t) => ({ t, exact: (EXAM_TOPIC_WEIGHTS[t] / totalWeight) * count }));
  const out = {} as Record<ExamTopic, number>;
  let assigned = 0;
  for (const { t, exact } of raw) {
    out[t] = Math.max(1, Math.floor(exact));
    assigned += out[t];
  }
  // Ajuste del residuo por parte fraccionaria.
  const order = [...raw].sort((a, b) => (b.exact % 1) - (a.exact % 1)).map((x) => x.t);
  let idx = 0;
  while (assigned < count) { out[order[idx % order.length]] += 1; assigned++; idx++; }
  while (assigned > count) {
    const t = order[order.length - 1 - (idx % order.length)];
    if (out[t] > 1) { out[t] -= 1; assigned--; }
    idx++;
  }
  return out;
}

export function buildExam(count = 40): ExamQuestion[] {
  const counts = topicCounts(count);
  const questions = EXAM_TOPICS.flatMap((t) => GENERATORS[t](counts[t]));
  return shuffle(questions);
}
