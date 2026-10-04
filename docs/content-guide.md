# Content Guide

The authoritative specification for StudyHub content: where files go, how Markdown is written, and how metadata describes it. `CLAUDE.md`, the templates and the Claude skills all defer to this document.

---

## 1. Model

```text
metadata/categories.json            ← which categories exist (and their subcategories)
metadata/topics/<category>.json     ← every topic in that category (one entry per topic)
content/<category>/[<subcategory>/]<slug>/
    content.md                      ← the lesson (required)
    examples.md                     ← optional companion files
    interview-questions.md
    practice.md
    revision.md
    images/                         ← optional, diagrams used by this topic only
content/<category>/revision/*.md    ← optional category-level study-mode sources (§1.1)
```

- **Content** (Markdown) is what a person reads. It must be useful on its own when browsed on GitHub.
- **Metadata** (JSON) is what the app reads to build navigation, search, filters, progress and related-topic links.
- The app never lists directories (GitHub Pages cannot). **A topic exists for the app only when it has a metadata entry.**

### Hierarchy

| Level       | Defined in                        | Example ids                            |
|-------------|-----------------------------------|----------------------------------------|
| Category    | `metadata/categories.json`        | `aptitude`, `dsa`, `cs-concepts`       |
| Subcategory | inside its category entry         | `data-structures`, `algorithms`        |
| Topic       | `metadata/topics/<category>.json` | `number-system`, `binary-search`       |

Subcategories are optional. If a category has none, its topics live directly at `content/<category>/<slug>/` and use `"subcategory": null`. Nesting stops at subcategory — no deeper levels — so URLs, breadcrumbs and folders stay predictable.

**Subtopics** (items the owner lists under a topic, e.g. "Number System → Remainders") are H2 sections inside that topic's `content.md`, not separate folders. See §3.

A subject becomes **several topics** only when the owner lists the parts as separate items, or when one file could not be studied in a single sitting and the parts are independently useful (DSA splits dynamic programming into a foundation topic plus `dp-1d`, `knapsack-dp`, `string-dp`, …). Each such topic still keeps its own subtopics as H2 sections.

### 1.1 Study modes (category level)

A category can offer study modes in addition to **Learn** (the topic list, always present). Each mode is declared in the category's `studyModes` in `metadata/categories.json` and combines several Markdown **source files** into **one** user-facing view:

```json
{ "id": "quick-revision", "title": "Quick Revision", "estimatedMinutes": 30,
  "sources": [ { "path": "content/aptitude/revision/30-min-formula-sheet.md", "title": "Formulas" } ] }
```

- Source files live in the category's reserved `content/<category>/revision/` folder. `revision` must never be used as a subcategory or topic id.
- The user-facing names come from metadata (`title` of the mode and of each source), never from file names. File names describe content for maintainers only.
- The app renders all sources of a mode on one page, in `sources` order, with tabs/anchors per source.
- Each source file has one H1 (its section title) and H2 groups. Sources of one mode must not repeat each other; each has a distinct job (e.g. formulas vs. concepts vs. mistakes).
- Revision sources synthesise knowledge across topics — they are not concatenations of topic files.

---

## 2. Naming

- All ids, slugs, folder names and tags are **kebab-case**: lowercase letters, digits and single hyphens (`binary-search`, `time-and-work`).
- File names inside a topic folder are fixed: exactly the five names above. No other `.md` files.
- Image files: kebab-case, descriptive (`insert-at-head.svg`, not `img1.png`).
- Topic slugs must be unique across the whole site, not just within a category. Prefer specific names (`os-introduction`) over generic ones (`introduction`).

---

## 3. Topic files

| File                     | Required | Purpose                                                                   |
|--------------------------|----------|---------------------------------------------------------------------------|
| `content.md`             | yes      | The lesson. Built from the template matching the topic's `type`.          |
| `examples.md`            | no       | Fully worked examples (`E1`, `E2`, …). Essential for aptitude.            |
| `interview-questions.md` | no       | Interview questions (`Q1`, `Q2`, …) with answers hidden in `<details>`.   |
| `practice.md`            | no       | Self-test questions (`P1`, `P2`, …) with hidden hints/answers.            |
| `revision.md`            | no       | One-screen quick-revision sheet. Must stand alone.                        |

