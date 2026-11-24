-- competition_summary was created as a plain view, which Postgres runs with the
-- privileges of its owner (postgres). That bypasses the RLS on
-- competition_results, so any client holding the public anon key could read
-- every completed competition's scores through the view.
--
-- security_invoker makes the view run as the querying user, so the base tables'
-- RLS applies: a user only sees rows for competitions they took part in. The
-- head-to-head history in the client already filters to the current user, so it
-- keeps working unchanged. Signed-out clients have no use for the view at all.

alter view public.competition_summary set (security_invoker = true);

revoke all on public.competition_summary from anon;
