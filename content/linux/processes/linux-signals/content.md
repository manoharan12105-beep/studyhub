# Signals: kill, killall and pkill

**Module:** Processes and Signals · **Interview priority:** Core

## What Is It?

A **signal** is a small asynchronous notification the kernel delivers to a process: "please terminate", "stop", "continue", "reload your configuration", "your child exited". Signals have names and numbers (`SIGTERM` = 15, `SIGKILL` = 9).

For most signals a process can choose what happens:

- run its own **handler** (catch the signal — e.g. save state, close connections, then exit),
- **ignore** it,
- or accept the **default action** (terminate, terminate with core dump, stop, continue, or ignore).

Two signals cannot be caught, blocked or ignored: **`SIGKILL`** (always terminates) and **`SIGSTOP`** (always stops).

The command that sends signals is called `kill` — a misleading name: **`kill PID` sends `SIGTERM`, a polite request to terminate, not a forced kill.**

## Why It Matters

- Stopping services correctly: `SIGTERM` lets an application finish requests, flush data and release locks; `SIGKILL` can leave corrupted files, half-written records and stale lock files.
- Reloading configuration without downtime (`SIGHUP` to nginx and many daemons).
- Understanding exit codes like 137 (killed, often by the out-of-memory killer) and 143 (terminated).
- A top interview question: "What is the difference between `kill` and `kill -9`?"

## Core Concept

### The signals to know

| Signal | No. | Default action | Sent by / used for | Can be caught? |
|--------|-----|----------------|--------------------|----------------|
| `SIGHUP` | 1 | Terminate | Terminal closed; by convention "reload configuration" for daemons | Yes |
| `SIGINT` | 2 | Terminate | `Ctrl+C` | Yes |
| `SIGQUIT` | 3 | Terminate + core dump | `Ctrl+\`; JVMs print a thread dump instead | Yes |
| `SIGKILL` | 9 | Terminate | Last resort; the kernel's OOM killer | **No** |
| `SIGSEGV` | 11 | Terminate + core dump | Invalid memory access (a bug) | Yes |
| `SIGPIPE` | 13 | Terminate | Writing to a pipe whose reader has gone | Yes |
| `SIGTERM` | 15 | Terminate | **Default of `kill`**; `systemctl stop`, `docker stop` | Yes |
| `SIGCHLD` | 17 | Ignore | A child process exited or stopped | Yes |
| `SIGCONT` | 18 | Continue if stopped | `fg`, `bg`, `kill -CONT` | Yes (but it always continues) |
| `SIGSTOP` | 19 | Stop | `kill -STOP`; debuggers | **No** |
| `SIGTSTP` | 20 | Stop | `Ctrl+Z` | Yes |
| `SIGUSR1` / `SIGUSR2` | 10 / 12 | Terminate | Application-defined (e.g. reopen log files) | Yes |

Numbers shown are for Linux on x86 and ARM; use **names** in scripts for portability. `kill -l` lists them all.

### Graceful vs forced termination

```text
kill PID          (SIGTERM)                       kill -9 PID       (SIGKILL)
  │                                                 │
  ▼                                                 ▼
process's handler runs:                          kernel removes the process
  stop accepting work                            immediately — no code of the
  finish in-flight requests                      process runs:
  flush buffers, commit or roll back               buffers not flushed
  remove PID/lock files, close sockets             lock/PID files left behind
  exit(0)                                          child processes may be orphaned
                                                   transactions cut off mid-way
