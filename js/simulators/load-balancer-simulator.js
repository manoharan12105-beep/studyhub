// L4 vs L7 load balancing, one request at a time.
//
//   mode (L4 / L7) + algorithm + health of instance 3 → each "next request"
//   shows what the balancer can see, which backend it picks and why.
//
// L4 sees only the TCP connection (client IP:port → VIP:443) and pins a whole
// connection to one backend; L7 terminates TLS, reads the HTTP request and can
// route each request by path. Open-ended: steps are produced lazily.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select } from './network-common.js';

const MODES = { l7: 'L7 (HTTP-aware, terminates TLS)', l4: 'L4 (TCP connections only)' };
const ALGOS = { rr: 'Round robin', lc: 'Least connections' };

// A repeating stream of requests from three client connections.
const REQUESTS = [
  { conn: 'A', client: '198.51.100.20:51000', path: 'GET /api/orders', cost: 1 },
  { conn: 'B', client: '203.0.113.77:40112', path: 'GET /static/logo.png', cost: 1 },
  { conn: 'A', client: '198.51.100.20:51000', path: 'POST /api/orders', cost: 1 },
  { conn: 'C', client: '192.0.2.15:62000', path: 'GET /api/reports/yearly', cost: 4 },
  { conn: 'B', client: '203.0.113.77:40112', path: 'GET /static/app.js', cost: 1 },
  { conn: 'A', client: '198.51.100.20:51000', path: 'GET /api/cart', cost: 1 },
  { conn: 'C', client: '192.0.2.15:62000', path: 'GET /api/orders/7', cost: 1 },
  { conn: 'B', client: '203.0.113.77:40112', path: 'GET /api/products', cost: 1 },
];

const API = ['api-1', 'api-2', 'api-3'];

export function mount(root, { options }) {
  const mode = select(MODES, options.mode || 'l7');
  const algo = select(ALGOS, options.algorithm || 'rr');
  const healthy = el('input', { type: 'checkbox', checked: true });
  root.append(el('div', { class: 'viz-form' }, field('Load balancer', mode), field('Algorithm', algo),
    el('label', { class: 'perm-special' }, healthy, ' api-3 passes health checks')));

  const servers = el('ul', { class: 'lb-servers' });
  const seen = el('p', { class: 'flow-status' });
  root.append(el('div', { class: 'viz-stage' }, seen, servers));
  const stepper = createStepper(root, { render, playDelay: 1600, nextLabel: 'Next request' });

  function render(frame) {
    seen.textContent = frame.seen;
    const pools = frame.mode === 'l7' ? [...API, 'static-1'] : API;
    servers.replaceChildren(...pools.map((id) => {
      const s = frame.servers[id] || { total: 0, active: 0 };
      const down = id === 'api-3' && !frame.healthy;
      return el('li', { class: ['lb-server', frame.target === id ? 'is-current' : '', down ? 'is-down' : ''].join(' ') },
        el('strong', {}, id), el('span', {}, down ? 'unhealthy — no traffic' : `requests ${s.total} · active ${s.active}`),
        el('span', { class: 'lb-last' }, s.last ? `last: ${s.last}` : ''));
    }));
  }

  function start() {
    const first = { n: 0, servers: {}, rr: 0, pins: {}, mode: mode.value, healthy: healthy.checked, target: null,
      seen: mode.value === 'l7' ? 'L7 balancer: will decrypt TLS and read each HTTP request.' : 'L4 balancer: will see only IPs and ports of TCP connections.',
      text: 'Three clients (A, B, C) keep connections open and send requests. Press "Next request".' };
    stepper.load(first, (frame) => next(frame, algo.value));
  }

  for (const c of [mode, algo]) c.addEventListener('change', start);
  healthy.addEventListener('change', start);
  start();
  return stepper;
}

function next(frame, algorithm) {
  if (frame.n >= 16) return null;
  const req = REQUESTS[frame.n % REQUESTS.length];
  const servers = structuredClone(frame.servers);
  // Requests finish over time: decay active counts so least-connections has something to compare.
  for (const s of Object.values(servers)) s.active = Math.max(0, s.active - 1);
  const pool = API.filter((id) => id !== 'api-3' || frame.healthy);
  let target;
  let why;
  let seen;
  const pins = { ...frame.pins };

  if (frame.mode === 'l4') {
    seen = `Sees: TCP ${req.client} → 203.0.113.10:443 (encrypted bytes — the path is invisible).`;
    if (pins[req.conn] && pool.includes(pins[req.conn])) {
      target = pins[req.conn];
      why = `Connection ${req.conn} is already assigned to ${target}; an L4 balancer forwards the whole TCP connection, so every request on it goes to the same backend — even "${req.path}".`;
    } else {
      target = pick(pool, servers, frame.rr, algorithm);
      pins[req.conn] = target;
      why = `New connection ${req.conn}: ${algorithm === 'rr' ? 'round robin' : 'least connections'} picks ${target}. All later requests on this connection will follow it.`;
    }
  } else {
    seen = `Sees after TLS termination: "${req.path}" from client ${req.client.split(':')[0]} (adds X-Forwarded-For).`;
    if (req.path.includes('/static/')) {
      target = 'static-1';
      why = `Path rule: /static/* → the static pool (static-1). Only an L7 balancer can route by path. Each request is balanced on its own, regardless of the connection.`;
    } else {
      target = pick(pool, servers, frame.rr, algorithm);
      why = `Path rule: /api/* → API pool; ${algorithm === 'rr' ? 'round robin' : 'least connections'} picks ${target} for this single request.${req.cost > 1 ? ' This report request is slow (it stays active longer).' : ''}`;
    }
  }

  const s = servers[target] || { total: 0, active: 0 };
  servers[target] = { total: s.total + 1, active: s.active + req.cost, last: req.path };
  const skipped = !frame.healthy ? ' api-3 failed its health check, so it is skipped.' : '';
  return {
    n: frame.n + 1, servers, pins, mode: frame.mode, healthy: frame.healthy, target, seen,
    rr: API.includes(target) ? frame.rr + 1 : frame.rr,
    text: `Request ${frame.n + 1} (${req.conn}): ${req.path}. ${why}${skipped}`,
  };
}

function pick(pool, servers, rr, algorithm) {
  if (algorithm === 'lc') {
    return [...pool].sort((a, b) => (servers[a]?.active || 0) - (servers[b]?.active || 0) || pool.indexOf(a) - pool.indexOf(b))[0];
  }
  return pool[rr % pool.length];
}
