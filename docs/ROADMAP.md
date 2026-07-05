# Roadmap — el camino de 0 a B1 (JLPT N3)

Este documento define **qué** se estudia, **en qué orden** y **cuándo se avanza**.
Los principios de estudio están en [`METODOLOGIA.md`](./METODOLOGIA.md); las features
de la app que cada fase necesita están especificadas en [`BACKLOG.md`](./BACKLOG.md).

Las duraciones asumen 45–60 min/día (ver METODOLOGIA §1). No se avanza de fase por
calendario sino cumpliendo la **puerta de salida** de la fase (METODOLOGIA §2.6).

## Vista general

| Fase | Nivel | Duración estimada | Alcance | Estado en la app |
|---|---|---|---|---|
| 0 — Kana | pre-A1 | semanas 1–8 | hiragana + katakana + fonética básica | Hiragana ✅ · Fonética ✅ · Katakana ✅ |
| 1 — Fundamentos | A1 ≈ N5 | meses 3–8 | 800 palabras, ~100 kanji, gramática N5, frases hechas | Vocab ✅ (~650, N5 completo sin números — ver #3) · Números ✅ (#11) · Frases ✅ (#4) · Kanji ❌ (#5) · Gramática ❌ (#6) |
| 2 — Consolidación | A2 ≈ N4 | meses 8–16 | 1.500 palabras, ~300 kanji, forma て/plana, listening y lectura de frases | Listening frases ❌ (#7) · Lectura ❌ (#8) |
| 3 — Independencia | B1 ≈ N3 | meses 16–28 | 3.700 palabras, ~650 kanji, gramática N3, párrafos, shadowing, producción | Lectura N3 ❌ (#8) · Mapa B1 ❌ (#9) |

---

## Fase 0 — Kana (semanas 1–8) · pre-A1

**Objetivo**: leer cualquier texto en kana con fluidez. Es la base de todo lo demás:
sin kana automático, cada palabra posterior cuesta el doble.

### Contenido

1. **Semanas 1–4 — Hiragana** (módulo existente):
   - 2 filas nuevas por día en modo *reconocimiento*; al día siguiente, las mismas en *producción*.
   - Orden: 46 básicos (`ROWS`) → dakuten/handakuten (`DAKUTEN_ROWS`) → compuestos (`COMPOUND_ROWS`).
   - Drill diario de **pares confundibles** (は/ほ, ね/れ/わ, る/ろ…) desde la semana 2 (módulo existente).
   - Palabras en kana (`src/words.ts`) desde la semana 3 para leer kana *en contexto*.
2. **Semanas 3–6 — Fonética** (módulo existente): ensordecimiento y alargamiento, 5 min/día.
3. **Semanas 5–8 — Katakana** (módulo existente): mismo método que hiragana.
   Solapar con el mantenimiento SRS del hiragana, no esperar a "terminar" hiragana.

### Rutina de la fase

Bloque nuevo = kana; bloque de lectura = palabras en kana. Sin vocabulario aún
(salvo el que aparece en las palabras de práctica).

### 🚪 Puerta de salida

- ≥ 95% de los 104 hiragana (básicos+dakuten+compuestos) en estado **dominado** (caja ≥3).
- ≥ 90% de katakana dominado en reconocimiento.
- Leer una palabra de 3–4 kana en < 2 segundos sin romaji (desactivar "mostrar romaji").
- Fonética: ≥ 80% de acierto en ambos fenómenos.

---

## Fase 1 — Fundamentos (meses 3–8) · A1 ≈ N5

**Objetivo**: el "kit de supervivencia": presentarse, pedir, preguntar, hablar de rutina,
gustos y planes inmediatos. Aprobar (mentalmente) el JLPT N5.

### Contenido

1. **Vocabulario N5 completo** (BACKLOG #3, hecho: ~650 palabras — la cifra "800" de las
   listas N5 incluía ~100 números/contadores/fechas, que viven en el módulo Números #11).
   Ritmo: 8–10 palabras nuevas/día,
   ciclo reconocer → escuchar → deletrear (METODOLOGIA §2.3).
   Los números van aparte: **módulo Números** (BACKLOG #11) — dominar los ~29 números
   clave (1–10, centenas, millares, 10000) con énfasis en las 5 formas irregulares
   (さんびゃく, ろっぴゃく, はっぴゃく, さんぜん, はっせん) y practicar formando números
   grandes en hiragana. Es la base de los contadores y hora/fecha de la gramática N5.
2. **Frases hechas y saludos** (BACKLOG #4): ~80 expresiones (おはようございます,
   すみません, お願いします…) con audio y contexto de uso. Son la primera producción oral:
   **shadowing** de cada frase (repetir en voz alta tras el TTS).
3. **Kanji: los ~100 de N5** (BACKLOG #5). Ritmo: 3 nuevos/día desde el mes 4.
   Cada kanji se ancla a palabras ya conocidas en kana (数 → すう en すうじ).
4. **Gramática N5** (BACKLOG #6), en este orden:
   - Estructura X は Y です; preguntas con か
   - Partículas は・が・を・に・で・へ・と・も・の
   - Verbos forma -ます (presente/pasado, afirmativo/negativo)
   - Adjetivos い / な y su conjugación básica
   - Demostrativos これ/それ/あれ; existencia あります/います
   - Contadores básicos y hora/fecha
   - Me gusta / quiero: がすき, がほしい, たいです

### Fuera de la app (recomendado, 1–2 h/semana extra)

- Escuchar un podcast para principiantes absolutos.
- Escribir un diario de 2–3 frases/día con la gramática vista.

### 🚪 Puerta de salida

- 800 palabras con ≥ 80% dominadas en reconocimiento y ≥ 60% en producción.
- 100 kanji N5 dominados en reconocimiento (significado + lectura principal).
- Gramática: ≥ 85% de acierto en los drills de construir frases y partículas.
- Autoevaluación: entender un audio nivel N5 de ~1 min y responder 3 preguntas.

---

## Fase 2 — Consolidación (meses 8–16) · A2 ≈ N4

**Objetivo**: pasar de palabras sueltas a **oraciones y párrafos**. Entender y producir
narración simple en pasado/presente/futuro, peticiones y permisos.

### Contenido

1. **Vocabulario → 1.500 palabras** (acumulado): las ~700 de N4, mismo ciclo.
2. **Kanji → 300** (acumulado): ~170 nuevos de N4, 3/día con mantenimiento SRS.
3. **Gramática N4**:
   - Forma て (peticiones てください, permiso てもいい, prohibición てはいけない, progresivo ている)
   - Forma plana/diccionario y pasado plano (た); estilo informal
   - Subordinadas: と思う, と言う, relativas (nombre modificado por frase)
   - Potencial, たい + gustos ampliados, comparaciones (より/のほうが)
   - ながら, たり…たり, なければならない
4. **Listening de frases completas** (BACKLOG #7): dictado y comprensión de oraciones
   N5–N4 con TTS, no palabras sueltas.
5. **Lectura graduada** (BACKLOG #8): pasajes de 3–6 oraciones i+1 con preguntas.

### Fuera de la app (obligatorio en esta fase — METODOLOGIA §2.8)

- **Intercambio de conversación** (HelloTalk/Tandem) o tutor: 30 min/semana mínimo.
- Graded readers nivel 0–1 (Tadoku): 1 historia/semana.
- Shadowing sistemático: 10 min/día sobre los audios de la app o del podcast.

### 🚪 Puerta de salida

- 1.500 palabras ≥ 80% dominadas; 300 kanji dominados en reconocimiento.
- Leer un pasaje N4 de ~150 caracteres y responder preguntas con ≥ 80%.
- Dictado: transcribir en kana oraciones N4 con ≥ 75% de acierto.
- Mantener una conversación de 5 min con un tutor/intercambio sobre rutina y pasado.

---

## Fase 3 — Independencia (meses 16–28) · B1 ≈ N3

**Objetivo**: el salto a usuario independiente: entender japonés cotidiano a velocidad
casi natural, leer textos sencillos reales y expresar opiniones y experiencias.

### Contenido

1. **Vocabulario → 3.700 palabras** (acumulado): las ~2.200 de N3. Aquí el volumen manda:
   10 palabras/día sostenidas + repasos. La mayor parte del tiempo de app es SRS.
2. **Kanji → 650** (acumulado): ~350 nuevos de N3.
3. **Gramática N3**: pasiva, causativa, causativa-pasiva; condicionales (と/ば/たら/なら);
   敬語 básico (honorífico/humilde); conectores de discurso (のに, ばかり, ように, はず,
   べき, らしい, みたい…).
4. **Lectura de párrafos** (BACKLOG #8 ampliado): textos de 200–400 caracteres tipo N3
   (avisos, correos, narraciones) con preguntas de inferencia, no solo literales.
5. **Mapa de progreso B1** (BACKLOG #9): panel que muestra las puertas de las 4 fases
   y el % real de cada una, para dirigir el estudio de los últimos meses.

### Fuera de la app (el grueso del salto a B1 ocurre aquí)

- Tutor 1×/semana con conversación libre + corrección.
- NHK News Web Easy: 1 noticia/día (mes 20+).
- Contenido nativo fácil con subtítulos japoneses (anime slice-of-life, vlogs).
- Diario ampliado: 5+ frases/día usando la gramática N3 de la semana.

### 🚪 Puerta de salida = meta del plan

- Simulacro N3 (vocabulario/gramática/lectura/listening) ≥ 70% en cada sección.
- Leer una noticia de NHK Easy sin diccionario captando la idea principal.
- Conversación de 15 min con hablante nativo sobre un tema no ensayado.
- Escribir un texto de ~200 caracteres (opinión o experiencia) comprensible.

---

## Orden de implementación de features

Para que la app siempre vaya **por delante** del estudiante:

| Cuándo | Features (BACKLOG) |
|---|---|
| Ya / inmediato | #10 Exportar progreso · #11 Números (antes de #3: retira los números del vocabulario) |
| Antes del mes 3 | #3 Vocabulario N5 ✅ · #4 Frases con audio ✅ |
| Antes del mes 4–5 | #5 Kanji N5 · #6 Gramática/construir frases |
| Antes del mes 8 | #7 Listening de frases · #8 Lectura graduada |
| Antes del mes 16 | #8 ampliado a N3 · #9 Mapa de progreso B1 |
