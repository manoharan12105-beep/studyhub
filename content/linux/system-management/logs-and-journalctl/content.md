# Logs: /var/log, journalctl and Log Rotation

**Module:** Services, Logs and Scheduling · **Interview priority:** Core

## What Is It?

Linux records what happens on the system in **logs**. Two mechanisms usually run side by side:

- **systemd-journald** collects messages from the kernel, services (their stdout/stderr) and `syslog` calls into a structured, indexed **journal**, read with `journalctl`.
- **rsyslog** (on Debian/Ubuntu and many RHEL systems) writes classic **text files** under `/var/log` — `syslog`/`messages`, `auth.log`/`secure`, `kern.log`.
- Applications often write their own files (`/var/log/nginx/access.log`, `/var/log/postgresql/…`, `/opt/app/logs/app.log`).

**Log rotation** (`logrotate`) renames, compresses and deletes old log files so they do not fill the disk.

## Why It Matters

- Logs are the first place to look when anything fails: a service that will not start, failed logins, a crash, an out-of-memory kill, a disk error.
- Knowing where each kind of log lives and how to filter it by service, time and priority turns a 30-minute search into a one-liner.
- Unrotated logs are a classic cause of full disks.

## Core Concept

### Important log locations

| File (Debian/Ubuntu) | RHEL equivalent | Contains |
|----------------------|-----------------|----------|
| `/var/log/syslog` | `/var/log/messages` | General system messages |
| `/var/log/auth.log` | `/var/log/secure` | Logins, SSH, `sudo`, authentication failures |
| `/var/log/kern.log` | (in `messages`) | Kernel messages |
| `/var/log/dpkg.log`, `/var/log/apt/` | `/var/log/dnf.log` | Package installs and upgrades |
| `/var/log/nginx/`, `/var/log/apache2/` | `/var/log/httpd/` | Web server access and error logs |
| `/var/log/journal/` | same | Persistent systemd journal (binary) |
| `/var/log/wtmp`, `btmp`, `lastlog` | same | Binary login records (`last`, `lastb`, `lastlog`) |

Reading most of these requires root or membership of the `adm` group (Ubuntu) / `systemd-journal` group.

### Log priorities (severity)

| Level | Name | Use |
|-------|------|-----|
| 0 | emerg | System unusable |
| 1 | alert | Act immediately |
| 2 | crit | Critical conditions |
| 3 | err | Errors |
| 4 | warning | Warnings |
| 5 | notice | Normal but significant |
| 6 | info | Informational |
| 7 | debug | Debug details |

`journalctl -p err` shows level 3 **and more severe** (0–3).

### Rotation: how logs stay small

```text
before:   app.log (today)
rotate:   app.log → app.log.1, app.log.1 → app.log.2.gz, …, oldest deleted
after:    app.log (new, empty)   app.log.1   app.log.2.gz   app.log.3.gz
```

The application must then write to the **new** file: either it is told to reopen its log (a `postrotate` command sending `SIGHUP`/`USR1`), or logrotate uses `copytruncate` (copy, then empty the original in place).

## Commands

The outputs below come from one system; yours will show your own services and times.

### journalctl

| Option | Shows |
|--------|-------|
| `-u nginx` | Only one unit (service) |
| `-f` | Follow new entries (like `tail -f`) |
| `-n 50` | Last 50 entries |
| `-e` | Jump to the end in the pager |
| `-b` / `-b -1` | This boot / the previous boot |
| `-p err` | Priority `err` and more severe |
| `--since "1 hour ago"`, `--since "2026-01-15 09:00" --until "10:00"` | Time window |
| `-k` | Kernel messages (like `dmesg`) |
| `-t sshd` | By syslog identifier |
| `-o short-iso`, `-o json-pretty`, `-o cat` | Output formats |
| `--no-pager` | Print directly (scripts) |
| `--disk-usage`, `--vacuum-size=500M`, `--vacuum-time=14d` | Size and cleanup |

The last entries of a service:

```bash
# Illustrative: may need adm or systemd-journal group membership
journalctl -u cron -n 5 --no-pager
```

**Output (varies):**

```text
Jan 15 09:17:02 devbox systemd[1]: Stopped cron.service - Regular background program processing daemon.
-- Boot f583d23a948143da8d2b68eef6335deb --
Jan 15 09:18:26 devbox systemd[1]: Started cron.service - Regular background program processing daemon.
Jan 15 09:18:26 devbox cron[151]: (CRON) INFO (pidfile fd = 3)
Jan 15 09:18:26 devbox cron[151]: (CRON) INFO (Running @reboot jobs)
```

Each line: time, host, process[PID], message. `-- Boot … --` marks a reboot.

Errors since boot, newest last:

```bash
# Illustrative
journalctl -p err -b --no-pager | tail -n 3
```

**Output (varies):**

```text
Jan 15 09:18:27 devbox kernel: misc dxg: dxgk: dxgkio_query_adapter_info: Ioctl failed: -22
Jan 15 09:18:27 devbox kernel: misc dxg: dxgk: dxgkio_query_adapter_info: Ioctl failed: -22
Jan 15 09:18:27 devbox kernel: misc dxg: dxgk: dxgkio_query_adapter_info: Ioctl failed: -2
```

Common combinations:

