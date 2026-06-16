# Hiragana Trainer — Implementation Plan

Each phase is self-contained and verifiable before moving on.
Status: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 0.1 — Mobile platform + PWA `[x]`

**Goal:** Make the app work well on a phone browser and installable as a home screen icon.

**Rules (from spec section 0.1):**
- Viewport meta must be `width=device-width, initial-scale=1` — already present in the Vite scaffold.
- No programmatic `.focus()` on text inputs — iOS Safari blocks it unless triggered by a direct user tap.
- Touch targets ≥ 44×44 px on all interactive elements (buttons, row chips).
- `hover:` Tailwind states are fine to keep — they're inert on touch and don't need replacing.
- PWA: `manifest.json` + icon files + `theme-color` meta. **No service worker / offline support** in this phase.

**Files created/edited:**
- `public/icon.svg` — hiragana あ on indigo background; works for Android/Chrome installability.
- `public/manifest.json` — `display: standalone`, theme color `#4338ca`, references `icon.svg`.
- `index.html` — added manifest link, `theme-color` meta, `apple-touch-icon`, fixed `lang="ja"` and title.
- `src/App.tsx` — removed input autofocus `useEffect`; bumped quiz action buttons to `py-3` (≥44px).

**Known limitation:** iOS home screen icon requires a 180×180 PNG.
`apple-touch-icon` currently points to the SVG (ignored by iOS). Add `/public/icon-180.png` and update the link when a PNG is available.

**Mobile reminders for phases 3–5:**
- All new buttons must be `py-3` minimum (≥44px tall).
- No `autoFocus` or `.focus()` calls on `<input>` elements.
- Production mode (Phase 3) uses tap buttons — naturally touch-friendly, no extra work needed.

---

## Phase 1 — localStorage migration `[x]`

**Goal:** Replace `window.storage` (Claude artifact sandbox API) with `localStorage`. No behavior change for the user — recognition mode works exactly as before.

**Data model change:**
Old: `{ "あ": { attempts: 4, correct: 4 } }`
New:
```json
{
  "items": {
    "recognition:あ": { "box": 0, "nextDue": "2026-06-16", "attempts": 4, "correct": 4 }
  }
}
```
Item key format: `"{mode}:{content}"` — e.g. `recognition:あ`, `production:あ`, `word:さかな`.

**Files to create/edit:**
- `src/storage.ts` — new module: `loadProgress()`, `saveProgress()`, typed around the new schema. Wrap all localStorage calls in try/catch (can fail in private mode / quota full).
- `src/types.ts` — shared types: `ItemKey`, `ItemProgress`, `ProgressData`, `CharStatus`, etc.
- `src/App.tsx` — swap `window.storage` calls for the new storage module; update progress reads/writes to use `recognition:{kana}` keys.

**Verification:** Run the app, answer some chars, refresh — progress persists. Open DevTools > Application > localStorage, confirm the new schema shape.

---

## Phase 2 — Leitner spaced repetition `[x]`

**Goal:** Replace the heuristic weight system with real Leitner boxes so the app schedules future reviews.

**Rules:**
- 5 boxes (0–4), intervals in days: `[0, 1, 3, 7, 14]`
- Correct → `box = min(box+1, 4)`, `nextDue = today + intervals[box]`
- Wrong → `box = 0`, `nextDue = today`
- Item is *due* if `nextDue <= today`

**Session selection order:**
1. Due items from the selected pool (prioritized).
2. New items (no attempts) from the same pool if not enough due.
3. If still nothing: show a "nothing to practice" message, don't force early review.

**Within-session reinforcement:** if an item is missed during a session, add it back to the tail of the current session queue (independent of `nextDue`).

**Files to create/edit:**
- `src/leitner.ts` — pure functions: `advanceBox()`, `isDue()`, `buildSessionQueue()`, `pickNext()`.
- `src/App.tsx` — replace `weightFor` / `pickNext` with calls to `leitner.ts`; update `handleSubmit` to call `advanceBox`.

**Verification:** Answer a char correctly → inspect localStorage, confirm `box` incremented and `nextDue` is set to a future date. Answer wrong → `box` resets to 0, `nextDue` = today. Start a new session with all chars mastered + none due → app shows "nothing to practice" message.

