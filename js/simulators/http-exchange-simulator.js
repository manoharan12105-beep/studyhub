// An HTTP request and its response, with a prediction step.
//
//   scenario → the raw request → (learner predicts the status class) →
//   what the server checks, in order → the raw response and why that status.
//
// The API is an orders service like a Spring Boot REST controller; the checks
// follow the order a real stack applies them (routing → method → authentication
// → authorization → body validation → business rules).

import { el, escapeHtml } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select } from './network-common.js';

const SCENARIOS = {
  get: { label: 'GET an existing order', status: '200 OK' },
  create: { label: 'POST a new order', status: '201 Created' },
  missing: { label: 'GET an order that does not exist', status: '404 Not Found' },
  invalid: { label: 'POST with quantity 0', status: '400 Bad Request' },
  notoken: { label: 'GET without a token', status: '401 Unauthorized' },
  norole: { label: 'DELETE as a normal user', status: '403 Forbidden' },
  method: { label: 'PATCH on a read-only endpoint', status: '405 Method Not Allowed' },
  conflict: { label: 'POST a duplicate order number', status: '409 Conflict' },
  timeout: { label: 'GET through the load balancer while the backend hangs', status: '504 Gateway Timeout' },
};

const REQUESTS = {
  get: 'GET /api/orders/7 HTTP/1.1\nHost: api.example.com\nAuthorization: Bearer eyJ…(user 42, ROLE_USER)\nAccept: application/json',
  create: 'POST /api/orders HTTP/1.1\nHost: api.example.com\nAuthorization: Bearer eyJ…(user 42, ROLE_USER)\nContent-Type: application/json\nContent-Length: 31\n\n{"productId": 7, "quantity": 2}',
  missing: 'GET /api/orders/999 HTTP/1.1\nHost: api.example.com\nAuthorization: Bearer eyJ…(user 42, ROLE_USER)\nAccept: application/json',
  invalid: 'POST /api/orders HTTP/1.1\nHost: api.example.com\nAuthorization: Bearer eyJ…(user 42, ROLE_USER)\nContent-Type: application/json\nContent-Length: 31\n\n{"productId": 7, "quantity": 0}',
  notoken: 'GET /api/orders/7 HTTP/1.1\nHost: api.example.com\nAccept: application/json',
  norole: 'DELETE /api/orders/7 HTTP/1.1\nHost: api.example.com\nAuthorization: Bearer eyJ…(user 42, ROLE_USER)',
  method: 'PATCH /api/products/7 HTTP/1.1\nHost: api.example.com\nAuthorization: Bearer eyJ…(user 42, ROLE_USER)\nContent-Type: application/json\n\n{"price": 10}',
  conflict: 'POST /api/orders HTTP/1.1\nHost: api.example.com\nAuthorization: Bearer eyJ…(user 42, ROLE_USER)\nContent-Type: application/json\n\n{"orderNumber": "A-1001", "productId": 7, "quantity": 1}',
  timeout: 'GET /api/reports/yearly HTTP/1.1\nHost: api.example.com\nAuthorization: Bearer eyJ…(user 42, ROLE_USER)',
};

const RESPONSES = {
  get: 'HTTP/1.1 200 OK\nContent-Type: application/json\nCache-Control: no-store\n\n{"id": 7, "status": "SHIPPED"}',
  create: 'HTTP/1.1 201 Created\nLocation: /api/orders/8\nContent-Type: application/json\n\n{"id": 8, "status": "NEW"}',
  missing: 'HTTP/1.1 404 Not Found\nContent-Type: application/problem+json\n\n{"title": "Not Found", "detail": "Order 999 not found"}',
  invalid: 'HTTP/1.1 400 Bad Request\nContent-Type: application/problem+json\n\n{"title": "Bad Request", "errors": {"quantity": "must be greater than or equal to 1"}}',
  notoken: 'HTTP/1.1 401 Unauthorized\nWWW-Authenticate: Bearer',
  norole: 'HTTP/1.1 403 Forbidden\nContent-Type: application/problem+json\n\n{"title": "Forbidden"}',
  method: 'HTTP/1.1 405 Method Not Allowed\nAllow: GET, HEAD',
  conflict: 'HTTP/1.1 409 Conflict\nContent-Type: application/problem+json\n\n{"title": "Conflict", "detail": "Order number A-1001 already exists"}',
  timeout: 'HTTP/1.1 504 Gateway Timeout\nContent-Type: text/html\n\n<html>504 Gateway Time-out</html>',
};

const CHECKS = {
  get: [['Route', 'GET /api/orders/{id} → OrderController.get()', true], ['Authentication', 'Bearer token valid → user 42', true], ['Authorization', 'ROLE_USER may read own orders', true], ['Lookup', 'order 7 found in PostgreSQL', true]],
  create: [['Route', 'POST /api/orders → OrderController.create()', true], ['Authentication', 'token valid', true], ['Authorization', 'ROLE_USER may create', true], ['Validation', '@Valid: quantity 2 ≥ 1', true], ['Business', 'INSERT order 8, commit', true]],
  missing: [['Route', 'GET /api/orders/{id}', true], ['Authentication', 'token valid', true], ['Authorization', 'allowed', true], ['Lookup', 'no row with id 999', false]],
  invalid: [['Route', 'POST /api/orders', true], ['Authentication', 'token valid', true], ['Authorization', 'allowed', true], ['Validation', '@Min(1) on quantity fails: 0', false]],
  notoken: [['Route', 'GET /api/orders/{id}', true], ['Authentication', 'no Authorization header → anonymous', false]],
  norole: [['Route', 'DELETE /api/orders/{id}', true], ['Authentication', 'token valid → user 42', true], ['Authorization', 'DELETE requires ROLE_ADMIN', false]],
  method: [['Route', '/api/products/{id} exists — but only GET and HEAD are mapped', false]],
  conflict: [['Route', 'POST /api/orders', true], ['Authentication', 'token valid', true], ['Authorization', 'allowed', true], ['Validation', 'body valid', true], ['Business', 'unique constraint on order_number violated', false]],
  timeout: [['Load balancer', 'forwards to instance 2', true], ['Backend', 'report query still running after 60 s', false], ['Load balancer', 'idle/read timeout reached — gives up on the backend', false]],
};

