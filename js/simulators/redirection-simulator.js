// Where do stdout and stderr go? File descriptors, left to right.
//
//   redirection → shell sets up fd 1 and fd 2 (one operator at a time) → ls runs →
//   each line lands where its descriptor points → terminal + files
//
// The command lists one file that exists and one that does not, so it writes one
// line to stdout and one to stderr. Every result was checked by running it in
// the practice lab.

import { el } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper, field } from '../engagement/stepper.js';

const OUT_LINE = 'app.log';
const ERR_LINE = "ls: cannot access 'nosuchfile': No such file or directory";
const TERM = 'terminal';

// Each operator: [text, (fds, files) => explanation]; applied left to right.
const OPS = {
  '> out.txt': (fds, files) => { truncate(files, 'out.txt'); fds[1] = 'out.txt'; return 'Open out.txt for writing (create it or empty it) and point fd 1 (stdout) at it.'; },
  '>> out.txt': (fds, files) => { if (!files['out.txt']) files['out.txt'] = []; fds[1] = 'out.txt'; return 'Open out.txt for appending — existing content is kept — and point fd 1 at it.'; },
  '2> err.txt': (fds, files) => { truncate(files, 'err.txt'); fds[2] = 'err.txt'; return 'Open err.txt (create or empty it) and point fd 2 (stderr) at it.'; },
  '2>&1': (fds) => { fds[2] = fds[1]; return `Make fd 2 point wherever fd 1 points RIGHT NOW: ${label(fds[1])}. It copies the current target; it does not follow fd 1 later.`; },
  '2>/dev/null': (fds) => { fds[2] = '/dev/null'; return 'Point fd 2 at /dev/null, which discards everything written to it.'; },
  '&> all.txt': (fds, files) => { truncate(files, 'all.txt'); fds[1] = 'all.txt'; fds[2] = 'all.txt'; return 'Bash shorthand: open all.txt and point both fd 1 and fd 2 at it (same as > all.txt 2>&1).'; },
  '| wc -l': (fds) => { fds[1] = 'pipe'; return 'A pipe: fd 1 of ls is connected to the stdin of wc -l. Only stdout enters the pipe; fd 2 is unchanged.'; },
};

const SCENARIOS = {
  none: { ops: [] },
  out: { ops: ['> out.txt'] },
  err: { ops: ['2> err.txt'] },
  both: { ops: ['> out.txt', '2>&1'] },
  wrong: { ops: ['2>&1', '> out.txt'] },
  amp: { ops: ['&> all.txt'] },
  devnull: { ops: ['2>/dev/null'] },
  split: { ops: ['> out.txt', '2> err.txt'] },
  append: { ops: ['>> out.txt'], pre: ['first line'] },
  pipe: { ops: ['| wc -l'] },
  pipeboth: { ops: ['| wc -l', '2>&1'], display: '2>&1 | wc -l' },
};
const LABELS = {
  none: 'ls app.log nosuchfile', out: '… > out.txt', err: '… 2> err.txt', both: '… > out.txt 2>&1', wrong: '… 2>&1 > out.txt (wrong order)',
  amp: '… &> all.txt', devnull: '… 2>/dev/null', split: '… > out.txt 2> err.txt', append: '… >> out.txt (file already has a line)',
  pipe: '… | wc -l', pipeboth: '… 2>&1 | wc -l',
};

export function mount(root, { options }) {
  const choice = el('select', { class: 'select' }, Object.entries(LABELS).map(([v, l]) => el('option', { value: v }, l)));
  choice.value = SCENARIOS[options.scenario] ? options.scenario : 'both';
  root.append(el('div', { class: 'viz-form' }, field('Redirection', choice)));

  const cmd = el('pre', { class: 'mini-code', tabindex: 0 });
  const fdTable = el('table', { class: 'viz-table' });
  const term = el('pre', { class: 'mini-code term-out', tabindex: 0, 'aria-label': 'Terminal' });
  const filesBox = el('div', { class: 'redir-files' });
  root.append(el('div', { class: 'code-block' }, cmd), el('div', { class: 'viz-stage join-stage' },
    el('div', {}, el('p', { class: 'tree-side-title' }, 'File descriptors of ls'), el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'File descriptor table' }, fdTable)),
    el('div', {}, el('p', { class: 'tree-side-title' }, 'Terminal'), term),
    el('div', { class: 'join-result' }, el('p', { class: 'tree-side-title' }, 'Files'), filesBox)));
  const stepper = createStepper(root, { render, playDelay: 1800, nextLabel: 'Next step' });

  function start() {
    const s = SCENARIOS[choice.value];
    const display = s.display || s.ops.join(' ');
    cmd.innerHTML = highlight(`${s.pre ? 'echo "first line" > out.txt\n' : ''}ls app.log nosuchfile${display ? ` ${display}` : ''}`, 'bash');
    stepper.load(...buildFrames(s));
  }

  function render(frame) {
    fdTable.replaceChildren(
      el('thead', {}, el('tr', {}, ['fd', 'Stream', 'Points to'].map((h) => el('th', { scope: 'col' }, h)))),
      el('tbody', {}, [[0, 'stdin'], [1, 'stdout'], [2, 'stderr']].map(([fd, name]) => el('tr', { class: frame.changed.includes(fd) ? 'is-current' : '' },
        el('td', {}, String(fd)), el('td', {}, name), el('td', {}, label(frame.fds[fd]))))));
    term.textContent = frame.terminal.length ? frame.terminal.join('\n') : ' ';
    const names = Object.keys(frame.files);
    filesBox.replaceChildren(...(names.length ? names.map((n) => el('div', { class: 'redir-file' },
      el('p', { class: 'redir-file-name' }, n), el('pre', { class: 'mini-code term-out' }, frame.files[n].length ? frame.files[n].join('\n') : '(empty)')))
      : [el('p', { class: 'muted' }, 'No files involved.')]));
  }

  choice.addEventListener('change', start);
  start();
  return stepper;
}