```bash
# Illustrative
journalctl -u inventory -f                          # follow one service live
journalctl -u nginx --since "30 min ago"            # recent window
journalctl -u ssh -p warning -b                     # warnings and worse for SSH, this boot
journalctl -b -1 -p err                             # errors from the previous boot (why did it crash?)
journalctl -k | grep -i -E 'oom|killed process'     # out-of-memory kills
journalctl --disk-usage
sudo journalctl --vacuum-size=500M                  # shrink the journal
```

### Text logs with the usual tools

```bash
# Illustrative: needs root or the adm group
sudo tail -f /var/log/syslog
sudo grep 'Failed password' /var/log/auth.log | tail
sudo grep 'sudo:' /var/log/auth.log | tail -n 5
zgrep 'Failed password' /var/log/auth.log.*.gz      # rotated, compressed logs
```

`ls -l /var/log/syslog*` shows rotation at work:

```text
-rw-r----- 1 syslog adm 4959976 Jan 15 09:18 /var/log/syslog
-rw-r----- 1 syslog adm  220256 Jan 13 01:28 /var/log/syslog.1
-rw-r----- 1 syslog adm   57859 Jan  8 04:52 /var/log/syslog.2.gz
-rw-r----- 1 syslog adm  234393 Jan  1 11:41 /var/log/syslog.3.gz
```

### dmesg: the kernel ring buffer

```bash
# Illustrative: may need sudo
sudo dmesg -T | tail          # human-readable timestamps
sudo dmesg --level=err,warn
```

Look here for disk and filesystem errors, USB events, network link changes and the **OOM killer** ("Out of memory: Killed process 2290 (java)").

### logger: write to the log yourself

```bash
# Illustrative
logger -t backup "nightly backup finished: 2.1G"
journalctl -t backup -n 1 --no-pager
```

**Output (varies):**

```text
Jan 15 09:18:29 devbox backup[440]: nightly backup finished: 2.1G
```

Scripts and cron jobs can report to the system log this way instead of inventing their own files.

### logrotate configuration

```bash
# Illustrative
cat /etc/logrotate.d/rsyslog
```

**Output (varies):**

```text
/var/log/syslog
/var/log/mail.log
/var/log/kern.log
/var/log/auth.log
/var/log/user.log
/var/log/cron.log
{
	rotate 4
	weekly
	missingok
	notifempty
	compress
	delaycompress
	sharedscripts
	postrotate
		/usr/lib/rsyslog/rsyslog-rotate
	endscript
}
```

A rule for your own application:

```text
# /etc/logrotate.d/inventory
/opt/inventory/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

| Directive | Meaning |
|-----------|---------|
| `daily` / `weekly` / `size 100M` | When to rotate |
| `rotate 14` | Keep 14 old files |
| `compress`, `delaycompress` | gzip old files, but not the most recent one |
| `missingok`, `notifempty` | No error if missing; skip empty files |
| `copytruncate` | Copy then truncate — for apps that cannot reopen their log |
| `postrotate … endscript` | Command after rotating (e.g. signal the app to reopen logs) |

Test with `sudo logrotate -d /etc/logrotate.d/inventory` (dry run) or force with `sudo logrotate -f …`.

## Examples

### Why did my service stop at 03:12?

```bash
# Illustrative
journalctl -u inventory --since "03:00" --until "03:30" --no-pager
journalctl -k --since "03:00" --until "03:30" | grep -i oom
```

### Who logged in, and who tried?

```bash
# Illustrative
last -n 10                                   # successful logins (wtmp)
sudo lastb -n 10                             # failed logins (btmp)
sudo grep 'Accepted' /var/log/auth.log | tail
journalctl -u ssh --since today | grep -c 'Failed password'
```

## Comparison

### journalctl vs /var/log text files

| | `journalctl` | Text files in `/var/log` |
|---|---|---|
| Format | Binary, structured, indexed | Plain text |
| Filter by service, priority, boot, time | Built in | `grep`/`awk` on text |
| Captures service stdout/stderr | Yes, automatically | Only what syslog receives |
| Persists across reboots | If `/var/log/journal` exists (default on most distributions) | Yes |
| Tools | `journalctl` | `tail`, `less`, `grep`, `zgrep`, `awk` |

### dmesg vs journalctl -k

Both show kernel messages; `dmesg` reads the in-memory ring buffer (current boot, may be overwritten), while `journalctl -k -b -1` can also show earlier boots if the journal is persistent.

## Common Mistakes

- Looking for logs in `/var/log/messages` on Ubuntu (it is `syslog`) or `auth.log` on RHEL (it is `secure`).
- Forgetting `sudo` (or group membership) and concluding a log is empty.
- `tail -f` on a log that rotates — use `tail -F` or `journalctl -f`.
- Deleting a live log to save space instead of truncating it or fixing rotation.
- Writing application logs into `/var/log` without a logrotate rule.
- Using `copytruncate` without knowing that a few lines written during the copy can be lost.

## Key Takeaways

- systemd-journald + `journalctl` for structured logs; rsyslog files in `/var/log` (`syslog`/`messages`, `auth.log`/`secure`, `kern.log`).
- `journalctl -u NAME -f`, `-n`, `-b`, `-p err`, `--since/--until`, `-k`; `--vacuum-size` to clean up.
- `dmesg -T` for kernel events such as disk errors and OOM kills; `logger` writes to the log from scripts.
- logrotate keeps logs bounded: rotate, compress, keep N, and reopen (`postrotate`) or `copytruncate`.
