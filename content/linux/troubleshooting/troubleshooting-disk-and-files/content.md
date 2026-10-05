# Troubleshooting: Disk Space, Files and Commands

**Module:** Troubleshooting · **Interview priority:** Frequently asked

## How to Use This Topic

Each scenario follows the same shape — **Symptoms → Possible Causes → Diagnostic Workflow → Fix → Prevention → Interview Explanation** — because that is how a good answer to "the disk is full, what do you do?" is structured in an interview, and how an incident is handled in real life: observe, narrow down, fix, and stop it from happening again.

Commands that need root, a real server or a full disk are marked `# Illustrative`; their output is typical, not exact. Everything else runs in the [practice lab](../../linux-fundamentals/linux-practice-lab/content.md).

> [!IMPORTANT]
> On a production system, diagnose before you delete. Prefer reversible actions (compress, move, truncate a known log) over `rm -rf`, and never delete files you cannot identify.

## Scenario 1: Disk Full

### Symptoms

- Applications fail with `No space left on device`; writes, uploads or database inserts fail.
- Services crash or refuse to start; logins can be slow or impossible (no space for temporary files).
- Monitoring alerts on filesystem usage above 90 %.

### Possible Causes

| Cause | Typical location |
|-------|------------------|
| Logs growing without rotation | `/var/log`, application log directories |
| Old backups, dumps, archives | `/var/backups`, `/home`, `/tmp` |
| Package caches, old kernels, container images | `/var/cache/apt`, `/var/lib/docker` |
| Deleted files still held open by a process | Invisible to `du` — see Scenario 3 |
| Out of **inodes** (millions of tiny files) | Sessions, caches, mail queues |

### Diagnostic Workflow

1. **Which filesystem is full?**

```bash
# Illustrative
df -h
```

**Output (varies):**

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        30G   30G     0 100% /
tmpfs           2.0G     0  2.0G   0% /dev/shm
/dev/sdb1       100G   41G   59G  41% /data
```

2. **Is it space or inodes?** If `df -h` shows free space but writes still fail, check inodes:

```bash
# Illustrative
df -i /
```

3. **Where is the space?** Walk down from the full mount point, staying on that filesystem (`-x`), biggest last:

```bash
# Illustrative: needs root to read every directory
sudo du -xh --max-depth=1 / 2>/dev/null | sort -h | tail -5
sudo du -xh --max-depth=1 /var 2>/dev/null | sort -h | tail -5
```

The same technique in the lab:

```bash
cd ~/linux-lab
du -sh * | sort -h | tail -3
```

**Output (varies):**

```text
12K     config
52K     project
3.1M    logs
```

```bash
du -ah logs | sort -h | tail -2
```

**Output:**

```text
3.0M    logs/debug.log
3.1M    logs
```

4. **If `du` totals are much smaller than `df` usage**, suspect deleted-but-open files (Scenario 3).

### Fix

- Remove or compress what is safe: rotated logs (`*.gz`, `*.1`), old dumps, caches (`sudo apt clean`), unused container images.
- Truncate an active log you must keep running (`: > file` or `truncate -s 0 file`) instead of deleting it.
- Restart or signal the process holding deleted files.
- For inode exhaustion, find the directory with millions of small files and clean it (`find dir -type f -mtime +7 -delete` after checking with `-print`).
- Grow the volume if the data is legitimate.

### Prevention

- `logrotate` for every application log; journald size limits (`SystemMaxUse=`).
- Monitoring and alerts at 80 % (space **and** inodes).
- Separate filesystems for `/var`, `/home` or data, so one runaway directory cannot fill `/`.
- Scheduled cleanup jobs for temporary files and old backups.

### Interview Explanation

"I first run `df -h` to see which filesystem is full, and `df -i` to rule out inode exhaustion. Then I drill down with `du -xh --max-depth=1 | sort -h` from that mount point to find the largest directories, usually logs, backups or caches. If `df` and `du` disagree, a process is holding a deleted file open, which I find with `lsof +L1`. I free space safely — compress or delete old rotated files, truncate rather than delete active logs, restart the offending process — and then fix the cause with log rotation, monitoring and cleanup jobs."

## Scenario 2: Finding Large Files

### Symptoms

- You know a filesystem is full but not which files are responsible.
- A directory is unexpectedly large; backups are slow or huge.

### Possible Causes

- Debug logging left on, core dumps, heap dumps (`*.hprof`), forgotten database exports, ISO or archive downloads, build artifacts.

### Diagnostic Workflow

Find files above a size threshold:

```bash
find ~/linux-lab -type f -size +1M
```

**Output:**

```text
/home/student/linux-lab/logs/debug.log
```

With sizes, in one listing:

```bash
find ~/linux-lab -type f -size +1M -exec ls -lh {} +
```

**Output (varies):**

```text
-rw-r--r-- 1 student student 3.0M Jan 15 09:30 /home/student/linux-lab/logs/debug.log
```

Largest files in one directory (sorted by size with `-S`):

```bash
ls -lhS ~/linux-lab/logs | head -3
```

**Output (varies):**

```text
total 3.1M
-rw-r--r-- 1 student student 3.0M Jan 15 09:30 debug.log
drwxr-xr-x 2 student student 4.0K Jan 15 09:30 archive
```

On a server, search one filesystem and list the top ten:

```bash
# Illustrative
sudo find / -xdev -type f -size +500M -exec ls -lh {} + 2>/dev/null
sudo find /var -xdev -type f -printf '%s %p\n' 2>/dev/null | sort -n | tail -10
```

Recently grown files are often the culprit — modified in the last day:

```bash
# Illustrative
sudo find /var -xdev -type f -mmin -60 -size +100M
```

### Fix

Identify the owner and purpose of each large file first (`ls -l`, `file`, the application's documentation). Then compress (`gzip`), move to cheaper storage, or delete.

### Prevention

Size limits on logs and dumps, retention policies for backups, `.gitignore`/build cleanup, alerts on directory growth.

### Interview Explanation

"`find / -xdev -type f -size +500M` lists big files on one filesystem without crossing into other mounts; adding `-exec ls -lh {} +` shows their sizes. For a ranking I use `find -printf '%s %p\n' | sort -n | tail`, or `du -ah dir | sort -h | tail`. Before removing anything I check what the file is and whether a process is using it."

## Scenario 3: Log File Growing Fast (and Space Not Freed After Deleting It)

### Symptoms

- One log grows by gigabytes per hour; disk usage climbs steadily.
- After deleting a huge log, `df` still shows the disk as full.

### Possible Causes

- An error loop writing the same stack trace repeatedly, debug log level in production, a crashing client retrying constantly.
- No log rotation, or rotation that does not tell the application to reopen its file.
- The deleted file is **still open**: a file's data is freed only when its last link *and* its last open file descriptor are gone. `rm` removes the name; the process keeps writing to the now-invisible file.

### Diagnostic Workflow

Look at what is being written:

```bash
cd ~/linux-lab
head -n 2 logs/debug.log
```

**Output:**

```text
2026-01-15 09:00:00 DEBUG [cache] cache refresh tick
2026-01-15 09:00:00 DEBUG [cache] cache refresh tick
```

Count repeated messages — cut off the timestamp (characters 1–20) so identical messages group together:

```bash
cut -c21- logs/debug.log | sort | uniq -c | sort -rn | head -1
```

**Output:**

```text
  59353 DEBUG [cache] cache refresh tick
