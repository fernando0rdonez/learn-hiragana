// Juegos de la Fase 3 (docs/GRAMATICA_PLAN.md) que se derivan de las oraciones
// de src/grammar.ts sin datos nuevos:
//   - «Ordenar con palabras extra»: el ejercicio de ordenar + 1–2 fichas sobrantes.
//   - «Encuentra el error»: la oración con UNA ficha equivocada; hay que tocarla.
// Lógica pura (sin React) para poder testearla. «Pregunta → respuesta» vive en
// grammar.ts (necesita datos propios) y el dictado reutiliza grammarBuild.ts.

import type { GrammarOrderExercise, GrammarParticleExercise } from "./grammar";
import { forbiddenSwaps } from "./grammarBuild";

type Rng = () => number;

export interface GrammarExtraOrderExercise {
  type: "extra";
  tokens: string[];        // respuesta (orden canónico)
  extras: string[];        // fichas que sobran
  accept?: string[][];
  translation: string;
  sid?: number;
}

export interface GrammarSpotExercise {
  type: "spot";
  tokens: string[];        // la oración tal como se muestra (con el error)
  wrongIndex: number;      // posición de la ficha equivocada
  correct: string;         // lo que debería ir ahí
  correctTokens: string[]; // la oración corregida
  translation: string;
  sid?: number;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Fichas sobrantes: los distractores del hueco de la misma oración (ya elegidos para
 * ser incorrectos en ese lugar), sin los cambios que darían otra oración válida.
 */
export function toExtraOrder(
  order: GrammarOrderExercise,
  particle: GrammarParticleExercise | undefined,
  count = 2,
): GrammarExtraOrderExercise | null {
  if (!particle) return null;
  const forbidden = forbiddenSwaps(order.tokens, particle.alt);
  const candidates = particle.options.filter((o) => o !== particle.answer && !forbidden.has(o));
  // Primero los que no están ya en la oración (una ficha repetida no confunde tanto).
  const sorted = [...candidates.filter((o) => !order.tokens.includes(o)), ...candidates.filter((o) => order.tokens.includes(o))];
  const extras = sorted.slice(0, count);
  if (extras.length === 0) return null;
  return {
    type: "extra",
    tokens: order.tokens,
    extras,
    translation: order.translation,
    ...(order.accept ? { accept: order.accept } : {}),
    ...(order.sid !== undefined ? { sid: order.sid } : {}),
  };
}

/** Oración con la ficha del hueco cambiada por uno de sus distractores. */
export function toSpot(
  order: GrammarOrderExercise,
  particle: GrammarParticleExercise | undefined,
  rng: Rng = Math.random,
): GrammarSpotExercise | null {
  if (!particle?.parts) return null;
  const idx = particle.parts.indexOf("＿");
  const forbidden = forbiddenSwaps(order.tokens, particle.alt);
  const wrongs = particle.options.filter((o) => o !== particle.answer && !forbidden.has(o));
  if (idx === -1 || wrongs.length === 0) return null;
  const tokens = particle.parts.map((t, i) => (i === idx ? pick(wrongs, rng) : t));
  return {
    type: "spot",
    tokens,
    wrongIndex: idx,
    correct: particle.answer,
    correctTokens: particle.parts.map((t, i) => (i === idx ? particle.answer : t)),
    translation: order.translation,
    ...(order.sid !== undefined ? { sid: order.sid } : {}),
  };
}
