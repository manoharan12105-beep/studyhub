// Simulation: one HTTP request through a Spring Boot application.
//
//   input (auth, body, service outcome) → state → Next → one hop → UI + reason
//
// Each hop names the component, what it does, and — when something goes wrong —
// who turns the failure into which HTTP status. Steps are generated lazily by
// a small state machine, the same pattern any future simulator can follow
// (load balancer, TCP handshake, DNS lookup, …).

import { el } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper, field } from '../engagement/stepper.js';

const NODES = [
  ['client', 'Client'],
  ['tomcat', 'Tomcat'],
  ['filters', 'Servlet filters'],
  ['security', 'Security filter chain'],
  ['dispatcher', 'DispatcherServlet'],
  ['interceptor', 'Interceptors'],
  ['controller', 'Controller'],
  ['service', 'Service (@Transactional)'],
  ['repository', 'Repository'],
  ['db', 'Database'],
];

const AUTH = { valid: 'Valid token, ROLE_USER', none: 'No token', norole: 'Valid token, no ROLE_USER' };
const BODY = { valid: 'Valid: {"productId": 7, "quantity": 2}', invalid: 'Invalid: {"productId": 7, "quantity": 0}' };
const OUTCOME = { ok: 'Product exists', missing: 'Product 7 not found' };

export function mount(root, { options }) {
  const auth = select(AUTH, options.auth || 'valid');
  const body = select(BODY, options.body || 'valid');
  const outcome = select(OUTCOME, options.outcome || 'ok');
  root.append(el('div', { class: 'viz-form' }, field('Authentication', auth), field('Request body', body), field('Service outcome', outcome)));

  const code = el('pre', { class: 'mini-code', tabindex: 0 });
  code.innerHTML = highlight(`@PostMapping("/api/orders")              // requires ROLE_USER
public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest req) {
    return ResponseEntity.status(201).body(orderService.create(req));
}
record CreateOrderRequest(@NotNull Long productId, @Min(1) int quantity) { }`, 'java');
  const lane = el('ol', { class: 'flow-lane' }, NODES.map(([id, label]) => el('li', { class: 'flow-node', 'data-node': id }, el('span', {}, label))));
  const status = el('p', { class: 'flow-status' });
  root.append(el('div', { class: 'code-block' }, code), el('div', { class: 'viz-stage' }, lane, status));
  const stepper = createStepper(root, { render, playDelay: 1500, nextLabel: 'Next hop' });

  function start() {
    const scenario = { auth: auth.value, body: body.value, outcome: outcome.value };
    const first = { node: 'client', dir: 'in', visited: ['client'], text: `The client sends POST /api/orders with ${scenario.auth === 'none' ? 'no Authorization header' : 'an Authorization: Bearer token'} and a JSON body. Press "Next hop".`, step: 0 };
    stepper.load(first, (frame) => advance(frame, scenario));
  }

  function render(frame) {
    for (const li of lane.children) {
      const id = li.dataset.node;
      li.className = ['flow-node',
        id === frame.node ? 'is-current' : '',
        frame.visited.includes(id) ? 'is-visited' : '',
        frame.error && id === frame.node ? 'is-error' : ''].join(' ');
      li.toggleAttribute('aria-current', id === frame.node);
    }
    status.textContent = frame.status ? `Response: ${frame.status}` : frame.dir === 'out' ? 'Response travelling back to the client' : 'Request travelling in';
    status.className = `flow-status ${frame.status ? (frame.status.startsWith('2') ? 'is-ok' : 'is-error') : ''}`;
  }

  for (const s of [auth, body, outcome]) s.addEventListener('change', start);
  start();
  return stepper;
}

function select(options, value) {
  const s = el('select', { class: 'select' }, Object.entries(options).map(([v, l]) => el('option', { value: v }, l)));
  s.value = value;
  return s;
}

/**
 * The state machine. Given the current frame and the scenario, return the next
 * frame (or null when the response has reached the client).
 */
function advance(frame, scenario) {
  const plan = buildPlan(scenario);
  const next = plan[frame.step + 1];
  if (!next) return null;
  const visited = frame.visited.includes(next.node) ? frame.visited : [...frame.visited, next.node];
  return { ...next, visited, step: frame.step + 1 };
}

