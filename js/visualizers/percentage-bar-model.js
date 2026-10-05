// Successive percentage changes as bars. Each change applies to the *current*
// value, not the original — the bar model makes "the base changes" visible,
// and the net change is checked against the shortcut a + b + ab/100.

import { el } from '../util.js';
import { createStepper, field, parseNumberList, errorLine } from '../engagement/stepper.js';

const fmt = (n) => Number(n.toFixed(4)).toLocaleString('en-IN', { maximumFractionDigits: 4 });
const signed = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n))}`;

export function mount(root, { options }) {
  const baseInput = el('input', { class: 'input', type: 'number', value: options.base ?? 200, min: 1, style: 'width:8rem' });
  const changesInput = el('input', { class: 'input', value: options.changes || '+20, -20' });
  const run = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Apply');
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' },
    field('Starting value', baseInput),
    el('div', { class: 'field field-grow' }, field('Successive % changes', changesInput, 'e.g. +20, -20 or 10, 10, -25')),
    run), error.node);
  const bars = el('div', { class: 'pct-bars', 'aria-hidden': 'true' });
  root.append(el('div', { class: 'viz-stage' }, bars),
    el('ul', { class: 'viz-legend' },
      el('li', {}, el('span', { class: 'swatch pct-swatch-base' }), 'Value before the change'),
      el('li', {}, el('span', { class: 'swatch pct-swatch-up' }), 'Increase'),
      el('li', {}, el('span', { class: 'swatch pct-swatch-down' }), 'Decrease (part removed)')));
  const stepper = createStepper(root, { render });

  function start() {
    const base = Number(baseInput.value);
    const changes = parseNumberList(changesInput.value, { min: 1, max: 6 });
    if (!(base > 0) || !changes || changes.some((c) => c <= -100)) {
      error.show('Use a positive starting value and 1–6 changes above −100%.');
      return;
    }
    error.clear();
    stepper.load(...buildFrames(base, changes));
  }

  function render(frame) {
    const max = Math.max(...frame.stages.map((s) => Math.max(s.before, s.after)), frame.base);
    bars.replaceChildren(
      barRow('Start', frame.base, 0, max, `${fmt(frame.base)}`),
      ...frame.stages.map((s, i) => barRow(`After ${i + 1}`, s.before, s.after - s.before, max,
        `${signed(s.pct)}% of ${fmt(s.before)} = ${signed(s.after - s.before)} → ${fmt(s.after)}`)));
  }

  run.addEventListener('click', start);
  for (const input of [baseInput, changesInput]) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  start();
  return stepper;
}

function barRow(label, before, delta, max, caption) {
  const keep = delta < 0 ? before + delta : before;
  return el('div', { class: 'pct-row' },
    el('span', { class: 'pct-label' }, label),
    el('div', { class: 'pct-track' },
      el('span', { class: 'pct-seg pct-base', style: `width:${(keep / max) * 100}%` }),
      delta > 0 ? el('span', { class: 'pct-seg pct-up', style: `width:${(delta / max) * 100}%` }) : null,
      delta < 0 ? el('span', { class: 'pct-seg pct-down', style: `width:${(-delta / max) * 100}%` }) : null),
    el('span', { class: 'pct-caption' }, caption));
}

function buildFrames(base, changes) {
  const stages = [];
  const frames = [];
  let value = base;
  let net = 0; // combined % so far, via a + b + ab/100
  changes.forEach((pct, i) => {
    const before = value;
    const after = before * (1 + pct / 100);
    stages.push({ pct, before, after });
    const combined = i === 0 ? pct : net + pct + (net * pct) / 100;
    const shortcut = i === 0 ? ''
      : ` Combined so far: a + b + ab/100 = ${signed(net)} ${pct < 0 ? '−' : '+'} ${fmt(Math.abs(pct))} ${net * pct < 0 ? '−' : '+'} ${fmt(Math.abs(net * pct) / 100)} = ${signed(combined)}%.`;
    frames.push({
      base, stages: stages.slice(),
      text: `Change ${i + 1}: ${signed(pct)}% of the current value ${fmt(before)} (not of the original ${fmt(base)}) is ${signed(after - before)}, giving ${fmt(after)}.${shortcut}`,
    });
    net = combined;
    value = after;
  });
  const totalPct = ((value - base) / base) * 100;
  frames.push({
    base, stages: stages.slice(),
    text: `Net: ${fmt(base)} → ${fmt(value)}, a change of ${signed(totalPct)}%.${changes.length === 2 && changes[0] === -changes[1] ? ` Equal up and down changes never cancel: ±${fmt(Math.abs(changes[0]))}% gives −${fmt(changes[0] ** 2 / 100)}% (= −a²/100).` : ''} Multiplying factors gives the same answer: ${changes.map((c) => fmt(1 + c / 100)).join(' × ')} = ${fmt(value / base)}.`,
  });
  return [{ base, stages: [], text: `Start with ${fmt(base)}. Press Next to apply each change in turn.` }, frames];
}
