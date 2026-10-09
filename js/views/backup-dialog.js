// Progress Import / Export dialog (opened from the header menu).
// Steps, all inside #backup-dialog:
//   choose → export: pick categories → exported
//          → import: paste → pick categories → confirm → restored
// The logic (categories, encoding, validation, atomic restore) is in js/backup.js;
// both pickers list backup.CATEGORIES, so export and import always agree.

import { el, icon } from '../util.js';
import * as backup from '../backup.js';
import * as notes from '../notes.js';

const PRIVACY = 'Your progress stays in your browser. Nothing is uploaded to a server.';

let dialog;
let title;
let body;

export function openBackup() {
  dialog = document.getElementById('backup-dialog');
  title = document.getElementById('backup-title');
  body = dialog.querySelector('.dialog-body');
  showChoice();
  if (!dialog.open) dialog.showModal();
  focusFirst();
}

function step(heading, ...children) {
  title.textContent = heading;
  body.replaceChildren(...children.flat().filter(Boolean));
}

function focusFirst(selector = '[data-autofocus]') {
  (body.querySelector(selector) || body.querySelector('button, textarea, a'))?.focus();
}

function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** What one category holds, in plain words ("" when it is empty). */
const AMOUNT = {
  progress: (s) => [s.completed && plural(s.completed, 'completed topic'), s.inProgress && `${plural(s.inProgress, 'topic')} in progress`].filter(Boolean).join(', '),
  bookmarks: (s) => s.bookmarks && plural(s.bookmarks, 'bookmark'),
  history: (s) => s.history && plural(s.history, 'recently studied page'),
  questions: (s) => s.answers && plural(s.answers, 'recorded answer'),
  plans: (s) => s.plans && plural(s.plans, 'study plan'),
  notes: (s) => s.notes && plural(s.notes, 'note'),
  checklists: (s) => s.checks && plural(s.checks, 'ticked checklist item'),
};
const amount = (key, summary) => AMOUNT[key](summary) || '';
const labelOf = (key) => backup.CATEGORIES.find((c) => c.key === key).label;
const names = (keys) => keys.map(labelOf).join(', ');

/** "Label: amount" for each key, as a ticked list. */
function contentList(summary, keys = summary.categories) {
  return el('ul', { class: 'backup-contents', role: 'list' },
    keys.map((key) => el('li', {}, icon('check', 16),
      el('span', {}, el('strong', {}, `${labelOf(key)}: `), amount(key, summary) || 'empty'))));
}

function actions(...buttons) {
  return el('div', { class: 'dialog-actions' }, buttons);
}

