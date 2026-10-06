// Focused sessions across a topic, a module or a whole subject:
//   #/session/practice|interview|flashcards/topic/<id>
//   #/session/…/module/<category>/<subcategory>
//   #/session/…/subject/<category>

import { el } from '../util.js';
import { getCategory, getSubcategory, getTopic, topicDir, fetchText } from '../content-loader.js';
import { renderMarkdown } from '../markdown-renderer.js';
import { href } from '../router.js';
import * as history from '../history.js';
import { recordResult } from '../activity.js';
import { parseQuestions } from '../engagement/question-parser.js';
import { createQuiz } from '../engagement/quiz.js';
import { createDeck } from '../engagement/flashcards.js';
import { track } from '../engagement/registry.js';
import { pageHeader, errorState, notice } from './common.js';

const KINDS = {
  practice: { file: 'practice.md', prefix: 'P', title: 'Practice', lead: 'Self-test questions, one at a time. Multiple-choice answers are checked instantly; for the rest, reveal the solution and rate yourself.' },
  interview: { file: 'interview-questions.md', prefix: 'Q', title: 'Interview', lead: 'Answer out loud as you would in an interview, then reveal the model answer and rate yourself honestly.' },
  flashcards: { file: 'interview-questions.md', prefix: 'Q', title: 'Flashcards', lead: 'Quick recall: read the question, answer in your head, flip. “Again” brings the card back later in the round.' },
};
const PARALLEL = 6;

export async function renderSession(main, { kind, scope, isCurrent }) {
  const spec = KINDS[kind];
  const resolved = spec ? resolveScope(scope) : null;
  if (!spec || !resolved) {
    main.replaceChildren(errorState({
      title: 'Session not found',
      message: 'This practice or interview link is not valid any more.',
      actions: [{ label: 'Back to dashboard', href: '#/', primary: true }],
    }));
    return { title: 'Session not found' };
  }
  const { label, crumbs, topics: scopeTopics } = resolved;
  const topics = scopeTopics.filter((t) => t.files.includes(spec.file));
  const status = el('p', { class: 'muted', role: 'status' });
  const stage = el('div', { class: 'session-stage' });

  main.replaceChildren(el('div', { class: 'page session-page' },
    pageHeader({ crumbs: [...crumbs, { label: spec.title }], eyebrow: label, title: `${spec.title}: ${label}`, lead: spec.lead }),
    status, stage));

  if (!topics.length) {
    stage.replaceChildren(notice(`No ${spec.title.toLowerCase()} questions are available here yet.`, 'info'));
    return { title: `${spec.title} · ${label}` };
  }
  history.record('session', `${kind}/${scope.join('/')}`, { label: `${spec.title}: ${label}` });

  // Load the question files with a small concurrency limit.
  const results = new Array(topics.length);
  let done = 0;
  let failed = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < topics.length) {
      const i = cursor++;
      const topic = topics[i];
      const path = topicDir(topic) + spec.file;
      try {
        const md = await fetchText(path);
        results[i] = { topic, rendered: renderMarkdown(md, { sourcePath: path, dropTitle: true }) };
      } catch {
        failed++;
      }
      done++;
      if (isCurrent()) status.textContent = `Loading questions… ${done} of ${topics.length} topics`;
    }
  }
  await Promise.all(Array.from({ length: Math.min(PARALLEL, topics.length) }, worker));
  if (!isCurrent()) return null;

  const items = [];
  for (const result of results) {
    if (!result) continue;
    const { items: parsed } = parseQuestions(result.rendered.node);
    for (const item of parsed) if (item.prefix === spec.prefix) items.push({ ...item, topic: result.topic });
  }
  status.textContent = `${items.length} questions from ${topics.length - failed} topic${topics.length - failed === 1 ? '' : 's'}`
    + (failed ? ` (${failed} file${failed === 1 ? '' : 's'} could not be loaded)` : '');

  const multiTopic = topics.length > 1;
  if (kind === 'flashcards') {
    const cards = items.filter((i) => i.answers.length).map((item) => ({
      key: item.num,
      topicId: item.topic.id,
      label: [multiTopic ? item.topic.title : null, item.group?.title].filter(Boolean).join(' · ') || null,
      front: el('p', { class: 'flash-text' }, item.title),
      back: el('div', { class: 'markdown-body' }, item.answers.flatMap((a) => [...a.content.childNodes].map((n) => n.cloneNode(true)))),
    }));
    createDeck(stage, cards, {
      onResult: (card, known) => recordResult(card.topicId, 'flashcards', card.key, known ? 'known' : 'review'),
    });
  } else {
    track(createQuiz(stage, items, { kind, showTopic: multiTopic }));
  }
  return { title: `${spec.title} · ${label}` };
}

function resolveScope([type, a, b]) {
  if (type === 'topic') {
    const topic = getTopic(a);
    if (!topic) return null;
    const category = getCategory(topic.category);
    return { label: topic.title, topics: [topic], crumbs: [{ label: category.title, href: href(['c', category.id]) }, { label: topic.title, href: href(['t', topic.id]) }] };
  }
  const category = getCategory(a);
  if (!category) return null;
  const crumbs = [{ label: category.title, href: href(['c', category.id]) }];
  if (type === 'subject') return { label: category.title, topics: category.topics, crumbs };
  if (type === 'module') {
    const sub = getSubcategory(category, b);
    if (!sub) return null;
    return { label: sub.title, topics: sub.topics, crumbs: [...crumbs, { label: sub.title, href: href(['c', category.id, sub.id]) }] };
  }
  return null;
}
