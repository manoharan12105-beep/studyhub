// The Banker's algorithm, one check at a time.
//
//   example state (+ optional request) → frames: Need = Max − Allocation, the
//   request checks (≤ Need, ≤ Available, pretend to grant), then every safety
//   check "Need ≤ Work?" with the Work vector growing as processes finish, and
//   finally SAFE with a safe sequence (grant) or UNSAFE (the request waits).
//
// The numbers come from bankersSafety() / bankersRequest() in
// js/simulators/os-common.js, the same code that checked the lessons.

import { el } from '../util.js';
import { createStepper, errorLine, field } from '../engagement/stepper.js';
import { select, tableView } from '../simulators/network-common.js';
import { bankersSafety, needMatrix } from '../simulators/os-common.js';

const EXAMPLES = {
  lesson: {
    label: 'Lesson example (5 processes, A B C)',
    types: ['A', 'B', 'C'],
    allocation: [[1, 1, 0], [2, 0, 1], [1, 0, 2], [0, 1, 1], [2, 1, 0]],
    max: [[4, 3, 2], [3, 2, 2], [5, 1, 3], [2, 2, 2], [4, 2, 1]],
    available: [2, 2, 1],
  },
  practice: {
    label: 'Practice set (4 processes, A B C)',
    types: ['A', 'B', 'C'],
    allocation: [[0, 1, 1], [1, 0, 0], [1, 1, 0], [2, 0, 1]],
    max: [[2, 2, 3], [2, 1, 1], [3, 2, 2], [3, 2, 2]],
    available: [1, 2, 1],
  },
  unsafe: {
    label: 'An unsafe state (3 processes, A B)',
    types: ['A', 'B'],
    allocation: [[1, 0], [1, 1], [0, 1]],
    max: [[3, 2], [2, 3], [2, 2]],
    available: [1, 0],
  },
};

const vec = (v) => `(${v.join(', ')})`;
const fits = (a, b) => a.every((x, j) => x <= b[j]);

