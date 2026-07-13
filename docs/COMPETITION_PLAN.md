# Async 1v1 Competition Mode — MVP (Hiragana recognition + Vocabulary spell-it)

Implementation plan for [`BACKLOG.md` spec #16](./BACKLOG.md), scoped to an MVP slice.
Each phase is self-contained and independently verifiable — pick up at the first `[ ]` in a fresh session.
Status: `[ ]` todo · `[~]` in progress · `[x]` done

## Context

`docs/BACKLOG.md` spec **#16 · Modo Competencia asíncrona** describes letting two users challenge each other to the same fixed set of items, played independently, with a shared result and rival history. It depends on #15 (auth + sync), already shipped (`useAuth`, `useProgressSync`, `supabase/migrations/0001_progress.sql`). The spec is written generically ("any module"), but building item-resolution for all ~10 study modules on day one multiplies both code and QA. **Decision (confirmed with user): ship an MVP covering only two modules — Hiragana recognition and Vocabulary spell-it** — proving the schema, RLS, invite-link/auth interaction, and result/history UI end-to-end before generalizing.

This also follows directly from the App.tsx extraction (see git history): Competition becomes an 11th module (`useCompetition()` hook + `CompetitionModuleViews.tsx` under `src/views/modules/`), mounted from `App.tsx` exactly like `VocabModuleViews`/`KanjiModuleViews`/etc., instead of bolting five raw view blocks onto the switch.

A real gap was found in the existing auth flow: `useAuth.ts:57`'s `emailRedirectTo` always redirects to the app root after OTP login, with no awareness of a pending `/compete/:code` deep link — a logged-out rival opening an invite link would lose the code across the login round-trip unless it's stashed client-side first. Fixed via `sessionStorage` in Phase B below, no change to `useAuth.ts` itself.

---

## Phase A — Database schema `[x]` (applied via `supabase db push` and verified against the live project)

**Goal**: the full data model exists and is provably correct via direct SQL/table-editor testing, with zero app code written yet.

**File**: `supabase/migrations/0002_competitions.sql` (follows `0001_progress.sql`'s style — plain SQL, `create table if not exists`, named RLS policies).

- **`profiles`**: `id uuid PK references auth.users`, `display_name text not null`, `created_at`. Trigger `on auth.users after insert` → `security definer` function inserting `display_name = split_part(email,'@',1)`. Backfills existing users created before this migration, since #15 already has real signups.
  RLS: `select` for any authenticated user (rival display names must be visible); `update` own row only; no client insert policy (trigger handles it, runs `security definer`).
- **`competitions`**: `id uuid PK default gen_random_uuid()`, `created_by uuid references auth.users`, `quiz_config jsonb` (`{ module: "hiragana"|"vocab", mode: "recognition"|"spell", items: string[] }`), `status text check in ('pendiente','activa','completada') default 'pendiente'`, `invite_code text unique` (8-char hex slice of a random uuid — avoids adding a client-side nanoid dependency; `package.json` has none today), `created_at`, `expires_at default now() + interval '48 hours'`.
  RLS: `select` for any authenticated user (spec's explicit "unguessable link, like a Google Docs link" v1 simplification); `insert` own only.
- **`competition_participants`**: `(competition_id, user_id)` composite PK, `joined_at`.
  RLS: `select` own row, or as the competition's creator; `insert` own only.
- **`competition_results`**: `(competition_id, user_id)` composite PK, `score int`, `correct int`, `total int`, `submitted_at`.
  RLS: `insert`/`update` own row, only if a participant; `select` allowed to any participant of that competition — lets you see the rival's row once both submitted.
- **Trigger**: `security definer` function `mark_competition_completed()`, `after insert on competition_results` — if `count(competition_participants) = count(competition_results)` for that `competition_id`, set `competitions.status = 'completada'`. Simple count comparison, idempotent/race-safe even if both participants submit near-simultaneously.
- **View `competition_summary`**: plain view (NOT `security definer`, so it still respects the querying user's RLS on the base tables), one row per completed competition joining `competitions` to its two `competition_results` rows (self-join ordered by `user_id` for a stable pair), used to compute head-to-head history client-side.

**Verification**: apply the migration to the hosted Supabase project via the Dashboard SQL Editor or `psql` (no local Supabase CLI config in this repo). Sign up a fresh test user, confirm a `profiles` row auto-appears; manually insert two `competitions`/`competition_participants`/`competition_results` rows via SQL for two real `auth.users` ids and confirm the trigger flips `status` to `completada` and `select * from competition_summary` returns the joined row correctly. No app code needed for this check.

**Note**: direct connection (`db.<ref>.supabase.co:5432`) is IPv6-only and may be unreachable from networks without IPv6 routing ("No route to host"). Ended up applying via the **Supabase CLI** instead (`brew install supabase/tap/supabase`, `supabase login`, `supabase link --project-ref fgaxbihbchahtetxjvrl`), which connects over HTTPS/pooler and sidesteps the networking issue entirely — no manual pooler string needed.

**How it was actually applied** (for reference in future sessions): `0001_progress.sql` had been applied by hand via the Dashboard SQL Editor in an earlier session, so it was never recorded in Supabase's `supabase_migrations.schema_migrations` tracking table — `supabase migration list` showed both `0001` and `0002` as unapplied even though `0001`'s table was confirmed live (`supabase inspect db table-stats --linked` showed `public.progress` with real rows). Fixed with `supabase migration repair 0001 --status applied --linked` (bookkeeping-only, no schema touched), then `supabase db push` applied only `0002` cleanly.

**Verified** via `supabase inspect db table-stats --linked` (all 4 tables present, `profiles` backfilled to 3 rows matching existing users) and read-only REST API checks (`GET /rest/v1/{competitions,competition_participants,competition_results,competition_summary}` all `200`; unauthenticated `GET /rest/v1/profiles` returned `[]`, confirming RLS's `to authenticated` restriction is active, not bypassed).

---

## Phase B — Create/join flow, no gameplay yet `[ ]`

**Goal**: two logged-in users can create a competition, share a link, and both land on a "joined, waiting to play" state — provably via the UI, before any scoring logic exists.

**Files**:
- `src/hooks/useCompetition.ts` (new, styled like `useAuth.ts`/`useProgressSync.ts`, params `{ session, progress, setView }`): `myCompetitions`, `myDisplayName`, `createCompetition(module, mode, size: 10|20)` (resolves a fixed item snapshot — shuffle+slice `ALL_CHARS` for Hiragana, `VOCABULARY` for Vocab — inserts `competitions` + self into `competition_participants`, returns the row with `invite_code` for the share link `${origin}${BASE_URL}compete/${invite_code}` via `navigator.share` with clipboard fallback), `joinCompetition(code)` (lookup by `invite_code`, soft client-side `expires_at` check, insert into `competition_participants`), `pendingInviteCode`/`stashInviteCode`/`consumeInviteCode` (`sessionStorage`-backed deep-link survival). Everything no-ops when `!isSupabaseConfigured || !session`, same gate as `useProgressSync`.
- `src/data.ts`: extend `ViewName` with `"competeHome" | "competeCreate" | "competeJoin" | "competeResult"`.
- `src/views/modules/CompetitionModuleViews.tsx` (new, mirrors `VocabModuleViews.tsx`) + `src/views/CompetitionHomeView.tsx` (login CTA if no session — reuse `SyncPanel`'s pattern or route to `settings`; "Crear reto"; list of `myCompetitions`), `src/views/CompetitionCreateView.tsx` (two hardcoded module cards — "Hiragana — reconocimiento" / "Vocabulario — deletrear", no row/category sub-selection, still faithful to the spec's literal wording which only asks for module+mode; item-count toggle 10/20; share-link screen on success), `src/views/CompetitionJoinView.tsx` (preview fetch by code — "X te retó a...", "Unirme" button).
- `src/App.tsx`: instantiate `useCompetition`, mount `CompetitionModuleViews` in one new conditional block (same pattern as every other extracted module), add the deep-link parsing effect (sibling to the existing Google Fonts effect): strip `import.meta.env.BASE_URL` from `window.location.pathname`, regex-match `^/compete/([A-Za-z0-9]+)$`; if matched, `stashInviteCode(code)` + `history.replaceState(null, "", base)` to clean the URL bar; if already logged in, `setView("competeJoin")` immediately; otherwise a second effect watching `session` becoming non-null consumes the stash once auth resolves. No change to `useAuth.ts` itself — the stash/restore lives entirely here.

**Verification**: two browser profiles, both OTP-logged-in. Profile A creates a Hiragana competition, shares the link. Paste the link's path into Profile B's address bar *cold* (logged out) — verify the OTP round-trip preserves the invite and lands on `competeJoin` afterward (this is the deep-link/auth gap fix, test it explicitly). Profile B joins — confirm `competition_participants` gets a second row and `CompetitionHomeView` lists the competition for both profiles. Also test: expired/garbage invite code shows a friendly error, not a crash; opening the deep link while already logged in skips OTP and lands directly on `competeJoin`.

---

## Phase C — Hiragana play + result upload (first playable module) `[ ]`

**Goal**: a full Hiragana-recognition competition can be played end-to-end by both sides and shows a correct result screen. This is the first phase that proves the whole pipeline.

**Files**:
- `src/hooks/useSession.ts`: `startSession(pool, length, mode, onSessionComplete?: (correct: number, total: number) => void)` — new optional 4th param, stored in a ref. In `goNext()` (`:64-69`), right where it transitions to `view: "summary"`, invoke `onSessionComplete` with the final correct count and `sessionPoolRef.current.length` (the original fixed size — the queue itself grows on retries, so don't use `sessionQueue.length`). Since `correctCount` is `useState` not a ref, add a `correctCountRef` mirroring it alongside the existing `sessionQueueRef`/`sessionIndexRef` pattern, updated at the same call sites as `setCorrectCount` (`handleSubmit` `:182`, `handleProductionAnswer` `:225`). Purely additive — no existing caller passes the new param, so today's Hiragana/Katakana practice flows are untouched.
- `src/hooks/useCompetition.ts`: add `submitResult(competitionId, { score, correct, total })` (upsert own row into `competition_results`; `score = correct` in v1 — no separate weighting formula, matching the spec's deferred-anti-cheat simplicity) and `rivalHistory(rivalUserId)` (wins/losses/streak computed client-side from `competition_summary` filtered to the (me, rival) pair).
- `src/views/CompetitionResultView.tsx` (new): side-by-side scores, winner/tie banner, `rivalHistory` below.
- `src/views/modules/CompetitionModuleViews.tsx`: wire the Hiragana play path — resolve `quiz_config.items` (kana strings) back to `CharWithRow[]` via `ALL_CHARS.filter(c => items.includes(c.kana))` (natural key `.kana`, confirmed via `ALL_CHARS`/`findQueueChar` usage), call `startSession(pool, pool.length, "recognition", onSessionComplete)` directly — **bypassing `launchSession`'s "new characters preview" detour**, which doesn't make sense for a competition — reusing the already-shared `useSession` instance and `QuizView`. Post-completion: rather than auto-redirecting out of the existing `"summary"` screen (which would require threading "is this a competition" state through `useSession`/`QuizView.tsx`), add one conditional "Ver resultado del reto" button on that screen when a competition is in flight. Minimizes changes to an already-working, unrelated code path.

**Verification**: continuing the two-profile setup from Phase B — Profile B plays the joined competition, confirm local SRS progress updates normally (unchanged behavior) AND a `competition_results` row appears for B. Profile A plays the same competition from `competeHome`; confirm `competitions.status` flips to `completada` (both rows now present) and both profiles' `competeResult` shows correct scores + a winner/tie banner. Repeat the full create→play→result cycle 2-3 times with the same two accounts to confirm `rivalHistory` (wins/losses/streak) accumulates correctly.

---

## Phase D — Vocabulary play (second module) `[ ]`

**Goal**: the same pipeline works for Vocabulary spell-it, proving the module abstraction generalizes cleanly — should be materially smaller than Phase C since all the infra (hook, views, result screen) already exists.

**Files**:
- `src/components/VocabularyGame.tsx`: new optional prop `onComplete?: (results: SessionResult[]) => void`. Add `useEffect(() => { if (phase === "done") onComplete?.(sessionResults); }, [phase])` right after the existing state declarations — fires once when the internal queue finishes. Purely additive — `VocabModuleViews.tsx`'s existing usage doesn't pass it, unaffected.
- `src/views/modules/CompetitionModuleViews.tsx`: wire the Vocab play path — resolve `quiz_config.items` (hiragana strings) to `VocabWord[]` via `VOCABULARY.filter(w => items.includes(w.hiragana))` (natural key `.hiragana` — confirmed `VocabWord` has no `.id` field), mount `<VocabularyGame vocabulary={pool} sessionLimit={pool.length} onComplete={...} .../>` directly, derive `{correct, total}` from `results.filter(r => r.correct).length` / `results.length`, call `submitResult`. Same "conditional button on existing completion screen" routing pattern as Phase C, applied to `VocabularyGame`'s internal `phase === "done"` summary.

**Verification**: repeat Phase C's full two-profile create→play→result→history cycle, this time creating a Vocabulary/spell-it competition. Confirm identical correctness (scores, completion trigger, history) with the second module.

---

## Phase E — Polish & edge cases `[ ]`

**Goal**: the feature is robust to the rough edges identified during design, not just the happy path.

- `npm run build` passes with Supabase env vars unset — competition UI stays fully hidden behind `isSupabaseConfigured`, same gate as `SyncPanel` (#15's own acceptance bar).
- Refreshing mid-flow doesn't resurrect an already-consumed invite prompt (sessionStorage should be cleared by `consumeInviteCode`).
- Joining an expired competition (`expires_at` in the past) shows a clear "reto expirado" message rather than silently allowing it or crashing.
- Confirm `competition_summary` is genuinely RLS-respecting (not accidentally `security definer`) — a user who isn't a participant of a given competition should get zero rows back for it even though the view technically joins across all completed competitions.

---

## Critical files (full list, referenced across phases)

- `supabase/migrations/0002_competitions.sql` (new, Phase A)
- `src/hooks/useCompetition.ts` (new, Phase B, extended in Phase C)
- `src/views/modules/CompetitionModuleViews.tsx` + `src/views/Competition{Home,Create,Join}View.tsx` (new, Phase B), `CompetitionResultView.tsx` (new, Phase C)
- `src/hooks/useSession.ts` (edit, Phase C: `startSession` completion callback, `goNext()`)
- `src/components/VocabularyGame.tsx` (edit, Phase D: `onComplete` prop)
- `src/App.tsx` (edit, Phase B: mount `CompetitionModuleViews`, deep-link parsing effect)
- `src/data.ts` (edit, Phase B: new `ViewName` members)
