#!/usr/bin/env node
// Category-image counterpart to classify.mjs: detects VOCAB_CATEGORIES
// entries without an `image`, and seeds state/category-drafts.json for
// Claude/the user to fill in a `subject` (visual metaphor) and review.
// Never touches the OpenAI API.
import { readVocabulary } from "./lib/vocab-file.mjs";
import { readCategoryDrafts, writeCategoryDrafts } from "./lib/drafts.mjs";

const { categories } = await readVocabulary();
const drafts = readCategoryDrafts();

let added = 0;
let skippedAlreadyGenerated = 0;
let skippedAlreadyTracked = 0;

for (const category of categories) {
  if (category.image) {
    if (drafts[category.id]) delete drafts[category.id]; // finished its lifecycle
    skippedAlreadyGenerated++;
    continue;
  }

  if (drafts[category.id]) {
    skippedAlreadyTracked++;
    continue;
  }

  drafts[category.id] = {
    id: category.id,
    label: category.label,
    status: "pending_review",
    // "subject" is authored text describing the visual metaphor for the
    // whole category (e.g. "a stack of colorful number blocks") — there's
    // no single word to derive it from, so nothing is auto-filled here.
    subject: null,
    draftPrompt: null,
  };
  added++;
}

writeCategoryDrafts(drafts);

console.log(`\nclassify-categories.mjs done.`);
console.log(`  ${added} new categor${added === 1 ? "y" : "ies"} added to state/category-drafts.json`);
console.log(`  ${skippedAlreadyGenerated} already generated (skipped)`);
console.log(`  ${skippedAlreadyTracked} already tracked from a previous run (untouched)`);
console.log(`\nNext step: draft a "subject" (visual metaphor) for each pending category in`);
console.log(`state/category-drafts.json, present to the user for review, then only for`);
console.log(`explicitly approved entries set status: "approved" before generating.`);
