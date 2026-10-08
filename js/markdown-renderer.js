// Markdown → safe, enhanced DOM.
//
// 1. marked (vendored) turns Markdown into an HTML string. Raw HTML in the
//    content is escaped, except <details>/<summary> — the only HTML the content
//    guide allows — so the string is safe to parse.
// 2. The DOM is then enhanced: heading ids, GitHub-style callouts, highlighted
//    code blocks with a copy button, scrollable tables, and links/images
//    rewritten so they work inside the app.

import { Marked } from '../assets/vendor/marked-18.0.14/marked.esm.js';
import { escapeHtml, slugify, el, icon, announce } from './util.js';
import { highlight } from './highlight.js';
import { index, resolvePath, fileTab } from './content-loader.js';
import { href } from './router.js';

const ALLOWED_TAGS = /<details(?:\s+open)?\s*>|<\/details\s*>|<summary\s*>|<\/summary\s*>/gi;

function sanitizeHtml(text) {
  let out = '';
  let last = 0;
  for (const match of text.matchAll(ALLOWED_TAGS)) {
    out += escapeHtml(text.slice(last, match.index)) + match[0].toLowerCase().replace(/\s+/g, ' ');
    last = match.index + match[0].length;
  }
  return out + escapeHtml(text.slice(last));
}

const marked = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return sanitizeHtml(text);
    },
  },
});

const CALLOUTS = {
  NOTE: 'Note', TIP: 'Tip', IMPORTANT: 'Important', WARNING: 'Warning', CAUTION: 'Caution',
};

/**
 * Render Markdown into an <div class="markdown-body">.
 *
 * options:
 *   sourcePath  path of the .md file (resolves relative links and images)
 *   idPrefix    prefix for heading ids (keeps ids unique when several files share a page)
 *   anchorHref  (id) => href for in-page links; defaults to the current route + ?s=id
 *   dropTitle   remove the H1 (the view shows the title itself)
 *   demote      shift headings down one level (h1 → h2 …) when the file is a section of a page
 *   breaks      keep single line breaks (learner notes written as plain text)
 *   noImages    show every image as its alt text, never loading it (learner notes have no attachments)
 *
 * Returns { node, headings: [{ level, id, text, element }], title }.
 */
export function renderMarkdown(markdown, options = {}) {
  const { sourcePath = '', idPrefix = '', dropTitle = false, demote = false } = options;
  const anchorHref = options.anchorHref || defaultAnchorHref;

  const template = document.createElement('template');
  template.innerHTML = marked.parse(markdown, options.breaks ? { breaks: true } : undefined);
  // Template content is inert: images are replaced before they could start loading.
  if (options.noImages) {
    for (const image of template.content.querySelectorAll('img')) {
      image.replaceWith(el('span', { class: 'missing-image' }, `[Image: ${image.getAttribute('alt') || 'not shown'}]`));
    }
  }
  const root = el('div', { class: 'markdown-body' });
  root.append(template.content);

  const title = root.querySelector('h1')?.textContent.trim() || '';
  if (dropTitle) root.querySelector('h1')?.remove();
  if (demote) demoteHeadings(root);

  const headings = assignHeadingIds(root, idPrefix);
  enhanceCallouts(root);
  enhanceCodeBlocks(root);
  enhanceTables(root);
  enhanceLinks(root, sourcePath, idPrefix, anchorHref);
  enhanceImages(root, sourcePath);
  for (const details of root.querySelectorAll('details')) details.classList.add('reveal');

  return { node: root, headings, title };
}

/** Render a short inline Markdown string (used by interaction data). */
export function renderInline(markdown) {
  const span = document.createElement('span');
  span.innerHTML = marked.parseInline(String(markdown));
  for (const code of span.querySelectorAll('code')) code.classList.add('inline-code');
  return span;
}

function defaultAnchorHref(id) {
  const [path, query = ''] = window.location.hash.split('?');
  const params = new URLSearchParams(query);
  params.set('s', id);
  return `${path || '#/'}?${params}`;
}

function demoteHeadings(root) {
  for (const heading of root.querySelectorAll('h1, h2, h3, h4, h5')) {
    const level = Math.min(6, Number(heading.tagName[1]) + 1);
    const replacement = document.createElement(`h${level}`);
    replacement.append(...heading.childNodes);
    heading.replaceWith(replacement);
  }
}

function assignHeadingIds(root, prefix) {
  const seen = new Map();
  const headings = [];
  for (const heading of root.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    const text = heading.textContent.trim();
    const base = slugify(text) || 'section';
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    heading.id = prefix + (count ? `${base}-${count}` : base);
    heading.tabIndex = -1; // focusable target for anchor navigation
    headings.push({ level: Number(heading.tagName[1]), id: heading.id, text, element: heading });
  }
  return headings;
}

function enhanceCallouts(root) {
  for (const quote of root.querySelectorAll('blockquote')) {
    const first = quote.firstElementChild;
    if (!first || first.tagName !== 'P') continue;
    const match = first.textContent.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/);
    if (!match) continue;
    stripLeadingText(first, match[0].length);
    if (!first.textContent.trim() && !first.querySelector('img, code')) first.remove();
    const type = match[1];
    const box = el('div', { class: `callout callout-${type.toLowerCase()}`, role: 'note' },
      el('p', { class: 'callout-title' }, el('span', { class: 'callout-icon', 'aria-hidden': 'true' }), CALLOUTS[type]));
    box.append(...quote.childNodes);
    quote.replaceWith(box);
  }
}

