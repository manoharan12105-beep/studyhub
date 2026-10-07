// Quorum reads and writes: does a read see the latest write?
//
//   N, W, R → write v2 (acknowledged by W replicas) → read from R replicas,
//   chosen as the worst case (as far as possible from the ones that took the
//   write) → result, then how many failures reads and writes tolerate.

import { el } from '../util.js';
import { createStepper, errorLine, field } from '../engagement/stepper.js';
import { nodesView, statsView } from '../simulators/system-design-common.js';

export function mount(root, { options }) {
  const n = el('input', { class: 'input', type: 'number', min: 1, max: 9, value: options.n ?? 3, style: 'width:5rem' });
  const w = el('input', { class: 'input', type: 'number', min: 1, max: 9, value: options.w ?? 2, style: 'width:5rem' });
  const r = el('input', { class: 'input', type: 'number', min: 1, max: 9, value: options.r ?? 2, style: 'width:5rem' });
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' },
    field('Replicas N', n), field('Write acks W', w), field('Read replies R', r)), error.node);

  const nodes = nodesView('Replicas');
  const stats = statsView('Quorum properties');
  root.append(el('div', { class: 'viz-stage' }, nodes.node, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1800, nextLabel: 'Next step' });

  function render(frame) {
    nodes.render(frame.replicas.map((rep, i) => ({
      title: `Replica ${i + 1}`,
      lines: [`value ${rep.value}`, rep.note || ' '],
      state: [rep.value === 'v2' ? 'ok' : 'stale', rep.read ? 'current' : ''].filter(Boolean).join(' '),
    })));
    stats.render(frame.stats);
  }

  function start() {
    error.clear();
    const N = Number(n.value);
    const W = Number(w.value);
    const R = Number(r.value);
    if (![N, W, R].every(Number.isInteger) || N < 1 || N > 9 || W < 1 || R < 1 || W > N || R > N) {
      error.show('Use whole numbers with 1 ≤ W ≤ N, 1 ≤ R ≤ N and N ≤ 9.');
      return;
    }
    const overlap = W + R > N;
    const base = [['W + R', `${W + R} ${overlap ? '>' : '≤'} ${N}`], ['Writes tolerate', `${N - W} failed replica(s)`], ['Reads tolerate', `${N - R} failed replica(s)`]];
    const replicas = () => Array.from({ length: N }, () => ({ value: 'v1' }));
    const f0 = { replicas: replicas(), stats: base, text: `${N} replicas all hold v1. A client will write v2 and wait for ${W} acknowledgement(s), then another client reads, waiting for ${R} replies.` };

    const afterWrite = replicas().map((rep, i) => (i < W ? { value: 'v2', note: 'acknowledged the write' } : { value: 'v1', note: 'slow or missed the write' }));
    const f1 = { replicas: afterWrite, stats: base, text: `Write v2: ${W} replica(s) acknowledge, so the write succeeds. ${N - W > 0 ? `The other ${N - W} have not received it yet (slow, down or partitioned) — they still hold v1.` : 'Every replica has it.'}` };

    // Worst case for the reader: ask the R replicas furthest from the write set (the last R).
    const readSet = afterWrite.map((rep, i) => ({ ...rep, read: i >= N - R }));
    const sawNew = readSet.some((rep) => rep.read && rep.value === 'v2');
    const f2 = {
      replicas: readSet.map((rep) => (rep.read ? { ...rep, note: `${rep.note} · read` } : rep)),
      stats: [...base, ['Read returns', sawNew ? 'v2 (latest)' : 'v1 (stale!)']],
      text: sawNew
        ? `Read: even choosing the ${R} replica(s) least likely to have v2, at least one of them holds v2 because ${W} + ${R} > ${N}: the write set and read set must overlap. The client takes the newest version (and can repair stale replicas — read repair).`
        : `Read: the ${R} replica(s) asked can all be ones that missed the write, because ${W} + ${R} ≤ ${N} — the sets need not overlap. The read can return stale v1. Raise W or R until W + R > N.`,
    };
    const majority = Math.floor(N / 2) + 1;
    const f3 = {
      replicas: f2.replicas, stats: f2.stats,
      text: `Trade-off: writes keep working with up to ${N - W} replica(s) down, reads with up to ${N - R} down. ${W === majority && R === majority ? `This is the balanced majority setting (${majority} of ${N}).` : `A balanced choice for N = ${N} is W = R = ${majority} (a majority). Lower values are faster and more available but may read stale data; W = ${N} makes writes fail when any replica is down.`}`,
    };
    stepper.load(f0, [f1, f2, f3]);
  }

  for (const input of [n, w, r]) input.addEventListener('change', start);
  start();
  return stepper;
}