Every file that exists must be listed in the topic's `files` array, and every name in `files` must exist.

### Choosing sections

Templates contain the full menu of sections for each topic type. Not every topic needs every section:

- Keep sections that teach something for *this* topic; delete the rest (especially those marked `OPTIONAL`).
- Do not rename kept sections or change their order — consistency is what makes revision fast and lets the app recognise sections.
- An extra section is allowed when the subject genuinely needs it; give it a clear H2 name and place it where it reads naturally.
- **Topics with subtopics:** one H2 per subtopic, named exactly as the owner named it, in the owner's order, between the opening section(s) and the closing sections (Common Mistakes / Key Takeaways). The aptitude template describes this.
- Category-level study modes (§1.1) can replace per-topic `revision.md`; don't write both for the same category.
- **Pattern topics** (`type: "pattern"`) teach how to *recognise* and apply a problem-solving technique. They link to the algorithm or data-structure topic for the mechanics instead of re-teaching them, and their example and practice problems must not repeat problems used elsewhere.
- **Advanced topics** — beyond the core interview syllabus — open with a callout, directly under the H1:
  `> [!NOTE]` / `> **Advanced topic.** …` stating why it is advanced and what to learn first. The metadata `difficulty` (`advanced`) is a separate, finer signal: a core topic can be hard without being optional.
- **Design-pattern topics** (OOP, `type: "concept"`) use this fixed section order instead of the concept template's: `Intent` · `The Problem` · `Why the Naive Solution Fails` · `The Pattern Idea` · `Structure` · `Java Implementation` · `Execution Flow` · `Real-World Examples` · `When to Use` · `When Not to Use` · `Advantages` · `Disadvantages` · `Related Patterns` · `SOLID Connection` · `Common Mistakes` · `Key Takeaways`. A line directly under the H1 states the GoF category and interview priority: `**Category:** Creational · **Interview priority:** Core` (or `Frequently useful`, `Advanced / awareness`).
- **Design-problem topics** (OOP) use: `Requirements` · `Entities and Responsibilities` · `Relationships` · `Class Diagram` · `Design Decisions` · `Java Implementation` · `Extension Scenarios` (each as an H3 with the approach in `<details>`) · `Interview Discussion` · `Key Takeaways`. They have only `content.md`.

---

## 4. Markdown conventions

The app renders standard Markdown plus the small set of extensions below. Anything outside this list may not render in the app.

### Structure

- Exactly one `#` H1 per file — the title. Companion files use `# {Title} — {File purpose}`.
- `##` H2 for sections (these become the in-page table of contents), `###` H3 for subsections. Avoid H4+.
- Never skip heading levels — except numbered items (`### Q1.`, `### P1.`, `### E1.`), which are **always H3** so the app can find them at one level, whether or not they are grouped under H2 sections.

### Code

- Every fenced code block declares a language: `java`, `text` (dry runs, output, ASCII diagrams, formulas), `pseudocode`, `bash`, `sql`, `json`.
- Programming examples are **Java** (Java 17, standard library only) unless the owner explicitly asks for another language. See `.claude/skills/dsa/SKILL.md`.
- Code must be correct and, for full programs, compile as-is.
- A **full program** (a `public class` with `main`) is followed by `**Output:**` and a `text` code block containing exactly what it prints. Snippets (methods or statements) have no output block but must compile inside a class.
- Don't rely on evaluation details that differ between Java versions (for example, concatenating an object and mutating it in the same expression).

### Callouts

Use GitHub alert syntax. It renders on GitHub, and the app will style it.

```text
> [!NOTE]       background or clarification
> [!TIP]        shortcut, trick, or interview tip
> [!IMPORTANT]  must-know point
> [!WARNING]    common mistake or trap
> [!CAUTION]    destructive or dangerous action
```

Use sparingly — at most a few per file.

### Hidden answers

Answers, hints and solutions go in `<details>` with a `<summary>`. Leave a blank line after `<summary>` and before `</details>` so the Markdown inside renders.

```html
<details>
<summary>Answer</summary>

Markdown content here.

</details>
```

This is the **only** raw HTML allowed in content.

### Questions and examples

