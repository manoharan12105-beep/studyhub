# Disk Usage: df and du — Practice

All items start in `~/linux-lab`.

### P1. Which command?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** df vs du

You get "No space left on device" while saving a file. Which command shows you **which filesystem** is full?

- A) `du -sh *`
- B) `df -h`
- C) `ls -lS`
- D) `free -h`

<details>
<summary>Answer</summary>

**Answer:** B) `df -h`

**Explanation:** `df` reports per-filesystem usage. `du` measures directories, `ls -lS` sorts one directory by size, and `free` is about memory.

</details>

### P2. Directory totals

**Difficulty:** Easy · **Type:** Command · **Concepts:** du --max-depth, sort -h

Show the size of each top-level directory inside the lab, sorted from smallest to largest.

<details>
<summary>Answer</summary>

```bash
du -h --max-depth=1 . | sort -h
```

The last line is the total for `.`.

</details>

### P3. The biggest file

**Difficulty:** Easy · **Type:** Output · **Concepts:** find -size

What does this print?

```bash
find . -type f -size +1M -printf '%s %p\n'
```

<details>
<summary>Answer</summary>

**Output:**

```text
3145728 ./logs/debug.log
```

</details>

### P4. Apparent vs allocated

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** blocks

`ls -l logs/app-2026-01-01.log` shows 32 bytes, but `du -h` shows 4.0K. Explain.

<details>
<summary>Answer</summary>

`ls -l` shows the file's length in bytes; `du` shows the disk space allocated to it. The filesystem allocates whole blocks (4 KiB here), so even a 32-byte file occupies one 4 KiB block. `du --apparent-size` would report the byte length.

</details>

### P5. Free space but no files

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** inodes

`df -h /var` shows 40 % used, but creating any file in `/var` fails with "No space left on device". What do you check, and what is a likely cause?

<details>
<summary>Answer</summary>

Check inodes with `df -i /var` — `IUse%` is probably 100 %. Likely cause: a directory with millions of tiny files (PHP sessions, cache entries, a mail queue, a runaway job writing one file per event). Find it by counting files per directory and clean it up; consider a filesystem with more inodes for that workload.

</details>

### P6. df and du disagree

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** deleted-but-open files

An engineer deleted a 20 GB `app.log` to free space on `/var`, but `df` still shows the disk full and `du -sh /var` is 20 GB smaller than `df`'s "Used". What happened and what do you do?

<details>
<summary>Answer</summary>

The application still has the deleted log open, so its blocks are not released. Confirm with `sudo lsof +L1 | grep app.log`. Restart (or signal to reopen logs) the application to release it, or free the space immediately with `sudo truncate -s 0 /proc/<pid>/fd/<fd>`. In future truncate instead of deleting, and configure log rotation.

</details>

### P7. Stay on one filesystem

**Difficulty:** Medium · **Type:** Command · **Concepts:** du -x

Write a command that lists the ten biggest directories directly under `/`, without descending into other mounted filesystems such as `/proc` or `/mnt/c`.

<details>
<summary>Answer</summary>

```bash
# Illustrative: run with sudo to read every directory
sudo du -xh --max-depth=1 / 2>/dev/null | sort -h | tail -n 10
```

</details>

### P8. Full disk drill-down

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** disk-full workflow

A monitoring alert says `/` is 98 % full on a web server. Write the sequence of commands you would run, in order, before deleting anything.

<details>
<summary>Answer</summary>

```bash
# Illustrative
df -h /                                            # confirm, see size and mount
df -i /                                            # rule out inode exhaustion
sudo du -xh --max-depth=1 / | sort -h | tail       # find the big top-level directory
sudo du -xh --max-depth=1 /var | sort -h | tail    # drill down (repeat)
sudo find / -xdev -type f -size +500M -exec ls -lh {} +   # big individual files
sudo lsof -nP +L1                                  # deleted files still held open
sudo journalctl --disk-usage                       # journal size
```

Only then choose a safe action (truncate open logs, vacuum the journal, delete old archives, clean caches) and fix the cause.

</details>
