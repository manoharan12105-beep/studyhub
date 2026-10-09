# Architecture

> **Status:** built (Phase 3). This document describes the application as it exists. How to extend it: [extending.md](extending.md).

## 1. Constraints

| Constraint              | Consequence                                                                 |
|-------------------------|-----------------------------------------------------------------------------|
| GitHub Pages hosting    | Only static files. No server code, database, API or server-side rendering. |
| Root `index.html`       | The app is served from the repository root, not a subfolder.                |
| Project-site URL        | The site lives at `https://<user>.github.io/<repo>/`, so **all paths are relative** (`metadata/…`, never `/metadata/…`). |
| No directory listing    | The app discovers content only through metadata JSON.                       |
| Self-contained          | Every runtime file (including third-party libraries) is committed. No CDNs. |
| HTML + CSS + vanilla JS | No frameworks, no bundler, no transpiler, no npm runtime dependencies. Native ES modules. |

`.nojekyll` at the root disables GitHub's Jekyll processing, so `.md` files and folders are served exactly as committed.

## 2. Three engines

```text
StudyHub
├── Content engine     Markdown + metadata → navigation, search, rendered lessons
├── Engagement engine  interaction registry → knowledge checks, flashcards, comparisons,
│                      visualizers, simulators; practice / interview sessions
└── Study engine       localStorage → progress, bookmarks, history, question results,
                       continue learning, study plans, notes
```

Content is never modified to suit the app. **Content ≠ interaction:** a lesson stays plain Markdown; the interaction registry references the topic by id and says where in the lesson an interaction appears.

## 3. File layout

```text
index.html                     app shell (header + menu, sidebar, main, dialogs); inline script applies
                               the theme and sidebar state before first paint
styles.css                     all styles; design tokens as CSS custom properties (six themes)
app.js                         entry: boot, route → view dispatch, global shortcuts
js/
  util.js                      DOM helpers (el, svg, icon), escaping, slugify, announce
  router.js                    hash routing
  content-loader.js            metadata index, Markdown fetch + cache, interaction registry loading
  markdown-renderer.js         marked + HTML allow-list + callouts, code, links, images, heading ids
  highlight.js                 small regex highlighter (java, sql, json, yaml, properties, xml, http, bash, nginx, …)
  search.js                    metadata search index
  storage.js                   namespaced, versioned localStorage wrapper (memory fallback)
  progress.js bookmarks.js history.js activity.js   study state, one key each
  study-engine.js              aggregates: stats, continue learning, recent, bookmarks
  plan-schedule.js             study plans, pure: stage resolution, filters, items, capacity, day split (§7)
  plans.js                     study plan records, built-in definitions, plan progress and "today"
  notes.js                     personal notes per topic: records, validation (shared with backup.js)
  theme.js                     six themes + "match system" (§9)
  backup.js                    progress backup: allowlist, encode/decode, validation, atomic restore
  updates.js                   What's new: loads metadata/updates.json, tracks seen ids and visits
  engagement/
    registry.js                type → module, placement in lessons, lazy mounting, cleanup
    stepper.js                 step engine shared by all visualizers and simulators
    question-parser.js         practice / interview Markdown → structured items
    quiz.js                    one-at-a-time practice and interview sessions
    knowledge-check.js flashcards.js comparison.js   data-driven interaction types
  visualizers/<module>.js      one module per visualizer id
  simulators/<module>.js       one module per simulator id
  three/knowledge-map.js       dashboard knowledge galaxy (Three.js, lazy): one sun per library group and
                               one planet per available subject (from groupedCategories, like the sidebar);
                               click / tap / arrow keys focus a planet or sun and open its detail panel
  map-focus.js                 search → map bridge ("View in knowledge map"); no Three.js import
  buddy/                       StudyHub Buddy, the optional companion (§9):
    buddy.js                   lifecycle: enable/disable, listeners/timers/observers through one owner, scheduler
    settings.js                studyhub:v1:buddy-settings (preferences only, validated field by field)
    character.js               the SVG character, built once and posed by attribute changes
    world.js                   surfaces measured from the real page (floor, sidebar edge), clear-spot search
    motion.js                  state machine, elapsed-time physics, the single requestAnimationFrame loop
    companion.js               speech bubble: quiz from practice.md, facts, encouragement after real events
  views/                       home, subject (+module), topic, toc, mode, session, lists, common;
                               layout (sidebar, drawer, header search), menu (header menu + dialogs);
                               plans (plans dashboard, built-in preview, plan page), plan-builder;
                               notes (My notes, one note, topic "Your notes", dashboard recent notes),
                               note-dialog (note editor + delete confirmation in #note-dialog);
                               buddy-dialog (StudyHub Buddy settings in #buddy-dialog)
assets/
  vendor/                      marked 18.0.14, three 0.170.0 (see assets/vendor/README.md)
  icons/                       favicon; subjects/<id>.svg single-colour subject icons (CSS mask)
metadata/
  categories.json              groups, categories, subcategories, study modes, catalog + interaction file paths
  updates.json                 What's new changelog (newest first)
  buddy-facts.json             reviewed short facts StudyHub Buddy may show (loaded lazily, same origin)
  study-plans.json             built-in study plans: stage templates + plans with difficulty variants
  topics/<category>.json       topic catalogs
  interactions/<category>.json interaction registries
  schemas/                     JSON Schemas for all of the above
```

