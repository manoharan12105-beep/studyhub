# Paths and Navigation — Interview Questions

## Beginner

### Q1. What is the difference between an absolute and a relative path?

<details>
<summary>Answer</summary>

An absolute path starts with `/` and is resolved from the root directory, so it means the same thing from anywhere (`/var/log/syslog`). A relative path is resolved from the current working directory (`logs/app.log`, `../config`), so its meaning depends on where you are.

</details>

### Q2. What do `.`, `..` and `~` mean?

<details>
<summary>Answer</summary>

`.` is the current directory, `..` its parent, and `~` the current user's home directory (expanded by the shell; `~bob` is Bob's home). `.` and `..` are real directory entries; `~` is shell syntax.

</details>

### Q3. How do you go back to the previous directory?

<details>
<summary>Answer</summary>

`cd -`. It switches to the directory stored in `$OLDPWD` and prints it. Running it again toggles back.

</details>

### Q4. How do you list hidden files?

<details>
<summary>Answer</summary>

`ls -a` (includes `.` and `..`) or `ls -A` (excludes them). Hidden files are simply names that begin with a dot, such as `.bashrc` — there is no hidden attribute.

</details>

### Q5. Explain each column of `ls -l`.

<details>
<summary>Answer</summary>

File type and permissions (`-rw-r--r--`), hard-link count, owner, group, size in bytes, last modification time, and name. For symbolic links the name is followed by `-> target`. `-h` makes sizes human-readable.

</details>

## Intermediate

### Q6. Why is `cd` a shell builtin rather than a program?

<details>
<summary>Answer</summary>

The working directory is a property of each process. An external `cd` program would run in a child process, change the child's directory and exit, leaving the shell unchanged. Only the shell itself can change its own working directory.

</details>

### Q7. How would you list files sorted by size, largest first, with readable sizes?

<details>
<summary>Answer</summary>

`ls -lhS`. Add `-r` to reverse (smallest first). For directory totals, `ls` is the wrong tool — use `du -sh * | sort -h`.

</details>

### Q8. A cron job runs `./backup.sh` and fails with "No such file or directory", though it works when you run it by hand. Why?

<details>
<summary>Answer</summary>

Cron runs jobs with a different working directory (normally the user's home), so the relative path `./backup.sh` points somewhere else. Use absolute paths in cron jobs (`/home/student/scripts/backup.sh`), and inside the script either use absolute paths or `cd` to a known directory first.

</details>

### Q9. What does `ls -ld /tmp` show that `ls -l /tmp` does not?

<details>
<summary>Answer</summary>

`-d` lists the directory entry itself — its own permissions (`drwxrwxrwt`, with the sticky bit), owner and timestamps — instead of listing the files inside it.

</details>

## Advanced

### Q10. Why should scripts not loop over `$(ls)`?

<details>
<summary>Answer</summary>

`$(ls)` is split on whitespace, so `my report.txt` becomes two words, and glob characters in names can expand again. `ls` output is meant for humans (it may also add colours or escape characters). Use a glob — `for f in *.log; do …; done` — or `find … -print0 | xargs -0` for recursive work.

</details>

### Q11. How can a script find the directory it lives in, regardless of where it is called from?

<details>
<summary>Answer</summary>

`script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)`. `BASH_SOURCE[0]` is the script's path as invoked, `dirname` strips the filename, and `cd … && pwd` turns it into an absolute path. Add `-P` to `pwd` to resolve symbolic links. Then refer to files as `"$script_dir/config.conf"`.

</details>
