// Subject (category) page and module (subcategory) page.

import { el, icon, formatMinutes, timeAgo } from '../util.js';
import {
  index, getCategory, getSubcategory, isAvailable, ungroupedTopics, interactiveTopicIds, loadInteractions,
} from '../content-loader.js';
import { href } from '../router.js';
import * as engine from '../study-engine.js';
import { getStatus } from '../progress.js';
import {
  pageHeader, progressBar, topicRow, errorState, notice, subjectIcon, DIFFICULTY_LABELS,
} from './common.js';

function totalMinutes(topics) {
  return topics.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
}

/** "Learn · Revision · Quick Revision" switcher shared by subject and mode pages. */
export function modeTabs(category, activeModeId = null) {
  if (!category.studyModes.length) return null;
  const tab = (label, target, active) => el('li', {}, el('a', { class: `mode-tab ${active ? 'is-active' : ''}`, href: target, 'aria-current': active ? 'page' : null }, label));
  return el('nav', { class: 'mode-tabs', 'aria-label': `${category.title} study modes` },
    el('ul', {}, tab('Learn', href(['c', category.id]), !activeModeId),
      category.studyModes.map((m) => tab(m.title, href(['c', category.id, 'm', m.id]), m.id === activeModeId))));
}

const has = (file) => (topic) => topic.files.includes(file);

/** Buttons that start focused sessions for a scope (module or subject). */
export function sessionButtons(topics, scope) {
  const practice = topics.filter(has('practice.md')).length;
  const interview = topics.filter(has('interview-questions.md')).length;
  const buttons = [];
  if (practice) buttons.push(el('a', { class: 'btn btn-secondary btn-sm', href: href(['session', 'practice', ...scope]) }, `Practice · ${practice} topic${practice === 1 ? '' : 's'}`));
  if (interview) {
    buttons.push(el('a', { class: 'btn btn-secondary btn-sm', href: href(['session', 'interview', ...scope]) }, `Interview · ${interview} topic${interview === 1 ? '' : 's'}`));
    buttons.push(el('a', { class: 'btn btn-ghost btn-sm', href: href(['session', 'flashcards', ...scope]) }, 'Flashcards'));
  }
  return buttons;
}

export async function renderSubject(main, { categoryId }) {
  const category = getCategory(categoryId);
  if (!category) {
    main.replaceChildren(errorState({
      title: 'Subject not found',
      message: `There is no subject with the id “${categoryId}”.`,
      actions: [{ label: 'Back to dashboard', href: '#/', primary: true }],
    }));
    return { title: 'Subject not found' };
  }

  if (!isAvailable(category)) {
    main.replaceChildren(el('div', { class: 'page' },
      pageHeader({ crumbs: [{ label: 'Dashboard', href: '#/' }, { label: category.title }], title: category.title, lead: category.description }),
      category.error ? notice(`The topic list could not be loaded: ${category.error}`, 'warning') : null,
      el('div', { class: 'empty-state coming-soon' },
        el('span', { class: 'badge badge-soon' }, 'Coming soon'),
        el('p', {}, 'Lessons for this subject have not been published yet. When they are, they will appear here with interactive exercises, practice and revision.'),
        el('a', { class: 'btn btn-secondary', href: '#/' }, 'Back to dashboard'))));
    return { title: category.title };
  }

  const s = engine.stats(category.topics);
  const resume = engine.resumeInCategory(category.id);
  const [interactive, registry] = await Promise.all([interactiveTopicIds(category.id), loadInteractions(category.id)]);
  const modules = category.subcategories.filter((sub) => sub.topics.length);
  const loose = ungroupedTopics(category);
  const group = index.groups.find((g) => g.id === category.group);

  main.replaceChildren(el('div', { class: 'page subject-page' },
    pageHeader({
      crumbs: [{ label: 'Dashboard', href: '#/' }, { label: category.title }],
      eyebrow: group ? group.title : null,
      title: category.title,
      lead: category.description,
    }),
    el('section', { class: 'subject-summary', 'aria-label': `${category.title} at a glance` },
      el('div', { class: 'subject-summary-main' },
        subjectIcon(category, 'lg'),
        el('dl', { class: 'fact-row' },
          fact(category.topics.length, 'topics'),
          fact(modules.length, 'modules'),
          registry.interactions.length ? fact(registry.interactions.length, 'interactive exercises') : null,
          fact(formatMinutes(totalMinutes(category.topics)), 'of lessons'))),
      el('div', { class: 'subject-progress' },
        el('div', { class: 'progress-row' },
          el('span', {}, el('strong', {}, `${s.completed}`), ` of ${s.total} completed`,
            s.inProgress ? el('span', { class: 'muted' }, ` · ${s.inProgress} in progress`) : null),
          el('span', { class: 'muted' }, `${s.percent}%`)),
        progressBar(s.percent, `${category.title} progress`)),
      resume
        ? el('div', { class: 'subject-resume' },
          el('p', { class: 'small' },
            el('span', { class: 'muted' }, resume.reason === 'start' ? 'Start with ' : resume.reason === 'next' ? 'Up next: ' : 'Continue: '),
            el('strong', {}, resume.topic.title)),
          el('a', { class: 'btn btn-primary', href: resume.tab && resume.tab !== 'lesson' ? href(['t', resume.topic.id, resume.tab]) : href(['t', resume.topic.id]) },
            resume.reason === 'start' ? 'Start learning' : 'Continue learning', icon('arrowRight', 16)))
        : el('p', { class: 'subject-resume finish-done' }, icon('check', 18), 'Every topic in this subject is complete.')),
    quickActions(category),
    recentInSubject(category),
    el('section', { class: 'section', 'aria-labelledby': 'modules-title' },
      el('div', { class: 'section-head' }, el('h2', { id: 'modules-title' }, 'Modules'),
        el('p', { class: 'muted small' }, 'Work through them in order, or jump to what you need.')),
      el('ol', { class: 'module-list', role: 'list' }, modules.map((sub, i) => moduleRow(category, sub, i + 1, interactive)))),
    loose.length ? el('section', { class: 'section' }, el('h2', {}, 'Other topics'),
      el('ul', { class: 'topic-list', role: 'list' }, loose.map((t) => topicRow(t, { interactive: interactive.has(t.id) })))) : null,
    testYourselfSection(category, modules)));
  return { title: category.title };
}

