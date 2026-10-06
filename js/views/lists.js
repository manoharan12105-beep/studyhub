// Search results, bookmarks, history and the interactive lab.

import { el, debounce, timeAgo, icon } from '../util.js';
import { mapSupported, focusOnMap } from '../map-focus.js';
import { index, isAvailable, getTopic, getCategory, loadInteractions } from '../content-loader.js';
import { href } from '../router.js';
import { search, groupResults, loadInteractionEntries, GROUPS, KIND_LABELS } from '../search.js';
import * as engine from '../study-engine.js';
import { remove } from '../storage.js';
import { createShell, mountInto, typeLabel } from '../engagement/registry.js';
import { pageHeader, topicRow, emptyState, DIFFICULTY_LABELS, difficultyBadge, statusBadge } from './common.js';
import { highlightMatch } from './layout.js';
import { updateCard } from './menu.js';
import * as updates from '../updates.js';

// ---- Search ------------------------------------------------------------------------

const PER_GROUP = 8;

export function renderSearch(main, { query }) {
  const input = el('input', { type: 'search', class: 'input input-lg', value: query.get('q') || '', 'aria-label': 'Search', placeholder: 'Search topics, modules, tags…', autocomplete: 'off' });
  const subject = el('select', { class: 'select', 'aria-label': 'Subject' }, el('option', { value: '' }, 'All subjects'),
    index.categories.filter(isAvailable).map((c) => el('option', { value: c.id }, c.title)));
  const type = el('select', { class: 'select', 'aria-label': 'Result type' }, el('option', { value: '' }, 'All types'),
    GROUPS.map((g) => el('option', { value: g.id }, g.label)));
  const difficulty = el('select', { class: 'select', 'aria-label': 'Difficulty' }, el('option', { value: '' }, 'Any difficulty'),
    Object.entries(DIFFICULTY_LABELS).map(([v, l]) => el('option', { value: v }, l)));
  subject.value = query.get('subject') || '';
  type.value = query.get('type') || '';
  difficulty.value = query.get('difficulty') || '';
  const count = el('p', { class: 'muted small', 'aria-live': 'polite' });
  const results = el('div', { class: 'search-groups' });

  function run() {
    const q = input.value.trim();
    // Keep the URL shareable without triggering a re-render (replaceState fires no hashchange).
    window.history.replaceState(null, '', href(['search'], { q, subject: subject.value, type: type.value, difficulty: difficulty.value }));
    if (!q) {
      results.replaceChildren();
      count.textContent = 'Type to search across every subject.';
      return;
    }
    const kinds = GROUPS.find((g) => g.id === type.value)?.kinds || null;
    const found = search(q, { categoryId: subject.value || null, difficulty: difficulty.value || null, kinds });
    count.textContent = `${found.length} result${found.length === 1 ? '' : 's'} for “${q}”`;
    if (!found.length) {
      results.replaceChildren(emptyState(
        subject.value || type.value || difficulty.value ? 'No matches with these filters. Try “All subjects”, “All types” and “Any difficulty”.' : 'No matches. Try a shorter word or a related term (for example “join”, “heap”, “percent”).'));
      return;
    }
    // One group: show up to 80 results. All types: a few per group, each expandable.
    results.replaceChildren(...groupResults(found).map((group) => {
      const limit = type.value ? 80 : PER_GROUP;
      const more = group.results.length - limit;
      const showAll = more > 0 ? el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, `Show all ${group.results.length} ${group.label.toLowerCase()}`) : null;
      showAll?.addEventListener('click', () => { type.value = group.id; run(); results.querySelector('h2')?.focus(); });
      return el('section', { class: 'search-group-section', 'aria-labelledby': `rg-${group.id}` },
        el('h2', { class: 'search-group-title', id: `rg-${group.id}`, tabindex: -1 }, group.label, el('span', { class: 'muted' }, ` ${group.results.length}`)),
        el('ul', { class: 'result-list', role: 'list' }, group.results.slice(0, limit).map(({ entry }) => resultRow(entry, q))),
        showAll);
    }));
  }
  const debounced = debounce(run, 80);
  input.addEventListener('input', debounced);
  for (const select of [subject, type, difficulty]) select.addEventListener('change', run);

  main.replaceChildren(el('div', { class: 'page' },
    pageHeader({ crumbs: [{ label: 'Dashboard', href: '#/' }, { label: 'Search' }], title: 'Search' }),
    el('div', { class: 'search-page-bar' }, input, subject, type, difficulty),
    count, results));
  run();
  // Interactive results join once their registries have loaded (instant when cached).
  loadInteractionEntries().then(() => { if (document.body.contains(results)) run(); }).catch(() => {});
  return { title: 'Search', focus: input };
}

