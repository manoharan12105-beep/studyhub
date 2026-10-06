// Small presentational components shared by the views.

import { el, icon, formatMinutes } from '../util.js';
import { href } from '../router.js';
import * as progress from '../progress.js';
import * as bookmarks from '../bookmarks.js';
import { getCategory } from '../content-loader.js';

export const DIFFICULTY_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

export function difficultyBadge(difficulty) {
  if (!difficulty) return null;
  return el('span', { class: `badge badge-${difficulty}` }, DIFFICULTY_LABELS[difficulty] || difficulty);
}

/** Status with text + shape, never colour alone. */
export function statusBadge(topicId) {
  const status = progress.getStatus(topicId);
  return el('span', { class: `status status-${status}` },
    el('span', { class: 'status-dot', 'aria-hidden': 'true' }), progress.STATUS_LABELS[status]);
}

export function progressBar(value, label) {
  return el('div', {
    class: 'progress-bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100,
    'aria-valuenow': value, 'aria-label': label,
  }, el('span', { style: `width:${value}%` }));
}

/**
 * Breadcrumb trail. On narrow screens CSS keeps it on one line: the first
 * crumb, an ellipsis for any skipped middle crumbs, and the parent (the
 * current page is the h1 right below).
 */
export function breadcrumbs(items) {
  const last = items.length - 1;
  const role = (i) => (i === last ? 'crumb-current' : i === last - 1 ? 'crumb-parent' : i === 0 ? 'crumb-first' : 'crumb-middle');
  const crumbs = items.map((item, i) => el('li', { class: role(i) },
    i === last || !item.href
      ? el('span', { 'aria-current': i === last ? 'page' : null }, item.label)
      : el('a', { href: item.href }, item.label)));
  if (items.length > 3) crumbs.splice(1, 0, el('li', { class: 'crumb-ellipsis', 'aria-hidden': 'true' }, '…'));
  return el('nav', { class: 'breadcrumbs', 'aria-label': 'Breadcrumb' }, el('ol', {}, crumbs));
}

/** Small subject icon from metadata (a single-colour SVG drawn in the text colour). */
export function subjectIcon(category, size = 'md') {
  const path = typeof category?.icon === 'string' && /^[\w./-]+\.svg$/.test(category.icon) && !category.icon.includes('..') ? category.icon : null;
  return path
    ? el('span', { class: `subject-icon subject-icon-${size}`, style: `--icon: url("${path}")`, 'aria-hidden': 'true' })
    : el('span', { class: `subject-icon-fallback subject-icon-${size}`, 'aria-hidden': 'true' }, icon('book', size === 'lg' ? 24 : 18));
}

export function pageHeader({ crumbs, title, eyebrow, lead, actions, meta }) {
  return el('header', { class: 'page-header' },
    crumbs ? breadcrumbs(crumbs) : null,
    eyebrow ? el('p', { class: 'eyebrow' }, eyebrow) : null,
    el('div', { class: 'page-title-row' },
      el('h1', { class: 'page-title', tabindex: -1 }, title),
      actions ? el('div', { class: 'page-actions' }, actions) : null),
    lead ? el('p', { class: 'lead' }, lead) : null,
    meta || null);
}

/** One row in a topic list (module pages, bookmarks, search results). */
export function topicRow(topic, { showContext = false, interactive = false } = {}) {
  const category = showContext ? getCategory(topic.category) : null;
  const sub = category?.subcategories.find((s) => s.id === topic.subcategory);
  return el('li', { class: 'topic-row' },
    el('a', { class: 'topic-link', href: href(['t', topic.id]) },
      el('span', { class: 'topic-row-main' },
        el('span', { class: 'topic-row-title' }, topic.title),
        showContext ? el('span', { class: 'topic-row-context' }, [category?.title, sub?.title].filter(Boolean).join(' → ')) : null,
        el('span', { class: 'topic-row-desc' }, topic.description)),
      el('span', { class: 'topic-row-meta' },
        statusBadge(topic.id),
        difficultyBadge(topic.difficulty),
        topic.estimatedMinutes ? el('span', { class: 'meta-item' }, icon('clock', 14), formatMinutes(topic.estimatedMinutes)) : null,
        interactive ? el('span', { class: 'badge badge-interactive' }, icon('spark', 12), 'Interactive') : null,
        bookmarks.has(topic.id) ? el('span', { class: 'meta-item bookmarked' }, icon('bookmark', 14), el('span', { class: 'sr-only' }, 'Bookmarked')) : null)));
}

export function errorState({ title, message, actions = [] }) {
  return el('section', { class: 'page error-page' },
    el('div', { class: 'empty-state' },
      el('h1', { class: 'page-title', tabindex: -1 }, title),
      el('p', {}, message),
      el('div', { class: 'empty-actions' }, actions.map((a) => el('a', { class: `btn ${a.primary ? 'btn-primary' : 'btn-secondary'}`, href: a.href }, a.label)))));
}

export function notice(message, tone = 'info') {
  return el('p', { class: `notice notice-${tone}`, role: tone === 'warning' ? 'alert' : 'status' }, message);
}

export function loading(label = 'Loading…') {
  return el('div', { class: 'loading', role: 'status' }, el('span', { class: 'spinner', 'aria-hidden': 'true' }), label);
}

export function emptyState(message, action) {
  return el('div', { class: 'empty-state small' }, el('p', {}, message),
    action ? el('a', { class: 'btn btn-secondary', href: action.href }, action.label) : null);
}
