// Excel PivotTable builder: drag-free version of the PivotTable Fields pane.
//
//   source rows → Filters (keep matching rows) → Rows (one line per unique item)
//   → Columns (split each line) → Values (Sum / Count / Average of Sales in
//   every cell) → Grand Totals
//
// The data is the module's Sales dataset (Excel Fundamentals, A1:D13), and the
// labels match what Excel shows ("Row Labels", "Sum of Sales", "Grand Total").
// Every total was checked against a real PivotTable.

import { el } from '../util.js';
import { createStepper, field, errorLine } from '../engagement/stepper.js';

const FIELDS = ['Product', 'Region', 'Month'];
const MONTH_ORDER = ['Jan', 'Feb', 'Mar'];
const DATA = [
  ['Laptop', 'South', 'Jan', 50000], ['Mobile', 'North', 'Jan', 30000], ['Laptop', 'North', 'Jan', 45000], ['Mobile', 'South', 'Jan', 35000],
  ['Laptop', 'South', 'Feb', 52000], ['Mobile', 'North', 'Feb', 28000], ['Laptop', 'North', 'Feb', 47000], ['Mobile', 'South', 'Feb', 36000],
  ['Laptop', 'South', 'Mar', 55000], ['Mobile', 'North', 'Mar', 33000], ['Laptop', 'North', 'Mar', 44000], ['Mobile', 'South', 'Mar', 40000],
].map(([Product, Region, Month, Sales]) => ({ Product, Region, Month, Sales }));

const SUMMARIES = {
  sum: { label: 'Sum of Sales', verb: 'adds' },
  count: { label: 'Count of Sales', verb: 'counts' },
  average: { label: 'Average of Sales', verb: 'averages' },
};

