# Plan: Gramática 2.0 (orden del libro + más práctica)

Documento autocontenido para poder ejecutar cada fase en una sesión nueva
(local, en la nube o remota) sin depender de la conversación donde se acordó.

**Cómo usarlo desde otra sesión:** «Lee `docs/GRAMATICA_PLAN.md` y ejecuta la
Fase N». Al terminar una fase, marca su casilla en *Estado* y anota la rama/PR.

---

## Estado

| Fase | Descripción | Estado | Rama / PR |
|---|---|---|---|
| 1 | Lecciones en orden del libro, contenido del curso 2, tren de partículas | ✅ hecha (sin PR aún) | `feat/gramatica-por-libro` |
| 2 | Ejercicio «Armar sílaba por sílaba» (fichas, sin teclado japonés) | ✅ hecha (sin PR aún) | `feat/gramatica-silabas` (sale de `feat/gramatica-por-libro`) |
| 3 | Pregunta→respuesta, Encuentra el error, Ordenar con palabras extra, Dictado | ⏳ pendiente | — |
| 4 | Lectura de repaso (texto corto + preguntas) | ⏳ pendiente | — |

---

## Contexto

- App: React + TypeScript + Vite + Supabase. Tests: `npm test` (node --test con tsx). Build: `npm run build`.
- Sección Gramática: `src/grammar.ts` (datos), `src/components/GrammarLessonGame.tsx`
  (juego), `src/views/GrammarSetupView.tsx` (lista de lecciones),
  `src/components/ParticleTrain.tsx` + `src/particleTrain.ts` (tren de partículas, Fase 1).
- Libros de referencia (escaneados, solo imagen — leerlos página por página):
  `docs/curso-japnes-curso-1.pdf` (Japonés Básico I) y `docs/curso japones 2.pdf` (Japonés Básico II).
  **No están versionados en git** (pesan ~20 MB); si la sesión corre en la nube,
  no estarán disponibles — este documento resume todo lo necesario.
- Otros consumidores de `GRAMMAR_LESSONS`: `src/listening.ts` (frases para
  listening, usa los ejercicios `order`), `src/exam/examBank.ts` (examen: usa
  `particle` con `kind === "particle"` y sin `alt`, y `order`),
  `src/utils.ts` (`grammarStatus`, `grammarAccuracy`), `src/roadmapGates.ts`, `HomeView`.

## Decisiones acordadas con el usuario

1. **Orden del libro.** Curso 1 → Curso 2 → «Extra» (lecciones que no están en los libros).
2. **Oraciones propias, NO copiadas del PDF.** El PDF solo define temas, reglas y orden.
   Cada lección tiene ~12–15 oraciones para que no se sienta repetitivo; una sesión
   toma 12 ejercicios al azar (mezclando tipos y sin repetir oración).
3. **Solo hiragana/katakana** en las oraciones y fichas (sin kanji). Nombres propios
   (たなかさん, マリアさん…) y lugares (にほん, とうきょう…) se permiten aunque no estén en
   `vocabulary.ts`; el resto del vocabulario de contenido sí debe existir allí (METODOLOGIA §2.4).
4. **IDs de lección se conservan** donde el concepto sigue siendo el mismo, para no
   perder el progreso guardado (`grammar-order:<id>`, `grammar-particle:<id>`).
5. **Tren de partículas** como ayuda para recordar el orden:
   `(tema)は → (tiempo)に / から〜まで → (compañía)と → (medio/lugar)で → (destino)へ | (objeto)を → VERBO`.
   Mnemotecnia: «**Wa-ni to de e/o**» — わに = cocodrilo: *el cocodrilo va con… (と) en… (で) hacia… (へ)*.
   Cada partícula tiene un color fijo que se usa en todos los ejercicios.
6. **Regla de lugar según el verbo** (curso 2): existencia → に · movimiento → へ (o に) · acción → で.

## Lecciones (Fase 1)

