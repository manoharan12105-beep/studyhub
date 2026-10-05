# Troubleshooting: CPU, Memory, Services, Ports and Logs

**Module:** Troubleshooting · **Interview priority:** Frequently asked

## How to Use This Topic

Each scenario follows **Symptoms → Possible Causes → Diagnostic Workflow → Fix → Prevention → Interview Explanation**. The commands build on [processes](../../processes/linux-processes/content.md), [process monitoring](../../processes/process-monitoring/content.md), [signals](../../processes/linux-signals/content.md), [systemd](../../system-management/systemd-and-services/content.md) and [logs](../../system-management/logs-and-journalctl/content.md).

Lab demonstrations start harmless background processes (`yes`, a small Python web server) and always stop them again. PIDs, percentages and sizes differ on every machine, so those outputs are marked "varies". Commands that need root or a real service are `# Illustrative`.

> [!IMPORTANT]
> Collect evidence before you restart or kill anything: the process list, the logs and the time. A restart often hides the cause until it happens again.

## Scenario 1: High CPU Usage

### Symptoms

- The server is slow; `uptime` shows a load average well above the number of CPUs (`nproc`).
- Monitoring shows CPU at 100 %; fans spin; requests time out.

### Possible Causes

- A busy loop or runaway thread in an application; heavy garbage collection in a JVM with too little memory.
- A legitimate burst (batch job, backup compression, build).
- Many processes waiting on slow disks — high load with low CPU usage points to I/O wait (`wa` in `top`), not CPU.
- Malware such as a crypto miner (unknown process names, unusual users).

### Diagnostic Workflow

Start a CPU-hungry process in the lab, then find it the way you would on a server:

```bash
cd ~/linux-lab
yes > /dev/null &
sleep 2
ps -eo pid,%cpu,%mem,comm --sort=-%cpu | head -3
```

**Output (varies):**

```text
    PID %CPU %MEM COMMAND
   1196 99.5  0.0 yes
      1  3.1  0.1 systemd
```

Load compared with CPU count:

```bash
# Illustrative
uptime          # load average: 7.91, 6.40, 3.12   (1, 5, 15 minutes)
nproc           # 4  → a load of 7.9 on 4 CPUs means work is queuing
top             # press P to sort by CPU, 1 for per-CPU lines; check %wa for I/O wait
```

Then ask: which user and command line? Since when? Is it expected?

```bash
# Illustrative
ps -o pid,user,etime,cmd -p 1196        # owner, run time, full command
top -H -p <pid>                         # threads of one process (find a hot Java thread)
```

### Fix

Stop the lab process:

```bash
kill %1
wait 2>/dev/null
jobs
echo "stopped"
```

**Output:**

```text
stopped
```

- Expected but heavy work: lower its priority (`renice +10 -p <pid>`) or reschedule it.
- Stuck application: capture diagnostics first (`jstack <pid>` for Java, logs), then restart the service through systemd.
- Unknown process: investigate (`ls -l /proc/<pid>/exe`, owner, network connections) before killing; treat as a security incident if suspicious.
- Use `kill` (SIGTERM) first and `kill -9` only if the process ignores it.

### Prevention

Resource limits (`CPUQuota=` in systemd units, container limits), monitoring with alerts on sustained CPU and load, performance testing, timeouts and back-off in retry logic.

### Interview Explanation

"I check `uptime` against `nproc` to see whether the load is really high, then `top` sorted by CPU or `ps -eo pid,%cpu,comm --sort=-%cpu` to find the process, and its owner, start time and full command. High load with idle CPU means I/O wait, which is a disk problem rather than a CPU one. For an application I capture a thread dump and logs before restarting it; heavy but legitimate jobs get `renice` or rescheduling; unknown processes are investigated before being killed."

## Scenario 2: High Memory Usage

### Symptoms

- `free -h` shows little *available* memory; swap usage climbs; the system becomes sluggish.
- A process disappears suddenly — the kernel's **OOM killer** chose it.

### Possible Causes

- A memory leak (usage grows steadily until the process dies).
- A heap or cache configured larger than the machine can afford (`-Xmx` too high, oversized database buffers).
- Too many worker processes or threads.
- Note: a large `buff/cache` value is **not** a problem — Linux uses free RAM as disk cache and releases it on demand. Look at `available`.

### Diagnostic Workflow

```bash
free -h
```

**Output (varies):**

```text
               total        used        free      shared  buff/cache   available
Mem:           7.6Gi       773Mi       5.7Gi       3.5Mi       1.3Gi       6.9Gi
Swap:          2.0Gi          0B       2.0Gi
```

