// Container connectivity: who can reach what? Pick where a request starts and
// which host:port it uses, then follow the steps — name resolution, the network
// namespace it lands in, and whether anything listens there.
//
//   setup (fixed): taskapi on network appnet, published -p 9000:8080
//                  db on appnet, published -p 127.0.0.1:15432:5432
//   (caller, target) → connect() → steps + result
//
// Shows the three rules of the Docker lessons: localhost is the container itself,
// containers talk by name on a shared network using the container port, and
// published ports exist only on the host. A StudyHub simulation.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { nodesView, select } from '../simulators/system-design-common.js';
import { CALLERS, TARGETS, connect } from '../simulators/devops-common.js';

const PRESETS = {
  ports: { caller: 'host', target: 'localhost:9000' },
  networking: { caller: 'app', target: 'localhost:5432' },
};

const RESULT_TEXT = { ok: 'Connected', refused: 'Connection refused', dns: 'Name not resolved', blocked: 'No response from outside' };

export function mount(root, { options }) {
  const preset = PRESETS[options.scenario] || PRESETS.ports;
  const caller = select(CALLERS, preset.caller);
  const target = select(TARGETS, preset.target);
  root.append(el('div', { class: 'viz-form' }, field('Request starts', caller), field('Connects to', target)));

  const setup = nodesView('The setup');
  setup.render([
    { title: 'Host (VPS or laptop)', lines: ['publishes 0.0.0.0:9000 → taskapi:8080', 'publishes 127.0.0.1:15432 → db:5432'] },
    { title: 'taskapi container', lines: ['network appnet', 'Spring Boot listens on 8080'] },
    { title: 'db container', lines: ['network appnet', 'PostgreSQL listens on 5432'] },
    { title: 'other container', lines: ['default bridge only', 'nothing listening'] },
  ]);
  const status = el('p', { class: 'flow-status' });
  root.append(el('div', { class: 'viz-stage' }, setup.node, status));
  const stepper = createStepper(root, { render, playDelay: 1500, nextLabel: 'Next step' });

  function render(frame) {
    status.textContent = frame.final ? `${RESULT_TEXT[frame.result]}${frame.reaches ? ` → ${frame.reaches}` : ''}` : `Following the request… step ${frame.index} of ${frame.total}`;
    status.className = `flow-status ${frame.final ? (frame.result === 'ok' ? 'is-ok' : 'is-error') : ''}`;
  }

  function start() {
    const outcome = connect(caller.value, target.value);
    const total = outcome.steps.length + 1;
    const first = { index: 0, total, final: false, text: `${CALLERS[caller.value]} → ${target.value}. Press "Next step".` };
    const frames = outcome.steps.map((text, i) => ({ index: i + 1, total, final: false, text }));
    frames.push({ index: total, total, final: true, result: outcome.result, reaches: outcome.reaches, text: outcome.summary });
    stepper.load(first, frames);
  }

  caller.addEventListener('change', start);
  target.addEventListener('change', start);
  start();
  return stepper;
}
