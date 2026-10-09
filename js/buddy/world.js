// Buddy's surroundings, measured from the real page.
//
// Surfaces (viewport coordinates — Buddy is position: fixed):
//   floor  the bottom edge of the viewport, across the workspace (right of the
//          sidebar on desktop; right of the drawer while it is open on phones)
//   wall   the outer (right) edge of the sidebar, from below the header down to
//          the floor. Climbable only while the sidebar is really there: expanded
//          on desktop, or the drawer open on phones. The 64px collapsed rail is
//          not a climbing surface.
//
// Geometry is read once and cached; events (sidebar, resize, route, theme…)
// call invalidate() and the next read re-measures. Nothing here runs per frame
// except reading the cache.

import { BODY_HALF, FOOT_Y } from './character.js';

const DESKTOP = window.matchMedia('(min-width: 768px)');

// Things Buddy must never sit on top of. Any of these under its body counts as
// "in the way" (lesson text, code, tables, every control, the knowledge map…).
const ESSENTIAL = [
  'a', 'button', 'input', 'textarea', 'select', 'summary', 'label', '[contenteditable]',
  '[role="button"]', '[role="option"]', '[role="slider"]', '[role="tab"]', '[role="menuitem"]',
  'p', 'li', 'dt', 'dd', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'kbd', 'table',
  'img', 'canvas', 'video', 'figure', 'details', '.btn', '.card', '.interaction', '.quiz', '.galaxy-stage',
].join(',');

export function createWorld({ size, isBuddyNode }) {
  let cache = null;

  function measure() {
    const root = document.documentElement;
    const vw = root.clientWidth; // excludes a classic scrollbar
    const vh = window.innerHeight;
    const scale = size() / 100;
    const half = BODY_HALF * scale;
    const header = document.getElementById('app-header')?.getBoundingClientRect();
    const headerBottom = header ? Math.max(0, header.bottom) : 0;
    const sidebar = document.getElementById('sidebar');
    const desktop = DESKTOP.matches;
    const collapsed = root.getAttribute('data-sidebar') === 'collapsed';
    const drawerOpen = document.body.classList.contains('nav-open');

    // The sidebar's right edge where it will rest (offsetWidth ignores the drawer's slide transform).
    let edge = 0;
    let wallValid = false;
    if (sidebar) {
      if (desktop) {
        edge = sidebar.getBoundingClientRect().right;
        wallValid = !collapsed && sidebar.offsetWidth > 150;
      } else if (drawerOpen) {
        edge = sidebar.offsetWidth;
        wallValid = edge > 150;
      }
    }

    const floorY = vh - 1;
    const workspaceLeft = desktop ? (sidebar ? sidebar.getBoundingClientRect().right : 0) : (drawerOpen ? edge : 0);
    const x0 = workspaceLeft + half + 1;
    const x1 = vw - half - 4;
    const height = size() * (FOOT_Y / 100);

    cache = {
      vw, vh, scale, half, height, headerBottom, desktop, collapsed, drawerOpen,
      floor: { kind: 'floor', y: floorY, x0, x1: Math.max(x0, x1), roomy: x1 >= x0 },
      wall: {
        kind: 'wall',
        valid: wallValid && floorY - headerBottom > height * 3,
        x: edge,
        // Feet-anchor range while climbing: the head stays below the header.
        top: headerBottom + height + 10,
        bottom: floorY,
        attachX: edge + half + 1,
      },
    };
    return cache;
  }

  function get() {
    return cache || measure();
  }

  function invalidate() {
    cache = null;
  }

  /** Buddy's box (viewport px) when its feet are at (x, y) on the floor. */
  function boxAt(x, y) {
    const w = get();
    return { left: x - w.half, right: x + w.half, top: y - w.height * 0.82, bottom: y - 2 };
  }

  /**
   * How much essential UI is under a box: the number of sample points (of 9)
   * whose top element is lesson content or a control. Three rows, so the gap
   * between two paragraphs cannot make a box over text look clear.
   */
  function obstruction(box) {
    let hits = 0;
    const xs = [box.left + 3, (box.left + box.right) / 2, box.right - 3];
    const ys = [box.top + 3, (box.top + box.bottom) / 2, box.bottom - 3];
    for (const px of xs) {
      for (const py of ys) {
        if (px < 0 || py < 0 || px >= get().vw || py >= get().vh) continue;
        const top = document.elementsFromPoint(px, py).find((node) => !isBuddyNode(node));
        if (top && top.closest(ESSENTIAL)) hits++;
      }
    }
    return hits;
  }

  /**
   * The floor spot nearest `preferredX` where Buddy covers nothing essential.
   * Returns { x, clear }; clear is false when every spot covers something —
   * then x is the least-covered spot and Buddy keeps itself small there.
   */
  function clearSpot(preferredX) {
    const { floor } = get();
    const start = Math.min(floor.x1, Math.max(floor.x0, preferredX));
    const step = Math.max(16, get().half);
    // Nearest first, alternating sides, until the whole floor has been tried
    // (both ends included). Only runs when Buddy stops or the page changes.
    const reach = Math.max(start - floor.x0, floor.x1 - start);
    let best = { x: start, hits: Infinity };
    for (let i = 0; Math.ceil(i / 2) * step <= reach + step; i++) {
      const offset = Math.ceil(i / 2) * step * (i % 2 ? 1 : -1);
      const x = Math.min(floor.x1, Math.max(floor.x0, start + offset));
      if (i > 0 && (x === floor.x0 || x === floor.x1) && Math.abs(start + offset - x) >= step) continue; // already tried this end
      const hits = obstruction(boxAt(x, floor.y));
      if (hits === 0) return { x, clear: true };
      if (hits < best.hits) best = { x, hits };
    }
    return { x: best.x, clear: false };
  }

  /** A height on the wall to climb to whose column covers as little as possible. */
  function climbTarget(preferredFraction) {
    const { wall, half, height } = get();
    const span = wall.bottom - wall.top;
    const candidates = [preferredFraction, 0.5, 0.7, 0.35, 0.85, 0.2].map((f) => wall.bottom - span * f);
    let best = candidates[0];
    let bestHits = Infinity;
    for (const y of candidates) {
      const hits = obstruction({ left: wall.attachX - half, right: wall.attachX + half, top: y - height * 0.82, bottom: y - 2 });
      if (hits < bestHits) { best = y; bestHits = hits; }
      if (hits === 0) break;
    }
    return Math.max(wall.top, Math.min(wall.bottom, best));
  }

  return { get, invalidate, measure, boxAt, obstruction, clearSpot, climbTarget };
}