export function mount(root, { options }) {
  const example = select(Object.fromEntries(Object.entries(EXAMPLES).map(([k, e]) => [k, e.label])), options.example || 'lesson');
  const who = el('select', { class: 'select' });
  const request = el('input', { class: 'input', type: 'text', value: options.request || '', placeholder: 'e.g. 1 0 1', spellcheck: 'false', style: 'width:9rem' });
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' }, field('Example', example), field('Request by', who),
    field('Request vector', request, 'Leave empty to check the current state only.')), error.node);

  const matrix = tableView('State', ['Process', 'Allocation', 'Max', 'Need', 'Status']);
  const work = el('p', { class: 'verdict' });
  root.append(el('div', { class: 'viz-stage' }, matrix.node, work));
  const stepper = createStepper(root, { render, playDelay: 1500, nextLabel: 'Next check' });

  function fillWho() {
    const ex = EXAMPLES[example.value];
    const current = who.value;
    who.replaceChildren(el('option', { value: '' }, 'No request — safety check only'),
      ...ex.allocation.map((_, i) => el('option', { value: String(i) }, `P${i}`)));
    who.value = [...who.options].some((o) => o.value === current) ? current : '';
  }

  function render(frame) {
    matrix.render(frame.allocation.map((row, i) => [`P${i}`, vec(row), vec(frame.max[i]), vec(frame.need[i]), frame.status[i]]), {
      rowClass: (row, i) => (i === frame.current ? (frame.currentOk ? 'is-matched' : 'is-unmatched') : (frame.status[i].startsWith('finished') ? 'is-changed' : '')),
    });
    work.className = `verdict ${frame.verdict === 'bad' ? 'verdict-bad' : frame.verdict === 'ok' ? 'verdict-ok' : ''}`;
    work.replaceChildren(`${frame.workLabel}: ${vec(frame.work)}`, el('span', {}, frame.sequence.length ? `   ·   sequence so far: ${frame.sequence.map((i) => `P${i}`).join(', ')}` : ''));
  }

  function start() {
    error.clear();
    const ex = EXAMPLES[example.value];
    const m = ex.types.length;
    let allocation = ex.allocation.map((r) => r.slice());
    let available = ex.available.slice();
    const need0 = needMatrix(allocation, ex.max);
    const base = (extra) => ({
      allocation, max: ex.max, need: needMatrix(allocation, ex.max), status: allocation.map(() => 'not finished'),
      current: null, work: available, workLabel: 'Available', sequence: [], ...extra,
    });
    const frames = [base({ text: `Need = Max − Allocation for every process. Available = ${vec(available)} (${ex.types.join(', ')}). ${who.value === '' ? 'Now run the safety algorithm with Work = Available.' : 'First check the request.'}` })];

    if (who.value !== '' && request.value.trim()) {
      const p = Number(who.value);
      const req = request.value.trim().split(/[\s,]+/).map(Number);
      if (req.length !== m || req.some((x) => !Number.isInteger(x) || x < 0 || x > 9)) {
        error.show(`Enter ${m} whole numbers (one per resource type ${ex.types.join(', ')}), for example ${Array(m).fill(1).join(' ')}.`);
        return;
      }
      if (!fits(req, need0[p])) {
        frames.push(base({ current: p, currentOk: false, verdict: 'bad', text: `Step 1: is Request ${vec(req)} ≤ Need[P${p}] ${vec(need0[p])}? No — P${p} asks for more than its declared maximum. This is an error; the request is rejected.` }));
        stepper.load(frames[0], frames.slice(1));
        return;
      }
      if (!fits(req, available)) {
        frames.push(base({ current: p, currentOk: false, verdict: 'bad', text: `Step 1: Request ${vec(req)} ≤ Need ${vec(need0[p])} ✓. Step 2: is it ≤ Available ${vec(available)}? No — the resources are not free, so P${p} must wait.` }));
        stepper.load(frames[0], frames.slice(1));
        return;
      }
      allocation = allocation.map((row, i) => (i === p ? row.map((a, j) => a + req[j]) : row));
      available = available.map((a, j) => a - req[j]);
      frames.push(base({ current: p, currentOk: true, text: `Request ${vec(req)} ≤ Need ${vec(need0[p])} ✓ and ≤ Available ✓. Pretend to grant it: Available becomes ${vec(available)}, P${p}'s Allocation ${vec(allocation[p])} and Need ${vec(needMatrix(allocation, ex.max)[p])}. Is this new state safe?` }));
    }

    const safety = bankersSafety(allocation, ex.max, available);
    const status = allocation.map(() => 'not finished');
    const sequence = [];
    for (const s of safety.steps) {
      const label = `P${s.process}`;
      if (s.ok) {
        sequence.push(s.process);
        status[s.process] = `finished #${sequence.length}`;
      }
      frames.push(base({
        status: status.slice(), current: s.process, currentOk: s.ok, work: s.workAfter, workLabel: 'Work', sequence: sequence.slice(),
        text: s.ok
          ? `Check ${label}: Need ${vec(s.need)} ≤ Work ${vec(s.work)} ✓. ${label} can get what it needs, finish and return its Allocation: Work = ${vec(s.work)} + ${vec(allocation[s.process])} = ${vec(s.workAfter)}.`
          : `Check ${label}: Need ${vec(s.need)} ≤ Work ${vec(s.work)}? No — ${shortfall(s.need, s.work, ex.types)}. Skip it for now.`,
      }));
    }
    const requested = who.value !== '' && request.value.trim();
    const order = safety.sequence.map((i) => `P${i}`).join(', ');
    frames.push(base({
      status: status.slice(), work: safety.finalWork, workLabel: 'Work', sequence: safety.sequence, verdict: safety.safe ? 'ok' : 'bad',
      text: safety.safe
        ? `SAFE: every process can finish in the order ⟨${order}⟩, and Work returns to the total resources ${vec(safety.finalWork)}.${requested ? ' The request is GRANTED.' : ''}`
        : `UNSAFE: no unfinished process has Need ≤ Work ${vec(safety.finalWork)}, so the OS cannot guarantee that everyone finishes.${requested ? ' The request is NOT granted: the state is restored and the process waits.' : ' (Unsafe does not mean deadlocked yet — but avoidance would never allow this state.)'}`,
    }));
    stepper.load(frames[0], frames.slice(1));
  }

  example.addEventListener('change', () => { fillWho(); start(); });
  who.addEventListener('change', start);
  request.addEventListener('change', start);
  fillWho();
  if (options.process !== undefined) who.value = String(options.process);
  start();
  return stepper;
}

function shortfall(need, work, types) {
  return need.map((x, j) => (x > work[j] ? `${types[j]}: ${x} > ${work[j]}` : null)).filter(Boolean).join(', ');
}
