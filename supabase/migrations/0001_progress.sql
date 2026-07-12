-- Sync de progreso entre dispositivos (docs/BACKLOG.md #15).
-- Una fila por usuario con el ProgressData completo tal cual se serializa hoy
-- para exportar/importar (src/storage.ts). Sin sync granular por ítem: el
-- cliente sube/baja el blob entero.

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "progress: select own row"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "progress: insert own row"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "progress: update own row"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
