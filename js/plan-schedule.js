// Study plan generation: pure functions, no DOM and no storage, so the same
// code runs in the browser and in a Node check script.
//
//   topics (ordered ids) + settings → items (one per study activity) → days
//
// An item key names the activity and what it points at, never its text:
//   learn:<topic>  interactive:<topic>  practice:<topic>  interview:<topic>
//   flashcards:<topic>  revision:<category>/<mode-id>
// Generation is deterministic: the same topics, settings and content index
// always give the same items in the same days.

export const MODES = ['learn', 'interactive', 'practice', 'interview', 'flashcards', 'revision'];
export const MODE_LABELS = {
  learn: 'Learn', interactive: 'Interactive', practice: 'Practice',
  interview: 'Interview', flashcards: 'Flashcards', revision: 'Revision',
};
export const TOPIC_LEVELS = ['beginner', 'intermediate', 'advanced'];
export const QUESTION_LEVELS = ['easy', 'medium', 'hard'];
/** Lesson difficulty → question difficulty, used when a question has no level of its own. */
export const LEVEL_OF_TOPIC = { beginner: 'easy', intermediate: 'medium', advanced: 'hard' };

// Used only when metadata/study-plans.json has no defaults (it always should).
const FALLBACK_MINUTES = { learn: 30, interactive: 10, practice: 15, interview: 10, flashcards: 5, revision: 60 };