## 4. Data flow

1. **Boot:** fetch `metadata/categories.json`, then every catalog in parallel (`Promise.allSettled` — one broken catalog only disables its own subject). Drafts and malformed entries are skipped. The in-memory `index` powers navigation, search and the dashboard.
2. **Open a topic:** derive `content/<category>/[<subcategory>/]<slug>/`, fetch only the file for the current tab (cached per session).
3. **Render:** marked parses the Markdown. Raw HTML is escaped except `<details>`/`<summary>`. The DOM is then enhanced: heading ids (GitHub-style slugs), `> [!NOTE]` callouts, highlighted code with a copy button, scrollable tables, links to other topics' files rewritten to in-app routes, image paths resolved against the topic folder.
4. **Engage:** `content-loader.interactionsForTopic()` loads the category's interaction registry (small JSON, cached) and `engagement/registry.placeInLesson()` inserts each interaction at the end of its `after` section. Modules are imported only when the box scrolls near the viewport.

## 5. Routing

Hash routes (GitHub Pages has no fallback for unknown paths). In-page anchors use the `s` query parameter because the hash already holds the route.

| Route                                     | View |
|-------------------------------------------|------|
| `#/`                                      | Dashboard |
| `#/c/<category>`                          | Subject: Learn · study modes, modules, practice/interview sessions |
| `#/c/<category>/m/<mode-id>`              | Study mode (all `sources` on one page, sticky source bar) |
| `#/c/<category>/<subcategory>`            | Module: topic list with filters |
| `#/t/<topic-id>[/<tab>]`                  | Topic. Tabs: `examples`, `interview-questions`, `practice`, `revision` (from `files`) and `flashcards` (when interview questions exist) |
| `#/session/<kind>/topic/<id>`             | Focused session; kind = `practice`, `interview`, `flashcards` |
| `#/session/<kind>/module/<cat>/<sub>`     | … across a module |
| `#/session/<kind>/subject/<cat>`          | … across a subject |
| any session route + `?level=easy,medium`  | Only questions of those difficulties (study plans link this way) |
| `#/plans`                                 | Study plans: active plan, your other plans, built-in plans |
| `#/plans/builtin/<plan-id>/<difficulty>`  | A built-in plan at one difficulty: what it covers, Start |
| `#/plans/new[?from=<plan-id>/<difficulty>]` | Custom plan builder (optionally starting from a built-in plan) |
| `#/plans/p/<record-id>[/edit]`            | One of your plans (today, milestones, schedule) · edit it |
| `#/notes[?q=…&subject=…&module=…&topic=…&date=…&from=…&to=…&sort=…]` | My notes: search, filters and sort (state kept in the query) |
| `#/notes/<note-id>`                       | One note: full text, subject → module → topic, Edit · Delete · Open topic |
| `#/search?q=…&type=…&subject=…&difficulty=…` | Search, results grouped by kind |
| `#/bookmarks`, `#/history`, `#/lab`       | Bookmarks, recently studied, all interactions |
| `#/updates`                               | Update history (from `metadata/updates.json`) |
| any route + `?s=<heading-id>`             | Scrolls to that heading without re-rendering |

