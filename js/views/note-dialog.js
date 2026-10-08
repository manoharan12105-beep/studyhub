// Note editor and delete confirmation, both inside #note-dialog (index.html).
// The topic a note belongs to is never chosen here: a new note takes the topic
// it was started from, and editing keeps it. Plain text only.
//
// Unsaved text is never dropped silently: Esc, the close button, a backdrop
// click or Cancel first ask "Discard changes?" when the form has been edited.
// Focus returns to the button that opened the dialog — or, when the page
// re-rendered meanwhile, to the button with the same data-focus-key.

import { el, icon, announce } from '../util.js';
import * as notes from '../notes.js';

const PRIVACY = 'Your notes are stored in this browser. Nothing is uploaded.';

let dialog;
let heading;
let body;
let opener = null;
let isDirty = () => false;
let askDiscard = null;
let afterClose = null;

function setup() {
  if (dialog) return;
  dialog = document.getElementById('note-dialog');
  heading = document.getElementById('note-dialog-title');
  body = dialog.querySelector('.dialog-body');
  // 'cancel' fires for Esc, and menu.js also dispatches it for the close button and backdrop.
  dialog.addEventListener('cancel', (event) => {
    if (!isDirty()) return;
    event.preventDefault();
    askDiscard?.();
  });
  dialog.addEventListener('close', () => {
    isDirty = () => false;
    askDiscard = null;
    body.replaceChildren();
    const target = opener?.isConnected ? opener
      : opener?.dataset.focusKey ? document.querySelector(`[data-focus-key="${CSS.escape(opener.dataset.focusKey)}"]`) : null;
    const then = afterClose;
    afterClose = null;
    opener = null;
    if (then) then();
    else (target || document.querySelector('#main h1'))?.focus({ preventScroll: Boolean(target) });
  });
}

function open(title, ...children) {
  setup();
  if (!dialog.open) opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  heading.textContent = title;
  body.replaceChildren(...children.flat().filter(Boolean));
  if (!dialog.open) dialog.showModal();
  (body.querySelector('[data-autofocus]') || body.querySelector('input, textarea, button'))?.focus();
}