function truncate(files, name) { files[name] = []; }

function label(target) {
  if (target === TERM) return 'terminal';
  if (target === 'pipe') return 'pipe → wc -l';
  return target;
}

export function buildFrames(s) {
  const fds = { 0: TERM, 1: TERM, 2: TERM };
  const files = s.pre ? { 'out.txt': s.pre.slice() } : {};
  const terminal = [];
  const snap = (text, changed = []) => ({ text, changed, fds: { ...fds }, files: JSON.parse(JSON.stringify(files)), terminal: terminal.slice() });
  const first = snap(s.ops.length
    ? `Before ls starts, the shell processes the redirections from left to right. All three descriptors start on the terminal.${s.pre ? ' out.txt already contains one line.' : ''}`
    : 'No redirection: stdin, stdout and stderr all stay connected to the terminal.');
  const frames = [];

  // A pipe is set up before the other redirections of the same command.
  const ordered = s.ops.includes('| wc -l') ? ['| wc -l', ...s.ops.filter((o) => o !== '| wc -l')] : s.ops;
  for (const op of ordered) {
    const before = { ...fds };
    const text = OPS[op](fds, files);
    frames.push(snap(`${op}: ${text}`, [1, 2].filter((fd) => before[fd] !== fds[fd])));
  }

  const write = (fd, line) => {
    const t = fds[fd];
    if (t === TERM) terminal.push(line);
    else if (t === '/dev/null' || t === 'pipe') { /* discarded / consumed by wc */ } else files[t].push(line);
  };
  // GNU ls reports the missing file first, then lists the existing one.
  write(2, ERR_LINE);
  frames.push(snap(`ls runs. It reports the missing file on fd 2 (stderr) → ${label(fds[2])}${fds[2] === 'pipe' ? ' (counted by wc)' : ''}.`, [2]));
  write(1, OUT_LINE);
  frames.push(snap(`Then it lists app.log on fd 1 (stdout) → ${label(fds[1])}${fds[1] === 'pipe' ? ' (counted by wc)' : ''}.`, [1]));

  if (fds[1] === 'pipe') {
    const count = 1 + (fds[2] === 'pipe' ? 1 : 0);
    terminal.push(String(count));
    frames.push(snap(`wc -l counts the lines that came through the pipe and prints ${count} on ITS stdout — the terminal.${count === 1 ? ' The error never entered the pipe, so it is not counted.' : ' With 2>&1 the error went into the pipe too.'}`));
  }

  frames.push(snap(summary(fds, s), []));
  return [first, frames];
}

function summary(fds, s) {
  if (s.ops.join(' ') === '2>&1 > out.txt') return 'Result: the error still reached the terminal, because 2>&1 copied fd 1 while it still pointed at the terminal. Write > out.txt 2>&1 to capture both.';
  if (fds[1] === fds[2] && fds[1] !== TERM && fds[1] !== 'pipe') return `Result: both streams ended up in ${fds[1]}; the terminal shows nothing. Exit status is still 2 (one file was missing).`;
  if (s.ops.includes('>> out.txt')) return 'Result: >> appended — "first line" is still there. With > it would have been replaced.';
  if (fds[2] === '/dev/null') return 'Result: only normal output is visible; the error was thrown away. Use this when errors are expected and irrelevant — not to hide real problems.';
  if (fds[1] === 'pipe') return 'Result: pipes carry stdout only, unless stderr is redirected into the pipe with 2>&1 (or |&).';
  if (!s.ops.length) return 'Result: both lines appear on the terminal, mixed together — you cannot tell them apart by looking, but they are separate streams.';
  return 'Result: each stream went to its own destination; anything still pointing at the terminal appeared on screen.';
}
