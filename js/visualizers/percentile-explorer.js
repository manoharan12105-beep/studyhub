// Latency percentiles vs the average.
//
//   response times → sort → average → P50 → P90 → P95 → P99,
//   each marked on the sorted bars with its nearest-rank position, so the learner
//   sees how a few slow requests move the average but not the median, and what
//   the tail looks like.

import { el } from '../util.js';
import { createStepper, errorLine, field, parseNumberList } from '../engagement/stepper.js';
import { statsView } from '../simulators/system-design-common.js';

const MARKS = [['P50', 50], ['P90', 90], ['P95', 95], ['P99', 99]];

/** Nearest-rank percentile on a sorted array: the value at position ceil(p/100 × n). */
export function percentile(sorted, p) {
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)];
}

export function mount(root, { options }) {
  const input = el('input', { class: 'input', type: 'text', value: options.values || '1, 2, 2, 3, 4, 4, 5, 8, 12, 27', spellcheck: 'false' });
  const error = errorLine();
  const inputField = field('Response times (seconds or ms)', input, '2 to 40 numbers, separated by commas or spaces.');
  inputField.classList.add('field-grow');
  root.append(el('div', { class: 'viz-form' }, inputField), error.node);

  const cols = el('ol', { class: 'sd-cols', 'aria-label': 'Sorted response times' });
  const stats = statsView('Summary statistics');
  root.append(el('div', { class: 'viz-stage' }, cols, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1500, nextLabel: 'Next step' });

  function render(frame) {
    const max = Math.max(...frame.sorted);
    cols.replaceChildren(...frame.sorted.map((v, i) => {
      const tag = frame.marks.filter((m) => m.index === i).map((m) => m.name).join(' · ');
      return el('li', { class: ['sd-col', tag ? 'is-marked' : '', frame.focus === i ? 'is-current' : '', v > frame.avg && frame.showAvg ? 'is-above' : ''].join(' ') },
        el('span', { class: 'sd-col-bar', style: `height:${Math.max(4, Math.round((v / max) * 100))}%`, 'aria-hidden': 'true' }),
        el('span', { class: 'sd-col-value' }, String(v)),
        el('span', { class: 'sd-col-tag' }, tag || ' '));
    }));
    stats.render([
      ['Requests', frame.sorted.length],
      ['Average', frame.showAvg ? round(frame.avg) : '—'],
      ...MARKS.map(([name]) => [name, frame.values[name] ?? '—']),
    ]);
  }

  function start() {
    error.clear();
    const values = parseNumberList(input.value, { min: 2, max: 40 });
    if (!values || values.some((v) => v < 0)) {
      error.show('Enter between 2 and 40 non-negative numbers.');
      return;
    }
    const sorted = values.slice().sort((a, b) => a - b);
    const n = sorted.length;
    const avg = sorted.reduce((a, b) => a + b, 0) / n;
    const frames = [{ sorted, avg, marks: [], values: {}, showAvg: false, focus: null, text: `${n} response times, sorted from fastest to slowest. Percentiles are read from this sorted list.` }];
    const above = sorted.filter((v) => v > avg).length;
    frames.push({ sorted, avg, marks: [], values: {}, showAvg: true, focus: null, text: `Average = sum ÷ count = ${round(avg)}. Only ${above} of ${n} requests are slower than the average — a few large values pull it up, so it describes almost no real request.` });
    const values2 = {};
    const marks = [];
    for (const [name, p] of MARKS) {
      const index = Math.max(0, Math.ceil((p / 100) * n) - 1);
      values2[name] = sorted[index];
      marks.push({ name, index });
      frames.push({
        sorted, avg, marks: marks.slice(), values: { ...values2 }, showAvg: true, focus: index,
        text: `${name}: position ceil(${p / 100} × ${n}) = ${index + 1} → ${sorted[index]}. ${p}% of requests took ${sorted[index]} or less.${p === 50 ? ' This is the typical experience.' : p >= 95 && n < 100 ? ` With only ${n} samples, high percentiles land on the slowest few values — they need many more requests to be meaningful.` : ''}`,
      });
    }
    frames.push({
      sorted, avg, marks, values: values2, showAvg: true, focus: null,
      text: `Summary: average ${round(avg)}, P50 ${values2.P50}, P90 ${values2.P90}, P99 ${values2.P99}. ${values2.P90 > 2 * values2.P50 ? 'A big gap between P50 and P90 means a group of slow requests worth investigating. ' : ''}Report and alert on percentiles, not the average.`,
    });
    stepper.load(frames[0], frames.slice(1));
  }

  input.addEventListener('change', start);
  start();
  return stepper;
}

function round(v) {
  return Math.round(v * 100) / 100;
}