const EXPLAIN = {
  get: 'Everything succeeded and there is a body: 200 OK. The response is personal data, so it must not be stored in shared caches (Cache-Control: no-store).',
  create: 'A new resource was created: 201 Created, with a Location header pointing to it. POST is not idempotent — sending it again would create order 9.',
  missing: 'The server is up and the request was fine, but there is no resource at that URL: 404 Not Found. A 404 never means "server down".',
  invalid: 'The request is syntactically fine JSON but breaks a validation rule — a client error: 400 Bad Request with field errors (some APIs use 422 for this). Retrying the same request will fail again.',
  notoken: 'Spring Security found no credentials, so the request is not authenticated: 401 Unauthorized with WWW-Authenticate. The controller is never called. Fix: log in / send a token.',
  norole: 'The user IS authenticated, but lacks permission: 403 Forbidden. Logging in again does not help. 401 = who are you? 403 = I know you, and no.',
  method: 'The URL exists but not with this method: 405 Method Not Allowed, with an Allow header listing what is supported.',
  conflict: 'The request conflicts with the current state of the resource (a duplicate unique value, or a stale version in optimistic locking): 409 Conflict.',
  timeout: 'The load balancer — not the application — answered: the backend did not respond within its timeout, so 504 Gateway Timeout. 502 would mean the backend sent an invalid response or reset the connection; 503 that no healthy backend was available.',
};

const CLASSES = ['2xx', '3xx', '4xx', '5xx'];

export function mount(root, { options }) {
  const scenario = select(Object.fromEntries(Object.entries(SCENARIOS).map(([k, v]) => [k, v.label])), options.scenario || 'get');
  root.append(el('div', { class: 'viz-form' }, field('Request', scenario)));

  const request = el('pre', { class: 'mini-code term-out', tabindex: 0, 'aria-label': 'HTTP request' });
  const checks = el('ol', { class: 'chain-list http-checks' });
  const response = el('pre', { class: 'mini-code term-out', tabindex: 0, 'aria-label': 'HTTP response' });
  const predictLine = el('p', { class: 'trouble-prompt' }, 'Predict the status class before you step on:');
  const predictButtons = el('div', { class: 'trouble-choices', role: 'group', 'aria-label': 'Predict the status class' },
    CLASSES.map((c) => el('button', { type: 'button', class: 'btn btn-secondary btn-sm', 'data-class': c }, c)));
  const verdict = el('p', { class: 'viz-note', 'aria-live': 'polite' });
  root.append(el('div', { class: 'viz-stage' },
    el('p', { class: 'tree-side-title' }, 'Request'), request, predictLine, predictButtons, verdict,
    el('p', { class: 'tree-side-title ps-title' }, 'What the server checks'), checks,
    el('p', { class: 'tree-side-title ps-title' }, 'Response'), response));
  const stepper = createStepper(root, { render, playDelay: 1900, nextLabel: 'Next step' });

  predictButtons.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-class]');
    if (!button) return;
    const actual = `${SCENARIOS[scenario.value].status[0]}xx`;
    const ok = button.dataset.class === actual;
    verdict.textContent = ok
      ? `✓ Right: it is ${actual}. Step through to see exactly which check decides it.`
      : `✗ Not ${button.dataset.class}. Step through the checks to find out why.`;
  });

  function render(frame) {
    const name = scenario.value;
    request.innerHTML = highlight(REQUESTS[name], 'http');
    const list = CHECKS[name].slice(0, frame.checks);
    checks.replaceChildren(...(list.length
      ? list.map(([what, detail, pass], i) => el('li', { class: i === list.length - 1 ? 'is-current' : '' }, `${pass ? '✓' : '✗'} ${what}: ${detail}`))
      : [el('li', { class: 'muted' }, 'Not processed yet.')]));
    response.innerHTML = frame.response ? highlight(RESPONSES[name], 'http') : escapeHtml('(no response yet)');
  }

  function start() {
    const name = scenario.value;
    verdict.textContent = '';
    const frames = [{ checks: 0, response: false, text: 'Read the request line and headers. Which status class will the server return? Choose a prediction, then press Next step.' }];
    CHECKS[name].forEach(([what, detail, pass], i) => {
      frames.push({ checks: i + 1, response: false, text: `${what}: ${detail}. ${pass ? 'Passes — continue.' : 'Fails — the request stops here.'}` });
    });
    frames.push({ checks: CHECKS[name].length, response: true, text: `${SCENARIOS[name].status}. ${EXPLAIN[name]}` });
    stepper.load(frames[0], frames.slice(1));
  }

  scenario.addEventListener('change', start);
  start();
  return stepper;
}
