# Processes, Services and Scheduling Cheat Sheet

Process states, monitoring, job control, signals, systemd, logs and cron.

## Process Basics

- **Process** = running program: PID, PPID, owner (UID), state, memory, open files, environment.
- Created by `fork()` (copy) + `execve()` (load the new program); the parent `wait()`s for the exit status.
- PID 1 = `systemd` (init); it adopts orphans.
- **Zombie**: finished, not yet reaped by its parent (cannot be killed — fix the parent). **Orphan**: parent died, adopted by PID 1.

## States (`STAT` in ps)

| Code | State |
|------|-------|
| `R` | Running or runnable |
| `S` | Interruptible sleep (waiting for an event) |
| `D` | Uninterruptible sleep (usually disk/NFS I/O) — cannot be killed until it returns |
| `T` | Stopped (Ctrl+Z, SIGSTOP) or traced |
| `Z` | Zombie |
| Extra | `s` session leader, `+` foreground group, `<` high priority, `N` low priority, `l` multithreaded |

## Monitoring

| Command | Purpose |
|---------|---------|
| `ps aux` / `ps -ef` | Snapshot of all processes |
| `ps -eo pid,ppid,user,stat,%cpu,%mem,cmd --sort=-%cpu \| head` | Custom columns, sorted |
| `ps -o pid,ppid,stat,etime,cmd -p PID` | One process in detail |
| `pgrep -a name` / `pgrep -f pattern` | Find PIDs (with command line) |
| `pstree -p` | Process tree |
| `top` | Live: `P` CPU, `M` memory, `1` per CPU, `k` kill, `q` quit; `%wa` = I/O wait |
| `uptime` | Load averages (1, 5, 15 min) — compare with `nproc` |
| `free -h` | Memory — watch `available`, not `free` |
| `lsof -p PID` / `ls -l /proc/PID/fd` | Files opened by a process |
| `nice -n 10 cmd` / `renice +5 -p PID` | Lower priority (−20 highest … 19 lowest) |

## Job Control

| Action | Command |
|--------|---------|
| Start in background | `cmd &` |
| List jobs | `jobs -l` |
| Suspend foreground job | `Ctrl+Z` |
| Resume in background / foreground | `bg %1` / `fg %1` |
| Interrupt foreground job | `Ctrl+C` (SIGINT) |
| Survive logout | `nohup cmd > out.log 2>&1 &`, `disown %1`, `setsid`, `tmux` |
| Last background PID | `$!` |

## Signals

| Signal | No. | Default | Typical use |
|--------|-----|---------|-------------|
| `SIGHUP` | 1 | Terminate | Terminal closed; many daemons reload configuration |
| `SIGINT` | 2 | Terminate | `Ctrl+C` |
| `SIGQUIT` | 3 | Core dump | `Ctrl+\`; Java prints a thread dump |
| `SIGKILL` | 9 | Terminate | Forced kill — cannot be caught or ignored |
| `SIGTERM` | 15 | Terminate | Default of `kill`; polite shutdown request |
| `SIGSTOP` | 19 | Stop | Pause — cannot be caught |
| `SIGTSTP` | 20 | Stop | `Ctrl+Z` |
| `SIGCONT` | 18 | Continue | Resume a stopped process |
| `SIGCHLD` | 17 | Ignore | Child changed state (parent should reap) |

`kill PID` → `kill -15` → wait → `kill -9` only if needed. `kill -l` lists signals; `trap 'cleanup' EXIT INT TERM` in scripts. (Numbers are for x86/ARM Linux.)

## systemd

| Command | Purpose |
|---------|---------|
| `systemctl status svc` | State, PID, recent log lines |
| `sudo systemctl start / stop / restart svc` | Control now |
| `sudo systemctl reload svc` | Re-read configuration without stopping |
| `sudo systemctl enable --now svc` / `disable` | Start at boot (and now) |
| `systemctl is-active / is-enabled svc` | Scriptable checks |
| `systemctl list-units --type=service --state=failed` / `systemctl --failed` | Failed units |
| `systemctl cat svc` / `sudo systemctl edit svc` | Show / override the unit |
| `sudo systemctl daemon-reload` | After editing unit files |
| `systemctl list-timers` | Scheduled timers |

Unit essentials: `[Service] ExecStart=… User=… WorkingDirectory=… Restart=on-failure Environment=…` and `[Install] WantedBy=multi-user.target`.

## Logs

| Command | Purpose |
|---------|---------|
| `journalctl -u svc -n 50 --no-pager` | Last lines of one service |
| `journalctl -u svc -f` | Follow |
| `journalctl --since "1 hour ago"` / `--since 09:00 --until 09:30` | Time window |
| `journalctl -p err -b` | Errors since boot |
| `journalctl -k` / `dmesg -T` | Kernel messages (OOM, disks) |
| `journalctl -b -1` | Previous boot |
| `journalctl --disk-usage` / `--vacuum-size=1G` | Journal size |
| `/var/log/syslog`, `/var/log/auth.log` (Debian/Ubuntu) · `/var/log/messages`, `/var/log/secure` (RHEL) | Text logs |
| `logger -t tag "msg"` | Write to the system log from scripts |

logrotate: `/etc/logrotate.d/app` with `daily`, `rotate 7`, `compress`, `delaycompress`, `missingok`, `notifempty`, `copytruncate` or `postrotate`.

## cron

```text
┌ minute (0-59)  ┌ hour (0-23)  ┌ day of month (1-31)  ┌ month (1-12)  ┌ day of week (0-7, 0/7 = Sun)
*/15             *              *                      *               *      command
```

| Expression | Runs |
|------------|------|
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Hourly |
| `30 2 * * *` | 02:30 daily |
| `0 9 * * 1-5` | 09:00 weekdays |
| `0 0 1 * *` | Midnight on the 1st |
| `@reboot` | At boot |

`crontab -e` edit · `crontab -l` list · `crontab -r` **removes all** · system files `/etc/crontab`, `/etc/cron.d/` have a **user** field. Cron has a minimal `PATH`, uses `/bin/sh`, needs `\%`, and loses output unless you redirect `>> log 2>&1`. Both day fields set → **either** matches.
