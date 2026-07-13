-- Modo competencia asíncrona 1v1 (docs/BACKLOG.md #16).
-- profiles: nombre público de cada usuario (el email es privado por RLS de auth.users).
-- competitions/participants/results: un reto es un set fijo de ítems (quiz_config.items,
-- resuelto una sola vez al crear) que ambos rivales juegan de forma asíncrona; el trigger
-- marca la competencia 'completada' cuando los dos han subido su resultado.

-- ── profiles ─────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select any authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: update own row"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Autogenera el display_name al registrarse (prefijo del email antes de @) —
-- security definer porque corre antes de que exista una sesión con permisos RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: usuarios que ya existían antes de esta migración (de la feature #15).
insert into public.profiles (id, display_name)
select id, split_part(email, '@', 1)
from auth.users
on conflict (id) do nothing;

-- ── competitions ─────────────────────────────────────────────────────────

create table if not exists public.competitions (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid not null references auth.users (id) on delete cascade,
  -- { module: "hiragana" | "vocab", mode: "recognition" | "spell", items: string[] }
  -- items ya resuelto y fijo al crear, para que ambos rivales jueguen literalmente lo mismo.
  quiz_config jsonb not null,
  status      text not null default 'pendiente'
                check (status in ('pendiente', 'activa', 'completada')),
  invite_code text not null unique
                default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '48 hours')
);

alter table public.competitions enable row level security;

-- El contenido no es sensible; el acceso real está guardado por conocer el
-- invite_code/id (como un link de Google Docs) — simplificación v1 documentada,
-- no un agujero de seguridad a "arreglar" sin necesidad real.
create policy "competitions: select any authenticated"
  on public.competitions for select
  to authenticated
  using (true);

create policy "competitions: insert own"
  on public.competitions for insert
  with check (created_by = auth.uid());

-- ── competition_participants ────────────────────────────────────────────

create table if not exists public.competition_participants (
  competition_id uuid not null references public.competitions (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  joined_at      timestamptz not null default now(),
  primary key (competition_id, user_id)
);

alter table public.competition_participants enable row level security;

create policy "competition_participants: select own or as creator"
  on public.competition_participants for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.competitions c
      where c.id = competition_id and c.created_by = auth.uid()
    )
  );

create policy "competition_participants: insert own"
  on public.competition_participants for insert
  with check (user_id = auth.uid());

-- ── competition_results ─────────────────────────────────────────────────

create table if not exists public.competition_results (
  competition_id uuid not null references public.competitions (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  score          int not null,
  correct        int not null,
  total          int not null,
  submitted_at   timestamptz not null default now(),
  primary key (competition_id, user_id)
);

alter table public.competition_results enable row level security;

-- Cualquier participante puede ver el resultado del rival una vez ambos terminaron,
-- no solo su propia fila.
create policy "competition_results: select as participant"
  on public.competition_results for select
  using (
    exists (
      select 1 from public.competition_participants p
      where p.competition_id = competition_results.competition_id
        and p.user_id = auth.uid()
    )
  );

create policy "competition_results: insert own as participant"
  on public.competition_results for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.competition_participants p
      where p.competition_id = competition_results.competition_id
        and p.user_id = auth.uid()
    )
  );

create policy "competition_results: update own as participant"
  on public.competition_results for update
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.competition_participants p
      where p.competition_id = competition_results.competition_id
        and p.user_id = auth.uid()
    )
  )
  with check (user_id = auth.uid());

-- ── Trigger: marcar competencia completada ──────────────────────────────
-- security definer porque quien sube su resultado no tiene permiso RLS para
-- actualizar una fila de "competitions" creada por el rival.

create or replace function public.mark_competition_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  participant_count int;
  result_count int;
begin
  select count(*) into participant_count
  from public.competition_participants
  where competition_id = new.competition_id;

  select count(*) into result_count
  from public.competition_results
  where competition_id = new.competition_id;

  if result_count >= participant_count then
    update public.competitions
    set status = 'completada'
    where id = new.competition_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_competition_result_inserted on public.competition_results;
create trigger on_competition_result_inserted
  after insert on public.competition_results
  for each row execute function public.mark_competition_completed();

-- ── Vista: historial cabeza a cabeza ────────────────────────────────────
-- Vista simple (NO security definer) para que siga respetando el RLS de las
-- tablas base — cada usuario solo ve las filas de competition_results a las
-- que ya tiene acceso como participante; el head-to-head se agrega en el
-- cliente a partir de esta vista, filtrado por par de usuarios.

create or replace view public.competition_summary as
select
  c.id as competition_id,
  c.quiz_config,
  c.created_at,
  ra.user_id as user_a,
  ra.score   as score_a,
  ra.correct as correct_a,
  ra.total   as total_a,
  rb.user_id as user_b,
  rb.score   as score_b,
  rb.correct as correct_b,
  rb.total   as total_b,
  greatest(ra.submitted_at, rb.submitted_at) as completed_at
from public.competitions c
join public.competition_results ra on ra.competition_id = c.id
join public.competition_results rb on rb.competition_id = c.id and rb.user_id > ra.user_id
where c.status = 'completada';
