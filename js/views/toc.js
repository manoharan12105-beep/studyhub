// "On this page" table of contents from a page's H2 headings.
// Two copies: a collapsible one above the article (narrow screens) and a sticky
// side column (wide screens). CSS shows one or the other.

import { el } from '../util.js';

export function buildToc(headings, anchorHref) {
  if (headings.length < 3) return { inline: null, aside: null, links: [] };
  const links = [];
  const list = () => el('ol', { class: 'toc-list' }, headings.map((h) => {
    const a = el('a', { href: anchorHref(h.id), 'data-target': h.id }, h.text);
    links.push(a);
    return el('li', {}, a);
  }));
  const inline = el('details', { class: 'toc toc-inline' }, el('summary', {}, 'On this page'), list());
  const aside = el('aside', { class: 'toc toc-aside', 'aria-label': 'On this page' },
    el('p', { class: 'toc-title' }, 'On this page'), list());
  return { inline, aside, links };
}

/** Highlight the section currently being read. Returns { destroy }. */
export function watchToc(headings, toc) {
  if (!toc.links.length || !('IntersectionObserver' in window)) return null;
  const visible = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target.id);
      else visible.delete(entry.target.id);
    }
    // The first heading in document order that is on screen wins; otherwise
    // keep the last heading above the viewport.
    let current = headings.find((h) => visible.has(h.id))?.id;
    if (!current) {
      const above = headings.filter((h) => h.element.getBoundingClientRect().top < 0);
      current = above[above.length - 1]?.id;
    }
    for (const a of toc.links) {
      const on = a.dataset.target === current;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  }, { rootMargin: '-64px 0px -55% 0px' });
  for (const h of headings) observer.observe(h.element);
  return { destroy: () => observer.disconnect() };
}
