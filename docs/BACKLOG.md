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
- **Números quedan fuera del vocabulario**: los numerales (ひゃく, せん, まん, contadores
  de cifras…) NO se añaden aquí — viven en el módulo Números (#11), que además retira
  la categoría "numeros" existente. No re-añadir palabras de número en las tandas.
- Evitar duplicados con las 200 existentes (comprobar por campo `hiragana`).
- Imágenes: usar la skill `vocab-images` para las tandas nuevas; `emojiBackup` obligatorio.

**Aceptación**: `VOCABULARY.length` ≥ 800 sin duplicados; cada palabra tiene significado
en español y categoría válida; los tres juegos de vocabulario funcionan con las categorías
nuevas; build pasa.

> **Hecho (2026-07)** — implementado con ~650 palabras: la cifra "≥ 800" se estimó antes
> de que #11 sacara del vocabulario los ~100 numerales, contadores y fechas numéricas
> (ついたち…, 〜がつ, ひとつ…), que ahora viven en el módulo Números. La lista N5 completa
> **sin esos ítems** ronda las 650; se añadieron 462 palabras y 6 categorías nuevas
> (gente, posiciones, escuela, verbos2, adjetivos2, adverbios). Las imágenes AI de las
> palabras nuevas quedan pendientes del flujo interactivo de la skill `vocab-images`
> (requiere aprobación humana por prompt); mientras tanto rige el `emojiBackup`.

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

> **Hecho (2026-07)** — `src/phrases.ts` (78 frases en 5 categorías: saludos, cortesía,
> restaurante, compras, emergencia), `PhraseMeaningGame.tsx` (reconocer significado) y
> `PhraseListeningGame.tsx` (escuchar → elegir frase escrita), `PhraseSetupView.tsx`
> (selector de categoría/modo/sesión, plantilla `VocabSetupView`). Progreso con claves
> `phrase-meaning:{id}` / `phrase-listening:{id}` (helpers en `src/utils.ts`); resumen de
> sesión reutiliza `VocabSessionSummary`. Tarjeta "Frases" añadida a `HomeView` (fuera del
> hero, igual que Números). No se integró en `StatsView`: ese componente solo cubre
> hiragana/katakana hoy — Vocabulario y Números tampoco aparecen ahí, así que es
> consistente con el resto de la app, no una omisión de esta spec.

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

> **Hecho (2026-07)** — `src/kanji.ts` (100 kanji N5 en 10 grupos de 10: números,
> calendario, tiempo, naturaleza, familia, cuerpo, escuela, lugares y direcciones,
> adjetivos, verbos). Los `examples` de 90 kanji están anclados a palabras reales
> de `src/vocabulary.ts` (verificado programáticamente); el grupo "números" es la
> única excepción documentada — sus ejemplos usan la serie nativa de conteo
> ひとつ・ふたつ… porque los números viven en su propio módulo (#11) desde que se
> retiraron de vocabulary.ts. Tres modos: `KanjiMeaningGame` (significado, clave
> `kanji-meaning:{kanji}`), `KanjiReadingGame` (palabra de ejemplo → lectura, clave
> `kanji-reading:{kanji}`) y `KanjiMatchGame` (emparejar 5↔5 por rondas, sin SRS).
> `KanjiSetupView` (plantilla `PhraseSetupView`) con selector de grupos, modo y
> sesión de 10/20/todos/repasar. Tarjeta "Kanji" añadida a `HomeView`. No se
> integró en `StatsView`, igual que Frases y Números.

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

> **Hecho (2026-07)** — `src/grammar.ts` (20 lecciones N5 en 5 bloques: estructura
> X は Y です/negación/preguntas, las 8 partículas restantes が・を・に・で・へ・と・
> も・の, ます/ません/ました/ませんでした, adjetivos い/な, y un bloque "Otros" con
> demostrativos これ/それ/あれ, existencia あります/います y gustos すき/ほしい/たいです).
> Cada lección trae 4 ejercicios de "ordenar" + 4 de "partícula hueca" (8 en total,
> dentro del rango 8–12). `GrammarLessonGame.tsx` implementa el flujo explicación →
> ejercicios (mezclados y barajados) → resumen (`VocabSessionSummary`), con fichas de
> ancho variable (`GrammarTokenChip`/`GrammarTokenSlots`, ya que los tokens no son un
> solo kana como en `KanaChip`/`WordSlots`). Progreso vía SRS con claves
> `grammar-order:{id}` / `grammar-particle:{id}` (helpers en `src/utils.ts`), TTS de
> la frase completa al corregir (`useSpeech`). `GrammarSetupView.tsx` lista las
> lecciones agrupadas por bloque con su estado de dominio. Tarjeta "Gramática"
> añadida a `HomeView`. No se integró en `StatsView`, igual que Frases/Kanji/Números.

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

> **Hecho (2026-07)** — `src/listening.ts` deriva `LISTENING_SENTENCES` (79 frases,
> todas N5 por ahora) directamente de los ejercicios "ordenar" de `src/grammar.ts`:
> ya usan solo vocabulario existente y ya traen traducción, así que no hizo falta
> un banco de frases aparte (el campo `level` queda listo para cuando haya
> gramática N4). `ListeningComprehensionGame.tsx` (audio → elegir traducción entre
> 4, clave `listen-sentence:{id}`) y `ListeningDictationGame.tsx` (audio → escribir
> en kana, clave `dictation:{id}`, comparación normalizada ignorando espacios/
> puntuación con feedback tipo diff kana por kana). Ambos reproducen hasta 3 veces
> (botón normal + botón "más lento" con `rate` 0.6 en `useSpeech`, ahora
> parametrizable) y sin límite de tiempo (a diferencia de Frases/Vocabulario):
> escuchar varias veces antes de responder no encaja con un cronómetro. El resumen
> de sesión (`VocabSessionSummary`, ahora con `footer` opcional) muestra el total
> de escuchas. `ListeningSetupView.tsx` (plantilla `NumberSetupView`: selector de
> modo + tamaño de sesión, sin categorías) y tarjeta "Listening" en `HomeView`.
> No se integró en `StatsView`, igual que Frases/Kanji/Gramática/Números.

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
  de criterios `{ label, compute(progress, content): { current, target, available } }`.
  **`target` es siempre el número fijo del ROADMAP** (800, 1.500, 3.700 palabras; 104,
  300, 650 kanji…), no cambia aunque el contenido esté incompleto. **`available` es lo
  que realmente existe hoy** en los datos (`VOCABULARY.filter(w => level ∈ fase).length`,
  `KANJI.length`…) y **`current`** es lo dominado (vía `charStatus`/`rowStats` de
  `src/utils.ts` sobre `ProgressItems`). Ejemplos: "hiragana dominado 98/104" (available
  = target, caso simple); "vocab N5+N4 dominado 620/1.500 (de 652 disponibles — faltan
  848 palabras, spec #13)" (available < target, caso con contenido pendiente).
- Tres estados posibles por criterio, no solo dos:
  1. **Próximamente**: el módulo no existe aún (`available === 0` y no hay ninguna spec
     implementada para ese dato) → mostrar solo el label, sin barra.
  2. **Bloqueado por contenido**: `available < target` → barra hasta `current/target`
     pero con el tramo `available–target` visualmente distinto (rayado/gris) y una nota
     tipo "146 palabras aún no añadidas (spec #13)", para que no se lea como que el
     estudiante va mal cuando en realidad es contenido de la app el que falta.
  3. **En progreso normal**: `available >= target` → barra simple `current/target`.
- Cuando una spec de contenido (#3, #5, #8, #13…) añade más ítems, este cálculo se
  recalcula solo con los datos nuevos — `roadmapGates.ts` no debe tocarse al completar
  esas specs, solo al cambiar los targets del ROADMAP.
- UI: línea de fases con la fase activa destacada, barras de progreso por criterio y la
  puerta bloqueada/desbloqueada (reutilizar el estilo de `StatsView`).

**Aceptación**: la vista refleja el progreso real de los módulos existentes; distingue
visualmente "contenido pendiente de añadir" de "estudio pendiente" en los criterios
donde `available < target`; una puerta se marca cumplida solo cuando todos sus criterios
llegan al `target` real del ROADMAP (no al `available`); build pasa.

> **Hecho (2026-07)** — `src/roadmapGates.ts` codifica las 4 fases con sus criterios;
> cada `compute(progress)` devuelve `{ current, target, available, unit? }` y
> `criterionStatus`/`phaseGateComplete` derivan el estado ("próximamente" /
> "bloqueado por contenido" / "en progreso" / "cumplido"). Los criterios objetivamente
> medibles reutilizan `charStatus`/`vocabStatus`/`kanjiStatus` existentes más dos
> helpers nuevos en `src/utils.ts` (`phoneticsAccuracy`, `grammarAccuracy`,
> `listeningAccuracyByLevel`) para los % de acierto de fonética/gramática/dictado.
> Los criterios no medibles desde `ProgressItems` (leer en <2s, conversación con
> tutor, simulacro N3, escribir un texto…) se listan como autoevaluación manual, sin
> barra, y no cuentan para que una fase se marque "Cumplida" — son honestos sobre lo
> que la app no puede verificar. `RoadmapView.tsx` (vista `roadmap`) muestra las 4
> fases como un sendero conectado con nodo por fase (emoji propio: あ/🌱/🌿/🏆,
> candado si está bloqueada, check verde si está cumplida) y un hero con la mascota
> (`summaryMascot`) reaccionando a cuántas fases van cumplidas, para que se sienta
> juguetón en vez de una tabla plana. Accesible desde `HomeView` (footer, junto a
> "Ver estadísticas") y desde `StatsView` (link en el header). Verificado en
> navegador simulando progreso vía `localStorage`: los criterios recalculan en vivo
> y una fase solo pasa a "Cumplida" cuando *todos* sus criterios computables llegan
> al target real (no al disponible), confirmando el caso de #13 (vocab N4 pendiente)
> — build pasa.

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

> **Hecho (2026-07)** — `parseImportedProgress` en `src/storage.ts` valida estructura
> (`items` presente, cada `ItemProgress` con forma correcta) y `schemaVersion` (rechaza
> archivos de una versión más nueva; migra con `migrateWordToSpellKeys` si son de una
> versión anterior, igual que `loadProgress`). Export/import viven en `useProgress`
> (`exportProgress`, `stageImport`, `confirmImport`, `cancelImport`) con flujo de dos
> pasos: seleccionar archivo valida y muestra confirmación sin tocar el progreso actual;
> confirmar sobrescribe `items`/`streak`/`dailyProgress`/`settings` de una vez (no se
> reutiliza `persist` para evitar guardar un `showRomaji` obsoleto por la naturaleza
> asíncrona de `setState`). Botones "Exportar progreso"/"Importar progreso" en el footer
> de `HomeView`, con mensajes de error/confirmación/éxito en español. Verificado en
> navegador: ciclo exportar → borrar → importar deja `localStorage` byte-a-byte igual;
> JSON inválido y un ítem con formato incorrecto muestran error sin alterar el progreso
> existente; cancelar la importación descarta el archivo staged; build pasa.

---

## #11 · Módulo Números (sección propia + formar números grandes)

**Fase**: 0–1 (implementar **antes** de #3) · **Tamaño**: M

**Objetivo**: sacar los números de Vocabulario a un módulo propio al nivel de
Hiragana/Katakana, centrado en dominar primero los **números clave** — los ~29 bloques
con los que se construye cualquier número — y después practicar formándolos: dado un
número grande (p. ej. 4638), componerlo en hiragana con fichas, al estilo del modo
Deletrear de vocabulario.

**Números clave (el corazón del módulo)**:

| Grupo | Ítems | Irregulares (énfasis especial) |
|---|---|---|
| Unidades 1–10 | いち…じゅう (se mudan de vocabulario) | 4=よん, 7=なな, 9=きゅう en compuestos |
| Centenas 100–900 | ひゃく, にひゃく… | **300 さんびゃく · 600 ろっぴゃく · 800 はっぴゃく** |
| Millares 1000–9000 | せん, にせん… | **3000 さんぜん · 8000 はっせん** |
| Diez mil | 10000 いちまん | siempre con いち |

Las 5 formas irregulares de centenas/millares son la "parte complicada" (rendaku/sokuon)
y deben recibir trato preferente: aparecer marcadas visualmente en la tabla de estudio
y sobre-representarse en la generación de ejercicios (mismo espíritu que los pares
confundibles de kana).

**Diseño**:
- Nuevo `src/numbers.ts`:
  - `KEY_NUMBERS`: `{ value, hiragana, romaji, irregular?: true }` para los ~29 bloques
    de la tabla anterior.
  - `numberToKana(n: number): string` — conversor puro 1–99 999 con todas las reglas
    eufónicas (さんびゃく, ろっぴゃく, はっぴゃく, さんぜん, はっせん; よん/なな/きゅう).
    **Con tests unitarios** que incluyan al menos: 2027 = にせんにじゅうなな,
    1523 = せんごひゃくにじゅうさん, 7286, 5438, 4638, y las 5 irregulares aisladas.
  - `numberToChips(n)`: descompone en bloques (4638 → よんせん・ろっぴゃく・さんじゅう・はち)
    para las fichas del juego de formar.
- **Tres modos** (nueva entrada "Números" en `HomeView` + setup view propio, plantilla
  `VocabSetupView`):
  1. **Números clave** (reconocer): cifra → elegir su hiragana entre 4 (plantilla
     `VocabRecognizeGame`, con audio al corregir). Clave SRS `number-key:{value}`
     (p. ej. `number-key:300`). Los distractores de un irregular son sus formas
     "tentadoras" incorrectas (さんひゃく, ろくひゃく, はちひゃく…).
  2. **Formar el número** (producción, estilo Deletrear): se muestra la cifra (p. ej.
     4638), el usuario ordena fichas-bloque (más 2–3 distractores, incluidos los
     irregulares mal formados) en los huecos (`WordSlots` con `flex-wrap` para números
     largos). El número se genera aleatorio por nivel de dificultad: 2 cifras → 3 →
     4 → con まん. El acierto/fallo acredita SRS **a cada número clave usado**
     (`number-key:{value}` de cada bloque), no al número generado (los números
     aleatorios no son ítems SRS estables).
  3. **Contar** (ya existe): `VocabCountingGame` se muda aquí tal cual, conservando
     sus claves `counting:{hiragana}` — sin migración.
- **Desbloqueo pedagógico** (reconocimiento antes que producción, METODOLOGIA §2.2):
  "Formar el número" de N cifras se habilita cuando los números clave de esa magnitud
  están al menos en estado "developing"; la dificultad "con まん" requiere dominar
  los millares.
- Retirada de vocabulario: quitar las 10 palabras y la categoría `numeros` de
  `src/vocabulary.ts` (+ tarjeta de categoría). El progreso viejo (`spell:いち`,
  `meaning:いち`…) queda huérfano pero inerte — no requiere migración ni subir
  `schemaVersion`; las claves `counting:` siguen vivas en el modo Contar.
- UI: `ViewName` + vistas nuevas (`numberSetup`, `numberKeys`, `numberBuild`, `countIt`
  se re-apunta aquí); tarjeta "Números" en `HomeView` (patrón Katakana). Nota:
  `LAST_USED_MODULE_KEY` en `HomeView` solo conoce `hiragana|vocab` — ampliar o dejar
  fuera del hero.
- Audio: TTS del número completo al corregir en "Formar" (`useSpeech` con el kana).

**Aceptación**: `numberToKana` pasa tests con los ejemplos listados; sesión completa de
"Números clave" y de "Formar el número" con SRS persistente por número clave; los 5
irregulares aparecen destacados y sobre-representados; el modo Contar funciona igual que
antes desde la sección nueva conservando su progreso; la categoría Números ya no aparece
en Vocabulario; build pasa.

---

## #12 · Sección "Cómo estudiar" (metodología para el estudiante)

**Fase**: transversal · **Tamaño**: S

**Objetivo**: una vista informativa y estática dentro de la app donde el estudiante
entienda la meta, por qué funciona el método (SRS, recuerdo activo, reconocimiento
antes que producción), su rutina diaria y — crucial — qué debe hacer **fuera** de la
app (shadowing, intercambio, tutor, diario) para llegar a B1 de verdad. Es contenido
fijo igual para todos los usuarios: no lee `ProgressItems` ni calcula nada (a diferencia
de #9, que es el dashboard cuantitativo de progreso real contra las puertas de fase).

**Diseño**:
- Nuevo `src/content/methodology.ts` con el copy en español, estructurado en secciones
  reutilizando el contenido ya redactado en `METODOLOGIA.md` y `ROADMAP.md`:
  1. **Meta y expectativas**: objetivo B1/N3, horas estimadas, ritmo realista
     45–60 min/día (METODOLOGIA §1).
  2. **Cómo funciona**: SRS/Leitner explicado en términos simples, recuerdo activo
     (quiz antes que exposición), reconocimiento → escuchar → producir (§2.1–2.3).
  3. **Tu rutina diaria**: tabla de los 4 bloques (repasos SRS → material nuevo →
     oído y boca → lectura) con los tiempos de METODOLOGIA §3.
  4. **Lo que la app no cubre** (honestidad pedagógica): tabla de las 4 destrezas
     de METODOLOGIA §2.8 — qué cubre la app y qué debe hacerse fuera (shadowing desde
     Fase 1; intercambio/tutor desde Fase 2; diario desde Fase 1).
  5. (Opcional) resumen muy breve de las 4 fases del ROADMAP, con un enlace/nota que
     apunte a #9 ("Camino a B1") para ver el % real una vez exista.
- Nueva view `methodology` en `ViewName` (`src/data.ts`) y componente
  `src/views/MethodologyView.tsx` (estático, sin quiz — única sección de la app
  exenta de la regla "quiz primero" de METODOLOGIA §4, por ser meta-contenido sobre
  la app y no un ítem de aprendizaje).
- Entrada visible desde `HomeView`: icono/enlace tipo "?" o "Cómo estudiar" cerca del
  header, o una `ModuleCard` adicional — no compite con los módulos de estudio.
- Sin claves SRS, sin cambios de `schemaVersion` (no toca `ProgressItems`).

**Aceptación**: la vista es accesible desde `HomeView`; cubre las 4 secciones listadas
en español con el contenido fiel a METODOLOGIA.md; no persiste ni lee progreso; build
pasa.

> **Hecho (2026-07)** — `src/content/methodology.ts` + `MethodologyView.tsx`, accesible
> desde un icono de ayuda junto a la racha en `HomeView`. Cubre las 4 secciones (meta,
> principios, rutina diaria, cobertura de destrezas) más un resumen de las 4 fases del
> ROADMAP.

---

## #13 · Ampliar vocabulario N4: 650 → 1.500 palabras

**Fase**: 2 · **Tamaño**: L (contenido)

**Objetivo**: cubrir la lista de vocabulario JLPT N4 (~700–850 palabras nuevas) en
`src/vocabulary.ts`, para llegar a las ~1.500 palabras acumuladas que exige la puerta
de salida de Fase 2 (ROADMAP). Es la spec de contenido equivalente a la #3, pero para
N4 — hoy no existe ninguna spec que añada este vocabulario; #7 (Listening) y #8
(Lectura) asumen que el vocabulario N4 ya está disponible pero no lo generan.

**Diseño**:
- Mismo formato `VocabWord` que #3 (hiragana, romaji, significado en español, categoría,
  `emojiBackup`; `imageQuery`/`imagePath` según la skill `vocab-images`).
- Añadir un campo `level: "N5" | "N4"` a `VocabWord` (por defecto tratar lo existente
  como N5 vía migración de datos, no de `schemaVersion` — es un campo de contenido, no
  de progreso). Los tres juegos de vocabulario (`VocabularyGame`, `VocabRecognizeGame`,
  `VocabListeningGame`) y su setup view deben poder filtrar por nivel, con N5 y N4
  combinables (por defecto: ambos activos una vez exista N4, para no forzar a
  reconfigurar a quien ya esté en Fase 2).
- Añadir en tandas por categoría (50–100 palabras por PR, igual que #3). Reutilizar
  categorías existentes cuando el significado encaje; crear nuevas solo si hace falta
  (p. ej. trabajo, sentimientos, verbos III), registrándolas en `VOCAB_CATEGORIES`.
- Palabras que en N4 se escriben habitualmente con katakana: incluirlas (el módulo
  Katakana #1 ya existe).
- Evitar duplicados con las ~652 existentes (comprobar por campo `hiragana`).
- Imágenes: usar la skill `vocab-images` para las tandas nuevas; `emojiBackup`
  obligatorio como fallback.
- Este vocabulario es prerrequisito de contenido para #8 ampliado a N4 (lectura) y para
  que #7 (Listening, ya implementado) empiece a generar frases marcadas `level: "N4"`
  desde `src/grammar.ts` una vez exista gramática N4 (ROADMAP Fase 2 §Contenido 3,
  aún no especificada como backlog — ver nota de seguimiento más abajo).

**Aceptación**: `VOCABULARY.length` ≥ 1.500 combinando N5+N4, sin duplicados; cada
palabra nueva tiene `level: "N4"`, significado en español y categoría válida; los
juegos de vocabulario filtran por nivel; build pasa.

> **Nota de seguimiento**: el ROADMAP Fase 2 también pide gramática N4 (forma て,
> pasado plano, たり/ながら…) y no existe todavía una spec de backlog para eso —
> equivalente a la #6 pero N4. Si se prioriza esta ampliación de vocabulario, conviene
> abrir esa spec de gramática N4 a continuación, ya que #7/#8 la necesitarán para
> generar contenido N4 real (hoy #7 solo tiene frases N5 derivadas de `grammar.ts`).

---

## #14 · Integrar Vocabulario y Kanji en Estadísticas

**Fase**: transversal · **Tamaño**: M

**Objetivo**: `StatsView` hoy solo cubre Hiragana/Katakana (ver notas "Hecho" de #4, #5,
#6, #7 y #9: "No se integró en StatsView, igual que Frases/Kanji/Números/Gramática/
Listening"). Esta spec cierra la brecha para **Vocabulario** y **Kanji**, que ya tienen
todo el cómputo de progreso necesario implementado y sin usar en la vista de estadísticas.

**Diseño**:
- No hace falta cómputo nuevo: `src/utils.ts` ya expone `vocabStatus`/`vocabCategoryStats`
  y `kanjiStatus`/`kanjiGroupStats` (agregan attempts/correct sobre `VOCAB_MODES` y
  `KANJI_MODES` respectivamente, mismos umbrales que `charStatus`). El trabajo es cablear
  `StatsView.tsx`, no reinventar el cálculo.
- Ampliar `ScriptId` (`src/views/StatsView.tsx`) de `"hiragana" | "katakana"` a incluir
  `"vocabulario" | "kanji"`, con su entrada en el selector de pestañas existente. Si 4
  pestañas en una fila queda apretado, usar un selector de dos niveles ("Kana" ↔
  "Contenido") en vez de forzarlas todas en la misma fila — decisión de UI libre.
- Tarjeta hero (% dominado + barra), igual patrón que hoy: para vocabulario,
  `mastered = VOCABULARY.filter(w => vocabStatus(progress, w.hiragana) === "mastered").length`
  sobre `VOCABULARY.length`; para kanji, análogo con `KANJI`/`kanjiStatus`.
- Sección "Por categoría": hoy es un grid fijo de 3 tarjetas (`categoryTotals` sobre
  `RowGroup[]` de kana). Vocabulario tiene ~24 categorías (`VOCAB_CATEGORIES`) y kanji
  ~10 grupos (`KANJI_GROUPS`) — no caben 3 en fila. Sustituir por una lista (scrolleable
  o en grid de 2) que recorra **todas** las categorías/grupos usando directamente
  `vocabCategoryStats(progress, cat.id)` / `kanjiGroupStats(progress, group.id)` (ya
  devuelven `{ total, mastered }`, sin iterar rows a mano).
- Sección de detalle por ítem (hoy `RowBlock`, una cajita por kana con su estado de
  color): no traslada 1:1 a 650 palabras en pantalla. Diseño: por cada categoría/grupo,
  un bloque plegable (colapsado por defecto, muestra `mastered/total` + barra, como los
  `RowBlock` actuales) que al expandirse pinta las cajitas (`STATUS_STYLE`/`STATUS_DOT`,
  mismos 4 colores y la misma leyenda ya existente) solo de las palabras/kanji de ese
  grupo — cajita con hiragana + significado corto para vocabulario, kanji + on'yomi/
  kun'yomi corto para kanji, en vez de kana + romaji.
- Accuracy mostrado en la cajita cuando el estado es "developing"/"weak": hoy `RowBlock`
  lee `progress["recognition:{kana}"]` directo; para vocabulario/kanji hay que sumar
  attempts/correct a través de `vocabProgressKey`/`VOCAB_MODES` (o el helper equivalente
  ya usado dentro de `vocabStatus`/`kanjiStatus` — puede valer la pena exportar un
  `vocabAccuracy`/`kanjiAccuracy` desde `utils.ts` que reutilice esa misma suma en vez
  de duplicarla en el componente).
- La leyenda de colores (`STATUS_LABEL`/`STATUS_CRITERIA`) es genérica por umbral, no por
  silabario — no requiere cambios, aplica igual a vocabulario y kanji.
- Frases, Números, Gramática y Listening **siguen fuera de StatsView** tras esta spec
  (no es su alcance); si se implementan después, actualizar sus notas "Hecho" que hoy
  dicen explícitamente que no están integradas.

**Aceptación**: `StatsView` tiene pestañas para Vocabulario y Kanji con % dominado global,
desglose por **todas** las categorías/grupos (no solo 3) y detalle expandible por palabra/
kanji con el mismo código de color y leyenda que hiragana/katakana; ningún cómputo de
mastery se duplica (se reutilizan `vocabStatus`/`vocabCategoryStats`/`kanjiStatus`/
`kanjiGroupStats` de `src/utils.ts`); build pasa.

---

## Plantilla para nuevas specs

Al añadir specs futuras a este backlog, incluir siempre: **Fase** del ROADMAP, **Objetivo**
(1–2 frases), **Diseño** (modelo de datos, claves SRS `"{modo}:{ítem}"`, componentes
existentes a reutilizar como plantilla, entrada en `HomeView`/`ViewName`) y **Aceptación**
(criterios verificables + "build pasa").