```

`SIGTERM` can be **caught** (and even ignored), so a process may take time or refuse. That is why the standard procedure is:

1. `kill PID` (`SIGTERM`) and wait a few seconds (`systemctl stop` waits 90 s by default; `docker stop` 10 s).
2. Check whether it exited (`kill -0 PID`, `ps -p PID`).
3. Only then `kill -9 PID`.

`SIGKILL` cannot help a process stuck in uninterruptible sleep (`D` state); it dies only when the kernel operation returns.

### Exit status after a signal

A process killed by signal N ends with exit status **128 + N** in the shell:

| Status | Meaning |
|--------|---------|
| 130 | 128 + 2: interrupted by `SIGINT` (`Ctrl+C`) |
| 137 | 128 + 9: killed by `SIGKILL` — in containers and Kubernetes usually **OOMKilled** |
| 143 | 128 + 15: terminated by `SIGTERM` |

## Commands

### kill

**Purpose:** send a signal to processes by PID (or to jobs by `%n`).

**Syntax:**

```text
kill [-SIGNAL] PID ...
kill -l [number]
```

| Form | Sends |
|------|-------|
| `kill 1234` | `SIGTERM` (15) |
| `kill -TERM 1234`, `kill -15 1234`, `kill -s TERM 1234` | `SIGTERM` |
| `kill -9 1234`, `kill -KILL 1234` | `SIGKILL` |
| `kill -HUP 1234` | `SIGHUP` |
| `kill -STOP 1234` / `kill -CONT 1234` | Pause / resume |
| `kill -0 1234` | Nothing — only checks that the process exists and you may signal it |
| `kill %1` | Signal job 1 of this shell |

List signal names:

```bash
kill -l | head -n 4
```

**Output:**

```text
 1) SIGHUP       2) SIGINT       3) SIGQUIT      4) SIGILL       5) SIGTRAP
 6) SIGABRT      7) SIGBUS       8) SIGFPE       9) SIGKILL     10) SIGUSR1
11) SIGSEGV     12) SIGUSR2     13) SIGPIPE     14) SIGALRM     15) SIGTERM
16) SIGSTKFLT   17) SIGCHLD     18) SIGCONT     19) SIGSTOP     20) SIGTSTP
```

`SIGTERM` and its exit status:

```bash
sleep 300 &
pid=$!
kill "$pid"
wait "$pid"
echo "exit status: $?"
```

**Output:**

```text
exit status: 143
```

`SIGKILL`:

```bash
sleep 300 &
pid=$!
kill -9 "$pid"
wait "$pid" 2>/dev/null
echo "exit status: $?"
```

**Output:**

```text
exit status: 137
```

Does the process still exist?

```bash
sleep 300 &
pid=$!
kill -0 "$pid" && echo "still running"
kill "$pid"
wait "$pid" 2>/dev/null
kill -0 "$pid" 2>/dev/null || echo "gone"
```

**Output:**

```text
still running
gone
```

Pause and resume:

```bash
sleep 300 &
pid=$!
sleep 0.3
kill -STOP "$pid"
ps -o stat= -p "$pid" | cut -c1
kill -CONT "$pid"
ps -o stat= -p "$pid" | cut -c1
kill "$pid"
```

**Output:**

```text
T
S
```

Error cases:

```bash
kill 999999
```

**Output:**

```text
bash: kill: (999999) - No such process
```

Signalling another user's process without root gives `Operation not permitted`.

### killall

**Purpose:** signal processes **by exact name** (default `SIGTERM`).

```bash
# Illustrative
killall nginx              # SIGTERM to every process named nginx
killall -HUP rsyslogd      # ask it to reload
killall -u alice           # every process of alice (needs root for other users)
killall -i java            # ask before each one
```

> [!WARNING]
> On Linux `killall` kills by name. On some commercial Unix systems (Solaris), `killall` kills **all processes** on the machine. Never type it on an unfamiliar Unix host.

### pkill

**Purpose:** signal processes matching a **pattern** — the signalling twin of `pgrep`.

```bash
# Illustrative
pkill -f 'inventory.jar'   # match the full command line
pkill -u alice             # all of alice's processes
pkill -HUP -x nginx        # exact name, send SIGHUP
pgrep -af 'inventory.jar'  # ALWAYS preview with pgrep first
```

> [!CAUTION]
> `pkill` matches substrings: `pkill java` hits every process with "java" in its name, and `pkill -f app` can hit unrelated programs whose arguments contain "app". Run the same pattern with `pgrep -a` first, and prefer `-x` (exact) or a precise `-f` pattern.

### trap: handling signals in your own scripts

A script that catches `SIGTERM` and cleans up:

```bash
cat > worker.sh <<'EOF'
#!/bin/bash
cleanup() {
    echo "SIGTERM received: saving state and exiting"
    exit 0
}
trap cleanup TERM
echo "worker started"
while true; do sleep 1; done
EOF
bash worker.sh &
pid=$!
sleep 1.5
kill "$pid"
wait "$pid"
echo "exit status: $?"
```

**Output:**

```text
worker started
SIGTERM received: saving state and exiting
exit status: 0
```

A script that ignores `SIGTERM` can only be removed with `SIGKILL`:

```bash
cat > stubborn.sh <<'EOF'
#!/bin/bash
trap 'echo "ignoring SIGTERM"' TERM
while true; do sleep 1; done
EOF
bash stubborn.sh &
pid=$!
sleep 1.2
kill "$pid"
sleep 1.5
kill -0 "$pid" && echo "still running after SIGTERM"
kill -9 "$pid"
wait "$pid" 2>/dev/null
echo "exit status: $?"
```

**Output:**

```text
ignoring SIGTERM
still running after SIGTERM
exit status: 137
```

## Examples

### Stop a process the right way

```bash
# Illustrative
pid=$(pgrep -f inventory.jar)
kill "$pid"                               # 1. polite request
for i in $(seq 1 10); do                  # 2. wait up to 10 s
    kill -0 "$pid" 2>/dev/null || break
    sleep 1
