// Header menu (⋮): Study links, theme picker, StudyHub Buddy settings, Updates and About.
// ARIA menu-button pattern: arrow keys move, Home/End jump, Esc closes and
// returns focus to the button, Tab or a click outside closes it.
// "Theme" opens a submenu in the same panel (drill-in, so it fits a phone):
// Enter / Space / → open it, ← / Esc go back to "Theme".

import { el, svg, icon, announce } from '../util.js';
import { index, isAvailable } from '../content-loader.js';
import * as theme from '../theme.js';
import * as updates from '../updates.js';
import { openBackup } from './backup-dialog.js';
import { openBuddySettings } from './buddy-dialog.js';
import * as buddySettings from '../buddy/settings.js';

const REPO_URL = 'https://github.com/manoharan12105-beep/studyhub';

let button;
let panel;

export function initMenu() {
  button = document.getElementById('app-menu-btn');
  panel = document.getElementById('app-menu-list');
  for (const dialog of document.querySelectorAll('dialog.dialog')) wireDialog(dialog);

  button.addEventListener('click', () => (isOpen() ? close() : open()));
  button.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      open(event.key === 'ArrowUp' ? 'last' : 'first');
    }
  });
  panel.addEventListener('keydown', onMenuKey);
  panel.addEventListener('click', onMenuClick);
  document.addEventListener('pointerdown', (event) => {
    if (isOpen() && !event.target.closest('#app-menu')) close(false);
  });
  // Focus leaving the menu (Tab, or a click elsewhere) closes it.
  panel.addEventListener('focusout', (event) => {
    if (isOpen() && event.relatedTarget && !event.relatedTarget.closest('#app-menu')) close(false);
  });

  document.addEventListener('studyhub:updates', syncBadge);
  document.addEventListener('studyhub:theme', syncThemes);
  syncBadge();
}

function isOpen() {
  return !panel.hidden;
}

function open(focus = 'first') {
  // Visible first: an element inside a hidden panel cannot take focus.
  panel.hidden = false;
  button.setAttribute('aria-expanded', 'true');
  showMain(focus);
}

/** Main menu; `focus` is 'first', 'last' or 'theme' (back from the submenu). */
function showMain(focus = 'first') {
  panel.replaceChildren(...buildItems());
  panel.removeAttribute('aria-label');
  panel.setAttribute('aria-labelledby', 'app-menu-btn');
  panel.dataset.view = 'main';
  const items = menuItems();
  (focus === 'last' ? items[items.length - 1] : focus === 'theme' ? panel.querySelector('[data-action="theme"]') : items[0])?.focus();
}

function showThemes() {
  panel.replaceChildren(...buildThemeItems());
  panel.removeAttribute('aria-labelledby');
  panel.setAttribute('aria-label', 'Theme');
  panel.dataset.view = 'theme';
  (panel.querySelector('[aria-checked="true"]') || menuItems()[0]).focus();
}

export function close(restoreFocus = true) {
  if (!isOpen()) return false;
  panel.hidden = true;
  button.setAttribute('aria-expanded', 'false');
  if (restoreFocus) button.focus();
  return true;
}

function menuItems() {
  return [...panel.querySelectorAll('[role^="menuitem"]')];
}

function onMenuKey(event) {
  const items = menuItems();
  const i = items.indexOf(document.activeElement);
  const move = (to) => { event.preventDefault(); items[(to + items.length) % items.length].focus(); };
  if (event.key === 'ArrowDown') move(i + 1);
  else if (event.key === 'ArrowUp') move(i - 1);
  else if (event.key === 'Home') move(0);
  else if (event.key === 'End') move(items.length - 1);
  else if (event.key === 'Escape' || (event.key === 'ArrowLeft' && panel.dataset.view === 'theme')) {
    event.preventDefault();
    event.stopPropagation();
    if (panel.dataset.view === 'theme') showMain('theme');
    else if (event.key === 'Escape') close();
  } else if (event.key === 'ArrowRight' && document.activeElement.dataset.action === 'theme') {
    event.preventDefault();
    showThemes();
  } else if (event.key === ' ' && document.activeElement.tagName === 'A') {
    // Links only react to Enter natively; menu items also take Space.
    event.preventDefault();
    document.activeElement.click();
  }
}

function onMenuClick(event) {
  const item = event.target.closest('[role^="menuitem"]');
  if (!item) return;
  if (item.dataset.choice) {
    // Theme radios keep the menu open so themes can be compared.
    const chosen = theme.setChoice(item.dataset.choice);
    announce(`${theme.label(chosen)} theme`);
    return;
  }
  if (item.dataset.action === 'theme') { showThemes(); return; }
  if (item.dataset.action === 'back') { showMain('theme'); return; }
  close(false);
  if (item.dataset.action === 'shortcuts') document.getElementById('shortcuts-dialog').showModal();
  else if (item.dataset.action === 'updates') openUpdates();
  else if (item.dataset.action === 'about') openAbout();
  else if (item.dataset.action === 'backup') openBackup();
  else if (item.dataset.action === 'buddy') openBuddySettings();
  // The menu item that opened the dialog is gone; focus returns to the ⋮ button on close.
  const opened = document.querySelector('dialog[open]');
  if (opened) opened.dataset.returnFocus = 'menu';
}

