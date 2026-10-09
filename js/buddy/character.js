// StudyHub Buddy's body: one inline SVG built once, then posed by changing a
// few transform attributes. Nothing is recreated per frame.
//
// Drawing space is a 100 × 100 viewBox; the feet touch y = 96 (FOOT_Y).
// Layers, back to front: backpack · body · sprout · face · accessory ·
// arms · legs. Two arms, two legs. Depth comes from a top-left light on the
// body gradient, a rim highlight, the far arm moving behind the body and the
// face sliding toward the side Buddy faces (`turn`, a 3/4 view).
//
// Animation code only ever calls applyPose(); appearance (colour, eyes,
// accessory) only ever calls applyAppearance(). Neither knows about the other.

import { svg } from '../util.js';

export const FOOT_Y = 96;
/** Half the body's width in viewBox units: how far Buddy's side is from its centre. */
export const BODY_HALF = 33;

let uid = 0;

// Two legs. The motion engine also writes poses for "bl"/"br" (a four-legged
// gait it no longer needs); only the legs listed here are drawn.
const HIPS = {
  fl: { x: 39, y: 80 },
  fr: { x: 61, y: 80 },
};
const SHOULDERS = { l: { x: 19, y: 55 }, r: { x: 81, y: 55 } };

const MOUTHS = {
  smile: { line: 'M45 59 Q50 64 55 59' },
  flat: { line: 'M46 60.5 L54 60.5' },
  wobble: { line: 'M44.5 61 Q47.2 58.4 50 61 Q52.8 63.6 55.5 61' },
  grin: { fill: 'M44.5 58 Q50 67 55.5 58 Z' },
  o: { fill: 'M50 57.4 a2.7 3.1 0 1 0 0.01 0 Z' },
  small: { fill: 'M50 59.3 a1.6 1.8 0 1 0 0.01 0 Z' },
};

const EYE_SHAPES = {
  round: { rx: 4.7, ry: 5.7, glints: [[1.6, -2.1, 1.7]] },
  big: { rx: 6, ry: 7.1, glints: [[1.9, -2.7, 2.3], [-1.9, 2.5, 1]] },
  dot: { rx: 3.1, ry: 3.7, glints: [[1, -1.3, 1]] },
};

export function restPose() {
  return {
    tilt: 0, pivotY: FOOT_Y, sx: 1, sy: 1, bob: 0, turn: 0,
    armL: 14, armR: 14,
    legs: { fl: 0, fr: 0, bl: 0, br: 0 },
    lift: { fl: 0, fr: 0, bl: 0, br: 0 },
    eyeX: 0, eyeY: 0, eyeScale: 1, eyes: 'open', mouth: 'smile', sprout: 0,
  };
}

