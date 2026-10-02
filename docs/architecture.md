# Architecture

> **Status:** planning document. The application described here is **not built yet** — it is the target for Phase 3. Today the repository contains only the foundation (structure, metadata, templates, rules) and a placeholder `index.html`.

## 1. Constraints

| Constraint              | Consequence                                                                 |
|-------------------------|-----------------------------------------------------------------------------|
| GitHub Pages hosting    | Only static files. No server code, database, API or server-side rendering. |
| Root `index.html`       | The app is served from the repository root, not a subfolder.                |
| Project-site URL        | The site lives at `https://<user>.github.io/<repo>/`, so **all paths are relative** (`metadata/…`, never `/metadata/…`). |
| No directory listing    | The app discovers content only through metadata JSON.                       |
| Self-contained          | Every runtime file (including third-party libraries) is committed. No CDNs. |
| HTML + CSS + vanilla JS | No frameworks, no bundler, no transpiler, no npm runtime dependencies.     |

`.nojekyll` at the root disables GitHub's Jekyll processing, so `.md` files and folders are served exactly as committed.

## 2. Layers

```text
┌──────────────────────────────────────────────────────────┐
│  Application   index.html · styles.css · app.js · js/    │  reads ↓, never contains content
├──────────────────────────────────────────────────────────┤
│  Metadata      metadata/categories.json                  │  navigation, search, filters,
│                metadata/topics/<category>.json           │  progress keys, related topics
├──────────────────────────────────────────────────────────┤
│  Content       content/<category>/[<sub>/]<slug>/*.md    │  what the learner reads
└──────────────────────────────────────────────────────────┘
        assets/  (app images, icons, fonts, vendored libraries)
```

Adding categories or topics touches only the bottom two layers. The application layer changes only for new features.

## 3. Planned file layout (Phase 3)

```text
index.html          app shell (header, sidebar, main region)
styles.css          all styles; design tokens as CSS custom properties
app.js              entry point (type="module"): boot, router setup
js/                 native ES modules, added only when app.js grows too large
  data.js           fetch + cache categories, catalogs, markdown
  router.js         hash routing
  render/…          dashboard, category, topic, search views
  storage.js        localStorage wrapper (progress, bookmarks, theme)
  visualizers/…     interactive DSA visualizers, one module per id
assets/
  vendor/           pinned third-party libraries (Markdown parser, Java highlighter)
  icons/            UI and category icons (SVG)
  images/           non-topic images
```

Native ES modules work in every current browser and need no build step.

## 4. Data flow

1. **Boot:** fetch `metadata/categories.json`, then every `catalog` it lists (one small file per category) in parallel. This in-memory index powers the dashboard, sidebar, search and filters.
2. **Open a topic:** look up its metadata entry, derive the folder path `content/<category>/[<subcategory>/]<slug>/`, and fetch only the files listed in `files`.
3. **Render:** parse Markdown with the vendored parser; resolve relative image/link URLs against the topic folder; turn links to other topics' `content.md` into in-app routes; render `> [!NOTE]`-style callouts, `<details>` answers, and Java highlighting with a copy button.
4. Fetched files are cached in memory for the session.

## 5. Routing

Hash-based routes, because GitHub Pages has no fallback for unknown paths (a path-based route would 404 on refresh).

| Route                                  | View                                   |
|----------------------------------------|----------------------------------------|
| `#/`                                   | Dashboard                              |
| `#/c/<category>`                       | Category landing: **Learn** (topic list) + one entry per `studyModes` item |
| `#/c/<category>/m/<mode-id>`           | Study mode, e.g. `#/c/aptitude/m/revision`, `#/c/aptitude/m/quick-revision` |
| `#/c/<category>/<subcategory>`         | Subcategory                            |
| `#/t/<topic-id>`                       | Topic (`content.md`)                   |
| `#/t/<topic-id>/<file>`                | Topic companion tab, e.g. `practice`   |
| `#/search?q=…&difficulty=…&tag=…`      | Search and filters                     |
| `#/bookmarks`                          | Bookmarked topics                      |

Topic routes use the permanent `id`, so links and bookmarks survive folder moves. Breadcrumbs come from the topic's `category`/`subcategory`.

## 6. Feature → data mapping

| Feature                    | Source                                                                      |
|----------------------------|-----------------------------------------------------------------------------|
| Dashboard                  | `categories.json` + catalog counts + localStorage progress                  |
| Category / topic navigation| `categories.json` (+ `subcategories`), catalogs (sorted by `order`)         |
| Breadcrumbs                | topic `category` / `subcategory` → titles from `categories.json`            |
| Search                     | catalog `title`, `description`, `tags` (client-side; full-text later if needed) |
| Filters                    | `difficulty`, `type`, `tags`, `category`, progress state                    |
| Related / prerequisites    | `relatedTopics`, `prerequisites`                                            |
| Topic tabs                 | `files`                                                                     |
| Practice / interview mode  | `practice.md`, `interview-questions.md`, `<details>` answers                |
| Category study modes       | `studyModes` in `categories.json` → all `sources` fetched and rendered as one page with a tab/anchor per source (e.g. Aptitude: Learn · Revision · Quick Revision) |
| Per-topic revision sheet   | `revision.md` (used by categories without study modes)                      |
| Study progress             | localStorage keyed by topic `id` (later: question ids `P1`, `Q3`)          |
| Bookmarks                  | localStorage list of topic `id`s                                            |
| Visualizations             | `visualizer` id → `js/visualizers/<id>.js` (planned ids: [visualizers.md](visualizers.md)); topics whose module doesn't exist yet show no visualizer |
| Drafts                     | `status: "draft"` topics hidden                                             |

## 7. Client-side state

Stored in `localStorage` only (no accounts, no sync). All keys are namespaced and versioned so the format can change without corrupting old data:

```text
studyhub:v1:progress   { "<topic-id>": { "status": "not-started|in-progress|completed", "updated": "<ISO date>" } }
studyhub:v1:bookmarks  [ "<topic-id>", … ]
studyhub:v1:theme      "light" | "dark" | "system"
```

Reads are wrapped in try/catch; the app must work (without persistence) when storage is unavailable.

## 8. Third-party code

Allowed only when writing it ourselves would be unreasonable — realistically a Markdown parser and a syntax highlighter (Java only). Rules:

- Vendored into `assets/vendor/<name>-<version>/` with its license file.
- Pinned version, recorded in `assets/vendor/README.md`.
- No CDN links, no npm runtime dependency, no build step.

## 9. Local development

`fetch()` does not work from `file://`, so preview through any static server from the repository root, for example:

```bash
npx http-server -c-1 .        # Node is installed on the dev machine; dev-only, never a runtime dependency
```

or the VS Code "Live Server" extension. Then open the printed `http://localhost:…` URL.

## 10. Deployment

GitHub → repository **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**. Every push to `main` publishes. No workflow or build is required.
