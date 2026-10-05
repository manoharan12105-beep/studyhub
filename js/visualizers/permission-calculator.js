// Linux permissions: octal ↔ symbolic, and how the kernel decides an access.
//
//   mode (octal or checkboxes) + who + operation → steps:
//   identify the user → pick ONE class (owner, else group, else others) → test one bit → allowed/denied
//
// The point the steps make: only the first matching class is checked, so an
// owner with fewer rights than "others" is still refused, and the meaning of
// r/w/x depends on whether the object is a file or a directory.

import { el } from '../util.js';
import { createStepper, field, errorLine } from '../engagement/stepper.js';

const CLASSES = [['owner', 'Owner (u)'], ['group', 'Group (g)'], ['others', 'Others (o)']];
const BITS = [['r', 4], ['w', 2], ['x', 1]];
const SPECIAL = [['suid', 'SUID', 4], ['sgid', 'SGID', 2], ['sticky', 'Sticky', 1]];

const WHO = {
  owner: 'student — the owner',
  group: 'priya — member of group dev',
  others: 'guest — neither owner nor in dev',
  root: 'root (UID 0)',
};
const OPS = {
  file: { r: 'Read it (cat app.conf)', w: 'Modify it (echo x >> app.conf)', x: 'Execute it (./app.conf)' },
  dir: { r: 'List it (ls shared)', w: 'Create or delete files in it (touch shared/new)', x: 'Enter it (cd shared)' },
};
const MEANING = {
  file: { r: 'read the contents', w: 'change the contents', x: 'run it as a program' },
  dir: { r: 'list the names inside', w: 'create, delete and rename entries (together with x)', x: 'enter it and reach entries by name' },
};

