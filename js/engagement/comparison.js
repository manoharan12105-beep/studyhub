// Interactive comparison table. "Test yourself" hides every cell; the learner
// recalls the answer, then reveals cells one at a time (active recall instead
// of re-reading the table).

import { el } from '../util.js';
import { renderInline } from '../markdown-renderer.js';

export function mount(root, { interaction }) {
  const columns = interaction.columns || [];
  const rows = interaction.rows || [];
  let hidden = false;

  const toggle = el('button', { type: 'button', class: 'btn btn-secondary', 'aria-pressed': 'false' }, 'Test yourself: hide answers');
  const revealAll = el('button', { type: 'button', class: 'btn btn-ghost', hidden: true }, 'Reveal all');
  const counter = el('span', { class: 'muted small', 'aria-live': 'polite' });
  const table = el('table', { class: 'compare-table' });
  const wrap = el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': `${interaction.title} table` }, table);

  toggle.addEventListener('click', () => {
    hidden = !hidden;
    toggle.setAttribute('aria-pressed', String(hidden));
    toggle.textContent = hidden ? 'Show all answers' : 'Test yourself: hide answers';
    revealAll.hidden = !hidden;
    build();
  });
  revealAll.addEventListener('click', () => {
    for (const button of table.querySelectorAll('.cell-reveal')) button.click();
  });

  root.append(el('div', { class: 'compare-toolbar' }, toggle, revealAll, counter), wrap);
  build();

  function build() {
    const head = el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Aspect'),
      columns.map((c) => el('th', { scope: 'col' }, c))));
    const body = el('tbody', {}, rows.map((row) => el('tr', {},
      el('th', { scope: 'row' }, renderInline(row.aspect)),
      columns.map((column, i) => el('td', {}, hidden ? hiddenCell(row, column, i) : renderInline(row.cells[i] ?? ''))))));
    table.replaceChildren(head, body);
    updateCounter();
  }

  function hiddenCell(row, column, i) {
    const button = el('button', { type: 'button', class: 'cell-reveal' },
      el('span', { class: 'sr-only' }, `Reveal ${column}: ${row.aspect}`), el('span', { 'aria-hidden': 'true' }, 'Reveal'));
    button.addEventListener('click', () => {
      const cell = button.parentElement;
      cell.replaceChildren(renderInline(row.cells[i] ?? ''));
      cell.classList.add('just-revealed');
      updateCounter();
    });
    return button;
  }

  function updateCounter() {
    const remaining = table.querySelectorAll('.cell-reveal').length;
    counter.textContent = hidden ? `${remaining} hidden` : '';
  }

  return {};
}
