# Processes and the Process Lifecycle

**Module:** Processes and Signals · **Interview priority:** Core

## What Is It?

A **program** is a file on disk (`/usr/bin/sleep`). A **process** is a running instance of a program: code plus its own memory, open files, environment, current directory, user identity and at least one thread. Run the same program three times and you get three processes.

The kernel identifies each process by a **PID** (process ID) and records its parent's PID, the **PPID**. Every process except PID 1 was created by another process, so all processes form a **tree** rooted at PID 1 (systemd).

```text
systemd (1)
├── sshd (812)
│   └── sshd (2201) ── bash (2205) ── java -jar app.jar (2290)
├── cron (640)
└── postgres (900)
    ├── postgres (905)   checkpointer
    └── postgres (906)   background writer
```

## Why It Matters

- Every troubleshooting task about CPU, memory, hung applications, ports or services starts with "which process, what state, who is its parent?".
- Understanding states explains real symptoms: a load average of 30 with idle CPUs (processes in `D` state waiting on disk), zombie entries that will not die, a process that survives `kill`.
- Interview favourites: PID vs PPID, process states, zombie vs orphan, fork/exec, process vs thread, daemon.

## Core Concept

### Creating a process: fork, exec, wait, exit

Linux creates processes in two steps:

1. **`fork()`** — the parent makes a near-identical copy of itself (new PID; memory shared copy-on-write).
2. **`exec()`** (`execve`) — the child replaces its program with a new one, keeping the PID and open files.
3. The child runs and finally calls **`exit(status)`**.
4. The parent calls **`wait()`** to collect the exit status; only then does the kernel remove the child's last trace.

```text
bash (PID 2205)
  │ fork()
  ├──────────────► bash copy (PID 2290)
  │                  │ execve("/usr/bin/java", …)
  │                  ▼
  │                java (PID 2290) … runs … exit(0)
  │ wait() ◄──────── status 0
  ▼
bash prints next prompt, $? = 0
```

Splitting fork from exec lets the shell set up redirections, pipes and environment in the child between the two calls.

### Process states

The classic operating-systems model describes five states:

```text
         admitted          scheduler dispatch          exit
  NEW ──────────► READY ◄───────────────────► RUNNING ──────► TERMINATED
                    ▲        preempted (time slice)  │
                    │                                │ waits for I/O or event
                    └──────── I/O done ──── WAITING ◄┘
```

Linux reports states as single letters in the `STAT`/`S` column of `ps` and `top`:

| Code | Linux state | Textbook equivalent | Meaning |
|------|-------------|---------------------|---------|
| `R` | Running or runnable | RUNNING **and** READY | On a CPU, or in the run queue waiting for one |
| `S` | Interruptible sleep | WAITING | Waiting for an event (input, timer, network); signals wake it |
| `D` | Uninterruptible sleep | WAITING | Waiting for I/O (usually disk or NFS); cannot be interrupted, not even by `SIGKILL` |
| `T` | Stopped | — | Paused by `SIGSTOP`/`SIGTSTP` (`Ctrl+Z`), or by a debugger (`t`) |
| `Z` | Zombie | TERMINATED (not yet reaped) | Finished, waiting for its parent to `wait()` |
| `I` | Idle | — | Idle kernel thread |

Extra characters after the letter: `s` session leader, `+` in the foreground process group, `l` multi-threaded, `<` high priority, `N` low priority (niced).

> [!NOTE]
> Linux does not distinguish READY from RUNNING in `ps`: both are `R`. A process that is ready but waiting for a CPU shows `R` and adds to the load average.

### Zombies and orphans

| | Zombie | Orphan |
|---|---|---|
| What happened | The child **exited**, but its parent has not called `wait()` yet | The **parent exited** while the child is still running |
| Still running? | No — only a process-table entry with the exit status remains | Yes, completely normal |
| Uses resources? | A PID and a tiny kernel structure; no memory, no CPU | Whatever it normally uses |
| Resolved by | The parent calling `wait()`; if the parent dies, the zombie is adopted and reaped | Adoption by PID 1 (or the nearest "subreaper", such as `systemd --user`), which reaps it when it exits |
| Can you `kill` it? | No — it is already dead; kill or fix the **parent** | Yes |

A few zombies that disappear quickly are normal. Thousands of zombies mean a parent with a bug (it never waits); they can exhaust the PID space.

### Daemons

A **daemon** is a background service process with no controlling terminal, usually started at boot by systemd and running as a dedicated user: `sshd`, `cron`, `nginx`, `postgres`. Names often end in `d`. See [systemd and Services](../../system-management/systemd-and-services/content.md).