export function mount(root, { options }) {
  const octal = el('input', { class: 'input', inputmode: 'numeric', maxlength: 4, autocomplete: 'off', spellcheck: 'false', value: options.mode || '754' });
  const kind = select({ file: 'Regular file (app.conf)', dir: 'Directory (shared/)' }, options.kind || 'file');
  const who = select(WHO, options.who || 'group');
  const op = el('select', { class: 'select' });
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' },
    field('Mode (octal)', octal, '3 or 4 digits, e.g. 640, 755, 1777'),
    field('Object', kind), field('Who', who), field('Wants to', op)), error.node);

  // The 3×3 grid of checkboxes, plus the special bits, kept in sync with the octal box.
  const boxes = {};
  const grid = el('table', { class: 'viz-table perm-grid' },
    el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Class'), BITS.map(([b, v]) => el('th', { scope: 'col' }, `${b} (${v})`)), el('th', { scope: 'col' }, 'Digit'))),
    el('tbody', {}, CLASSES.map(([c, label]) => el('tr', { 'data-class': c },
      el('th', { scope: 'row' }, label),
      BITS.map(([b]) => {
        const box = el('input', { type: 'checkbox', 'aria-label': `${label} ${b}` });
        boxes[`${c}-${b}`] = box;
        return el('td', {}, box);
      }),
      el('td', { class: 'perm-digit' })))));
  const specials = el('div', { class: 'perm-specials', role: 'group', 'aria-label': 'Special bits' },
    SPECIAL.map(([id, label, v]) => {
      const box = el('input', { type: 'checkbox', id: `perm-${id}-${Math.random().toString(36).slice(2, 7)}` });
      boxes[id] = box;
      return el('label', { class: 'perm-special', for: box.id }, box, ` ${label} (${v})`);
    }));
  const summary = el('p', { class: 'perm-summary' });
  root.append(el('div', { class: 'viz-stage' },
    el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'Permission bits' }, grid), specials, summary));
  const stepper = createStepper(root, { render, nextLabel: 'Next check' });

  function fillOps() {
    const current = op.value || options.op || 'r';
    op.replaceChildren(...Object.entries(OPS[kind.value]).map(([v, l]) => el('option', { value: v }, l)));
    op.value = current;
  }

  function modeFromBoxes() {
    const digit = (c) => BITS.reduce((n, [b, v]) => n + (boxes[`${c}-${b}`].checked ? v : 0), 0);
    const special = SPECIAL.reduce((n, [id, , v]) => n + (boxes[id].checked ? v : 0), 0);
    return { special, digits: CLASSES.map(([c]) => digit(c)) };
  }

  function setBoxes({ special, digits }) {
    CLASSES.forEach(([c], i) => BITS.forEach(([b, v]) => { boxes[`${c}-${b}`].checked = (digits[i] & v) !== 0; }));
    SPECIAL.forEach(([id, , v]) => { boxes[id].checked = (special & v) !== 0; });
  }

  function start() {
    const mode = modeFromBoxes();
    CLASSES.forEach(([c], i) => { grid.querySelector(`tr[data-class="${c}"] .perm-digit`).textContent = String(mode.digits[i]); });
    const text = symbolic(mode, kind.value);
    const oct = `${mode.special || ''}${mode.digits.join('')}`;
    summary.replaceChildren(el('code', {}, text), '  =  ', el('code', {}, `chmod ${oct.padStart(3, '0')}`), el('span', { class: 'muted' }, `  ${describeSpecial(mode, kind.value)}`));
    stepper.load(...buildFrames(mode, kind.value, who.value, op.value));
  }

  function render(frame) {
    for (const tr of grid.tBodies[0].rows) {
      const c = tr.dataset.class;
      tr.className = [frame.checked === c ? 'is-current' : '', frame.skipped.includes(c) ? 'is-skipped' : ''].join(' ');
      for (const [b] of BITS) {
        const td = boxes[`${c}-${b}`].parentElement;
        td.className = frame.checked === c && frame.bit === b ? (frame.verdict === 'allowed' ? 'perm-hit is-ok' : frame.verdict === 'denied' ? 'perm-hit is-bad' : 'perm-hit') : '';
      }
    }
  }

  octal.addEventListener('input', () => {
    const value = octal.value.trim();
    if (!/^[0-7]{3,4}$/.test(value)) {
      error.show('Enter 3 or 4 octal digits (0–7), for example 644 or 2775.');
      return;
    }
    error.clear();
    const digits = value.slice(-3).split('').map(Number);
    setBoxes({ special: value.length === 4 ? Number(value[0]) : 0, digits });
    start();
  });
  root.addEventListener('change', (event) => {
    if (event.target.type === 'checkbox') {
      const mode = modeFromBoxes();
      octal.value = `${mode.special || ''}${mode.digits.join('')}`;
      error.clear();
    }
    if (event.target === kind) fillOps();
    start();
  });

  fillOps();
  setBoxes(parseOctal(octal.value) || { special: 0, digits: [7, 5, 4] });
  start();
  return stepper;
}

function select(options, value) {
  const s = el('select', { class: 'select' }, Object.entries(options).map(([v, l]) => el('option', { value: v }, l)));
  s.value = value;
  return s;
}

function parseOctal(value) {
  if (!/^[0-7]{3,4}$/.test(value)) return null;
  return { special: value.length === 4 ? Number(value[0]) : 0, digits: value.slice(-3).split('').map(Number) };
}

/** ls -l style string, including s/S and t/T for the special bits. */
export function symbolic({ special, digits }, kind) {
  const out = [kind === 'dir' ? 'd' : '-'];
  digits.forEach((d, i) => {
    out.push(d & 4 ? 'r' : '-', d & 2 ? 'w' : '-');
    const x = (d & 1) !== 0;
    const flag = [special & 4, special & 2, special & 1][i];
    const letter = i === 2 ? 't' : 's';
    out.push(flag ? (x ? letter : letter.toUpperCase()) : (x ? 'x' : '-'));
  });
  return out.join('');
}

