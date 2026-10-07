// The five-state process model, driven by events you choose.
//
//   events you send (admit, dispatch, time slice, I/O …) → one frame per event:
//   the state diagram with the current state, and a log of every transition.
//
// Every event button is always enabled: an event that is not possible in the
// current state (for example "dispatch" while Waiting) is explained instead of
// applied, because those are exactly the interview traps. Frames are rebuilt
// from the event history, so Back and Reset replay it (as in signal-simulator).

import { el } from '../util.js';
import { createStepper } from '../engagement/stepper.js';
import { tableView } from './network-common.js';

const STATES = {
  new: ['New', 'PCB being created, program loading'],
  ready: ['Ready', 'Waiting only for a CPU'],
  running: ['Running', 'Executing on the CPU'],
  waiting: ['Waiting', 'Blocked until an event (I/O, lock)'],
  terminated: ['Terminated', 'Finished; resources being released'],
};

const EVENTS = {
  admit: {
    label: 'Admit', from: 'new', to: 'ready',
    ok: 'The OS admits the process: its PCB and memory are set up, so it joins the ready queue.',
  },
  dispatch: {
    label: 'Dispatch', from: 'ready', to: 'running',
    ok: 'The scheduler picks it from the ready queue; the dispatcher loads its saved context from the PCB and it runs.',
  },
  timeout: {
    label: 'Time slice expires', from: 'running', to: 'ready',
    ok: 'The timer interrupt preempts it: its context is saved in the PCB and it goes to the back of the ready queue. It could still run — it is Ready, not Waiting.',
  },
  io: {
    label: 'Request I/O', from: 'running', to: 'waiting',
    ok: 'It calls read() and the data must come from disk, so it blocks in the disk\'s queue. The CPU is given to another process meanwhile.',
  },
  ioDone: {
    label: 'I/O completes', from: 'waiting', to: 'ready',
    ok: 'The disk interrupt arrives and the data is copied in. The process becomes Ready — not Running: it must wait to be dispatched again.',
  },
  exit: {
    label: 'Exit', from: 'running', to: 'terminated',
    ok: 'It calls exit(). The OS frees its memory and files and hands the exit status to the parent (until then it is a zombie).',
  },
};

const TYPICAL_LIFE = ['admit', 'dispatch', 'io', 'ioDone', 'dispatch', 'timeout', 'dispatch', 'exit'];

export function mount(root, { options }) {
  const buttons = el('div', { class: 'signal-buttons', role: 'group', 'aria-label': 'Send an event to the process' },
    Object.entries(EVENTS).map(([key, e]) => el('button', { type: 'button', class: 'btn btn-secondary btn-sm', 'data-event': key }, e.label)),
    el('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'data-event': 'typical' }, 'Load a typical life'),
    el('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'data-event': 'clear' }, 'Start over'));
  const diagram = el('ol', { class: 'flow-lane state-lane os-state-lane', 'aria-label': 'Process states' },
    Object.entries(STATES).map(([key, [name, hint]]) => el('li', { class: 'flow-node', 'data-state': key },
      el('span', {}, el('strong', {}, name), el('span', { class: 'state-hint' }, hint)))));
  const log = tableView('Transitions so far', ['Step', 'Event', 'Result']);
  root.append(el('p', { class: 'viz-note' }, 'Choose events in any order. Impossible transitions are explained, not applied.'),
    buttons, el('div', { class: 'viz-stage' }, diagram, log.node));
  const stepper = createStepper(root, { render, playDelay: 1700, nextLabel: 'Next event' });

  let history = Array.isArray(options.events) ? options.events.filter((e) => EVENTS[e]) : [];

  function build() {
    const first = { state: 'new', visited: ['new'], rows: [], text: 'A new process is being created: the OS allocates its PCB and loads the program. Send it an event.' };
    const frames = [];
    let frame = first;
    history.forEach((key, i) => {
      const e = EVENTS[key];
      const allowed = frame.state === e.from;
      const state = allowed ? e.to : frame.state;
      const result = allowed ? `${STATES[e.from][0]} → ${STATES[e.to][0]}` : `not possible from ${STATES[frame.state][0]}`;
      frame = {
        state,
        visited: frame.visited.includes(state) ? frame.visited : [...frame.visited, state],
        rows: [...frame.rows, [String(i + 1), e.label, result]],
        invalid: !allowed,
        text: allowed ? `${e.label}: ${e.ok}` : `${e.label} is not possible now. ${whyNot(key, frame.state)}`,
      };
      frames.push(frame);
    });
    return [first, frames];
  }

  function start({ toEnd = true } = {}) {
    stepper.load(...build());
    if (toEnd) while (stepper.next());
  }

  function render(frame) {
    for (const li of diagram.children) {
      const key = li.dataset.state;
      li.className = ['flow-node', key === frame.state ? (frame.invalid ? 'is-current is-error' : 'is-current') : '',
        frame.visited.includes(key) ? 'is-visited' : ''].join(' ');
      li.toggleAttribute('aria-current', key === frame.state);
    }
    log.render(frame.rows, { empty: 'No events yet', rowClass: (row, i) => (i === frame.rows.length - 1 ? (frame.invalid ? 'is-unmatched' : 'is-current') : '') });
  }

  buttons.addEventListener('click', (event) => {
    const key = event.target.closest('button')?.dataset.event;
    if (!key) return;
    if (key === 'clear') history = [];
    else if (key === 'typical') history = TYPICAL_LIFE.slice();
    else history = [...history, key];
    // A loaded life starts at step 1 so it can be stepped through; a single event shows its result.
    start({ toEnd: key !== 'typical' });
  });

  start();
  return stepper;
}

function whyNot(key, state) {
  if (state === 'terminated') return 'The process has terminated; no event can change that. Use "Start over".';
  if (key === 'dispatch' && state === 'waiting') {
    return 'A Waiting process cannot be dispatched: there is no Waiting → Running transition. Its I/O must complete first (Waiting → Ready).';
  }
  if (key === 'dispatch' && state === 'running') return 'It is already running.';
  if (key === 'io' && state === 'ready') {
    return 'A Ready process is not executing, so it cannot issue a system call. Only a Running process can block itself (there is no Ready → Waiting transition).';
  }
  if (key === 'ioDone' && state !== 'waiting') return 'It is not waiting for any I/O.';
  if (key === 'timeout' && state !== 'running') return 'Only a running process has a time slice to expire.';
  if (key === 'exit' && state !== 'running') return 'A process must be running to execute exit().';
  if (key === 'admit') return 'The process has already been admitted.';
  return `This event needs the process to be ${STATES[EVENTS[key].from][0]}.`;
}
