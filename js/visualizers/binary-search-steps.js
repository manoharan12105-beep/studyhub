// Binary search, one comparison per step: lo / mid / hi over a sorted array,
// with the discarded part greyed out. Three modes match the lesson:
// classic exact search (lo ≤ hi) and the half-open boundary template
// (lower bound: first a[i] ≥ x, upper bound: first a[i] > x).

import { el } from '../util.js';
import { createStepper, field, parseNumberList, errorLine } from '../engagement/stepper.js';

const MODES = {
  exact: 'Find the target (classic)',
  lower: 'Lower bound: first element ≥ target',
  upper: 'Upper bound: first element > target',
};

export function mount(root, { options }) {
  const arrayInput = el('input', { class: 'input', value: options.array || '1, 3, 5, 7, 7, 7, 9, 11', inputmode: 'numeric' });
  const targetInput = el('input', { class: 'input', type: 'number', value: options.target ?? 7, style: 'width:7rem' });
  const modeSelect = el('select', { class: 'select' }, Object.entries(MODES).map(([v, l]) => el('option', { value: v }, l)));
  modeSelect.value = options.mode || 'exact';
  const run = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Apply');
  const error = errorLine();
  const form = el('div', { class: 'viz-form' },
    el('div', { class: 'field field-grow' }, field('Sorted array (up to 16 numbers)', arrayInput)),
    field('Target', targetInput), field('Search', modeSelect), run);

  const cells = el('div', { class: 'cells' });
  const stats = el('p', { class: 'viz-note' });
  const stage = el('div', { class: 'viz-stage' }, cells, stats);
  root.append(form, error.node, stage);
  const stepper = createStepper(root, { render });

  function start() {
    let values = parseNumberList(arrayInput.value, { min: 1, max: 16 });
    const target = Number(targetInput.value);
    if (!values || !Number.isFinite(target) || targetInput.value === '') {
      error.show('Enter 1–16 numbers separated by commas, and a numeric target.');
      return;
    }
    error.clear();
    const sorted = values.slice().sort((a, b) => a - b);
    if (sorted.some((v, i) => v !== values[i])) {
      values = sorted;
      arrayInput.value = values.join(', ');
      error.show('Binary search needs a sorted array, so the input was sorted first.');
    }
    const frames = modeSelect.value === 'exact' ? exactFrames(values, target) : boundaryFrames(values, target, modeSelect.value);
    stepper.load(frames[0], frames.slice(1));
  }

  function render(frame) {
    const n = frame.values.length;
    const boundary = frame.mode !== 'exact';
    const list = frame.values.map((v, i) => {
      const inRange = boundary ? i >= frame.lo && i < frame.hi : i >= frame.lo && i <= frame.hi;
      const classes = ['cell'];
      if (!inRange && !frame.done) classes.push('is-out');
      if (i === frame.mid && !frame.done) classes.push('is-current');
      if (frame.done && i === frame.result) classes.push('is-found');
      const markers = [];
      if (!frame.done || boundary) {
        if (i === frame.lo) markers.push('lo');
        if (i === frame.mid && !frame.done) markers.push('mid');
        if (i === frame.hi) markers.push('hi');
      }
      return el('div', { class: classes.join(' ') },
        el('span', { class: 'cell-value' }, String(v)),
        el('span', { class: 'cell-index' }, String(i)),
        el('span', { class: 'cell-markers' }, markers.join(' ')));
    });
    if (boundary) {
      // Index n is a valid answer in the half-open template ("no such element").
      const markers = [];
      if (frame.lo === n) markers.push('lo');
      if (frame.hi === n) markers.push('hi');
      list.push(el('div', { class: `cell cell-end ${frame.done && frame.result === n ? 'is-found' : ''}` },
        el('span', { class: 'cell-value' }, 'end'), el('span', { class: 'cell-index' }, String(n)), el('span', { class: 'cell-markers' }, markers.join(' '))));
    }
    cells.replaceChildren(...list);
    stats.textContent = `Comparisons so far: ${frame.comparisons}  ·  Range size: ${Math.max(0, boundary ? frame.hi - frame.lo : frame.hi - frame.lo + 1)}`;
  }

  run.addEventListener('click', start);
  for (const input of [arrayInput, targetInput]) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  modeSelect.addEventListener('change', start);
  start();
  return stepper;
}

