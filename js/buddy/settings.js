// StudyHub Buddy preferences.
//
// studyhub:v1:buddy-settings = {
//   v            2                  (v1 records are migrated on read; see migrate())
//   enabled      boolean            (default true)
//   pausedUntil  epoch ms | 0       "Pause for 5/30 minutes": a user choice with an expiry, so a
//                                   reload or another tab sees the same pause (never more than 30 min ahead)
//   -- Appearance --
//   color        "#rrggbb"          body colour (palettes set color + leafColor + accent together)
//   leafColor    "#rrggbb"          sprout leaves
//   accent       "#rrggbb" | ""     accessory fabric colour; "" = each accessory's own colour
//   body         "classic" | "tiny" | "round" | "tall" | "fluffy"
//   eyes         "round" | "big" | "dot" | "sleepy" | "playful"
//   eyeSize      0.8 … 1.25         eyeSpacing  -3 … 3 (viewBox units)
//   shine        "small" | "normal" | "large"      blush  "none" | "soft" | "rosy"
//   brows        "expressive" (only with feelings) | "always" | "hidden"
//   leafShape    "classic" | "round" | "pointed" | "heart"
//   leafSize     "small" | "normal" | "large"
//   leafDetail   "none" | "dew" | "ladybug"        leafVein  boolean
//   accessory    "none" | "cap" | "bow" | "glasses" | "headband" | "flower" | "star" | "gradcap" | "seasonal"
//   extra        "none" | "backpack" | "scarf"
//   -- Personality and behaviour (levels are "low" | "balanced" | "high") --
//   personality  "gentle" | "playful" | "curious" | "sleepy" | "energetic" | "custom"
//   movement     "low" | "normal" | "high"   idle movement frequency
//   quiz         "occasionally" | "balanced" | "frequently"   optional prompt frequency
//   speed, jumps, expression, emotion, petting, curiosity, celebration, recovery   levels
//   facts, motivation, quiet   booleans
//   motion       "system" | "full" | "gentle" | "minimal"   (v1 "reduced" = "minimal")
//   rest         "bottom" | "sidebar" | "corner"    rememberSpot  boolean
//   features     { dizzy, fear, petting, nearMiss, catching, habits, glances, celebrations,
//                  focusAware, bubbles, particles, dust, speedLines, accessories }  booleans
//   interact     { drag, throw, toss, explore, interrupt }  booleans
// }
//
// Only preferences live here — never positions or other runtime state. The key is
// per-browser like the theme: it is not part of the progress backup (js/backup.js).
// Anything malformed falls back to the default for that field, so a damaged
// record can never stop StudyHub from starting.
//
// studyhub:v1:buddy-profiles = { v: 1, profiles: [{ id, name, settings }] } — up to
// MAX_PROFILES named snapshots of these preferences (never `enabled` or a pause), so a
// learner can switch between, say, "Quiet Study" and "Playful Break".

import { read, write } from '../storage.js';

const KEY = 'buddy-settings';
const PROFILES_KEY = 'buddy-profiles';
export const MAX_PROFILES = 8;
export const MAX_NAME = 32;
export const PAUSE_MAX_MS = 30 * 60_000;

/** Curated palettes: body, leaf and accent chosen to suit each other. */
export const PALETTES = [
  { id: 'orange', label: 'Original Orange', color: '#f08a2c', leafColor: '#5cb85c', accent: '' },
  { id: 'sunset', label: 'Sunset', color: '#f2694c', leafColor: '#6dbd45', accent: '#7b4fc4' },
  { id: 'ocean', label: 'Ocean', color: '#3d8fd8', leafColor: '#36b39a', accent: '#f2b632' },
  { id: 'mint', label: 'Mint', color: '#4fc4a0', leafColor: '#3b9150', accent: '#e9706c' },
  { id: 'lavender', label: 'Lavender', color: '#a78be0', leafColor: '#68b866', accent: '#e86f9f' },
  { id: 'rose', label: 'Rose', color: '#e8668f', leafColor: '#5cb85c', accent: '#f2b632' },
  { id: 'golden', label: 'Golden', color: '#f1b928', leafColor: '#4ba648', accent: '#c4453a' },
  { id: 'forest', label: 'Forest', color: '#4f9a4a', leafColor: '#a6d65a', accent: '#8c5a3c' },
  { id: 'mono', label: 'Monochrome', color: '#8f8f8f', leafColor: '#5f6b5f', accent: '#3b3b3b' },
];
/** v1 named colours, kept so old choices still show their names in the dialog. */
export const COLORS = PALETTES.map((p) => ({ id: p.id, label: p.label, value: p.color }));

