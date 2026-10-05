# Disk Usage: df and du — Interview Questions

## Beginner

### Q1. What is the difference between `df` and `du`?

<details>
<summary>Answer</summary>

`df` reports free and used space per **filesystem**, from the filesystem's own counters. `du` walks a directory tree and adds up the space used by the **files** it finds. Use `df` to see which filesystem is full and `du` to find what is filling it.

</details>

### Q2. How do you check disk space in human-readable form?

<details>
<summary>Answer</summary>

`df -h` for filesystems; `du -sh /path` for the total of a directory; `du -h --max-depth=1 /path | sort -h` for its subdirectories.

</details>

### Q3. How do you find the largest files in a directory tree?

<details>
<summary>Answer</summary>

`find /path -xdev -type f -size +100M -exec ls -lh {} +`, or for a ranked list: `find /path -xdev -type f -printf '%s %p\n' | sort -n | tail -n 10`. For directories: `du -xh --max-depth=1 /path | sort -h | tail`.

</details>

## Intermediate

### Q4. Why does `df` show more used space than `du`?

<details>
<summary>Answer</summary>

Most often a file was deleted while a process still has it open: its name is gone (invisible to `du`) but its blocks stay allocated (counted by `df`) until the process closes it. Find them with `sudo lsof +L1`; restart the process or truncate via `/proc/<pid>/fd/<n>`. Other causes: files hidden under a mount point, reserved blocks, filesystem metadata/snapshots, and directories `du` could not read.

</details>

### Q5. The disk shows free space, but you get "No space left on device". Why?

<details>
<summary>Answer</summary>

The filesystem has run out of **inodes** — every file needs one and ext4 has a fixed number. Check `df -i`. Find directories with huge numbers of small files (`sudo find / -xdev -type f | cut -d/ -f2,3 | sort | uniq -c | sort -n | tail`) — session files, caches, mail queues — and clean them up. Less commonly: a quota was reached, or the space reserved for root is all that is left (non-root writes fail).

</details>

### Q6. Why might a 1-byte file show as 4.0K in `du`?

<details>
<summary>Answer</summary>

`du` reports allocated blocks, and the filesystem allocates space in whole blocks (typically 4 KiB). `du --apparent-size` or `ls -l` shows the actual byte length.

</details>

### Q7. How do you safely free space taken by a huge log file that an application is writing to?

<details>
<summary>Answer</summary>

Truncate it in place: `sudo truncate -s 0 /var/log/app/app.log` (or `: > file`). The application keeps its open file descriptor and continues writing to the now-empty file. Deleting it with `rm` would not free the space while the app holds it open. Then fix the root cause: log rotation (`logrotate` with `copytruncate` or a reopen signal) and log levels.

</details>

## Advanced

### Q8. Walk through how you would investigate a disk-full alert on `/`.

<details>
<summary>Answer</summary>

1. `df -h` (and `df -i`) to confirm which filesystem and whether blocks or inodes.
2. `sudo du -xh --max-depth=1 / | sort -h | tail`, then drill into the largest directory level by level (usually `/var/log`, `/var/lib/docker`, `/home`, `/tmp`).
3. `sudo find / -xdev -type f -size +500M -exec ls -lh {} +` for big individual files.
4. `sudo lsof +L1` for deleted-but-open files if `du` totals are much smaller than `df`.
5. Free space safely (truncate logs, vacuum the journal, clean package/Docker caches, remove old backups), then fix the cause (rotation, retention, alert thresholds).

</details>

### Q9. What are reserved blocks on ext4 and why do they exist?

<details>
<summary>Answer</summary>

By default 5 % of an ext4 filesystem is reserved for root (configurable with `tune2fs -m`). When normal users fill the disk, root-owned system services and administrators can still write logs and log in to fix the problem, and fragmentation stays lower. That is why `Used + Avail` is less than `Size` in `df`.

</details>

### Q10. You mounted a new 100 GB disk on `/data`, but `df -h /` still shows the root filesystem nearly full and `du /data` looks small. What might be hidden?

<details>
<summary>Answer</summary>

Files written to `/data` **before** the new disk was mounted live on the root filesystem in the original `/data` directory, now hidden underneath the mount. `du` cannot see them; `df` still counts them on `/`. Check by bind-mounting root elsewhere (`sudo mount --bind / /mnt/rootview; du -sh /mnt/rootview/data`) or by unmounting `/data` temporarily, then move or delete them.

</details>
