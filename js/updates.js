// What's new: a static change history (metadata/updates.json) compared with
// what this browser has already seen. Nothing is checked online — a new entry
// arrives with the deployment that adds it.
//
// studyhub:v1:updates = { seen: [ "<update-id>", … ], previousVisit?: ISO, currentVisit?: ISO }
//   seen           ids shown in the Updates panel (or present before this browser's first visit)
//   currentVisit   start of this visit; previousVisit is the visit before it

import { fetchJson } from './content-loader.js';
import { read, write } from './storage.js';
import * as history from './history.js';

const KEY = 'updates';
const URL = 'metadata/updates.json';
// A gap this long between page loads starts a new visit.
const VISIT_GAP_MS = 30 * 60 * 1000;
export const TYPE_LABELS = {
  content: 'New content', revision: 'Revision', interaction: 'Interactive', ui: 'Interface', bugfix: 'Fix', improvement: 'Improvement',
};

let updates = [];
let visit = { previous: null };

function state() {
  const value = read(KEY, null);
  return value && typeof value === 'object' && Array.isArray(value.seen) ? value : null;
}

function notify() {
  document.dispatchEvent(new CustomEvent('studyhub:updates'));
}

/** Load the history and record this visit. Never throws: a missing file just means no updates. */
export async function init() {
  try {
    const data = await fetchJson(URL);
    updates = (Array.isArray(data?.updates) ? data.updates : [])
      .filter((u) => u && u.id && u.date && u.title)
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.warn('Update history unavailable:', error.message);
    updates = [];
  }

  const now = new Date();
  let current = state();
  if (!current) current = { seen: baselineSeen() };
  const last = Date.parse(current.currentVisit || '');
  if (!Number.isNaN(last) && now - last > VISIT_GAP_MS) current.previousVisit = current.currentVisit;
  current.currentVisit = now.toISOString();
  // Forget ids that are no longer in the history.
  const ids = new Set(updates.map((u) => u.id));
  current.seen = current.seen.filter((id) => ids.has(id));
  write(KEY, current);
  visit = { previous: current.previousVisit || null };
  notify();
}

/**
 * First run of the update system in this browser. A new visitor has nothing
 * to catch up on. Someone who studied here before gets the updates released
 * on or after the day they last studied (from their real history).
 */
function baselineSeen() {
  const lastStudied = history.list()[0]?.at?.slice(0, 10);
  if (!lastStudied) return updates.map((u) => u.id);
  return updates.filter((u) => u.date < lastStudied).map((u) => u.id);
}

export function all() {
  return updates;
}

export function unseen() {
  const seen = new Set(state()?.seen || []);
  return updates.filter((u) => !seen.has(u.id));
}

export function previousVisit() {
  return visit.previous;
}

export function markAllSeen() {
  const current = state() || { seen: [] };
  current.seen = updates.map((u) => u.id);
  write(KEY, current);
  notify();
}

/** "2026-10-05" → "5 Oct 2026" in the reader's locale, without time-zone drift. */
export function formatDate(isoDate, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, options);
}