- Each question/example is an `###` H3 starting with its stable id: `### Q3. …`, `### P7. …`, `### E2. …`.
- Ids are numbered per file and **append-only**. Never renumber or reuse a number, even after deleting a question — future progress tracking may store these ids.
- Put `**Difficulty:** Easy | Medium | Hard` on the line after the heading of practice questions and examples, and order items from easy to hard. DSA practice adds the technique: `**Difficulty:** Medium · **Pattern:** Sliding window`. OOP practice adds the question kind: `**Difficulty:** Medium · **Type:** Output-based` (MCQ, Conceptual, Output-based, Code analysis, Coding, Scenario, Design).
- **Interview-preparation topics** may add a `**Style:**` line under each question naming the kind of interview it suits (e.g. `Placement-style · Java interview`). These labels describe question styles only; never claim that a specific company asks a question.
- **Interview questions** are grouped under H2 headings. Use the template's `## Conceptual` / `## Applied` / `## Coding`, or — for topics organised by level, such as DSA's interview-preparation topics — `## Beginner` / `## Intermediate` / `## Advanced`. The H2 carries the level, so `Q` items need no Difficulty line.
- Multiple-choice answers name the letter and the option text: `**Answer:** B) O(log n)`.
- **Set-based questions** (several questions sharing one data table, passage, arrangement or puzzle — e.g. data interpretation, reading comprehension, seating, puzzles) are grouped under H2 headings such as `## Set 1: Table`, with the shared material directly below. Numbering stays continuous across sets; easy→hard ordering applies within each set.
- **Standard answer keys:** formats with a fixed five-choice key (syllogisms, statement–conclusion/assumption, cause and effect, data sufficiency) use options A–E and state the key once at the top of the file.

### Formulas

Plain text and Unicode, not LaTeX (LaTeX would need a heavy renderer in the app): `SI = (P × R × T) / 100`, `a² + b²`, `√n`, `≤`, `≠`. Put formula lists in a ` ```text ` block or a table.

### Diagrams and images

- Prefer SVG; PNG for screenshots. Store in the topic's own `images/` folder and reference relatively: `![Nodes linked by next pointers](images/singly-linked.svg)`.
- Every image has meaningful alt text describing what it shows.
- Simple diagrams may be ASCII in a ` ```text ` block.
- No Mermaid and no external image URLs (everything must be in the repository).
- Shared, non-topic images (logos, UI art) belong in `assets/images/`, not in content.

### Links

- Link to another topic with a relative path to its `content.md`, e.g. `[Other Topic](../other-topic/content.md)`. This works on GitHub; the app will turn it into an in-app link.
- External links are fine for further reading; never required for understanding.

### Tables

Use tables for comparisons, complexity summaries, options and formulas. Keep them narrow enough to read on a phone (≤ 5 columns where possible).

---

## 5. Writing quality

- **Accurate first.** Never state a complexity, formula or behaviour you are not sure of. Verify code.
- **Beginner-to-interview.** Open each section simply, then build to interview depth. A first-time learner and someone revising the night before should both be served.
- **Concrete.** Every abstract idea gets an example, diagram or dry run.
- **Concise.** Short paragraphs, active voice, no filler, no motivational fluff.
- **Original.** Write explanations in your own words; do not paste copyrighted material.
- **No invented curriculum.** Only create topics the owner has asked for.

---

## 6. Metadata reference

Schemas: [`metadata/schemas/categories.schema.json`](../metadata/schemas/categories.schema.json) and [`metadata/schemas/topics.schema.json`](../metadata/schemas/topics.schema.json). Each JSON file has a `$schema` key, so VS Code validates it while you edit.

### Category entry (`metadata/categories.json`)

| Field           | Type           | Notes                                                    |
|-----------------|----------------|----------------------------------------------------------|
| `id`            | kebab-case     | Also the folder name under `content/`. Permanent.        |
| `title`         | string         | Display name.                                            |
| `description`   | string         | One sentence for the dashboard card.                     |
| `order`         | integer ≥ 1    | Dashboard order.                                         |
| `icon`          | path \| null   | Icon under `assets/icons/`, or null for the default.     |
| `catalog`       | path           | `metadata/topics/<id>.json`.                             |
| `subcategories` | array          | `{ id, title, description?, order }`. May be empty.      |
| `studyModes`    | array (opt.)   | `{ id, title, description, estimatedMinutes?, sources[{ path, title }] }` — see §1.1. |

