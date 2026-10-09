// Buddy's motion: one state machine, one animation loop, simple physics.
//
// Body state is { x, y } = the point between Buddy's feet, in viewport pixels,
// plus velocity, tilt and the surface it stands on (floor, wall or air).
//
// States and how they connect (ALLOWED below is the authority):
//
//   idle ─▶ walking / avoiding ─▶ (turning) ─▶ arrive
//   idle ─▶ walking ─▶ mounting ─▶ climbing ─▶ gripping ─▶ climbing (down) ─▶ dismounting ─▶ idle
//                                     │            └──▶ jumping (hop off) ─▶ landing ─▶ idle
//                                     └─ support lost ─▶ slipping ─▶ falling ─▶ landing ─▶ recovering ─▶ idle
//   floor states ─ sidebar grows over Buddy ─▶ knocked ─▶ landing
//   idle ⇄ looking · sitting · thinking · sleeping · celebrating · interacting
//
// Only states marked `frames` run the requestAnimationFrame loop; static poses
// (idle, sitting, thinking, sleeping, gripping) cost nothing between events.
// Each state change bumps `gen`; timers created for a state are bound to its
// gen and are cleared on the next change, so they can never act late.
// Movement uses elapsed time (performance.now / rAF timestamps), so it looks
// the same at 60, 120 or 144 Hz.

import { restPose } from './character.js';

const G = 2300; // px/s², gravity
const V_MAX = 1500; // px/s, terminal fall speed
const WALK = 58;
const AVOID = 120;
const ACCEL = 260;
const CLIMB = 62;
const CLIMB_DOWN = 64;
const BLEND_MS = 140;
// Impacts are instantaneous: these states start from their own pose, unblended.
const NO_BLEND = new Set(['landing']);

const ON_WALL = new Set(['mounting', 'climbing', 'gripping']);
const AIRBORNE = new Set(['slipping', 'falling', 'jumping', 'knocked']);
export const RESTING = new Set(['idle', 'sitting', 'thinking', 'sleeping']);

const REST_EXITS = ['idle', 'walking', 'avoiding', 'turning', 'looking', 'sitting', 'thinking', 'sleeping', 'celebrating', 'jumping', 'interacting', 'knocked'];
const ALLOWED = {
  idle: [...REST_EXITS, 'mounting'],
  looking: REST_EXITS,
  sitting: REST_EXITS,
  thinking: REST_EXITS,
  sleeping: REST_EXITS,
  celebrating: ['idle', 'knocked'],
  interacting: ['idle', 'knocked'],
  turning: ['walking', 'avoiding', 'idle', 'knocked'],
  walking: ['idle', 'turning', 'walking', 'avoiding', 'mounting', 'knocked', 'sitting', 'looking'],
  avoiding: ['idle', 'turning', 'walking', 'avoiding', 'knocked', 'sitting', 'looking'],
  mounting: ['climbing', 'slipping'],
  climbing: ['climbing', 'gripping', 'dismounting', 'slipping'],
  gripping: ['climbing', 'jumping', 'slipping'],
  dismounting: ['idle', 'knocked'],
  slipping: ['falling'],
  falling: ['landing'],
  jumping: ['landing'],
  knocked: ['landing'],
  landing: ['recovering', 'idle', 'knocked'],
  recovering: ['idle', 'knocked'],
};
// States that need per-frame updates.
const FRAMES = new Set(['looking', 'turning', 'walking', 'avoiding', 'mounting', 'climbing', 'dismounting',
  'slipping', 'falling', 'jumping', 'knocked', 'landing', 'recovering', 'celebrating', 'interacting']);
export const STATES = Object.keys(ALLOWED);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2);

/**
 * deps: { world, character, el: { container, inner, shadow }, own, isReduced(),
 *         personality(), emit(event, detail), debug }
 */
