// Cache eviction policies: which entry leaves when the cache is full.
//
//   request sequence + capacity + policy → one frame per request:
//   the slots (ordered by the policy's notion of "next victim"), hit or miss,
//   and the evicted key. The last frame compares hit counts of every policy
//   on the same sequence, so the learner sees that no policy wins everywhere.

import { el } from '../util.js';
import { createStepper, errorLine, field } from '../engagement/stepper.js';
import { tableView } from '../simulators/network-common.js';
import { select, statsView } from '../simulators/system-design-common.js';

const POLICIES = {
  LRU: 'LRU — least recently used',
  LFU: 'LFU — least frequently used (ties: oldest)',
  FIFO: 'FIFO — first in, first out',
  MRU: 'MRU — most recently used',
};

export function mount(root, { options }) {
  const sequence = el('input', { class: 'input', type: 'text', value: options.sequence || 'A B C A D B E A', spellcheck: 'false' });
  const capacity = el('input', { class: 'input', type: 'number', min: 1, max: 6, value: options.capacity ?? 3, style: 'width:5rem' });
  const policy = select(POLICIES, options.policy || 'LRU');
  const error = errorLine();
  const sequenceField = field('Requested keys (letters or numbers)', sequence, 'Separate with spaces; up to 20 requests.');
  sequenceField.classList.add('field-grow');
  root.append(el('div', { class: 'viz-form' }, sequenceField, field('Capacity', capacity), field('Policy', policy)), error.node);

  const slots = el('ol', { class: 'sd-slots', 'aria-label': 'Cache slots, next victim first' });
  const stats = statsView('Hits and misses');
  const compare = tableView('Same sequence under every policy', ['Policy', 'Hits', 'Misses', 'Final contents']);
  root.append(el('div', { class: 'viz-stage' }, el('p', { class: 'tree-side-title' }, 'Cache slots — next victim on the left'), slots, stats.node, compare.node));
  const stepper = createStepper(root, { render, playDelay: 1100, nextLabel: 'Next request' });

  function render(frame) {
    slots.replaceChildren(...(frame.order.length ? frame.order.map((e) => el('li', {
      class: ['sd-slot', e.key === frame.hit ? 'is-hit' : '', e.key === frame.inserted ? 'is-new' : ''].join(' '),
    }, el('strong', {}, e.key), el('span', {}, `uses ${e.f}`))) : [el('li', { class: 'sd-slot is-empty' }, 'empty')]),
    ...(frame.evicted ? [el('li', { class: 'sd-slot is-out' }, el('strong', {}, frame.evicted), el('span', {}, 'evicted'))] : []));
    stats.render([['Requests', frame.i], ['Hits', frame.hits], ['Misses', frame.misses]]);
    compare.node.hidden = !frame.summary;
    if (frame.summary) compare.render(frame.summary, { rowClass: (row) => (row[0] === frame.policy ? 'is-current' : '') });
  }

  function start() {
    error.clear();
    const keys = sequence.value.trim().split(/\s+/).filter(Boolean);
    const cap = Number(capacity.value);
    if (!keys.length || keys.length > 20 || keys.some((k) => k.length > 4)) {
      error.show('Enter between 1 and 20 keys (each up to 4 characters), separated by spaces.');
      return;
    }
    if (!Number.isInteger(cap) || cap < 1 || cap > 6) {
      error.show('Capacity must be a whole number from 1 to 6.');
      return;
    }
    const frames = run(keys, cap, policy.value);
    const summary = Object.keys(POLICIES).map((p) => {
      const last = run(keys, cap, p).at(-1);
      return [p, String(last.hits), String(last.misses), last.order.map((e) => e.key).sort().join(', ')];
    });
    frames[frames.length - 1].summary = summary;
    frames[frames.length - 1].text += ' The table compares every policy on this sequence.';
    stepper.load(frames[0], frames.slice(1));
  }

  for (const c of [sequence, capacity]) c.addEventListener('change', start);
  policy.addEventListener('change', start);
  start();
  return stepper;
}

/** Simulate a policy; frames list entries ordered by "next victim first". */
export function run(keys, capacity, policy) {
  let cache = [];   // { key, last, ins, f }
  let hits = 0;
  let misses = 0;
  const frames = [{ i: 0, order: [], hits, misses, policy, text: `${POLICIES[policy]}, capacity ${capacity}. Press "Next request".` }];
  keys.forEach((key, index) => {
    const tick = index + 1;
    const found = cache.find((e) => e.key === key);
    let evicted = null;
    let text;
    if (found) {
      hits += 1;
      found.last = tick;
      found.f += 1;
      text = `Request ${tick}: ${key} → HIT.`;
    } else {
      misses += 1;
      if (cache.length >= capacity) {
        const victim = victimOf(cache, policy);
        evicted = victim.key;
        cache = cache.filter((e) => e !== victim);
      }
      cache.push({ key, last: tick, ins: tick, f: 1 });
      text = `Request ${tick}: ${key} → MISS, loaded from the database.${evicted ? ` Cache full: ${policy} evicts ${evicted} (${reason(policy)}).` : ''}`;
    }
    frames.push({ i: tick, order: ordered(cache, policy).map((e) => ({ ...e })), hits, misses, policy, hit: found ? key : null, inserted: found ? null : key, evicted, text });
  });
  return frames;
}

function victimOf(cache, policy) {
  return ordered(cache, policy)[0];
}

function ordered(cache, policy) {
  const list = cache.slice();
  if (policy === 'LRU') list.sort((a, b) => a.last - b.last);
  else if (policy === 'MRU') list.sort((a, b) => b.last - a.last);
  else if (policy === 'LFU') list.sort((a, b) => a.f - b.f || a.ins - b.ins);
  else list.sort((a, b) => a.ins - b.ins);
  return list;
}

function reason(policy) {
  return {
    LRU: 'it was used longest ago',
    MRU: 'it was used most recently',
    LFU: 'it has the fewest uses; ties go to the oldest',
    FIFO: 'it was inserted first',
  }[policy];
}
