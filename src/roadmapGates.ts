// Codifica las puertas de salida de docs/ROADMAP.md como datos (BACKLOG #9).
// `target` es siempre el número/objetivo fijo del ROADMAP; `available` es lo
// que realmente existe hoy en los datos de contenido. Cuando `available <
// target`, el criterio está limitado por contenido pendiente (ver specs
// referenciadas en `note`), no por falta de estudio — RoadmapView distingue
// ambos casos.

import type { ProgressItems } from "./types";
import { ALL_CHARS } from "./data";
import { KATAKANA_ALL_CHARS } from "./dataKatakana";
import { VOCABULARY } from "./vocabulary";
import { KANJI } from "./kanji";
import { GRAMMAR_LESSONS } from "./grammar";
import { LISTENING_SENTENCES } from "./listening";
import { charStatus, vocabStatus, kanjiStatus, phoneticsAccuracy, grammarAccuracy, listeningAccuracyByLevel } from "./utils";

export interface GateResult {
  current: number;
  target: number;
  available: number;
  unit?: "count" | "%";
}

export interface GateCriterion {
  label: string;
  /** Por qué `available < target` hoy, o qué falta para que exista el dato. */
  note?: string;
  /** Ausente en criterios que no se pueden medir desde ProgressItems (autoevaluación, tutor…). */
  compute?: (progress: ProgressItems) => GateResult;
  /** Solo para criterios sin `compute`: qué debe autoevaluar el estudiante. */
  manualHint?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  level: string;
  duration: string;
  criteria: GateCriterion[];
}

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: "kana",
    title: "Fase 0 — Kana",
    level: "pre-A1",
    duration: "semanas 1–8",
    criteria: [
      {
        label: "Hiragana dominado (básico + dakuten + compuestos)",
        compute: (p) => ({
          current: ALL_CHARS.filter((c) => charStatus(p, c.kana) === "mastered").length,
          target: Math.ceil(ALL_CHARS.length * 0.95),
          available: ALL_CHARS.length,
        }),
      },
      {
        label: "Katakana dominado en reconocimiento",
        compute: (p) => ({
          current: KATAKANA_ALL_CHARS.filter((c) => charStatus(p, c.kana) === "mastered").length,
          target: Math.ceil(KATAKANA_ALL_CHARS.length * 0.9),
          available: KATAKANA_ALL_CHARS.length,
        }),
      },
      {
        label: "Fonética — ensordecimiento (% de acierto)",
        compute: (p) => ({ current: phoneticsAccuracy(p, "devoicing") ?? 0, target: 80, available: 100, unit: "%" }),
      },
      {
        label: "Fonética — alargamiento (% de acierto)",
        compute: (p) => ({ current: phoneticsAccuracy(p, "lengthening") ?? 0, target: 80, available: 100, unit: "%" }),
      },
      {
        label: "Leer una palabra de 3–4 kana en menos de 2 segundos sin romaji",
        manualHint: "Autoevalúa esto tú mismo: desactiva \"mostrar romaji\" y cronométrate.",
      },
    ],
  },
  {
    id: "fundamentos",
    title: "Fase 1 — Fundamentos",
    level: "A1 ≈ N5",
    duration: "meses 3–8",
    criteria: [
      {
        label: "Vocabulario N5 dominado",
        note: "faltan palabras por añadir — spec #3",
        compute: (p) => ({
          current: VOCABULARY.filter((w) => vocabStatus(p, w.hiragana) === "mastered").length,
          target: 800,
          available: VOCABULARY.length,
        }),
      },
      {
        label: "Kanji N5 dominado",
        compute: (p) => ({
          current: KANJI.filter((k) => kanjiStatus(p, k.kanji) === "mastered").length,
          target: 100,
          available: KANJI.length,
        }),
      },
      {
        label: "Gramática N5 — % de acierto en drills",
        compute: (p) => ({
          current: grammarAccuracy(p) ?? 0,
          target: 85,
          available: GRAMMAR_LESSONS.length > 0 ? 100 : 0,
          unit: "%",
        }),
      },
      {
        label: "Entender un audio N5 de ~1 min y responder 3 preguntas",
        manualHint: "Autoevaluación oral — fuera de lo que la app puede medir.",
      },
    ],
  },
  {
    id: "consolidacion",
    title: "Fase 2 — Consolidación",
    level: "A2 ≈ N4",
    duration: "meses 8–16",
    criteria: [
      {
        label: "Vocabulario acumulado dominado (N5 + N4)",
        note: "faltan ~700 palabras N4 — spec #13 pendiente",
        compute: (p) => ({
          current: VOCABULARY.filter((w) => vocabStatus(p, w.hiragana) === "mastered").length,
          target: 1500,
          available: VOCABULARY.length,
        }),
      },
      {
        label: "Kanji acumulado dominado (N5 + N4)",
        note: "faltan ~170 kanji N4 — aún no hay spec de Kanji N4 en BACKLOG",
        compute: (p) => ({
          current: KANJI.filter((k) => kanjiStatus(p, k.kanji) === "mastered").length,
          target: 300,
          available: KANJI.length,
        }),
      },
      {
        label: "Lectura N4 (~150 caracteres, ≥80% de preguntas)",
        note: "spec #8 pendiente — el módulo aún no existe",
        compute: () => ({ current: 0, target: 1, available: 0 }),
      },
      {
        label: "Dictado N4 — % de acierto",
        note: "requiere gramática y frases N4, aún no existen",
        compute: (p) => ({
          current: listeningAccuracyByLevel(p, "dictation", "N4") ?? 0,
          target: 75,
          available: LISTENING_SENTENCES.some((s) => s.level === "N4") ? 100 : 0,
          unit: "%",
        }),
      },
      {
        label: "Conversación de 5 min con tutor/intercambio",
        manualHint: "Fuera de la app — ver METODOLOGIA.md §2.8.",
      },
    ],
  },
  {
    id: "independencia",
    title: "Fase 3 — Independencia",
    level: "B1 ≈ N3",
    duration: "meses 16–28",
    criteria: [
      {
        label: "Vocabulario acumulado dominado (N5 + N4 + N3)",
        note: "faltan ~2.200 palabras N3 — aún no hay spec en BACKLOG",
        compute: (p) => ({
          current: VOCABULARY.filter((w) => vocabStatus(p, w.hiragana) === "mastered").length,
          target: 3700,
          available: VOCABULARY.length,
        }),
      },
      {
        label: "Kanji acumulado dominado (N5 + N4 + N3)",
        note: "faltan ~550 kanji N4/N3 — aún no hay spec en BACKLOG",
        compute: (p) => ({
          current: KANJI.filter((k) => kanjiStatus(p, k.kanji) === "mastered").length,
          target: 650,
          available: KANJI.length,
        }),
      },
      {
        label: "Lectura de párrafos N3 (con inferencia)",
        note: "spec #8 ampliado a N3, pendiente",
        compute: () => ({ current: 0, target: 1, available: 0 }),
      },
      {
        label: "Simulacro N3 ≥70% por sección",
        manualHint: "Fuera de la app — requiere un simulacro externo tipo JLPT.",
      },
      {
        label: "Leer una noticia de NHK Easy sin diccionario",
        manualHint: "Fuera de la app.",
      },
      {
        label: "Conversación de 15 min con hablante nativo",
        manualHint: "Fuera de la app — ver METODOLOGIA.md §2.8.",
      },
      {
        label: "Escribir un texto de ~200 caracteres",
        manualHint: "Fuera de la app.",
      },
    ],
  },
];

export type CriterionStatus = "upcoming" | "content-blocked" | "in-progress" | "met";

export function criterionStatus(result: GateResult): CriterionStatus {
  if (result.available === 0) return "upcoming";
  if (result.current >= result.target) return "met";
  if (result.available < result.target) return "content-blocked";
  return "in-progress";
}

/** Una fase se marca cumplida solo si todos sus criterios medibles llegan a su target real. */
export function phaseGateComplete(phase: RoadmapPhase, progress: ProgressItems): boolean {
  const computable = phase.criteria.filter((c): c is GateCriterion & { compute: NonNullable<GateCriterion["compute"]> } => !!c.compute);
  if (computable.length === 0) return false;
  return computable.every((c) => {
    const r = c.compute(progress);
    return r.current >= r.target;
  });
}
