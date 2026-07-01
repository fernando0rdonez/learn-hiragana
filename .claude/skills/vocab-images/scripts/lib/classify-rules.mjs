// Mirrors reference/category-mapping.md — keep both in sync if this changes.
export const CATEGORY_VISUAL_TYPE = {
  numeros: { visualType: "concrete" },
  comida: { visualType: "concrete" },
  animales: { visualType: "concrete" },
  lugares: { visualType: "concrete" },
  transporte: { visualType: "concrete" },
  objetos: { visualType: "concrete" },
  ropa: { visualType: "concrete" },
  naturaleza: { visualType: "concrete" },
  casa: { visualType: "concrete" },
  cuerpo: { visualType: "concrete" },
  familia: {
    visualType: "concrete",
    reviewNote:
      "Necesita ancla visual que distinga el miembro de familia (mamá/papá/abuela/abuelo/hermano mayor/menor). Revisar antes de aprobar.",
  },
  colores: {
    visualType: "concrete",
    reviewNote: "Swatch/objeto sólido del color, no arte abstracto. Revisar antes de aprobar.",
  },
  verbos: { visualType: "action" },
  tiempo: { visualType: "symbolic" },
  cantidades: { visualType: "symbolic" },
  adjetivos: { visualType: "symbolic" },
  pronombres: { visualType: "symbolic" },
  preguntas: { visualType: "symbolic" },
  saludos: {
    visualType: "needs_review",
    reviewNote:
      'Action/Symbolic mixto — revisar caso por caso (ej: "gracias" = manos juntas + corazón; "hola" = mano saludando).',
  },
  misc: {
    visualType: "needs_review",
    reviewNote: "Mixto — dinero, trabajo y música son concrete; el resto varía. Revisar caso por caso.",
  },
};

// Composite key: hiragana alone is not unique in vocabulary.ts (e.g. "はな"
// is both "flor"/naturaleza and "nariz"/cuerpo), so hiragana+category is used
// everywhere as the identity for a vocab entry.
export function draftKey(word) {
  return `${word.hiragana}::${word.category}`;
}

// Per-word overrides for cases where the category-level default isn't safe
// to auto-draft even though the visualType itself is right. See
// reference/action-fewshot.md's "Flagged" section for why.
const WORD_OVERRIDES = {
  [draftKey({ hiragana: "みる", category: "verbos" })]: {
    reviewNote:
      'Demasiado genérico ("watching" aplica a casi cualquier escena). No auto-generar el subject desde few-shot — pedir al usuario un prop de ancla específico primero.',
  },
};

export function classifyCategory(word) {
  const rule = CATEGORY_VISUAL_TYPE[word.category];
  if (!rule) {
    return { visualType: "needs_review", reviewNote: `Categoría "${word.category}" no está en el mapeo — revisar manualmente.` };
  }
  const override = WORD_OVERRIDES[draftKey(word)];
  return override ? { ...rule, ...override } : rule;
}
