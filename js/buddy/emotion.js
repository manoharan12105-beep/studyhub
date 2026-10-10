// Buddy's feelings: a second dimension beside the body state in motion.js.
//
// The body state says where Buddy is and what it is physically doing (falling,
// held, sitting…). The emotion says how it feels about it (frightened, dizzy,
// crying…). They never mix: an emotion only changes the *face* (eyes, brows,
// mouth, tears, stars) in any state, and in calm states also a few limbs and a
// lean — never position, velocity, collisions or landings. Physical safety
// always wins because motion.js owns the body and simply asks this module for
// a face to draw on top of its own pose.
//
// One emotion is felt at a time. A new one replaces the current one only when
// it ranks at least as high (lower rank number = more important), mirroring the
// app-wide priority list: recovery from a physical event (4) > direct user
// interaction (5) > a learning event (6) > context (7) > idle (8). Comforting is
// the one deliberate exception: a pat may turn fear or tears into comfort.
// Every emotion has a bounded duration and its own cooldown, so nothing loops,
// flickers or retriggers. Durations end on their own; nothing ever waits for
// the learner to act.

const RANK = {
  dizzy: 4, frightened: 4, crying: 4,
  comforted: 5, surprised: 5, playful: 5,
  happy: 6, proud: 6, empathetic: 6,
  curious: 7, thinking: 7,
  sleepy: 8,
};
export const EMOTIONS = ['neutral', ...Object.keys(RANK)];
/** Emotions a gentle pat can soothe (once Buddy has landed). */
const SOOTHABLE = new Set(['frightened', 'crying', 'dizzy']);
/** Emotions whose face moves (swirl, tremble, tears): they need animation frames. */
const ANIMATED = new Set(['dizzy', 'frightened', 'crying', 'comforted']);
// Seconds before the same emotion may be felt again (refreshing the one showing is always allowed).
const COOLDOWN = { surprised: 3, happy: 2, proud: 6, empathetic: 4, curious: 8, thinking: 6, sleepy: 20, playful: 6, comforted: 1, crying: 12, frightened: 2, dizzy: 1 };

/**
 * deps: { own, now(): ms, onChange() (redraw), isReduced() }
 * Returns { feel, comfort, clear, current, overlay, animating, snapshot }.
 */
export function createEmotion(deps) {
  const { own } = deps;
  const now = () => (deps.now ? deps.now() : performance.now());
  let active = null; // { kind, start, until, intensity, then }
  let endTimer = 0;
  const lastAt = {};
  const log = []; // tests: what was felt and when

  function end() {
    endTimer = 0;
    const previous = active;
    active = null;
    if (previous?.then && !previous.cancelled) {
      // A planned follow-on (fear → tears, tears → a sniffle into calm).
      feel(previous.then.kind, { ...previous.then, force: true });
      return;
    }
    deps.onChange?.();
  }

  /**
   * Feel `kind` for `ms`. intensity 0…1.5 scales how strongly it shows.
   * `then` = { kind, ms, intensity } follows when this one ends. `force`
   * skips rank and cooldown (only for planned follow-ons and tests).
   * Returns true when the emotion is now showing.
   */
  function feel(kind, { ms = 1500, intensity = 1, then = null, force = false } = {}) {
    if (!RANK[kind]) return false;
    const t = now();
    const refresh = active && active.kind === kind;
    if (!force && !refresh) {
      if (active && RANK[active.kind] < RANK[kind]) return false; // something more important is showing
      if (t - (lastAt[kind] ?? -Infinity) < (COOLDOWN[kind] ?? 2) * 1000) return false;
    }
    const duration = Math.max(200, Math.min(12_000, ms));
    lastAt[kind] = t;
    if (refresh && !then) {
      // Still feeling it: extend (never shorten), keep the start so the animation stays continuous.
      active.until = Math.max(active.until, t + duration);
      active.intensity = Math.max(active.intensity, intensity);
    } else {
      active = { kind, start: t, until: t + duration, intensity: clampIntensity(intensity), then };
    }
    log.push({ t: Math.round(t), kind, ms: Math.round(duration) });
    if (log.length > 200) log.shift();
    own.clearTimeout(endTimer);
    endTimer = own.setTimeout(end, Math.max(0, active.until - t));
    deps.onChange?.();
    return true;
  }

  /** A gentle pat: fear, tears or dizziness give way to comfort. False when there is nothing to soothe. */
  function comfort(ms = 1600) {
    if (!active || !SOOTHABLE.has(active.kind)) return false;
    active.cancelled = true; // the planned follow-on (e.g. fear → tears) is skipped
    active = null;
    return feel('comforted', { ms, force: true });
  }

  function clear() {
    own.clearTimeout(endTimer);
    endTimer = 0;
    if (!active) return;
    active = null;
    deps.onChange?.();
  }

  function current() {
    if (!active) return null;
    return active.kind;
  }

  /** Draw the felt emotion onto a pose (see emotionPose). */
  function overlay(p, ctx) {
    if (!active) return;
    const t = now();
    const elapsed = (t - active.start) / 1000;
    const phase = Math.min(1, (t - active.start) / Math.max(1, active.until - active.start));
    emotionPose(p, active.kind, { ...ctx, t: elapsed, phase, intensity: active.intensity * (ctx.expression ?? 1) });
  }

  return {
    feel,
    comfort,
    clear,
    current,
    overlay,
    canSoothe: () => Boolean(active && SOOTHABLE.has(active.kind)),
    animating: () => Boolean(active && ANIMATED.has(active.kind) && !deps.isReduced?.()),
    snapshot: () => (active
      ? { kind: active.kind, left: Math.max(0, Math.round(active.until - now())), intensity: active.intensity, then: active.then?.kind || null }
      : { kind: 'neutral', left: 0, intensity: 0, then: null }),
    log,
  };
}

