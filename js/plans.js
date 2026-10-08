// Study plans: the learner's plan records and everything derived from them.
//
// studyhub:v1:plans = { active: "<record-id>" | null, plans: [record, …] }
//   record = {
//     id        "p-<base36>"   (local, never sent anywhere)
//     kind      "builtin" | "custom"
//     plan, variant            built-in only: metadata/study-plans.json ids
//     title, created, updated, start (YYYY-MM-DD)
//     settings  { durationDays, dailyMinutes, topicLevels[], questionLevels[], modes[],
//                 revision, skipCompleted, prioritizeWeak, overload }
//     topics    [topic ids]   the chosen scope, before the level / completed filters
//     milestones [{ title, topics: [ids] }]
//     minutes   per-mode planning minutes used when the schedule was built
//     days      [[item keys]] one array per day (editable: items can move)
//     done      { item key: ISO }  activities other than Learn ticked off in the plan
//   }
//
// Lesson completion is never copied: a Learn item is done exactly when the topic is
// completed in studyhub:v1:progress, wherever that happened. Built-in plan
// definitions are read-only; starting one copies only ids and settings into a record.

import { read, write } from './storage.js';
import { fetchJson, getTopic, getCategory, interactiveTopicIds, loadInteractions } from './content-loader.js';
import { href } from './router.js';
import * as progress from './progress.js';
import * as engine from './study-engine.js';
import * as P from './plan-schedule.js';

const KEY = 'plans';
const PLANS_URL = 'metadata/study-plans.json';
export const MAX_PLANS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const lookup = { category: getCategory, topic: getTopic };

// ---- Definitions (built-in plans) ------------------------------------------------

let definitions = null;

/** metadata/study-plans.json, loaded once and only when a plans page needs it. */
export function loadDefinitions() {
  if (!definitions) {
    definitions = fetchJson(PLANS_URL).then((data) => {
      if (!data || !Array.isArray(data.plans) || !data.stages) throw new Error(`${PLANS_URL} has no "plans" list.`);
      data.plans.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      return data;
    }).catch((error) => {
      definitions = null; // allow a retry
      throw error;
    });
  }
  return definitions;
}

export function findVariant(defs, planId, difficulty) {
  const plan = defs.plans.find((p) => p.id === planId);
  const variant = plan?.variants.find((v) => v.difficulty === difficulty) || null;
  return plan && variant ? { plan, variant } : null;
}

// ---- Records ---------------------------------------------------------------------

function state() {
  const raw = read(KEY, null);
  const plans = Array.isArray(raw?.plans) ? raw.plans.filter(isUsableRecord) : [];
  const active = typeof raw?.active === 'string' && plans.some((p) => p.id === raw.active) ? raw.active : null;
  return { active, plans };
}

// Enough shape to render; the backup validator checks every field strictly.
function isUsableRecord(r) {
  return r && typeof r.id === 'string' && typeof r.title === 'string' && Array.isArray(r.days)
    && Array.isArray(r.topics) && r.settings && typeof r.settings === 'object';
}

function save(next) {
  write(KEY, next);
  document.dispatchEvent(new CustomEvent('studyhub:change', { detail: { key: KEY } }));
}

export function list() {
  return state().plans;
}

export function get(id) {
  return state().plans.find((p) => p.id === id) || null;
}

export function activeId() {
  return state().active;
}

export function activePlan() {
  const s = state();
  return s.plans.find((p) => p.id === s.active) || null;
}

export function setActive(id) {
  const s = state();
  save({ ...s, active: s.plans.some((p) => p.id === id) ? id : null });
}

/** Insert or replace a record. A new record becomes the active plan. */
export function put(record) {
  const s = state();
  const i = s.plans.findIndex((p) => p.id === record.id);
  const stamped = { ...record, updated: new Date().toISOString() };
  if (i >= 0) s.plans[i] = stamped;
  else s.plans.unshift(stamped);
  save({ active: i >= 0 ? s.active : stamped.id, plans: s.plans });
  return stamped;
}

export function remove(id) {
  const s = state();
  save({ active: s.active === id ? null : s.active, plans: s.plans.filter((p) => p.id !== id) });
}

export function canAddPlan() {
  return list().length < MAX_PLANS;
}

