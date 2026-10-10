// Buddy's motion: one state machine, one animation loop, simple physics.
//
// Body state is { x, y } = the point between Buddy's feet, in viewport pixels,
// plus velocity, tilt and the surface it stands on (floor, wall, rail or air).
//
// States and how they connect (ALLOWED below is the authority):
//
//   idle ─▶ walking / avoiding ─▶ (turning) ─▶ arrive
//   idle ─▶ walking ─▶ mounting ─▶ climbing ─▶ gripping ─▶ climbing (down) ─▶ dismounting ─▶ idle
//                                     │            └──▶ crouching ─▶ jumping (hop off) ─▶ landing
//                                     └─ support lost ─▶ slipping ─▶ falling ─▶ landing ─▶ (rebound) ─▶ recovering ─▶ idle
//   falling / thrown near the collapsed rail ─▶ hanging ─▶ sliding ─▶ dismounting   (or ─▶ falling again)
//   idle ─▶ held (picked up by the pointer, swinging) ─▶ thrown ─▶ landing
//   floor states ─ sidebar grows over Buddy ─▶ knocked ─▶ landing
//   idle ⇄ looking · sitting · thinking · celebrating · interacting · worried · waving · crouching ─▶ jumping
//   idle ─▶ yawning ─▶ sleeping ─▶ stretching ─▶ idle
//   landing / recovering ─▶ wobbling (dizzy: unsteady steps) ─▶ idle · sitting
//   landing / recovering / walking ─▶ balancing (at the real end of the floor) ─▶ idle
//   idle ─▶ petted (a gentle pat) ─▶ idle
//
// Feelings (emotion.js) are a separate dimension: motion.js asks for a face to
// draw over its own pose (renderNow), but the body — position, velocity,
// collisions, landings — belongs to this module alone.
//
// On top of the body state, "secondary motion" makes Buddy feel alive: the
// leaf, the arms and a little body sway are damped springs pushed by Buddy's
// real change of velocity (they lag when it starts, whip when it lands, wobble
// when it stops), and the eyes ease toward a gaze target. The loop runs while a
// state needs frames OR a spring has not settled, and stops when everything is
// still. Each state change bumps `gen`; timers made for a state die with it.
// Movement uses elapsed time, so it looks the same at 60, 120 or 144 Hz.

import { restPose } from './character.js';
import { createSpinMeter, FEAR_HEIGHT } from './emotion.js';

const G = 2300; // px/s², gravity
const V_MAX = 1500; // px/s, terminal fall speed (thrown Buddy may start faster)
const THROW_MAX = 2600; // px/s
const WALK = 58;
const AVOID = 120;
const ACCEL = 260;
const CLIMB = 62;
const CLIMB_DOWN = 64;
const SLIDE = 85;
const BLEND_MS = 140;
// Impacts are instantaneous: these states start from their own pose, unblended.
// Held and thrown also switch the pose pivot (head top ⇄ body centre); release()
// re-anchors the position for that, so blending between pivots would jump.
const NO_BLEND = new Set(['landing', 'held', 'thrown']);

const ON_WALL = new Set(['mounting', 'climbing', 'gripping']);
const ON_RAIL = new Set(['hanging', 'sliding']);
const AIRBORNE = new Set(['slipping', 'falling', 'jumping', 'knocked', 'thrown']);
export const RESTING = new Set(['idle', 'sitting', 'thinking', 'sleeping']);

const REST_EXITS = ['idle', 'walking', 'avoiding', 'turning', 'looking', 'sitting', 'thinking', 'sleeping', 'celebrating',
  'jumping', 'interacting', 'knocked', 'crouching', 'held', 'worried', 'waving', 'yawning', 'pleased', 'inspecting', 'shifting', 'fidgeting', 'thrown',
  'wobbling', 'balancing', 'petted'];
const BRIEF_EXITS = ['idle', 'knocked', 'held'];
// Idle habits: short, calm gestures from a resting pose.
const HABITS = ['inspecting', 'shifting', 'fidgeting'];
const ALLOWED = {
  idle: [...REST_EXITS, 'mounting'],
  looking: REST_EXITS,
  sitting: REST_EXITS,
  thinking: REST_EXITS,
  sleeping: [...REST_EXITS, 'stretching'],
  celebrating: BRIEF_EXITS,
  interacting: BRIEF_EXITS,
  worried: BRIEF_EXITS,
  waving: BRIEF_EXITS,
  pleased: BRIEF_EXITS,
  inspecting: BRIEF_EXITS,
  shifting: BRIEF_EXITS,
  fidgeting: BRIEF_EXITS,
  petted: BRIEF_EXITS,
  wobbling: [...BRIEF_EXITS, 'sitting'],
  balancing: [...BRIEF_EXITS, 'sitting'],
  yawning: ['sleeping', 'idle', 'knocked'],
  stretching: ['idle', 'knocked'],
  crouching: ['jumping', 'slipping', 'knocked'],
  turning: ['walking', 'avoiding', 'idle', 'knocked'],
  walking: ['idle', 'turning', 'walking', 'avoiding', 'mounting', 'knocked', 'sitting', 'looking', 'balancing'],
  avoiding: ['idle', 'turning', 'walking', 'avoiding', 'knocked', 'sitting', 'looking', 'balancing'],
  mounting: ['climbing', 'slipping'],
  climbing: ['climbing', 'gripping', 'dismounting', 'slipping'],
  gripping: ['climbing', 'crouching', 'slipping'],
  dismounting: ['idle', 'knocked'],
  slipping: ['falling'],
  falling: ['landing', 'hanging'],
  jumping: ['landing', 'hanging'],
  knocked: ['landing', 'hanging'],
  thrown: ['landing', 'hanging'],
  held: ['thrown'],
  hanging: ['falling', 'sliding', 'knocked', 'climbing'], // climbing: down a sidebar edge it caught
  sliding: ['dismounting', 'falling', 'knocked'],
  landing: ['recovering', 'idle', 'knocked', 'jumping', 'wobbling', 'balancing'],
  recovering: ['idle', 'knocked', 'wobbling', 'balancing'],
};
// States that always need per-frame updates.
const FRAMES = new Set(['looking', 'turning', 'walking', 'avoiding', 'mounting', 'climbing', 'dismounting',
  'slipping', 'falling', 'jumping', 'knocked', 'thrown', 'held', 'hanging', 'sliding', 'landing', 'recovering',
  'celebrating', 'interacting', 'crouching', 'worried', 'waving', 'yawning', 'stretching', 'pleased', 'petted', 'wobbling', 'balancing', ...HABITS]);
// Nonessential gestures a learner's click may cut short (only when they allow it in settings).
export const INTERRUPTIBLE = new Set([...HABITS, 'looking', 'waving', 'pleased', 'celebrating', 'interacting', 'petted', 'worried']);
// Calm poses on which a feeling may also move the arms and lean the body (never the position).
const EMOTION_CALM = new Set(['idle', 'sitting', 'thinking', 'looking']);
// Eyes may follow a gaze target only in these calm states.
const GAZE_STATES = new Set(['idle', 'sitting', 'gripping']);
// A face expression (express()) may show over these states; never over falls, throws or landings.
const FACE_STATES = new Set(['idle', 'sitting', 'walking', 'avoiding', 'turning', 'looking', 'gripping', 'climbing', 'dismounting']);
// Brief states and how long they last (seconds).
const DURATION = {
  looking: 1.9, celebrating: 1.1, interacting: 0.65, worried: 1.6, waving: 1.6, yawning: 1.4, stretching: 1.1, recovering: 0.95,
  pleased: 0.9, inspecting: 2.2, shifting: 0.9, fidgeting: 1.3, petted: 1.15, balancing: 1.3,
};
const WOBBLE_STEP = 12; // px: the most a dizzy Buddy's uneven steps may carry it
const NEAR_EDGE_COOLDOWN = 10_000; // ms between near-miss balancing reactions
// Catching an edge on the way down (tryCatch): reach, odds and a cooldown between attempts.
const REACH = 26; // px between Buddy's side and the edge at which a hand can close on it
const CATCH_ODDS = 0.6; // an attempt is made on this share of plausible passes
const CATCH_COOLDOWN = 8; // s (real time) between attempts
const REACH_FIRST = 0.08; // s the arm visibly reaches out before the hand can close
const CATCH_MAX_VY = 1150; // px/s: faster than this, the grip slips (a miss)
const PERK_MS = 4500; // a correct answer perks a quiet, droopy leaf up for this long
export const STATES = Object.keys(ALLOWED);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2);
const DEG = 180 / Math.PI;

/** A damped spring around 0: x is an offset (degrees), v its velocity. */
function spring(k, c, limit) {
  return { x: 0, v: 0, k, c, limit };
}
function stepSpring(s, dt) {
  // Semi-implicit Euler, in substeps of at most 1/120 s so a slow frame (30 Hz,
  // or the 50 ms cap after a stall) integrates the same curve as a fast one.
  const n = Math.ceil(dt / (1 / 120) - 1e-9);
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    s.v = clamp(s.v + (-s.k * s.x - s.c * s.v) * h, -s.limit * 40, s.limit * 40);
    s.x = clamp(s.x + s.v * h, -s.limit, s.limit);
  }
  if (!Number.isFinite(s.x) || !Number.isFinite(s.v)) { s.x = 0; s.v = 0; }
}
const springStill = (s) => Math.abs(s.x) < 0.08 && Math.abs(s.v) < 1.2;

/**
 * deps: { world, character, el: { container, inner, shadow }, own, isReduced(),
 *         personality(), emit(event, detail), debug,
 *         tuning(): { speed, jumps, catching, nearMiss, dizzy, fear, throwOn, speedLines, particles, expression },
 *         emotion: { overlay(pose, ctx), animating(), current() } }
 * tuning() only scales optional movement (walking, climbing speed) and switches
 * optional reactions; gravity, collisions and throw limits are fixed here.
 */
