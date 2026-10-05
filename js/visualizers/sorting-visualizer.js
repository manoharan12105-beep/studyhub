// Sorting, one comparison or move per step, for the comparison sorts taught in
// the DSA module. Equal values get letters (5ᵃ, 5ᵇ) so stability is visible:
// a stable sort keeps 5ᵃ before 5ᵇ.
//
// Each algorithm is written as plain code that calls compare()/swap()/write();
// those helpers record a frame (array snapshot + explanation) for the stepper.

import { el } from '../util.js';
import { createStepper, field, parseNumberList, errorLine } from '../engagement/stepper.js';

const ALGORITHMS = {
  bubble: { label: 'Bubble sort', stable: true, run: bubble },
  selection: { label: 'Selection sort', stable: false, run: selection },
  insertion: { label: 'Insertion sort', stable: true, run: insertion },
  merge: { label: 'Merge sort', stable: true, run: merge },
  quick: { label: 'Quick sort (Lomuto, last element as pivot)', stable: false, run: quick },
  heap: { label: 'Heap sort', stable: false, run: heap },
};
const SUPERSCRIPT = ['ᵃ', 'ᵇ', 'ᶜ', 'ᵈ', 'ᵉ', 'ᶠ'];

export function mount(root, { options }) {
  const arrayInput = el('input', { class: 'input', value: options.array || '5, 2, 8, 5, 1, 9, 3, 6' });
  const algoSelect = el('select', { class: 'select' }, Object.entries(ALGORITHMS).map(([v, a]) => el('option', { value: v }, a.label)));
  algoSelect.value = ALGORITHMS[options.algorithm] ? options.algorithm : 'bubble';
  const run = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Apply');
  const shuffle = el('button', { type: 'button', class: 'btn btn-ghost' }, 'Random array');
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' },
    el('div', { class: 'field field-grow' }, field('Array (2–16 numbers)', arrayInput)),
    field('Algorithm', algoSelect), run, shuffle), error.node);

  const bars = el('div', { class: 'bars', 'aria-hidden': 'true' });
  const statLine = el('dl', { class: 'viz-stats' });
  root.append(el('div', { class: 'viz-stage' }, bars, statLine),
    el('ul', { class: 'viz-legend' },
      legend('is-compare', 'Being compared'), legend('is-swap', 'Moved / swapped'),
      legend('is-pivot', 'Pivot / key'), legend('is-sorted', 'In final position')));
  const stepper = createStepper(root, { render, playDelay: 700 });

  function start() {
    const values = parseNumberList(arrayInput.value, { min: 2, max: 16 });
    if (!values) { error.show('Enter 2–16 numbers separated by commas.'); return; }
    error.clear();
    const seen = new Map();
    const items = values.map((v) => {
      const count = seen.get(v) || 0;
      seen.set(v, count + 1);
      return { v, tag: count };
    });
    // Only label duplicates, so unique values stay uncluttered.
    for (const item of items) item.label = `${item.v}${seen.get(item.v) > 1 ? SUPERSCRIPT[item.tag] || '' : ''}`;
    const algo = ALGORITHMS[algoSelect.value];
    const frames = record(items, algo);
    stepper.load(frames[0], frames.slice(1));
  }

  function render(frame) {
    const max = Math.max(...frame.items.map((i) => Math.abs(i.v)), 1);
    bars.replaceChildren(...frame.items.map((item, i) => {
      const classes = ['bar'];
      if (frame.sorted.includes(i)) classes.push('is-sorted');
      if (frame.pivot === i) classes.push('is-pivot');
      if (frame.compare?.includes(i)) classes.push('is-compare');
      if (frame.moved?.includes(i)) classes.push('is-swap');
      if (frame.range && (i < frame.range[0] || i > frame.range[1])) classes.push('is-dim');
      return el('div', { class: classes.join(' ') },
        el('span', { class: 'bar-fill', style: `height:${Math.max(6, (Math.abs(item.v) / max) * 100)}%` }),
        el('span', { class: 'bar-label' }, item.label));
    }));
    statLine.replaceChildren(
      stat('Comparisons', frame.comparisons), stat('Swaps / writes', frame.moves),
      stat('Array', frame.items.map((i) => i.label).join(' ')));
  }

  run.addEventListener('click', start);
  arrayInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  algoSelect.addEventListener('change', start);
  shuffle.addEventListener('click', () => {
    const n = 8 + Math.floor(Math.random() * 3);
    arrayInput.value = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 12)).join(', ');
    start();
  });
  start();
  return stepper;
}

