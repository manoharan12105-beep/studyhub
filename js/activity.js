// Results of practice, interview and flashcard attempts, per question.
//
// studyhub:v1:questions = { "<topic-id>": { "<kind>:<item>": { r, t } } }
//   kind  "practice" | "interview" | "flashcards" | "check" (knowledge checks)
//   item  stable question id from the content (P3, Q7) or interaction question index
//   r     "correct" | "incorrect" | "known" | "review"
//   t     ISO timestamp
//
// Question ids are append-only in the content, so these keys stay valid as content grows.

import { read, update } from './storage.js';

const KEY = 'questions';

export function recordResult(topicId, kind, item, result) {
  update(KEY, {}, (map) => {
    map[topicId] = map[topicId] || {};
    map[topicId][`${kind}:${item}`] = { r: result, t: new Date().toISOString() };
    return map;
  });
}

export function getResult(topicId, kind, item) {
  return read(KEY, {})[topicId]?.[`${kind}:${item}`]?.r || null;
}

/** { attempted, positive } for one kind across all topics (positive = correct/known). */
export function totals(kind) {
  const map = read(KEY, {});
  let attempted = 0;
  let positive = 0;
  for (const topic of Object.values(map)) {
    for (const [key, value] of Object.entries(topic)) {
      if (!key.startsWith(`${kind}:`)) continue;
      attempted++;
      if (value.r === 'correct' || value.r === 'known') positive++;
    }
  }
  return { attempted, positive };
}

/** Latest activity timestamps, used for the dashboard's "recent activity" line. */
export function lastActivity() {
  const map = read(KEY, {});
  let latest = null;
  for (const [topicId, topic] of Object.entries(map)) {
    for (const [key, value] of Object.entries(topic)) {
      if (!latest || value.t > latest.t) latest = { topicId, kind: key.split(':')[0], t: value.t };
    }
  }
  return latest;
}
