# Scenario-Based Linux Interview Questions — Interview Questions

## Intermediate

### Q1. The application reports "No space left on device". Walk me through your response.

<details>
<summary>Answer</summary>

1. `df -h` — which filesystem is full; `df -i` — inodes.
2. `sudo du -xh --max-depth=1 /var | sort -h | tail` — drill down to the largest directories; `find /var -xdev -type f -size +500M -exec ls -lh {} +` for big files.
3. If `du` totals are far below `df` usage: `sudo lsof +L1` for deleted-but-open files.
4. Mitigate: compress or delete old rotated logs and dumps, truncate an active runaway log (`: > file`), clean package caches, restart a process holding deleted files.
5. Prevent: logrotate, journald limits, monitoring at 80 %, separate `/var` or data volume, retention for backups.

</details>

### Q2. Users say the website is down. What do you check?

<details>
<summary>Answer</summary>

1. Reproduce from outside and from the server: `curl -I https://site` vs `curl -I http://localhost` — this splits network problems from application problems.
2. Service: `systemctl status nginx` (and the application service), `journalctl -u nginx -n 50`, `/var/log/nginx/error.log`.
3. Listening: `sudo ss -ltnp | grep -E ':80|:443'`.
4. Resources: `df -h`, `free -h`, `uptime`/`top`.
5. Dependencies: database or upstream reachable (`nc -zv db 5432`), DNS (`dig site`), TLS certificate expiry.
6. Recent changes: deployment, configuration (`nginx -t`), firewall rules.

Mitigate (restart, roll back), then find and fix the cause.

</details>

### Q3. A service fails to start after a configuration change. What do you do?

<details>
<summary>Answer</summary>

`systemctl status name` and `journalctl -u name -n 50` show the error. Validate the configuration with the program's checker (`nginx -t`, `sshd -t`, `apachectl configtest`) and compare with the previous version (`diff`, version control, `.bak`). Fix the error or roll back, restart, and confirm with `systemctl is-active` and the log. Going forward: validate before reload in the deployment process.

</details>

### Q4. You need to know which process uses port 8080 and stop it.

<details>
<summary>Answer</summary>

`sudo ss -ltnp 'sport = :8080'` (or `sudo lsof -i :8080`) gives the PID and command. Check what it is (`ps -o pid,user,etime,cmd -p PID`). If it belongs to a service, `sudo systemctl stop name`; otherwise `kill PID`, and `kill -9 PID` only if it does not exit. Confirm the port is free with `ss` again.

</details>

### Q5. A script runs fine manually but does nothing from cron.

<details>
<summary>Answer</summary>

Check that cron started it (`grep CRON /var/log/syslog` or `journalctl -u cron`). Then the classic differences: minimal `PATH` (use absolute paths or set `PATH`), `/bin/sh` instead of bash, home directory as working directory, no environment variables from `.bashrc`, `%` needing escapes, missing execute permission or shebang. Redirect output (`>> /var/log/job.log 2>&1`) to see the actual error, and reproduce with `env -i /bin/sh -c '/path/script'`.

</details>

### Q6. A user gets "Permission denied" when running a deployment script in a shared directory.

<details>
<summary>Answer</summary>

`id user` (groups — and whether a recent group change needs a fresh login), `ls -l script` (execute bit, owner, group), `namei -l /path/to/script` (every directory needs `x`), `findmnt -no OPTIONS` for `noexec`. Fix with least privilege: correct group ownership plus `g+x` (or `chmod 750`), add the user to the group, SGID on the shared directory — never `chmod 777`.

</details>

### Q7. The server is very slow. How do you find out why?

<details>
<summary>Answer</summary>

`uptime` (load vs `nproc`), `top` (CPU hogs, `%wa` I/O wait, memory, swap), `free -h` (`available`), `vmstat 1 5` (run queue, swapping, I/O wait), `iostat -x 1` if available (disk saturation), `df -h` (full disks), `journalctl -k` (OOM kills, disk errors). Identify the bottleneck — CPU, memory, disk or network — then the process causing it, and act: renice, restart, stop a runaway job, add resources, or fix the code.

</details>

## Advanced

### Q8. You cannot SSH into a server any more. What could be wrong, and how do you investigate?

<details>
<summary>Answer</summary>

From the client: `ssh -v user@host` shows where it fails. *Timeout* → network, firewall, security group, server down. *Connection refused* → sshd not running or a different port. *Permission denied (publickey)* → key not offered or not accepted. *Host key changed* → server rebuilt or MITM. Via the console (cloud serial console): `systemctl status ssh`, `journalctl -u ssh`, `sshd -t` for configuration errors, `df -h` (full disk can block logins), permissions on `~/.ssh` and `authorized_keys`, `AllowUsers`/`PermitRootLogin`, and fail2ban bans.

</details>

### Q9. Memory usage on a Java service grows every day until it is killed. How do you approach it?

<details>
<summary>Answer</summary>

Confirm the pattern: RSS over time (`ps -o rss,etime -p PID`, monitoring), OOM-killer entries (`journalctl -k | grep -i oom`), `systemctl status` showing `status=9/KILL`. Distinguish heap from native memory: compare `-Xmx` with RSS, use `jcmd PID GC.heap_info` and a heap dump (`jcmd PID GC.heap_dump`) analysed for growing objects. Short term: schedule a restart and set `MemoryMax=` so the service, not the machine, is affected; long term: fix the leak or right-size the heap.

</details>

### Q10. A disk filled up overnight and was cleaned by morning. Find the cause.

<details>
<summary>Answer</summary>

Something wrote large temporary data and then deleted it — likely a scheduled job. List cron jobs and timers (`crontab -l` per user, `/etc/cron.d`, `systemctl list-timers`) around the time; check `journalctl --since/--until` for that window; examine monitoring graphs for the exact time. If needed, capture evidence the next night with a scheduled `du`/`find -mmin` snapshot. Fix by sending the job's temporary output to a suitable volume or streaming it, and alert at 80 %.

</details>

### Q11. After a reboot, the application's data directory `/data` is empty.

<details>
<summary>Answer</summary>

The disk probably did not mount, so the application sees (and may write into) the empty mount-point directory on the root filesystem. Check `findmnt /data`, `lsblk`, `journalctl -b | grep -i -E 'mount|data'`, and `/etc/fstab` (wrong UUID, typo, missing `nofail`). Stop the application, mount the disk (`sudo mount /data` or `mount -a`), verify the data, then fix fstab with the correct UUID. Prevent with `RequiresMountsFor=/data` in the service unit, so the service starts only when the mount exists.

</details>

### Q12. You suspect a compromised server (unknown process, high CPU). What do you do?

<details>
<summary>Answer</summary>

Do not just kill it — preserve evidence and follow the incident process. Observe: `ps -eo pid,user,etime,cmd --sort=-%cpu`, `ls -l /proc/PID/exe` and `cwd`, network connections (`sudo ss -tnp`), cron entries and systemd units for persistence, `last` and `/var/log/auth.log` for logins, recently modified files (`find / -xdev -mtime -2 -type f`). Isolate the machine (security group / network), inform security, capture data, then rebuild from a trusted image rather than cleaning it, rotate credentials and SSH keys, and patch the entry point.

</details>
