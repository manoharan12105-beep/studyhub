// Shared building blocks for the System Design simulators and visualizers.
//
// Not an interaction itself (nothing registers "system-design-common"); it keeps
// the System Design modules consistent:
//   statsView  — a row of labelled numbers (hits, misses, queue depth …)
//   barsView   — labelled horizontal bars (load per shard, calls per tick …)
//   nodesView  — a grid of node cards (servers, replicas, shards, consumers)
//   checkbox   — a labelled checkbox
//   seeded     — a small seeded random generator, so "random" runs replay identically
//   select     — re-exported from the Networks helpers

import { el } from '../util.js';

export { select } from './network-common.js';

export function statsView(label = 'Statistics') {
  const node = el('dl', { class: 'viz-stats sd-stats', 'aria-label': label });
  return {
    node,
    render(pairs) {
      node.replaceChildren(...pairs.map(([key, value]) => el('div', {}, el('dt', {}, key), el('dd', {}, String(value)))));
    },
  };
}

/** rows: [{ label, value, max, note?, state? ('hot' | 'ok' | 'bad' | 'current') }] */
export function barsView(label) {
  const list = el('ul', { class: 'sd-bars', 'aria-label': label });
  return {
    node: list,
    render(rows) {
      list.replaceChildren(...rows.map((r) => {
        const pct = r.max > 0 ? Math.min(100, Math.round((r.value / r.max) * 100)) : 0;
        return el('li', { class: ['sd-bar', r.state ? `is-${r.state}` : ''].join(' ') },
          el('span', { class: 'sd-bar-label' }, r.label),
          el('span', { class: 'sd-bar-track', 'aria-hidden': 'true' }, el('span', { class: 'sd-bar-fill', style: `width:${pct}%` })),
          el('span', { class: 'sd-bar-value' }, r.note ?? String(r.value)));
      }));
    },
  };
}

/** cards: [{ title, lines: string[], state? ('current' | 'down' | 'stale' | 'primary' | 'ok' | 'idle') }] */
export function nodesView(label) {
  const list = el('ul', { class: 'sd-nodes', 'aria-label': label });
  return {
    node: list,
    render(cards) {
      list.replaceChildren(...cards.map((c) => el('li', {
        class: ['sd-node', ...(c.state ? String(c.state).split(' ').map((s) => `is-${s}`) : [])].join(' '),
      },
      el('strong', {}, c.title),
      ...(c.lines || []).map((line) => el('span', {}, line)))));
    },
  };
}

export function checkbox(label, checked = false) {
  const input = el('input', { type: 'checkbox', checked });
  return { input, node: el('label', { class: 'perm-special' }, input, ` ${label}`) };
}

/** mulberry32: tiny deterministic PRNG returning numbers in [0, 1). */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic 32-bit string hash (FNV-1a followed by a murmur-style finaliser for good spread). */
export function hash32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
