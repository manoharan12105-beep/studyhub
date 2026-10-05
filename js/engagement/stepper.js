// The step engine shared by every visualizer and simulator.
//
//   user input → first frame → [Next] → advance(frame) → next frame → render → …
//
// A *frame* is a plain object describing the whole state after one step, plus
// `text`: the sentence explaining that step. Frames are kept in a list, so
// Back is free, and `advance` may compute steps lazily (an open-ended simulation
// such as "next request" just keeps returning new frames) or walk a list that
// was computed up front. Returning null from `advance` means "finished".
//
// The engine owns the controls (Reset · Back · Next · Play) and the live
// description, so every interaction behaves and sounds the same to keyboard
// and screen-reader users. Modules only build their input form and render().

import { el, icon, prefersReducedMotion } from '../util.js';

export function createStepper(host, { render, playDelay = 1100, nextLabel = 'Next step' } = {}) {
  let frames = [];
  let position = 0;
  let advance = () => null;
  let finished = false;
  let timer = null;

  const counter = el('span', { class: 'stepper-counter', 'aria-hidden': 'true' });
  const text = el('p', { class: 'stepper-text', 'aria-live': 'polite' });
  const resetBtn = el('button', { type: 'button', class: 'btn btn-secondary' }, icon('reset', 16), 'Reset');
  const backBtn = el('button', { type: 'button', class: 'btn btn-secondary' }, icon('chevronLeft', 16), 'Back');
  const nextBtn = el('button', { type: 'button', class: 'btn btn-primary' }, nextLabel, icon('chevronRight', 16));
  const playBtn = el('button', { type: 'button', class: 'btn btn-secondary', 'aria-pressed': 'false' }, icon('play', 16), el('span', {}, 'Play'));

  resetBtn.addEventListener('click', () => { stop(); go(0); });
  backBtn.addEventListener('click', () => { stop(); go(position - 1); });
  nextBtn.addEventListener('click', () => { stop(); step(); });
  playBtn.addEventListener('click', () => (timer ? stop() : play()));

  const controls = el('div', { class: 'stepper-controls', role: 'group', 'aria-label': 'Step controls' },
    resetBtn, backBtn, nextBtn, playBtn, counter);
  host.append(controls, text);

  function step() {
    if (position < frames.length - 1) return go(position + 1);
    if (finished) return false;
    const frame = advance(frames[position], position);
    if (!frame) {
      finished = true;
      update();
      return false;
    }
    frames.push(frame);
    return go(position + 1);
  }

  function go(target) {
    if (target < 0 || target >= frames.length) return false;
    position = target;
    render(frames[position], { index: position, isLast: finished && position === frames.length - 1 });
    update();
    return true;
  }

  function update() {
    const atEnd = finished && position === frames.length - 1;
    // A precomputed list knows its length up front; a lazy one only once it ends.
    const known = finished ? frames.length : null;
    counter.textContent = known ? `Step ${position + 1} of ${known}` : `Step ${position + 1}`;
    text.textContent = frames[position]?.text || '';
    backBtn.disabled = position === 0;
    resetBtn.disabled = position === 0;
    nextBtn.disabled = atEnd;
    if (atEnd) stop();
  }

  function play() {
    if (finished && position === frames.length - 1) go(0);
    playBtn.setAttribute('aria-pressed', 'true');
    playBtn.replaceChildren(icon('pause', 16), el('span', {}, 'Pause'));
    // Reduced motion: steps still advance (that is the content), just more slowly.
    const delay = prefersReducedMotion() ? playDelay * 1.6 : playDelay;
    timer = setInterval(() => { if (!step()) stop(); }, delay);
  }

  function stop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
    playBtn.setAttribute('aria-pressed', 'false');
    playBtn.replaceChildren(icon('play', 16), el('span', {}, 'Play'));
  }

  return {
    /**
     * Start (or restart after the input changed).
     *   first    first frame
     *   next     (frame, index) => frame | null, or an array of all frames
     */
    load(first, next) {
      stop();
      if (Array.isArray(next)) {
        frames = [first, ...next];
        finished = true;
        advance = () => null;
      } else {
        frames = [first];
        finished = false;
        advance = next;
      }
      go(0);
    },
    next: step,
    back: () => go(position - 1),
    reset: () => go(0),
    current: () => frames[position],
    destroy: stop,
  };
}

/** Labelled form field: field('Target', inputElement, 'optional hint'). */
export function field(label, control, hint) {
  const id = control.id || `f-${Math.random().toString(36).slice(2, 9)}`;
  control.id = id;
  const hintNode = hint ? el('span', { class: 'field-hint', id: `${id}-hint` }, hint) : null;
  if (hintNode) control.setAttribute('aria-describedby', hintNode.id);
  return el('div', { class: 'field' }, el('label', { for: id }, label), control, hintNode);
}

/** Parse "5, 3, 8" into numbers; returns null when anything is not a number. */
export function parseNumberList(text, { min = 1, max = 20 } = {}) {
  const parts = String(text).split(/[\s,]+/).filter(Boolean);
  if (parts.length < min || parts.length > max) return null;
  const numbers = parts.map(Number);
  return numbers.every((n) => Number.isFinite(n)) ? numbers : null;
}

/** Inline validation message under a form. */
export function errorLine() {
  const node = el('p', { class: 'field-error', role: 'alert', hidden: true });
  return {
    node,
    show(message) { node.textContent = message; node.hidden = false; },
    clear() { node.textContent = ''; node.hidden = true; },
  };
}
