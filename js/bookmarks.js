// Bookmarked topics: studyhub:v1:bookmarks = [ "<topic-id>", … ] (newest first).

import { read, update } from './storage.js';

const KEY = 'bookmarks';

export function list() {
  const value = read(KEY, []);
  return Array.isArray(value) ? value : [];
}

export function has(topicId) {
  return list().includes(topicId);
}

/** Returns true when the topic is bookmarked after the toggle. */
export function toggle(topicId) {
  const next = update(KEY, [], (ids) => {
    const clean = Array.isArray(ids) ? ids : [];
    return clean.includes(topicId) ? clean.filter((id) => id !== topicId) : [topicId, ...clean];
  });
  document.dispatchEvent(new CustomEvent('studyhub:change', { detail: { key: KEY } }));
  return next.includes(topicId);
}
