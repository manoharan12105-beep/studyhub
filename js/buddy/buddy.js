// StudyHub Buddy: lifecycle and wiring.
//
// initBuddy() runs once at boot. Buddy itself exists only while enabled:
// enable() builds the DOM, the world model, the motion engine, the feelings
// (emotion.js) and the companion, and registers every listener, timer and
// observer through one "owner"; disable() disposes that owner, so nothing of
// Buddy keeps running (no loop, no timers, no observers, no listeners, no DOM).
// Re-enabling builds everything fresh from the saved settings.
//
// Buddy is decorative (aria-hidden) and never in the tab order. Everything it
// offers is also reachable from the header menu → StudyHub Buddy dialog.
//
// Privacy: Buddy notices only *that* the learner is typing or using a control
// (the focused element's kind, key presses' timing) — never what is typed, and
// nothing ever leaves the page.
//
// Test hooks: load the app with ?buddy-debug in the URL (before the #) and
// window.__studyhubBuddy exposes state, traces and resource counts.

import { el, isTypingTarget } from '../util.js';
import { parse } from '../router.js';
import { onExternalChange } from '../storage.js';
import * as settings from './settings.js';
import { createCharacter, growthStage, BODY_SHAPES } from './character.js';
import { createWorld } from './world.js';
import { createMotion, RESTING, INTERRUPTIBLE } from './motion.js';
import { createCompanion, completedTopicCount } from './companion.js';
import { createEmotion, classifyFall } from './emotion.js';

const DEBUG = new URLSearchParams(window.location.search).has('buddy-debug');
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
const SMALL = window.matchMedia('(max-width: 479px)');

const MOVE_INTERVAL = { low: [32, 65], normal: [12, 26], high: [5, 12] }; // seconds between idle activities
const CLIMB_COOLDOWN = { low: 150, normal: 45, high: 20 }; // seconds
const QUIZ_INTERVAL = { occasionally: 16, balanced: 8, frequently: 3.5 }; // minutes
const FACT_INTERVAL = { occasionally: 15, balanced: 9, frequently: 5 }; // minutes
const SPONTANEOUS_GAP = 3 * 60_000; // at most one unprompted bubble per 3 minutes
const SLEEP_AFTER = 4 * 60_000;
const ACTIVITY_WEIGHTS = {
  gentle: { wander: 3, sit: 4, look: 2, climb: 1, hop: 0.3, think: 0.6, inspect: 1, shift: 1.5, fidget: 1 },
  playful: { wander: 3, sit: 1.5, look: 1.5, climb: 3, hop: 2, think: 0.4, inspect: 1, shift: 0.8, fidget: 1.4 },
  curious: { wander: 3, sit: 1, look: 4, climb: 2.5, hop: 0.6, think: 1.5, inspect: 2.5, shift: 0.8, fidget: 0.8 },
  sleepy: { wander: 1.5, sit: 5, look: 1, climb: 0.4, hop: 0.2, think: 0.8, inspect: 0.6, shift: 1.5, fidget: 0.6, doze: 3 },
  energetic: { wander: 4, sit: 0.8, look: 1.5, climb: 3, hop: 2.5, think: 0.3, inspect: 1, shift: 0.6, fidget: 1.6 },
  custom: { wander: 3, sit: 2.5, look: 2, climb: 2, hop: 1, think: 0.8, inspect: 1.2, shift: 1, fidget: 1 },
};
// Quiet mode (and active study) keeps only small, calm habits (no wandering, climbing or hopping).
const QUIET_ACTIVITIES = new Set(['sit', 'shift', 'fidget', 'think', 'doze']);
// Idle habits: seconds before the same habit may come again.
const HABIT_COOLDOWN = { inspect: 60, shift: 30, fidget: 45, think: 40, hop: 25, doze: 50 };
const HABIT_KINDS = new Set(['inspect', 'shift', 'fidget', 'think', 'hop', 'doze']);
const SLEEPY_AFTER = 3 * 60_000; // a sleepy face a minute before the yawn
const AWAY_FOR_WAVE = 10 * 60_000; // back after this long hidden: a wave
const WAVE_COOLDOWN = 30 * 60_000;
const RETURN_IDLE = 2 * 60_000; // no input for this long, then input again: a hello (at most every 15 min)
const GREET_COOLDOWN = 15 * 60_000;
const STUDY_LINGER = 45_000; // stay quiet this long after the last sign of active study
// Picking Buddy up.
const DRAG_THRESHOLD = 6; // px the pointer must move before a press becomes a drag (less = a click)
const TOUCH_HOLD_MS = 280; // touch: press and hold this long first, so a swipe still scrolls the page
const GAZE_RANGE = { low: 160, balanced: 240, high: 320 }; // px: the eyes follow a pointer this close
const DUST_POOL = 8; // reused dust particles
// Petting: a pointer stroked back and forth over Buddy (no button pressed), or a tap.
const STROKE_REVERSALS = { low: 3, balanced: 2, high: 1 };
const PAT_VARIANTS = ['nuzzle', 'leafwag', 'giggle', 'wiggle'];
const PAT_COOLDOWN = 2500; // ms: pats closer than this get a smaller reaction

/** A level ("low" | "balanced" | "high") as one of three numbers. */
const by = (level, [lo, mid, hi]) => (level === 'low' ? lo : level === 'high' ? hi : mid);

// Kept for the whole page session (not stored): questions/facts already shown,
// and the last clear resting spot as a fraction of the floor (re-measured on use).
const sessionMemory = { asked: new Set(), facts: new Set(), welcomed: false, spot: null };
const lifetime = { enables: 0, disables: 0, inits: 0 };
let instance = null;
let openSettings = () => {};
let random = Math.random; // tests can inject a fixed sequence (debug setRandom)

export function initBuddy({ onOpenSettings } = {}) {
  if (lifetime.inits++) return; // boot calls this once; a second call must not double-register
  if (onOpenSettings) openSettings = onOpenSettings;
  settings.onChange(applySettings);
  onExternalChange((key) => { if (key === settings.STORAGE_KEY) settings.reloadFromStorage(); });
  if (settings.get().enabled) enable();
  if (DEBUG) window.__studyhubBuddy = debugApi();
}

/**
 * The button alternative to pointer throwing (StudyHub Buddy dialog → Toss
 * Buddy): a gentle toss from where it stands. False when not possible now.
 */
