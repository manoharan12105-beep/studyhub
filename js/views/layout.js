// Persistent chrome: sidebar navigation (desktop collapse + mobile drawer) and
// the header search box. The sidebar stops at subjects; modules and topics
// live on the subject pages.

import { el, debounce, icon } from '../util.js';
import { index, isAvailable, groupedCategories } from '../content-loader.js';
import { href, navigate } from '../router.js';
import { search, groupResults, loadInteractionEntries, KIND_LABELS } from '../search.js';
import { mapSupported, focusOnMap } from '../map-focus.js';
import { read, update } from '../storage.js';
import * as progress from '../progress.js';
import * as engine from '../study-engine.js';
import { openUpdates } from './menu.js';
import { subjectIcon } from './common.js';

const PREFS = 'prefs';
const DESKTOP = window.matchMedia('(min-width: 768px)');

// ---- Sidebar -----------------------------------------------------------------

/**
 * Render the sidebar for the current route.
 * context: { categoryId, subId, topicId, modeId, path }
 */
export function renderSidebar(context) {
  const inner = document.getElementById('sidebar-inner');
  const scrollTop = inner.scrollTop;
  const resume = continueTarget();

  const study = el('ul', { class: 'nav-list', 'aria-labelledby': 'nav-h-study' },
    navLink({ target: '#/', label: 'Dashboard', iconName: 'home', active: context.path === '/' }),
    navLink({ target: resume.href, label: 'Continue learning', iconName: 'resume', hint: resume.hint }),
    navLink({ target: '#/lab', label: 'Interactive lab', iconName: 'flask', active: context.path === '/lab' }));

  const library = groupedCategories().map(({ group, categories }) => {
    const headingId = `nav-g-${group.id}`;
    return el('div', { class: 'nav-group' },
      el('p', { class: 'nav-group-label', id: headingId }, group.title),
      el('ul', { class: 'nav-list', 'aria-labelledby': headingId }, categories.map((c) => subjectLink(c, context))));
  });

  inner.replaceChildren(
    el('p', { class: 'nav-heading', id: 'nav-h-study' }, 'Study'), study,
    el('p', { class: 'nav-heading', id: 'nav-h-library' }, 'Library'),
    el('div', { role: 'group', 'aria-labelledby': 'nav-h-library' }, library));
  inner.scrollTop = scrollTop;
}

/** Where "Continue learning" goes: the study engine's answer, else the first topic. */
function continueTarget() {
  const next = engine.continueLearning();
  if (next) {
    const target = next.tab && next.tab !== 'lesson' ? href(['t', next.topic.id, next.tab]) : href(['t', next.topic.id]);
    return { href: target, hint: next.topic.title };
  }
  const first = index.categories.find(isAvailable)?.topics[0];
  return first ? { href: href(['t', first.id]), hint: `Start with ${first.title}` } : { href: '#/', hint: '' };
}

function navLink({ target, label, iconName, active = false, hint = '' }) {
  return el('li', {}, el('a', {
    class: `nav-link ${active ? 'is-active' : ''}`, href: target, 'aria-current': active ? 'page' : null,
    'data-tooltip': hint ? `${label} · ${hint}` : label,
  }, el('span', { class: 'nav-icon' }, icon(iconName, 18)), el('span', { class: 'nav-label' }, label)));
}

function subjectLink(category, context) {
  const available = isAvailable(category);
  const active = category.id === context.categoryId;
  const exact = active && !context.subId && !context.topicId && !context.modeId;
  const s = engine.stats(category.topics);
  const countText = `${s.completed}/${s.total}`;
  const srCount = el('span', { class: 'sr-only' }, ` — ${s.completed} of ${s.total} topics completed`);

  let detail;
  if (!available) detail = el('span', { class: 'nav-soon' }, category.error ? 'Unavailable' : 'Coming soon');
  else if (active) {
    // Only the current subject gets the fuller treatment: count line and meter.
    detail = el('span', { class: 'nav-progress' },
      el('span', { class: 'nav-progress-text', 'aria-hidden': 'true' }, `${s.completed} / ${s.total} completed`),
      el('span', { class: 'nav-meter', 'aria-hidden': 'true' }, el('span', { style: `width:${s.percent}%` })));
  } else detail = el('span', { class: 'nav-count', 'aria-hidden': 'true' }, countText);

  return el('li', {}, el('a', {
    class: `nav-link nav-subject ${active ? 'is-active' : ''} ${available ? '' : 'is-soon'}`,
    href: href(['c', category.id]),
    'aria-current': exact ? 'page' : active ? 'true' : null,
    'data-tooltip': available ? `${category.title} · ${countText}` : `${category.title} · Coming soon`,
  }, el('span', { class: 'nav-icon' }, subjectIcon(category)),
  el('span', { class: 'nav-label' }, el('span', { class: 'nav-title' }, category.title), active && available ? detail : null, available ? srCount : null),
  active && available ? null : el('span', { class: 'nav-aside' }, detail)));
}