function button(label, onClick, { kind = 'secondary', type = 'button', autofocus = false } = {}) {
  const b = el('button', { type, class: `btn btn-${kind}`, 'data-autofocus': autofocus ? '' : null }, label);
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

function privacyNote() {
  return el('p', { class: 'backup-privacy small muted' }, icon('info', 14), el('span', {}, PRIVACY));
}

/** Subject → module → topic of a note, from metadata (ids only are stored). */
function placeLines(topicId) {
  const place = notes.placeOf(topicId);
  if (!place) return el('p', { class: 'notice notice-warning' }, 'This note’s topic is no longer available in StudyHub.');
  return el('dl', { class: 'note-context' },
    el('div', {}, el('dt', {}, 'Topic'), el('dd', {}, place.topic.title)),
    el('div', {}, el('dt', {}, 'Subject'), el('dd', {}, [place.category?.title, place.sub?.title].filter(Boolean).join(' → '))));
}

/**
 * Add a note to a topic (topicId) or edit an existing note (noteId).
 * onSaved(note) runs after the dialog has closed.
 */
export function openNoteEditor({ topicId = null, noteId = null, onSaved = null } = {}) {
  const existing = noteId ? notes.get(noteId) : null;
  if (noteId && !existing) {
    announce('This note no longer exists.');
    return;
  }
  const forTopic = existing ? existing.topicId : topicId;
  if (!existing && !notes.placeOf(forTopic)) return;
  if (!existing && !notes.canAdd()) {
    open('Add note',
      el('p', { role: 'alert' }, `You have ${notes.MAX_NOTES} notes, the most StudyHub keeps in one browser. Delete a note you no longer need, then try again.`),
      el('div', { class: 'dialog-actions' }, el('a', { class: 'btn btn-secondary', href: '#/notes', 'data-close-dialog': '' }, 'My notes'), button('Close', () => dialog.close(), { kind: 'primary', autofocus: true })));
    return;
  }

  const titleInput = el('input', {
    class: 'input', id: 'note-title', type: 'text', maxlength: notes.MAX_TITLE, autocomplete: 'off',
    'aria-describedby': 'note-title-error', 'data-autofocus': '', required: '',
  });
  const contentInput = el('textarea', {
    class: 'input note-textarea', id: 'note-content', rows: 8, maxlength: notes.MAX_CONTENT,
    'aria-describedby': 'note-content-hint note-content-error', required: '',
  });
  titleInput.value = existing?.title || '';
  contentInput.value = existing?.content || '';
  const initial = { title: titleInput.value, content: contentInput.value };
  const titleError = el('p', { class: 'form-error', id: 'note-title-error' });
  const contentError = el('p', { class: 'form-error', id: 'note-content-error' });

  const setError = (input, node, message) => {
    node.textContent = message || '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };
  titleInput.addEventListener('input', () => setError(titleInput, titleError, ''));
  contentInput.addEventListener('input', () => setError(contentInput, contentError, ''));

  const actions = el('div', { class: 'dialog-actions' });
  const showActions = () => actions.replaceChildren(
    button('Cancel', () => (isDirty() ? askDiscard() : dialog.close())),
    button(existing ? 'Save changes' : 'Save note', null, { kind: 'primary', type: 'submit' }));
  showActions();

  isDirty = () => titleInput.value !== initial.title || contentInput.value !== initial.content;
  askDiscard = () => {
    const keep = button('Keep editing', () => { showActions(); contentInput.focus(); }, { autofocus: true });
    actions.replaceChildren(el('div', { class: 'note-discard', role: 'group', 'aria-labelledby': 'note-discard-q' },
      el('p', { id: 'note-discard-q', class: 'note-discard-q' }, existing ? 'Discard your changes?' : 'Discard this note?'),
      el('div', { class: 'note-discard-actions' }, keep, button('Discard', () => { isDirty = () => false; dialog.close(); }, { kind: 'danger' }))));
    keep.focus();
    announce(existing ? 'Discard your changes?' : 'Discard this note?');
  };

  const form = el('form', { class: 'note-form', novalidate: '' },
    placeLines(forTopic),
    el('div', { class: 'field' }, el('label', { for: 'note-title' }, 'Title'), titleInput, titleError),
    el('div', { class: 'field' },
      el('label', { for: 'note-content' }, 'Note'),
      el('span', { class: 'field-hint', id: 'note-content-hint' }, 'Plain text. Line breaks are kept.'),
      contentInput, contentError),
    privacyNote(),
    actions);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = { title: titleInput.value, content: contentInput.value };
    const errors = notes.check(values);
    setError(titleInput, titleError, errors.title);
    setError(contentInput, contentError, errors.content);
    if (errors.title || errors.content) {
      (errors.title ? titleInput : contentInput).focus();
      announce(errors.title || errors.content);
      return;
    }
    const saved = existing ? notes.edit(existing.id, values) : notes.add(forTopic, values);
    if (!saved) {
      setError(contentInput, contentError, 'The note could not be saved in this browser. Your text is still here.');
      contentInput.focus();
      return;
    }
    isDirty = () => false;
    if (onSaved) afterClose = () => onSaved(saved);
    dialog.close();
    announce(existing ? 'Note updated.' : 'Note saved.');
  });

  open(existing ? 'Edit note' : 'Add note', form);
}

/** Ask before deleting. onDeleted() runs after the dialog has closed (e.g. to leave the note's page). */
export function confirmDeleteNote(noteId, { onDeleted = null } = {}) {
  const note = notes.get(noteId);
  if (!note) return;
  open('Delete this note?',
    el('p', { class: 'note-delete-title' }, `“${note.title}”`),
    el('p', {}, 'This action cannot be undone.'),
    el('div', { class: 'dialog-actions' },
      button('Cancel', () => dialog.close(), { autofocus: true }),
      button('Delete', () => {
        notes.remove(note.id);
        if (onDeleted) afterClose = onDeleted;
        dialog.close();
        announce('Note deleted.');
      }, { kind: 'danger' })));
}
