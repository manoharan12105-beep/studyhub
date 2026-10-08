// My notes (#/notes), one note (#/notes/<id>), the "Your notes" box on topic
// pages and the dashboard's recent notes. Data: js/notes.js; editor: note-dialog.js.
//
// The notes page has its own search and filters (the global search index never
// holds notes). Names come from metadata through the stored ids. Filter state
// lives in the URL query (replaceState), so Back from a note returns to the same list.

import { el, icon, debounce, timeAgo } from '../util.js';
import { getCategory, getTopic, categoriesInDisplayOrder, index, isAvailable } from '../content-loader.js';
import { href } from '../router.js';
import * as notes from '../notes.js';
import * as engine from '../study-engine.js';
import { track } from '../engagement/registry.js';
import { pageHeader, emptyState, errorState } from './common.js';
import { highlightMatch } from './layout.js';
import { openNoteEditor, confirmDeleteNote } from './note-dialog.js';

const PRIVACY = 'Your notes are stored in this browser. Nothing is uploaded.';
const PREVIEW = 240;
const DATE_LABELS = { any: 'Any time', today: 'Today', week: 'This week', month: 'This month', custom: 'Custom range' };
const SORT_LABELS = { newest: 'Newest first', oldest: 'Oldest first', updated: 'Recently updated' };
const SORTS = {
  newest: notes.byCreated,
  oldest: (a, b) => -notes.byCreated(a, b),
  updated: notes.byUpdated,
};

