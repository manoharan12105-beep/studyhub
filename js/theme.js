// Light / dark / system theme. The stored choice is applied before first paint
// by the inline script in index.html; this module handles the toggle.

import { read, write } from './storage.js';

const KEY = 'theme';

export function getChoice() {
  const value = read(KEY, 'system');
  return ['light', 'dark', 'system'].includes(value) ? value : 'system';
}

export function effectiveTheme() {
  const choice = getChoice();
  if (choice !== 'system') return choice;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function apply(choice = getChoice()) {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
  document.dispatchEvent(new CustomEvent('studyhub:theme', { detail: { theme: effectiveTheme() } }));
}

/** Toggle between light and dark (leaving "system" on the first click). */
export function toggle() {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  write(KEY, next);
  apply(next);
  return next;
}

export function setChoice(choice) {
  write(KEY, choice);
  apply(choice);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getChoice() === 'system') apply('system');
});
