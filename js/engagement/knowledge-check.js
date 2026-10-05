// Knowledge check: a few multiple-choice questions, one at a time, with
// immediate feedback and an explanation. A question with `code` becomes a
// predict-the-output exercise. Data comes from the interaction registry.

import { el, announce } from '../util.js';
import { renderInline } from '../markdown-renderer.js';
import { highlight } from '../highlight.js';
import { recordResult } from '../activity.js';

export function mount(root, { interaction, topic }) {
  const questions = interaction.questions || [];
  if (!questions.length) {
    root.append(el('p', { class: 'muted' }, 'No questions registered.'));
    return {};
  }
  let current = 0;
  let score = 0;
  const answered = new Map(); // index → chosen option

  const stage = el('div', { class: 'check-stage' });
  root.append(stage);
  show();

  function show() {
    const q = questions[current];
    const chosen = answered.get(current);
    const done = chosen !== undefined;

    const options = q.options.map((text, i) => {
      const isCorrect = i === q.answer;
      const state = !done ? '' : isCorrect ? 'is-correct' : i === chosen ? 'is-wrong' : '';
      const marker = !done ? String.fromCharCode(65 + i)
        : isCorrect ? '✓' : i === chosen ? '✗' : String.fromCharCode(65 + i);
      const button = el('button', {
        type: 'button', class: `option ${state}`, disabled: done,
        'aria-describedby': done && (isCorrect || i === chosen) ? `${interaction.id}-fb` : null,
      }, el('span', { class: 'option-marker', 'aria-hidden': 'true' }, marker), renderInline(text),
      done && isCorrect ? el('span', { class: 'sr-only' }, ' (correct answer)') : null,
      done && i === chosen && !isCorrect ? el('span', { class: 'sr-only' }, ' (your answer, incorrect)') : null);
      button.addEventListener('click', () => choose(i));
      return el('li', {}, button);
    });

    const feedback = done ? el('div', {
      class: `feedback ${chosen === q.answer ? 'feedback-correct' : 'feedback-wrong'}`, id: `${interaction.id}-fb`,
    },
    el('p', { class: 'feedback-title' }, chosen === q.answer ? 'Correct.' : `Not quite — the answer is ${String.fromCharCode(65 + q.answer)}.`),
    el('p', {}, renderInline(q.explanation))) : null;

    const isLast = current === questions.length - 1;
    const nav = el('div', { class: 'check-nav' },
      el('span', { class: 'muted' }, `Question ${current + 1} of ${questions.length}`),
      done && !isLast ? button('Next question', () => { current++; show(); focusPrompt(); }, 'btn-primary') : null,
      done && isLast ? button('See result', () => showResult(), 'btn-primary') : null);

    stage.replaceChildren(
      el('p', { class: 'check-prompt', tabindex: -1 }, renderInline(q.prompt)),
      q.code ? codeBlock(q.code) : null,
      el('ul', { class: 'option-list', role: 'list' }, options),
      feedback,
      nav,
    );
  }

  function choose(i) {
    if (answered.has(current)) return;
    const q = questions[current];
    answered.set(current, i);
    const correct = i === q.answer;
    if (correct) score++;
    if (topic) recordResult(topic.id, 'check', `${interaction.id}:${current}`, correct ? 'correct' : 'incorrect');
    announce(correct ? 'Correct.' : `Incorrect. The answer is option ${String.fromCharCode(65 + q.answer)}.`);
    show();
    stage.querySelector('.check-nav .btn-primary')?.focus();
  }

  function showResult() {
    const all = score === questions.length;
    stage.replaceChildren(
      el('div', { class: 'check-result', tabindex: -1 },
        el('p', { class: 'check-score' }, `${score} / ${questions.length}`),
        el('p', {}, all ? 'All correct — this idea is solid.' : 'Re-read the explanations for the ones you missed, then try again.'),
        button('Try again', () => { current = 0; score = 0; answered.clear(); show(); focusPrompt(); }, 'btn-secondary')),
    );
    stage.firstChild.focus();
  }

  function focusPrompt() {
    stage.querySelector('.check-prompt')?.focus();
  }

  return {};
}

function button(label, onClick, variant) {
  const b = el('button', { type: 'button', class: `btn ${variant}` }, label);
  b.addEventListener('click', onClick);
  return b;
}

function codeBlock({ language, source }) {
  const code = el('code');
  code.innerHTML = highlight(source, language);
  return el('div', { class: 'code-block' },
    el('div', { class: 'code-toolbar' }, el('span', { class: 'code-lang' }, language === 'java' ? 'Java' : language.toUpperCase()), el('span', { class: 'muted small' }, 'Predict the output')),
    el('pre', { tabindex: 0 }, code));
}

