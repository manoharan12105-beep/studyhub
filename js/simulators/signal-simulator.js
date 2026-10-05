// Send signals to a process and see what it does.
//
//   process kind + signals you send → one frame per signal:
//   delivered? caught, ignored or default action? → state, terminal, exit status
//
// The process runs in terminal 1; you send signals from terminal 2 with
// `kill -SIGNAL 4242`. The behaviour (pending signals while stopped, 128 + N
// exit statuses, SIGKILL ignoring traps) was checked with real processes; the
// PID is illustrative.

import { el } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper, field } from '../engagement/stepper.js';

const PID = 4242;
const SIGNALS = [
  ['TERM', 15, 'kill 4242 (SIGTERM)'],
  ['INT', 2, 'kill -INT 4242 (like Ctrl+C)'],
  ['HUP', 1, 'kill -HUP 4242'],
  ['STOP', 19, 'kill -STOP 4242'],
  ['CONT', 18, 'kill -CONT 4242'],
  ['KILL', 9, 'kill -9 4242 (SIGKILL)'],
];
const NUM = Object.fromEntries(SIGNALS.map(([n, num]) => [n, num]));
const DEATH = { TERM: 'Terminated', INT: 'Interrupt', HUP: 'Hangup', KILL: 'Killed' };

const KINDS = {
  plain: { label: 'sleep 300 — no signal handlers', cmd: 'sleep 300', caught: [], ignored: [] },
  trap: {
    label: 'cleanup.sh — traps TERM and INT',
    cmd: "#!/bin/bash\ntrap 'echo \"cleaning up\"; rm -f /tmp/app.lock; exit 0' TERM INT\ntouch /tmp/app.lock\nwhile true; do sleep 1; done",
    caught: ['TERM', 'INT'], ignored: [],
  },
  ignore: {
    label: 'stubborn.sh — ignores TERM, INT and HUP',
    cmd: "#!/bin/bash\ntrap '' TERM INT HUP\nwhile true; do sleep 1; done",
    caught: [], ignored: ['TERM', 'INT', 'HUP'],
  },
  zombie: { label: 'A zombie: [worker] <defunct>', cmd: '# PID 4242 already exited; its parent never called wait()', zombie: true },
};