Topic routes use the permanent `id`, so links, progress and bookmarks survive folder moves.

## 6. Engagement engine

### Interaction registry

`metadata/interactions/<category>.json`, referenced from the category's optional `interactions` field. Schema: `metadata/schemas/interactions.schema.json`.

```json
{
  "id": "ranking-functions-comparison",
  "type": "visualizer",
  "title": "ROW_NUMBER vs RANK vs DENSE_RANK",
  "description": "What to try and what to notice.",
  "topics": [
    { "topic": "ranking-window-functions", "after": "Core Concept", "options": { } }
  ]
}
```

| `type` | Loads | Data |
|--------|-------|------|
| `knowledge-check` | `js/engagement/knowledge-check.js` | `questions[]`: `prompt`, optional `code` (predict-the-output), `options`, `answer` (index), `explanation` |
| `flashcards` | `js/engagement/flashcards.js` | `cards[]`: `front`, `back` |
| `comparison` | `js/engagement/comparison.js` | `columns[]`, `rows[]`: `aspect`, `cells[]` — with a "test yourself" hide/reveal mode |
| `visualizer` | `js/visualizers/<module>.js` | module defaults to `id`; per-topic `options` |
| `simulator` | `js/simulators/<module>.js` | same |

`after` is the exact text of an H2 in the topic's `content.md`. Missing or unmatched → before "Common Mistakes"/"Key Takeaways", else at the end.

### Module contract

```js
export function mount(root, { interaction, options, topic }) {
  // build UI inside root
  return { destroy() { /* stop timers, release resources */ } };   // optional
}
```

### Step engine (`stepper.js`)

Visualizers and simulators share one engine: **input → first frame → Next → `advance(frame)` → next frame → render**. A frame is a plain state object plus `text` (the explanation, announced via a live region). Frames can be precomputed (`load(first, [frames])`) or produced lazily (`load(first, advanceFn)`) for open-ended simulations such as a load balancer's "next request". The engine provides Reset · Back · Next · Play/Pause and the step counter, so every interaction behaves identically for keyboard and screen-reader users.

### Derived engagement (no registry needed)

- **Practice / interview sessions** (`question-parser.js` + `quiz.js`) read existing `practice.md` / `interview-questions.md` by their conventions (`### P3.`, `- A)` options, `<details>` Hint/Answer/Solution, `**Answer:** C)`). Multiple-choice items with a detectable answer are auto-checked; the rest use reveal + self-rating. Shared set material (`## Set 1: …`) and file preambles are shown with each item. All 8,203 items in the current content parse.
- **Flashcards** are built from interview questions (question → answer).

## 7. Study engine (client-side state)

All in `localStorage` through `storage.js` (memory fallback when unavailable). Keys are namespaced and versioned:

