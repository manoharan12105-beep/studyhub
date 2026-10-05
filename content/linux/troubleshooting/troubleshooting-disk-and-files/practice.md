# Troubleshooting: Disk Space, Files and Commands — Practice

### P1. First step

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** df vs du

An application fails with "No space left on device". Which command tells you which filesystem is full?

- A) `du -sh /`
- B) `df -h`
- C) `ls -lh /`
- D) `free -h`

<details>
<summary>Answer</summary>

**Answer:** B) `df -h`

**Explanation:** `df` reports usage per mounted filesystem. `du` measures directories (the next step), `free` is about memory.

</details>

### P2. Biggest directories

**Difficulty:** Easy · **Type:** Command · **Concepts:** du, sort -h

In the lab, list the sizes of everything in `~/linux-lab` with the largest last.

<details>
<summary>Answer</summary>

```bash
cd ~/linux-lab
du -sh * | sort -h
```

`logs` (about 3.1M, because of `debug.log`) comes last. `sort -h` understands human-readable sizes such as `12K` and `3.1M`.

</details>

### P3. Large files in the lab

**Difficulty:** Easy · **Type:** Command · **Concepts:** find -size

Find every regular file in `~/linux-lab` larger than 1 MiB.

<details>
<summary>Answer</summary>

```bash
find ~/linux-lab -type f -size +1M
```

**Output:**

```text
/home/student/linux-lab/logs/debug.log
```

</details>

### P4. df and du disagree

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** deleted open files, lsof

`df -h /var` shows 98 % used (49G of 50G), but `sudo du -sh /var` reports only 12G. Yesterday someone ran `rm /var/log/app/huge.log`. Explain and fix.

<details>
<summary>Answer</summary>

The application still has `huge.log` open; its blocks stay allocated until the descriptor is closed, but `du` cannot see a file without a name.

```bash
# Illustrative
sudo lsof +L1 | grep huge.log          # shows PID and FD, marked (deleted)
sudo systemctl restart app             # or: : > /proc/<PID>/fd/<FD>
df -h /var
```

Next time truncate (`: > file`) instead of deleting, and configure logrotate.

</details>

### P5. Output prediction

**Difficulty:** Medium · **Type:** Output · **Concepts:** directory permissions

In the lab you run:

```bash
cd ~/linux-lab
mkdir box && touch box/a.txt && chmod 555 box
rm box/a.txt
```

What happens, and why?

<details>
<summary>Answer</summary>

**Output:**

```text
rm: cannot remove 'box/a.txt': Permission denied
```

`box` is `r-xr-xr-x`: without write permission on the directory, no entry can be removed from it, even though you own `a.txt`. `chmod u+w box` fixes it.

</details>

### P6. The dash file

**Difficulty:** Easy · **Type:** Command · **Concepts:** rm --

A file named `-rf` appeared in your directory. Remove exactly that file, safely.

<details>
<summary>Answer</summary>

```bash
cd ~/linux-lab
touch -- -rf
rm -- -rf
ls -- -rf
```

**Output:**

```text
ls: cannot access '-rf': No such file or directory
```

`--` ends option processing; `rm ./-rf` works too. Never just type `rm -rf` hoping it targets the file.

</details>

### P7. Command not found

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** PATH

You installed Maven by extracting it to `/opt/maven`. `mvn -v` prints `mvn: command not found`, but `/opt/maven/bin/mvn -v` works. Fix it permanently for your user.

<details>
<summary>Answer</summary>

```bash
# Illustrative
echo 'export PATH="$PATH:/opt/maven/bin"' >> ~/.bashrc
source ~/.bashrc
type mvn
```

The directory was not in `PATH`. Cron jobs and `sudo` still will not see it — use the absolute path there.

</details>

### P8. Full disk at 3 AM

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** systematic diagnosis

The root filesystem of a web server hits 100 % every night around 03:00 and is back to 70 % by 09:00 without anyone acting. Describe how you would find the cause.

<details>
<summary>Answer</summary>

1. Something writes a lot and later removes it — likely a scheduled job. List cron jobs and timers: `crontab -l` for relevant users, `/etc/crontab`, `/etc/cron.d/`, `systemctl list-timers`.
2. Check logs around 03:00: `journalctl --since "03:00" --until "03:30"`, `grep CRON /var/log/syslog`.
3. Catch it in the act: a temporary cron entry at 02:55 and 03:05 recording `df -h` and `du -xh --max-depth=2 / | sort -h | tail`, or `find / -xdev -mmin -10 -size +100M` during the window.
4. Typical culprits: a backup or database dump written to `/` before upload, log rotation compressing large files, a report export.
5. Fix: write to a dedicated volume, stream the backup directly (`pg_dump | gzip | upload`), add retention; alert at 85 %.

</details>
