# Cron and Scheduling — Practice

### P1. Read the schedule

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** cron fields

When does `0 6 * * 1` run?

- A) Every day at 01:06
- B) 06:00 every Monday
- C) 06:00 on the 1st of each month
- D) Every 6 minutes on Mondays

<details>
<summary>Answer</summary>

**Answer:** B) 06:00 every Monday

**Explanation:** Minute 0, hour 6, any day of month, any month, day of week 1 (Monday).

</details>

### P2. Write the expression

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** cron syntax

Write cron expressions for: (a) every 10 minutes, (b) 23:45 every day, (c) midnight on the 1st and 15th of every month, (d) every 2 hours between 08:00 and 20:00 on weekdays.

<details>
<summary>Answer</summary>

(a) `*/10 * * * *` (b) `45 23 * * *` (c) `0 0 1,15 * *` (d) `0 8-20/2 * * 1-5`

</details>

### P3. Special strings

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** @ strings

Which line runs a script once every time the machine boots?

- A) `@daily /opt/warm.sh`
- B) `@reboot /opt/warm.sh`
- C) `0 0 * * * /opt/warm.sh`
- D) `* * * * * /opt/warm.sh`

<details>
<summary>Answer</summary>

**Answer:** B) `@reboot /opt/warm.sh`

</details>

### P4. The percent sign

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** % in crontab

This job never creates its archive: `0 1 * * * tar -czf /backup/home-$(date +%F).tar.gz /home`. Fix it.

<details>
<summary>Answer</summary>

`%` is special in crontab lines (it becomes a newline). Escape it:

```text
0 1 * * * tar -czf /backup/home-$(date +\%F).tar.gz /home >> /var/log/home-backup.log 2>&1
```

Moving the command into a script avoids the issue entirely; redirecting output makes failures visible.

</details>

### P5. Command not found in cron

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** cron environment

A crontab line `*/5 * * * * node /home/dev/app/check.js` logs `node: not found`, although `node` works in your terminal (it lives in `/home/dev/.nvm/versions/node/v20/bin`). Give two fixes.

<details>
<summary>Answer</summary>

Cron's `PATH` does not include the nvm directory. Use the absolute path (`/home/dev/.nvm/versions/node/v20/bin/node /home/dev/app/check.js`) or set `PATH=/home/dev/.nvm/versions/node/v20/bin:/usr/bin:/bin` at the top of the crontab. Also redirect the job's output to a log.

</details>

### P6. Either day

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** day-of-month OR day-of-week

How many times in January 2026 does `0 8 1 * 5` run? (1 January 2026 is a Thursday.)

<details>
<summary>Answer</summary>

**6 times.** Because both day fields are restricted, cron runs on the 1st **or** on Fridays: 1 January (Thursday) plus the Fridays 2, 9, 16, 23 and 30 January.

</details>

### P7. System cron file

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** /etc/cron.d format

Write a file `/etc/cron.d/reports` that runs `/opt/reports/generate.sh` as user `reports` at 06:30 every day, logging to `/var/log/reports.log`.

<details>
<summary>Answer</summary>

```text
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
30 6 * * * reports /opt/reports/generate.sh >> /var/log/reports.log 2>&1
```

The sixth field (`reports`) is the user — required in `/etc/cron.d` and `/etc/crontab`, not in personal crontabs. The user must be able to write the log file.

</details>

### P8. Overlapping runs

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** flock

A job scheduled `*/5 * * * *` sometimes takes 12 minutes; overlapping copies corrupt its output. Change the crontab line so a new run is skipped while the previous one is active.

<details>
<summary>Answer</summary>

```text
*/5 * * * * flock -n /tmp/import.lock /opt/scripts/import.sh >> /var/log/import.log 2>&1
```

</details>
