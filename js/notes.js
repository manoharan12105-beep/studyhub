// Personal notes, each tied to one topic.
//
// studyhub:v1:notes = [ { id, title, content, subjectId, moduleId, topicId, createdAt, updatedAt } ]
//   id         "n-" + base36 time + random suffix (never reused, never shown)
//   title      plain text, 1–120 characters, no line breaks
//   content    plain text, 1–10,000 characters (line breaks kept)
//   subjectId  category id · moduleId subcategory id (null when the topic has none) · topicId topic id
//   createdAt, updatedAt  ISO timestamps; updatedAt changes on every edit
//
// Only ids are stored: subject, module and topic names come from the metadata
// index when a note is shown, so renaming a module never touches notes. The
// association is set from the topic when a note is created and never changes.
// Notes whose topic no longer exists stay readable here, but are left out of
// backups (an import only accepts notes for existing topics).

import { read, update } from './storage.js';
import { getTopic, getCategory } from './content-loader.js';

const KEY = 'notes';
export const MAX_NOTES = 500;
export const MAX_TITLE = 120;
export const MAX_CONTENT = 10_000;

const NOTE_ID = /^n-[a-z0-9]{4,40}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isId = (v) => typeof v === 'string' && v.length <= 120 && ID.test(v);
const isDate = (v) => typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v));
// Titles are one line; note text may hold line breaks and tabs, but no other control characters.
const isTitle = (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= MAX_TITLE && !/[\u0000-\u001f\u007f]/.test(v);
const isContent = (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= MAX_CONTENT && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);

/** Subject, module and topic for a topic id, from metadata; null when the topic is unknown. */
export function placeOf(topicId) {
  const topic = getTopic(topicId);
  if (!topic) return null;
  const category = getCategory(topic.category);
  const sub = category?.subcategories.find((s) => s.id === topic.subcategory) || null;
  return { topic, category, sub };
}

/**
 * A note rebuilt from known fields, or null when anything is malformed.
 * checkTopic: the topic must exist and the stored subject and module must be the
 * topic's own (backups); without it only the shape is checked (this browser's list).
 */
export function cleanNote(n, { checkTopic = false } = {}) {
  if (!isPlainObject(n) || typeof n.id !== 'string' || !NOTE_ID.test(n.id)) return null;
  if (!isTitle(n.title) || !isContent(n.content)) return null;
  if (!isId(n.subjectId) || !isId(n.topicId) || !(n.moduleId === null || isId(n.moduleId))) return null;
  if (!isDate(n.createdAt) || !isDate(n.updatedAt) || Date.parse(n.updatedAt) < Date.parse(n.createdAt)) return null;
  if (checkTopic) {
    const place = placeOf(n.topicId);
    if (!place || place.category?.id !== n.subjectId || (place.sub?.id ?? null) !== n.moduleId) return null;
  }
  return {
    id: n.id, title: n.title, content: n.content,
    subjectId: n.subjectId, moduleId: n.moduleId, topicId: n.topicId,
    createdAt: n.createdAt, updatedAt: n.updatedAt,
  };
}

/** Every stored note (malformed entries are ignored, never deleted). */
export function list() {
  const value = read(KEY, []);
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of value) {
    const note = cleanNote(raw);
    if (note && !seen.has(note.id)) { seen.add(note.id); out.push(note); }
  }
  return out;
}

export function count() {
  return list().length;
}

export function get(id) {
  return list().find((n) => n.id === id) || null;
}

/** Notes of one topic, most recently updated first. */
export function forTopic(topicId) {
  return list().filter((n) => n.topicId === topicId).sort(byUpdated);
}

export function byUpdated(a, b) {
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
}

export function byCreated(a, b) {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

export function canAdd() {
  return count() < MAX_NOTES;
}

function notify() {
  document.dispatchEvent(new CustomEvent('studyhub:change', { detail: { key: KEY } }));
}

function newId(taken) {
  let id;
  do id = `n-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6).padEnd(4, '0')}`;
  while (taken.has(id));
  return id;
}

/** Problems with a title/content pair, as messages for the form ({} when valid). */
export function check({ title, content }) {
  const errors = {};
  if (!title.trim()) errors.title = 'Enter a title for this note.';
  else if (title.length > MAX_TITLE) errors.title = `Keep the title under ${MAX_TITLE} characters.`;
  else if (!isTitle(title)) errors.title = 'The title contains characters that cannot be saved.';
  if (!content.trim()) errors.content = 'Write something in the note.';
  else if (content.length > MAX_CONTENT) errors.content = `Keep the note under ${MAX_CONTENT.toLocaleString()} characters.`;
  else if (!isContent(content)) errors.content = 'The note contains characters that cannot be saved.';
  return errors;
}

/** Add a note to a topic. Returns the note, or null when the topic is unknown or the limit is reached. */
export function add(topicId, { title, content }) {
  const place = placeOf(topicId);
  if (!place || !place.category || Object.keys(check({ title, content })).length || !canAdd()) return null;
  const now = new Date().toISOString();
  let note = null;
  update(KEY, [], (stored) => {
    const current = Array.isArray(stored) ? stored : [];
    note = {
      id: newId(new Set(current.map((n) => n?.id))), title: title.trim(), content: content.replace(/\s+$/, ''),
      subjectId: place.category.id, moduleId: place.sub?.id ?? null, topicId,
      createdAt: now, updatedAt: now,
    };
    return [note, ...current];
  });
  notify();
  return note;
}

/** Change a note's title and text; its topic stays the same. Returns the updated note or null. */
export function edit(id, { title, content }) {
  if (Object.keys(check({ title, content })).length) return null;
  let changed = null;
  update(KEY, [], (stored) => (Array.isArray(stored) ? stored : []).map((n) => {
    if (n?.id !== id) return n;
    changed = { ...n, title: title.trim(), content: content.replace(/\s+$/, ''), updatedAt: new Date().toISOString() };
    return changed;
  }));
  if (changed) notify();
  return changed;
}

export function remove(id) {
  update(KEY, [], (stored) => (Array.isArray(stored) ? stored : []).filter((n) => n?.id !== id));
  notify();
}