export function mount(root, { options }) {
  const rows = select(FIELDS.map((f) => [f, f]), options.rows || 'Product');
  const cols = select([['', '(none)'], ...FIELDS.map((f) => [f, f])], options.columns ?? 'Region');
  const values = select(Object.entries(SUMMARIES).map(([v, s]) => [v, s.label]), options.values || 'sum');
  const filterField = select([['', '(none)'], ...FIELDS.map((f) => [f, f])], options.filter || '');
  const filterItem = el('select', { class: 'select' });
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' },
    field('Rows', rows), field('Columns', cols), field('Values', values), field('Filters', filterField), field('Filter item', filterItem)), error.node);

  const source = el('table', { class: 'viz-table' });
  const pivot = el('table', { class: 'viz-table pivot-table' });
  // Excel shows report filters in their own cells above the PivotTable.
  const filterLine = el('p', { class: 'pivot-filter-line', hidden: true });
  root.append(el('div', { class: 'viz-stage pivot-stage' },
    el('div', {},
      el('p', { class: 'pivot-title' }, 'Source data (Sales, A1:D13)'),
      el('div', { class: 'table-wrap pivot-source', tabindex: 0, role: 'region', 'aria-label': 'Source data' }, source)),
    el('div', {},
      el('p', { class: 'pivot-title' }, 'PivotTable'),
      filterLine,
      el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'PivotTable result' }, pivot))));
  const stepper = createStepper(root, { render, nextLabel: 'Next step' });

  function fillItems(preferred) {
    const f = filterField.value;
    filterItem.disabled = !f;
    filterItem.replaceChildren(...(f ? uniqueItems(DATA, f) : ['(All)']).map((v) => el('option', { value: v }, v)));
    if (f && preferred && uniqueItems(DATA, f).includes(preferred)) filterItem.value = preferred;
  }

  function start() {
    const layout = { rows: rows.value, cols: cols.value, summary: values.value, filter: filterField.value, item: filterItem.value };
    if (layout.rows === layout.cols) {
      error.show('A field can go in Rows or Columns, not both. Choose a different Columns field or (none).');
      return;
    }
    if (layout.filter && (layout.filter === layout.rows || layout.filter === layout.cols)) {
      error.show('A field cannot be in Filters and also in Rows or Columns. Pick another filter field.');
      return;
    }
    error.clear();
    stepper.load(...buildFrames(layout));
  }

  function render(frame) {
    source.replaceChildren(
      el('thead', {}, el('tr', {}, ['Row', ...FIELDS, 'Sales'].map((h) => el('th', { scope: 'col' }, h)))),
      el('tbody', {}, DATA.map((r, i) => {
        const kept = frame.kept.has(i);
        return el('tr', { class: !kept ? 'is-removed' : frame.highlight.has(i) ? 'is-current' : '' },
          el('td', {}, String(i + 2)), FIELDS.map((f) => el('td', {}, r[f])), el('td', {}, String(r.Sales)));
      })));
    const { layout, stage } = frame;
    filterLine.hidden = !layout.filter || stage === 'source';
    filterLine.replaceChildren(el('span', { class: 'pivot-filter-field' }, layout.filter), el('span', {}, layout.item));
    pivot.replaceChildren(...renderPivot(frame));
  }

  function renderPivot({ layout, stage, table }) {
    const caption = SUMMARIES[layout.summary].label;
    if (stage === 'source') {
      return [el('tbody', {}, el('tr', {}, el('td', { class: 'muted' }, 'Empty — choose fields, then step through.')))];
    }
    const showCols = layout.cols && stage !== 'filter' && stage !== 'rows';
    const showValues = stage === 'values' || stage === 'totals';
    const showTotals = stage === 'totals';
    const colItems = showCols ? table.colItems : [];
    const cell = (v) => (showValues ? fmt(v, layout.summary) : '');
    const head = [];
    if (stage === 'filter') {
      return [el('tbody', {}, el('tr', {}, el('td', { class: 'muted' }, 'Rows, Columns and Values come next.')))];
    }
    if (showCols) {
      head.push(el('tr', {}, el('th', { scope: 'col' }, showValues ? caption : ''), el('th', { scope: 'colgroup', colspan: colItems.length + (showTotals ? 1 : 0) }, 'Column Labels')));
      head.push(el('tr', {}, el('th', { scope: 'col' }, 'Row Labels'), colItems.map((c) => el('th', { scope: 'col' }, c)), showTotals ? el('th', { scope: 'col' }, 'Grand Total') : null));
    } else {
      head.push(el('tr', {}, el('th', { scope: 'col' }, 'Row Labels'), el('th', { scope: 'col' }, showValues ? caption : '')));
    }
    const body = table.rowItems.map((r) => el('tr', {},
      el('th', { scope: 'row' }, r),
      showCols ? colItems.map((c) => el('td', { class: 'is-number' }, cell(table.cells[r]?.[c]))) : el('td', { class: 'is-number' }, cell(table.rowTotals[r])),
      showCols && showTotals ? el('td', { class: 'is-number pivot-total' }, cell(table.rowTotals[r])) : null));
    if (showTotals) {
      body.push(el('tr', { class: 'pivot-grand' },
        el('th', { scope: 'row' }, 'Grand Total'),
        showCols ? colItems.map((c) => el('td', { class: 'is-number' }, cell(table.colTotals[c]))) : null,
        el('td', { class: 'is-number' }, cell(table.grand))));
    }
    return [el('thead', {}, head), el('tbody', {}, body)];
  }

  rows.addEventListener('change', start);
  cols.addEventListener('change', start);
  values.addEventListener('change', start);
  filterField.addEventListener('change', () => { fillItems(); start(); });
  filterItem.addEventListener('change', start);
  fillItems(options.item);
  start();
  return stepper;
}

function select(pairs, value) {
  const s = el('select', { class: 'select' }, pairs.map(([v, l]) => el('option', { value: v }, l)));
  s.value = value;
  return s;
}

function uniqueItems(rows, f) {
  const items = [...new Set(rows.map((r) => r[f]))];
  // Excel sorts row/column items A→Z, except months, which it keeps in calendar order.
  return f === 'Month' ? MONTH_ORDER.filter((m) => items.includes(m)) : items.sort();
}

function aggregate(rows, summary) {
  if (!rows.length) return null;
  const sum = rows.reduce((n, r) => n + r.Sales, 0);
  if (summary === 'count') return rows.length;
  if (summary === 'average') return sum / rows.length;
  return sum;
}

