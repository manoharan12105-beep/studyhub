# CLAUDE.md

Instructions for Claude when working in this repository. This file holds the rules; details live in:

- [docs/content-guide.md](docs/content-guide.md) — content structure, Markdown conventions, metadata fields, adding/changing topics. **Authoritative for content.**
- [docs/architecture.md](docs/architecture.md) — how the static application works. **Authoritative for the app.**
- [docs/extending.md](docs/extending.md) — adding subjects, topics, interactions, visualizers and simulators (the contract for future content phases).
- [templates/](templates/) — starting files for topics and metadata entries.
- [.claude/skills/](.claude/skills/) — task-specific guidance (see "Skills" below).

If this file and a doc disagree, fix the disagreement rather than picking one silently.

## Project

StudyHub is a personal study and interview-preparation platform (aptitude, data structures, algorithms, object-oriented programming, CS concepts, and categories the owner adds later). The same material must teach a beginner and serve as fast interview revision.

**Current phase: Phase 3 application built**, plus the UI/UX phase (header menu, six themes, What's new, grouped sidebar, the optional StudyHub Buddy companion; see architecture §9) (content Phases 2A Aptitude, 2B DSA, 2C OOP, 2D Spring Boot, 2E DBMS + PostgreSQL, 2F Linux, 2G Computer Networks, 2H System Design, 2I Operating Systems done; CS Concepts holds the Excel Fundamentals emergency module), and Phase 2J Interview Preparation & Study Plans (built-in plans in `metadata/study-plans.json`, custom plan builder; architecture §7), and Phase 2K DevOps & Deployment (Docker → Compose → Linux VPS → Nginx → HTTPS → GitHub Actions CI/CD around a Spring Boot + PostgreSQL capstone, 18 labs, deployment checklist), and Phase 2L Claude Code Mastery (modes, context, CLAUDE.md, permissions, hooks, MCP, skills, subagents and agent teams, Git and CI/CD workflows, debugging, advanced workflows; 16 labs and a capstone around the `orderdesk` Spring Boot sample), and Phase 2M Git & GitHub Mastery (version control fundamentals through Git internals: the three areas, history, branching, merging, rebasing, recovery, remotes, GitHub collaboration and security, pull requests, team workflows, tags and releases, bisect, hooks, worktrees and submodules, a troubleshooting playbook and a Java project workflow; 12 labs and a mastery assessment around the `gradebook` Maven sample). No further content phase is planned yet. Do not write further study content unless the owner asks for that phase.

## Hard rules

1. **Static GitHub Pages site.** HTML, CSS and vanilla JavaScript only. No backend, server, database, API, SSR, auth, or Node/Java runtime.
2. **`index.html` stays at the repository root.** Never move the app into a subfolder (`frontend/`, `app/`, `src/`, `docs/`).
3. **No frameworks or build step** (no React/Vue/Angular/Next/Tailwind/bundlers/TypeScript) unless the owner explicitly requests one.
4. **Everything self-hosted.** No CDNs or external runtime requests; vendor libraries into `assets/vendor/`.
5. **Relative paths only** (`metadata/categories.json`, never `/metadata/...`) — the site is served under `/<repo>/`.
6. **Content and code are separate.** Content is Markdown in `content/`, metadata is JSON in `metadata/`, code is in the root app files, `js/` and `assets/`. Adding a topic or category must never require app code changes.
7. **Java for programming examples** (Java 17, standard library only). Exception: the `spring-boot` category uses JDK 21 with Spring Boot 4.1 libraries (see content-guide §4). The `dbms-postgresql` category writes SQL for PostgreSQL 17+, and its Java examples use JDBC (`java.sql`) with the PostgreSQL JDBC driver at runtime. The `linux` category teaches shell commands and Bash scripts, and `computer-networks` uses diagnostic commands, raw HTTP and Java 17 networking programs, the `devops` category uses Dockerfiles, Docker Compose YAML, Nginx configuration, GitHub Actions YAML and Bash around a JDK 21 / Spring Boot 4.1 sample application (Kubernetes, Terraform and similar tools appear only as "what comes next"), the `claude-code-mastery` category teaches Claude Code configuration and workflows (JSON settings, Markdown CLAUDE.md/skills/agents, Bash + jq hooks, GitHub Actions YAML, CLI commands) around a JDK 21 / Spring Boot 4.1 sample project, the `git-github` category teaches Git commands (Bash in Git Bash or a Unix shell), `.gitignore`/`.gitattributes`, Git hook scripts and short Java 17 / Maven examples around the `gradebook` sample project, and the Excel module in `cs-concepts` uses Excel formulas (content-guide §4). No other languages unless the owner explicitly asks. The app's own code is JavaScript — this rule is about educational content.
8. **Never invent curriculum.** Create only the categories, subcategories and topics the owner provides. Do not pad with extra topics or "suggested" folders.
9. **Markdown + JSON only** for content and metadata. No MDX.

## Repository layout

```text
index.html, styles.css, app.js        application shell, styles, entry module
js/                                   engines (content-loader, markdown-renderer, search, storage,
                                      progress, bookmarks, history, activity, notes, study-engine),
                                      engagement/, visualizers/, simulators/, three/, buddy/, views/
assets/                               icons (subjects/<id>.svg), images, vendored libraries (assets/vendor/)
content/<category>/[<sub>/]<slug>/    topic Markdown (+ images/)
content/<category>/revision/          sources for category study modes (reserved name)
metadata/categories.json              groups, category + subcategory registry, study modes
metadata/updates.json                 What's new changelog (newest first)
metadata/buddy-facts.json             reviewed facts StudyHub Buddy may show
metadata/study-plans.json             built-in study plans (stage templates + difficulty variants; ids only)
metadata/topics/<category>.json       topic catalog per category
metadata/interactions/<category>.json interaction registry per category (optional)
metadata/schemas/                     JSON Schemas for categories, topic catalogs, interactions, updates, study plans, Buddy facts
templates/                            lesson, companion and metadata templates
docs/                                 content guide, architecture, visualizer registry
.claude/skills/                       Claude skills for this project
.nojekyll                             serve files as-is on GitHub Pages
```

## Naming

- ids, slugs, folders, tags, image files: **kebab-case** (`binary-search`).
- Topic folders contain only: `content.md`, `examples.md`, `interview-questions.md`, `practice.md`, `revision.md`, `images/`.
- Topic `id`s are unique across the whole site.
- JS: `camelCase` variables/functions, `PascalCase` classes, `UPPER_SNAKE` constants. CSS: kebab-case classes, custom properties for all design tokens.

## Content rules

Follow [docs/content-guide.md](docs/content-guide.md). In short:

- Start from the template for the topic's `type` (`data-structure`, `algorithm`, `pattern`, `concept`, `aptitude`, `reference`). Keep only sections that teach something for this topic; keep the names and order of the ones you keep.
- One H1 per file; H2 sections; H3 subsections. Every code fence has a language.
- Callouts via `> [!NOTE|TIP|IMPORTANT|WARNING|CAUTION]`. Answers in `<details>` — the only raw HTML allowed.
- Questions/examples are numbered `Q1`/`P1`/`E1`, append-only, never renumbered.
- Formulas in plain text/Unicode (no LaTeX). Diagrams as SVG in the topic's `images/` or ASCII in ```` ```text ````. No Mermaid, no external images.
- Accuracy over volume: verify every complexity, formula and code sample. No filler.
- A topic is visible to the app only when it has a metadata entry; `files` must match the folder exactly.
- A new category gets a `group` and an icon at `assets/icons/subjects/<id>.svg`. Every content phase (and any user-visible app change) adds an entry at the top of `metadata/updates.json` with counts taken from the metadata — never estimates; update ids are permanent.
- Subtopics are H2 sections of their topic, not separate folders.
- Category study modes (e.g. the **Learn · Revision · Quick Revision** modes of Aptitude, DSA, OOP, Spring Boot, DBMS + PostgreSQL, Linux, Computer Networks, System Design, Operating Systems (which adds a 15-minute emergency sheet), DevOps & Deployment and Git & GitHub Mastery (which add Cheat Sheets)) are declared in `categories.json` `studyModes`; each mode merges several source files from `content/<category>/revision/` into one view. User-facing names come from metadata, never file names.

## Changing existing content (backwards compatibility)

- Never change a topic `id` (it keys URLs, progress and bookmarks). Folders can move; ids cannot.
- Never renumber question/example ids.
- Schema changes are additive (new optional fields). Breaking changes bump `schemaVersion` and update all metadata and the app in one commit.
- localStorage keys are versioned (`studyhub:v1:*`); migrate old data rather than discarding it. Learner state that should survive a device change must be added to the progress-backup allowlist and validator in `js/backup.js` (architecture §7).
- Edit existing content in place; don't rewrite a whole file to change one section. Preserve the owner's own wording unless asked to rewrite it.

## Interactions

- **Content ≠ interaction.** Never put quizzes, widgets or app markup into lesson Markdown. Interactions live in `metadata/interactions/<category>.json` and reference topics by id, with `after` = an H2 of the lesson.
- Data-driven types (`knowledge-check`, `flashcards`, `comparison`) need no code. `visualizer` / `simulator` modules go in `js/visualizers/` / `js/simulators/`, export `mount(root, { interaction, options, topic })`, and use `js/engagement/stepper.js`.
- Interaction answers, explanations and simulated behaviour are content: verify them (run the Java/SQL) like any lesson.
- Add interactions only where they improve understanding, recall or experimentation — not on every topic.
- Practice/interview sessions and flashcards are derived from existing files by `js/engagement/question-parser.js`; keep the `### P1.` / `- A)` / `<details>` / `**Answer:** C)` conventions so they keep parsing.

## Application principles

- Follow [docs/architecture.md](docs/architecture.md): hash routing, metadata-driven navigation, lazy-loaded Markdown, native ES modules. Adding subjects, topics or interactions must not require core app changes ([docs/extending.md](docs/extending.md)).
- Small, readable modules a student can follow. Plain functions over clever abstractions. Comments explain *why*.
- When `styles.css` or `app.js` changes, update the `?v=<date>` on their links in `index.html` (cache busting — architecture §10).
- No inline event handlers in HTML; no `innerHTML` with unsanitised input.
- Handle failures visibly: a missing file shows a helpful message, never a blank page.
- UI/UX and accessibility: see [.claude/skills/ui-ux/SKILL.md](.claude/skills/ui-ux/SKILL.md). Non-negotiables: WCAG 2.2 AA contrast, full keyboard access, visible focus, semantic HTML, `prefers-reduced-motion` respected, works at 320px width, every theme (Light, Dark, Ocean, Purple, Amber, Forest — token blocks in `styles.css`; components use tokens only, never raw colours).
- Design goal: **beautiful + useful + easy to study.** Readability and hierarchy over decoration — no heavy gradients, glassmorphism or gratuitous animation.

## Skills

| Skill | Use when |
|-------|----------|
| [study-content](.claude/skills/study-content/SKILL.md) | Creating, editing or reviewing any topic content or metadata entry. |
| [dsa](.claude/skills/dsa/SKILL.md) | Any data-structure or algorithm topic, Java implementation, complexity, dry run or DSA visualizer. Used together with study-content. |
| [ui-ux](.claude/skills/ui-ux/SKILL.md) | Designing or building any part of the application interface. |

## Testing and verification

Before saying work is done:

- **JSON:** every metadata file parses and matches its schema; the consistency rules in content-guide §6 hold (unique ids, references exist, `files` matches the folder, folder exists at the derived path).
- **Java:** full programs compile and run with `javac`/`java` (a JDK is installed). Expected outputs shown in content match the actual output. Delete `.class` files afterwards.
- **SQL (DBMS category):** every non-illustrative `sql` block runs on PostgreSQL 17+ against the sample database, and every `**Output:**`/`**Expected output:**` block matches what `psql` prints.
- **Shell (Linux category):** every non-illustrative `bash` block runs in a fresh practice lab (`~/linux-lab`) on Ubuntu/Debian with GNU coreutils, and every `**Output:**` block matches what it prints. Never run destructive or root commands on the host; those stay `# Illustrative`.
- **Networks (Computer Networks category):** Java programs compile and run on Java 17 against localhost; subnetting and other calculations are checked with a script; sample command output comes from real runs, with public addresses replaced by documentation ranges and marked `**Output (varies)**`.
- **System Design:** Java programs compile and run on Java 17 and print exactly their `**Output:**` block; estimates, availability, quorum and capacity numbers (in lessons and in simulators) are checked with a script.
- **Operating Systems:** Java programs compile and run on Java 17 and print exactly their `**Output:**` block (multithreaded demos print only deterministic results; a demo whose output varies is marked `**Output (varies):**` and captured from a real run); every scheduling, page-replacement, Banker's, paging and disk-scheduling number is recomputed with a script (`js/simulators/os-common.js` holds the shared algorithms).
- **DevOps & Deployment:** the sample application builds and its tests pass with `./mvnw verify` against PostgreSQL; Nginx blocks pass `nginx -t`; Compose files and workflows validate against the Compose spec and the GitHub Actions workflow schema; every `bash` block passes `bash -n`; deploy scripts are exercised with stubbed `docker`/`curl`; files quoted from the tested project match it verbatim. `**Output:**` is used only for output captured from a real run; anything not executed is `**Expected result:**` prose or `# Illustrative`. Each lab's header states `**Verification:** Tested`, `Partly tested` or `Instruction only` — never claim Docker, VPS, DNS, certificate or GitHub runs that did not happen. StudyHub simulates; it never runs Docker or contacts a server.
- **Claude Code Mastery:** behaviour is checked against the official documentation and a stated Claude Code version; the `orderdesk` sample builds and its tests pass with `./mvnw verify`; settings validate against the Claude Code settings schema; skills and agents pass `claude plugin validate`; workflows validate against the GitHub Actions schema; hook scripts are exercised by piping recorded hook input; Java programs compile and run. `**Output:**` is only for output captured from a real run (never a model reply); prompts are `text` blocks and replies are described as **Expected behaviour**. Each lab header states `Locally tested`, `Partially tested`, `Instructions only` or `Simulation` and says which parts ran. Never invent flags, settings keys, hook events or schemas.
- **Git & GitHub Mastery:** every `**Output:**` block is captured from a real Git run (Git 2.52) in a disposable practice repository with a local bare repository standing in for GitHub; hashes, dates and the lab path (`/home/student/git-lab`) are the only things that differ for learners. Anything needing github.com, SSH keys, tokens or the web interface is `**Expected result:**` prose or `# Illustrative`, and each lab header states `Tested`, `Partly tested` or `Instruction only`. The `gradebook` sample builds and its tests pass with Maven; Java snippets and hook scripts are run; `js/simulators/git-common.js` (graph, areas and command models) is checked with Node. Never include real secrets — placeholders only.
- **Excel (CS Concepts):** every formula result, PivotTable value and error shown in content or an interaction is checked in desktop Excel.
- **Markdown:** headings follow the template; links and image paths resolve; renders correctly on GitHub.
- **Study plans:** `study-plans.json` matches its schema; every stage, subject, module and topic it names exists; every variant fits `durationDays × dailyMinutes` and every listed mode yields at least one activity — checked by running `js/plan-schedule.js` on the real catalogs (extending.md).
- **Interactions:** registry files match `metadata/schemas/interactions.schema.json` and content-guide §6 rule 8 (topics exist, `after` headings exist, modules exist, answer indexes valid); each new interaction steps from start to finish without errors.
- **App:** test through a local static server (architecture §10): every route, every theme (at least one light and one dark), keyboard-only navigation, a 320px-wide viewport, and the browser console free of errors.
- Report what was verified and what was not. Never claim something works without having checked it.

## Git and GitHub

- Default branch `main`; GitHub Pages deploys from `main` / root.
- Commit only when the owner asks. Small, focused commits; one topic or one feature per commit.
- Message style: `<area>: <summary>` — e.g. `content(dsa): add <topic>`, `metadata: …`, `app: …`, `docs: …`, `templates: …`.
- Never commit secrets, `node_modules/`, `.class` files or editor settings (see `.gitignore`).
- Line endings are LF (`.gitattributes`).
