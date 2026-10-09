// StudyHub Buddy preferences.
//
// studyhub:v1:buddy-settings = {
//   v           1
//   enabled     boolean            (default true)
//   color       "#rrggbb"          body colour (default orange)
//   eyes        "round" | "big" | "dot"
//   accessory   "none" | "cap" | "bow" | "backpack"
//   movement    "low" | "normal" | "high"
//   quiz        "occasionally" | "balanced" | "frequently"
//   personality "gentle" | "playful" | "curious"
//   facts, motivation, quiet   booleans
//   motion      "system" | "reduced"   (reduced = calm even if the OS allows motion)
// }
//
// Only preferences live here — never runtime state such as positions. The key is
// per-browser like the theme: it is not part of the progress backup (js/backup.js).
// Anything malformed falls back to the default for that field, so a damaged
// record can never stop StudyHub from starting.

import { read, write } from '../storage.js';

const KEY = 'buddy-settings';

export const COLORS = [
  { id: 'orange', label: 'Orange', value: '#f08a2c' },
  { id: 'sunny', label: 'Sunny', value: '#f1b928' },
  { id: 'leaf', label: 'Leaf', value: '#5fb54e' },
  { id: 'teal', label: 'Teal', value: '#26a69a' },
  { id: 'sky', label: 'Sky', value: '#4c95e6' },
  { id: 'plum', label: 'Plum', value: '#9a6ad6' },
  { id: 'rose', label: 'Rose', value: '#e8668f' },
];

export const OPTIONS = {
  eyes: [['round', 'Round'], ['big', 'Big and shiny'], ['dot', 'Small dots']],
  accessory: [['none', 'None'], ['cap', 'Cap'], ['bow', 'Bow'], ['backpack', 'Backpack']],
  movement: [['low', 'Low'], ['normal', 'Normal'], ['high', 'High']],
  quiz: [['occasionally', 'Occasionally'], ['balanced', 'Balanced'], ['frequently', 'Frequently']],
  personality: [['gentle', 'Gentle'], ['playful', 'Playful'], ['curious', 'Curious']],
  motion: [['system', 'Follow system'], ['reduced', 'Always calm']],
};

export const DEFAULTS = Object.freeze({
  v: 1,
  enabled: true,
  color: COLORS[0].value,
  eyes: 'round',
  accessory: 'none',
  movement: 'normal',
  quiz: 'balanced',
  personality: 'playful',
  facts: true,
  motivation: true,
  quiet: false,
  motion: 'system',
});

const HEX = /^#[0-9a-f]{6}$/i;
const listeners = new Set();
let current = null;

/** Rebuild a settings object from known fields only; anything invalid gets its default. */
export function clean(value) {
  const source = value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const result = { ...DEFAULTS };
  for (const [field, choices] of Object.entries(OPTIONS)) {
    if (choices.some(([id]) => id === source[field])) result[field] = source[field];
  }
  for (const field of ['enabled', 'facts', 'motivation', 'quiet']) {
    if (typeof source[field] === 'boolean') result[field] = source[field];
  }
  if (typeof source.color === 'string' && HEX.test(source.color)) result.color = source.color.toLowerCase();
  return result;
}

export function get() {
  if (!current) current = clean(read(KEY, null));
  return current;
}

/** Merge a change, persist it and tell listeners. Returns the new settings. */
export function save(patch) {
  const previous = get();
  current = clean({ ...previous, ...patch });
  write(KEY, current);
  for (const fn of listeners) fn(current, previous);
  return current;
}

/** Back to defaults. `keepEnabled` keeps Buddy on/off as it is. */
export function reset({ keepEnabled = true } = {}) {
  return save({ ...DEFAULTS, enabled: keepEnabled ? get().enabled : DEFAULTS.enabled });
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Another tab changed the settings: reload them. */
export function reloadFromStorage() {
  const previous = get();
  current = clean(read(KEY, null));
  for (const fn of listeners) fn(current, previous);
}

export const STORAGE_KEY = KEY;
