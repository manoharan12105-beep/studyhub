// Dashboard: progress, continue learning, subjects, recent, bookmarks, revision.

import { el, icon, formatMinutes, timeAgo, percent } from '../util.js';
import { index, isAvailable, loadInteractions } from '../content-loader.js';
import { href } from '../router.js';
import * as engine from '../study-engine.js';
import * as progress from '../progress.js';
import { progressBar, statusBadge } from './common.js';
import { track } from '../engagement/registry.js';

export async function renderHome(main) {
  const overall = engine.overallStats();
  const available = index.categories.filter(isAvailable);
  const upcoming = index.categories.filter((c) => !isAvailable(c));
  const totals = engine.questionTotals();

  const mapHost = el('div', { class: 'hero-visual', 'aria-hidden': 'true' });
  const interactiveCount = el('span', { class: 'stat-value' }, '…');

  const hero = el('section', { class: 'hero', 'aria-labelledby': 'home-title' },
    el('div', { class: 'hero-text' },
      el('p', { class: 'eyebrow' }, 'Interview preparation, from first principles'),
      el('h1', { class: 'hero-title', id: 'home-title', tabindex: -1 }, 'StudyHub'),
      el('p', { class: 'hero-tagline' }, 'Learn. Practice. Revise. Prepare.'),
      el('div', { class: 'hero-progress' },
        el('div', { class: 'hero-progress-row' },
          el('span', {}, el('strong', {}, `${overall.completed}`), ` of ${overall.total} topics completed`),
          el('span', { class: 'muted' }, `${overall.percent}%`)),
        progressBar(overall.percent, 'Overall progress')),
      el('dl', { class: 'stat-row' },
        stat(`${available.length}`, 'subjects'),
        stat(`${overall.total}`, 'topics'),
        el('div', { class: 'stat' }, el('dt', {}, 'interactive exercises'), el('dd', {}, interactiveCount)),
        stat(`${totals.practice.attempted + totals.interview.attempted + totals.checks.attempted}`, 'questions answered'))),
    mapHost);

  main.replaceChildren(el('div', { class: 'page page-home' },
    hero,
    continueSection(),
    el('section', { class: 'section', 'aria-labelledby': 'subjects-title' },
      el('div', { class: 'section-head' }, el('h2', { id: 'subjects-title' }, 'Subjects')),
      el('ul', { class: 'card-grid', role: 'list' }, available.map(subjectCard), upcoming.map(comingSoonCard))),
    el('div', { class: 'two-col' }, recentSection(), bookmarksSection()),
    revisionSection(available),
    activitySection(totals)));

  // Counts that need the interaction registries (small JSON files).
  Promise.all(available.map((c) => loadInteractions(c.id))).then((all) => {
    interactiveCount.textContent = String(all.reduce((n, r) => n + r.interactions.length, 0));
  });

  mountKnowledgeMap(mapHost, available);
  return { title: 'Dashboard' };
}

function stat(value, label) {
  return el('div', { class: 'stat' }, el('dt', {}, label), el('dd', {}, el('span', { class: 'stat-value' }, value)));
}

function continueSection() {
  const next = engine.continueLearning();
  if (!next) {
    const first = index.categories.find(isAvailable)?.topics[0];
    return el('section', { class: 'continue-card is-empty', 'aria-labelledby': 'continue-title' },
      el('div', {},
        el('h2', { id: 'continue-title' }, 'Start learning'),
        el('p', { class: 'muted' }, 'Pick a subject below. Your place, progress and bookmarks are saved in this browser.')),
      first ? el('a', { class: 'btn btn-primary', href: href(['t', first.id]) }, `Start with ${first.title}`, icon('chevronRight', 16)) : null);
  }
  const { topic, tab, reason, after } = next;
  const { category, sub } = engine.topicContext(topic);
  const record = progress.getRecord(topic.id);
  const read = record?.read ? Math.round(record.read * 100) : 0;
  const target = tab && tab !== 'lesson' ? href(['t', topic.id, tab]) : href(['t', topic.id]);
  return el('section', { class: 'continue-card', 'aria-labelledby': 'continue-title' },
    el('div', { class: 'continue-text' },
      el('h2', { id: 'continue-title', class: 'eyebrow' }, reason === 'next' ? 'Up next' : 'Continue learning'),
      el('p', { class: 'continue-path' }, [category?.title, sub?.title].filter(Boolean).join(' → ')),
      el('p', { class: 'continue-topic' }, topic.title),
      el('p', { class: 'muted small' },
        reason === 'next' ? `You finished ${after.title}.` : read ? `${read}% read` : 'Started',
        topic.estimatedMinutes ? ` · ${formatMinutes(topic.estimatedMinutes)}` : '')),
    el('a', { class: 'btn btn-primary btn-lg', href: target }, reason === 'next' ? 'Start' : 'Continue', icon('chevronRight', 18)));
}

