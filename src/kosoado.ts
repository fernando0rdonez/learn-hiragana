// Módulo "Kosoado" — これ・それ・あれ・どれ ("RE": pronombres, van solos) y
// この・その・あの・どの ("NO": siempre + sustantivo). Todo el vocabulario de
// contenido (sustantivos, poseedores) ya existe en src/vocabulary.ts —
// anclaje i+1, igual que Gramática (ver cabecera de src/grammar.ts). Mezcla
// dos tipos de ejercicio, como Gramática (order/particle): "order" construye
// la frase completa con fichas y "choice" fuerza decidir la forma correcta
// según la distancia. Progreso con SRS por ítem (como Honoríficos), no por
// lección completa, para que el pool pueda crecer sin alargar cada sesión —
// buildSessionQueue solo muestra los pendientes/nuevos.

import type { ProgressItems } from "./types";
import { kosoadoStatus } from "./utils";

export type KosoadoMode = "kosoado-re" | "kosoado-no";

/** Selección de tema en el setup: solo RE, solo NO, o ambos. */
export type KosoadoGameMode = "re" | "no" | "both";

export interface KosoadoChoiceExercise {
  id: string;
  type: "choice";
  mode: KosoadoMode;
  situation: string;   // contexto en español (distancia respecto a quien habla/escucha)
  sentence: string;    // frase con hueco "＿" donde va la forma kosoado
  answer: string;
  options: string[];   // incluye `answer`
  translation: string; // frase completa en español, mostrada al corregir
}

export interface KosoadoOrderExercise {
  id: string;
  type: "order";
  mode: KosoadoMode;
  tokens: string[];    // orden correcto; la UI los baraja para el usuario
  translation: string;
}

export type KosoadoExercise = KosoadoChoiceExercise | KosoadoOrderExercise;

export interface KosoadoDistanceRow {
  re: string;
  no: string;
  label: string;
  distance: string;
}

/** Tabla de referencia: qué forma usar según la distancia. Es la parte que
 *  de verdad hay que aprender — el resto (vocabulario, です/じゃないです/の)
 *  ya se enseña en otros módulos. */
export const KOSOADO_DISTANCE_TABLE: KosoadoDistanceRow[] = [
  { re: "これ", no: "この", label: "Cerca de mí",     distance: "El objeto está en tu mano o muy cerca de quien habla." },
  { re: "それ", no: "その", label: "Cerca de ti",      distance: "El objeto está cerca de la persona que escucha (lejos de mí)." },
  { re: "あれ", no: "あの", label: "Lejos de ambos",   distance: "El objeto está lejos de las dos personas (se ve a la distancia)." },
  { re: "どれ", no: "どの", label: "Pregunta: ¿cuál?", distance: "Se usa para preguntar, cuando no se sabe a cuál de varios objetos se refiere." },
];

export const KOSOADO_INTRO: Record<KosoadoMode, { title: string; text: string }> = {
  "kosoado-re": {
    title: "これ・それ・あれ・どれ — señalar sin nombrar",
    text: "Se usan SOLAS, reemplazando por completo al sustantivo: これはかばんです (\"Esto es una mochila\"). Nunca van pegadas a otro sustantivo — para eso existe この/その/あの/どの.",
  },
  "kosoado-no": {
    title: "この・その・あの・どの — siempre + sustantivo",
    text: "Se usan SIEMPRE antes de un sustantivo, como \"este/ese/aquel + cosa\": このかばん (\"esta mochila\"). El japonés no marca plural en el sustantivo — このかばん sirve igual para \"esta mochila\" y \"estas mochilas\" según el contexto. Cuando lo plural es una PERSONA (el dueño), se marca con たち: がくせいたち (\"los estudiantes\").",
  },
};

