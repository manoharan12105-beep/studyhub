// SQL joins step by step: each employees row is matched against departments,
// matched pairs and NULL-extended rows appear in the result as they are made.
// The "extra condition" option shows the classic trap: a filter on the right
// table in ON keeps unmatched left rows; the same filter in WHERE removes them.

import { el } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper, field } from '../engagement/stepper.js';

const EMPLOYEES = [
  { id: 1, name: 'Asha', dept_id: 10 },
  { id: 2, name: 'Bala', dept_id: 20 },
  { id: 3, name: 'Chitra', dept_id: 10 },
  { id: 4, name: 'Dev', dept_id: null },
];
const DEPARTMENTS = [
  { id: 10, name: 'Engineering' },
  { id: 20, name: 'Sales' },
  { id: 30, name: 'HR' },
];
const JOINS = { inner: 'INNER JOIN', left: 'LEFT JOIN', right: 'RIGHT JOIN', full: 'FULL JOIN' };
const show = (v) => (v === null ? 'NULL' : String(v));

export function mount(root, { options }) {
  const joinSelect = el('select', { class: 'select' }, Object.entries(JOINS).map(([v, l]) => el('option', { value: v }, l)));
  joinSelect.value = options.join || 'left';
  const extraSelect = el('select', { class: 'select' },
    el('option', { value: 'none' }, 'None'),
    el('option', { value: 'on' }, "ON … AND d.name = 'Engineering'"),
    el('option', { value: 'where' }, "WHERE d.name = 'Engineering'"));
  extraSelect.value = ['on', 'where'].includes(options.extra) ? options.extra : 'none';
  root.append(el('div', { class: 'viz-form' }, field('Join type', joinSelect), field('Extra condition', extraSelect)));

  const sql = el('pre', { class: 'mini-code', tabindex: 0 });
  const left = el('table', { class: 'viz-table' });
  const right = el('table', { class: 'viz-table' });
  const result = el('table', { class: 'viz-table' });
  root.append(el('div', { class: 'code-block' }, sql),
    el('div', { class: 'viz-stage join-stage' },
      el('div', { class: 'join-input' }, el('p', { class: 'tree-side-title' }, 'employees e'), wrap(left, 'employees')),
      el('div', { class: 'join-input' }, el('p', { class: 'tree-side-title' }, 'departments d'), wrap(right, 'departments')),
      el('div', { class: 'join-result' }, el('p', { class: 'tree-side-title' }, 'Result'), wrap(result, 'Join result'))));
  const stepper = createStepper(root, { render });

  function start() {
    const type = joinSelect.value;
    const extra = extraSelect.value;
    const on = `e.dept_id = d.id${extra === 'on' ? " AND d.name = 'Engineering'" : ''}`;
    sql.innerHTML = highlight(`SELECT e.name, e.dept_id, d.id, d.name
FROM employees e
${JOINS[type]} departments d ON ${on}${extra === 'where' ? "\nWHERE d.name = 'Engineering'" : ''};`, 'sql');
    stepper.load(...buildFrames(type, extra));
  }

  function render(frame) {
    left.replaceChildren(head(['id', 'name', 'dept_id']), el('tbody', {}, EMPLOYEES.map((e, i) => el('tr', { class: rowClass(frame.leftState[i], frame.activeLeft === i) },
      el('td', {}, show(e.id)), el('td', {}, e.name), el('td', {}, show(e.dept_id))))));
    right.replaceChildren(head(['id', 'name']), el('tbody', {}, DEPARTMENTS.map((d, i) => el('tr', { class: rowClass(frame.rightState[i], frame.activeRight.includes(i)) },
      el('td', {}, show(d.id)), el('td', {}, d.name)))));
    result.replaceChildren(head(['e.name', 'e.dept_id', 'd.id', 'd.name']),
      el('tbody', {}, frame.rows.length ? frame.rows.map((r) => el('tr', { class: [r.isNew ? 'is-current' : '', r.removed ? 'is-removed' : '', r.nullExtended ? 'is-null-ext' : ''].join(' ') },
        el('td', {}, show(r.ename)), el('td', {}, show(r.edept)), el('td', {}, show(r.did)), el('td', {}, show(r.dname)))) : el('tr', {}, el('td', { colspan: 4, class: 'muted' }, 'no rows yet'))));
  }

  joinSelect.addEventListener('change', start);
  extraSelect.addEventListener('change', start);
  start();
  return stepper;
}

function wrap(table, label) {
  return el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': label }, table);
}

function head(cols) {
  return el('thead', {}, el('tr', {}, cols.map((c) => el('th', { scope: 'col' }, c))));
}

