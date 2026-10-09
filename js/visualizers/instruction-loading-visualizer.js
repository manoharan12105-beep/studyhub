// Instruction loading: in a two-module repository (orders/, billing/) with a root
// CLAUDE.md, a personal CLAUDE.local.md, an unscoped rule and a path-scoped rule,
// follow which instruction files are in context as the session starts, Claude reads
// files in different places, and /compact runs.
//
//   (start directory, event sequence) → loadedInstructions() → one frame per event
//
// A simplified model of the documented loading rules (launch directory and
// ancestors at start, other directories on demand, path rules with matching
// files, re-reads after compaction). A StudyHub visualizer.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { nodesView, select } from '../simulators/system-design-common.js';
import { INSTRUCTION_EVENTS, INSTRUCTION_FILES, START_DIRS, loadedInstructions } from '../simulators/claude-code-common.js';

const SEQUENCES = {
  migration: { label: 'Work on a migration, then compact', events: ['start', 'read-order', 'read-migration', 'compact', 'read-migration'] },
  crossing: { label: 'Wander into another module', events: ['start', 'read-order', 'read-billing', 'compact'] },
};

export function mount(root, { options }) {
  const start = select(START_DIRS, options.start || 'root');
  const sequence = select(Object.fromEntries(Object.entries(SEQUENCES).map(([k, v]) => [k, v.label])), options.sequence || 'migration');
  root.append(el('div', { class: 'viz-form' }, field('Start Claude in', start), field('Session', sequence)));

  const files = nodesView('Instruction files');
  const status = el('p', { class: 'flow-status' });
  root.append(el('div', { class: 'viz-stage' }, files.node, status));
  const stepper = createStepper(root, { render, playDelay: 1800, nextLabel: 'Next event' });

  function render(frame) {
    files.render(INSTRUCTION_FILES.map((f) => ({
      title: f.path,
      lines: [frame.loaded.has(f.id) ? 'in context' : 'not loaded'],
      state: frame.loaded.has(f.id) ? (frame.fresh.has(f.id) ? 'current' : 'ok') : 'idle',
    })));
    status.textContent = frame.event ? INSTRUCTION_EVENTS[frame.event] : 'Before the session';
  }

  function run() {
    const events = SEQUENCES[sequence.value].events;
    const steps = loadedInstructions(start.value, events);
    const first = { event: null, loaded: new Set(), fresh: new Set(), text: `Claude will start in ${START_DIRS[start.value]}. Press "Next event".` };
    let previous = new Set();
    const frames = steps.map((s) => {
      const fresh = new Set([...s.loaded].filter((id) => !previous.has(id)));
      previous = s.loaded;
      return { event: s.event, loaded: s.loaded, fresh, text: s.note };
    });
    stepper.load(first, frames);
  }

  start.addEventListener('change', run);
  sequence.addEventListener('change', run);
  run();
  return stepper;
}
