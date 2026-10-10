// StudyHub Buddy's body: one inline SVG built once, then posed by changing a
// few transform attributes. Nothing is recreated per frame.
//
// Drawing space is a 100 × 100 viewBox; the feet touch y = 96 (FOOT_Y).
// Layers, back to front: backpack · body · sprout · scarf · face (cheeks, eyes,
// brows, glasses, mouth, tears) · head accessories · orbiting stars · arms ·
// legs. Two arms, two legs. Depth comes from a top-left light on the body
// gradient, a rim highlight, the far arm moving behind the body and the face
// sliding toward the side Buddy faces (`turn`, a 3/4 view).
//
// Everything sits inside one "shape" group scaled about the feet for the body
// proportion presets, so the face, leaf and every accessory stay aligned with
// the body through walking, climbing, rotation, falls and throws. world.js
// scales Buddy's collision box by the same factors (BODY_SHAPES).
//
// Animation code only ever calls applyPose(); appearance (colours, eyes, leaf,
// shape, accessories) only ever calls applyAppearance(). Neither knows about the other.

import { svg } from '../util.js';

export const FOOT_Y = 96;
/** Half the body's width in viewBox units: how far Buddy's side is from its centre. */
export const BODY_HALF = 33;

/** Body proportion presets: a scale about the feet. world.js uses the same numbers for the collision box. */
export const BODY_SHAPES = {
  classic: { sx: 1, sy: 1 },
  tiny: { sx: 0.86, sy: 0.86 },
  round: { sx: 1.08, sy: 0.95 },
  tall: { sx: 0.92, sy: 1.07 },
  fluffy: { sx: 1.03, sy: 1.02 },
};

let uid = 0;

// Two legs: front-left and front-right of the body.
const HIPS = {
  fl: { x: 39, y: 80 },
  fr: { x: 61, y: 80 },
};
const SHOULDERS = { l: { x: 19, y: 55 }, r: { x: 81, y: 55 } };

const MOUTHS = {
  smile: { line: 'M45 59 Q50 64 55 59' },
  flat: { line: 'M46 60.5 L54 60.5' },
  wobble: { line: 'M44.5 61 Q47.2 58.4 50 61 Q52.8 63.6 55.5 61' },
  tremble: { line: 'M44.5 61 Q46.3 59.4 48 61 Q49.8 62.6 51.5 61 Q53.3 59.4 55.5 61' },
  pout: { line: 'M45.5 62.2 Q50 58.2 54.5 62.2' },
  grin: { fill: 'M44.5 58 Q50 67 55.5 58 Z' },
  o: { fill: 'M50 57.4 a2.7 3.1 0 1 0 0.01 0 Z' },
  scared: { fill: 'M50 56.4 a3.4 4.4 0 1 0 0.01 0 Z' },
  small: { fill: 'M50 59.3 a1.6 1.8 0 1 0 0.01 0 Z' },
  yawn: { fill: 'M50 55.6 a3.8 5 0 1 0 0.01 0 Z' },
};

/** Sprout growth stages from completed topics: a second leaf, a bud, a flower. */
export const GROWTH = [10, 25, 50];
export function growthStage(completed) {
  return GROWTH.filter((n) => completed >= n).length;
}

const EYE_SHAPES = {
  round: { rx: 4.7, ry: 5.7, glints: [[1.6, -2.1, 1.7]] },
  big: { rx: 6, ry: 7.1, glints: [[1.9, -2.7, 2.3], [-1.9, 2.5, 1]] },
  dot: { rx: 3.1, ry: 3.7, glints: [[1, -1.3, 1]] },
  sleepy: { rx: 4.8, ry: 4.6, glints: [[1.5, -1, 1.3]], lid: true },
  playful: { rx: 5.3, ry: 6.3, glints: [[1.9, -2.4, 2.1], [-2, 1.9, 1.1], [2.4, 1.7, 0.6]] },
};
const SHINE = { small: 0.7, normal: 1, large: 1.35 };
const BLUSH = { none: 0, soft: 0.55, rosy: 0.78 };