/** Re-run `fn` whenever notes change (this tab), until the route changes. */
function onNotesChange(fn) {
  const handler = (event) => { if (event.detail?.key === 'notes') fn(); };
  document.addEventListener('studyhub:change', handler);
  track({ destroy: () => document.removeEventListener('studyhub:change', handler) });
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Names for a note, from metadata. Missing pieces stay null. */
function names(note) {
  const category = getCategory(note.subjectId);
  const sub = note.moduleId ? category?.subcategories.find((s) => s.id === note.moduleId) || null : null;
  const topic = getTopic(note.topicId);
  return { category, sub, topic };
}

function pathText({ category, sub, topic }) {
  return [category?.title, sub?.title, topic?.title || 'Topic no longer available'].filter(Boolean).join(' → ');
}

function preview(text) {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > PREVIEW ? `${flat.slice(0, PREVIEW).trimEnd()}…` : flat;
}

/** Where "Start studying" goes: the topic to continue, else the first topic. */
function studyTarget() {
  const next = engine.continueLearning();
  if (next) return href(['t', next.topic.id]);
  const first = index.categories.find(isAvailable)?.topics[0];
  return first ? href(['t', first.id]) : '#/';
}

function privacyNote() {
  return el('p', { class: 'backup-privacy small muted' }, icon('info', 14), el('span', {}, PRIVACY));
}

// ---- My notes -----------------------------------------------------------------------

export function renderNotes(main, { query }) {
  const state = {
    q: query.get('q') || '',
    subject: query.get('subject') || '',
    module: query.get('module') || '',
    topic: query.get('topic') || '',
    date: DATE_LABELS[query.get('date')] ? query.get('date') : 'any',
    from: query.get('from') || '',
    to: query.get('to') || '',
    sort: SORT_LABELS[query.get('sort')] ? query.get('sort') : 'newest',
  };

  const page = el('div', { class: 'page notes-page' });
  main.replaceChildren(page);
  const heading = pageHeader({
    crumbs: [{ label: 'Dashboard', href: '#/' }, { label: 'My notes' }],
    title: 'My notes',
    lead: 'Everything you wrote while studying, linked to its subject, module and topic.',
  });

  // Controls are built once; only the option lists and the result list change.
  const select = (id, label) => el('div', { class: 'field' }, el('label', { for: id }, label), el('select', { class: 'select', id }));
  const search = el('input', {
    type: 'search', class: 'input input-lg', id: 'notes-search', placeholder: 'Search notes…', autocomplete: 'off',
    'aria-describedby': 'notes-count',
  });
  search.value = state.q;
  const fields = {
    subject: select('notes-subject', 'Subject'),
    module: select('notes-module', 'Module'),
    topic: select('notes-topic', 'Topic'),
    date: select('notes-date', 'Updated'),
    sort: select('notes-sort', 'Sort'),
  };
  const ctl = Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, f.querySelector('select')]));
  const fromInput = el('input', { type: 'date', class: 'input', id: 'notes-from' });
  const toInput = el('input', { type: 'date', class: 'input', id: 'notes-to' });
  fromInput.value = state.from;
  toInput.value = state.to;
  const rangeError = el('p', { class: 'form-error', id: 'notes-range-error' });
  const range = el('div', { class: 'notes-range', role: 'group', 'aria-label': 'Custom date range' },
    el('div', { class: 'field' }, el('label', { for: 'notes-from' }, 'From'), fromInput),
    el('div', { class: 'field' }, el('label', { for: 'notes-to' }, 'To'), toInput),
    rangeError);
  setOptions(ctl.date, Object.entries(DATE_LABELS), state.date);
  setOptions(ctl.sort, Object.entries(SORT_LABELS), state.sort);

  const count = el('p', { class: 'muted small notes-count', id: 'notes-count', 'aria-live': 'polite' });
  const list = el('ul', { class: 'note-list', role: 'list' });
  const results = el('div', {});
  const controls = el('div', { class: 'notes-controls' },
    el('label', { class: 'sr-only', for: 'notes-search' }, 'Search notes'),
    search,
    el('div', { class: 'notes-filters' }, Object.values(fields)),
    range);

  let all = [];
  let rows = [];

  /** Rebuild from storage: the list of notes, their names and the filter options. */
  function load() {
    all = notes.list();
    rows = all.map((note) => {
      const n = names(note);
      return { note, names: n, hay: [note.title, note.content, n.category?.title, n.sub?.title, n.topic?.title].filter(Boolean).join('\n').toLowerCase() };
    });
    if (!all.length) {
      page.replaceChildren(heading,
        el('div', { class: 'empty-state' },
          el('p', { class: 'empty-title' }, 'No notes yet'),
          el('p', {}, 'Take notes while studying a topic and they’ll appear here.'),
          el('div', { class: 'empty-actions' }, el('a', { class: 'btn btn-primary', href: studyTarget() }, 'Start studying'))),
        privacyNote());
      return;
    }
    if (!page.contains(controls)) page.replaceChildren(heading, privacyNote(), controls, count, results);
    syncOptions();
    run();
  }

  function setOptions(selectNode, entries, value) {
    selectNode.replaceChildren(...entries.map(([v, label]) => el('option', { value: v }, label)));
    selectNode.value = entries.some(([v]) => v === value) ? value : entries[0][0];
    return selectNode.value;
  }

  /** Only subjects, modules and topics that have notes; modules and topics follow the choices above them. */
  function syncOptions() {
    const order = new Map(categoriesInDisplayOrder().map((c, i) => [c.id, i]));
    const subjects = new Map();
    for (const { note, names: n } of rows) subjects.set(note.subjectId, n.category?.title || note.subjectId);
    const subjectEntries = [...subjects].sort((a, b) => (order.get(a[0]) ?? 999) - (order.get(b[0]) ?? 999));
    state.subject = setOptions(ctl.subject, [['', 'All subjects'], ...subjectEntries], state.subject);

    const inSubject = rows.filter((r) => !state.subject || r.note.subjectId === state.subject);
    const modules = new Map();
    for (const { note, names: n } of inSubject) {
      if (!note.moduleId) continue;
      const key = `${note.subjectId}/${note.moduleId}`;
      const label = n.sub?.title || note.moduleId;
      modules.set(key, state.subject ? label : `${n.category?.title || note.subjectId} → ${label}`);
    }
    state.module = setOptions(ctl.module, [['', 'All modules'], ...[...modules].sort((a, b) => a[1].localeCompare(b[1]))], state.module);

    const inModule = inSubject.filter((r) => !state.module || `${r.note.subjectId}/${r.note.moduleId}` === state.module);
    const topics = new Map();
    for (const { note, names: n } of inModule) topics.set(note.topicId, n.topic?.title || `${note.topicId} (no longer available)`);
    state.topic = setOptions(ctl.topic, [['', 'All topics'], ...[...topics].sort((a, b) => a[1].localeCompare(b[1]))], state.topic);
  }

  /** [start, end) in ms for the date filter, or null for any time. */
  function dateRange() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (state.date === 'today') return [today.getTime(), Infinity];
    if (state.date === 'week') {
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      return [monday.getTime(), Infinity];
    }
    if (state.date === 'month') return [new Date(now.getFullYear(), now.getMonth(), 1).getTime(), Infinity];
    if (state.date === 'custom') {
      const day = (ymd, plus = 0) => {
        const [y, m, d] = ymd.split('-').map(Number);
        return new Date(y, m - 1, d + plus).getTime();
      };
      return [state.from ? day(state.from) : -Infinity, state.to ? day(state.to, 1) : Infinity];
    }
    return null;
  }

  function run() {
    range.hidden = state.date !== 'custom';
    const badRange = state.date === 'custom' && state.from && state.to && state.from > state.to;
    rangeError.textContent = badRange ? 'The “From” date is after the “To” date.' : '';
    for (const input of [fromInput, toInput]) {
      if (badRange) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    window.history.replaceState(null, '', href(['notes'], {
      q: state.q, subject: state.subject, module: state.module, topic: state.topic,
      date: state.date === 'any' ? '' : state.date,
      from: state.date === 'custom' ? state.from : '', to: state.date === 'custom' ? state.to : '',
      sort: state.sort === 'newest' ? '' : state.sort,
    }));

    const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    const span = dateRange();
    const shown = badRange ? [] : rows.filter(({ note, hay }) => {
      if (state.subject && note.subjectId !== state.subject) return false;
      if (state.module && `${note.subjectId}/${note.moduleId}` !== state.module) return false;
      if (state.topic && note.topicId !== state.topic) return false;
      if (span) {
        const t = Date.parse(note.updatedAt);
        if (t < span[0] || t >= span[1]) return false;
      }
      return terms.every((term) => hay.includes(term));
    }).sort((a, b) => SORTS[state.sort](a.note, b.note));

    const filtered = state.q || state.subject || state.module || state.topic || state.date !== 'any';
    count.textContent = filtered
      ? `Showing ${shown.length} of ${all.length} note${all.length === 1 ? '' : 's'}`
      : `${all.length} note${all.length === 1 ? '' : 's'}`;

    if (!shown.length) {
      const clear = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Clear search and filters');
      clear.addEventListener('click', () => {
        Object.assign(state, { q: '', subject: '', module: '', topic: '', date: 'any', from: '', to: '' });
        search.value = '';
        ctl.date.value = 'any';
        fromInput.value = '';
        toInput.value = '';
        syncOptions();
        run();
        search.focus();
      });
      results.replaceChildren(el('div', { class: 'empty-state small' },
        el('p', {}, state.q ? 'No notes match your search.' : 'No notes match these filters.'),
        el('div', { class: 'empty-actions' }, clear)));
      return;
    }
    list.replaceChildren(...shown.map((row) => noteCard(row, state.q)));
    if (results.firstChild !== list) results.replaceChildren(list);
  }

  const runSearch = debounce(() => { state.q = search.value.trim(); run(); }, 80);
  search.addEventListener('input', runSearch);
  ctl.subject.addEventListener('change', () => { state.subject = ctl.subject.value; state.module = ''; state.topic = ''; syncOptions(); run(); });
  ctl.module.addEventListener('change', () => { state.module = ctl.module.value; state.topic = ''; syncOptions(); run(); });
  ctl.topic.addEventListener('change', () => { state.topic = ctl.topic.value; run(); });
  ctl.date.addEventListener('change', () => { state.date = ctl.date.value; run(); });
  ctl.sort.addEventListener('change', () => { state.sort = ctl.sort.value; run(); });
  fromInput.addEventListener('change', () => { state.from = fromInput.value; run(); });
  toInput.addEventListener('change', () => { state.to = toInput.value; run(); });

  // One listener for every card's Edit and Delete.
  list.addEventListener('click', (event) => {
    const action = event.target.closest('[data-note-action]');
    if (!action) return;
    if (action.dataset.noteAction === 'edit') openNoteEditor({ noteId: action.dataset.id });
    else if (action.dataset.noteAction === 'delete') confirmDeleteNote(action.dataset.id);
  });

  onNotesChange(load);
  load();
  return { title: 'My notes' };
}

