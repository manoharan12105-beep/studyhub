// Consistent hashing on a ring.
//
//   virtual nodes per server → place servers A, B, C → place 12 keys →
//   add server D (which keys move?) → remove server B (where do its keys go?)
//
// Ring positions are a deterministic 32-bit hash scaled to 0–360°. A key belongs
// to the first server point clockwise from it. Each step reports how many keys
// moved, next to what `hash % N` would have moved for the same change.

import { el, svg } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { tableView } from '../simulators/network-common.js';
import { hash32, select, statsView } from '../simulators/system-design-common.js';

const VNODES = { 1: '1 point per server', 3: '3 virtual nodes per server', 10: '10 virtual nodes per server' };
const KEYS = Array.from({ length: 12 }, (_, i) => `user:${(i + 1) * 7}`);
const SERVER_INDEX = { A: 0, B: 1, C: 2, D: 3 };
const SIZE = 320;
const C = SIZE / 2;
const R = 120;

const angleOf = (label) => (hash32(label) / 4294967296) * 360;

export function mount(root, { options }) {
  const vnodes = select(VNODES, String(options.vnodes || 3));
  root.append(el('div', { class: 'viz-form' }, field('Virtual nodes', vnodes)));

  const drawing = svg('svg', { viewBox: `0 0 ${SIZE} ${SIZE}`, class: 'sd-ring', role: 'img' });
  const keysTable = tableView('Key → server', ['Key', 'Position', 'Server', 'Moved?']);
  const stats = statsView('Key movement');
  const legend = el('ul', { class: 'viz-legend', 'aria-label': 'Servers' });
  root.append(el('div', { class: 'viz-stage' },
    el('div', { class: 'sd-ring-top' }, el('div', { class: 'sd-ring-wrap' }, drawing), el('div', { class: 'sd-ring-side' }, legend, stats.node)),
    keysTable.node));
  const stepper = createStepper(root, { render, playDelay: 1800, nextLabel: 'Next step' });

  function render(frame) {
    drawRing(drawing, frame);
    legend.replaceChildren(...frame.servers.map((s) => el('li', {},
      svg('svg', { viewBox: '0 0 12 12', width: 12, height: 12, 'aria-hidden': 'true' }, svg('circle', { cx: 6, cy: 6, r: 5, class: `sd-ring-server sd-ring-s${SERVER_INDEX[s]}` })),
      `server ${s}`)), el('li', {}, frame.showKeys ? 'small dots = keys (outlined = moved)' : ''));
    drawing.setAttribute('aria-label', `Hash ring with servers ${frame.servers.join(', ')}${frame.showKeys ? ` and ${KEYS.length} keys` : ''}.`);
    keysTable.node.hidden = !frame.showKeys;
    if (frame.showKeys) {
      keysTable.render(KEYS.map((k) => [k, `${Math.round(angleOf(k))}°`, frame.owner[k], frame.moved.includes(k) ? 'yes' : '']), {
        rowClass: (row) => (row[3] ? 'is-changed' : ''),
      });
    }
    const counts = frame.servers.map((s) => `${s}: ${KEYS.filter((k) => frame.owner[k] === s).length}`).join(' · ');
    stats.render([
      ['Keys per server', frame.showKeys ? counts : '—'],
      ['Moved (ring)', frame.moved.length ? `${frame.moved.length} of ${KEYS.length}` : '—'],
      ['Moved (hash % N)', frame.modMoved !== undefined ? `${frame.modMoved} of ${KEYS.length}` : '—'],
    ]);
  }

  function start() {
    const v = Number(vnodes.value);
    const owners = (servers) => ownersFor(servers, v);
    const abc = ['A', 'B', 'C'];
    const abcd = ['A', 'B', 'C', 'D'];
    const acd = ['A', 'C', 'D'];
    const o1 = owners(abc);
    const o2 = owners(abcd);
    const o3 = owners(acd);
    const diff = (a, b) => KEYS.filter((k) => a[k] !== b[k]);
    const modMoved = (from, to) => KEYS.filter((k) => hash32(k) % from !== hash32(k) % to).length;
    const frames = [
      { servers: abc, v, showKeys: false, owner: o1, moved: [], text: `Servers A, B and C are hashed onto the ring${v > 1 ? `, each at ${v} points (A#0 … A#${v - 1})` : ' at one point each'}. Each owns the arc that ends at its point(s), going clockwise.` },
      { servers: abc, v, showKeys: true, owner: o1, moved: [], text: `12 keys are hashed onto the same ring; each belongs to the first server point clockwise. ${v === 1 ? 'With one point per server, arc sizes are uneven, so the key counts are uneven too.' : 'Many small arcs per server even out the share of keys.'}` },
      { servers: abcd, v, showKeys: true, owner: o2, moved: diff(o1, o2), modMoved: modMoved(3, 4), text: `Server D joins. Only keys in the arcs D now owns move — all of them TO D: ${diff(o1, o2).length} of 12. With hash % N going from 3 to 4 servers, ${modMoved(3, 4)} of the same 12 keys would change server.` },
      { servers: acd, v, showKeys: true, owner: o3, moved: diff(o2, o3), modMoved: modMoved(4, 3), text: `Server B leaves. Only B's keys move, each to the next server point clockwise: ${diff(o2, o3).length} key(s). ${v === 1 ? 'With one point, they all land on ONE neighbour, which may overload it.' : 'With virtual nodes they spread over several servers.'} hash % N would move ${modMoved(4, 3)}.` },
    ];
    stepper.load(frames[0], frames.slice(1));
  }

  vnodes.addEventListener('change', start);
  start();
  return stepper;
}

function pointsFor(servers, v) {
  const points = [];
  for (const s of servers) for (let i = 0; i < v; i += 1) points.push({ server: s, label: v > 1 ? `${s}#${i}` : s, angle: angleOf(`${s}#${i}`) });
  return points.sort((a, b) => a.angle - b.angle);
}

function ownersFor(servers, v) {
  const points = pointsFor(servers, v);
  const owner = {};
  for (const k of KEYS) {
    const a = angleOf(k);
    owner[k] = (points.find((p) => p.angle >= a) || points[0]).server;
  }
  return owner;
}

function xy(angle, radius) {
  const rad = ((angle - 90) * Math.PI) / 180;    // 0° at the top, clockwise
  return [C + radius * Math.cos(rad), C + radius * Math.sin(rad)];
}

function drawRing(node, frame) {
  const parts = [svg('circle', { cx: C, cy: C, r: R, class: 'sd-ring-track' })];
  for (const p of pointsFor(frame.servers, frame.v)) {
    const [x, y] = xy(p.angle, R);
    const [lx, ly] = xy(p.angle, R + 18);
    parts.push(svg('circle', { cx: x, cy: y, r: 6, class: `sd-ring-server sd-ring-s${SERVER_INDEX[p.server]}` }));
    if (frame.v <= 3) parts.push(svg('text', { x: lx, y: ly + 4, 'text-anchor': 'middle', class: 'sd-ring-label', text: p.label }));
  }
  if (frame.showKeys) {
    for (const k of KEYS) {
      const [x, y] = xy(angleOf(k), R - 22);
      const moved = frame.moved.includes(k);
      parts.push(svg('circle', { cx: x, cy: y, r: moved ? 5.5 : 4, class: `sd-ring-key sd-ring-s${SERVER_INDEX[frame.owner[k]]}${moved ? ' is-moved' : ''}` }));
    }
  }
  node.replaceChildren(...parts);
}
