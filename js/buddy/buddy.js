// StudyHub Buddy: lifecycle and wiring.
//
// initBuddy() runs once at boot. Buddy itself exists only while enabled:
// enable() builds the DOM, the world model, the motion engine and the
// companion, and registers every listener, timer and observer through one
// "owner"; disable() disposes that owner, so nothing of Buddy keeps running
// (no loop, no timers, no observers, no listeners, no DOM). Re-enabling builds
// everything fresh from the saved settings.
//
// Buddy is decorative (aria-hidden) and never in the tab order. Everything it
// offers is also reachable from the header menu → StudyHub Buddy dialog.
//
// Test hooks: load the app with ?buddy-debug in the URL (before the #) and
// window.__studyhubBuddy exposes state, traces and resource counts.

import { el, isTypingTarget } from '../util.js';
import { parse } from '../router.js';
import { onExternalChange } from '../storage.js';
import * as settings from './settings.js';
import { createCharacter } from './character.js';
import { createWorld } from './world.js';
import { createMotion, RESTING } from './motion.js';
import { createCompanion } from './companion.js';

const DEBUG = new URLSearchParams(window.location.search).has('buddy-debug');
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
const SMALL = window.matchMedia('(max-width: 479px)');

const MOVE_INTERVAL = { low: [32, 65], normal: [12, 26], high: [5, 12] }; // seconds between idle activities
const CLIMB_COOLDOWN = { low: 150, normal: 45, high: 20 }; // seconds
const QUIZ_INTERVAL = { occasionally: 16, balanced: 8, frequently: 3.5 }; // minutes
const FACT_INTERVAL = 9; // minutes
const SPONTANEOUS_GAP = 3 * 60_000; // at most one unprompted bubble per 3 minutes
const SLEEP_AFTER = 4 * 60_000;
const ACTIVITY_WEIGHTS = {
  gentle: { wander: 3, sit: 4, look: 2, climb: 1, hop: 0.3, think: 0.6 },
  playful: { wander: 3, sit: 1.5, look: 1.5, climb: 3, hop: 2, think: 0.4 },
  curious: { wander: 3, sit: 1, look: 4, climb: 2.5, hop: 0.6, think: 1.5 },
};

const sessionMemory = { asked: new Set(), facts: new Set(), welcomed: false };
const lifetime = { enables: 0, disables: 0, inits: 0 };
let instance = null;
let openSettings = () => {};

export function initBuddy({ onOpenSettings } = {}) {
  if (lifetime.inits++) return; // boot calls this once; a second call must not double-register
  if (onOpenSettings) openSettings = onOpenSettings;
  settings.onChange(applySettings);
  onExternalChange((key) => { if (key === settings.STORAGE_KEY) settings.reloadFromStorage(); });
  if (settings.get().enabled) enable();
  if (DEBUG) window.__studyhubBuddy = debugApi();
}

export function isEnabled() {
  return Boolean(instance);
}

/** User asked from the settings dialog: quiz or fact right now (moves focus into the bubble). */
export function ask(kind) {
  if (!instance) return false;
  return kind === 'quiz' ? instance.companion.offerQuiz({ userAsked: true }) : instance.companion.showFact({ userAsked: true });
}

function applySettings(next, previous) {
  if (next.enabled && !instance) enable();
  else if (!next.enabled && instance) disable();
  else if (instance) instance.update(next, previous);
}

// ---- Resource owner ----------------------------------------------------------------

function createOwner() {
  const timers = new Set();
  const listeners = [];
  const observers = [];
  const media = [];
  return {
    setTimeout(fn, ms) {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    },
    clearTimeout(id) {
      if (!id) return;
      window.clearTimeout(id);
      timers.delete(id);
    },
    listen(target, type, fn, options) {
      target.addEventListener(type, fn, options);
      listeners.push([target, type, fn, options]);
    },
    onMedia(query, fn) {
      query.addEventListener('change', fn);
      media.push([query, fn]);
    },
    observe(observer) {
      observers.push(observer);
      return observer;
    },
    dispose() {
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
      for (const [target, type, fn, options] of listeners) target.removeEventListener(type, fn, options);
      listeners.length = 0;
      for (const [query, fn] of media) query.removeEventListener('change', fn);
      media.length = 0;
      for (const observer of observers) observer.disconnect();
      observers.length = 0;
    },
    counts: () => ({ timers: timers.size, listeners: listeners.length + media.length, observers: observers.length }),
  };
}

