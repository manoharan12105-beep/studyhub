// Small DOM and string helpers shared by every module.

/**
 * Create an element. `props` sets attributes (class, href, aria-*, data-*),
 * plus `text` for textContent and `on<Event>` for listeners.
 * Children may be nodes, strings or arrays (null/false are skipped).
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }
  append(node, children);
  return node;
}

export function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

/** SVG elements need the SVG namespace. */
export function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined) continue;
    if (key === 'text') node.textContent = value;
    else node.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) if (child) node.append(child);
  return node;
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/** GitHub-style heading slug, so in-page anchors match what GitHub generates. */
export function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Polite screen-reader announcement through the shared live region in index.html. */
export function announce(message) {
  const region = document.getElementById('live-region');
  if (!region) return;
  region.textContent = '';
  // A new text node after a tick makes repeated identical messages announce again.
  setTimeout(() => { region.textContent = message; }, 30);
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function formatMinutes(minutes) {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function timeAgo(iso) {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(then).toLocaleDateString();
}

/** True when a keyboard event happens while the user is typing somewhere. */
export function isTypingTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

export function percent(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

export function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Inline SVG icons (decorative; buttons carry their own text labels). */
const ICON_PATHS = {
  menu: 'M3 6h18M3 12h18M3 18h18',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.35-4.35',
  sun: 'M12 4V2M12 22v-2M4.93 4.93 3.51 3.51M20.49 20.49l-1.42-1.42M4 12H2M22 12h-2M4.93 19.07l-1.42 1.42M20.49 3.51l-1.42 1.42M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  check: 'M5 12l5 5L20 7',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  close: 'M6 6l12 12M18 6 6 18',
  play: 'M7 4l13 8-13 8z',
  pause: 'M7 4h4v16H7zM14 4h4v16h-4z',
  reset: 'M4 4v6h6M4.5 15a8 8 0 1 0 2-8.5L4 10',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  spark: 'M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z',
  clock: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01',
  home: 'M3 11l9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5',
  resume: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 8.5l5 3.5-5 3.5z',
  flask: 'M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7.5 14h9',
  sidebar: 'M4 4h16v16H4zM9 4v16',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  book: 'M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zM4 20a2 2 0 0 0 2 2h13v-4',
  revision: 'M4 4h11l5 5v11H4zM8 12h8M8 16h5',
  alert: 'M12 3 2 20h20zM12 10v4M12 17h.01',
  circle: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  transfer: 'M7 20V4M3 8l4-4 4 4M17 4v16M13 16l4 4 4-4',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h3',
  palette:'M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-.9-.7-1.3-.7-2.1 0-.9.7-1.4 1.6-1.4H17a4 4 0 0 0 4-4c0-5-4-9-9-9zM7.5 12h.01M9.5 7.5h.01M14.5 7.5h.01',
};

export function icon(name, size = 18) {
  const path = ICON_PATHS[name] || ICON_PATHS.spark;
  return svg('svg', {
    viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor',
    'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    'aria-hidden': 'true', focusable: 'false', class: 'icon',
  }, svg('path', { d: path }));
}
