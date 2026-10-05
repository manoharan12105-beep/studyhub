// Recently studied pages, newest first, capped at MAX entries.
//
// studyhub:v1:history = [ { kind, id, tab?, at } ]
//   kind "topic"   id = topic id, tab = companion file ("practice", …) or absent
//   kind "mode"    id = "<category>/<mode-id>"       (Revision, Quick Revision)
//   kind "session" id = "<kind>/<scope>"             (interview / practice / flashcards)

import { read, update } from './storage.js';

const KEY = 'history';
const MAX = 40;

export function list() {
  const value = read(KEY, []);
  return Array.isArray(value) ? value : [];
}

export function record(kind, id, extra = {}) {
  update(KEY, [], (entries) => {
    const clean = Array.isArray(entries) ? entries : [];
    // One entry per page: revisiting moves it to the front.
    const rest = clean.filter((e) => !(e.kind === kind && e.id === id));
    return [{ kind, id, ...extra, at: new Date().toISOString() }, ...rest].slice(0, MAX);
  });
}

export function recentTopics(limit = 6) {
  return list().filter((e) => e.kind === 'topic').slice(0, limit);
}

export function lastTopic() {
  return recentTopics(1)[0] || null;
}