---

## Phase 3 — Production mode (romaji → kana) `[ ]`

**Goal:** New quiz direction: user sees romaji, picks the correct kana from 4 options.

**Rules:**
- 4 choices per question: correct kana + 3 distractors.
- Distractor strategy: include ≥1 char from the confused-pairs list (Phase 4 constant) when one exists for that kana; fill remaining slots randomly from the same session pool.
- Tracks as `production:{kana}` — separate from `recognition:{kana}`.
- UI: 4 large kana buttons, tap to select, no text input.

**Session setup change:** add a mode selector in the setup screen — "Recognition", "Production", or "Both". When "Both", interleave item types in the queue.

**Files to create/edit:**
- `src/confusedPairs.ts` — define the pairs constant here (used by both Phase 3 and Phase 4); export `CONFUSED_PAIRS` and a helper `getConfusablePairs(kana)`.
- `src/components/ProductionCard.tsx` — the 4-choice card UI.
- `src/App.tsx` — mode selector state, pass mode into `buildSessionQueue`, render `ProductionCard` when mode is production.

**Verification:** Start a production session, confirm 4 options appear, correct kana is always present, at least 1 distractor is from the confused-pairs list when applicable. Confirm `production:あ` key appears in localStorage after answering.

---

## Phase 4 — Confused pairs mode `[ ]`

**Goal:** Dedicated session type focused on visually similar kana. Reuses existing recognition/production items — no new data schema.

**Pairs list (in `src/confusedPairs.ts`, already created in Phase 3):**
```
か/け, ぬ/ね, る/ろ, わ/れ/ね, さ/ち, せ/て, は/ほ, り/い
```

**Session setup:** new tab/section "Pares confusos". User checks one or more pairs. Pool = all kana from selected pairs. Mode = recognition (MVP; can add production toggle later).

**Files to create/edit:**
- `src/confusedPairs.ts` — already created in Phase 3; no changes needed if pairs constant is there.
- `src/App.tsx` — add "Pares confusos" section in setup view; build pool from selected pairs, call existing `startSession`.

**Verification:** Select the か/け pair, start session — only か and け appear as questions. Open stats view — progress for those chars shown normally (they share the same `recognition:{kana}` items).

---

## Phase 5 — Words mode `[ ]`

**Goal:** Practice reading complete hiragana words (user reads kana word, types romaji).

**Scope constraint:** only words built from base hiragana (no っ, no particle は="wa", no long vowels).

**Word list seed (in `src/words.ts`):**
あさ/asa, いえ/ie, うた/uta, かさ/kasa, きく/kiku, さかな/sakana, そら/sora, たぬき/tanuki, とり/tori, なつ/natsu, ねこ/neko, はな/hana, まめ/mame, みかん/mikan, やま/yama, ゆき/yuki, よる/yoru, わたし/watashi, くるま/kuruma

**Pool filter:** a word only enters the session pool if all its component kana rows are selected (or mastered) by the user. Prevents practicing vocabulary before learning the characters.

**Tracks as:** `word:{kana-string}` — e.g. `word:さかな`.

**Files to create/edit:**
- `src/words.ts` — `WORDS` constant + `getAvailableWords(selectedRows, progress)` helper.
- `src/App.tsx` — "Palabras" section in setup; text-input UI (same as recognition, not multiple choice); word items in queue handled by existing `handleSubmit` flow.

**Verification:** Select only the "あ" row — no words appear (none use only あ行). Select あ + か + な rows → さかな, はな, etc. should appear. Answer correctly → `word:さかな` shows in localStorage with updated box.

---

## Out of scope (explicit, per spec)

- Audio pronunciation
- Handwriting / stroke order
- Katakana, dakuten, combinations
- Accounts, login, cross-device sync
- Streak system (spec section 8 — future phase, not in phases 1–5)

---

## How to resume in a new session

1. Read this file to see which phases are done (`[x]`) vs pending (`[ ]`).
2. Read `hiragana-trainer.md` for full rationale behind any decision.
3. Start at the first `[ ]` phase and implement it end-to-end before moving on.
4. Mark the phase `[x]` when verification passes.