// ---- Desktop collapse ------------------------------------------------------------

export function isCollapsed() {
  return document.documentElement.getAttribute('data-sidebar') === 'collapsed';
}

function setCollapsed(collapsed) {
  if (collapsed) document.documentElement.setAttribute('data-sidebar', 'collapsed');
  else document.documentElement.removeAttribute('data-sidebar');
  update(PREFS, {}, (prefs) => ({ ...(prefs && typeof prefs === 'object' ? prefs : {}), sidebarCollapsed: collapsed }));
  syncToggle();
  hideTooltip();
}

function syncToggle() {
  const toggle = document.getElementById('sidebar-toggle');
  const collapsed = isCollapsed();
  toggle.setAttribute('aria-expanded', String(!collapsed));
  toggle.querySelector('.nav-label').textContent = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  toggle.dataset.tooltip = 'Expand sidebar';
}

export function initSidebar() {
  // Storage may hold the preference even if the inline script could not apply it.
  if (read(PREFS, {})?.sidebarCollapsed === true) document.documentElement.setAttribute('data-sidebar', 'collapsed');
  const toggle = document.getElementById('sidebar-toggle');
  toggle.addEventListener('click', () => setCollapsed(!isCollapsed()));
  syncToggle();
  initTooltips();
  initDrawer();
}

// Collapsed rail: labels are visually hidden (still read by screen readers),
// so hover/focus shows the label in one fixed tooltip outside the scroll area.
function initTooltips() {
  const sidebar = document.getElementById('sidebar');
  const show = (event) => {
    const target = event.target.closest('[data-tooltip]');
    if (!target || !isCollapsed() || !DESKTOP.matches) return;
    const tip = document.getElementById('nav-tooltip');
    const rect = target.getBoundingClientRect();
    tip.textContent = target.dataset.tooltip;
    tip.style.top = `${rect.top + rect.height / 2}px`;
    tip.style.left = `${rect.right + 8}px`;
    tip.hidden = false;
  };
  sidebar.addEventListener('mouseover', show);
  sidebar.addEventListener('focusin', show);
  sidebar.addEventListener('mouseleave', hideTooltip);
  sidebar.addEventListener('focusout', hideTooltip);
  document.getElementById('sidebar-inner').addEventListener('scroll', hideTooltip, { passive: true });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') hideTooltip(); });
}

function hideTooltip() {
  document.getElementById('nav-tooltip').hidden = true;
}

// ---- Mobile drawer -------------------------------------------------------------

function initDrawer() {
  const button = document.getElementById('menu-btn');
  const scrim = document.getElementById('scrim');
  button.addEventListener('click', () => (document.body.classList.contains('nav-open') ? closeDrawer() : openDrawer()));
  scrim.addEventListener('click', () => closeDrawer());
  // Choosing a destination closes the drawer, even when it is the current page.
  document.getElementById('sidebar').addEventListener('click', (event) => {
    if (event.target.closest('a[href]')) closeDrawer(false);
  });
  DESKTOP.addEventListener('change', (e) => { if (e.matches) closeDrawer(false); else hideTooltip(); });
}

// While the drawer is open everything else except the button that closes it is
// inert, so Tab cycles between the drawer and that button.
function behindDrawer() {
  return [document.getElementById('main'), document.getElementById('search'), document.getElementById('app-menu'), document.querySelector('.brand')];
}

function openDrawer() {
  document.body.classList.add('nav-open');
  document.getElementById('menu-btn').setAttribute('aria-expanded', 'true');
  document.getElementById('scrim').hidden = false;
  for (const node of behindDrawer()) node.inert = true;
  document.getElementById('sidebar').querySelector('a')?.focus();
}

export function closeDrawer(restoreFocus = true) {
  if (!document.body.classList.contains('nav-open')) return false;
  document.body.classList.remove('nav-open');
  document.getElementById('menu-btn').setAttribute('aria-expanded', 'false');
  document.getElementById('scrim').hidden = true;
  for (const node of behindDrawer()) node.inert = false;
  if (restoreFocus) document.getElementById('menu-btn').focus();
  return true;
}

// ---- Header search (combobox) -------------------------------------------------

const GROUP_LIMIT = { subjects: 3, topics: 5, revision: 3, practice: 2, interview: 2, interactive: 2 };

