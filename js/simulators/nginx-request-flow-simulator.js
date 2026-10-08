// Nginx request flow: one browser request through DNS, Nginx, TLS, proxy_pass,
// Spring Boot and PostgreSQL — and what the client sees when a hop fails
// (redirect, 502, 504, 413, certificate error).
//
//   scenario → hops [node, ok?, explanation] → frames with the final status code
//
// Behaviour follows the Nginx lessons; the 301 redirect, proxying and the 502
// page were observed with Nginx 1.30.5 in front of the Task API. A StudyHub simulation.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select, statsView } from './system-design-common.js';

const NODES = [
  ['browser', 'Browser'],
  ['dns', 'DNS'],
  ['nginx', 'Nginx :80/:443'],
  ['tls', 'TLS'],
  ['proxy', 'proxy_pass'],
  ['app', 'Spring Boot'],
  ['db', 'PostgreSQL'],
  ['response', 'Response'],
];

const SCENARIOS = {
  ok: 'https://api.example.com/api/tasks — everything works',
  redirect: 'http://api.example.com/api/tasks (plain HTTP)',
  'app-down': 'App container stopped',
  'wrong-port': 'proxy_pass points to the wrong port',
  slow: 'Slow query (90 s)',
  upload: 'Upload of 25 MB',
  cert: 'Certificate expired',
};

function hops(s) {
  const list = [['dns', true, 'DNS: api.example.com → A record → 203.0.113.10.']];
  if (s === 'redirect') {
    list.push(['nginx', true, 'Port 80 server block: return 301 https://$host$request_uri.']);
    list.push(['response', true, '301 Moved Permanently with Location: https://api.example.com/api/tasks — the browser repeats the request over HTTPS.', 301]);
    return list;
  }
  list.push(['nginx', true, 'Port 443: the server block whose server_name matches the Host header (and the TLS SNI name) is chosen.']);
  if (s === 'cert') {
    list.push(['tls', false, 'TLS handshake: the certificate\'s notAfter date has passed. The browser stops with a certificate error before any HTTP is sent — no status code, nothing in the app logs. Fix renewal (certbot renew --dry-run), renew, reload Nginx.', 0]);
    return list;
  }
  list.push(['tls', true, 'TLS handshake: the Let\'s Encrypt certificate is valid for api.example.com; the request is decrypted at Nginx.']);
  if (s === 'upload') {
    list.push(['nginx', false, 'The body (25 MB) exceeds client_max_body_size 10m: Nginx answers itself and never contacts the app.', 413]);
    return list;
  }
  if (s === 'app-down' || s === 'wrong-port') {
    list.push(['proxy', false, s === 'app-down'
      ? 'proxy_pass http://127.0.0.1:8080: nothing listens — error.log: connect() failed (111: Connection refused) while connecting to upstream.'
      : 'proxy_pass http://127.0.0.1:8081 but the app is published on 8080: connection refused, same error.log line, different cause.']);
    list.push(['response', false, 'Nginx returns its own 502 Bad Gateway page. Nginx is fine — the upstream is not. Check docker compose ps, the published port and the app logs.', 502]);
    return list;
  }
  list.push(['proxy', true, 'proxy_pass http://127.0.0.1:8080 with Host, X-Real-IP, X-Forwarded-For and X-Forwarded-Proto: https.']);
  list.push(['app', true, 'Spring Boot handles GET /api/tasks (forward-headers-strategy: native — it knows the client used HTTPS).']);
  if (s === 'slow') {
    list.push(['db', false, 'The query runs for 90 seconds; proxy_read_timeout is 60 s.']);
    list.push(['response', false, 'Nginx gives up waiting: 504 Gateway Timeout (error.log: upstream timed out). Fix the query first; raise the timeout only if long requests are expected.', 504]);
    return list;
  }
  list.push(['db', true, 'Query over the Docker network: db:5432 → rows returned.']);
  list.push(['response', true, '200 OK with the JSON, plus HSTS, nosniff, X-Frame-Options and Referrer-Policy headers added by Nginx.', 200]);
  return list;
}

export function mount(root, { options }) {
  const scenario = select(SCENARIOS, options.scenario || 'ok');
  root.append(el('div', { class: 'viz-form' }, field('Scenario', scenario)));
  root.append(el('p', { class: 'viz-note' }, 'StudyHub simulation — no request leaves your browser.'));
  const lane = el('ol', { class: 'flow-lane' }, NODES.map(([id, label]) => el('li', { class: 'flow-node', 'data-node': id }, el('span', {}, label))));
  const status = el('p', { class: 'flow-status' });
  const stats = statsView('Result');
  root.append(el('div', { class: 'viz-stage' }, lane, status, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1600, nextLabel: 'Next hop' });

  function render(frame) {
    for (const li of lane.children) {
      const id = li.dataset.node;
      li.className = ['flow-node', frame.visited.includes(id) ? 'is-visited' : '', id === frame.node ? 'is-current' : '', id === frame.node && !frame.ok ? 'is-error' : ''].join(' ');
      li.toggleAttribute('aria-current', id === frame.node);
    }
    const code = frame.code === undefined ? '…' : frame.code === 0 ? 'no response (TLS error)' : frame.code;
    status.textContent = frame.code === undefined ? 'Request in flight…' : `Client receives: ${code}`;
    status.className = `flow-status ${frame.code === undefined ? '' : frame.code === 200 || frame.code === 301 ? 'is-ok' : 'is-error'}`;
    stats.render([['Hops', frame.visited.length], ['Status', code]]);
  }

  function start() {
    const list = hops(scenario.value);
    const first = { node: 'browser', visited: ['browser'], ok: true, text: `${SCENARIOS[scenario.value]}. Press "Next hop".` };
    let visited = ['browser'];
    const frames = list.map(([node, ok, text, code]) => {
      visited = visited.includes(node) ? visited : [...visited, node];
      return { node, ok, visited, code, text };
    });
    stepper.load(first, frames);
  }

  scenario.addEventListener('change', start);
  start();
  return stepper;
}
