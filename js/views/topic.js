// Topic study page: lesson + companion tabs, interactions, progress, navigation.

import { el, icon, formatMinutes, announce } from '../util.js';
import {
  getTopic, topicDir, topicTabs, tabToFile, fetchText, neighbours, interactionsForTopic,
} from '../content-loader.js';
import { renderMarkdown } from '../markdown-renderer.js';
import { href } from '../router.js';
import * as progress from '../progress.js';
import * as bookmarks from '../bookmarks.js';
import * as history from '../history.js';
import { read, write } from '../storage.js';
import { recordResult } from '../activity.js';
import { topicContext } from '../study-engine.js';
import { placeInLesson, track, typeLabel } from '../engagement/registry.js';
import { parseQuestions } from '../engagement/question-parser.js';
import { createQuiz } from '../engagement/quiz.js';
import { createDeck } from '../engagement/flashcards.js';
import { breadcrumbs, difficultyBadge, errorState, loading, notice } from './common.js';
import { buildToc, watchToc } from './toc.js';

const QUESTION_TABS = { practice: 'practice', 'interview-questions': 'interview' };

export async function renderTopic(main, { topicId, tab = 'lesson', anchor, isCurrent }) {
  const topic = getTopic(topicId);
  if (!topic) {
    main.replaceChildren(errorState({
      title: 'Topic not found',
      message: `No published topic has the id “${topicId}”. It may have been renamed or not be published yet.`,
      actions: [
        { label: `Search for “${topicId.replace(/-/g, ' ')}”`, href: href(['search'], { q: topicId.replace(/-/g, ' ') }), primary: true },
        { label: 'Back to dashboard', href: '#/' },
      ],
    }));
    return { title: 'Topic not found' };
  }

  const { category, sub } = topicContext(topic);
  const tabs = topicTabs(topic);
  const hasFlashcards = topic.files.includes('interview-questions.md');
  if (hasFlashcards) tabs.push({ tab: 'flashcards', label: 'Flashcards', file: 'interview-questions.md' });
  const current = tabs.find((t) => t.tab === tab);

  progress.markVisited(topic.id);
  history.record('topic', topic.id, tab === 'lesson' ? {} : { tab });

  const header = topicHeader(topic, category, sub);
  const tabNav = el('nav', { class: 'topic-tabs', 'aria-label': 'Topic sections' },
    el('ul', {}, tabs.map((t) => el('li', {}, el('a', {
      class: `topic-tab ${t.tab === tab ? 'is-active' : ''}`,
      href: t.tab === 'lesson' ? href(['t', topic.id]) : href(['t', topic.id, t.tab]),
      'aria-current': t.tab === tab ? 'page' : null,
    }, t.label)))));
  const body = el('div', { class: 'topic-body' }, loading('Loading lesson…'));

  main.replaceChildren(el('div', { class: 'page topic-page' }, header, tabNav, body, topicFooter(topic)));

  if (!current) {
    body.replaceChildren(notice(`This topic has no “${tab}” section.`, 'warning'),
      el('a', { class: 'btn btn-secondary', href: href(['t', topic.id]) }, 'Open the lesson'));
    return { title: topic.title };
  }

  const file = current.file || tabToFile(tab);
  const path = topicDir(topic) + file;
  let markdown;
  try {
    markdown = await fetchText(path);
  } catch (error) {
    if (!isCurrent()) return null;
    body.replaceChildren(loadFailure(error, path));
    return { title: topic.title };
  }
  if (!isCurrent()) return null;

  const anchorHref = (id) => href(tab === 'lesson' ? ['t', topic.id] : ['t', topic.id, tab], { s: id });
  const rendered = renderMarkdown(markdown, { sourcePath: path, dropTitle: true, anchorHref });

  if (tab === 'flashcards') {
    renderFlashcards(body, topic, rendered);
  } else if (QUESTION_TABS[tab]) {
    renderQuestions(body, topic, rendered, QUESTION_TABS[tab]);
  } else {
    const article = el('article', { class: 'lesson', 'aria-label': current.label }, rendered.node);
    if (tab === 'lesson') {
      const items = await interactionsForTopic(topic);
      if (!isCurrent()) return null;
      if (items.length) {
        const shells = placeInLesson(rendered.node, items, topic);
        header.querySelector('.topic-meta').append(interactiveChip(shells));
      }
    }
    const headings = [...rendered.node.querySelectorAll('h2')].map((h) => ({ id: h.id, text: h.textContent.trim(), element: h }));
    const toc = buildToc(headings, anchorHref);
    body.replaceChildren(el('div', { class: 'reading-layout' }, toc.inline, article, toc.aside));
    track(watchToc(headings, toc));
    if (tab === 'lesson') track(watchReading(topic, article));
  }

  if (anchor) scrollToAnchor(anchor);
  return { title: `${current.label === 'Lesson' ? '' : `${current.label} · `}${topic.title}` };
}

