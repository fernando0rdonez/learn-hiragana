import fs from "node:fs";
import { DRAFTS_PATH, STATE_DIR } from "./project.mjs";

// state/drafts.json shape: { [hiragana::category]: DraftEntry }
// DraftEntry.status flows pending_review -> approved -> generated.
// generate-images.mjs will ONLY touch entries with status === "approved" —
// this is the mechanical half of the "never generate without approval" rule,
// the other half is SKILL.md telling Claude to only flip the status after
// the user explicitly approves in the same turn.
export function readDrafts() {
  if (!fs.existsSync(DRAFTS_PATH)) return {};
  return JSON.parse(fs.readFileSync(DRAFTS_PATH, "utf8"));
}

export function writeDrafts(drafts) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(DRAFTS_PATH, JSON.stringify(drafts, null, 2) + "\n", "utf8");
}
