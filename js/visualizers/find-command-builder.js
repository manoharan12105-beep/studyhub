// Build a find command and watch it test every entry of the practice lab.
//
//   form (name, type, size, age, action) → command → one step per entry:
//   each test runs left to right; the first failing test rejects the entry
//
// The lab listing (sizes, modes, ages) was captured from a real ~/linux-lab;
// the matching rules follow GNU find: globs on the base name, -size rounds the
// file size UP to whole units, -mtime counts whole 24-hour periods.

import { el } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper, field, errorLine } from '../engagement/stepper.js';

// [type, size in bytes, age in days, path]   (directories: 4096 bytes on ext4)
const LAB = [
  ['d', 4096, 0, '.'],
  ['f', 790, 0, './access.log'],
  ['f', 765, 0, './app.log'],
  ['d', 4096, 0, './config'],
  ['f', 119, 0, './config/app.conf'],
  ['f', 40, 0, './config/db.conf'],
  ['f', 275, 0, './employees.csv'],
  ['f', 45, 0, './fruits.txt'],
  ['f', 26, 0, './list1.txt'],
  ['f', 26, 0, './list2.txt'],
  ['d', 4096, 0, './logs'],
  ['f', 32, 20, './logs/app-2026-01-01.log'],
  ['f', 68, 10, './logs/app-2026-01-08.log'],
  ['f', 32, 2, './logs/app-2026-01-14.log'],
  ['d', 4096, 0, './logs/archive'],
  ['f', 69, 30, './logs/archive/app-2025-12-01.log.gz'],
  ['f', 3145728, 0, './logs/debug.log'],
  ['f', 147, 0, './notes.txt'],
  ['f', 17, 0, './numbers.txt'],
  ['d', 4096, 0, './project'],
  ['f', 16, 0, './project/.gitignore'],
  ['f', 63, 0, './project/build.sh'],
  ['d', 4096, 0, './project/docs'],
  ['f', 15, 0, './project/docs/design.md'],
  ['f', 64, 0, './project/readme.md'],
  ['d', 4096, 0, './project/src'],
  ['f', 45, 0, './project/src/Main.java'],
  ['f', 46, 0, './project/src/Order.java'],
  ['f', 53, 0, './project/src/OrderService.java'],
  ['f', 55, 0, './project/src/PaymentService.java'],
  ['d', 4096, 0, './project/test'],
  ['f', 34, 0, './project/test/OrderServiceTest.java'],
  ['f', 74, 0, './v1.txt'],
  ['f', 96, 0, './v2.txt'],
];

const UNITS = { c: 1, k: 1024, M: 1024 * 1024, G: 1024 ** 3 };

export function mount(root, { options }) {
  const name = el('input', { class: 'input', autocomplete: 'off', spellcheck: 'false', value: options.name ?? '*.log' });
  const nameMode = select({ name: '-name (case-sensitive)', iname: '-iname (ignore case)' }, 'name');
  const type = select({ any: 'any', f: '-type f (files)', d: '-type d (directories)' }, options.type || 'f');
  const size = el('input', { class: 'input', autocomplete: 'off', spellcheck: 'false', value: options.size ?? '' });
  const age = select({ any: 'any', '-3': '-mtime -3 (changed < 3 days ago)', '+7': '-mtime +7 (older than 7 days)', '-14': '-mtime -14', '+25': '-mtime +25' }, options.mtime || 'any');
  const action = select({ print: '-print (default)', delete: '-delete' }, 'print');
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' },
    field('Name pattern', name, 'Glob like *.java or readme*; empty = any'), field('Match', nameMode),
    field('Type', type), field('Size', size, 'e.g. +1M, -100c, +1k; empty = any'), field('Modified', age), field('Action', action)), error.node);

  const cmd = el('pre', { class: 'mini-code', tabindex: 0 });
  const table = el('table', { class: 'viz-table' });
  const out = el('pre', { class: 'mini-code term-out find-output', tabindex: 0, 'aria-label': 'Output so far' });
  const warn = el('p', { class: 'viz-note' });
  root.append(el('div', { class: 'code-block' }, cmd), el('div', { class: 'viz-stage' },
    el('div', { class: 'table-wrap find-table', tabindex: 0, role: 'region', 'aria-label': 'Entries in ~/linux-lab' }, table),
    el('p', { class: 'tree-side-title' }, 'Output'), out, warn));
  const stepper = createStepper(root, { render, playDelay: 700, nextLabel: 'Next entry' });

  function start() {
    const sizeText = size.value.trim();
    if (sizeText && !/^[+-]?\d+[ckMG]?$/.test(sizeText)) {
      error.show('Size must look like +1M, -100c, 10k (+ more than, - less than; c bytes, k KiB, M MiB, G GiB).');
      return;
    }
    if (/[/]/.test(name.value)) {
      error.show('-name matches only the last part of a path, so a pattern containing / never matches. Use -path for that.');
      return;
    }
    error.clear();
    const tests = buildTests({ name: name.value.trim(), nameMode: nameMode.value, type: type.value, size: sizeText, age: age.value });
    const parts = ['find', '.', ...tests.map((t) => t.arg)];
    if (action.value === 'delete') parts.push('-delete');
    cmd.innerHTML = highlight(parts.join(' '), 'bash');
    warn.textContent = action.value === 'delete'
      ? 'Simulation only: -delete removes every match without asking. On a real system run the same command with -print first and check the list.'
      : 'Real find prints in directory order, which varies between systems; here entries are walked in sorted order.';
    stepper.load(...buildFrames(tests, action.value));
  }

  function render(frame) {
    table.replaceChildren(
      el('thead', {}, el('tr', {}, ['Type', 'Size', 'Age (days)', 'Path', 'Result'].map((h) => el('th', { scope: 'col' }, h)))),
      el('tbody', {}, LAB.map(([t, bytes, days, p], i) => el('tr', { class: [i === frame.index ? 'is-current' : '', frame.results[i] === true ? 'is-matched' : ''].join(' ') },
        el('td', {}, t), el('td', {}, String(bytes)), el('td', {}, String(days)), el('td', {}, p),
        el('td', {}, frame.results[i] === undefined ? '' : frame.results[i] === true ? (frame.action === 'delete' ? 'deleted' : 'printed') : frame.results[i])))));
    out.textContent = frame.output.length ? frame.output.join('\n') : '(nothing yet)';
    const current = table.tBodies[0].rows[frame.index];
    if (current && frame.index > 0) current.scrollIntoView({ block: 'nearest' });
  }

  for (const c of [nameMode, type, age, action]) c.addEventListener('change', start);
  for (const c of [name, size]) c.addEventListener('input', start);
  start();
  return stepper;
}

