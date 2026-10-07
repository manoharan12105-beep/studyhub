# Process States

**Module:** Processes and Threads · **Interview priority:** Core

## Concept

As a process executes, it moves through a small set of **states** that tell the OS what it can do with it. The standard **five-state model**:

| State | Meaning |
|-------|---------|
| **New** | Being created: PCB allocated, program being loaded |
| **Ready** | Loaded and able to run; waiting only for a CPU |
| **Running** | Its instructions are executing on a CPU |
| **Waiting** (Blocked) | Cannot continue until an event happens: I/O completion, a lock, a signal, a timer |
| **Terminated** (Exit) | Finished; the OS is cleaning up and reporting its exit status |

## Why It Matters

States let the OS spend CPU time only on processes that can use it. A process waiting for a disk read is useless on the CPU, so it is set aside in **Waiting** and the CPU goes to a **Ready** process. The scheduler only ever chooses among Ready processes.

## How It Works

### The state diagram

```text
              admitted                  exit
   ┌─────┐  ──────────▶ ┌───────┐ dispatch ┌─────────┐ ───────▶ ┌────────────┐
   │ New │              │ Ready │ ───────▶ │ Running │          │ Terminated │
   └─────┘              └───────┘ ◀─────── └─────────┘          └────────────┘
                            ▲     interrupt /     │
                            │     time slice over │ I/O or event wait
                            │                     ▼
                            │  I/O or event  ┌─────────┐
                            └─────────────── │ Waiting │
                               completion    └─────────┘
```

### The transitions

| From → To | Trigger | Example |
|-----------|---------|---------|
| New → Ready | OS admits the process | Program loaded, PCB ready |
| Ready → Running | **Dispatch**: the scheduler picks it | Its turn in Round Robin |
| Running → Ready | **Preemption**: timer interrupt (time slice used up) or a higher-priority process becomes ready | Quantum of 10 ms expires |
| Running → Waiting | The process requests something it must wait for | `read()` from disk, waiting for a lock, `sleep()` |
| Waiting → Ready | The awaited event happens | Disk interrupt: data has arrived |
| Running → Terminated | The process exits or is killed | `exit(0)`, unhandled exception, `kill` |

### Transitions that do not exist

- **Waiting → Running directly:** when the event completes, the process goes to **Ready** and must be scheduled again; the CPU may be busy with someone else.
- **Ready → Waiting:** a process can only start waiting by *doing* something (a system call), which requires running.
- **New → Running** and **Terminated → anything.**

### Queues behind the states

The OS keeps PCBs in queues: a **ready queue** (Ready processes) and **device or event queues** (Waiting processes, one queue per device or event). A transition is the PCB moving from one queue to another.

### Suspended states (seven-state model, awareness)

When memory is short, the OS (the medium-term scheduler) can **swap** a process out to disk. That adds **Ready-Suspended** and **Blocked-Suspended**: the same states, but the process's memory is on disk and must be swapped in before it can run.

## Example

A program reads a file, processes it and exits:

1. `New` — the shell forks and execs it; the OS builds its PCB.
2. `Ready` — admitted; waits in the ready queue.
3. `Running` — dispatched; opens the file and calls `read()`.
4. `Waiting` — the data is not in memory; the disk is working. The CPU runs other processes.
5. `Ready` — the disk interrupt arrives; the data is copied; the process rejoins the ready queue.
6. `Running` — dispatched again; it processes the data. Its time slice expires mid-loop.
7. `Ready` — preempted by the timer; back to the queue.
8. `Running` — dispatched; it finishes and calls `exit(0)`.
9. `Terminated` — the OS frees its memory; the parent receives exit status 0.

## Important Points

- Five states: New, Ready, Running, Waiting/Blocked, Terminated.
- Only **Ready** processes compete for the CPU; on one CPU, at most one process is Running.
- Running → Ready = preemption (involuntary); Running → Waiting = waiting for an event (voluntary).
- An event completion moves a process from Waiting to **Ready**, never straight to Running.
- Suspended states appear when processes are swapped to disk.

## Common Confusion

> [!WARNING]
> **"After I/O completes, the process continues running."** It becomes **Ready**. It runs again only when the scheduler dispatches it.

- **Ready vs Waiting:** Ready = could run now, needs a CPU. Waiting = could not run even with a free CPU, needs an event.
- **Terminated vs zombie:** on UNIX, a terminated process whose parent has not called `wait()` stays a zombie — still in the process table, in the Terminated state.

## Interview Perspective

- *"Draw the process state diagram and explain each transition."* — five states, six transitions, with a trigger for each.
- *"Can a process go from Waiting to Running?"* — no; via Ready.
- *"What causes Running → Ready vs Running → Waiting?"* — timer/preemption vs an I/O or event request.
- *"What is the ready queue?"* — the list of PCBs of Ready processes the scheduler chooses from.

## Quick Revision

- New → Ready (admit) → Running (dispatch) → Terminated (exit).
- Running → Ready: preempted. Running → Waiting: I/O/event. Waiting → Ready: event done.
- No Waiting → Running. No Ready → Waiting.
- Ready queue + device queues hold the PCBs.