const LEAVES = {
  classic: 'M52.5 9.5 C57 3 65.5 2.5 69.5 5.5 C65.5 11 58.5 12.5 52.5 9.5 Z',
  round: 'M52.5 9.5 C54 2.5 64 0.5 67.5 4.5 C69.5 9.5 60 13.5 52.5 9.5 Z',
  pointed: 'M52.5 9.5 C58 4.5 66 2.8 72.5 3.2 C66.5 9 59 12 52.5 9.5 Z',
  heart: 'M52.5 9.5 C55.5 3 61.5 1.5 63.5 4.5 C66.5 2 70.5 4.5 68.5 8 C64.5 12 57.5 12 52.5 9.5 Z',
};
const LEAF_SIZE = { small: 0.82, normal: 1, large: 1.2 };

// Brows (shown with feelings): angle of each brow (left, right) and a lift, per mood.
const BROWS = {
  neutral: { l: 0, r: 0, y: 0 },
  worried: { l: -17, r: 17, y: -0.6 },
  sad: { l: -13, r: 13, y: 0.8 },
  raised: { l: 0, r: 0, y: -2.6 },
  happy: { l: 5, r: -5, y: -1.4 },
  focused: { l: 12, r: -12, y: 1 },
};

/** The seasonal accessory follows the month: winter beanie, spring blossoms, summer sun hat, autumn leaf. */
export function seasonOf(date = new Date()) {
  const m = date.getMonth();
  return m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn';
}

export function restPose() {
  return {
    tilt: 0, pivotY: FOOT_Y, sx: 1, sy: 1, bob: 0, turn: 0,
    armL: 14, armR: 14,
    legs: { fl: 0, fr: 0 },
    lift: { fl: 0, fr: 0 },
    eyeX: 0, eyeY: 0, eyeScale: 1, eyes: 'open', mouth: 'smile', sprout: 0,
    sweat: 0, // 0 = none, 0…1 = a sweat drop sliding down
    blush: 0, // 0…1 = rosier cheeks
    brows: 'none', // a BROWS mood, or none
    tears: 0, tearPhase: 0, // 0…1 tears showing; how far down they have run
    swirl: 0, // degrees: dizzy eyes spin
    starA: 0, starO: 0, // orbiting stars: angle (degrees) and opacity
  };
}

