// Permission modes: pick a mode and whether orderdesk's project rules are on, then
// step through ten actions Claude might take and see which run, prompt, are denied,
// wait for a plan, or go to the auto-mode classifier.
//
//   (mode, rulesOn) → permissionOutcome() per action → one frame per action
//
// A simplified model of the documented behaviour (see claude-code-common.js); plan
// mode is shown for a session without auto mode or bypass permissions available.
// A StudyHub simulation — it never runs Claude Code.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { checkbox, select } from './system-design-common.js';
import { tableView } from './network-common.js';
import { ACTIONS, MODES, permissionOutcome } from './claude-code-common.js';

const RESULT_TEXT = {
  runs: 'Runs', asks: 'Asks you', denied: 'Denied', blocked: 'Waits for plan approval', classifier: 'Classifier decides',
};

export function mount(root, { options }) {
  const mode = select(MODES, options.mode || 'default');
  const rules = checkbox('orderdesk project rules (allow build, ask push/pom.xml, deny .env and curl)', options.rules !== false);
  root.append(el('div', { class: 'viz-form' }, field('Permission mode', mode), rules.node));

  const table = tableView('What each action does', ['Action', 'Result']);
  const status = el('p', { class: 'flow-status' });
  root.append(el('div', { class: 'viz-stage' }, table.node, status));
  const stepper = createStepper(root, { render, playDelay: 1600, nextLabel: 'Next action' });
  const ids = Object.keys(ACTIONS);

  function render(frame) {
    const rows = frame.results.map(([id, outcome]) => [ACTIONS[id].label, outcome ? RESULT_TEXT[outcome.result] : '…']);
    table.render(rows, { highlight: frame.index >= 0 ? [frame.index] : [] });
    const current = frame.index >= 0 ? frame.results[frame.index][1] : null;
    status.textContent = current ? `${ACTIONS[ids[frame.index]].label}: ${RESULT_TEXT[current.result]}` : `Mode: ${MODES[mode.value]}`;
    status.className = `flow-status ${current ? (current.result === 'runs' ? 'is-ok' : current.result === 'denied' ? 'is-error' : '') : ''}`;
  }

  function start() {
    const outcomes = ids.map((id) => [id, permissionOutcome(mode.value, id, rules.input.checked)]);
    const blank = ids.map((id) => [id, null]);
    const first = {
      index: -1, results: blank,
      text: `${MODES[mode.value]}${rules.input.checked ? ' with the orderdesk rules' : ' with no rules'}. Press "Next action" to see each decision.`,
    };
    const frames = ids.map((id, i) => ({
      index: i,
      results: outcomes.map((o, j) => (j <= i ? o : [o[0], null])),
      text: outcomes[i][1].why,
    }));
    stepper.load(first, frames);
  }

  mode.addEventListener('change', start);
  rules.input.addEventListener('change', start);
  start();
  return stepper;
}
