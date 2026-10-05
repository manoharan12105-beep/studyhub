// Persistent chrome: sidebar navigation, mobile drawer, header search box.

import { el, debounce, icon } from '../util.js';
import { index, isAvailable } from '../content-loader.js';
import { href, navigate } from '../router.js';
import { search, KIND_LABELS } from '../search.js';
import { mapSupported, focusOnMap } from '../map-focus.js';
import * as progress from '../progress.js';

// ---- Sidebar -----------------------------------------------------------------

/**
 * Render the sidebar for the current route.
 * context: { categoryId, subId, topicId, modeId, path }
 */
export function renderSidebar(context) {
  const inner = document.getElementById('sidebar-inner');
  const scrollTop = inner.parentElement.scrollTop;

  const overview = el('ul', { class: 'nav-list' },
    navLink('#/', 'Dashboard', context.path === '/'),
    navLink('#/bookmarks', 'Bookmarks', context.path === '/bookmarks'),
    navLink('#/history', 'Recently studied', context.path === '/history'),
    navLink('#/lab', 'Interactive lab', context.path === '/lab'));

  const subjects = el('ul', { class: 'nav-list' }, index.categories.map((category) => {
    const available = isAvailable(category);
    const active = category.id === context.categoryId;
    const summary = progress.summarize(category.topics.map((t) => t.id));
    const link = el('a', {
      class: `nav-link nav-subject ${active ? 'is-active' : ''}`,
      href: href(['c', category.id]),
      'aria-current': active && !context.subId && !context.topicId && !context.modeId ? 'page' : null,
    }, el('span', {}, category.title),
    available
      ? el('span', { class: 'nav-count', title: `${summary.completed} of ${summary.total} completed` },
        `${summary.completed}/${summary.total}`, el('span', { class: 'sr-only' }, ' completed'))
      : el('span', { class: 'nav-soon' }, 'Soon'));
    return el('li', {}, link, active && available ? categoryTree(category, context) : null);
  }));

  inner.replaceChildren(
    el('p', { class: 'nav-heading' }, 'Overview'), overview,
    el('p', { class: 'nav-heading' }, 'Subjects'), subjects);
  inner.parentElement.scrollTop = scrollTop;

  // Bring the current topic into view inside the sidebar the first time.
  const current = inner.querySelector('[aria-current="page"]');
  if (current && !isInView(current, inner.parentElement)) current.scrollIntoView({ block: 'center' });
}

function isInView(node, container) {
  const a = node.getBoundingClientRect();
  const b = container.getBoundingClientRect();
  return a.top >= b.top && a.bottom <= b.bottom;
}

function navLink(target, label, active) {
  return el('li', {}, el('a', { class: `nav-link ${active ? 'is-active' : ''}`, href: target, 'aria-current': active ? 'page' : null }, label));
}

function categoryTree(category, context) {
  const modes = category.studyModes.map((mode) => navLink(href(['c', category.id, 'm', mode.id]), mode.title, context.modeId === mode.id));
  const modules = category.subcategories.filter((sub) => sub.topics.length).map((sub) => {
    const open = sub.id === context.subId;
    const summary = progress.summarize(sub.topics.map((t) => t.id));
    return el('li', {}, el('details', { class: 'nav-module', open },
      el('summary', {}, el('span', {}, sub.title), el('span', { class: 'nav-count' }, `${summary.completed}/${summary.total}`)),
      el('ul', { class: 'nav-topics' },
        el('li', {}, el('a', {
          class: `nav-link nav-overview ${context.subId === sub.id && !context.topicId ? 'is-active' : ''}`,
          href: href(['c', category.id, sub.id]),
          'aria-current': context.subId === sub.id && !context.topicId ? 'page' : null,
        }, 'Module overview')),
        sub.topics.map((topic) => {
          const status = progress.getStatus(topic.id);
          const active = topic.id === context.topicId;
          return el('li', {}, el('a', {
            class: `nav-link nav-topic ${active ? 'is-active' : ''}`,
            href: href(['t', topic.id]),
            'aria-current': active ? 'page' : null,
          }, el('span', { class: `nav-status nav-status-${status}`, 'aria-hidden': 'true' }),
          el('span', {}, topic.title),
          status !== 'not-started' ? el('span', { class: 'sr-only' }, ` (${progress.STATUS_LABELS[status]})`) : null));
        }))));
  });
  return el('ul', { class: 'nav-tree' }, modes.length ? modes : null, modules);
}