// ---- Menu content -----------------------------------------------------------------

function group(id, label, ...items) {
  return el('div', { role: 'group', 'aria-labelledby': id, class: 'menu-group' },
    el('p', { class: 'menu-label', id }, label), items);
}

function item(content, attrs = {}) {
  const tag = attrs.href ? 'a' : 'button';
  return el(tag, { role: 'menuitem', class: 'menu-item', tabindex: -1, type: tag === 'button' ? 'button' : null, ...attrs }, content);
}

function buildItems() {
  const fresh = updates.unseen().length;
  const current = theme.getChoice() === 'system' ? 'Match system' : theme.label(theme.getChoice());
  return [
    group('menu-g-study', 'Study',
      item([icon('bookmark', 16), 'Bookmarks'], { href: '#/bookmarks' }),
      item([icon('clock', 16), 'Recently studied'], { href: '#/history' }),
      item([icon('keyboard', 16), 'Keyboard shortcuts', el('kbd', { class: 'menu-kbd', 'aria-hidden': 'true' }, '?')], { 'data-action': 'shortcuts' })),
    el('div', { role: 'separator', class: 'menu-sep' }),
    group('menu-g-theme', 'Appearance',
      item([icon('palette', 16), 'Theme', el('span', { class: 'menu-value' }, el('span', { class: 'sr-only' }, ': '), current), el('span', { class: 'menu-chevron', 'aria-hidden': 'true' }, icon('chevronRight', 16))],
        { 'data-action': 'theme', 'aria-haspopup': 'menu' }),
      item([buddyIcon(), 'StudyHub Buddy', el('span', { class: 'menu-value' }, el('span', { class: 'sr-only' }, ': '), buddySettings.get().enabled ? 'On' : 'Off')],
        { 'data-action': 'buddy', 'aria-haspopup': 'dialog' })),
    el('div', { role: 'separator', class: 'menu-sep' }),
    group('menu-g-hub', 'StudyHub',
      item([icon('transfer', 16), el('span', { class: 'menu-text' }, 'Progress Import / Export',
        el('span', { class: 'menu-desc', id: 'menu-backup-desc' }, 'Backup or restore your StudyHub progress'))],
      { 'data-action': 'backup', 'aria-label': 'Progress Import / Export', 'aria-describedby': 'menu-backup-desc' }),
      item([icon('spark', 16), "What's new", fresh ? el('span', { class: 'menu-pill' }, `${fresh} new`) : null], { 'data-action': 'updates' }),
      item([icon('info', 16), 'About StudyHub'], { 'data-action': 'about' })),
  ];
}

/** Small outline of Buddy for the menu (decorative, like the other menu icons). */
function buddyIcon() {
  return svg('svg', {
    viewBox: '0 0 24 24', width: 16, height: 16, fill: 'none', stroke: 'currentColor', 'stroke-width': 2,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false', class: 'icon',
  }, svg('path', { d: 'M12 6c4.2 0 6.5 3 6.5 6.6S16 19 12 19s-6.5-2.8-6.5-6.4S7.8 6 12 6zM12 6c-.2-1.6.4-2.8 1.8-3.4M9.5 11.5h.01M14.5 11.5h.01M8.5 19v2M15.5 19v2' }));
}

/** The Theme submenu: Back, then one radio per theme, with a preview swatch. */
function buildThemeItems() {
  const choice = theme.getChoice();
  // The swatch carries data-theme, so it shows that theme's real tokens (styles.css).
  const swatch = (id) => el('span', { class: 'theme-swatch', 'data-theme': id }, el('span', { class: 'theme-swatch-accent' }));
  const themeItem = (id, label, swatches) => el('button', {
    type: 'button', role: 'menuitemradio', class: 'menu-item theme-option', tabindex: -1,
    'aria-checked': String(choice === id), 'data-choice': id,
  }, el('span', { class: 'theme-swatches', 'aria-hidden': 'true' }, swatches),
  el('span', { class: 'theme-name' }, label),
  el('span', { class: 'theme-check', 'aria-hidden': 'true' }, icon('check', 16)));

  return [
    item([icon('chevronLeft', 16), 'Back'], { 'data-action': 'back', class: 'menu-item menu-back', 'aria-label': 'Back to menu' }),
    el('div', { role: 'separator', class: 'menu-sep' }),
    el('div', { role: 'group', 'aria-labelledby': 'menu-g-themes', class: 'menu-group' },
      el('p', { class: 'menu-label', id: 'menu-g-themes' }, 'Theme'),
      theme.THEMES.map((t) => themeItem(t.id, t.label, swatch(t.id))),
      themeItem('system', 'Match system', [swatch('light'), swatch('dark')])),
  ];
}