function topicHeader(topic, category, sub) {
  const bookmarkBtn = el('button', { type: 'button', class: 'btn btn-secondary', 'aria-pressed': String(bookmarks.has(topic.id)) });
  const completeBtn = el('button', { type: 'button', class: 'btn btn-secondary btn-complete', 'aria-pressed': String(progress.isComplete(topic.id)) });
  const status = el('span', { class: 'topic-status' });

  function refresh() {
    const marked = bookmarks.has(topic.id);
    bookmarkBtn.setAttribute('aria-pressed', String(marked));
    bookmarkBtn.replaceChildren(icon('bookmark', 16), marked ? 'Bookmarked' : 'Bookmark');
    const done = progress.isComplete(topic.id);
    completeBtn.setAttribute('aria-pressed', String(done));
    completeBtn.classList.toggle('is-done', done);
    completeBtn.replaceChildren(icon('check', 16), done ? 'Completed' : 'Mark complete');
    const record = progress.getRecord(topic.id);
    const st = progress.getStatus(topic.id);
    status.className = `status status-${st}`;
    status.replaceChildren(el('span', { class: 'status-dot', 'aria-hidden': 'true' }), progress.STATUS_LABELS[st],
      st !== 'completed' && record?.read ? ` · ${Math.round(record.read * 100)}% read` : '');
  }
  bookmarkBtn.addEventListener('click', () => {
    const on = bookmarks.toggle(topic.id);
    refresh();
    announce(on ? 'Bookmarked.' : 'Bookmark removed.');
  });
  completeBtn.addEventListener('click', () => {
    const done = progress.toggleComplete(topic.id);
    refresh();
    announce(done ? 'Marked as complete.' : 'Marked as in progress.');
  });
  refresh();
  document.addEventListener('studyhub:topic-refresh', refresh);
  track({ destroy: () => document.removeEventListener('studyhub:topic-refresh', refresh) });

  const crumbs = [{ label: 'Dashboard', href: '#/' }];
  if (category) crumbs.push({ label: category.title, href: href(['c', category.id]) });
  if (sub) crumbs.push({ label: sub.title, href: href(['c', category.id, sub.id]) });
  crumbs.push({ label: topic.title });

  return el('header', { class: 'page-header topic-header' },
    breadcrumbs(crumbs),
    el('div', { class: 'page-title-row' },
      el('h1', { class: 'page-title', tabindex: -1 }, topic.title),
      el('div', { class: 'page-actions' }, bookmarkBtn, completeBtn)),
    el('p', { class: 'lead' }, topic.description),
    el('div', { class: 'topic-meta' },
      sub ? el('span', { class: 'meta-item' }, sub.title) : null,
      difficultyBadge(topic.difficulty),
      topic.estimatedMinutes ? el('span', { class: 'meta-item' }, icon('clock', 14), formatMinutes(topic.estimatedMinutes)) : null,
      status));
}

