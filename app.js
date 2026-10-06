// StudyHub entry point: boot, route → view dispatch, global shortcuts.
//
//   Content engine     js/content-loader.js, js/markdown-renderer.js, js/search.js
//   Engagement engine  js/engagement/ (registry, stepper, quiz, flashcards, …),
//                      js/visualizers/, js/simulators/
//   Study engine       js/study-engine.js over progress / bookmarks / history / activity
//   Views              js/views/

import { loadIndex, getTopic, neighbours } from './js/content-loader.js';
import { start, href, navigate } from './js/router.js';
import { installCopyHandler } from './js/markdown-renderer.js';
import { announce, isTypingTarget } from './js/util.js';
import * as theme from './js/theme.js';
import { onExternalChange } from './js/storage.js';
import { destroyAll } from './js/engagement/registry.js';
import * as updates from './js/updates.js';
import { renderSidebar, initSidebar, closeDrawer, initHeaderSearch } from './js/views/layout.js';
import { initMenu } from './js/views/menu.js';
import { renderHome } from './js/views/home.js';
import { renderSubject, renderModule } from './js/views/subject.js';
import { renderTopic, scrollToAnchor } from './js/views/topic.js';
import { renderMode } from './js/views/mode.js';
import { renderSession } from './js/views/session.js';
import { renderSearch, renderBookmarks, renderHistory, renderLab, renderUpdates } from './js/views/lists.js';
import { errorState } from './js/views/common.js';

const main = document.getElementById('main');
let renderToken = 0;
let currentContext = { path: '/' };
let firstRender = true;
let palette = null;

boot();

async function boot() {
  theme.apply();
  installCopyHandler();
  initSidebar();
  initMenu();
  initShortcuts();

  try {
    await loadIndex();
  } catch (error) {
    console.error(error);
    main.replaceChildren(errorState({
      title: 'StudyHub could not start',
      message: `${error.message} If you opened index.html directly from disk, run a local static server instead (see README).`,
      actions: [{ label: 'Reload', href: window.location.hash || '#/', primary: true }],
    }));
    return;
  }

  palette = initHeaderSearch();
  await updates.init();
  // Progress or bookmarks changed (here or in another tab): refresh the sidebar.
  document.addEventListener('studyhub:change', () => renderSidebar(currentContext));
  onExternalChange(() => renderSidebar(currentContext));
  start(onRoute);
}

/** Map a route to a view. Each view returns { title } (or null if superseded). */
async function onRoute(route, { sameView }) {
  const anchor = route.query.get('s');
  if (sameView) {
    scrollToAnchor(anchor);
    return;
  }

  const token = ++renderToken;
  const isCurrent = () => token === renderToken;
  destroyAll();
  closeDrawer(false);
  const [first, a, b, c] = route.segments;
  const context = { path: route.path };
  let result;

  try {
    if (!first) result = await renderHome(main);
    else if (first === 'updates') result = renderUpdates(main);
    else if (first === 'c' && a && b === 'm' && c) {
      Object.assign(context, { categoryId: a, modeId: c });
      result = await renderMode(main, { categoryId: a, modeId: c, anchor, isCurrent });
    } else if (first === 'c' && a && b) {
      Object.assign(context, { categoryId: a, subId: b });
      result = await renderModule(main, { categoryId: a, subId: b });
    } else if (first === 'c' && a) {
      Object.assign(context, { categoryId: a });
      result = await renderSubject(main, { categoryId: a });
    } else if (first === 't' && a) {
      const topic = getTopic(a);
      Object.assign(context, { topicId: a, categoryId: topic?.category, subId: topic?.subcategory });
      result = await renderTopic(main, { topicId: a, tab: b || 'lesson', anchor, isCurrent });
    } else if (first === 'session' && a) {
      result = await renderSession(main, { kind: a, scope: route.segments.slice(2), isCurrent });
      const scope = route.segments.slice(2);
      if (scope[0] === 'topic') Object.assign(context, { categoryId: getTopic(scope[1])?.category });
      else Object.assign(context, { categoryId: scope[1], subId: scope[0] === 'module' ? scope[2] : undefined });
    } else if (first === 'search') result = renderSearch(main, { query: route.query });
    else if (first === 'bookmarks') result = renderBookmarks(main);
    else if (first === 'history') result = renderHistory(main);
    else if (first === 'lab') result = await renderLab(main, { isCurrent });
    else {
      main.replaceChildren(errorState({
        title: 'Page not found',
        message: `“${route.path}” is not a StudyHub page.`,
        actions: [{ label: 'Back to dashboard', href: '#/', primary: true }],
      }));
      result = { title: 'Page not found' };
    }
  } catch (error) {
    // A view bug must never leave a blank page.
    console.error(error);
    if (!isCurrent()) return;
    main.replaceChildren(errorState({
      title: 'Something went wrong',
      message: 'This page failed to render. Other pages should still work.',
      actions: [{ label: 'Back to dashboard', href: '#/', primary: true }],
    }));
    result = { title: 'Error' };
  }

  if (!isCurrent() || !result) return;
  currentContext = context;
  renderSidebar(context);
  document.title = result.title === 'Dashboard' ? 'StudyHub' : `${result.title} · StudyHub`;

  if (!anchor) window.scrollTo(0, 0);
  else if (!first) scrollToAnchor(anchor); // dashboard sections, e.g. #/?s=quick-revision
  // Move focus to the new page's heading so keyboard and screen-reader users
  // start at the top of the new content (not on the first page load).
  if (!firstRender) {
    const target = result.focus || main.querySelector('h1');
    if (!anchor) target?.focus({ preventScroll: true });
    announce(`${result.title} loaded`);
  } else if (result.focus) {
    result.focus.focus();
  }
  firstRender = false;
}

function initShortcuts() {
  const dialog = document.getElementById('shortcuts-dialog');

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return;
    // Ctrl/⌘+K: search with quick actions (works from the search box too).
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
      if (document.querySelector('dialog[open]') || (isTypingTarget(event.target) && event.target.id !== 'search-input')) return;
      event.preventDefault();
      closeDrawer(false);
      palette?.openPalette();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Escape') {
      closeDrawer();
      return;
    }
    if (isTypingTarget(event.target) || document.querySelector('dialog[open]')) return;

    if (event.key === '/') {
      event.preventDefault();
      document.getElementById('search-input').focus();
    } else if (event.key === '?') {
      event.preventDefault();
      dialog.showModal();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      topicArrowNavigation(event);
    }
  });
}

/** ← / → move between topics on topic pages, unless a widget uses the arrows itself. */
function topicArrowNavigation(event) {
  if (!currentContext.topicId || document.querySelector('[data-arrow-keys]')) return;
  if (event.target.closest?.('pre, .table-wrap, .interaction, select, [role="slider"], input')) return;
  const topic = getTopic(currentContext.topicId);
  if (!topic) return;
  const { prev, next } = neighbours(topic);
  const target = event.key === 'ArrowLeft' ? prev : next;
  if (!target) return;
  event.preventDefault();
  navigate(href(['t', target.id]));
}

