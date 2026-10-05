# StudyHub

A personal study and interview-preparation platform for aptitude, data structures, algorithms, object-oriented programming, Spring Boot, DBMS and PostgreSQL, computer science concepts, and more categories over time — built as a fully static site for GitHub Pages.

> **Project status: Phase 2E — DBMS + PostgreSQL content complete.**
> Aptitude (58 topics), Data Structures & Algorithms (113 topics), Object-Oriented Programming (75 topics), Spring Boot (91 topics) and DBMS + PostgreSQL (75 topics) are written in Markdown with metadata, each with Revision and Quick Revision material.
> CS Concepts content has not been written yet, and **the application has not been built yet** — `index.html` is still a placeholder page. Until then, the content can be read directly on GitHub.

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Repository architecture, rules, templates, schemas | Done |
| 2A | Aptitude content | Done |
| 2B | DSA content (Java) | Done |
| 2C | OOP content (Java OOP, SOLID, design patterns, design problems) | Done |
| 2D | Spring Boot content (core, REST, JPA, transactions, security, production, debugging, interview) | Done |
| 2E | DBMS + PostgreSQL content (theory, SQL, PostgreSQL features, design, transactions, indexing, optimization, problem solving, interview, debugging) | Done |
| 2 (other) | CS Concepts and later categories | Not started |
| 3 | Static web application | Not started |

## Goals

- Learn a topic from scratch, then reuse the same material for fast interview revision.
- Cover concepts, problem solving, Java implementations, interview questions and practice in one place.
- Stay simple: plain files, no backend, no build step, free hosting on GitHub Pages.

## Repository structure

```text
StudyHub/
├── index.html                  App entry point (placeholder until Phase 3) — must stay at the root
├── .nojekyll                   Tells GitHub Pages to serve files as-is
├── assets/                     App-level icons and images (later: vendored libraries)
├── content/                    Study material (Markdown)
│   ├── aptitude/
│   │   ├── quantitative-aptitude/   18 topics
│   │   ├── logical-reasoning/       20 topics
│   │   ├── verbal-ability/          20 topics
│   │   └── revision/                Revision and Quick Revision sources
│   ├── dsa/
│   │   ├── fundamentals/            12 topics (complexity, Java toolkit)
│   │   ├── data-structures/         20 topics
│   │   ├── algorithms/              51 topics
│   │   ├── patterns/                22 problem-solving patterns
│   │   ├── problem-solving/          3 topics
│   │   ├── interview/                5 interview-question topics
│   │   └── revision/                Revision and Quick Revision sources
│   ├── cs-concepts/
│   ├── oop/
│   │   ├── fundamentals/            5 topics (objects, constructors, static, memory)
│   │   ├── pillars/                 8 topics (encapsulation … interfaces)
│   │   ├── relationships/           2 topics
│   │   ├── java-oop/                7 topics (Object, equality, immutability, modern Java, binding)
│   │   ├── applied-oop/             5 topics (collections, generics, exceptions, threads, testing)
│   │   ├── design-principles/       8 topics (SOLID, coupling/cohesion, DI)
│   │   ├── object-oriented-design/  2 topics (designing classes, UML)
│   │   ├── code-quality/            3 topics (clean code, smells, anti-patterns)
│   │   ├── design-patterns/        25 topics (all 23 GoF patterns + intro + comparisons)
│   │   ├── design-problems/         5 topics (parking lot, library, vehicle rental, ATM, food ordering)
│   │   ├── interview/               5 topics (by level, output-based, scenarios, traps, why)
│   │   └── revision/                Revision and Quick Revision sources
│   ├── dbms-postgresql/
│   │   ├── dbms-fundamentals/ … partitioning/   23 subcategories, 57 topics (theory, SQL, PostgreSQL, design, transactions, indexing, optimization)
│   │   ├── sql-problem-solving/     5 topics (top-N, duplicates, time series, gaps and islands, division and hierarchies)
│   │   ├── interview/              11 topics (question banks by area, scenarios, backend, rapid-fire, traps)
│   │   ├── debugging/               2 topics (16 debugging scenarios)
│   │   └── revision/                Revision and Quick Revision sources
│   └── spring-boot/
│       ├── fundamentals/            7 topics (container, beans, lifecycle, scanning, @Configuration, scopes)
│       ├── dependency-injection/    4 topics
│       ├── spring-boot-core/        6 topics (starters, auto-configuration, startup, configuration, profiles)
│       ├── spring-mvc/              4 topics
│       ├── rest/                    7 topics
│       ├── validation/              2 topics
│       ├── exception-handling/      2 topics
│       ├── jpa-hibernate/          11 topics (entities, persistence context, relationships, fetching, N+1, locking)
│       ├── transactions/            5 topics
│       ├── security/               10 topics (filter chain, BCrypt, method security, JWT, refresh tokens, OAuth2)
│       ├── web-security/            3 topics (CORS, CSRF, cookies)
│       ├── production/              9 topics (logging, Actuator, HikariCP, caching, async, uploads, OpenAPI, Docker)
│       ├── advanced/                6 topics (AOP, proxies, events, caching, resilience, microservices)
│       ├── debugging/               5 topics (17 real-world debugging scenarios)
│       ├── interview/              10 topics (question banks, scenarios, architecture, tricky, project-based)
│       └── revision/                Revision and Quick Revision sources
├── metadata/                   Machine-readable index of the content (JSON)
│   ├── categories.json         Categories and subcategories
│   ├── topics/                 One topic catalog per category
│   └── schemas/                JSON Schemas for the files above
├── templates/                  Starting files for new topics and metadata entries
├── docs/
│   ├── content-guide.md        How content and metadata are written (authoritative)
│   ├── architecture.md         Planned design of the static app
│   └── visualizers.md          Planned interactive visualizations (candidates)
├── .claude/skills/             Claude skills: study-content, dsa, ui-ux
├── CLAUDE.md                   Project rules for Claude
└── README.md
```

