# Cron and Scheduling

**Module:** Services, Logs and Scheduling · **Interview priority:** Core

## What Is It?

**cron** is the classic Linux scheduler: a daemon (`cron` or `crond`) that wakes up every minute and runs the commands whose schedule matches the current time. Each user has a **crontab** (cron table) — a file of schedule lines edited with the `crontab` command. The system also has crontabs in `/etc`.

```text
┌───────── minute        (0-59)
│ ┌─────── hour          (0-23)
│ │ ┌───── day of month  (1-31)
│ │ │ ┌─── month         (1-12 or jan-dec)
│ │ │ │ ┌─ day of week   (0-7, 0 and 7 = Sunday, or sun-sat)
│ │ │ │ │
30 2 * * *  /home/student/scripts/backup.sh >> /home/student/logs/backup.log 2>&1
```

"At 02:30 every day, run the backup script and append its output and errors to a log."

## Why It Matters

- Backups, report generation, cache cleanup, certificate renewal, log pruning, health checks — routine automation runs from cron (or systemd timers).
- Cron jobs fail silently in surprising ways (different environment, no terminal, `%` characters), so knowing the pitfalls saves hours.
- Interviewers often ask you to write or read a cron expression.

## Core Concept

### Field syntax

| Syntax | Meaning | Example | Matches |
|--------|---------|---------|---------|
| `*` | Every value | `* * * * *` | Every minute |
| `N` | Exactly N | `0 9 * * *` | 09:00 daily |
| `A-B` | Range | `0 9-17 * * *` | On the hour, 09:00–17:00 |
| `A,B,C` | List | `0 8,12,18 * * *` | 08:00, 12:00, 18:00 |
| `*/N` | Every N (step) | `*/15 * * * *` | Minutes 0, 15, 30, 45 |
| `A-B/N` | Step within a range | `0 8-18/2 * * *` | 08:00, 10:00, … 18:00 |

### Worked examples

| Expression | Runs |
|------------|------|
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour, on the hour |
| `0 0 * * *` | Every day at midnight |
| `30 2 * * *` | Every day at 02:30 |
| `0 9 * * 1-5` | 09:00 Monday to Friday |
| `0 18 * * 5` | 18:00 every Friday |
| `0 0 1 * *` | Midnight on the 1st of every month |
| `15 3 * * 0` | 03:15 every Sunday |
| `0 */6 * * *` | Every 6 hours (00:00, 06:00, 12:00, 18:00) |
| `0 9 1 1 *` | 09:00 on 1 January |

### Special strings

| String | Equivalent |
|--------|------------|
| `@reboot` | Once, when cron starts at boot |
| `@hourly` | `0 * * * *` |
| `@daily` / `@midnight` | `0 0 * * *` |
| `@weekly` | `0 0 * * 0` |
| `@monthly` | `0 0 1 * *` |
| `@yearly` / `@annually` | `0 0 1 1 *` |

### The day-of-month / day-of-week trap

When **both** day of month and day of week are restricted (neither is `*`), cron runs when **either** matches: `0 9 1 * 1` runs on the 1st of the month **and** on every Monday — not "Mondays that fall on the 1st".

### The cron environment

Cron runs jobs with a **minimal environment**, not your login shell:

| Difference | Consequence | Fix |
|------------|-------------|-----|
| `PATH` is short (`/usr/bin:/bin`) | "command not found" for tools in `/usr/local/bin`, `/opt/…` | Absolute paths, or `PATH=…` at the top of the crontab |
| Shell is `/bin/sh` | Bash syntax in the crontab line fails | Put logic in a `#!/bin/bash` script, or `SHELL=/bin/bash` |
| Working directory is your home | Relative paths break | `cd /path && …` or absolute paths |
| No `~/.bashrc` / `~/.profile` | Variables such as `JAVA_HOME` missing | Set them in the crontab or the script |
| No terminal | Prompts hang or fail | Non-interactive commands only |
| Output is mailed (if mail is set up) or lost | Silent failures | Redirect `>> log 2>&1`, or `MAILTO=` |
| `%` means newline | `date +%F` breaks the line | Escape as `\%` or move into a script |

## Commands

### crontab

| Command | Does |
|---------|------|
| `crontab -e` | Edit your crontab (opens `$EDITOR`; syntax-checked on save) |
| `crontab -l` | List your crontab |
| `crontab -r` | **Remove** your entire crontab, without confirmation |
| `sudo crontab -u alice -l` | Another user's crontab (root only) |

> [!WARNING]
> `crontab -r` deletes everything instantly, and `r` sits next to `e` on the keyboard. Keep a backup: `crontab -l > ~/crontab.backup`. Some systems offer `crontab -ri` to ask first.

```bash
# Illustrative: interactive editor
crontab -l                      # "no crontab for student" if empty
crontab -e
```

A typical crontab:

```text
# Environment for all jobs below
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
MAILTO=""

# m  h  dom mon dow  command
*/5  *  *   *   *    /home/student/scripts/health-check.sh >> /home/student/logs/health.log 2>&1
30   2  *   *   *    /home/student/scripts/backup.sh /home/student/projects 7 >> /home/student/logs/backup.log 2>&1
0    9  *   *   1-5  /home/student/scripts/daily-report.sh
@reboot              /home/student/scripts/warm-cache.sh
0    0  *   *   *    find /home/student/tmp -type f -mtime +7 -delete
15   3  *   *   0    tar -czf /home/student/backups/etc-$(date +\%F).tar.gz -C / etc
```

