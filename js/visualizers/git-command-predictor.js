// Command prediction exercises: here is the repository — what will this command do?
//
//   starting graph + command → choose an outcome → feedback, explanation and the
//   resulting graph (computed by the same model as the branch visualizer)
//
// Includes the classic traps (fetch vs pull, reset vs revert, rebase copies,
// cherry-pick, branch -D, detached HEAD). A StudyHub simulation: no Git runs.

import { el } from '../util.js';
import { PREDICT_QUESTIONS, predictionStates } from '../simulators/git-common.js';
import { renderGraph } from './git-branch-visualizer.js';

export function mount(root, { options }) {
  const ids = Array.isArray(options.questions) ? options.questions.filter((i) => PREDICT_QUESTIONS[i]) : PREDICT_QUESTIONS.map((_, i) => i);
  let pos = 0;
  let score = 0;
  const answered = new Map();

  const counter = el('p', { class: 'viz-note' });
  const before = el('div', { class: 'viz-stage git-graph' });
  const cmd = el('pre', { class: 'mini-code term-out', tabindex: 0, 'aria-label': 'Command to predict' });
  const opts = el('div', { class: 'trouble-choices', role: 'group', 'aria-label': 'Possible outcomes' });
  const feedback = el('div', { class: 'git-predict-feedback', 'aria-live': 'polite' });
  const prev = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Previous');
  const next = el('button', { type: 'button', class: 'btn btn-primary' }, 'Next question');
  root.append(
    el('p', { class: 'tree-side-title' }, 'Predict the command — StudyHub simulation'),
    counter,
    el('p', { class: 'git-predict-label' }, 'Starting state'), before,
    cmd,
    el('p', { class: 'trouble-prompt' }, 'What happens?'),
    opts, feedback,
    el('div', { class: 'stepper-controls' }, prev, next));

  function show() {
    const q = PREDICT_QUESTIONS[ids[pos]];
    const states = predictionStates(q);
    counter.textContent = `Question ${pos + 1} of ${ids.length} · score ${score}/${answered.size}`;
    before.replaceChildren(renderGraph(states.before, { caption: 'Commit graph before the command' }).picture);
    cmd.textContent = `$ ${q.cmd}`;
    const chosen = answered.get(pos);
    opts.replaceChildren(...q.options.map((o, i) => el('button', {
      type: 'button',
      class: `btn btn-secondary btn-sm trouble-choice${chosen !== undefined && i === q.answer ? ' is-correct' : ''}${chosen === i && i !== q.answer ? ' is-incorrect' : ''}`,
      'data-option': i, 'aria-pressed': chosen === i ? 'true' : 'false', disabled: chosen !== undefined,
    }, `${String.fromCharCode(65 + i)}) ${o}`)));
    feedback.replaceChildren();
    if (chosen !== undefined) {
      const ok = chosen === q.answer;
      const after = renderGraph(states.after, { caption: 'Commit graph after the command' });
      feedback.append(
        el('p', { class: `verdict ${ok ? 'verdict-ok' : 'verdict-bad'}`, tabindex: -1 }, ok ? 'Correct. ' : `Not quite — the answer is ${String.fromCharCode(65 + q.answer)}. `, el('span', {}, q.explanation)),
        el('p', { class: 'git-predict-label' }, 'After the command'),
        el('div', { class: 'viz-stage git-graph' }, after.picture),
        el('p', { class: 'viz-note' }, states.effect));
    }
    prev.disabled = pos === 0;
    next.disabled = pos === ids.length - 1;
  }

  opts.addEventListener('click', (event) => {
    const b = event.target.closest('button[data-option]');
    if (!b || answered.has(pos)) return;
    const i = Number(b.dataset.option);
    answered.set(pos, i);
    if (i === PREDICT_QUESTIONS[ids[pos]].answer) score += 1;
    show();
    feedback.querySelector('.verdict')?.focus?.();
  });
  prev.addEventListener('click', () => { if (pos > 0) { pos -= 1; show(); } });
  next.addEventListener('click', () => { if (pos < ids.length - 1) { pos += 1; show(); } });
  show();
  return { destroy() {} };
}
