# Troubleshooting: Disk Space, Files and Commands — Interview Questions

## Beginner

### Q1. A server reports "No space left on device". What are your first commands?

<details>
<summary>Answer</summary>

`df -h` to see which filesystem is full, `df -i` to check inodes, then `du -xh --max-depth=1 /mount/point | sort -h` (repeated one level deeper each time) to find the directories using the space.

</details>

### Q2. How do you find files larger than 1 GB?

<details>
<summary>Answer</summary>

`find / -xdev -type f -size +1G -exec ls -lh {} + 2>/dev/null`. `-xdev` stays on one filesystem, `-size +1G` means larger than 1 GiB, and `2>/dev/null` hides permission errors.

</details>

### Q3. Why does `./script.sh` say "Permission denied" when you own the file?

<details>
<summary>Answer</summary>

The file lacks execute permission (`-rw-r--r--`). Fix with `chmod u+x script.sh`, or run it through the interpreter: `bash script.sh`. If it already has `x`, the filesystem may be mounted `noexec`.

</details>

### Q4. Why is `script.sh` "command not found" while `./script.sh` works?

<details>
<summary>Answer</summary>

Without a slash, the shell looks only in the directories listed in `PATH`, and the current directory is not one of them (deliberately, so a malicious file named `ls` in some directory is not run by accident). `./` gives an explicit path.

</details>

## Intermediate

### Q5. You deleted a 20 GB log file but `df` still shows the disk full. Why?

<details>
<summary>Answer</summary>

A process still has the file open. Deleting removes the directory entry, but the data stays allocated until the last file descriptor is closed. `lsof +L1` (or `ls -l /proc/*/fd | grep deleted`) shows it. Restart or reload the process, or truncate it via `: > /proc/<pid>/fd/<fd>`. Truncating active logs instead of deleting them avoids the problem.

</details>

### Q6. `df -h` shows 40 % used, but you cannot create files. What is happening?

<details>
<summary>Answer</summary>

Likely inode exhaustion: every file needs an inode, and a filesystem with millions of tiny files can run out while blocks remain free. `df -i` shows `IUse%` at 100 %. Find the directory with the most files (for example `find /var -xdev -type f | cut -d/ -f2-3 | sort | uniq -c | sort -rn | head`) and clean it up. Other possibilities: the filesystem is mounted read-only, or space reserved for root is all that remains.

</details>

### Q7. You cannot delete a file you own. What could cause that?

<details>
<summary>Answer</summary>

Deletion needs write and execute permission on the **directory**. Other causes: the directory has the sticky bit and the file belongs to someone else, the file has the immutable attribute (`lsattr`, `chattr -i`), the filesystem is read-only, the name starts with `-` (`rm -- -file`), or the path is a mount point.

</details>

### Q8. How do you safely empty a log that a running application writes to?

<details>
<summary>Answer</summary>

Truncate it: `: > app.log` or `truncate -s 0 app.log`. The application keeps writing to the same open file, now empty. Deleting it would hide the file while its space stays in use. Long-term, configure logrotate (with a reopen signal or `copytruncate`).

</details>

### Q9. A command works in your terminal but "command not found" in cron. Why?

<details>
<summary>Answer</summary>

Cron runs jobs with a minimal `PATH` (often `/usr/bin:/bin`) and without your shell startup files, so tools in `/usr/local/bin`, `/opt/…` or `~/.local/bin` are not found. Use absolute paths or set `PATH` in the crontab or script. The same happens with `sudo`, which uses `secure_path`.

</details>

## Advanced

### Q10. Walk through how you would investigate a filesystem that fills up every night.

<details>
<summary>Answer</summary>

Measure when and what: compare `du` snapshots of the main directories before and after the night (or use `find -newermt`/`-mmin` to see what was written), check cron jobs and systemd timers scheduled at that time (backups, exports, log jobs), and check logs for error loops at that time. Identify the writing process with `lsof` on the growing file. Fix the job (retention, compression, a different target volume), add log rotation, and set an alert well before 100 %.

</details>

### Q11. How do you find which directory contains millions of small files?

<details>
<summary>Answer</summary>

Count files per directory rather than bytes: `du --inodes -x --max-depth=1 /var | sort -n | tail` (GNU du), or `find /var -xdev -type f | cut -d/ -f1-3 | sort | uniq -c | sort -n | tail`. Repeat one level deeper until you reach the culprit — typically session files, a cache, a mail queue or temporary files.

</details>

### Q12. Root gets "Operation not permitted" when deleting a file. What do you check?

<details>
<summary>Answer</summary>

Root bypasses permission bits, so look elsewhere: the immutable or append-only attribute (`lsattr file`, remove with `chattr -i`/`-a` if appropriate), a read-only mount (`findmnt`), a file on a network filesystem that maps root to an unprivileged user (NFS root squash), or a mandatory access control policy (SELinux/AppArmor). Find out why the attribute was set before removing it.

</details>
