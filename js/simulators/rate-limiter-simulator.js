// Rate-limiting algorithms, request by request.
//
//   algorithm + traffic pattern → one frame per request: allowed, rejected (429)
//   or queued, with the limiter's state (tokens, window count, log, water level).
//
// Every limiter is set to the same nominal rate — 3 requests per second — so the
// differences come only from the algorithm: bursts, window boundaries, smoothing.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { tableView } from './network-common.js';
import { select, statsView } from './system-design-common.js';

const ALGOS = {
  token: 'Token bucket (capacity 3, refill 1 token/s)',
  fixed: 'Fixed window (3 per calendar second)',
  sliding: 'Sliding window log (3 in any 1 s)',
  leaky: 'Leaky bucket (queue of 3, drains 1/s)',
};
const PATTERNS = {
  burst: 'Burst: 6 requests in 250 ms, then a few later',
  boundary: 'Window boundary: 3 just before and 3 just after a second ticks over',
  steady: 'Steady: one request every 400 ms',
};
const TIMES = {
  burst: [0, 50, 100, 150, 200, 250, 1500, 1600, 3200],
  boundary: [700, 800, 900, 1000, 1100, 1200, 2500],
  steady: [0, 400, 800, 1200, 1600, 2000, 2400, 2800],
};

export function mount(root, { options }) {
  const algo = select(ALGOS, options.algorithm || 'token');
  const pattern = select(PATTERNS, options.pattern || 'burst');
  root.append(el('div', { class: 'viz-form' }, field('Algorithm', algo), field('Traffic', pattern)));

  const table = tableView('Decisions', ['Time', 'Decision', 'Limiter state']);
  const stats = statsView('Totals');
  root.append(el('div', { class: 'viz-stage' }, table.node, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1200, nextLabel: 'Next request' });

  function render(frame) {
    table.render(frame.rows.map((r) => [r.time, r.decision, r.state]), {
      empty: 'No requests yet',
      rowClass: (row, i) => [i === frame.rows.length - 1 ? 'is-current' : '', row[1].startsWith('Rejected') ? 'is-removed' : ''].join(' ').trim(),
    });
    stats.render([['Allowed', frame.allowed], ['Rejected (429)', frame.rejected], ...(frame.queued !== undefined ? [['Queued (delayed)', frame.queued]] : [])]);
  }

  function start() {
    const frames = run(algo.value, TIMES[pattern.value]);
    stepper.load(frames[0], frames.slice(1));
  }

  algo.addEventListener('change', start);
  pattern.addEventListener('change', start);
  start();
  return stepper;
}

function run(algorithm, times) {
  const rows = [];
  let allowed = 0;
  let rejected = 0;
  let queued = algorithm === 'leaky' ? 0 : undefined;
  // limiter state
  let tokens = 3;
  let last = 0;
  const counts = {};
  const log = [];
  let level = 0;

  const frames = [{ rows: [], allowed, rejected, queued, text: `${ALGOS[algorithm]}. Every algorithm here allows 3 requests per second on average. Press "Next request".` }];
  for (const t of times) {
    let ok;
    let state;
    let why;
    if (algorithm === 'token') {
      tokens = Math.min(3, tokens + (t - last) / 1000);
      last = t;
      ok = tokens >= 1;
      if (ok) tokens -= 1;
      state = `${tokens.toFixed(2)} tokens left`;
      why = ok ? 'a token was available (bursts up to the bucket capacity are allowed)' : 'the bucket is empty; tokens refill at 1 per second';
    } else if (algorithm === 'fixed') {
      const w = Math.floor(t / 1000);
      counts[w] = counts[w] || 0;
      ok = counts[w] < 3;
      if (ok) counts[w] += 1;
      state = `window ${w}.000–${w}.999 s: ${counts[w]}/3`;
      why = ok ? 'this calendar second still has room' : 'this calendar second already has 3 requests';
    } else if (algorithm === 'sliding') {
      while (log.length && log[0] <= t - 1000) log.shift();
      ok = log.length < 3;
      if (ok) log.push(t);
      state = `last 1 s: [${log.map((x) => `${(x / 1000).toFixed(2)}`).join(', ')}]`;
      why = ok ? 'fewer than 3 requests in the past second' : 'already 3 requests in the past second';
    } else {
      level = Math.max(0, level - (t - last) / 1000);
      last = t;
      ok = level + 1 <= 3;
      if (ok) level += 1;
      state = `queue level ${level.toFixed(2)} / 3`;
      why = ok ? `queued; it is processed after about ${(level - 1).toFixed(1)} s as the bucket drains at a constant 1/s` : 'the queue is full, so the request is dropped';
    }
    let decision;
    if (!ok) {
      rejected += 1;
      decision = 'Rejected (429)';
    } else if (algorithm === 'leaky' && level > 1) {
      queued += 1;
      allowed += 1;
      decision = 'Queued';
    } else {
      allowed += 1;
      decision = 'Allowed';
    }
    rows.push({ time: `${(t / 1000).toFixed(2)} s`, decision, state });
    frames.push({ rows: rows.slice(), allowed, rejected, queued, text: `Request at ${(t / 1000).toFixed(2)} s → ${decision}: ${why}.` });
  }
  frames[frames.length - 1].text += ` ${summary(algorithm, times)}`;
  return frames;
}

function summary(algorithm, times) {
  const boundary = times === TIMES.boundary;
  return {
    token: 'Token bucket: short bursts pass while tokens last, then the long-run rate is enforced. The most common API limiter.',
    fixed: boundary ? 'Fixed window let all 6 requests through within 0.5 s, because they straddled the boundary between two windows — twice the limit. That is its known weakness.' : 'Fixed window: one counter per second — cheap, but bursts at window boundaries can reach twice the limit.',
    sliding: boundary ? 'Sliding window log never allowed more than 3 in any 1-second span, even across the boundary — exact, at the cost of storing timestamps.' : 'Sliding window log: exact limits for any 1-second span, at the cost of storing one timestamp per request.',
    leaky: 'Leaky bucket: requests are smoothed into a constant output rate; bursts wait in the queue (added latency) and overflow is dropped.',
  }[algorithm];
}
