# StudyHub

A personal study and interview-preparation platform for aptitude, data structures, algorithms, object-oriented programming, Spring Boot, DBMS and PostgreSQL, Linux, computer networks, system design, operating systems, computer science concepts, and more categories over time — built as a fully static site for GitHub Pages.

> **Project status: Phase 3 — the interactive application is built.**
> Aptitude (58 topics), Data Structures & Algorithms (113 topics), Object-Oriented Programming (75 topics), Spring Boot (91 topics), DBMS + PostgreSQL (75 topics), Linux (59 topics), Computer Networks (88 topics), System Design (82 topics) and Operating Systems (38 topics) are written in Markdown with metadata, each with Revision and Quick Revision material.
> The static app (`index.html`) adds navigation, search, progress tracking, practice and interview sessions, flashcards and interactive visualizers around that content. CS Concepts currently holds a short Excel Fundamentals module.

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Repository architecture, rules, templates, schemas | Done |
| 2A | Aptitude content | Done |
| 2B | DSA content (Java) | Done |
| 2C | OOP content (Java OOP, SOLID, design patterns, design problems) | Done |
| 2D | Spring Boot content (core, REST, JPA, transactions, security, production, debugging, interview) | Done |
| 2E | DBMS + PostgreSQL content (theory, SQL, PostgreSQL features, design, transactions, indexing, optimization, problem solving, interview, debugging) | Done |
| 2 (other) | CS Concepts: Excel Fundamentals emergency module (18 topics) | Done |
| 2 (other) | Further CS Concepts and later categories | Not started |
| 3 | Static web application: content, engagement and study engines | Done |
| 2F | Linux content (commands, text processing, permissions, processes, Bash scripting, networking, storage, services, SSH, troubleshooting, interview) | Done |
| 2G | Computer Networks content (fundamentals, devices, OSI and TCP/IP, Ethernet and ARP, IP and subnetting, routing, TCP/UDP, HTTP/HTTPS, DNS, DHCP, NAT, security, performance, troubleshooting, end-to-end flows, interview) | Done |
| 2H | System Design content (foundations, communication and APIs, data and storage, caching, scaling and distribution, consistency and coordination, reliability, messaging, observability, case studies, interview) | Done |
| 2I | Operating Systems content (fundamentals, processes and threads, CPU scheduling, synchronization, deadlocks, memory management, storage and I/O) | Done |
| 2J | Interview preparation and study plans: 13 built-in plans (35 difficulty variants) and a custom plan builder | Done |

## Goals

- Learn a topic from scratch, then reuse the same material for fast interview revision.
- Cover concepts, problem solving, Java implementations, interview questions and practice in one place.
- Stay simple: plain files, no backend, no build step, free hosting on GitHub Pages.

## Repository structure

```text
StudyHub/
├── index.html                  App shell — must stay at the root
├── styles.css · app.js         Styles (design tokens, six themes) and entry module
├── js/                         Content, engagement and study engines, views, visualizers, simulators
├── .nojekyll                   Tells GitHub Pages to serve files as-is
├── assets/                     Icons and vendored libraries (marked, three.js)
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
│   │   ├── excel/                   18 Excel Fundamentals topics
│   │   └── revision/                Excel revision sources
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
│   ├── linux/
│   │   ├── linux-fundamentals/ … remote-access/   16 subcategories, 49 topics (commands, text processing, permissions, processes, Bash, networking, storage, services, SSH)
│   │   ├── troubleshooting/         3 topics (16 step-by-step scenarios)
│   │   ├── interview/               7 topics (question banks by area, scenarios, traps)
│   │   └── revision/                Revision and Quick Revision sources
│   ├── operating-systems/
│   │   ├── os-fundamentals/ … storage-and-io/   7 subcategories, 38 topics (processes, scheduling, synchronization, deadlocks, memory, I/O)
│   │   └── revision/                Revision, Quick Revision and the 15-minute emergency sheet
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
│   ├── interactions/           Interaction registry per category (quizzes, visualizers, simulators)
│   └── schemas/                JSON Schemas for the files above
├── templates/                  Starting files for new topics and metadata entries
├── docs/
│   ├── content-guide.md        How content and metadata are written (authoritative)
│   ├── architecture.md         How the app works (authoritative)
│   ├── extending.md            Adding subjects, topics, interactions, visualizers, simulators
│   └── visualizers.md          Visualizer ids: implemented and candidates
├── .claude/skills/             Claude skills: study-content, dsa, ui-ux
├── CLAUDE.md                   Project rules for Claude
└── README.md
```


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

