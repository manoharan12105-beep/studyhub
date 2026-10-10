// What Buddy says: an optional quiz question, a short fact, or a word of
// encouragement after something the learner really did. Shown in one speech
// bubble at a time.
//
// Quiz questions come from the learner's own completed (else recently studied)
// topics: the topic's practice.md is parsed by the same question parser the
// practice sessions use, and only multiple-choice items with a marked answer
// are asked. If none fits, Buddy asks nothing — it never makes a question up.
// Answering here records nothing: progress and question results are untouched.

import { el, icon, announce, shuffle } from '../util.js';
import { getTopic, topicDir, fetchText, fetchJson } from '../content-loader.js';
import { renderMarkdown } from '../markdown-renderer.js';
import { parseQuestions } from '../engagement/question-parser.js';
import { href } from '../router.js';
import { read } from '../storage.js';
import * as history from '../history.js';

const FACTS_URL = 'metadata/buddy-facts.json';
const MILESTONES = [5, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500];

const LINES = {
  quizOffer: {
    gentle: 'Would you like a quick question from {topic}?',
    playful: 'Pop quiz! Want a quick one from {topic}?',
    curious: 'I wonder if you remember this one from {topic}. Want to try?',
  },
  correct: { gentle: 'That’s right.', playful: 'Yes! Spot on.', curious: 'Correct — nicely reasoned.' },
  wrong: {
    gentle: 'Not quite — the answer is {letter}.',
    playful: 'Close one! The answer is {letter}.',
    curious: 'Interesting choice — the answer is {letter}.',
  },
  completed: {
    gentle: '{topic} — completed. Well done.',
    playful: '{topic} done! High five!',
    curious: 'You finished {topic}. What will you explore next?',
  },
  growth: {
    gentle: '{n} topics completed — my sprout grew {what}.',
    playful: '{n} topics done and look — {what}!',
    curious: '{n} topics completed. Something new is growing: {what}.',
  },
  milestone: {
    gentle: 'That’s {n} topics completed in total. Lovely, steady work.',
    playful: '{n} topics completed! Look at you go!',
    curious: '{n} topics completed so far. Which one surprised you most?',
  },
  plan: {
    gentle: 'Another plan activity ticked off.',
    playful: 'Plan activity done — tick!',
    curious: 'One more step of your plan done.',
  },
  welcome: {
    gentle: 'Welcome back. Last time you were studying {topic}.',
    playful: 'Hey, welcome back! Last time it was {topic}.',
    curious: 'Welcome back! Still curious about {topic}?',
  },
  factIntro: { gentle: 'A small fact', playful: 'Fun fact!', curious: 'Did you know?' },
  noQuiz: 'I couldn’t find a multiple-choice question from the topics you’ve studied yet. Complete a topic with a practice set and ask me again.',
  menu: 'Hi! What would you like?',
};

