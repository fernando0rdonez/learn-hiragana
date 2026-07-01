import fs from "node:fs";
import path from "node:path";
import { PROMPTS_DIR } from "./project.mjs";

const TEMPLATE_FILES = {
  concrete: "concrete.md",
  action: "action.md",
  symbolic: "symbolic.md",
};

// action.md's placeholder is "[ACTION_EN, e.g. "..."]" (includes an inline
// example), so it needs a wider regex than the plain "[WORD_EN]" /
// "[CONCEPT_EN]" tokens in the other two templates.
const PLACEHOLDER_PATTERNS = {
  concrete: /\[WORD_EN\]/,
  action: /\[ACTION_EN.*?\]/s,
  symbolic: /\[CONCEPT_EN\]/,
};

export function loadTemplate(visualType) {
  const file = TEMPLATE_FILES[visualType];
  if (!file) throw new Error(`No prompt template for visualType "${visualType}"`);
  return fs.readFileSync(path.join(PROMPTS_DIR, file), "utf8").trim();
}

export function buildPrompt(visualType, subject) {
  const template = loadTemplate(visualType);
  const pattern = PLACEHOLDER_PATTERNS[visualType];
  if (!pattern.test(template)) {
    throw new Error(`Template for "${visualType}" no longer has the expected placeholder — check .claude/prompts/`);
  }
  return template.replace(pattern, subject).replace(/\s+/g, " ").trim();
}