export function toss() {
  if (!instance || !settings.get().interact.toss || settings.isPaused()) return false;
  return instance.motion.toss();
}

/** Rescue Buddy: let go, stop whatever it was doing and stand it on a clear spot. */
export function rescue() {
  return instance ? instance.rescue({ toPreference: false }) : false;
}

/** Reset position: back to the learner's resting preference (ignores the remembered spot). */
export function resetPosition() {
  return instance ? instance.rescue({ toPreference: true }) : false;
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
  const f = () => current.features;

  const size = () => (SMALL.matches ? 38 : 44);
  const shape = () => BODY_SHAPES[current.body] || BODY_SHAPES.classic;
  const container = el('div', { class: 'buddy', 'aria-hidden': 'true', 'data-state': 'idle' });
  const inner = el('div', { class: 'buddy-inner' });
  const character = createCharacter();
  character.applyAppearance(current);
  const zzz = el('span', { class: 'buddy-zzz' }, el('span', {}, 'z'), el('span', {}, 'z'));
  const hit = el('div', { class: 'buddy-hit' });
  const speed = el('span', { class: 'buddy-speed' }, el('span', {}), el('span', {}), el('span', {}));
  inner.append(speed, character.root, zzz);
  container.append(inner, hit);
  const shadow = el('div', { class: 'buddy-shadow', 'aria-hidden': 'true' });
  // Landing dust: a small fixed pool of particles, reused (never created per landing).
  const fx = el('div', { class: 'buddy-fx', 'aria-hidden': 'true' });
  const dust = Array.from({ length: DUST_POOL }, () => el('span', { class: 'buddy-dust' }));
  fx.append(...dust);
  document.body.append(shadow, fx, container);
  function applySize() {
    for (const node of [container, shadow, fx]) node.style.setProperty('--buddy-size', `${size()}px`);
  }
  /** The click/tap area follows the body proportions, so it always matches what is drawn. */
  function applyShape() {
    const { sx, sy } = shape();
    hit.style.inset = `${Math.round(96 - 76 * sy)}% ${Math.round(50 - 36 * sx)}% 4%`;
  }
  applySize();
  applyShape();

  // The system preference is read once and then kept current by its change
  // event. isReduced() runs every frame, and reading REDUCED.matches that often
  // makes Chromium swallow the MediaQueryList change event (Buddy would then
  // keep animating after the learner turns on reduced motion mid-climb).
  // Motion presets: "minimal" is always calm; "full" plays all motion even if the
  // system asks for less (the learner chose it); "system" and "gentle" follow the system.
  let systemReduced = REDUCED.matches;
  const isReduced = () => current.motion === 'minimal' || (current.motion !== 'full' && systemReduced);
  const gentleMotion = () => current.motion === 'gentle';
  const isPaused = () => settings.isPaused(current);
  let companion = null;
  let motion = null;
  const isBuddyNode = (node) => container.contains(node) || node === shadow || Boolean(companion?.element()?.contains(node));
  const world = createWorld({ size, isBuddyNode, shape });
  let satForCry = false; // Buddy sat down for a cry: it stands up again when the feeling is over
  const emotion = createEmotion({
    own, isReduced,
    onChange: () => {
      motion?.refresh();
      if (satForCry && !emotion.current()) {
        satForCry = false;
        if (motion.state === 'sitting') motion.perform('idle');
      }
    },
  });
  motion = createMotion({
    world, character, own,
    el: { container, inner, shadow },
    isReduced,
    personality: () => current.personality,
    emit: onMotionEvent,
    debug: DEBUG,
    random: () => random(),
    emotion,
    tuning: () => ({
      speed: by(current.speed, [0.8, 1, 1.2]) * (gentleMotion() ? 0.85 : 1),
      jumps: by(current.jumps, [0.4, 1, 1.5]) * (gentleMotion() ? 0.3 : 1),
      catching: f().catching,
      nearMiss: f().nearMiss,
      dizzy: f().dizzy,
      fear: f().fear,
      throwOn: current.interact.throw,
      speedLines: f().speedLines,
      particles: f().particles && !current.quiet,
      expression: by(current.expression, [0.65, 1, 1.25]) * (current.quiet ? 0.75 : 1),
    }),
  });
  companion = createCompanion({
    motion, own,
    settings: () => current,
    isActive: () => instance !== null && instance.own === own,
    canPrompt,
    anchorBox: () => motion.box(),
    onOpenSettings: () => openSettings(),
    react,
    blocked: (rect) => world.obstruction(rect),
    memory: sessionMemory,
  });

  // ---- Growth: the sprout follows the learner's completed topics ----
  let growth = growthStage(completedTopicCount());
  character.applyGrowth(growth);
  let growTimer = 0;
  /** Re-read the progress store. Returns { from, to } when the stage rose, else null. */
  function checkGrowth() {
    const next = growthStage(completedTopicCount());
    if (next === growth) return null;
    const rose = next > growth ? { from: growth, to: next } : null;
    growth = next;
    character.applyGrowth(next);
    if (rose && !isReduced()) {
      // The new part grows in (CSS), once, only when a threshold was really crossed.
      container.classList.add('is-growing');
      own.clearTimeout(growTimer);
      growTimer = own.setTimeout(() => container.classList.remove('is-growing'), 1300);
    }
    return rose;
  }
  motion.setLeafDroop(current.quiet);

  let nextTimer = 0;
  let checkTimer = 0;
  let lastInput = Date.now();
  let lastKey = 0;
  let lastClimb = 0;
  let lastStudyAt = 0;
  let lastGreet = 0;
  const started = Date.now();
  let lastQuiz = started;
  let lastFact = started;

  // ---- Scheduling ----

  function scheduleNext(ms) {
    own.clearTimeout(nextTimer);
    nextTimer = 0;
    if (isPaused()) return; // a pause cancels the idle scheduler; resuming restarts it
    nextTimer = own.setTimeout(tick, ms);
  }

  function randomInterval() {
    const [lo, hi] = MOVE_INTERVAL[current.movement];
    const factor = (current.quiet ? 2.5 : 1) * (gentleMotion() ? 1.6 : 1) * (studying() ? 2 : 1);
    return (lo + random() * (hi - lo)) * 1000 * factor;
  }

  /**
   * Never fall asleep while the learner is doing something: typing, a quiz or
   * any bubble, a dialog or the menu, a simulator or interaction in use, or
   * Buddy mid-transition or held.
   */
  function sleepBlocked() {
    if (userBusy() || companion.isOpen()) return true;
    if (document.querySelector('dialog[open]') || !document.getElementById('app-menu-list')?.hidden) return true;
    if (document.activeElement?.closest?.('.interaction, .quiz, .galaxy-stage, form')) return true;
    return !motion.isCalm();
  }

  function tick() {
    nextTimer = 0;
    if (document.hidden || isPaused()) return; // visibilitychange / resuming reschedules
    if (motion.state === 'sleeping') return; // input wakes Buddy and reschedules
    const away = Date.now() - lastInput;
    const sleepAfter = current.personality === 'sleepy' ? SLEEP_AFTER * 0.75 : SLEEP_AFTER;
    if (away > sleepAfter && !sleepBlocked()) {
      motion.perform('sleep'); // yawns first
      return; // input wakes Buddy and reschedules
    }
    if (away > sleepAfter - 60_000 && !sleepBlocked()) motion.express('sleepy', 4000, 1);
    if (studying() && motion.isOnWall()) motion.climbDown(); // active study: off the sidebar, out of the way
    if (!motion.isResting() || companion.isOpen() || userBusy()) {
      scheduleNext(5000);
      return;
    }
    if (maybePrompt()) {
      scheduleNext(randomInterval());
      return;
    }
    if (!isReduced()) pickActivity();
    scheduleNext(randomInterval());
  }

  const habitAt = {}; // kind → Date.now() of its last run
  let lastActivity = '';
  /**
   * Weighted random choice of the next idle activity. A habit on cooldown, or
   * the activity just done, is left out, so Buddy never repeats itself. The
   * learner's levels (jumps, curiosity), motion preset, feature switches and
   * active study all shape the weights; nothing here can move Buddy unsafely.
   */
  function chooseActivity(now = Date.now()) {
    const w = world.get();
    const weights = { ...(ACTIVITY_WEIGHTS[current.personality] || ACTIVITY_WEIGHTS.playful) };
    const curiosity = by(current.curiosity, [0.5, 1, 1.7]);
    for (const kind of ['look', 'inspect', 'climb']) if (weights[kind]) weights[kind] *= curiosity;
    if (weights.hop) weights.hop *= by(current.jumps, [0.3, 1, 2]) * (gentleMotion() ? 0.2 : 1);
    if (weights.climb && gentleMotion()) weights.climb *= 0.4;
    const climbReady = current.interact.explore && w.wall.valid && now - lastClimb > CLIMB_COOLDOWN[current.movement] * 1000;
    if (!climbReady) delete weights.climb;
    if (!f().habits) for (const kind of HABIT_KINDS) delete weights[kind];
    if (!f().glances) delete weights.look;
    for (const [kind, cooldown] of Object.entries(HABIT_COOLDOWN)) if (now - (habitAt[kind] ?? -Infinity) < cooldown * 1000) delete weights[kind];
    if (current.quiet || studying()) for (const kind of Object.keys(weights)) if (!QUIET_ACTIVITIES.has(kind)) delete weights[kind];
    if (Object.keys(weights).length > 1) delete weights[lastActivity];
    if (!Object.keys(weights).length) return 'sit';
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = random() * total;
    for (const [kind, weight] of Object.entries(weights)) {
      roll -= weight;
      if (roll <= 0) return kind;
    }
    return Object.keys(weights).pop() || 'look';
  }
  function commitActivity(kind, now) {
    lastActivity = kind;
    if (kind === 'climb') lastClimb = now;
    if (kind in HABIT_COOLDOWN) habitAt[kind] = now;
  }
  function pickActivity() {
    const kind = chooseActivity();
    commitActivity(kind, Date.now());
    if (kind === 'doze') {
      // Sleepy: a heavy-lidded moment, sitting down.
      if (motion.perform('sit')) emotion.feel('sleepy', { ms: 3500 });
      return;
    }
    const options = kind === 'wander' ? { x: wanderTarget() } : {};
    if (!motion.perform(kind, options) && !current.quiet && f().glances) motion.perform('look');
  }

  /** Where to wander: anywhere, or within the part of the floor the learner prefers Buddy to rest in. */
  function wanderTarget() {
    const { floor } = world.get();
    const span = floor.x1 - floor.x0;
    if (current.rest === 'sidebar') return floor.x0 + random() * span * 0.35;
    if (current.rest === 'corner') return floor.x1 - random() * span * 0.3;
    return floor.x0 + random() * span;
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
    if (current.facts && now - lastFact > FACT_INTERVAL[current.quiz] * 60_000) {
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

  // ---- Focus-aware study: quieter while the learner is working ----

  /**
   * What says "the learner is studying right now": a practice/interview/flashcard
   * session, typing somewhere (search, notes, forms — only the element's kind is
   * checked, never its contents), a simulator, quiz or form in use, or a dialog.
   */
  function studySignal() {
    if (document.querySelector('dialog[open]')) return 'dialog';
    const active = document.activeElement;
    if (isTypingTarget(active)) return 'typing';
    if (active?.closest?.('.interaction, .quiz, form, .galaxy-stage')) return 'interaction';
    const [first, , tab, edit] = parse().segments;
    if (first === 'session') return 'session';
    if (first === 't' && ['practice', 'interview-questions', 'flashcards'].includes(tab)) return 'practice';
    if (first === 'plans' && (parse().segments[1] === 'new' || edit === 'edit')) return 'plan-builder';
    return null;
  }
  /** Active study now, or within the last STUDY_LINGER (focus-aware setting on). */
  function studying() {
    if (!f().focusAware) return false;
    const now = Date.now();
    if (studySignal()) {
      lastStudyAt = now;
      return true;
    }
    return now - lastStudyAt < STUDY_LINGER || now - lastKey < 8000;
  }

  /** Is it OK to show a bubble now? The learner's work always wins. */
  function canPrompt({ spontaneous = false } = {}) {
    if (!instance || document.hidden) return false;
    if (spontaneous && (current.quiet || !f().bubbles || isPaused() || studying())) return false;
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
    blinkTimer = 0;
    if (isPaused()) return;
    blinkTimer = own.setTimeout(() => {
      blinkTimer = 0;
      if (document.hidden) return; // visibilitychange restarts it
      if (!isReduced() && BLINKS.has(motion.state)) {
        container.classList.add('is-blink');
        own.setTimeout(() => container.classList.remove('is-blink'), 130);
      }
      scheduleBlink();
    }, 2400 + random() * 3800);
  }

  // ---- Learning moments: how Buddy shows them (from real events only) ----

  /**
   * kind: 'completed' (a topic completed), 'quiz-correct' / 'quiz-wrong' (Buddy's own
   * question), 'answer-correct' / 'answer-wrong' (a practice or knowledge-check answer
   * recorded by the app). Celebrations follow the learner's switch and intensity;
   * wrong answers get a kind face, never a scolding. Faces only during active study.
   */
  function react(kind, detail = {}) {
    if (!instance || instance.own !== own || isPaused()) return;
    const on = f().celebrations;
    const level = current.quiet ? 'low' : current.celebration;
    switch (kind) {
      case 'completed':
        if (!on) return;
        if (level === 'low') {
          motion.perform('pleased');
          motion.perk();
        } else {
          motion.perform('celebrate', { mood: detail.growth || detail.milestone || level === 'high' ? 'sparkle' : undefined });
          if (level === 'high') motion.perk();
        }
        return;
      case 'quiz-correct':
        if (!on) { emotion.feel('happy', { ms: 1200 }); return; }
        if (level === 'low') {
          // Quiet mode: a small, calm reaction, and the drooping leaf perks up for a moment.
          motion.perform('pleased');
          motion.perk();
        } else motion.perform('celebrate');
        return;
      case 'quiz-wrong':
        if (!motion.perform('worry')) motion.express('concerned', 1800, 2); // a sweat drop, never a scolding
        return;
      case 'answer-correct':
        emotion.feel('happy', { ms: 1300 });
        if (on) motion.perk(); // the leaf perks up
        return;
      case 'answer-wrong':
        emotion.feel('empathetic', { ms: 1500 }); // "that's okay"
        return;
      default:
    }
  }

  // ---- Falls, spins and catches: feelings from what physically happened ----

  let pendingCry = false;
  const emotionScale = () => by(current.emotion, [0.6, 1, 1.3]) * (current.quiet ? 0.7 : 1);
  const recoveryScale = () => by(current.recovery, [0.7, 1, 1.4]);
  let lastLanding = null;

  /**
   * After a real landing: height (how far it fell) and impact (how hard it hit)
   * are judged separately (classifyFall). A long fall frightens, and — if it was
   * very long or ended hard — may bring a short, bounded cry; a hard impact alone
   * dazes (stars) or startles; a small hop is nothing. Dizziness from a spin wins.
   */
  function reactToLanding({ height, impact, size: S }) {
    const c = classifyFall(height, impact, S);
    lastLanding = { ...c, heightPx: Math.round(height), impactPx: Math.round(impact) };
    const rec = recoveryScale();
    const emo = emotionScale();
    pendingCry = false;
    if (motion.body.pendingAfter?.kind === 'wobble') {
      emotion.feel('dizzy', { ms: (motion.body.pendingAfter.duration + 0.9) * 1000 * rec, intensity: emo });
      return;
    }
    if (c.height === 'high' && f().fear) {
      const cry = current.emotion !== 'low' && !current.quiet && (c.impact === 'hard' || c.impact === 'severe' || c.veryHigh);
      pendingCry = cry;
      emotion.feel('frightened', {
        ms: 1300 * rec, intensity: emo,
        then: cry ? { kind: 'crying', ms: 3400 * rec * Math.min(1.2, emo), intensity: emo } : null,
      });
      return;
    }
    if (c.impact === 'severe' && f().dizzy) emotion.feel('dizzy', { ms: 1500 * rec, intensity: 0.8 }); // dazed: stars from a hard knock
    else if (c.impact === 'hard' || c.height === 'moderate') emotion.feel('surprised', { ms: 1100 * rec, intensity: emo });
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
      if (clear) {
        rememberSpot();
        return;
      }
      // Something is covered, or Buddy is ducking where a clear spot may now exist.
      if (isReduced()) {
        if (hits > 0 && !motion.body.peek) motion.placeCalmly(motion.body.x); // instant, no walking
      } else motion.perform('avoid');
    }, delay);
  }

  /** Session-only memory of the last clear resting spot, as a share of the floor (never pixels). */
  function rememberSpot() {
    const { floor } = world.get();
    if (motion.body.surface !== 'floor' || floor.x1 <= floor.x0) return;
    sessionMemory.spot = Math.min(1, Math.max(0, (motion.body.x - floor.x0) / (floor.x1 - floor.x0)));
  }

  /** Where Buddy prefers to rest now: the remembered spot (if allowed), else the resting preference. */
  function preferredX({ toPreference = false } = {}) {
    const w = world.get();
    const { floor } = w;
    if (!toPreference && current.rememberSpot && sessionMemory.spot !== null) return floor.x0 + sessionMemory.spot * (floor.x1 - floor.x0);
    if (current.rest === 'sidebar') return floor.x0 + w.half * 1.5;
    if (current.rest === 'corner') return floor.x1;
    return floor.x1 - w.half * 2;
  }

  function onMotionEvent(type, detail) {
    if (type === 'state') {
      // The click area turns off on every change and back on once the new spot is verified clear —
      // except a short gesture on the same spot the learner may cut short (interrupt setting).
      const keep = current.interact.interrupt && INTERRUPTIBLE.has(detail.to) && RESTING.has(detail.from) && container.classList.contains('is-clickable');
      if (!keep) container.classList.remove('is-clickable');
      if (detail.to === 'slipping' || detail.to === 'knocked') companion?.close({ restoreFocus: false });
      if (detail.from === 'recovering' || detail.from === 'landing' || detail.from === 'dismounting' || detail.from === 'walking') checkSpot(60);
      else if (RESTING.has(detail.to)) checkSpot(250);
      if (detail.to === 'idle' && companion?.isOpen()) companion.position();
      // A frightening fall ends in sitting down for a little cry (bounded; it ends on its own).
      if (detail.to === 'idle' && pendingCry && ['frightened', 'crying'].includes(emotion.current())) {
        pendingCry = false;
        satForCry = motion.perform('sit');
      }
      if (detail.from === 'sitting' && detail.to !== 'sitting') satForCry = false; // something else moved Buddy on
    }
    if (type === 'rest' && !nextTimer && !document.hidden && detail.state !== 'sleeping') {
      if (isPaused()) { if (detail.state === 'idle' && !isReduced()) motion.perform('sit'); } else scheduleNext(randomInterval());
    }
    if (type === 'dust') puffDust(detail);
    if (type === 'landed') reactToLanding(detail);
    if (type === 'fear' && f().fear) emotion.feel('frightened', { ms: 4000, intensity: emotionScale() });
    if (type === 'startle' && !emotion.current()) emotion.feel('surprised', { ms: 900, intensity: emotionScale() });
    if (type === 'catch-miss') emotion.feel('surprised', { ms: 800 });
    if (type === 'spin' && detail.dizzy && f().dizzy) emotion.feel('dizzy', { ms: 2600 * recoveryScale(), intensity: Math.min(1.5, detail.level) });
  }

  /** A puff of dust from a hard landing: 3–8 pooled particles, animated with WAAPI. */
  let dustNext = 0;
  let dustLive = 0;
  function puffDust({ x, y, impact, size: S }) {
    if (isReduced() || !f().dust) return;
    const n = Math.round(Math.max(3, Math.min(DUST_POOL, (impact - 600) / 120)));
    for (let i = 0; i < n; i++) {
      const p = dust[dustNext];
      dustNext = (dustNext + 1) % DUST_POOL;
      p.getAnimations().forEach((a) => a.cancel());
      const side = i % 2 ? 1 : -1;
      const reach = S * (0.35 + random() * 0.5) * side;
      const lift = S * (0.08 + random() * 0.18);
      const r = Math.round(S * (0.1 + random() * 0.08));
      p.style.width = `${r}px`;
      p.style.height = `${r}px`;
      p.style.left = `${Math.round(x - r / 2)}px`;
      p.style.top = `${Math.round(y - r)}px`;
      dustLive++;
      const anim = p.animate([
        { transform: 'translate(0, 0) scale(0.4)', opacity: 0.7 },
        { transform: `translate(${Math.round(reach)}px, ${Math.round(-lift)}px) scale(1.1)`, opacity: 0 },
      ], { duration: 420 + random() * 200, easing: 'cubic-bezier(.2,.7,.3,1)' });
      const done = () => { dustLive = Math.max(0, dustLive - 1); };
      anim.onfinish = done;
      anim.oncancel = done;
    }
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
  own.listen(document, 'studyhub:change', (event) => {
    const key = event.detail?.key;
    companion.onDataChange(key, key === 'progress' ? checkGrowth() : null);
  });
  // A practice or knowledge-check answer was recorded (js/activity.js): only the result kind arrives.
  own.listen(document, 'studyhub:result', (event) => {
    const r = event.detail?.result;
    if (r === 'correct') react('answer-correct');
    else if (r === 'incorrect') react('answer-wrong');
  });
  // Progress changed in another tab (or a backup import there): grow quietly, no message.
  const unwatch = onExternalChange((key) => { if (key === 'progress' && instance?.own === own) checkGrowth(); });
  own.observe({ disconnect: unwatch });
  own.listen(document, 'visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      endDrag();
      motion.pause();
      own.clearTimeout(nextTimer);
      nextTimer = 0;
      own.clearTimeout(blinkTimer);
      blinkTimer = 0;
    } else {
      applyPause(); // a pause may have run out while the tab was hidden
      scheduleBlink();
      world.invalidate();
      motion.reconcile();
      motion.resume();
      scheduleNext(randomInterval());
      // Back after a long break: a wave hello (at most every 30 minutes).
      const now = Date.now();
      if (hiddenAt && now - hiddenAt > AWAY_FOR_WAVE && now - lastWave > WAVE_COOLDOWN && !isReduced() && !isPaused()) {
        lastWave = now;
        lastGreet = now;
        own.setTimeout(() => { if (motion.isCalm() && motion.perform('wave')) motion.express('greeting', 1800, 2); }, 600);
      }
    }
  });
  let hiddenAt = 0;
  let lastWave = 0;
  const noteInput = (event) => {
    const now = Date.now();
    const idleFor = now - lastInput;
    lastInput = now;
    if (event.type === 'keydown') lastKey = lastInput;
    if (event.type === 'pointerdown' && event.target?.closest?.('.interaction, .quiz, .galaxy-stage, form')) lastStudyAt = now;
    if (motion.state === 'sleeping' || motion.state === 'yawning') {
      motion.perform('wake'); // stretches awake (or simply stops yawning)
      scheduleNext(randomInterval());
    } else if (idleFor > RETURN_IDLE && now - lastGreet > GREET_COOLDOWN && motion.isCalm() && !isPaused()) {
      // Back after a quiet spell: a hello once (a wave, or just a smile while studying).
      lastGreet = now;
      if (!studying() && !isReduced() && event.type !== 'scroll') motion.perform('wave');
      emotion.feel('happy', { ms: 1400 });
    }
  };
  own.listen(document, 'pointerdown', noteInput, { capture: true, passive: true });
  own.listen(document, 'keydown', noteInput, { capture: true, passive: true });
  // The document is the page's scroller (.main has no overflow); Buddy is
  // position: fixed, so scrolling never moves it — it only sways a little, like
  // a passenger, from the scroll speed. Its coordinates are never touched here.
  let lastScrollY = window.scrollY;
  own.listen(window, 'scroll', () => {
    noteInput({ type: 'scroll' }); // reading a long lesson counts as being here
    checkSpot(250);
    const dy = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    if (dy) motion.nudge(Math.max(-14, Math.min(14, -dy * 0.35)));
  }, { passive: true });
  own.listen(document, 'keydown', (event) => {
    // Esc closes Buddy's bubble only when nothing else is using Esc right now.
    if (event.key !== 'Escape' || event.defaultPrevented || !companion.isOpen()) return;
    if (document.querySelector('dialog[open]') || !document.getElementById('app-menu-list')?.hidden) return;
    if (document.body.classList.contains('nav-open') || isTypingTarget(event.target)) return;
    if (!document.getElementById('search-results')?.hidden) return;
    companion.close();
  });
  // Something near Buddy took focus (a quiz choice, a control at the bottom of the page) or a
  // <details> opened: look again whether Buddy is in the way. Cheap: one box test, after a pause.
  own.listen(document, 'focusin', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || isBuddyNode(target) || !motion.isResting()) return;
    const r = target.getBoundingClientRect();
    const b = motion.box();
    if (r.right > b.left - 40 && r.left < b.right + 40 && r.bottom > b.top - 40 && r.top < b.bottom + 40) checkSpot(120);
  });
  own.listen(document, 'toggle', () => checkSpot(200), { capture: true });

  // Search: Buddy never sits in the results' way and leaves the learner alone while typing.
  const search = document.getElementById('search-input');
  if (search) {
    own.listen(search, 'focus', () => {
      if (companion.isOpen() && !companion.element().contains(document.activeElement)) companion.close({ restoreFocus: false });
      checkSearch();
      glanceAt(search, 1800, 'curious');
    });
    own.listen(search, 'input', () => {
      own.clearTimeout(searchTimer);
      searchTimer = own.setTimeout(() => { checkSearch(); glanceAt(search, 1200); }, 400); // once typing pauses, never per keystroke
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
    if (blocking) endDrag();
    if (blocking && companion.isOpen() && !document.getElementById('buddy-dialog')?.open) companion.close({ restoreFocus: false });
    if (!blocking) checkSpot(200); // a dialog or the menu closed: look again where Buddy sits
    if (blocking && (motion.isResting() || motion.state === 'looking') && motion.state !== 'sitting' && !isReduced()) motion.perform('sit');
  }));
  for (const dialog of document.querySelectorAll('dialog')) overlays.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  const menuPanel = document.getElementById('app-menu-list');
  if (menuPanel) overlays.observe(menuPanel, { attributes: true, attributeFilter: ['hidden'] });

  const onMotionPreference = () => {
    endDrag();
    if (isReduced()) motion.placeCalmly(motion.body.x);
    else {
      motion.placeCalmly(motion.body.x);
      scheduleNext(randomInterval());
    }
  };
  own.onMedia(REDUCED, (event) => {
    const before = isReduced();
    systemReduced = event.matches;
    if (isReduced() !== before || current.motion !== 'full') onMotionPreference();
  });
  own.onMedia(SMALL, () => {
    applySize();
    environmentChanged();
  });

  // ---- Pause: optional activity stops for a while; safety and the learner's own actions do not ----

  let pauseTimer = 0;
  function applyPause() {
    own.clearTimeout(pauseTimer);
    pauseTimer = 0;
    const paused = isPaused();
    const was = container.classList.contains('is-paused');
    container.classList.toggle('is-paused', paused);
    if (paused) {
      companion.close({ restoreFocus: false });
      own.clearTimeout(nextTimer);
      nextTimer = 0;
      own.clearTimeout(blinkTimer);
      blinkTimer = 0;
      pendingCry = false;
      satForCry = false;
      emotion.clear();
      motion.setGaze(null);
      // A fall or throw finishes safely first (the 'rest' event then sits Buddy down).
      if (motion.isCalm() && motion.state !== 'sitting' && !isReduced()) motion.perform('sit');
      pauseTimer = own.setTimeout(applyPause, Math.max(50, current.pausedUntil - Date.now() + 50));
    } else if (was) {
      scheduleBlink();
      scheduleNext(randomInterval());
      checkSpot(100);
    }
  }

  // ---- Gaze: the eyes follow a nearby mouse, glance at search, then rest ----
  let gazeAt = 0;
  let gazeTimer = 0;
  let glanceUntil = 0;
  /** Eye offset (±3 units) toward a viewport point, from Buddy's eyes. */
  function lookToward(x, y) {
    const b = motion.box();
    const ex = (b.left + b.right) / 2;
    const ey = b.top + (b.bottom - b.top) * 0.4;
    const dx = x - ex;
    const dy = y - ey;
    const d = Math.hypot(dx, dy) || 1;
    return { d, gx: (dx / d) * 2.6, gy: (dy / d) * 2.2 };
  }
  function restGaze(ms) {
    own.clearTimeout(gazeTimer);
    gazeTimer = own.setTimeout(() => { gazeTimer = 0; motion.setGaze(null); }, ms);
  }
  function glanceAt(node, ms, face) {
    if (isReduced() || !node || !f().glances || isPaused()) return;
    const r = node.getBoundingClientRect();
    const { gx, gy } = lookToward(r.left + r.width / 2, r.top + r.height / 2);
    glanceUntil = Date.now() + ms;
    motion.setGaze(gx, gy);
    if (face) motion.express(face, Math.min(ms, 1400), 1);
    restGaze(ms);
  }
  // One passive pointermove listener, throttled to ~12 Hz, mouse and pen only
  // (touch has no hover). Coordinates stay in this function: never stored or sent.
  own.listen(document, 'pointermove', (event) => {
    if (event.pointerType === 'touch' || drag) return;
    const now = event.timeStamp;
    if (now - gazeAt < 80 || isReduced() || Date.now() < glanceUntil || !f().glances || isPaused()) return;
    gazeAt = now;
    const { d, gx, gy } = lookToward(event.clientX, event.clientY);
    if (d > by(current.curiosity, [GAZE_RANGE.low, GAZE_RANGE.balanced, GAZE_RANGE.high])) { motion.setGaze(null); return; } // out of range: look ahead again
    motion.setGaze(gx, gy);
    restGaze(2500); // still pointer: eyes drift back to neutral
  }, { passive: true });

  // ---- Petting: a tap, or a gentle stroke back and forth over Buddy ----

  let lastPat = 0;
  let lastVariant = '';
  /**
   * A gentle pat. Comforts a frightened, crying or dizzy Buddy that has landed;
   * otherwise a small happy reaction that varies (never the same twice running),
   * and a smaller one when pats come close together. Returns what happened.
   */
  function pat({ side = 1 } = {}) {
    if (!f().petting || isPaused() || !motion.isResting()) return null;
    const now = Date.now();
    if (emotion.canSoothe()) {
      pendingCry = false;
      emotion.comfort(1700 * recoveryScale());
      if (!isReduced()) motion.perform('pet', { variant: 'nuzzle', side });
      lastPat = now;
      return 'comforted';
    }
    if (now - lastPat < PAT_COOLDOWN || isReduced()) {
      lastPat = now;
      emotion.feel(random() < 0.5 ? 'happy' : 'playful', { ms: 900 });
      return 'face';
    }
    lastPat = now;
    const options = PAT_VARIANTS.filter((v) => v !== lastVariant);
    lastVariant = options[Math.floor(random() * options.length) % options.length];
    return motion.perform('pet', { variant: lastVariant, side }) ? 'petted' : null;
  }
  // Strokes: mouse or pen moving over Buddy with no button pressed (touch has no hover).
  let stroke = null; // { x, dir, travel, reversals, start }
  own.listen(hit, 'pointermove', (event) => {
    if (event.pointerType === 'touch' || event.buttons || drag || !f().petting) return;
    const now = event.timeStamp;
    if (!stroke || now - stroke.start > 1500) stroke = { x: event.clientX, dir: 0, travel: 0, reversals: 0, start: now };
    const dx = event.clientX - stroke.x;
    stroke.x = event.clientX;
    if (Math.abs(dx) < 0.5) return;
    const dir = Math.sign(dx);
    if (stroke.dir && dir !== stroke.dir && stroke.travel >= 4) {
      stroke.reversals++;
      stroke.travel = 0;
    }
    stroke.dir = dir;
    stroke.travel += Math.abs(dx);
    if (stroke.reversals >= STROKE_REVERSALS[current.petting]) {
      stroke = null;
      const b = motion.box();
      pat({ side: event.clientX < (b.left + b.right) / 2 ? -1 : 1 });
    }
  });
  own.listen(hit, 'pointerleave', () => { stroke = null; });

  // ---- Picking Buddy up: press, drag, throw ----
  //
  // A press on Buddy is a click until the pointer moves DRAG_THRESHOLD px (mouse,
  // pen) — then Buddy is picked up and the pointer captured. Touch must first be
  // held still for TOUCH_HOLD_MS, so a swipe that starts on Buddy still scrolls
  // the page (touch-action stays auto; only an active drag cancels touchmove).
  // Pickup only happens from a calm resting state where the hit area is on (a
  // clear spot); anything that interrupts (cancel, lost capture, blur, hidden
  // tab, a dialog, Escape, disable) lets go safely.
  let drag = null; // { id, type, x, y, armed, held, holdTimer }
  let suppressClick = false;
  /** Let go of the pointer. `throwIt` false: no throw or drop (Rescue places Buddy itself). */
  function endDrag(throwIt = true) {
    if (!drag) return;
    own.setTimeout(() => { suppressClick = false; }, 0);
    own.clearTimeout(drag.holdTimer);
    const wasHeld = drag.held;
    const id = drag.id;
    drag = null;
    container.classList.remove('is-dragging');
    if (hit.hasPointerCapture?.(id)) hit.releasePointerCapture(id);
    if (wasHeld && throwIt) motion.drop();
  }
  function startHold(event) {
    if (!motion.grab(drag.x, drag.y)) { endDrag(); return; }
    drag.held = true;
    suppressClick = true;
    companion.close({ restoreFocus: false });
    container.classList.add('is-dragging');
    try { hit.setPointerCapture(drag.id); } catch { /* the pointer is already gone */ }
    if (event) motion.moveHold(event.clientX, event.clientY, event.timeStamp);
  }
  own.listen(hit, 'pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || drag) return;
    if (!current.interact.drag || isReduced() || companion.kind() === 'quiz') return; // a click still opens the menu
    if (!motion.isResting()) {
      if (!(current.interact.interrupt && INTERRUPTIBLE.has(motion.state))) return;
      motion.perform('interrupt'); // a habit ends so the learner can pick Buddy up
    }
    drag = { id: event.pointerId, type: event.pointerType, x: event.clientX, y: event.clientY, armed: event.pointerType !== 'touch', held: false, holdTimer: 0 };
    if (!drag.armed) drag.holdTimer = own.setTimeout(() => { if (drag) { drag.armed = true; startHold(null); } }, TOUCH_HOLD_MS);
  });
  // Move/up/cancel on the document: a fast first move can leave the small hit area before capture starts.
  own.listen(document, 'pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    if (drag.held) {
      for (const e of event.getCoalescedEvents?.() || [event]) motion.moveHold(e.clientX, e.clientY, e.timeStamp);
      return;
    }
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < DRAG_THRESHOLD) return;
    if (drag.armed) startHold(event);
    else endDrag(); // touch moved before the hold: it is a scroll, not a pickup
  });
  own.listen(document, 'pointerup', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const wasHeld = drag.held;
    own.clearTimeout(drag.holdTimer);
    drag = null;
    container.classList.remove('is-dragging');
    if (hit.hasPointerCapture?.(event.pointerId)) hit.releasePointerCapture(event.pointerId);
    if (wasHeld) {
      motion.release(performance.now());
      own.setTimeout(() => { suppressClick = false; }, 0); // after the click this press may still fire
    }
  });
  own.listen(document, 'pointercancel', (event) => { if (drag && event.pointerId === drag.id) endDrag(); });
  own.listen(hit, 'lostpointercapture', (event) => { if (drag?.held && event.pointerId === drag.id) endDrag(); });
  own.listen(hit, 'touchmove', (event) => { if (drag?.held) event.preventDefault(); }, { passive: false }); // only while holding Buddy
  own.listen(hit, 'contextmenu', (event) => { if (drag) event.preventDefault(); }); // a long press picks Buddy up, no context menu
  own.listen(window, 'blur', () => endDrag());
  own.listen(document, 'keydown', (event) => { if (event.key === 'Escape' && drag) endDrag(); });

  own.listen(hit, 'click', (event) => {
    if (suppressClick) { suppressClick = false; return; } // the press was a drag
    if (motion.state === 'stretching') { companion.showMenu(); return; }
    if (INTERRUPTIBLE.has(motion.state) && current.interact.interrupt) motion.perform('interrupt');
    if (!motion.isResting()) return;
    if (f().petting) {
      const b = motion.box();
      // Comforting takes the tap: the menu waits for the next one.
      if (pat({ side: event.clientX < (b.left + b.right) / 2 ? -1 : 1 }) === 'comforted') return;
    } else motion.perform('interact');
    companion.showMenu();
  });

  // ---- Rescue: from any state to a stable pose on a clear spot ----

  function rescueNow({ toPreference = false } = {}) {
    endDrag(false); // release the pointer capture without throwing
    companion.close({ restoreFocus: false });
    pendingCry = false;
    emotion.clear();
    motion.setGaze(null);
    const ok = motion.rescue(preferredX({ toPreference }));
    if (ok && !isReduced()) {
      container.classList.remove('is-rescued');
      void container.offsetWidth; // restart the fade-in
      container.classList.add('is-rescued');
      own.setTimeout(() => container.classList.remove('is-rescued'), 450);
    }
    checkSpot(120);
    if (!isPaused()) scheduleNext(randomInterval());
    return ok;
  }

  instance = {
    own, motion, world, companion, character, container, shadow, fx, emotion,
    rescue: rescueNow,
    update(next, previous) {
      current = next;
      const reducedBefore = previous.motion === 'minimal' || (previous.motion !== 'full' && systemReduced);
      character.applyAppearance(next);
      motion.setLeafDroop(next.quiet);
      if (next.body !== previous.body) {
        applyShape();
        environmentChanged(); // the collision box changed with the body
        checkSpot(200);
      }
      if (next.motion !== previous.motion && isReduced() !== reducedBefore) onMotionPreference();
      if (next.quiet && !previous.quiet && companion.isOpen() && companion.kind() !== 'quiz') companion.close({ restoreFocus: false });
      if (!next.features.bubbles && previous.features.bubbles && companion.isOpen() && !['quiz', 'menu', 'info'].includes(companion.kind())) companion.close({ restoreFocus: false });
      if (!next.features.glances) motion.setGaze(null);
      const feeling = emotion.current();
      if ((feeling === 'dizzy' && !next.features.dizzy) || (['frightened', 'crying'].includes(feeling) && !next.features.fear)) emotion.clear();
      if (!next.interact.drag && drag) endDrag();
      if (next.pausedUntil !== previous.pausedUntil) applyPause();
      if (next.movement !== previous.movement || next.quiet !== previous.quiet || next.motion !== previous.motion) scheduleNext(randomInterval());
      motion.refresh();
    },
    kick: (ms = 100) => scheduleNext(ms), // tests: run the real idle scheduler now
    debug: () => ({
      nextTimer: Boolean(nextTimer), checkTimer: Boolean(checkTimer), lastInput, started,
      settings: current, reduced: isReduced(), size: size(),
      growth, completed: completedTopicCount(), dustLive, dragging: drag ? (drag.held ? 'held' : 'pressed') : null,
      growing: container.classList.contains('is-growing'), lastActivity,
      emotion: emotion.snapshot(), studying: studying(), studySignal: studySignal(), paused: isPaused(), pauseTimer: Boolean(pauseTimer),
      lastLanding, pendingCry, rememberedSpot: sessionMemory.spot, clickable: container.classList.contains('is-clickable'),
    }),
    /** Tests: the next n choices, `gapMs` apart, without performing them (scheduler state is restored). */
    planActivities(n, gapMs) {
      const saved = { habitAt: { ...habitAt }, lastActivity, lastClimb };
      const out = [];
      let now = Date.now();
      for (let i = 0; i < n; i++, now += gapMs) {
        const kind = chooseActivity(now);
        commitActivity(kind, now);
        out.push(kind);
      }
      for (const key of Object.keys(habitAt)) delete habitAt[key];
      Object.assign(habitAt, saved.habitAt);
      lastActivity = saved.lastActivity;
      lastClimb = saved.lastClimb;
      return out;
    },
    pat: (side) => pat({ side }),
    react,
    preferredX,
    /** Tests: pretend the last input (and study signal) was `ms` longer ago. */
    ageInput(ms) {
      lastInput -= ms;
      lastKey -= ms;
      lastStudyAt -= ms;
    },
  };

  motion.start(sessionMemory.spot !== null || current.rest !== 'bottom' ? preferredX() : undefined);
  scheduleNext(DEBUG ? 3_600_000 : 8000);
  scheduleBlink();
  applyPause();
  // A welcome after a long break, once the first page has rendered.
  own.setTimeout(() => { if (canPrompt({ spontaneous: true })) companion.maybeWelcome(); }, 2500);
}