| # | id | Tema | Libro |
|---|---|---|---|
| 1 | `estructura-desu` | X は Y です (は = tema) | I |
| 2 | `negacion-janai` | ではありません / じゃないです | I |
| 3 | `copula-pasado-negativo` | でした / ではありませんでした | I |
| 4 | `particula-no` | の posesiva | I |
| 5 | `pregunta-ka` | か y palabras de pregunta (なん/だれ/どこ/いつ) | I |
| 6 | `demostrativos-kosoare` | これ/それ/あれ/どれ · この/その/あの/どの | II |
| 7–10 | `verbos-masu`, `verbos-masen`, `verbos-mashita`, `verbos-masendeshita` | Conjugación ます | II |
| 11 | `particula-ni` | に de tiempo (きょう/きのう/あした sin に) | II |
| 12 | `kara-made` | から〜まで | II |
| 13 | `particula-to` | と: «y» / «con» (だれと) | II |
| 14 | `particula-de` | で de medio (なにで) | II |
| 15 | `particula-he` | へ dirección (どこへ) | II |
| 16 | `lugar-ni-he-de` | に / へ / で según el verbo | II |
| 17 | `particula-wo` | を objeto (なにを) | II |
| 18 | `particula-ga` | が vs は | II |
| 19 | `existencia-arimasu-imasu` | あります/います + うえ・した・なか・まえ・うしろ | II |
| E | `particula-mo`, `adjetivos-i`, `adjetivos-na`, `gustos-suki-hoshii-tai` | Extra | — |

### Modelo de datos (Fase 1)

Cada oración se escribe **una vez** con fichas separadas por espacios
(`"わたし は がっこう へ いきます"`) y el generador crea los ejercicios:

- `order`: ordenar las fichas.
- `particle` (hueco): se vacía la primera ficha que esté en `focus` de la lección
  (o la indicada en `blank`). Las opciones salen de conjuntos automáticos
  (conjugación ます, cópula, kosoado, existencia, posiciones, たい, adjetivos い,
  palabras de pregunta) o del `pool` de partículas distractoras de la lección.
  `kind` = `"particle"` o `"form"`. `alt` = otras respuestas también correctas
  (ej. に en vez de へ), que nunca se ofrecen como distractor.
- `accept` (en `order`): otros órdenes válidos. Se generan solos para «TIEMPO X は…» ⇄
  «X は TIEMPO…» (palabras de tiempo sin partícula) y se declaran a mano con `orders` en la
  oración (ej. «いぬ と ねこ» ⇄ «ねこ と いぬ»).
- `parts` (en `particle`): la frase en fichas, para mostrarla con separación y colores.
- Una sesión toma 12 oraciones distintas al azar (`buildSession` en `GrammarLessonGame.tsx`).
  Antes de empezar, el usuario elige el **tipo de juego** (`GAME_MODES`): «Mezclado» (alterna
  ordenar/hueco), «Solo ordenar» o «Solo huecos»; la elección se recuerda en `localStorage`.
  **Cada juego nuevo de las fases 2–3 debe agregarse a `GAME_MODES`** (y entrar en «Mezclado»).
  Tras el primer fallo al ordenar se muestra el tren compacto.
- Los tests (`src/grammar.test.ts`) verifican que cada hueco existe, que las opciones
  son 4, únicas, incluyen la respuesta y nunca una alternativa válida.

Para agregar oraciones: añadir líneas `s("…", "…")` a la lección y correr `npm test`.

---

## Fase 2 — «Armar sílaba por sílaba»

> **Implementado** en `src/grammarBuild.ts` (lógica pura + `src/grammarBuild.test.ts`) y
> `src/components/SyllableBuildDrill.tsx`; integrado como tipo de juego «Sílabas» (y dentro de
> «Mezclado») en `GrammarLessonGame.tsx`, con selector de nivel y el interruptor de audio en Fácil
> (preferencias en `localStorage`: `grammar-build-level`, `grammar-build-tile-audio`).
> Decisiones tomadas al implementar:
> - Las trampas de ortografía わ (por は), お (por を) y え (por へ) salen primero y pueden
>   repetir una sílaba ya presente (わたし は… con una わ de más es justo la trampa).
> - Nunca salen como extra las partículas alternativas válidas (`alt`, ej. に con へ) ni el
>   cambio は⇄が, para no permitir otra oración válida que se marcaría como error.
> - Usar la pista hace que el ejercicio no cuente como acierto (Leitner es binario).
> - Fallo 1: las sílabas mal puestas se marcan en rojo y vuelven al banco; fallo 2: se revela.

**Objetivo:** formar la oración tocando fichas de sílabas (sin teclado japonés).