Start a process that allocates about 300 MB, then rank processes by resident memory (RSS, in KiB):

```bash
python3 -c 'b = bytearray(300 * 1024 * 1024); import time; time.sleep(30)' &
sleep 2
ps -eo pid,%mem,rss,comm --sort=-rss | head -3
kill $!
```

**Output (varies):**

```text
    PID %MEM   RSS COMMAND
   1488  3.9 316912 python3
    207  0.4 32724 unattended-upgr
```

Did the OOM killer act?

```bash
# Illustrative
journalctl -k --since "1 hour ago" | grep -i -E 'out of memory|killed process'
# Out of memory: Killed process 2314 (java) total-vm:6123456kB, anon-rss:3950000kB ...
systemctl status myapp       # "Main process exited, code=killed, status=9/KILL"
```

Is it growing? Sample it over time:

```bash
# Illustrative
watch -n 5 'ps -o pid,rss,etime,cmd -p <pid>'
```

### Fix

- Restart the leaking service to recover now (after capturing a heap dump if needed: `jcmd <pid> GC.heap_dump /tmp/heap.hprof`).
- Right-size settings: JVM `-Xmx` below the container or VM limit, fewer workers.
- Add memory or swap only after understanding the cause.

### Prevention

`MemoryMax=` in the systemd unit (contains the damage to one service), monitoring of RSS and swap, load tests, and fixing leaks found in heap dumps.

### Interview Explanation

"I look at `free -h`, focusing on `available` rather than `free`, since cache is reclaimable. `ps --sort=-rss` or `top` sorted by memory shows the biggest consumers. If a process vanished, I check the kernel log for the OOM killer. A steadily growing RSS indicates a leak, so I capture a heap dump, restart the service for immediate relief and fix the leak; limits such as `MemoryMax=` stop one service from taking the whole machine down."

## Scenario 3: A Background Process That Will Not Go Away

### Symptoms

- A job started with `&` keeps running after you expected it to finish, or you need to find and stop something started in another session.
- A process survives after logout — or, the opposite, a long job dies when your SSH session drops.
- Zombie processes (`Z` state) appear in `ps`.

### Possible Causes

- The process ignores or handles SIGTERM, or is stuck in uninterruptible I/O (`D` state — even `kill -9` waits).
- It was started with `nohup`, `setsid`, `disown`, inside `tmux`/`screen`, or as a service, so it is not a child of your shell.
- Without those, a job receives SIGHUP when the terminal closes and dies.
- Zombies: the parent has not collected (waited for) its finished child.

### Diagnostic Workflow

Find it by name or command line:

```bash
cd ~/linux-lab
sleep 300 &
pgrep -a sleep
```

**Output (varies):**

```text
1523 sleep 300
```

```bash
ps -o pid,ppid,stat,etime,cmd -p $!
```

**Output (varies):**

```text
    PID    PPID STAT     ELAPSED CMD
   1523    1468 S          00:00 sleep 300
```

`STAT` tells you what it is doing (`S` sleeping, `R` running, `D` waiting on I/O, `T` stopped, `Z` zombie); `PPID` tells you who started it.

```bash
# Illustrative
ps -eo pid,ppid,stat,cmd | awk '$3 ~ /Z/'     # zombies and their parents
pstree -p <ppid>                               # the family tree
```

### Fix

```bash
kill $!
wait $! 2>/dev/null
echo "exit status: $?"
```

**Output:**

```text
exit status: 143
```

143 = 128 + 15: the process ended because of SIGTERM.

- Polite first: `kill <pid>` (SIGTERM); `kill -9 <pid>` only if it does not exit.
- Zombies cannot be killed — they are already dead. Signal or restart the **parent**; when it exits, `init`/systemd adopts and reaps them.
- `D`-state processes wait on storage or NFS; fix the I/O problem.
- Long jobs that must survive logout: run them as a systemd service, in `tmux`, or with `nohup cmd > log 2>&1 &`.

### Prevention

Run long-lived programs as systemd services (supervised, logged, restartable); use `tmux` for interactive long work; write scripts that handle signals and clean up their children.

### Interview Explanation

"I find the process with `pgrep -a` or `ps`, check its state and parent with `ps -o pid,ppid,stat`, then send SIGTERM and only escalate to SIGKILL if necessary. Zombies are already dead and only disappear when the parent reaps them, so I deal with the parent. For processes in `D` state I look at disk or NFS. Anything that must keep running belongs in a systemd service rather than a background job."

## Scenario 4: Service Not Starting

### Symptoms

- `systemctl start myapp` returns an error, or the service starts and fails a few seconds later.
- `systemctl status` shows `failed` or `activating (auto-restart)` in a loop.

