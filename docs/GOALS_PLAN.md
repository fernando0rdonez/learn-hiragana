# Shared Goals ("Metas compartidas") — MVP

Implementation plan for a cooperative, habit-based counterpart to the async Competition mode ([`COMPETITION_PLAN.md`](./COMPETITION_PLAN.md)).
Each phase is self-contained and independently verifiable — pick up at the first `[ ]` in a fresh session.
Status: `[ ]` todo · `[~]` in progress · `[x]` done

## Context

Competition rewards being the best on a single one-shot attempt. A **Shared Goal** rewards *consistency*: someone defines a daily study commitment (e.g. "2 grammar sessions per day of lesson *Partícula に*", or "1 vocabulary session of *Familia* + 1 grammar session"), shares a link, and everyone who joins sees a people × days grid of who completed the goal on which day, plus each person's streak within the goal.

### Decisions (confirmed with user)

- **No "translate a phrase" task** in this feature. Tasks only reference study modes that already exist.
- **Max 10 participants per goal.** The competition cap is raised from 6 to 10 as well, so both social features share one limit (Phase 0).

### Decisions (defaults proposed, not yet explicitly confirmed — revisit before Phase D if the user objects)

- **A day counts as ✅ only when every task in the goal hit its daily target.** Partial days show as ◐ (some progress), untouched days as ⬜. Streak and completion % only count ✅ days.
- **Goals have a fixed duration: 7, 14 or 30 days**, starting on the creator's local date at creation. A finished goal stays visible (read-only) in the list.
- **1–3 tasks per goal**, each with a daily session target of 1–3.
- No push notifications in the MVP.

### Task types (MVP)

| Module | Target options | What counts as one session |
|---|---|---|
| `grammar` | a specific lesson (`GrammarLesson.id`), a whole book (`GrammarBook`: "Japonés Básico I/II", "Extra"), or any grammar | `GrammarLessonGame` reaching `phase === "done"`; `ParticleOrderGame` ("Ordena el tren") reaching `"done"` counts only for "any grammar" |
| `vocab` | a category (`VocabCategory.id`) or any vocabulary | `VocabularyGame` / `VocabRecognizeGame` / `VocabListeningGame` reaching `"done"` with a pool from that category |
| `hiragana` | any | a kana quiz session finishing through `useSession` (the `onSessionComplete` path) |

A session must actually be finished (reach the summary/done screen) to count. Leaving halfway counts nothing.

### Why a new table instead of reading `progress`

`progress` is one private JSON blob per user (RLS: own row only, `0001_progress.sql`), so participants can't see each other's activity. Goals need a small shared log of *daily check-ins* readable by everyone in the goal. Nothing in `progress` changes.

### Dates

A "day" is the **participant's local date** (`toISODate()` in `src/utils.ts`), not UTC, so a session at 11 pm counts for that evening. The client sends its local date; the DB accepts it only within ±1 day of `now()` at UTC (covers every timezone, blocks backdating) and only inside the goal's window.

---

## Phase 0 — Raise the competition cap to 10 `[x]` (2026-11-23: `0006` applied via `supabase db push`; build + 113 tests pass; Home shows "Hasta 10 jugadores")

**Goal**: competitions accept up to 10 players; nothing else changes.

**Files**:
- `supabase/migrations/0006_competition_cap_10.sql`: `create or replace function public.enforce_participant_cap()` with `max_participants constant int := 10` (same body as `0003`).
- `src/hooks/useCompetition.ts`: `MAX_PLAYERS = 10`, fix the "N de 6" comment.
- Hardcoded UI copy: `CompetitionJoinView.tsx` ("de 6 ya se unieron", "máximo de 6 jugadores"), `CompetitionHomeView.tsx` ("hasta 6 jugadores"), `CompetitionCreateView.tsx` and `CompetitionShareView.tsx` ("Hasta 6 personas"). Prefer interpolating `MAX_PLAYERS` (export it) over re-hardcoding 10.
- Update the "up to 6 players" wording at the top of `COMPETITION_PLAN.md`.

**Verification**: `supabase db push`; build passes; the join preview shows "N de 10". Note: the trigger raises a message with the number interpolated, so the friendly error updates automatically.

