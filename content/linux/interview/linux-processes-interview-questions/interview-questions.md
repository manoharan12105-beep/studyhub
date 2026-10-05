# Processes, Signals and Services Interview Questions — Interview Questions

## Beginner

### Q1. What is a process? How is it different from a program?

<details>
<summary>Answer</summary>

A program is an executable file on disk. A process is a running instance of it, with its own PID, memory, open files, environment, owner and state. One program can run as many processes at once (several `bash` shells), and each process has a parent (PPID).

</details>

### Q2. How do you list all processes and find a specific one?

<details>
<summary>Answer</summary>

`ps aux` or `ps -ef` list all processes; `ps aux | grep [n]ginx` filters (the bracket trick hides the grep itself), but `pgrep -a nginx` is cleaner. `top`/`htop` show them live, sorted by CPU or memory.

</details>

### Q3. What is the difference between `kill`, `kill -9` and `killall`?

<details>
<summary>Answer</summary>

`kill PID` sends SIGTERM, asking the process to exit cleanly. `kill -9 PID` sends SIGKILL, which the kernel enforces immediately — no cleanup, so use it only when SIGTERM fails. `killall name` (and `pkill pattern`) send a signal to processes by name instead of PID.

</details>

### Q4. How do you run a command in the background and bring it back?

<details>
<summary>Answer</summary>

Append `&` to start it in the background; `jobs` lists jobs; `fg %1` brings job 1 to the foreground; `Ctrl+Z` suspends the foreground job and `bg` resumes it in the background.

</details>

### Q5. How do you start, stop and enable a service at boot?

<details>
<summary>Answer</summary>

`sudo systemctl start nginx`, `sudo systemctl stop nginx`, `sudo systemctl enable nginx` (start at boot; `enable --now` does both), `systemctl status nginx` to check, `sudo systemctl restart nginx` or `reload` (re-read configuration without stopping, if supported).

</details>

## Intermediate

### Q6. What is a zombie process? What is an orphan process?

<details>
<summary>Answer</summary>

A **zombie** (`Z`) has exited, but its parent has not yet read its exit status with `wait()`; only a process-table entry remains. It uses no CPU or memory, but many zombies indicate a buggy parent and can exhaust PIDs. Fix the parent. An **orphan** is a running process whose parent died; it is adopted by PID 1 (systemd) or a subreaper, which reaps it when it exits.

</details>

### Q7. Why should you try SIGTERM before SIGKILL?

<details>
<summary>Answer</summary>

SIGTERM can be handled: the process can finish requests, flush buffers, close database connections, delete lock and PID files and exit cleanly. SIGKILL ends it instantly, which can leave corrupted data, stale locks, temporary files or half-finished transactions. Escalate to SIGKILL only after a timeout — exactly what `systemctl stop` does.

</details>

### Q8. What do the process states R, S, D, T and Z mean?

<details>
<summary>Answer</summary>

`R` running or runnable (waiting for a CPU); `S` interruptible sleep (waiting for an event, e.g. input); `D` uninterruptible sleep (usually waiting for disk or NFS I/O — cannot be killed until it returns); `T` stopped (Ctrl+Z / SIGSTOP) or traced; `Z` zombie. Many `D` processes raise the load average even with idle CPUs.

</details>

### Q9. How do you keep a command running after you log out?

<details>
<summary>Answer</summary>

`nohup cmd > out.log 2>&1 &` ignores SIGHUP; `disown` removes an already running job from the shell's job table; `setsid cmd` starts it in a new session; `tmux`/`screen` keep a whole terminal session alive to reattach later. For anything permanent, create a systemd service (supervised, restarted, logged).

</details>

### Q10. What is the difference between `systemctl restart` and `systemctl reload`?

<details>
<summary>Answer</summary>

`restart` stops and starts the service: new process, dropped connections, brief downtime. `reload` asks the running service to re-read its configuration (typically via SIGHUP, as defined by `ExecReload=`) without stopping — supported by nginx, sshd and others. `reload-or-restart` uses reload when available.

</details>

### Q11. How do you see the logs of a service since the last boot, only errors?

<details>
<summary>Answer</summary>

`journalctl -u myapp -b -p err --no-pager`. Add `-f` to follow, `--since "1 hour ago"` for a time window, `-n 100` for the last lines.

</details>

## Advanced

### Q12. Explain how a new process is created in Linux.

<details>
<summary>Answer</summary>

The parent calls `fork()` (internally `clone()`), creating a near-identical child with a new PID; memory is shared copy-on-write. The child usually calls `execve()` to replace its program with a new one, keeping the PID and open file descriptors (which is how redirection works). The parent calls `wait()`/`waitpid()` to collect the child's exit status; until then the finished child is a zombie.

</details>

### Q13. A process ignores `kill -9`. How is that possible?

<details>
<summary>Answer</summary>

SIGKILL cannot be caught, but delivery waits while the process is in uninterruptible sleep (`D`) inside the kernel — typically stuck on I/O to a failing disk or an unreachable NFS server. It is also impossible to kill a zombie (already dead) or, without privileges, another user's process (`Operation not permitted`). Fix the underlying I/O problem or reboot; for zombies, deal with the parent.

</details>

### Q14. What happens to a service's processes when you run `systemctl stop`?

<details>
<summary>Answer</summary>

systemd runs `ExecStop=` if defined, otherwise sends SIGTERM (the `KillSignal=`) to the main process and, with the default `KillMode=control-group`, to every process in the service's cgroup. After `TimeoutStopSec` (90 s by default) remaining processes get SIGKILL. The state becomes `inactive`, and because the stop was requested, `Restart=` policies do not restart it.

</details>

### Q15. A service keeps restarting every few seconds. How do you investigate?

<details>
<summary>Answer</summary>

`systemctl status` shows `activating (auto-restart)` with the exit code; `journalctl -u name -n 100` shows why it exits each time (configuration error, missing file, port in use, permission, crash). `systemctl cat name` shows `Restart=` and `ExecStart=`. Check whether the OOM killer is involved (`journalctl -k`). Stop the loop while debugging (`systemctl stop`), reproduce the start as the service user, fix, `reset-failed`, start, and watch the log.

</details>