function rowClass(state, active) {
  return [active ? 'is-current' : '', state === 'matched' ? 'is-matched' : '', state === 'unmatched' ? 'is-unmatched' : ''].join(' ');
}

function buildFrames(type, extra) {
  const onMatches = (e, d) => e.dept_id !== null && e.dept_id === d.id && (extra !== 'on' || d.name === 'Engineering');
  const keepLeft = type === 'left' || type === 'full';
  const keepRight = type === 'right' || type === 'full';
  const leftState = EMPLOYEES.map(() => null);
  const rightState = DEPARTMENTS.map(() => null);
  const rows = [];
  const frames = [];
  const snap = (text, activeLeft = -1, activeRight = []) => {
    frames.push({ text, activeLeft, activeRight, leftState: leftState.slice(), rightState: rightState.slice(), rows: rows.map((r) => ({ ...r })) });
    for (const r of rows) r.isNew = false;
  };

  const first = {
    text: `${JOINS[type]}: for each employees row, find the departments rows where the ON condition is true.${keepLeft ? ' Unmatched employees are kept with NULLs.' : ''}${keepRight ? ' Unmatched departments are kept with NULLs.' : ''}${!keepLeft && !keepRight ? ' Rows without a match are dropped.' : ''}`,
    activeLeft: -1, activeRight: [], leftState: leftState.slice(), rightState: rightState.slice(), rows: [],
  };

  const matchedRight = new Set();
  EMPLOYEES.forEach((e, i) => {
    const hits = DEPARTMENTS.map((d, j) => (onMatches(e, d) ? j : -1)).filter((j) => j !== -1);
    hits.forEach((j) => matchedRight.add(j));
    for (const j of hits) {
      const d = DEPARTMENTS[j];
      rows.push({ ename: e.name, edept: e.dept_id, did: d.id, dname: d.name, isNew: true });
      rightState[j] = 'matched';
    }
    leftState[i] = hits.length ? 'matched' : 'unmatched';
    let text;
    if (hits.length) {
      text = `${e.name} (dept_id ${e.dept_id}) matches ${hits.map((j) => DEPARTMENTS[j].name).join(', ')}: one result row per match.`;
    } else {
      const why = e.dept_id === null
        ? `dept_id is NULL, and NULL = anything is unknown (not true), so it matches nothing`
        : extra === 'on'
          ? `its department ${DEPARTMENTS.find((d) => d.id === e.dept_id)?.name || e.dept_id} fails the extra ON condition d.name = 'Engineering'`
          : `no department has id ${e.dept_id}`;
      if (keepLeft) {
        rows.push({ ename: e.name, edept: e.dept_id, did: null, dname: null, isNew: true, nullExtended: true });
        text = `${e.name}: ${why}. ${JOINS[type]} keeps it anyway, with NULL for every d column.`;
      } else {
        text = `${e.name}: ${why}. ${JOINS[type]} drops unmatched employees.`;
      }
    }
    snap(text, i, hits);
  });

  if (keepRight) {
    const unmatched = DEPARTMENTS.map((d, j) => j).filter((j) => !matchedRight.has(j));
    for (const j of unmatched) {
      const d = DEPARTMENTS[j];
      rightState[j] = 'unmatched';
      rows.push({ ename: null, edept: null, did: d.id, dname: d.name, isNew: true, nullExtended: true });
    }
    snap(unmatched.length
      ? `${JOINS[type]} also keeps departments that matched no employee: ${unmatched.map((j) => DEPARTMENTS[j].name).join(', ')}, with NULL for every e column.`
      : 'Every department matched at least one employee, so nothing extra is added.', -1, unmatched);
  }

  if (extra === 'where') {
    let removed = 0;
    for (const r of rows) {
      if (r.dname !== 'Engineering') { r.removed = true; removed++; }
    }
    snap(`WHERE runs after the join and keeps only rows where d.name = 'Engineering' is TRUE. It removes ${removed} row${removed === 1 ? '' : 's'} — including NULL-extended rows, because NULL = 'Engineering' is unknown.${keepLeft ? ' The outer join has effectively become an inner join: that is the trap.' : ''}`);
    for (let k = rows.length - 1; k >= 0; k--) if (rows[k].removed) rows.splice(k, 1);
  }

  snap(`Final result: ${rows.length} row${rows.length === 1 ? '' : 's'}. (Row order is not guaranteed without ORDER BY.)${extra === 'on' && keepLeft ? ' With the filter in ON, every employee survives — non-Engineering ones just get NULL department columns.' : ''}`);
  return [first, frames];
}
