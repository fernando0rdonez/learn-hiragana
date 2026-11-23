// "Order the train" game: practice the particle order taught by the course
// (topic は → time に → company と → means/place で → destination へ | object を → verb),
// see src/particleTrain.ts for the train itself.
//
// Three kinds of exercise:
//   - "stations": put the six train cars in order (shown as particles or as roles).
//   - "chunks":   put the phrase chunks of a sentence (e.g. 「ともだち と」) in train order.
//   - "choice":   role → particle ("¿con quién?" → と) or particle → role.
//
// Every sentence below is written for this game (not taken from the course PDFs) and
// has at most one chunk per train station, so the train order is the only answer.

import { PARTICLE_TRAIN } from "./particleTrain";

export type StationId = "topic" | "time" | "company" | "means" | "destObj" | "verb";

export interface Station {
  id: StationId;
  /** Label of the car when the exercise shows particles. */
  particle: string;
  /** Spanish role label shown to the learner. */
  role: string;
}

/** The six train cars in order, derived from PARTICLE_TRAIN so both stay in sync. */
const STATION_IDS: StationId[] = ["topic", "time", "company", "means", "destObj", "verb"];
export const STATIONS: Station[] = PARTICLE_TRAIN.map((st, i) => ({
  id: STATION_IDS[i],
  particle: st.particles.length ? st.particles.join("/") : "Verbo",
  role: st.role,
}));

/** Train station of a particle (に is taken as time here: it is the train's に car). */
export function stationOf(particle: string | null): StationId {
  switch (particle) {
    case "は": return "topic";
    case "に": case "から": case "まで": return "time";
    case "と": return "company";
    case "で": return "means";
    case "へ": case "を": return "destObj";
    default: return "verb";
  }
}

export interface TrainChunk {
  /** Space-separated tokens, e.g. "ともだち と" or "くじ から ごじ まで". */
  text: string;
  /** Particle that decides the station (null for the verb). */
  particle: string | null;
  /** Spanish role shown in the feedback (more specific than the station label). */
  role: string;
}

export interface TrainSentence {
  chunks: TrainChunk[];
  es: string;
}

const ROLE_BY_PARTICLE: Record<string, string> = {
  "は": "Tema",
  "に": "Tiempo",
  "から": "Desde… hasta",
  "と": "Compañía",
  "で": "Medio / lugar",
  "へ": "Destino",
  "を": "Objeto",
};

const PARTICLE_TOKENS = new Set(["は", "に", "と", "で", "へ", "を", "から", "まで"]);

/** Parse "わたし は | どようび に | … | いきます" into chunks. */
function sentence(jp: string, es: string): TrainSentence {
  const chunks = jp.split("|").map((raw) => {
    const text = raw.trim();
    const tokens = text.split(" ");
    // The first particle in the chunk decides its station ("くじ から ごじ まで" → から).
    const particle = tokens.find((t) => PARTICLE_TOKENS.has(t)) ?? null;
    return { text, particle, role: particle ? ROLE_BY_PARTICLE[particle] : "Verbo" };
  });
  return { chunks, es };
}

export const TRAIN_SENTENCES: TrainSentence[] = [
  sentence("わたし は | どようび に | ともだち と | でんしゃ で | うみ へ | いきます", "El sábado voy al mar en tren con un amigo."),
  sentence("あに は | しちじ に | バス で | がっこう へ | いきます", "Mi hermano mayor va a la escuela en autobús a las siete."),
  sentence("はは は | にちようび に | ちち と | デパート で | くつ を | かいます", "El domingo mi mamá compra zapatos en el centro comercial con mi papá."),
  sentence("けんさん は | はちじ に | うち で | あさごはん を | たべます", "Ken desayuna en casa a las ocho."),
  sentence("わたし は | きんようび に | せんせい と | にほんご で | はなします", "El viernes hablo en japonés con el profesor."),
  sentence("マリアさん は | ろくじ に | かぞく と | うち へ | かえります", "María vuelve a casa con su familia a las seis."),
  sentence("ともだち は | げつようび に | としょかん で | ほん を | よみます", "Mi amigo lee libros en la biblioteca el lunes."),
  sentence("いもうと は | さんじ に | ねこ と | にわ で | あそびます", "Mi hermana menor juega con el gato en el jardín a las tres."),
  sentence("わたし は | くじ から ごじ まで | かいしゃ で | はたらきます", "Trabajo en la empresa de nueve a cinco."),
  sentence("ちち は | すいようび に | くるま で | びょういん へ | いきます", "El miércoles mi papá va al hospital en carro."),
  sentence("ゆいさん は | じゅうじ に | ともだち と | こうえん で | テニス を | します", "Yui juega tenis en el parque con una amiga a las diez."),
  sentence("せんせい は | よじ に | ペン で | てがみ を | かきます", "El profesor escribe una carta con bolígrafo a las cuatro."),
  sentence("わたしたち は | なつやすみ に | ひこうき で | にほん へ | いきます", "En las vacaciones de verano vamos a Japón en avión."),
  sentence("あね は | しちじ に | ともだち と | レストラン で | ばんごはん を | たべます", "Mi hermana mayor cena en un restaurante con una amiga a las siete."),
  sentence("おとうと は | にちようび に | じてんしゃ で | こうえん へ | いきます", "El domingo mi hermano menor va al parque en bicicleta."),
  sentence("わたし は | にじ から よじ まで | ともだち と | きっさてん で | はなします", "Hablo con un amigo en la cafetería de dos a cuatro."),
];

// ── Exercises ──────────────────────────────────────────────────────────────

export interface OrderCard {
  /** Text on the chip. */
  label: string;
  /** Particle used to color the chip (null = neutral). */
  particle: string | null;
  /** Role shown under the chip once answered. */
  role: string;
}

