// Engagement engine: finds the interactions registered for a topic, places
// them inside the rendered lesson, and loads each module only when it scrolls
// near the viewport.
//
// Interaction types → module:
//   knowledge-check, flashcards, comparison   js/engagement/<type>.js   (data in the registry JSON)
//   visualizer                                js/visualizers/<module>.js
//   simulator                                 js/simulators/<module>.js
//
// Every module exports  mount(root, { interaction, options, topic })  and may
// return { destroy() } for cleanup (timers, observers, WebGL contexts).

import { el, icon } from '../util.js';

const TYPE_LABELS = {
  'knowledge-check': 'Knowledge check',
  flashcards: 'Flashcards',
  comparison: 'Interactive comparison',
  visualizer: 'Visualizer',
  simulator: 'Simulation',
};

const SAFE_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const active = new Set();
let observer = null;

function loadModule(interaction) {
  const { type } = interaction;
  if (type === 'knowledge-check') return import('./knowledge-check.js');
  if (type === 'flashcards') return import('./flashcards.js');
  if (type === 'comparison') return import('./comparison.js');
  const name = interaction.module || interaction.id;
  if (!SAFE_ID.test(name)) return Promise.reject(new Error(`Invalid module name "${name}".`));
  if (type === 'visualizer') return import(`../visualizers/${name}.js`);
  if (type === 'simulator') return import(`../simulators/${name}.js`);
  return Promise.reject(new Error(`Unknown interaction type "${type}".`));
}

export function typeLabel(type) {
  return TYPE_LABELS[type] || 'Interactive';
}

/** The framed box every interaction lives in. */
export function createShell(interaction, { headingLevel = 3 } = {}) {
  const body = el('div', { class: 'interaction-body' }, el('p', { class: 'muted' }, 'Loading interactive exercise…'));
  const shell = el('section', {
    class: `interaction interaction-${interaction.type}`,
    id: `try-${interaction.id}`,
    'aria-labelledby': `try-${interaction.id}-title`,
  },
  el('header', { class: 'interaction-header' },
    el('span', { class: 'interaction-badge' }, icon('spark', 14), typeLabel(interaction.type)),
    el(`h${headingLevel}`, { class: 'interaction-title', id: `try-${interaction.id}-title` }, interaction.title),
    interaction.description ? el('p', { class: 'interaction-desc' }, interaction.description) : null),
  body);
  return { shell, body };
}

/** Load and mount one interaction into its shell body. Errors stay inside the box. */
export async function mountInto(body, interaction, { options = {}, topic = null } = {}) {
  try {
    const module = await loadModule(interaction);
    body.replaceChildren();
    const instance = module.mount(body, { interaction, options, topic }) || {};
    active.add(instance);
    return instance;
  } catch (error) {
    console.warn(`Interaction "${interaction.id}" failed to load:`, error);
    body.replaceChildren(el('p', { class: 'notice notice-warning', role: 'status' },
      'This interactive exercise could not be loaded. The lesson above covers the same material.'));
    return null;
  }
}

/** Mount when the shell is about to scroll into view (saves work on long lessons). */
function mountWhenVisible(body, interaction, context) {
  if (!('IntersectionObserver' in window)) {
    mountInto(body, interaction, context);
    return;
  }
  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const pending = entry.target.__pendingMount;
        delete entry.target.__pendingMount;
        if (pending) pending();
      }
    }, { rootMargin: '400px 0px' });
  }
  body.__pendingMount = () => mountInto(body, interaction, context);
  observer.observe(body);
}

const FALLBACK_ANCHORS = ['Common Mistakes', 'Common Misconceptions', 'Key Takeaways', 'Revision', 'Quick Revision'];

/**
 * Insert the topic's interactions into the lesson DOM.
 * `items` = [{ interaction, placement }] from content-loader.interactionsForTopic.
 * Returns the shells (for an "In this lesson" summary).
 */
export function placeInLesson(article, items, topic) {
  const h2s = [...article.querySelectorAll('h2')];
  const shells = [];
  for (const { interaction, placement } of items) {
    const { shell, body } = createShell(interaction);
    const target = findSectionEnd(article, h2s, placement.after);
    if (target) article.insertBefore(shell, target);
    else article.append(shell);
    mountWhenVisible(body, interaction, { options: placement.options || {}, topic });
    shells.push({ interaction, shell });
  }
  return shells;
}

/** The node an interaction should be inserted before (null = append at the end). */
function findSectionEnd(article, h2s, after) {
  const normalize = (s) => s.toLowerCase().replace(/[`*_]/g, '').trim();
  if (after) {
    const i = h2s.findIndex((h) => normalize(h.textContent) === normalize(after));
    if (i !== -1) return h2s[i + 1] || null;
  }
  // No anchor (or it was renamed): before the closing sections, else at the end.
  for (const name of FALLBACK_ANCHORS) {
    const h = h2s.find((x) => normalize(x.textContent) === normalize(name));
    if (h) return h;
  }
  return null;
}

/** Views register other long-lived widgets (sessions, 3D scenes) for cleanup. */
export function track(instance) {
  if (instance) active.add(instance);
  return instance;
}

/** Called on every route change: stop timers and release resources. */
export function destroyAll() {
  for (const instance of active) {
    try { instance.destroy?.(); } catch { /* a broken cleanup must not block navigation */ }
  }
  active.clear();
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}