function resultRow(entry, q) {
  const withMap = mapSupported();
  return el('li', { class: 'result' },
    el('a', { class: 'result-link', href: entry.href },
      el('span', { class: 'result-path' }, el('span', { class: `search-kind search-kind-${entry.kind}` }, KIND_LABELS[entry.kind]), entry.path.join(' → ')),
      el('span', { class: 'result-title' }, highlightMatch(entry.title, q)),
      entry.kind === 'topic' ? el('span', { class: 'result-desc' }, entry.topic.description) : null,
      entry.kind === 'topic' ? el('span', { class: 'topic-row-meta' }, statusBadge(entry.topic.id), difficultyBadge(entry.topic.difficulty)) : null),
    // Subjects are the nodes of the dashboard map; nothing else gets this action.
    withMap && entry.kind === 'subject' ? el('button', {
      type: 'button', class: 'btn btn-ghost btn-sm result-map',
      onClick: () => focusOnMap(entry.categoryId),
    }, icon('spark', 14), 'View in knowledge map', el('span', { class: 'sr-only' }, ` (${entry.title})`)) : null);
}

// ---- Bookmarks ---------------------------------------------------------------------

export function renderBookmarks(main) {
  const topics = engine.bookmarkedTopics();
  main.replaceChildren(el('div', { class: 'page' },
    pageHeader({ crumbs: [{ label: 'Dashboard', href: '#/' }, { label: 'Bookmarks' }], title: 'Bookmarks', lead: 'Topics you saved for later, newest first.' }),
    topics.length
      ? el('ul', { class: 'topic-list', role: 'list' }, topics.map((t) => topicRow(t, { showContext: true })))
      : emptyState('No bookmarks yet. Open a topic and press “Bookmark”.', { label: 'Browse subjects', href: '#/' })));
  return { title: 'Bookmarks' };
}

// ---- History -----------------------------------------------------------------------

export function renderHistory(main) {
  const entries = engine.recentActivity(40);
  const clear = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Clear history');
  clear.addEventListener('click', () => {
    if (!window.confirm('Clear your recently-studied list? Progress and bookmarks are kept.')) return;
    remove('history');
    renderHistory(main);
  });
  const rows = entries.map(({ entry, topic }) => {
    if (entry.kind === 'topic') {
      const { category } = engine.topicContext(topic);
      return item(href(entry.tab ? ['t', topic.id, entry.tab] : ['t', topic.id]), topic.title, `${category?.title || ''}${entry.tab ? ` · ${entry.tab.replace('-', ' ')}` : ''}`, entry.at);
    }
    if (entry.kind === 'mode') {
      const [categoryId, modeId] = entry.id.split('/');
      const category = getCategory(categoryId);
      const mode = category?.studyModes.find((m) => m.id === modeId);
      return mode ? item(href(['c', categoryId, 'm', modeId]), mode.title, category.title, entry.at) : null;
    }
    if (entry.kind === 'session') return item(`#/session/${entry.id}`, entry.label || 'Session', 'Practice session', entry.at);
    return null;
  }).filter(Boolean);

  main.replaceChildren(el('div', { class: 'page' },
    pageHeader({ crumbs: [{ label: 'Dashboard', href: '#/' }, { label: 'Recently studied' }], title: 'Recently studied', actions: rows.length ? clear : null }),
    rows.length ? el('ul', { class: 'mini-list history-list', role: 'list' }, rows) : emptyState('Nothing yet — open a topic to start.', { label: 'Browse subjects', href: '#/' })));
  return { title: 'Recently studied' };

  function item(target, title, context, at) {
    return el('li', {}, el('a', { class: 'mini-item', href: target },
      el('span', { class: 'mini-title' }, title), el('span', { class: 'mini-meta' }, `${context} · ${timeAgo(at)}`)));
  }
}