// ---- Mobile drawer -------------------------------------------------------------

export function initDrawer() {
  const button = document.getElementById('menu-btn');
  const scrim = document.getElementById('scrim');
  button.addEventListener('click', () => (document.body.classList.contains('nav-open') ? closeDrawer() : openDrawer()));
  scrim.addEventListener('click', () => closeDrawer());
  window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches) closeDrawer(false); });
}

function openDrawer() {
  document.body.classList.add('nav-open');
  document.getElementById('menu-btn').setAttribute('aria-expanded', 'true');
  document.getElementById('scrim').hidden = false;
  // Everything behind the drawer is inert, so focus can't wander out of it.
  document.getElementById('main').inert = true;
  document.getElementById('sidebar').querySelector('a, summary')?.focus();
}

export function closeDrawer(restoreFocus = true) {
  if (!document.body.classList.contains('nav-open')) return false;
  document.body.classList.remove('nav-open');
  document.getElementById('menu-btn').setAttribute('aria-expanded', 'false');
  document.getElementById('scrim').hidden = true;
  document.getElementById('main').inert = false;
  if (restoreFocus) document.getElementById('menu-btn').focus();
  return true;
}

// ---- Header search (combobox) -------------------------------------------------

export function initHeaderSearch() {
  const input = document.getElementById('search-input');
  const list = document.getElementById('search-results');
  let results = [];
  let active = -1;

  const update = debounce(() => {
    const query = input.value.trim();
    results = query ? search(query).slice(0, 8) : [];
    active = -1;
    render(query);
  }, 60);

  function render(query) {
    if (!query) return close();
    const withMap = mapSupported();
    const options = results.flatMap(({ entry }) => [
      el('li', { role: 'option', class: 'search-option', 'aria-selected': 'false', 'data-href': entry.href },
        el('span', { class: 'search-option-title' }, highlightMatch(entry.title, query)),
        el('span', { class: 'search-option-path' }, [KIND_LABELS[entry.kind], ...entry.path].join(' · '))),
      // Only subjects have a node on the dashboard map; other results stay as they are.
      withMap && entry.kind === 'subject' ? el('li', {
        role: 'option', class: 'search-option search-map', 'aria-selected': 'false', 'data-map': entry.categoryId,
      }, el('span', { class: 'search-option-title' }, icon('spark', 14), 'View in knowledge map'),
      el('span', { class: 'search-option-path' }, `Dashboard · ${entry.title}`)) : null,
    ].filter(Boolean));
    options.push(el('li', {
      role: 'option', class: 'search-option search-all', 'aria-selected': 'false',
      'data-href': href(['search'], { q: query }),
    }, results.length ? `See all results for “${query}”` : `No quick matches — search for “${query}”`));
    options.forEach((option, i) => { option.id = `sr-${i}`; });
    list.replaceChildren(...options);
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function close() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  }

  function setActive(i) {
    const options = [...list.children];
    if (!options.length) return;
    active = (i + options.length) % options.length;
    options.forEach((o, j) => o.setAttribute('aria-selected', String(j === active)));
    input.setAttribute('aria-activedescendant', options[active].id);
    options[active].scrollIntoView({ block: 'nearest' });
  }

  function choose(option) {
    close();
    input.value = '';
    input.blur();
    if (option.dataset.map) focusOnMap(option.dataset.map);
    else navigate(option.dataset.href);
  }

  input.addEventListener('input', update);
  input.addEventListener('focus', () => { if (input.value.trim()) update(); });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); if (list.hidden) update(); else setActive(active + 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); }
    else if (event.key === 'Enter') {
      event.preventDefault();
      const query = input.value.trim();
      if (!query) return;
      const option = active >= 0 ? list.children[active] : null;
      if (option) choose(option);
      else choose({ dataset: { href: href(['search'], { q: query }) } });
    } else if (event.key === 'Escape') {
      if (!list.hidden) { close(); event.stopPropagation(); } else { input.value = ''; input.blur(); }
    }
  });
  // mousedown (not click) so the input's blur doesn't close the list first.
  list.addEventListener('mousedown', (event) => {
    const option = event.target.closest('.search-option');
    if (option) { event.preventDefault(); choose(option); }
  });
  input.addEventListener('blur', () => setTimeout(close, 120));
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

