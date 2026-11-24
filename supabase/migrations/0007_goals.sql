-- Shared Goals ("Metas compartidas"), docs/GOALS_PLAN.md Phase A.
-- goals: a daily study commitment (1–3 tasks) over a fixed 7/14/30-day window, shared by invite code.
-- goal_participants: who joined (max 10, same cap as competitions — see 0006).
-- goal_checkins: per user/task/local day session counter, readable by every participant so
-- the board can show who studied when. `progress` stays private and untouched.
-- All writes to goal_checkins go through record_goal_session(), which validates the date window.

-- ── goals ───────────────────────────────────────────────────────────────

create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  created_by    uuid not null references auth.users (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 120),
  -- GoalTask[]: { id, module: "grammar" | "vocab" | "hiragana", target: { lessonId?, book?, category? }, perDay: 1..3 }
  -- Shape validated client-side (src/goals.ts); the DB only enforces it's a 1–3 element array.
  tasks         jsonb not null
                  check (jsonb_typeof(tasks) = 'array' and jsonb_array_length(tasks) between 1 and 3),
  duration_days int not null check (duration_days in (7, 14, 30)),
  -- Creator's local date at creation; day N of the goal is start_date + (N - 1).
  start_date    date not null,
  invite_code   text not null unique
                  default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_at    timestamptz not null default now()
);

alter table public.goals enable row level security;

-- Same "unguessable link" reasoning as competitions (0002): content isn't sensitive,
-- access is gated by knowing the invite code.
create policy "goals: select any authenticated"
  on public.goals for select
  to authenticated
  using (true);

-- start_date must be "today" in some timezone (UTC ±1 day), so a goal can't be backdated.
create policy "goals: insert own"
  on public.goals for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and start_date between (now() at time zone 'utc')::date - 1
                       and (now() at time zone 'utc')::date + 1
  );

-- ── goal_participants ───────────────────────────────────────────────────

create table if not exists public.goal_participants (
  goal_id     uuid not null references public.goals (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  joined_at   timestamptz not null default now(),
  -- Joiner's local date; days before it render as "—" on the board instead of missed.
  joined_date date not null,
  primary key (goal_id, user_id)
);

alter table public.goal_participants enable row level security;

-- Open select, learned from 0004: the join preview must count participants before you join.
create policy "goal_participants: select any authenticated"
  on public.goal_participants for select
  to authenticated
  using (true);

-- Only yourself, and only while the goal hasn't ended (UTC +1 day slack for timezones).
create policy "goal_participants: insert own while active"
  on public.goal_participants for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.goals g
      where g.id = goal_id
        and (now() at time zone 'utc')::date - 1 <= g.start_date + g.duration_days - 1
    )
  );

create or replace function public.enforce_goal_participant_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_count int;
  max_participants constant int := 10;
begin
  -- Serialize concurrent joins on the same goal so two last-slot joins can't both pass.
  perform 1 from public.goals where id = new.goal_id for update;

  select count(*) into existing_count
  from public.goal_participants
  where goal_id = new.goal_id;

  if existing_count >= max_participants then
    raise exception 'Esta meta ya llegó al máximo de % personas.', max_participants
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists on_goal_participant_insert on public.goal_participants;
create trigger on_goal_participant_insert
  before insert on public.goal_participants
  for each row execute function public.enforce_goal_participant_cap();

-- ── goal_checkins ───────────────────────────────────────────────────────

create table if not exists public.goal_checkins (
  goal_id    uuid not null references public.goals (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  task_id    text not null,
  local_date date not null,
  sessions   int not null default 0 check (sessions >= 0),
  updated_at timestamptz not null default now(),
  primary key (goal_id, user_id, task_id, local_date)
);

alter table public.goal_checkins enable row level security;

-- Every participant sees everyone's check-ins for that goal (the board). No insert/update
-- policies on purpose: writes only happen through record_goal_session().
create policy "goal_checkins: select as participant"
  on public.goal_checkins for select
  to authenticated
  using (
    exists (
      select 1 from public.goal_participants p
      where p.goal_id = goal_checkins.goal_id
        and p.user_id = auth.uid()
    )
  );

-- ── RPC: record_goal_session ────────────────────────────────────────────
-- Atomically adds one finished session to (goal, me, task, local day) and returns the new count.
-- security definer because there's no direct write policy on goal_checkins; every rule a
-- policy would have enforced is checked explicitly here instead.

create or replace function public.record_goal_session(
  p_goal_id    uuid,
  p_task_id    text,
  p_local_date date
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_goal  public.goals%rowtype;
  v_today date := (now() at time zone 'utc')::date;
  v_count int;
begin
  if v_user is null then
    raise exception 'Necesitas iniciar sesión.' using errcode = '28000';
  end if;

  select * into v_goal from public.goals where id = p_goal_id;
  if not found then
    raise exception 'Meta no encontrada.' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.goal_participants
    where goal_id = p_goal_id and user_id = v_user
  ) then
    raise exception 'No participas en esta meta.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from jsonb_array_elements(v_goal.tasks) t
    where t->>'id' = p_task_id
  ) then
    raise exception 'Tarea desconocida para esta meta.' using errcode = '22023';
  end if;

  -- Local "today" is at most one day away from UTC "today" in any timezone; this blocks backdating.
  if p_local_date not between v_today - 1 and v_today + 1 then
    raise exception 'Fecha fuera de rango.' using errcode = '22008';
  end if;

  if p_local_date < v_goal.start_date
     or p_local_date > v_goal.start_date + v_goal.duration_days - 1 then
    raise exception 'La fecha no está dentro de la meta.' using errcode = '22008';
  end if;

  insert into public.goal_checkins as c (goal_id, user_id, task_id, local_date, sessions)
  values (p_goal_id, v_user, p_task_id, p_local_date, 1)
  on conflict (goal_id, user_id, task_id, local_date)
  do update set sessions = c.sessions + 1, updated_at = now()
  returning c.sessions into v_count;

  return v_count;
end;
$$;

revoke all on function public.record_goal_session(uuid, text, date) from public, anon;
grant execute on function public.record_goal_session(uuid, text, date) to authenticated;