export function newId() {
  const taken = new Set(list().map((p) => p.id));
  let n = Date.now();
  while (taken.has(`p-${n.toString(36)}`)) n++;
  return `p-${n.toString(36)}`;
}

export function todayString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---- Generation --------------------------------------------------------------------

/** Topic ids where the learner's own recorded answers are mostly wrong (study engine rule). */
export function weakTopicIds() {
  return new Set(engine.needsAttention(Infinity).map((r) => r.topic.id));
}

/** Topics with at least one interaction, for the categories involved. */
export async function interactiveIds(categoryIds) {
  const sets = await Promise.all([...new Set(categoryIds)].map((id) => interactiveTopicIds(id)));
  return new Set(sets.flatMap((s) => [...s]));
}

/**
 * Build items and days for a scope and settings. Deterministic for the same
 * inputs: the content index, the learner's completed topics and weak areas.
 */
export async function generate(topicIds, settings, minutes) {
  const lessons = read('progress', {}) || {};
  const ctx = { isComplete: (id) => lessons[id]?.status === 'completed', weak: weakTopicIds() };
  const topics = P.planTopics(topicIds, settings, lookup, ctx);
  const interactive = settings.modes.includes('interactive') ? await interactiveIds(topics.map((t) => t.category)) : new Set();
  const items = P.buildItems(topics, settings, lookup, { interactive, minutes });
  return { topics, items, days: P.schedule(items, settings.durationDays, settings.dailyMinutes), capacity: P.capacity(items, settings.durationDays, settings.dailyMinutes) };
}

/** Settings and scope of a built-in variant, before the learner changes anything. */
export function builtinDraft(defs, plan, variant) {
  const stages = P.resolveStages(defs.stages, variant, lookup);
  return {
    kind: 'builtin', plan: plan.id, variant: variant.difficulty,
    title: plan.title,
    topics: stages.flatMap((s) => s.topics),
    milestones: stages.map((s) => ({ title: s.milestone, topics: s.topics })),
    settings: {
      durationDays: variant.durationDays, dailyMinutes: variant.dailyMinutes,
      topicLevels: variant.topicLevels.slice(), questionLevels: variant.questionLevels.slice(),
      modes: variant.modes.slice(), revision: variant.revision,
      skipCompleted: false, prioritizeWeak: false, overload: false,
    },
  };
}

// ---- Progress through a plan --------------------------------------------------------

/** What an item points at, with its link and label. null fields mean "no longer in the content". */
export function describe(record, key) {
  const parsed = P.parseKey(key);
  if (!parsed) return { key, available: false, label: 'Unknown activity', minutes: 0 };
  const { mode } = parsed;
  if (mode === 'revision') {
    const category = getCategory(parsed.categoryId);
    const studyMode = category?.studyModes.find((m) => m.id === parsed.modeId);
    return {
      key, mode, category, available: Boolean(studyMode),
      label: studyMode ? `${studyMode.title}: ${category.title}` : 'Revision sheet (no longer available)',
      href: studyMode ? href(['c', category.id, 'm', studyMode.id]) : null,
      minutes: studyMode?.estimatedMinutes || record.minutes?.revision || 60,
    };
  }
  const topic = getTopic(parsed.topicId);
  if (!topic) return { key, mode, available: false, label: `${P.MODE_LABELS[mode]}: topic no longer available`, minutes: 0 };
  const category = getCategory(topic.category);
  const levels = P.parseLevels((record.settings.questionLevels || []).join(','));
  const target = mode === 'learn' || mode === 'interactive'
    ? href(['t', topic.id])
    : href(['session', mode, 'topic', topic.id], { level: levels ? levels.join(',') : null });
  return {
    key, mode, topic, category, available: true,
    label: topic.title,
    href: target,
    minutes: mode === 'learn' ? topic.estimatedMinutes || record.minutes?.learn || 30 : record.minutes?.[mode] || 10,
  };
}

/** Interactive items open the lesson at the first exercise ("try-<interaction id>" anchor). */
export async function interactiveHref(topic) {
  const { interactions } = await loadInteractions(topic.category);
  const first = interactions.find((i) => (i.topics || []).some((p) => p.topic === topic.id));
  return first ? href(['t', topic.id], { s: `try-${first.id}` }) : href(['t', topic.id]);
}

export function isDone(record, key) {
  return doneChecker(record)(key);
}

