// End-to-end deployment checklist: 26 items in six groups, ticked by the learner.
//
// Unlike the step-through visualizers this is a tracker, so it does not use the
// stepper. Ticks are stored per interaction id under the versioned key
// studyhub:v1:checklists ({ "<interaction-id>": ["<item-id>", …] }), which is in
// the progress-backup allowlist (js/backup.js), so they travel with Progress
// Import / Export. Ticking records the learner's own claim; StudyHub cannot see
// their server.

import { el } from '../util.js';
import { read, write } from '../storage.js';
import { CHECKLIST_GROUPS } from '../simulators/devops-common.js';

const KEY = 'checklists';
const ALL_ITEMS = CHECKLIST_GROUPS.flatMap(([, items]) => items.map(([id]) => id));

function load(listId) {
  const all = read(KEY, {});
  const items = all && typeof all === 'object' && Array.isArray(all[listId]) ? all[listId] : [];
  return new Set(items.filter((id) => ALL_ITEMS.includes(id)));
}

function save(listId, ticked) {
  const all = read(KEY, {});
  const next = all && typeof all === 'object' && !Array.isArray(all) ? { ...all } : {};
  if (ticked.size) next[listId] = ALL_ITEMS.filter((id) => ticked.has(id));
  else delete next[listId];
  write(KEY, next);
}

export function mount(root, { interaction }) {
  const listId = interaction.id;
  let ticked = load(listId);

  const summary = el('p', { class: 'checklist-summary', 'aria-live': 'polite' });
  const bar = el('span', { class: 'checklist-bar-fill' });
  const reset = el('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, 'Clear all ticks');
  const groups = el('div', { class: 'checklist-groups' });
  root.append(
    el('div', { class: 'checklist-head' }, summary, reset),
    el('span', { class: 'checklist-bar', 'aria-hidden': 'true' }, bar),
    groups,
    el('p', { class: 'viz-note' }, 'Your ticks are saved in this browser and included in Progress Import / Export.'),
  );

  // Built once; ticking only updates state, counts and the summary, so focus and
  // the checkbox the learner is on are never replaced.
  const legends = [];
  const boxes = [];
  groups.append(...CHECKLIST_GROUPS.map(([title, items], g) => {
    const legend = el('legend', {});
    legends.push([legend, title, items]);
    return el('fieldset', { class: 'checklist-group' }, legend,
      el('ul', { class: 'checklist-items' }, items.map(([id, label], i) => {
        const inputId = `chk-${listId}-${g}-${i}`;
        const box = el('input', { type: 'checkbox', id: inputId, 'data-item': id });
        boxes.push(box);
        return el('li', {}, box, el('label', { for: inputId }, label));
      })));
  }));

  function render() {
    for (const box of boxes) box.checked = ticked.has(box.dataset.item);
    for (const [legend, title, items] of legends) {
      legend.textContent = `${title} (${items.filter(([id]) => ticked.has(id)).length}/${items.length})`;
    }
    const count = ALL_ITEMS.filter((id) => ticked.has(id)).length;
    summary.textContent = count === ALL_ITEMS.length
      ? `All ${ALL_ITEMS.length} items checked — deployed, secured and recoverable.`
      : `${count} of ${ALL_ITEMS.length} items checked.`;
    bar.style.width = `${Math.round((count / ALL_ITEMS.length) * 100)}%`;
    reset.disabled = count === 0;
  }

  groups.addEventListener('change', (event) => {
    const box = event.target.closest('input[data-item]');
    if (!box) return;
    if (box.checked) ticked.add(box.dataset.item);
    else ticked.delete(box.dataset.item);
    save(listId, ticked);
    render();
  });

  reset.addEventListener('click', () => {
    if (!window.confirm('Clear every tick of this checklist?')) return;
    ticked = new Set();
    save(listId, ticked);
    render();
  });

  // A restored backup replaces the stored ticks.
  const onRestored = () => { ticked = load(listId); render(); };
  document.addEventListener('studyhub:restored', onRestored);

  render();
  return { destroy() { document.removeEventListener('studyhub:restored', onRestored); } };
}
