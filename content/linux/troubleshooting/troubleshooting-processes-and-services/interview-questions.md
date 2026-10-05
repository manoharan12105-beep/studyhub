# Troubleshooting: CPU, Memory, Services, Ports and Logs — Interview Questions

## Beginner

### Q1. How do you find which process is using the most CPU?

<details>
<summary>Answer</summary>

`top` (sorted by CPU by default; press `P`), or `ps -eo pid,user,%cpu,comm --sort=-%cpu | head`. Then check the process's owner, start time and full command line before deciding what to do.

</details>

### Q2. How do you find which process is listening on port 8080?

<details>
<summary>Answer</summary>

`sudo ss -ltnp | grep :8080` (or `ss -ltnp 'sport = :8080'`), `sudo lsof -i :8080`, or `sudo fuser 8080/tcp`. Without `sudo`, process details appear only for your own processes.

</details>

### Q3. A service will not start. What are your first two commands?

<details>
<summary>Answer</summary>

`systemctl status <service>` (state, exit code, last log lines) and `journalctl -u <service> -n 50 --no-pager` (the full recent log). The error message there usually names the cause: configuration, port, permissions or a missing file.

</details>

### Q4. How do you view the logs from the last 10 minutes?

<details>
<summary>Answer</summary>

`journalctl --since "10 min ago"` (add `-u <service>` for one service, `-p err` for errors only). For file logs, `tail -n 200 file` or `tail -f file` to follow new lines.

</details>

## Intermediate

### Q5. The load average is 12 but CPU usage is low. What does that suggest?

<details>
<summary>Answer</summary>

Load counts processes that are running **or** waiting in uninterruptible sleep (`D` state), usually for disk or NFS I/O. High load with idle CPU points to I/O wait: check `%wa` in `top`, `iostat -x`, processes in `D` state (`ps -eo stat,pid,cmd | grep '^D'`), and storage or network filesystem health.

</details>

### Q6. `free -h` shows only 200 MB free on a 16 GB server. Is it out of memory?

<details>
<summary>Answer</summary>

Not necessarily. Linux uses unused RAM as page cache (`buff/cache`), which is released on demand. The `available` column estimates memory usable by new programs. Real pressure shows as low `available`, growing swap use, swapping activity (`vmstat` `si`/`so`), and OOM-killer messages.

</details>

### Q7. A Java service disappeared without any error in its own log. How do you check whether the OOM killer killed it?

<details>
<summary>Answer</summary>

`journalctl -k | grep -i -E 'out of memory|killed process'` or `dmesg -T | grep -i oom`; `systemctl status` shows `status=9/KILL`. The kernel log names the victim and its memory use. Then compare the heap settings (`-Xmx`) plus native memory with the machine or container limit.

</details>

### Q8. You killed a zombie process with `kill -9` but it is still in the list. Why?

<details>
<summary>Answer</summary>

A zombie has already exited; only its process-table entry remains until the parent reads its exit status with `wait()`. Signals have no effect. Find the parent (`ps -o ppid= -p <pid>`) and fix or restart it; when the parent exits, systemd adopts and reaps the zombie.

</details>

### Q9. A service fails with "Address already in use". What do you do?

<details>
<summary>Answer</summary>

Find the process holding the port (`sudo ss -ltnp 'sport = :PORT'`). If it is an old or duplicate instance (for example started manually besides the systemd service), stop it properly; if it is a different application, change one of the ports. Then start the service again and check its log.

</details>

## Advanced

### Q10. What is the difference between `kill`, `kill -9` and `systemctl stop` for a service?

<details>
<summary>Answer</summary>

`kill <pid>` sends SIGTERM to one process so it can shut down cleanly. `kill -9` sends SIGKILL, which cannot be caught: no cleanup, possibly corrupted files or leftover locks. `systemctl stop` runs the unit's stop logic, signals all processes in the service's cgroup (SIGTERM, then SIGKILL after a timeout), and records the state, so systemd will not treat it as a crash and restart it. For services, always use `systemctl`.

</details>

### Q11. How would you investigate a server that becomes unresponsive every afternoon?

<details>
<summary>Answer</summary>

Gather data from the time window: `journalctl --since/--until` for errors and OOM kills, `sar` history (CPU, memory, I/O, if sysstat is installed), cron jobs and timers around that time, application traffic metrics. Install lightweight sampling if no history exists (a cron job logging `top -b -n 1` and `free`). Correlate the first anomaly — CPU, memory, swap, disk I/O or connections — with a cause such as a batch job, a traffic peak or a leak.

</details>

### Q12. A service starts fine from the terminal but fails under systemd. What differences do you check?

<details>
<summary>Answer</summary>

The user (`User=`), working directory (`WorkingDirectory=`), environment (no shell startup files — set `Environment=`/`EnvironmentFile=`), `PATH`, permissions on files owned by your user, resource limits, sandboxing options (`ProtectHome=`, `ReadOnlyPaths=`), and SELinux/AppArmor contexts. Reproduce with `sudo -u svcuser env -i …` and read `journalctl -u`.

</details>
