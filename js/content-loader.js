// Content engine: loads metadata, builds the in-memory index, fetches Markdown.
//
// The browser cannot list folders on GitHub Pages, so everything the app knows
// about comes from metadata/categories.json and the catalogs it points to.
// All paths are relative (the site is served under /<repo>/).

const CATEGORIES_URL = 'metadata/categories.json';
const FILE_TABS = {
  'content.md': { tab: 'lesson', label: 'Lesson' },
  'examples.md': { tab: 'examples', label: 'Examples' },
  'interview-questions.md': { tab: 'interview-questions', label: 'Interview' },
  'practice.md': { tab: 'practice', label: 'Practice' },
  'revision.md': { tab: 'revision', label: 'Revision' },
};

export class LoadError extends Error {
  constructor(message, path, status) {
    super(message);
    this.path = path;
    this.status = status;
  }
}

const textCache = new Map();

/** Fetch a text file once per session; concurrent callers share the request. */
export function fetchText(path) {
  if (!textCache.has(path)) {
    const request = fetch(path).then((response) => {
      if (!response.ok) {
        throw new LoadError(`Could not load ${path} (HTTP ${response.status}).`, path, response.status);
      }
      return response.text();
    }).catch((error) => {
      textCache.delete(path); // allow a retry
      if (error instanceof LoadError) throw error;
      throw new LoadError(`Could not load ${path}. Check your connection or the local server.`, path, 0);
    });
    textCache.set(path, request);
  }
  return textCache.get(path);
}

export async function fetchJson(path) {
  const text = await fetchText(path);
  try {
    return JSON.parse(text);
  } catch {
    throw new LoadError(`${path} is not valid JSON.`, path, 200);
  }
}

/** The single index object every view reads from. Built once by loadIndex(). */
export const index = {
  categories: [],
  categoriesById: new Map(),
  topicsById: new Map(),
  pathToRoute: new Map(),
};

export function fileTab(file) {
  return FILE_TABS[file];
}

export function tabToFile(tab) {
  return Object.keys(FILE_TABS).find((file) => FILE_TABS[file].tab === tab) || null;
}

export function topicDir(topic) {
  const sub = topic.subcategory ? `${topic.subcategory}/` : '';
  return `content/${topic.category}/${sub}${topic.slug}/`;
}

function byOrder(a, b) {
  return (a.order ?? 9999) - (b.order ?? 9999) || a.title.localeCompare(b.title);
}

export async function loadIndex() {
  const registry = await fetchJson(CATEGORIES_URL);
  if (!registry || !Array.isArray(registry.categories)) {
    throw new LoadError(`${CATEGORIES_URL} has no "categories" array.`, CATEGORIES_URL, 200);
  }

  // Catalogs load in parallel; one broken catalog must not break the others.
  const catalogs = await Promise.allSettled(
    registry.categories.map((category) => fetchJson(category.catalog)),
  );

  index.categories = registry.categories
    .map((raw, i) => buildCategory(raw, catalogs[i]))
    .sort(byOrder);

  for (const category of index.categories) {
    index.categoriesById.set(category.id, category);
    for (const topic of category.topics) {
      index.topicsById.set(topic.id, topic);
      for (const file of topic.files) {
        index.pathToRoute.set(topicDir(topic) + file, { topicId: topic.id, file });
      }
    }
    for (const mode of category.studyModes) {
      mode.sources.forEach((source, i) => {
        index.pathToRoute.set(source.path, { categoryId: category.id, modeId: mode.id, sourceIndex: i });
      });
    }
  }
  return index;
}