### Possible Causes

| Cause | Typical log line |
|-------|------------------|
| Configuration error | `invalid value`, `could not parse`, `unknown directive` |
| Port already in use | `Address already in use` / `bind() failed` |
| Permission problem | `Permission denied` opening a file, log or socket |
| Missing file, binary or dependency | `No such file or directory`, `status=203/EXEC` |
| Wrong user, environment or working directory in the unit | `status=200/CHDIR`, missing variables |
| Unit file edited but not reloaded | Old behaviour; warning "changed on disk" |

### Diagnostic Workflow

```bash
# Illustrative
systemctl status myapp --no-pager
```

**Output (varies):**

```text
× myapp.service - Inventory API
     Loaded: loaded (/etc/systemd/system/myapp.service; enabled; preset: enabled)
     Active: failed (Result: exit-code) since Thu 2026-01-15 09:30:12 UTC; 8s ago
    Process: 2210 ExecStart=/opt/myapp/bin/start.sh (code=exited, status=1/FAILURE)
   Main PID: 2210 (code=exited, status=1/FAILURE)

Jan 15 09:30:12 devbox start.sh[2210]: Error: bind 0.0.0.0:8080 failed: Address already in use
Jan 15 09:30:12 devbox systemd[1]: myapp.service: Failed with result 'exit-code'.
```

```bash
# Illustrative
journalctl -u myapp -n 50 --no-pager        # the full recent log
journalctl -u myapp -b -p err               # errors since boot
systemctl cat myapp                         # the unit actually in use
sudo -u myapp /opt/myapp/bin/start.sh       # reproduce as the service user
```

### Fix

Fix what the log says (config value, port, permissions, path), then:

```bash
# Illustrative
sudo systemctl daemon-reload        # only if you edited the unit file
sudo systemctl restart myapp
systemctl is-active myapp
journalctl -u myapp -f              # watch it come up
```

`systemctl reset-failed myapp` clears a start-limit lockout ("start request repeated too quickly") once the cause is fixed.

### Prevention

Validate configuration before restarting (`nginx -t`, `sshd -t`, application dry runs), deploy unit files with `daemon-reload`, health checks and alerts on failed units (`systemctl --failed`).

### Interview Explanation

"`systemctl status` gives the state, exit code and last log lines; `journalctl -u name -n 50` gives the full story. Exit code 203 means the binary could not be executed, 200 a bad working directory; otherwise the application log tells me whether it is configuration, a port conflict, permissions or a missing dependency. I reproduce the start command as the service user when needed, fix the cause, run `daemon-reload` if I touched the unit, restart and watch the log."

## Scenario 5: Port Already in Use

### Symptoms

- A server fails to start with `Address already in use` (`EADDRINUSE`, errno 98) or `bind() failed`.

### Possible Causes

- An old instance is still running (did not stop, or was started twice — once manually, once as a service).
- Another application uses the same port.
- A crashed process left a child holding the socket.

### Diagnostic Workflow

Reproduce it: start a small web server on port 8080, then try to start a second one:

```bash
cd ~/linux-lab
python3 -m http.server 8080 --bind 127.0.0.1 > /dev/null 2>&1 &
sleep 1
python3 -m http.server 8080 --bind 127.0.0.1 2>&1 | tail -1
```

**Output:**

```text
OSError: [Errno 98] Address already in use
```

Who holds the port? See Scenario 6 — `ss -ltnp` answers it:

```bash
ss -ltnp | grep -E 'State|:8080'
```

**Output (varies):**

```text
State     Recv-Q    Send-Q        Local Address:Port       Peer Address:Port    Process
LISTEN    0         5                 127.0.0.1:8080            0.0.0.0:*        users:(("python3",pid=1200,fd=3))
```

### Fix

Decide whether the existing process is the one that should be running. If it is an old or duplicate instance, stop it (through systemd if it is a service):

```bash
pkill -f 'http.server 8080'
sleep 1
ss -ltn | grep -c ':8080'
```

**Output:**

```text
0
```

No listener remains (`grep -c` counts 0 matching lines). Otherwise, configure the new application to use a different port.

### Prevention

Run servers only as services (no duplicate manual starts), document port assignments, and make deployment scripts stop the old instance before starting the new one.

### Interview Explanation

"`Address already in use` means another socket is already listening on that address and port. I find the owner with `sudo ss -ltnp 'sport = :8080'` or `lsof -i :8080`. If it is a stale or duplicate instance I stop it properly — via `systemctl` if it is a service — otherwise I move one application to another port."

## Scenario 6: Which Process Is Using a Port?

### Symptoms

- You need to know what listens on a port, or which program owns a connection.

