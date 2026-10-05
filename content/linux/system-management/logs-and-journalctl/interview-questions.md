# Logs: /var/log, journalctl and Log Rotation — Interview Questions

## Beginner

### Q1. Where are system logs stored in Linux?

<details>
<summary>Answer</summary>

Text logs in `/var/log` — `syslog` (Debian/Ubuntu) or `messages` (RHEL), `auth.log`/`secure` for authentication, `kern.log`, and per-application directories such as `/var/log/nginx`. The systemd journal is stored in `/var/log/journal` (persistent) or `/run/log/journal` (volatile) and read with `journalctl`.

</details>

### Q2. How do you view the logs of a specific systemd service?

<details>
<summary>Answer</summary>

`journalctl -u servicename`. Add `-f` to follow live, `-n 100` for the last 100 lines, `--since "1 hour ago"` for a time window, `-p err` for errors only, `-b` for the current boot.

</details>

### Q3. How do you follow a log file in real time?

<details>
<summary>Answer</summary>

`tail -f /var/log/syslog` (or `tail -F` to survive rotation), or `journalctl -f` / `journalctl -u name -f` for journal entries.

</details>

### Q4. Where do you look for failed SSH login attempts?

<details>
<summary>Answer</summary>

`/var/log/auth.log` on Debian/Ubuntu or `/var/log/secure` on RHEL (`grep 'Failed password'`), `journalctl -u ssh` (or `sshd`), and `sudo lastb` for the binary record of failed logins.

</details>

## Intermediate

### Q5. What is log rotation and why is it needed?

<details>
<summary>Answer</summary>

Periodically renaming the current log, starting a new one, compressing older ones and deleting the oldest, so logs do not grow without limit and fill the disk. `logrotate` (run daily by a timer or cron) does this according to rules in `/etc/logrotate.conf` and `/etc/logrotate.d/`.

</details>

### Q6. What is the difference between `copytruncate` and a `postrotate` signal in logrotate?

<details>
<summary>Answer</summary>

With `postrotate` the log is renamed and the application is told (usually by a signal) to close and reopen its log file, so it starts writing to a new file — clean, no data loss. `copytruncate` copies the log and then truncates the original in place, for applications that cannot reopen logs; lines written between the copy and the truncate can be lost.

</details>

### Q7. How do you see why a server rebooted or crashed last night?

<details>
<summary>Answer</summary>

With a persistent journal, `journalctl -b -1 -p warning` (previous boot) and `journalctl -b -1 -n 100` for its last messages; `last -x reboot shutdown` for reboot records; `/var/log/kern.log` or `syslog` for kernel panics, OOM kills or hardware errors; and the cloud provider's console log if the kernel crashed before writing to disk.

</details>

### Q8. How do you check whether the OOM killer terminated a process?

<details>
<summary>Answer</summary>

Search kernel messages: `journalctl -k | grep -i -E 'out of memory|oom|killed process'` or `dmesg -T | grep -i oom`. The message names the killed process, its PID and memory usage. In containers, an exit code of 137 and `OOMKilled: true` in `docker inspect`/`kubectl describe` indicate the same.

</details>

## Advanced

### Q9. The systemd journal uses several GB of disk. How do you reduce and limit it?

<details>
<summary>Answer</summary>

Check with `journalctl --disk-usage`; clean immediately with `sudo journalctl --vacuum-size=500M` or `--vacuum-time=14d`; limit permanently in `/etc/systemd/journald.conf` with `SystemMaxUse=500M` (and `MaxRetentionSec=`), then `sudo systemctl restart systemd-journald`. Also find what is logging so much (`journalctl -o json | …` or `journalctl -n 1000` to see the noisy unit).

</details>

### Q10. How would you send a script's messages to the system log, and why do it?

<details>
<summary>Answer</summary>

`logger -t myscript -p user.err "backup failed"` sends a message with a tag and priority to syslog/journald. Benefits: central rotation and retention, timestamps and host names added automatically, filtering with `journalctl -t myscript`, and forwarding to central log systems without custom files.

</details>

### Q11. An application's log file keeps growing although logrotate is configured. What could be wrong?

<details>
<summary>Answer</summary>

The rule's path pattern may not match the file; logrotate may not run (timer/cron disabled — check `systemctl list-timers logrotate`); the application keeps writing to the renamed file because it is not told to reopen (missing `postrotate` or `copytruncate`), so the new file stays empty while the old one grows; or `size`/`daily` conditions are not met. Run `sudo logrotate -d /etc/logrotate.d/app` to see what it would do and `sudo lsof | grep app.log` to see which file the app holds open.

</details>