function buildCategory(raw, catalogResult) {
  const subcategories = (raw.subcategories || []).slice().sort(byOrder)
    .map((sub) => ({ ...sub, topics: [] }));
  const category = {
    ...raw,
    subcategories,
    studyModes: raw.studyModes || [],
    topics: [],
    error: null,
  };

  if (catalogResult.status === 'rejected') {
    category.error = catalogResult.reason?.message || `Could not load ${raw.catalog}.`;
    return category;
  }
  const catalog = catalogResult.value;
  if (!catalog || !Array.isArray(catalog.topics)) {
    category.error = `${raw.catalog} has no "topics" array.`;
    return category;
  }

  const subById = new Map(subcategories.map((sub) => [sub.id, sub]));
  // Drafts stay hidden; entries missing required fields are skipped, not fatal.
  const published = catalog.topics.filter((t) => t && t.status === 'published' && t.id && t.slug
    && t.title && Array.isArray(t.files) && t.files.includes('content.md'));

  // Learning order: subcategory order first, then topic order inside it.
  const subOrder = (topic) => (topic.subcategory ? subcategories.findIndex((s) => s.id === topic.subcategory) : -1);
  published.sort((a, b) => subOrder(a) - subOrder(b) || byOrder(a, b));

  for (const topic of published) {
    topic.category = raw.id;
    const sub = topic.subcategory ? subById.get(topic.subcategory) : null;
    if (sub) sub.topics.push(topic);
    category.topics.push(topic);
  }
  return category;
}

export function getCategory(id) {
  return index.categoriesById.get(id) || null;
}

export function getTopic(id) {
  return index.topicsById.get(id) || null;
}

export function getSubcategory(category, subId) {
  return category?.subcategories.find((s) => s.id === subId) || null;
}

/** Topics without a subcategory, or whose subcategory is not declared, still need a home. */
export function ungroupedTopics(category) {
  const ids = new Set(category.subcategories.map((s) => s.id));
  return category.topics.filter((t) => !t.subcategory || !ids.has(t.subcategory));
}

export function isAvailable(category) {
  return category.topics.length > 0;
}

/** Previous and next topic in the category's learning order. */
export function neighbours(topic) {
  const list = getCategory(topic.category)?.topics || [];
  const i = list.indexOf(topic);
  return { prev: i > 0 ? list[i - 1] : null, next: i >= 0 && i < list.length - 1 ? list[i + 1] : null };
}

export function topicTabs(topic) {
  return Object.keys(FILE_TABS)
    .filter((file) => topic.files.includes(file))
    .map((file) => ({ file, ...FILE_TABS[file] }));
}

// ---- Interaction registry --------------------------------------------------

const interactionCache = new Map();

/**
 * Load a category's interaction registry (metadata/interactions/<id>.json).
 * Returns { interactions: [], error: string|null }; never throws.
 */
export function loadInteractions(categoryId) {
  if (!interactionCache.has(categoryId)) {
    const category = getCategory(categoryId);
    const path = category?.interactions;
    const promise = !path
      ? Promise.resolve({ interactions: [], error: null })
      : fetchJson(path)
        .then((data) => ({
          interactions: Array.isArray(data?.interactions) ? data.interactions : [],
          error: Array.isArray(data?.interactions) ? null : `${path} has no "interactions" array.`,
        }))
        .catch((error) => ({ interactions: [], error: error.message }));
    interactionCache.set(categoryId, promise);
  }
  return interactionCache.get(categoryId);
}

/** Interactions placed in one topic, each paired with its placement. */
export async function interactionsForTopic(topic) {
  const { interactions } = await loadInteractions(topic.category);
  const result = [];
  for (const interaction of interactions) {
    const placement = (interaction.topics || []).find((p) => p.topic === topic.id);
    if (placement) result.push({ interaction, placement });
  }
  return result;
}

/** Set of topic ids that have at least one interaction (for "Interactive" badges). */
export async function interactiveTopicIds(categoryId) {
  const { interactions } = await loadInteractions(categoryId);
  return new Set(interactions.flatMap((i) => (i.topics || []).map((p) => p.topic)));
}

/** Resolve a relative link found inside a Markdown file against that file's folder. */
export function resolvePath(fromFile, relative) {
  const base = fromFile.split('/').slice(0, -1);
  for (const part of relative.split('/')) {
    if (part === '..') base.pop();
    else if (part !== '.' && part !== '') base.push(part);
  }
  return base.join('/');
}
