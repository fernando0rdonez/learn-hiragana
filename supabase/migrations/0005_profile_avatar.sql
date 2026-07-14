-- Avatar de perfil elegible por el usuario (ver src/avatars.ts para el catálogo de ids).
-- Sin migración de RLS: la policy "profiles: update own row" (0002) ya cubre esta columna.

alter table public.profiles
  add column if not exists avatar_id text not null default 'doctor';