function interactiveChip(shells) {
  const first = shells[0];
  const label = shells.length === 1 ? `Try it: ${typeLabel(first.interaction.type)}` : `${shells.length} interactive exercises`;
  const link = el('a', { class: 'badge badge-interactive badge-link', href: '#' }, icon('spark', 12), label);
  link.addEventListener('click', (event) => {
    event.preventDefault();
    first.shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
    first.shell.querySelector('.interaction-title')?.setAttribute('tabindex', '-1');
    first.shell.querySelector('.interaction-title')?.focus({ preventScroll: true });
  });
  return link;
}

function topicFooter(topic) {
  const { prev, next } = neighbours(topic);
  const links = (ids, label) => {
    const topics = (ids || []).map(getTopic).filter(Boolean);
    if (!topics.length) return null;
    return el('div', { class: 'related' }, el('h2', { class: 'related-title' }, label),
      el('ul', { class: 'chip-list', role: 'list' }, topics.map((t) => el('li', {}, el('a', { class: 'chip-link', href: href(['t', t.id]) }, t.title)))));
  };
  const completeCta = el('div', { class: 'finish-cta' },
    el('p', {}, el('strong', {}, 'Finished this topic?'), ' Mark it complete to track your progress.'));
  const btn = el('button', { type: 'button', class: 'btn btn-primary' });
  const sync = () => {
    const done = progress.isComplete(topic.id);
    btn.replaceChildren(icon('check', 16), done ? 'Completed' : 'Mark complete');
    btn.setAttribute('aria-pressed', String(done));
  };
  btn.addEventListener('click', () => {
    const done = progress.toggleComplete(topic.id);
    sync();
    document.dispatchEvent(new CustomEvent('studyhub:topic-refresh'));
    announce(done ? 'Marked as complete.' : 'Marked as in progress.');
  });
  sync();
  completeCta.append(btn);

  return el('footer', { class: 'topic-footer' },
    completeCta,
    links(topic.prerequisites, 'Study first'),
    links(topic.relatedTopics, 'Related topics'),
    el('nav', { class: 'pager', 'aria-label': 'Previous and next topic' },
      prev ? el('a', { class: 'pager-link pager-prev', href: href(['t', prev.id]), rel: 'prev' },
        el('span', { class: 'pager-label' }, icon('chevronLeft', 14), 'Previous'), el('span', { class: 'pager-title' }, prev.title)) : el('span'),
      next ? el('a', { class: 'pager-link pager-next', href: href(['t', next.id]), rel: 'next' },
        el('span', { class: 'pager-label' }, 'Next', icon('chevronRight', 14)), el('span', { class: 'pager-title' }, next.title)) : el('span')));
}

// ---- Practice / interview tabs -----------------------------------------------------

const VIEW_PREF = 'prefs';

function renderQuestions(body, topic, rendered, kind) {
  const parsed = parseQuestions(rendered.node);
  const items = parsed.items.filter((i) => i.prefix === (kind === 'practice' ? 'P' : 'Q')).map((i) => ({ ...i, topic }));
  const prefs = read(VIEW_PREF, {});
  let view = items.length ? (prefs.questionView || 'session') : 'all';

  const switcher = el('div', { class: 'segmented', role: 'group', 'aria-label': 'Question view' });
  const stage = el('div', { class: 'question-stage' });
  let instance = null;

  function show() {
    instance?.destroy?.();
    instance = null;
    switcher.replaceChildren(
      segment('One at a time', 'session'),
      segment('Show all', 'all'));
    if (view === 'session') {
      stage.replaceChildren();
      instance = track(createQuiz(stage, items, { kind, preamble: parsed.preamble }));
    } else {
      // The parser only reads the rendered file (the quiz clones what it shows), so the same DOM is reused.
      stage.replaceChildren(el('article', { class: 'lesson' }, rendered.node));
    }
  }

  function segment(label, value) {
    const b = el('button', { type: 'button', class: `segment ${view === value ? 'is-active' : ''}`, 'aria-pressed': String(view === value), disabled: value === 'session' && !items.length }, label);
    b.addEventListener('click', () => {
      if (view === value) return;
      view = value;
      write(VIEW_PREF, { ...read(VIEW_PREF, {}), questionView: value });
      show();
    });
    return b;
  }

  body.replaceChildren(el('div', { class: 'question-layout' },
    el('div', { class: 'question-head' },
      el('p', { class: 'muted' }, items.length
        ? `${items.length} ${kind === 'practice' ? 'practice' : 'interview'} questions. Your answers are saved, so you can drill the ones you missed.`
        : 'This file has no numbered questions, so it is shown in full.'),
      switcher),
    stage));
  show();
}

