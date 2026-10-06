// Excel cell references: copy one formula and watch which parts move.
//
//   choose the reference style → first cell → copy to the next cell →
//   shift every unlocked part by the distance copied → read the cells → result
//
// Two layouts:
//   tax   Price × tax rate, copied down C2 → C5. The rate lives once in E1, so
//         only $E$1 (or E$1, which locks the row) keeps every row correct.
//   grid  Price × discount rate, copied down AND across B2:D4. Only the mixed
//         pair $A2 and B$1 works in both directions.
// The copy rule is Excel's: a part without $ moves by the same number of rows
// or columns as the formula did; a part with $ never moves. Results were
// checked in Excel.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';

export const LAYOUTS = {
  tax: {
    label: 'Price × tax rate (copy down)',
    columns: ['A', 'B', 'C', 'D', 'E'],
    rows: [1, 2, 3, 4, 5],
    sheet: { A1: 'Product', B1: 'Price', C1: 'Tax', D1: 'Tax rate', E1: 0.18, A2: 'Laptop', B2: 1000, A3: 'Mobile', B3: 2500, A4: 'Mouse', B4: 400, A5: 'Printer', B5: 1200 },
    percent: ['E1'],
    targets: ['C2', 'C3', 'C4', 'C5'],
    choices: {
      abs: { label: '=B2*$E$1 (absolute rate)', refs: ['B2', '$E$1'] },
      rel: { label: '=B2*E1 (relative rate)', refs: ['B2', 'E1'] },
      row: { label: '=B2*E$1 (row locked)', refs: ['B2', 'E$1'] },
      col: { label: '=B2*$E1 (column locked)', refs: ['B2', '$E1'] },
    },
    verdict: {
      abs: 'Every row multiplies its own price by the one rate in E1: 180, 450, 72, 216. B2 is relative, so it moves to each row; $E$1 never moves.',
      rel: 'Only C2 is right. Copying down moved E1 to E2, E3, E4 — empty cells, which count as 0 — so every other tax is 0. Lock the rate with $E$1 (press F4).',
      row: 'Every row is right here, because copying down only changes row numbers and E$1 locks the row. Copied across, though, the E would move — $E$1 is the safe choice for a single rate cell.',
      col: 'Locking the column does not help when copying down: the row still moves, so E1 becomes E2, E3, E4 (empty = 0). The row is the part that needed the $.',
    },
  },
  grid: {
    label: 'Discount grid (copy down and across)',
    columns: ['A', 'B', 'C', 'D'],
    rows: [1, 2, 3, 4],
    sheet: { A1: 'Price', B1: 0.05, C1: 0.1, D1: 0.15, A2: 1000, A3: 2000, A4: 3000 },
    percent: ['B1', 'C1', 'D1'],
    targets: ['B2', 'C2', 'D2', 'B3', 'C3', 'D3', 'B4', 'C4', 'D4'],
    choices: {
      mixed: { label: '=$A2*B$1 (mixed)', refs: ['$A2', 'B$1'] },
      rel: { label: '=A2*B1 (relative)', refs: ['A2', 'B1'] },
      abs: { label: '=$A$2*$B$1 (absolute)', refs: ['$A$2', '$B$1'] },
    },
    verdict: {
      mixed: '$A2 locks the price column (A) but lets the row change; B$1 locks the rate row (1) but lets the column change. Every cell gets its own price × its own rate.',
      rel: 'Nothing is locked, so every copy points at the cells next to it, including other results. Only B2 is right; the rest multiply results by results.',
      abs: 'Both references are fully locked, so every cell repeats 1000 × 5% = 50. Absolute is right for one fixed cell, wrong for a grid.',
    },
  },
};

export function mount(root, { options }) {
  const layout = el('select', { class: 'select' }, Object.entries(LAYOUTS).map(([id, l]) => el('option', { value: id }, l.label)));
  layout.value = LAYOUTS[options.layout] ? options.layout : 'tax';
  const choice = el('select', { class: 'select' });
  root.append(el('div', { class: 'viz-form' }, field('Example', layout), field('Formula in the first cell', choice)));

  const nameBox = el('span', { class: 'xl-name-box' });
  const formulaText = el('code', { class: 'xl-formula' });
  const gridWrap = el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'Worksheet' });
  const log = el('table', { class: 'viz-table' });
  root.append(el('div', { class: 'viz-stage' },
    el('div', { class: 'xl-formula-bar' }, nameBox, el('span', { class: 'xl-fx', 'aria-hidden': 'true' }, 'fx'), el('span', { class: 'sr-only' }, 'Formula bar: '), formulaText),
    gridWrap,
    el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'Copied formulas' }, log)));
  const stepper = createStepper(root, { render, nextLabel: 'Copy to next cell' });

  let cells = {};
  let current = null;

  function fillChoices(preferred) {
    const l = LAYOUTS[layout.value];
    choice.replaceChildren(...Object.entries(l.choices).map(([id, c]) => el('option', { value: id }, c.label)));
    choice.value = l.choices[preferred] ? preferred : Object.keys(l.choices)[0];
  }

  function buildGrid(l) {
    cells = {};
    const grid = el('table', { class: 'xl-grid' },
      el('thead', {}, el('tr', {}, el('th', { class: 'xl-corner' }, el('span', { class: 'sr-only' }, 'Row')), l.columns.map((c) => el('th', { scope: 'col' }, c)))),
      el('tbody', {}, l.rows.map((r) => el('tr', {},
        el('th', { scope: 'row' }, String(r)),
        l.columns.map((c) => { cells[`${c}${r}`] = el('td', {}); return cells[`${c}${r}`]; })))));
    gridWrap.replaceChildren(grid);
  }

  function start() {
    const l = LAYOUTS[layout.value];
    current = l;
    buildGrid(l);
    stepper.load(...buildFrames(l, choice.value));
  }

  function render(frame) {
    const l = current;
    for (const [address, td] of Object.entries(cells)) {
      const value = address in frame.values ? frame.values[address] : l.sheet[address];
      td.textContent = format(value, l.percent.includes(address));
      const classes = [];
      if (typeof value === 'number') classes.push('is-number');
      if (frame.refs.includes(address)) classes.push('is-ref');
      if (frame.refs.includes(address) && value === undefined) classes.push('is-empty-ref');
      if (address === frame.cell) classes.push('is-active');
      if (frame.wrong.includes(address)) classes.push('is-error');
      td.className = classes.join(' ');
    }
    nameBox.textContent = frame.cell;
    formulaText.textContent = frame.formula;
    log.replaceChildren(
      el('thead', {}, el('tr', {}, ['Cell', 'Formula after copying', 'Result'].map((h) => el('th', { scope: 'col' }, h)))),
      el('tbody', {}, frame.log.map((row) => el('tr', { class: row.cell === frame.cell ? 'is-current' : (row.wrong ? 'is-unmatched' : '') },
        el('td', {}, row.cell), el('td', {}, el('code', {}, row.formula)), el('td', {}, format(row.value, false))))));
  }

  layout.addEventListener('change', () => { fillChoices(); start(); });
  choice.addEventListener('change', start);
  fillChoices(options.choice);
  start();
  return stepper;
}

