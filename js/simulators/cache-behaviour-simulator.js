// Cache behaviour over time: hits and misses, TTL expiry, LRU eviction,
// stale data vs invalidation, and a cache stampede vs request coalescing.
//
//   scenario (+ option) → [Next event] → the cache table, hit/miss counters,
//   database queries, and the reason for each outcome.
//
// One module serves three topics through options.scenario ("basics", "stale",
// "stampede"). Every scenario is a fixed timeline, so steps are precomputed.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { tableView } from './network-common.js';
import { barsView, checkbox, select, statsView } from './system-design-common.js';

const SCENARIOS = {
  basics: 'Hits, misses, TTL and LRU eviction (capacity 3, TTL 30 s)',
  stale: 'A price changes in the database (TTL 30 s)',
  stampede: 'A hot key expires under load (rebuild takes 300 ms)',
};

export function mount(root, { options }) {
  const scenario = select(SCENARIOS, options.scenario || 'basics');
  const toggle = checkbox('', false);
  const toggleField = el('div', { class: 'field' });
  root.append(el('div', { class: 'viz-form' }, field('Scenario', scenario), toggleField));

  const table = tableView('Cache contents', ['Key', 'Value', 'Expires at', 'Last used']);
  const stats = statsView('Cache statistics');
  const db = barsView('Database load');
  const dbWrap = el('div', {}, el('p', { class: 'tree-side-title' }, 'Database queries running'), db.node);
  root.append(el('div', { class: 'viz-stage' }, table.node, stats.node, dbWrap));
  const stepper = createStepper(root, { render, playDelay: 1500, nextLabel: 'Next event' });

  function render(frame) {
    table.render(frame.rows.map((r) => [r.key, r.value, r.exp === null ? '—' : `${r.exp} s`, `${r.used} s`]), {
      empty: 'Cache is empty',
      rowClass: (row) => (row[0] === frame.key ? (frame.result === 'stale' ? 'is-removed' : 'is-current') : ''),
    });
    const lookups = frame.hits + frame.misses;
    stats.render([
      ['Time', `${frame.time} s`],
      ['Hits', frame.hits],
      ['Misses', frame.misses],
      ['Hit ratio', lookups ? `${Math.round((frame.hits / lookups) * 100)} %` : '—'],
      ['Database queries', frame.db],
      ...(frame.stale !== undefined ? [['Stale reads served', frame.stale]] : []),
    ]);
    dbWrap.hidden = frame.dbLoad === undefined;
    if (frame.dbLoad !== undefined) {
      db.render([{ label: 'In flight', value: frame.dbLoad, max: 8, note: `${frame.dbLoad} (database comfortably handles 2 of these at once)`, state: frame.dbLoad > 2 ? 'hot' : 'ok' }]);
    }
  }

  function configureToggle() {
    const s = scenario.value;
    toggleField.replaceChildren();
    if (s === 'stale') {
      toggle.node.lastChild.textContent = ' Delete the cache key when the price is updated (active invalidation)';
      toggleField.append(toggle.node);
    } else if (s === 'stampede') {
      toggle.node.lastChild.textContent = ' Request coalescing (only one request rebuilds; the others wait for it)';
      toggleField.append(toggle.node);
    }
  }

  function start() {
    const s = scenario.value;
    const frames = s === 'stale' ? staleFrames(toggle.input.checked) : s === 'stampede' ? stampedeFrames(toggle.input.checked) : basicsFrames();
    stepper.load(frames[0], frames.slice(1));
  }

  scenario.addEventListener('change', () => { toggle.input.checked = false; configureToggle(); start(); });
  toggle.input.addEventListener('change', start);
  if (options.coalescing || options.invalidate) toggle.input.checked = true;
  configureToggle();
  start();
  return stepper;
}

/** A tiny LRU + TTL cache model producing one frame per event. */
function simulate(events, { capacity, ttl, initialText }) {
  let cache = [];   // { key, value, exp, used }
  let hits = 0;
  let misses = 0;
  let db = 0;
  let stale = 0;
  const truth = {}; // what the database holds
  const frames = [{ time: 0, rows: [], hits, misses, db, key: null, text: initialText }];

  for (const ev of events) {
    const t = ev.t;
    // Expired entries are gone the next time they are looked at.
    let note = '';
    if (ev.type === 'update') {
      truth[ev.key] = ev.value;
      let text = `t=${t} s: an admin updates ${ev.key} in the database to ${ev.value}.`;
      if (ev.invalidate) {
        cache = cache.filter((r) => r.key !== ev.key);
        text += ' The writer then DELETES the cache key, so the next read reloads the new value.';
      } else {
        text += ' Nobody touches the cache, which still holds the old value until its TTL expires.';
      }
      frames.push({ time: t, rows: copy(cache), hits, misses, db, stale, key: ev.key, text });
      continue;
    }
    if (truth[ev.key] === undefined) truth[ev.key] = ev.value;
    const entry = cache.find((r) => r.key === ev.key);
    if (entry && entry.exp > t) {
      hits += 1;
      entry.used = t;
      const isStale = entry.value !== truth[ev.key];
      if (isStale) stale += 1;
      frames.push({
        time: t, rows: copy(cache), hits, misses, db, stale, key: ev.key, result: isStale ? 'stale' : 'hit',
        text: `t=${t} s: GET ${ev.key} → HIT, returns ${entry.value} in about 1 ms.${isStale ? ` STALE: the database now holds ${truth[ev.key]}.` : ''}`,
      });
      continue;
    }
    if (entry) {
      cache = cache.filter((r) => r !== entry);
      note = ` The entry expired at ${entry.exp} s (TTL), so it counts as a miss.`;
    }
    misses += 1;
    db += 1;
    let evicted = '';
    if (cache.length >= capacity) {
      const victim = cache.reduce((a, b) => (a.used <= b.used ? a : b));
      cache = cache.filter((r) => r !== victim);
      evicted = ` The cache is full (${capacity} entries), so LRU evicts ${victim.key} (last used at ${victim.used} s).`;
    }
    cache.push({ key: ev.key, value: truth[ev.key], exp: t + ttl, used: t });
    frames.push({
      time: t, rows: copy(cache), hits, misses, db, stale, key: ev.key, result: 'miss',
      text: `t=${t} s: GET ${ev.key} → MISS.${note} The app queries the database (tens of ms), returns ${truth[ev.key]} and stores it with TTL ${ttl} s (expires at ${t + ttl} s).${evicted}`,
    });
  }
  return frames;
}