// ---- Interactive lab ---------------------------------------------------------------

export async function renderLab(main, { isCurrent }) {
  const categories = index.categories.filter((c) => c.interactions);
  const registries = await Promise.all(categories.map((c) => loadInteractions(c.id)));
  if (!isCurrent()) return null;
  const stage = el('div', { class: 'lab-stage' });

  const groups = categories.map((category, i) => {
    const { interactions, error } = registries[i];
    if (!interactions.length && !error) return null;
    return el('section', { class: 'section' },
      el('h2', {}, category.title),
      error ? el('p', { class: 'notice notice-warning' }, error) : null,
      el('ul', { class: 'lab-list', role: 'list' }, interactions.map((interaction) => {
        const topics = (interaction.topics || []).map((p) => getTopic(p.topic)).filter(Boolean);
        const tryBtn = el('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, 'Try it here');
        tryBtn.addEventListener('click', () => {
          const { shell, body } = createShell(interaction, { headingLevel: 2 });
          stage.replaceChildren(shell);
          mountInto(body, interaction, { options: interaction.topics?.[0]?.options || {}, topic: topics[0] || null });
          shell.scrollIntoView({ block: 'start' });
          shell.querySelector('.interaction-title').setAttribute('tabindex', '-1');
          shell.querySelector('.interaction-title').focus({ preventScroll: true });
        });
        return el('li', { class: 'lab-item' },
          el('span', { class: 'interaction-badge' }, typeLabel(interaction.type)),
          el('p', { class: 'lab-title' }, interaction.title),
          interaction.description ? el('p', { class: 'muted small' }, interaction.description) : null,
          el('div', { class: 'lab-actions' }, tryBtn,
            topics.slice(0, 3).map((t) => el('a', { class: 'chip-link', href: href(['t', t.id], { s: `try-${interaction.id}` }) }, `In lesson: ${t.title}`)),
            topics.length > 3 ? el('span', { class: 'muted small' }, `+${topics.length - 3} more`) : null));
      })));
  }).filter(Boolean);

  main.replaceChildren(el('div', { class: 'page lab-page' },
    pageHeader({
      crumbs: [{ label: 'Dashboard', href: '#/' }, { label: 'Interactive lab' }],
      title: 'Interactive lab',
      lead: 'Every visualizer, simulation and knowledge check in one place. Each also appears inside its lesson, right after the section it explains.',
    }),
    stage,
    groups.length ? groups : emptyState('No interactions are registered yet.')));
  return { title: 'Interactive lab' };
}

// ---- Update history ----------------------------------------------------------------

export function renderUpdates(main) {
  const all = updates.all();
  const fresh = new Set(updates.unseen().map((u) => u.id));
  main.replaceChildren(el('div', { class: 'page updates-page' },
    pageHeader({
      crumbs: [{ label: 'Dashboard', href: '#/' }, { label: "What's new" }],
      title: "What's new",
      lead: 'Everything added to StudyHub, newest first. New content arrives with each update of the site — there is nothing to install or refresh.',
    }),
    all.length
      ? el('ol', { class: 'update-list update-history', role: 'list' }, all.map((u) => {
        const card = updateCard(u, { headingLevel: 2 });
        if (fresh.has(u.id)) card.querySelector('.update-meta').append(el('span', { class: 'badge badge-new' }, 'New'));
        return card;
      }))
      : emptyState('No updates have been published yet.')));
  updates.markAllSeen();
  return { title: "What's new" };
}