export function initHeaderSearch() {
  const input = document.getElementById('search-input');
  const list = document.getElementById('search-results');
  let active = -1;

  loadInteractionEntries().catch((error) => console.warn('Interactions not searchable:', error));

  const update = debounce(() => {
    const query = input.value.trim();
    active = -1;
    if (query) renderResults(query);
    // A late update (e.g. Esc clearing the box) must not close quick actions that Ctrl+K just opened.
    else if (!list.querySelector('#sg-actions')) close();
  }, 60);

  function option(attrs, title, path, kind) {
    return el('li', { role: 'option', class: 'search-option', 'aria-selected': 'false', ...attrs },
      kind ? el('span', { class: `search-kind search-kind-${kind}` }, KIND_LABELS[kind] || kind) : null,
      el('span', { class: 'search-option-text' },
        el('span', { class: 'search-option-title' }, title),
        path ? el('span', { class: 'search-option-path' }, path) : null));
  }

  function section(id, label, options) {
    return el('li', { role: 'presentation', class: 'search-group' },
      el('p', { class: 'search-group-label', id: `sg-${id}`, role: 'presentation' }, label),
      el('ul', { role: 'group', 'aria-labelledby': `sg-${id}` }, options));
  }

  function renderResults(query) {
    const withMap = mapSupported();
    const groups = groupResults(search(query));
    const sections = groups.map((group) => section(group.id, group.label,
      group.results.slice(0, GROUP_LIMIT[group.id] || 3).flatMap(({ entry }) => [
        option({ 'data-href': entry.href }, highlightMatch(entry.title, query), entry.path.join(' · '), entry.kind),
        // Only subjects have a node on the dashboard map; other results stay as they are.
        withMap && entry.kind === 'subject'
          ? option({ class: 'search-option search-map', 'data-map': entry.categoryId }, [icon('spark', 14), 'View in knowledge map'], `Dashboard · ${entry.title}`)
          : null,
      ])));
    const total = groups.reduce((sum, g) => sum + g.results.length, 0);
    sections.push(el('li', { role: 'presentation' }, el('ul', { role: 'group', 'aria-label': 'All results' },
      option({ class: 'search-option search-all', 'data-href': href(['search'], { q: query }) },
        total ? `See all ${total} results for “${query}”` : `No quick matches — search for “${query}”`))));
    show(sections);
  }

  /** Ctrl/⌘+K on an empty box: quick actions instead of results. */
  function renderActions() {
    const resume = continueTarget();
    const actions = [
      option({ 'data-href': resume.href }, 'Continue learning', resume.hint),
      option({ 'data-href': href([], { s: 'quick-revision' }) }, 'Quick revision', 'Dashboard · revision sheets for every subject'),
      option({ 'data-href': '#/bookmarks' }, 'Bookmarks'),
      option({ 'data-href': '#/history' }, 'Recently studied'),
      option({ 'data-action': 'updates' }, "What's new"),
    ];
    const subjects = index.categories.filter(isAvailable).map((c) => option({ 'data-href': href(['c', c.id]) }, c.title, 'Open subject'));
    show([section('actions', 'Quick actions', actions), section('open', 'Subjects', subjects)]);
  }

  function show(sections) {
    list.replaceChildren(...sections);
    options().forEach((o, i) => { o.id = `sr-${i}`; });
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function options() {
    return [...list.querySelectorAll('[role="option"]')];
  }

  function close() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  }

  function setActive(i) {
    const all = options();
    if (!all.length) return;
    active = (i + all.length) % all.length;
    all.forEach((o, j) => o.setAttribute('aria-selected', String(j === active)));
    input.setAttribute('aria-activedescendant', all[active].id);
    all[active].scrollIntoView({ block: 'nearest' });
  }

  function choose(chosen) {
    close();
    input.value = '';
    input.blur();
    if (chosen.dataset.map) focusOnMap(chosen.dataset.map);
    else if (chosen.dataset.action === 'updates') openUpdates();
    else navigate(chosen.dataset.href);
  }

  input.addEventListener('input', update);
  input.addEventListener('focus', () => { if (input.value.trim()) update(); });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (list.hidden) { if (input.value.trim()) update(); else renderActions(); } else setActive(active + 1);
    } else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); }
    else if (event.key === 'Enter') {
      event.preventDefault();
      const chosen = active >= 0 ? options()[active] : null;
      const query = input.value.trim();
      if (chosen) choose(chosen);
      else if (query) choose({ dataset: { href: href(['search'], { q: query }) } });
    } else if (event.key === 'Escape') {
      if (!list.hidden) { close(); event.stopPropagation(); } else { input.value = ''; input.blur(); }
    }
  });
  // mousedown (not click) so the input's blur doesn't close the list first.
  list.addEventListener('mousedown', (event) => {
    const chosen = event.target.closest('.search-option');
    if (chosen) { event.preventDefault(); choose(chosen); }
  });
  // Skip the close if focus came back meanwhile (e.g. Ctrl+K right after leaving the box).
  input.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== input) close(); }, 120));

  return {
    /** Focus the box; with nothing typed, open the quick actions. */
    openPalette() {
      input.focus();
      if (!input.value.trim()) renderActions();
      else update();
    },
  };
}

/** Wrap matched query words in <mark>. Built from text nodes, so it is injection-safe. */
export function highlightMatch(text, query) {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  if (!terms.length) return text;
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
  const span = document.createElement('span');
  for (const part of String(text).split(pattern)) {
    if (!part) continue;
    span.append(pattern.test(part) ? el('mark', {}, part) : document.createTextNode(part));
    pattern.lastIndex = 0;
  }
  return span;
}