```

One debug message repeated 59,353 times: debug logging was left on. On a real server, watch the file grow and do the same count on its recent lines:

```bash
# Illustrative
ls -lh /var/log/myapp/app.log; sleep 10; ls -lh /var/log/myapp/app.log
tail -f /var/log/myapp/app.log
tail -n 10000 /var/log/myapp/app.log | cut -c21-100 | sort | uniq -c | sort -rn | head
```

Reproduce the "deleted but still open" situation in the lab — a background process keeps the file open, then the file is deleted:

```bash
cd ~/linux-lab
sleep 600 >> logs/debug.log &
rm logs/debug.log
lsof +L1 2>/dev/null | grep -E 'COMMAND|debug'
```

**Output (varies):**

```text
COMMAND PID      USER FD   TYPE DEVICE SIZE/OFF NLINK  NODE NAME
sleep   923 student 1w   REG   8,48  3145728     0 32205 /home/student/linux-lab/logs/debug.log (deleted)
```

`lsof +L1` lists open files with a link count below 1 — deleted files that still occupy space (3145728 bytes here). The same is visible in `/proc`:

```bash
ls -l /proc/$!/fd | grep deleted
```

**Output (varies):**

```text
l-wx------ 1 student student 64 Jan 15 09:30 1 -> /home/student/linux-lab/logs/debug.log (deleted)
```

### Fix

- Release the space: restart the process (or send the reload signal it uses to reopen logs). If you cannot restart it, truncate the open file through `/proc`:

```bash
: > /proc/$!/fd/1
kill $!
```

- For a live log you want to keep: truncate instead of deleting.

```bash
cd ~/linux-lab
: > app.log
ls -l app.log
```

**Output (varies):**

```text
-rw-r--r-- 1 student student 0 Jan 15 09:30 app.log
```

- Fix the root cause: the error loop, the log level, the retrying client.

### Prevention

- `logrotate` with `postrotate` (send the reopen signal) or `copytruncate` for applications that cannot reopen logs; `maxsize` for very chatty logs.
- Production log level `INFO` or `WARN`; rate-limit repeated errors.
- Alerting on log volume, not only on disk usage.

### Interview Explanation

"I find which file grows with `du`/`ls -lS`, look at what it is logging with `tail`, and fix the cause — usually an error loop or debug logging. If space did not come back after deleting a log, the process still holds the file open: `lsof +L1` shows it as `(deleted)`. Restarting the process or truncating via `/proc/<pid>/fd/<n>` frees it. That is why we truncate active logs instead of deleting them, and configure logrotate to make the application reopen its file."

## Scenario 4: File Cannot Be Deleted

### Symptoms

- `rm` prints `Permission denied`, `Operation not permitted`, `invalid option`, or `Device or resource busy`.

### Possible Causes

| Message | Cause |
|---------|-------|
| `Permission denied` | No **write** (and execute) permission on the **directory** — deleting is a directory operation |
| `Operation not permitted` | Sticky bit on the directory (e.g. `/tmp`, someone else's file) or the immutable attribute (`chattr +i`) |
| `invalid option` | The file name starts with `-` |
| `No such file or directory` with odd names | Spaces, trailing spaces or special characters in the name |
| `Device or resource busy` | It is a mount point, or in use on some filesystems |

### Diagnostic Workflow

Directory permissions decide deletion, not the file's own permissions:

```bash
cd ~/linux-lab
mkdir locked && touch locked/data.txt && chmod a-w locked
rm locked/data.txt
```

**Output:**

```text
rm: cannot remove 'locked/data.txt': Permission denied
```

```bash
ls -ld locked
```

**Output (varies):**

```text
dr-xr-xr-x 2 student student 4096 Jan 15 09:30 locked
```

A name that looks like an option:

```bash
touch -- -v.txt
rm -v.txt
```

**Output:**

```text
rm: invalid option -- '.'
Try 'rm ./-v.txt' to remove the file '-v.txt'.
Try 'rm --help' for more information.
```

Other checks:

```bash
# Illustrative
ls -ld /tmp                      # drwxrwxrwt — the t means only owners can delete
lsattr important.conf            # ----i---------e------- important.conf  → immutable
ls -b                            # shows hidden characters in names as escapes
findmnt /mnt/data                # is it a mount point?
```

### Fix

```bash
chmod u+w locked && rm locked/data.txt
rm -- -v.txt
ls -- -v.txt
```

**Output:**

```text
ls: cannot access '-v.txt': No such file or directory
```

- `rm -- -name` or `rm ./-name` for names starting with a dash; quotes for spaces (`rm "my file.txt"`); `rm -i -- *pattern*` or `find . -inum N -delete` for unprintable names.
- `sudo chattr -i file` to remove the immutable attribute (only if you know why it was set).
- Unmount a mount point before removing the directory.

### Prevention

Avoid file names starting with `-` or containing spaces in scripts; always use `--` and quote variables in scripts that delete (`rm -- "$file"`).

### Interview Explanation

"Deleting a file modifies its directory, so it needs write and execute permission on the directory, not on the file. If the directory has the sticky bit, only the file's owner (or root) can delete. `Operation not permitted` as root points to the immutable attribute — check with `lsattr`. File names starting with `-` need `rm -- name` or `rm ./name`."

## Scenario 5: Permission Denied

### Symptoms

- `bash: ./script.sh: Permission denied`, `cat: file: Permission denied`, `cd: dir: Permission denied`, or an application log full of `EACCES`.

### Possible Causes

| What fails | Missing permission |
|------------|--------------------|
| Running a script | `x` on the file (or the filesystem is mounted `noexec`) |
| Reading a file | `r` on the file, or `x` on a directory in the path |
| `cd` into a directory | `x` on the directory |
| Listing a directory | `r` on the directory |
| Creating/deleting files | `w` + `x` on the directory |
| A service accessing files | The service runs as a different user; or SELinux/AppArmor denies it |

### Diagnostic Workflow

Running a script that is not executable:

```bash
cd ~/linux-lab
./project/build.sh
```

**Output:**

```text
bash: ./project/build.sh: Permission denied
```

```bash
ls -l project/build.sh
```

**Output (varies):**

```text
-rw-r--r-- 1 student student 63 Jan 15 09:30 project/build.sh
```

A directory without execute permission cannot be entered:

```bash
mkdir data && chmod 600 data
cd data
```

**Output:**

```text
bash: cd: data: Permission denied
```

A system file that is restricted on purpose:

```bash
cat /etc/shadow
```

**Output:**

```text
cat: /etc/shadow: Permission denied
```

General checklist:

```bash
# Illustrative
id                                   # who am I, which groups?
ls -l file; ls -ld dir               # permissions and owner
namei -l /srv/app/config/app.yml     # permissions of every directory along the path
ps -o user= -p <pid>                 # which user does the service run as?
findmnt -no OPTIONS /data            # noexec? ro?
```

### Fix

```bash
chmod u+x project/build.sh
ls -l project/build.sh
chmod 700 data
```

**Output (varies):**

```text
-rwxr--r-- 1 student student 63 Jan 15 09:30 project/build.sh
```

- Grant the minimum needed: `chmod u+x`, `chmod g+r` plus group membership, or `chown` to the service user — never `chmod 777`.
- After adding a user to a group, they must log in again (or `newgrp`) for it to apply.
- Use `sudo` for genuinely administrative files, not `chmod` on system files.
- Run a script without `x` via its interpreter if needed: `bash script.sh`.

### Prevention

Correct ownership at deployment (service user owns its data directory), a sensible `umask`, permissions set by configuration management, and `ls -l`/`namei -l` checks in deployment scripts.

### Interview Explanation

"I check who I am with `id`, then the permissions and owner of the file and of every directory on its path — `namei -l` shows them all. Scripts need `x`, directories need `x` to enter and `w`+`x` to create or delete. For services I check which user the process runs as. I fix it with the least privilege — the right owner or group and `u+x` or `g+r` — never `chmod 777`. If permissions look right, I check for a `noexec` mount or SELinux/AppArmor."

## Scenario 6: Command Not Found

### Symptoms

- `bash: name: command not found` for a command you expect to exist, or one that works in another terminal, for another user, or outside cron.

### Possible Causes

- A typo.
- The package is not installed.
- The program is installed in a directory not listed in `PATH` (e.g. `/opt/app/bin`, `~/.local/bin`, an SDK manager directory).
- Running a script in the current directory without `./` — the current directory is not in `PATH`.
- A different environment: `sudo` uses a secure `PATH`, cron uses a minimal `PATH`, a new shell has not read the updated `~/.bashrc`.

### Diagnostic Workflow

A typo:

```bash
cd ~/linux-lab
grepp ERROR app.log
```

**Output:**

```text
bash: grepp: command not found
```

A script in the current directory is not found without a path, even when it is executable:

```bash
cd ~/linux-lab/project
build.sh
```

**Output:**

```text
bash: build.sh: command not found
```

What the shell finds for a name:

```bash
type build.sh cd grep
```

**Output:**

```text
bash: type: build.sh: not found
cd is a shell builtin
grep is /usr/bin/grep
```

Where the shell looks:

```bash
# Illustrative
echo "$PATH" | tr ':' '\n'
ls -l /opt/maven/bin/mvn             # is it installed somewhere?
apt-cache policy maven               # is the package installed? (Debian/Ubuntu)
```

Interactive Ubuntu shells may also suggest a package: `Command 'tree' not found, but can be installed with: sudo apt install tree`.

### Fix

- Run local scripts with a path: `./build.sh`.
- Install the package: `sudo apt install <package>`.
- Add the directory to `PATH` in `~/.bashrc` (`export PATH="$PATH:/opt/maven/bin"`), then `source ~/.bashrc` or open a new shell.
- In cron jobs and scripts use absolute paths or set `PATH` explicitly.
- After installing or moving a program, `hash -r` clears bash's remembered locations.

### Prevention

Document required tools, install them through packages or configuration management, and set `PATH` in the right startup file (`~/.profile` for login shells, `~/.bashrc` for interactive ones).

### Interview Explanation

"The shell searches only the directories in `PATH`. I check for a typo, then `type name` or `command -v name` to see whether and where it resolves, `echo $PATH` to see the search path, and whether the package is installed. A script in the current directory needs `./` because `.` is not in `PATH` for security reasons. If it works interactively but not in cron or with sudo, the `PATH` differs there, so I use absolute paths."

## Key Takeaways

- Disk full: `df -h` → `df -i` → `du -xh --max-depth=1 | sort -h` → find the cause; `df` ≫ `du` means deleted-but-open files (`lsof +L1`).
- Large files: `find / -xdev -type f -size +500M`, `du -ah | sort -h | tail`, `ls -lhS`.
- Growing logs: find the repeated message, fix the cause, truncate (`: > file`) instead of deleting, and rotate with logrotate.
- Deletion depends on the **directory's** permissions, the sticky bit and the immutable attribute; names starting with `-` need `--`.
- Permission denied: `id`, `ls -l`, `namei -l`, the service user; least-privilege fixes, never `777`.
- Command not found: typo, not installed, not in `PATH`, missing `./`, or a different environment (cron, sudo).
