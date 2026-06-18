# [x] Phase 6 — Spell-It Mode (Image → Kana Selection)

## Feature Spec

**Goal:** User sees an emoji image and must tap kana chips in order to spell the word.

**UI layout (top → bottom):**
1. Large emoji illustration (128px, centered)
2. Word slots — one rounded box per character; tap a filled slot to undo from that position rightward
3. Shuffled kana chip pool — word's characters + 3 distractors (weighted toward visually similar chars)
4. "Clear" button to reset slots

**Interaction flow:**
- Tapping a chip moves it into the next empty slot and dims it in the pool
- When the last slot fills → auto-submit
- **Correct:** green flash, brief pause, next card
- **Wrong:** red shake, reset slots (chips return to pool), try again
- **2 failures on same card:** reveal correct spelling, then advance

**Integration with Leitner:**
- Both outcomes call `leitner.recordResult("word:neko", correct)`
- Same box progression as kana cards (correct → box+1, wrong → box 0)

---

## Image Resources — Recommendation

**Use `@lobehub/fluent-emoji` (Fluent UI Emoji, MIT license)**

```bash
npm install @lobehub/fluent-emoji
```

| Library | License | SVG/React | Notes |
|---|---|---|---|
| **Fluent UI Emoji** (`@lobehub/fluent-emoji`) | **MIT** ✅ | Tree-shakable React components ✅ | 3D illustrated style, best visual engagement |
| Noto Emoji (Google) | Apache 2.0 ✅ | Requires sprite setup | Good fallback if bundle size is a concern |
| OpenMoji | CC BY-SA 4.0 ⚠️ | SVG available | Copyleft — requires SA on derivative works |
| Twemoji | CC BY 4.0 ⚠️ | No official React pkg | Broken CDN post-Twitter acquisition |

Fluent UI Emoji wins: MIT means no in-app attribution required, tree-shakable so you only bundle what you use, and the 3D style is the most engaging for a learner.

**Usage:**
```tsx
import { Emoji } from '@lobehub/fluent-emoji'
<Emoji emoji="🐱" size={128} />
```

### Word → Emoji Mapping (all 19 words)

| Word | Romaji | Emoji | Label |
|---|---|---|---|
| あさ | asa | 🌅 | sunrise |
| いえ | ie | 🏠 | house |
| うた | uta | 🎵 | music note |
| かさ | kasa | ☂️ | umbrella |
| きく | kiku | 🌼 | flower |
| さかな | sakana | 🐟 | fish |
| そら | sora | 🌤️ | sky |
| たぬき | tanuki | 🦝 | raccoon |
| とり | tori | 🐦 | bird |
| なつ | natsu | ☀️ | summer sun |
| ねこ | neko | 🐱 | cat |
| はな | hana | 🌸 | flower |
| まめ | mame | 🫘 | beans |
| みかん | mikan | 🍊 | orange |
| やま | yama | ⛰️ | mountain |
| ゆき | yuki | ❄️ | snowflake |
| よる | yoru | 🌙 | moon |
| わたし | watashi | 🙋 | person |
| くるま | kuruma | 🚗 | car |

---

## Data Model

`WordEntry` in `src/words.ts`:
```ts
export interface WordEntry {
  id: string            // e.g. "neko"
  hiragana: string      // "ねこ"
  romaji: string        // "neko"
  meaning: string       // "cat" (English)
  emoji: string         // "🐱"
  emojiLabel: string    // "cat" (aria-label)
  tags?: string[]       // e.g. ["animal"]
}

export const WORD_LIST: WordEntry[] = [
  { id: 'neko', hiragana: 'ねこ', romaji: 'neko', meaning: 'cat', emoji: '🐱', emojiLabel: 'cat' },
  // ... rest of words
]

export const getWordById = (id: string) => WORD_LIST.find(w => w.id === id)
```

Leitner key format: `"word:neko"` — already non-colliding with `"recognition:ね"`.

---

## Files to Create/Edit

| File | Action |
|---|---|
| `src/words.ts` | Add `WordEntry` interface, `WORD_LIST` with emoji mappings, `getWordById` |
| `src/leitner.ts` | Add `getWordsDue()` seeding word cards on first load |
| `src/App.tsx` | Mount `<SpellItGame />` inside the Words tab |
| `src/utils/distractors.ts` | **New** — generate distractor chips with visually-similar-char weighting |
| `src/components/SpellItGame.tsx` | **New** — main orchestrator (state, submit logic, Leitner calls) |
| `src/components/WordSlots.tsx` | **New** — slot row with undo-tap |
| `src/components/KanaChip.tsx` | **New** — tappable chip; `used` prop dims it |
| `src/components/EmojiDisplay.tsx` | **New** — Fluent Emoji wrapper with native emoji fallback |
| `src/index.css` | Add `correct-flash` and `error-shake` keyframe animations |

---

## Implementation Steps

1. `npm install @lobehub/fluent-emoji`
2. Create `src/words.ts` with full `WORD_LIST`
3. Create `src/utils/distractors.ts`
4. Create `src/components/EmojiDisplay.tsx`
5. Create `src/components/KanaChip.tsx`
6. Create `src/components/WordSlots.tsx`
7. Create `src/components/SpellItGame.tsx`
8. Wire into `src/App.tsx` in the Words tab
9. Add animations to `src/index.css`
10. Update `plan.md` — mark Phase 6 `[x]` after verification

---

## Open Questions — Decide Before Coding

1. **SpellIt-only or toggle with existing flashcard mode?**
   Recommendation: start SpellIt-only, add toggle in a follow-up.

2. **Failure demotion depth** — one box down (like kana) or straight to Box 0?

3. **Sound effects?** A correct chime + error buzz is a big UX win on mobile. Worth wiring `AudioContext` now vs. retrofitting later.

4. **Romaji hint?** `showRomaji` prop on `SpellItGame` shows the romaji below the emoji for beginner mode. Decide now so the component API is right from day 1.