export const LEVELS = [['low', 'Low'], ['balanced', 'Balanced'], ['high', 'High']];

export const OPTIONS = {
  body: [['classic', 'Classic'], ['tiny', 'Tiny and cute'], ['round', 'Slightly round'], ['tall', 'Tall and slim'], ['fluffy', 'Fluffy']],
  eyes: [['round', 'Classic'], ['big', 'Large expressive'], ['sleepy', 'Sleepy'], ['playful', 'Playful'], ['dot', 'Minimalist']],
  shine: [['small', 'Small'], ['normal', 'Normal'], ['large', 'Large']],
  blush: [['none', 'None'], ['soft', 'Soft'], ['rosy', 'Rosy']],
  brows: [['expressive', 'With feelings only'], ['always', 'Always'], ['hidden', 'Hidden']],
  leafShape: [['classic', 'Classic'], ['round', 'Round'], ['pointed', 'Pointed'], ['heart', 'Heart']],
  leafSize: [['small', 'Small'], ['normal', 'Normal'], ['large', 'Large']],
  leafDetail: [['none', 'None'], ['dew', 'Dew drop'], ['ladybug', 'Tiny ladybird']],
  accessory: [['none', 'None'], ['cap', 'Cap'], ['bow', 'Bow'], ['glasses', 'Tiny glasses'], ['headband', 'Headband'], ['flower', 'Flower'],
    ['star', 'Star clip'], ['gradcap', 'Graduation cap'], ['seasonal', 'Seasonal (changes with the month)']],
  extra: [['none', 'None'], ['backpack', 'Small backpack'], ['scarf', 'Scarf']],
  personality: [['gentle', 'Gentle'], ['playful', 'Playful'], ['curious', 'Curious'], ['sleepy', 'Sleepy'], ['energetic', 'Energetic'], ['custom', 'Custom']],
  movement: [['low', 'Low'], ['normal', 'Balanced'], ['high', 'High']],
  quiz: [['occasionally', 'Low'], ['balanced', 'Balanced'], ['frequently', 'High']],
  speed: LEVELS, jumps: LEVELS, expression: LEVELS, emotion: LEVELS, petting: LEVELS, curiosity: LEVELS, celebration: LEVELS, recovery: LEVELS,
  motion: [['system', 'Follow system'], ['full', 'Full'], ['gentle', 'Gentle motion'], ['minimal', 'Minimal motion']],
  rest: [['bottom', 'Bottom edge'], ['sidebar', 'Near the sidebar'], ['corner', 'Safe corner']],
};

export const FEATURES = {
  dizzy: true, fear: true, petting: true, nearMiss: true, catching: true, habits: true, glances: true,
  celebrations: true, focusAware: true, bubbles: true, particles: true, dust: true, speedLines: true, accessories: true,
};
export const INTERACT = { drag: true, throw: true, toss: true, explore: true, interrupt: true };

const BOOLEANS = ['enabled', 'facts', 'motivation', 'quiet', 'leafVein', 'rememberSpot'];
const NUMBERS = { eyeSize: [0.8, 1.25, 1], eyeSpacing: [-3, 3, 0] };

export const DEFAULTS = Object.freeze({
  v: 2,
  enabled: true,
  pausedUntil: 0,
  color: PALETTES[0].color,
  leafColor: PALETTES[0].leafColor,
  accent: '',
  body: 'classic',
  eyes: 'round',
  eyeSize: 1,
  eyeSpacing: 0,
  shine: 'normal',
  blush: 'soft',
  brows: 'expressive',
  leafShape: 'classic',
  leafSize: 'normal',
  leafDetail: 'none',
  leafVein: false,
  accessory: 'none',
  extra: 'none',
  personality: 'playful',
  movement: 'normal',
  quiz: 'balanced',
  speed: 'balanced',
  jumps: 'balanced',
  expression: 'balanced',
  emotion: 'balanced',
  petting: 'balanced',
  curiosity: 'balanced',
  celebration: 'balanced',
  recovery: 'balanced',
  facts: true,
  motivation: true,
  quiet: false,
  motion: 'system',
  rest: 'bottom',
  rememberSpot: true,
  features: Object.freeze({ ...FEATURES }),
  interact: Object.freeze({ ...INTERACT }),
});

