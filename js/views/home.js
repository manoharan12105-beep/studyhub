// Dashboard: where you are (progress, continue learning), fast revision,
// subjects, recent work, and the knowledge map.

import { el, icon, formatMinutes, timeAgo, percent } from '../util.js';
import { index, isAvailable, loadInteractions, categoriesInDisplayOrder } from '../content-loader.js';
import { href } from '../router.js';
import * as engine from '../study-engine.js';
import * as progress from '../progress.js';
import { progressBar, statusBadge, subjectIcon } from './common.js';
import { track } from '../engagement/registry.js';
import { mapSupported } from '../map-focus.js';
import * as studyPlans from '../plans.js';
import { planCard, wireInteractiveLinks } from './plans.js';

export async function renderHome(main) {
  const overall = engine.overallStats();
  const ordered = categoriesInDisplayOrder();
  const available = ordered.filter(isAvailable);
  const upcoming = ordered.filter((c) => !isAvailable(c));
  const totals = engine.questionTotals();
  const answered = totals.practice.attempted + totals.interview.attempted + totals.checks.attempted;

  // Not aria-hidden: the map's canvas is keyboard-operable and its detail panel holds links.
  const mapHost = el('div', { class: 'hero-visual' });
  const interactiveCount = el('span', { class: 'stat-value' }, '…');

  const hero = el('section', { class: 'hero', 'aria-labelledby': 'home-title' },
    el('div', { class: 'hero-text' },
      el('p', { class: 'eyebrow' }, 'Interview preparation, from first principles'),
      el('h1', { class: 'hero-title', id: 'home-title', tabindex: -1 }, 'StudyHub'),
      el('p', { class: 'hero-tagline' }, 'Learn. Practice. Revise. Prepare.'),
      el('div', { class: 'stat-panels' },
        el('section', { class: 'stat-panel stat-panel-you', 'aria-labelledby': 'stats-you' },
          el('h2', { class: 'stat-panel-title', id: 'stats-you' }, 'Your progress'),
          el('div', { class: 'progress-row' },
            el('span', {}, el('strong', {}, `${overall.completed}`), ` of ${overall.total} topics completed`),
            el('span', { class: 'muted' }, `${overall.percent}%`)),
          progressBar(overall.percent, 'Overall progress'),
          el('dl', { class: 'stat-row' },
            stat(`${overall.completed}`, overall.completed === 1 ? 'topic completed' : 'topics completed'),
            stat(`${overall.inProgress}`, 'in progress'),
            stat(`${answered}`, answered === 1 ? 'question answered' : 'questions answered'))),
        el('section', { class: 'stat-panel', 'aria-labelledby': 'stats-platform' },
          el('h2', { class: 'stat-panel-title', id: 'stats-platform' }, 'Platform'),
          el('dl', { class: 'stat-row' },
            stat(`${available.length}`, 'subjects'),
            stat(`${overall.total}`, 'topics'),
            el('div', { class: 'stat' }, el('dt', {}, 'interactive exercises'), el('dd', {}, interactiveCount)))))),
    mapHost);

  main.replaceChildren(el('div', { class: 'page page-home' },
    hero,
    continueSection(),
    planSection(),
    quickRevisionSection(available),
    attentionSection(),
    el('section', { class: 'section', 'aria-labelledby': 'subjects-title' },
      el('div', { class: 'section-head' }, el('h2', { id: 'subjects-title' }, 'Subjects')),
      el('ul', { class: 'card-grid', role: 'list' }, available.map(subjectCard), upcoming.map(comingSoonCard))),
    el('div', { class: 'two-col' }, recentSection(), bookmarksSection()),
    activitySection(totals)));

  // Counts that need the interaction registries (small JSON files).
  const interactionCounts = Promise.all(available.map((c) => loadInteractions(c.id)))
    .then((all) => new Map(available.map((c, i) => [c.id, all[i].interactions.length])));
  interactionCounts.then((counts) => {
    interactiveCount.textContent = String([...counts.values()].reduce((a, b) => a + b, 0));
  });

  mountKnowledgeMap(mapHost, available, interactionCounts);
  return { title: 'Dashboard' };
}

function stat(value, label) {
  return el('div', { class: 'stat' }, el('dt', {}, label), el('dd', {}, el('span', { class: 'stat-value' }, value)));
}

/** Minutes left in a lesson, from its estimate and the furthest point read (both real data). */
function minutesLeft(topic) {
  if (!topic.estimatedMinutes) return null;
  const read = progress.getRecord(topic.id)?.read || 0;
  return Math.max(1, Math.ceil(topic.estimatedMinutes * (1 - read)));
}