export function createMotion(deps) {
  const { world, character, el, own } = deps;
  const body = { x: 0, y: 0, vx: 0, vy: 0, tilt: 0, omega: 0, facing: 1, surface: 'floor', peek: false };
  let state = 'idle';
  let data = {};
  let gen = 0;
  let stateStart = 0; // ms, motion clock
  let clock = 0; // ms of motion time (scaled), advanced by frames
  let stateTimers = new Set();
  let pose = restPose();
  let blend = null; // { from, start }
  let raf = 0;
  let lastFrame = 0;
  let running = false;
  let paused = false;
  let timeScale = 1;
  const stats = { outstandingRaf: 0, maxOutstandingRaf: 0, frames: 0, transitions: 0, invalid: 0, falls: 0, knocks: 0, forced: 0 };
  const trace = [];
  const transitions = [];

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
    if (AIRBORNE.has(next)) body.surface = 'air';
    else if (ON_WALL.has(next)) body.surface = 'wall';
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

  // ---- Entering states -------------------------------------------------------------

  const ENTER = {
    idle() {
      body.tilt = 0;
    },
    gripping() {
      // Hang on and look around, then climb down or hop off.
      const playful = deps.personality() === 'playful';
      stateTimer(() => {
        if (Math.random() < (playful ? 0.6 : 0.25)) hopOffWall();
        else enter('climbing', { targetY: world.get().wall.bottom, dir: 1, then: 'dismount', phase: 0 });
      }, 1600 + Math.random() * 1900);
    },
    slipping() {
      stats.falls++;
      data.wallX = world.get().wall.x || body.x - world.get().half;
      body.vx = 0;
      body.vy = 0;
      body.facing = -1;
    },
    falling() {
      body.omega = 80;
    },
    knocked() {
      stats.knocks++;
    },
  };

  // ---- Per-frame steps -------------------------------------------------------------

  function step(dt) {
    const w = world.get();
    const t = elapsed();
    switch (state) {
      case 'looking':
        if (t > 1.9) enter('idle');
        break;
      case 'turning':
        if (t > 0.2) {
          enter(data.next, { target: data.target, then: data.then, v: 0, phase: 0, targetY: data.targetY });
        }
        break;
      case 'walking':
      case 'avoiding': {
        if (data.then === 'mount') {
          if (!w.wall.valid) data.then = 'surprised';
          else data.target = w.wall.attachX;
        }
        const target = clamp(data.target, w.floor.x0, w.floor.x1);
        const dist = Math.abs(target - body.x);
        const vmax = state === 'avoiding' ? AVOID : WALK;
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
        const speed = data.dir < 0 ? CLIMB * (0.25 + 1.4 * Math.max(0, Math.sin(data.phase))) : CLIMB_DOWN * (0.5 + 0.8 * Math.max(0, Math.sin(data.phase)));
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
          enter('falling');
        }
        break;
      }
      case 'falling':
      case 'jumping':
      case 'knocked':
        airborne(dt, w);
        break;
      case 'landing':
        body.tilt *= Math.exp(-dt * 25);
        if (t > data.duration) {
          if (data.impact > 650) enter('recovering');
          else enter('idle');
        }
        break;
      case 'recovering':
        if (t > 0.95) enter('idle');
        break;
      case 'celebrating':
        if (t > 1.1) enter('idle');
        break;
      case 'interacting':
        if (t > 0.65) enter('idle');
        break;
      default:
        break;
    }
  }

  function airborne(dt, w) {
    body.vy = Math.min(V_MAX, body.vy + G * dt);
    body.vx *= Math.exp(-dt * 0.9);
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    // Keep inside the workspace: ease back in if the floor moved under Buddy mid-air.
    if (body.x < w.floor.x0) { body.x += (w.floor.x0 - body.x) * Math.min(1, dt * 8); body.vx = Math.max(0, body.vx); }
    if (body.x > w.floor.x1) { body.x += (w.floor.x1 - body.x) * Math.min(1, dt * 8); body.vx = Math.min(0, body.vx); }
    const toFloor = w.floor.y - body.y;
    if (toFloor < 150 && body.vy > 0) body.tilt += (0 - body.tilt) * Math.min(1, dt * 9); // air-righting
    else body.tilt = clamp(body.tilt + body.omega * dt, -50, 50);
    if (body.vy > 0 && body.y >= w.floor.y) {
      const impact = body.vy;
      body.y = w.floor.y;
      body.vy = 0;
      body.vx = 0;
      enter('landing', { impact, duration: impact > 650 ? 0.36 : 0.26 });
    }
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

  function hopOffWall() {
    body.facing = 1;
    body.vx = 150;
    body.vy = -240;
    body.omega = 40;
    enter('jumping', { mood: 'happy' });
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
        break;
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
        const k = (data.v || 0) / vmax;
        const a = Math.sin(data.phase || 0);
        const c = Math.cos(data.phase || 0);
        p.turn = body.facing * 0.95;
        // Trot: diagonal pairs move together; the lifted pair swings forward.
        p.legs = { fl: 22 * a * k, br: 22 * a * k, fr: -22 * a * k, bl: -22 * a * k };
        p.lift = { fl: Math.max(0, c) * 3.6 * k, br: Math.max(0, c) * 3.6 * k, fr: Math.max(0, -c) * 3.6 * k, bl: Math.max(0, -c) * 3.6 * k };
        p.bob = -Math.abs(Math.sin(data.phase || 0)) * 2.6 * k;
        p.tilt = body.facing * (1.5 + 3 * k) + Math.sin((data.phase || 0) * 2) * 1.2 * k;
        p.armL = 16 + 16 * a * k;
        p.armR = 16 - 16 * a * k;
        p.sprout = -body.facing * 9 * k + Math.sin((data.phase || 0) * 2) * 4 * k;
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
        p.legs = { fl: 26 * q, bl: 30 * q, fr: 14 * q, br: 18 * q };
        break;
      }
      case 'climbing': {
        const s = Math.sin(data.phase || 0);
        p.turn = -0.95;
        p.tilt = -7 + s * 1.6 + (data.resting ? Math.sin(t * 9) * 1.2 : 0);
        // Hands alternate between holds on the edge; feet push in turn.
        p.armL = 128 + 30 * s;
        p.armR = -(128 - 30 * s);
        p.legs = { fl: 30 + 14 * s, bl: 34 - 14 * s, fr: 16 - 12 * s, br: 22 + 12 * s };
        p.lift = { fl: Math.max(0, -s) * 4, bl: Math.max(0, s) * 4, fr: Math.max(0, s) * 3, br: Math.max(0, -s) * 3 };
        p.sprout = Math.sin((data.phase || 0) * 2) * 5;
        p.eyeY = data.dir < 0 ? -1.6 : 1.4;
        p.eyeX = -1.4;
        p.mouth = data.resting ? 'flat' : 'smile';
        break;
      }
      case 'gripping':
        p.turn = -0.95;
        p.tilt = -7;
        p.armL = 142;
        p.armR = -118;
        p.legs = { fl: 32, bl: 34, fr: 18, br: 22 };
        p.eyeX = 2.6; // looking out over the page
        p.eyeY = -0.4;
        break;
      case 'dismounting': {
        const q = ease(Math.min(1, t / 0.28));
        p.turn = -0.95 * (1 - q) + 0.45 * q;
        p.tilt = -7 * (1 - q);
        p.armL = 140 * (1 - q) + 14 * q;
        p.armR = -120 * (1 - q) + 14 * q;
        p.bob = -Math.sin(q * Math.PI) * 4;
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
        p.legs = { fl: 30 + Math.sin(t * 34) * 22 * q, bl: 30 - Math.sin(t * 30) * 20 * q, fr: 10 + Math.sin(t * 38) * 18 * q, br: 18 };
        p.eyeScale = 1 + 0.2 * q;
        p.eyeX = -2.5;
        p.mouth = 'o';
        p.sprout = 14 * q;
        break;
      }
      case 'falling':
      case 'jumping':
      case 'knocked': {
        const w = world.get();
        const near = clamp(1 - (w.floor.y - body.y) / 150, 0, 1); // preparing to land
        const happy = state === 'jumping';
        p.pivotY = 55;
        p.tilt = body.tilt;
        p.turn = body.facing * 0.3 * (1 - near);
        const flail = happy ? 0.25 : 1;
        p.armL = (happy ? 150 : 140) * (1 - near) + 88 * near + Math.sin(t * 26) * 20 * flail * (1 - near);
        p.armR = (happy ? 150 : 140) * (1 - near) + 88 * near + Math.sin(t * 26 + 1.7) * 20 * flail * (1 - near);
        const kick = Math.sin(t * 22) * 18 * flail * (1 - near);
        p.legs = { fl: 14 + kick, fr: -14 - kick, bl: 18 - kick, br: -18 + kick };
        const stretch = Math.min(0.1, Math.max(0, body.vy) / 9000);
        p.sy = 1 + stretch;
        p.sx = 1 / Math.sqrt(1 + stretch);
        p.eyeScale = happy ? 1 : 1.18;
        p.mouth = happy ? 'grin' : near > 0.4 ? 'wobble' : 'o';
        p.sprout = clamp(-body.vy / 40, -26, 26);
        break;
      }
      case 'landing': {
        const q = Math.min(1, t / data.duration);
        const k = clamp(data.impact / 2400, 0.08, 0.3);
        const spring = Math.exp(-4.5 * q) * Math.cos(q * Math.PI * 2.4);
        p.sy = 1 - k * spring;
        p.sx = 1 + k * spring * 0.75;
        const s = (spring * k) / 0.3;
        p.legs = { fl: 34 * s, fr: -34 * s, bl: 24 * s, br: -24 * s };
        p.armL = 70 + 30 * s;
        p.armR = 70 + 30 * s;
        p.tilt = body.tilt;
        p.eyes = k > 0.14 && q < 0.4 ? 'closed' : 'open';
        p.mouth = q < 0.5 ? 'flat' : 'wobble';
        p.sprout = 18 * spring;
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
        p.legs = { fl: 62, fr: -62, bl: 40, br: -40 };
        p.lift = { fl: 2, fr: 2, bl: 0, br: 0 };
        p.armL = 8;
        p.armR = 8;
        p.turn = body.facing * 0.25;
        break;
      case 'thinking':
        p.armR = -78; // hand to chin
        p.eyeX = -2;
        p.eyeY = -2.6;
        p.mouth = 'flat';
        p.sprout = -8;
        p.turn = -0.3;
        break;
      case 'sleeping':
        p.bob = 5;
        p.legs = { fl: 62, fr: -62, bl: 40, br: -40 };
        p.armL = 6;
        p.armR = 6;
        p.eyes = 'closed';
        p.mouth = 'small';
        p.sprout = 12;
        p.turn = 0;
        break;
      case 'celebrating': {
        const hop = Math.abs(Math.sin(Math.min(1, t / 1.1) * Math.PI * 2));
        p.bob = -hop * 9;
        p.sy = 1 + hop * 0.04;
        p.armL = 160 + Math.sin(t * 18) * 14;
        p.armR = 160 + Math.sin(t * 18 + 1) * 14;
        p.eyes = 'happy';
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
    for (const key of ['tilt', 'pivotY', 'sx', 'sy', 'bob', 'turn', 'armL', 'armR', 'eyeX', 'eyeY', 'eyeScale', 'sprout']) out[key] = mix(from[key], target[key]);
    for (const leg of ['fl', 'fr', 'bl', 'br']) {
      out.legs[leg] = mix(from.legs[leg], target.legs[leg]);
      out.lift[leg] = mix(from.lift[leg], target.lift[leg]);
    }
    return out;
  }

  // ---- Rendering -------------------------------------------------------------------

  function renderNow() {
    if (!running) return;
    pose = blended(targetPose());
    character.applyPose(pose);
    const w = world.get();
    const size = w.height / 0.96;
    const px = Math.round((body.x - size / 2) * 10) / 10;
    const py = Math.round((body.y - w.height) * 10) / 10;
    el.container.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    el.container.classList.toggle('is-peeking', body.peek);
    el.container.classList.toggle('is-sleeping', state === 'sleeping');
    el.container.dataset.surface = body.surface;

    // Contact shadow: on the floor under Buddy (smaller and fainter the higher it is),
    // or against the sidebar edge while climbing.
    const shadow = el.shadow;
    if (body.surface === 'wall') {
      shadow.style.transform = `translate3d(${Math.round(w.wall.x - size * 0.2)}px, ${Math.round(body.y - w.height * 0.62)}px, 0) rotate(90deg) scale(0.62, 0.8)`;
      shadow.style.opacity = '0.55';
    } else {
      const h = Math.max(0, w.floor.y - body.y);
      const s = Math.max(0.3, 1 - h / 380) * (pose.sx || 1);
      shadow.style.transform = `translate3d(${Math.round(body.x - size * 0.4)}px, ${Math.round(w.floor.y - size * 0.1)}px, 0) scale(${s.toFixed(3)}, ${s.toFixed(3)})`;
      shadow.style.opacity = body.peek ? '0' : String(Math.max(0.15, 1 - h / 300).toFixed(2));
    }
    if (deps.debug) {
      trace.push({ t: Math.round(clock), s: state, x: Math.round(body.x * 10) / 10, y: Math.round(body.y * 10) / 10, vy: Math.round(body.vy), tilt: Math.round(pose.tilt * 10) / 10, sy: Math.round(pose.sy * 1000) / 1000, armL: Math.round(pose.armL) });
      if (trace.length > 6000) trace.shift();
    }
  }

  // ---- The loop -----------------------------------------------------------------------

  function needsFrames() {
    return running && !paused && (FRAMES.has(state) || blend !== null);
  }

  function ensureLoop() {
    if (raf || !needsFrames()) return;
    lastFrame = performance.now();
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
    step(dt);
    if (!running) return;
    renderNow();
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
    if (ON_WALL.has(state)) {
      if (!w.wall.valid) {
        if (state === 'mounting') body.y = Math.min(body.y, w.floor.y);
        enter('slipping');
        return;
      }
      body.x = w.wall.attachX;
      body.y = clamp(body.y, w.wall.top, w.wall.bottom);
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
    if (!resting && !['sleep', 'wake'].includes(kind)) return false;
    if (reduced && !['sit', 'think', 'sleep', 'wake', 'idle'].includes(kind)) return false;
    switch (kind) {
      case 'wander': {
        const spot = world.clearSpot(options.x ?? (w.floor.x0 + Math.random() * (w.floor.x1 - w.floor.x0)));
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
        const targetY = world.climbTarget(options.fraction ?? 0.45 + Math.random() * 0.4);
        return go(w.wall.attachX, { then: 'mount', targetY });
      }
      case 'look': return enter('looking', { surprised: Boolean(options.surprised) });
      case 'sit': return reduced ? (force('sitting'), true) : enter('sitting');
      case 'think': return reduced ? (force('thinking'), true) : enter('thinking');
      case 'sleep':
        if (state === 'sleeping') return true;
        return resting ? (reduced ? (force('sleeping'), true) : enter('sleeping')) : false;
      case 'wake': return state === 'sleeping' ? (reduced ? (force('idle'), true) : enter('idle')) : false;
      case 'idle': return state === 'idle' || (reduced ? (force('idle'), true) : enter('idle'));
      case 'celebrate': return enter('celebrating');
      case 'interact': return enter('interacting');
      case 'hop':
        body.vx = 0;
        body.vy = -330;
        body.omega = 0;
        return enter('jumping', { mood: 'happy' });
      default: return false;
    }
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
    blend = null;
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
    /** Leave the wall the slow way (e.g. search results opened over Buddy). */
    climbDown() {
      if (state !== 'climbing' && state !== 'gripping') return false;
      if (state === 'climbing' && data.dir > 0) return true;
      return enter('climbing', { targetY: world.get().wall.bottom, dir: 1, then: 'dismount', phase: 0 });
    },
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
    setTimeScale(k) { timeScale = clamp(k, 0.02, 4); },
    get state() { return state; },
    get body() { return body; },
    isResting: () => RESTING.has(state),
    isOnWall: () => ON_WALL.has(state),
    isAirborne: () => AIRBORNE.has(state),
    /** Buddy's body box now: the same box the world uses to judge spots. */
    box: () => world.boxAt(body.x, body.y),
    snapshot() {
      const w = world.get();
      return {
        state, gen, x: body.x, y: body.y, vx: body.vx, vy: body.vy, tilt: pose.tilt, sx: pose.sx, sy: pose.sy,
        surface: body.surface, support: ON_WALL.has(state) ? 'sidebar-edge' : AIRBORNE.has(state) ? null : 'floor',
        facing: body.facing, peek: body.peek, loopRunning: Boolean(raf), stateTimers: stateTimers.size, ...stats,
        floor: { ...w.floor }, wall: { ...w.wall },
      };
    },
    trace,
    transitions,
  };
}
