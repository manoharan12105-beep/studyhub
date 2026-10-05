// Simple vs compound interest, year by year, on the same principal.
// SI adds the same P×R/100 every year; CI adds R% of the *current* amount,
// so the gap ("interest on interest") widens each year.

import { el } from '../util.js';
import { createStepper, field, errorLine } from '../engagement/stepper.js';

const money = (n) => `₹${Number(n.toFixed(2)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const COMPOUNDING = { 1: 'Yearly', 2: 'Half-yearly', 4: 'Quarterly' };

export function mount(root, { options }) {
  const p = el('input', { class: 'input', type: 'number', value: options.principal ?? 10000, min: 1, style: 'width:8rem' });
  const r = el('input', { class: 'input', type: 'number', value: options.rate ?? 10, min: 0.1, step: 0.5, style: 'width:6rem' });
  const t = el('input', { class: 'input', type: 'number', value: options.years ?? 4, min: 1, max: 15, style: 'width:5rem' });
  const n = el('select', { class: 'select' }, Object.entries(COMPOUNDING).map(([v, l]) => el('option', { value: v }, l)));
  n.value = String(options.compounding || 1);
  const run = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Apply');
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' },
    field('Principal P (₹)', p), field('Rate R (% per year)', r), field('Years T', t), field('CI compounded', n), run), error.node);
  const chart = el('div', { class: 'growth-chart', 'aria-hidden': 'true' });
  const table = el('table', { class: 'viz-table' });
  root.append(el('div', { class: 'viz-stage' }, chart),
    el('ul', { class: 'viz-legend' },
      el('li', {}, el('span', { class: 'swatch growth-si' }), 'Simple interest amount'),
      el('li', {}, el('span', { class: 'swatch growth-ci' }), 'Compound interest amount')),
    el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'Year by year amounts' }, table));
  const stepper = createStepper(root, { render });

  function start() {
    const P = Number(p.value);
    const R = Number(r.value);
    const T = Number(t.value);
    const N = Number(n.value);
    if (!(P > 0) || !(R > 0) || !(Number.isInteger(T) && T >= 1 && T <= 15)) {
      error.show('Enter a positive principal and rate, and a whole number of years from 1 to 15.');
      return;
    }
    error.clear();
    stepper.load(...buildFrames(P, R, T, N));
  }

  function render(frame) {
    const shown = frame.years.slice(0, frame.upto + 1);
    const max = frame.years[frame.years.length - 1].ci;
    chart.replaceChildren(...frame.years.map((y, i) => el('div', { class: `growth-col ${i > frame.upto ? 'is-hidden' : ''} ${i === frame.upto ? 'is-current' : ''}` },
      el('div', { class: 'growth-bars' },
        el('span', { class: 'growth-bar growth-si', style: `height:${(y.si / max) * 100}%` }),
        el('span', { class: 'growth-bar growth-ci', style: `height:${(y.ci / max) * 100}%` })),
      el('span', { class: 'growth-label' }, i === 0 ? 'Start' : `Yr ${i}`))));
    table.replaceChildren(
      el('thead', {}, el('tr', {}, ['Year', 'SI amount', 'CI amount', 'CI − SI'].map((h) => el('th', { scope: 'col' }, h)))),
      el('tbody', {}, shown.map((y, i) => el('tr', { class: i === frame.upto ? 'is-current' : '' },
        el('td', {}, String(i)), el('td', {}, money(y.si)), el('td', {}, money(y.ci)), el('td', {}, money(y.ci - y.si))))));
  }

  run.addEventListener('click', start);
  for (const input of [p, r, t]) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  n.addEventListener('change', start);
  start();
  return stepper;
}

function buildFrames(P, R, T, N) {
  const years = [];
  for (let y = 0; y <= T; y++) {
    years.push({ si: P * (1 + (R * y) / 100), ci: P * (1 + R / (100 * N)) ** (N * y) });
  }
  const siPerYear = (P * R) / 100;
  const frames = [];
  for (let y = 1; y <= T; y++) {
    const prev = years[y - 1];
    const cur = years[y];
    let text = `Year ${y}: SI adds the same ${money(siPerYear)} (P × R / 100) → ${money(cur.si)}. `;
    text += N === 1
      ? `CI adds ${R}% of last year's amount ${money(prev.ci)} = ${money(cur.ci - prev.ci)} → ${money(cur.ci)}.`
      : `CI compounds ${N} times a year at ${R / N}% per period: ${money(prev.ci)} × (1 + ${R / N}/100)^${N} = ${money(cur.ci)}.`;
    if (y === 1 && N === 1) text += ' After one year SI and CI are equal — interest has not earned interest yet.';
    if (y === 2 && N === 1) text += ` CI − SI after 2 years = P(R/100)² = ${money(P * (R / 100) ** 2)}: the interest earned on year 1's interest.`;
    if (y === T) text += ` Total interest: SI ${money(cur.si - P)}, CI ${money(cur.ci - P)}. Formula: A = P(1 + R/${N === 1 ? '100' : `(100×${N})`})^${N === 1 ? 'T' : `${N}T`}.`;
    frames.push({ years, upto: y, text });
  }
  return [{ years, upto: 0, text: `Start with P = ${money(P)}. Press Next to add one year at a time.` }, frames];
}