function subjectCard(category) {
  const s = engine.stats(category.topics);
  const next = engine.nextInCategory(category.id);
  const modules = category.subcategories.filter((sub) => sub.topics.length).length;
  return el('li', { class: 'card subject-card' },
    el('h3', { class: 'card-title' }, el('a', { href: href(['c', category.id]), class: 'stretched' }, category.title)),
    el('p', { class: 'card-desc' }, category.description),
    el('p', { class: 'card-meta' }, `${category.topics.length} topics · ${modules} modules`),
    el('div', { class: 'card-progress' },
      progressBar(s.percent, `${category.title} progress`),
      el('span', { class: 'small muted' }, `${s.completed}/${s.total} done`)),
    el('div', { class: 'card-actions' },
      next ? el('a', { class: 'btn btn-secondary btn-sm', href: href(['t', next.id]) }, s.completed || s.inProgress ? 'Next topic' : 'Start') : null,
      category.studyModes.map((mode) => el('a', { class: 'btn btn-ghost btn-sm', href: href(['c', category.id, 'm', mode.id]) }, mode.title))));
}

function comingSoonCard(category) {
  return el('li', { class: 'card subject-card is-soon' },
    el('h3', { class: 'card-title' }, el('a', { href: href(['c', category.id]), class: 'stretched' }, category.title)),
    el('p', { class: 'card-desc' }, category.description),
    el('p', { class: 'card-meta' }, el('span', { class: 'badge badge-soon' }, category.error ? 'Unavailable' : 'Coming soon')));
}

function recentSection() {
  const recent = engine.recentTopics(5);
  return el('section', { class: 'section panel', 'aria-labelledby': 'recent-title' },
    el('div', { class: 'section-head' }, el('h2', { id: 'recent-title' }, 'Recently studied'),
      recent.length ? el('a', { class: 'small', href: '#/history' }, 'All history') : null),
    recent.length
      ? el('ul', { class: 'mini-list', role: 'list' }, recent.map(({ entry, topic }) => miniTopic(topic, timeAgo(entry.at))))
      : el('p', { class: 'muted' }, 'Topics you open will appear here.'));
}

function bookmarksSection() {
  const topics = engine.bookmarkedTopics().slice(0, 5);
  return el('section', { class: 'section panel', 'aria-labelledby': 'bm-title' },
    el('div', { class: 'section-head' }, el('h2', { id: 'bm-title' }, 'Bookmarked'),
      topics.length ? el('a', { class: 'small', href: '#/bookmarks' }, 'All bookmarks') : null),
    topics.length
      ? el('ul', { class: 'mini-list', role: 'list' }, topics.map((t) => miniTopic(t)))
      : el('p', { class: 'muted' }, 'Use the bookmark button on any topic to keep it here.'));
}

function miniTopic(topic, note) {
  const { category } = engine.topicContext(topic);
  return el('li', {}, el('a', { class: 'mini-item', href: href(['t', topic.id]) },
    el('span', { class: 'mini-title' }, topic.title),
    el('span', { class: 'mini-meta' }, category?.title, note ? ` · ${note}` : ''),
    statusBadge(topic.id)));
}

function revisionSection(categories) {
  const withModes = categories.filter((c) => c.studyModes.length);
  if (!withModes.length) return null;
  return el('section', { class: 'section', 'aria-labelledby': 'rev-title' },
    el('div', { class: 'section-head' }, el('h2', { id: 'rev-title' }, 'Quick revision'),
      el('p', { class: 'muted small' }, 'One page per subject — scan before a test or interview.')),
    el('ul', { class: 'revision-grid', role: 'list' }, withModes.map((c) => el('li', { class: 'revision-item' },
      el('p', { class: 'revision-subject' }, c.title),
      el('div', { class: 'revision-links' }, c.studyModes.map((mode) => el('a', { class: 'chip-link', href: href(['c', c.id, 'm', mode.id]) },
        mode.title, mode.estimatedMinutes ? el('span', { class: 'muted' }, ` · ${formatMinutes(mode.estimatedMinutes)}`) : null)))))));
}

function activitySection(totals) {
  const rows = [
    ['Practice questions', totals.practice, 'correct'],
    ['Interview questions', totals.interview, 'known'],
    ['Flashcards', totals.flashcards, 'known'],
    ['Knowledge checks', totals.checks, 'correct'],
  ];
  const latest = engine.recentActivity(1)[0];
  return el('section', { class: 'section', 'aria-labelledby': 'act-title' },
    el('div', { class: 'section-head' }, el('h2', { id: 'act-title' }, 'Your activity'),
      latest ? el('p', { class: 'muted small' }, `Last studied ${timeAgo(latest.entry.at)}`) : null),
    el('ul', { class: 'activity-grid', role: 'list' }, rows.map(([label, t, word]) => el('li', { class: 'activity-item' },
      el('p', { class: 'activity-value' }, `${t.attempted}`),
      el('p', { class: 'activity-label' }, label),
      el('p', { class: 'muted small' }, t.attempted ? `${percent(t.positive, t.attempted)}% ${word}` : 'Not started')))));
}

/**
 * The 3D knowledge map is an enhancement: only on wide screens with WebGL,
 * loaded after the dashboard is already usable, and never required.
 */
function mountKnowledgeMap(host, categories) {
  if (!window.matchMedia('(min-width: 1024px)').matches) return;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) return;
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  import('../three/knowledge-map.js')
    .then((module) => {
      if (!document.body.contains(host)) return;
      track(module.mount(host, categories.map((c) => ({
        id: c.id,
        title: c.title,
        modules: c.subcategories.filter((s) => s.topics.length).map((s) => ({
          id: s.id, title: s.title, ...engine.stats(s.topics),
        })),
        ...engine.stats(c.topics),
      }))));
    })
    .catch((error) => console.warn('Knowledge map unavailable:', error));
}