function continueSection() {
  const next = engine.continueLearning();
  if (!next) {
    const first = index.categories.find(isAvailable)?.topics[0];
    return el('section', { class: 'continue-card is-empty', 'aria-labelledby': 'continue-title' },
      el('div', {},
        el('h2', { id: 'continue-title' }, 'Start learning'),
        el('p', { class: 'muted' }, 'Pick a subject below. Your place, progress and bookmarks are saved in this browser.')),
      first ? el('a', { class: 'btn btn-primary', href: href(['t', first.id]) }, `Start with ${first.title}`, icon('arrowRight', 16)) : null);
  }
  const { topic, tab, reason, after } = next;
  const { category, sub } = engine.topicContext(topic);
  const read = Math.round((progress.getRecord(topic.id)?.read || 0) * 100);
  const left = minutesLeft(topic);
  const target = tab && tab !== 'lesson' ? href(['t', topic.id, tab]) : href(['t', topic.id]);

  const body = reason === 'next'
    ? [
      el('p', { class: 'continue-done' }, icon('check', 16), `${after.title} completed`),
      el('p', { class: 'continue-next' }, el('span', { class: 'muted' }, 'Next: '), el('span', { class: 'continue-topic' }, topic.title)),
      el('p', { class: 'muted small' }, [sub?.title, topic.estimatedMinutes ? `~${formatMinutes(topic.estimatedMinutes)}` : null].filter(Boolean).join(' · ')),
    ]
    : [
      el('p', { class: 'continue-topic' }, topic.title),
      el('div', { class: 'continue-progress' },
        progressBar(read, `${topic.title}: ${read}% read`),
        el('span', { class: 'small muted' }, read ? `${read}% read` : 'Started', left ? ` · ~${formatMinutes(left)} left` : '')),
    ];

  return el('section', { class: 'continue-card', 'aria-labelledby': 'continue-title' },
    el('div', { class: 'continue-text' },
      el('h2', { id: 'continue-title', class: 'continue-label' }, 'Continue learning'),
      el('p', { class: 'continue-path' }, category ? subjectIcon(category, 'sm') : null,
        [category?.title, reason === 'next' ? null : sub?.title].filter(Boolean).join(' › ')),
      body),
    el('a', { class: 'btn btn-primary btn-lg', href: target }, reason === 'next' ? 'Start next' : 'Continue', icon('arrowRight', 18)));
}

/** The active study plan, when there is one: today's place and the next activity. */
function planSection() {
  const active = studyPlans.activePlan();
  if (!active) return null;
  const section = el('section', { class: 'section home-plan', 'aria-labelledby': 'home-plan-title' },
    el('div', { class: 'section-head' },
      el('h2', { id: 'home-plan-title' }, 'Your study plan'),
      el('a', { class: 'small', href: '#/plans' }, 'All study plans')),
    planCard(active, studyPlans.summarize(active), { featured: true }));
  wireInteractiveLinks(section);
  return section;
}

/**
 * The fastest revision sheet of each subject (shortest timed study mode), for
 * the last half hour before an interview. Only modes that exist are shown.
 */
function quickRevisionSection(categories) {
  const items = categories.map((category) => {
    const timed = category.studyModes.filter((m) => m.estimatedMinutes).sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
    const quick = timed[0] || category.studyModes[0];
    return quick ? { category, quick, others: category.studyModes.filter((m) => m !== quick) } : null;
  }).filter(Boolean);
  if (!items.length) return null;
  return el('section', { class: 'section quick-revision', id: 'quick-revision', tabindex: -1, 'aria-labelledby': 'rev-title' },
    el('div', { class: 'section-head' },
      el('h2', { id: 'rev-title' }, 'Quick revision'),
      el('p', { class: 'muted small' }, 'Interview soon? One scannable page per subject.')),
    // Block elements in reading order (subject → revision type → time → action), so the
    // card reads correctly even before or without the stylesheet.
    el('ul', { class: 'revision-grid', role: 'list' }, items.map(({ category, quick, others }) => el('li', { class: 'revision-item' },
      el('h3', { class: 'revision-subject' }, subjectIcon(category, 'sm'), el('span', {}, category.title)),
      el('p', { class: 'revision-mode' }, quick.title),
      quick.estimatedMinutes ? el('p', { class: 'revision-time' }, icon('clock', 14), `~${formatMinutes(quick.estimatedMinutes)}`) : null,
      el('a', { class: 'btn btn-secondary btn-sm revision-start', href: href(['c', category.id, 'm', quick.id]) },
        'Start revision', el('span', { class: 'sr-only' }, `: ${category.title}, ${quick.title}`), icon('arrowRight', 14)),
      others.length ? el('p', { class: 'revision-others small' }, 'Also: ',
        others.map((m, i) => [i ? ' · ' : '', el('a', { href: href(['c', category.id, 'm', m.id]) }, m.title)])) : null))));
}

