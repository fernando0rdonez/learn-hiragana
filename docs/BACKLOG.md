# Backlog — especificaciones implementables

Cada spec de este documento es **autocontenida**: puede copiarse tal cual en una sesión
nueva de Claude Code sobre este repositorio ("Implementa la spec #N de docs/BACKLOG.md").
El orden es la prioridad recomendada (ver la tabla final de [`ROADMAP.md`](./ROADMAP.md)).

**Toda implementación debe cumplir las reglas de METODOLOGIA.md §4**, en resumen:
todo ítem entrenable entra al SRS Leitner (`src/leitner.ts`) con clave `"{modo}:{ítem}"`;
quiz primero, exposición después; reconocimiento antes que producción; sesiones de 10–20
ítems con resumen final; interfaz en español; audio vía `useSpeech` (`src/hooks/useSpeech.ts`);
cambios de esquema de progreso con migración versionada (`schemaVersion` en `src/storage.ts`).

### Contexto técnico común

- SPA React + TypeScript + Vite + Tailwind. Entrada: `src/App.tsx` (switch por `view`,
  tipo `ViewName` en `src/data.ts`).
- Progreso: `ProgressItems` = `Record<"{modo}:{ítem}", ItemProgress>` (`src/types.ts`),
  persistido en `localStorage` por `src/storage.ts`, cargado con `src/hooks/useProgress.ts`.
- SRS: `advanceBox` + `buildSessionQueue` en `src/leitner.ts` (`INTERVALS = [0,1,3,7,14]`).
- Juegos de vocabulario existentes como plantillas: `src/components/VocabularyGame.tsx`
  (deletrear con fichas), `VocabRecognizeGame.tsx` (elección múltiple), `VocabListeningGame.tsx`
  (audio → elegir), `VocabSessionSummary.tsx` (resumen), `WordSlots.tsx` (huecos de fichas).
- Datos: `src/data.ts` (kana), `src/vocabulary.ts` (N5, formato `VocabWord`), `src/words.ts`,
  `src/phonetics.ts`, `src/confusedPairs.ts`.
- Imágenes de vocabulario: skill `vocab-images` del repo (clasifica/dibuja/genera PNGs en
  `src/assets/vocab-images/`).

---

## #1 · Módulo Katakana

**Fase**: 0 · **Tamaño**: M

**Objetivo**: entrenar los 46 katakana básicos + dakuten + compuestos con exactamente la
misma mecánica que hiragana (reconocimiento, producción, pares confundibles, SRS).

**Diseño**:
- Añadir a `src/data.ts` (o un `src/dataKatakana.ts`) los arrays `KATAKANA_ROWS`,
  `KATAKANA_DAKUTEN_ROWS`, `KATAKANA_COMPOUND_ROWS` con la misma forma que `ROWS`
  (ids con prefijo `kata-` para no colisionar: `kata-a`, `kata-ka`…).
- Claves de progreso: reutilizar modos `recognition`/`production` — el kana mismo distingue
  el silabario (ア ≠ あ), no hace falta modo nuevo.
- Pares confundibles propios de katakana: シ/ツ, ソ/ン, ク/ワ/フ, コ/ユ, チ/テ (nuevo array
  en `src/confusedPairs.ts` o equivalente).
- UI: nueva entrada "Katakana" en `HomeView` y un setup view clonado de
  `src/views/HiraganaSetupView.tsx` (extraer lo común si es razonable, no obligatorio).
  `useSession` (`src/hooks/useSession.ts`) debería funcionar sin cambios al recibir el pool katakana.
- Palabras de práctica en katakana (préstamos: コーヒー, テレビ, パン…) análogas a `src/words.ts`,
  incluyendo el guion de vocal larga ー.

**Aceptación**: se puede completar una sesión de reconocimiento y una de producción de
katakana; el progreso persiste y aparece en Stats; los pares confundibles シ/ツ y ソ/ン
tienen drill propio; `npm run build` pasa.

---