function noteCard({ note, names: n }, query) {
  const created = formatDate(note.createdAt);
  const updated = formatDate(note.updatedAt);
  const titleId = `note-t-${note.id}`;
  const sr = el('span', { class: 'sr-only' }, `: ${note.title}`);
  return el('li', { class: 'note-card', 'aria-labelledby': titleId },
    el('h2', { class: 'note-card-title', id: titleId }, icon('note', 16), el('span', {}, query ? highlightMatch(note.title, query) : note.title)),
    el('p', { class: 'note-card-path' }, pathText(n)),
    el('p', { class: 'note-card-date' },
      el('time', { datetime: note.updatedAt }, `Updated ${updated}`),
      created !== updated ? el('span', {}, ` · Created ${created}`) : null),
    el('p', { class: 'note-card-preview' }, query ? highlightMatch(preview(note.content), query) : preview(note.content)),
    el('div', { class: 'note-card-actions' },
      el('a', { class: 'btn btn-secondary btn-sm', href: href(['notes', note.id]) }, 'Open', sr.cloneNode(true)),
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'data-note-action': 'edit', 'data-id': note.id, 'data-focus-key': `edit:${note.id}` }, 'Edit', sr.cloneNode(true)),
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm btn-danger-text', 'data-note-action': 'delete', 'data-id': note.id }, 'Delete', sr)));
}

