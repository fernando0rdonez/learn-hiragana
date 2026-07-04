# Metodología de aprendizaje — de cero a B1 (JLPT N3)

Este documento define **cómo** se aprende con esta aplicación: los principios pedagógicos,
la rutina diaria y las reglas de progresión. El **qué** y **cuándo** están en
[`ROADMAP.md`](./ROADMAP.md); las funcionalidades que faltan por construir están
especificadas en [`BACKLOG.md`](./BACKLOG.md).

**Audiencia**: el estudiante (para saber cómo estudiar) y las sesiones de Claude que
implementen nuevas features (para que respeten estos principios).

---

## 1. Meta y expectativas honestas

- **Meta**: comprensión y producción de japonés a nivel **B1 del MCER**, que equivale
  aproximadamente al **JLPT N3**: entender conversaciones cotidianas a velocidad casi
  natural, leer textos sencillos sobre temas familiares y expresarse sobre experiencias,
  planes y opiniones simples.
- **Horas necesarias**: para un hispanohablante, N3 requiere del orden de
  **900–1.300 horas** de estudio efectivo (el japonés es categoría de máxima distancia
  lingüística desde el español: dos silabarios + kanji + gramática aglutinante).
- **Ritmo realista**: con **45–60 min/día, todos los días**, son **24–30 meses**.
  Con 90 min/día puede bajar a ~18 meses. Menos de 30 min/día hace inviable la meta.
- **Regla de oro**: la constancia diaria vale más que las sesiones largas. 45 min × 7 días
  rinde más que 5 h el domingo (espaciado > masificación).

### Equivalencia MCER ↔ JLPT (aproximada)

| MCER | JLPT | Vocabulario acum. | Kanji acum. | Horas acum. (hispanohablante) |
|------|------|-------------------|-------------|-------------------------------|
| pre-A1 | — (kana) | 0–100 | 0 | 40–60 |
| A1 | N5 | ~800 | ~100 | 250–400 |
| A2 | N4 | ~1.500 | ~300 | 500–750 |
| **B1** | **N3** | **~3.700** | **~650** | **900–1.300** |

---

## 2. Principios pedagógicos (y cómo viven en la app)

### 2.1 Repetición espaciada (SRS)

Cada ítem (kana, palabra, kanji, frase) se repasa justo antes de que se olvide.
La app ya implementa un **sistema Leitner** en `src/leitner.ts`:

- Cajas 0–6 con intervalos `0/1/3/7/14/30/60` días.
- Acierto → sube de caja; fallo → vuelve a la caja 0 con repaso hoy.
- La cola de sesión prioriza: **vencidos → nuevos → no vencidos** (`buildSessionQueue`).
- El progreso se guarda por clave `"{modo}:{ítem}"` en `localStorage` (`src/storage.ts`).

**Regla para el estudiante**: los repasos vencidos se hacen **siempre primero**, antes de
introducir material nuevo. Si un día solo hay 15 minutos, se hacen solo repasos.

### 2.2 Recuerdo activo (testing effect)

Recuperar de memoria fija más que releer. Por eso **todo en la app es quiz**: nunca hay
listas para "leer y memorizar". Toda feature nueva debe seguir este patrón: primero se
pregunta, después se muestra la respuesta con contexto (imagen, nota, audio).

### 2.3 Reconocimiento antes que producción

Para cada ítem nuevo el orden de dificultad es:

1. **Reconocer** (ver el japonés → elegir el significado): `VocabRecognizeGame`, modo `recognition`.
2. **Escuchar** (oír → identificar): `VocabListeningGame`, modo `listening`.
3. **Producir** (significado → escribir/deletrear en kana): `VocabularyGame` (spell), modo `production`.

No se exige producción de un ítem que aún no se reconoce con fiabilidad. El progreso por
modo ya se registra por separado (claves `spell:`, `meaning:`, `listening:`, `recognition:`,
`production:` en `src/types.ts` → `ItemMode`).

### 2.4 Input comprensible (i+1)

El material nuevo debe contener **un solo elemento desconocido** sobre una base dominada:

- Las frases de gramática (BACKLOG #6) usan solo vocabulario ya dominado.
- Las lecturas graduadas (BACKLOG #8) introducen ≤1 palabra nueva por oración.
- Los kanji (BACKLOG #5) se enseñan con palabras que el estudiante ya conoce en kana.

### 2.5 Interleaving y sesiones cortas

- Sesiones de **10–20 ítems** (ya es el default de la app).
- Mezclar categorías dentro de la sesión (la cola ya se baraja) y alternar módulos entre
  días (kana / vocabulario / gramática) en vez de bloques monotemáticos de semanas.

### 2.6 Puertas de dominio (mastery gates)

No se avanza de fase por tiempo transcurrido sino por **criterios medibles** (definidos por
fase en `ROADMAP.md`). El criterio de "dominado" de la app es: caja Leitner ≥ 3 con ≥ 80%
de aciertos (`charStatus` en `src/utils.ts`). La vista de mapa de progreso (BACKLOG #9)
mostrará estas puertas de forma explícita.

### 2.7 Fonética desde el día 1

Los fenómenos que rompen la correspondencia escritura↔sonido se entrenan explícitamente
(módulo Fonética existente, `src/phonetics.ts`): ensordecimiento de い/う (です→"des"),
alargamiento ei→ee / ou→oo. Se ampliará con acento de tono (pitch accent) básico y
consonantes geminadas (っ) en fases posteriores.

### 2.8 Las 4 destrezas: qué cubre la app y qué no

| Destreza | En la app | Fuera de la app (obligatorio desde Fase 2) |
|---|---|---|
| Leer | ✅ kana, vocab, kanji, lecturas graduadas | Graded readers (Tadoku, nivel 0–2), NHK News Web Easy |
| Escuchar | ✅ TTS palabra/frase, dictado | Podcasts para aprendices (Nihongo con Teppei, japonés con historias), anime/dramas con subtítulos japoneses en Fase 3 |
| Escribir | ⚠️ deletreo en kana | Diario de 2–3 frases/día desde Fase 1; corrección con tutor o apps de intercambio |
| Hablar | ❌ no cubierta | **Imprescindible**: shadowing (repetir en voz alta tras el audio TTS) desde Fase 1; intercambio (HelloTalk/Tandem) desde Fase 2; tutor (italki) 1×/semana desde Fase 2–3 |

**Ser honestos con esto es parte de la metodología**: una app de drills lleva sola hasta
~A2 en comprensión; el B1 real exige producción oral externa. La app debe medir y guiar,
no fingir que lo cubre todo.

---

## 3. Rutina diaria tipo (45–60 min)

| Bloque | Tiempo | Qué | Módulo |
|---|---|---|---|
| 1. Repasos SRS | 15–20 min | Todos los ítems vencidos de todos los módulos | cola Leitner |
| 2. Material nuevo | 15–20 min | 5–10 ítems nuevos de la fase actual (vocab/kanji/gramática) | según fase |
| 3. Oído y boca | 10 min | Listening + shadowing en voz alta de lo escuchado | Fonética / Escuchar |
| 4. Lectura | 5–10 min | Releer frases/lecturas ya vistas; desde Fase 2, lectura graduada externa | Lectura |

Reglas:

- **Nunca saltarse el bloque 1.** Es lo único innegociable del día.
- Si un día no hay tiempo: solo bloque 1 (mantiene la racha y la retención).
- Máximo ~10 ítems nuevos/día en vocabulario y ~3 kanji nuevos/día: más que eso colapsa
  la cola de repasos a los 10 días.
- La racha diaria de la app (`src/streak.ts`) es el contrato de constancia; el objetivo
  es no romperla, no acumular sesiones heroicas.

---

## 4. Reglas para implementar features nuevas

Toda sesión de Claude que implemente specs del BACKLOG debe respetar:

1. **Todo ítem entrenable entra al SRS** con clave `"{modo}:{ítem}"` en `ProgressItems`
   y usa `advanceBox`/`buildSessionQueue` de `src/leitner.ts`. No inventar otro scheduler.
2. **Quiz primero, exposición después** (recuerdo activo, §2.2).
3. **Reconocimiento antes que producción** al diseñar modos de juego (§2.3).
4. **Sesiones de 10–20 ítems** con resumen final (patrón `VocabSessionSummary`).
5. **Español como lengua de interfaz** y de significados.
6. **Audio con `useSpeech`** (TTS ja-JP) en todo material nuevo que tenga forma hablada.
7. **Migraciones de esquema** de progreso versionadas (`schemaVersion` en `src/storage.ts`)
   para no destruir meses de datos del usuario.
