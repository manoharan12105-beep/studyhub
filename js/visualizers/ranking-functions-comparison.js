// ROW_NUMBER vs RANK vs DENSE_RANK, filled in row by row over the same ordered
// rows, so the effect of ties on each function is visible.

import { el } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper, field, errorLine } from '../engagement/stepper.js';

const DEFAULT_ROWS = 'Divya 88000, Arjun 60000, Sneha 60000, Rahul 55000, Meera 55000, Kiran 42000';

export function mount(root, { options }) {
  const rowsInput = el('input', { class: 'input', value: options.rows || DEFAULT_ROWS });
  const direction = el('select', { class: 'select' }, el('option', { value: 'desc' }, 'ORDER BY salary DESC'), el('option', { value: 'asc' }, 'ORDER BY salary ASC'));
  const run = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Apply');
  const error = errorLine();
  const sql = el('pre', { class: 'mini-code', tabindex: 0 });
  root.append(el('div', { class: 'viz-form' },
    el('div', { class: 'field field-grow' }, field('Rows: name and salary, comma-separated', rowsInput)), field('Window order', direction), run),
  error.node, el('div', { class: 'code-block' }, sql));

  const table = el('table', { class: 'viz-table' });
  root.append(el('div', { class: 'viz-stage' }, el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'Ranking results' }, table)));
  const stepper = createStepper(root, { render });

  function start() {
    const rows = parseRows(rowsInput.value);
    if (!rows) { error.show('Enter 2–12 rows like “Asha 500, Bala 400” (a name and a number each).'); return; }
    error.clear();
    const desc = direction.value === 'desc';
    sql.innerHTML = highlight(`SELECT name, salary,
       row_number() OVER w AS row_number,
       rank()       OVER w AS rank,
       dense_rank() OVER w AS dense_rank
FROM emp
WINDOW w AS (ORDER BY salary ${desc ? 'DESC' : 'ASC'});`, 'sql');
    // Stable sort: ties keep input order, standing in for an arbitrary tie order.
    const sorted = rows.map((r, i) => ({ ...r, i })).sort((a, b) => (desc ? b.salary - a.salary : a.salary - b.salary) || a.i - b.i);
    stepper.load(...buildFrames(sorted));
  }

  function render(frame) {
    const head = el('thead', {}, el('tr', {}, ['Position', 'name', 'salary', 'row_number', 'rank', 'dense_rank'].map((h) => el('th', { scope: 'col' }, h))));
    const body = el('tbody', {}, frame.rows.map((row, i) => {
      const filled = i < frame.filled;
      const classes = [];
      if (i === frame.filled - 1) classes.push('is-current');
      if (frame.tieWithPrev?.has(i) && filled) classes.push('is-tie');
      return el('tr', { class: classes.join(' ') },
        el('td', {}, String(i + 1)), el('td', {}, row.name), el('td', {}, row.salary.toLocaleString('en-IN')),
        el('td', {}, filled ? String(row.rn) : '·'), el('td', {}, filled ? String(row.rank) : '·'), el('td', {}, filled ? String(row.dense) : '·'));
    }));
    table.replaceChildren(head, body);
  }

  run.addEventListener('click', start);
  rowsInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  direction.addEventListener('change', start);
  start();
  return stepper;
}

function parseRows(text) {
  const chunks = text.split(',').map((c) => c.trim()).filter(Boolean);
  if (chunks.length < 2 || chunks.length > 12) return null;
  const rows = [];
  for (const chunk of chunks) {
    const match = chunk.match(/^(.*?)\s*(-?\d+(?:\.\d+)?)$/);
    if (!match) return null;
    rows.push({ name: match[1].trim() || `row ${rows.length + 1}`, salary: Number(match[2]) });
  }
  return rows;
}

function buildFrames(sorted) {
  const rows = sorted.map((r) => ({ ...r }));
  const tieWithPrev = new Set();
  let rank = 0;
  let dense = 0;
  const frames = [];
  rows.forEach((row, i) => {
    const tie = i > 0 && row.salary === rows[i - 1].salary;
    row.rn = i + 1;
    if (tie) { row.rank = rows[i - 1].rank; row.dense = rows[i - 1].dense; tieWithPrev.add(i); tieWithPrev.add(i - 1); } else { rank = i + 1; dense += 1; row.rank = rank; row.dense = dense; }
    let text;
    if (i === 0) text = `${row.name} comes first: all three functions start at 1.`;
    else if (tie) text = `${row.name} ties with ${rows[i - 1].name} (${row.salary}). row_number still moves on to ${row.rn}; rank and dense_rank repeat ${row.rank} and ${row.dense}.`;
    else if (tieWithPrev.has(i - 1)) {
      const skipped = row.rank - rows[i - 1].rank - 1;
      text = `${row.name} has a new value right after a tie. row_number = ${row.rn}. rank jumps to the position ${row.rank}, skipping ${skipped} number${skipped === 1 ? '' : 's'}; dense_rank just continues to ${row.dense}.`;
    } else if (rank !== dense) {
      text = `${row.name} has a new value: rank = position ${row.rank}, dense_rank = ${row.dense}. They stay apart because of the earlier gap.`;
    } else text = `${row.name} has a new value: all three increase to ${row.rn}.`;
    frames.push({ rows, filled: i + 1, tieWithPrev: new Set(tieWithPrev), text });
  });
  const last = frames[frames.length - 1];
  last.text += ' Done. Use row_number to pick exactly N rows, rank for competition ranking (gaps after ties), dense_rank for the Nth distinct value. Order among tied rows is arbitrary unless ORDER BY has a unique tiebreaker.';
  const first = { rows, filled: 0, tieWithPrev: new Set(), text: 'Rows are ordered by the window ORDER BY. Press Next to number them one by one.' };
  return [first, frames];
}