function buildPlan({ auth, body, outcome }) {
  const plan = [{ node: 'client', dir: 'in' }];
  const add = (node, text, extra = {}) => plan.push({ node, text, dir: 'in', ...extra });
  const back = (status, via) => {
    // The response unwinds through the same layers in reverse order.
    if (via.includes('interceptor')) add('interceptor', 'afterCompletion() runs — it is called even when the request failed, so it is the place for timing and cleanup.', { dir: 'out', status });
    if (via.includes('dispatcher')) add('dispatcher', `DispatcherServlet finishes; the ${status} response is complete.`, { dir: 'out', status });
    add('security', 'The response passes back out through the security filters (code after chain.doFilter runs in reverse order).', { dir: 'out', status });
    add('filters', 'Then back out through the servlet filters — e.g. a logging filter can now record the status and duration.', { dir: 'out', status });
    add('tomcat', 'Tomcat writes the bytes to the socket and returns the worker thread to its pool.', { dir: 'out', status });
    add('client', `The client receives ${status}.`, { dir: 'out', status, end: true });
  };

  add('tomcat', 'Tomcat (embedded) accepts the connection and hands the request to a worker thread from its pool. That one thread carries this request through every layer below — thread-per-request.');
  add('filters', 'Servlet filters run first, in order, before Spring MVC is involved (encoding, logging, request IDs …). Each one calls chain.doFilter() to pass the request on.');

  if (auth === 'none') {
    add('security', 'Spring Security’s FilterChainProxy finds no credentials, so the request stays anonymous. AuthorizationFilter denies it; ExceptionTranslationFilter calls the AuthenticationEntryPoint → 401 Unauthorized. The controller is never reached.', { error: true, status: '401 Unauthorized' });
    back('401 Unauthorized', []);
    return plan;
  }
  if (auth === 'norole') {
    add('security', 'The token is valid, so the user is authenticated and stored in the SecurityContext. But the endpoint needs ROLE_USER: AuthorizationFilter throws AccessDeniedException; ExceptionTranslationFilter calls the AccessDeniedHandler → 403 Forbidden. (401 = who are you?  403 = I know you, but no.)', { error: true, status: '403 Forbidden' });
    back('403 Forbidden', []);
    return plan;
  }
  add('security', 'Spring Security validates the token and puts an Authentication (with ROLE_USER) in the SecurityContext. AuthorizationFilter allows the request through.');
  add('dispatcher', 'DispatcherServlet — Spring MVC’s front controller — asks its HandlerMappings who handles POST /api/orders: OrderController.create().');
  add('interceptor', 'HandlerInterceptor.preHandle() runs. Returning true continues; false would stop the request here.');

  if (body === 'invalid') {
    add('dispatcher', 'The HandlerAdapter resolves the arguments: Jackson converts the JSON into CreateOrderRequest, then @Valid runs Bean Validation. quantity = 0 breaks @Min(1) → MethodArgumentNotValidException. The controller method is never called.', { error: true });
    add('dispatcher', 'DispatcherServlet hands the exception to its HandlerExceptionResolvers: an @ExceptionHandler in a @RestControllerAdvice (or Spring’s default handling) turns it into 400 Bad Request with the field errors. postHandle() is skipped because the handler did not complete.', { error: true, status: '400 Bad Request' });
    back('400 Bad Request', ['interceptor', 'dispatcher']);
    return plan;
  }
  add('controller', 'Arguments resolved: Jackson read the JSON into CreateOrderRequest and @Valid passed. OrderController.create() runs and calls orderService.create(req).');
  add('service', 'orderService is really a proxy: because of @Transactional it begins a transaction (taking a connection from the HikariCP pool) before calling the real service method.');
  add('repository', 'The service calls productRepository.findById(7). Spring Data generated this repository; Hibernate turns the call into SQL.');
  add('db', 'SELECT … FROM product WHERE id = 7 runs on the database.');

  if (outcome === 'missing') {
    add('service', 'No row came back, so the service throws ProductNotFoundException (a RuntimeException). The @Transactional proxy sees it and rolls the transaction back.', { error: true });
    add('controller', 'The exception propagates out of the controller method unchanged.', { error: true });
    add('dispatcher', 'DispatcherServlet finds a matching @ExceptionHandler(ProductNotFoundException.class) in the @RestControllerAdvice, which returns 404 Not Found with an error body. postHandle() is skipped.', { error: true, status: '404 Not Found' });
    back('404 Not Found', ['interceptor', 'dispatcher']);
    return plan;
  }
  add('repository', 'The product exists, so the service builds an Order and calls orderRepository.save(order). The INSERT is sent at the latest when the transaction flushes.');
  add('db', 'INSERT INTO orders … runs.');
  add('service', 'The service method returns normally, so the transactional proxy flushes and commits, then returns the connection to the pool.');
  add('controller', 'The controller returns ResponseEntity with status 201 and an OrderResponse.');
  add('dispatcher', 'The return value handler uses Jackson (an HttpMessageConverter) to write the OrderResponse as JSON into the response body — now, before postHandle.', { status: '201 Created' });
  add('interceptor', 'postHandle() runs, but the JSON body is already written, which is why postHandle cannot change a @ResponseBody response.', { dir: 'out', status: '201 Created' });
  back('201 Created', ['interceptor', 'dispatcher']);
  return plan;
}