/** Summary table for a layout: row items, column items and every aggregate. */
export function summarise(layout) {
  const kept = DATA.filter((r) => !layout.filter || r[layout.filter] === layout.item);
  const rowItems = uniqueItems(kept, layout.rows);
  const colItems = layout.cols ? uniqueItems(kept, layout.cols) : [];
  const cells = {};
  const rowTotals = {};
  for (const r of rowItems) {
    const inRow = kept.filter((x) => x[layout.rows] === r);
    rowTotals[r] = aggregate(inRow, layout.summary);
    cells[r] = {};
    for (const c of colItems) cells[r][c] = aggregate(inRow.filter((x) => x[layout.cols] === c), layout.summary);
  }
  const colTotals = {};
  for (const c of colItems) colTotals[c] = aggregate(kept.filter((x) => x[layout.cols] === c), layout.summary);
  return { rowItems, colItems, cells, rowTotals, colTotals, grand: aggregate(kept, layout.summary) };
}

export function buildFrames(layout) {
  const all = new Set(DATA.map((_, i) => i));
  const kept = new Set(DATA.map((r, i) => (!layout.filter || r[layout.filter] === layout.item ? i : -1)).filter((i) => i >= 0));
  const table = summarise(layout);
  const s = SUMMARIES[layout.summary];
  const frame = (stage, extra) => ({ layout, table, stage, kept, highlight: new Set(), ...extra });

  const first = frame('source', { kept: all, text: `The source is 12 rows of Sales data with a header row. Fields: Product, Region, Month, Sales. You chose Rows = ${layout.rows}${layout.cols ? `, Columns = ${layout.cols}` : ''}, Values = ${s.label}${layout.filter ? `, Filter ${layout.filter} = ${layout.item}` : ''}.` });
  const frames = [];
  if (layout.filter) {
    frames.push(frame('filter', { text: `Filters: keep only rows where ${layout.filter} = ${layout.item}. ${kept.size} of 12 rows remain; the struck-out rows are ignored by every calculation below.` }));
  }
  frames.push(frame('rows', { text: `Rows: each unique ${layout.rows} becomes one row label — ${table.rowItems.join(', ')}. Repeated entries collapse into one line.` }));
  if (layout.cols) {
    frames.push(frame('cols', { text: `Columns: each unique ${layout.cols} becomes a column — ${table.colItems.join(', ')}. Every row label is now split by ${layout.cols}.` }));
  }
  const firstRow = table.rowItems[0];
  const firstCol = table.colItems[0];
  const sample = DATA.map((r, i) => ({ r, i })).filter(({ r, i }) => kept.has(i) && r[layout.rows] === firstRow && (!layout.cols || r[layout.cols] === firstCol));
  const where = layout.cols ? `${firstRow} × ${firstCol}` : firstRow;
  const how = layout.summary === 'count'
    ? `counts them: ${sample.length}`
    : layout.summary === 'average'
      ? `averages them: (${sample.map(({ r }) => r.Sales).join(' + ')}) ÷ ${sample.length} = ${fmt(table.cells[firstRow]?.[firstCol] ?? table.rowTotals[firstRow], 'average')}`
      : `adds them: ${sample.map(({ r }) => r.Sales).join(' + ')} = ${fmt(layout.cols ? table.cells[firstRow][firstCol] : table.rowTotals[firstRow], 'sum')}`;
  frames.push(frame('values', {
    highlight: new Set(sample.map(({ i }) => i)),
    text: `Values: ${s.label} ${s.verb} the Sales of the matching source rows in every cell. For ${where}, the highlighted rows ${sample.map(({ i }) => i + 2).join(', ')} match, so Excel ${how}.`,
  }));
  frames.push(frame('totals', {
    text: `Grand Totals are calculated from the source rows, not by adding the cells above: Grand Total = ${fmt(table.grand, layout.summary)}.${layout.summary === 'average' ? ` It averages all ${kept.size} kept rows at once — it is not the sum of the row averages.` : ''} Change a field above to rebuild the PivotTable.`,
  }));
  return [first, frames];
}

// Plain numbers, as a PivotTable shows them in General format; averages are
// rounded to 2 decimals here (Excel would show 48833.33333 until formatted).
function fmt(value, summary) {
  if (value === null || value === undefined) return '';
  return String(summary === 'average' ? Number(value.toFixed(2)) : value);
}
