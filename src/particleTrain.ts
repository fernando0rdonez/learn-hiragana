// "Tren de partículas" (docs/GRAMATICA_PLAN.md): ayuda visual para recordar el
// orden de las partículas en una oración, tal como lo enseña el curso Básico II:
//   (tema)は → (tiempo)に → (compañía)と → (medio/lugar)で → (destino)へ | (objeto)を → VERBO
// Cada partícula tiene un color fijo que se usa en todos los ejercicios de gramática.

export interface ParticleColor {
  fg: string;
  bg: string;
}

export const PARTICLE_COLORS: Record<string, ParticleColor> = {
  "は":   { fg: "#3346A8", bg: "#E6E9FA" },
  "が":   { fg: "#B8336F", bg: "#FCE7F1" },
  "に":   { fg: "#B86200", bg: "#FFF0DC" },
  "から": { fg: "#8A6A00", bg: "#FBF3D5" },
  "まで": { fg: "#8A6A00", bg: "#FBF3D5" },
  "と":   { fg: "#0A7A5A", bg: "#E2F6EF" },
  "で":   { fg: "#6B34B0", bg: "#F0E8FB" },
  "へ":   { fg: "#0B7790", bg: "#E0F4F8" },
  "を":   { fg: "#C03A2B", bg: "#FDE9E6" },
  "の":   { fg: "#55606E", bg: "#EEF0F3" },
  "も":   { fg: "#2F6FD0", bg: "#E5EFFC" },
  "か":   { fg: "#7A6E99", bg: "#F1EEF7" },
};

export function particleColor(token: string): ParticleColor | null {
  return PARTICLE_COLORS[token] ?? null;
}

export interface TrainStation {
  particles: string[];   // partícula(s) de la estación; vacío = el verbo
  role: string;          // rol en la oración
  question: string;      // pregunta en español que responde
  ask: string;           // cómo se pregunta en japonés
  lessonIds: string[];   // lecciones que enseñan esta estación (para "desbloquearla")
  extra?: string;        // variante que viaja en la misma estación
}

export const PARTICLE_TRAIN: TrainStation[] = [
  { particles: ["は"], role: "Tema",      question: "¿de quién hablo?", ask: "〜は",        lessonIds: ["estructura-desu"] },
  { particles: ["に"], role: "Tiempo",    question: "¿cuándo?",         ask: "なんじに",     lessonIds: ["particula-ni", "kara-made"], extra: "から〜まで" },
  { particles: ["と"], role: "Compañía",  question: "¿con quién?",      ask: "だれと",       lessonIds: ["particula-to"] },
  { particles: ["で"], role: "Medio / lugar", question: "¿cómo? ¿dónde?", ask: "なにで・どこで", lessonIds: ["particula-de", "lugar-ni-he-de"] },
  { particles: ["へ", "を"], role: "Destino / objeto", question: "¿a dónde? / ¿qué?", ask: "どこへ・なにを", lessonIds: ["particula-he", "particula-wo"] },
  { particles: [], role: "Verbo",         question: "siempre al final", ask: "〜ます",       lessonIds: ["verbos-masu"] },
];

export const TRAIN_MNEMONIC =
  "«Wa-ni to de e/o»: わに es cocodrilo. El cocodrilo (は・に) va con… (と) en… (で) hacia… (へ) — o hace algo (を) — y el verbo siempre cierra el tren.";