/** Fields that only change how Buddy looks (Surprise Me, Reset appearance). */
export const APPEARANCE = ['color', 'leafColor', 'accent', 'body', 'eyes', 'eyeSize', 'eyeSpacing', 'shine', 'blush', 'brows',
  'leafShape', 'leafSize', 'leafDetail', 'leafVein', 'accessory', 'extra'];

/**
 * Personality presets: starting points for the behaviour levels. Applying one
 * sets these fields once; every control stays editable afterwards.
 */
export const PERSONALITIES = {
  gentle: { movement: 'low', speed: 'low', jumps: 'low', expression: 'low', emotion: 'low', curiosity: 'low', celebration: 'low', quiz: 'occasionally' },
  playful: { movement: 'normal', speed: 'balanced', jumps: 'high', expression: 'high', emotion: 'balanced', curiosity: 'balanced', celebration: 'high', quiz: 'balanced' },
  curious: { movement: 'normal', speed: 'balanced', jumps: 'balanced', expression: 'balanced', emotion: 'balanced', curiosity: 'high', celebration: 'balanced', quiz: 'balanced' },
  sleepy: { movement: 'low', speed: 'low', jumps: 'low', expression: 'balanced', emotion: 'low', curiosity: 'low', celebration: 'low', recovery: 'high', quiz: 'occasionally' },
  energetic: { movement: 'high', speed: 'high', jumps: 'high', expression: 'high', emotion: 'high', curiosity: 'high', celebration: 'high', quiz: 'balanced' },
  custom: {},
};

const HEX = /^#[0-9a-f]{6}$/i;
const listeners = new Set();
let current = null;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const has = (field, value) => OPTIONS[field].some(([id]) => id === value);

/**
 * v1 → v2 field changes. Everything else keeps its name and meaning. Applied to
 * any record (not only v < 2), so a v1 value saved later — by an older open tab,
 * say — still means what it meant.
 */
function migrate(source) {
  const out = { ...source };
  if (source.motion === 'reduced') out.motion = 'minimal'; // "Always calm"
  if (source.accessory === 'backpack') { out.accessory = 'none'; out.extra = 'backpack'; } // the backpack became a body item
  return out;
}

function cleanFlags(value, defaults) {
  const source = isObject(value) ? value : {};
  const out = { ...defaults };
  for (const key of Object.keys(defaults)) if (typeof source[key] === 'boolean') out[key] = source[key];
  return out;
}

/** Rebuild a settings object from known fields only; anything invalid gets its default. */
export function clean(value) {
  const source = migrate(isObject(value) ? value : {});
  const result = { ...DEFAULTS };
  for (const field of Object.keys(OPTIONS)) if (has(field, source[field])) result[field] = source[field];
  for (const field of BOOLEANS) if (typeof source[field] === 'boolean') result[field] = source[field];
  for (const [field, [lo, hi, fallback]] of Object.entries(NUMBERS)) {
    const n = source[field];
    result[field] = typeof n === 'number' && Number.isFinite(n) ? Math.round(Math.min(hi, Math.max(lo, n)) * 100) / 100 : fallback;
  }
  for (const field of ['color', 'leafColor']) if (typeof source[field] === 'string' && HEX.test(source[field])) result[field] = source[field].toLowerCase();
  if (source.accent === '' || (typeof source.accent === 'string' && HEX.test(source.accent))) result.accent = source.accent.toLowerCase();
  const until = source.pausedUntil;
  result.pausedUntil = typeof until === 'number' && Number.isFinite(until) && until > Date.now() ? Math.min(until, Date.now() + PAUSE_MAX_MS) : 0;
  result.features = cleanFlags(source.features, FEATURES);
  result.interact = cleanFlags(source.interact, INTERACT);
  result.v = 2;
  return result;
}

