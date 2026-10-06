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
                       continue learning
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
  highlight.js                 small regex highlighter (java, sql, json, yaml, properties, xml, http, bash, …)
  search.js                    metadata search index
  storage.js                   namespaced, versioned localStorage wrapper (memory fallback)
  progress.js bookmarks.js history.js activity.js   study state, one key each
  study-engine.js              aggregates: stats, continue learning, recent, bookmarks
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
  three/knowledge-map.js       dashboard 3D map (Three.js, lazy): one node per available subject;
                               click / arrow keys focus a subject and open its detail panel
  map-focus.js                 search → map bridge ("View in knowledge map"); no Three.js import
  views/                       home, subject (+module), topic, toc, mode, session, lists, common;
                               layout (sidebar, drawer, header search), menu (header menu + dialogs)
assets/
  vendor/                      marked 18.0.14, three 0.170.0 (see assets/vendor/README.md)
  icons/                       favicon; subjects/<id>.svg single-colour subject icons (CSS mask)
metadata/
  categories.json              groups, categories, subcategories, study modes, catalog + interaction file paths
  updates.json                 What's new changelog (newest first)
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

- **Practice / interview sessions** (`question-parser.js` + `quiz.js`) read existing `practice.md` / `interview-questions.md` by their conventions (`### P3.`, `- A)` options, `<details>` Hint/Answer/Solution, `**Answer:** C)`). Multiple-choice items with a detectable answer are auto-checked; the rest use reveal + self-rating. Shared set material (`## Set 1: …`) and file preambles are shown with each item. All 6,449 items in the current content parse.
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
```

On the first run of `updates`, entries older than the newest history entry (or all of them, for a brand-new browser) count as seen, so nobody is greeted with the whole changelog. A gap of 30 minutes or more starts a new visit; "Last visit" in What's new is `previousVisit`.

Question keys use the content's append-only ids (`P3`, `Q7`), so results stay valid as content grows. A breaking format change must bump `v1` and migrate.

### Progress Import / Export (clipboard backup)

StudyHub is static: progress exists only in the browser that recorded it. **Menu → Progress Import / Export** moves it between browsers or devices through the clipboard (`js/backup.js`, dialog in `js/views/backup-dialog.js`). Nothing is uploaded and there are no files.

- **Exported:** exactly the allowlist `progress`, `bookmarks`, `history`, `questions`. Not exported: `theme`, `prefs` (appearance and layout belong to each browser), `updates` (per-browser What's new state), and any key outside `studyhub:v1:`.
- **Format:** one line, `STUDYHUB-PROGRESS:v1:z.<base64url>` — deflate-raw compressed JSON `{ format: "studyhub-progress", version: 1, exportedAt, data }` (`j.` = uncompressed JSON, used where `CompressionStream` is missing). The version appears in the prefix and in the JSON; a backup with any other version is refused with a clear message, so a future v2 can add migration.
- **Import:** the pasted text is decoded and every entry is type-checked against the shapes above (ids, statuses, dates, result values; unknown keys rejected, objects rebuilt from known fields) *before* anything is written. After a confirmation listing what the backup contains, the four keys are **replaced** in one step by `storage.writeAll()`, which restores the previous values if any write fails. Views re-render on the `studyhub:restored` event.
- **Adding a new kind of persistent learner state:** add its key to `ALLOWLIST` with a validator in `js/backup.js`, or it will not travel with backups.

## 8. Third-party code

| Library | Version | Use | Loaded |
|---------|---------|-----|--------|
| marked | 18.0.14 | Markdown parsing | always (46 KB) |
| three | 0.170.0 | dashboard knowledge map | lazily, only on the dashboard at ≥ 1024 px with WebGL |

Vendored under `assets/vendor/<name>-<version>/` with licenses; recorded in `assets/vendor/README.md`. Syntax highlighting is in-house (`js/highlight.js`).

## 9. Accessibility and UI

Semantic landmarks, skip link, one `h1` per view with focus moved to it on navigation and a polite live-region announcement, visible `:focus-visible` rings, `aria-current` in navigation, the mobile drawer makes `main` inert and closes on Esc, `<dialog>` for shortcuts, What's new and About, all state shown with text (not colour only), WCAG AA token colours in every theme, `prefers-reduced-motion` honoured (no transitions; 3D map static, camera jumps instead of flying), no horizontal page scroll at 320 px. The 3D map canvas is focusable: arrow keys / Home / End focus a subject, Esc resets the view. Shortcuts: `/` search, `Ctrl`/`⌘`+`K` quick actions, `←`/`→` previous/next topic (or question inside a session), `?` help, `Esc` close.

### Header menu, themes and sidebar

- **Header menu** (`views/menu.js`): one ⋮ button (ARIA menu button) with three groups — *Study* (Bookmarks, Recently studied, Keyboard shortcuts), *Appearance* (Theme › — a submenu shown in the same panel, listing the theme radios) and *StudyHub* (Progress Import / Export, What's new, About). Arrow keys / Home / End move, Esc closes and returns focus (in the Theme submenu, ← or Esc goes back to Theme); choosing a theme keeps the menu open so themes can be compared. The badge on the button counts unseen updates.
- **Themes** (`theme.js`): Light, Dark, Ocean, Purple, Amber, Forest and Match system. A theme is a token block in `styles.css` selected by `data-theme="<id>"` on `<html>`; *Match system* removes the attribute and the `prefers-color-scheme` block applies. Components only use tokens, so a new theme is one token block plus an entry in `THEMES` and in the inline head script. Changing theme dispatches `studyhub:theme`, which the 3D map listens to.
- **Sidebar** (`views/layout.js`): *Study* (Dashboard, Continue learning, Interactive lab) and *Library* — subjects grouped by `categories.json` `groups`, each a compact row with icon and `completed/total`; the active subject shows a progress bar. No topics in the sidebar (they live on subject and module pages). At ≥ 768 px it collapses to an icon rail (tooltips on hover/focus, state in `prefs.sidebarCollapsed`); below 768 px it is a drawer with a focus trap (rest of the page inert), closed by Esc, the backdrop or following a link.
- **What's new** (`updates.js`): static changelog only — no network checks. Unseen entries since the last visit are listed in the dialog; otherwise "You're caught up" with the last visit date. `#/updates` is the full history.

## 10. Local development

`fetch()` does not work from `file://`; use any static server from the repository root:

```bash
npx http-server -c-1 .        # or: python -m http.server 8000
```

Then open the printed URL. Test from a subpath too if possible (GitHub Pages serves under `/<repo>/`).

**Caching.** Servers that send no cache headers (e.g. `python -m http.server`) let the browser reuse old copies of files for hours. A new `index.html` and JavaScript with a cached older `styles.css` produces a half-styled page: unstyled menu buttons, run-together text, and coloured themes falling back to Dark. Prevent it in two ways: `index.html` loads `styles.css?v=<date>` and `app.js?v=<date>`, so **change that date whenever either file changes**; and serve locally with caching off (`-c-1` above) or hard-reload (`Ctrl+Shift+R`).

## 11. Deployment

GitHub → repository **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**. Every push to `main` publishes. No workflow or build is required.
