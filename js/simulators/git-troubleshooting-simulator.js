// Git troubleshooting: a broken repository situation, and at each stage you
// choose the next command. Good choices show their (captured-style) output and
// why they help; tempting but dangerous choices explain what they would destroy.
//
// Reuses the state machine of the Linux troubleshooting simulator (advance).
// Outputs follow the real Git output captured in the lessons; repositories and
// hashes are the lessons' examples. A StudyHub simulation: no Git runs.

import { el, escapeHtml } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper } from '../engagement/stepper.js';
import { advance } from './linux-troubleshooting-simulator.js';
import { TROUBLE_SCENARIOS } from './git-common.js';

export function mount(root, { options }) {
  const scenario = TROUBLE_SCENARIOS[options.scenario] || TROUBLE_SCENARIOS['push-rejected'];
  const term = el('pre', { class: 'mini-code term-out trouble-term', tabindex: 0, 'aria-label': 'Simulated terminal' });
  const prompt = el('p', { class: 'trouble-prompt' });
  const choices = el('div', { class: 'trouble-choices', role: 'group', 'aria-label': 'Choose the next step' });
  const progress = el('p', { class: 'viz-note' });
  root.append(el('div', { class: 'viz-stage' },
    el('p', { class: 'tree-side-title' }, `${scenario.title} — StudyHub simulation`), term, prompt, choices, progress));
  const stepper = createStepper(root, { render, playDelay: 2400, nextLabel: 'Show next step' });

  let current = null;
  function start(picks = []) {
    const first = { stage: 0, picks: [], cmd: null, out: null, kind: 'intro', text: scenario.intro };
    stepper.load(first, (frame, index) => advance(scenario, frame, picks[index]));
    for (let i = 0; i < picks.length; i += 1) stepper.next();
  }

  function render(frame) {
    current = frame;
    const isCommand = frame.cmd && /^(git|mvn|ssh|gh)\b/.test(frame.cmd);
    term.innerHTML = frame.cmd
      ? `${isCommand ? highlight(`$ ${frame.cmd}`, 'bash') : escapeHtml(`> ${frame.cmd}`)}${frame.out ? `\n${escapeHtml(frame.out)}` : ''}`
      : escapeHtml(scenario.intro);
    term.classList.toggle('is-wrong', frame.kind === 'wrong');
    const done = frame.stage >= scenario.stages.length;
    prompt.textContent = done ? 'Repository repaired.' : 'What do you do next?';
    choices.replaceChildren(...(done ? [] : scenario.stages[frame.stage].map((c, i) => el('button', {
      type: 'button', class: 'btn btn-secondary btn-sm trouble-choice', 'data-choice': i,
    }, el('code', {}, c.cmd)))));
    progress.textContent = `Stage ${Math.min(frame.stage + 1, scenario.stages.length)} of ${scenario.stages.length}${frame.kind === 'wrong' ? ' · that choice would not help — or would make things worse' : ''}`;
  }

  choices.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-choice]');
    if (!button || !current) return;
    start([...current.picks, Number(button.dataset.choice)]);
  });

  start();
  return stepper;
}