// ---- One note -------------------------------------------------------------------------

export function renderNote(main, { id }) {
  function draw() {
    const note = notes.get(id);
    if (!note) {
      main.replaceChildren(errorState({
        title: 'Note not found',
        message: 'This note does not exist in this browser. It may have been deleted.',
        actions: [{ label: 'My notes', href: '#/notes', primary: true }],
      }));
      return { title: 'Note not found' };
    }
    const n = names(note);
    const edit = el('button', { type: 'button', class: 'btn btn-secondary', 'data-focus-key': `edit:${note.id}` }, icon('note', 16), 'Edit');
    const del = el('button', { type: 'button', class: 'btn btn-ghost btn-danger-text' }, 'Delete');
    edit.addEventListener('click', () => openNoteEditor({ noteId: note.id }));
    del.addEventListener('click', () => confirmDeleteNote(note.id, { onDeleted: () => { window.location.hash = '#/notes'; } }));
    const openTopic = n.topic
      ? el('a', { class: 'btn btn-primary', href: href(['t', n.topic.id]) }, 'Open topic', icon('arrowRight', 16))
      : null;

    const trail = [
      n.category ? el('a', { href: href(['c', n.category.id]) }, n.category.title) : null,
      n.sub ? el('a', { href: href(['c', n.category.id, n.sub.id]) }, n.sub.title) : null,
      n.topic ? el('a', { href: href(['t', n.topic.id]) }, n.topic.title) : el('span', {}, 'Topic no longer available'),
    ].filter(Boolean);

    main.replaceChildren(el('div', { class: 'page note-page' },
      pageHeader({
        crumbs: [{ label: 'Dashboard', href: '#/' }, { label: 'My notes', href: '#/notes' }, { label: note.title }],
        title: note.title,
        actions: [edit, del, openTopic],
      }),
      el('p', { class: 'note-trail' }, el('span', { class: 'sr-only' }, 'Topic: '), trail.map((node, i) => [i ? el('span', { class: 'note-trail-sep', 'aria-hidden': 'true' }, ' → ') : null, node])),
      el('dl', { class: 'note-dates' },
        el('div', {}, el('dt', {}, 'Created'), el('dd', {}, el('time', { datetime: note.createdAt }, formatDateTime(note.createdAt)))),
        el('div', {}, el('dt', {}, 'Updated'), el('dd', {}, el('time', { datetime: note.updatedAt }, formatDateTime(note.updatedAt))))),
      el('div', { class: 'note-body' }, note.content),
      privacyNote()));
    return { title: note.title };
  }
  onNotesChange(() => { if (notes.get(id)) draw(); });
  return draw();
}