function copy(rows) {
  return rows.map((r) => ({ ...r }));
}

function basicsFrames() {
  const events = [
    { t: 0, key: 'p1', value: 'Lamp' },
    { t: 5, key: 'p2', value: 'Desk' },
    { t: 8, key: 'p1', value: 'Lamp' },
    { t: 12, key: 'p3', value: 'Chair' },
    { t: 15, key: 'p1', value: 'Lamp' },
    { t: 20, key: 'p4', value: 'Shelf' },
    { t: 33, key: 'p1', value: 'Lamp' },
    { t: 36, key: 'p3', value: 'Chair' },
    { t: 40, key: 'p2', value: 'Desk' },
  ];
  const frames = simulate(events, { capacity: 3, ttl: 30, initialText: 'Cache-aside with room for 3 entries and a 30 s TTL. Product pages p1–p4 are requested over 40 seconds. Press "Next event".' });
  frames[frames.length - 1].text += ' Summary: popular p1 was served from memory most of the time; p2 returned after being evicted and missed again.';
  return frames;
}

function staleFrames(invalidate) {
  const events = [
    { t: 0, key: 'price:7', value: '₹100' },
    { t: 10, key: 'price:7', value: '₹100' },
    { type: 'update', t: 15, key: 'price:7', value: '₹120', invalidate },
    { t: 20, key: 'price:7' },
    { t: 25, key: 'price:7' },
    { t: 31, key: 'price:7' },
  ];
  const frames = simulate(events, { capacity: 3, ttl: 30, initialText: `Product 7's price is cached with a 30 s TTL. ${invalidate ? 'Active invalidation is ON.' : 'Active invalidation is OFF: only the TTL removes old values.'} Press "Next event".` });
  frames[frames.length - 1].text += invalidate
    ? ' With delete-on-write, no stale price was ever served.'
    : ' Without invalidation, users saw the old price for up to the TTL — fine for a listing page, never for the checkout itself.';
  return frames;
}

function stampedeFrames(coalescing) {
  const frames = [{
    time: 60, rows: [{ key: 'trending', value: '(expired)', exp: 60, used: 59 }], hits: 0, misses: 0, db: 0, dbLoad: 0, key: 'trending',
    text: `t=60.0 s: the hot key "trending" (read ~1,000 times a second) has just expired. Rebuilding it takes a 300 ms database query. ${coalescing ? 'Request coalescing is ON.' : 'Request coalescing is OFF.'} Eight requests arrive before the rebuild finishes. Press "Next event".`,
  }];
  let misses = 0;
  let hits = 0;
  let db = 0;
  let load = 0;
  for (let i = 1; i <= 8; i += 1) {
    const t = (60 + i * 0.03).toFixed(2);
    misses += 1;
    let text;
    if (!coalescing || i === 1) {
      db += 1;
      load += 1;
      text = `t=${t} s: request ${i} misses and ${i === 1 ? 'starts' : 'ALSO starts'} the 300 ms rebuild query (${load} identical queries running).`;
      if (!coalescing && load > 2) text += ' The database is now overloaded, so every query slows down — the stampede feeds itself.';
    } else {
      text = `t=${t} s: request ${i} misses, sees a rebuild already in progress for this key, and waits for its result instead of querying.`;
    }
    frames.push({ time: t, rows: [{ key: 'trending', value: '(rebuilding)', exp: null, used: t }], hits, misses, db, dbLoad: load, key: 'trending', text });
  }
  frames.push({
    time: '60.30', rows: [{ key: 'trending', value: 'top-10 list', exp: 120, used: '60.30' }], hits, misses, db, dbLoad: 0, key: 'trending',
    text: coalescing
      ? 'Rebuild done: ONE query refreshed the key and all eight waiting requests got the result. Later requests are hits again.'
      : `Rebuild done, but the database ran ${db} identical heavy queries at once. With 1,000 requests/s the real number would be hundreds. Defences: coalescing, serving the stale value while one request refreshes, TTL jitter and early refresh.`,
  });
  return frames;
}
