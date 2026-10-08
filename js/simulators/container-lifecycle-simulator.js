// Container lifecycle: run Docker commands against one simulated container and
// watch its state, what docker ps / docker ps -a show, its exit code and its
// writable layer.
//
//   your commands (history) → frames (one per command, folded with lifecycleStep)
//   → the stepper replays them, so Back / Reset walk through your own session.
//
// A StudyHub simulation: nothing runs on your machine. The rules (exit codes 137
// and 143, rm vs rm -f, restart keeping the writable layer) are Docker's.

import { el } from '../util.js';
import { createStepper } from '../engagement/stepper.js';
import { nodesView } from './system-design-common.js';
import { EMPTY_CONTAINER, LIFECYCLE_ACTIONS, lifecycleStep, psView } from './devops-common.js';

const STATE_LABEL = { none: 'does not exist', created: 'created', running: 'running', exited: 'exited' };

export function mount(root) {
  root.append(el('p', { class: 'viz-note' }, 'StudyHub simulation — choose commands; no real container is started.'));
  const buttons = el('div', { class: 'trouble-choices', role: 'group', 'aria-label': 'Docker commands' },
    Object.entries(LIFECYCLE_ACTIONS).map(([id, cmd]) => el('button', {
      type: 'button', class: 'btn btn-secondary btn-sm trouble-choice', 'data-action': id,
    }, el('code', {}, cmd))));
  const lastCmd = el('pre', { class: 'mini-code term-out', tabindex: 0, 'aria-label': 'Last command' });
  const cards = nodesView('Container state');
  root.append(el('div', { class: 'viz-stage' }, buttons, lastCmd, cards.node));
  const stepper = createStepper(root, { render, playDelay: 1600, nextLabel: 'Next command' });

  const history = [];
  const first = { state: EMPTY_CONTAINER, cmd: null, ok: true, text: 'No container yet. Start with docker run (or docker create), then try stop, start, writing a file, rm and rm -f.' };

  function rebuild() {
    const frames = [];
    let state = EMPTY_CONTAINER;
    for (const action of history) {
      const result = lifecycleStep(state, action);
      state = result.state;
      frames.push({ state, cmd: LIFECYCLE_ACTIONS[action], ok: result.ok, text: `${result.ok ? '✓' : '✗'} ${result.text}` });
    }
    stepper.load(first, frames);
    for (let i = 0; i < frames.length; i += 1) stepper.next();
  }

  function render(frame) {
    const { state } = frame;
    const ps = psView(state);
    lastCmd.textContent = frame.cmd ? `$ ${frame.cmd}` : '$ ';
    lastCmd.classList.toggle('trouble-term', true);
    lastCmd.classList.toggle('is-wrong', !frame.ok);
    cards.render([
      { title: 'Container "api"', lines: [`State: ${STATE_LABEL[state.status]}`, `Exit code: ${state.exitCode ?? '—'}`], state: state.status === 'running' ? 'ok' : state.status === 'none' ? 'idle' : 'stale' },
      { title: 'docker ps', lines: [ps.ps ? `api — ${ps.ps}` : '(not listed)'], state: ps.ps ? 'ok' : 'idle' },
      { title: 'docker ps -a', lines: [ps.psAll ? `api — ${ps.psAll}` : '(not listed)'], state: ps.psAll ? 'ok' : 'idle' },
      { title: 'Writable layer', lines: state.status === 'none' ? ['(no container)'] : state.files.length ? state.files : ['(no files written)'], state: state.files.length ? 'primary' : 'idle' },
    ]);
  }

  buttons.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    history.push(button.dataset.action);
    rebuild();
  });

  rebuild();
  return stepper;
}