const clampIntensity = (k) => Math.max(0, Math.min(1.5, Number.isFinite(k) ? k : 1));

/**
 * Put an emotion's face (and, in calm states, a few limbs and a lean) on pose
 * `p`. Pure: the same inputs give the same pose, so the settings preview can
 * show any feeling without a running Buddy.
 *
 * ctx: { t (s since it began), phase (0…1 of its duration), intensity,
 *        calm (resting on a surface), airborne, reduced, particles }
 * Face channels: eyes, mouth, eyeScale, eyeX/eyeY, brows, tears, tearPhase,
 * swirl, starA/starO (orbiting stars), blush. Calm-only: armL/armR, tilt, sprout.
 */
export function emotionPose(p, kind, ctx = {}) {
  const k = clampIntensity(ctx.intensity ?? 1);
  const t = ctx.reduced ? 0.6 : ctx.t || 0; // under reduced motion: one still frame
  const phase = ctx.phase ?? 0.5;
  const fade = phase > 0.82 ? 1 - (phase - 0.82) / 0.18 : 1; // eases out over the last part
  const calm = Boolean(ctx.calm);
  const move = !ctx.reduced;
  switch (kind) {
    case 'dizzy': {
      p.eyes = 'dizzy';
      p.swirl = move ? (t * 420) % 360 : 30;
      p.mouth = 'wobble';
      p.brows = 'worried';
      if (move && ctx.particles !== false && phase < 0.85) {
        p.starA = t * 230;
        p.starO = Math.min(1, t * 4) * fade;
      }
      if (calm && move) p.tilt += Math.sin(t * 5.2) * 3.2 * k * fade;
      if (phase > 0.75) { p.eyes = 'open'; p.eyeScale *= 0.94; } // refocusing
      break;
    }
    case 'frightened': {
      p.eyeScale = Math.max(p.eyeScale, 1 + 0.3 * k);
      p.brows = 'worried';
      p.mouth = ctx.airborne ? 'scared' : 'tremble';
      if (move) p.eyeX += Math.sin(t * 55) * 0.45 * k * fade; // a tremble
      if (calm) { p.armL = Math.max(p.armL, 40 * k); p.armR = Math.max(p.armR, 40 * k); }
      break;
    }
    case 'crying': {
      // Watery eyes that squeeze shut now and then, tears, a trembling pout;
      // a hand rubs the eyes. The last part is a sniffle back to calm.
      const sniffle = phase > 0.8;
      const squeeze = move ? (t % 1.6) > 1.15 : false;
      p.eyes = sniffle ? 'open' : squeeze ? 'closed' : 'teary';
      p.brows = 'sad';
      p.mouth = sniffle ? 'small' : (move && Math.floor(t * 3) % 2 ? 'tremble' : 'pout');
      p.tears = sniffle ? 0 : Math.min(1, t * 3) * Math.min(1, k + 0.3);
      p.tearPhase = move ? (t * 0.9) % 1 : 0.5;
      p.eyeY += 0.6;
      if (calm && !sniffle && move) {
        const rub = (t % 2.4) > 1.6 ? Math.sin(((t % 2.4) - 1.6) / 0.8 * Math.PI) : 0;
        p.armR = p.armR * (1 - rub) + 158 * rub; // the near hand rubs an eye
        if (rub > 0.2) p.eyes = 'closed';
      }
      break;
    }
    case 'comforted':
      p.eyes = 'happy';
      p.mouth = 'smile';
      p.brows = 'happy';
      p.blush = Math.max(p.blush || 0, 0.9 * Math.min(1, k + 0.2));
      if (calm && move) p.sprout += Math.sin(t * 14) * 9 * fade;
      break;
    case 'surprised':
      p.eyeScale = Math.max(p.eyeScale, 1 + 0.25 * k);
      p.mouth = 'o';
      p.brows = 'raised';
      break;
    case 'happy':
      p.eyes = 'happy';
      p.mouth = 'grin';
      p.brows = 'happy';
      break;
    case 'proud':
      p.eyes = 'happy';
      p.mouth = 'grin';
      p.brows = 'raised';
      p.blush = Math.max(p.blush || 0, 0.5 * k);
      break;
    case 'empathetic':
      // "That's okay": soft worried brows and a small, kind smile — never a frown at the learner.
      p.brows = 'worried';
      p.mouth = 'smile';
      p.eyeScale *= 1 - 0.06 * k;
      p.eyeY += 0.8;
      break;
    case 'curious':
      p.eyeScale = Math.max(p.eyeScale, 1 + 0.1 * k);
      p.mouth = 'small';
      p.brows = 'raised';
      break;
    case 'thinking':
      p.mouth = 'flat';
      p.brows = 'focused';
      break;
    case 'sleepy':
      p.eyeScale *= 0.62;
      p.mouth = 'small';
      break;
    case 'playful':
      p.eyes = 'wink';
      p.mouth = 'grin';
      p.brows = 'happy';
      break;
    default:
      break;
  }
}

