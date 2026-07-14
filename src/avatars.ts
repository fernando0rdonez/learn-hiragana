import foxDoctor from "./assets/character/fox-doctor.png";
import foxFirefighter from "./assets/character/fox-firefighter.png";
import foxChef from "./assets/character/fox-chef.png";
import foxTeacher from "./assets/character/fox-teacher.png";
import foxGirlDoctor from "./assets/character/fox-girl-doctor.png";
import foxPainter from "./assets/character/fox-painter.png";
import foxGirlChef from "./assets/character/fox-girl-chef.png";
import foxGirlTeacher from "./assets/character/fox-girl-teacher.png";

export interface AvatarOption {
  id: string;
  src: string;
  label: string;
}

/** Avatares de perfil elegibles por el usuario — ver docs/BACKLOG.md (perfil de competencia). */
export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "doctor",       src: foxDoctor,       label: "Doctor" },
  { id: "firefighter",  src: foxFirefighter,  label: "Bombero" },
  { id: "chef",         src: foxChef,         label: "Chef" },
  { id: "teacher",      src: foxTeacher,      label: "Maestro" },
  { id: "girl-doctor",  src: foxGirlDoctor,   label: "Doctora" },
  { id: "painter",      src: foxPainter,      label: "Pintora" },
  { id: "girl-chef",    src: foxGirlChef,     label: "Chef" },
  { id: "girl-teacher", src: foxGirlTeacher,  label: "Maestra" },
];

export const DEFAULT_AVATAR_ID = AVATAR_OPTIONS[0].id;

const AVATAR_BY_ID = new Map(AVATAR_OPTIONS.map((a) => [a.id, a]));

export function avatarSrc(avatarId: string | null | undefined): string {
  return (avatarId && AVATAR_BY_ID.get(avatarId)?.src) || AVATAR_OPTIONS[0].src;
}