export function get() {
  if (!current) current = clean(read(KEY, null));
  return current;
}

/** Merge a change, persist it and tell listeners. Returns the new settings. */
export function save(patch) {
  const previous = get();
  const merged = { ...previous, ...patch };
  // Nested flag groups merge too, so { features: { dust: false } } changes one flag only.
  if (isObject(patch?.features)) merged.features = { ...previous.features, ...patch.features };
  if (isObject(patch?.interact)) merged.interact = { ...previous.interact, ...patch.interact };
  current = clean(merged);
  write(KEY, current);
  for (const fn of listeners) fn(current, previous);
  return current;
}

/** Back to defaults. `keepEnabled` keeps Buddy on/off as it is. Never touches learning data. */
export function reset({ keepEnabled = true } = {}) {
  return save({ ...DEFAULTS, enabled: keepEnabled ? get().enabled : DEFAULTS.enabled, pausedUntil: 0 });
}

/** Back to the default look only (behaviour, feelings and profiles stay). */
export function resetAppearance() {
  return save(Object.fromEntries(APPEARANCE.map((f) => [f, DEFAULTS[f]])));
}

/** Apply a personality preset: its levels once, then everything stays editable. */
export function applyPersonality(id) {
  if (!PERSONALITIES[id]) return get();
  return save({ personality: id, ...PERSONALITIES[id] });
}

/** True when the behaviour levels still match the chosen preset (for the "adjusted" note). */
export function matchesPersonality(s = get()) {
  return Object.entries(PERSONALITIES[s.personality] || {}).every(([k, v]) => s[k] === v);
}

/** The palette whose body, leaf and accent all match, or null (= custom colours). */
export function paletteOf(s = get()) {
  return PALETTES.find((p) => p.color === s.color && p.leafColor === s.leafColor && p.accent === s.accent) || null;
}

/** Pause optional activity for `ms` (max 30 min); 0 resumes. */
export function pause(ms) {
  const n = Math.max(0, Math.min(PAUSE_MAX_MS, Number(ms) || 0));
  return save({ pausedUntil: n ? Date.now() + n : 0 });
}

export function isPaused(s = get()) {
  return s.pausedUntil > Date.now();
}

/**
 * Surprise Me: a random, compatible look. Only cosmetic fields change — never
 * behaviour, motion/accessibility, the on/off switch or anything else.
 */
export function surprise(random = Math.random) {
  const pick = (list) => list[Math.floor(random() * list.length) % list.length];
  const palette = pick(PALETTES);
  return {
    color: palette.color,
    leafColor: palette.leafColor,
    accent: palette.accent,
    eyes: pick(OPTIONS.eyes)[0],
    leafShape: pick(OPTIONS.leafShape)[0],
    leafDetail: pick(OPTIONS.leafDetail)[0],
    accessory: pick(OPTIONS.accessory.filter(([id]) => id !== 'seasonal'))[0],
    extra: pick(OPTIONS.extra)[0],
    blush: pick(OPTIONS.blush.filter(([id]) => id !== 'none'))[0],
  };
}

/** The current look, for undoing a Surprise Me. */
export function appearanceOf(s = get()) {
  return Object.fromEntries(APPEARANCE.map((f) => [f, s[f]]));
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
export const PROFILES_STORAGE_KEY = PROFILES_KEY;

// ---- Profiles ----------------------------------------------------------------------

/** The preferences a profile carries: everything except the on/off switch and a pause. */
export function profileSettings(s = get()) {
  const { enabled, pausedUntil, v, ...rest } = s;
  return JSON.parse(JSON.stringify(rest));
}

/** Built-in starting points (read-only; they can be applied or duplicated). */
export const BUILTIN_PROFILES = [
  { id: 'builtin-quiet-study', name: 'Quiet Study', builtIn: true, settings: {
    quiet: true, personality: 'gentle', ...PERSONALITIES.gentle, motion: 'gentle', facts: false,
    features: { ...FEATURES, habits: false, glances: false, particles: false, focusAware: true, bubbles: false } } },
  { id: 'builtin-playful-break', name: 'Playful Break', builtIn: true, settings: {
    quiet: false, personality: 'playful', ...PERSONALITIES.playful, motion: 'system', facts: true, quiz: 'frequently', features: { ...FEATURES } } },
  { id: 'builtin-minimal', name: 'Minimal', builtIn: true, settings: {
    quiet: true, personality: 'gentle', ...PERSONALITIES.gentle, motion: 'minimal', facts: false, motivation: false,
    features: { ...FEATURES, habits: false, glances: false, particles: false, dust: false, speedLines: false, bubbles: false } } },
];

const cleanName = (name) => (typeof name === 'string' ? name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) : '');