function exactFrames(values, target) {
  const frames = [];
  let lo = 0;
  let hi = values.length - 1;
  let comparisons = 0;
  const base = { values, mode: 'exact' };
  frames.push({ ...base, lo, hi, mid: -1, comparisons, text: `Start: the target ${target}, if present, is somewhere in [lo, hi] = [0, ${hi}].` });
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    comparisons++;
    const v = values[mid];
    const head = `mid = ${lo} + (${hi} − ${lo}) / 2 = ${mid}; a[${mid}] = ${v}.`;
    if (v === target) {
      frames.push({ ...base, lo, hi, mid, comparisons, text: `${head} ${v} = ${target}: found at index ${mid}.` });
      frames.push({ ...base, lo, hi, mid, comparisons, done: true, result: mid, text: `Found ${target} at index ${mid} after ${comparisons} comparison${comparisons === 1 ? '' : 's'} (at most ⌊log₂ n⌋ + 1 = ${Math.floor(Math.log2(values.length)) + 1}).` });
      return frames;
    }
    if (v < target) {
      frames.push({ ...base, lo, hi, mid, comparisons, text: `${head} ${v} < ${target}, so the target can only be right of mid: lo = mid + 1 = ${mid + 1}.` });
      lo = mid + 1;
    } else {
      frames.push({ ...base, lo, hi, mid, comparisons, text: `${head} ${v} > ${target}, so the target can only be left of mid: hi = mid − 1 = ${mid - 1}.` });
      hi = mid - 1;
    }
  }
  frames.push({ ...base, lo, hi, mid: -1, comparisons, done: true, result: -1, text: `lo (${lo}) > hi (${hi}): the range is empty, so ${target} is not in the array — return −1. lo = ${lo} is where it would be inserted.` });
  return frames;
}

function boundaryFrames(values, target, mode) {
  const frames = [];
  const n = values.length;
  const holds = mode === 'lower' ? (v) => v >= target : (v) => v > target;
  const cond = mode === 'lower' ? `a[i] ≥ ${target}` : `a[i] > ${target}`;
  let lo = 0;
  let hi = n;
  let comparisons = 0;
  const base = { values, mode };
  frames.push({ ...base, lo, hi, mid: -1, comparisons, text: `Find the first index where ${cond}. Half-open range [lo, hi) = [0, ${n}); hi = ${n} means "no element qualifies".` });
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    comparisons++;
    const v = values[mid];
    const head = `mid = ${mid}, a[${mid}] = ${v}.`;
    if (holds(v)) {
      frames.push({ ...base, lo, hi, mid, comparisons, text: `${head} ${cond.replace('a[i]', String(v))} is true, so the answer is mid or to its left: hi = mid = ${mid}.` });
      hi = mid;
    } else {
      frames.push({ ...base, lo, hi, mid, comparisons, text: `${head} ${cond.replace('a[i]', String(v))} is false, so the answer is right of mid: lo = mid + 1 = ${mid + 1}.` });
      lo = mid + 1;
    }
  }
  const what = lo === n ? `no element satisfies ${cond}, so the answer is n = ${n}` : `the answer is index ${lo} (a[${lo}] = ${values[lo]})`;
  const extra = mode === 'lower'
    ? (lo < n && values[lo] === target ? ` It is also the first occurrence of ${target}.` : ` ${target} is not present; ${lo} is its insertion position.`)
    : (lo > 0 && values[lo - 1] === target ? ` So the last occurrence of ${target} is index ${lo} − 1 = ${lo - 1}.` : ` ${target} itself is not present.`);
  frames.push({ ...base, lo, hi, mid: -1, comparisons, done: true, result: lo, text: `lo = hi = ${lo}: ${what}.${extra} Comparisons: ${comparisons}.` });
  return frames;
}