function fact(value, label) {
  return el('div', { class: 'fact' }, el('dt', {}, label), el('dd', {}, String(value)));
}

/** Revision modes and whole-subject sessions, with their real time estimates. */
function quickActions(category) {
  const practice = category.topics.filter(has('practice.md')).length;
  const interview = category.topics.filter(has('interview-questions.md')).length;
  const session = (kind) => href(['session', kind, 'subject', category.id]);
  const topicsMeta = (n) => `${n} topic${n === 1 ? '' : 's'}`;
  const tiles = [
    ...category.studyModes.map((mode) => actionTile(href(['c', category.id, 'm', mode.id]), 'revision', 'Revision', mode.title,
      mode.estimatedMinutes ? `~${formatMinutes(mode.estimatedMinutes)}` : null)),
    practice ? actionTile(session('practice'), 'check', 'Session', 'Practice', topicsMeta(practice)) : null,
    interview ? actionTile(session('interview'), 'book', 'Session', 'Interview questions', topicsMeta(interview)) : null,
    interview ? actionTile(session('flashcards'), 'spark', 'Session', 'Flashcards', topicsMeta(interview)) : null,
  ].filter(Boolean);
  if (!tiles.length) return null;
  return el('section', { class: 'quick-actions', 'aria-labelledby': 'qa-title' },
    el('h2', { class: 'quick-actions-title', id: 'qa-title' }, 'Revise and test yourself'),
    el('div', { class: 'quick-actions-row' }, tiles));
}

function actionTile(link, iconName, kind, title, meta) {
  return el('a', { class: 'action-tile', href: link },
    el('span', { class: 'action-kind' }, icon(iconName, 14), kind),
    el('span', { class: 'action-title' }, title),
    meta ? el('span', { class: 'action-meta' }, meta) : null);
}

function recentInSubject(category) {
  const recent = engine.recentInCategory(category.id, 3);
  if (!recent.length) return null;
  return el('section', { class: 'recent-strip', 'aria-labelledby': 'recent-sub-title' },
    el('h2', { class: 'recent-strip-title', id: 'recent-sub-title' }, 'Recently studied'),
    el('ul', { role: 'list' }, recent.map(({ entry, topic }) => el('li', {},
      el('a', { href: entry.tab ? href(['t', topic.id, entry.tab]) : href(['t', topic.id]) }, icon('arrowRight', 14), topic.title),
      el('span', { class: 'muted small' }, ` · ${timeAgo(entry.at)}`)))));
}

