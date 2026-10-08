// Progress Import / Export dialog (opened from the header menu).
// Steps, all inside #backup-dialog: choose → exported | paste → confirm → restored.
// The logic (allowlist, encoding, validation, atomic restore) is in js/backup.js.

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

/** Only what is really in the data, in plain words. */
function contents(summary) {
  return [
    summary.completed && plural(summary.completed, 'completed topic'),
    summary.inProgress && `${plural(summary.inProgress, 'topic')} in progress`,
    summary.bookmarks && plural(summary.bookmarks, 'bookmark'),
    summary.history && plural(summary.history, 'recently studied page'),
    summary.answers && `${plural(summary.answers, 'recorded answer')} (practice, interview, flashcards, knowledge checks)`,
    summary.plans && plural(summary.plans, 'study plan'),
    summary.notes && plural(summary.notes, 'note'),
  ].filter(Boolean);
}

function contentList(summary) {
  return el('ul', { class: 'backup-contents', role: 'list' },
    contents(summary).map((text) => el('li', {}, icon('check', 16), el('span', {}, text))));
}

function actions(...buttons) {
  return el('div', { class: 'dialog-actions' }, buttons);
}

function button(label, onClick, { primary = false, autofocus = false, close = false } = {}) {
  const b = el('button', {
    type: 'button', class: `btn ${primary ? 'btn-primary' : 'btn-secondary'}`,
    'data-autofocus': autofocus ? '' : null, 'data-close-dialog': close ? '' : null,
  }, label);
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

function privacyNote(text = PRIVACY) {
  return el('p', { class: 'backup-privacy small muted' }, icon('info', 14), el('span', {}, text));
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
    el('p', {}, 'Back up or restore your StudyHub learning progress, for example to continue on another browser or device.'),
    el('div', { class: 'backup-choices' },
      choice('copy', 'Export Progress', 'Copy a backup to the clipboard', showExport, true),
      choice('transfer', 'Import Progress', 'Paste a backup to restore it', () => showImport())),
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

async function showExport() {
  const data = backup.currentData();
  const summary = backup.summarize(data);
  if (backup.isEmpty(summary)) {
    step('Export progress',
      el('p', { role: 'status' }, 'There is no progress to back up yet. Open a topic, add a bookmark or answer a question first.'),
      actions(button('Back', showChoice, { autofocus: true }), button('Close', null, { close: true })));
    focusFirst();
    return;
  }

  let text;
  try {
    text = await backup.createBackup(data);
  } catch {
    step('Export progress',
      el('p', { class: 'form-error', role: 'alert' }, 'The backup could not be created in this browser. Your progress was not changed.'),
      actions(button('Back', showChoice, { autofocus: true })));
    focusFirst();
    return;
  }

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
    el('p', { class: 'small muted' }, 'Theme and layout settings are not included — they stay with each browser.'),
    skippedNotes(summary.notes),
    el('label', { class: 'backup-label', for: 'backup-export-text' }, 'Backup text'),
    field,
    el('p', { class: 'small muted' }, 'To restore it, open StudyHub on the other browser or device, choose Progress Import / Export → Import Progress, and paste.'),
    actions(button('Copy again', copy), button('Done', null, { primary: true, close: true, autofocus: true })));
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

  const restore = button('Restore progress', async () => {
    restore.disabled = true;
    try {
      const parsed = await backup.parseBackup(field.value);
      if (backup.isEmpty(parsed.summary)) throw new backup.BackupError('This backup does not contain any progress to restore.');
      showConfirm(parsed, field.value);
    } catch (e) {
      setError(e instanceof backup.BackupError ? e.message : 'Invalid StudyHub progress backup.');
      restore.disabled = false;
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
    el('p', { class: 'small muted', id: 'backup-import-hint' }, 'Paste the backup text you exported (Ctrl+V, or ⌘V on a Mac).'),
    field,
    error,
    info,
    privacyNote('Your backup is processed locally. Nothing is uploaded.'),
    el('div', { class: 'dialog-actions backup-import-actions' },
      paste, el('span', { class: 'backup-spacer' }), button('Cancel', showChoice), restore));
  focusFirst();
}

// ---- Confirm and restore ---------------------------------------------------------------

function showConfirm(parsed, text) {
  const current = backup.summarize(backup.currentData());
  // A backup made before study plans (or notes) existed leaves this browser's plans (or notes) alone.
  const keepsPlans = !parsed.summary.plansIncluded && current.plans > 0;
  const keepsNotes = !parsed.summary.notesIncluded && current.notes > 0;
  const now = contents({ ...current, plans: keepsPlans ? 0 : current.plans, notes: keepsNotes ? 0 : current.notes });
  const exported = new Date(parsed.exportedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  step('Restore StudyHub progress?',
    el('p', { class: 'backup-lead' }, `This backup (exported ${exported}) contains:`),
    contentList(parsed.summary),
    el('div', { class: 'callout callout-warning backup-warning' },
      el('p', {}, el('strong', {}, 'Restoring replaces your current StudyHub progress in this browser. '),
        now.length ? `It currently has ${now.join(', ')}.` : 'There is no progress here yet.'),
      keepsPlans ? el('p', {}, `This backup was made before study plans existed, so your ${current.plans === 1 ? 'study plan stays' : `${current.plans} study plans stay`} as they are.`) : null,
      keepsNotes ? el('p', {}, `This backup was made before notes existed, so your ${current.notes === 1 ? 'note stays' : `${current.notes} notes stay`} as they are.`) : null),
    actions(button('Cancel', () => showImport(text), { autofocus: true }), button('Restore', () => doRestore(parsed, text), { primary: true })));
  focusFirst();
}

function doRestore(parsed, text) {
  if (!backup.restore(parsed.data)) {
    step('Restore failed',
      el('p', { class: 'form-error', role: 'alert' }, 'The backup could not be saved in this browser (storage may be full or blocked). Your current progress was not changed.'),
      actions(button('Back', () => showImport(text), { autofocus: true }), button('Close', null, { close: true })));
    focusFirst();
    return;
  }
  step('Progress restored',
    el('p', { class: 'backup-ok', role: 'status' }, icon('check', 18), el('span', {}, el('strong', {}, 'Progress restored. '), 'This browser now has:')),
    contentList(parsed.summary),
    actions(button('Done', null, { primary: true, close: true, autofocus: true })));
  focusFirst();
}