## #2 · Extender SRS a 7 cajas (retención a largo plazo)

**Fase**: transversal · **Tamaño**: S

**Objetivo**: intervalos `[0, 1, 3, 7, 14, 30, 60]` en `INTERVALS` (`src/leitner.ts`) para
que los ítems dominados dejen de saturar la cola en un plan de 2 años.

**Diseño**:
- `advanceBox` ya usa `INTERVALS.length - 1`, así que el cambio central es el array.
- Revisar todo lo que asuma 5 cajas / caja máx 4: `charStatus` y helpers en `src/utils.ts`,
  umbrales de "dominado" (caja ≥ 3 debe seguir siendo el umbral de dominado), StatsView.
- Fallo: mantener el reseteo a caja 0 (simple y conservador).
- No requiere migración de datos (las cajas existentes 0–4 siguen siendo válidas), pero
  subir `schemaVersion` si se cambia cualquier semántica persistida.

**Aceptación**: un ítem respondido correctamente 6 veces seguidas queda con `nextDue`
a 60 días; los estados de StatsView siguen siendo coherentes; build y comportamiento
existente intactos.

---

## #3 · Ampliar vocabulario N5: 200 → 800 palabras

**Fase**: 1 · **Tamaño**: L (contenido)

**Objetivo**: cubrir la lista completa de vocabulario JLPT N5 (~800 palabras) en
`src/vocabulary.ts`.

**Diseño**:
- Mismo formato `VocabWord` (hiragana, romaji, significado en español, categoría,
  `emojiBackup`; `imageQuery`/`imagePath` según la skill `vocab-images`).
- Añadir en tandas por categoría (50–100 palabras por PR para poder revisar). Crear
  categorías nuevas si hacen falta (escuela, trabajo, clima, verbos II…), registrándolas
  en `VOCAB_CATEGORIES`.
- Palabras que en N5 se escriben con katakana (テレビ, レストラン…) : incluirlas una vez
  exista el módulo #1; mientras tanto, omitirlas (la app deletrea con fichas kana).
- Evitar duplicados con las 200 existentes (comprobar por campo `hiragana`).
- Imágenes: usar la skill `vocab-images` para las tandas nuevas; `emojiBackup` obligatorio.

**Aceptación**: `VOCABULARY.length` ≥ 800 sin duplicados; cada palabra tiene significado
en español y categoría válida; los tres juegos de vocabulario funcionan con las categorías
nuevas; build pasa.

---

## #4 · Módulo Frases hechas y saludos (con audio)

**Fase**: 1 · **Tamaño**: M

**Objetivo**: ~80 expresiones fijas de supervivencia (おはようございます, すみません,
いただきます, お願いします, はじめまして…) con audio TTS, nota de contexto de uso y SRS.

**Diseño**:
- Nuevo `src/phrases.ts`: `{ id, kana, romaji, meaning (es), context (es: cuándo se usa),
  category }` con categorías tipo saludos/cortesía/restaurante/compras/emergencia.
- Dos modos de juego (nuevo view + componentes, plantilla `VocabRecognizeGame` y
  `VocabListeningGame`):
  1. **Reconocer**: kana + audio → elegir significado/situación (clave `phrase-meaning:{id}`).
  2. **Escuchar**: solo audio → elegir la frase escrita (clave `phrase-listening:{id}`).
- Tras cada respuesta, mostrar la nota de contexto y un botón para re-escuchar; invitar al
  shadowing ("repítela en voz alta") en el copy del feedback.
- Audio: `useSpeech` con el texto en kana.

**Aceptación**: sesión completa de cada modo con SRS persistente; toda frase tiene contexto
en español y audio; añadido a `HomeView`; build pasa.

---

## #5 · Módulo Kanji N5 (~100 kanji)

**Fase**: 1 · **Tamaño**: L

**Objetivo**: reconocer los ~100 kanji de N5: significado, lectura(s) principal(es) y
vocabulario asociado ya conocido.