function legend(cls, label) {
  return el('li', {}, el('span', { class: `swatch ${cls}` }), label);
}

function stat(label, value) {
  return el('div', {}, el('dt', {}, `${label}:`), el('dd', {}, String(value)));
}

/** Runs an algorithm against recording helpers and returns its frames. */
function record(input, algo) {
  const a = input.slice();
  const frames = [];
  const sorted = new Set();
  let comparisons = 0;
  let moves = 0;
  const snap = (text, extra = {}) => frames.push({
    items: a.slice(), sorted: [...sorted], comparisons, moves, text, ...extra,
  });

  const ops = {
    a,
    snap,
    sorted,
    /** Compare a[i] with a[j] (or with a value); returns a[i].v - other. */
    compare(i, j, text, extra) {
      comparisons++;
      snap(text, { compare: [i, j].filter((x) => x !== null && x !== undefined), ...extra });
    },
    swap(i, j, text, extra) {
      [a[i], a[j]] = [a[j], a[i]];
      moves++;
      snap(text, { moved: [i, j], ...extra });
    },
    write(i, item, text, extra) {
      a[i] = item;
      moves++;
      snap(text, { moved: [i], ...extra });
    },
    lbl: (i) => a[i].label,
  };

  snap(`${algo.label}. ${algo.stable ? 'Stable' : 'Not stable'}: ${algo.stable ? 'equal values keep their order (ᵃ stays before ᵇ).' : 'equal values may change order — watch the letters.'} Press Next.`);
  algo.run(ops);
  for (let i = 0; i < a.length; i++) sorted.add(i);
  snap(`Sorted with ${comparisons} comparisons and ${moves} swaps/writes.${algo.stable ? '' : ' Check the lettered duplicates: this algorithm does not promise to keep them in order.'}`);
  return frames;
}

function bubble({ a, compare, swap, sorted, snap, lbl }) {
  const n = a.length;
  for (let end = n - 1; end > 0; end--) {
    let swapped = false;
    for (let j = 0; j < end; j++) {
      const bigger = a[j].v > a[j + 1].v;
      compare(j, j + 1, `Compare neighbours ${lbl(j)} and ${lbl(j + 1)}: ${bigger ? 'out of order' : 'in order (equal values are never swapped — that keeps it stable)'}.`);
      if (bigger) {
        swap(j, j + 1, `Swap them, so the larger value moves right.`);
        swapped = true;
      }
    }
    sorted.add(end);
    snap(`Pass done: ${lbl(end)} has bubbled to its final position ${end}.`);
    if (!swapped) {
      snap('This pass made no swaps, so the array is already sorted — early exit (this is why bubble sort is O(n) on sorted input).');
      return;
    }
  }
}

function selection({ a, compare, swap, sorted, snap, lbl }) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      const smaller = a[j].v < a[min].v;
      compare(j, min, `Scan for the minimum of positions ${i}..${n - 1}: is ${lbl(j)} < current minimum ${lbl(min)}? ${smaller ? 'Yes — new minimum.' : 'No.'}`, { pivot: min });
      if (smaller) min = j;
    }
    if (min !== i) swap(i, min, `Swap the minimum ${lbl(min)} into position ${i}. This long-distance swap can jump over an equal value — why selection sort is not stable.`);
    else snap(`${lbl(i)} is already the minimum; nothing to swap.`);
    sorted.add(i);
  }
}

function insertion({ a, compare, swap, snap, lbl }) {
  const n = a.length;
  snap(`Position 0 alone is a sorted prefix. Each step inserts the next value into it.`);
  for (let i = 1; i < n; i++) {
    let j = i;
    snap(`Take key ${lbl(i)} and insert it into the sorted prefix [0..${i - 1}].`, { pivot: i });
    while (j > 0) {
      const bigger = a[j - 1].v > a[j].v;
      compare(j - 1, j, `${lbl(j - 1)} > key ${lbl(j)}? ${bigger ? 'Yes — shift it right.' : 'No — the key stops here (equal values are not passed, so it stays stable).'}`, { pivot: j });
      if (!bigger) break;
      swap(j - 1, j, `Shifted ${lbl(j - 1)} right; the key moves to position ${j - 1}.`, { pivot: j - 1 });
      j--;
    }
  }
}

