// Per-topic study progress, keyed by the permanent topic id.
//
// studyhub:v1:progress = { "<topic-id>": { status, updated, read? } }
//   status  "in-progress" | "completed"  (absent = not started)
//   updated ISO timestamp of the last change
//   read    0…1, furthest scroll position reached in the lesson

import { read, update } from './storage.js';

const KEY = 'progress';
export const STATUS_LABELS = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
};

function all() {
  return read(KEY, {});
}

function notify() {
  document.dispatchEvent(new CustomEvent('studyhub:change', { detail: { key: KEY } }));
}

export function getStatus(topicId) {
  return all()[topicId]?.status || 'not-started';
}

export function getRecord(topicId) {
  return all()[topicId] || null;
}

export function isComplete(topicId) {
  return getStatus(topicId) === 'completed';
}

/** Opening a topic marks it in progress (never downgrades a completed topic). */
export function markVisited(topicId) {
  update(KEY, {}, (map) => {
    const current = map[topicId];
    if (!current) map[topicId] = { status: 'in-progress', updated: new Date().toISOString() };
    return map;
  });
  notify();
}

export function markComplete(topicId) {
  update(KEY, {}, (map) => {
    map[topicId] = { ...map[topicId], status: 'completed', updated: new Date().toISOString(), read: 1 };
    return map;
  });
  notify();
}

export function markIncomplete(topicId) {
  update(KEY, {}, (map) => {
    map[topicId] = { ...map[topicId], status: 'in-progress', updated: new Date().toISOString() };
    return map;
  });
  notify();
}

export function toggleComplete(topicId) {
  if (isComplete(topicId)) markIncomplete(topicId);
  else markComplete(topicId);
  return isComplete(topicId);
}

/** Remember the furthest reading position (only ever increases). */
export function recordReading(topicId, ratio) {
  const clamped = Math.max(0, Math.min(1, Math.round(ratio * 100) / 100));
  const record = all()[topicId];
  if (record && (record.read || 0) >= clamped) return;
  update(KEY, {}, (map) => {
    map[topicId] = {
      status: map[topicId]?.status || 'in-progress',
      ...map[topicId],
      read: clamped,
      updated: new Date().toISOString(),
    };
    return map;
  });
}

/** Counts for a list of topic ids: { total, completed, inProgress }. */
export function summarize(topicIds) {
  const map = all();
  let completed = 0;
  let inProgress = 0;
  for (const id of topicIds) {
    const status = map[id]?.status;
    if (status === 'completed') completed++;
    else if (status === 'in-progress') inProgress++;
  }
  return { total: topicIds.length, completed, inProgress };
}