function describeSpecial({ special, digits }, kind) {
  const notes = [];
  if (special & 4) notes.push(kind === 'file' ? 'SUID: runs with the owner’s privileges' : 'SUID has no effect on directories');
  if (special & 2) notes.push(kind === 'file' ? 'SGID: runs with the file’s group' : 'SGID: new files inherit the directory’s group');
  if (special & 1) notes.push(kind === 'dir' ? 'Sticky: only owners may delete their files' : 'Sticky has no effect on files today');
  if ((special & 4 && !(digits[0] & 1)) || (special & 2 && !(digits[1] & 1)) || (special & 1 && !(digits[2] & 1))) notes.push('capital S/T = special bit set without x');
  return notes.join(' · ');
}

/** The access check as a list of frames. */
export function buildFrames(mode, kind, who, op) {
  const [label] = WHO[who].split(' — ');
  const bitValue = { r: 4, w: 2, x: 1 }[op];
  const opText = MEANING[kind][op];
  const base = { checked: null, bit: op, skipped: [], verdict: null };
  const first = { ...base, text: `${label} wants to ${opText} — the ${kind === 'dir' ? 'directory' : 'file'} has mode ${symbolic(mode, kind)}. The kernel checks exactly one class.` };

  if (who === 'root') {
    const rootAllowed = op !== 'x' || kind === 'dir' || mode.digits.some((d) => d & 1);
    return [first, [{
      ...base, verdict: rootAllowed ? 'allowed' : 'denied',
      text: rootAllowed
        ? 'UID 0 skips the read/write permission checks entirely — allowed. (Root is still limited by read-only mounts, the immutable attribute and SELinux/AppArmor.)'
        : 'Even root cannot execute a file that has no x bit for anyone — denied. For read and write, root bypasses the bits.',
    }]];
  }

  const order = ['owner', 'group', 'others'];
  const index = order.indexOf(who);
  const frames = [];
  order.slice(0, index).forEach((c, i) => {
    frames.push({ ...base, skipped: order.slice(0, i + 1), text: c === 'owner'
      ? `Is ${label} the owner (student)? No — skip the owner bits.`
      : `Is ${label} in the file’s group (dev)? No — skip the group bits.` });
  });
  const classIndex = index;
  const has = (mode.digits[classIndex] & bitValue) !== 0;
  const classLabel = { owner: 'owner', group: 'group', others: 'others' }[who];
  frames.push({ ...base, checked: who, skipped: order.slice(0, index), text: who === 'others'
    ? `${label} matches neither owner nor group, so the "others" bits decide: ${triple(mode.digits[2])}.`
    : `${label} is ${who === 'owner' ? 'the owner' : 'in group dev'}, so ONLY the ${classLabel} bits apply: ${triple(mode.digits[classIndex])}. The remaining classes are not consulted.` });

  let text = has
    ? `The ${op} bit is set for ${classLabel} — allowed: ${label} may ${opText}.`
    : `The ${op} bit is not set for ${classLabel} — denied ("Permission denied").`;
  if (!has && who !== 'others' && order.slice(index + 1).some((_, j) => mode.digits[index + 1 + j] & bitValue)) {
    text += ' Note: a later class has this bit, but it does not matter — only the first matching class counts.';
  }
  if (kind === 'dir' && op === 'w' && has && !(mode.digits[classIndex] & 1)) {
    text = `The w bit is set for ${classLabel}, but without x the directory cannot be entered, so creating or deleting files still fails — denied in practice. Directories need w and x together.`;
    frames.push({ ...base, checked: who, skipped: order.slice(0, index), verdict: 'denied', text });
  } else {
    frames.push({ ...base, checked: who, skipped: order.slice(0, index), verdict: has ? 'allowed' : 'denied', text });
  }
  if (kind === 'file' && op === 'w' && has) {
    frames.push({ ...base, checked: who, skipped: order.slice(0, index), verdict: 'allowed', text: 'Remember: changing a file’s contents needs w on the file, but deleting or renaming it needs w and x on the directory that contains it.' });
  }
  return [first, frames];
}

function triple(d) {
  return `${d & 4 ? 'r' : '-'}${d & 2 ? 'w' : '-'}${d & 1 ? 'x' : '-'}`;
}