function line(name, personality, values = {}) {
  const entry = LINES[name];
  const text = typeof entry === 'string' ? entry : entry[personality] || entry.playful;
  return text.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

/**
 * deps: { motion, own, settings(), isActive(), canPrompt(), anchorBox(), onOpenSettings(),
 *         memory: { asked: Set, facts: Set, welcomed } — kept for the whole page session,
 *         so turning Buddy off and on does not repeat questions or facts }
 */
export function createCompanion(deps) {
  const { own } = deps;
  let bubble = null;
  let closeTimer = 0;
  let returnFocus = null;
  let quizLoading = 0; // token: a newer request or teardown cancels an older one
  const askedQuestions = deps.memory.asked;
  const shownFacts = deps.memory.facts;
  let facts = null;
  let completedIds = completedSet();
  let plansDone = planTicks();
  let lastSpontaneous = 0;

  // ---- Bubble ----------------------------------------------------------------------

  function open(kind, content, { focus = false, autoCloseMs = 0 } = {}) {
    close({ restoreFocus: false });
    if (focus) returnFocus = document.activeElement;
    const closeBtn = el('button', { type: 'button', class: 'icon-btn buddy-bubble-close', 'aria-label': 'Dismiss Buddy message' }, icon('close', 16));
    closeBtn.addEventListener('click', () => close());
    bubble = el('aside', { class: 'buddy-bubble', 'aria-label': 'StudyHub Buddy', 'data-kind': kind },
      el('div', { class: 'buddy-bubble-head' }, el('span', { class: 'buddy-bubble-title' }, 'StudyHub Buddy'), closeBtn),
      el('div', { class: 'buddy-bubble-body' }, content));
    bubble.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    });
    // Pointer or focus inside: keep it open while the learner reads.
    bubble.addEventListener('pointerenter', holdOpen);
    bubble.addEventListener('focusin', holdOpen);
    document.body.append(bubble);
    position();
    if (autoCloseMs) closeTimer = own.setTimeout(() => close({ restoreFocus: false }), autoCloseMs);
    if (focus) (bubble.querySelector('.buddy-bubble-body button, .buddy-bubble-body a') || closeBtn).focus({ preventScroll: true });
    return bubble;
  }

  function holdOpen() {
    if (closeTimer) {
      own.clearTimeout(closeTimer);
      closeTimer = 0;
    }
  }

  function close({ restoreFocus = true } = {}) {
    quizLoading++;
    holdOpen();
    if (!bubble) return false;
    const hadFocus = bubble.contains(document.activeElement);
    bubble.remove();
    bubble = null;
    if (deps.motion.state === 'thinking') deps.motion.perform('idle');
    if (restoreFocus && hadFocus && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
    return true;
  }

  /** Place the bubble next to Buddy, inside the viewport, never under the header. */
  function position() {
    if (!bubble) return;
    const box = deps.anchorBox();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const headerBottom = document.getElementById('app-header')?.getBoundingClientRect().bottom || 0;
    const width = bubble.offsetWidth;
    const height = bubble.offsetHeight;
    const cx = (box.left + box.right) / 2;
    let left = Math.round(Math.min(vw - width - 8, Math.max(8, cx - width / 2)));
    let top = Math.round(box.top - height - 12);
    let side = 'above';
    if (top < headerBottom + 8) {
      // No room above (Buddy high on the sidebar): sit to its right instead.
      left = Math.round(Math.min(vw - width - 8, box.right + 12));
      top = Math.round(Math.max(headerBottom + 8, Math.min(vh - height - 8, box.top - 8)));
      side = 'beside';
    }
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
    bubble.dataset.side = side;
    bubble.style.setProperty('--tail-x', `${Math.round(Math.min(width - 18, Math.max(18, cx - left)))}px`);
  }

  // ---- Quiz ------------------------------------------------------------------------

  /** Topics to draw questions from: completed first, then ones studied recently. */
  function sourceTopics() {
    const progress = read('progress', {});
    const completed = [];
    const studied = [];
    for (const [id, record] of Object.entries(progress && typeof progress === 'object' ? progress : {})) {
      const topic = getTopic(id);
      if (!topic || !topic.files?.includes('practice.md')) continue;
      (record?.status === 'completed' ? completed : studied).push(topic);
    }
    for (const entry of history.recentTopics(20)) {
      const topic = getTopic(entry.id);
      if (topic?.files?.includes('practice.md') && !completed.includes(topic) && !studied.includes(topic)) studied.push(topic);
    }
    return [...shuffle(completed), ...shuffle(studied)];
  }

  /** A short multiple-choice item that reads well in a small bubble. */
  function fits(item) {
    if (!item.options || !item.correct || item.options.length < 2 || item.options.length > 5) return false;
    if (item.body.some((n) => n.nodeType === 1 && (n.matches('pre, table, figure, img, .table-wrap, .code-block') || n.querySelector('pre, table, img')))) return false;
    if (item.options.some((o) => o.node.querySelector('pre, table, img') || o.node.textContent.trim().length > 110)) return false;
    return questionText(item).length <= 320;
  }

  function questionText(item) {
    const text = item.body.map((n) => n.textContent.trim()).filter(Boolean).join(' ');
    return text || item.title;
  }

  async function findQuestion(token) {
    for (const topic of sourceTopics().slice(0, 8)) {
      const path = `${topicDir(topic)}practice.md`;
      let rendered;
      try {
        rendered = renderMarkdown(await fetchText(path), { sourcePath: path, dropTitle: true });
      } catch {
        continue; // missing file: try the next topic
      }
      if (token !== quizLoading) return null;
      const items = parseQuestions(rendered.node).items.filter((i) => fits(i) && !askedQuestions.has(`${topic.id}|${i.num}`));
      if (items.length) return { topic, item: items[Math.floor(Math.random() * items.length)] };
    }
    return null;
  }

  async function offerQuiz({ userAsked = false } = {}) {
    const token = ++quizLoading;
    if (userAsked) deps.motion.perform('think');
    const found = await findQuestion(token);
    if (token !== quizLoading || !deps.isActive()) return false;
    if (!found) {
      if (userAsked) open('info', el('p', {}, LINES.noQuiz), { focus: true });
      else if (deps.motion.state === 'thinking') deps.motion.perform('idle');
      return false;
    }
    const personality = deps.settings().personality;
    if (userAsked) {
      showQuestion(found, { focus: true });
      return true;
    }
    deps.motion.perform('think');
    const yes = el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Yes, ask me');
    const no = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Not now');
    yes.addEventListener('click', () => showQuestion(found, { focus: true }));
    no.addEventListener('click', () => close());
    open('quiz-offer', [
      el('p', {}, line('quizOffer', personality, { topic: found.topic.title })),
      el('div', { class: 'buddy-bubble-actions' }, yes, no),
    ], { autoCloseMs: 25_000 });
    announce('StudyHub Buddy offers an optional quiz question.');
    return true;
  }

  function showQuestion({ topic, item }, { focus }) {
    askedQuestions.add(`${topic.id}|${item.num}`);
    const personality = deps.settings().personality;
    const feedback = el('div', { class: 'buddy-quiz-feedback', 'aria-live': 'polite' });
    const optionButtons = item.options.map((option) => {
      const button = el('button', { type: 'button', class: 'buddy-quiz-option', 'data-letter': option.letter },
        el('span', { class: 'buddy-quiz-letter' }, `${option.letter})`),
        el('span', { class: 'buddy-quiz-text' }, option.node.textContent.trim()),
        el('span', { class: 'buddy-quiz-mark' }));
      button.addEventListener('click', () => answer(option.letter));
      return button;
    });

    function answer(letter) {
      const right = letter === item.correct;
      for (const button of optionButtons) {
        button.disabled = true;
        const mark = button.querySelector('.buddy-quiz-mark');
        if (button.dataset.letter === item.correct) {
          button.classList.add('is-correct');
          mark.textContent = 'Correct answer';
        } else if (button.dataset.letter === letter) {
          button.classList.add('is-wrong');
          mark.textContent = 'Your answer';
        }
      }
      const explanation = explain(item);
      const anchor = item.titleNode?.id;
      const review = el('a', { class: 'buddy-quiz-link', href: href(['t', topic.id, 'practice'], anchor ? { s: anchor } : undefined) },
        `Review ${item.num} in ${topic.title}`);
      review.addEventListener('click', () => close({ restoreFocus: false }));
      const done = el('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, 'Close');
      done.addEventListener('click', () => close());
      feedback.replaceChildren(
        el('p', { class: `buddy-quiz-result ${right ? 'is-right' : 'is-wrong'}` },
          icon(right ? 'check' : 'info', 16), line(right ? 'correct' : 'wrong', personality, { letter: item.correct })),
        explanation ? el('p', { class: 'buddy-quiz-explain' }, explanation.length > 260 ? `${explanation.slice(0, 257).trimEnd()}…` : explanation) : null,
        el('div', { class: 'buddy-bubble-actions' }, review, done));
      if (right && deps.settings().quiet) {
        // Quiet mode: a small, calm reaction, and the drooping leaf perks up for a moment.
        deps.motion.perform('pleased');
        deps.motion.perk();
      } else if (right) deps.motion.perform('celebrate');
      else if (!deps.motion.perform('worry')) deps.motion.express('concerned', 1800, 2); // a sweat drop, never a scolding
      if (bubble?.contains(document.activeElement) || focus) done.focus({ preventScroll: true });
      position();
    }

    open('quiz', [
      el('p', { class: 'buddy-quiz-source' }, `${topic.title} · Practice ${item.num}`),
      el('p', { class: 'buddy-quiz-question' }, questionText(item)),
      el('div', { class: 'buddy-quiz-options', role: 'group', 'aria-label': 'Answer options' }, optionButtons),
      feedback,
    ], { focus });
    if (deps.motion.state !== 'thinking') deps.motion.perform('think');
  }

  // ---- Facts -----------------------------------------------------------------------

  async function showFact({ userAsked = false } = {}) {
    const token = ++quizLoading;
    try {
      facts = facts || (await fetchJson(FACTS_URL)).facts.filter((f) => f && typeof f.text === 'string');
    } catch {
      facts = [];
    }
    if (token !== quizLoading || !deps.isActive()) return false;
    let pool = facts.filter((f) => !shownFacts.has(f.id));
    if (!pool.length && userAsked) {
      shownFacts.clear();
      pool = facts;
    }
    if (!pool.length) return false;
    const fact = pool[Math.floor(Math.random() * pool.length)];
    shownFacts.add(fact.id);
    const personality = deps.settings().personality;
    open('fact', [
      el('p', { class: 'buddy-bubble-eyebrow' }, line('factIntro', personality)),
      el('p', {}, fact.text),
    ], { focus: userAsked, autoCloseMs: userAsked ? 0 : 14_000 });
    if (!userAsked) announce(`StudyHub Buddy: ${fact.text}`);
    deps.motion.perform('look');
    deps.motion.express('wink', 1100, 2); // a knowing wink as the fact appears
    return true;
  }

  // ---- Encouragement from real events ------------------------------------------------

  function say(kind, text, { action } = {}) {
    if (!deps.canPrompt({ spontaneous: true })) return false;
    lastSpontaneous = Date.now();
    open(kind, [el('p', {}, text), action ? el('div', { class: 'buddy-bubble-actions' }, action) : null], { autoCloseMs: 9_000 });
    announce(`StudyHub Buddy: ${text}`);
    return true;
  }

  /** studyhub:change — compare with what was true before; only real changes count. */
  /**
   * key: the storage key that changed. growth: { from, to } when the sprout's
   * stage really rose with this change (worked out by buddy.js from the store).
   */
  function onDataChange(key, growth = null) {
    const s = deps.settings();
    if (key === 'progress') {
      const now = completedSet();
      const fresh = [...now].filter((id) => !completedIds.has(id));
      completedIds = now;
      if (fresh.length !== 1) return; // a restore or bulk change is not a moment to cheer
      // Message first: say() only speaks while Buddy is resting, and celebrating is not resting.
      if (s.motivation) {
        const topic = getTopic(fresh[0]);
        if (growth) say('motivation', line('growth', s.personality, { n: completedTopicCount(), what: GROWTH_NAMES[growth.to] }));
        else if (MILESTONES.includes(now.size)) say('motivation', line('milestone', s.personality, { n: now.size }));
        else if (topic) say('motivation', line('completed', s.personality, { topic: topic.title }));
      }
      deps.motion.perform('celebrate', { mood: growth ? 'sparkle' : undefined });
    } else if (key === 'plans') {
      const ticks = planTicks();
      const more = ticks > plansDone;
      plansDone = ticks;
      if (more && s.motivation && Date.now() - lastSpontaneous > 60_000) say('motivation', line('plan', s.personality));
    }
  }

  /** Once per page load: a gentle welcome after a break of three days or more. */
  function maybeWelcome() {
    if (deps.memory.welcomed || !deps.settings().motivation) return false;
    deps.memory.welcomed = true;
    const last = history.list()[0];
    const at = last ? Date.parse(last.at) : NaN;
    if (Number.isNaN(at) || Date.now() - at < 3 * 24 * 3600 * 1000) return false;
    const topic = last.kind === 'topic' ? getTopic(last.id) : null;
    if (!topic) return false;
    const go = el('a', { class: 'btn btn-secondary btn-sm', href: href(['t', topic.id]) }, 'Continue');
    go.addEventListener('click', () => close({ restoreFocus: false }));
    return say('motivation', line('welcome', deps.settings().personality, { topic: topic.title }), { action: go });
  }

  /** Buddy was clicked or tapped: a tiny menu of things it can do. */
  function showMenu() {
    const quiz = el('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, 'Quiz me');
    const fact = el('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, 'Tell me a fact');
    const settingsBtn = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Buddy settings');
    quiz.addEventListener('click', () => offerQuiz({ userAsked: true }));
    fact.addEventListener('click', () => showFact({ userAsked: true }));
    settingsBtn.addEventListener('click', () => { close({ restoreFocus: false }); deps.onOpenSettings(); });
    open('menu', [el('p', {}, LINES.menu), el('div', { class: 'buddy-bubble-actions' }, quiz, fact, settingsBtn)], { autoCloseMs: 12_000 });
  }

  return {
    offerQuiz,
    showFact,
    showMenu,
    maybeWelcome,
    onDataChange,
    close,
    position,
    isOpen: () => Boolean(bubble),
    kind: () => bubble?.dataset.kind || null,
    element: () => bubble,
    lastSpontaneous: () => lastSpontaneous,
    markSpontaneous() { lastSpontaneous = Date.now(); },
    destroy() {
      close({ restoreFocus: false });
    },
  };
}

/**
 * The explanation from the answer panel, without the "Answer: C) …" line (the
 * result line already says it) and without a leading "Explanation:" label.
 */
function explain(item) {
  const panel = item.answers[0]?.content;
  if (!panel) return '';
  const blocks = panel.children.length ? [...panel.children] : [panel];
  return blocks.map((n) => n.textContent.replace(/\s+/g, ' ').trim())
    .filter((text) => text && !(/^Answers?\s*:/i.test(text) && text.length <= 80))
    .join(' ')
    .replace(/^Explanation\s*:\s*/i, '');
}

const GROWTH_NAMES = ['', 'a second leaf', 'a bud', 'a flower'];

/**
 * Unique completed topics that exist in the catalogs: the number the sprout
 * grows from. Read from the real progress store every time — no own counter.
 */
export function completedTopicCount() {
  let n = 0;
  for (const id of completedSet()) if (getTopic(id)) n++;
  return n;
}

function completedSet() {
  const progress = read('progress', {});
  return new Set(Object.entries(progress && typeof progress === 'object' ? progress : {})
    .filter(([, record]) => record?.status === 'completed').map(([id]) => id));
}

function planTicks() {
  const plans = read('plans', null)?.plans;
  if (!Array.isArray(plans)) return 0;
  return plans.reduce((sum, p) => sum + (p?.done && typeof p.done === 'object' ? Object.keys(p.done).length : 0), 0);
}

