// Git command explorer: a searchable reference of common commands.
//
//   search text + category + safety filter → matching commands
//   each command: syntax, purpose, important options, example, effect on the
//   repository, a common mistake, its safety class and the lesson that teaches it
//
// Reference data only (COMMANDS in git-common.js); it does not use the step
// engine and never runs anything.

import { el, debounce } from '../util.js';
import { href } from '../router.js';
import { field } from '../engagement/stepper.js';
import { COMMANDS, CATEGORIES, SAFETY, searchCommands } from '../simulators/git-common.js';

export function mount(root, { options }) {
  const search = el('input', { class: 'input', type: 'search', placeholder: 'e.g. stash, undo, remote', autocomplete: 'off', spellcheck: 'false' });
  const category = el('select', { class: 'select' }, ['All', ...CATEGORIES].map((c) => el('option', { value: c }, c)));
  const safety = el('select', { class: 'select' },
    el('option', { value: 'all' }, 'Any'),
    Object.entries(SAFETY).map(([k, s]) => el('option', { value: k }, s.label)));
  if (CATEGORIES.includes(options.category)) category.value = options.category;
  root.append(el('div', { class: 'viz-form' },
    field('Search commands', search), field('Category', category), field('Safety', safety)));

  const count = el('p', { class: 'viz-note', 'aria-live': 'polite' });
  const list = el('div', { class: 'git-cmd-list' });
  root.append(count, list,
    el('p', { class: 'viz-note' }, 'Safety classes: ', Object.values(SAFETY).map((s, i) => [i ? ' · ' : '', el('strong', {}, s.label), ` — ${s.note}`])));

  function card(c) {
    return el('details', { class: 'git-cmd' },
      el('summary', {},
        el('code', { class: 'git-cmd-name' }, c.name),
        el('span', { class: `git-safety git-safety-${c.safety}` }, SAFETY[c.safety].label),
        el('span', { class: 'git-cmd-purpose' }, c.purpose)),
      el('dl', { class: 'git-cmd-body' },
        el('dt', {}, 'Syntax'), el('dd', {}, el('code', {}, c.syntax)),
        el('dt', {}, 'Important options'), el('dd', {}, el('ul', {}, c.options.map((o) => el('li', {}, el('code', {}, o.split(':')[0]), o.includes(':') ? `:${o.split(':').slice(1).join(':')}` : '')))),
        el('dt', {}, 'Example'), el('dd', {}, el('code', {}, c.example)),
        el('dt', {}, 'Effect on the repository'), el('dd', {}, c.effect),
        el('dt', {}, 'Common mistake'), el('dd', {}, c.mistake),
        el('dt', {}, 'Learn more'), el('dd', {}, el('a', { href: href(['t', c.topic]) }, 'Open the lesson'))));
  }

  function update() {
    const found = searchCommands(search.value, category.value, safety.value);
    count.textContent = `${found.length} of ${COMMANDS.length} commands`;
    list.replaceChildren(...(found.length ? found.map(card) : [el('p', { class: 'viz-note' }, 'No command matches. Try a shorter word such as "undo", "branch" or "remote".')]));
  }

  search.addEventListener('input', debounce(update, 120));
  category.addEventListener('change', update);
  safety.addEventListener('change', update);
  update();
  return { destroy() {} };
}
