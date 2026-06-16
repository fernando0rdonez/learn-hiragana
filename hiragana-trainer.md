# Hiragana Trainer — spec para Claude Code

Contexto: existe un prototipo (React artifact en Claude.ai) que ya cubre reconocimiento kana→romaji para las 46 hiragana base, con UI funcionando y testeada manualmente. Este documento describe los cambios para portarlo a un repo propio y agregarle 3 capacidades nuevas. **No es código, es la especificación de qué construir y por qué.**

## 0. Cambio obligatorio: capa de persistencia

El prototipo usa `window.storage`, una API que solo existe dentro del sandbox de artifacts de Claude.ai. Fuera de ahí no existe — hay que reemplazarla por completo, no adaptarla.

- Usar `localStorage` del navegador.
- Envolver toda lectura/escritura en try/catch: `localStorage` puede fallar (modo privado, cuota llena, navegador viejo) y la app no debe romperse si pasa, solo perder persistencia esa sesión.
- Decisión ya tomada: **cada persona que use la app tiene su propio progreso en su propio navegador**. No hay login, no hay comparación entre usuarios, no hay backend. Si tres personas abren el mismo sitio desplegado, cada una ve solo lo suyo porque cada una tiene su propio localStorage. No construir nada de sincronización ni cuentas.
- Limitación aceptada explícitamente: si alguien borra caché del navegador o cambia de dispositivo, pierde el progreso. Está bien para este proyecto, no hay que resolverlo.

## 0.1 Restricción de plataforma: navegador de teléfono + PWA instalable

Contexto que cambia varias decisiones de UI: esto se usa en el navegador de un teléfono, no en desktop. No es una mejora de "responsive" opcional, son requisitos:

- `index.html` necesita el meta viewport correcto (`width=device-width, initial-scale=1`). Sin esto el teléfono renderiza como página de escritorio reducida.
- No depender de autofocus programático en los inputs de texto — iOS Safari en particular bloquea `.focus()` si no viene de un toque directo del usuario. Diseñar la interacción asumiendo que el usuario toca el campo para abrir el teclado, no que se abre solo al cargar la pregunta.
- Áreas táctiles de mínimo ~44x44px en botones y chips de fila — la cuadrícula de filas ya se ve apretada en la captura actual, se agrava en pantallas chicas si no se corrige a propósito.
- Los estados `hover:` de Tailwind no aplican en touch. No son un bug, simplemente quedan inertes — el estado de "seleccionado" (borde/color al tocar) ya cubre la señal real de interacción, no hay que reemplazar el hover por nada.
- **PWA — agregar a pantalla de inicio:** se necesita `manifest.json` (nombre, ícono, `display: standalone`, color de tema) y los íconos en los tamaños estándar para iOS/Android. Alcance limitado a propósito: esto es solo para que se pueda instalar como ícono y abra rápido, **no incluye service worker ni soporte offline** — eso es trabajo aparte si se quiere más adelante.

Esto no bloquea las fases 3–5, se puede hacer en cualquier momento. Tiene sentido agruparlo con el pase de sistema visual mencionado antes (sección de diseño), ya que ambos son ajustes de plataforma/presentación, no lógica de features.

## 1. Modelo de datos (localStorage)

Una sola clave, `hiragana-progress`, valor JSON con esta forma:

```json
{
  "items": {
    "recognition:あ": { "box": 2, "nextDue": "2026-06-18", "attempts": 4, "correct": 4 },
    "production:あ":  { "box": 0, "nextDue": "2026-06-16", "attempts": 1, "correct": 0 },
    "word:さかな":     { "box": 1, "nextDue": "2026-06-17", "attempts": 2, "correct": 1 }
  }
}
```

