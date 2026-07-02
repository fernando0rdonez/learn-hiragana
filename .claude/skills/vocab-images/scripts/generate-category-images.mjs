#!/usr/bin/env node
// Category-image counterpart to generate-images.mjs: turns APPROVED
// category drafts into images.
//
// HARD RULE: this script only ever touches entries with status === "approved"
// in state/category-drafts.json, and even then refuses to call the OpenAI
// API unless invoked with --confirm. See SKILL.md.
import fs from "node:fs";
import path from "node:path";
import { IMAGE_META_PATH, IMAGES_OUT_DIR } from "./lib/project.mjs";
import { readCategoryDrafts, writeCategoryDrafts } from "./lib/drafts.mjs";
import { buildPrompt } from "./lib/prompts.mjs";
import { readVocabTsText, writeVocabTsText, markCategoryGenerated } from "./lib/vocab-file.mjs";

const MODEL = "gpt-image-1.5";
const QUALITY = "low";
const SIZE = "1024x1024";

// Same account-wide rate limit as generate-images.mjs (5 gpt-image
// requests/minute) — space calls out proactively instead of relying on 429
// retries alone.
const MIN_INTERVAL_MS = 13_000;
const MAX_RETRIES_PER_ENTRY = 3;

const confirmed = process.argv.includes("--confirm");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(errorMessage) {
  const match = errorMessage.match(/try again in ([\d.]+)s/i);
  if (!match) return null;
  return Math.ceil(parseFloat(match[1]) * 1000) + 1000;
}

// "category-<id>" (not the bare id, and not the word slug scheme) so this
// never collides with per-word slugs like "numeros-ichi" in the shared
// urlsBySlug keyspace that getVocabImageUrl() resolves against.
function slugify(categoryId) {
  return `category-${categoryId}`;
}

function readImageMeta() {
  if (!fs.existsSync(IMAGE_META_PATH)) return {};
  return JSON.parse(fs.readFileSync(IMAGE_META_PATH, "utf8"));
}

function writeImageMeta(meta) {
  fs.writeFileSync(IMAGE_META_PATH, JSON.stringify(meta, null, 2) + "\n", "utf8");
}

async function generateImage(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, prompt, quality: QUALITY, size: SIZE, n: 1 }),
  });

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`OpenAI API error ${res.status}: ${body}`);
    err.status = res.status;
    throw err;
  }

  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error(`Unexpected OpenAI response shape: ${JSON.stringify(json).slice(0, 300)}`);
  return Buffer.from(b64, "base64");
}

const drafts = readCategoryDrafts();
const approved = Object.entries(drafts).filter(([, d]) => d.status === "approved");

if (approved.length === 0) {
  console.log("No entries with status \"approved\" in state/category-drafts.json. Nothing to do.");
  process.exit(0);
}

console.log(`${approved.length} approved categor${approved.length === 1 ? "y" : "ies"} found:\n`);

const planned = approved.map(([key, entry]) => {
  if (!entry.subject) {
    throw new Error(`Entry "${key}" is approved but has no "subject" text to interpolate into the template.`);
  }
  const prompt = buildPrompt("category", entry.subject);
  return { key, entry, prompt };
});

for (const { key, prompt } of planned) {
  console.log(`  [${key}]\n    ${prompt}\n`);
}

if (!confirmed) {
  console.log("Dry run only (no --confirm flag passed). No API calls made, nothing written.");
  console.log("Re-run with --confirm to actually generate these images.");
  process.exit(0);
}

fs.mkdirSync(IMAGES_OUT_DIR, { recursive: true });
const imageMeta = readImageMeta();
let vocabText = readVocabTsText();

let succeeded = 0;
let failed = 0;

for (let i = 0; i < planned.length; i++) {
  const { key, entry, prompt } = planned[i];

  if (i > 0) await sleep(MIN_INTERVAL_MS);

  let lastErr;
  let done = false;
  for (let attempt = 1; attempt <= MAX_RETRIES_PER_ENTRY && !done; attempt++) {
    try {
      console.log(`Generating [${key}]${attempt > 1 ? ` (attempt ${attempt})` : ""}...`);
      const imageBuffer = await generateImage(prompt);

      const slug = slugify(entry.id);
      const fileName = `${slug}.png`;
      fs.writeFileSync(path.join(IMAGES_OUT_DIR, fileName), imageBuffer);

      imageMeta[`category::${key}`] = {
        prompt,
        model: MODEL,
        quality: QUALITY,
        generatedAt: new Date().toISOString(),
        slug,
      };

      vocabText = markCategoryGenerated(vocabText, entry.id, slug);
      drafts[key] = { ...entry, status: "generated" };

      writeImageMeta(imageMeta);
      writeVocabTsText(vocabText);
      writeCategoryDrafts(drafts);

      succeeded++;
      done = true;
    } catch (err) {
      lastErr = err;
      if (err.status === 429 && attempt < MAX_RETRIES_PER_ENTRY) {
        const waitMs = parseRetryAfterMs(err.message) ?? MIN_INTERVAL_MS;
        console.log(`  Rate limited, waiting ${Math.ceil(waitMs / 1000)}s before retry...`);
        await sleep(waitMs);
      }
    }
  }

  if (!done) {
    console.error(`  FAILED [${key}]: ${lastErr.message}`);
    failed++;
  }
}

console.log(`\nDone. ${succeeded} generated, ${failed} failed.`);
if (failed > 0) {
  console.log("Failed entries kept status \"approved\" in state/category-drafts.json — re-run to retry them.");
  process.exit(1);
}