function disable() {
  if (!instance) return;
  lifetime.disables++;
  const { own, motion, companion, container, shadow, fx } = instance;
  instance = null; // first: anything still in flight sees Buddy as gone
  companion.destroy();
  motion.stop();
  own.dispose();
  container.remove();
  shadow.remove();
  fx.remove();
}

// ---- Test instrumentation (only with ?buddy-debug) -------------------------------------

function debugApi() {
  return {
    snapshot() {
      if (!instance) return { enabled: false, lifetime: { ...lifetime }, domNodes: document.querySelectorAll('.buddy, .buddy-shadow, .buddy-bubble, .buddy-fx').length };
      return {
        enabled: true,
        ...instance.motion.snapshot(),
        resources: instance.own.counts(),
        bubble: instance.companion.kind(),
        lifetime: { ...lifetime },
        domNodes: document.querySelectorAll('.buddy, .buddy-shadow, .buddy-bubble, .buddy-fx').length,
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
    toss: () => toss(),
    express: (kind, ms, prio) => instance?.motion.express(kind, ms, prio),
    perk: () => instance?.motion.perk(),
    nudge: (k) => instance?.motion.nudge(k),
    setGaze: (x, y) => instance?.motion.setGaze(x, y),
    /** Replace Math.random for Buddy (motion + scheduler); pass nothing to restore. */
    setRandom: (fn) => { random = typeof fn === 'function' ? fn : Math.random; },
    planActivities: (n, gapMs) => instance?.planActivities(n, gapMs),
    walkTo: (x) => instance?.motion.walkTo(x),
    launch: (x, y, vx, vy) => instance?.motion.launch(x, y, vx, vy),
    grab: (x, y) => instance?.motion.grab(x, y),
    moveHold: (x, y, t) => instance?.motion.moveHold(x, y, t),
    release: (t) => instance?.motion.release(t),
    // V3: feelings, petting, rescue, pause, learning reactions.
    emotion: () => instance?.emotion.snapshot() || null,
    emotionLog: () => instance?.emotion.log.slice() || [],
    feel: (kind, options) => instance?.emotion.feel(kind, options),
    pat: (side) => instance?.pat(side),
    react: (kind, detail) => instance?.react(kind, detail),
    rescue: () => rescue(),
    resetPosition: () => resetPosition(),
    pause: (ms) => settings.pause(ms),
    preferredX: (o) => instance?.preferredX(o),
    ageInput: (ms) => instance?.ageInput(ms),
  };
}
