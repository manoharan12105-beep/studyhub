// CPU scheduling, one decision at a time.
//
//   processes (arrival, burst, priority) + algorithm + quantum → frames:
//   one frame per moment something happens (arrival, dispatch, preemption,
//   quantum expiry, completion), each with the Gantt chart so far, the CPU and
//   the ready queue, and the reason for the decision. The last frame adds the
//   completion, turnaround, waiting and response times and their averages.
//
// The scheduling itself is computed by os-common.js (the same code that
// checked the lesson examples); this module only edits inputs and draws.

import { el } from '../util.js';
import { createStepper, errorLine, field } from '../engagement/stepper.js';
import { select, tableView } from './network-common.js';
import { statsView } from './system-design-common.js';
import { ALGORITHMS, schedule } from './os-common.js';

const DEFAULT_PROCESSES = [['P1', 0, 5, 3], ['P2', 1, 3, 1], ['P3', 2, 8, 4], ['P4', 3, 6, 2]];
const MAX_PROCESSES = 6;
const MAX_TOTAL_BURST = 60;

export function mount(root, { options }) {
  const algorithm = select(ALGORITHMS, options.algorithm || 'fcfs');
  const quantum = el('input', { class: 'input', type: 'number', min: 1, max: 10, value: options.quantum ?? 2, style: 'width:5rem' });
  const quantumField = field('Quantum (Round Robin)', quantum);
  root.append(el('div', { class: 'viz-form' }, field('Algorithm', algorithm), quantumField));

  // Editable process table: one row of number inputs per process.
  let rows = (Array.isArray(options.processes) && options.processes.length ? options.processes : DEFAULT_PROCESSES)
    .slice(0, MAX_PROCESSES).map(([, at, bt, pr]) => [at, bt, pr ?? 1]);
  const body = el('tbody');
  const inputTable = el('table', { class: 'viz-table os-proc-table' },
    el('thead', {}, el('tr', {}, ['Process', 'Arrival', 'Burst', 'Priority'].map((h) => el('th', { scope: 'col' }, h)))), body);
  const addBtn = el('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, 'Add process');
  const removeBtn = el('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, 'Remove last');
  const error = errorLine();
  root.append(
    el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'Processes (editable)' }, inputTable),
    el('p', { class: 'viz-note' }, 'Priority: a lower number means a higher priority. Ties go to the earlier arrival, then the listed order.'),
    el('div', { class: 'os-row-actions' }, addBtn, removeBtn),
    error.node);

  const status = statsView('CPU and ready queue');
  const gantt = el('ol', { class: 'os-gantt', 'aria-label': 'Gantt chart so far' });
  const results = tableView('Results', ['Process', 'AT', 'BT', 'CT', 'TAT = CT − AT', 'WT = TAT − BT', 'RT']);
  const averages = statsView('Averages');
  results.node.classList.add('os-results');
  root.append(el('div', { class: 'viz-stage' },
    el('p', { class: 'tree-side-title' }, 'Gantt chart'), gantt, status.node, results.node, averages.node));
  const stepper = createStepper(root, { render, playDelay: 1400, nextLabel: 'Next event' });

  function drawInputs() {
    body.replaceChildren(...rows.map((row, i) => {
      const id = `P${i + 1}`;
      const cells = ['arrival time', 'burst time', 'priority'].map((name, k) => {
        const input = el('input', {
          class: 'input', type: 'number', value: row[k], min: k === 1 ? 1 : 0, max: k === 1 ? 20 : k === 0 ? 30 : 9,
          'aria-label': `${id} ${name}`,
        });
        input.addEventListener('change', () => { rows[i][k] = Number(input.value); start(); });
        return el('td', {}, input);
      });
      return el('tr', {}, el('th', { scope: 'row' }, id), ...cells);
    }));
    addBtn.disabled = rows.length >= MAX_PROCESSES;
    removeBtn.disabled = rows.length <= 1;
  }

  function render(frame) {
    status.render([['Time', frame.t], ['CPU', frame.running || 'idle'], ['Ready queue', frame.queue.length ? frame.queue.join(', ') : 'empty']]);
    gantt.replaceChildren(...(frame.slices.length ? frame.slices.map((s) => el('li', {
      class: ['os-gantt-seg', s.id ? `os-p${Number(s.id.slice(1)) - 1}` : 'is-idle'].join(' '),
      style: `flex-grow:${s.end - s.start}`,
    }, el('strong', {}, s.id || 'idle'), el('span', {}, `${s.start}–${s.end}`))) : [el('li', { class: 'os-gantt-seg is-empty' }, 'Nothing has run yet')]));
    results.node.hidden = !frame.summary;
    averages.node.hidden = !frame.summary;
    if (frame.summary) {
      results.render(frame.summary.results.map((r) => [r.id, r.at, r.bt, r.ct, r.tat, r.wt, r.rt].map(String)));
      const a = frame.summary.averages;
      averages.render([['Avg TAT', fmt(a.tat)], ['Avg WT', fmt(a.wt)], ['Avg RT', fmt(a.rt)], ['Context switches', frame.summary.switches]]);
    }
  }

  function start() {
    error.clear();
    quantumField.hidden = algorithm.value !== 'rr';
    const q = Number(quantum.value);
    const bad = rows.some(([at, bt, pr]) => ![at, bt, pr].every(Number.isInteger) || at < 0 || at > 30 || bt < 1 || bt > 20 || pr < 0 || pr > 9);
    if (bad) {
      error.show('Use whole numbers: arrival 0–30, burst 1–20, priority 0–9.');
      return;
    }
    if (rows.reduce((s, r) => s + r[1], 0) > MAX_TOTAL_BURST) {
      error.show(`Keep the total burst time at ${MAX_TOTAL_BURST} or less so the chart stays readable.`);
      return;
    }
    if (algorithm.value === 'rr' && (!Number.isInteger(q) || q < 1 || q > 10)) {
      error.show('The quantum must be a whole number from 1 to 10.');
      return;
    }
    const procs = rows.map(([at, bt, pr], i) => ({ id: `P${i + 1}`, at, bt, pr }));
    const result = schedule(procs, algorithm.value, q);
    const frames = result.events.map((e) => ({
      t: e.t,
      running: e.running,
      queue: e.queue,
      slices: result.slices.filter((s) => s.start < e.t).map((s) => ({ ...s, end: Math.min(s.end, e.t) })),
      text: `t = ${e.t}: ${e.notes.join(' ')}`,
    }));
    const last = frames[frames.length - 1];
    last.slices = result.slices;
    last.summary = result;
    last.text += ` All processes have finished. Average waiting time ${fmt(result.averages.wt)}, average turnaround time ${fmt(result.averages.tat)}, average response time ${fmt(result.averages.rt)}.`;
    stepper.load(frames[0], frames.slice(1));
  }

  addBtn.addEventListener('click', () => {
    const lastArrival = rows.length ? rows[rows.length - 1][0] : 0;
    rows.push([lastArrival + 1, 2, 1]);
    drawInputs();
    start();
  });
  removeBtn.addEventListener('click', () => {
    rows.pop();
    drawInputs();
    start();
  });
  algorithm.addEventListener('change', start);
  quantum.addEventListener('change', start);
  drawInputs();
  start();
  return stepper;
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
