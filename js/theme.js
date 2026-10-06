// Colour themes. Each theme is a block of design tokens in styles.css
// (`[data-theme="<id>"]`); this list is the only other place a theme is named.
// The stored choice is applied before first paint by the inline script in
// index.html (keep its list of ids in sync with THEMES).
//
// studyhub:v1:theme = "system" | one of THEMES[].id
//   "system" (the default) follows the operating system: Light or Dark.

import { read, write } from './storage.js';

const KEY = 'theme';

export const THEMES = [
  { id: 'light', label: 'Light', scheme: 'light' },
  { id: 'dark', label: 'Dark', scheme: 'dark' },
  { id: 'ocean', label: 'Ocean', scheme: 'dark' },
  { id: 'purple', label: 'Purple', scheme: 'light' },
  { id: 'amber', label: 'Amber', scheme: 'light' },
  { id: 'forest', label: 'Forest', scheme: 'dark' },
];
const IDS = THEMES.map((t) => t.id);
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

export function getChoice() {
  const value = read(KEY, 'system');
  return IDS.includes(value) ? value : 'system';
}

/** The theme actually on screen ("system" resolved to light or dark). */
export function effectiveTheme() {
  const choice = getChoice();
  if (choice !== 'system') return choice;
  return systemDark.matches ? 'dark' : 'light';
}

export function apply(choice = getChoice()) {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
  // Listeners (the knowledge map) re-read the tokens.
  document.dispatchEvent(new CustomEvent('studyhub:theme', { detail: { theme: effectiveTheme() } }));
}

export function setChoice(choice) {
  const value = IDS.includes(choice) ? choice : 'system';
  write(KEY, value);
  apply(value);
  return value;
}

export function label(id) {
  return THEMES.find((t) => t.id === id)?.label || 'System';
}

systemDark.addEventListener('change', () => {
  if (getChoice() === 'system') apply('system');
});