```text
studyhub:v1:progress    { "<topic-id>": { "status": "in-progress|completed", "updated": ISO, "read": 0..1 } }
studyhub:v1:bookmarks   [ "<topic-id>", … ]                    newest first
studyhub:v1:history     [ { "kind": "topic|mode|session", "id", "tab"?, "label"?, "at" } ]   max 40
studyhub:v1:questions   { "<topic-id>": { "<kind>:<item>": { "r": "correct|incorrect|known|review", "t": ISO } } }
studyhub:v1:theme       "system" | "light" | "dark" | "ocean" | "purple" | "amber" | "forest"
studyhub:v1:prefs       { "questionView": "session|all", "sidebarCollapsed": bool }
studyhub:v1:updates     { "seen": [ "<update-id>", … ], "previousVisit": ISO, "currentVisit": ISO }
studyhub:v1:plans       { "active": "<record-id>" | null, "plans": [ record, … ] }   max 30 records (see Study plans)
studyhub:v1:notes       [ { "id", "title", "content", "subjectId", "moduleId", "topicId", "createdAt", "updatedAt" } ]   max 500 (see Notes)
studyhub:v1:checklists  { "<interaction-id>": [ "<item-id>", … ] }   ticked items of interactive checklists (DevOps deployment checklist)
```

On the first run of `updates`, entries older than the newest history entry (or all of them, for a brand-new browser) count as seen, so nobody is greeted with the whole changelog. A gap of 30 minutes or more starts a new visit; "Last visit" in What's new is `previousVisit`.

Question keys use the content's append-only ids (`P3`, `Q7`), so results stay valid as content grows. A breaking format change must bump `v1` and migrate.

### Study plans

Two kinds of plan, one record format (`js/plans.js`), scheduled by the same pure functions (`js/plan-schedule.js`, also runnable in Node):

- **Built-in plans** live in `metadata/study-plans.json` (schema `study-plans.schema.json`). `stages` are reusable templates — each names subjects, modules (subcategory ids) or topic ids and is one milestone. A plan has up to three `variants` (one per difficulty); each lists stage ids plus `topicLevels` (lesson difficulty kept), `questionLevels`, `modes`, `revision` (full or quick sheets), `durationDays` and `dailyMinutes`. Variants differ in topics, question levels, modes and workload. Topics are resolved against the catalogs at run time, so a plan can only contain topics that exist; it never holds lesson or question text. `defaults.modeMinutes` gives the planning time of non-lesson activities (Learn uses the topic's `estimatedMinutes`; Revision uses the study mode's `estimatedMinutes` when set).
- **Custom plans** are made in the builder (`#/plans/new`): a Subject → Module → Topic checkbox tree (tri-state parents; module and topic rows are built when expanded; only metadata is read), lesson level and question difficulty filters, duration (7/14/30/60/custom days), daily time (15/30/45/60/120/custom minutes), start date, study modes and options.
- **Record** (`studyhub:v1:plans`): `id`, `kind` (`builtin` + `plan`/`variant`, or `custom`, optional `basedOn`), `title`, `created`, `updated`, `start` (YYYY-MM-DD), `settings` { durationDays, dailyMinutes, topicLevels, questionLevels, modes, revision, skipCompleted, prioritizeWeak, overload }, `topics` (the chosen scope, before filters), `milestones` [{ title, topics }], `minutes` (planning minutes used), `days` (one array of item keys per day) and `done` { key: ISO }. Item keys reference content only by id: `learn|interactive|practice|interview|flashcards:<topic-id>`, `revision:<category>/<mode-id>`. Starting a built-in plan copies only ids and settings; the definition is never changed.
- **Generation** (deterministic): scope → `planTopics` (lesson level filter, optional *skip completed* from `progress`, optional *weak areas first* from `study-engine.needsAttention()` — at least 3 recorded answers and under 60% right; nothing is guessed) → `buildItems` (one item per topic and available mode: Practice needs `practice.md`, Interview and Flashcards need `interview-questions.md`, Interactive needs an interaction in the registry; one Revision item per subject, after its last topic) → `schedule` (days fill in order up to the daily time; an item moves to the next day when at least half of it would not fit; never more days than the duration). `capacity` compares the work with the schedule; when it does not fit, the builder offers *Extend duration*, *Increase daily time*, *Reduce topics* or *Continue anyway* (days then hold total ÷ days).
- **Progress inside a plan:** a Learn item is done exactly when the topic is completed in `studyhub:v1:progress` — wherever that happened — and ticking it in the plan completes the lesson. Other items are ticked in the plan (`done`). Today = days since `start` + 1; earlier unfinished items are listed under *Catch up*. Items whose topic or study mode no longer exists are skipped, never shown as errors.
- **Links:** Learn → `#/t/<id>`, Interactive → the lesson at its first exercise (`?s=try-<interaction-id>`), Practice / Interview / Flashcards → the existing session routes with `?level=` when not every difficulty is chosen, Revision → `#/c/<category>/m/<mode-id>`. The session's level filter uses a question's own `**Difficulty:**` line, else its `## Beginner|Intermediate|Advanced` section, else the topic's difficulty (beginner = easy, intermediate = medium, advanced = hard).
- **Editing** (`#/plans/p/<id>/edit`): change topics (tree, reorder, remove), filters, schedule or modes and rebuild; finished items stay finished. On the plan page items can be ticked and moved to another day without a rebuild, and the schedule can restart from today.

