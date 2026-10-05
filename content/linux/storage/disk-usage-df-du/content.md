# Disk Usage: df and du

**Module:** Filesystems and Storage · **Interview priority:** Core

## What Is It?

Two commands answer two different questions:

| Command | Question | Looks at |
|---------|----------|----------|
| `df` (disk free) | How full is each **filesystem**? | Filesystem-level counters kept by the kernel |
| `du` (disk usage) | How much space do these **files and directories** use? | Walks the directory tree and adds up the files it finds |

A disk-full investigation always uses both: `df` to find **which filesystem** is full, `du` (and `find`) to find **what** is filling it.

## Why It Matters

- "No space left on device" stops databases, logging, deployments and package installs. It is one of the most common production incidents.
- `df` and `du` often disagree — explaining why (deleted-but-open files, reserved blocks, mounts) is a favourite interview question.
- Running out of **inodes** gives the same error even when `df -h` shows free space.

## Core Concept

### What df reports

```text
Filesystem     Type   Size  Used Avail Use% Mounted on
/dev/sdd       ext4  1007G  2.5G  954G   1% /
tmpfs          tmpfs  3.9G   12K  3.9G   1% /tmp
```

| Column | Meaning |
|--------|---------|
| Filesystem | Device (or virtual source such as `tmpfs`) |
| Size / Used / Avail | Capacity, used space, space available **to normal users** |
| Use% | Used / (Used + Avail) |
| Mounted on | Where in the directory tree this filesystem appears |

`Size` ≠ `Used + Avail` on ext4 because about **5 % is reserved for root** (so the system keeps working when users fill the disk).

### What du reports

`du` adds up the **allocated blocks** of files it can see under a path. File systems allocate in blocks (commonly 4 KiB), so a 32-byte file uses 4.0K. `--apparent-size` reports the byte length instead.

### Why df and du disagree

| Cause | Effect | How to confirm |
|-------|--------|----------------|
| **Deleted files still open** by a process (e.g. a log deleted while the app writes to it) | `df` counts the space; `du` cannot see the file | `sudo lsof +L1` (files with link count 0) |
| Files **hidden under a mount point** (written to `/data` before a disk was mounted there) | `df` counts them on the parent filesystem; `du` sees only the mounted disk | Unmount, or bind-mount `/` elsewhere and look |
| **Reserved blocks** (ext4, 5 %) | Used + Avail < Size | `tune2fs -l /dev/sdX` |
| `du` lacks permission for some directories | `du` undercounts | Run with `sudo` |
| Filesystem metadata, journals, snapshots | Counted by `df` only | Filesystem-specific tools |
| **Sparse files** (VM images, some databases) | Apparent size ≫ used blocks | `du` vs `du --apparent-size` |

### Inodes

Each file uses one **inode** (see [Inodes and Links](../inodes-and-links/content.md)). The number of inodes is fixed when an ext4 filesystem is created. Millions of tiny files (cache entries, session files, mail queues) can use them all: `df -h` shows free space, yet creating files fails with "No space left on device". `df -i` shows inode usage.

## Commands

### df

| Option | Meaning |
|--------|---------|
| `-h` | Human-readable sizes |
| `-T` | Show filesystem type |
| `-i` | Inode usage instead of blocks |
| `-x tmpfs` | Exclude a type |
| `-P` | POSIX format, one line per filesystem (for scripts) |
| `df PATH` | Only the filesystem that contains `PATH` |

```bash
# Illustrative: output depends on the machine
df -hT / /tmp
```

**Output (varies):**

```text
Filesystem     Type   Size  Used Avail Use% Mounted on
/dev/sdd       ext4  1007G  2.5G  954G   1% /
tmpfs          tmpfs  3.9G   12K  3.9G   1% /tmp
```

Which filesystem holds the lab? `df .` answers "the one this directory lives on".

```bash
# Illustrative
df -i /
```

**Output (varies):**

```text
Filesystem       Inodes IUsed    IFree IUse% Mounted on
/dev/sdd       67108864 47266 67061598    1% /
```

### du

| Option | Meaning |
|--------|---------|
| `-s` | Summary: one total per argument |
| `-h` | Human-readable |
| `-a` | Include files, not just directories |
| `--max-depth=1` (`-d 1`) | Totals one level down |
| `-x` | Stay on one filesystem (skip mounts such as `/proc`) |
| `--apparent-size` | Byte length instead of allocated blocks |
| `-c` | Grand total |

```bash
du -sh logs project config
```

**Output (varies):**

```text
3.1M    logs
52K     project
12K     config
```

