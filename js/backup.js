// Progress backup: the learner's study state as one line of text, copied and
// pasted through the clipboard (no files, no server).
//
//   STUDYHUB-PROGRESS:v1:<z|j>.<base64url>
//     z = deflate-raw compressed JSON (CompressionStream), j = plain JSON
//   JSON = { format: "studyhub-progress", version: 1, exportedAt: ISO, data: { …ALLOWLIST } }
//
// Only the keys in ALLOWLIST are exported or restored. Appearance and per-browser
// state (theme, prefs, updates) deliberately stay with the browser.
// Import validates everything before writing anything, then replaces all four
// keys in one step (storage.writeAll rolls back on failure).

import { read, writeAll } from './storage.js';

const PREFIX = 'STUDYHUB-PROGRESS:';
const FORMAT = 'studyhub-progress';
export const VERSION = 1;
export const ALLOWLIST = ['progress', 'bookmarks', 'history', 'questions'];

// Limits keep a pasted text from filling storage or freezing the page.
const MAX_TEXT = 4_000_000;
const MAX_ITEMS = 50_000;
const MAX_HISTORY = 40; // history.js keeps at most 40 entries
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // topic ids are kebab-case (CLAUDE.md)
const STATUSES = ['in-progress', 'completed'];
const HISTORY_KINDS = ['topic', 'mode', 'session'];
const QUESTION_KINDS = ['practice', 'interview', 'flashcards', 'check'];
const RESULTS = ['correct', 'incorrect', 'known', 'review'];

/** Error with a message meant for the learner (never a raw JS error). */
export class BackupError extends Error {}
const invalid = () => new BackupError('Invalid StudyHub progress backup.');

// ---- Validation -------------------------------------------------------------------
// One function per key. strict (import): any malformed entry rejects the backup.
// lenient (export): malformed entries in this browser's own state are skipped, so an
// exported backup always imports. Objects are rebuilt from known fields only, on
// null-prototype maps, so keys like "__proto__" cannot reach anything.

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v, max = 200) => typeof v === 'string' && v.length > 0 && v.length <= max && !/[\u0000-\u001f]/.test(v);
const isDate = (v) => typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v));

function cleanProgress(value, strict) {
  if (!isPlainObject(value)) throw invalid();
  const out = Object.create(null);
  for (const [id, record] of Object.entries(value)) {
    const ok = ID.test(id) && id.length <= 120 && isPlainObject(record)
      && STATUSES.includes(record.status)
      && (record.updated === undefined || isDate(record.updated))
      && (record.read === undefined || (typeof record.read === 'number' && record.read >= 0 && record.read <= 1));
    if (!ok) { if (strict) throw invalid(); continue; }
    out[id] = { status: record.status };
    if (record.updated !== undefined) out[id].updated = record.updated;
    if (record.read !== undefined) out[id].read = record.read;
  }
  return out;
}

