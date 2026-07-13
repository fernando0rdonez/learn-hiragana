-- Permite que cualquier usuario autenticado vea competition_participants de
-- cualquier reto (docs/BACKLOG.md #16). La política original de 0002 solo dejaba
-- ver la propia fila o, si eras el creador, todas — eso bloqueaba la pantalla de
-- "unirse" (CompetitionJoinView), que necesita mostrar cuántos ya se unieron
-- ANTES de que el usuario se una. Mismo razonamiento que la política de
-- "competitions" (0002): el contenido no es sensible, el acceso real está
-- guardado por conocer el invite_code.

drop policy if exists "competition_participants: select own or as creator" on public.competition_participants;

create policy "competition_participants: select any authenticated"
  on public.competition_participants for select
  to authenticated
  using (true);
