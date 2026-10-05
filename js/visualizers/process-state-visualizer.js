// Process states, one event at a time.
//
//   scenario → frames: event → state diagram (R S D T Z gone) + one `ps` row
//
// Each scenario follows one process through the events that change its state
// (fork/exec, waiting for input or disk, Ctrl+Z, exit, being reaped). PIDs are
// illustrative; the state letters and transitions are what `ps` really shows.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';

const STATES = [
  ['R', 'Running / runnable', 'On a CPU or waiting in the run queue'],
  ['S', 'Sleeping', 'Waiting for an event (input, timer, network); signals wake it'],
  ['D', 'Uninterruptible', 'Waiting for disk/NFS I/O; signals wait until it returns'],
  ['T', 'Stopped', 'Paused by Ctrl+Z or SIGSTOP; SIGCONT resumes it'],
  ['Z', 'Zombie', 'Finished; only the exit status remains until the parent reads it'],
  ['X', 'Gone', 'Reaped: removed from the process table'],
];

const SCENARIOS = {
  normal: {
    label: 'Normal life: start, wait for input, exit',
    cmd: 'python3 greet.py',
    steps: [
      ['R', 2140, 'bash (PID 2100) calls fork(): a copy of the shell starts as child PID 2140 with PPID 2100. The child calls execve() to load the new program. It is runnable: R.'],
      ['S', 2140, 'The program calls read() on the terminal and no key has been pressed yet. The kernel puts it to sleep: S. It uses no CPU while it waits.'],
      ['R', 2140, 'You type a name and press Enter. The kernel wakes the process: R again. It prints the greeting.'],
      ['Z', 2140, 'The program calls exit(0). Its memory is freed, but its PID and exit status stay in the process table: a zombie (Z, shown as <defunct>) until the parent asks for the status.'],
      ['X', 2140, 'The parent shell calls wait(), receives status 0 (now in $?), and the kernel removes the entry. The process is gone. This normally takes microseconds.'],
    ],
  },
  jobcontrol: {
    label: 'Job control: Ctrl+Z, bg, fg',
    cmd: 'sleep 300',
    steps: [
      ['S', 2155, 'sleep 300 runs in the foreground. It spends its life sleeping on a timer: S. (S is the normal state of most processes — waiting, not using CPU.)'],
      ['T', 2155, 'You press Ctrl+Z. The terminal sends SIGTSTP; the process is stopped: T. The shell prints "[1]+ Stopped sleep 300" and gives you the prompt back.'],
      ['S', 2155, 'bg %1 sends SIGCONT. The job continues in the background (sleeping again: S) while you use the shell.'],
      ['S', 2155, 'fg %1 brings it back to the foreground. The state letter is the same; only which process group owns the terminal changed (ps shows S+ for the foreground group).'],
      ['Z', 2155, 'After 300 seconds sleep exits with status 0 and becomes a zombie for an instant…'],
      ['X', 2155, '…until the shell reaps it with wait(). The job is done.'],
    ],
  },
  io: {
    label: 'Disk I/O: uninterruptible sleep (D)',
    cmd: 'cp big.iso /mnt/nfs/',
    steps: [
      ['R', 2201, 'cp starts copying a large file to a network filesystem: R while it moves data.'],
      ['D', 2201, 'It issues a write that must wait for the storage (the NFS server is slow). The kernel puts it in uninterruptible sleep: D. It counts towards the load average even though it uses no CPU.'],
      ['D', 2201, 'You send kill -9. The signal is queued, but a process in D state cannot act on it until the I/O call returns — this is why "kill -9 does not work" on stuck I/O.'],
      ['Z', 2201, 'The storage answers, the system call returns, and the pending SIGKILL terminates the process at once. It becomes a zombie (exit status: killed by signal 9).'],
      ['X', 2201, 'The shell reaps it and reports "Killed" ($? = 137 = 128 + 9).'],
    ],
  },
  zombie: {
    label: 'Zombie and orphan: a parent that never waits',
    cmd: './buggy-server (forks workers)',
    steps: [
      ['R', 2302, 'buggy-server (PID 2300) forks worker PID 2302 to handle a request: R.'],
      ['Z', 2302, 'The worker finishes and exits. The parent should call wait(), but it has a bug and never does. The worker stays a zombie: Z, <defunct>.'],
      ['Z', 2302, 'You try kill -9 2302. Nothing happens: a zombie is already dead, there is nothing left to kill. Many zombies only cost PIDs, but they reveal a buggy parent.'],
      ['Z', 2302, 'You stop the parent instead (systemctl stop buggy-server, or kill 2300). The zombie is now an orphan: the kernel re-parents it to PID 1 (systemd), so its PPID becomes 1.'],
      ['X', 2302, 'systemd reaps adopted children automatically. The zombie disappears. Fixing the parent — not killing the zombie — is the cure.'],
    ],
  },
};

export function mount(root, { options }) {
  const scenario = el('select', { class: 'select' }, Object.entries(SCENARIOS).map(([v, s]) => el('option', { value: v }, s.label)));
  scenario.value = SCENARIOS[options.scenario] ? options.scenario : 'normal';
  root.append(el('div', { class: 'viz-form' }, field('Scenario', scenario)));

  const diagram = el('ol', { class: 'flow-lane state-lane' }, STATES.map(([code, name, hint]) => el('li', { class: 'flow-node', 'data-state': code },
    el('span', {}, el('strong', {}, code === 'X' ? '—' : code), ` ${name}`, el('span', { class: 'state-hint' }, hint)))));
  const ps = el('table', { class: 'viz-table' });
  root.append(el('div', { class: 'viz-stage' }, diagram,
    el('p', { class: 'tree-side-title ps-title' }, 'ps -o pid,ppid,stat,cmd'),
    el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'ps output' }, ps)));
  const stepper = createStepper(root, { render, playDelay: 1800, nextLabel: 'Next event' });

  function start() {
    const s = SCENARIOS[scenario.value];
    const frames = s.steps.map(([state, pid, text], i) => ({ state, pid, text, ppid: ppidFor(scenario.value, i), cmd: s.cmd, visited: s.steps.slice(0, i + 1).map((x) => x[0]) }));
    stepper.load(frames[0], frames.slice(1));
  }

  function render(frame) {
    for (const li of diagram.children) {
      const code = li.dataset.state;
      li.className = ['flow-node', code === frame.state ? 'is-current' : '', frame.visited.includes(code) ? 'is-visited' : ''].join(' ');
      li.toggleAttribute('aria-current', code === frame.state);
    }
    const row = frame.state === 'X'
      ? el('tr', {}, el('td', { colspan: 4, class: 'muted' }, `(no line for PID ${frame.pid} — the process is gone)`))
      : el('tr', { class: 'is-current' }, el('td', {}, String(frame.pid)), el('td', {}, String(frame.ppid)),
        el('td', {}, frame.state), el('td', {}, frame.state === 'Z' ? `[${frame.cmd.split(' ')[0].replace('./', '')}] <defunct>` : frame.cmd));
    ps.replaceChildren(el('thead', {}, el('tr', {}, ['PID', 'PPID', 'STAT', 'CMD'].map((h) => el('th', { scope: 'col' }, h)))), el('tbody', {}, row));
  }

  scenario.addEventListener('change', start);
  start();
  return stepper;
}

function ppidFor(scenario, index) {
  if (scenario === 'zombie') return index >= 3 ? 1 : 2300;
  return 2100;
}