- Se muestra la frase en español. Debajo, casillas agrupadas por palabra
  (`[_ _ _] [_] [_ _ _ _]`) y un banco de fichas con las sílabas de la oración + extras.
- Toca una ficha para ponerla en la siguiente casilla libre; toca una casilla para devolverla
  (como `handleSlotTap` del ejercicio `order`). Botón «Limpiar».
- **Segmentación en moras:** los yōon (きょ, しゃ, ちゅ…) van en UNA ficha; っ y ん son fichas
  propias; ー (katakana) también. Escribir una función pura `splitMora(word)` con tests.
- **Sílabas extra (dificultad):**
  - kana que se confunden a la vista (`src/confusedPairs.ts` → `getConfusablePairs`),
  - partículas parecidas (に/で/へ, は/が, を/お),
  - trozos de otras conjugaciones (せ, ん, し, た, で).
  - Regla: ninguna combinación de extras debe formar otra respuesta válida para el hueco.
- **Niveles:**
  - **Fácil:** límites de palabra visibles, 3 sílabas extra, y **opción (interruptor que el
    usuario activa si quiere) para que al tocar una ficha suene su pronunciación**
    (`useSpeech().speak(ficha)`). Guardar la preferencia en `localStorage` (try/catch).
  - **Normal:** límites visibles, ~6 extras, sin audio por ficha.
  - **Difícil:** sin límites de palabra, 10+ extras.
- Botón de pista: revela la siguiente palabra completa (cuenta como fallo parcial).
- Al comprobar: si falla, marcar en rojo las palabras incorrectas; 2 fallos → revelar.
- Progreso: nuevo modo `"grammar-build"` en `GrammarPracticeMode` (`src/utils.ts`) y en
  `GRAMMAR_MODES`, para que cuente en `grammarStatus`/`grammarAccuracy`.
- Se genera desde las mismas oraciones de `grammar.ts` (sin datos nuevos).
- Componentes sugeridos: `src/components/SyllableBuildDrill.tsx`, `src/grammarBuild.ts`
  (segmentación + distractores, con `src/grammarBuild.test.ts`).

## Fase 3 — Más tipos de ejercicio

Todos se generan desde las oraciones existentes; añadir el modo de progreso correspondiente.

- **Pregunta → respuesta:** se muestra una pregunta (どこで べんきょうしますか？) y se arma la
  respuesta eligiendo la partícula correcta (としょかん＿). Necesita marcar en los datos qué
  oraciones son pregunta y su respuesta (campo opcional `answerTo` o pares q/a por lección).
- **Encuentra el error:** la oración aparece con UNA partícula cambiada (por un distractor del
  pool) o dos fichas intercambiadas; el usuario toca la ficha incorrecta.
- **Ordenar con palabras extra:** el ejercicio `order` actual + 1–2 fichas sobrantes
  (partícula distractora o forma conjugada distinta).
- **Dictado:** `speak(frase)` y el usuario la arma con las fichas de sílabas de la Fase 2
  (reutilizar `SyllableBuildDrill` sin mostrar el español hasta el final).

## Fase 4 — Lectura de repaso

- Texto corto propio (NO el del PDF) sobre una persona (nombre, trabajo, horario
  から〜まで, dónde vive に, con quién と, qué hace を), 5–7 oraciones en hiragana.
- 3–5 preguntas de comprensión (opción múltiple) que obliguen a fijarse en las partículas.
- Lección `lectura-repaso-2` al final del Curso 2 en `GrammarSetupView`.
- Botón para escuchar el texto completo (`speak`).

---

## Notas técnicas / gotchas

- El orden de las palabras se corrige contra el orden del tren + los órdenes de `accept`.
  Las oraciones se escriben siempre con el tema primero y luego el tiempo. Si una oración
  admite otro orden natural, declararlo en `orders`.
- `npm run lint` reporta errores ya existentes (sobre todo en `.claude/worktrees/`); los
  archivos de Gramática pasan limpio con `npx eslint <archivos>`.
- `listening.ts` usa ids posicionales (`<lessonId>-<n>`): cambiar oraciones cambia qué frase
  corresponde a cada id (aceptado en la Fase 1).
- Mantener la UI en español y las fichas con `font-family: 'Noto Sans JP'`.
- Antes de hacer PR: `npm test`, `npm run build`, `npm run lint`, y probar en el navegador
  (`.claude/launch.json` / `npm run dev`).