Note `\%` in the last line.

Installing a crontab from a file (useful in automation):

```bash
# Illustrative
crontab -l > current.cron 2>/dev/null      # save existing jobs
echo '0 1 * * * /opt/scripts/rotate.sh' >> current.cron
crontab current.cron                       # replace the crontab with the file
```

### System-wide cron locations

| Location | Format | Use |
|----------|--------|-----|
| User crontabs (`crontab -e`, stored in `/var/spool/cron/`) | 5 fields + command | Per-user jobs — never edit the spool files directly |
| `/etc/crontab` | 5 fields + **user** + command | System jobs |
| `/etc/cron.d/*` | 5 fields + **user** + command | Jobs installed by packages or configuration management |
| `/etc/cron.hourly/`, `cron.daily/`, `cron.weekly/`, `cron.monthly/` | Executable scripts | Run periodically by `run-parts` (file names must not contain dots) |

```text
# /etc/cron.d/inventory-cleanup  — note the user field
0 4 * * * inventory /opt/inventory/bin/cleanup.sh >> /var/log/inventory/cleanup.log 2>&1
```

### Did it run?

```bash
# Illustrative
grep CRON /var/log/syslog | tail          # Debian/Ubuntu
journalctl -u cron --since today          # (crond on RHEL)
```

Log lines like `(student) CMD (/home/student/scripts/backup.sh …)` prove cron started the job; whether the job succeeded is in **your** redirected log.

### at: run once later

```bash
# Illustrative: needs the at package
echo "/opt/scripts/migrate.sh" | at 23:00
at now + 30 minutes <<< "systemctl restart inventory"
atq                                     # list pending jobs
atrm 3                                  # remove job 3
```

## Examples

### A safe, observable cron job

```text
*/10 * * * * flock -n /tmp/sync.lock /opt/scripts/sync.sh >> /var/log/sync.log 2>&1
```

- `flock -n` skips a run if the previous one is still active.
- Absolute paths everywhere.
- `>> … 2>&1` keeps a record of output and errors.

### Debug a job that "does nothing"

1. Check cron started it: `grep CRON /var/log/syslog | grep sync.sh`.
2. Look at its own log (or add `>> /tmp/debug.log 2>&1`).
3. Reproduce cron's environment: `env -i HOME=$HOME PATH=/usr/bin:/bin /bin/sh -c '/opt/scripts/sync.sh'`.
4. Check the script is executable and has a shebang; check `%` characters; check the user has permission (`/etc/cron.allow`, `/etc/cron.deny`).

### systemd timer alternative

```text
# /etc/systemd/system/backup.timer                 # /etc/systemd/system/backup.service
[Unit]                                              [Unit]
Description=Nightly backup                          Description=Nightly backup job

[Timer]                                             [Service]
OnCalendar=*-*-* 02:30:00                           Type=oneshot
Persistent=true                                     User=backup
                                                    ExecStart=/opt/scripts/backup.sh
[Install]
WantedBy=timers.target
```

Enable with `sudo systemctl enable --now backup.timer`; check with `systemctl list-timers`. `Persistent=true` runs a missed job after downtime; output goes to the journal automatically.

## Comparison

### cron vs at vs systemd timers

| | cron | at | systemd timer |
|---|---|---|---|
| Repeats | Yes | No (once) | Yes (or once) |
| Syntax | 5 fields | Time expressions (`23:00`, `now + 1 hour`) | `OnCalendar=`, `OnBootSec=` |
| Logs | Only what you redirect | Mailed output | Journal (`journalctl -u name`) |
| Missed runs (machine off) | Skipped | Run when possible | `Persistent=true` catches up |
| Overlap protection, resource limits, dependencies | Manual (`flock`) | — | Built in |
| Setup effort | One line | One line | Two unit files |

### User crontab vs /etc/crontab

| | `crontab -e` | `/etc/crontab`, `/etc/cron.d/` |
|---|---|---|
| Owner | Each user | System (root edits) |
| User field | No — runs as the crontab's owner | **Yes** — sixth field names the user |
| Edited with | `crontab -e` | An editor (as root) |

## Common Mistakes

- Relative paths and commands not on cron's `PATH`.
- Bash-only syntax in a crontab line (cron uses `/bin/sh`).
- Unescaped `%` in commands.
- No output redirection, so failures leave no trace.
- Expecting `0 9 1 * 1` to mean "the first Monday" (it means the 1st **or** any Monday).
- Writing a user field in a personal crontab, or forgetting it in `/etc/cron.d`.
- Dots in file names under `/etc/cron.daily/` (`backup.sh` is silently skipped by `run-parts`).
- `crontab -r` instead of `crontab -e`.
- Overlapping runs of long jobs — use `flock`.

## Key Takeaways

- Five fields: minute, hour, day of month, month, day of week; `*`, `N`, `A-B`, `A,B`, `*/N`; `@daily`, `@reboot`, …
- `crontab -e` edit, `-l` list, `-r` remove all (dangerous); system jobs in `/etc/crontab` and `/etc/cron.d/` include a user field.
- Cron's environment is minimal: absolute paths, set `PATH`/variables, redirect `>> log 2>&1`, escape `%`.
- Verify runs in `/var/log/syslog` or `journalctl -u cron`; prevent overlap with `flock`.
- `at` runs once; systemd timers add logging, catch-up and dependencies.
