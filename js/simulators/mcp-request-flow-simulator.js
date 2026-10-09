// MCP request flow: follow the messages between Claude (the model), Claude Code (the
// MCP client), you and a local stdio server — the handshake, tool discovery, the
// permission prompt and a tool call — for a successful call, a tool-level error, a
// protocol error and a denied call.
//
//   variant → mcpSteps() → one message per frame (sequence view)
//
// The JSON-RPC messages are the real session with RunbookServer.java from Lab 10
// (shown in the step details). A StudyHub simulation: nothing connects to a server.

import { el } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select, sequenceView } from './network-common.js';
import { MCP_EXCHANGES, MCP_VARIANTS, mcpSteps } from './claude-code-common.js';

const ACTORS = [
  { id: 'user', label: 'You' },
  { id: 'model', label: 'Claude (model)' },
  { id: 'client', label: 'Claude Code (MCP client)' },
  { id: 'server', label: 'runbook server (stdio)' },
];

// Which recorded JSON-RPC line belongs to a step label.
function exchangeFor(step) {
  if (step.label === 'initialize') return MCP_EXCHANGES.initialize.request;
  if (step.label.startsWith('result: protocolVersion')) return MCP_EXCHANGES.initialize.response;
  if (step.label === 'notifications/initialized') return MCP_EXCHANGES.initialized.request;
  if (step.label === 'tools/list') return MCP_EXCHANGES.list.request;
  if (step.label.startsWith('get_runbook {')) return MCP_EXCHANGES.list.response;
  if (step.label === 'resources/list') return MCP_EXCHANGES.resources.request;
  if (step.label.startsWith('error -32601')) return MCP_EXCHANGES.resources.response;
  if (step.label === 'tools/call') return null;
  if (step.label.startsWith('isError: true')) return MCP_EXCHANGES.payroll.response;
  if (step.label.startsWith('isError: false')) return MCP_EXCHANGES.rollback.response;
  return null;
}

export function mount(root, { options }) {
  const variant = select(MCP_VARIANTS, options.variant || 'rollback');
  root.append(el('div', { class: 'viz-form' }, field('Scenario', variant)));

  const seq = sequenceView(ACTORS);
  const wire = el('pre', { class: 'mini-code', tabindex: 0, 'aria-label': 'JSON-RPC message on the wire' });
  root.append(el('div', { class: 'viz-stage' }, seq.node, el('p', { class: 'tree-side-title' }, 'On the wire (recorded)'), wire));
  const stepper = createStepper(root, { render, playDelay: 1700, nextLabel: 'Next message' });

  function render(frame) {
    seq.render(frame);
    const last = frame.log[frame.log.length - 1];
    let json = last ? exchangeFor(last) : null;
    if (last?.label === 'tools/call') json = variant.value === 'payroll' ? MCP_EXCHANGES.payroll.request : MCP_EXCHANGES.rollback.request;
    wire.innerHTML = json ? highlight(json, 'json') : '— (not a JSON-RPC message between client and server)';
  }

  function start() {
    const steps = mcpSteps(variant.value);
    const frames = steps.map((s, i) => ({
      log: steps.slice(0, i + 1),
      active: [s.from, s.to],
      states: {},
      text: s.note,
    }));
    stepper.load({ log: [], active: [], states: {}, text: 'Press "Next message" to follow the protocol.' }, frames);
  }

  variant.addEventListener('change', start);
  start();
  return stepper;
}