### Notes

Personal Markdown notes, each tied to one topic (`js/notes.js`; views in `js/views/notes.js` and `js/views/note-dialog.js`). No tags, folders or attachments — by design.

- **Record:** `id` (`n-` + base36 time + random suffix), `title` (one line, ≤ 120 characters), `content` (Markdown source, ≤ 10,000 characters), `subjectId` (category id), `moduleId` (subcategory id, `null` for a topic without one), `topicId`, `createdAt`, `updatedAt` (ISO). Only ids are stored; subject, module and topic names are read from the metadata index when a note is shown.
- **Association:** a note is created from a topic page (header **Add note**, or **Add note** in the *Your notes* box under the lesson); subject and module are taken from the topic's metadata. Editing changes only `title`, `content` and `updatedAt` — the association never changes.
- **Where notes appear:** the topic's *Your notes* box (View · Edit), **My notes** in the sidebar (with the count, computed from storage), `#/notes` (search over title, text and subject/module/topic names; Subject → Module → Topic filters that only list values with notes; date filter on the last update — today, this week from Monday, this month, custom range; sort newest/oldest created or recently updated), `#/notes/<id>` (Open topic goes back to `#/t/<topic-id>`), up to four recent notes on the dashboard, and *Open notes* in the Ctrl/⌘+K quick actions. Notes are never added to the global search index.
- **Markdown:** stored as typed. The note page and the editor's *Preview* render it with `markdown-renderer.js` (raw HTML escaped except `<details>`, `javascript:`/`data:` links dropped, callouts and highlighted code as in lessons) with two note-only options: `breaks` (single line breaks kept, so plain-text notes read as written) and `noImages` (every image shown as its alt text while the HTML is still inert, so a note never makes a request). Cards, the topic box and the dashboard show a plain-text preview (`plainText()`).
- **.md files:** *Import .md file* in the editor reads a local `.md`/`.txt` file (≤ 200 KB) with `File.text()`: a leading `# Heading` fills an empty title (else the file name), the rest fills the text or is appended after what was typed — nothing typed is replaced, and the result must still fit 10,000 characters. *Download .md* on a note page saves that note; on My notes it saves every note currently listed (after search and filters) as one file. Downloads are Blob URLs; nothing is uploaded. The download format is `# Title`, a `> Subject → Module → Topic · created … · updated …` line, then the note; importing such a file drops that line.
- **Editor:** `#note-dialog` (`<dialog>`), title and text required with inline messages. Esc, the close button, a backdrop click or Cancel ask *Discard?* when the form was edited (menu.js routes close-button and backdrop clicks through a cancelable `cancel` event). Delete always asks for confirmation. Changes dispatch `studyhub:change` with `key: "notes"`; every view showing notes re-renders from storage.
- **Unknown topics:** a note whose topic is no longer published stays visible in My notes ("Topic no longer available") but is not exported (the export screen says how many were left out).
- **Extending:** a future "move note" feature is the only place that may change `subjectId`/`moduleId`/`topicId`; validate the new topic with `placeOf()`. A new field must be optional and added to `cleanNote()`, which both the app and the backup use.

