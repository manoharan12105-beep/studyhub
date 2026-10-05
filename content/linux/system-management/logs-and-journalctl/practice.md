# Logs: /var/log, journalctl and Log Rotation — Practice

### P1. Logs of one service

**Difficulty:** Easy · **Type:** Command · **Concepts:** journalctl -u

Show the last 30 log entries of the `nginx` service without a pager.

<details>
<summary>Answer</summary>

```bash
# Illustrative
journalctl -u nginx -n 30 --no-pager
```

</details>

### P2. Where are logins logged?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** log locations

On Ubuntu, which file records `sudo` usage and SSH logins?

- A) `/var/log/kern.log`
- B) `/var/log/auth.log`
- C) `/var/log/dpkg.log`
- D) `/etc/passwd`

<details>
<summary>Answer</summary>

**Answer:** B) `/var/log/auth.log`

**Explanation:** Authentication events go to `auth.log` (`/var/log/secure` on RHEL).

</details>

### P3. Errors in a time window

**Difficulty:** Medium · **Type:** Command · **Concepts:** journalctl filters

Show error-level (and worse) messages from all services between 02:00 and 02:30 today.

<details>
<summary>Answer</summary>

```bash
# Illustrative
journalctl -p err --since "02:00" --until "02:30" --no-pager
```

</details>

### P4. Previous boot

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** journalctl -b -1

A server rebooted unexpectedly overnight. Which command shows the last 50 messages from before the reboot?

<details>
<summary>Answer</summary>

```bash
# Illustrative
journalctl -b -1 -n 50 --no-pager
```

`-b -1` selects the previous boot (requires a persistent journal). `journalctl --list-boots` lists the boots available.

</details>

### P5. OOM check

**Difficulty:** Medium · **Type:** Command · **Concepts:** kernel log, OOM killer

Your Java service disappeared without an application error. Check whether the kernel's out-of-memory killer terminated it.

<details>
<summary>Answer</summary>

```bash
# Illustrative
journalctl -k --since today | grep -i -E 'out of memory|killed process'
sudo dmesg -T | grep -i oom
```

</details>

### P6. Write a logrotate rule

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** logrotate directives

Write a logrotate rule for `/srv/shop/logs/*.log`: rotate daily, keep 7 files, compress (except the newest rotated one), ignore missing or empty files, and the application cannot reopen its log.

<details>
<summary>Answer</summary>

```text
/srv/shop/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

Save it as `/etc/logrotate.d/shop` and test with `sudo logrotate -d /etc/logrotate.d/shop`.

</details>

### P7. Journal too big

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** journal size

`/var` is 95 % full and `journalctl --disk-usage` reports 6.2G. Reduce it now to 1 GB and make sure it does not grow beyond that again.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo journalctl --vacuum-size=1G
# then in /etc/systemd/journald.conf:  SystemMaxUse=1G
sudo systemctl restart systemd-journald
```

Also find out which service logs so much and fix its log level.

</details>

### P8. Script logging

**Difficulty:** Easy · **Type:** Command · **Concepts:** logger

From a backup script, write the message `backup finished` to the system log with the tag `backup`, and show how to read it back.

<details>
<summary>Answer</summary>

```bash
# Illustrative
logger -t backup "backup finished"
journalctl -t backup -n 5 --no-pager
```

</details>