/** Build the SVG. Returns { root (svg element), applyPose, applyAppearance, applyGrowth }. */
export function createCharacter() {
  const id = `buddy-${++uid}`;
  const parts = {};
  const look = { eyeSize: 1, spacing: 0, brows: 'expressive', blush: BLUSH.soft, accessories: true };

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
    // Dizzy: a spiral in place of the eye, turned by the pose. Teary: a watery line under the eye.
    const swirl = svg('path', { class: 'b-eye-swirl', d: 'M0 0 m-0.6 0 a0.6 0.6 0 1 1 1.2 0 a1.8 1.8 0 1 1 -3.6 0 a3 3 0 1 1 6 0 a4.2 4.2 0 1 1 -8.4 0' });
    const node = svg('g', { class: `b-eye b-eye-${side}` }, open, closed, swirl);
    parts[`eye_${side}`] = node;
    parts[`eyeOpen_${side}`] = open;
    parts[`swirl_${side}`] = swirl;
    return node;
  };
  const brow = (side) => (parts[`brow_${side}`] = svg('path', { class: 'b-brow', d: 'M-4.4 0.6 Q0 -1.6 4.4 0.6' }));
  const tear = (side) => (parts[`tear_${side}`] = svg('path', { class: 'b-tear', d: 'M0 0 C1.6 2.3 2 3.6 0 4.6 C-2 3.6 -1.6 2.3 0 0 Z', opacity: 0 }));
  const star = () => svg('path', { class: 'b-star', d: 'M0 -3.4 L0.95 -1.05 L3.3 -0.95 L1.5 0.6 L2.1 3 L0 1.7 L-2.1 3 L-1.5 0.6 L-3.3 -0.95 L-0.95 -1.05 Z' });

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

  // The learner's leaf (shape, size, details) is cosmetic; the growth parts beside it are
  // driven only by real completed topics (applyGrowth) and are never restyled here.
  parts.leaf = svg('path', { class: 'b-leaf', d: LEAVES.classic });
  parts.leaves = svg('g', { class: 'b-leaves' },
    parts.leaf,
    svg('path', { class: 'b-leaf b-leaf-small', d: 'M51 13.2 C47.5 8.6 42 8.2 39.6 10 C42.4 14 47 15 51 13.2 Z' }),
    svg('path', { class: 'b-leaf-vein', d: 'M53.4 9.3 Q60.5 6.4 67.2 5.7' }),
    svg('g', { class: 'b-leaf-dew' }, svg('circle', { cx: 63.5, cy: 6.4, r: 1.6 }), svg('circle', { class: 'b-dew-glint', cx: 63, cy: 5.9, r: 0.5 })),
    svg('g', { class: 'b-leaf-ladybug' },
      svg('circle', { class: 'b-ladybug', cx: 62.5, cy: 6, r: 2 }),
      svg('path', { class: 'b-ladybug-line', d: 'M62.5 4 L62.5 8' }),
      svg('circle', { class: 'b-ladybug-dot', cx: 61.6, cy: 6.4, r: 0.45 }), svg('circle', { class: 'b-ladybug-dot', cx: 63.4, cy: 5.5, r: 0.45 }),
      svg('circle', { class: 'b-ladybug-head', cx: 64.3, cy: 4.8, r: 0.9 })));
  parts.sprout = svg('g', { class: 'b-sprout' },
    svg('path', { class: 'b-stem', d: 'M50 22.5 Q48.5 15 52.5 9.5' }),
    parts.leaves,
    // Grows with the learner (GROWTH): a second leaf, then a bud, then a flower.
    svg('path', { class: 'b-leaf b-grow-1', d: 'M50.4 18 C54.6 14.2 60.6 14.4 63.4 16.8 C59.6 20.6 54.4 20.8 50.4 18 Z' }),
    svg('g', { class: 'b-grow-2' },
      svg('path', { class: 'b-sepal', d: 'M50.4 9.6 Q52.6 7 54.8 9.6' }),
      svg('ellipse', { class: 'b-bud', cx: 52.6, cy: 6.4, rx: 2.6, ry: 3.5 })),
    svg('g', { class: 'b-grow-3' },
      ...[0, 72, 144, 216, 288].map((a) => svg('ellipse', { class: 'b-petal', cx: 52.6, cy: 2.4, rx: 2.3, ry: 3.1, transform: `rotate(${a} 52.6 5.6)` })),
      svg('circle', { class: 'b-flower-centre', cx: 52.6, cy: 5.6, r: 1.9 })));

  parts.mouthLine = svg('path', { class: 'b-mouth-line' });
  parts.mouthFill = svg('path', { class: 'b-mouth-fill' });
  parts.glasses = svg('g', { class: 'b-acc-glasses' },
    (parts.lensL = svg('circle', { class: 'b-lens', cx: 39, cy: 47, r: 7.8 })),
    (parts.lensR = svg('circle', { class: 'b-lens', cx: 61, cy: 47, r: 7.8 })),
    (parts.bridge = svg('path', { class: 'b-glasses-bridge', d: 'M46.8 46 Q50 44 53.2 46' })));
  parts.face = svg('g', { class: 'b-face' },
    (parts.cheekL = svg('ellipse', { class: 'b-cheek', cx: 30.5, cy: 58, rx: 4.6, ry: 2.7 })),
    (parts.cheekR = svg('ellipse', { class: 'b-cheek', cx: 69.5, cy: 58, rx: 4.6, ry: 2.7 })),
    eye('l'), eye('r'), brow('l'), brow('r'), parts.glasses, parts.mouthLine, parts.mouthFill, tear('l'), tear('r'));
  parts.sweat = svg('path', { class: 'b-sweat', d: 'M0 0 C2.4 3.4 3 5.4 0 6.8 C-3 5.4 -2.4 3.4 0 0 Z', opacity: 0 });

  parts.cap = svg('g', { class: 'b-acc-cap' },
    svg('path', { class: 'b-cap', d: 'M29.5 31 C30 15.5 70 15.5 70.5 31 Z' }),
    svg('path', { class: 'b-cap-brim', d: 'M60 29.5 Q79 27 86 32.5 Q73 35 60 32.5 Z' }),
    svg('circle', { class: 'b-cap-button', cx: 50, cy: 18.2, r: 2.2 }));
  parts.bow = svg('g', { class: 'b-acc-bow' },
    svg('path', { class: 'b-bow', d: 'M67 25 L57.5 18.5 Q55.5 25 58 31 Z' }),
    svg('path', { class: 'b-bow', d: 'M67 25 L76.5 18.5 Q78.5 25 76 31 Z' }),
    svg('circle', { class: 'b-bow-knot', cx: 67, cy: 25, r: 3.1 }));
  parts.headband = svg('g', { class: 'b-acc-headband' },
    svg('path', { class: 'b-band', d: 'M23.5 36 Q50 15.5 76.5 36' }),
    svg('circle', { class: 'b-band-knot', cx: 71, cy: 29.5, r: 3 }));
  parts.flowerAcc = svg('g', { class: 'b-acc-flower' },
    ...[0, 72, 144, 216, 288].map((a) => svg('ellipse', { class: 'b-acc-petal', cx: 74, cy: 25.4, rx: 2.5, ry: 3.4, transform: `rotate(${a} 74 29)` })),
    svg('circle', { class: 'b-acc-flower-centre', cx: 74, cy: 29, r: 2.1 }));
  parts.starAcc = svg('g', { class: 'b-acc-star' },
    svg('path', { class: 'b-star-clip', d: 'M70 21.5 L71.9 26 L76.6 26.3 L73 29.3 L74.2 33.9 L70 31.3 L65.8 33.9 L67 29.3 L63.4 26.3 L68.1 26 Z' }));
  parts.gradcap = svg('g', { class: 'b-acc-gradcap' },
    svg('path', { class: 'b-grad-base', d: 'M36.5 24.5 L36.5 30.5 Q50 36 63.5 30.5 L63.5 24.5 Z' }),
    svg('path', { class: 'b-grad-board', d: 'M28 22.5 L50 14 L72 22.5 L50 31 Z' }),
    svg('path', { class: 'b-grad-tassel', d: 'M50 22.5 L67 25 L67 33' }),
    svg('circle', { class: 'b-grad-tassel-end', cx: 67, cy: 34, r: 1.6 }));
  parts.seasonal = svg('g', { class: 'b-acc-seasonal' },
    svg('g', { class: 'b-season-winter' },
      svg('path', { class: 'b-beanie', d: 'M30 31 C30 11.5 70 11.5 70 31 Z' }),
      svg('rect', { class: 'b-beanie-rim', x: 28.5, y: 27.5, width: 43, height: 6, rx: 3 }),
      svg('circle', { class: 'b-beanie-pom', cx: 50, cy: 13, r: 4 })),
    svg('g', { class: 'b-season-spring' },
      ...[[36, 27], [50, 22.5], [64, 27]].map(([x, y]) => svg('g', {},
        ...[0, 90, 180, 270].map((a) => svg('circle', { class: 'b-blossom', cx: x, cy: y - 2, r: 1.9, transform: `rotate(${a} ${x} ${y})` })),
        svg('circle', { class: 'b-blossom-centre', cx: x, cy: y, r: 1.1 })))),
    svg('g', { class: 'b-season-summer' },
      svg('ellipse', { class: 'b-sunhat-brim', cx: 50, cy: 28.5, rx: 31, ry: 5 }),
      svg('path', { class: 'b-sunhat', d: 'M33 28.5 C33 14 67 14 67 28.5 Z' }),
      svg('path', { class: 'b-sunhat-band', d: 'M33.6 25 Q50 29 66.4 25' })),
    svg('g', { class: 'b-season-autumn' },
      svg('path', { class: 'b-maple', d: 'M71 20 L72.6 24 L76.6 22.6 L75 26.6 L78.6 28 L74.6 29.6 L75.6 33 L71.6 31 L71 35 L70.4 31 L66.4 33 L67.4 29.6 L63.4 28 L67 26.6 L65.4 22.6 L69.4 24 Z' })));
  parts.straps = svg('g', { class: 'b-acc-backpack' },
    svg('path', { class: 'b-strap', d: 'M27 36 Q22 54 24.5 71' }),
    svg('path', { class: 'b-strap', d: 'M73 36 Q78 54 75.5 71' }));
  parts.scarf = svg('g', { class: 'b-acc-scarf' },
    svg('path', { class: 'b-scarf', d: 'M19.5 63.5 Q50 74 80.5 63.5 L80.5 69.5 Q50 80 19.5 69.5 Z' }),
    svg('path', { class: 'b-scarf', d: 'M64.5 71.5 L69.5 85 L62 85.5 L59.5 73 Z' }),
    svg('path', { class: 'b-scarf-stripe', d: 'M63.2 79.5 L68.3 79' }));
  parts.stars = svg('g', { class: 'b-stars', opacity: 0 }, (parts.star0 = star()), (parts.star1 = star()), (parts.star2 = star()));

  parts.bob = svg('g', { class: 'b-bob' },
    parts.pack,
    parts.body, belly, rim, parts.shine, parts.sprout, parts.straps, parts.scarf, parts.face, parts.sweat,
    parts.cap, parts.bow, parts.headband, parts.flowerAcc, parts.starAcc, parts.gradcap, parts.seasonal, parts.stars,
    arm('l'), arm('r'), leg('fl'), leg('fr'));
  parts.shape = svg('g', { class: 'b-shape' }, parts.bob);
  parts.root = svg('g', { class: 'b-root' }, parts.shape);

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
  let browsShown = false;
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
      const s = p.eyeScale * look.eyeSize;
      set(parts[`eye_${side}`], 'transform', `translate(${r(cx + p.eyeX)} ${r(47 + p.eyeY)}) scale(${r(s * (1 - far * 0.22))} ${r(s)})`);
    };
    eyeAt('l', 39 - look.spacing);
    eyeAt('r', 61 + look.spacing);
    if (eyesShown !== p.eyes) {
      eyesShown = p.eyes;
      root.classList.toggle('is-eyes-closed', p.eyes === 'closed');
      root.classList.toggle('is-eyes-happy', p.eyes === 'happy');
      root.classList.toggle('is-eyes-sparkle', p.eyes === 'sparkle');
      root.classList.toggle('is-eyes-wink', p.eyes === 'wink'); // the right eye closes, the left stays open
      root.classList.toggle('is-eyes-dizzy', p.eyes === 'dizzy');
      root.classList.toggle('is-eyes-teary', p.eyes === 'teary');
    }
    if (p.eyes === 'dizzy') for (const side of ['l', 'r']) set(parts[`swirl_${side}`], 'transform', `rotate(${r(side === 'l' ? p.swirl : -p.swirl)})`);

    // Brows: hidden, shown only with a feeling, or always (by the learner's choice).
    const mood = p.brows && p.brows !== 'none' ? p.brows : 'neutral';
    const showBrows = look.brows === 'always' || (look.brows === 'expressive' && mood !== 'neutral');
    if (showBrows !== browsShown) {
      browsShown = showBrows;
      root.classList.toggle('has-brows', showBrows);
    }
    if (showBrows) {
      const b = BROWS[mood] || BROWS.neutral;
      const lift = -(look.eyeSize - 1) * 5; // larger eyes push the brows up
      set(parts.brow_l, 'transform', `translate(${r(39 - look.spacing + p.eyeX * 0.6)} ${r(39.2 + b.y + lift + p.eyeY * 0.5)}) rotate(${b.l})`);
      set(parts.brow_r, 'transform', `translate(${r(61 + look.spacing + p.eyeX * 0.6)} ${r(39.2 + b.y + lift + p.eyeY * 0.5)}) rotate(${b.r})`);
    }

    const mouth = MOUTHS[p.mouth] || MOUTHS.smile;
    set(parts.mouthLine, 'd', mouth.line || 'M0 0');
    set(parts.mouthFill, 'd', mouth.fill || 'M0 0');

    // Tears run down from under each eye and fade.
    const tears = p.tears || 0;
    for (const side of ['l', 'r']) {
      const x = side === 'l' ? 39 - look.spacing - 2.6 : 61 + look.spacing + 2.6;
      const k = p.tearPhase || 0;
      set(parts[`tear_${side}`], 'opacity', tears > 0 ? String(r(tears * (1 - k * k))) : '0');
      set(parts[`tear_${side}`], 'transform', `translate(${r(x)} ${r(51.5 + k * 9)})`);
    }

    // A sweat drop slides down beside the head and fades; cheeks redden with blush.
    const sw = p.sweat || 0;
    set(parts.sweat, 'opacity', sw > 0 ? String(r(Math.min(1, sw * 5) * (1 - Math.max(0, sw - 0.6) / 0.4))) : '0');
    set(parts.sweat, 'transform', `translate(${r(74 + turn * 3)} ${r(24 + sw * 10)})`);
    const cheek = String(r(Math.min(1, look.blush + 0.4 * (p.blush || 0))));
    const cheekScale = `scale(${r(1 + 0.25 * (p.blush || 0))})`;
    for (const c of [parts.cheekL, parts.cheekR]) {
      set(c, 'opacity', cheek);
      set(c, 'transform', `translate(${c === parts.cheekL ? 30.5 : 69.5} 58) ${cheekScale} translate(${c === parts.cheekL ? -30.5 : -69.5} -58)`);
    }

    // Stars orbit the head (dizzy, or a hard knock): an ellipse seen from the side, nearer = bigger.
    const so = p.starO || 0;
    set(parts.stars, 'opacity', String(r(so)));
    if (so > 0) {
      [parts.star0, parts.star1, parts.star2].forEach((node, i) => {
        const a = ((p.starA || 0) + i * 120) * Math.PI / 180;
        set(node, 'transform', `translate(${r(50 + 25 * Math.cos(a))} ${r(14 + 5 * Math.sin(a))}) scale(${r(0.75 + 0.3 * Math.sin(a))})`);
      });
    }

    // The shine slides opposite the turn, as a fixed light would on a turning body.
    set(parts.shine, 'transform', `translate(${r(-turn * 4)} 0) rotate(-32 35 33)`);
    set(parts.sprout, 'transform', `rotate(${r(p.sprout)} 50 23)`);
    const flip = turn < -0.2 ? 'translate(100 0) scale(-1 1)' : '';
    set(parts.cap, 'transform', flip);
    set(parts.gradcap, 'transform', flip);

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

  /** Colours, eyes, leaf, body shape and accessories from the settings (missing fields = the classic look). */
  function applyAppearance(s = {}) {
    const color = s.color || '#f08a2c';
    const shades = palette(color);
    root.style.setProperty('--buddy-limb', shades.limb);
    root.style.setProperty('--buddy-limb-back', shades.back);
    root.style.setProperty('--buddy-outline', shades.outline);
    root.style.setProperty('--buddy-belly', shades.belly);
    parts.stopLight.setAttribute('stop-color', shades.light);
    parts.stopBase.setAttribute('stop-color', color);
    parts.stopDark.setAttribute('stop-color', shades.dark);

    // Leaf colour: the theme token unless the learner chose another green (or any colour).
    if (s.leafColor && s.leafColor !== '#5cb85c') {
      root.style.setProperty('--buddy-leaf', s.leafColor);
      root.style.setProperty('--buddy-leaf-dark', mix(s.leafColor, 'black', 0.45));
    } else {
      root.style.removeProperty('--buddy-leaf');
      root.style.removeProperty('--buddy-leaf-dark');
    }
    // Accent: one fabric colour for every accessory; "" keeps each accessory's own colours.
    const fabric = ['--buddy-cap', '--buddy-bow', '--buddy-band', '--buddy-scarf', '--buddy-acc-petal'];
    for (const v of fabric) {
      if (s.accent) {
        root.style.setProperty(v, s.accent);
        root.style.setProperty(`${v}-dark`, mix(s.accent, 'black', 0.35));
      } else {
        root.style.removeProperty(v);
        root.style.removeProperty(`${v}-dark`);
      }
    }

    const shape = EYE_SHAPES[s.eyes] || EYE_SHAPES.round;
    const shine = SHINE[s.shine] || 1;
    for (const side of ['l', 'r']) {
      parts[`eyeOpen_${side}`].replaceChildren(...[
        svg('ellipse', { class: 'b-pupil', cx: 0, cy: 0, rx: shape.rx, ry: shape.ry }),
        ...shape.glints.map(([x, y, rad]) => svg('circle', { class: 'b-glint', cx: x, cy: y, r: r(rad * shine) })),
        svg('path', { class: 'b-sparkle', d: 'M1.4 -4.6 L2.2 -2.6 L4.2 -1.8 L2.2 -1 L1.4 1 L0.6 -1 L-1.4 -1.8 L0.6 -2.6 Z' }),
        svg('path', { class: 'b-tearline', d: `M${r(-shape.rx * 0.8)} ${r(shape.ry * 0.45)} Q0 ${r(shape.ry * 1.05)} ${r(shape.rx * 0.8)} ${r(shape.ry * 0.45)}` }),
        shape.lid ? svg('path', { class: 'b-lid', d: `M${r(-shape.rx - 0.8)} ${r(-shape.ry * 0.25)} Q0 ${r(-shape.ry - 1.6)} ${r(shape.rx + 0.8)} ${r(-shape.ry * 0.25)}` }) : null,
      ].filter(Boolean));
    }
    look.eyeSize = Number.isFinite(s.eyeSize) ? s.eyeSize : 1;
    look.spacing = Number.isFinite(s.eyeSpacing) ? s.eyeSpacing : 0;
    look.brows = s.brows || 'expressive';
    look.blush = BLUSH[s.blush] ?? BLUSH.soft;
    // Glasses frame the eyes wherever they sit, sized to the eye style.
    const lens = Math.max(6.4, shape.ry * look.eyeSize + 2.4);
    for (const [node, cx] of [[parts.lensL, 39 - look.spacing], [parts.lensR, 61 + look.spacing]]) {
      node.setAttribute('cx', String(r(cx)));
      node.setAttribute('r', String(r(lens)));
    }
    parts.bridge.setAttribute('d', `M${r(39 - look.spacing + lens - 0.4)} 46 Q50 44 ${r(61 + look.spacing - lens + 0.4)} 46`);

    parts.leaf.setAttribute('d', LEAVES[s.leafShape] || LEAVES.classic);
    const k = LEAF_SIZE[s.leafSize] || 1;
    parts.leaves.setAttribute('transform', k === 1 ? '' : `translate(51.5 11) scale(${k}) translate(-51.5 -11)`);
    root.dataset.leafDetail = s.leafDetail || 'none';
    root.classList.toggle('has-leaf-vein', Boolean(s.leafVein));

    const body = BODY_SHAPES[s.body] ? s.body : 'classic';
    const { sx, sy } = BODY_SHAPES[body];
    parts.shape.setAttribute('transform', sx === 1 && sy === 1 ? '' : `translate(50 ${FOOT_Y}) scale(${sx} ${sy}) translate(-50 ${-FOOT_Y})`);
    root.dataset.body = body;

    const shown = s.features?.accessories !== false;
    root.dataset.accessory = shown ? s.accessory || 'none' : 'none';
    root.dataset.extra = shown ? s.extra || 'none' : 'none';
    root.dataset.season = seasonOf();
  }

  /** Sprout stage 0…3 (growthStage): CSS shows the matching leaf, bud or flower. */
  function applyGrowth(stage) {
    root.dataset.growth = String(stage);
  }

  return { root, applyPose, applyAppearance, applyGrowth };
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