// ---- Spinning: how fast is the held Buddy being whirled round? -----------------------

/**
 * Feeds on the hold point's recent positions (viewport px, ms). Spin is measured
 * as the signed angle swept about the centre of the recent path, with each
 * step's angle wrapped into (-π, π] so crossing ±180° is not mistaken for a
 * jump. Slow drags, small jitter (radius below MIN_RADIUS) and back-and-forth
 * shaking (the signed angle cancels out) do not count.
 *
 * `level` rises only while the spin is faster than ON_RATE and has kept one
 * direction for MIN_TURNS turns; it decays otherwise. Buddy is dizzy at
 * level ≥ 1 and stays so until it falls below OFF_LEVEL (hysteresis).
 */
export const SPIN = { WINDOW: 700, MIN_RADIUS: 14, ON_RATE: 2 * Math.PI * 1.15, MIN_TURNS: 1.5, GAIN: 1.1, DECAY: 0.45, OFF_LEVEL: 0.35, MAX: 1.6 };

export function createSpinMeter(options = {}) {
  const C = { ...SPIN, ...options };
  const samples = [];
  let level = 0;
  let dizzy = false;
  let runTurns = 0; // turns swept in the current direction
  let lastT = null;
  let lastRate = 0;

  function measure() {
    if (samples.length < 4) return { rate: 0, radius: 0, sweep: 0 };
    let cx = 0;
    let cy = 0;
    for (const s of samples) { cx += s.x; cy += s.y; }
    cx /= samples.length;
    cy /= samples.length;
    let sweep = 0;
    let radius = 0;
    let prev = Math.atan2(samples[0].y - cy, samples[0].x - cx);
    for (let i = 1; i < samples.length; i++) {
      const a = Math.atan2(samples[i].y - cy, samples[i].x - cx);
      let d = a - prev;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d <= -Math.PI) d += 2 * Math.PI;
      // A step of nearly half a turn passed through the centre: its direction is
      // ambiguous (shaking in a straight line does this), so it counts as nothing.
      if (Math.abs(d) < Math.PI * 0.85) sweep += d;
      prev = a;
    }
    // A real spin is round: the path's spread along its narrow axis must be a
    // fair share of its spread along the wide one: an ellipse up to ~3.5 : 1
    // counts; a straight shake (~0) does not.
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    for (const s of samples) {
      radius += Math.hypot(s.x - cx, s.y - cy);
      sxx += (s.x - cx) ** 2;
      syy += (s.y - cy) ** 2;
      sxy += (s.x - cx) * (s.y - cy);
    }
    radius /= samples.length;
    const tr = sxx + syy;
    const det = sxx * syy - sxy * sxy;
    const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
    const roundness = tr > 0 ? (tr / 2 - disc) / (tr / 2 + disc) : 0;
    const span = (samples[samples.length - 1].t - samples[0].t) / 1000;
    if (span < 0.25 || radius < C.MIN_RADIUS || roundness < 0.08) return { rate: 0, radius, sweep };
    return { rate: sweep / span, radius, sweep };
  }

  return {
    /** Add a sample; returns the current state. */
    push(x, y, t) {
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(t)) return this.state();
      if (lastT !== null && t < lastT) { samples.length = 0; lastT = null; } // clock went backwards: start over
      samples.push({ x, y, t });
      while (samples.length > 2 && t - samples[0].t > C.WINDOW) samples.shift();
      const dt = lastT === null ? 0 : Math.min(0.1, (t - lastT) / 1000);
      lastT = t;
      const { rate } = measure();
      const speed = Math.abs(rate);
      if (speed > 0 && lastRate && Math.sign(rate) !== Math.sign(lastRate) && Math.abs(lastRate) > C.ON_RATE * 0.5) runTurns = 0; // direction reversed
      if (speed > C.ON_RATE * 0.5) runTurns += (speed * dt) / (2 * Math.PI);
      else runTurns = Math.max(0, runTurns - dt * 2);
      lastRate = rate || lastRate * 0.9;
      if (speed > C.ON_RATE && runTurns >= C.MIN_TURNS) level += ((speed - C.ON_RATE) / C.ON_RATE) * C.GAIN * dt + 0.2 * dt;
      else level -= C.DECAY * dt;
      level = Math.max(0, Math.min(C.MAX, level));
      if (!dizzy && level >= 1) dizzy = true;
      else if (dizzy && level < C.OFF_LEVEL) dizzy = false;
      return this.state();
    },
    /** Time passing without samples (the pointer is still): the dizziness ebbs. */
    decay(seconds) {
      level = Math.max(0, level - C.DECAY * Math.max(0, seconds));
      if (dizzy && level < C.OFF_LEVEL) dizzy = false;
      runTurns = 0;
      return this.state();
    },
    state: () => ({ level: Math.round(level * 1000) / 1000, dizzy, rate: Math.round(lastRate * 100) / 100, turns: Math.round(runTurns * 100) / 100 }),
  };
}

// ---- Falls: height and impact are separate signals ----------------------------------

/**
 * Classify a landing by how far Buddy fell (height, px, from the highest point
 * of this fall to the floor) and how hard it hit (impact, px/s), relative to
 * Buddy's size S (px). The two are independent: a short throw straight down
 * can land hard from a small height; a long fall is frightening however it ends.
 */
export function classifyFall(height, impact, S) {
  const h = Math.max(0, Number(height) || 0) / Math.max(1, S);
  const v = Math.max(0, Number(impact) || 0);
  return {
    height: h < 3 ? 'hop' : h < 7 ? 'moderate' : 'high',
    impact: v < 650 ? 'soft' : v < 1000 ? 'firm' : v < 1300 ? 'hard' : 'severe',
    veryHigh: h >= 11,
    heights: Math.round(h * 10) / 10,
  };
}

/** Thresholds (in Buddy heights) at which a fall becomes frightening while still in the air. */
export const FEAR_HEIGHT = 7;
