// Primary–replica replication: writes, reads, replication lag and failover.
//
//   mode (async / semi-sync / sync) + read-your-writes routing →
//   a fixed story: write → read → catch-up → write → primary crash → failover.
//
// The same story under each mode shows the trade-off: async acknowledges fastest
// but can serve stale reads and lose acknowledged writes on failover; sync never
// loses them but every write waits for every replica.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { checkbox, nodesView, select, statsView } from './system-design-common.js';

const MODES = {
  async: 'Asynchronous (acknowledge after the primary commits)',
  semi: 'Semi-synchronous (wait for one replica)',
  sync: 'Synchronous (wait for every replica)',
};
const ACK_MS = { async: 2, semi: 3, sync: 6 };

export function mount(root, { options }) {
  const mode = select(MODES, options.mode || 'async');
  const ryw = checkbox('Route a user\'s own reads to the primary right after they write (read-your-writes)', false);
  root.append(el('div', { class: 'viz-form' }, field('Replication mode', mode), ryw.node));

  const nodes = nodesView('Database nodes');
  const stats = statsView('Outcome so far');
  root.append(el('div', { class: 'viz-stage' }, nodes.node, stats.node));
  const stepper = createStepper(root, { render, playDelay: 2000, nextLabel: 'Next step' });

  function render(frame) {
    nodes.render(frame.nodes.map((n) => ({
      title: `${n.name} — ${n.down ? 'DOWN' : n.role}`,
      lines: [`x = ${n.x}`, `applied log position ${n.pos}`, n.note || ' '],
      state: [n.down ? 'down' : '', n.role === 'primary' && !n.down ? 'primary' : '', frame.focus === n.name ? 'current' : '', n.stale ? 'stale' : ''].filter(Boolean).join(' '),
    })));
    stats.render([['Write acknowledged after', `~${ACK_MS[frame.mode]} ms`], ['Stale reads', frame.staleReads], ['Acknowledged writes lost', frame.lost]]);
  }

  function start() {
    const frames = story(mode.value, ryw.input.checked);
    stepper.load(frames[0], frames.slice(1));
  }

  mode.addEventListener('change', start);
  ryw.input.addEventListener('change', start);
  start();
  return stepper;
}

function story(mode, readYourWrites) {
  const nodes = [
    { name: 'Primary', role: 'primary', x: 0, pos: 0 },
    { name: 'Replica 1', role: 'replica', x: 0, pos: 0 },
    { name: 'Replica 2', role: 'replica', x: 0, pos: 0 },
  ];
  let staleReads = 0;
  let lost = 0;
  const frames = [];
  const snap = (focus, text) => frames.push({ mode, nodes: nodes.map((n) => ({ ...n })), focus, staleReads, lost, text });
  const apply = (n, x, pos) => { n.x = x; n.pos = pos; n.stale = false; n.note = ''; };
  const replicate = (x, pos) => {
    // Which replicas have the write when the client gets its acknowledgement?
    if (mode === 'sync' || mode === 'semi') apply(nodes[1], x, pos);
    if (mode === 'sync') apply(nodes[2], x, pos);
    for (const r of nodes.slice(1)) if (r.pos < pos) { r.stale = true; r.note = `lagging: has not applied position ${pos} yet`; }
  };

  snap(null, `All three copies hold x = 0. Mode: ${MODES[mode]}. Writes go to the primary only; reads may go to any copy. Press "Next step".`);

  apply(nodes[0], 1, 1);
  replicate(1, 1);
  snap('Primary', `Alan posts (x = 1). The primary commits at log position 1 and acknowledges after ${{ async: 'its own commit only — replicas will receive the change shortly', semi: 'Replica 1 confirmed it — Replica 2 is still catching up', sync: 'both replicas confirmed — the slowest replica sets the write latency' }[mode]}.`);

  if (readYourWrites) {
    snap('Primary', 'Alan refreshes immediately. Because he just wrote, his read is routed to the PRIMARY: he sees x = 1. Other users still read replicas.');
  } else {
    const r2 = nodes[2];
    if (r2.x !== 1) staleReads += 1;
    snap('Replica 2', r2.x === 1
      ? 'Alan refreshes and the read lands on Replica 2, which already has x = 1 (synchronous replication).'
      : 'Alan refreshes and the read lands on Replica 2, which has not applied position 1 yet: he sees x = 0 — his own post is "missing". This is replication lag breaking read-your-writes. (Turn on the routing option to fix it.)');
  }

  for (const r of nodes.slice(1)) apply(r, 1, 1);
  snap(null, 'A few milliseconds later both replicas have applied position 1: the copies have converged (eventual consistency).');

  apply(nodes[0], 2, 2);
  replicate(2, 2);
  snap('Primary', `Bea writes x = 2. The primary commits at position 2 and acknowledges to Bea after ${{ async: 'its own commit', semi: 'Replica 1 confirms', sync: 'both replicas confirm' }[mode]}. Bea has been told her write succeeded.`);

  nodes[0].down = true;
  nodes[0].note = 'crashed';
  snap('Primary', `The primary crashes before streaming anything more. ${mode === 'async' ? 'Neither replica received position 2.' : mode === 'semi' ? 'Replica 1 already has position 2; Replica 2 does not.' : 'Both replicas already have position 2.'}`);

  const candidate = nodes.slice(1).reduce((a, b) => (b.pos > a.pos ? b : a));
  candidate.role = 'primary';
  candidate.note = 'promoted (highest log position)';
  const other = nodes.slice(1).find((n) => n !== candidate);
  if (other.pos < candidate.pos) apply(other, candidate.x, candidate.pos);
  other.note = 'now follows the new primary';
  if (candidate.pos < 2) lost += 1;
  snap(candidate.name, candidate.pos < 2
    ? `Failover: ${candidate.name} has the highest position (1) and is promoted. Bea's ACKNOWLEDGED write x = 2 is LOST — it only ever existed on the crashed primary. That is the price of asynchronous replication.`
    : `Failover: ${candidate.name} has position 2 and is promoted. No acknowledged write is lost, because ${mode === 'sync' ? 'every replica confirmed each write' : 'at least one replica confirmed each write before Bea was told it succeeded'}.`);

  snap(null, `Summary for ${mode === 'async' ? 'async' : mode === 'semi' ? 'semi-sync' : 'sync'}: write acknowledged after ~${ACK_MS[mode]} ms, ${staleReads} stale read(s), ${lost} acknowledged write(s) lost. When the old primary returns it must be fenced and rejoin as a replica — never as a second primary (split brain).`);
  return frames;
}
