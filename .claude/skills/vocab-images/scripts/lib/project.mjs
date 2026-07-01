import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Walk up from this file until we find the repo's package.json.
// Keeps the skill relocatable instead of hardcoding "../../../..".
export function findProjectRoot() {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not locate project root (no package.json found above " + import.meta.url + ")");
    dir = parent;
  }
}

export const ROOT = findProjectRoot();
export const VOCAB_TS_PATH = path.join(ROOT, "src", "vocabulary.ts");
export const PROMPTS_DIR = path.join(ROOT, ".claude", "prompts");
export const SKILL_DIR = path.join(ROOT, ".claude", "skills", "vocab-images");
export const STATE_DIR = path.join(SKILL_DIR, "state");
export const DRAFTS_PATH = path.join(STATE_DIR, "drafts.json");
export const IMAGE_META_PATH = path.join(ROOT, "src", "generated", "vocab-image-meta.json");
// Under src/assets (not public/) so Vite's asset pipeline handles hashing and
// the GitHub Pages base path ('/learn-hiragana/') automatically via
// import.meta.glob in src/vocabImages.ts, instead of a hand-rolled URL.
export const IMAGES_OUT_DIR = path.join(ROOT, "src", "assets", "vocab-images");
