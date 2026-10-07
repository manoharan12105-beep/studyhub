// Sharding: how the choice of shard key spreads rows and traffic.
//
//   shard key + shard count → users are placed batch by batch → rows per shard →
//   requests per shard (including one celebrity) → the hottest shard and why.
//
// The dataset is invented but shaped like real traffic: most users come from
// one country, newer users (higher IDs, later signup months) are more active,
// and user 22 (a recent signup in the biggest country) is a celebrity whose profile receives far more requests.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { barsView, hash32, select, statsView } from './system-design-common.js';

const KEYS = {
  'user-hash': 'hash(user_id) % N',
  country: 'Range by country',
  signup: 'Range by signup month',
};
const COUNTS = { 2: '2 shards', 3: '3 shards', 4: '4 shards', 6: '6 shards' };

const COUNTRIES = ['IN', 'IN', 'US', 'IN', 'BR', 'IN', 'DE', 'IN', 'US', 'IN', 'JP', 'IN'];
const USERS = Array.from({ length: 24 }, (_, i) => {
  const id = i + 1;
  return {
    id,
    country: COUNTRIES[i % COUNTRIES.length],
    month: Math.ceil(id / 2),                       // IDs are assigned in signup order
    requests: id === 22 ? 400 : 10 + id * 2,          // newer users are more active; user 22 is a celebrity
  };
});

export function mount(root, { options }) {
  const key = select(KEYS, options.key || 'user-hash');
  const count = select(COUNTS, String(options.shards || 4));
  root.append(el('div', { class: 'viz-form' }, field('Shard key', key), field('Shards', count)));

  const rows = barsView('Users per shard');
  const load = barsView('Requests per shard');
  const stats = statsView('Balance');
  root.append(el('div', { class: 'viz-stage' },
    el('p', { class: 'tree-side-title' }, 'Users (rows) per shard'), rows.node,
    el('p', { class: 'tree-side-title' }, 'Requests per second per shard'), load.node, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1500, nextLabel: 'Next batch' });

  function render(frame) {
    const maxRows = Math.max(1, ...frame.shards.map((s) => s.users.length));
    rows.render(frame.shards.map((s, i) => ({
      label: `Shard ${i}`, value: s.users.length, max: maxRows,
      note: `${s.users.length} users${s.users.length ? ` (${s.users.slice(-3).map((u) => `#${u.id}`).join(', ')}${s.users.length > 3 ? '…' : ''})` : ''}`,
      state: frame.highlight === i ? 'current' : '',
    })));
    const maxLoad = Math.max(1, ...frame.shards.map((s) => s.load));
    load.render(frame.shards.map((s, i) => ({
      label: `Shard ${i}`, value: frame.showLoad ? s.load : 0, max: maxLoad,
      note: frame.showLoad ? `${s.load} req/s` : '—',
      state: frame.showLoad && i === frame.hot ? 'hot' : '',
    })));
    stats.render(frame.showLoad
      ? [['Busiest shard', `${frame.hotShare} % of traffic`], ['Even share would be', `${Math.round(100 / frame.shards.length)} %`]]
      : [['Users placed', frame.placed], ['Total users', USERS.length]]);
  }

  function start() {
    const n = Number(count.value);
    const shardOf = mapper(key.value, n);
    const shards = Array.from({ length: n }, () => ({ users: [], load: 0 }));
    const frames = [{ shards: clone(shards), placed: 0, showLoad: false, text: `${n} shards, shard key: ${KEYS[key.value]}. 24 users are placed in batches of 6. Press "Next batch".` }];
    for (let b = 0; b < 4; b += 1) {
      const batch = USERS.slice(b * 6, b * 6 + 6);
      const placed = batch.map((u) => { const s = shardOf(u); shards[s].users.push(u); return `#${u.id}→${s}`; });
      frames.push({ shards: clone(shards), placed: (b + 1) * 6, showLoad: false, text: `Users ${b * 6 + 1}–${b * 6 + 6}: ${placed.join(', ')}.${explainBatch(key.value, b)}` });
    }
    for (const s of shards) s.load = s.users.reduce((sum, u) => sum + u.requests, 0);
    const total = shards.reduce((sum, s) => sum + s.load, 0);
    const hot = shards.reduce((best, s, i) => (s.load > shards[best].load ? i : best), 0);
    const hotShare = Math.round((shards[hot].load / total) * 100);
    const hasCeleb = shards[hot].users.some((u) => u.id === 22);
    frames.push({ shards: clone(shards), placed: 24, showLoad: true, hot, hotShare, text: `Now traffic: shard ${hot} receives ${hotShare} % of all requests (an even share is ${Math.round(100 / n)} %).${hasCeleb ? ' It holds celebrity user #22 (400 req/s on their own) — a hot key that no shard key can split by itself.' : ''}` });
    frames.push({ shards: clone(shards), placed: 24, showLoad: true, hot, hotShare, text: verdict(key.value, hotShare, n) });
    stepper.load(frames[0], frames.slice(1));
  }

  key.addEventListener('change', start);
  count.addEventListener('change', start);
  start();
  return stepper;
}

function mapper(key, n) {
  if (key === 'user-hash') return (u) => hash32(`user:${u.id}`) % n;
  if (key === 'country') {
    const order = ['BR', 'DE', 'IN', 'JP', 'US'];   // alphabetical ranges, split as evenly as possible
    return (u) => Math.min(n - 1, Math.floor((order.indexOf(u.country) * n) / order.length));
  }
  return (u) => Math.min(n - 1, Math.floor(((u.month - 1) * n) / 12));   // months 1–12 split into n ranges
}

function clone(shards) {
  return shards.map((s) => ({ users: s.users.slice(), load: s.load }));
}

function explainBatch(key, batch) {
  if (batch !== 0) return '';
  if (key === 'user-hash') return ' Hashing scatters consecutive IDs across shards.';
  if (key === 'country') return ' Each shard owns a range of countries — and most users are in one country.';
  return ' Each shard owns a range of months — new signups always land in the last range.';
}

function verdict(key, share, n) {
  const even = Math.round(100 / n);
  if (key === 'user-hash') {
    return `Hash partitioning spread users evenly; the remaining imbalance (${share} % vs ${even} %) comes from individual hot users such as #22. Fix hot keys with caching or by splitting them — rows are balanced. Range queries by user ID now touch every shard.`;
  }
  if (key === 'country') {
    return `Country ranges create a hot partition: the shard holding India gets most users and traffic (${share} %). Geography is useful for data residency, but as the only key it rarely balances load — combine it with a hash of the user ID within each region.`;
  }
  return `Signup-month ranges send every new (and most active) user to the last shard (${share} % of traffic) while old shards sit idle — the classic hotspot of sequential keys under range partitioning. Hash the key instead, or add a high-cardinality component.`;
}