**Diseño**:
- Nuevo `src/kanji.ts`: `{ kanji, meanings (es), onyomi[], kunyomi[], examples: [{ word
  (con kanji), kana, meaning }], group }` — agrupados temáticamente (números, días,
  personas, verbos…), ~10 grupos de ~10.
- Los `examples` deben ser palabras que ya están en `src/vocabulary.ts` (anclaje i+1,
  METODOLOGIA §2.4).
- Tres modos, en este orden de desbloqueo por ítem:
  1. **Significado** (kanji → elegir significado en español), clave `kanji-meaning:{kanji}`.
  2. **Lectura** (palabra de ejemplo con kanji → elegir su kana), clave `kanji-reading:{kanji}`.
  3. **Emparejar** (grid de 5 kanji ↔ 5 significados), refuerzo sin SRS propio.
- Setup view por grupos (plantilla `VocabSetupView`), sesiones de 10.
- Mostrar el orden de trazos NO es necesario en v1 (solo reconocimiento; la escritura a
  mano queda fuera del alcance de la app).

**Aceptación**: 100 kanji con datos completos; los dos modos SRS persisten progreso;
cada kanji muestra al menos 1 palabra de ejemplo existente en el vocabulario; build pasa.

---

## #6 · Módulo Gramática: construir frases y partículas

**Fase**: 1 (contenido N5) · **Tamaño**: L

**Objetivo**: interiorizar la estructura de la oración japonesa y las partículas mediante
dos drills activos, cubriendo la lista de gramática N5 del ROADMAP (Fase 1 §Contenido 4).

**Diseño**:
- Nuevo `src/grammar.ts`: lecciones `{ id, title (es), explanation (es, 2–4 líneas),
  pattern (ej. "X は Y です"), exercises: [...] }` con dos tipos de ejercicio:
  1. **Ordenar**: `{ tokens: ["わたし","は","がくせい","です"], translation (es) }` —
     el usuario ordena fichas barajadas (reutilizar el patrón de fichas/slots de
     `VocabularyGame`/`WordSlots`). Clave SRS `grammar-order:{id}`.
  2. **Partícula hueca**: `{ sentence: "わたし＿がくせいです", answer: "は",
     options: ["は","が","を","に"], translation }`. Clave `grammar-particle:{id}`.
- Vocabulario de los ejercicios: **solo palabras presentes en `src/vocabulary.ts`**
  (input comprensible, METODOLOGIA §2.4).
- Flujo por lección: explicación breve (1 pantalla) → 8–12 ejercicios → resumen.
  Es la única excepción permitida al "quiz primero": la explicación de patrón nuevo
  va antes, pero ocupa una sola pantalla.
- ~20 lecciones N5 para empezar (orden del ROADMAP Fase 1); audio TTS de cada frase
  completa al corregir.

**Aceptación**: ≥ 20 lecciones N5; ambos tipos de ejercicio funcionan con SRS; toda frase
usa vocabulario existente y suena por TTS al corregir; build pasa.

---

## #7 · Listening de frases completas

**Fase**: 2 · **Tamaño**: M

**Objetivo**: pasar del oído por palabra al oído por oración: dictado y comprensión de
frases N5–N4.