/** Shown only when the learner's own answers point at weak topics. */
function attentionSection() {
  const weak = engine.needsAttention(4);
  if (!weak.length) return null;
  return el('section', { class: 'section', 'aria-labelledby': 'attention-title' },
    el('div', { class: 'section-head' },
      el('h2', { id: 'attention-title' }, 'Needs attention'),
      el('p', { class: 'muted small' }, 'Topics where most of your recorded answers were wrong or marked “review again”.')),
    el('ul', { class: 'attention-list', role: 'list' }, weak.map((w) => {
      const { category } = engine.topicContext(w.topic);
      const session = w.topic.files.includes('practice.md') ? 'practice' : w.topic.files.includes('interview-questions.md') ? 'interview' : null;
      return el('li', { class: 'attention-item' },
        el('span', { class: 'attention-icon', 'aria-hidden': 'true' }, icon('alert', 16)),
        el('span', { class: 'attention-text' },
          el('a', { class: 'attention-title', href: href(['t', w.topic.id]) }, w.topic.title),
          el('span', { class: 'small muted' }, `${category?.title || ''} · ${w.positive} of ${w.attempted} right (${percent(w.positive, w.attempted)}%) · last tried ${timeAgo(w.last)}`)),
        session ? el('a', { class: 'btn btn-secondary btn-sm', href: href(['session', session, 'topic', w.topic.id]) }, session === 'practice' ? 'Practice again' : 'Review again') : null);
    })));
}

function subjectCard(category) {
  const s = engine.stats(category.topics);
  const resume = engine.resumeInCategory(category.id);
  const modules = category.subcategories.filter((sub) => sub.topics.length).length;
  return el('li', { class: 'card subject-card' },
    el('div', { class: 'card-head' }, subjectIcon(category),
      el('h3', { class: 'card-title' }, el('a', { href: href(['c', category.id]), class: 'stretched' }, category.title))),
    el('p', { class: 'card-desc' }, category.description),
    el('p', { class: 'card-meta' }, `${category.topics.length} topics · ${modules} modules`),
    el('div', { class: 'card-progress' },
      progressBar(s.percent, `${category.title} progress`),
      el('span', { class: 'small muted' }, `${s.completed}/${s.total} done`)),
    el('div', { class: 'card-actions' },
      resume ? el('a', { class: 'btn btn-secondary btn-sm', href: href(['t', resume.topic.id]) }, resume.reason === 'start' ? 'Start' : 'Continue') : null,
      category.studyModes.slice(0, 2).map((mode) => el('a', { class: 'btn btn-ghost btn-sm', href: href(['c', category.id, 'm', mode.id]) }, mode.title))));
}

function comingSoonCard(category) {
  return el('li', { class: 'card subject-card is-soon' },
    el('div', { class: 'card-head' }, subjectIcon(category),
      el('h3', { class: 'card-title' }, el('a', { href: href(['c', category.id]), class: 'stretched' }, category.title))),
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
function mountKnowledgeMap(host, categories, interactionCounts) {
  if (!mapSupported()) return;
  const renderPanel = (subject) => mapPanel(categories.find((c) => c.id === subject.id), interactionCounts);
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
      })), { renderPanel }));
    })
    .catch((error) => console.warn('Knowledge map unavailable:', error));
}

/** Detail panel for the subject selected on the map — all values from progress, history and metadata. */
function mapPanel(category, interactionCounts) {
  const s = engine.stats(category.topics);
  const current = currentTopic(category);
  const exercises = el('dd', {}, '…');
  interactionCounts.then((counts) => { exercises.textContent = String(counts.get(category.id) ?? 0); });
  return el('div', { class: 'map-panel-body' },
    el('h2', { class: 'map-panel-title', tabindex: -1 }, category.title),
    el('div', { class: 'progress-row small' },
      el('span', {}, el('strong', {}, `${s.completed}`), ` / ${s.total} topics completed`),
      el('span', { class: 'muted' }, `${s.percent}%`)),
    progressBar(s.percent, `${category.title} progress`),
    el('dl', { class: 'map-panel-facts' },
      el('div', {}, el('dt', {}, current.label), el('dd', {}, current.topic ? current.topic.title : 'All topics completed')),
      el('div', {}, el('dt', {}, 'Interactive exercises'), exercises)),
    el('div', { class: 'map-panel-actions' },
      current.topic ? el('a', { class: 'btn btn-primary btn-sm', href: current.href }, current.action, icon('chevronRight', 16)) : null,
      el('a', { class: 'btn btn-secondary btn-sm', href: href(['c', category.id]) }, 'Open subject')));
}

/** The topic last opened in this subject and not finished yet, else the first unfinished one. */
function currentTopic(category) {
  const resume = engine.resumeInCategory(category.id);
  if (!resume) return { label: 'Current topic', topic: null };
  const target = resume.tab && resume.tab !== 'lesson' ? href(['t', resume.topic.id, resume.tab]) : href(['t', resume.topic.id]);
  if (resume.reason === 'resume') return { label: 'Current topic', topic: resume.topic, action: 'Continue learning', href: target };
  const started = resume.reason === 'next';
  return { label: started ? 'Next topic' : 'Start with', topic: resume.topic, action: started ? 'Continue learning' : 'Start learning', href: target };
}