export function mount(root, { options }) {
  const kind = el('select', { class: 'select' }, Object.entries(KINDS).map(([v, k]) => el('option', { value: v }, k.label)));
  kind.value = KINDS[options.kind] ? options.kind : 'plain';
  root.append(el('div', { class: 'viz-form' }, field('Process in terminal 1', kind)));

  const code = el('pre', { class: 'mini-code', tabindex: 0 });
  const buttons = el('div', { class: 'signal-buttons', role: 'group', 'aria-label': 'Send a signal from terminal 2' },
    SIGNALS.map(([name, num]) => el('button', { type: 'button', class: 'btn btn-secondary btn-sm', 'data-signal': name }, `SIG${name} (${num})`)),
    el('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'data-signal': 'clear' }, 'Start over'));
  const stateLine = el('p', { class: 'verdict' });
  const term = el('pre', { class: 'mini-code term-out', tabindex: 0, 'aria-label': 'Terminal 1' });
  const sent = el('pre', { class: 'mini-code term-out', tabindex: 0, 'aria-label': 'Terminal 2' });
  root.append(el('div', { class: 'code-block' }, code), buttons, el('div', { class: 'viz-stage join-stage' },
    el('div', {}, el('p', { class: 'tree-side-title' }, 'Terminal 1 (the process)'), term),
    el('div', {}, el('p', { class: 'tree-side-title' }, 'Terminal 2 (you)'), sent),
    el('div', { class: 'join-result' }, stateLine)));
  const stepper = createStepper(root, { render, playDelay: 1600, nextLabel: 'Next signal' });

  let history = Array.isArray(options.signals) ? options.signals.filter((s) => NUM[s]) : [];

  function start() {
    code.innerHTML = highlight(KINDS[kind.value].cmd, 'bash');
    stepper.load(...buildFrames(KINDS[kind.value], history));
    // Show the newest result: walk to the end of the precomputed frames.
    while (stepper.next());
  }

  function render(frame) {
    term.textContent = frame.terminal.join('\n');
    sent.textContent = frame.sent.length ? frame.sent.join('\n') : '$ ';
    stateLine.className = `verdict ${frame.alive ? 'verdict-ok' : 'verdict-bad'}`;
    stateLine.replaceChildren(`State: ${frame.state}`, el('span', {}, frame.status === null ? '' : `   ·   exit status seen by its shell: ${frame.status}`));
  }

  buttons.addEventListener('click', (event) => {
    const name = event.target.closest('button')?.dataset.signal;
    if (!name) return;
    history = name === 'clear' ? [] : [...history, name];
    start();
  });
  kind.addEventListener('change', () => { history = []; start(); });
  start();
  return stepper;
}

/** Replay the signal history from the start; one frame per signal. */
export function buildFrames(kind, history) {
  const s = {
    alive: true, stopped: false, background: false, pending: [], status: null,
    state: kind.zombie ? 'Z — zombie (already dead)' : 'S — sleeping, running in the foreground',
    terminal: kind.zombie ? ['$ ps -o pid,stat,cmd -p 4242', '    PID STAT CMD', '   4242 Z    [worker] <defunct>'] : [`$ ${name(kind)}`],
    sent: [],
  };
  const snap = (text) => ({ text, alive: s.alive, state: s.state, status: s.status, terminal: s.terminal.slice(), sent: s.sent.slice() });
  const first = snap(kind.zombie
    ? 'A zombie has already exited; only its process-table entry is left. Try any signal.'
    : 'The process is running. Press a signal button to send it from terminal 2, then use Back/Next to replay what happened.');
  const frames = [];

  const die = (sig, viaPending = false) => {
    s.alive = false;
    s.stopped = false;
    s.status = 128 + NUM[sig];
    s.state = `terminated by SIG${sig}`;
    // bash reports how a job died; a foreground job killed by SIGINT just gets a new line.
    if (s.background) s.terminal.push(`[1]+  ${DEATH[sig].padEnd(27)}${name(kind)}`);
    else s.terminal.push(sig === 'INT' ? '' : `${DEATH[sig].padEnd(27)}${name(kind)}`);
    return `${viaPending ? 'The pending ' : ''}SIG${sig} has no handler, so the default action applies: the process is terminated. Its shell sees exit status ${s.status} (128 + ${NUM[sig]}).${sig === 'KILL' && kind.caught?.length ? ' The trap did NOT run — SIGKILL cannot be caught, so /tmp/app.lock is left behind.' : ''}`;
  };

  const deliver = (sig, viaPending = false) => {
    if (kind.caught.includes(sig)) {
      s.alive = false;
      s.status = 0;
      s.state = 'exited normally after cleanup';
      s.terminal.push('cleaning up');
      return `${viaPending ? 'The pending ' : ''}SIG${sig} is caught: bash runs the trap as soon as the current "sleep 1" finishes — it prints "cleaning up", removes the lock file and exits with status 0. This is why SIGTERM is the polite first choice.`;
    }
    if (kind.ignored.includes(sig)) return `SIG${sig} is ignored (trap '' ${sig}). Nothing happens; the process keeps running.`;
    return die(sig, viaPending);
  };

  for (const sig of history) {
    s.sent.push(`$ ${SIGNALS.find(([n]) => n === sig)[2].replace(/ \(.*\)$/, '')}`);
    let text;
    if (kind.zombie) {
      text = `SIG${sig} has no effect: a zombie is already dead and cannot run a handler or die again. Only its parent can remove it by calling wait() — fix or stop the parent.`;
    } else if (!s.alive) {
      text = `kill: (${PID}) - No such process. The process has already ended.`;
      s.sent.push(`bash: kill: (${PID}) - No such process`);
    } else if (sig === 'KILL') {
      text = die('KILL') + (s.pending.length ? ' Pending signals are discarded.' : '');
    } else if (sig === 'STOP') {
      if (s.stopped) text = 'Already stopped; nothing changes.';
      else {
        s.stopped = true;
        s.state = 'T — stopped';
        s.terminal.push(`[1]+  ${'Stopped'.padEnd(27)}${name(kind)}`);
        text = 'SIGSTOP cannot be caught or ignored: the process is frozen (T). The shell in terminal 1 reports it as a stopped job and gets its prompt back.';
      }
    } else if (sig === 'CONT') {
      if (!s.stopped) text = 'SIGCONT on a running process does nothing visible.';
      else {
        s.stopped = false;
        s.background = true;
        s.state = 'S — running again (now as a background job)';
        text = 'SIGCONT resumes the process. Because its shell already took the terminal back, it continues in the background (fg %1 would bring it forward).';
        if (s.pending.length) {
          const p = s.pending.shift();
          s.pending = [];
          text += ` Then the pending SIG${p} is delivered: ${deliver(p, true)}`;
        }
      }
    } else if (s.stopped && !kind.ignored.includes(sig)) {
      s.pending.push(sig);
      text = `The process is stopped, so SIG${sig} stays PENDING — nothing happens until it is continued with SIGCONT (only SIGKILL acts on a stopped process).`;
    } else {
      text = deliver(sig);
    }
    frames.push(snap(text));
  }
  return [first, frames];
}

function name(kind) {
  return kind.cmd.startsWith('#!') ? `./${kind.label.split(' ')[0]}` : kind.cmd;
}
