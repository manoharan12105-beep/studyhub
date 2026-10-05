# Foreground, Background and Job Control

**Module:** Processes and Signals · **Interview priority:** Core

## What Is It?

When you type a command, the shell normally runs it in the **foreground**: it owns the terminal, receives your keystrokes, and the shell waits until it finishes. A **background** process runs while the shell gives you the prompt back.

Bash's **job control** manages the commands started from one shell session as numbered **jobs**:

| Command / key | Does |
|---------------|------|
| `command &` | Start in the background |
| `Ctrl+Z` | Suspend (stop) the foreground job |
| `jobs` | List this shell's jobs |
| `fg [%n]` | Bring a job to the foreground |
| `bg [%n]` | Resume a stopped job in the background |
| `kill %n` | Send a signal to a job |
| `nohup command &` | Run so it survives the terminal closing |
| `disown [%n]` | Remove a job from the shell's job table (it will not get the hang-up signal) |
| `wait` | Wait for background jobs to finish |

## Why It Matters

- Start a long build, a server or a file copy and keep working in the same terminal.
- Rescue a command you started in the foreground by mistake (`Ctrl+Z`, then `bg`).
- Long jobs over SSH die when the connection drops unless you use `nohup`, `disown`, `tmux`/`screen` or a proper service.
- Interviewers ask: foreground vs background, `Ctrl+Z` vs `Ctrl+C`, `nohup` vs `&`, how to keep a process running after logout.

## Core Concept

### Foreground vs background

| | Foreground | Background |
|---|---|---|
| Started with | `command` | `command &` |
| Prompt | Returns when the command ends | Returns immediately |
| Keyboard input | Goes to the command | Goes to the shell; a background job that reads the terminal is stopped |
| `Ctrl+C` / `Ctrl+Z` | Reach the command | Do not reach it |
| Output | To the terminal | Still to the terminal (mixed with your typing) unless redirected |

At any moment one **process group** is the terminal's foreground group. Keys such as `Ctrl+C` make the terminal driver send a signal to that whole group.

### Job states and identifiers

```text
                 Ctrl+Z (SIGTSTP)
   Running fg ─────────────────────► Stopped
       ▲  │                            │  ▲
     fg │  │ (start with &)       bg   │  │ Ctrl+Z after fg
       │  ▼                            ▼  │
   Running bg ◄───────────────────────────┘
```

| Spec | Refers to |
|------|-----------|
| `%1`, `%2` | Job number 1, 2 |
| `%+` or `%%` | Current job (marked `+` in `jobs`) — the default for `fg`/`bg` |
| `%-` | Previous job (marked `-`) |
| `%sleep` | The job whose command starts with "sleep" |

Job numbers belong to **one shell**; another terminal has its own jobs. PIDs are system-wide.

### What happens when the terminal closes

When you log out or the terminal (or SSH connection) closes, the shell sends **`SIGHUP`** (hang up) to its jobs, and most programs exit on `SIGHUP`. To keep a job running:

- `nohup command &` — the command ignores `SIGHUP`; output goes to `nohup.out` unless redirected.
- `command &` then `disown` — the shell forgets the job, so it does not forward `SIGHUP` to it.
- `tmux` or `screen` — the session itself survives disconnection and can be re-attached later. Best for interactive work.
- A **systemd service** or a scheduler — the right answer for anything that must keep running in production.

## Commands

The sessions below are real interactive bash sessions; job and process numbers will differ on your machine.

### Background jobs and `jobs`

```bash
# Illustrative: interactive session
sleep 300 &
sleep 400 &
jobs
jobs -l
```

**Terminal session:**

```text
$ sleep 300 &
[1] 1438
$ sleep 400 &
[2] 1440
$ jobs
[1]-  Running                    sleep 300 &
[2]+  Running                    sleep 400 &
$ jobs -l
[1]-  1438 Running                    sleep 300 &
[2]+  1440 Running                    sleep 400 &
```

`[1] 1438` = job number and PID. `+` marks the current job, `-` the previous one. `jobs -l` adds PIDs.

### Ctrl+Z, fg and bg

```bash
# Illustrative: interactive session (continuing)
fg %1          # sleep 300 takes over the terminal
# press Ctrl+Z
jobs
bg %1
```

**Terminal session:**

```text
$ fg %1
sleep 300
^Z
[1]+  Stopped                    sleep 300
$ jobs
[1]+  Stopped                    sleep 300
[2]-  Running                    sleep 400 &
$ bg %1
[1]+ sleep 300 &
```

A stopped job uses no CPU but keeps its memory, open files and network ports.

### Killing jobs

```bash
# Illustrative: interactive session (continuing)
kill %2
jobs
```

**Terminal session:**

```text
$ kill %2
$ jobs
[1]-  Running                    sleep 300 &
[2]+  Terminated                 sleep 400
```