const KEY = /^(learn|interactive|practice|interview|flashcards):([a-z0-9]+(?:-[a-z0-9]+)*)$|^revision:([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;

/** "practice:arrays" → { mode, topicId } · "revision:dsa/quick-revision" → { mode, categoryId, modeId }. */
export function parseKey(key) {
  const m = typeof key === 'string' ? KEY.exec(key) : null;
  if (!m) return null;
  return m[1] ? { mode: m[1], topicId: m[2] } : { mode: 'revision', categoryId: m[3], modeId: m[4] };
}

export function isItemKey(key) {
  return parseKey(key) !== null;
}

/** Which question file a topic-level session mode needs (Learn needs only the lesson). */
const MODE_FILE = { practice: 'practice.md', interview: 'interview-questions.md', flashcards: 'interview-questions.md' };

/**
 * The topic ids a built-in plan variant covers, stage by stage, in learning order.
 * lookup: { category(id) → { topics, subcategories:[{ id, topics }] } | null, topic(id) → topic | null }
 * Unknown subjects, modules or topics are skipped (and reported by the check script).
 */
export function resolveStages(stageDefs, variant, lookup) {
  const seen = new Set();
  const stages = [];
  for (const stageId of variant.stages) {
    const def = stageDefs[stageId];
    if (!def) continue;
    const excluded = new Set(def.exclude || []);
    const topics = [];
    for (const entry of def.include) {
      for (const topic of includeTopics(entry, lookup)) {
        if (excluded.has(topic.id) || seen.has(topic.id)) continue;
        seen.add(topic.id);
        topics.push(topic.id);
      }
    }
    stages.push({ id: stageId, title: def.title, milestone: def.milestone || `${def.title} complete`, topics });
  }
  return stages;
}

function includeTopics(entry, lookup) {
  if (entry.topics) return entry.topics.map((id) => lookup.topic(id)).filter(Boolean);
  const category = lookup.category(entry.subject);
  if (!category) return [];
  if (!entry.modules) return category.topics;
  // Modules in the order the plan lists them; topics in the module's own order.
  return entry.modules.flatMap((subId) => category.subcategories.find((s) => s.id === subId)?.topics || []);
}

/**
 * Topics that a plan will actually schedule, in order.
 * ctx.isComplete(id) and ctx.weak (Set of topic ids that need attention) come from
 * the learner's real progress and answers; nothing is estimated here.
 */
export function planTopics(topicIds, settings, lookup, ctx = {}) {
  const topicLevels = new Set(settings.topicLevels || TOPIC_LEVELS);
  const weak = settings.prioritizeWeak ? ctx.weak || new Set() : new Set();
  const topics = [];
  const seen = new Set();
  for (const id of topicIds) {
    const topic = lookup.topic(id);
    if (!topic || seen.has(id)) continue; // removed from metadata, or listed twice
    seen.add(id);
    if (!topicLevels.has(topic.difficulty) && !weak.has(id)) continue;
    // A weak topic stays even when complete: its questions still need work.
    if (settings.skipCompleted && ctx.isComplete?.(id) && !weak.has(id)) continue;
    topics.push(topic);
  }
  if (!weak.size) return topics;
  // Weak topics first (stable), the rest keep their order.
  return [...topics.filter((t) => weak.has(t.id)), ...topics.filter((t) => !weak.has(t.id))];
}

/**
 * One item per study activity.
 * ctx.interactive: Set of topic ids with at least one interaction (from the interaction registries).
 * ctx.minutes: per-mode minutes from metadata/study-plans.json `defaults.modeMinutes`.
 */
export function buildItems(topics, settings, lookup, ctx = {}) {
  const modes = new Set(settings.modes || ['learn']);
  const minutes = { ...FALLBACK_MINUTES, ...(ctx.minutes || {}) };
  const interactive = ctx.interactive || new Set();
  const items = [];

  // A subject's revision sheet goes right after the last of its topics in the plan.
  const lastOfCategory = new Map();
  topics.forEach((t, i) => lastOfCategory.set(t.category, i));

  topics.forEach((topic, i) => {
    const add = (mode, mins) => items.push({ key: `${mode}:${topic.id}`, mode, topicId: topic.id, categoryId: topic.category, minutes: mins });
    if (modes.has('learn')) add('learn', topic.estimatedMinutes || minutes.learn);
    if (modes.has('interactive') && interactive.has(topic.id)) add('interactive', minutes.interactive);
    for (const mode of ['practice', 'interview', 'flashcards']) {
      if (modes.has(mode) && topic.files.includes(MODE_FILE[mode])) add(mode, minutes[mode]);
    }
    if (modes.has('revision') && lastOfCategory.get(topic.category) === i) {
      const sheet = revisionMode(lookup.category(topic.category), settings.revision);
      if (sheet) {
        items.push({
          key: `revision:${topic.category}/${sheet.id}`, mode: 'revision', categoryId: topic.category, modeId: sheet.id,
          minutes: sheet.estimatedMinutes || minutes.revision,
        });
      }
    }
  });
  return items;
}

/** "quick" → the shortest timed study mode; "full" → the first (complete) one. */
export function revisionMode(category, kind = 'full') {
  const modesList = category?.studyModes || [];
  if (!modesList.length) return null;
  if (kind === 'quick') {
    const timed = modesList.filter((m) => m.estimatedMinutes).sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
    return timed[0] || modesList[0];
  }
  return modesList[0];
}

export function totalMinutes(items) {
  return items.reduce((sum, item) => sum + item.minutes, 0);
}

/** Does the schedule hold the work? Minutes, not hours, so nothing is rounded away. */
export function capacity(items, durationDays, dailyMinutes) {
  const required = totalMinutes(items);
  const available = durationDays * dailyMinutes;
  return {
    required,
    available,
    fits: required <= available,
    // What would make it fit, for the "Extend duration" / "Increase daily time" choices.
    daysNeeded: Math.max(1, Math.ceil(required / dailyMinutes)),
    dailyNeeded: roundUp(Math.ceil(required / durationDays), 5),
  };
}

function roundUp(value, step) {
  return Math.ceil(value / step) * step;
}

/**
 * Split items into days, keeping their order.
 *
 * Days fill in order up to `perDay` minutes; an item moves to the next day when
 * at least half of it would not fit, so a day ends within half an item of
 * perDay and an item longer than a day gets a day of its own. perDay is the
 * daily time; when the work is larger than the schedule ("Continue anyway") it
 * grows to total / days, and anything left at the end joins the last day, so
 * the result never has more than durationDays days. Light plans finish early;
 * the remaining days stay free.
 */
export function schedule(items, durationDays, dailyMinutes) {
  const days = Array.from({ length: Math.max(1, durationDays) }, () => []);
  const total = totalMinutes(items);
  const perDay = Math.max(dailyMinutes, total / days.length) || 1;
  let day = 0;
  let used = 0;
  for (const item of items) {
    // Start a new day when at least half of this item would not fit today.
    if (used > 0 && used + item.minutes / 2 > perDay && day < days.length - 1) {
      day++;
      used = 0;
    }
    days[day].push(item.key);
    used += item.minutes;
  }
  return days;
}

/**
 * Milestones a plan tracks: built-in stages, or one per subject for custom plans.
 * Each lists the plan's topics it waits for.
 */
export function subjectMilestones(topics, lookup) {
  const order = [];
  const byCategory = new Map();
  for (const topic of topics) {
    if (!byCategory.has(topic.category)) {
      byCategory.set(topic.category, []);
      order.push(topic.category);
    }
    byCategory.get(topic.category).push(topic.id);
  }
  return order.map((id) => ({ title: `${lookup.category(id)?.title || id} complete`, topics: byCategory.get(id) }));
}

/** Question difficulty for the session filter: own level, else group heading, else the topic's level. */
export function questionLevel(item, topic) {
  const own = item.meta?.find((m) => m.key === 'Difficulty')?.value;
  const fromMeta = own && QUESTION_LEVELS.find((l) => own.toLowerCase().startsWith(l));
  if (fromMeta) return fromMeta;
  const group = item.group?.title?.toLowerCase();
  const fromGroup = group && LEVEL_OF_TOPIC[group];
  if (fromGroup) return fromGroup;
  return LEVEL_OF_TOPIC[topic?.difficulty] || null;
}

/** "easy,hard" → ['easy', 'hard'] (valid, de-duplicated, in canonical order); null = no filter. */
export function parseLevels(text) {
  if (!text) return null;
  const wanted = new Set(String(text).split(','));
  const levels = QUESTION_LEVELS.filter((l) => wanted.has(l));
  return levels.length && levels.length < QUESTION_LEVELS.length ? levels : null;
}