### Diagnostic Workflow

Three tools answer the question; start a listener in the lab first:

```bash
cd ~/linux-lab
python3 -m http.server 8080 --bind 127.0.0.1 > /dev/null 2>&1 &
sleep 1
lsof -nP -i :8080
```

**Output (varies):**

```text
COMMAND  PID      USER FD   TYPE DEVICE SIZE/OFF NODE NAME
python3 1493 student 3u  IPv4  23836      0t0  TCP 127.0.0.1:8080 (LISTEN)
```

```bash
fuser 8080/tcp
```

**Output (varies):**

```text
8080/tcp:             1493
```

```bash
pgrep -a -f http.server
```

**Output (varies):**

```text
1493 python3 -m http.server 8080 --bind 127.0.0.1
```

| Command | Notes |
|---------|-------|
| `ss -ltnp` | All TCP listeners with process; `-u` for UDP; filter `'sport = :8080'` |
| `lsof -nP -i :8080` | `-n` no DNS, `-P` numeric ports; also shows established connections |
| `fuser 8080/tcp` | Just the PIDs; `fuser -k` kills them (careful) |

> [!NOTE]
> Without root you only see process details for **your own** processes; `sudo ss -ltnp` shows everyone's. `0.0.0.0:8080` or `*:8080` listens on all interfaces; `127.0.0.1:8080` is reachable only from the machine itself — a common reason a service works locally but not from outside.

### Fix

```bash
kill $!
```

Stop or reconfigure the owner as in Scenario 5; if the port is free but clients cannot connect, check the bind address and the firewall.

### Prevention

Keep a list of which service owns which port; monitor expected listeners.

### Interview Explanation

"`sudo ss -ltnp` lists listening TCP sockets with the owning process and PID; `lsof -i :PORT` and `fuser PORT/tcp` are alternatives. I also look at the local address — `127.0.0.1` means local only, `0.0.0.0` means all interfaces."

## Scenario 7: Checking Recent Logs

### Symptoms

- Something went wrong "around 10 minutes ago" and you need the relevant log lines fast.

### Diagnostic Workflow

| Need | Command |
|------|---------|
| One service, last lines | `journalctl -u nginx -n 50 --no-pager` |
| Follow live | `journalctl -u nginx -f`, `tail -f /var/log/nginx/error.log` |
| A time window | `journalctl --since "10 min ago"`, `--since "09:00" --until "09:30"` |
| Only errors | `journalctl -p err -b` |
| Kernel (OOM, disk errors) | `journalctl -k`, `dmesg -T` |
| Previous boot (after a crash) | `journalctl -b -1 -n 100` |
| Plain-text logs | `/var/log/syslog`, `/var/log/auth.log`, application log directories |

In the lab, the same questions for a plain log file:

```bash
cd ~/linux-lab
grep -E 'ERROR|WARN' app.log | tail -n 3
```

**Output:**

```text
2026-01-15 10:02:10 WARN  [http] Slow request: GET /api/orders took 2300ms
2026-01-15 10:30:00 ERROR [payment] Payment gateway returned 503
2026-01-15 10:30:01 ERROR [payment] Order 1042 payment failed
```

```bash
grep -c ERROR app.log
```

**Output:**

```text
3
```

### Fix

Correlate: the first error in time is usually the cause, later ones are consequences. Match timestamps across services, the kernel log and deployment history.

### Prevention

Structured logs with timestamps and request IDs, central log collection, retention long enough to investigate incidents.

### Interview Explanation

"For a service I use `journalctl -u name --since '15 min ago'`, adding `-p err` for errors only and `-f` to follow. For file-based logs, `tail -n`, `tail -f` and `grep` with context (`-B`/`-A`). I look for the first error in the time window, then check the kernel log for OOM kills or disk errors, and `-b -1` for the boot before a crash."

## Key Takeaways

- CPU: `uptime` vs `nproc`, `top`/`ps --sort=-%cpu`; high load with idle CPU = I/O wait.
- Memory: watch `available`, not `free`; `ps --sort=-rss`; the OOM killer leaves traces in `journalctl -k`.
- Processes: `pgrep -a`, `ps -o pid,ppid,stat`; SIGTERM before SIGKILL; zombies need their parent fixed.
- Services: `systemctl status` → `journalctl -u name` → fix → `daemon-reload` (if the unit changed) → restart.
- Ports: `Address already in use` → `ss -ltnp` / `lsof -i :PORT` / `fuser PORT/tcp` → stop the duplicate or change the port.
- Logs: `journalctl -u`, `--since`, `-p err`, `-f`, `-b -1`; the first error in time is usually the cause.