function syncThemes() {
  const choice = theme.getChoice();
  for (const node of panel.querySelectorAll('[role="menuitemradio"]')) {
    node.setAttribute('aria-checked', String(node.dataset.choice === choice));
  }
}

function syncBadge() {
  const count = updates.unseen().length;
  document.getElementById('app-menu-badge').hidden = !count;
  button.setAttribute('aria-label', count ? `Menu, ${count} new update${count === 1 ? '' : 's'}` : 'Menu');
}

// ---- Dialogs ------------------------------------------------------------------------

/**
 * Close buttons and backdrop clicks for every <dialog class="dialog">. They go
 * through a cancelable 'cancel' event, like Esc, so a dialog with unsaved input
 * (the note editor) can ask before closing.
 */
function wireDialog(dialog) {
  dialog.addEventListener('click', (event) => {
    if (!(event.target.closest('[data-close-dialog]') || event.target === dialog)) return;
    if (dialog.dispatchEvent(new Event('cancel', { cancelable: true }))) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (dialog.dataset.returnFocus !== 'menu') return;
    delete dialog.dataset.returnFocus;
    // 'close' fires a moment after Esc; leave focus alone if the user already moved it (e.g. pressed /).
    const active = document.activeElement;
    if (!active || active === document.body || dialog.contains(active)) button.focus();
  });
}

function dialogBody(id) {
  return document.getElementById(id).querySelector('.dialog-body');
}

export function updateCard(update, { headingLevel = 3 } = {}) {
  return el('li', { class: 'update-item' },
    el('p', { class: 'update-meta' },
      el('span', { class: `update-type update-type-${update.type}` }, updates.TYPE_LABELS[update.type] || update.type),
      el('time', { datetime: update.date }, updates.formatDate(update.date))),
    el(`h${headingLevel}`, { class: 'update-title' }, update.link ? el('a', { href: update.link }, update.title) : update.title),
    el('p', { class: 'update-desc' }, update.description));
}

export function openUpdates() {
  const dialog = document.getElementById('updates-dialog');
  const body = dialogBody('updates-dialog');
  const fresh = updates.unseen();
  const previous = updates.previousVisit();
  const historyLink = el('a', { class: 'btn btn-secondary', href: '#/updates', 'data-close-dialog': '' }, fresh.length ? 'View all updates' : 'View update history');

  if (fresh.length) {
    body.replaceChildren(
      el('p', { class: 'eyebrow' }, previous ? 'New since your last visit' : 'New in StudyHub'),
      el('ul', { class: 'update-list', role: 'list' }, fresh.map((u) => updateCard(u))),
      el('div', { class: 'dialog-actions' }, historyLink));
  } else {
    body.replaceChildren(
      el('div', { class: 'caught-up' },
        el('span', { class: 'caught-up-icon', 'aria-hidden': 'true' }, icon('check', 20)),
        el('p', { class: 'caught-up-title' }, "You're caught up."),
        el('p', { class: 'muted' }, 'No new StudyHub updates since your last visit.'),
        el('p', { class: 'muted small' }, previous
          ? `Last visit: ${new Date(previous).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
          : 'This is your first visit in this browser.')),
      el('div', { class: 'dialog-actions' }, historyLink));
  }
  dialog.showModal();
  // Seen once shown: the badge clears now, the list above stays until closed.
  updates.markAllSeen();
}

function openAbout() {
  const dialog = document.getElementById('about-dialog');
  const available = index.categories.filter(isAvailable);
  const topics = available.reduce((sum, c) => sum + c.topics.length, 0);
  const latest = updates.all()[0];
  dialogBody('about-dialog').replaceChildren(
    el('p', {}, 'A study and interview-preparation library: lessons, examples, practice, interview questions, revision sheets and interactive exercises.'),
    el('dl', { class: 'about-facts' },
      el('div', {}, el('dt', {}, 'Subjects'), el('dd', {}, String(available.length))),
      el('div', {}, el('dt', {}, 'Topics'), el('dd', {}, String(topics))),
      latest ? el('div', {}, el('dt', {}, 'Last updated'), el('dd', {}, updates.formatDate(latest.date))) : null),
    el('p', { class: 'muted small' }, 'StudyHub is a static website. Your progress, bookmarks, history and settings are saved only in this browser — there is no account and nothing is sent to a server.'),
    el('div', { class: 'dialog-actions' },
      el('a', { class: 'btn btn-secondary', href: REPO_URL, target: '_blank', rel: 'noopener' }, 'Source and licence', el('span', { class: 'sr-only' }, ' (opens in a new tab)'))));
  dialog.showModal();
}
