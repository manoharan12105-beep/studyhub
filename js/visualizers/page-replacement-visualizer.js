// FIFO, LRU and Optimal page replacement, reference by reference.
//
//   reference string + number of frames + policy → one frame per reference:
//   the frame table so far (one column per reference), hit or fault, the victim
//   and why it was chosen. The last frame compares all three policies with the
//   same frames and with one more frame, which exposes Belady's anomaly.
//
// The replacement logic is replacePages() in js/simulators/os-common.js.

import { el } from '../util.js';
import { createStepper, errorLine, field } from '../engagement/stepper.js';
import { select, tableView } from '../simulators/network-common.js';
import { statsView } from '../simulators/system-design-common.js';
import { replacePages } from '../simulators/os-common.js';

const POLICIES = {
  fifo: 'FIFO — oldest loaded',
  lru: 'LRU — least recently used',
  optimal: 'Optimal — used farthest ahead',
};
const NAMES = { fifo: 'FIFO', lru: 'LRU', optimal: 'Optimal' };

export function mount(root, { options }) {
  const refsInput = el('input', { class: 'input', type: 'text', value: options.refs || '2 3 1 2 3 4 2 3 5 1 2 3', spellcheck: 'false' });
  const frames = el('input', { class: 'input', type: 'number', min: 1, max: 6, value: options.frames ?? 3, style: 'width:5rem' });
  const policy = select(POLICIES, options.policy || 'fifo');
  const error = errorLine();
  const refsField = field('Reference string (page numbers 0–9)', refsInput, 'Separate with spaces; 1 to 24 references.');
  refsField.classList.add('field-grow');
  root.append(el('div', { class: 'viz-form' }, refsField, field('Frames', frames), field('Policy', policy)), error.node);

  const grid = el('table', { class: 'viz-table os-ref-grid' });
  const stats = statsView('Faults and hits');
  const compare = tableView('Same string under every policy', ['Policy', 'Faults', 'Faults with one more frame']);
  compare.node.classList.add('os-results');
  root.append(el('div', { class: 'viz-stage' },
    el('p', { class: 'tree-side-title' }, 'Frames after each reference'),
    el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'Frame table' }, grid),
    stats.node, compare.node));
  const stepper = createStepper(root, { render, playDelay: 1100, nextLabel: 'Next reference' });

  function render(frame) {
    const steps = frame.steps;
    const head = el('tr', {}, el('th', { scope: 'col' }, 'Reference'),
      ...steps.map((s, i) => el('th', { scope: 'col', class: i === steps.length - 1 ? 'os-col-current' : '' }, String(s.ref))));
    const frameRows = Array.from({ length: frame.count }, (_, r) => el('tr', {}, el('th', { scope: 'row' }, `Frame ${r + 1}`),
      ...steps.map((s, i) => el('td', {
        class: [i === steps.length - 1 ? 'os-col-current' : '', !s.hit && s.slot === r ? 'os-cell-loaded' : '', s.hit && s.slot === r ? 'os-cell-hit' : ''].join(' '),
      }, s.frames[r] === null ? '–' : String(s.frames[r])))));
    const result = el('tr', {}, el('th', { scope: 'row' }, 'Result'),
      ...steps.map((s, i) => el('td', { class: [i === steps.length - 1 ? 'os-col-current' : '', s.hit ? 'os-hit' : 'os-fault'].join(' ') },
        s.hit ? 'H' : (s.victim === null ? 'F' : `F −${s.victim}`))));
    grid.replaceChildren(el('thead', {}, head), el('tbody', {}, ...frameRows, result));
    const last = steps[steps.length - 1];
    stats.render([['References', steps.length], ['Faults', last ? last.faults : 0], ['Hits', last ? last.hits : 0],
      ['Fault rate', last ? `${Math.round((last.faults / steps.length) * 100)} %` : '—']]);
    compare.node.hidden = !frame.summary;
    if (frame.summary) compare.render(frame.summary, { rowClass: (row) => (row[0] === NAMES[frame.policy] ? 'is-current' : '') });
  }

  function start() {
    error.clear();
    const parts = refsInput.value.trim().split(/[\s,]+/).filter(Boolean);
    const refs = parts.map(Number);
    const count = Number(frames.value);
    if (!parts.length || parts.length > 24 || refs.some((n) => !Number.isInteger(n) || n < 0 || n > 9)) {
      error.show('Enter 1 to 24 page numbers from 0 to 9, separated by spaces.');
      return;
    }
    if (!Number.isInteger(count) || count < 1 || count > 6) {
      error.show('Frames must be a whole number from 1 to 6.');
      return;
    }
    const all = replacePages(refs, count, policy.value);
    const name = NAMES[policy.value];
    const framesList = all.map((s, i) => ({
      steps: all.slice(0, i + 1),
      count,
      policy: policy.value,
      text: s.hit
        ? `Reference ${i + 1}: page ${s.ref} is in frame ${s.slot + 1} → HIT.${policy.value === 'lru' ? ' It becomes the most recently used page.' : ''}`
        : s.victim === null
          ? `Reference ${i + 1}: page ${s.ref} is not in memory → PAGE FAULT. A frame is still free, so it is loaded into frame ${s.slot + 1}.`
          : `Reference ${i + 1}: page ${s.ref} is not in memory → PAGE FAULT. All frames are full; ${name} evicts page ${s.victim} from frame ${s.slot + 1} because ${s.reason}.`,
    }));
    const lastFrame = framesList[framesList.length - 1];
    lastFrame.summary = Object.keys(POLICIES).map((p) => [NAMES[p],
      String(replacePages(refs, count, p).at(-1).faults), String(replacePages(refs, count + 1, p).at(-1).faults)]);
    const fifoNow = replacePages(refs, count, 'fifo').at(-1).faults;
    const fifoMore = replacePages(refs, count + 1, 'fifo').at(-1).faults;
    lastFrame.text += ` Total: ${all.at(-1).faults} faults. The table compares all three policies.`
      + (fifoMore > fifoNow ? ` FIFO gets MORE faults with ${count + 1} frames (${fifoMore}) than with ${count} (${fifoNow}): Belady's anomaly.` : '');
    const first = { steps: [], count, policy: policy.value, text: `${NAMES[policy.value]} (${POLICIES[policy.value].split(" — ")[1]}), ${count} empty frames. Press "Next reference".` };
    stepper.load(first, framesList);
  }

  for (const c of [refsInput, frames]) c.addEventListener('change', start);
  policy.addEventListener('change', start);
  start();
  return stepper;
}