function moduleRow(category, sub, number, interactive) {
  const s = engine.stats(sub.topics);
  const count = sub.topics.filter((t) => interactive.has(t.id)).length;
  const done = s.total > 0 && s.completed === s.total;
  return el('li', {}, el('a', { class: `module-row ${done ? 'is-done' : ''}`, href: href(['c', category.id, sub.id]) },
    el('span', { class: 'module-num', 'aria-hidden': 'true' }, String(number).padStart(2, '0')),
    el('span', { class: 'module-main' },
      el('span', { class: 'module-title' }, el('span', { class: 'sr-only' }, `Module ${number}: `), sub.title),
      sub.description ? el('span', { class: 'module-desc' }, sub.description) : null,
      el('span', { class: 'module-meta' }, `${sub.topics.length} topic${sub.topics.length === 1 ? '' : 's'} · ${formatMinutes(totalMinutes(sub.topics))}`,
        count ? el('span', { class: 'badge badge-interactive' }, icon('spark', 12), `${count} interactive`) : null)),
    el('span', { class: 'module-progress' },
      done
        ? el('span', { class: 'status status-completed' }, el('span', { class: 'status-dot', 'aria-hidden': 'true' }), 'Completed')
        : el('span', { class: 'small muted' }, `${s.completed}/${s.total}`, el('span', { class: 'sr-only' }, ' completed')),
      progressBar(s.percent, `${sub.title} progress`))));
}

function testYourselfSection(category, modules) {
  const rows = modules.map((sub) => ({ sub, buttons: sessionButtons(sub.topics, ['module', category.id, sub.id]) }))
    .filter((r) => r.buttons.length);
  if (!rows.length) return null;
  return el('section', { class: 'section', 'aria-labelledby': 'test-title' },
    el('div', { class: 'section-head' }, el('h2', { id: 'test-title' }, 'Practice and interview'),
      el('p', { class: 'muted small' }, 'Focused sessions: one question at a time, with your results saved.')),
    el('div', { class: 'subject-sessions' }, el('p', { class: 'small' }, el('strong', {}, 'Whole subject: ')),
      sessionButtons(category.topics, ['subject', category.id])),
    el('ul', { class: 'session-table', role: 'list' }, rows.map(({ sub, buttons }) => el('li', {},
      el('span', { class: 'session-module' }, sub.title), el('span', { class: 'session-buttons' }, buttons)))));
}

export async function renderModule(main, { categoryId, subId }) {
  const category = getCategory(categoryId);
  const sub = getSubcategory(category, subId);
  if (!category || !sub) {
    main.replaceChildren(errorState({
      title: 'Module not found',
      message: `There is no module “${subId}”${category ? ` in ${category.title}` : ''}.`,
      actions: category ? [{ label: `Back to ${category.title}`, href: href(['c', category.id]), primary: true }] : [{ label: 'Back to dashboard', href: '#/', primary: true }],
    }));
    return { title: 'Module not found' };
  }
  const interactive = await interactiveTopicIds(category.id);
  const s = engine.stats(sub.topics);
  const list = el('ul', { class: 'topic-list', role: 'list' });
  const difficulty = el('select', { class: 'select', 'aria-label': 'Filter by difficulty' },
    el('option', { value: '' }, 'All difficulties'),
    Object.entries(DIFFICULTY_LABELS).map(([value, label]) => el('option', { value }, label)));
  const status = el('select', { class: 'select', 'aria-label': 'Filter by status' },
    el('option', { value: '' }, 'Any status'),
    el('option', { value: 'not-started' }, 'Not started'),
    el('option', { value: 'in-progress' }, 'In progress'),
    el('option', { value: 'completed' }, 'Completed'));
  const count = el('p', { class: 'muted small', 'aria-live': 'polite' });

  function fill() {
    const topics = sub.topics.filter((t) => (!difficulty.value || t.difficulty === difficulty.value)
      && (!status.value || getStatus(t.id) === status.value));
    list.replaceChildren(...topics.map((t) => topicRow(t, { interactive: interactive.has(t.id) })));
    count.textContent = `${topics.length} of ${sub.topics.length} topics`;
    if (!topics.length) list.append(el('li', { class: 'empty-state small' }, 'No topics match these filters.'));
  }
  difficulty.addEventListener('change', fill);
  status.addEventListener('change', fill);

  main.replaceChildren(el('div', { class: 'page' },
    pageHeader({
      crumbs: [{ label: category.title, href: href(['c', category.id]) }, { label: sub.title }],
      title: sub.title,
      lead: sub.description,
      meta: el('div', { class: 'subject-stats' },
        el('div', { class: 'subject-progress' }, progressBar(s.percent, `${sub.title} progress`),
          el('span', { class: 'small' }, `${s.completed}/${s.total} completed · ${formatMinutes(totalMinutes(sub.topics))}`)),
        el('div', { class: 'session-buttons' }, sessionButtons(sub.topics, ['module', category.id, sub.id]))),
    }),
    el('div', { class: 'list-toolbar' }, difficulty, status, count),
    list));
  fill();
  return { title: `${sub.title} · ${category.title}` };
}

