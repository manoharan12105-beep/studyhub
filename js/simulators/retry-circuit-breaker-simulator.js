// Retries, backoff, jitter and circuit breakers against a failing dependency.
//
// Mode "retries": 20 clients call a dependency at the same moment. It is down for
//   ticks 1–3, then serves at most 6 calls per tick. Each strategy decides when
//   failed calls are retried (up to 6 attempts). The bars show calls per tick:
//   immediate retries hammer it, plain backoff retries in synchronised waves,
//   backoff with full jitter spreads retries and finishes first.
// Mode "breaker": one request per tick; the dependency is down for ticks 1–8 and
//   every failed call holds a thread for a 3 s timeout. With a circuit breaker
//   (3 failures → open for 4 ticks → one half-open trial), calls fail fast with a
//   fallback instead.
//
// "Random" waits come from a seeded generator, so every run replays identically.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { barsView, checkbox, nodesView, seeded, select, statsView } from './system-design-common.js';

const MODES = { retries: 'Retries: 20 clients fail together', breaker: 'Circuit breaker: a dependency stays down' };
const STRATEGIES = {
  none: 'No retries',
  immediate: 'Retry immediately (every tick)',
  backoff: 'Exponential backoff, no jitter',
  jitter: 'Exponential backoff with full jitter',
};

const CLIENTS = 20;
const CAPACITY = 6;
const DOWN_UNTIL = 3;
const MAX_ATTEMPTS = 6;

export function mount(root, { options }) {
  const mode = select(MODES, options.mode || 'retries');
  const strategy = select(STRATEGIES, options.strategy || 'immediate');
  const breaker = checkbox('Use a circuit breaker (3 failures → open 4 ticks → half-open trial)', true);
  const strategyField = field('Retry strategy', strategy);
  root.append(el('div', { class: 'viz-form' }, field('Mode', mode), strategyField, breaker.node));

  const bars = barsView('Calls per tick');
  const nodes = nodesView('Breaker and dependency');
  const stats = statsView('Totals');
  const barsWrap = el('div', {}, el('p', { class: 'tree-side-title' }, 'Calls reaching the dependency per tick (✓ succeeded)'), bars.node);
  root.append(el('div', { class: 'viz-stage' }, nodes.node, barsWrap, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1300, nextLabel: 'Next tick' });

  function render(frame) {
    nodes.node.hidden = !frame.cards;
    if (frame.cards) nodes.render(frame.cards);
    barsWrap.hidden = !frame.history;
    if (frame.history) {
      bars.render(frame.history.map((h) => ({
        label: `t=${h.t}`, value: h.calls, max: CLIENTS,
        note: `${h.calls} call${h.calls === 1 ? '' : 's'}, ✓ ${h.ok}`,
        state: h.t === frame.t ? 'current' : h.calls > CAPACITY ? 'hot' : '',
      })));
    }
    stats.render(frame.stats);
  }

  function sync() {
    const retries = mode.value === 'retries';
    strategyField.hidden = !retries;
    breaker.node.hidden = retries;
  }

  function start() {
    sync();
    const frames = mode.value === 'retries' ? retryFrames(strategy.value) : breakerFrames(breaker.input.checked);
    stepper.load(frames[0], frames.slice(1));
  }

  mode.addEventListener('change', start);
  strategy.addEventListener('change', start);
  breaker.input.addEventListener('change', start);
  start();
  return stepper;
}

function retryFrames(strategy) {
  const random = seeded(11);
  let pending = Array.from({ length: CLIENTS }, () => ({ due: 1, attempt: 1 }));
  let ok = 0;
  let gaveUp = 0;
  let calls = 0;
  let lastSuccess = 0;
  const history = [];
  const frames = [{
    t: 0, history: [], stats: [['Total calls', 0], ['Succeeded', 0], ['Gave up', 0]],
    text: `${CLIENTS} clients call the dependency at t=1. It is down until t=${DOWN_UNTIL}, then handles ${CAPACITY} calls per tick. Strategy: ${STRATEGIES[strategy]}. Press "Next tick".`,
  }];
  for (let t = 1; t <= 40 && (pending.length || t === 1); t += 1) {
    const due = pending.filter((p) => p.due === t);
    pending = pending.filter((p) => p.due !== t);
    if (!due.length) continue;
    calls += due.length;
    const capacity = t <= DOWN_UNTIL ? 0 : CAPACITY;
    let served = 0;
    let quit = 0;
    due.forEach((call, i) => {
      if (i < capacity) {
        served += 1;
        ok += 1;
        lastSuccess = t;
        return;
      }
      if (strategy === 'none' || call.attempt >= MAX_ATTEMPTS) {
        gaveUp += 1;
        quit += 1;
        return;
      }
      const ceiling = 2 ** (call.attempt - 1);
      let wait = 1;
      if (strategy === 'backoff') wait = ceiling;
      if (strategy === 'jitter') wait = 1 + Math.floor(random() * ceiling);
      pending.push({ due: t + wait, attempt: call.attempt + 1 });
    });
    history.push({ t, calls: due.length, ok: served });
    const down = t <= DOWN_UNTIL;
    frames.push({
      t, history: history.slice(), stats: [['Total calls', calls], ['Succeeded', ok], ['Gave up', gaveUp], ['Last success at', lastSuccess ? `t=${lastSuccess}` : '—']],
      text: `t=${t}: ${due.length} call(s) arrive; ${down ? 'the dependency is DOWN, so all fail' : `${served} succeed (capacity ${CAPACITY})`}${quit ? `; ${quit} client(s) give up` : ''}. ${explain(strategy, down, due.length)}`,
    });
  }
  frames[frames.length - 1].text += ` Result: ${calls} calls in total, ${ok} succeeded, ${gaveUp} gave up, last success at t=${lastSuccess}. ${verdict(strategy)}`;
  return frames;
}