// ---- Topic page: "Your notes" ----------------------------------------------------------

/** A compact box under the lesson: this topic's notes and an Add note button. */
export function topicNotesSection(topic) {
  const section = el('section', { class: 'topic-notes', 'aria-labelledby': 'topic-notes-title' });

  function draw() {
    const mine = notes.forTopic(topic.id);
    const add = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', 'data-focus-key': 'topic-notes-add' }, icon('plus', 16), 'Add note');
    add.addEventListener('click', () => openNoteEditor({ topicId: topic.id }));
    section.replaceChildren(
      el('div', { class: 'topic-notes-head' },
        el('h2', { class: 'topic-notes-title', id: 'topic-notes-title' }, 'Your notes', mine.length ? el('span', { class: 'muted' }, ` (${mine.length})`) : null),
        add),
      mine.length
        ? el('ul', { class: 'topic-notes-list', role: 'list' }, mine.map((note) => {
          const sr = el('span', { class: 'sr-only' }, `: ${note.title}`);
          return el('li', { class: 'topic-note' },
            el('p', { class: 'topic-note-title' }, icon('note', 14), el('span', {}, note.title)),
            el('p', { class: 'topic-note-preview' }, preview(note.content)),
            el('div', { class: 'topic-note-actions' },
              el('a', { class: 'btn btn-ghost btn-sm', href: href(['notes', note.id]) }, 'View', sr.cloneNode(true)),
              el('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'data-note-action': 'edit', 'data-id': note.id, 'data-focus-key': `edit:${note.id}` }, 'Edit', sr)));
        }))
        : el('p', { class: 'muted small topic-notes-empty' }, 'You haven’t taken any notes for this topic yet.'),
      mine.length ? el('p', { class: 'small topic-notes-all' }, el('a', { href: href(['notes'], { topic: topic.id, subject: topic.category }) }, 'See these in My notes')) : null);
  }

  section.addEventListener('click', (event) => {
    const action = event.target.closest('[data-note-action="edit"]');
    if (action) openNoteEditor({ noteId: action.dataset.id });
  });
  onNotesChange(draw);
  draw();
  return section;
}

// ---- Dashboard: recent notes ------------------------------------------------------------

/** Up to four recently updated notes; nothing when there are none. */
export function recentNotesSection() {
  const recent = notes.list().sort(notes.byUpdated).slice(0, 4);
  if (!recent.length) return null;
  return el('section', { class: 'section panel', 'aria-labelledby': 'notes-recent-title' },
    el('div', { class: 'section-head' }, el('h2', { id: 'notes-recent-title' }, 'Recent notes'),
      el('a', { class: 'small', href: '#/notes' }, 'View all notes')),
    el('ul', { class: 'mini-list', role: 'list' }, recent.map((note) => {
      const n = names(note);
      return el('li', {}, el('a', { class: 'mini-item', href: href(['notes', note.id]) },
        el('span', { class: 'mini-title' }, note.title),
        el('span', { class: 'mini-meta' }, `${n.topic?.title || 'Topic no longer available'} · updated ${timeAgo(note.updatedAt)}`)));
    })));
}