Later, the application adds `styles.css`, `app.js` and (if needed) `js/` at the root.

## Content architecture

Content and application code are separate. Each topic is a folder of Markdown files:

```text
content/<category>/[<subcategory>/]<topic-slug>/
├── content.md                 the lesson (required)
├── examples.md                worked examples         (optional)
├── interview-questions.md     interview Q&A           (optional)
├── practice.md                self-test questions     (optional)
├── revision.md                quick-revision sheet    (optional)
└── images/                    diagrams for this topic (optional)
```

Each topic `type` has its own lesson template, so DSA, theory, command-reference and aptitude topics each get the sections they need:

| Type | For |
|------|-----|
| `data-structure` | Structures and their operations |
| `algorithm` | Procedures, complexity, dry runs |
| `pattern` | Problem-solving patterns: recognition clues, templates, worked examples |
| `concept` | Theory subjects (OS, networks, DBMS, …) |
| `aptitude` | Formulas, shortcuts, problem patterns |
| `reference` | Commands, tools and syntax |

Programming examples are written in **Java** (Spring Boot examples use JDK 21 and Spring Boot 4.1; DBMS examples use JDBC). SQL is written for PostgreSQL 17+ and verified against a shared sample database. Answers to questions are hidden in collapsible `<details>` blocks, so files work as self-tests on GitHub as well as in the app.

### Study modes

Aptitude, DSA, OOP, Spring Boot and DBMS + PostgreSQL each offer three ways to study:

| Mode | What it is | Source files |
|------|------------|--------------|
| **Learn** | The full topics: explanations, formulas, shortcuts, solved examples and practice | `content/aptitude/<subcategory>/<topic>/` |
| **Revision** | Comprehensive revision across all of Aptitude, on one page | `content/aptitude/revision/general-formula-sheet.md`, `general-concept-revision.md`, `important-shortcuts.md`, `common-tricks-and-patterns.md`, `common-mistakes.md` |
| **Quick Revision** | The essentials to scan in the last half hour before a test, on one page | `content/aptitude/revision/30-min-formula-sheet.md`, `30-min-concept-revision.md`, `30-min-tricks-and-traps.md` |

| DSA mode | What it is | Source files |
|----------|------------|--------------|
| **Learn** | The full topics: intuition, Java implementations, dry runs, complexity, patterns, practice and interview questions | `content/dsa/<subcategory>/<topic>/` |
| **Revision** | Core concepts, complexity tables, choosing an algorithm, pattern recognition, Java templates, common mistakes and interview traps | `content/dsa/revision/` (7 sources) |
| **Quick Revision** | Complexities, definitions, pattern clues, a Java cheat sheet and last-minute traps — about 40 minutes | `content/dsa/revision/quick-*.md` (5 sources) |