function merge({ a, compare, write, snap }) {
  const aux = a.slice();
  function sort(lo, hi) {
    if (lo >= hi) return;
    const mid = lo + Math.floor((hi - lo) / 2);
    sort(lo, mid);
    sort(mid + 1, hi);
    for (let k = lo; k <= hi; k++) aux[k] = a[k];
    snap(`Merge the sorted halves [${lo}..${mid}] and [${mid + 1}..${hi}].`, { range: [lo, hi] });
    let i = lo;
    let j = mid + 1;
    for (let k = lo; k <= hi; k++) {
      if (i > mid) write(k, aux[j++], `Left half used up: copy ${aux[j - 1].label} from the right.`, { range: [lo, hi] });
      else if (j > hi) write(k, aux[i++], `Right half used up: copy ${aux[i - 1].label} from the left.`, { range: [lo, hi] });
      else {
        const takeLeft = aux[i].v <= aux[j].v;
        compare(null, null, `Compare ${aux[i].label} (left) with ${aux[j].label} (right): take the ${takeLeft ? 'left' : 'right'} one${takeLeft && aux[i].v === aux[j].v ? ' — on a tie the left wins, which keeps merge sort stable' : ''}.`, { range: [lo, hi] });
        if (takeLeft) write(k, aux[i++], `Write ${aux[i - 1].label} to position ${k}.`, { range: [lo, hi] });
        else write(k, aux[j++], `Write ${aux[j - 1].label} to position ${k}.`, { range: [lo, hi] });
      }
    }
  }
  sort(0, a.length - 1);
}

function quick({ a, compare, swap, sorted, snap, lbl }) {
  function sort(lo, hi) {
    if (lo > hi) return;
    if (lo === hi) { sorted.add(lo); return; }
    const pivot = a[hi];
    let i = lo;
    snap(`Partition [${lo}..${hi}] around the pivot ${pivot.label} (last element). i = ${lo} marks where the next smaller value goes.`, { pivot: hi, range: [lo, hi] });
    for (let j = lo; j < hi; j++) {
      const smaller = a[j].v < pivot.v;
      compare(j, hi, `${lbl(j)} < pivot ${pivot.label}? ${smaller ? `Yes — swap it into slot i = ${i}.` : 'No — leave it on the right side.'}`, { pivot: hi, range: [lo, hi] });
      if (smaller) {
        if (i !== j) swap(i, j, `Swapped ${lbl(j)} into the "smaller than pivot" region.`, { pivot: hi, range: [lo, hi] });
        else snap(`${lbl(i)} is already in slot ${i}.`, { pivot: hi, range: [lo, hi] });
        i++;
      }
    }
    swap(i, hi, `Put the pivot ${pivot.label} at index ${i}: everything left is smaller, everything right is ≥ — its final position.`, { pivot: i, range: [lo, hi] });
    sorted.add(i);
    sort(lo, i - 1);
    sort(i + 1, hi);
  }
  sort(0, a.length - 1);
}

function heap({ a, compare, swap, sorted, snap, lbl }) {
  const n = a.length;
  function siftDown(i, size) {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let largest = i;
      if (l < size) {
        compare(l, largest, `Sift down ${lbl(i)}: compare with its left child ${lbl(l)}.`, { range: [0, size - 1] });
        if (a[l].v > a[largest].v) largest = l;
      }
      if (r < size) {
        compare(r, largest, `Compare the right child ${lbl(r)} with the larger so far ${lbl(largest)}.`, { range: [0, size - 1] });
        if (a[r].v > a[largest].v) largest = r;
      }
      if (largest === i) {
        snap(`${lbl(i)} is at least as large as its children — heap property holds here.`, { range: [0, size - 1] });
        return;
      }
      swap(i, largest, `Swap the larger child ${lbl(largest)} up; continue sifting down from index ${largest}.`, { range: [0, size - 1] });
      i = largest;
    }
  }
  snap(`Phase 1: build a max-heap bottom-up — sift down every parent from index ${Math.floor(n / 2) - 1} to 0. (Children of i are 2i+1 and 2i+2.)`);
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) siftDown(i, n);
  snap(`Max-heap built: the largest value ${lbl(0)} is at the root (index 0). Phase 2: repeatedly move the root to the end.`);
  for (let end = n - 1; end > 0; end--) {
    swap(0, end, `Swap the maximum ${lbl(0)} to index ${end}; the heap shrinks to [0..${end - 1}].`);
    sorted.add(end);
    siftDown(0, end);
  }
}
