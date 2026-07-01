# Category → visualType mapping

Source of truth for `CATEGORY_VISUAL_TYPE` in `scripts/lib/classify-rules.mjs`.
If you change the mapping, update both places.

| Categoría (vocabulary.ts `category`) | visualType | Nota |
|---|---|---|
| `numeros` | `concrete` | número + objeto contable (ej: 3 manzanas) o el dígito estilizado |
| `comida`, `animales`, `lugares`, `transporte`, `objetos`, `ropa`, `naturaleza`, `casa`, `cuerpo` | `concrete` | objeto centrado, template estándar (`.claude/prompts/concrete.md`) |
| `familia` | `concrete` (requiere regla específica) | necesita ancla visual que distinga mamá/papá/abuela/abuelo/hermano mayor/menor — revisar antes de aprobar |
| `colores` | `concrete` (variante) | swatch/objeto sólido del color, no "arte abstracto" — revisar antes de aprobar |
| `verbos` | `action` | personaje + prop que ancla la acción sin ambigüedad (ver `action-fewshot.md`) |
| `tiempo`, `cantidades`, `adjetivos`, `pronombres`, `preguntas` | `symbolic` | ícono/metáfora visual, sin personaje con gesto facial — la metáfora la define el usuario a mano |
| `saludos` | `needs_review` (Action/Symbolic mixto) | revisar caso por caso (ej: "gracias" = manos juntas + corazón; "hola" = mano saludando) |
| `misc` | `needs_review` (mixto) | dinero, trabajo, música son concrete; el resto varía — revisar caso por caso |

## Rules

- `concrete` entries get an auto-drafted prompt (template + `imageQuery`) but still land in `state/drafts.json` as `pending_review` — nothing skips human approval, including concrete.
- `familia` and `colores` are `concrete` but always carry a `reviewNote` flagging the special rule, since the auto-draft is a starting point, not a final answer.
- `action` entries get a Claude-drafted `actionPrompt` (using the few-shot examples) but are never auto-approved.
- `symbolic` and `needs_review` entries get NO auto-generated prompt text. The `symbolicMetaphor`/final prompt is written by the user.