- Cada item tiene un id compuesto: `modo:contenido` (`recognition:あ`, `production:あ`, `word:さかな`).
- `recognition` y `production` se trackean **separadas**, aunque sean la misma kana — son habilidades distintas (leer vs producir) y mezclarlas en una sola métrica de "dominio" sería engañoso.
- El modo "pares confusos" (sección 3) **no** es un tipo de item nuevo. Es solo una forma de armar el pool de una sesión (filtrar a un subconjunto curado de items `recognition`/`production` ya existentes). No agrega entradas nuevas al modelo de datos.

## 2. Repetición espaciada real (cajas Leitner)

El prototipo anterior solo pesaba aleatoriedad dentro de una sesión — no programaba revisión a futuro. Ahora que la app vive fuera del chat y tiene fechas reales disponibles, hacerlo bien:

- 5 cajas (0 a 4), con intervalo en días: `[0, 1, 3, 7, 14]`.
- Respuesta correcta → `box = min(box + 1, 4)`, `nextDue = hoy + intervalo[box]`.
- Respuesta incorrecta → `box = 0`, `nextDue = hoy` (se revisa otra vez de inmediato, no en una semana).
- Un item está "vencido" (due) si `nextDue <= hoy`.
- **Selección de sesión:** priorizar items vencidos del pool seleccionado. Si no hay suficientes vencidos para llenar la sesión, completar con items nuevos (sin attempts) del mismo pool. No rellenar con items no vencidos todavía — si no hay nada que practicar, decírselo al usuario en vez de forzar repaso innecesario.
- **Refuerzo dentro de la sesión:** si el usuario falla un item, debe volver a aparecer otra vez antes de que termine esa misma sesión (esto es independiente de su `nextDue`, que ya quedó en "hoy" por el fallo — es solo práctica correctiva inmediata, no conflictúa con el sistema de cajas).

## 3. Modo nuevo: producción (romaji → kana)

- El usuario ve el romaji (ej. "ke") y debe identificar el kana correcto.
- **Decisión ya tomada:** selección múltiple, no input de texto libre. No asumir que el dispositivo tiene teclado japonés instalado — eso rompería la app para cualquiera sin IME configurado.
- 4 opciones por pregunta: la correcta + 3 distractores. Los distractores no deben ser puramente aleatorios — si lo son, la prueba es trivial (basta reconocer "esto no se parece a nada"). Incluir al menos 1 distractor de la lista de pares confusos de la sección 4 cuando exista uno para ese kana, y completar el resto al azar del mismo pool de filas seleccionadas.
- Trackea como item `production:{kana}`, separado de `recognition:{kana}`.

## 4. Modo nuevo: pares confusos

Lista curada de pares que se confunden visualmente, useful tanto para armar sesiones dedicadas como para elegir distractores en el modo de producción:

| Par | Razón |
|---|---|
| か / け | estructura vertical + trazo derecho similar |
| ぬ / ね | ambas con el bucle característico |
| る / ろ | trazo final curvo casi idéntico |
| わ / れ / ね | trío que comparte el bucle inferior |
| さ / ち | confundidos en sesión anterior del usuario |
| せ / て | confundidos en sesión anterior del usuario |
| は / ほ | el trazo extra de ほ es fácil de pasar por alto |
| り / い | trazos verticales cortos parecidos |

- Sesión de "pares confusos": el usuario elige uno o más pares de esta lista, la sesión mezcla solo esos kana (en modo recognition, production, o ambos — decisión de UI abierta, sugiero dejarlo simple: recognition primero).
- Esta lista es semilla, no exhaustiva — dejar fácil agregar pares nuevos a futuro (constante separada, no hardcodeada dentro de la lógica de sesión).

## 5. Modo nuevo: palabras simples

- Decisión ya tomada de scope: solo palabras que usan hiragana base, **sin** las excepciones del japonés (sin っ que duplica consonante, sin vocales largas, sin el は de partícula pronunciado "wa"). Esas reglas son contenido nuevo, no refuerzo de hiragana, y meterlas ahora mezclaría dos aprendizajes distintos. Quedan para una fase 2 explícita si se quiere después.
- Input: romaji escrito a mano (texto libre), igual que el modo recognition original — a diferencia de producción, aquí no hay ambigüedad de qué tecla tocar, es lectura completa de la palabra.
- Lista semilla (extensible), todas compatibles con el scope:

| Kana | Romaji | Significado |
|---|---|---|
| あさ | asa | mañana |
| いえ | ie | casa |
| うた | uta | canción |
| かさ | kasa | sombrilla |
| きく | kiku | escuchar |
| さかな | sakana | pez |
| そら | sora | cielo |
| たぬき | tanuki | tanuki |
| とり | tori | pájaro |
| なつ | natsu | verano |
| ねこ | neko | gato |
| はな | hana | flor |
| まめ | mame | frijol |
| みかん | mikan | mandarina |
| やま | yama | montaña |
| ゆき | yuki | nieve |
| よる | yoru | noche |
| わたし | watashi | yo |
| くるま | kuruma | auto |

- Cada palabra solo debería entrar al pool de una sesión si el usuario ya tiene seleccionadas (o dominadas) las filas que la componen — si no, está probando vocabulario antes que el caracter base, lo cual invierte el orden de aprendizaje sin querer.

## 6. Fuera de scope para esta fase (explícito, no por olvido)

- Sin audio de pronunciación.
- Sin trazo/escritura a mano (motor memory) — es una habilidad distinta a reconocer/producir en pantalla, válida como fase futura.
- Sin katakana, dakuten (が/ざ/だ/ば/ぱ) ni combinaciones (きゃ, しゅ, etc.) — el scope actual son las 46 hiragana base.
- Sin cuentas, login, ni progreso compartido entre usuarios.

## 7. Orden de construcción sugerido

1. Migrar persistencia de `window.storage` a `localStorage`, portando el modo recognition existente 1:1. Verificar que el esquema de datos funcione antes de tocar nada más.
2. Implementar cajas Leitner + selección de sesión por vencimiento, reemplazando el peso heurístico anterior.
3. Agregar modo producción (selección múltiple).
4. Agregar modo pares confusos (reusa pools existentes, sin dato nuevo).
5. Agregar modo palabras (nuevo tipo de item, nueva UI de input de palabra completa).

Construir en ese orden evita reescribir todo de una vez y permite probar cada pieza con Claude Code antes de seguir a la siguiente.

## 8. Fase futura: rachas (no incluida en las fases 1–5 de arriba)

Agregar cuando las fases anteriores estén estables, no antes — depende del modelo de items ya funcionando.

- **Qué cuenta como "día cumplido":** acertar al menos 10 respuestas correctas ese día calendario, sumando todas las sesiones del día (no solo una sesión aislada). Decisión deliberada: contar solo aperturas de la app premiaría usarla sin practicar de verdad.
- **Tolerancia:** margen de 48 horas. Si el último día cumplido fue ayer o anteayer, la racha sigue. Si pasaron más de 2 días sin cumplir, la racha se rompe y vuelve a 1 en el próximo día cumplido.
- **Datos a agregar** (mismo JSON de `hiragana-progress`, no una clave nueva — ver nota sobre minimizar llamadas de storage):

```json
{
  "items": { "...": "..." },
  "streak": { "current": 4, "longest": 11, "lastSuccessDate": "2026-06-16" },
  "dailyProgress": { "date": "2026-06-16", "correctToday": 7 }
}
```

- `dailyProgress` se reinicia (`correctToday: 0`, `date: hoy`) en la primera respuesta correcta de un día nuevo.
- Cuando `correctToday` cruza el umbral de 10 por primera vez ese día: comparar `lastSuccessDate` contra hoy. Si la diferencia es ≤ 2 días, `current += 1`; si es mayor, `current = 1`. Actualizar `longest` si corresponde. No volver a incrementar si ya se cumplió hoy.
- Como cada persona tiene su propio `localStorage`, cada uno lleva su propia racha — no hay nada que sincronizar.