done
kill -0 "$pid" 2>/dev/null && kill -9 "$pid"   # 3. force only if still alive
```

### Reload instead of restart

```bash
# Illustrative
sudo kill -HUP "$(cat /run/nginx.pid)"     # nginx re-reads its config, keeps connections
sudo systemctl reload nginx                # the systemd way (sends the configured reload signal)
```

### Java-specific signals

```bash
# Illustrative
kill -3 <jvm-pid>      # SIGQUIT: the JVM prints a thread dump to its stdout — and keeps running
kill <jvm-pid>         # SIGTERM: JVM runs shutdown hooks (Spring closes its context gracefully)
kill -9 <jvm-pid>      # SIGKILL: no shutdown hooks, no graceful shutdown
```

## Comparison

### kill vs kill -9

| | `kill PID` (SIGTERM, 15) | `kill -9 PID` (SIGKILL, 9) |
|---|---|---|
| Nature | Request | Order carried out by the kernel |
| Can be caught or ignored | Yes | No |
| Process can clean up | Yes | No |
| Risk | Process may take time or refuse | Data loss, corrupt files, stale locks, orphaned children |
| Exit status | 143 (if not handled) | 137 |
| Use | Always first | Only when SIGTERM failed |

### SIGINT vs SIGTERM vs SIGKILL vs SIGHUP

| | SIGINT | SIGTERM | SIGKILL | SIGHUP |
|---|---|---|---|---|
| Typical source | `Ctrl+C` | `kill`, `systemctl stop` | `kill -9`, OOM killer | Terminal closed; admins for reload |
| Catchable | Yes | Yes | No | Yes |
| Meaning | "User interrupted" | "Please terminate" | "Die now" | "Hang-up" / "reload config" |

### SIGSTOP vs SIGTSTP

| | SIGSTOP (19) | SIGTSTP (20) |
|---|---|---|
| Sent by | `kill -STOP` | `Ctrl+Z` |
| Catchable | No | Yes (programs like `vim` restore the screen first) |
| Resume | `SIGCONT` | `SIGCONT` (`fg`/`bg`) |

### kill vs killall vs pkill

| | `kill` | `killall` | `pkill` |
|---|---|---|---|
| Selects by | PID (or job) | Exact process name | Pattern on name or full command line, user, terminal… |
| Precision | Exact | All processes with that name | Depends on the pattern |
| Preview | `ps -p PID` | `pgrep -x name` | `pgrep` with the same options |

## Common Mistakes

- Using `kill -9` first. Always try `SIGTERM` and give the process time.
- Thinking `kill` always kills — it sends a signal, `SIGTERM` by default, which can be handled or ignored.
- Trying to kill a zombie or a `D`-state process with `-9` and expecting it to vanish.
- Running `pkill java` or `pkill -f` with a loose pattern on a shared server.
- Signalling a PID read from a stale PID file — the PID may now belong to another process.
- Expecting `Ctrl+C` to stop a background job — it only reaches the foreground job.

## Key Takeaways

- Signals notify processes; most can be caught, ignored or left to the default; `SIGKILL` and `SIGSTOP` cannot be caught.
- `kill PID` = `SIGTERM` (15) = graceful request; `kill -9` = `SIGKILL` = immediate, no cleanup.
- Procedure: `SIGTERM` → wait → check with `kill -0` → `SIGKILL` only if needed.
- `SIGINT` = `Ctrl+C`, `SIGTSTP` = `Ctrl+Z`, `SIGHUP` = hang-up / reload, `SIGSTOP`/`SIGCONT` = pause/resume.
- Exit status 128 + N: 130 (INT), 137 (KILL, often OOM), 143 (TERM).
- `killall` by exact name, `pkill` by pattern (preview with `pgrep`); `trap` handles signals in scripts.