// ---- Enable / disable ---------------------------------------------------------------

function enable() {
  if (instance) return;
  lifetime.enables++;
  const own = createOwner();
  let current = settings.get();

  const size = () => (SMALL.matches ? 38 : 44);
  const container = el('div', { class: 'buddy', 'aria-hidden': 'true', 'data-state': 'idle' });
  const inner = el('div', { class: 'buddy-inner' });
  const character = createCharacter();
  character.applyAppearance(current);
  const zzz = el('span', { class: 'buddy-zzz' }, el('span', {}, 'z'), el('span', {}, 'z'));
  const hit = el('div', { class: 'buddy-hit' });
  inner.append(character.root, zzz);
  container.append(inner, hit);
  const shadow = el('div', { class: 'buddy-shadow', 'aria-hidden': 'true' });
  document.body.append(shadow, container);
  function applySize() {
    for (const node of [container, shadow]) node.style.setProperty('--buddy-size', `${size()}px`);
  }
  applySize();

  const isReduced = () => REDUCED.matches || current.motion === 'reduced';
  let companion = null;
  const isBuddyNode = (node) => container.contains(node) || node === shadow || Boolean(companion?.element()?.contains(node));
  const world = createWorld({ size, isBuddyNode });
  const motion = createMotion({
    world, character, own,
    el: { container, inner, shadow },
    isReduced,
    personality: () => current.personality,
    emit: onMotionEvent,
    debug: DEBUG,
  });
  companion = createCompanion({
    motion, own,
    settings: () => current,
    isActive: () => instance !== null && instance.own === own,
    canPrompt,
    anchorBox: () => motion.box(),
    onOpenSettings: () => openSettings(),
    memory: sessionMemory,
  });

  let nextTimer = 0;
  let checkTimer = 0;
  let lastInput = Date.now();
  let lastKey = 0;
  let lastClimb = 0;
  const started = Date.now();
  let lastQuiz = started;
  let lastFact = started;

  // ---- Scheduling ----

  function scheduleNext(ms) {
    own.clearTimeout(nextTimer);
    nextTimer = own.setTimeout(tick, ms);
  }

  function randomInterval() {
    const [lo, hi] = MOVE_INTERVAL[current.movement];
    const quietFactor = current.quiet ? 2.5 : 1;
    return (lo + Math.random() * (hi - lo)) * 1000 * quietFactor;
  }

  function tick() {
    nextTimer = 0;
    if (document.hidden) return; // visibilitychange reschedules
    if (motion.state === 'sleeping') return; // input wakes Buddy and reschedules
    if (Date.now() - lastInput > SLEEP_AFTER && motion.isResting() && !companion.isOpen()) {
      motion.perform('sleep');
      return; // input wakes Buddy and reschedules
    }
    if (!motion.isResting() || companion.isOpen() || userBusy()) {
      scheduleNext(5000);
      return;
    }
    if (maybePrompt()) {
      scheduleNext(randomInterval());
      return;
    }
    if (!isReduced() && !current.quiet) pickActivity();
    scheduleNext(randomInterval());
  }

  function pickActivity() {
    const w = world.get();
    const weights = { ...ACTIVITY_WEIGHTS[current.personality] };
    const climbReady = w.wall.valid && Date.now() - lastClimb > CLIMB_COOLDOWN[current.movement] * 1000;
    if (!climbReady) delete weights.climb;
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (const [kind, weight] of Object.entries(weights)) {
      roll -= weight;
      if (roll > 0) continue;
      if (kind === 'climb') lastClimb = Date.now();
      if (!motion.perform(kind)) motion.perform('look');
      return;
    }
  }

  /** Optional prompts, each with its own cooldown and a shared gap. */
  function maybePrompt() {
    if (!canPrompt({ spontaneous: true })) return false;
    const now = Date.now();
    if (now - companion.lastSpontaneous() < SPONTANEOUS_GAP) return false;
    if (now - lastQuiz > QUIZ_INTERVAL[current.quiz] * 60_000) {
      lastQuiz = now;
      companion.markSpontaneous();
      companion.offerQuiz();
      return true;
    }
    if (current.facts && now - lastFact > FACT_INTERVAL * 60_000) {
      lastFact = now;
      companion.markSpontaneous();
      companion.showFact();
      return true;
    }
    return false;
  }

  function userBusy() {
    return Date.now() - lastKey < 8000 || isTypingTarget(document.activeElement);
  }

  /** Is it OK to show a bubble now? The learner's work always wins. */
  function canPrompt({ spontaneous = false } = {}) {
    if (!instance || document.hidden) return false;
    if (spontaneous && current.quiet) return false;
    if (document.querySelector('dialog[open]')) return false;
    if (!document.getElementById('app-menu-list')?.hidden) return false;
    if (document.body.classList.contains('nav-open')) return false;
    if (userBusy()) return false;
    const active = document.activeElement;
    if (active?.closest?.('.interaction, .quiz, form, .galaxy-stage')) return false;
    if (spontaneous) {
      const [first, , tab, edit] = parse().segments;
      if (first === 'session') return false;
      if (first === 't' && ['practice', 'interview-questions', 'flashcards'].includes(tab)) return false;
      if (first === 'plans' && (parse().segments[1] === 'new' || edit === 'edit')) return false;
      if (!motion.isResting() || motion.isOnWall()) return false;
    }
    return true;
  }

  // Blinking is a face layer on top of the body state: a class for 130 ms every few seconds.
  let blinkTimer = 0;
  const BLINKS = new Set(['idle', 'sitting', 'thinking', 'gripping', 'looking', 'walking', 'climbing']);
  function scheduleBlink() {
    own.clearTimeout(blinkTimer);
    blinkTimer = own.setTimeout(() => {
      blinkTimer = 0;
      if (document.hidden) return; // visibilitychange restarts it
      if (!isReduced() && BLINKS.has(motion.state)) {
        container.classList.add('is-blink');
        own.setTimeout(() => container.classList.remove('is-blink'), 130);
      }
      scheduleBlink();
    }, 2400 + Math.random() * 3800);
  }

  // ---- Obstruction ----

  /**
   * After Buddy stops somewhere (or the page under it changed): move off
   * anything essential. The click/tap area is switched on only here, when the
   * spot is verified clear, so Buddy can never swallow a click meant for content.
   */
  function checkSpot(delay = 0) {
    own.clearTimeout(checkTimer);
    checkTimer = own.setTimeout(() => {
      checkTimer = 0;
      if (!motion.isResting() || companion.isOpen() || document.querySelector('dialog[open]')) return;
      const hits = world.obstruction(motion.box());
      const clear = hits === 0 && !motion.body.peek;
      container.classList.toggle('is-clickable', clear);
      if (clear) return;
      // Something is covered, or Buddy is ducking where a clear spot may now exist.
      if (isReduced()) {
        if (hits > 0 && !motion.body.peek) motion.placeCalmly(motion.body.x); // instant, no walking
      } else motion.perform('avoid');
    }, delay);
  }

  function onMotionEvent(type, detail) {
    if (type === 'state') {
      container.classList.remove('is-clickable'); // re-enabled by checkSpot once the new spot is verified clear
      if (detail.to === 'slipping' || detail.to === 'knocked') companion?.close({ restoreFocus: false });
      if (detail.from === 'recovering' || detail.from === 'landing' || detail.from === 'dismounting' || detail.from === 'walking') checkSpot(60);
      else if (RESTING.has(detail.to)) checkSpot(250);
      if (detail.to === 'idle' && companion?.isOpen()) companion.position();
    }
    if (type === 'rest' && !nextTimer && !document.hidden && detail.state !== 'sleeping') scheduleNext(randomInterval());
  }

  // ---- Environment ----

  function environmentChanged() {
    world.invalidate();
    motion.reconcile();
    if (companion.isOpen()) companion.position();
  }

  own.listen(document, 'studyhub:sidebar', () => {
    // Opening the drawer or menu means the learner is navigating: no bubble over it.
    if (document.body.classList.contains('nav-open')) companion.close({ restoreFocus: false });
    environmentChanged();
    checkSpot(260);
  });
  own.listen(window, 'resize', () => {
    applySize();
    environmentChanged();
    checkSpot(300);
  });
  own.listen(document, 'studyhub:theme', environmentChanged);
  own.listen(window, 'hashchange', () => {
    companion.close({ restoreFocus: false });
    environmentChanged();
    checkSpot(800); // the new page renders asynchronously
  });
  own.listen(document, 'studyhub:change', (event) => companion.onDataChange(event.detail?.key));
  own.listen(document, 'visibilitychange', () => {
    if (document.hidden) {
      motion.pause();
      own.clearTimeout(nextTimer);
      nextTimer = 0;
      own.clearTimeout(blinkTimer);
      blinkTimer = 0;
    } else {
      scheduleBlink();
      world.invalidate();
      motion.reconcile();
      motion.resume();
      scheduleNext(randomInterval());
    }
  });
  const noteInput = (event) => {
    lastInput = Date.now();
    if (event.type === 'keydown') lastKey = lastInput;
    if (motion.state === 'sleeping') {
      motion.perform('wake');
      scheduleNext(randomInterval());
    }
  };
  own.listen(document, 'pointerdown', noteInput, { capture: true, passive: true });
  own.listen(document, 'keydown', noteInput, { capture: true, passive: true });
  own.listen(window, 'scroll', () => {
    noteInput({ type: 'scroll' }); // reading a long lesson counts as being here
    checkSpot(250);
  }, { passive: true });
  own.listen(document, 'keydown', (event) => {
    // Esc closes Buddy's bubble only when nothing else is using Esc right now.
    if (event.key !== 'Escape' || event.defaultPrevented || !companion.isOpen()) return;
    if (document.querySelector('dialog[open]') || !document.getElementById('app-menu-list')?.hidden) return;
    if (document.body.classList.contains('nav-open') || isTypingTarget(event.target)) return;
    if (!document.getElementById('search-results')?.hidden) return;
    companion.close();
  });

  // Search: Buddy never sits in the results' way and leaves the learner alone while typing.
  const search = document.getElementById('search-input');
  if (search) {
    own.listen(search, 'focus', () => {
      if (companion.isOpen() && !companion.element().contains(document.activeElement)) companion.close({ restoreFocus: false });
      checkSearch();
    });
    own.listen(search, 'input', () => {
      own.clearTimeout(searchTimer);
      searchTimer = own.setTimeout(checkSearch, 400); // once typing pauses, never per keystroke
    });
  }
  let searchTimer = 0;
  function checkSearch() {
    const list = document.getElementById('search-results');
    if (!list || list.hidden) return;
    const r = list.getBoundingClientRect();
    const b = motion.box();
    const overlaps = b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top;
    if (!overlaps) return;
    if (motion.isOnWall()) {
      // Climb back down below the results instead of hanging behind them.
      motion.climbDown();
    } else if (motion.isResting()) {
      motion.perform('avoid', { x: r.left > b.right ? b.left - 80 : r.right + 60 });
    }
  }

  // Dialogs (modal, in the top layer above Buddy) and the header menu: Buddy's bubble steps aside.
  const overlays = own.observe(new MutationObserver(() => {
    const blocking = document.querySelector('dialog[open]') || !document.getElementById('app-menu-list')?.hidden;
    if (blocking && companion.isOpen() && !document.getElementById('buddy-dialog')?.open) companion.close({ restoreFocus: false });
    if (!blocking) checkSpot(200); // a dialog or the menu closed: look again where Buddy sits
    if (blocking && (motion.isResting() || motion.state === 'looking') && motion.state !== 'sitting' && !isReduced()) motion.perform('sit');
  }));
  for (const dialog of document.querySelectorAll('dialog')) overlays.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  const menuPanel = document.getElementById('app-menu-list');
  if (menuPanel) overlays.observe(menuPanel, { attributes: true, attributeFilter: ['hidden'] });

  const onMotionPreference = () => {
    if (isReduced()) motion.placeCalmly(motion.body.x);
    else {
      motion.placeCalmly(motion.body.x);
      scheduleNext(randomInterval());
    }
  };
  own.onMedia(REDUCED, onMotionPreference);
  own.onMedia(SMALL, () => {
    applySize();
    environmentChanged();
  });

  own.listen(hit, 'click', () => {
    if (!motion.isResting()) return;
    motion.perform('interact');
    companion.showMenu();
  });

  instance = {
    own, motion, world, companion, character, container, shadow,
    update(next, previous) {
      current = next;
      character.applyAppearance(next);
      if (next.motion !== previous.motion) onMotionPreference();
      if (next.quiet && !previous.quiet && companion.isOpen() && companion.kind() !== 'quiz') companion.close({ restoreFocus: false });
      if (next.movement !== previous.movement || next.quiet !== previous.quiet) scheduleNext(randomInterval());
    },
    kick: (ms = 100) => scheduleNext(ms), // tests: run the real idle scheduler now
    debug: () => ({
      nextTimer: Boolean(nextTimer), checkTimer: Boolean(checkTimer), lastInput, started,
      settings: current, reduced: isReduced(), size: size(),
    }),
  };

  motion.start();
  scheduleNext(DEBUG ? 3_600_000 : 8000);
  scheduleBlink();
  // A welcome after a long break, once the first page has rendered.
  own.setTimeout(() => { if (canPrompt({ spontaneous: true })) companion.maybeWelcome(); }, 2500);
}