function button(label, onClick, { primary = false, autofocus = false, close = false, small = false } = {}) {
  const b = el('button', {
    type: 'button', class: `btn ${primary ? 'btn-primary' : 'btn-secondary'}${small ? ' btn-sm' : ''}`,
    'data-autofocus': autofocus ? '' : null, 'data-close-dialog': close ? '' : null,
  }, label);
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

function privacyNote(text = PRIVACY) {
  return el('p', { class: 'backup-privacy small muted' }, icon('info', 14), el('span', {}, text));
}

/** This browser's note count, including notes left out of exports (a restore replaces those too). */
function currentSummary() {
  return { ...backup.summarize(backup.currentData()), notes: notes.count() };
}

// ---- Category picker (export and import) ------------------------------------------------

/**
 * Checkboxes for `keys` (in CATEGORIES order) with Select all / Clear selection and a
 * live "Selected: …" line. `detail(key)` is the second line under each label.
 * `onChange(selected)` runs after every change, so the caller can enable its action.
 */
function categoryPicker({ id, legend, keys, checked, detail, onChange }) {
  const boxes = keys.map((key) => el('input', {
    type: 'checkbox', id: `${id}-${key}`, value: key, checked: checked.includes(key) ? true : null,
  }));
  const status = el('p', { class: 'backup-selected small', id: `${id}-status`, role: 'status' });
  const selected = () => boxes.filter((b) => b.checked).map((b) => b.value);
  const changed = () => {
    const keysNow = selected();
    status.textContent = keysNow.length
      ? `Selected (${keysNow.length} of ${keys.length}): ${names(keysNow)}`
      : 'Nothing selected. Choose at least one category.';
    onChange(keysNow);
  };
  const setAll = (value) => {
    boxes.forEach((b) => { b.checked = value; });
    changed();
  };
  boxes.forEach((b) => b.addEventListener('change', changed));

  const rows = keys.map((key, i) => {
    const category = backup.CATEGORIES.find((c) => c.key === key);
    return el('div', { class: 'check-row backup-category' }, boxes[i],
      el('label', { for: boxes[i].id },
        el('span', { class: 'backup-category-name' }, category.label),
        el('span', { class: 'field-hint' }, category.description),
        el('span', { class: 'field-hint backup-category-detail' }, detail(key))));
  });
  const node = el('fieldset', { class: 'backup-picker', 'aria-describedby': status.id },
    el('legend', { class: 'backup-label' }, legend),
    el('div', { class: 'backup-picker-tools' },
      button('Select all', () => setAll(true), { small: true }),
      button('Clear selection', () => setAll(false), { small: true })),
    el('div', { class: 'backup-picker-list' }, rows),
    status);
  return { node, selected, refresh: changed };
}

// ---- Choose ---------------------------------------------------------------------------

function showChoice() {
  const choice = (iconName, label, hint, onClick, autofocus) => {
    const b = el('button', { type: 'button', class: 'backup-choice', 'data-autofocus': autofocus ? '' : null },
      el('span', { class: 'backup-choice-icon', 'aria-hidden': 'true' }, icon(iconName, 20)),
      el('span', { class: 'backup-choice-text' }, el('span', { class: 'backup-choice-title' }, label), el('span', { class: 'backup-choice-hint' }, hint)));
    b.addEventListener('click', onClick);
    return b;
  };
  step('Progress backup',
    el('p', {}, 'Back up or restore your StudyHub learning progress, for example to continue on another browser or device. You choose which parts to include.'),
    el('div', { class: 'backup-choices' },
      choice('copy', 'Export Progress', 'Choose what to copy to the clipboard', () => showExport(), true),
      choice('transfer', 'Import Progress', 'Paste a backup and choose what to restore', () => showImport())),
    privacyNote(),
    actions(button('Close', null, { close: true })));
}

// ---- Export ---------------------------------------------------------------------------

async function copyText(text, field) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // No Clipboard API (e.g. a non-secure page) or permission refused: try the classic copy.
    try {
      field.select();
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }
}

/** Step 1: choose categories. `previous` keeps the selection when coming back from the result. */
function showExport(previous) {
  const data = backup.currentData();
  const summary = backup.summarize(data);
  if (backup.isEmpty(summary)) {
    step('Export progress',
      el('p', { role: 'status' }, 'There is no progress to back up yet. Open a topic, add a bookmark or answer a question first.'),
      actions(button('Back', showChoice, { autofocus: true }), button('Close', null, { close: true })));
    focusFirst();
    return;
  }

  const hasData = (key) => backup.count(key, data[key]) > 0;
  const hint = el('p', { class: 'form-error', id: 'backup-export-hint', role: 'alert' });
  const go = button('Export selected data', () => doExport(data, picker.selected()), { primary: true });
  go.setAttribute('aria-describedby', 'backup-export-status backup-export-hint');
  const picker = categoryPicker({
    id: 'backup-export',
    legend: 'Categories to export',
    keys: backup.ALLOWLIST,
    // By default everything that has data; an empty category can still be ticked (importing it clears that category).
    checked: previous || backup.ALLOWLIST.filter(hasData),
    detail: (key) => amount(key, summary) || 'Empty here',
    onChange: (keys) => {
      const empty = keys.length > 0 && !keys.some(hasData);
      go.disabled = keys.length === 0 || empty;
      hint.textContent = empty ? 'The selected categories are empty. Choose one that has data.' : '';
    },
  });

  step('Export progress',
    el('p', {}, 'Choose what to include in the backup. Categories you leave out are not exported.'),
    picker.node,
    hint,
    el('p', { class: 'small muted' }, 'Theme and layout settings are never included — they stay with each browser.'),
    actions(button('Cancel', showChoice), go));
  picker.refresh();
  focusFirst('input[type="checkbox"]');
}