**Diseño**:
- Fuente de frases: las de `src/grammar.ts` (#6) marcadas con nivel, más un banco propio
  `src/listening.ts` si hace falta (`{ id, kana, translation, level: "N5"|"N4", distractors }`).
- Dos modos:
  1. **Comprensión**: audio de la frase (velocidad 0.8 ya es el default de `useSpeech`;
     añadir botón "más lento" con `rate` 0.6) → elegir la traducción correcta entre 4.
     Clave `listen-sentence:{id}`.
  2. **Dictado**: audio → escribir la frase en kana (input libre; comparar normalizando
     espacios/puntuación). Clave `dictation:{id}`. Feedback tipo diff: marcar qué kana
     difieren.
- Reproducir hasta 3 veces antes de responder; contar las escuchas en el resumen.

**Aceptación**: ambos modos completos con SRS; botón de velocidad lenta; el dictado
tolera espacios y puntuación; build pasa.

---

## #8 · Lectura graduada con preguntas

**Fase**: 2–3 · **Tamaño**: L

**Objetivo**: pasajes cortos i+1 con preguntas de comprensión, de N5 (3–6 oraciones)
hasta N3 (200–400 caracteres, con inferencia).

**Diseño**:
- Nuevo `src/readings.ts`: `{ id, title, level: "N5"|"N4"|"N3", body (kana; con kanji
  del set enseñado a partir de N4 — con furigana opcional togglable), gloss:
  [{ word, meaning }] (≤ 3 palabras nuevas por pasaje), questions: [{ q (es o ja según
  nivel), options, answer }] }`.
- Flujo: leer (cronometrar de forma no intrusiva) → 2–4 preguntas → mostrar traducción
  completa al terminar. Clave SRS por pasaje `reading:{id}` (releer pasajes vencidos
  es repaso válido).
- Tap sobre palabra glosada muestra su significado (las del `gloss`).
- v1: 15 pasajes N5. Ampliaciones posteriores añaden N4/N3 (mismo formato, más kanji
  y preguntas de inferencia).

**Aceptación**: 15 pasajes N5 leíbles con preguntas y feedback; gloss funcional con tap;
progreso SRS persiste; build pasa.

---

## #9 · Mapa de progreso hacia B1

**Fase**: transversal (implementar en Fase 2–3) · **Tamaño**: M

**Objetivo**: una vista "Camino a B1" que muestre las 4 fases del ROADMAP, sus puertas
de salida y el % real de cada criterio, calculado desde `ProgressItems`.

**Diseño**:
- Nueva view `roadmap` (añadir a `ViewName`) accesible desde `HomeView` y `StatsView`.
- Codificar las puertas de ROADMAP.md como datos (`src/roadmapGates.ts`): por fase, lista
  de criterios `{ label, compute(progress): { current, target } }` — p. ej. "hiragana
  dominado 98/104", "vocab N5 dominado 620/800", "kanji 40/100".
- Reutilizar `charStatus`/`rowStats` de `src/utils.ts` para los cálculos; los módulos aún
  no implementados aparecen como "próximamente" (leer qué existe por presencia de datos).
- UI: línea de fases con la fase activa destacada, barras de progreso por criterio y la
  puerta bloqueada/desbloqueada (reutilizar el estilo de `StatsView`).

**Aceptación**: la vista refleja el progreso real de los módulos existentes; una puerta
se marca cumplida solo cuando todos sus criterios llegan al objetivo; build pasa.

---

## #10 · Exportar / importar progreso

**Fase**: transversal · **Tamaño**: S

**Objetivo**: no perder meses de datos por limpiar el navegador o cambiar de dispositivo.

**Diseño**:
- En `StatsView` (o un apartado Ajustes): botón **Exportar** que descarga el
  `ProgressData` completo (`localStorage` key `hiragana-progress`) como
  `hiragana-progress-YYYY-MM-DD.json`, y botón **Importar** (input file) que lo restaura.
- Validar al importar: `schemaVersion` ≤ actual (aplicar migraciones de `src/storage.ts`
  si es menor), estructura de `items` correcta; si no, error claro sin tocar los datos.
- Confirmación explícita antes de sobreescribir progreso existente (patrón `resetConfirm`
  de `App.tsx`).

**Aceptación**: ciclo exportar → borrar localStorage → importar deja el progreso idéntico
(incluye racha y ajustes); un JSON inválido muestra error y no destruye nada; build pasa.

---

## Plantilla para nuevas specs

Al añadir specs futuras a este backlog, incluir siempre: **Fase** del ROADMAP, **Objetivo**
(1–2 frases), **Diseño** (modelo de datos, claves SRS `"{modo}:{ítem}"`, componentes
existentes a reutilizar como plantilla, entrada en `HomeView`/`ViewName`) y **Aceptación**
(criterios verificables + "build pasa").