### Topic entry (`metadata/topics/<category>.json` → `topics[]`)

| Field              | Required | Type                     | Used for                                                     |
|--------------------|----------|--------------------------|--------------------------------------------------------------|
| `id`               | yes      | kebab-case               | URLs, progress, bookmarks. **Permanent** — never change it.  |
| `slug`             | yes      | kebab-case               | Folder name. Normally equal to `id`.                         |
| `title`            | yes      | string                   | Display, search.                                             |
| `category`         | yes      | category id              | Navigation, breadcrumbs, folder path.                        |
| `subcategory`      | no       | subcategory id \| null   | Navigation, breadcrumbs, folder path.                        |
| `type`             | yes      | enum                     | `data-structure`, `algorithm`, `pattern`, `concept`, `aptitude`, `reference`. |
| `description`      | yes      | ≤ 200 chars              | Cards, search results.                                       |
| `difficulty`       | yes      | enum                     | `beginner`, `intermediate`, `advanced`. Filtering.           |
| `tags`             | no       | kebab-case[]             | Search, filtering.                                           |
| `estimatedMinutes` | no       | integer                  | Study planning, dashboard totals.                            |
| `order`            | no       | integer                  | Suggested learning order within its group.                   |
| `prerequisites`    | no       | topic id[]               | "Study first" links.                                         |
| `relatedTopics`    | no       | topic id[]               | "Related topics" links.                                      |
| `files`            | yes      | file name[]              | Which tabs/files the app loads. Must include `content.md`.   |
| `visualizer`       | no       | string \| null           | Interactive-visualization candidate: a visualizer id registered in [visualizers.md](visualizers.md). Shown once implemented. |
| `status`           | yes      | `draft` \| `published`   | Drafts are hidden in the app.                                |
| `updated`          | no       | `YYYY-MM-DD`             | "Last updated", revision freshness.                          |

**Derived, not stored:** the folder path is always `content/<category>/[<subcategory>/]<slug>/`. Store it nowhere else.

### Consistency rules

1. Every topic's `category` equals the catalog file's `category`, and `subcategory` (if set) is declared under that category.
2. `id`s are unique across **all** catalogs.
3. Every id in `prerequisites` / `relatedTopics` exists in some catalog (drafts allowed).
4. `files` matches the files actually present in the topic folder.
5. The folder at the derived path exists.
6. Every `studyModes[].sources[].path` exists, and every file in a `revision/` folder is listed in some mode.
7. Every non-null `visualizer` id is listed in [visualizers.md](visualizers.md).

---

## 7. Adding things

### A new topic

1. Pick the `type` and create `content/<category>/[<subcategory>/]<slug>/`.
2. Copy the lesson template for that type to `content.md`; copy any companion templates you need.
3. Write the content following this guide. Remove guidance comments and unused sections.
4. Add an entry (from `templates/metadata/topic.json`) to `metadata/topics/<category>.json`. Start with `"status": "draft"`.
5. Check the consistency rules above, then set `"status": "published"`.
6. Remove the `.gitkeep` from the parent folder once it has real content.

### A new subcategory

1. Add `{ id, title, description, order }` to the category's `subcategories` in `metadata/categories.json`.
2. Create `content/<category>/<subcategory>/`.

### A new category

1. Add an entry (from `templates/metadata/category.json`) to `metadata/categories.json`.
2. Create `metadata/topics/<id>.json` with `"$schema": "../schemas/topics.schema.json"`, `"schemaVersion": 1`, `"category": "<id>"`, `"topics": []`.
3. Create `content/<id>/`.

No application code changes are needed for any of these.

---

## 8. Changing existing content

- **Never change a topic `id`.** Rename the folder by changing `slug` (and moving the folder); the `id` stays.
- Moving a topic to another category/subcategory: move the folder, move the metadata entry to the new catalog, update `category`/`subcategory`. Keep the `id`.
- Never renumber `Q`/`P`/`E` ids.
- Fix relative links in other topics when a folder moves (search the repo for the old path).
- Update `updated` on meaningful content changes (not typo fixes).
- Schema changes are additive where possible (new optional fields). A breaking change bumps `schemaVersion` and must update every metadata file and the app in the same commit.