/** Step 2: build the backup from the chosen categories only, copy it, show what it holds. */
async function doExport(data, keys) {
  const chosen = backup.pick(data, keys);
  let text;
  try {
    text = await backup.createBackup(chosen);
  } catch (e) {
    step('Export progress',
      el('p', { class: 'form-error', role: 'alert' }, e instanceof backup.BackupError ? e.message : 'The backup could not be created in this browser. Your progress was not changed.'),
      actions(button('Back', () => showExport(keys), { autofocus: true })));
    focusFirst();
    return;
  }

  const summary = backup.summarize(chosen);
  const left = backup.ALLOWLIST.filter((key) => !keys.includes(key));
  const field = el('textarea', { class: 'backup-text', id: 'backup-export-text', readonly: '', rows: 3, spellcheck: 'false' });
  field.value = text;
  const status = el('div', { class: 'backup-status', role: 'status' });
  const copy = async () => {
    const ok = await copyText(text, field);
    status.replaceChildren(ok
      ? el('p', { class: 'backup-ok' }, icon('check', 18), el('span', {}, el('strong', {}, 'Progress copied successfully. '), 'Your StudyHub backup is now in your clipboard.'))
      : el('p', { class: 'form-error' }, 'Could not copy automatically. Select the backup text below and press Ctrl+C (⌘C on a Mac).'));
    if (!ok) field.select();
  };

  step('Export progress',
    status,
    el('p', { class: 'backup-lead' }, 'This backup contains:'),
    contentList(summary),
    left.length ? el('p', { class: 'small muted' }, `Not included: ${names(left)}.`) : null,
    keys.includes('notes') ? skippedNotes(summary.notes) : null,
    el('label', { class: 'backup-label', for: 'backup-export-text' }, 'Backup text'),
    field,
    el('p', { class: 'small muted' }, 'To restore it, open StudyHub on the other browser or device, choose Progress Import / Export → Import Progress, paste, and choose what to restore.'),
    actions(button('Change selection', () => showExport(keys)), button('Copy again', copy), button('Done', null, { primary: true, close: true, autofocus: true })));
  await copy();
  focusFirst();
}

/** Notes whose topic is no longer published could not be restored anywhere, so they are not exported — say so. */
function skippedNotes(exported) {
  const skipped = notes.count() - exported;
  if (skipped <= 0) return null;
  const one = skipped === 1;
  return el('p', { class: 'small muted' },
    `${plural(skipped, 'note')} ${one ? 'is' : 'are'} not included because ${one ? 'its topic is' : 'their topics are'} no longer in StudyHub. ${one ? 'It stays' : 'They stay'} in My notes in this browser.`);
}

// ---- Import ---------------------------------------------------------------------------

function showImport(previousText = '') {
  const field = el('textarea', {
    class: 'backup-text', id: 'backup-import-text', rows: 6, spellcheck: 'false', autocomplete: 'off',
    autocapitalize: 'off', 'aria-describedby': 'backup-import-hint backup-import-error', 'data-autofocus': '',
    placeholder: 'STUDYHUB-PROGRESS:v1:…',
  });
  field.value = previousText;
  const error = el('p', { class: 'form-error', id: 'backup-import-error', role: 'alert' });
  const info = el('p', { class: 'small muted', role: 'status' });
  const setError = (message) => {
    error.textContent = message;
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  };
  field.addEventListener('input', () => setError(''));

  // Validates the whole backup (every category, chosen later or not) before anything else.
  const next = button('Continue', async () => {
    next.disabled = true;
    try {
      const parsed = await backup.parseBackup(field.value);
      if (backup.isEmpty(parsed.summary)) throw new backup.BackupError('This backup does not contain any progress to restore.');
      showSelect(parsed, field.value);
    } catch (e) {
      setError(e instanceof backup.BackupError ? e.message : 'Invalid StudyHub progress backup.');
      next.disabled = false;
      field.focus();
    }
  }, { primary: true });

  // Reading the clipboard needs permission; typing Ctrl+V into the box always works.
  const paste = navigator.clipboard?.readText ? button('Paste from clipboard', async () => {
    setError(''); // a new attempt: the previous error no longer applies
    try {
      const text = await navigator.clipboard.readText();
      field.value = text;
      setError('');
      info.textContent = text ? 'Pasted from the clipboard.' : 'The clipboard is empty.';
    } catch {
      info.textContent = 'The browser did not allow reading the clipboard. Click in the box and press Ctrl+V (⌘V on a Mac) instead.';
    }
    field.focus();
  }) : null;

  step('Restore progress',
    el('label', { class: 'backup-label', for: 'backup-import-text' }, 'StudyHub backup'),
    el('p', { class: 'small muted', id: 'backup-import-hint' }, 'Paste the backup text you exported (Ctrl+V, or ⌘V on a Mac). Next you choose what to restore; nothing changes until you confirm.'),
    field,
    error,
    info,
    privacyNote('Your backup is processed locally. Nothing is uploaded.'),
    el('div', { class: 'dialog-actions backup-import-actions' },
      paste, el('span', { class: 'backup-spacer' }), button('Cancel', showChoice), next));
  focusFirst();
}

