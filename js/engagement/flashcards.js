// Flashcards with a simple spaced-repetition loop: "Again" sends the card to
// the back of the queue, "Got it" retires it for this round.
//
// createDeck() is shared: registry decks (data in the interaction JSON) use
// mount(); the Flashcards study mode builds cards from interview questions.

import { el, announce } from '../util.js';
import { renderInline } from '../markdown-renderer.js';
import { recordResult } from '../activity.js';

/** Registry entry point: cards = [{ front, back }] as inline Markdown. */
export function mount(root, { interaction, topic }) {
  const cards = (interaction.cards || []).map((card, i) => ({
    key: `${interaction.id}:${i}`,
    front: el('p', { class: 'flash-text' }, renderInline(card.front)),
    back: el('p', { class: 'flash-text' }, renderInline(card.back)),
  }));
  return createDeck(root, cards, {
    onResult: (card, known) => topic && recordResult(topic.id, 'flashcards', card.key, known ? 'known' : 'review'),
  });
}

/**
 * cards: [{ key, front: Node, back: Node, label?: string }]
 * onResult(card, known) is called for each answer.
 */
export function createDeck(root, cards, { onResult } = {}) {
  let queue = [];
  let flipped = false;
  let known = 0;
  let again = 0;

  const status = el('p', { class: 'flash-status', 'aria-live': 'polite' });
  const stage = el('div', { class: 'flash-stage' });
  root.append(status, stage);
  restart();

  function restart() {
    queue = cards.slice();
    known = 0;
    again = 0;
    show();
  }

  function show() {
    if (!queue.length) return finish();
    const card = queue[0];
    const face = flipped ? card.back : card.front;
    const flip = el('button', { type: 'button', class: 'btn btn-primary' }, 'Show answer');
    flip.addEventListener('click', () => { flipped = true; show(); stage.querySelector('.flash-back')?.focus(); });
    const gotIt = el('button', { type: 'button', class: 'btn btn-success' }, 'Got it');
    gotIt.addEventListener('click', () => answer(true));
    const repeat = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Again');
    repeat.addEventListener('click', () => answer(false));

    stage.replaceChildren(
      el('div', { class: `flash-card ${flipped ? 'is-flipped' : ''}` },
        card.label ? el('p', { class: 'flash-label' }, card.label) : null,
        el('p', { class: 'flash-side' }, flipped ? 'Answer' : 'Question'),
        flipped ? el('div', { class: 'flash-back', tabindex: -1 }, card.front.cloneNode(true), el('hr'), face.cloneNode(true))
          : el('div', { class: 'flash-front' }, face.cloneNode(true))),
      el('div', { class: 'flash-actions' }, flipped ? [repeat, gotIt] : [flip]),
    );
    status.textContent = `${cards.length - queue.length + 1} of ${cards.length} · Got it ${known} · Again ${again}`;
  }

  function answer(isKnown) {
    const card = queue.shift();
    if (isKnown) known++;
    else { again++; queue.push(card); }
    onResult?.(card, isKnown);
    flipped = false;
    show();
    stage.querySelector('.flash-actions .btn')?.focus();
  }

  function finish() {
    const restartBtn = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Start over');
    restartBtn.addEventListener('click', () => { restart(); stage.querySelector('.flash-actions .btn')?.focus(); });
    stage.replaceChildren(el('div', { class: 'check-result' },
      el('p', { class: 'check-score' }, `${cards.length} cards done`),
      el('p', {}, again ? `${again} card${again === 1 ? '' : 's'} needed another look — that repetition is what makes them stick.` : 'Every card on the first try.'),
      restartBtn));
    status.textContent = 'Deck complete.';
    announce('Deck complete.');
  }

  return {};
}
