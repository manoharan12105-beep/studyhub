// Hook lifecycle: pick what Claude tries to do and follow the hook from the event
// through the matcher, the JSON on stdin and the script's exit code to what Claude
// Code does with the result.
//
//   scenario → hookFrames() → event → matcher → input → result → effect
//
// The scripts and their output are orderdesk's tested hooks (Lab 09); see
// HOOK_SCENARIOS in claude-code-common.js. A StudyHub simulation — no hook runs here.

import { el, escapeHtml } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select } from './system-design-common.js';
import { HOOK_SCENARIOS, hookFrames } from './claude-code-common.js';

const STAGES = [
  ['tool', 'Tool call'],
  ['match', 'Event + matcher'],
  ['input', 'stdin JSON'],
  ['result', 'Exit code / output'],
  ['effect', 'Claude Code decides'],
];

const OUTCOME_TEXT = {
  blocked: 'Blocked', continues: 'No objection', asks: 'You are asked', feedback: 'Feedback to Claude', 'continues-turn': 'Claude keeps working',
};

export function mount(root, { options }) {
  const scenario = select(Object.fromEntries(Object.entries(HOOK_SCENARIOS).map(([k, v]) => [k, v.title])), options.scenario || 'protect-env');
  root.append(el('div', { class: 'viz-form' }, field('Claude tries to', scenario)));

  const lane = el('ol', { class: 'flow-lane', 'aria-label': 'Hook stages' },
    STAGES.map(([id, label]) => el('li', { class: 'flow-node', 'data-stage': id }, label)));
  const detail = el('pre', { class: 'mini-code', tabindex: 0, 'aria-label': 'Hook details' });
  const status = el('p', { class: 'flow-status' });
  root.append(el('div', { class: 'viz-stage' }, lane, detail, status));
  const stepper = createStepper(root, { render, playDelay: 1900, nextLabel: 'Next stage' });

  function render(frame) {
    const s = HOOK_SCENARIOS[scenario.value];
    const reached = STAGES.findIndex(([id]) => id === frame.stage);
    for (const [i, node] of [...lane.children].entries()) {
      node.classList.toggle('is-current', i === reached);
      node.classList.toggle('is-visited', reached >= 0 && i < reached);
    }
    let text = '';
    if (frame.stage === 'match') text = `event:   ${s.event}\nmatcher: ${s.matcher}\nhook:    .claude/hooks/${s.script}`;
    if (frame.stage === 'input') text = s.input;
    if (frame.stage === 'result' || frame.stage === 'effect') {
      text = `exit code: ${s.exit}${s.stdout ? `\nstdout:    ${s.stdout}` : ''}${s.stderr ? `\nstderr:    ${s.stderr}` : ''}`;
    }
    detail.innerHTML = frame.stage === 'input' ? highlight(text, 'json') : escapeHtml(text || '—');
    status.textContent = frame.stage === 'effect' ? OUTCOME_TEXT[s.outcome] : '';
    status.className = `flow-status ${frame.stage === 'effect' ? (s.outcome === 'blocked' ? 'is-error' : 'is-ok') : ''}`;
  }

  function start() {
    const frames = hookFrames(scenario.value);
    stepper.load({ stage: null, text: 'Press "Next stage" to follow the hook.' }, frames);
  }

  scenario.addEventListener('change', start);
  start();
  return stepper;
}
