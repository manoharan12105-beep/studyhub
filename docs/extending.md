# Extending StudyHub

How to add subjects, topics, interactions, visualizers and simulators **without changing the core application**. This is the contract for future content phases (2H System Design and later). Phases 2F (Linux) and 2G (Computer Networks) followed it without any core app change.

## A future content phase in five steps

1. **Content** — write Markdown under `content/<category>/[<subcategory>/]<slug>/` following [content-guide.md](content-guide.md).
2. **Metadata** — fill `metadata/topics/<category>.json`; add subcategories (and optional `studyModes`) in `metadata/categories.json`.
3. **Register interactions** — add `metadata/interactions/<category>.json` and point the category's `interactions` field at it.
4. **Add subject-specific modules** — new visualizers/simulators in `js/visualizers/` or `js/simulators/`, built on `js/engagement/stepper.js`.
5. **Validate** — JSON Schemas, consistency rules (content-guide §6), and a run through a local static server with the browser console open.

No change to `app.js`, the views, the router or the engines is needed for any of these.

## Add a subject

System Design is already registered as an empty category (`metadata/topics/<id>.json` with `"topics": []`), so the dashboard shows it as **Coming soon**. A subject becomes available automatically as soon as its catalog has a published topic. To add another subject: content-guide §7 "A new category".

## Add a topic

content-guide §7 "A new topic". The topic appears in navigation, search, sessions and progress once its metadata entry is `published`.

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

Existing modules to copy from: `js/simulators/http-request-lifecycle.js` (scenario inputs + lazy state machine — the pattern for network and system-design simulations), `js/simulators/linux-troubleshooting-simulator.js` (one module shared by several interactions through `options`, with learner choices replayed on the stepper), `js/simulators/signal-simulator.js` (frames rebuilt from a user-built event history), `js/simulators/tcp-connection-simulator.js` with `js/simulators/network-common.js` (protocol message sequences: actors, states and a message log), `js/simulators/network-troubleshooting-simulator.js` (reuses the Linux troubleshooting state machine with new scenarios), `js/visualizers/sorting-visualizer.js` (precomputed frames), `js/visualizers/tree-traversal.js` (SVG drawing).

## Three.js

Use only where 3D adds understanding. Import `../../assets/vendor/three-0.170.0/three.module.min.js` lazily from the module that needs it, render only while visible, and dispose the renderer in `destroy()` (see `js/three/knowledge-map.js`).
