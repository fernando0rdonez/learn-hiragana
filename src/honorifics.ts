// Módulo "Trato y Honoríficos" — cubre dos temas de japonés básico que
// ningún otro módulo entrena de forma activa:
//   1. Sufijos honoríficos さん / ちゃん / くん / さま (PDF pág. 07).
//   2. El cambio humilde ↔ honorífico al hablar de una familia (PDF pág. 08–09):
//      se usa la forma HUMILDE para la propia familia y la HONORÍFICA para la de
//      otras personas.
// Mecánica: elección entre opciones (patrón del drill "partícula hueca" de
// Gramática). Progreso SRS con claves `honorific-suffix:{id}` / `honorific-family:{id}`
// (helpers en src/utils.ts).

import type { ProgressItems } from "./types";
import { honorificStatus } from "./utils";

export type HonorificMode = "honorific-suffix" | "honorific-family";

/** Selección de tema en el setup: sufijos, familia, o ambos. */
export type HonorificGameMode = "suffix" | "family" | "both";

export interface HonorificExercise {
  id: string;
  mode: HonorificMode;
  situation: string;   // enunciado en español
  answer: string;      // opción correcta (en kana)
  options: string[];   // incluye `answer`
  note: string;        // explicación mostrada al corregir
}

export const HONORIFIC_INTRO: Record<HonorificMode, { title: string; text: string }> = {
  "honorific-suffix": {
    title: "Sufijos honoríficos",
    text: "En japonés casi nunca se llama a alguien solo por su nombre: se añade un sufijo que marca el grado de respeto. さん es el neutro y por defecto; さま es muy respetuoso (clientes, personas que admiras); ちゃん es cariñoso (niñas, gente muy cercana); くん se usa con chicos jóvenes o de menor jerarquía. Elige el sufijo adecuado a cada situación.",
  },
  "honorific-family": {
    title: "Familia: humilde y honorífica",
    text: "Cada miembro de la familia tiene dos palabras. La forma HUMILDE (はは, ちち, あに…) se usa al hablar de TU propia familia con otras personas. La forma HONORÍFICA (おかあさん, おとうさん, おにいさん…) se usa al hablar de la familia de OTRA persona, o al dirigirte a un familiar tuyo. Elige la forma correcta según de quién se habla.",
  },
};