Programming examples are written in **Java** (Spring Boot examples use JDK 21 and Spring Boot 4.1; DBMS examples use JDBC). SQL is written for PostgreSQL 17+ and verified against a shared sample database. Linux commands and Bash scripts are verified in a throwaway practice lab on Ubuntu with GNU tools; machine-dependent output is marked as such. Computer Networks command output was captured on real Windows and Ubuntu machines (with addresses replaced by documentation ranges), and its Java programs and subnetting answers are verified by running them. System Design's Java programs are run and their output checked, and its estimates and availability numbers are recalculated. Operating Systems' Java programs are run and their output checked, and every scheduling, page-replacement, Banker's-algorithm and address-translation answer is recomputed with the same code the OS simulators use. Answers to questions are hidden in collapsible `<details>` blocks, so files work as self-tests on GitHub as well as in the app.

### Study modes

Aptitude, DSA, OOP, Spring Boot, DBMS + PostgreSQL, Linux, Computer Networks, System Design and Operating Systems each offer at least three ways to study:

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

| Linux mode | What it is | Source files |
|------------|------------|--------------|
| **Learn** | The full topics: commands with verified output, troubleshooting workflows, practice, interview banks and traps, built around a safe practice lab | `content/linux/<subcategory>/<topic>/` |
| **Revision** | Cheat sheets for commands, filesystem, permissions, processes, networking and Bash, a grep/find/sed/awk reference, command differences and interview traps | `content/linux/revision/` (9 sources) |
| **Quick Revision** | Three 10-minute blocks for the last 30 minutes before an interview: essential commands, concepts and permissions, processes/networking/troubleshooting | `content/linux/revision/quick-*.md` (3 sources) |

| Computer Networks mode | What it is | Source files |
|------------------------|------------|--------------|
| **Learn** | 88 topics in 22 modules, from "what is a network" to the full URL journey and backend request flows, with 15 interactive simulations and visualizers | `content/computer-networks/<subcategory>/<topic>/` |
| **Revision** | Complete revision, interview cheat sheet, comparisons, traps, layers/protocols/ports, subnetting formulas, request flows and troubleshooting | `content/computer-networks/revision/` (7 sources) |
| **Quick Revision** | One hour: a 30-minute essentials block, 20 minutes of drills and a 10-minute final sheet (each usable alone) | `content/computer-networks/revision/quick-*.md` (3 sources) |

| System Design mode | What it is | Source files |
|--------------------|------------|--------------|
| **Learn** | 82 topics in 11 modules, from requirements and estimation to caching, replication, sharding, consistency, reliability, messaging and four case studies, with 23 interactive simulations and visualizers (including an interview simulator) | `content/system-design/<subcategory>/<topic>/` |
| **Revision** | Complete revision of every module, decision cheat sheets, important comparisons, key numbers and rules, and traps and confusions | `content/system-design/revision/` (5 sources) |
| **Quick Revision** | Six 10-minute blocks (foundations, communication, data and caching, scaling and consistency, reliability and operations, case studies and the interview) — one hour in all, each usable alone | `content/system-design/revision/quick-*.md` (6 sources) |

| Operating Systems mode | What it is | Source files |
|------------------------|------------|--------------|
| **Learn** | 38 topics in 7 modules, from what an OS is to scheduling calculations, synchronization, deadlocks and the Banker's algorithm, paging, page replacement, file systems and I/O, with 5 simulators and visualizers, 2 checks and a flashcard deck | `content/operating-systems/<subcategory>/<topic>/` |
| **Revision** | Complete OS revision, important comparisons, interview traps and confusions, and key formulas and algorithms | `content/operating-systems/revision/` (4 sources) |
| **Quick Revision** | Five 10-minute blocks (fundamentals, processes and scheduling, synchronization and deadlocks, memory, final interview revision) — 50 minutes in all, each usable alone | `content/operating-systems/revision/quick-*.md` (5 sources) |
| **OS Emergency 15-Minute Revision** | The highest-value facts and differences on one page, for the last 15 minutes | `content/operating-systems/revision/emergency-15-minute-sheet.md` |

The modes are declared in `metadata/categories.json` (`studyModes`); the app combines each mode's source files into one view. Any category can add study modes the same way.

## How metadata works

The browser can't list folders on GitHub Pages, so the app discovers content through JSON:

1. `metadata/categories.json` lists categories (with their sidebar group and icon), their subcategories, and where each category's catalog is.
2. `metadata/topics/<category>.json` lists every topic in that category: title, type, difficulty, tags, estimated time, prerequisites, related topics, which files exist, and draft/published status.
3. `metadata/interactions/<category>.json` (optional) registers interactive exercises — knowledge checks, flashcards, comparisons, visualizers and simulators — and the lesson section each appears after. Lessons themselves stay plain Markdown.
4. `metadata/updates.json` is the What's new changelog shown from the header menu; each content phase adds an entry.

The topic `id` is permanent — it identifies the topic in URLs, progress tracking and bookmarks. Field-by-field reference: [docs/content-guide.md §6](docs/content-guide.md#6-metadata-reference).

## Adding a topic

1. Create `content/<category>/[<subcategory>/]<slug>/`.
2. Copy the lesson template for the topic's type from [templates/lesson/](templates/lesson/) to `content.md`, plus any [companion templates](templates/companion/) you want.
3. Write the content and remove the template's guidance comments.
4. Add an entry to `metadata/topics/<category>.json` using [templates/metadata/topic.json](templates/metadata/topic.json).

Adding a **category** means adding one entry to `metadata/categories.json`, one catalog file, and one `content/` folder. No application code changes are needed for either. Full steps: [docs/content-guide.md §7](docs/content-guide.md#7-adding-things).

Adding an **interaction**, **visualizer** or **simulator**: [docs/extending.md](docs/extending.md).

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

## Local development

Browsers block `fetch()` on `file://`, so open the app through any static server from the repository root:

```bash
npx http-server -c-1 .      # or: python -m http.server 8000, or VS Code Live Server
```

There is nothing to install or build. Node or Python is only used for the local server.

## The application

A static single-page app built from three layers (details: [docs/architecture.md](docs/architecture.md)):

| Layer | What it does |
|-------|--------------|
| **Content engine** | Loads metadata, renders Markdown (callouts, highlighted Java/SQL with copy buttons, tables, answers in `<details>`), turns links between topics into in-app links, builds the search index |
| **Engagement engine** | Places registered interactions inside lessons — knowledge checks, predict-the-output, flashcards, interactive comparisons, step-by-step visualizers and simulations — and turns every `practice.md` / `interview-questions.md` into one-question-at-a-time sessions with auto-checked multiple choice, hints, reveal and self-rating |
| **Study engine** | Progress (not started / in progress / completed, reading position), bookmarks, recently studied, question results, continue learning, study plans, personal notes per topic — all in `localStorage` |

Views: dashboard (progress, continue learning, subjects, recent, bookmarks, quick revision, 3D knowledge map on wide screens) · subject (modules, Learn · Revision · Quick Revision, practice/interview by module) · module · topic (Lesson · Examples · Interview · Practice · Revision · Flashcards tabs, table of contents, previous/next) · study modes · focused sessions · search · bookmarks · history · interactive lab (every interaction in one place) · study plans (built-in plans at Beginner, Intermediate and Advanced level, a custom plan builder over any subjects, modules and topics, and a day-by-day plan page with today's activities, milestones and catch-up) · my notes (plain-text notes taken on any topic, with search, subject/module/topic/date filters and a link back to the topic).

Keyboard: `/` search · `Ctrl`/`⌘`+`K` quick actions · `←`/`→` previous/next topic (or question in a session) · `?` shortcuts · `Esc` close. The ⋮ header menu holds bookmarks, recently studied, shortcuts, the theme (Light, Dark, Ocean, Purple, Amber, Forest, or match the system) and What's new.

There are no accounts and no server: progress lives in this browser only. To move it to another browser or device, use **⋮ → Progress Import / Export**: Export copies a versioned backup text to the clipboard, Import restores it from a paste. The backup is processed locally and never uploaded.

## Copyright & Usage

StudyHub is a personal project that has been developed with significant time and effort, including its learning content, curriculum organization, interactive experiences, visualizations, and application design.

The repository is publicly available so that the project can be viewed and its development can be followed. However, the project is not released under an open-source license.

You're very welcome to explore and use the deployed StudyHub website for personal educational purposes. We kindly ask that you do not copy, republish, redistribute, modify, or create a competing or derivative version of the project's original content or implementation without prior permission.

If you are interested in reusing any substantial portion of StudyHub, please contact the project owner, [Manoharan M](https://github.com/manoharan12105-beep), to discuss permission.

Thank you for respecting the time, effort, and work that went into building StudyHub.

For the complete terms, please see the [`LICENSE`](LICENSE) file.
