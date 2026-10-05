# Monitoring Processes: ps, top, htop, pgrep and pidof

**Module:** Processes and Signals · **Interview priority:** Core

## What Is It?

| Command | Shows |
|---------|-------|
| `ps` | A **snapshot** of processes at one moment, in any format you ask for |
| `top` | A **live**, refreshing view sorted by CPU (or memory), with system summary |
| `htop` | A friendlier interactive `top` with colours, scrolling, tree view and mouse support (often installed separately) |
| `pgrep` | PIDs of processes matching a name or pattern |
| `pidof` | PIDs of a program by its exact name |
| `uptime`, `free`, `nproc` | Load average, memory, CPU count — context for reading the above |

## Why It Matters

- "The server is slow" → `top` shows which process uses CPU or memory, and whether the system waits on disk.
- "Is the application running? With which arguments? Since when? As which user?" → `ps`.
- Scripts and monitoring need PIDs → `pgrep`, `pidof`.
- Interviewers expect you to read `top`'s header (load average, `%Cpu`, `wa`, memory) and to know `ps aux` vs `ps -ef`.

## Core Concept

### Reading `top`

```text
top - 10:12:28 up 0 min,  1 user,  load average: 0.32, 0.07, 0.02
Tasks:  69 total,   1 running,  68 sleeping,   0 stopped,   0 zombie
%Cpu(s):  8.0 us,  0.8 sy,  0.0 ni, 90.4 id,  0.0 wa,  0.0 hi,  0.8 si,  0.0 st
MiB Mem :   7788.6 total,   5891.2 free,    699.7 used,   1349.6 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   7088.9 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
      1 root      20   0   24220  15304  11512 S   0.0   0.2   0:00.90 systemd
```

| Field | Meaning |
|-------|---------|
| load average | Average number of runnable + uninterruptible (`D`) processes over 1, 5 and 15 minutes. Compare with the CPU count (`nproc`): load 4 on 4 cores = fully busy |
| Tasks | Processes by state; non-zero `zombie` deserves a look |
| `us` / `sy` | CPU time in user programs / in the kernel |
| `ni` | User time of niced (low-priority) processes |
| `id` | Idle |
| `wa` | Idle while **waiting for I/O** — high values point at disks or network storage |
| `hi` / `si` | Hardware / software interrupts |
| `st` | "Steal": time the hypervisor gave to other VMs |
| `avail Mem` | Memory available for new programs without swapping — the number to watch, not `free` |
| `buff/cache` | File cache; Linux uses spare RAM for it and gives it back when programs need memory |
| PR / NI | Scheduling priority / nice value (−20 highest, 19 lowest priority) |
| VIRT / RES / SHR | Virtual size (all mapped memory) / resident in RAM / shared portion |
| S | State (`R`, `S`, `D`, `T`, `Z`) |
| %CPU | CPU use since the last refresh; can exceed 100 % for multi-threaded processes |
| TIME+ | Total CPU time used |

> [!TIP]
> "Free" memory near zero is normal on Linux — RAM is used for cache. Worry when **available** memory is low and swap usage keeps growing.

### `top` keys

| Key | Action |
|-----|--------|
| `P` / `M` / `T` | Sort by CPU / memory / time |
| `1` | Show each CPU separately |
| `k` | Kill a process (asks for PID and signal) |
| `r` | Renice a process |
| `u` | Show one user's processes |
| `c` | Toggle full command lines |
| `H` | Show threads |
| `q` | Quit |

`top -b -n 1` prints one snapshot in batch mode (for scripts and logs); `top -p 1234` watches specific PIDs.

## Commands

### ps

**Purpose:** snapshot of processes.

Two option styles exist — BSD style without dashes (`ps aux`) and UNIX/POSIX style with dashes (`ps -ef`). Both list every process:

```bash
ps aux | head -n 4
```

**Output (varies):**

```text
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1 19.6  0.1  24220 15304 ?        Ss   10:12   0:00 /sbin/init
root           2  0.2  0.0   3180  2208 hvc0     Sl+  10:12   0:00 /init
root          49  6.6  0.2  42072 16592 ?        S<s  10:12   0:00 /usr/lib/systemd/systemd-journald
```

```bash
ps -ef | head -n 3
```

**Output (varies):**

```text
UID          PID    PPID  C STIME TTY          TIME CMD
root           1       0 19 10:12 ?        00:00:00 /sbin/init
root           2       1  0 10:12 hvc0     00:00:00 /init
```

`ps aux` adds %CPU, %MEM, VSZ and RSS; `ps -ef` shows the PPID. `TTY ?` means no controlling terminal (a daemon).

| Option | Meaning |
|--------|---------|
| `aux` | All processes, user-oriented format (BSD style) |
| `-ef` | All processes, full format with PPID (UNIX style) |
| `-o pid,ppid,user,%cpu,%mem,etime,cmd` | Choose columns |
| `--sort=-%mem` | Sort (minus = descending) |
| `-p 1234` | Specific PIDs |
| `-u alice` | Processes of a user |
| `-C nginx` | Processes by command name |
| `--forest` / `f` | Show parent–child tree |
| `-L` | Show threads |

Top memory users, with your own columns:

```bash
ps -eo pid,user,%cpu,%mem,rss,etime,comm --sort=-%mem | head -n 5
```

**Output (varies):**

```text
    PID USER     %CPU %MEM   RSS     ELAPSED COMMAND
    163 root      6.1  0.4 39388       00:02 snapd
    247 root      9.2  0.4 32752       00:02 unattended-upgr
    156 root      9.3  0.3 29864       00:02 networkd-dispat
     49 root      6.5  0.2 16592       00:03 systemd-journal
```

`RSS` is resident memory in KiB; `ELAPSED` is how long the process has been running.

**Common mistake:** `ps aux | grep java` also matches the `grep` process itself. Use `pgrep -a java` or `ps -C java`.

### pgrep

**Purpose:** find PIDs by name or pattern.

| Option | Meaning |
|--------|---------|
| `-l` | Show the name with the PID |
| `-a` | Show the full command line |
| `-f` | Match against the full command line, not just the name |
| `-u user` | Only that user's processes |
| `-c` | Count matches |
| `-x` | Exact name match |
| `-n` / `-o` | Newest / oldest match only |

```bash
sleep 100 &
sleep 200 &
pgrep -c sleep
pgrep -a sleep
kill %1 %2
```

**Output (varies):**

```text
2
449 sleep 100
450 sleep 200
```

`-f` matters for programs run by an interpreter: every Java application's process name is `java`, so `pgrep -f 'inventory.jar'` finds the right one.

### pidof

**Purpose:** PIDs of a running program, matched by its exact executable name.

```bash
# Illustrative
pidof sshd           # e.g. 812 2201
pidof -s nginx       # only one PID
```

### uptime, nproc and free

```bash
# Illustrative: values depend on the machine
uptime
nproc
free -h
```

**Output (varies):**

```text
 10:12:28 up 0 min,  1 user,  load average: 0.32, 0.07, 0.02
12
               total        used        free      shared  buff/cache   available
Mem:           7.6Gi       699Mi       5.8Gi       3.4Mi       1.3Gi       6.9Gi
Swap:          2.0Gi          0B       2.0Gi
```

### htop

```bash
# Illustrative: install with: sudo apt install htop
htop
```

Function keys at the bottom: `F3` search, `F4` filter, `F5` tree view, `F6` sort column, `F9` kill (choose the signal), `F10` quit. Bars at the top show each CPU and memory.

### nice and renice

**Purpose:** run a process at lower (or, as root, higher) CPU priority.

```bash
# Illustrative
nice -n 10 tar -czf backup.tar.gz project/   # start a heavy job politely
renice -n 15 -p 4321                          # lower an existing process's priority
sudo renice -n -5 -p 4321                     # raising priority needs root
```

## Examples

### Is my application running, and how?

```bash
# Illustrative
pgrep -af inventory.jar
ps -o pid,ppid,user,etime,%cpu,%mem,cmd -p "$(pgrep -f inventory.jar)"
```

Shows the PID, who started it, how long it has run, its resource use and the exact command line (JVM flags, profile).

### The five busiest processes, for a report

```bash
# Illustrative
top -b -n 1 -o %CPU | head -n 12
ps -eo pid,user,%cpu,comm --sort=-%cpu | head -n 6
```

## Comparison

### ps vs top vs htop

| | `ps` | `top` | `htop` |
|---|---|---|---|
| View | Snapshot | Live | Live, interactive |
| Customisable columns | Fully (`-o`) | Yes (`f` key) | Yes (setup menu) |
| Scripts | Ideal | `top -b -n 1` | Not intended |
| Installed by default | Yes | Yes | Often not |
| Extras | — | Kill, renice | Tree, search, filter, mouse, per-CPU bars |

### ps aux vs ps -ef

| | `ps aux` | `ps -ef` |
|---|---|---|
| Style | BSD (no dash) | UNIX/POSIX |
| Shows PPID | No | Yes |
| Shows %CPU, %MEM, RSS | Yes | No |
| Use when | Looking for resource hogs | Looking at parent–child relationships |

### pgrep vs pidof

| | `pgrep` | `pidof` |
|---|---|---|
| Matching | Regex on name, or full command line with `-f` | Exact program name |
| Filters | User, terminal, parent, newest/oldest | Few |
| Script use | Preferred (`pgrep -x name`) | Simple cases |

## Common Mistakes

- Reading "free" memory instead of "available" and concluding the server is out of memory.
- Judging load average without knowing the number of CPUs.
- Treating `%CPU` > 100 in `top` as an error — it is summed over threads on several cores.
- `ps aux | grep name` matching itself; `pgrep` avoids it.
- `pidof java` returning many PIDs — use `pgrep -f` with something unique in the command line.

## Key Takeaways

- `ps aux` (resources) and `ps -ef` (PPID) list everything; `ps -eo … --sort=-%mem` builds custom reports.
- `top`: load average vs CPU count, `us`/`sy`/`wa`/`st`, available memory; `P`/`M` sort, `k` kill, `1` per-CPU, `q` quit.
- `htop` is the interactive upgrade: tree, search, filter, kill.
- `pgrep -a name`, `pgrep -f pattern`, `pidof name` find PIDs without grepping `ps`.
- `nice`/`renice` adjust CPU priority (−20 highest, 19 lowest).