### Processes and threads

A **thread** is a separate flow of execution **inside** a process; threads share the process's memory and open files but have their own stack and registers. A Java application is one process with dozens of threads. In Linux both are "tasks" to the scheduler; `ps -eLf` or `top -H` show threads.

| | Process | Thread |
|---|---|---|
| Memory | Own address space | Shared with other threads of the process |
| Creation cost | Higher (`fork`) | Lower (`clone` with sharing) |
| A crash | Affects that process | Usually brings down the whole process |
| Communication | Pipes, sockets, shared memory, signals | Shared variables (needs synchronisation) |

### What the kernel keeps per process

Every process has a directory `/proc/<PID>/`: `status` (state, PPID, memory, threads), `cmdline`, `environ`, `cwd` (link to working directory), `exe` (link to the program), `fd/` (open files), `limits`.

## Commands

### Your shell's PID and children

`$$` is the PID of the current shell; `$!` the PID of the most recent background job.

```bash
# Illustrative: interactive session
echo $$
sleep 300 &
ps -o pid,ppid,stat,comm
grep -E '^(Name|State|PPid)' /proc/$!/status
kill %1
```

**Terminal session (PIDs vary):**

```text
$ echo $$
491
$ sleep 300 &
[1] 495
$ ps -o pid,ppid,stat,comm
    PID    PPID STAT COMMAND
    491     490 Ss   bash
    495     491 S    sleep
    497     491 R+   ps
$ grep -E '^(Name|State|PPid)' /proc/$!/status
Name:   sleep
State:  S (sleeping)
PPid:   491
$ kill %1
```

`sleep` is a child of bash (its PPID is bash's PID) and is sleeping (`S`). `ps` itself is running (`R`) in the foreground (`+`).

### A child process reporting its parent

```bash
bash -c 'echo "child PID $$, parent PID $PPID"'
```

**Output (varies):**

```text
child PID 661, parent PID 635
```

### Exit status

```bash
bash -c 'exit 3'
echo "exit status $?"
```

**Output:**

```text
exit status 3
```

### Watching an orphan get adopted

```bash
# Illustrative: interactive session
bash -c 'sleep 30 & echo "child $!"; exit'
ps -o pid,ppid,stat,comm -p <child-pid>
```

**Terminal session (PIDs vary):**

```text
$ bash -c 'sleep 30 & echo "child $!"; exit'
child 504
$ ps -o pid,ppid,stat,comm -p 504
    PID    PPID STAT COMMAND
    504     462 S    sleep
```

The inner bash exited immediately, so `sleep` became an orphan. It was adopted by PID 462 — on this system the user's `systemd --user` instance, which acts as a subreaper; on other systems the new parent is PID 1.

### The process tree

```bash
# Illustrative: output depends on the system
pstree -p | head -n 5
ps -ef --forest | head
```

**Output (varies):**

```text
systemd(1)-+-agetty(212)
           |-atd(186)
           |-chronyd-starter(159)---chronyd(237)---chronyd(242)
           |-cron(160)
           |-dbus-daemon(161)
```

## Comparison

### Program vs process vs thread

| | Program | Process | Thread |
|---|---|---|---|
| Is | A file on disk | A running instance with its own memory | An execution path inside a process |
| Identified by | Path | PID | TID |
| Example | `/usr/bin/java` | `java -jar app.jar` (PID 2290) | The HTTP worker threads in that JVM |

### Zombie vs orphan vs defunct

"Defunct" is how `ps` labels a zombie: `[java] <defunct>`. Zombie and defunct mean the same thing; an orphan is different (it is alive).

## Common Mistakes

- Trying to `kill -9` a zombie. It is already dead; deal with the parent.
- Believing `D` processes can be killed with `SIGKILL`. They cannot until the I/O completes (often a hung NFS mount or failing disk).
- Confusing PID and PPID when tracing who started a process.
- Expecting READY and RUNNING to appear as different letters in `ps`.
- Assuming a high load average means high CPU usage — `D`-state processes count too.

## Key Takeaways

- Program = file; process = running instance with PID, PPID, memory, files, user.
- Creation: `fork()` copies, `exec()` replaces the program, `exit()` ends, parent `wait()`s for the status.
- Linux states: `R` running/runnable, `S` sleeping, `D` uninterruptible (I/O), `T` stopped, `Z` zombie.
- Zombie = finished but not reaped (fix the parent); orphan = parent died, adopted by PID 1 or a subreaper.
- PID 1 (systemd) is the ancestor of all processes; `/proc/<PID>/` exposes each process's details.
