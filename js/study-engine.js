// Study engine: answers "where am I and what next?" by combining the content
// index with progress, history, bookmarks and question activity.

import { index, getTopic, getCategory, neighbours, isAvailable } from './content-loader.js';
import * as progress from './progress.js';
import * as history from './history.js';
import * as bookmarks from './bookmarks.js';
import * as activity from './activity.js';
import { percent } from './util.js';

export function stats(topics) {
  const summary = progress.summarize(topics.map((t) => t.id));
  return { ...summary, percent: percent(summary.completed, summary.total) };
}

export function overallStats() {
  const topics = index.categories.filter(isAvailable).flatMap((c) => c.topics);
  return stats(topics);
}

/** The topic to resume: the last one opened, or the next one if it is finished. */
export function continueLearning() {
  for (const entry of history.recentTopics(10)) {
    const topic = getTopic(entry.id);
    if (!topic) continue; // removed or renamed in metadata
    if (!progress.isComplete(topic.id)) {
      return { topic, tab: entry.tab, reason: 'resume', record: progress.getRecord(topic.id) };
    }
    const next = nextIncomplete(topic);
    if (next) return { topic: next, reason: 'next', after: topic };
    return null;
  }
  return null;
}

function nextIncomplete(topic) {
  let { next } = neighbours(topic);
  while (next && progress.isComplete(next.id)) next = neighbours(next).next;
  return next;
}

/** First topic in a category not completed yet (learning order). */
export function nextInCategory(categoryId) {
  return getCategory(categoryId)?.topics.find((t) => !progress.isComplete(t.id)) || null;
}

export function recentTopics(limit = 6) {
  return history.recentTopics(limit + 4)
    .map((entry) => ({ entry, topic: getTopic(entry.id) }))
    .filter((r) => r.topic)
    .slice(0, limit);
}

export function recentActivity(limit = 8) {
  return history.list().slice(0, limit).map((entry) => {
    if (entry.kind === 'topic') return { entry, topic: getTopic(entry.id) };
    return { entry };
  }).filter((r) => r.entry.kind !== 'topic' || r.topic);
}

export function bookmarkedTopics() {
  return bookmarks.list().map(getTopic).filter(Boolean);
}

export function questionTotals() {
  return {
    practice: activity.totals('practice'),
    interview: activity.totals('interview'),
    flashcards: activity.totals('flashcards'),
    checks: activity.totals('check'),
  };
}

/** Breadcrumb labels for a topic: [category, subcategory]. */
export function topicContext(topic) {
  const category = getCategory(topic.category);
  const sub = category?.subcategories.find((s) => s.id === topic.subcategory) || null;
  return { category, sub };
}