function renderFlashcards(body, topic, rendered) {
  const { items } = parseQuestions(rendered.node);
  const cards = items.filter((i) => i.answers.length).map((item) => ({
    key: item.num,
    label: item.group?.title || null,
    front: el('p', { class: 'flash-text' }, item.title),
    back: el('div', { class: 'markdown-body' }, item.answers.flatMap((a) => [...a.content.childNodes].map((n) => n.cloneNode(true)))),
  }));
  if (!cards.length) {
    body.replaceChildren(notice('No question-and-answer pairs were found for flashcards.', 'info'));
    return;
  }
  const host = el('div', { class: 'flash-host' });
  body.replaceChildren(el('div', { class: 'question-layout' },
    el('p', { class: 'muted' }, `${cards.length} cards from this topic's interview questions. Answer out loud, then check.`),
    host));
  createDeck(host, cards, {
    onResult: (card, known) => recordResult(topic.id, 'flashcards', card.key, known ? 'known' : 'review'),
  });
}

// ---- Reading progress ----------------------------------------------------------------

function watchReading(topic, article) {
  const bar = document.querySelector('#reading-progress span');
  let saved = progress.getRecord(topic.id)?.read || 0;
  let frame = 0;

  function measure() {
    frame = 0;
    const rect = article.getBoundingClientRect();
    const total = rect.height - window.innerHeight * 0.6;
    const ratio = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
    if (bar) bar.style.width = `${Math.round(ratio * 100)}%`;
    // Persist in 10% steps to keep storage writes rare.
    if (ratio - saved >= 0.1 || (ratio >= 0.98 && saved < 0.98)) {
      saved = ratio;
      progress.recordReading(topic.id, ratio);
    }
  }
  const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
  window.addEventListener('scroll', onScroll, { passive: true });
  document.getElementById('reading-progress').classList.add('is-visible');
  measure();
  return {
    destroy() {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
      document.getElementById('reading-progress').classList.remove('is-visible');
      if (bar) bar.style.width = '0';
    },
  };
}

// ---- Helpers ---------------------------------------------------------------------------

export function scrollToAnchor(id) {
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  // Collapsed answers: open the <details> that contains the target.
  for (let n = target.parentElement; n; n = n.parentElement) if (n.tagName === 'DETAILS') n.open = true;
  target.scrollIntoView({ block: 'start' });
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });

  // Interactions above the target mount lazily and grow, pushing it down.
  // Re-align once they settle — unless the reader has started scrolling.
  let userMoved = false;
  const stop = () => { userMoved = true; };
  const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
  for (const e of events) window.addEventListener(e, stop, { once: true, passive: true });
  const initialTop = target.getBoundingClientRect().top;
  setTimeout(() => {
    for (const e of events) window.removeEventListener(e, stop);
    if (!userMoved && document.body.contains(target) && Math.abs(target.getBoundingClientRect().top - initialTop) > 8) {
      target.scrollIntoView({ block: 'start' });
    }
  }, 700);
}

export function loadFailure(error, path) {
  const retry = el('button', { type: 'button', class: 'btn btn-primary' }, 'Try again');
  retry.addEventListener('click', () => window.location.reload());
  return el('div', { class: 'empty-state' },
    el('p', { class: 'notice notice-warning', role: 'alert' }, error.message || 'This file could not be loaded.'),
    el('p', { class: 'muted small' }, 'If you are running StudyHub locally, open it through a static server (not file://).'),
    el('div', { class: 'empty-actions' }, retry, el('a', { class: 'btn btn-secondary', href: path }, 'Open the raw file')));
}
