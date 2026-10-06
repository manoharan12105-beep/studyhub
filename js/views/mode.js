// Category study mode (e.g. Revision, Quick Revision): all source files of the
// mode on one page, in metadata order, with a sticky bar to jump between them.

import { el, icon, formatMinutes } from '../util.js';
import { getCategory, fetchText } from '../content-loader.js';
import { renderMarkdown } from '../markdown-renderer.js';
import { href } from '../router.js';
import * as history from '../history.js';
import { track } from '../engagement/registry.js';
import { pageHeader, errorState, loading } from './common.js';
import { modeTabs } from './subject.js';
import { watchToc } from './toc.js';
import { scrollToAnchor, loadFailure } from './topic.js';

export async function renderMode(main, { categoryId, modeId, anchor, isCurrent }) {
  const category = getCategory(categoryId);
  const mode = category?.studyModes.find((m) => m.id === modeId);
  if (!mode) {
    main.replaceChildren(errorState({
      title: 'Study mode not found',
      message: category ? `${category.title} has no study mode “${modeId}”.` : `There is no subject “${categoryId}”.`,
      actions: [category ? { label: `Back to ${category.title}`, href: href(['c', category.id]), primary: true } : { label: 'Back to dashboard', href: '#/', primary: true }],
    }));
    return { title: 'Study mode not found' };
  }
  history.record('mode', `${category.id}/${mode.id}`);

  const anchorHref = (id) => href(['c', category.id, 'm', mode.id], { s: id });
  const sourceBar = el('nav', { class: 'source-bar', 'aria-label': `${mode.title} sections` },
    el('ol', {}, mode.sources.map((source, i) => el('li', {},
      el('a', { href: anchorHref(`src-${i}`), 'data-target': `src-${i}` }, source.title)))));
  const sections = mode.sources.map((source, i) => el('section', { class: 'mode-section', 'aria-labelledby': `src-${i}` },
    el('h2', { class: 'mode-section-title', id: `src-${i}`, tabindex: -1 }, source.title),
    el('div', { class: 'mode-section-body' }, loading())));

  main.replaceChildren(el('div', { class: 'page mode-page' },
    pageHeader({
      crumbs: [{ label: category.title, href: href(['c', category.id]) }, { label: mode.title }],
      title: mode.title,
      lead: mode.description,
      meta: el('p', { class: 'topic-meta' },
        el('span', { class: 'meta-item' }, `${mode.sources.length} sections`),
        mode.estimatedMinutes ? el('span', { class: 'meta-item' }, icon('clock', 14), formatMinutes(mode.estimatedMinutes)) : null),
    }),
    modeTabs(category, mode.id),
    sourceBar,
    el('div', { class: 'mode-content' }, sections)));

  // Fetch every source in parallel; each section fills in as soon as it arrives.
  await Promise.all(mode.sources.map(async (source, i) => {
    const body = sections[i].querySelector('.mode-section-body');
    try {
      const markdown = await fetchText(source.path);
      if (!isCurrent()) return;
      const { node } = renderMarkdown(markdown, {
        sourcePath: source.path, idPrefix: `s${i}-`, dropTitle: true, demote: true, anchorHref,
      });
      body.replaceChildren(node);
    } catch (error) {
      if (isCurrent()) body.replaceChildren(loadFailure(error, source.path));
    }
  }));
  if (!isCurrent()) return null;

  const headings = sections.map((s) => {
    const h = s.querySelector('.mode-section-title');
    return { id: h.id, text: h.textContent, element: h };
  });
  track(watchToc(headings, { links: [...sourceBar.querySelectorAll('a')] }));
  if (anchor) scrollToAnchor(anchor);
  return { title: `${mode.title} · ${category.title}` };
}