/** Parse "$E$1" into its parts. */
function parseRef(ref) {
  const [, colLock, col, rowLock, row] = ref.match(/^(\$?)([A-Z])(\$?)(\d+)$/);
  return { col, row: Number(row), colLocked: colLock === '$', rowLocked: rowLock === '$' };
}

/** Excel's copy rule: unlocked parts move by the distance the formula moved. */
export function shiftRef(ref, dCol, dRow) {
  const p = parseRef(ref);
  const col = p.colLocked ? p.col : String.fromCharCode(p.col.charCodeAt(0) + dCol);
  const row = p.rowLocked ? p.row : p.row + dRow;
  return `${p.colLocked ? '$' : ''}${col}${p.rowLocked ? '$' : ''}${row}`;
}

const plain = (ref) => ref.replace(/\$/g, '');

export function buildFrames(l, choiceId) {
  const choiceRefs = l.choices[choiceId].refs;
  const origin = l.targets[0];
  const values = {};
  const log = [];
  const correct = (cell) => {
    // The intended result: this row's price × this column's (or the single) rate.
    if (l === LAYOUTS.tax) return l.sheet[`B${cell.slice(1)}`] * l.sheet.E1;
    return l.sheet[`A${cell.slice(1)}`] * l.sheet[`${cell[0]}1`];
  };
  const frames = l.targets.map((cell, i) => {
    const dCol = cell.charCodeAt(0) - origin.charCodeAt(0);
    const dRow = Number(cell.slice(1)) - Number(origin.slice(1));
    const refs = choiceRefs.map((r) => shiftRef(r, dCol, dRow));
    // Earlier results count as cell values too (the relative grid multiplies them).
    const read = refs.map((r) => {
      const address = plain(r);
      const v = address in values ? values[address] : l.sheet[address];
      return { address, v, shown: v === undefined ? '(empty)' : format(v, l.percent.includes(address)) };
    });
    const value = round((read[0].v ?? 0) * (read[1].v ?? 0));
    values[cell] = value;
    const wrong = Math.abs(value - correct(cell)) > 1e-9;
    const formula = `=${refs[0]}*${refs[1]}`;
    log.push({ cell, formula, value, wrong });
    const empties = read.filter((x) => x.v === undefined).map((x) => x.address);
    const moved = i === 0 ? '' : `Copied ${describeMove(dCol, dRow)} from ${origin}: `;
    let text = `${moved}${cell} holds ${formula}. ${read.map((x) => `${x.address} = ${x.shown}`).join(', ')}, so ${cell} = ${format(value, false)}.`;
    if (empties.length) text += ` ${empties.join(' and ')} ${empties.length > 1 ? 'are' : 'is'} empty, which counts as 0 — wrong result.`;
    else if (wrong) text += ' That is not the intended result: the formula now points at the wrong cells.';
    return {
      cell, formula, refs: refs.map(plain), values: { ...values }, log: log.map((x) => ({ ...x })),
      wrong: log.filter((x) => x.wrong).map((x) => x.cell), text,
    };
  });
  const last = frames[frames.length - 1];
  const summary = { ...last, refs: [], text: l.verdict[choiceId] };
  return [frames[0], [...frames.slice(1), summary]];
}

function describeMove(dCol, dRow) {
  const parts = [];
  if (dRow) parts.push(`${dRow} row${dRow > 1 ? 's' : ''} down`);
  if (dCol) parts.push(`${dCol} column${dCol > 1 ? 's' : ''} across`);
  return parts.join(' and ');
}

function round(n) {
  return Number(n.toPrecision(12));
}

function format(value, percent) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'number') return value;
  if (percent) return `${round(value * 100)}%`;
  // Excel's General format switches to scientific notation for very large numbers.
  if (Math.abs(value) >= 1e11) return value.toExponential(3).replace(/\.?0+e/, 'e').replace('e+', 'E+');
  return String(round(value));
}
