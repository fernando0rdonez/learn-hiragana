#!/usr/bin/env node
// Step 1-2 of the vocab-images workflow: detect new words in vocabulary.ts
// (no `generated: true`) and classify each into a visualType via the
// category mapping. Writes state/drafts.json for Claude/the user to review
// in the next step. Never touches the OpenAI API.
import { readVocabulary } from "./lib/vocab-file.mjs";
import { readDrafts, writeDrafts } from "./lib/drafts.mjs";
import { classifyCategory, draftKey } from "./lib/classify-rules.mjs";
import { buildPrompt } from "./lib/prompts.mjs";

const { vocabulary } = await readVocabulary();
const drafts = readDrafts();

let added = 0;
let skippedAlreadyGenerated = 0;
let skippedAlreadyTracked = 0;

for (const word of vocabulary) {
  const key = draftKey(word);

  if (word.generated) {
    if (drafts[key]) {
      delete drafts[key]; // cleanup: word finished its lifecycle, no need to keep tracking it
    }
    skippedAlreadyGenerated++;
    continue;
  }

  if (drafts[key]) {
    // Already tracked (pending_review / approved / generated) — never
    // overwrite in-progress or approved work on a re-run.
    skippedAlreadyTracked++;
    continue;
  }

  const { visualType, reviewNote } = classifyCategory(word);

  const entry = {
    hiragana: word.hiragana,
    romaji: word.romaji,
    meaning: word.meaning,
    category: word.category,
    imageQuery: word.imageQuery,
    visualType,
    reviewNote: reviewNote ?? null,
    status: "pending_review",
    // "subject" is the literal text that gets interpolated into the
    // template's placeholder. For concrete it's auto-filled (still
    // pending_review — auto-filled is not the same as approved). For
    // action/symbolic it starts empty and gets filled by Claude (action,
    // using the few-shot examples) or by the user (symbolic/needs_review).
    subject: visualType === "concrete" ? word.imageQuery : null,
    draftPrompt: visualType === "concrete" ? buildPrompt("concrete", word.imageQuery) : null,
  };

  drafts[key] = entry;
  added++;
}

writeDrafts(drafts);

const pending = Object.values(drafts).filter((d) => d.status === "pending_review");
const byType = pending.reduce((acc, d) => {
  acc[d.visualType] = (acc[d.visualType] ?? 0) + 1;
  return acc;
}, {});

console.log(`\nclassify.mjs done.`);
console.log(`  ${added} new word(s) added to state/drafts.json`);
console.log(`  ${skippedAlreadyGenerated} already generated (skipped)`);
console.log(`  ${skippedAlreadyTracked} already tracked from a previous run (untouched)`);
console.log(`\nPending review by visualType:`);
for (const [type, count] of Object.entries(byType)) {
  console.log(`  ${type}: ${count}`);
}
console.log(`\nNext step: read state/drafts.json.`);
console.log(`  - "concrete" entries already have a draftPrompt — just review/edit.`);
console.log(`  - "action" entries need Claude to draft a subject using reference/action-fewshot.md, then STOP for review.`);
console.log(`  - "symbolic"/"needs_review" entries need the user to write the subject/metaphor by hand.`);
console.log(`No entry is approved until the user explicitly says so in this turn.`);