/** Only the categories the backup really holds can be chosen; nothing is ticked until the learner decides. */
function showSelect(parsed, text, previous = []) {
  const present = parsed.summary.categories;
  const missing = backup.ALLOWLIST.filter((key) => !present.includes(key));
  const current = currentSummary();
  const exported = new Date(parsed.exportedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const review = button('Review import', () => showConfirm(parsed, text, picker.selected()), { primary: true });
  review.setAttribute('aria-describedby', 'backup-import-status');
  const picker = categoryPicker({
    id: 'backup-import',
    legend: 'Categories to restore',
    keys: present,
    checked: previous,
    detail: (key) => `In backup: ${amount(key, parsed.summary) || 'empty'} · here now: ${amount(key, current) || 'none'}`,
    onChange: (keys) => { review.disabled = keys.length === 0; },
  });

  step('Restore progress',
    el('p', {}, `This backup was exported ${exported} and contains ${plural(present.length, 'category', 'categories')}. Choose what to restore.`),
    picker.node,
    el('p', { class: 'small muted' }, 'Categories you do not select stay exactly as they are in this browser.'),
    missing.length ? el('p', { class: 'small muted' }, `Not in this backup (unchanged): ${names(missing)}.`) : null,
    actions(button('Back', () => showImport(text)), button('Cancel', showChoice), review));
  picker.refresh();
  focusFirst('input[type="checkbox"]');
}

// ---- Confirm and restore ---------------------------------------------------------------

/** One line per chosen category: what the backup brings and what it replaces here. */
function changeList(parsed, keys, current) {
  return el('ul', { class: 'backup-contents', role: 'list' }, keys.map((key) => {
    const incoming = amount(key, parsed.summary);
    const now = amount(key, current);
    const effect = !incoming
      ? (now ? `empty in the backup — clears your ${now}` : 'empty in the backup — stays empty')
      : (now ? `${incoming}, replacing your ${now}` : incoming);
    return el('li', {}, icon(incoming ? 'check' : 'info', 16), el('span', {}, el('strong', {}, `${labelOf(key)}: `), effect));
  }));
}

function showConfirm(parsed, text, keys) {
  const current = currentSummary();
  const unchanged = backup.ALLOWLIST.filter((key) => !keys.includes(key));
  const replaces = keys.some((key) => amount(key, current));
  step('Restore StudyHub progress?',
    el('p', { class: 'backup-lead' }, 'You are about to restore:'),
    changeList(parsed, keys, current),
    el('div', { class: 'callout callout-warning backup-warning' },
      el('p', {}, el('strong', {}, 'Each selected category replaces what this browser has for it now. '),
        'Nothing is merged.', replaces ? ' Data replaced here cannot be recovered unless you export it first.' : ''),
      unchanged.length ? el('p', {}, `Not changed: ${names(unchanged)}.`) : null),
    actions(button('Cancel', showChoice), button('Back', () => showSelect(parsed, text, keys), { autofocus: true }),
      button('Confirm import', () => doRestore(parsed, text, keys), { primary: true })));
  focusFirst();
}

function doRestore(parsed, text, keys) {
  if (!backup.restore(parsed.data, keys)) {
    step('Restore failed',
      el('p', { class: 'form-error', role: 'alert' }, 'The backup could not be saved in this browser (storage may be full or blocked). Your current progress was not changed.'),
      actions(button('Back', () => showSelect(parsed, text, keys), { autofocus: true }), button('Close', null, { close: true })));
    focusFirst();
    return;
  }
  const unchanged = backup.ALLOWLIST.filter((key) => !keys.includes(key));
  step('Progress restored',
    el('p', { class: 'backup-ok', role: 'status' }, icon('check', 18), el('span', {}, el('strong', {}, 'Progress restored. '), 'This browser now has:')),
    contentList(parsed.summary, keys),
    unchanged.length ? el('p', { class: 'small muted' }, `Left unchanged: ${names(unchanged)}.`) : null,
    actions(button('Done', null, { primary: true, close: true, autofocus: true })));
  focusFirst();
}
