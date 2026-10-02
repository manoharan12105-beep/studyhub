# Templates

Starting points for new StudyHub content. Copy a template, fill it in, and delete the guidance comments. The rules the templates follow are in [docs/content-guide.md](../docs/content-guide.md).

## Which lesson template?

The topic's `type` in metadata decides the template for its `content.md`:

| `type`           | Template                                                | Use for                                                     |
|------------------|---------------------------------------------------------|-------------------------------------------------------------|
| `data-structure` | [lesson/data-structure.md](lesson/data-structure.md)   | Structures with operations (arrays, lists, trees, …)        |
| `algorithm`      | [lesson/algorithm.md](lesson/algorithm.md)             | Procedures with steps and complexity (sorting, search, …)   |
| `concept`        | [lesson/concept.md](lesson/concept.md)                 | Theory subjects (OS, networks, DBMS, OOP, …)                |
| `aptitude`       | [lesson/aptitude.md](lesson/aptitude.md)               | Quantitative, logical and verbal aptitude topics            |
| `reference`      | [lesson/reference.md](lesson/reference.md)             | Commands, tools and syntax (shell commands, SQL clauses, …) |

## Companion files (optional)

| File                     | Template                                                           | Holds                                     |
|--------------------------|--------------------------------------------------------------------|-------------------------------------------|
| `examples.md`            | [companion/examples.md](companion/examples.md)                     | Fully worked examples                     |
| `interview-questions.md` | [companion/interview-questions.md](companion/interview-questions.md) | Interview questions with hidden answers |
| `practice.md`            | [companion/practice.md](companion/practice.md)                     | Self-test questions with hints/answers    |
| `revision.md`            | [companion/revision.md](companion/revision.md)                     | One-screen quick-revision sheet           |

## Metadata

- [metadata/topic.json](metadata/topic.json) — one entry for the `topics` array in `metadata/topics/<category>.json`.
- [metadata/category.json](metadata/category.json) — one entry for the `categories` array in `metadata/categories.json`.

## Placeholders

- `{{Like This}}` — replace with real text.
- `<!-- comments -->` — guidance for the author; delete before marking the topic `published`.
- Sections marked `OPTIONAL` — delete if they do not apply. Keep the exact names and order of the sections you keep, so every topic of the same type reads the same way.
