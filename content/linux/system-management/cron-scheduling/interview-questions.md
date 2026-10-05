# Cron and Scheduling — Interview Questions

## Beginner

### Q1. What is cron?

<details>
<summary>Answer</summary>

A daemon that runs scheduled commands. Every minute it checks the crontabs (per-user tables edited with `crontab -e`, plus `/etc/crontab` and `/etc/cron.d/`) and starts the jobs whose schedule matches the current time.

</details>

### Q2. Explain the five fields of a cron expression.

<details>
<summary>Answer</summary>

Minute (0–59), hour (0–23), day of month (1–31), month (1–12), day of week (0–7, where 0 and 7 are Sunday). Each field accepts `*` (any), a value, a range `1-5`, a list `1,15`, or a step `*/10`. For example `30 2 * * *` = 02:30 every day.

</details>

### Q3. How do you list and edit your cron jobs?

<details>
<summary>Answer</summary>

`crontab -l` lists them, `crontab -e` edits them in your editor (and installs the result on save). `crontab -r` removes the whole crontab — be careful.

</details>

### Q4. Write a cron expression for "every 15 minutes" and for "9 AM on weekdays".

<details>
<summary>Answer</summary>

`*/15 * * * *` and `0 9 * * 1-5`.

</details>

## Intermediate

### Q5. A script works when you run it manually but not from cron. Why?

<details>
<summary>Answer</summary>

Cron runs jobs with a minimal environment: a short `PATH`, `/bin/sh` as the shell, the home directory as working directory, no shell startup files, no terminal, and output that is mailed or discarded. Fix with absolute paths, setting `PATH` and required variables in the crontab or script, `cd` to the right directory, redirecting output (`>> log 2>&1`), escaping `%`, and making sure the script is executable with a shebang.

</details>

### Q6. Why do you need to escape `%` in a crontab line?

<details>
<summary>Answer</summary>

In crontab commands, an unescaped `%` is turned into a newline, and everything after the first `%` is passed to the command as standard input. `date +%F` therefore breaks. Write `date +\%F` or move the command into a script.

</details>

### Q7. What is the difference between a user crontab and `/etc/crontab`?

<details>
<summary>Answer</summary>

A user crontab (`crontab -e`) runs jobs as that user and has five time fields plus the command. `/etc/crontab` and files in `/etc/cron.d/` are system crontabs with an extra sixth field naming the user to run as. The `/etc/cron.daily` (etc.) directories hold scripts run periodically by `run-parts`.

</details>

### Q8. How do you check whether a cron job actually ran?

<details>
<summary>Answer</summary>

Cron logs each start: `grep CRON /var/log/syslog` (Debian/Ubuntu), `/var/log/cron` (RHEL), or `journalctl -u cron`/`-u crond`. Whether it succeeded is only visible in the job's own output — which is why jobs should redirect to a log or use `logger`.

</details>

### Q9. What does `0 9 1 * 1` mean?

<details>
<summary>Answer</summary>

09:00 on the 1st of every month **and** at 09:00 every Monday. When both day-of-month and day-of-week are restricted, cron matches if either one matches. "First Monday of the month" therefore needs a check inside the command: restrict only the day of month and test the weekday — `0 9 1-7 * * [ "$(date +\%u)" = 1 ] && cmd` (days 1–7, and only when the day is a Monday).

</details>

## Advanced

### Q10. How do you prevent a long-running cron job from overlapping with its next run?

<details>
<summary>Answer</summary>

Use a lock: `*/5 * * * * flock -n /var/lock/job.lock /opt/scripts/job.sh`. `flock -n` exits immediately if the previous run still holds the lock, and the kernel releases it automatically when the job ends or crashes. systemd timers avoid overlap by design because a service unit is not started again while it is still running.

</details>

### Q11. When would you choose a systemd timer over cron?

<details>
<summary>Answer</summary>

When you want automatic logging to the journal, catching up on runs missed while the machine was off (`Persistent=true`), dependency ordering (run after the network or a mount is ready), resource limits and sandboxing, no overlapping runs, randomised delays to spread load (`RandomizedDelaySec`), and monitoring through `systemctl list-timers`/status. Cron remains simpler for quick per-user jobs.

</details>

### Q12. How would you safely add a cron job from an automation script without destroying existing entries?

<details>
<summary>Answer</summary>

Read the current crontab, append (if not already present), and install the combined result: `(crontab -l 2>/dev/null | grep -vF '/opt/scripts/rotate.sh'; echo '0 1 * * * /opt/scripts/rotate.sh') | crontab -`. Better still, manage system jobs as files in `/etc/cron.d/` (one file per job) or with configuration management tools.

</details>
