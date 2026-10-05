// Global search over metadata: subjects, modules, study modes and topics.
//
// Built once from the in-memory index (no Markdown is fetched), so results are
// instant. Every query word must match some field; matches in the title count
// most, then tags, then subject/module names, then the description.

import { index, isAvailable } from './content-loader.js';
import { href } from './router.js';

const WEIGHTS = { title: 10, tags: 6, context: 3, description: 2 };
let entries = null;

function normalize(text) {
  return String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[-_/]+/g, ' ');
}

function buildEntries() {
  const list = [];
  for (const category of index.categories) {
    if (!isAvailable(category)) continue;
    list.push({
      kind: 'subject', title: category.title, path: [], href: href(['c', category.id]),
      fields: { title: normalize(category.title), context: '', tags: normalize(category.id), description: normalize(category.description) },
      categoryId: category.id,
    });
    for (const mode of category.studyModes) {
      list.push({
        kind: 'mode', title: mode.title, path: [category.title], href: href(['c', category.id, 'm', mode.id]),
        fields: { title: normalize(mode.title), context: normalize(category.title), tags: 'revision', description: normalize(mode.description) },
        categoryId: category.id,
      });
    }
    for (const sub of category.subcategories) {
      if (!sub.topics.length) continue;
      list.push({
        kind: 'module', title: sub.title, path: [category.title], href: href(['c', category.id, sub.id]),
        fields: { title: normalize(sub.title), context: normalize(category.title), tags: '', description: normalize(sub.description) },
        categoryId: category.id,
      });
    }
    for (const topic of category.topics) {
      const sub = category.subcategories.find((s) => s.id === topic.subcategory);
      list.push({
        kind: 'topic', title: topic.title, path: [category.title, sub?.title].filter(Boolean),
        href: href(['t', topic.id]), topic,
        fields: {
          title: normalize(topic.title),
          tags: normalize((topic.tags || []).join(' ')),
          context: normalize(`${category.title} ${sub?.title || ''} ${topic.type}`),
          description: normalize(topic.description),
        },
        categoryId: category.id,
      });
    }
  }
  return list;
}

function scoreTerm(entry, term) {
  let best = 0;
  for (const [field, weight] of Object.entries(WEIGHTS)) {
    const text = entry.fields[field];
    const at = text.indexOf(term);
    if (at === -1) continue;
    // Whole-word and word-start matches beat matches inside a word.
    const wordStart = at === 0 || text[at - 1] === ' ';
    const score = weight * (wordStart ? 1.5 : 1) * (field === 'title' && at === 0 ? 1.4 : 1);
    best = Math.max(best, score);
  }
  return best;
}

/**
 * search('deadlock', { categoryId, difficulty, kinds }) → [{ entry, score }]
 */
export function search(query, filters = {}) {
  if (!entries) entries = buildEntries();
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const results = [];
  for (const entry of entries) {
    if (filters.categoryId && entry.categoryId !== filters.categoryId) continue;
    if (filters.kinds && !filters.kinds.includes(entry.kind)) continue;
    if (filters.difficulty && entry.topic?.difficulty !== filters.difficulty) continue;
    let total = 0;
    for (const term of terms) {
      const score = scoreTerm(entry, term);
      if (!score) { total = 0; break; }
      total += score;
    }
    if (!total) continue;
    // Exact title match floats to the top; subjects/modules slightly above topics on ties.
    if (entry.fields.title === terms.join(' ')) total += 25;
    if (entry.kind !== 'topic') total += 1;
    results.push({ entry, score: total });
  }
  results.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
  return results;
}

export const KIND_LABELS = { subject: 'Subject', module: 'Module', mode: 'Study mode', topic: 'Topic' };