export const KOSOADO_EXERCISES: KosoadoExercise[] = [
  // ── これ・それ・あれ・どれ: elegir la forma (choice) ─────────────────────
  { id: "re-c-1",  type: "choice", mode: "kosoado-re", situation: "Tienes un libro en la mano y se lo muestras a tu amigo.", sentence: "＿はほんです", answer: "これ", options: ["これ", "それ", "あれ", "どれ"], translation: "Esto es un libro." },
  { id: "re-c-2",  type: "choice", mode: "kosoado-re", situation: "Tu amigo tiene una llave en la mano y se la señalas.", sentence: "＿はかぎです", answer: "それ", options: ["これ", "それ", "あれ", "どれ"], translation: "Eso es una llave." },
  { id: "re-c-3",  type: "choice", mode: "kosoado-re", situation: "Ves un reloj en la pared, lejos de ti y de tu amigo.", sentence: "＿はとけいです", answer: "あれ", options: ["これ", "それ", "あれ", "どれ"], translation: "Aquello es un reloj." },
  { id: "re-c-4",  type: "choice", mode: "kosoado-re", situation: "No sabes cuál de los tres bolígrafos sobre la mesa es el tuyo, y preguntas.", sentence: "＿があなたのですか", answer: "どれ", options: ["これ", "それ", "あれ", "どれ"], translation: "¿Cuál es el tuyo?" },
  { id: "re-c-5",  type: "choice", mode: "kosoado-re", situation: "Tienes un paraguas en la mano y le preguntas a tu amigo si es suyo.", sentence: "＿はあなたのかさですか", answer: "これ", options: ["これ", "それ", "あれ", "どれ"], translation: "¿Esto es tu paraguas?" },
  { id: "re-c-6",  type: "choice", mode: "kosoado-re", situation: "Tu amigo sostiene una cartera y le preguntas de quién es.", sentence: "＿はだれのさいふですか", answer: "それ", options: ["これ", "それ", "あれ", "どれ"], translation: "¿Esa cartera de quién es?" },
  { id: "re-c-7",  type: "choice", mode: "kosoado-re", situation: "Señalas un edificio muy lejano que ambos pueden ver.", sentence: "＿はがっこうです", answer: "あれ", options: ["これ", "それ", "あれ", "どれ"], translation: "Aquello es una escuela." },
  { id: "re-c-8",  type: "choice", mode: "kosoado-re", situation: "Hay varios diccionarios en el estante y preguntas cuál es el del profesor.", sentence: "＿がせんせいのですか", answer: "どれ", options: ["これ", "それ", "あれ", "どれ"], translation: "¿Cuál es el del profesor?" },
  { id: "re-c-9",  type: "choice", mode: "kosoado-re", situation: "Tienes tus propias gafas en la mano.", sentence: "＿はわたしのめがねです", answer: "これ", options: ["これ", "それ", "あれ", "どれ"], translation: "Estas son mis gafas." },
  { id: "re-c-10", type: "choice", mode: "kosoado-re", situation: "Tu amigo tiene un mapa en la mano.", sentence: "＿はちずです", answer: "それ", options: ["これ", "それ", "あれ", "どれ"], translation: "Eso es un mapa." },
  { id: "re-c-11", type: "choice", mode: "kosoado-re", situation: "Ven una silla al otro lado de la sala, lejos de los dos.", sentence: "＿はいすです", answer: "あれ", options: ["これ", "それ", "あれ", "どれ"], translation: "Aquella es una silla." },
  { id: "re-c-12", type: "choice", mode: "kosoado-re", situation: "Hay tres mochilas junto a la puerta y preguntas cuál es la del estudiante.", sentence: "＿ががくせいのですか", answer: "どれ", options: ["これ", "それ", "あれ", "どれ"], translation: "¿Cuál es la del estudiante?" },
  { id: "re-c-13", type: "choice", mode: "kosoado-re", situation: "Tienes un lápiz en la mano y dices que no es tuyo.", sentence: "＿はわたしのえんぴつじゃないです", answer: "これ", options: ["これ", "それ", "あれ", "どれ"], translation: "Este no es mi lápiz." },
  { id: "re-c-14", type: "choice", mode: "kosoado-re", situation: "Tu amigo sostiene un papel y le dices que eso no es tuyo.", sentence: "＿はわたしのじゃないです", answer: "それ", options: ["これ", "それ", "あれ", "どれ"], translation: "Eso no es mío." },
  { id: "re-c-15", type: "choice", mode: "kosoado-re", situation: "Ven un teléfono muy lejos, sobre un escritorio al fondo de la sala.", sentence: "＿はでんわです", answer: "あれ", options: ["これ", "それ", "あれ", "どれ"], translation: "Aquello es un teléfono." },
  { id: "re-c-16", type: "choice", mode: "kosoado-re", situation: "Hay tres cajas iguales sobre la mesa y preguntas cuál es la tuya.", sentence: "＿があなたのはこですか", answer: "どれ", options: ["これ", "それ", "あれ", "どれ"], translation: "¿Cuál caja es la tuya?" },

  // ── これ・それ・あれ・どれ: ordenar la frase (order) ──────────────────────
  { id: "re-o-1",  type: "order", mode: "kosoado-re", tokens: ["これ", "は", "ほん", "です"], translation: "Esto es un libro." },
  { id: "re-o-2",  type: "order", mode: "kosoado-re", tokens: ["それ", "は", "わたし", "の", "かさ", "です"], translation: "Eso es mi paraguas." },
  { id: "re-o-3",  type: "order", mode: "kosoado-re", tokens: ["あれ", "は", "がっこう", "です"], translation: "Aquello es una escuela." },
  { id: "re-o-4",  type: "order", mode: "kosoado-re", tokens: ["どれ", "が", "あなた", "の", "です", "か"], translation: "¿Cuál es el tuyo?" },
  { id: "re-o-5",  type: "order", mode: "kosoado-re", tokens: ["これ", "は", "わたし", "の", "めがね", "じゃない", "です"], translation: "Estas no son mis gafas." },
  { id: "re-o-6",  type: "order", mode: "kosoado-re", tokens: ["それ", "は", "がくせい", "の", "ほん", "です", "か"], translation: "¿Eso es el libro del estudiante?" },
  { id: "re-o-7",  type: "order", mode: "kosoado-re", tokens: ["あれ", "は", "せんせい", "の", "つくえ", "じゃない", "です"], translation: "Aquel no es el escritorio del profesor." },
  { id: "re-o-8",  type: "order", mode: "kosoado-re", tokens: ["どれ", "が", "せいと", "の", "かばん", "です", "か"], translation: "¿Cuál es la mochila del alumno?" },
  { id: "re-o-9",  type: "order", mode: "kosoado-re", tokens: ["これ", "は", "ともだち", "の", "かぎ", "です"], translation: "Esta es la llave de mi amigo." },
  { id: "re-o-10", type: "order", mode: "kosoado-re", tokens: ["それ", "は", "わたし", "の", "じゃない", "です"], translation: "Eso no es mío." },
  { id: "re-o-11", type: "order", mode: "kosoado-re", tokens: ["あれ", "は", "がくせいたち", "の", "きょうしつ", "です"], translation: "Aquella es el aula de los estudiantes." },
  { id: "re-o-12", type: "order", mode: "kosoado-re", tokens: ["どれ", "が", "わたし", "の", "かさ", "です", "か"], translation: "¿Cuál es mi paraguas?" },
  { id: "re-o-13", type: "order", mode: "kosoado-re", tokens: ["これ", "は", "せいとたち", "の", "じしょ", "じゃない", "です"], translation: "Este no es el diccionario de los alumnos." },
  { id: "re-o-14", type: "order", mode: "kosoado-re", tokens: ["それ", "は", "かのじょ", "の", "さいふ", "です"], translation: "Eso es la cartera de ella." },
  { id: "re-o-15", type: "order", mode: "kosoado-re", tokens: ["あれ", "は", "かれ", "の", "じてんしゃ", "です", "か"], translation: "¿Aquello es la bicicleta de él?" },
  { id: "re-o-16", type: "order", mode: "kosoado-re", tokens: ["これ", "は", "わたしたち", "の", "ちず", "です"], translation: "Este es nuestro mapa." },

  // ── この・その・あの・どの: elegir la forma (choice) ──────────────────────
  { id: "no-c-1",  type: "choice", mode: "kosoado-no", situation: "Señalas la mochila que tienes en las manos.", sentence: "＿かばんはわたしのです", answer: "この", options: ["この", "その", "あの", "どの"], translation: "Esta mochila es mía." },
  { id: "no-c-2",  type: "choice", mode: "kosoado-no", situation: "Tu amigo tiene un paraguas y hablas de él.", sentence: "＿かさはあなたのですか", answer: "その", options: ["この", "その", "あの", "どの"], translation: "¿Ese paraguas es tuyo?" },
  { id: "no-c-3",  type: "choice", mode: "kosoado-no", situation: "Hablas de un escritorio que está lejos, al fondo del aula.", sentence: "＿つくえはせんせいのです", answer: "あの", options: ["この", "その", "あの", "どの"], translation: "Aquel escritorio es del profesor." },
  { id: "no-c-4",  type: "choice", mode: "kosoado-no", situation: "Hay varios lápices sobre la mesa y preguntas cuál es del estudiante.", sentence: "＿えんぴつががくせいのですか", answer: "どの", options: ["この", "その", "あの", "どの"], translation: "¿Cuál lápiz es del estudiante?" },
  { id: "no-c-5",  type: "choice", mode: "kosoado-no", situation: "Tienes un libro en la mano y dices que no es tuyo.", sentence: "＿ほんはわたしのじゃないです", answer: "この", options: ["この", "その", "あの", "どの"], translation: "Este libro no es mío." },
  { id: "no-c-6",  type: "choice", mode: "kosoado-no", situation: "Tu amigo sostiene una llave; dices que esa llave es de los estudiantes.", sentence: "＿かぎはがくせいたちのです", answer: "その", options: ["この", "その", "あの", "どの"], translation: "Esa llave es de los estudiantes." },
  { id: "no-c-7",  type: "choice", mode: "kosoado-no", situation: "Hablas de unas gafas que están muy lejos, sobre un estante alto.", sentence: "＿めがねはだれのですか", answer: "あの", options: ["この", "その", "あの", "どの"], translation: "¿De quién son aquellas gafas?" },
  { id: "no-c-8",  type: "choice", mode: "kosoado-no", situation: "Hay tres sillas iguales y preguntas cuál silla es la tuya.", sentence: "＿いすがあなたのですか", answer: "どの", options: ["この", "その", "あの", "どの"], translation: "¿Cuál silla es la tuya?" },
  { id: "no-c-9",  type: "choice", mode: "kosoado-no", situation: "Tienes un reloj puesto y hablas de él.", sentence: "＿とけいはちちのです", answer: "この", options: ["この", "その", "あの", "どの"], translation: "Este reloj es de mi padre." },
  { id: "no-c-10", type: "choice", mode: "kosoado-no", situation: "Tu amigo tiene un diccionario y hablas de él.", sentence: "＿じしょはせんせいのじゃないです", answer: "その", options: ["この", "その", "あの", "どの"], translation: "Ese diccionario no es del profesor." },
  { id: "no-c-11", type: "choice", mode: "kosoado-no", situation: "Hablas de una caja que está lejos, al otro lado del cuarto.", sentence: "＿はこはともだちのです", answer: "あの", options: ["この", "その", "あの", "どの"], translation: "Aquella caja es de mi amigo." },
  { id: "no-c-12", type: "choice", mode: "kosoado-no", situation: "Hay varias carteras sobre la mesa y preguntas cuál es la de ella.", sentence: "＿さいふがかのじょのですか", answer: "どの", options: ["この", "その", "あの", "どの"], translation: "¿Cuál cartera es de ella?" },
  { id: "no-c-13", type: "choice", mode: "kosoado-no", situation: "Tienes un mapa en la mano y dices de quién es.", sentence: "＿ちずはがくせいのです", answer: "この", options: ["この", "その", "あの", "どの"], translation: "Este mapa es del estudiante." },
  { id: "no-c-14", type: "choice", mode: "kosoado-no", situation: "Tu amigo sostiene un teléfono y preguntas si es suyo.", sentence: "＿でんわはあなたのですか", answer: "その", options: ["この", "その", "あの", "どの"], translation: "¿Ese teléfono es tuyo?" },
  { id: "no-c-15", type: "choice", mode: "kosoado-no", situation: "Hablas de un aula que está lejos, al final del pasillo.", sentence: "＿きょうしつはせいとたちのです", answer: "あの", options: ["この", "その", "あの", "どの"], translation: "Aquella aula es de los alumnos." },
  { id: "no-c-16", type: "choice", mode: "kosoado-no", situation: "Hay tres bicicletas y preguntas cuál es la del profesor.", sentence: "＿じてんしゃがせんせいのですか", answer: "どの", options: ["この", "その", "あの", "どの"], translation: "¿Cuál bicicleta es la del profesor?" },

  // ── この・その・あの・どの: ordenar la frase (order) ──────────────────────
  { id: "no-o-1",  type: "order", mode: "kosoado-no", tokens: ["この", "かばん", "は", "わたし", "の", "です"], translation: "Esta mochila es mía." },
  { id: "no-o-2",  type: "order", mode: "kosoado-no", tokens: ["その", "かさ", "は", "わたし", "の", "です"], translation: "Ese paraguas es mío." },
  { id: "no-o-3",  type: "order", mode: "kosoado-no", tokens: ["あの", "つくえ", "は", "せんせい", "の", "です"], translation: "Aquel escritorio es del profesor." },
  { id: "no-o-4",  type: "order", mode: "kosoado-no", tokens: ["どの", "ペン", "が", "あなた", "の", "です", "か"], translation: "¿Cuál bolígrafo es el tuyo?" },
  { id: "no-o-5",  type: "order", mode: "kosoado-no", tokens: ["この", "かばん", "は", "がくせいたち", "の", "じゃない", "です"], translation: "Esta mochila no es de los estudiantes." },
  { id: "no-o-6",  type: "order", mode: "kosoado-no", tokens: ["その", "ほん", "は", "ともだち", "の", "です", "か"], translation: "¿Ese libro es de tu amigo?" },
  { id: "no-o-7",  type: "order", mode: "kosoado-no", tokens: ["あの", "かぎ", "は", "せいと", "の", "じゃない", "です"], translation: "Aquella llave no es del alumno." },
  { id: "no-o-8",  type: "order", mode: "kosoado-no", tokens: ["どの", "かばん", "が", "せいとたち", "の", "です", "か"], translation: "¿Cuál mochila es de los alumnos?" },
  { id: "no-o-9",  type: "order", mode: "kosoado-no", tokens: ["この", "めがね", "は", "ちち", "の", "です"], translation: "Estas gafas son de mi padre." },
  { id: "no-o-10", type: "order", mode: "kosoado-no", tokens: ["その", "じしょ", "は", "わたし", "の", "じゃない", "です"], translation: "Ese diccionario no es mío." },
  { id: "no-o-11", type: "order", mode: "kosoado-no", tokens: ["あの", "きょうしつ", "は", "がくせいたち", "の", "です"], translation: "Aquella aula es de los estudiantes." },
  { id: "no-o-12", type: "order", mode: "kosoado-no", tokens: ["どの", "いす", "が", "せんせい", "の", "です", "か"], translation: "¿Cuál silla es del profesor?" },
  { id: "no-o-13", type: "order", mode: "kosoado-no", tokens: ["この", "とけい", "は", "かれ", "の", "じゃない", "です"], translation: "Este reloj no es de él." },
  { id: "no-o-14", type: "order", mode: "kosoado-no", tokens: ["その", "さいふ", "は", "かのじょ", "の", "です"], translation: "Esa cartera es de ella." },
  { id: "no-o-15", type: "order", mode: "kosoado-no", tokens: ["あの", "じてんしゃ", "は", "せいとたち", "の", "です", "か"], translation: "¿Aquella bicicleta es de los alumnos?" },
  { id: "no-o-16", type: "order", mode: "kosoado-no", tokens: ["この", "はこ", "は", "ともだちたち", "の", "です"], translation: "Esta caja es de mis amigos." },
];

export function getKosoadoPool(modes: Set<KosoadoMode>): KosoadoExercise[] {
  if (modes.size === 0) return [];
  return KOSOADO_EXERCISES.filter((e) => modes.has(e.mode));
}

export function modesFor(mode: KosoadoGameMode): Set<KosoadoMode> {
  if (mode === "re") return new Set<KosoadoMode>(["kosoado-re"]);
  if (mode === "no") return new Set<KosoadoMode>(["kosoado-no"]);
  return new Set<KosoadoMode>(["kosoado-re", "kosoado-no"]);
}

export function kosoadoNotMasteredCount(progress: ProgressItems, modes: Set<KosoadoMode>): number {
  return getKosoadoPool(modes).filter((e) => kosoadoStatus(progress, e.mode, e.id) !== "mastered").length;
}

/** Frase completa (sin espacios) de un ejercicio ya resuelto — para el resumen y el TTS al corregir. */
export function kosoadoFullSentence(ex: KosoadoExercise): string {
  return ex.type === "order" ? ex.tokens.join("") : ex.sentence.replace("＿", ex.answer);
}