/** key → done, reading lesson progress once (a plan can hold a thousand items). */
export function doneChecker(record) {
  const lessons = read('progress', {}) || {};
  return (key) => {
    const parsed = P.parseKey(key);
    if (parsed?.mode === 'learn') return lessons[parsed.topicId]?.status === 'completed';
    return Boolean(record.done?.[key]);
  };
}

/** Tick an item. Learn items update the shared lesson progress, the rest live in the plan. */
export function setDone(record, key, done) {
  const parsed = P.parseKey(key);
  if (parsed?.mode === 'learn') {
    if (done) progress.markComplete(parsed.topicId);
    else progress.markIncomplete(parsed.topicId);
    return get(record.id);
  }
  const fresh = get(record.id) || record;
  const map = { ...(fresh.done || {}) };
  if (done) map[key] = new Date().toISOString();
  else delete map[key];
  return put({ ...fresh, done: map });
}

/** Move one item to another day (0-based), appended at the end of that day. */
export function moveItem(record, key, toDay) {
  const fresh = get(record.id) || record;
  if (toDay < 0 || toDay >= fresh.days.length) return fresh;
  const days = fresh.days.map((day) => day.filter((k) => k !== key));
  days[toDay].push(key);
  return put({ ...fresh, days });
}

function daysBetween(fromYmd, to = new Date()) {
  const [y, m, d] = fromYmd.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const today = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((today - start) / DAY_MS);
}

/**
 * Where the learner stands: counts, today's day, remaining time and the next item.
 * Only items that still exist in the content count.
 */
export function summarize(record, now = new Date()) {
  const dayCount = record.days.length;
  const elapsed = daysBetween(record.start, now);
  const dayIndex = Math.min(dayCount - 1, Math.max(0, elapsed));
  let total = 0;
  let done = 0;
  let minutesLeft = 0;
  let next = null;
  const overdue = [];
  const lastDay = record.days.reduce((last, day, i) => (day.length ? i : last), 0);
  const isItemDone = doneChecker(record);
  const byTopic = new Map(); // topic id → { total, done, day } over the plan's items

  record.days.forEach((day, i) => {
    for (const key of day) {
      const info = describe(record, key);
      if (!info.available) continue;
      total++;
      const itemDone = isItemDone(key);
      if (info.topic) {
        const t = byTopic.get(info.topic.id) || { total: 0, done: 0, day: 0 };
        byTopic.set(info.topic.id, { total: t.total + 1, done: t.done + (itemDone ? 1 : 0), day: Math.max(t.day, i) });
      }
      if (itemDone) {
        done++;
        continue;
      }
      minutesLeft += info.minutes;
      if (!next) next = { ...info, day: i };
      if (i < dayIndex) overdue.push({ ...info, day: i });
    }
  });

  const today = (record.days[dayIndex] || []).map((key) => ({ ...describe(record, key), day: dayIndex, done: isItemDone(key) }))
    .filter((i) => i.available);
  // A milestone is reached when every plan item of its topics is done.
  const milestones = (record.milestones || []).map((m) => {
    const parts = m.topics.map((id) => byTopic.get(id)).filter(Boolean);
    const complete = parts.filter((t) => t.done === t.total).length;
    return { title: m.title, total: parts.length, complete, reached: parts.length > 0 && complete === parts.length, day: Math.max(0, ...parts.map((t) => t.day)) + 1 };
  }).filter((m) => m.total > 0);

  return {
    total, done, percent: total ? Math.round((done / total) * 100) : 0, minutesLeft, next, overdue, today,
    dayCount, dayNumber: dayIndex + 1, notStarted: elapsed < 0, startsIn: Math.max(0, -elapsed), ended: elapsed >= dayCount,
    lastDay: lastDay + 1, finished: total > 0 && done === total, milestones,
  };
}

/** Records grouped for the dashboard: the active one, unfinished others, finished ones. */
export function grouped() {
  const s = state();
  const active = s.plans.find((p) => p.id === s.active) || null;
  const others = s.plans.filter((p) => p !== active).map((record) => ({ record, summary: summarize(record) }));
  return {
    active: active ? { record: active, summary: summarize(active) } : null,
    saved: others.filter((o) => !o.summary.finished),
    completed: others.filter((o) => o.summary.finished),
  };
}