/** Remove the first `count` characters of text from an element, across text nodes. */
function stripLeadingText(element, count) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let remaining = count;
  while (remaining > 0 && walker.nextNode()) {
    const node = walker.currentNode;
    const take = Math.min(remaining, node.data.length);
    node.data = node.data.slice(take);
    remaining -= take;
  }
  // A line break directly after the marker leaves a leading <br> (behind the now-empty text); drop it.
  while (element.firstChild?.nodeType === Node.TEXT_NODE && !element.firstChild.data.trim()) element.firstChild.remove();
  if (element.firstChild?.nodeName === 'BR') element.firstChild.remove();
}

const LANGUAGE_LABELS = {
  java: 'Java', sql: 'SQL', text: '', pseudocode: 'Pseudocode', json: 'JSON', yaml: 'YAML',
  properties: 'Properties', xml: 'XML', http: 'HTTP', bash: 'Bash', dockerfile: 'Dockerfile',
};

function enhanceCodeBlocks(root) {
  for (const code of root.querySelectorAll('pre > code')) {
    const pre = code.parentElement;
    const language = (code.className.match(/language-([\w-]+)/) || [])[1] || 'text';
    const source = code.textContent;
    code.innerHTML = highlight(source, language);
    pre.tabIndex = 0; // long lines scroll horizontally; keyboard users need to reach them
    pre.classList.add(`lang-${language}`);
    const label = LANGUAGE_LABELS[language] ?? language;
    const figure = el('div', { class: 'code-block' },
      el('div', { class: 'code-toolbar' },
        el('span', { class: 'code-lang' }, label),
        copyButton()));
    pre.replaceWith(figure);
    figure.append(pre);
  }
}

// Copy buttons use one delegated listener (installCopyHandler) instead of a
// listener each, so they keep working when practice items are cloned.
function copyButton() {
  return el('button', { type: 'button', class: 'btn-ghost btn-xs copy-btn' }, icon('copy', 14), el('span', {}, 'Copy'));
}

export function installCopyHandler() {
  document.addEventListener('click', async (event) => {
    const button = event.target.closest?.('.copy-btn');
    if (!button) return;
    const pre = button.closest('.code-block')?.querySelector('pre');
    if (!pre) return;
    const label = button.lastChild;
    try {
      await navigator.clipboard.writeText(pre.textContent);
      label.textContent = 'Copied';
      announce('Code copied to clipboard');
    } catch {
      label.textContent = 'Copy failed';
    }
    setTimeout(() => { label.textContent = 'Copy'; }, 1600);
  });
}

function enhanceTables(root) {
  for (const table of root.querySelectorAll('table')) {
    const wrap = el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'Table (scrolls horizontally)' });
    table.replaceWith(wrap);
    wrap.append(table);
  }
}

const SAFE_EXTERNAL = /^(https?:|mailto:)/i;

function enhanceLinks(root, sourcePath, idPrefix, anchorHref) {
  for (const link of root.querySelectorAll('a[href]')) {
    const raw = link.getAttribute('href');
    if (raw.startsWith('#')) {
      link.setAttribute('href', anchorHref(idPrefix + safeDecode(raw.slice(1))));
      continue;
    }
    if (SAFE_EXTERNAL.test(raw)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.classList.add('external');
      continue;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
      // javascript:, data: and other schemes are never followed.
      link.removeAttribute('href');
      continue;
    }
    const [pathPart, anchor = ''] = raw.split('#');
    const target = resolvePath(sourcePath, safeDecode(pathPart));
    link.setAttribute('href', appHrefForPath(target, anchor) || target);
  }
}

/** Map a repository path (content/…/content.md) to an in-app route, if it has one. */
export function appHrefForPath(path, anchor = '') {
  const route = index.pathToRoute.get(path);
  if (!route) return null;
  const query = anchor ? { s: anchor } : undefined;
  if (route.topicId) {
    const tab = fileTab(route.file).tab;
    return href(tab === 'lesson' ? ['t', route.topicId] : ['t', route.topicId, tab], query);
  }
  // Study-mode sections prefix their heading ids with the source index.
  const prefix = `s${route.sourceIndex}-`;
  return href(['c', route.categoryId, 'm', route.modeId], { s: anchor ? prefix + anchor : `src-${route.sourceIndex}` });
}

function enhanceImages(root, sourcePath) {
  for (const image of root.querySelectorAll('img')) {
    const raw = image.getAttribute('src') || '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) {
      // No external requests at runtime (content guide §4): show the alt text instead.
      image.replaceWith(el('span', { class: 'missing-image' }, `[Image: ${image.alt || 'external image not loaded'}]`));
      continue;
    }
    image.src = resolvePath(sourcePath, safeDecode(raw));
    image.loading = 'lazy';
    image.decoding = 'async';
  }
}

function safeDecode(text) {
  try { return decodeURIComponent(text); } catch { return text; }
}