export function createMotion(deps) {
  const { world, character, el, own } = deps;
  const rnd = () => (deps.random ? deps.random() : Math.random()); // tests can inject a fixed sequence
  const DEFAULT_TUNING = { speed: 1, jumps: 1, catching: true, nearMiss: true, dizzy: true, fear: true, throwOn: true, speedLines: true, particles: true, expression: 1 };
  const tune = () => ({ ...DEFAULT_TUNING, ...(deps.tuning ? deps.tuning() : {}) });
  // apexY: the highest point (smallest y) of the current fall; pendingAfter: what a landing settles into;
  // dizzy: how dizzy a spin left Buddy when it was let go (0 = not at all).
  const body = { x: 0, y: 0, vx: 0, vy: 0, tilt: 0, omega: 0, facing: 1, surface: 'floor', peek: false, pendingRecover: false, apexY: 0, pendingAfter: null, dizzy: 0 };
  let lastNearEdge = -Infinity;
  let lastFall = null; // { height, impact, at } of the last real landing (tests and buddy.js)
  let state = 'idle';
  let data = {};
  let gen = 0;
  let stateStart = 0; // ms, motion clock
  let clock = 0; // ms of motion time (scaled), advanced by frames
  let stateTimers = new Set();
  let pose = restPose();
  let blend = null; // { from, start }
  let raf = 0;
  let inFrame = false;
  let lastFrame = 0;
  let running = false;
  let paused = false;
  let timeScale = 1;
  const stats = { outstandingRaf: 0, maxOutstandingRaf: 0, frames: 0, transitions: 0, invalid: 0, falls: 0, knocks: 0, forced: 0, catches: 0, throws: 0, rebounds: 0 };
  const trace = [];
  const transitions = [];

  // Secondary motion.
  const springs = {
    sprout: spring(120, 10, 38), // leaf: lags, whips, wobbles
    armL: spring(150, 11, 40),
    armR: spring(150, 11, 40),
    sway: spring(90, 9, 9), // body lean (scrolling, stopping)
  };
  const gaze = { x: 0, y: 0, tx: 0, ty: 0 };
  const measure = { valid: false, px: 0, py: 0, vx: 0, vy: 0 };
  // Leaf rest angle (degrees): `base` eases toward the target so drooping and perking never jump.
  const leaf = { droop: false, perkUntil: 0, base: 0 };
  // A face layered over calm states: { kind, start, until, prio } (express()).
  let face = null;
  let lastCatch = -Infinity; // performance.now() of the last catch attempt
  let missedLast = false; // after a miss, the next plausible attempt holds on
  let speedShown = '';

  // ---- State changes -------------------------------------------------------------

  function enter(next, params = {}) {
    if (!ALLOWED[state].includes(next)) {
      stats.invalid++;
      if (deps.debug) console.warn(`[buddy] refused transition ${state} → ${next}`);
      return false;
    }
    change(next, params);
    return true;
  }

  /** Bypass ALLOWED: only for placement (start, reduced motion, re-enable). */
  function force(next, params = {}) {
    stats.forced++;
    change(next, params);
  }

  function change(next, params) {
    for (const id of stateTimers) own.clearTimeout(id);
    stateTimers = new Set();
    const previous = state;
    state = next;
    data = { ...params };
    gen++;
    stateStart = clock;
    stats.transitions++;
    transitions.push({ t: Math.round(clock), from: previous, to: next, x: Math.round(body.x), y: Math.round(body.y) });
    if (transitions.length > 400) transitions.shift();
    if (deps.isReduced() || NO_BLEND.has(next)) blend = null;
    else blend = { from: { ...pose, legs: { ...pose.legs }, lift: { ...pose.lift } }, start: clock };
    // A new fall starts measuring its height from here (a rebound or a hop measures its own).
    if (AIRBORNE.has(next) && !AIRBORNE.has(previous)) body.apexY = body.y;
    if (AIRBORNE.has(next)) body.surface = 'air';
    else if (ON_WALL.has(next)) body.surface = 'wall';
    else if (ON_RAIL.has(next)) body.surface = 'rail';
    else if (next === 'held') body.surface = 'held';
    else body.surface = 'floor';
    if (next !== 'idle' && next !== 'sitting') body.peek = false;
    el.container.dataset.state = next;
    ENTER[next]?.();
    deps.emit('state', { from: previous, to: next });
    if (RESTING.has(next)) deps.emit('rest', { state: next });
    renderNow();
    ensureLoop();
  }

  /** A timer that belongs to the current state: cleared when the state changes. */
  function stateTimer(fn, ms) {
    const myGen = gen;
    const id = own.setTimeout(() => {
      stateTimers.delete(id);
      if (myGen === gen && running) fn();
    }, ms / timeScale);
    stateTimers.add(id);
  }

  const elapsed = () => (clock - stateStart) / 1000;
  const size = () => world.get().height / 0.96;

  // ---- Entering states -------------------------------------------------------------

  const ENTER = {
    idle() {
      body.tilt = 0;
    },
    gripping() {
      // Hang on and look around (and down), then climb down or hop off.
      const playful = ['playful', 'energetic'].includes(deps.personality());
      data.lookDown = 0.9 + rnd() * 0.8; // s: when Buddy peers down the edge
      stateTimer(() => {
        if (rnd() < Math.min(0.85, (playful ? 0.6 : 0.25) * tune().jumps)) crouchThenJump({ vx: 150, vy: -260, omega: 40, mood: 'happy', fromWall: true, facing: 1 });
        else enter('climbing', { targetY: world.get().wall.bottom, dir: 1, then: 'dismount', phase: 0 });
      }, 1600 + rnd() * 1900);
    },
    turning() {
      // Turning round swings the leaf and hands the other way (they follow late).
      if (!deps.isReduced()) {
        const dir = Math.sign(body.facing - (data.from ?? -body.facing)) || body.facing;
        springs.sprout.v += -dir * 120;
        springs.armL.v += dir * 40;
        springs.armR.v += -dir * 40;
      }
    },
    slipping() {
      stats.falls++;
      data.wallX = world.get().wall.x || body.x - world.get().half;
      body.vx = 0;
      body.vy = 0;
      body.facing = -1;
    },
    falling() {
      body.omega = data.omega ?? 80;
      data.catchRoll = rnd();
    },
    thrown() {
      data.catchRoll = rnd();
    },
    knocked() {
      stats.knocks++;
      data.noCatch = true; // a knock always flies clear of the rail
    },
    crouching() {
      if (data.fromWall) body.surface = 'wall';
    },
    hanging() {
      // The hand closes on the edge where it is: Buddy's speed goes into a short
      // stretch below that hold point (the "give"), which springs back.
      stats.catches++;
      data.hy = body.y;
      data.fromX = body.x;
      data.give = clamp((data.impact || 0) * 0.012, 2, 14);
      body.vx = 0;
      body.vy = 0;
      body.facing = -1;
      data.hold = 0.8 + rnd() * 0.5;
      if (data.on === 'wall') body.surface = 'wall';
    },
    thinking() {
      data.framesUntil = clock + 1400; // a short head-scratch, then a still "hmm" pose
    },
    wobbling() {
      // Dizzy after a spin: unsteady, a few uneven steps toward the roomier side, then steady.
      const w = world.get();
      data.dir = body.x - w.floor.x0 > w.floor.x1 - body.x ? -1 : 1;
      data.moved = 0;
      data.duration = clamp(data.duration || 1.8, 0.8, 3.2);
    },
    balancing() {
      // At the real end of the floor: arms out, a lean over the edge, a corrective step back.
      data.moved = 0;
    },
  };

  // ---- Per-frame steps -------------------------------------------------------------

  function step(dt) {
    const w = world.get();
    const t = elapsed();
    const limit = state === 'wobbling' ? data.duration : DURATION[state];
    if (limit && t > limit) {
      if (state === 'recovering') settle();
      else if (state === 'yawning') enter('sleeping');
      else if (state === 'wobbling' && data.then === 'sit') enter('sitting');
      else enter('idle');
      return;
    }
    switch (state) {
      case 'turning':
        if (t > 0.2) enter(data.next, { target: data.target, then: data.then, v: 0, phase: 0, targetY: data.targetY });
        break;
      case 'walking':
      case 'avoiding': {
        if (data.then === 'mount') {
          if (!w.wall.valid) data.then = 'surprised';
          else data.target = w.wall.attachX;
        }
        const target = clamp(data.target, w.floor.x0, w.floor.x1);
        const dist = Math.abs(target - body.x);
        // The learner's speed preference scales optional walks only; getting out of the way stays brisk.
        const vmax = state === 'avoiding' ? AVOID : WALK * clamp(tune().speed, 0.6, 1.4);
        data.v = Math.min(vmax, (data.v || 0) + ACCEL * dt, Math.sqrt(2 * ACCEL * dist));
        const dir = Math.sign(target - body.x);
        if (dir && dir !== body.facing) {
          // Target moved behind Buddy (environment changed): turn first.
          body.facing = dir;
          enter('turning', { next: state, target: data.target, then: data.then, from: -dir, targetY: data.targetY });
          break;
        }
        body.x += dir * data.v * dt;
        data.phase = (data.phase || 0) + (data.v * dt) / 8;
        if (Math.abs(target - body.x) < 0.6 || (dir > 0 && body.x > target) || (dir < 0 && body.x < target)) {
          body.x = target;
          arrive(data.then);
        }
        break;
      }
      case 'mounting':
        if (t > 0.34) {
          body.y -= 6;
          enter('climbing', { targetY: data.targetY, dir: -1, then: 'grip', phase: 0 });
        }
        break;
      case 'climbing': {
        body.x = w.wall.attachX;
        data.phase += dt * Math.PI * 2 * (data.dir < 0 ? 1.45 : 1.9);
        const cycle = Math.floor(data.phase / (Math.PI * 2));
        // Every third reach, a short rest: weight shifts, then the next pull.
        const resting = data.dir < 0 && cycle > 0 && cycle % 3 === 0 && (data.phase % (Math.PI * 2)) < 1.4;
        data.resting = resting;
        const pace = clamp(tune().speed, 0.6, 1.4);
        const speed = (data.dir < 0 ? CLIMB * (0.25 + 1.4 * Math.max(0, Math.sin(data.phase))) : CLIMB_DOWN * (0.5 + 0.8 * Math.max(0, Math.sin(data.phase)))) * pace;
        if (!resting) body.y += data.dir * speed * dt;
        body.y = clamp(body.y, w.wall.top, w.wall.bottom);
        if (data.dir < 0 && body.y <= data.targetY + 0.5) enter('gripping');
        else if (data.dir > 0 && body.y >= w.wall.bottom - 0.5) {
          body.y = w.floor.y;
          enter('dismounting');
        }
        break;
      }
      case 'dismounting':
        body.x = Math.min(w.floor.x1, body.x + 22 * dt);
        if (t > 0.28) enter('idle');
        break;
      case 'crouching':
        // Wind-up: look where to go, shift the weight, squash down, a beat of
        // stillness — then spring into the jump (windupTime()).
        if (t > windupTime()) {
          body.vx = data.vx || 0;
          body.vy = data.vy;
          body.omega = data.omega || 0;
          if (data.facing) body.facing = data.facing;
          enter('jumping', { mood: data.mood });
        }
        break;
      case 'slipping': {
        // Grip lost: slide a little, tip away from the vanished edge, reach for it.
        const p = Math.min(1, t / 0.3);
        body.vy = 70 * p;
        body.vx = 26 * p;
        body.x += body.vx * dt;
        body.y = Math.min(w.floor.y, body.y + body.vy * dt);
        body.tilt = -7 + 23 * ease(p);
        if (p >= 1) {
          body.vy = 90;
          body.vx = landingDrift(34, w);
          enter('falling', { fromSlip: true }); // the edge it slipped off is never re-gripped
        }
        break;
      }
      case 'falling':
      case 'jumping':
      case 'knocked':
      case 'thrown':
        airborne(dt, w);
        break;
      case 'held':
        swing(dt);
        break;
      case 'hanging': {
        // Hold point on the edge; the body eases the last few px onto it (no snap)
        // and bounces once in the arm's give.
        const edge = data.on === 'wall' ? w.wall : w.rail;
        body.x = edge.attachX + (data.fromX - edge.attachX) * Math.exp(-t * 30);
        body.y = data.hy + data.give * Math.sin(Math.min(t * 9, Math.PI * 3)) * Math.exp(-t * 5);
        if (t > data.hold) {
          body.y = data.hy;
          if (data.on === 'wall') {
            // A real sidebar edge: climb down it the normal way.
            enter('climbing', { targetY: w.wall.bottom, dir: 1, then: 'dismount', phase: 0 });
          } else if (rnd() < 0.5) {
            // Either the grip gives out, or Buddy slides down the rail's edge.
            body.vx = 20;
            body.vy = 0;
            enter('falling', { omega: 50, noCatch: true });
          } else enter('sliding', { phase: 0 });
        }
        break;
      }
      case 'sliding':
        body.x = w.rail.attachX;
        data.phase += dt * Math.PI * 2 * 1.8;
        body.y = Math.min(w.floor.y, body.y + SLIDE * (0.6 + 0.6 * Math.max(0, Math.sin(data.phase))) * dt);
        if (body.y >= w.floor.y - 0.5) {
          body.y = w.floor.y;
          enter('dismounting');
        }
        break;
      case 'landing':
        body.tilt *= Math.exp(-dt * 25);
        if (t > data.duration) afterLanding();
        break;
      case 'wobbling': {
        // Uneven steps: moving only on the "down" half of each sway, at most WOBBLE_STEP px in all,
        // and never past the end of the floor.
        const stepping = t < data.duration * 0.6 && Math.sin(t * 6.5) > 0;
        if (stepping && data.moved < WOBBLE_STEP) {
          const dx = data.dir * 16 * dt;
          const next = clamp(body.x + dx, w.floor.x0, w.floor.x1);
          data.moved += Math.abs(next - body.x);
          body.x = next;
        }
        break;
      }
      case 'balancing':
        // One corrective step back from the edge (a few px), early in the wobble.
        if (t < 0.4 && data.moved < 5) {
          const next = clamp(body.x - data.dir * 14 * dt, w.floor.x0, w.floor.x1);
          data.moved += Math.abs(next - body.x);
          body.x = next;
        }
        break;
      default:
        break;
    }
  }

  /**
   * What a landing (or its recovery) settles into: a planned wobble or balance
   * (set at touchdown from real signals), else idle.
   */
  function settle() {
    const after = body.pendingAfter;
    body.pendingAfter = null;
    if (after?.kind === 'wobble') enter('wobbling', { duration: after.duration, then: after.then });
    else if (after?.kind === 'balance') enter('balancing', { dir: after.dir });
    else enter('idle');
  }

  /**
   * After the squash: an impact above REBOUND_FROM bounces once, higher for a
   * harder landing (capped at 260 px/s ≈ 15 px up), a little different each
   * time. A rebound's own landing never bounces again, so it always settles.
   */
  function afterLanding() {
    const REBOUND_FROM = 720;
    if (data.impact > REBOUND_FROM && !data.rebound) {
      stats.rebounds++;
      const up = clamp((data.impact - REBOUND_FROM * 0.7) * 0.2, 40, 260) * (0.9 + rnd() * 0.2);
      body.vy = -Math.min(260, up);
      body.vx = clamp((data.drift || 0) * 0.3, -40, 40);
      body.omega = 0;
      body.pendingRecover = true;
      data.lastRebound = body.vy;
      enter('jumping', { mood: 'bounce', rebound: true });
    } else if (data.impact > 650 || body.pendingRecover) {
      body.pendingRecover = false;
      enter('recovering');
    } else settle();
  }

  function airborne(dt, w) {
    body.vy = Math.min(state === 'thrown' ? THROW_MAX : V_MAX, body.vy + G * dt);
    body.vx *= Math.exp(-dt * 0.9);
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    if (state === 'thrown') {
      // A throw bounces off the edges of the workspace and off the header.
      if (body.x < w.floor.x0 && body.vx < 0) { body.x = w.floor.x0; body.vx = -body.vx * 0.5; body.omega = -body.omega * 0.6 + 120; }
      if (body.x > w.floor.x1 && body.vx > 0) { body.x = w.floor.x1; body.vx = -body.vx * 0.5; body.omega = -body.omega * 0.6 - 120; }
      const ceiling = w.headerBottom + w.height;
      if (body.y < ceiling && body.vy < 0) { body.y = ceiling; body.vy = -body.vy * 0.35; }
    } else {
      // Keep inside the workspace: ease back in if the floor moved under Buddy mid-air.
      if (body.x < w.floor.x0) { body.x += (w.floor.x0 - body.x) * Math.min(1, dt * 8); body.vx = Math.max(0, body.vx); }
      if (body.x > w.floor.x1) { body.x += (w.floor.x1 - body.x) * Math.min(1, dt * 8); body.vx = Math.min(0, body.vx); }
    }
    if (!Number.isFinite(body.x) || !Number.isFinite(body.y)) { stats.invalid++; placeCalmly(); return; }
    body.apexY = Math.min(body.apexY, body.y);
    if (tryCatch(w, dt)) return;
    noticeFall(w);
    const toFloor = w.floor.y - body.y;
    if (toFloor < 150 && body.vy > 0) body.tilt += (0 - body.tilt) * Math.min(1, dt * 9); // air-righting
    else body.tilt = clamp(body.tilt + body.omega * dt, -60, 60);
    // Speed lines on a fast fall (renderNow), dust when it ends hard.
    if (body.vy > 0 && body.y >= w.floor.y) {
      const impact = body.vy;
      const drift = body.vx; // carried into a rebound, a little
      const height = Math.max(0, w.floor.y - body.apexY);
      body.y = w.floor.y;
      body.vy = 0;
      body.vx = 0;
      if (impact > 700 && !deps.isReduced()) deps.emit('dust', { x: body.x, y: body.y, impact, size: size() });
      const first = !data.rebound;
      const feared = Boolean(data.fearful);
      const from = state;
      if (first) {
        planSettle(w, drift);
        lastFall = { height: Math.round(height), impact: Math.round(impact), at: Math.round(clock), feared };
      }
      enter('landing', { impact, drift, duration: (impact > 650 ? 0.36 : 0.26) * (0.92 + rnd() * 0.16), rebound: Boolean(data.rebound) });
      // Height and impact are reported separately (after touchdown): buddy.js decides how Buddy feels about each.
      if (first) deps.emit('landed', { height, impact, size: size(), feared, from });
    }
  }

  /**
   * While coming down, notice how far the fall is: past 3 Buddy-heights a startle,
   * and once the drop from the top of this fall to the floor is FEAR_HEIGHT or
   * more, fear (arms reach up; buddy.js shows the face). Only real falls and
   * throws — a hop or a rebound is never frightening. Once per fall.
   */
  function noticeFall(w) {
    if (body.vy <= 0 || data.rebound || state === 'jumping') return;
    const S = size();
    const dropped = body.y - body.apexY;
    const total = w.floor.y - body.apexY;
    if (!data.startled && dropped > S * 3) {
      data.startled = true;
      deps.emit('startle', { height: total });
    }
    if (!data.fearful && tune().fear && total >= FEAR_HEIGHT * S && dropped > S * 0.8) {
      data.fearful = true;
      deps.emit('fear', { height: total });
    }
  }

  /**
   * Decide at touchdown what the landing settles into, from real signals only:
   * dizzy from a spin → a wobble; landing at the very end of the floor while
   * still drifting toward it, or on a floor barely wider than Buddy → balancing.
   */
  function planSettle(w, drift) {
    body.pendingAfter = null;
    const t = tune();
    if (body.dizzy >= 1 && t.dizzy) {
      body.pendingAfter = { kind: 'wobble', duration: 1.2 + Math.min(1.6, body.dizzy) * 0.8, then: body.dizzy > 1.3 ? 'sit' : 'idle' };
      body.dizzy = 0;
      return;
    }
    body.dizzy = 0;
    if (!t.nearMiss || performance.now() - lastNearEdge < NEAR_EDGE_COOLDOWN) return;
    const reach = w.half * 0.6;
    const atLeft = body.x - w.floor.x0 < reach && drift < -60;
    const atRight = w.floor.x1 - body.x < reach && drift > 60;
    if (atLeft || atRight || w.floor.narrow) {
      lastNearEdge = performance.now();
      const dir = atLeft ? -1 : atRight ? 1 : (Math.sign(drift) || body.facing);
      body.pendingAfter = { kind: 'balance', dir };
    }
  }

  /** The edge a falling Buddy could grab now: the collapsed rail, or a real sidebar edge. */
  function grabEdge(w) {
    if (w.rail.valid) return { on: 'rail', edge: w.rail };
    if (w.wall.valid) return { on: 'wall', edge: w.wall };
    return null;
  }

  /**
   * Passing close to an edge on the way down, Buddy may reach for it. Only when
   * the geometry allows (its side within REACH px of the edge, moving toward or
   * along it, inside the edge's span), after reaching out for REACH_FIRST, at
   * most once per fall and once per CATCH_COOLDOWN; on CATCH_ODDS of such
   * passes. Too fast and the hand slips.
   * After a miss the next plausible attempt holds, so Buddy never looks
   * hopeless at the same edge. data.reach (0…1) drives the reaching arm.
   */
  function tryCatch(w, dt) {
    data.reach = 0;
    if (data.caught || data.rebound || data.noCatch || !tune().catching) return false;
    if (state !== 'falling' && state !== 'thrown') return false; // a hop or a knock never grabs
    const target = grabEdge(w);
    if (!target) return false;
    if (data.fromSlip && target.on === 'wall') return false; // reopening the sidebar mid-fall does not re-grip
    const { edge } = target;
    const gap = body.x - w.half - edge.x; // Buddy's left side to the edge
    const inSpan = body.y > edge.top + w.height * 0.3 && body.y < edge.bottom - w.height * 1.4;
    if (!inSpan || gap < -4 || gap > REACH * 3 || body.vx > 80) return false;
    if (performance.now() - lastCatch < CATCH_COOLDOWN * 1000) return false; // not trying this time: no reach either
    if (!missedLast && (data.catchRoll ?? 1) > CATCH_ODDS) return false; // this fall, Buddy does not try
    data.reach = Math.max(clamp(1 - (gap - REACH) / (REACH * 2), 0, 1), gap <= REACH ? 0.6 : 0); // the arm stretches out as the edge nears
    data.reachFor = (data.reachFor || 0) + dt;
    if (gap > REACH || data.reachFor < REACH_FIRST) return false;
    data.caught = true;
    lastCatch = performance.now();
    if (body.vy > CATCH_MAX_VY && !missedLast) {
      // Reached for it and the hand slipped: the fall goes on, with a little spin.
      missedLast = true;
      stats.misses = (stats.misses || 0) + 1;
      body.omega += 90;
      data.missedAt = clock;
      deps.emit('catch-miss', { vy: body.vy });
      return false;
    }
    missedLast = false;
    const caught = enter('hanging', { on: target.on, impact: Math.max(0, body.vy) });
    if (caught) deps.emit('caught', { on: target.on });
    return caught;
  }

  /**
   * Horizontal speed for a fall starting now. Buddy kicks off a little toward
   * the nearest floor spot that covers nothing essential, if one is within
   * reach of this fall (about 150px); otherwise it falls naturally and walks
   * out of the way after recovering.
   */
  function landingDrift(natural, w) {
    const h = Math.max(0, w.floor.y - body.y);
    const flight = (-body.vy + Math.sqrt(body.vy * body.vy + 2 * G * h)) / G;
    if (flight < 0.12) return natural;
    const naturalX = body.x + natural * flight;
    const spot = world.clearSpot(naturalX);
    if (!spot.clear || Math.abs(spot.x - naturalX) > 150) return natural;
    data.landingTarget = spot.x;
    // Air drag (exp(-0.9 t)) slows vx; compensate so Buddy arrives where intended.
    const dragged = (1 - Math.exp(-0.9 * flight)) / 0.9;
    return (spot.x - body.x) / dragged;
  }

  function arrive(then) {
    const w = world.get();
    if (then === 'mount') {
      if (w.wall.valid && Math.abs(body.x - w.wall.attachX) < 2) {
        body.facing = -1;
        enter('mounting', { targetY: data.targetY ?? world.climbTarget(0.6) });
        return;
      }
      enter('looking');
      return;
    }
    if (then === 'peek') {
      body.peek = true; // nowhere is clear: stay low at the least-covered spot
      enter('idle');
    } else if (then === 'surprised') enter('looking');
    else if (then === 'sit') enter('sitting');
    else enter('idle');
  }

  /** Wind-up before any jump: crouch, then launch with the given velocity. */
  function crouchThenJump(launch) {
    return enter('crouching', launch);
  }

  /**
   * How long the wind-up lasts: a glance at the destination (hop off the wall,
   * or a hop sideways), the squash, and a short held beat before take-off.
   */
  function windupTime() {
    return data.fromWall ? 0.42 : Math.abs(data.vx || 0) > 1 ? 0.34 : 0.28;
  }

  // ---- Held by the pointer: a damped pendulum hanging from the grab point ----------

  /**
   * The grab point (anchor) follows the pointer; Buddy hangs from it. Its angle
   * phi (radians, + = feet to the right) obeys a pendulum equation, driven by the
   * anchor's acceleration: moving the pointer swings Buddy, stopping lets it settle.
   */
  function swing(dt) {
    if (dt <= 0) return;
    const S = size();
    const length = S * 0.74; // grab point (head top) to feet
    // The grab point trails the pointer a little (time constant 40 ms): a soft
    // hold, not a rigid one, and fast pointer jitter is smoothed away.
    const follow = 1 - Math.exp(-dt / 0.04);
    data.ax += (data.tx - data.ax) * follow;
    data.ay += (data.ty - data.ay) * follow;
    const avx = (data.ax - data.lastAx) / dt;
    const aAx = clamp((avx - data.avx) / dt, -25000, 25000);
    data.avx = avx;
    data.lastAx = data.ax;
    data.omega += (-(G / length) * Math.sin(data.phi) - 2.6 * data.omega - (aAx / length) * Math.cos(data.phi)) * dt;
    data.phi = clamp(data.phi + data.omega * dt, -1.4, 1.4);
    body.x = data.ax;
    body.y = data.ay + length;
    body.tilt = -data.phi * DEG;
    // A pointer held still: the dizziness ebbs (only real samples can raise it).
    const lastSample = data.samples[data.samples.length - 1];
    if (!lastSample || performance.now() - lastSample.t > 120) noteSpin(data.spin.decay(dt));
  }

  /** Report the spin meter's verdict: dizzy on, refreshed while it lasts, and off. */
  function noteSpin(spin) {
    const wasDizzy = data.dizzy;
    data.dizzy = spin.dizzy;
    data.spinLevel = spin.level;
    if (!tune().dizzy) return;
    const now = performance.now();
    if (spin.dizzy && (!wasDizzy || now - (data.spinSent || 0) > 400)) {
      data.spinSent = now;
      deps.emit('spin', { level: spin.level, dizzy: true });
    } else if (!spin.dizzy && wasDizzy) deps.emit('spin', { level: spin.level, dizzy: false });
  }

  function grab(px, py) {
    if (!running || deps.isReduced() || !(RESTING.has(state) || state === 'looking')) return false;
    const S = size();
    // Keep the point under the pointer where it is: the anchor is the head top.
    const headX = body.x;
    const headY = body.y - S * 0.74;
    body.pendingAfter = null;
    body.dizzy = 0;
    const ok = enter('held', {
      offX: px - headX, offY: py - headY, ax: headX, ay: headY, tx: headX, ty: headY, lastAx: headX, avx: 0, phi: 0, omega: 0, samples: [],
      spin: createSpinMeter(), dizzy: false, spinLevel: 0,
    });
    if (ok) moveHold(px, py, performance.now());
    return ok;
  }

  /**
   * The pointer moved while holding Buddy. The hold stays inside the workspace
   * (right of the sidebar, below the header, above the floor), so a throw always
   * starts from a place Buddy can be. Samples keep the last 110 ms of the pointer.
   */
  function moveHold(px, py, time) {
    if (state !== 'held') return;
    const w = world.get();
    data.tx = clamp(px - data.offX, w.floor.x0, w.floor.x1);
    data.ty = clamp(py - data.offY, w.headerBottom + 4, w.floor.y - size() * 0.74);
    data.samples.push({ t: time, x: data.tx, y: data.ty });
    while (data.samples.length > 2 && time - data.samples[0].t > 110) data.samples.shift();
    // Spin is measured from the pointer itself (not the clamped hold point), so a spin
    // pressed against the edge of the workspace still counts as the circle it is.
    noteSpin(data.spin.push(px, py, time));
    ensureLoop();
  }

  /**
   * Velocity of the pointer over its last ~110 ms, in px/s. Zero when the
   * pointer had stopped before letting go (last sample older than 70 ms), when
   * there are too few samples, or when they span under 12 ms — so a slow drag
   * ending in a still release just drops Buddy, whatever happened earlier.
   */
  function throwVelocity(now) {
    const s = data.samples;
    if (s.length < 2 || now - s[s.length - 1].t > 70) return { vx: 0, vy: 0 };
    const recent = s.filter((p) => now - p.t <= 110);
    if (recent.length < 2) return { vx: 0, vy: 0 };
    const span = (recent[recent.length - 1].t - recent[0].t) / 1000;
    if (span < 0.012) return { vx: 0, vy: 0 };
    return { vx: (recent[recent.length - 1].x - recent[0].x) / span, vy: (recent[recent.length - 1].y - recent[0].y) / span };
  }

  /** Let go: fly off with the pointer's recent velocity and the swing's spin. */
  function release(now = performance.now()) {
    if (state !== 'held') return false;
    // Throwing switched off: letting go just drops Buddy (same physics, no launch speed).
    let { vx, vy } = tune().throwOn ? throwVelocity(now) : { vx: 0, vy: 0 };
    const speed = Math.hypot(vx, vy);
    if (speed > THROW_MAX) { vx *= THROW_MAX / speed; vy *= THROW_MAX / speed; }
    body.dizzy = data.dizzy && tune().dizzy ? Math.max(1, data.spinLevel || 1) : 0;
    // Re-anchor from the head-top pivot (held) to the body-centre pivot (airborne) without a jump.
    const S = size();
    const theta = body.tilt / DEG;
    body.x = data.ax - S * 0.33 * Math.sin(theta);
    body.y = data.ay + S * 0.33 * Math.cos(theta) + S * 0.41;
    body.vx = vx;
    body.vy = vy;
    body.omega = clamp(-data.omega * DEG, -500, 500);
    body.facing = vx >= 0 ? 1 : -1;
    stats.throws++;
    return enter('thrown', { speed: Math.round(speed) });
  }

  // ---- Poses ----------------------------------------------------------------------

  function targetPose() {
    const p = restPose();
    const t = elapsed();
    p.turn = body.facing * 0.45;
    p.tilt = body.tilt;
    switch (state) {
      case 'idle':
        p.tilt = 0;
        if (world.get().floor.narrow) { p.armL = 34; p.armR = 34; } // a narrow ledge: arms a little out for balance
        break;
      case 'petted': {
        // A gentle pat: eyes close, Buddy leans into the hand, the leaf wags — a few variants.
        const q = Math.min(1, t / 1.15);
        const swell = Math.sin(q * Math.PI);
        const v = data.variant || 'nuzzle';
        p.eyes = v === 'giggle' ? 'happy' : q < 0.85 ? 'closed' : 'open';
        p.mouth = v === 'giggle' ? 'grin' : 'smile';
        p.blush = swell;
        p.turn = 0;
        p.sprout = Math.sin(t * 15) * (v === 'leafwag' ? 16 : 8) * swell;
        if (v === 'nuzzle') p.tilt = (data.side || 1) * 7 * swell;
        else if (v === 'giggle') { p.bob = -Math.abs(Math.sin(t * 14)) * 2.4 * swell; p.armL = 40; p.armR = 40; }
        else if (v === 'leafwag') { p.bob = -2 * swell; p.armL = 14 + 20 * swell; p.armR = 14 + 20 * swell; }
        else p.sx = 1 + Math.sin(t * 26) * 0.04 * (1 - q); // wiggle
        break;
      }
      case 'wobbling': {
        const T = data.duration || 1.8;
        const decay = Math.max(0, 1 - t / T);
        const s = Math.sin(t * 6.5);
        p.tilt = s * 10 * decay;
        p.pivotY = 94;
        p.armL = 60 + Math.sin(t * 6.5 + 1) * 25 * decay;
        p.armR = 60 - Math.sin(t * 6.5 + 1) * 25 * decay;
        p.lift = { fl: Math.max(0, s) * 3.2 * decay, fr: Math.max(0, -s) * 2 * decay }; // uneven steps
        p.legs = { fl: 10 * s * decay, fr: -6 * s * decay };
        p.mouth = 'wobble';
        p.turn = (data.dir || 1) * 0.3;
        break;
      }
      case 'balancing': {
        // Overbalanced toward the edge, then caught: arms out flapping, a corrective foot.
        const dir = data.dir || 1;
        const e = Math.exp(-2.6 * t);
        p.tilt = dir * 11 * e * Math.cos(t * 8);
        p.pivotY = 94;
        p.armL = 100 + Math.sin(t * 16) * 22 * e;
        p.armR = 100 - Math.sin(t * 16) * 22 * e;
        p.lift = dir > 0 ? { fl: 0, fr: 4 * e } : { fl: 4 * e, fr: 0 };
        p.eyeScale = 1 + 0.15 * e;
        p.eyeX = dir * 2.2 * e;
        p.eyeY = 1.4 * e; // a glance down over the edge
        p.mouth = t < 0.6 ? 'o' : 'smile';
        p.turn = -dir * 0.3;
        break;
      }
      case 'looking': {
        const k = t < 0.6 ? -1 : t < 1.3 ? 1 : 0;
        p.eyeX = k * 3.2;
        p.eyeY = -0.6;
        p.turn = k * 0.8;
        p.mouth = data.surprised ? 'o' : 'smile';
        p.sprout = k * -6;
        break;
      }
      case 'turning': {
        const q = ease(Math.min(1, t / 0.2));
        p.turn = (data.from ?? -body.facing) * (1 - q) * 0.9 + body.facing * q * 0.9;
        p.sy = 1 - Math.sin(q * Math.PI) * 0.05;
        p.sx = 1 + Math.sin(q * Math.PI) * 0.04;
        break;
      }
      case 'walking':
      case 'avoiding': {
        const vmax = state === 'avoiding' ? AVOID : WALK;
        const k = Math.min(1.25, (data.v || 0) / vmax);
        const a = Math.sin(data.phase || 0);
        const c = Math.cos(data.phase || 0);
        p.turn = body.facing * 0.95;
        // Two legs step in turn; the lifted foot swings forward.
        p.legs = { fl: 22 * a * k, fr: -22 * a * k };
        p.lift = { fl: Math.max(0, c) * 3.6 * k, fr: Math.max(0, -c) * 3.6 * k };
        p.bob = -Math.abs(Math.sin(data.phase || 0)) * 2.6 * k;
        p.tilt = body.facing * (1.5 + 3 * k) + Math.sin((data.phase || 0) * 2) * 1.2 * k;
        p.armL = 16 + 16 * a * k;
        p.armR = 16 - 16 * a * k;
        p.sprout = Math.sin((data.phase || 0) * 2) * 3 * k;
        p.mouth = state === 'avoiding' ? 'flat' : 'smile';
        break;
      }
      case 'mounting': {
        const q = ease(Math.min(1, t / 0.34));
        p.turn = -0.95 * q + body.facing * 0.45 * (1 - q);
        p.tilt = -7 * q;
        p.bob = -Math.sin(q * Math.PI) * 7;
        p.armL = 16 + 124 * q;
        p.armR = 16 - 136 * q;
        p.legs = { fl: 28 * q, fr: 16 * q };
        break;
      }
      case 'climbing': {
        const s = Math.sin(data.phase || 0);
        p.turn = -0.95;
        p.tilt = -7 + s * 1.6 + (data.resting ? Math.sin(t * 9) * 1.2 : 0);
        // Hands alternate between holds on the edge; feet push in turn.
        p.armL = 128 + 30 * s;
        p.armR = -(128 - 30 * s);
        p.legs = { fl: 32 + 14 * s, fr: 18 - 12 * s };
        p.lift = { fl: Math.max(0, -s) * 4, fr: Math.max(0, s) * 3 };
        p.sprout = Math.sin((data.phase || 0) * 2) * 5;
        p.eyeY = data.dir < 0 ? -1.6 : 1.4;
        p.eyeX = -1.4;
        p.mouth = data.resting ? 'flat' : 'smile';
        break;
      }
      case 'gripping': {
        p.turn = -0.95;
        p.tilt = -7;
        p.armL = 142;
        p.armR = -118;
        p.legs = { fl: 33, fr: 20 };
        // Looking out over the page, then a peek down the edge, then back.
        const at = data.lookDown ?? 99;
        const down = clamp(Math.min((t - at) / 0.3, (at + 1.3 - t) / 0.3), 0, 1);
        p.eyeX = 2.6 * (1 - down) - 1 * down;
        p.eyeY = -0.4 * (1 - down) + 2.8 * down;
        p.tilt = -7 + 4 * down;
        p.mouth = down > 0.5 ? 'o' : 'smile';
        break;
      }
      case 'dismounting': {
        const q = ease(Math.min(1, t / 0.28));
        p.turn = -0.95 * (1 - q) + 0.45 * q;
        p.tilt = -7 * (1 - q);
        p.armL = 140 * (1 - q) + 14 * q;
        p.armR = -120 * (1 - q) + 14 * q;
        p.bob = -Math.sin(q * Math.PI) * 4;
        break;
      }
      case 'crouching': {
        // Phases over windupTime(): glance at the destination (first 30 %), sink
        // and load the legs (to 75 %), then hold still for a beat.
        const T = windupTime();
        const look = Math.min(1, t / (T * 0.3));
        const q = ease(clamp((t - T * 0.2) / (T * 0.55), 0, 1));
        const dir = data.fromWall ? 1 : Math.sign(data.vx || 0);
        const hold = t > T * 0.75 ? Math.sin((t - T * 0.75) * 60) * 0.006 : 0; // a tiny quiver of held tension
        if (data.fromWall) {
          p.turn = -0.95 + 0.5 * look; // looks over its shoulder at the landing spot
          p.tilt = -7 - 6 * q;
          p.armL = 142 - 10 * q;
          p.armR = -118 + 30 * q;
          p.legs = { fl: 33 + 16 * q, fr: 20 + 16 * q };
          p.eyeX = 3 * look;
          p.eyeY = 1.2 * look;
        } else {
          p.armL = 14 + 22 * q; // arms swing back for the push
          p.armR = 14 + 22 * q;
          p.legs = { fl: 22 * q, fr: -22 * q };
          p.turn = dir ? dir * 0.8 : (data.facing || body.facing) * 0.4;
          p.tilt = dir * 5 * q; // weight shifts toward the jump
          p.eyeX = dir * 2.4 * look;
          p.eyeY = -1.6 * look; // looking up at where it is going
        }
        p.sy = 1 - 0.18 * q + hold;
        p.sx = 1 + 0.13 * q - hold;
        p.bob = 2.4 * q;
        p.eyeScale = 1 - 0.08 * q;
        p.mouth = q > 0.5 ? 'flat' : 'smile';
        p.sprout = -6 * q; // the leaf bends with the squat, then whips on take-off
        break;
      }
      case 'slipping': {
        const q = Math.min(1, t / 0.3);
        p.turn = -0.95 * (1 - q * 0.6);
        p.tilt = body.tilt;
        p.pivotY = 55;
        // The near hand still grabs at where the edge was; the other flails.
        p.armL = 150 + 18 * q + Math.sin(t * 42) * 9 * q;
        p.armR = -110 + 190 * q;
        p.legs = { fl: 30 + Math.sin(t * 34) * 22 * q, fr: 10 + Math.sin(t * 38) * 18 * q };
        p.eyeScale = 1 + 0.2 * q;
        p.eyeX = -2.5;
        p.mouth = 'o';
        p.sprout = 14 * q;
        break;
      }
      case 'falling':
      case 'jumping':
      case 'knocked':
      case 'thrown': {
        const w = world.get();
        const near = clamp(1 - (w.floor.y - body.y) / 150, 0, 1); // preparing to land
        const happy = state === 'jumping' && data.mood !== 'bounce';
        const bounce = data.mood === 'bounce';
        const thrown = state === 'thrown';
        p.pivotY = 55;
        p.tilt = body.tilt;
        p.turn = body.facing * 0.3 * (1 - near);
        const flail = happy || bounce ? 0.25 : 1;
        const up = bounce ? 70 : happy ? 150 : 140;
        p.armL = up * (1 - near) + 88 * near + Math.sin(t * 26) * 20 * flail * (1 - near);
        p.armR = up * (1 - near) + 88 * near + Math.sin(t * 26 + 1.7) * 20 * flail * (1 - near);
        const kick = Math.sin(t * 22) * 18 * flail * (1 - near);
        p.legs = { fl: 14 + kick, fr: -14 - kick };
        if (data.reach > 0) {
          // An edge within reach: the near hand stretches out toward it, the face turns to it.
          p.armL = p.armL * (1 - data.reach) + 172 * data.reach;
          p.turn = p.turn * (1 - data.reach) - 0.7 * data.reach;
          p.eyeX = -2.5 * data.reach;
        }
        if (data.missedAt && clock - data.missedAt < 500) {
          // The hand slipped: an empty grab and a startled face.
          p.armL = 150 + Math.sin(t * 40) * 16;
        }
        if (data.fearful && !data.reach && near < 0.5) {
          // A long way down: both arms reach up, legs kick faster.
          p.armL = 165 + Math.sin(t * 34) * 10;
          p.armR = 165 + Math.sin(t * 34 + 1.4) * 10;
          p.legs = { fl: 14 + Math.sin(t * 30) * 24, fr: -14 - Math.sin(t * 30) * 24 };
        }
        // Throw awareness: the eyes lead along the flight; a fast spin tucks the limbs in;
        // a hard landing coming up gets braced for (arms out, knees soft). Pose only — the
        // flight itself is never changed for effect.
        const v = Math.hypot(body.vx, body.vy);
        if (!data.reach && v > 250) {
          p.eyeX += clamp(body.vx / 500, -2, 2) * (1 - near);
          p.eyeY += clamp(body.vy / 600, -2, 2) * (1 - near);
        }
        if (thrown && Math.abs(body.omega) > 300 && near < 0.3) {
          p.armL = 60 + Math.sin(t * 20) * 8;
          p.armR = 60 + Math.sin(t * 20 + 1) * 8;
          p.legs = { fl: 26, fr: -26 };
        }
        if (near > 0.4 && body.vy > 1000) {
          p.armL = 100;
          p.armR = 100;
          p.legs = { fl: 18, fr: -18 };
        }
        const stretch = Math.min(0.1, Math.max(0, body.vy) / 9000);
        p.sy = 1 + stretch;
        p.sx = 1 / Math.sqrt(1 + stretch);
        p.eyeScale = data.missedAt && clock - data.missedAt < 500 ? 1.25 : happy ? 1 : 1.18;
        p.mouth = happy || (thrown && t > 0.25 && near < 0.4) ? 'grin' : bounce || near > 0.4 ? 'wobble' : 'o';
        p.eyes = thrown && t > 0.25 && near < 0.4 ? 'happy' : 'open';
        break;
      }
      case 'held': {
        const swingRate = Math.abs(data.omega || 0);
        p.pivotY = 22;
        p.tilt = body.tilt;
        p.turn = 0;
        // Arms up toward the hand that holds Buddy; legs dangle and lag the swing.
        p.armL = 128 + Math.sin(t * 9) * 8;
        p.armR = 128 + Math.sin(t * 9 + 1.3) * 8;
        p.legs = { fl: clamp(data.omega * 6, -30, 30) + 6, fr: clamp(data.omega * 6, -30, 30) - 6 };
        p.lift = { fl: 0, fr: 0 };
        p.sy = 1.04;
        p.sx = 0.98;
        p.eyes = t > 0.35 && swingRate > 1.5 ? 'happy' : 'open';
        p.eyeScale = t < 0.35 ? 1.15 : 1;
        p.mouth = t < 0.35 ? 'o' : 'grin';
        break;
      }
      case 'hanging': {
        p.pivotY = 24;
        p.turn = -0.6;
        p.tilt = 6 + 14 * Math.exp(-2.5 * t) * Math.sin(t * 8);
        p.armL = 168; // the near hand holds the rail
        p.armR = 60 + Math.sin(t * 12) * 18;
        const kick = Math.sin(t * 10) * 16 * Math.exp(-1.2 * t);
        p.legs = { fl: 8 + kick, fr: -8 - kick };
        p.mouth = t < 0.35 ? 'o' : 'wobble';
        p.eyeScale = t < 0.35 ? 1.15 : 1;
        p.eyeX = -2;
        p.eyeY = -1.5;
        break;
      }
      case 'sliding': {
        const s = Math.sin(data.phase || 0);
        p.turn = -0.95;
        p.tilt = -6;
        p.armL = 150 + 20 * s;
        p.armR = -(140 - 20 * s);
        p.legs = { fl: 30 + 10 * s, fr: 20 - 10 * s };
        p.eyeY = 1.4;
        p.mouth = 'flat';
        break;
      }
      case 'landing': {
        const q = Math.min(1, t / data.duration);
        const k = clamp(data.impact / 2400, 0.08, 0.3);
        const spring = Math.exp(-4.5 * q) * Math.cos(q * Math.PI * 2.4);
        p.sy = 1 - k * spring;
        p.sx = 1 + k * spring * 0.75;
        const s = (spring * k) / 0.3;
        p.legs = { fl: 34 * s, fr: -34 * s };
        p.armL = 70 + 30 * s;
        p.armR = 70 + 30 * s;
        p.tilt = body.tilt;
        p.eyes = k > 0.14 && q < 0.4 ? 'closed' : 'open';
        p.mouth = q < 0.5 ? 'flat' : 'wobble';
        break;
      }
      case 'recovering': {
        const q = Math.min(1, t / 0.95);
        p.tilt = 8 * Math.exp(-3 * q) * Math.sin(q * 16);
        p.pivotY = 92;
        const dizzy = q < 0.65 ? 1 - q / 0.65 : 0;
        p.eyeX = 2.2 * Math.cos(t * 13) * dizzy;
        p.eyeY = 2.2 * Math.sin(t * 13) * dizzy;
        if (q > 0.7 && q < 0.9) p.sx = 1 + Math.sin((q - 0.7) * 90) * 0.035; // shake it off
        p.mouth = q < 0.6 ? 'wobble' : 'smile';
        p.armL = 30 * (1 - q) + 14 * q;
        p.armR = 30 * (1 - q) + 14 * q;
        break;
      }
      case 'sitting':
        p.bob = 5;
        p.legs = { fl: 62, fr: -62 };
        p.lift = { fl: 2, fr: 2 };
        p.armL = 8;
        p.armR = 8;
        p.turn = body.facing * 0.25;
        break;
      case 'thinking':
        if (t < 1.4) {
          // Scratch the head, then settle into a hand-on-chin "hmm".
          p.armR = -(150 + Math.sin(t * 16) * 12);
          p.eyeX = 1.6;
          p.eyeY = -2.2;
        } else {
          p.armR = -78;
          p.eyeX = -2;
          p.eyeY = -2.6;
        }
        p.mouth = 'flat';
        p.sprout = -8;
        p.turn = -0.3;
        break;
      case 'sleeping':
        p.bob = 5;
        p.legs = { fl: 62, fr: -62 };
        p.armL = 6;
        p.armR = 6;
        p.eyes = 'closed';
        p.mouth = 'small';
        p.sprout = 12;
        p.turn = 0;
        break;
      case 'yawning': {
        const q = Math.min(1, t / 1.4);
        const open = Math.sin(Math.min(1, q / 0.8) * Math.PI);
        p.mouth = open > 0.3 ? 'yawn' : 'small';
        p.eyes = q > 0.18 ? 'closed' : 'open';
        p.armL = 14 + 100 * open;
        p.armR = 14 + 100 * open;
        p.sy = 1 + 0.04 * open;
        p.bob = 5 * Math.max(0, (q - 0.75) / 0.25); // settles down to sleep
        p.legs = { fl: 62 * Math.max(0, (q - 0.75) / 0.25), fr: -62 * Math.max(0, (q - 0.75) / 0.25) };
        p.turn = 0;
        break;
      }
      case 'stretching': {
        const q = Math.min(1, t / 1.1);
        const up = Math.sin(Math.min(1, q / 0.85) * Math.PI);
        p.armL = 14 + 156 * up;
        p.armR = 14 + 156 * up;
        p.sy = 1 + 0.08 * up;
        p.sx = 1 - 0.04 * up;
        p.eyes = q < 0.5 ? 'closed' : 'open';
        p.mouth = q < 0.5 ? 'small' : 'smile';
        p.turn = 0;
        break;
      }
      case 'celebrating': {
        const hop = Math.abs(Math.sin(Math.min(1, t / 1.1) * Math.PI * 2));
        p.bob = -hop * 9;
        p.sy = 1 + hop * 0.04;
        p.armL = 160 + Math.sin(t * 18) * 14;
        p.armR = 160 + Math.sin(t * 18 + 1) * 14;
        p.eyes = data.mood === 'sparkle' ? 'sparkle' : 'happy';
        p.mouth = 'grin';
        p.sprout = Math.sin(t * 20) * 12;
        p.turn = 0;
        break;
      }
      case 'interacting':
        p.sx = 1 + Math.sin(t * 30) * 0.05 * (1 - t / 0.65);
        p.bob = -Math.abs(Math.sin(t * 9)) * 5;
        p.eyes = 'happy';
        p.mouth = 'grin';
        p.armL = 70;
        p.armR = 70;
        p.turn = 0;
        p.blush = 1;
        break;
      case 'worried':
        p.sweat = Math.min(1, t / 1.6);
        p.mouth = 'wobble';
        p.eyeScale = 0.92;
        p.eyeY = 1.2;
        p.armR = -(140 + Math.sin(t * 14) * 10); // scratching the head
        p.turn = 0.2;
        break;
      case 'pleased': {
        // A small, calm "yes!": a nod, a happy squint, a hint of blush (quiet mode's celebration).
        const q = Math.min(1, t / 0.9);
        p.bob = -Math.sin(q * Math.PI) * 2.5;
        p.tilt = Math.sin(q * Math.PI * 2) * 2;
        p.eyes = 'happy';
        p.mouth = 'smile';
        p.blush = Math.sin(q * Math.PI) * 0.8;
        p.armL = 14 + 18 * Math.sin(q * Math.PI);
        p.armR = 14 + 18 * Math.sin(q * Math.PI);
        p.turn = 0.1;
        break;
      }
      case 'inspecting': {
        // Looks one way, the other, then down at the floor beside its feet.
        const k = t < 0.7 ? -1 : t < 1.4 ? 1 : 0;
        const down = clamp((t - 1.4) / 0.25, 0, 1) * clamp((2.2 - t) / 0.25, 0, 1);
        p.turn = k * 0.85;
        p.eyeX = k * 2.8;
        p.eyeY = -0.4 * (1 - down) + 2.6 * down;
        p.tilt = k * 2 + body.facing * 4 * down;
        p.mouth = down > 0.5 ? 'small' : 'smile';
        p.armR = k > 0 ? -60 : 14; // a hand shading the eyes as it looks
        break;
      }
      case 'shifting': {
        // Weight from foot to foot: a little shuffle to a comfier stance.
        const q = Math.min(1, t / 0.9);
        const a = Math.sin(q * Math.PI * 2);
        p.tilt = a * 3;
        p.lift = { fl: Math.max(0, a) * 3, fr: Math.max(0, -a) * 3 };
        p.legs = { fl: 6 * a, fr: 6 * a };
        p.bob = -Math.abs(a) * 1.2;
        break;
      }
      case 'fidgeting': {
        // One hand reaches up and straightens the leaf, which wobbles back.
        const q = Math.min(1, t / 1.3);
        const reach = Math.sin(Math.min(1, q / 0.7) * Math.PI);
        p.armR = -(14 + 150 * reach);
        p.eyeY = -2.2 * reach;
        p.eyeX = 0.8 * reach;
        p.sprout = Math.sin(t * 14) * 6 * reach;
        p.mouth = 'small';
        p.turn = -0.15;
        break;
      }
      case 'waving':
        p.armR = 150 + Math.sin(t * 13) * 28; // right hand up, waving
        p.armL = 18;
        p.eyes = t < 0.8 ? 'happy' : 'open';
        p.mouth = 'grin';
        p.turn = 0.1;
        p.bob = -Math.abs(Math.sin(t * 6.5)) * 2;
        break;
      default:
        break;
    }
    return p;
  }

  function blended(target) {
    if (!blend) return target;
    const q = (clock - blend.start) / BLEND_MS;
    if (q >= 1) { blend = null; return target; }
    const k = ease(q);
    const from = blend.from;
    const mix = (a, b) => a + (b - a) * k;
    const out = { ...target, legs: {}, lift: {} };
    for (const key of ['tilt', 'pivotY', 'sx', 'sy', 'bob', 'turn', 'armL', 'armR', 'eyeX', 'eyeY', 'eyeScale', 'sprout', 'sweat', 'blush']) out[key] = mix(from[key] ?? 0, target[key] ?? 0);
    for (const leg of ['fl', 'fr']) {
      out.legs[leg] = mix(from.legs[leg] ?? 0, target.legs[leg] ?? 0);
      out.lift[leg] = mix(from.lift[leg] ?? 0, target.lift[leg] ?? 0);
    }
    return out;
  }

  // ---- Secondary motion: springs and gaze ---------------------------------------------

  /**
   * Push the springs with Buddy's real change of velocity this frame. Big jumps
   * in position (resize, re-placement) are ignored: they are not motion.
   */
  function updateSecondary(dt) {
    if (deps.isReduced()) {
      for (const s of Object.values(springs)) { s.x = 0; s.v = 0; }
      gaze.x = 0;
      gaze.y = 0;
      return;
    }
    if (dt > 0) {
      const dx = body.x - measure.px;
      const dy = body.y - measure.py;
      if (!measure.valid || Math.abs(dx) > 70 || Math.abs(dy) > 90) {
        measure.valid = true;
        measure.vx = 0;
        measure.vy = 0;
      } else {
        const vx = dx / dt;
        const vy = dy / dt;
        const dvx = clamp(vx - measure.vx, -900, 900);
        const dvy = clamp(vy - measure.vy, -1600, 1600);
        // Speeding up to the right leaves the leaf and hands behind (to the left);
        // a sudden stop of downward motion (a landing) whips the leaf and flings the arms.
        const stop = dvy < 0 && measure.vy > 200 ? -dvy : 0;
        springs.sprout.v += -dvx * 0.9 + stop * 0.12;
        springs.armL.v += dvx * 0.35 + stop * 0.09;
        springs.armR.v += -dvx * 0.35 + stop * 0.09;
        if (body.surface === 'floor') springs.sway.v += -dvx * 0.08;
        // Yanked up or down by the pointer: the leaf flexes against the vertical pull too.
        if (state === 'held') springs.sprout.v += -dvy * 0.08;
        measure.vx = vx;
        measure.vy = vy;
      }
      measure.px = body.x;
      measure.py = body.y;
      for (const s of Object.values(springs)) stepSpring(s, dt);
      const g = Math.min(1, dt * 9);
      gaze.x += (gaze.tx - gaze.x) * g;
      gaze.y += (gaze.ty - gaze.y) * g;
    }
  }

  function secondarySettled() {
    const still = Object.values(springs).every(springStill);
    const gazeDone = Math.abs(gaze.tx - gaze.x) < 0.05 && Math.abs(gaze.ty - gaze.y) < 0.05;
    if (still) for (const s of Object.values(springs)) { s.x = 0; s.v = 0; }
    if (gazeDone) { gaze.x = gaze.tx; gaze.y = gaze.ty; }
    return still && gazeDone;
  }

  /** Leaf rest angle target: droops in quiet mode unless it recently perked up. */
  const leafTarget = () => (leaf.droop && performance.now() > leaf.perkUntil ? 30 : 0);
  /** Ease leaf.base toward its target (snaps under reduced motion). */
  function updateLeaf(dt) {
    const target = leafTarget();
    if (deps.isReduced()) leaf.base = target;
    else leaf.base += (target - leaf.base) * Math.min(1, dt * 4);
    if (Math.abs(target - leaf.base) < 0.2) leaf.base = target;
  }

  // Faces layered over calm states (express()). Values override the state's own face.
  const FACES = {
    happy: { eyes: 'happy', mouth: 'grin' },
    pleased: { eyes: 'happy', mouth: 'smile', blush: 0.5 },
    sparkle: { eyes: 'sparkle', mouth: 'grin' },
    concerned: { mouth: 'wobble', eyeY: 1.2, eyeScale: 0.92, sweat: 'slide' },
    surprised: { mouth: 'o', eyeScale: 1.25 },
    wink: { eyes: 'wink', mouth: 'grin' },
    curious: { mouth: 'small', eyeScale: 1.1, eyeY: -0.8, tilt: 4 },
    thinking: { mouth: 'flat', eyeX: -1.6, eyeY: -2.2 },
    sleepy: { mouth: 'small', eyeScale: 0.62, eyeY: 1 },
    blush: { mouth: 'smile', blush: 1 },
    greeting: { eyes: 'happy', mouth: 'grin' },
  };
  function applyFace(p) {
    if (!face || !FACE_STATES.has(state)) return;
    if (performance.now() >= face.until) { face = null; return; }
    const f = FACES[face.kind];
    for (const [key, value] of Object.entries(f)) {
      if (key === 'sweat') p.sweat = Math.min(1, (performance.now() - face.start) / 1600);
      else if (key === 'tilt' || key === 'eyeX' || key === 'eyeY') p[key] += value;
      else p[key] = value;
    }
  }

  // ---- Rendering -------------------------------------------------------------------

  function renderNow() {
    if (!running) return;
    const p = blended(targetPose());
    const feeling = deps.emotion?.current();
    if (feeling) {
      // A feeling replaces a passing face; it draws only the face (and, when calm, arms and a lean).
      const t = tune();
      deps.emotion.overlay(p, {
        calm: EMOTION_CALM.has(state) && body.surface === 'floor', airborne: AIRBORNE.has(state) || state === 'held',
        reduced: deps.isReduced(), particles: t.particles, expression: t.expression,
      });
    } else applyFace(p);
    p.sprout += springs.sprout.x + leaf.base;
    p.armL += springs.armL.x;
    p.armR += springs.armR.x;
    if (body.surface === 'floor' && !AIRBORNE.has(state)) p.tilt += springs.sway.x;
    if (GAZE_STATES.has(state)) {
      p.eyeX += gaze.x;
      p.eyeY += gaze.y;
    }
    pose = p;
    character.applyPose(pose);
    const w = world.get();
    const S = w.height / 0.96;
    const px = Math.round((body.x - S / 2) * 10) / 10;
    const py = Math.round((body.y - w.height) * 10) / 10;
    el.container.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    el.container.classList.toggle('is-peeking', body.peek);
    el.container.classList.toggle('is-sleeping', state === 'sleeping');
    const speed = AIRBORNE.has(state) && !deps.isReduced() && tune().speedLines && Math.hypot(body.vx, body.vy) > 900 ? (Math.abs(body.vx) > Math.abs(body.vy) ? 'side' : 'down') : '';
    if (speed !== speedShown) {
      speedShown = speed;
      el.container.classList.toggle('is-fast', speed !== '');
      el.container.dataset.speed = speed;
    }
    el.container.classList.toggle('is-held', state === 'held');
    el.container.dataset.surface = body.surface;

    // Contact shadow: on the floor under Buddy (smaller and fainter the higher it is),
    // or against the edge Buddy holds (sidebar or rail).
    const shadow = el.shadow;
    if (body.surface === 'wall' || body.surface === 'rail') {
      const edgeX = body.surface === 'rail' ? w.rail.x : w.wall.x;
      shadow.style.transform = `translate3d(${Math.round(edgeX - S * 0.2)}px, ${Math.round(body.y - w.height * 0.62)}px, 0) rotate(90deg) scale(0.62, 0.8)`;
      shadow.style.opacity = '0.55';
    } else {
      const h = Math.max(0, w.floor.y - body.y);
      const s = Math.max(0.3, 1 - h / 380) * (pose.sx || 1);
      shadow.style.transform = `translate3d(${Math.round(body.x - S * 0.4)}px, ${Math.round(w.floor.y - S * 0.1)}px, 0) scale(${s.toFixed(3)}, ${s.toFixed(3)})`;
      shadow.style.opacity = body.peek ? '0' : String(Math.max(0.15, 1 - h / 300).toFixed(2));
    }
    if (deps.debug) {
      trace.push({
        t: Math.round(clock), s: state, x: Math.round(body.x * 10) / 10, y: Math.round(body.y * 10) / 10, vy: Math.round(body.vy),
        tilt: Math.round(pose.tilt * 10) / 10, sy: Math.round(pose.sy * 1000) / 1000, armL: Math.round(pose.armL),
        sp: Math.round(springs.sprout.x * 10) / 10, sw: Math.round(pose.sweat * 100) / 100,
      });
      if (trace.length > 6000) trace.shift();
    }
  }

  // ---- The loop -----------------------------------------------------------------------

  function needsFrames() {
    if (!running || paused) return false;
    if (FRAMES.has(state) || blend !== null || clock < (data.framesUntil || 0)) return true;
    if (leaf.base !== leafTarget() && !deps.isReduced()) return true;
    if (face && face.kind === 'concerned' && FACE_STATES.has(state) && performance.now() - face.start < 1700) return true; // the sweat drop slides
    if (deps.emotion?.animating()) return true; // a feeling with moving parts (swirl, tears, tremble)
    return !deps.isReduced() && !secondarySettled();
  }

  function ensureLoop() {
    // Inside a frame (a state change during step) the frame itself requests the
    // next one; restarting here would reset the measured velocity mid-motion and
    // swallow the very change of speed (a landing) that should push the springs.
    if (raf || inFrame || !needsFrames()) return;
    lastFrame = performance.now();
    measure.valid = false; // the last measured velocity is stale after a pause
    request();
  }

  function request() {
    raf = requestAnimationFrame(frame);
    stats.outstandingRaf++;
    stats.maxOutstandingRaf = Math.max(stats.maxOutstandingRaf, stats.outstandingRaf);
  }

  function frame(now) {
    raf = 0;
    stats.outstandingRaf--;
    if (!needsFrames()) return;
    const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000)) * timeScale;
    lastFrame = now;
    clock += dt * 1000;
    stats.frames++;
    inFrame = true;
    try {
      step(dt);
      if (!running) return;
      if (!Number.isFinite(body.x) || !Number.isFinite(body.y)) { stats.invalid++; placeCalmly(); }
      else {
        updateSecondary(dt);
        updateLeaf(dt);
        renderNow();
      }
    } finally {
      inFrame = false;
    }
    if (needsFrames() && !raf) request();
  }

  function stopLoop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      stats.outstandingRaf--;
    }
  }

  // ---- Reacting to the environment -----------------------------------------------------

  /** Geometry changed (sidebar, resize, route…). Called after world.invalidate(). */
  function reconcile() {
    if (!running) return;
    const w = world.get();
    if (deps.isReduced()) {
      placeCalmly();
      return;
    }
    if (state === 'held') return; // the pointer decides where Buddy is
    const onWall = ON_WALL.has(state) || (state === 'crouching' && data.fromWall);
    if (onWall) {
      if (!w.wall.valid) {
        if (state === 'mounting') body.y = Math.min(body.y, w.floor.y);
        enter('slipping');
        return;
      }
      body.x = w.wall.attachX;
      body.y = clamp(body.y, w.wall.top, w.wall.bottom);
    } else if (state === 'hanging' && data.on === 'wall') {
      if (!w.wall.valid) {
        body.vx = 20;
        body.vy = 0;
        enter('falling', { omega: 50, noCatch: true });
        return;
      }
    } else if (ON_RAIL.has(state)) {
      if (!w.rail.valid) {
        // The rail grew back into a full sidebar (or vanished): get knocked clear, or fall.
        if (w.floor.roomy && body.x < w.floor.x0) knockTo(w.floor.x0 + w.half * 1.5, w);
        else {
          body.vx = 20;
          body.vy = 0;
          enter('falling', { omega: 50, noCatch: true });
        }
        return;
      }
      if (state === 'sliding') body.x = w.rail.attachX;
    } else if (!AIRBORNE.has(state)) {
      body.y = w.floor.y; // the floor carries Buddy (e.g. the window got shorter)
      if (body.x < w.floor.x0 - 1 && w.floor.roomy) {
        knockTo(w.floor.x0 + w.half * 1.5, w);
        return;
      }
      if (body.x > w.floor.x1) body.x = w.floor.x1;
    }
    renderNow();
    ensureLoop();
  }

  /** The sidebar grew over Buddy: it gets bumped clear of the edge. */
  function knockTo(targetX, w) {
    const flight = 0.36;
    body.vy = -(G * flight) / 2;
    body.vx = (Math.min(w.floor.x1, targetX) - body.x) / flight / 0.85;
    body.facing = 1;
    body.omega = 260;
    enter('knocked');
  }

  // ---- Commands ---------------------------------------------------------------------

  function go(target, { fast = false, then = 'idle', targetY } = {}) {
    const w = world.get();
    const goal = clamp(target, w.floor.x0, w.floor.x1);
    const kind = fast ? 'avoiding' : 'walking';
    if (Math.abs(goal - body.x) < 1) {
      data.targetY = targetY;
      arrive(then);
      return true;
    }
    const dir = Math.sign(goal - body.x);
    if (dir !== body.facing) {
      const from = body.facing;
      body.facing = dir;
      return enter('turning', { next: kind, target: goal, then, from, targetY });
    }
    return enter(kind, { target: goal, then, v: state === kind ? data.v : 0, phase: 0, targetY });
  }

  /** Activities requested by the scheduler. Returns false when not possible now. */
  function perform(kind, options = {}) {
    if (!running) return false;
    const w = world.get();
    const reduced = deps.isReduced();
    const resting = RESTING.has(state) || state === 'looking';
    if (kind === 'interrupt') {
      // The learner reached for Buddy mid-habit: a nonessential gesture ends at once.
      if (!INTERRUPTIBLE.has(state)) return false;
      return reduced ? (force('idle'), true) : enter('idle');
    }
    if (!resting && !['sleep', 'wake', 'pleased'].includes(kind)) return false;
    if (reduced && !['sit', 'think', 'sleep', 'wake', 'idle', 'pleased'].includes(kind)) return false;
    switch (kind) {
      case 'wander': {
        const spot = world.clearSpot(options.x ?? (w.floor.x0 + rnd() * (w.floor.x1 - w.floor.x0)));
        if (!spot.clear) return false;
        return go(spot.x);
      }
      case 'avoid': {
        const spot = world.clearSpot(options.x ?? body.x);
        if (spot.clear && Math.abs(spot.x - body.x) > 2) {
          body.peek = false;
          return go(spot.x, { fast: true, then: options.then || 'idle' });
        }
        if (spot.clear && body.peek) {
          body.peek = false; // the page under Buddy changed: stand up again
          renderNow();
          return true;
        }
        if (!spot.clear) {
          // Everything is covered (e.g. a full-width lesson): duck low at the least-covered spot.
          if (Math.abs(spot.x - body.x) > 2) return go(spot.x, { fast: true, then: 'peek' });
          body.peek = true;
          renderNow();
        }
        return true;
      }
      case 'climb': {
        if (!w.wall.valid) return false;
        const targetY = world.climbTarget(options.fraction ?? 0.45 + rnd() * 0.4);
        return go(w.wall.attachX, { then: 'mount', targetY });
      }
      case 'look': return enter('looking', { surprised: Boolean(options.surprised) });
      case 'sit': return reduced ? (force('sitting'), true) : enter('sitting');
      case 'think': return reduced ? (force('thinking'), true) : enter('thinking');
      case 'sleep':
        if (state === 'sleeping' || state === 'yawning') return true;
        if (!resting) return false;
        if (reduced) { force('sleeping'); return true; }
        return enter('yawning'); // yawn first, then sleep
      case 'wake':
        if (state === 'yawning') return enter('idle'); // input during the yawn: never mind sleeping
        if (state !== 'sleeping') return false;
        if (reduced) { force('idle'); return true; }
        return enter('stretching'); // stretch, then idle
      case 'idle': return state === 'idle' || (reduced ? (force('idle'), true) : enter('idle'));
      case 'celebrate': return enter('celebrating', { mood: options.mood });
      case 'interact': return enter('interacting');
      case 'worry': return enter('worried');
      case 'wave': return enter('waving');
      case 'hop': {
        // Straight up, or a short hop sideways onto clear floor (about 50 px).
        const side = rnd() < 0.5 ? -1 : 1;
        const spot = world.clearSpot(body.x + side * 50);
        const dx = spot.clear && Math.abs(spot.x - body.x) <= 70 ? spot.x - body.x : 0;
        const flight = (2 * 330) / G;
        const vx = dx / ((1 - Math.exp(-0.9 * flight)) / 0.9);
        return crouchThenJump({ vx, vy: -330, omega: 0, mood: 'happy', facing: dx ? Math.sign(dx) : undefined });
      }
      case 'pleased':
        // A correct answer can arrive mid-walk: then only the face changes.
        if (reduced || !resting) { express('pleased', 1500, 2); return true; }
        return enter('pleased');
      case 'inspect': return enter('inspecting');
      case 'shift': return enter('shifting');
      case 'fidget': return enter('fidgeting');
      case 'pet': return enter('petted', { variant: options.variant, side: options.side });
      case 'balance': return enter('balancing', { dir: options.dir || body.facing });
      case 'wobble': return enter('wobbling', { duration: options.duration, then: options.then });
      default: return false;
    }
  }

  /**
   * Show a face for `ms` over calm states. A face with a lower priority than the
   * one showing is ignored (user interaction 3 > learning event 2 > glance 1).
   * Physical states never show it: drags, falls and landings keep their own
   * faces (FACE_STATES), so physical safety always wins.
   */
  function express(kind, ms = 1600, prio = 2) {
    if (!running || !FACES[kind]) return false;
    const now = performance.now();
    if (face && now < face.until && face.prio > prio) return false;
    face = { kind, start: now, until: now + ms, prio };
    own.setTimeout(() => { if (face && performance.now() >= face.until) { face = null; renderNow(); } }, ms + 20);
    renderNow();
    ensureLoop();
    return true;
  }

  /** Put Buddy somewhere sensible without animation (start, re-enable, reduced motion). */
  function placeCalmly(preferredX) {
    const w = world.get();
    const spot = world.clearSpot(preferredX ?? (body.x || w.floor.x1));
    body.x = spot.x;
    body.y = w.floor.y;
    body.vx = 0;
    body.vy = 0;
    body.tilt = 0;
    body.peek = !spot.clear;
    body.pendingRecover = false;
    body.pendingAfter = null;
    body.dizzy = 0;
    body.omega = 0;
    blend = null;
    for (const s of Object.values(springs)) { s.x = 0; s.v = 0; }
    gaze.x = 0;
    gaze.y = 0;
    gaze.tx = 0;
    gaze.ty = 0;
    force(deps.isReduced() ? 'sitting' : 'idle');
  }

  return {
    start(preferredX) {
      running = true;
      paused = false;
      const w = world.get();
      body.facing = -1;
      placeCalmly(preferredX ?? w.floor.x1 - w.half * 2);
    },
    stop() {
      running = false;
      stopLoop();
      for (const id of stateTimers) own.clearTimeout(id);
      stateTimers = new Set();
    },
    pause() {
      paused = true;
      stopLoop();
    },
    resume() {
      paused = false;
      ensureLoop();
    },
    reconcile,
    perform,
    placeCalmly,
    /**
     * Rescue: whatever Buddy was doing (held, flying, stuck mid-climb), stop it
     * and stand it on a clear spot of the floor measured now, near `preferredX`.
     * The caller has already let go of any pointer. Never a fixed coordinate.
     */
    rescue(preferredX) {
      if (!running) return false;
      stats.rescues = (stats.rescues || 0) + 1;
      world.invalidate();
      const w = world.get();
      placeCalmly(Number.isFinite(preferredX) ? preferredX : clamp(body.x, w.floor.x0, w.floor.x1));
      return true;
    },
    grab,
    moveHold,
    release,
    /** The pointer was lost mid-drag (cancel, tab hidden): just let go. */
    drop() {
      if (state !== 'held') return false;
      data.samples = [];
      return release();
    },
    /** Leave the wall the slow way (e.g. search results opened over Buddy). */
    climbDown() {
      if (state !== 'climbing' && state !== 'gripping') return false;
      if (state === 'climbing' && data.dir > 0) return true;
      return enter('climbing', { targetY: world.get().wall.bottom, dir: 1, then: 'dismount', phase: 0 });
    },
    /** A push from outside (fast page scroll): Buddy sways like a passenger. */
    nudge(amount) {
      if (!running || deps.isReduced() || body.surface !== 'floor' || state === 'held') return;
      springs.sway.v += clamp(amount, -60, 60);
      springs.sprout.v += clamp(amount, -60, 60) * 1.6;
      ensureLoop();
    },
    /** Where the eyes look in calm states, in eye units (±3); null = straight ahead. */
    setGaze(gx, gy) {
      const tx = gx == null || deps.isReduced() ? 0 : clamp(gx, -3, 3);
      const ty = gy == null || deps.isReduced() ? 0 : clamp(gy, -3, 3);
      if (Math.abs(tx - gaze.tx) < 0.15 && Math.abs(ty - gaze.ty) < 0.15) return;
      gaze.tx = tx;
      gaze.ty = ty;
      if (deps.isReduced()) { gaze.x = 0; gaze.y = 0; }
      ensureLoop();
    },
    /** Quiet mode droops the leaf; perk() lifts it (with a boing) for PERK_MS. */
    setLeafDroop(droop) {
      if (leaf.droop === droop) return;
      leaf.droop = droop;
      if (deps.isReduced()) leaf.base = leafTarget(); // no frames run: apply at once
      renderNow();
      ensureLoop();
    },
    perk() {
      leaf.perkUntil = performance.now() + PERK_MS;
      own.setTimeout(() => { // ease back down when the perk ends (at once under reduced motion)
        if (deps.isReduced()) { leaf.base = leafTarget(); renderNow(); } else ensureLoop();
      }, PERK_MS + 20);
      if (deps.isReduced()) leaf.base = leafTarget();
      if (!deps.isReduced()) springs.sprout.v -= 160;
      renderNow();
      ensureLoop();
    },
    refresh() {
      // Inside a frame (a feeling changed in response to a step) the frame renders anyway.
      if (inFrame) return;
      renderNow();
      ensureLoop();
    },
    express,
    /**
     * The button alternative to throwing: a gentle toss up and to the roomier
     * side from where Buddy stands. Only from a resting state, never reduced.
     */
    toss() {
      if (!running || deps.isReduced() || !(RESTING.has(state) || state === 'looking')) return false;
      const w = world.get();
      const room = body.x - w.floor.x0 > w.floor.x1 - body.x ? -1 : 1;
      body.vx = room * (160 + rnd() * 120);
      body.vy = -(620 + rnd() * 160);
      body.omega = room * (200 + rnd() * 160);
      body.facing = room;
      stats.throws++;
      return enter('thrown', { speed: Math.round(Math.hypot(body.vx, body.vy)), tossed: true });
    },
    /** Test hook: walk to x on the floor (whatever is under it). */
    walkTo: (x) => (RESTING.has(state) || state === 'looking') && go(x),
    /** Test hook: put Buddy on the sidebar edge and start climbing from `fromFraction` up to `toFraction`. */
    climbFromWall(fromFraction = 0, toFraction = 0.9) {
      const w = world.get();
      if (!w.wall.valid || deps.isReduced()) return false;
      const span = w.wall.bottom - w.wall.top;
      body.x = w.wall.attachX;
      body.y = w.wall.bottom - span * fromFraction;
      body.facing = -1;
      force('climbing', { targetY: w.wall.bottom - span * toFraction, dir: -1, then: 'grip', phase: 0 });
      return true;
    },
    /** Test hook: start a fall at (x, y) with the given velocity (as if thrown). */
    launch(x, y, vx, vy) {
      if (deps.isReduced()) return false;
      body.x = x;
      body.y = y;
      body.vx = vx;
      body.vy = vy;
      body.omega = 0;
      force('thrown', {});
      return true;
    },
    setTimeScale(k) { timeScale = clamp(k, 0.02, 4); },
    get state() { return state; },
    get body() { return body; },
    isResting: () => RESTING.has(state),
    isOnWall: () => ON_WALL.has(state) || ON_RAIL.has(state),
    isAirborne: () => AIRBORNE.has(state),
    isHeld: () => state === 'held',
    /** Calm enough for idle habits: resting on the floor. */
    isCalm: () => RESTING.has(state) && body.surface === 'floor',
    /** Buddy's body box now: the same box the world uses to judge spots. */
    box: () => world.boxAt(body.x, body.y),
    snapshot() {
      const w = world.get();
      return {
        state, gen, x: body.x, y: body.y, vx: body.vx, vy: body.vy, tilt: pose.tilt, sx: pose.sx, sy: pose.sy,
        surface: body.surface, support: ON_WALL.has(state) ? 'sidebar-edge' : ON_RAIL.has(state) ? 'rail' : AIRBORNE.has(state) ? null : state === 'held' ? 'pointer' : 'floor',
        facing: body.facing, peek: body.peek, loopRunning: Boolean(raf), stateTimers: stateTimers.size, ...stats,
        springs: Object.fromEntries(Object.entries(springs).map(([k, s]) => [k, Math.round(s.x * 100) / 100])),
        gaze: { x: Math.round(gaze.x * 100) / 100, y: Math.round(gaze.y * 100) / 100 }, leafDroop: leaf.droop && performance.now() > leaf.perkUntil,
        leafBase: Math.round(leaf.base * 10) / 10, face: face && performance.now() < face.until ? face.kind : null, reach: data.reach || 0, speed: speedShown,
        floor: { ...w.floor }, wall: { ...w.wall }, rail: { ...w.rail },
        apexY: body.apexY, lastFall, pendingAfter: body.pendingAfter?.kind || null, carriedDizzy: body.dizzy,
        spin: state === 'held' ? { level: data.spinLevel || 0, dizzy: Boolean(data.dizzy) } : null, fearful: Boolean(data.fearful), variant: data.variant || null,
      };
    },
    trace,
    transitions,
  };
}
