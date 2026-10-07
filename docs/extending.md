# Extending StudyHub

How to add subjects, topics, interactions, visualizers and simulators **without changing the core application**. This is the contract for future content phases. Phases 2F (Linux), 2G (Computer Networks), 2H (System Design) and 2I (Operating Systems) followed it without any core app change (2H and 2I added only their own modules in `js/simulators/` and `js/visualizers/` and their styles).

## A future content phase in six steps

1. **Content** — write Markdown under `content/<category>/[<subcategory>/]<slug>/` following [content-guide.md](content-guide.md).
2. **Metadata** — fill `metadata/topics/<category>.json`; add subcategories (and optional `studyModes`) in `metadata/categories.json`.
3. **Register interactions** — add `metadata/interactions/<category>.json` and point the category's `interactions` field at it.
4. **Add subject-specific modules** — new visualizers/simulators in `js/visualizers/` or `js/simulators/`, built on `js/engagement/stepper.js`.
5. **Announce** — add an entry at the top of `metadata/updates.json` (see "Add an update" below).
6. **Validate** — JSON Schemas, consistency rules (content-guide §6), and a run through a local static server with the browser console open.

No change to `app.js`, the views, the router or the engines is needed for any of these.

## Add a subject

A category can be registered before it has content (`metadata/topics/<id>.json` with `"topics": []`); the dashboard then shows it as **Coming soon**, and it becomes available automatically as soon as its catalog has a published topic (System Design went through exactly this). To add another subject: content-guide §7 "A new category". Give the category a `group` (one of the `groups` ids in `categories.json`: `foundation`, `computer-science`, `development`, `architecture` — add a group there if none fits) and an `icon`: a 24×24 single-colour stroke SVG at `assets/icons/subjects/<id>.svg`. The app paints it with the theme colour through a CSS mask, so the SVG's own colour does not matter. The sidebar, dashboard cards and subject page pick both up automatically.

## Add a topic

content-guide §7 "A new topic". The topic appears in navigation, search, sessions and progress once its metadata entry is `published`.

## Add an update ("What's new")

Add an entry at the **top** of the `updates` array in `metadata/updates.json` (newest first; schema: `metadata/schemas/updates.schema.json`). The System Design phase's entry, for example (counts taken from the metadata):

```json
{
  "id": "2026-10-07-system-design",
  "date": "2026-10-07",
  "title": "System Design",
  "description": "82 topics in 11 modules — from requirements and estimation to caching, replication, sharding, CAP, reliability, messaging and four case studies — with 23 interactive simulations, 22 checks, comparisons and flashcard decks, an interview simulator, Revision and Quick Revision.",
  "type": "content",
  "link": "#/c/system-design"
}
```

- `id` is permanent and unique (date + slug): the app remembers seen updates by id, so never reuse or rename one.
- `type`: `content`, `revision`, `interaction`, `ui`, `bugfix` or `improvement`.
- `link` (optional) is an in-app hash route.
- Numbers in `description` must come from the metadata (count topics, modules, interactions) — never estimates.

Readers who have used StudyHub before see a badge on the header menu and the new entry under What's new. There is no network check; the list is whatever is deployed.

## Add a data-driven interaction (no code)

Add an entry to `metadata/interactions/<category>.json`:

```json
{
  "id": "tcp-handshake-check",
  "type": "knowledge-check",
  "title": "Check yourself: the handshake",
  "topics": [{ "topic": "tcp-connection", "after": "Core Concept" }],
  "questions": [
    { "prompt": "Which segment does the client send first?", "options": ["SYN", "SYN-ACK", "ACK", "FIN"], "answer": 0, "explanation": "…" }
  ]
}
```

Types: `knowledge-check` (`questions`; add `code` for predict-the-output), `flashcards` (`cards`), `comparison` (`columns`, `rows`). Template: [templates/metadata/interaction.json](../templates/metadata/interaction.json). Every answer and explanation must be verified like any other content.

## Add a visualizer or simulator

1. Create `js/visualizers/<id>.js` (or `js/simulators/<id>.js`). Use an id from [visualizers.md](visualizers.md) where one exists.
2. Export `mount(root, { interaction, options, topic })`, build the input form, and drive it with the step engine:

```js
import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';

export function mount(root, { options }) {
  const count = el('input', { class: 'input', type: 'number', value: options.requests ?? 10 });
  root.append(el('div', { class: 'viz-form' }, field('Requests', count)));
  const stage = el('div', { class: 'viz-stage' });
  root.append(stage);

  const stepper = createStepper(root, {
    render(frame) { stage.textContent = JSON.stringify(frame.servers); },
    nextLabel: 'Next request',
  });

  const first = { servers: [0, 0, 0], sent: 0, text: 'No requests yet.' };
  // Lazy: compute one step at a time; return null when finished.
  stepper.load(first, (frame) => {
    if (frame.sent >= Number(count.value)) return null;
    const target = frame.sent % 3;                 // round robin
    const servers = frame.servers.slice();
    servers[target]++;
    return { servers, sent: frame.sent + 1, text: `Request ${frame.sent + 1} → server ${target + 1} (round robin).` };
  });
  return stepper;                                   // has destroy()
}
```

3. Register it with `"type": "visualizer"` or `"simulator"` (add `"module"` when several entries share one module, and per-topic `options`).
4. Add its styles to section 8 of `styles.css` using tokens only.

Rules: the lesson must be complete without the interaction; every step has a text explanation (`text`); controls stay keyboard-operable; no external requests; respect `prefers-reduced-motion`; clean up timers in `destroy()`.

Existing modules to copy from: `js/simulators/http-request-lifecycle.js` (scenario inputs + lazy state machine — the pattern for network and system-design simulations), `js/simulators/linux-troubleshooting-simulator.js` (one module shared by several interactions through `options`, with learner choices replayed on the stepper), `js/simulators/signal-simulator.js` (frames rebuilt from a user-built event history), `js/simulators/tcp-connection-simulator.js` with `js/simulators/network-common.js` (protocol message sequences: actors, states and a message log), `js/simulators/network-troubleshooting-simulator.js` (reuses the Linux troubleshooting state machine with new scenarios), `js/visualizers/sorting-visualizer.js` (precomputed frames), `js/visualizers/tree-traversal.js` (SVG drawing), `js/simulators/cpu-scheduling-simulator.js` with `js/simulators/os-common.js` (an editable input table, and the algorithm kept in a DOM-free module so the same code can check the lessons' numbers with Node).

## Three.js

Use only where 3D adds understanding. Import `../../assets/vendor/three-0.170.0/three.module.min.js` lazily from the module that needs it, render only while visible, and dispose the renderer in `destroy()` (see `js/three/knowledge-map.js`).
