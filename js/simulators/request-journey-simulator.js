// The journey of one request: client → DNS → load balancer → API server → cache → database → back.
//
//   scenario → first frame → [Next hop] → one hop: what happens, how long it takes, running total
//
// Each hop adds its typical latency to a running total, so the learner sees where
// time goes on a cache hit, a cache miss, a first visit (DNS + handshakes) and
// when the cache is down. Times are illustrative orders of magnitude, not measurements.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select, statsView } from './system-design-common.js';

const NODES = [
  ['client', 'Client'],
  ['dns', 'DNS'],
  ['lb', 'Load balancer'],
  ['api', 'API server'],
  ['cache', 'Cache (Redis)'],
  ['db', 'Database'],
  ['back', 'Response'],
];

const SCENARIOS = {
  hit: 'Returning user, cache hit',
  miss: 'Returning user, cache miss',
  first: 'First visit (DNS lookup + new connection), cache hit',
  'cache-down': 'Cache cluster is down',
};

// Hops per scenario: [node, ms, explanation]. The round-trip time client ↔ region is 40 ms.
function hops(scenario) {
  const list = [];
  if (scenario === 'first') {
    list.push(['dns', 60, 'DNS: nothing cached yet, so the resolver walks root → .com TLD → authoritative server and returns the load balancer\'s IP (cached afterwards for the record\'s TTL).']);
    list.push(['lb', 80, 'Connect: TCP handshake (1 round trip) + TLS 1.3 handshake (1 round trip) with the load balancer — 2 × 40 ms before the request is even sent.']);
  } else {
    list.push(['dns', 0, 'DNS: the answer is already cached in the browser/OS, so no lookup is needed (0 ms).']);
    list.push(['lb', 0, 'Connection: an open keep-alive connection is reused, so there are no new handshakes.']);
  }
  list.push(['lb', 20, 'Request travels to the load balancer (half of the 40 ms round trip); it terminates TLS, checks which servers are healthy and forwards GET /api/feed to api-2.']);
  list.push(['api', 3, 'API server api-2 verifies the token and runs the handler (a few ms of CPU work).']);
  if (scenario === 'cache-down') {
    list.push(['cache', 50, 'Cache call fails: the connection to Redis times out after a 50 ms timeout. The server treats it as a miss — every request now goes to the database.', true]);
    list.push(['db', 45, 'Database: query follows + recent photos and sort (45 ms). With the cache down, ALL traffic arrives here; at a 95 % normal hit ratio that is 20× the usual database load.']);
  } else if (scenario === 'miss') {
    list.push(['cache', 1, 'Cache lookup for feed:alan → MISS (1 ms).']);
    list.push(['db', 45, 'Database: query follows + recent photos, sorted by time, using the (posted_by, upload_time) index (45 ms).']);
    list.push(['cache', 1, 'The result is written back into the cache with a 30 s TTL, so the next request is a hit (cache-aside).']);
  } else {
    list.push(['cache', 1, 'Cache lookup for feed:alan → HIT (1 ms). The database is not touched.']);
  }
  list.push(['back', 20, 'The JSON response travels back to the client (the other half of the round trip). Images then load from a CDN edge near the user.']);
  return list;
}

export function mount(root, { options }) {
  const scenario = select(SCENARIOS, options.scenario || 'hit');
  root.append(el('div', { class: 'viz-form' }, field('Scenario', scenario)));

  const lane = el('ol', { class: 'flow-lane' }, NODES.map(([id, label]) => el('li', { class: 'flow-node', 'data-node': id }, el('span', {}, label))));
  const status = el('p', { class: 'flow-status' });
  const stats = statsView('Latency so far');
  root.append(el('div', { class: 'viz-stage' }, lane, status, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1600, nextLabel: 'Next hop' });

  function render(frame) {
    for (const li of lane.children) {
      const id = li.dataset.node;
      li.className = ['flow-node',
        id === frame.node ? 'is-current' : '',
        frame.visited.includes(id) ? 'is-visited' : '',
        frame.error && id === frame.node ? 'is-error' : ''].join(' ');
      li.toggleAttribute('aria-current', id === frame.node);
    }
    status.textContent = frame.done ? `Response received after about ${frame.total} ms.` : `Elapsed: ${frame.total} ms`;
    status.className = `flow-status ${frame.done ? (frame.slow ? 'is-error' : 'is-ok') : ''}`;
    stats.render([['This hop', `${frame.ms} ms`], ['Total', `${frame.total} ms`], ['Database queries', frame.dbQueries]]);
  }

  function start() {
    const list = hops(scenario.value);
    const first = { node: 'client', visited: ['client'], ms: 0, total: 0, dbQueries: 0, step: 0,
      text: 'The app needs the home feed: GET https://photoapp.example.com/api/feed. Press "Next hop" to follow the request.' };
    stepper.load(first, (frame) => {
      if (frame.step >= list.length) return null;
      const [node, ms, why, error] = list[frame.step];
      const total = frame.total + ms;
      const done = frame.step === list.length - 1;
      return {
        node, ms, total, error: Boolean(error), done, slow: total > 150,
        visited: [...frame.visited, node],
        dbQueries: frame.dbQueries + (node === 'db' ? 1 : 0),
        step: frame.step + 1,
        text: `${why}${done ? ` Total ≈ ${total} ms.` : ''}`,
      };
    });
  }

  scenario.addEventListener('change', start);
  start();
  return stepper;
}
