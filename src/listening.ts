// Módulo Listening de frases completas (BACKLOG #7). Reutiliza las frases de
// "ordenar" del módulo Gramática (src/grammar.ts): ya están vetadas para usar
// solo vocabulario existente (anclaje i+1, METODOLOGIA §2.4) y ya traen su
// traducción al español, así que no hace falta un banco de frases aparte.
// Todas son de nivel N5 hoy (no existe aún gramática N4 en la app); el campo
// `level` queda listo para cuando #7 se amplíe con frases N4.

import { GRAMMAR_LESSONS } from "./grammar";

export type ListeningLevel = "N5" | "N4";

export interface ListeningSentence {
  id: string;
  kana: string;
  translation: string;
  level: ListeningLevel;
}

function buildListeningSentences(): ListeningSentence[] {
  const seen = new Set<string>();
  const sentences: ListeningSentence[] = [];
  for (const lesson of GRAMMAR_LESSONS) {
    let n = 0;
    for (const ex of lesson.exercises) {
      if (ex.type !== "order") continue;
      const kana = ex.tokens.join("");
      if (seen.has(kana)) continue; // algunas frases de ejemplo se repiten entre lecciones
      seen.add(kana);
      sentences.push({ id: `${lesson.id}-${n++}`, kana, translation: ex.translation, level: "N5" });
    }
  }
  return sentences;
}

export const LISTENING_SENTENCES: ListeningSentence[] = buildListeningSentences();
