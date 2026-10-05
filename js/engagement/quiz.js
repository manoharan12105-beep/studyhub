// Practice and interview sessions: one question at a time.
//
// Works on items from question-parser.js, possibly from many topics at once.
//   - Multiple-choice items with a detectable answer: pick an option, get
//     instant feedback, then the explanation.
//   - Everything else: optional hint, reveal the answer, rate yourself.
// Results are saved per question id (activity.js), so "Needs review" can
// bring back exactly the questions you missed last time.

import { el, icon, announce, isTypingTarget, percent } from '../util.js';
import { recordResult, getResult } from '../activity.js';
import { href } from '../router.js';

const RATINGS = {
  practice: { good: ['correct', 'I got it right'], bad: ['incorrect', 'I need to review this'] },
  interview: { good: ['known', 'I knew this'], bad: ['review', 'Review again'] },
};
const RESULT_LABELS = { correct: 'Correct', incorrect: 'Incorrect', known: 'Knew it', review: 'To review' };

/**
 * items: [{ ...parsedItem, topic }]
 * kind:  'practice' | 'interview'
 * showTopic: label each item with its topic (multi-topic sessions)
 */
export function createQuiz(root, items, { kind = 'practice', showTopic = false, preamble = [] } = {}) {
  let filter = 'all';
  let order = items.slice();
  let position = 0;
  const session = new Map(); // item key → result in this session
  const revealed = new Set();
  const hintsShown = new Map();

  const keyOf = (item) => `${item.topic.id}|${item.num}`;
  const lastResult = (item) => getResult(item.topic.id, kind, item.num);

  const filterSelect = el('select', { class: 'select', 'aria-label': 'Which questions' },
    el('option', { value: 'all' }, 'All questions'),
    el('option', { value: 'new' }, 'Not attempted yet'),
    el('option', { value: 'review' }, kind === 'interview' ? 'Marked “review again”' : 'Answered incorrectly'));
  filterSelect.addEventListener('change', () => { filter = filterSelect.value; applyFilter(); });

  const shuffleBtn = el('button', { type: 'button', class: 'btn btn-ghost' }, 'Shuffle');
  shuffleBtn.addEventListener('click', () => {
    order = order.slice().sort(() => Math.random() - 0.5);
    position = 0;
    render();
    announce('Questions shuffled.');
  });

  const scoreLine = el('p', { class: 'quiz-score', 'aria-live': 'polite' });
  const bar = el('div', { class: 'progress-bar', role: 'progressbar', 'aria-label': 'Session progress', 'aria-valuemin': 0, 'aria-valuemax': 100 }, el('span'));
  const counter = el('span', { class: 'quiz-counter' });
  const stage = el('div', { class: 'quiz-stage' });

  const quiz = el('div', { class: 'quiz', 'data-arrow-keys': '' },
    preamble.length ? el('details', { class: 'reveal quiz-preamble' }, el('summary', {}, 'Instructions for these questions'),
      el('div', { class: 'markdown-body' }, preamble.map((n) => n.cloneNode(true)))) : null,
    el('div', { class: 'quiz-toolbar' }, counter, bar, el('div', { class: 'quiz-tools' }, filterSelect, shuffleBtn)),
    scoreLine,
    stage);
  root.append(quiz);
  render();

  function applyFilter() {
    order = items.filter((item) => {
      const last = lastResult(item);
      if (filter === 'new') return !last;
      if (filter === 'review') return last === 'incorrect' || last === 'review';
      return true;
    });
    position = 0;
    render();
  }

  function render() {
    updateScore();
    if (!order.length) {
      counter.textContent = 'No questions';
      stage.replaceChildren(el('div', { class: 'empty-state' },
        el('p', {}, filter === 'all' ? 'No questions found in this file.' : 'No questions match this filter.'),
        filter !== 'all' ? button('Show all questions', () => { filterSelect.value = 'all'; filter = 'all'; applyFilter(); }, 'btn-secondary') : null));
      return;
    }
    if (position >= order.length) return renderSummary();
    const item = order[position];
    counter.textContent = `Question ${position + 1} of ${order.length}`;
    bar.setAttribute('aria-valuenow', percent(position, order.length));
    bar.firstChild.style.width = `${percent(position, order.length)}%`;
    stage.replaceChildren(renderItem(item));
  }

  function renderItem(item) {
    const key = keyOf(item);
    const result = session.get(key);
    const isMcq = Boolean(item.options && item.correct);
    const isRevealed = revealed.has(key) || (isMcq && result);
    const previous = lastResult(item);

    const heading = el('h2', { class: 'quiz-title', tabindex: -1 }, el('span', { class: 'quiz-num' }, item.num), ' ', item.title);
    const context = el('p', { class: 'quiz-context' },
      showTopic ? el('a', { href: href(['t', item.topic.id]) }, item.topic.title) : null,
      showTopic && item.group ? ' · ' : null,
      item.group ? item.group.title : null);

    const chips = el('div', { class: 'chips' },
      item.meta.map((m) => el('span', { class: 'chip' }, `${m.key}: ${m.value}`)),
      previous && !result ? el('span', { class: `chip chip-${previous}` }, `Last time: ${RESULT_LABELS[previous]}`) : null);

    const shared = item.group?.shared?.length
      ? el('details', { class: 'reveal shared-material', open: true },
        el('summary', {}, 'Shared material for this set'),
        el('div', { class: 'markdown-body' }, item.group.shared.map((n) => n.cloneNode(true))))
      : null;

    const body = el('div', { class: 'markdown-body quiz-body' }, item.body.map((n) => n.cloneNode(true)));

    let optionsNode = null;
    if (item.options) {
      optionsNode = el('ul', { class: 'option-list', role: 'list' }, item.options.map((option) => {
        const chosen = result && result.choice === option.letter;
        const correct = isRevealed && option.letter === item.correct;
        const state = correct ? 'is-correct' : chosen ? 'is-wrong' : '';
        const marker = correct ? '✓' : chosen ? '✗' : option.letter;
        const content = el('span', { class: 'option-text' }, [...option.node.childNodes].map((n) => n.cloneNode(true)));
        if (!isMcq) {
          return el('li', {}, el('div', { class: 'option is-static' }, el('span', { class: 'option-marker' }, option.letter), content));
        }
        const b = el('button', { type: 'button', class: `option ${state}`, disabled: Boolean(result) },
          el('span', { class: 'option-marker', 'aria-hidden': 'true' }, marker),
          el('span', { class: 'sr-only' }, `Option ${option.letter}: `), content,
          correct ? el('span', { class: 'sr-only' }, ' (correct answer)') : null,
          chosen && !correct ? el('span', { class: 'sr-only' }, ' (your answer)') : null);
        b.addEventListener('click', () => chooseOption(item, option.letter));
        return el('li', {}, b);
      }));
    }

    const hintCount = hintsShown.get(key) || 0;
    const hints = item.hints.slice(0, hintCount).map((h) => panel(h.label, h.content, 'hint'));
    const answers = isRevealed ? item.answers.map((a) => panel(a.label, a.content, 'answer')) : [];

    const actions = el('div', { class: 'quiz-actions' });
    if (!isRevealed) {
      if (hintCount < item.hints.length) {
        actions.append(button(hintCount ? 'Another hint' : 'Show hint', () => {
          hintsShown.set(key, hintCount + 1);
          render();
          stage.querySelector('.quiz-panel-hint:last-of-type')?.focus();
        }, 'btn-secondary'));
      }
      if (!isMcq && item.answers.length) {
        actions.append(button(`Reveal ${item.answers[0].label.toLowerCase()}`, () => {
          revealed.add(key);
          render();
          stage.querySelector('.quiz-panel-answer')?.focus();
        }, 'btn-primary'));
      }
      if (isMcq) actions.append(el('p', { class: 'muted small' }, 'Choose an option to check your answer.'));
    } else if (!isMcq && !result) {
      const { good, bad } = RATINGS[kind];
      actions.append(el('p', { class: 'rate-label' }, 'How did you do?'),
        button(bad[1], () => rate(item, bad[0]), 'btn-secondary'),
        button(good[1], () => rate(item, good[0]), 'btn-success'));
    } else if (result) {
      actions.append(el('p', { class: `result-line result-${result.r}` }, icon(result.r === 'correct' || result.r === 'known' ? 'check' : 'close', 16), RESULT_LABELS[result.r]));
    }

    const nav = el('div', { class: 'quiz-nav' },
      button('Previous', () => move(-1), 'btn-secondary', position === 0, 'chevronLeft'),
      button(position === order.length - 1 ? 'Finish' : 'Next', () => move(1), 'btn-primary', false, 'chevronRight'));

    return el('article', { class: 'quiz-card' }, context, heading, chips, shared, body, optionsNode, hints, answers, actions, nav);
  }

  function panel(label, content, type) {
    return el('section', { class: `quiz-panel quiz-panel-${type}`, tabindex: -1, 'aria-label': label },
      el('p', { class: 'quiz-panel-label' }, label),
      el('div', { class: 'markdown-body' }, [...content.childNodes].map((n) => n.cloneNode(true))));
  }

  function chooseOption(item, letter) {
    const correct = letter === item.correct;
    const r = correct ? 'correct' : 'incorrect';
    session.set(keyOf(item), { r, choice: letter });
    recordResult(item.topic.id, kind, item.num, r);
    announce(correct ? 'Correct.' : `Incorrect. The answer is ${item.correct}.`);
    render();
    stage.querySelector('.quiz-panel-answer, .quiz-nav .btn-primary')?.focus();
  }

  function rate(item, r) {
    session.set(keyOf(item), { r });
    recordResult(item.topic.id, kind, item.num, r);
    announce(`Saved: ${RESULT_LABELS[r]}.`);
    move(1);
  }

  function move(delta) {
    const next = position + delta;
    if (next < 0) return;
    position = Math.min(next, order.length);
    render();
    stage.querySelector('.quiz-title, .check-result')?.focus();
  }

  function updateScore() {
    const values = [...session.values()];
    const good = values.filter((v) => v.r === 'correct' || v.r === 'known').length;
    scoreLine.textContent = values.length
      ? `This session: ${good} of ${values.length} ${kind === 'interview' ? 'known' : 'correct'}`
      : '';
  }

  function renderSummary() {
    const values = [...session.values()];
    const good = values.filter((v) => v.r === 'correct' || v.r === 'known').length;
    counter.textContent = 'Session complete';
    bar.setAttribute('aria-valuenow', 100);
    bar.firstChild.style.width = '100%';
    stage.replaceChildren(el('div', { class: 'check-result', tabindex: -1 },
      el('p', { class: 'check-score' }, values.length ? `${good} / ${values.length}` : 'Done'),
      el('p', {}, values.length
        ? `You answered ${values.length} of ${order.length} questions. ${values.length - good ? 'Use “Answered incorrectly” / “Review again” to drill the misses.' : 'Clean sweep.'}`
        : 'You went through every question without rating any.'),
      el('div', { class: 'quiz-actions' },
        button('Review misses', () => { filterSelect.value = 'review'; filter = 'review'; applyFilter(); }, 'btn-secondary'),
        button('Start again', () => { session.clear(); revealed.clear(); hintsShown.clear(); position = 0; render(); }, 'btn-primary'))));
  }

  function onKey(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (isTypingTarget(event.target) || event.target.closest?.('pre, .table-wrap')) return;
    if (!document.body.contains(quiz)) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
  }
  document.addEventListener('keydown', onKey);

  return { destroy: () => document.removeEventListener('keydown', onKey) };
}

function button(label, onClick, variant, disabled = false, iconName = null) {
  const b = el('button', { type: 'button', class: `btn ${variant}`, disabled },
    iconName === 'chevronLeft' ? icon(iconName, 16) : null, label,
    iconName === 'chevronRight' ? icon(iconName, 16) : null);
  b.addEventListener('click', onClick);
  return b;
}
