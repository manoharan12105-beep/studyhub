---
name: ui-ux
description: Design and build the StudyHub static web application interface — information hierarchy, navigation, responsive layout, typography, theming (six colour themes), accessibility, and interactive components (search, filters, progress, bookmarks, code blocks, practice reveal, DSA visualizers). Use for any work on index.html, styles.css, app.js, js/ or assets/.
---

# UI/UX

Goal: **beautiful + useful + easy to study.** StudyHub should feel like a focused study tool, not a documentation dump and not a marketing site.

Technical constraints come from [CLAUDE.md](../../../CLAUDE.md) and [docs/architecture.md](../../../docs/architecture.md): static GitHub Pages, root `index.html`, vanilla HTML/CSS/JS, no frameworks, no CDNs, relative paths, hash routing.

## Principles

1. **Reading comes first.** Body text is the product. Everything else supports finding it, reading it, and returning to it.
2. **Clear hierarchy.** At any moment the learner knows where they are (breadcrumbs, active nav item, page title) and what to do next (next topic, practice, revision).
3. **Calm visuals.** Neutral surfaces, one accent colour, colour used for meaning (difficulty, status, callout type) not decoration. No heavy gradients, glassmorphism, oversized hero art, or parallax.
4. **Meaningful motion only.** Short (≤ 200 ms) transitions that explain a change (panel open, answer reveal). Nothing animates on its own. All motion disabled under `prefers-reduced-motion: reduce`.
5. **Fast.** No layout shift while content loads; skeleton or short loading text; tiny JS and CSS.
6. **Consistency.** Same component for the same job everywhere; spacing and type from tokens only.

## Layout

| Width | Layout |
|---|---|
| < 768px | Single column. Header with a menu button opening the subject nav as an overlay drawer (focus trapped, Esc / backdrop close). TOC collapsed at top of article. |
| 768–1199px | Persistent sidebar nav (collapsible to an icon rail) + content. TOC collapsed at top of article. |
| ≥ 1200px | Sidebar nav · content · sticky on-page TOC (from H2/H3). |

- Article measure 65–75 characters (`max-width: ~70ch`).
- Must work at 320px width with no horizontal page scroll; wide tables and code blocks scroll inside their own container.
- 16px side gutter minimum on mobile.

## Typography and tokens

- System font stack for UI and body; a monospace stack for code. No web-font requests unless vendored and justified.
- Base size 16–18px, line-height ~1.6 for body, tighter for headings. A modular scale (e.g. 1.25) for headings.
- All colours, spacing, radii, font sizes and shadows are CSS custom properties on `:root`. Components use tokens, never raw values.

## Theming

- Six themes via tokens: Light, Dark, Ocean, Purple, Amber, Forest. Default ("Match system") follows `prefers-color-scheme` with no attribute; choosing a theme in the header menu sets `data-theme="<id>"` on `<html>`, persisted under `studyhub:v1:theme`. List: `THEMES` in `js/theme.js`.
- A theme is one token block in `styles.css` (`[data-theme="<id>"] { … }`) defining every token the light block defines. Never add a theme-specific rule to a component — if a component looks wrong in one theme, fix the token.
- Apply the stored theme (and the collapsed-sidebar state) before first paint (inline script in `<head>`) to avoid a flash; a new theme id must be added there too.
- Every theme meets contrast requirements, including code highlighting, callouts, badges and `--success`/`--warning` text on their `-soft` backgrounds. The 3D map reads `--accent`, `--success`, `--border-strong` and `--text` and rebuilds on the `studyhub:theme` event.

## Accessibility (non-negotiable)

- **WCAG 2.2 AA.** Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI boundaries/focus indicators).
- **Semantic HTML:** `header`, `nav`, `main`, `article`, `aside`, `footer`; real `<button>` and `<a href>`; one `<h1>` per view; heading levels in order.
- **Keyboard:** everything operable by keyboard in a logical order; visible `:focus-visible` outline; "Skip to content" link; `Esc` closes drawers/dialogs; focus moves to the new view's `<h1>` after route changes and is trapped only inside modal dialogs.
- **Shortcuts** (optional, discoverable via a help dialog): `/` focuses search, `Ctrl`/`⌘`+`K` opens quick actions. Never hijack keys while typing in inputs.
- **Screen readers:** `aria-current="page"` on active nav; `aria-expanded` on toggles; route changes announced via a polite live region; icons decorative (`aria-hidden`) or labelled.
- Target size ≥ 24×24 CSS px (prefer 44×44 on touch).
- Never convey meaning by colour alone — difficulty/status badges include text.
- Respect `prefers-reduced-motion` and user zoom up to 200%.

## Key views

- **Header:** logo, search, one ⋮ menu (Study · Appearance · StudyHub). New header actions go into the menu, not new buttons.
- **Sidebar:** Study links + Library (subjects grouped by `categories.json` `groups`). Subjects only — topics live on subject/module pages.
- **Dashboard:** your progress kept separate from platform stats, continue learning (with time left from real `estimatedMinutes`), quick revision, needs-attention (only from real answer data), category cards, bookmarks.
- **Category landing:** summary (icon, topic/module/interactive counts, lesson time, progress, continue button), then "Revise and test yourself" tiles — each study mode by its `title` plus whole-subject Practice / Interview / Flashcards — recently studied in this subject, and the numbered module list. A study mode is one page combining all its source files, with a sticky tab/anchor bar per source; on mobile the bar scrolls horizontally. Quick Revision must be scannable on a phone: compact tables, formula blocks, callouts.
- **Category / subcategory:** ordered topic list with difficulty, estimated time, status; filter by difficulty/type/status.
- **Topic:** breadcrumbs, title, meta row (difficulty, time, tags), tabs for the topic's `files` (Lesson · Examples · Interview · Practice · Revision), article, TOC, prerequisites/related topics, mark-complete and bookmark controls, previous/next topic.
- **Search:** instant results over title/description/tags with filter chips; keyboard navigable result list; empty state that suggests clearing filters.
- **Revision mode:** revision sheets in a dense, scannable layout, filterable by category.

## Components

- **Code block:** language label, copy button (announces "Copied" via live region), horizontal scroll, Java highlighting from the vendored highlighter.
- **Callout:** styled from `> [!NOTE|TIP|IMPORTANT|WARNING|CAUTION]`, icon + text label, distinct but restrained colours.
- **Answer reveal:** native `<details>/<summary>` — accessible by default; style the summary as a clear button-like control.
- **Progress:** per-topic status (not started / in progress / completed) with text, not only a coloured dot.
- **Tables:** zebra or row borders, sticky header if long, scroll container on small screens.
- **Visualizer:** canvas/SVG area plus Step / Play / Pause / Reset buttons and a text description of the current step (screen readers and reduced-motion users get the text).

## Before finishing UI work

- [ ] Works from a local static server and from a subpath (relative URLs only).
- [ ] Tested in every theme (at least Light, Dark and one coloured theme), at 320px, 768px and ≥ 1200px.
- [ ] Full keyboard pass: reach and operate everything, focus always visible, no traps.
- [ ] Contrast checked for text, focus rings, badges and code.
- [ ] `prefers-reduced-motion` honoured.
- [ ] No console errors; missing content shows a helpful message.
- [ ] No new external requests.
