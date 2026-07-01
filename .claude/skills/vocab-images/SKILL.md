---
name: vocab-images
description: Incrementally generate AI vocabulary images for Hiragana Trainer's vocabulary.ts (JLPT N5 words). Use when adding new vocab words that need flashcard images, or when asked to classify/draft/generate vocab images.
---

# Vocab images for Hiragana Trainer

Manages AI image generation for `src/vocabulary.ts` words: classify each new
word into a `visualType`, draft the prompt text for review, and only after
explicit human approval generate the actual image via OpenAI.

## HARD RULE

**Never run `generate-images.mjs --confirm` (or otherwise call the OpenAI
image API) unless the user has explicitly approved the prompt text for those
specific entries in this same turn.** Drafting prompt text and generating
images are two separate steps with a human checkpoint in between, every time
— including for `concrete` entries, even though those are auto-drafted from a
fixed template. Auto-drafted is not the same as approved.

This is enforced two ways:
1. Mechanically: `generate-images.mjs` only touches `state/drafts.json`
   entries with `status: "approved"`, and refuses to call the API at all
   without `--confirm`.
2. By you: only flip an entry's status to `"approved"` in `state/drafts.json`
   after the user says so explicitly in the conversation. Never pre-approve,
   never batch-approve without a fresh confirmation, never approve on the
   user's behalf because a draft "looks fine."

## Files

- `reference/category-mapping.md` — category → visualType table (human-readable; the code copy is `scripts/lib/classify-rules.mjs`)
- `reference/action-fewshot.md` — 24 approved actionPrompt examples used as few-shot context, plus a "flagged" list of verbs that need special handling
- `.claude/prompts/{concrete,action,symbolic}.md` — the 3 validated prompt templates (outside this skill dir, shared/reusable)
- `scripts/classify.mjs` — detection + classification, writes `state/drafts.json`
- `scripts/generate-images.mjs` — turns approved drafts into images (gated, see above)
- `state/drafts.json` — working state, gitignored, one entry per pending/approved/generated word

## Workflow

### 1. Classify

```
npm run vocab:classify
```

Scans `VOCABULARY` in `src/vocabulary.ts` for words without `generated: true`,
maps each `category` to a `visualType` per `reference/category-mapping.md`,
and writes/merges `state/drafts.json`. `concrete` entries get an auto-filled
`draftPrompt` from the template. `action` and `symbolic`/`needs_review`
entries are left with `subject: null` — nothing is drafted yet.

Re-running this script is safe: it never touches an entry already tracked in
`state/drafts.json` (whatever its status), so it won't clobber approvals or
edits in progress.

### 2. Draft `action` entries

Read `state/drafts.json` for entries with `visualType: "action"` and
`subject: null`. Using `reference/action-fewshot.md` as few-shot context,
draft a `subject` (a short clause naming a concrete anchoring prop, matching
the style of the existing 24 examples) for each one and write it into
`state/drafts.json`. Then **stop** — do not proceed to prompt assembly or
approval on your own initiative.

Check `reference/action-fewshot.md`'s "Flagged" section first — some verbs
(e.g. みる) are marked as unsafe to auto-draft from few-shot alone and need
you to ask the user for the anchoring prop instead of guessing one.

Present the full list of drafted `action` subjects to the user for review in
this turn.

### 3. `symbolic` / `needs_review` entries — do not auto-draft

For entries with `visualType: "symbolic"` or `"needs_review"`, do not
generate any prompt text. List them (hiragana, meaning, category, any
`reviewNote`) and ask the user to supply the `subject` (the visual metaphor,
for symbolic) or to resolve the entry's real `visualType` first (for
`needs_review` — e.g. a `saludos` word might resolve to `action` or
`symbolic` depending on the word). Write whatever the user gives you into
`state/drafts.json` yourself; don't invent the metaphor.

### 4. Review and approve

Present every `pending_review` entry's final `subject`/`draftPrompt` —
concrete, action, and symbolic/needs_review alike — to the user in one pass
if practical. Let them edit any of it. Only for the entries the user
explicitly approves in this turn, in `state/drafts.json`:
- set `status: "approved"`
- make sure `subject` holds the final, approved text (this is what gets
  interpolated into the template — update it if the user edited it)

Leave everything else at `status: "pending_review"`.

### 5. Generate

Only after step 4's approval, in the same turn:

```
npm run vocab:generate-images -- --confirm
```

(Run it once without `--confirm` first if you want to show the user the
exact final prompts as one last preview — it prints them and exits without
calling the API.)

This calls OpenAI (`gpt-image-1.5`, quality `low`) for each `approved` entry,
saves the image to `src/assets/vocab-images/<category>-<romaji-slug>.png`,
records provenance (prompt, model, quality, timestamp, slug) in
`src/generated/vocab-image-meta.json`, sets `generated: true` and `imagePath`
(the slug, e.g. `"verbos-taberu"`) on the matching entry in
`src/vocabulary.ts`, and marks the draft `status: "generated"`.

Requires `OPENAI_API_KEY` in the environment (see `example.env`) — never
bundled to the client, only read server-side by this Node script.

## Notes

- Images live in `src/assets/vocab-images/`, not `public/` — this project
  deploys to GitHub Pages under a subpath (`base: '/learn-hiragana/'` in
  `vite.config.ts`), and a hardcoded root-absolute string path in
  `vocabulary.ts` (e.g. `"/vocab-images/x.png"`) would bypass Vite's base-path
  rewriting and 404 in production. Instead, `vocabulary.ts`'s `imagePath`
  stores a stable slug, and `src/vocabImages.ts` resolves it to the real
  built URL via `import.meta.glob` — Vite handles hashing and the base path
  automatically. Whoever wires up rendering later should call
  `getVocabImageUrl(word.imagePath)` from `src/vocabImages.ts`, never
  construct the URL by hand.
- The slug is `<category>-<romaji>`, not romaji alone — some romaji repeat
  across categories (e.g. "hana" = はな "flor" in `naturaleza` AND はな
  "nariz" in `cuerpo`), and a bare-romaji slug would let one overwrite the
  other's file on disk.
- `vocabulary.ts` only ever gets `generated` and `imagePath` written to it —
  prompt text, model, and timestamps live in
  `src/generated/vocab-image-meta.json` instead, to keep the runtime-imported
  vocab file lean.
- Draft entries in `state/drafts.json` are identified by `hiragana::category`,
  not hiragana alone, for the same はな collision reason.
- If you change the category→visualType mapping, update both
  `reference/category-mapping.md` and `scripts/lib/classify-rules.mjs` — the
  script doesn't read the markdown file, it's documentation for humans.