function cleanBookmarks(value, strict) {
  if (!Array.isArray(value)) throw invalid();
  const out = [];
  for (const id of value) {
    if (typeof id !== 'string' || !ID.test(id) || id.length > 120) { if (strict) throw invalid(); continue; }
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

function cleanHistory(value, strict) {
  if (!Array.isArray(value) || (strict && value.length > MAX_HISTORY)) throw invalid();
  const out = [];
  for (const entry of value) {
    const ok = isPlainObject(entry) && HISTORY_KINDS.includes(entry.kind) && isText(entry.id) && isDate(entry.at)
      && (entry.tab === undefined || isText(entry.tab, 60))
      && (entry.label === undefined || isText(entry.label, 300));
    if (!ok) { if (strict) throw invalid(); continue; }
    const clean = { kind: entry.kind, id: entry.id };
    if (entry.tab !== undefined) clean.tab = entry.tab;
    if (entry.label !== undefined) clean.label = entry.label;
    clean.at = entry.at;
    out.push(clean);
  }
  return out.slice(0, MAX_HISTORY);
}

function cleanQuestions(value, strict) {
  if (!isPlainObject(value)) throw invalid();
  const out = Object.create(null);
  for (const [topicId, results] of Object.entries(value)) {
    if (!ID.test(topicId) || topicId.length > 120 || !isPlainObject(results)) { if (strict) throw invalid(); continue; }
    const clean = Object.create(null);
    for (const [key, result] of Object.entries(results)) {
      const kind = key.split(':')[0];
      const ok = QUESTION_KINDS.includes(kind) && isText(key, 200) && key.length > kind.length + 1
        && isPlainObject(result) && RESULTS.includes(result.r) && isDate(result.t);
      if (!ok) { if (strict) throw invalid(); continue; }
      clean[key] = { r: result.r, t: result.t };
    }
    if (Object.keys(clean).length) out[topicId] = clean;
  }
  return out;
}

const CLEANERS = { progress: cleanProgress, bookmarks: cleanBookmarks, history: cleanHistory, questions: cleanQuestions };
const EMPTY = { progress: () => ({}), bookmarks: () => [], history: () => [], questions: () => ({}) };

function cleanData(data, strict) {
  if (!isPlainObject(data)) throw invalid();
  if (strict && Object.keys(data).some((key) => !ALLOWLIST.includes(key))) throw invalid();
  const out = {};
  for (const key of ALLOWLIST) {
    // A missing key is empty: restore replaces it with nothing.
    out[key] = data[key] === undefined ? EMPTY[key]() : CLEANERS[key](data[key], strict);
  }
  const answers = Object.values(out.questions).reduce((n, map) => n + Object.keys(map).length, 0);
  if (Object.keys(out.progress).length + out.bookmarks.length + answers > MAX_ITEMS) throw invalid();
  return out;
}

// ---- Summary ----------------------------------------------------------------------

/** What a set of state holds, for the export note and the restore confirmation. */
export function summarize(data) {
  const records = Object.values(data.progress);
  const answers = Object.values(data.questions).reduce((n, map) => n + Object.keys(map).length, 0);
  return {
    completed: records.filter((r) => r.status === 'completed').length,
    inProgress: records.filter((r) => r.status === 'in-progress').length,
    bookmarks: data.bookmarks.length,
    history: data.history.length,
    answers,
  };
}

export function isEmpty(summary) {
  return Object.values(summary).every((n) => n === 0);
}

/** This browser's state, cleaned the same way an import is checked. */
export function currentData() {
  const raw = {};
  for (const key of ALLOWLIST) raw[key] = read(key, undefined);
  const safe = {};
  for (const key of ALLOWLIST) {
    try {
      safe[key] = raw[key] === undefined ? EMPTY[key]() : CLEANERS[key](raw[key], false);
    } catch {
      safe[key] = EMPTY[key](); // wrong top-level type: nothing usable to export
    }
  }
  return safe;
}

// ---- Encoding ---------------------------------------------------------------------

const canCompress = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

function toBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) throw invalid();
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4);
  let binary;
  try { binary = atob(padded); } catch { throw invalid(); }
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/** Build the clipboard text for this browser's progress. */
export async function createBackup(data = currentData()) {
  const json = JSON.stringify({ format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), data });
  const bytes = new TextEncoder().encode(json);
  const body = canCompress() ? `z.${toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))}` : `j.${toBase64Url(bytes)}`;
  return `${PREFIX}v${VERSION}:${body}`;
}

/**
 * Parse and fully validate pasted text. Resolves to { data, exportedAt, summary }
 * or rejects with a BackupError whose message can be shown as is. Writes nothing.
 */
export async function parseBackup(text) {
  const trimmed = String(text || '').replace(/\s+/g, '');
  if (!trimmed) throw new BackupError('Paste a StudyHub backup first.');
  if (trimmed.length > MAX_TEXT || !trimmed.startsWith(PREFIX)) throw invalid();
  const match = /^STUDYHUB-PROGRESS:v(\d+):(.*)$/.exec(trimmed);
  if (!match) throw invalid();
  if (Number(match[1]) !== VERSION) throw new BackupError('This StudyHub backup uses an unsupported version.');
  const [, encoding, payload] = /^([zj])\.(.+)$/.exec(match[2]) || [];
  if (!encoding) throw invalid();

  let bytes = fromBase64Url(payload);
  if (encoding === 'z') {
    if (!canCompress()) throw new BackupError('This browser cannot read compressed backups. Try a current version of Chrome, Edge, Firefox or Safari.');
    try { bytes = await pipe(bytes, new DecompressionStream('deflate-raw')); } catch { throw invalid(); }
  }
  let backup;
  try { backup = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw invalid(); }

  if (!isPlainObject(backup) || backup.format !== FORMAT) throw invalid();
  if (backup.version !== VERSION) throw new BackupError('This StudyHub backup uses an unsupported version.');
  if (!isDate(backup.exportedAt) || backup.data === undefined) throw invalid();
  const data = cleanData(backup.data, true);
  return { data, exportedAt: backup.exportedAt, summary: summarize(data) };
}

/** Replace all allowlisted keys at once. Returns false (state untouched) if storage refused. */
export function restore(data) {
  const ok = writeAll(ALLOWLIST.map((key) => [key, data[key]]));
  if (ok) document.dispatchEvent(new CustomEvent('studyhub:restored'));
  return ok;
}