Bash reports a job's end the next time it shows a prompt. `kill %1` would end the other one. To end a **stopped** job that ignores `SIGTERM` while stopped, continue it (`fg` or `kill -CONT`) or use `kill -9 %1`.

### Ctrl+C

```bash
# Illustrative: interactive session
sleep 300
# press Ctrl+C
jobs
```

**Terminal session:**

```text
$ sleep 300
^C
$ jobs
$
```

`Ctrl+C` sent `SIGINT`, which ended the foreground command; nothing is left in the job table.

### nohup

**Purpose:** run a command immune to `SIGHUP`, so it survives logout.

```bash
# Illustrative: interactive session
nohup bash -c 'echo started; sleep 1; echo done' &
cat nohup.out
```

**Terminal session:**

```text
$ nohup bash -c 'echo started; sleep 1; echo done' &
[1] 1489
$ nohup: ignoring input and appending output to 'nohup.out'
$ cat nohup.out
started
done
[1]+  Done                       nohup bash -c 'echo started; sleep 1; echo done'
```

Redirect output yourself to choose the log file:

```bash
# Illustrative: interactive session
nohup bash -c 'echo to my log' > job.log 2>&1 &
cat job.log
```

**Terminal session:**

```text
$ nohup bash -c 'echo to my log' > job.log 2>&1 &
[1] 1495
$ cat job.log
nohup: ignoring input
to my log
[1]+  Done                       nohup bash -c 'echo to my log' > job.log 2>&1
```

`nohup` still prints its notice — into your log, because stderr was redirected there.

### disown

```bash
# Illustrative: interactive session
sleep 500 &
disown %1
jobs
ps -o pid,stat,comm -C sleep
```

**Terminal session:**

```text
$ sleep 500 &
[1] 1500
$ disown %1
$ jobs
$ ps -o pid,stat,comm -C sleep
    PID STAT COMMAND
   1500 S    sleep
```

The process still runs, but it is no longer a job of this shell (so `fg`, `%1` and the logout `SIGHUP` no longer apply). Use `disown -h %1` to keep it in the table but exempt it from `SIGHUP`.

### wait

**Purpose:** wait for background jobs — useful in scripts that start work in parallel.

```bash
(sleep 1; echo "A done") &
(sleep 2; echo "B done") &
wait
echo "all background jobs finished"
```

**Output:**

```text
A done
B done
all background jobs finished
```

`wait $pid` waits for one process and returns its exit status.

## Examples

### Rescue a long command started in the foreground

```bash
# Illustrative
tar -czf backup.tar.gz project/      # oops — this takes a while
# Ctrl+Z
bg                                   # continues in the background
jobs                                 # [1]+  Running  tar -czf backup.tar.gz project/ &
```

### Start a server that must survive an SSH disconnect

```bash
# Illustrative
nohup java -jar app.jar > app.log 2>&1 &
echo $! > app.pid                    # remember the PID for later
```

For anything long-lived in production, create a systemd service instead — it restarts on failure, starts at boot and logs to the journal.

## Comparison

### Ctrl+C vs Ctrl+Z vs Ctrl+D

| Keys | Sends | Effect |
|------|-------|--------|
| `Ctrl+C` | `SIGINT` to the foreground group | Interrupts — usually terminates the command |
| `Ctrl+Z` | `SIGTSTP` to the foreground group | Suspends — resume with `fg` or `bg` |
| `Ctrl+D` | No signal: end-of-file on input | Ends input for the program; exits the shell at an empty prompt |

### & vs nohup vs disown vs tmux

| | `cmd &` | `nohup cmd &` | `cmd &` + `disown` | `tmux` / `screen` |
|---|---|---|---|---|
| Prompt back | Yes | Yes | Yes | Yes (inside a session) |
| Survives terminal close | No (gets `SIGHUP`) | Yes | Yes | Yes |
| Output | Terminal | `nohup.out` or your redirect | Terminal (lost after close) | Kept in the session |
| Re-attach later | No | No (read the log) | No | **Yes** |

## Common Mistakes

- Pressing `Ctrl+Z` to quit a program — it is only paused and still holds ports and files.
- Starting a server with `&` over SSH and finding it dead after disconnecting — use `nohup`, `tmux` or a service.
- Forgetting to redirect output of background jobs; they print into the middle of your typing.
- Using `%1` in another terminal — job numbers are per shell; use the PID.
- Running production services with `nohup` instead of systemd (no restart, no boot start, no supervision).

## Key Takeaways

- `cmd &` runs in the background; `jobs` lists; `fg %n` foreground; `bg %n` resume in background.
- `Ctrl+Z` stops (`SIGTSTP`), `Ctrl+C` interrupts (`SIGINT`).
- Closing a terminal sends `SIGHUP` to its jobs; `nohup`, `disown`, `tmux` or systemd keep work alive.
- Job specs: `%1`, `%+`, `%-`, `%name`; PIDs work everywhere.
- `wait` blocks until background jobs finish.