function select(options, value) {
  const s = el('select', { class: 'select' }, Object.entries(options).map(([v, l]) => el('option', { value: v }, l)));
  s.value = value;
  return s;
}

export function buildTests({ name, nameMode, type, size, age }) {
  const tests = [];
  if (name) {
    const re = globToRegExp(name, nameMode === 'iname');
    tests.push({ arg: `-${nameMode} '${name}'`, run: ([, , , p]) => re.test(baseName(p)) || `name ${baseName(p)} ≠ ${name}` });
  }
  if (type !== 'any') {
    tests.push({ arg: `-type ${type}`, run: ([t]) => t === type || `type is ${t}` });
  }
  if (size) {
    const [, sign, num, unit = 'b'] = size.match(/^([+-]?)(\d+)([ckMG]?)$/);
    const n = Number(num);
    const unitBytes = unit === 'b' || unit === '' ? 512 : UNITS[unit];
    tests.push({
      arg: `-size ${size}`,
      run: ([, bytes]) => {
        // GNU find rounds the size UP to whole units before comparing.
        const units = unit === 'c' ? bytes : Math.ceil(bytes / unitBytes);
        const ok = sign === '+' ? units > n : sign === '-' ? units < n : units === n;
        return ok || `${units} ${unit === 'c' ? 'bytes' : `${unit === 'b' || !unit ? '512-byte block' : unit} unit`}${units === 1 || unit === 'c' ? '' : 's'} (rounded up)`;
      },
    });
  }
  if (age !== 'any') {
    const sign = age[0];
    const n = Number(age.slice(1));
    tests.push({ arg: `-mtime ${age}`, run: ([, , days]) => (sign === '+' ? days > n : days < n) || `age ${days} d` });
  }
  return tests;
}

export function buildFrames(tests, action) {
  const results = [];
  const output = [];
  const frames = [];
  const desc = tests.length ? tests.map((t) => t.arg).join(' AND ') : 'no tests (everything matches)';
  const first = { index: -1, results: [], output: [], action, text: `find walks the tree from "." and tests every entry: ${desc}. Tests run left to right and stop at the first one that fails.` };
  LAB.forEach((entry, i) => {
    let verdict = true;
    for (const t of tests) {
      const r = t.run(entry);
      if (r !== true) { verdict = `✗ ${t.arg.split(' ')[0]}: ${r}`; break; }
    }
    results[i] = verdict;
    if (verdict === true) output.push(entry[3]);
    const skipDelete = action === 'delete' && verdict === true && entry[0] === 'd' && entry[3] === '.';
    frames.push({
      index: i, results: results.slice(), output: output.slice(), action,
      text: verdict === true
        ? `${entry[3]} passes every test → ${action === 'delete' ? (skipDelete ? 'matched, but find never deletes the starting point "."' : 'deleted (-delete also implies -depth, so contents go before their directory)') : 'printed'}.`
        : `${entry[3]}: ${verdict.slice(2)} — rejected.`,
    });
  });
  frames.push({ index: -1, results: results.slice(), output: output.slice(), action,
    text: `Done: ${output.length} match${output.length === 1 ? '' : 'es'} out of ${LAB.length} entries.${tests.some((t) => t.arg.startsWith('-size -1k')) ? ' Note: -size -1k matches only EMPTY files, because any non-empty file rounds up to at least 1k.' : ''}` });
  return [first, frames];
}

function baseName(p) {
  return p === '.' ? '.' : p.slice(p.lastIndexOf('/') + 1);
}

/** Shell glob → RegExp: * ? [abc] [!abc]; a leading dot is not special for find. */
export function globToRegExp(glob, ignoreCase) {
  let re = '';
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    if (c === '*') re += '.*';
    else if (c === '?') re += '.';
    else if (c === '[') {
      const end = glob.indexOf(']', i + 2);
      if (end === -1) { re += '\\['; continue; }
      let body = glob.slice(i + 1, end);
      if (body[0] === '!') body = `^${body.slice(1)}`;
      re += `[${body.replace(/\\/g, '\\\\')}]`;
      i = end;
    } else re += c.replace(/[.+^${}()|\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`, ignoreCase ? 'i' : '');
}