function explain(strategy, down, n) {
  if (strategy === 'none') return 'Without retries, every failure is final — even though the outage lasts only 3 ticks.';
  if (strategy === 'immediate') return down ? 'Every client retries on the very next tick, so the struggling dependency is hit as hard as before.' : n > CAPACITY ? 'The retry wave is bigger than capacity, so most calls fail again and retry again.' : '';
  if (strategy === 'backoff') return 'Waits double (1, 2, 4, 8 … ticks) — but every client waits the SAME time, so retries arrive in synchronised waves with idle ticks between.';
  return 'Each client waits a random time up to the doubled ceiling, so retries spread over the following ticks and use the capacity steadily.';
}

function verdict(strategy) {
  return {
    none: 'Retries are needed for transient failures — but only careful ones.',
    immediate: 'Immediate retries multiply load during the outage (a retry storm) and some clients still give up.',
    backoff: 'Backoff reduced the load, but synchronised waves left capacity idle and the last client finished very late.',
    jitter: 'Backoff with jitter used the fewest calls and finished earliest: the AWS-style "full jitter" recommendation.',
  }[strategy];
}

function breakerFrames(useBreaker) {
  const THRESHOLD = 3;
  const OPEN_TICKS = 4;
  const DOWN_LAST = 8;
  const TIMEOUT_S = 3;
  let state = 'CLOSED';
  let failures = 0;
  let openedAt = 0;
  let calls = 0;
  let fallbacks = 0;
  let waited = 0;
  const frames = [{
    cards: cards('CLOSED', true, 'no calls yet'), stats: [['Calls to dependency', 0], ['Thread-seconds blocked', 0], ['Fallbacks served', 0]],
    text: `One request per tick needs the recommendations service, which is down for ticks 1–${DOWN_LAST}. Every failed call holds a thread for a ${TIMEOUT_S} s timeout. ${useBreaker ? 'A circuit breaker protects the caller.' : 'There is NO circuit breaker.'} Press "Next tick".`,
  }];
  for (let t = 1; t <= 12; t += 1) {
    const healthy = t > DOWN_LAST;
    let text;
    if (useBreaker && state === 'OPEN' && t - openedAt < OPEN_TICKS) {
      fallbacks += 1;
      text = `t=${t}: breaker OPEN → the call is rejected instantly and a fallback (bestsellers) is shown. No thread waits${healthy ? ' — even though the service has actually recovered: the breaker only finds out at its next trial' : ''}.`;
    } else {
      if (useBreaker && state === 'OPEN') state = 'HALF-OPEN';
      const was = state;
      calls += 1;
      if (healthy) {
        failures = 0;
        if (useBreaker) state = 'CLOSED';
        text = `t=${t}: ${was === 'HALF-OPEN' ? 'HALF-OPEN trial call succeeds → breaker CLOSES; normal traffic resumes.' : 'the call succeeds.'}`;
      } else {
        failures += 1;
        waited += TIMEOUT_S;
        if (!useBreaker) fallbacks += 1;
        if (useBreaker && (was === 'HALF-OPEN' || failures >= THRESHOLD)) {
          state = 'OPEN';
          openedAt = t;
          text = `t=${t}: ${was === 'HALF-OPEN' ? 'the HALF-OPEN trial fails' : `failure ${failures} of ${THRESHOLD}`} after a ${TIMEOUT_S} s timeout → breaker OPENS for ${OPEN_TICKS} ticks.`;
        } else {
          text = `t=${t}: the call waits ${TIMEOUT_S} s and times out${useBreaker ? ` (failure ${failures} of ${THRESHOLD})` : ''}; a fallback is shown after the wait. ${useBreaker ? '' : 'Under real traffic, hundreds of requests per second would each hold a thread this long — the caller runs out of threads (cascading failure).'}`;
        }
      }
    }
    frames.push({
      cards: cards(useBreaker ? state : 'none', healthy, healthy ? 'healthy again' : 'DOWN'),
      stats: [['Calls to dependency', calls], ['Thread-seconds blocked', waited], ['Fallbacks served', fallbacks]],
      text,
    });
  }
  frames[frames.length - 1].text += useBreaker
    ? ` Totals: ${calls} calls reached the failing service and threads waited ${waited} s; the rest failed fast with a fallback.`
    : ` Totals: ${calls} calls, threads blocked for ${waited} s. Turn the breaker on to compare.`;
  return frames;
}

function cards(state, healthy, note) {
  return [
    { title: 'Circuit breaker', lines: [state === 'none' ? 'not used' : state], state: state === 'OPEN' ? 'down' : state === 'HALF-OPEN' ? 'stale' : 'ok' },
    { title: 'Recommendations service', lines: [note], state: healthy ? 'ok' : 'down' },
  ];
}
