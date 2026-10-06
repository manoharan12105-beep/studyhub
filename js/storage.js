// Namespaced, versioned key-value storage.
//
// Every persisted value goes through this module, so the backing store can be
// swapped later (IndexedDB, a sync service, …) without touching callers.
// Keys look like `studyhub:v1:progress`. A breaking format change must bump the
// version and migrate the old keys on boot instead of discarding them.

const PREFIX = 'studyhub:v1:';

// When localStorage is unavailable (private mode, blocked cookies, quota) the
// app keeps working with an in-memory map for the current session.
const memory = new Map();
let backend = detectBackend();

function detectBackend() {
  try {
    const probe = `${PREFIX}__probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isPersistent() {
  return backend !== null;
}

export function read(key, fallback) {
  const fullKey = PREFIX + key;
  try {
    const raw = backend ? backend.getItem(fullKey) : memory.get(fullKey);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch {
    // Corrupt JSON: keep the fallback rather than crashing the page.
    return fallback;
  }
}

export function write(key, value) {
  const fullKey = PREFIX + key;
  const raw = JSON.stringify(value);
  try {
    if (backend) backend.setItem(fullKey, raw);
    else memory.set(fullKey, raw);
    return true;
  } catch {
    // Quota exceeded or storage revoked: fall back to memory for the session.
    backend = null;
    memory.set(fullKey, raw);
    return false;
  }
}

/**
 * Write several keys as one step (progress restore). If any write fails, every
 * key gets its previous value back and false is returned — never a half-written state.
 */
export function writeAll(entries) {
  const store = backend || { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v), removeItem: (k) => memory.delete(k) };
  const previous = entries.map(([key]) => [PREFIX + key, store.getItem(PREFIX + key)]);
  try {
    for (const [key, value] of entries) store.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    for (const [fullKey, raw] of previous) {
      try {
        if (raw === null) store.removeItem(fullKey);
        else store.setItem(fullKey, raw);
      } catch { /* best effort: the original value was already there */ }
    }
    return false;
  }
}

export function remove(key) {
  try {
    if (backend) backend.removeItem(PREFIX + key);
  } catch { /* ignore */ }
  memory.delete(PREFIX + key);
}

/** Read-modify-write helper: `update('bookmarks', [], list => [...list, id])`. */
export function update(key, fallback, change) {
  const next = change(read(key, fallback));
  write(key, next);
  return next;
}

// Cross-tab sync: other tabs writing progress/bookmarks fire 'storage' events.
const listeners = new Set();
export function onExternalChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
window.addEventListener('storage', (event) => {
  if (event.key && event.key.startsWith(PREFIX)) {
    for (const fn of listeners) fn(event.key.slice(PREFIX.length));
  }
});