| OOP mode | What it is | Source files |
|----------|------------|--------------|
| **Learn** | The full topics: concepts, Java rules, SOLID, design patterns, design problems, interview questions and practice | `content/oop/<subcategory>/<topic>/` |
| **Revision** | Core concepts, comparison tables, Java rules, design principles, design patterns, UML and common mistakes | `content/oop/revision/` (7 sources) |
| **Quick Revision** | OOP essentials, Java syntax, SOLID and pattern clues, last-minute traps — about 30 minutes | `content/oop/revision/quick-*.md` (4 sources) |

| Spring Boot mode | What it is | Source files |
|------------------|------------|--------------|
| **Learn** | The full topics: concepts, internals, verified Java examples, common mistakes, interview traps, practice, debugging scenarios and interview question banks | `content/spring-boot/<subcategory>/<topic>/` |
| **Revision** | 5–10 points per topic, 21 comparison tables, interview traps by module and a debugging checklist | `content/spring-boot/revision/` (8 sources) |
| **Quick Revision** | One line per topic, an annotation cheat sheet and last-minute traps — about 30 minutes | `content/spring-boot/revision/quick-*.md` (7 sources) |

| DBMS + PostgreSQL mode | What it is | Source files |
|------------------------|------------|--------------|
| **Learn** | The full topics: theory, verified SQL with outputs, PostgreSQL features, practice, problem-solving patterns, interview banks and debugging scenarios | `content/dbms-postgresql/<subcategory>/<topic>/` |
| **Revision** | DBMS, SQL and PostgreSQL one-shots, nine cheat sheets and interview traps | `content/dbms-postgresql/revision/` (13 sources) |
| **Quick Revision** | Five 30-minute blocks (concepts, SQL patterns, traps and questions, PostgreSQL features, optimization and indexes) plus a last-minute SQL sheet | `content/dbms-postgresql/revision/quick-*.md`, `last-minute-sql-revision.md` (6 sources) |

The modes are declared in `metadata/categories.json` (`studyModes`); the app will combine each mode's source files into one view. Any category can add study modes the same way.

## How metadata works

The browser can't list folders on GitHub Pages, so the app discovers content through JSON:

1. `metadata/categories.json` lists categories, their subcategories, and where each category's catalog is.
2. `metadata/topics/<category>.json` lists every topic in that category: title, type, difficulty, tags, estimated time, prerequisites, related topics, which files exist, and draft/published status.

The topic `id` is permanent — it identifies the topic in URLs, progress tracking and bookmarks. Field-by-field reference: [docs/content-guide.md §6](docs/content-guide.md#6-metadata-reference).

## Adding a topic

1. Create `content/<category>/[<subcategory>/]<slug>/`.
2. Copy the lesson template for the topic's type from [templates/lesson/](templates/lesson/) to `content.md`, plus any [companion templates](templates/companion/) you want.
3. Write the content and remove the template's guidance comments.
4. Add an entry to `metadata/topics/<category>.json` using [templates/metadata/topic.json](templates/metadata/topic.json).

Adding a **category** means adding one entry to `metadata/categories.json`, one catalog file, and one `content/` folder. No application code changes are needed for either. Full steps: [docs/content-guide.md §7](docs/content-guide.md#7-adding-things).

## Development rules

- HTML, CSS and vanilla JavaScript only — no frameworks, no build step, no backend.
- Everything the site needs is committed to this repository (no CDNs); all paths are relative.
- `index.html` stays at the repository root.
- Content is Markdown, metadata is JSON; no MDX.
- Accessibility (keyboard, contrast, screen readers) and light/dark themes are requirements, not extras.

Complete rules: [CLAUDE.md](CLAUDE.md).

## Deployment (GitHub Pages)

The site is designed to deploy straight from the repository root with no build:

**Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)`.**

To preview locally (needed once the app exists, because browsers block `fetch()` on `file://`), run a static server from the repository root, e.g. `npx http-server -c-1 .` or the VS Code Live Server extension.

## Planned application

Phase 3 will build a static single-page app (see [docs/architecture.md](docs/architecture.md)) with:

dashboard · category and topic navigation · breadcrumbs · search and filters · study progress · bookmarks · practice and interview modes · quick revision · Java code blocks with copy buttons · related topics · interactive DSA visualizations where useful · light/dark mode · responsive layout · full keyboard accessibility.

Progress and bookmarks will be stored in the browser's `localStorage` — there are no accounts and no server.
