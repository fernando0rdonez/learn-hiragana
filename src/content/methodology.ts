// Copy estático de "Cómo estudiar" — ver docs/METODOLOGIA.md y docs/ROADMAP.md (fuente de verdad).
// Esta vista es meta-contenido sobre la app: no lee ni escribe ProgressItems (BACKLOG #12).

export interface GoalStat {
  label: string;
  value: string;
}

export const GOAL: {
  intro: string;
  stats: GoalStat[];
  rule: string;
} = {
  intro:
    "La meta es comprensión y producción de japonés a nivel B1 del MCER — aproximadamente el JLPT N3: entender conversaciones cotidianas a velocidad casi natural, leer textos sencillos sobre temas familiares y expresarte sobre experiencias, planes y opiniones simples.",
  stats: [
    { label: "Horas necesarias", value: "900–1.300 h (hispanohablante)" },
    { label: "Ritmo con 45–60 min/día", value: "24–30 meses" },
    { label: "Ritmo con 90 min/día", value: "~18 meses" },
  ],
  rule:
    "Regla de oro: la constancia diaria vale más que las sesiones largas. 45 min × 7 días rinde más que 5 h el domingo.",
};

export interface Principle {
  title: string;
  body: string;
}

export const PRINCIPLES: Principle[] = [
  {
    title: "Repetición espaciada (SRS)",
    body:
      "Cada palabra o carácter se repasa justo antes de que lo olvides. Los repasos vencidos van siempre primero, antes que material nuevo — si un día solo hay 15 minutos, se hacen solo repasos.",
  },
  {
    title: "Recuerdo activo",
    body:
      "Recuperar de memoria fija más que releer. Por eso todo en la app es quiz: primero se pregunta, después se muestra la respuesta con contexto.",
  },
  {
    title: "Reconocimiento antes que producción",
    body:
      "Para cada palabra nueva, el orden es: reconocer (ver el japonés y elegir el significado) → escuchar (oír e identificar) → producir (escribir/deletrear en kana). No se exige escribir algo que aún no se reconoce con fiabilidad.",
  },
  {
    title: "Sesiones cortas y mezcladas",
    body:
      "Sesiones de 10–20 ítems, con categorías mezcladas dentro de cada sesión. Mejor alternar módulos entre días (kana / vocabulario / gramática) que semanas enteras de un solo tema.",
  },
];

export interface RoutineBlock {
  block: string;
  time: string;
  what: string;
}

export const DAILY_ROUTINE: {
  totalTime: string;
  blocks: RoutineBlock[];
  rules: string[];
} = {
  totalTime: "45–60 min/día",
  blocks: [
    { block: "1. Repasos SRS", time: "15–20 min", what: "Todos los ítems vencidos de todos los módulos" },
    { block: "2. Material nuevo", time: "15–20 min", what: "5–10 ítems nuevos de vocabulario/kanji/gramática" },
    { block: "3. Oído y boca", time: "10 min", what: "Escuchar y repetir en voz alta (shadowing)" },
    { block: "4. Lectura", time: "5–10 min", what: "Releer frases o pasajes ya vistos" },
  ],
  rules: [
    "Nunca te saltes el bloque 1 — es lo único innegociable del día.",
    "Si un día no hay tiempo: solo bloque 1 (mantiene la racha y la retención).",
    "Máximo ~10 palabras nuevas/día: más que eso satura la cola de repasos en 10 días.",
  ],
};

export interface SkillCoverage {
  skill: string;
  inApp: string;
  outsideApp: string;
}

export const SKILLS_COVERAGE: SkillCoverage[] = [
  {
    skill: "Leer",
    inApp: "Kana, vocabulario, kanji, lecturas graduadas",
    outsideApp: "Graded readers (Tadoku nivel 0–2), NHK News Web Easy",
  },
  {
    skill: "Escuchar",
    inApp: "Audio de palabra/frase, dictado",
    outsideApp:
      "Podcasts para aprendices (Nihongo con Teppei, japonés con historias); anime/dramas con subtítulos japoneses",
  },
  {
    skill: "Escribir",
    inApp: "Deletreo en kana",
    outsideApp: "Diario de 2–3 frases/día desde el principio; corrección con tutor o apps de intercambio",
  },
  {
    skill: "Hablar",
    inApp: "No cubierta",
    outsideApp:
      "Imprescindible: shadowing (repetir en voz alta tras el audio) desde el día 1; intercambio (HelloTalk/Tandem); tutor (italki) 1×/semana",
  },
];

export const HONESTY_NOTE =
  "Una app de drills como esta lleva sola hasta ~A2 en comprensión; el salto real a B1 exige producción oral fuera de la app. Ser honestos con esto es parte del método — la app te guía y mide, pero no puede fingir que lo cubre todo.";

export interface PhaseSummary {
  phase: string;
  level: string;
  focus: string;
}

export const PHASES: PhaseSummary[] = [
  { phase: "0 — Kana", level: "pre-A1", focus: "Hiragana, katakana y fonética básica" },
  { phase: "1 — Fundamentos", level: "A1 ≈ N5", focus: "800 palabras, ~100 kanji, gramática N5" },
  { phase: "2 — Consolidación", level: "A2 ≈ N4", focus: "1.500 palabras, ~300 kanji, oraciones y párrafos" },
  { phase: "3 — Independencia", level: "B1 ≈ N3", focus: "3.700 palabras, ~650 kanji, producción" },
];
