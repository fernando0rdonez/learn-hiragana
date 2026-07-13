-- Caps group challenges at 6 players (docs/BACKLOG.md #16, extended beyond the spec's
-- original "1v1" framing to allow small-group challenges — see docs/COMPETITION_PLAN.md).
-- Nothing in 0002 limited participant count: the composite PK on competition_participants
-- only blocks the SAME user joining twice, not a 3rd+ distinct user. Result display is a
-- ranked leaderboard (any N works); rival history stays pairwise via competition_summary's
-- self-join, which already generalizes correctly to N participants without changes.

create or replace function public.enforce_participant_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_count int;
  max_participants constant int := 6;
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

drop trigger if exists on_competition_participant_insert on public.competition_participants;
create trigger on_competition_participant_insert
  before insert on public.competition_participants
  for each row execute function public.enforce_participant_cap();
