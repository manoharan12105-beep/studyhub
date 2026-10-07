// Load-balancing algorithms, one request at a time.
//
//   algorithm + "S3 crashes" → [Next request] → which server is chosen and why,
//   open connections per server, and what health checks do when a server dies.
//
// Three servers of different sizes (weights 1, 2, 3). Requests stay open for
// different numbers of ticks (one tick per arriving request), so least
// connections has something to react to. Health checks run every tick and mark a
// server unhealthy after 2 consecutive failures — requests sent to a dead server
// before that fail, which is the detection window.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { checkbox, hash32, select, statsView } from './system-design-common.js';

const ALGOS = {
  rr: 'Round robin',
  wrr: 'Weighted round robin (1 : 2 : 3)',
  lc: 'Least connections',
  hash: 'IP hash',
};

const SERVERS = [
  { id: 'S1', size: '4 GB', weight: 1 },
  { id: 'S2', size: '8 GB', weight: 2 },
  { id: 'S3', size: '16 GB', weight: 3 },
];

// How many ticks each request stays open (a few slow ones, e.g. report downloads).
const DURATIONS = [1, 1, 5, 1, 2, 1, 6, 1, 1, 3, 1, 1, 4, 1, 2, 1, 1, 1];
const CLIENTS = ['198.51.100.7', '203.0.113.20', '192.0.2.33', '198.51.100.88'];
const CRASH_AT = 6;
const UNHEALTHY_AFTER = 2;

export function mount(root, { options }) {
  const algo = select(ALGOS, options.algorithm || 'rr');
  const crash = checkbox(`S3 crashes at request ${CRASH_AT} (health checks every tick, unhealthy after ${UNHEALTHY_AFTER} failures)`, Boolean(options.crash));
  root.append(el('div', { class: 'viz-form' }, field('Algorithm', algo), crash.node));

  const servers = el('ul', { class: 'lb-servers' });
  const stats = statsView('Totals');
  root.append(el('div', { class: 'viz-stage' }, servers, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1400, nextLabel: 'Next request' });

  function render(frame) {
    servers.replaceChildren(...frame.servers.map((s) => {
      const state = s.removed ? 'removed from pool (unhealthy)' : s.dead ? `down — failed checks ${s.failedChecks}/${UNHEALTHY_AFTER}` : 'healthy';
      return el('li', { class: ['lb-server', frame.target === s.id ? 'is-current' : '', s.dead ? 'is-down' : ''].join(' ') },
        el('strong', {}, `${s.id} · ${s.size} · weight ${s.weight}`),
        el('span', {}, `open connections ${s.open.length} · requests ${s.total}`),
        el('span', {}, s.failed ? `failed requests ${s.failed}` : ' '),
        el('span', { class: 'lb-last' }, state));
    }));
    const served = frame.servers.reduce((n, s) => n + s.total, 0);
    const failed = frame.servers.reduce((n, s) => n + s.failed, 0);
    stats.render([['Requests', frame.n], ['Served', served], ['Failed', failed]]);
  }

  function start() {
    const first = {
      n: 0, target: null, wrr: [0, 0, 0], rr: 0,
      servers: SERVERS.map((s) => ({ ...s, open: [], total: 0, failed: 0, dead: false, failedChecks: 0, removed: false })),
      text: `${ALGOS[algo.value]}: press "Next request" to send requests from four clients. Some requests stay open longer than others.`,
    };
    stepper.load(first, (frame) => next(frame, algo.value, crash.input.checked));
  }

  algo.addEventListener('change', start);
  crash.input.addEventListener('change', start);
  start();
  return stepper;
}

function next(frame, algorithm, crashes) {
  if (frame.n >= DURATIONS.length) return null;
  const tick = frame.n + 1;
  const servers = frame.servers.map((s) => ({ ...s, open: s.open.filter((end) => end > tick) }));
  const notes = [];

  // Health checks run at the start of every tick. S3 crashes just after the check of
  // tick CRASH_AT passed, so the first failed check is at the next tick.
  if (crashes && tick >= CRASH_AT) {
    const s3 = servers[2];
    if (!s3.dead) {
      s3.dead = true;
      s3.open = [];
      notes.push('S3 has just crashed (right after passing this tick\'s health check); its open connections are lost.');
    } else if (!s3.removed) {
      s3.failedChecks += 1;
      if (s3.failedChecks >= UNHEALTHY_AFTER) {
        s3.removed = true;
        notes.push(`S3 has now failed ${UNHEALTHY_AFTER} health checks in a row: the balancer removes it from the pool.`);
      } else {
        notes.push(`S3 failed health check ${s3.failedChecks} of ${UNHEALTHY_AFTER}; it is still in the pool.`);
      }
    }
  }

  const pool = servers.map((s, i) => i).filter((i) => !servers[i].removed);
  const client = CLIENTS[(tick - 1) % CLIENTS.length];
  let index;
  let why;
  const wrr = frame.wrr.slice();
  let rr = frame.rr;

  if (algorithm === 'rr') {
    index = pool[rr % pool.length];
    rr += 1;
    why = 'next server in turn';
  } else if (algorithm === 'wrr') {
    // Smooth weighted round robin: add each weight, pick the largest, subtract the total.
    const total = pool.reduce((sum, i) => sum + servers[i].weight, 0);
    for (const i of pool) wrr[i] += servers[i].weight;
    index = pool.reduce((best, i) => (wrr[i] > wrr[best] ? i : best), pool[0]);
    wrr[index] -= total;
    why = `the highest running weight (shares 1 : 2 : 3 over ${total} requests)`;
  } else if (algorithm === 'lc') {
    index = pool.reduce((best, i) => (servers[i].open.length < servers[best].open.length ? i : best), pool[0]);
    why = `the fewest open connections (${pool.map((i) => `${servers[i].id}=${servers[i].open.length}`).join(', ')})`;
  } else {
    const h = hash32(client);
    index = pool[h % pool.length];
    why = `hash(${client}) % ${pool.length} = ${h % pool.length} → always the same server for this client while the pool is unchanged`;
  }

  const target = servers[index];
  const duration = DURATIONS[frame.n];
  let outcome;
  if (target.dead) {
    target.failed += 1;
    outcome = `S3 is down but not yet marked unhealthy, so this request FAILS (502). This is the detection window.`;
  } else {
    target.total += 1;
    target.open.push(tick + duration);
    outcome = `stays open for ${duration} tick${duration > 1 ? 's' : ''}.`;
  }

  return {
    n: tick, target: target.id, servers, wrr, rr,
    text: `Request ${tick} from ${client} → ${target.id}: ${why}; ${outcome}${notes.length ? ` ${notes.join(' ')}` : ''}`,
  };
}
