-- Raises the competition participant cap from 6 to 10 (see docs/GOALS_PLAN.md, Phase 0):
-- competitions and shared goals now share a single 10-person limit.
-- Same body as 0003, only the constant changes; the existing trigger keeps pointing at
-- this function, so no trigger changes are needed.

create or replace function public.enforce_participant_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_count int;
  max_participants constant int := 10;
begin
  select count(*) into existing_count
  from public.competition_participants
  where competition_id = new.competition_id;

  if existing_count >= max_participants then
    raise exception 'Este reto ya llegó al máximo de % jugadores.', max_participants
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;