export const HONORIFIC_EXERCISES: HonorificExercise[] = [
  // ── Sufijos ───────────────────────────────────────────────────────────────
  {
    id: "suf-default", mode: "honorific-suffix",
    situation: "Conoces a alguien de tu misma edad y jerarquía. ¿Qué sufijo usas con su apellido?",
    answer: "さん", options: ["さん", "ちゃん", "くん", "さま"],
    note: "さん es el sufijo neutro y el más común: sirve para hombres y mujeres de jerarquía similar.",
  },
  {
    id: "suf-duda", mode: "honorific-suffix",
    situation: "No sabes bien qué trato dar a una persona nueva. ¿Cuál es la opción segura?",
    answer: "さん", options: ["さん", "ちゃん", "くん", "さま"],
    note: "Ante la duda, さん. Nunca resulta descortés con un adulto.",
  },
  {
    id: "suf-desconocido", mode: "honorific-suffix",
    situation: "Te diriges a un adulto desconocido en la calle.",
    answer: "さん", options: ["さん", "ちゃん", "くん", "さま"],
    note: "Con desconocidos adultos se usa さん.",
  },
  {
    id: "suf-cliente", mode: "honorific-suffix",
    situation: "Trabajas en una tienda y hablas con un cliente.",
    answer: "さま", options: ["さん", "ちゃん", "くん", "さま"],
    note: "A los clientes (お客さま) y a los invitados se les trata de さま.",
  },
  {
    id: "suf-admiras", mode: "honorific-suffix",
    situation: "Hablas de una persona a la que admiras profundamente o de mayor jerarquía.",
    answer: "さま", options: ["さん", "ちゃん", "くん", "さま"],
    note: "さま expresa el grado más alto de respeto.",
  },
  {
    id: "suf-carta", mode: "honorific-suffix",
    situation: "Escribes el destinatario de una carta formal.",
    answer: "さま", options: ["さん", "ちゃん", "くん", "さま"],
    note: "En la correspondencia formal el nombre siempre lleva さま (o 様).",
  },
  {
    id: "suf-nina", mode: "honorific-suffix",
    situation: "Te diriges con cariño a una niña pequeña.",
    answer: "ちゃん", options: ["さん", "ちゃん", "くん", "さま"],
    note: "ちゃん refleja confianza y cercanía; es como los diminutivos '-ita/-ito'.",
  },
  {
    id: "suf-amiga", mode: "honorific-suffix",
    situation: "Llamas a una amiga muy cercana de la infancia.",
    answer: "ちゃん", options: ["さん", "ちゃん", "くん", "さま"],
    note: "Entre personas muy cercanas ちゃん marca el afecto.",
  },
  {
    id: "suf-mascota", mode: "honorific-suffix",
    situation: "Le pones un apodo cariñoso a tu perro.",
    answer: "ちゃん", options: ["さん", "ちゃん", "くん", "さま"],
    note: "ちゃん también se usa con mascotas y apodos afectuosos.",
  },
  {
    id: "suf-nino", mode: "honorific-suffix",
    situation: "Te diriges a un niño pequeño.",
    answer: "くん", options: ["さん", "ちゃん", "くん", "さま"],
    note: "くん se usa sobre todo con chicos de menor edad o jerarquía.",
  },
  {
    id: "suf-junior", mode: "honorific-suffix",
    situation: "Eres el mayor del club y hablas con un compañero más joven (chico).",
    answer: "くん", options: ["さん", "ちゃん", "くん", "さま"],
    note: "Un superior o mayor puede llamar くん a un chico de menor jerarquía.",
  },
  {
    id: "suf-alumno", mode: "honorific-suffix",
    situation: "Un profesor pasa lista y nombra a un alumno varón.",
    answer: "くん", options: ["さん", "ちゃん", "くん", "さま"],
    note: "En el aula, el profesorado suele llamar くん a los alumnos y さん a las alumnas.",
  },

  // ── Familia: humilde ↔ honorífica ─────────────────────────────────────────
  {
    id: "fam-mi-madre", mode: "honorific-family",
    situation: "Le cuentas a un compañero de trabajo algo sobre TU madre.",
    answer: "はは", options: ["はは", "おかあさん", "ちち", "おねえさん"],
    note: "Al hablar de tu propia madre con otros, se usa la forma humilde はは.",
  },
  {
    id: "fam-madre-tanaka", mode: "honorific-family",
    situation: "Preguntas por la madre del señor Tanaka.",
    answer: "おかあさん", options: ["おかあさん", "はは", "おとうさん", "おばあさん"],
    note: "La madre de otra persona es siempre おかあさん (forma honorífica).",
  },
  {
    id: "fam-mi-padre", mode: "honorific-family",
    situation: "Mencionas a TU padre en una reunión con clientes.",
    answer: "ちち", options: ["ちち", "おとうさん", "はは", "おにいさん"],
    note: "Tu propio padre, ante otros, es ちち (humilde).",
  },
  {
    id: "fam-padre-otro", mode: "honorific-family",
    situation: "Hablas del padre de tu amiga.",
    answer: "おとうさん", options: ["おとうさん", "ちち", "おかあさん", "おじいさん"],
    note: "El padre de otra persona es おとうさん.",
  },
  {
    id: "fam-mi-esposa", mode: "honorific-family",
    situation: "Presentas a TU esposa a un conocido.",
    answer: "つま", options: ["つま", "おくさん", "おっと", "むすめ"],
    note: "A tu propia esposa la nombras つま (humilde). かない es otra forma humilde.",
  },
  {
    id: "fam-esposa-otro", mode: "honorific-family",
    situation: "Preguntas por la esposa de tu jefe.",
    answer: "おくさん", options: ["おくさん", "つま", "ごしゅじん", "おかあさん"],
    note: "La esposa de otra persona es おくさん.",
  },
  {
    id: "fam-mi-esposo", mode: "honorific-family",
    situation: "Le cuentas a una vecina algo sobre TU marido.",
    answer: "おっと", options: ["おっと", "ごしゅじん", "つま", "あに"],
    note: "A tu propio marido lo nombras おっと (humilde). しゅじん es otra forma humilde.",
  },
  {
    id: "fam-esposo-otro", mode: "honorific-family",
    situation: "Preguntas por el marido de la señora Sato.",
    answer: "ごしゅじん", options: ["ごしゅじん", "おっと", "おくさん", "おとうさん"],
    note: "El marido de otra persona es ごしゅじん.",
  },
  {
    id: "fam-mi-hna-mayor", mode: "honorific-family",
    situation: "Hablas de TU hermana mayor con un compañero.",
    answer: "あね", options: ["あね", "おねえさん", "あに", "はは"],
    note: "Tu propia hermana mayor, ante otros, es あね (humilde).",
  },
  {
    id: "fam-hna-mayor-otro", mode: "honorific-family",
    situation: "Preguntas por la hermana mayor de tu amigo.",
    answer: "おねえさん", options: ["おねえさん", "あね", "おにいさん", "おかあさん"],
    note: "La hermana mayor de otra persona es おねえさん.",
  },
  {
    id: "fam-mi-hno-mayor", mode: "honorific-family",
    situation: "Mencionas a TU hermano mayor en el trabajo.",
    answer: "あに", options: ["あに", "おにいさん", "あね", "ちち"],
    note: "Tu propio hermano mayor, ante otros, es あに (humilde).",
  },
  {
    id: "fam-hno-mayor-otro", mode: "honorific-family",
    situation: "Preguntas por el hermano mayor de una compañera.",
    answer: "おにいさん", options: ["おにいさん", "あに", "おねえさん", "おとうさん"],
    note: "El hermano mayor de otra persona es おにいさん.",
  },
  {
    id: "fam-mi-abuela", mode: "honorific-family",
    situation: "Cuentas una anécdota sobre TU abuela a un conocido.",
    answer: "そぼ", options: ["そぼ", "おばあさん", "そふ", "はは"],
    note: "Tu propia abuela, ante otros, es そぼ (humilde).",
  },
  {
    id: "fam-abuela-otro", mode: "honorific-family",
    situation: "Preguntas por la abuela de tu vecino.",
    answer: "おばあさん", options: ["おばあさん", "そぼ", "おじいさん", "おかあさん"],
    note: "La abuela de otra persona es おばあさん.",
  },
  {
    id: "fam-mi-abuelo", mode: "honorific-family",
    situation: "Hablas de TU abuelo con un compañero de clase.",
    answer: "そふ", options: ["そふ", "おじいさん", "そぼ", "ちち"],
    note: "Tu propio abuelo, ante otros, es そふ (humilde).",
  },
  {
    id: "fam-abuelo-otro", mode: "honorific-family",
    situation: "Preguntas por el abuelo de tu amiga.",
    answer: "おじいさん", options: ["おじいさん", "そふ", "おばあさん", "おとうさん"],
    note: "El abuelo de otra persona es おじいさん.",
  },
];

export function getHonorificPool(modes: Set<HonorificMode>): HonorificExercise[] {
  if (modes.size === 0) return [];
  return HONORIFIC_EXERCISES.filter((e) => modes.has(e.mode));
}

export function modesFor(mode: HonorificGameMode): Set<HonorificMode> {
  if (mode === "suffix") return new Set<HonorificMode>(["honorific-suffix"]);
  if (mode === "family") return new Set<HonorificMode>(["honorific-family"]);
  return new Set<HonorificMode>(["honorific-suffix", "honorific-family"]);
}

export function honorificNotMasteredCount(progress: ProgressItems, modes: Set<HonorificMode>): number {
  return getHonorificPool(modes).filter((e) => honorificStatus(progress, e.mode, e.id) !== "mastered").length;
}