### Progress Import / Export (clipboard backup)

StudyHub is static: progress exists only in the browser that recorded it. **Menu → Progress Import / Export** moves it between browsers or devices through the clipboard (`js/backup.js`, dialog in `js/views/backup-dialog.js`). Nothing is uploaded and there are no files.

- **Categories:** the allowlist is `CATEGORIES` in `js/backup.js` — `progress` (Progress), `bookmarks`, `history`, `questions` (Question results), `plans` (Study plans), `notes`, `checklists`, each with a label and a one-line description. Export and import both list this one array, so they cannot drift apart. Not exported: `theme`, `prefs` (appearance and layout belong to each browser), `updates` (per-browser What's new state), and any key outside `studyhub:v1:`.
- **Selective export:** Export shows a checkbox per category with its current count (Select all · Clear selection · a live "Selected (n of 7): …" line). Categories that have data start ticked. Only the ticked keys are written into `data`; an unticked category is **absent** from the backup, not empty. A ticked category with nothing in it is written as an empty value. Export is disabled when nothing is ticked, or when every ticked category is empty.
- **Format:** one line, `STUDYHUB-PROGRESS:v1:z.<base64url>` — deflate-raw compressed JSON `{ format: "studyhub-progress", version: 1, exportedAt, data }` (`j.` = uncompressed JSON, used where `CompressionStream` is missing). The version appears in the prefix and in the JSON; a backup with any other version is refused with a clear message, so a future v2 can add migration. Selective backups use the same v1 format: `data` simply holds fewer keys. No extra field is needed, because "absent" (key missing) and "empty" (key present, empty value) are already different.
- **Import (selective):** paste → **Continue** validates the whole backup → a checkbox per category **the backup holds** (nothing ticked; each row shows "In backup: … · here now: …"; categories it lacks are listed as unchanged) → **Review import** → a confirmation listing each chosen category with what it brings and what it replaces, a warning that replacement is not a merge, and the categories that will not change → **Confirm import**. Cancel, Back, Esc or closing the dialog at any step writes nothing. Only the chosen keys are written, in one step, by `storage.writeAll()`, which restores the previous value of every key it wrote if any write fails (a best-effort rollback within synchronous `localStorage` writes, not a transaction). Views re-render on the `studyhub:restored` event (`detail.keys` lists what was written).
- **Semantics:** every category is **replaced**, never merged — this is the behaviour imports have always had, now applied per category. A chosen category that is empty in the backup clears that category here (the confirmation says "empty in the backup — clears your …"). A category missing from the backup cannot be chosen and is never touched, so a backup made before plans, notes or checklists existed leaves them alone, and a notes-only backup leaves progress alone.
- **Validation policy:** every category in the backup is validated strictly, chosen or not: a malformed entry anywhere means the text is damaged, so the whole backup is refused with a message and nothing is written. Unknown top-level keys are refused. A backup holding no categories, or only empty ones, is refused as "does not contain any progress to restore".
- **Import checks:** every entry is type-checked against the shapes above (ids, statuses, dates, result values; unknown keys rejected, objects rebuilt from known fields) *before* anything is written. `plans` was added later: a backup without it (made before study plans existed) still imports, and leaves this browser's plans untouched; plan records are checked field by field (ids, item keys, settings ranges, day count = duration, at most 30 plans and 365 days). `notes` was added the same way: a backup without it leaves this browser's notes untouched. Each imported note must be well formed (id, non-empty title and text, ISO dates with updated ≥ created, no duplicate ids, at most 500) and point at an existing topic whose subject and module match the stored `subjectId`/`moduleId`; otherwise the whole backup is refused. `checklists` (Phase 2K) is optional in the same way: a backup without it leaves this browser's ticks untouched; each list id and item id must be a kebab-case id, unique within its list (at most 50 lists of 200 items), or the whole backup is refused.
- **Adding a new kind of persistent learner state:** add an entry to `CATEGORIES` (key, label, description) with a validator in `CLEANERS`, an empty value in `EMPTY` and a counter in `COUNTERS` in `js/backup.js`, and its wording in `AMOUNT` in `js/views/backup-dialog.js`, or it will not travel with backups. Backups made before it existed simply lack the key, which leaves it untouched on import.

## 8. Third-party code

| Library | Version | Use | Loaded |
|---------|---------|-----|--------|
| marked | 18.0.14 | Markdown parsing | always (46 KB) |
| three | 0.170.0 | dashboard knowledge galaxy | lazily, only on the dashboard, at any width, with WebGL |

Vendored under `assets/vendor/<name>-<version>/` with licenses; recorded in `assets/vendor/README.md`. Syntax highlighting is in-house (`js/highlight.js`).

## 9. Accessibility and UI

Semantic landmarks, skip link, one `h1` per view with focus moved to it on navigation and a polite live-region announcement, visible `:focus-visible` rings, `aria-current` in navigation, the mobile drawer makes `main` inert and closes on Esc, `<dialog>` for shortcuts, What's new and About, all state shown with text (not colour only), WCAG AA token colours in every theme, `prefers-reduced-motion` honoured (no transitions; knowledge galaxy static, camera jumps instead of flying), no horizontal page scroll at 320 px. The knowledge galaxy canvas is focusable: ←/→ / Home / End focus a subject (planet), ↑/↓ a library group (sun), Esc resets the view; its HTML labels are `aria-hidden` (the canvas, the detail panel and the subject cards carry the same information) and never overlap — a label that does not fit is hidden until the camera zooms in. On a phone, tapping a sun zooms into its system. Without WebGL the section is not rendered and search drops "View in knowledge map". Shortcuts: `/` search, `Ctrl`/`⌘`+`K` quick actions, `←`/`→` previous/next topic (or question inside a session), `?` help, `Esc` close.

### Header menu, themes and sidebar

- **Header menu** (`views/menu.js`): one ⋮ button (ARIA menu button) with three groups — *Study* (Bookmarks, Recently studied, Keyboard shortcuts), *Appearance* (Theme › — a submenu shown in the same panel, listing the theme radios — and StudyHub Buddy, which opens its settings dialog) and *StudyHub* (Progress Import / Export, What's new, About). Arrow keys / Home / End move, Esc closes and returns focus (in the Theme submenu, ← or Esc goes back to Theme); choosing a theme keeps the menu open so themes can be compared. The badge on the button counts unseen updates.
- **Themes** (`theme.js`): Light, Dark, Ocean, Purple, Amber, Forest and Match system. A theme is a token block in `styles.css` selected by `data-theme="<id>"` on `<html>`; *Match system* removes the attribute and the `prefers-color-scheme` block applies. Components only use tokens, so a new theme is one token block plus an entry in `THEMES` and in the inline head script. Changing theme dispatches `studyhub:theme`, which the knowledge galaxy listens to (it rebuilds from the `--galaxy-*` tokens: `--galaxy-bg`, `--galaxy-nebula` and `--galaxy-accent` per theme; text and the sun/planet palettes are shared, because the galaxy is always a night sky).
- **Sidebar** (`views/layout.js`): *Study* (Dashboard, Continue learning, Interactive lab) and *Library* — subjects grouped by `categories.json` `groups`, each a compact row with icon and `completed/total`; the active subject shows a progress bar. No topics in the sidebar (they live on subject and module pages). At ≥ 768 px it collapses to an icon rail (tooltips on hover/focus, state in `prefs.sidebarCollapsed`); below 768 px it is a drawer with a focus trap (rest of the page inert), closed by Esc, the backdrop or following a link.
- **Sidebar events**: `layout.js` dispatches `studyhub:sidebar` (`detail: { collapsed, drawerOpen }`) after the sidebar collapses or expands and after the drawer opens or closes. Anything that depends on the sidebar's geometry listens for it instead of watching the DOM.
- **What's new** (`updates.js`): static changelog only — no network checks. Unseen entries since the last visit are listed in the dialog; otherwise "You're caught up" with the last visit date. `#/updates` is the full history.

### StudyHub Buddy (`js/buddy/`)

An optional companion: a small SVG character that lives at the edges of the page. On by default; **⋮ → StudyHub Buddy** turns it off or customises it (colour, eyes, accessory, movement, quiz frequency, personality, facts, encouragement, quiet mode, motion). It is decorative (`aria-hidden`, never in the tab order); everything it offers is also in that dialog.

- **Surfaces** (`world.js`): the *floor* is the bottom edge of the viewport across the workspace (right of the sidebar on desktop, right of the drawer while it is open on phones); the *wall* is the sidebar's right edge, climbable only while the sidebar is really there (expanded at ≥ 768 px, or the drawer open). Geometry is measured with `getBoundingClientRect`/`offsetWidth`, cached, and invalidated by events (`studyhub:sidebar`, resize, route, theme, visibility) — never measured per frame. A spot is *clear* when none of nine sample points under Buddy hits lesson text, code, tables, controls, cards, interactions or the galaxy (`document.elementsFromPoint`); Buddy rests only on clear spots, and where none exists (a phone-width lesson) it ducks half below the edge.
- **Motion** (`motion.js`): one state machine (`ALLOWED` lists every legal transition; refused ones are counted), one `requestAnimationFrame` chain that runs only while a state needs frames, movement from elapsed time. Each state change bumps a generation number; timers made for a state die with it. If the sidebar edge disappears while Buddy is on it (collapse, drawer closed, breakpoint), Buddy slips (tilts away, reaches for the edge), falls under gravity (2300 px/s², rotation, flailing, air-righting near the floor), lands with a squash scaled by impact speed, wobbles, and walks off anything it landed on. A sidebar that expands over a resting Buddy knocks it clear. Reopening the sidebar mid-fall does not re-grip. Reduced motion (system setting or Buddy's "Always calm") replaces all of this with an instant, still placement.
- **Companion** (`companion.js`): an optional quiz question drawn from the learner's completed (else recently studied) topics' `practice.md` through `question-parser.js` — only short multiple-choice items with a marked answer; if none fits, Buddy asks nothing. Answering records nothing. Facts come from `metadata/buddy-facts.json`. Encouragement only follows real events (one topic completed, a plan activity ticked, a return after three or more days). Prompts wait while the learner types, a dialog or the menu is open, the drawer is open, or a practice/interview/flashcard session or a form is in use; there is at most one unprompted bubble per three minutes.
- **Lifecycle** (`buddy.js`): enabling builds everything and registers every listener, timer and observer through one owner; disabling disposes it, so nothing of Buddy keeps running. `studyhub:v1:buddy-settings` holds preferences only and is not part of the progress backup (like the theme). Load the app with `?buddy-debug` before the `#` to get `window.__studyhubBuddy` (state, traces, resource counts, a paused scheduler) for testing.

## 10. Local development

`fetch()` does not work from `file://`; use any static server from the repository root:

```bash
npx http-server -c-1 .        # or: python -m http.server 8000
```

Then open the printed URL. Test from a subpath too if possible (GitHub Pages serves under `/<repo>/`).

**Caching.** Servers that send no cache headers (e.g. `python -m http.server`) let the browser reuse old copies of files for hours. A new `index.html` and JavaScript with a cached older `styles.css` produces a half-styled page: unstyled menu buttons, run-together text, and coloured themes falling back to Dark. Prevent it in two ways: `index.html` loads `styles.css?v=<date>` and `app.js?v=<date>`, so **change that date whenever either file changes**; and serve locally with caching off (`-c-1` above) or hard-reload (`Ctrl+Shift+R`).

## 11. Deployment

GitHub → repository **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**. Every push to `main` publishes. No workflow or build is required.