function disable() {
  if (!instance) return;
  lifetime.disables++;
  const { own, motion, companion, container, shadow } = instance;
  instance = null; // first: anything still in flight sees Buddy as gone
  companion.destroy();
  motion.stop();
  own.dispose();
  container.remove();
  shadow.remove();
}

// ---- Test instrumentation (only with ?buddy-debug) -------------------------------------

function debugApi() {
  return {
    snapshot() {
      if (!instance) return { enabled: false, lifetime: { ...lifetime }, domNodes: document.querySelectorAll('.buddy, .buddy-shadow, .buddy-bubble').length };
      return {
        enabled: true,
        ...instance.motion.snapshot(),
        resources: instance.own.counts(),
        bubble: instance.companion.kind(),
        lifetime: { ...lifetime },
        domNodes: document.querySelectorAll('.buddy, .buddy-shadow, .buddy-bubble').length,
        ...instance.debug(),
      };
    },
    trace: () => instance?.motion.trace.slice() || [],
    clearTrace: () => {
      if (!instance) return;
      instance.motion.trace.length = 0;
      instance.motion.transitions.length = 0;
    },
    transitions: () => instance?.motion.transitions.slice() || [],
    setTimeScale: (k) => instance?.motion.setTimeScale(k),
    climb: (from, to) => instance?.motion.climbFromWall(from, to),
    perform: (kind, options) => instance?.motion.perform(kind, options),
    quiz: () => instance?.companion.offerQuiz(),
    quizNow: () => instance?.companion.offerQuiz({ userAsked: true }),
    fact: () => instance?.companion.showFact(),
    menu: () => instance?.companion.showMenu(),
    /** Start the real, randomised idle scheduler (paused under ?buddy-debug so tests are deterministic). */
    kick: (ms) => instance?.kick(ms),
    world: () => (instance ? { ...instance.world.get() } : null),
    obstruction: () => (instance ? instance.world.obstruction(instance.motion.box()) : null),
    box: () => instance?.motion.box(),
    settings,
  };
}