---

## Phase A — Database schema `[x]` (2026-11-23: `0007_goals.sql` applied via `supabase db push`)

**File**: `supabase/migrations/0007_goals.sql` (same style as `0002`: plain SQL, named RLS policies).

- **`goals`**: `id uuid PK default gen_random_uuid()`, `created_by uuid references auth.users on delete cascade`, `title text not null` (auto-generated from the tasks, editable later), `tasks jsonb not null` (`GoalTask[]`, see below), `duration_days int not null check (duration_days in (7, 14, 30))`, `start_date date not null`, `invite_code text unique` (same 8-char default as `competitions`), `created_at`.
  `GoalTask = { id: string; module: "grammar" | "vocab" | "hiragana"; target: { lessonId?: string; book?: string; category?: string }; perDay: 1 | 2 | 3 }`. Validated client-side; `jsonb` stays unconstrained like `quiz_config`.
  RLS: `select` any authenticated (same "unguessable link" reasoning as `competitions`), `insert` own only.
- **`goal_participants`**: PK `(goal_id, user_id)`, `joined_at`, `joined_date date not null` (joiner's local date — days before it render as "—", not as missed).
  RLS: `select` any authenticated (lesson learned in `0004`: the join preview must count participants before you join), `insert` own only. `before insert` cap trigger at **10** (copy of `enforce_participant_cap`, own function `enforce_goal_participant_cap`, error "Esta meta ya llegó al máximo de % personas.").
- **`goal_checkins`**: PK `(goal_id, user_id, task_id, local_date)`, `sessions int not null default 0`, `updated_at`.
  RLS: `select` if you are a participant of that goal; no direct insert/update policies — writes go through the RPC below.
- **RPC `record_goal_session(p_goal_id uuid, p_task_id text, p_local_date date)`**, `security definer`, `set search_path = public`: checks `auth.uid()` is a participant, `p_local_date` is within `start_date .. start_date + duration_days - 1`, and within ±1 day of `(now() at time zone 'utc')::date`; then `insert ... on conflict (goal_id, user_id, task_id, local_date) do update set sessions = goal_checkins.sessions + 1, updated_at = now()`. Atomic increment, no read-modify-write race when two tabs finish at once. Returns the new `sessions` count.

**Verification**: `supabase db push`; `supabase inspect db table-stats --linked` shows the 3 tables; unauthenticated REST `GET /rest/v1/goals` returns `[]`. Calling the RPC with a date outside the window raises an error.

**Actually verified** (2026-11-23):
- `table-stats` lists `goals`, `goal_participants`, `goal_checkins`; anon REST `GET` on all three returns `[]`; anon `POST /rest/v1/rpc/record_goal_session` → `42501 permission denied`.
- Authenticated behavior tested with `supabase db query --linked -f <script>`: one transaction that does `set local role authenticated`, sets `request.jwt.claims` via `set_config` to impersonate a real user (so `auth.uid()` and RLS behave as in the app), runs every case inside a `do` block with per-case `exception` handlers, and ends with `raise exception` carrying the results, so the whole transaction rolls back and nothing persists (confirmed: all three tables still at 0 rows). All 14 cases passed: create goal; check-in before joining rejected; join own goal; RPC returns 1 then 2 (atomic increment); participant reads check-ins; unknown task rejected; backdated check-in rejected; direct `goal_checkins` insert blocked by RLS; backdated goal blocked by RLS; 5-day duration rejected; joining as another user rejected; non-participant sees 0 check-ins but the participant count (for the join preview).
- Gotcha: `profiles.display_name` is user-editable (it's no longer the email prefix for the test accounts), so look test users up by `auth.users.email` *before* `set local role authenticated`, and pass the id in through a custom setting (`set_config('test.me', ...)`).
- Not tested: the 10-participant cap (needs 11 real users; same trigger pattern as competitions, plus a `for update` lock on the goal row against concurrent last-slot joins).

---

## Phase B — Create / join / list (no check-ins yet) `[x]` (second-account cold join verified in Phase D's two-account test)

**Goal**: two accounts can create a goal, share the link, and both see it in their goal list.

**Files**:
- `src/goals.ts` (new, pure, no Supabase): `GoalTask` / `Goal` types, `goalTitle(tasks)`, `taskLabel(task)` (e.g. "2 sesiones · Gramática: Partícula に"), `goalDays(goal)` (array of ISO dates), `isGoalActive(goal, today)`.
- `src/hooks/useGoals.ts` (new, modeled on `useCompetition.ts`, same `!isSupabaseConfigured || !session` no-op gate): `myGoals`, `createGoal(tasks, durationDays)` (inserts goal with `start_date = toISODate()` + self as participant, returns invite link `${origin}${BASE_URL}meta/${invite_code}`), `previewGoal(code)`, `joinGoal(code)` (treats `23505` as already joined; surfaces the cap trigger message), `stashGoalCode` / `consumeGoalCode` (`sessionStorage`, key `pendingGoalCode`). Share via `navigator.share` with clipboard fallback — reuse the competition helper if it's extractable.
- `src/data.ts`: add `"goalHome" | "goalCreate" | "goalShare" | "goalJoin" | "goalBoard"` to `ViewName`.
- `src/views/modules/GoalModuleViews.tsx` + views `GoalHomeView.tsx` (login CTA when logged out; "Crear meta"; list split into Activas / Terminadas, each row "Día 4 de 14 · 5 personas"), `GoalCreateView.tsx` (add up to 3 tasks: pick module → target → per-day 1/2/3; duration 7/14/30; preview of the generated title), `GoalShareView.tsx`, `GoalJoinView.tsx` ("X te invitó a: …", task list, "N de 10 ya se unieron", "Unirme").
- `src/App.tsx`: instantiate `useGoals`, mount `GoalModuleViews`, **add the new views to the view-gate list** (the blank-page gotcha from Competition Phase F), and a `/meta/:code` deep-link branch next to `/compete/:code` that always navigates to `goalJoin` regardless of session (same reasoning as the competition fix).
- `src/views/HomeView.tsx`: "Metas" entry card next to "Competir".

**Verification**: with the two test accounts from `COMPETITION_PLAN.md`: A creates a 7-day goal with a grammar-lesson task; B opens the link cold (logged out), logs in via OTP, lands on `goalJoin` with the code intact, joins; both see it in `GoalHomeView`. Garbage code → friendly error. Zero console errors.

**Actually verified** (2026-11-23, Chrome, one real account against the hosted project): Home shows the "Metas con amigos" card; `goalHome` → `goalCreate` with 2 tasks (grammar lesson *Partícula に* ×2 + vocab *Familia* ×1, 7 days) → created, lands on `goalShare` ("Día 1 de 7 · 1 persona", code + `/meta/:code` link); the goal is listed under "Activas"; opening its `/meta/:code` link as the creator shows "Tu meta" + "Ya estás en esta meta · Ver" (23505 path → back to `goalShare`); `/meta/nope1234` → "No encontramos esa meta…". Zero console errors. Test goal left in the DB: code `222651a8`.

**Fixed during verification**:
- A stashed code that's never consumed (bad code, or the creator opening their own link and navigating away) made every reload bounce back to `goalJoin`, because App's `[session]` effect re-routes whenever a code is pending. `GoalJoinView` now has a "← Metas" back button, and both it and the error screen's "Ir a Metas" call `consumeGoalCode()`. **The competition join view has the same bug** (no back button; `competeJoin` keeps reopening until you press "Unirme") — not fixed here, worth a small follow-up.
- Labels use "Gramática — <lesson>" instead of "Gramática: <lesson>", since many lesson titles already contain a colon.

**Still to test**: a second account opening the link cold (logged out → OTP → join) and both accounts seeing "2 personas"; layout at phone width.

---

## Phase C — Recording sessions (check-ins) `[~]` (built; vocab path verified live, other games only via unit tests + build)

**Goal**: finishing a matching study session increments today's check-in for every active goal task it satisfies.

**Files**:
- `src/goals.ts`: `type StudyEvent = { module: "grammar"; lessonId: string; book: GrammarBook } | { module: "grammarTrain" } | { module: "vocab"; categories: string[] } | { module: "hiragana" }` and `matchingTasks(goals, event, today): { goalId; taskId }[]` — pure, filters to active goals and to tasks whose target matches. Unit tests in `src/goals.test.ts` (lesson vs book vs any; vocab category vs any; inactive/ended goals ignored; a single event can satisfy tasks in several goals).
- `useGoals.recordStudyEvent(event)`: runs `matchingTasks` and calls `record_goal_session` for each match. On network failure, push to a small `localStorage` queue (`pendingGoalCheckins`, wrapped in try/catch) and flush on next load / `online` event. The DB still enforces the date window, so a stale queued item is simply rejected and dropped.
- Wire `onComplete` callbacks (most games already expose one for competitions):
  - `GrammarLessonGame`: add `onComplete?: () => void`, fire once when `phase` becomes `"done"` after a real session (not the `session.length === 0` early exit).
  - `ParticleOrderGame`: same, emits `{ module: "grammarTrain" }`.
  - `VocabularyGame` already has `onComplete`; add the same to `VocabRecognizeGame` / `VocabListeningGame` if missing. Emit the categories of `vocabSessionPool`.
  - Hiragana: emit from the `onSessionComplete` path in `useSession` (or from where `App.tsx` starts a normal kana session) — check that competition sessions don't double-count (they use the same hook; competition play shouldn't count toward goals in the MVP).
  - Thread `recordStudyEvent` through `GrammarModuleViews` / `VocabModuleViews` props like the existing `onProgressUpdate`.
- Small toast/banner on the done screen when a goal task was advanced ("Meta: 1/2 sesiones de gramática hoy"). Optional if it complicates the done screens; can move to Phase D.

**Verification**: unit tests pass; live, finish one grammar lesson session → `goal_checkins` row with `sessions = 1`; finish another → `2`; a non-matching lesson doesn't create a row. Offline (DevTools) → queued, then flushed when back online.

**As built** (2026-11-23):
- `src/goals.ts`: `StudyEvent`, `taskMatchesEvent`, `matchingTasks` (+ 5 unit tests). Vocab rule: a session counts for a category task when **≥ 50 % of its words** are from that category (`VOCAB_CATEGORY_SHARE`), so "all categories" doesn't satisfy "Familia" but a few extra words are fine. The particle train counts only for "any grammar".
- `useGoals.recordStudyEvent(event)` → `record_goal_session` RPC per match; a matched goal list is read from a ref (game callbacks are created in earlier renders). Network failures (PostgREST error without SQLSTATE `code`) go to `localStorage.pendingGoalCheckins` (capped at 50) and are flushed on load / `online`; DB rejections are dropped.
- Game hooks: `onComplete` on `GrammarLessonGame` (last exercise, not the empty-session early exit), `ParticleOrderGame`, `VocabRecognizeGame`, `VocabListeningGame` (`VocabularyGame` already had one); kana sessions report through a new `useSession({ onPracticeSessionComplete })` that skips competition sessions, and App drops katakana pools.
- `GoalToast` (App level, 5 s): "Meta compartida · <task> · n/perDay hoy", green "Tarea de hoy cumplida" once the task's daily target is reached; tapping it opens Metas.

**Actually verified** (Chrome, real account, goal `222651a8`): a 10-word *Reconocer* session with only Familia selected → toast "Tarea de hoy cumplida · Vocabulario — Familia · 1/1 hoy", and exactly one `goal_checkins` row (`task = vocab/familia`, `local_date = 2026-11-23`, `sessions = 1`). Build + 124 tests pass; no new lint errors in touched files.

**Not yet verified live**: grammar lesson / particle train / hiragana sessions, the ×2 increment, a non-matching session creating no row, and the offline queue.

---

## Phase D — Goal board + Home nudge `[x]` (verified with two accounts; ✅ day only via unit tests)

**Goal**: everyone in the goal sees who studied on which day.

**Files**:
- `useGoals.loadBoard(goalId)`: fetch goal, participants (+ `profiles` name/avatar), and all `goal_checkins` for the goal (≤ 10 people × 30 days × 3 tasks = 900 rows max, one query is fine).
- `src/goals.ts`: `dayStatus(goal, checkins, userId, date): "done" | "partial" | "missed" | "future" | "beforeJoin"`, `goalStreak(...)` (consecutive ✅ days ending today, or yesterday if today isn't done yet — no tolerance days, unlike the global streak), `completionRate(...)`. Unit-tested.
- `src/views/GoalBoardView.tsx`: header with title, tasks, "Día X de N"; a horizontally scrollable grid of people (rows, avatar + name, me first) × days (columns, today highlighted) with ✅ ◐ ⬜ —; per-person streak and %. Below, "Hoy" for me: each task with progress (1/2) and a button that jumps to the matching practice (`setSelectedGrammarLessonId` + `grammarLesson`, vocab category setup, or `hiraganaSetup`).
- `HomeView`: if I have an active goal with unfinished tasks today, a compact card "Meta: te falta 1 sesión de gramática" → `goalBoard`.

**Verification**: with both accounts, A completes today's tasks, B completes one of two → A sees A ✅ / B ◐ and B sees the same. Mobile width (375px) grid scrolls without page overflow. Zero console errors.

**As built** (2026-11-23):
- `src/goals.ts`: `sessionLookup`, `dayStatus` (`done | partial | pending | missed | future | beforeJoin`), `goalStreak` (counts back from today, or from yesterday while today is open; after the end, from the last day), `completionRate` (today only counts once done, so it doesn't dip every morning; `null` before the first closed day), `todayProgress`, `remainingSummary` (+ 4 unit tests).
- `useGoals.loadBoard(goalId)` (goal, participants ordered by join with profiles, me first, all check-ins); `MyGoal.todaySessions` (my sessions today per task, loaded in `refreshGoals` and patched by `recordStudyEvent`).
- `GoalBoardView`: "Tu día de hoy" with per-task progress segments and **Practicar** (grammar lesson → that lesson; book/any → grammar setup; vocab category → vocab setup with only that category selected; hiragana → hiragana setup), "Invitar" → `goalShare`, and the people × days grid (sticky name column with streak 🔥 and %, horizontal scroll that starts centered on today, legend).
- Navigation: opening a goal (list, join, Home card) → `goalBoard`; creating a goal → `goalShare` first (nobody to show yet); `goalShare`'s back → board.
- Home: card "Meta · <title> — Te falta 1 sesión de …" for the first active goal with open tasks (placed with `mt-14` so the hero's fox doesn't overlap it).

**Actually verified** (Chrome, one real account, goal `222651a8` with vocab done and grammar 0/2): Home card reads "Te faltan 2 sesiones de Gramática — Partícula に…"; it opens the board with "Día 1 de 7 · 1 persona · 0 ya cumplió hoy", Familia "1/1 Listo", grammar "0/2 Practicar", and today's cell as ◐ "A medias"; Practicar opens the *Partícula に* lesson. Build + 128 tests pass; no console errors after a full reload.

**Two-account test** (2026-11-23; account B in the desktop app's built-in browser so A's Chrome session stayed signed in):
- B opened `/meta/222651a8` **logged out** → "Inicia sesión para unirte"; signed in via OTP → landed straight on `goalJoin` with the code intact ("Fernando 🦊 te invitó a una meta · 1 de 10 ya se unieron") → joined → board "2 personas". This also closes Phase B's open item.
- B's **Practicar** on the vocab task opened Vocabulario with only Familia selected; a 10-word *Reconocer* session → toast "Tarea de hoy cumplida · Vocabulario — Familia · 1/1 hoy".
- Both boards (A in Chrome, B in the built-in browser) show the same thing: 2 rows, both ◐ today; each person's Home card says "Te faltan 2 sesiones de Gramática — …".
- Phone width (375 px emulated): page `scrollWidth` = 375 (no page overflow); the 7-day grid scrolls inside its own container (341 px visible / 360 px content).

**Still to test**: a ✅ day and a streak > 0 live (needs two grammar-lesson sessions; covered by unit tests only).

---

## Phase E — Polish (after MVP is used for a while) `[ ]`

- Finished-goal summary ("5 de 7 días · mejor racha 4"), "Repetir meta" to clone it with the same people via a new link.
- Creator can edit the title / leave a goal; participants can leave.
- Revisit the defaults above (all-tasks ✅, fixed duration) based on real use.