/** Build the SVG. Returns { root (svg element), applyPose, applyAppearance }. */
export function createCharacter() {
  const id = `buddy-${++uid}`;
  const parts = {};

  const gradient = svg('radialGradient', { id: `${id}-body`, cx: '36%', cy: '30%', r: '78%' },
    (parts.stopLight = svg('stop', { offset: '0%' })),
    (parts.stopBase = svg('stop', { offset: '55%' })),
    (parts.stopDark = svg('stop', { offset: '100%' })));
  const defs = svg('defs', {}, gradient);

  const leg = (name) => {
    const node = svg('g', { class: `b-leg b-leg-${name}` },
      svg('rect', { x: -5, y: -3, width: 10, height: 14, rx: 5, class: 'b-limb' }),
      svg('ellipse', { cx: 0, cy: 11.4, rx: 6.4, ry: 3.6, class: 'b-limb' }));
    parts[`leg_${name}`] = node;
    return node;
  };
  const arm = (side) => {
    const node = svg('g', { class: `b-arm b-arm-${side}` },
      svg('rect', { x: -3.4, y: -3, width: 6.8, height: 15, rx: 3.4, class: 'b-limb' }),
      svg('circle', { cx: 0, cy: 12.6, r: 4.1, class: 'b-limb' }));
    parts[`arm_${side}`] = node;
    return node;
  };
  const eye = (side) => {
    const open = svg('g', { class: 'b-eye-open' });
    const closed = svg('path', { class: 'b-eye-closed', d: 'M-4.6 0.6 Q0 -3.4 4.6 0.6' });
    const node = svg('g', { class: `b-eye b-eye-${side}` }, open, closed);
    parts[`eye_${side}`] = node;
    parts[`eyeOpen_${side}`] = open;
    return node;
  };

  parts.pack = svg('g', { class: 'b-acc-backpack' },
    svg('rect', { x: 11.5, y: 38, width: 77, height: 36, rx: 13, class: 'b-pack' }),
    svg('rect', { x: 8.5, y: 52, width: 9, height: 16, rx: 3.5, class: 'b-pack-pocket' }));

  parts.body = svg('path', {
    class: 'b-body', fill: `url(#${id}-body)`,
    d: 'M50 21 C73 21 84 37 84 55 C84 74 70 86 50 86 C30 86 16 74 16 55 C16 37 27 21 50 21 Z',
  });
  const belly = svg('ellipse', { class: 'b-belly', cx: 50, cy: 70, rx: 19, ry: 11 });
  parts.shine = svg('ellipse', { class: 'b-shine', cx: 35, cy: 33, rx: 8.5, ry: 4.6, transform: 'rotate(-32 35 33)' });
  const rim = svg('path', { class: 'b-rim', d: 'M74 44 C79 52 79 64 72 73' });

  parts.sprout = svg('g', { class: 'b-sprout' },
    svg('path', { class: 'b-stem', d: 'M50 22.5 Q48.5 15 52.5 9.5' }),
    svg('path', { class: 'b-leaf', d: 'M52.5 9.5 C57 3 65.5 2.5 69.5 5.5 C65.5 11 58.5 12.5 52.5 9.5 Z' }),
    svg('path', { class: 'b-leaf b-leaf-small', d: 'M51 13.2 C47.5 8.6 42 8.2 39.6 10 C42.4 14 47 15 51 13.2 Z' }));

  parts.mouthLine = svg('path', { class: 'b-mouth-line' });
  parts.mouthFill = svg('path', { class: 'b-mouth-fill' });
  parts.face = svg('g', { class: 'b-face' },
    svg('ellipse', { class: 'b-cheek', cx: 30.5, cy: 58, rx: 4.6, ry: 2.7 }),
    svg('ellipse', { class: 'b-cheek', cx: 69.5, cy: 58, rx: 4.6, ry: 2.7 }),
    eye('l'), eye('r'), parts.mouthLine, parts.mouthFill);

  parts.cap = svg('g', { class: 'b-acc-cap' },
    svg('path', { class: 'b-cap', d: 'M29.5 31 C30 15.5 70 15.5 70.5 31 Z' }),
    svg('path', { class: 'b-cap-brim', d: 'M60 29.5 Q79 27 86 32.5 Q73 35 60 32.5 Z' }),
    svg('circle', { class: 'b-cap-button', cx: 50, cy: 18.2, r: 2.2 }));
  parts.bow = svg('g', { class: 'b-acc-bow' },
    svg('path', { class: 'b-bow', d: 'M67 25 L57.5 18.5 Q55.5 25 58 31 Z' }),
    svg('path', { class: 'b-bow', d: 'M67 25 L76.5 18.5 Q78.5 25 76 31 Z' }),
    svg('circle', { class: 'b-bow-knot', cx: 67, cy: 25, r: 3.1 }));
  parts.straps = svg('g', { class: 'b-acc-backpack' },
    svg('path', { class: 'b-strap', d: 'M27 36 Q22 54 24.5 71' }),
    svg('path', { class: 'b-strap', d: 'M73 36 Q78 54 75.5 71' }));

  parts.bob = svg('g', { class: 'b-bob' },
    parts.pack,
    parts.body, belly, rim, parts.shine, parts.sprout, parts.straps, parts.face, parts.cap, parts.bow,
    arm('l'), arm('r'), leg('fl'), leg('fr'));
  parts.root = svg('g', { class: 'b-root' }, parts.bob);

  const root = svg('svg', {
    class: 'buddy-svg', viewBox: '0 0 100 100', overflow: 'visible',
    'aria-hidden': 'true', focusable: 'false',
  }, defs, parts.root);

  // Attribute cache: only touch the DOM when a value really changed.
  const last = new Map();
  const set = (node, attr, value) => {
    const key = node;
    let cache = last.get(key);
    if (!cache) { cache = {}; last.set(key, cache); }
    if (cache[attr] === value) return;
    cache[attr] = value;
    node.setAttribute(attr, value);
  };
  const r = (n) => Math.round(n * 100) / 100;
  let eyesShown = 'open';
  let farArm = null;

  function applyPose(p) {
    // Whole body: tilt and squash around a pivot on the centre line (feet by default).
    set(parts.root, 'transform',
      `translate(50 ${r(p.pivotY)}) rotate(${r(p.tilt)}) scale(${r(p.sx)} ${r(p.sy)}) translate(-50 ${r(-p.pivotY)})`);
    set(parts.bob, 'transform', `translate(0 ${r(p.bob)})`);

    // 3/4 view: the face slides toward the facing side; the far eye narrows.
    const turn = Math.max(-1, Math.min(1, p.turn));
    set(parts.face, 'transform', `translate(${r(turn * 7.5 + p.eyeX * 0.4)} ${r(p.eyeY * 0.4)})`);
    const eyeAt = (side, cx) => {
      const far = side === 'l' ? Math.max(0, turn) : Math.max(0, -turn);
      const s = p.eyeScale;
      set(parts[`eye_${side}`], 'transform', `translate(${r(cx + p.eyeX)} ${r(47 + p.eyeY)}) scale(${r(s * (1 - far * 0.22))} ${r(s)})`);
    };
    eyeAt('l', 39);
    eyeAt('r', 61);
    if (eyesShown !== p.eyes) {
      eyesShown = p.eyes;
      root.classList.toggle('is-eyes-closed', p.eyes === 'closed');
      root.classList.toggle('is-eyes-happy', p.eyes === 'happy');
    }

    const mouth = MOUTHS[p.mouth] || MOUTHS.smile;
    set(parts.mouthLine, 'd', mouth.line || 'M0 0');
    set(parts.mouthFill, 'd', mouth.fill || 'M0 0');

    // The shine slides opposite the turn, as a fixed light would on a turning body.
    set(parts.shine, 'transform', `translate(${r(-turn * 4)} 0) rotate(-32 35 33)`);
    set(parts.sprout, 'transform', `rotate(${r(p.sprout)} 50 23)`);
    const cap = turn < -0.2 ? 'translate(100 0) scale(-1 1)' : '';
    set(parts.cap, 'transform', cap);

    // In a 3/4 view the far arm is behind the body (moved only when the side changes).
    const far = turn < -0.5 ? 'r' : turn > 0.5 ? 'l' : null;
    if (far !== farArm) {
      farArm = far;
      for (const side of ['l', 'r']) parts.bob.insertBefore(parts[`arm_${side}`], side === far ? parts.body : parts.leg_fl);
    }
    // Arms: angle 0 hangs down, positive raises the arm outward (180 = straight up).
    for (const side of ['l', 'r']) {
      const s = SHOULDERS[side];
      const raise = side === 'l' ? p.armL : -p.armR;
      set(parts[`arm_${side}`], 'transform', `translate(${r(s.x + turn * 2)} ${s.y}) rotate(${r(raise)})`);
    }
    for (const name of Object.keys(HIPS)) {
      const hip = HIPS[name];
      set(parts[`leg_${name}`], 'transform', `translate(${r(hip.x + turn * 1.5)} ${r(hip.y - p.lift[name])}) rotate(${r(p.legs[name])})`);
    }
  }

  function applyAppearance({ color, eyes, accessory }) {
    const shades = palette(color);
    root.style.setProperty('--buddy-limb', shades.limb);
    root.style.setProperty('--buddy-limb-back', shades.back);
    root.style.setProperty('--buddy-outline', shades.outline);
    root.style.setProperty('--buddy-belly', shades.belly);
    parts.stopLight.setAttribute('stop-color', shades.light);
    parts.stopBase.setAttribute('stop-color', color);
    parts.stopDark.setAttribute('stop-color', shades.dark);

    const shape = EYE_SHAPES[eyes] || EYE_SHAPES.round;
    for (const side of ['l', 'r']) {
      parts[`eyeOpen_${side}`].replaceChildren(
        svg('ellipse', { class: 'b-pupil', cx: 0, cy: 0, rx: shape.rx, ry: shape.ry }),
        ...shape.glints.map(([x, y, rad]) => svg('circle', { class: 'b-glint', cx: x, cy: y, r: rad })));
    }
    root.dataset.accessory = accessory;
  }

  return { root, applyPose, applyAppearance };
}

// ---- Colour --------------------------------------------------------------------

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(hex, target, amount) {
  const [r, g, b] = hexToRgb(hex);
  const t = target === 'white' ? 255 : 0;
  const m = (c) => Math.round(c + (t - c) * amount).toString(16).padStart(2, '0');
  return `#${m(r)}${m(g)}${m(b)}`;
}

/** Shades of one body colour: lit side, shadow side, limbs, back limbs, outline, belly. */
export function palette(color) {
  return {
    light: mix(color, 'white', 0.38),
    dark: mix(color, 'black', 0.26),
    limb: mix(color, 'black', 0.1),
    back: mix(color, 'black', 0.3),
    outline: mix(color, 'black', 0.45),
    belly: mix(color, 'white', 0.55),
  };
}
