-- Soft delete for competitions and shared goals. Only the creator can delete
-- (via the RPCs below); the row and all its children are kept, so a delete can
-- be undone from the database. SELECT policies hide deleted rows from clients,
-- which makes them disappear from every list, board and invite-code lookup.

alter table public.competitions add column if not exists deleted_at timestamptz;
alter table public.goals        add column if not exists deleted_at timestamptz;

drop policy if exists "competitions: select any authenticated" on public.competitions;
create policy "competitions: select any authenticated"
  on public.competitions for select
  to authenticated
  using (deleted_at is null);

drop policy if exists "goals: select any authenticated" on public.goals;
create policy "goals: select any authenticated"
  on public.goals for select
  to authenticated
  using (deleted_at is null);

-- Returns true when a row was deleted (false = not found, not yours, or already deleted).
create or replace function public.delete_competition(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  update public.competitions set deleted_at = now()
   where id = p_id and created_by = auth.uid() and deleted_at is null;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

create or replace function public.delete_goal(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  update public.goals set deleted_at = now()
   where id = p_id and created_by = auth.uid() and deleted_at is null;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.delete_competition(uuid) from public, anon;
revoke all on function public.delete_goal(uuid) from public, anon;
grant execute on function public.delete_competition(uuid) to authenticated;
grant execute on function public.delete_goal(uuid) to authenticated;