function cleanProfiles(raw) {
  const list = Array.isArray(raw?.profiles) ? raw.profiles : [];
  const out = [];
  const ids = new Set();
  for (const p of list) {
    if (!isObject(p) || typeof p.id !== 'string' || !/^p-[a-z0-9]{1,16}$/.test(p.id) || ids.has(p.id)) continue;
    const name = cleanName(p.name);
    if (!name || !isObject(p.settings)) continue;
    ids.add(p.id);
    out.push({ id: p.id, name, settings: profileSettings(clean({ ...p.settings, v: 2 })) });
    if (out.length >= MAX_PROFILES) break;
  }
  return out;
}

export function listProfiles() {
  return cleanProfiles(read(PROFILES_KEY, null));
}

function writeProfiles(profiles) {
  write(PROFILES_KEY, { v: 1, profiles });
  return profiles;
}

const newProfileId = () => `p-${Date.now().toString(36).slice(-6)}${Math.floor(Math.random() * 1296).toString(36)}`;

/** Save the current preferences under a name. Returns { ok, profile | reason }. */
export function saveProfile(name) {
  const list = listProfiles();
  const clean2 = cleanName(name);
  if (!clean2) return { ok: false, reason: 'Give the profile a name.' };
  if (list.length >= MAX_PROFILES) return { ok: false, reason: `You can keep up to ${MAX_PROFILES} profiles. Delete one first.` };
  const profile = { id: newProfileId(), name: clean2, settings: profileSettings() };
  writeProfiles([...list, profile]);
  return { ok: true, profile };
}

export function renameProfile(id, name) {
  const clean2 = cleanName(name);
  if (!clean2) return { ok: false, reason: 'Give the profile a name.' };
  const list = listProfiles();
  const p = list.find((x) => x.id === id);
  if (!p) return { ok: false, reason: 'That profile no longer exists.' };
  p.name = clean2;
  writeProfiles(list);
  return { ok: true, profile: p };
}

export function duplicateProfile(id) {
  const list = listProfiles();
  const source = list.find((x) => x.id === id) || BUILTIN_PROFILES.find((x) => x.id === id);
  if (!source) return { ok: false, reason: 'That profile no longer exists.' };
  if (list.length >= MAX_PROFILES) return { ok: false, reason: `You can keep up to ${MAX_PROFILES} profiles. Delete one first.` };
  // Shorten the original name (not the suffix) so a long name still reads "… copy".
  const profile = { id: newProfileId(), name: `${cleanName(source.name).slice(0, MAX_NAME - 5).trimEnd()} copy`, settings: profileSettings(clean(withBase(source))) };
  writeProfiles([...list, profile]);
  return { ok: true, profile };
}

export function deleteProfile(id) {
  const list = listProfiles();
  if (!list.some((x) => x.id === id)) return { ok: false, reason: 'That profile no longer exists.' };
  writeProfiles(list.filter((x) => x.id !== id));
  return { ok: true };
}

/** Apply a profile's preferences. Buddy's on/off switch and any pause are left as they are. */
export function applyProfile(id) {
  const source = listProfiles().find((x) => x.id === id) || BUILTIN_PROFILES.find((x) => x.id === id);
  if (!source) return { ok: false, reason: 'That profile no longer exists.' };
  const s = get();
  save({ ...withBase(source), enabled: s.enabled, pausedUntil: s.pausedUntil });
  return { ok: true, profile: source };
}

/**
 * A profile's full preferences. A saved profile carries everything; a built-in one
 * only describes behaviour, so it keeps the learner's current look.
 */
function withBase(source) {
  const base = source.builtIn ? get() : DEFAULTS;
  return { ...base, ...source.settings, features: { ...base.features, ...source.settings.features }, interact: { ...base.interact, ...source.settings.interact } };
}