Directory totals one level down, smallest to largest — the standard way to drill into a full disk:

```bash
du -h --max-depth=1 . | sort -h
```

**Output (varies):**

```text
12K     ./config
52K     ./project
3.1M    ./logs
3.2M    .
```

Then go one level deeper into the biggest entry:

```bash
du -sh logs/* | sort -h
```

**Output (varies):**

```text
4.0K    logs/app-2026-01-01.log
4.0K    logs/app-2026-01-08.log
4.0K    logs/app-2026-01-14.log
8.0K    logs/archive
3.0M    logs/debug.log
```

Each tiny log still uses one 4 KiB block.

### Finding large files directly

```bash
find . -type f -size +1M -exec ls -lh {} +
```

**Output (varies):**

```text
-rw-r--r-- 1 student student 3.0M Jan 15 09:30 ./logs/debug.log
```

### Deleted but still open

```bash
# Illustrative
sudo lsof -nP +L1
```

**Output (varies):**

```text
COMMAND PID    USER FD   TYPE DEVICE SIZE/OFF NLINK  NODE NAME
bash    673 student 3r   REG   8,48 52428800     0 32684 /home/student/held.bin (deleted)
```

`NLINK 0` and `(deleted)`: the name is gone, but process 673 still holds the 50 MiB file open, so its space is not freed. Restart (or reload) the process, or truncate it through `/proc/673/fd/3` — see [Troubleshooting Disk and Files](../../troubleshooting/troubleshooting-disk-and-files/content.md).

## Examples

### The disk-full workflow

```bash
# Illustrative
df -h                                              # 1. which filesystem is full?
sudo du -xh --max-depth=1 /var | sort -h | tail    # 2. which directory on it is big?
sudo du -xh --max-depth=1 /var/log | sort -h | tail
sudo find /var -xdev -type f -size +500M -exec ls -lh {} +   # 3. which files?
sudo lsof -nP +L1                                  # 4. deleted files still held open?
df -i /var                                         # 5. or is it inodes?
```

`-x` keeps `du` and `find` on the full filesystem instead of wandering into other mounts.

### Safe ways to free space

| Situation | Action |
|-----------|--------|
| Huge application log | Truncate instead of deleting if the app keeps it open: `sudo truncate -s 0 app.log`; fix rotation |
| Old rotated logs | `sudo find /var/log -name '*.gz' -mtime +30 -delete` |
| systemd journal | `sudo journalctl --vacuum-size=500M` |
| Package cache | `sudo apt clean`, `sudo apt autoremove` |
| Docker | `docker system df`, then `docker system prune` (review first) |
| Core dumps, old backups, temp files | Delete after checking |

> [!CAUTION]
> Do not delete files in `/var/lib` (databases, package state) or random files in `/usr` to free space. And remember: `rm` on a file that a process still has open frees nothing until that process closes it.

## Comparison

### df vs du

| | `df` | `du` |
|---|---|---|
| Level | Whole filesystems | Files and directories |
| Source | Kernel's filesystem counters (instant) | Walks the tree (slow on huge trees) |
| Sees deleted-but-open files | Yes | No |
| Sees files hidden under mount points | Yes (on the parent filesystem) | No |
| Use first to answer | "Which filesystem is full?" | "What is using the space?" |

### Block usage vs apparent size

| | `du` (default) | `du --apparent-size` / `ls -l` |
|---|---|---|
| Measures | Disk blocks allocated | Bytes in the file |
| Small files | Rounded up to the block size | Exact |
| Sparse files | Small | Large |

## Common Mistakes

- Using `du` on `/` without `-x`, crawling `/proc` and network mounts.
- Deleting a huge log that a service is still writing — the space is not freed.
- Ignoring inodes when `df -h` shows space but file creation fails.
- Sorting `du -h` output with `sort -n` instead of `sort -h`.
- Assuming `Size - Used = Avail` on ext4 (reserved blocks).
- Freeing space by deleting from `/var/lib/docker`, `/var/lib/postgresql` or `/var/lib/dpkg` by hand.

## Key Takeaways

- `df -h` shows how full each filesystem is; `df -i` shows inodes; `df PATH` shows the filesystem holding a path.
- `du -sh dir`, `du -h --max-depth=1 | sort -h` find what uses space; `-x` stays on one filesystem.
- Large files: `find PATH -xdev -type f -size +500M`.
- df > du usually means deleted-but-open files (`lsof +L1`) or files hidden under a mount point.
- Free space safely: truncate open logs, rotate, vacuum journals, clean package caches.