export interface TrainOrderExercise {
  type: "stations" | "chunks";
  /** Cards in the correct order. */
  cards: OrderCard[];
  /** "particles" | "roles" for stations; the sentence translation for chunks. */
  variant?: "particles" | "roles";
  translation?: string;
  /** Sentence to speak after answering (chunks only). */
  speech?: string;
}

export interface TrainChoiceExercise {
  type: "choice";
  variant: "roleToParticle" | "particleToRole";
  prompt: string;
  /** Particle shown in the prompt (particleToRole) — used for its color. */
  promptParticle?: string;
  options: string[];
  answer: string;
  why: string;
}

export type TrainExercise = TrainOrderExercise | TrainChoiceExercise;

/** Role questions for "role → particle". `exclude` drops options that would also be right. */
const ROLE_QUESTIONS: { q: string; answer: string; why: string; exclude?: string[] }[] = [
  { q: "¿De quién hablo? (el tema)", answer: "は", why: "は marca el tema y abre el tren: わたし は…" },
  { q: "¿Cuándo? (una hora o un día)", answer: "に", why: "に marca el tiempo: しちじ に, どようび に." },
  { q: "¿Con quién?", answer: "と", why: "と marca la compañía: ともだち と." },
  { q: "¿Con qué? ¿En qué medio?", answer: "で", why: "で marca el medio: バス で, はし で, にほんご で." },
  { q: "¿Dónde ocurre la acción?", answer: "で", why: "で marca el lugar donde se hace algo: としょかん で よみます." },
  { q: "¿A dónde voy?", answer: "へ", why: "へ marca el destino: がっこう へ いきます. (に también vale, por eso no está entre las opciones).", exclude: ["に"] },
  { q: "¿Qué? (el objeto del verbo)", answer: "を", why: "を marca el objeto: ほん を よみます." },
];

const PARTICLE_QUESTIONS: { particle: string; answer: string; why: string; exclude?: string[] }[] = [
  { particle: "は", answer: "Tema", why: "は: ¿de quién hablo? Es el primer vagón." },
  { particle: "に", answer: "Tiempo", why: "En el tren, に es el vagón del tiempo (¿cuándo?).", exclude: ["Destino"] },
  { particle: "と", answer: "Compañía", why: "と: ¿con quién?" },
  { particle: "で", answer: "Medio / lugar", why: "で: ¿con qué? o ¿dónde se hace?" },
  { particle: "へ", answer: "Destino", why: "へ: ¿a dónde?" },
  { particle: "を", answer: "Objeto", why: "を: ¿qué? Va justo antes del verbo." },
];

const ROLE_OPTIONS = ["Tema", "Tiempo", "Compañía", "Medio / lugar", "Destino", "Objeto"];
const PARTICLE_OPTIONS = ["は", "に", "と", "で", "へ", "を"];

export type Rng = () => number;

export function shuffle<T>(arr: T[], rng: Rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function stationsExercise(variant: "particles" | "roles"): TrainOrderExercise {
  return {
    type: "stations",
    variant,
    cards: STATIONS.map((st) => {
      const particle = st.id === "verb" ? null : st.particle.split("/")[0];
      return { label: variant === "particles" ? st.particle : st.role, particle, role: st.role };
    }),
  };
}

export function chunksExercise(s: TrainSentence): TrainOrderExercise {
  return {
    type: "chunks",
    cards: s.chunks.map((c) => ({ label: c.text, particle: c.particle, role: c.role })),
    translation: s.es,
    speech: s.chunks.map((c) => c.text.replace(/ /g, "")).join(""),
  };
}

export function choiceExercises(rng: Rng = Math.random): TrainChoiceExercise[] {
  const toParticle = ROLE_QUESTIONS.map((r): TrainChoiceExercise => ({
    type: "choice",
    variant: "roleToParticle",
    prompt: r.q,
    options: shuffle(PARTICLE_OPTIONS.filter((p) => !r.exclude?.includes(p)), rng),
    answer: r.answer,
    why: r.why,
  }));
  const toRole = PARTICLE_QUESTIONS.map((p): TrainChoiceExercise => ({
    type: "choice",
    variant: "particleToRole",
    prompt: p.particle,
    promptParticle: p.particle,
    options: shuffle(ROLE_OPTIONS.filter((o) => !p.exclude?.includes(o)), rng),
    answer: p.answer,
    why: p.why,
  }));
  return [...toParticle, ...toRole];
}

export const TRAIN_SESSION_SIZE = 10;

/**
 * A session: the first exercise always builds the whole train (so the learner sees it once),
 * then a mix of one more train build, sentence chunks and role questions.
 */
export function buildTrainSession(rng: Rng = Math.random, size = TRAIN_SESSION_SIZE): TrainExercise[] {
  const firstVariant = rng() < 0.5 ? "particles" : "roles";
  const first = stationsExercise(firstVariant);
  const secondTrain = stationsExercise(firstVariant === "particles" ? "roles" : "particles");
  const chunkCount = Math.max(0, Math.min(5, size - 4));
  const chunks = shuffle(TRAIN_SENTENCES, rng).slice(0, chunkCount).map(chunksExercise);
  const choices = shuffle(choiceExercises(rng), rng).slice(0, Math.max(0, size - 2 - chunkCount));
  return [first, ...shuffle<TrainExercise>([secondTrain, ...chunks, ...choices], rng)].slice(0, size);
}

/** Indexes (into `placed`) of cards that are not in their train position. */
export function misplaced(placed: OrderCard[], expected: OrderCard[]): number[] {
  return placed.flatMap((c, i) => (c.label === expected[i]?.label ? [] : [i]));
}
