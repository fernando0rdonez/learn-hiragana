# learn-hiragana

This is a repository to learn Japanese characters 

## Plan de aprendizaje: de cero a B1 (JLPT N3)

El plan completo de estudio y desarrollo de la app vive en `docs/`:

- **[docs/METODOLOGIA.md](./docs/METODOLOGIA.md)** — cómo estudiar: principios (SRS,
  recuerdo activo, input comprensible…), rutina diaria de 45–60 min, expectativas de
  horas, y las reglas que toda feature nueva debe respetar.
- **[docs/ROADMAP.md](./docs/ROADMAP.md)** — el camino en 4 fases (Kana → N5 → N4 → N3/B1)
  con contenidos, duración estimada y puertas de salida medibles por fase.
- **[docs/BACKLOG.md](./docs/BACKLOG.md)** — las ~10 features pendientes de la app,
  cada una escrita como especificación autocontenida.

### Cómo usar el backlog con Claude Code

Cada spec del BACKLOG es autocontenida. Para implementar una, abre una sesión nueva
sobre este repositorio y pide, por ejemplo:

> Implementa la spec **#1 · Módulo Katakana** de `docs/BACKLOG.md`, respetando las
> reglas de `docs/METODOLOGIA.md` §4.

La sesión encontrará en la spec el objetivo, el modelo de datos, los archivos existentes
que debe reutilizar y los criterios de aceptación. El orden recomendado de implementación
está al final de `docs/ROADMAP.md`.
