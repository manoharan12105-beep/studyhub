# Command Differences

The "X vs Y" pairs interviewers ask about, one table each.

## Files

| Pair | Difference |
|------|------------|
| `cp` vs `mv` | `cp` duplicates data (new inode, original stays); `mv` renames — same inode on one filesystem, copy + delete across filesystems |
| `rm` vs `rmdir` | `rm` removes files (`-r` for trees); `rmdir` removes only **empty** directories |
| `cat` vs `less` | `cat` prints everything at once; `less` pages, searches, handles huge files |
| `head` vs `tail` | First vs last lines; `tail -f` follows a growing file |
| `>` vs `>>` | Overwrite (truncate first) vs append |
| `>` vs `\|` | Redirect to a **file** vs pass to another **command** |
| `2>&1 > f` vs `> f 2>&1` | Errors to the terminal vs both into `f` (left-to-right order) |
| hard link vs symlink | Same inode, same filesystem, survives target deletion vs path file, crosses filesystems, breaks when target moves |
| absolute vs relative path | From `/` vs from the current directory |
| `tar` vs `gzip` | Bundles many files into one (no compression by itself) vs compresses one file (`tar -z` combines them) |
| `zip` vs `tar.gz` | Per-file compression with random access, Windows-friendly vs whole-stream compression, keeps Unix permissions |

## Searching and Text

| Pair | Difference |
|------|------------|
| `grep` vs `find` | Searches **contents** for lines vs searches the **tree** for files |
| `find` vs `locate` | Live walk of the tree vs fast lookup in a prebuilt database (may be stale) |
| `grep` vs `grep -E` vs `grep -F` | Basic regex vs extended regex (`+ ? \| ()`) vs fixed strings |
| `sed` vs `awk` | Line-oriented edits (substitute, delete) vs field-oriented processing with variables and arithmetic |
| `sort -u` vs `uniq` | Sorted unique lines vs removes only **adjacent** duplicates (`-c` counts) |
| `diff` vs `comm` | Changes between two files vs lines unique/common to two **sorted** files |
| `xargs` vs `-exec` | Reads arguments from stdin for any command vs built into `find`; both batch with `+` / default |
| `wc -l` vs `grep -c` | All newline-terminated lines vs matching lines |

## Processes and Services

| Pair | Difference |
|------|------------|
| `kill` vs `kill -9` | SIGTERM (catchable, graceful) vs SIGKILL (immediate, no cleanup) |
| `kill` vs `pkill` / `killall` | By PID vs by name/pattern |
| `ps` vs `top` | Snapshot vs live, sorted, interactive |
| `&` vs `nohup` | Background job (dies with SIGHUP at logout) vs ignores SIGHUP, output to `nohup.out` |
| `Ctrl+C` vs `Ctrl+Z` | SIGINT (interrupt) vs SIGTSTP (suspend; `fg`/`bg` resume) |
| `restart` vs `reload` | Stop + start (new process) vs re-read configuration in place |
| `start` vs `enable` | Run now vs start at boot (`enable --now` = both) |
| zombie vs orphan | Dead but not reaped vs alive with a dead parent (adopted by PID 1) |
| cron vs `at` vs systemd timer | Repeating schedule vs run once vs schedule with logging, dependencies, catch-up |

## Users and Privilege

| Pair | Difference |
|------|------------|
| `su` vs `sudo` | Switch user with **their** password, whole shell vs one command with **your** password, sudoers rules, logged |
| `su` vs `su -` | Keeps your environment vs full login environment of the target user |
| `sudo -s` vs `sudo -i` | Root shell with your environment vs root login shell |
| `/etc/passwd` vs `/etc/shadow` | Accounts (world-readable) vs password hashes (root only) |
| `useradd` vs `adduser` | Low-level, flags only vs interactive Debian/Ubuntu wrapper |
| `chmod` vs `chown` | Permission bits vs owner/group |
| `usermod -G` vs `usermod -aG` | **Replaces** supplementary groups vs appends |

## Storage

| Pair | Difference |
|------|------------|
| `df` vs `du` | Filesystem usage (incl. deleted-open files) vs size of files you can see |
| `df -h` vs `df -i` | Space vs inodes |
| `mount` vs `/etc/fstab` | Mount now (temporary) vs mount at every boot |
| partition vs filesystem | A section of a disk vs the structure created on it (`mkfs`) |

## Network

| Pair | Difference |
|------|------------|
| `curl` vs `wget` | Requests and API testing, stdout by default vs downloads to files, resume, recursion |
| `ping` vs `traceroute` | Reachability and latency vs the path hop by hop |
| `dig` vs `nslookup` vs `getent hosts` | Detailed DNS vs simple DNS vs system resolver including `/etc/hosts` |
| `ss` vs `netstat` | Modern, fast vs legacy (net-tools) |
| `scp` vs `rsync` | Copies whole files vs transfers differences, dry run, `--delete` |
| TCP vs UDP | Connection, ordered, reliable vs connectionless, no guarantees, low overhead |
| refused vs timed out | Host answered, port closed vs no answer (firewall drop, host down) |

## Packages

| Pair | Difference |
|------|------------|
| `apt update` vs `apt upgrade` | Refresh package lists vs install newer versions |
| `apt upgrade` vs `apt full-upgrade` | Never removes packages vs may remove/install to resolve dependencies |
| `apt remove` vs `apt purge` | Keeps configuration files vs deletes them too |
| `apt` vs `dpkg` | Resolves dependencies, downloads from repositories vs installs local `.deb` files, no dependency resolution |
| `apt` vs `apt-get` | Friendly interactive interface vs stable interface for scripts |
