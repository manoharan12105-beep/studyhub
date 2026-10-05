# Linux Fundamentals Interview Questions — Interview Questions

## Beginner

### Q1. What is Linux? Is it an operating system?

<details>
<summary>Answer</summary>

Strictly, Linux is the **kernel** — the core that manages processes, memory, devices and filesystems. What people call "Linux" is a **distribution** (Ubuntu, Debian, RHEL, Fedora): the kernel plus GNU tools, a shell, a package manager, an init system (systemd) and default configuration. It is open source (GPL), Unix-like, multi-user and multitasking.

</details>

### Q2. What are the kernel, the shell and user space?

<details>
<summary>Answer</summary>

The **kernel** runs in privileged mode and controls the hardware. **User space** holds every normal program, which asks the kernel for services through **system calls** (`open`, `read`, `fork`, `execve`). The **shell** (bash, zsh) is one such program: it reads commands, expands them and starts other programs.

</details>

### Q3. What is the difference between an absolute and a relative path?

<details>
<summary>Answer</summary>

An absolute path starts at the root `/` and means the same thing from anywhere (`/home/student/linux-lab/app.log`). A relative path is interpreted from the current directory (`linux-lab/app.log`, `../notes.txt`). `.` is the current directory, `..` the parent, `~` your home directory.

</details>

### Q4. What are `/etc`, `/var`, `/home`, `/tmp` and `/usr` used for?

<details>
<summary>Answer</summary>

`/etc` system configuration; `/var` variable data such as logs (`/var/log`), caches and spools; `/home` users' home directories; `/tmp` temporary files (often cleared at boot); `/usr` installed programs and libraries (`/usr/bin`, `/usr/lib`). Also: `/root` root's home, `/proc` and `/sys` virtual kernel information, `/dev` device files, `/opt` optional third-party software.

</details>

### Q5. What is the difference between `cat`, `less`, `head` and `tail`?

<details>
<summary>Answer</summary>

`cat` prints the whole file at once (or concatenates files). `less` pages through it interactively, with search, without loading it all — the right choice for big files. `head -n N` shows the first N lines, `tail -n N` the last N; `tail -f` follows a growing log.

</details>

### Q6. What is the difference between `>` and `>>`?

<details>
<summary>Answer</summary>

Both redirect standard output to a file. `>` truncates (overwrites) the file first; `>>` appends to the end. Both create the file if it does not exist. `set -o noclobber` makes `>` refuse to overwrite existing files.

</details>

### Q7. What are stdin, stdout and stderr?

<details>
<summary>Answer</summary>

The three standard streams every process starts with: file descriptor 0 (input, the keyboard by default), 1 (normal output) and 2 (error messages), both outputs going to the terminal by default. Separating them lets you redirect results and errors independently: `cmd > out.txt 2> err.txt`, `cmd 2>/dev/null`, `cmd > all.txt 2>&1`.

</details>

### Q8. What does a pipe (`|`) do?

<details>
<summary>Answer</summary>

It connects the standard output of one command to the standard input of the next; both run at the same time. Small tools combine into larger tasks: `grep ERROR app.log | sort | uniq -c | sort -rn | head`. Only stdout flows through the pipe; stderr still goes to the terminal unless redirected (`2>&1 |` or `|&`).

</details>

### Q9. How do you get help for a command?

<details>
<summary>Answer</summary>

`man command` (manual page; `/` searches), `command --help` (short usage), `help builtin` for shell builtins such as `cd`, `type command` (alias, builtin, function or file?), `which command` (path of the executable), `apropos keyword` / `man -k keyword` (find commands by topic), `tldr` if installed.

</details>

## Intermediate

### Q10. What is the difference between `cp` and `mv`?

<details>
<summary>Answer</summary>

`cp` creates a new file with a copy of the data (new inode); the original stays. `mv` renames: within the same filesystem it only changes directory entries (instant, same inode, data untouched); across filesystems it copies then deletes. `cp -r` is needed for directories, `mv` handles them directly. Both overwrite existing targets silently unless `-i` or `-n` is used.

</details>

### Q11. What is the difference between `grep` and `find`?

<details>
<summary>Answer</summary>

`grep` searches **inside** files for lines matching a pattern (`grep -rn "timeout" /etc/myapp`). `find` searches the **directory tree** for files by name, type, size, time, owner or permissions (`find /var/log -name '*.log' -mtime +7`). They combine: `find . -name '*.java' -exec grep -l 'TODO' {} +`.

</details>

### Q12. What does "everything is a file" mean in Linux?

<details>
<summary>Answer</summary>

Many resources are accessed through the same file interface (open, read, write, close): regular files, directories, devices (`/dev/sda`, `/dev/null`), pipes, sockets, and kernel information in `/proc` and `/sys` (`cat /proc/cpuinfo`). The same tools — `cat`, redirection, permissions — therefore work on all of them.

</details>

### Q13. How do you count the number of lines containing "ERROR" in a log file, and the number of distinct IP addresses in an access log?

<details>
<summary>Answer</summary>

```bash
cd ~/linux-lab
grep -c ERROR app.log
cut -d' ' -f1 access.log | sort -u | wc -l
```

**Output:**

```text
3
4
```

`grep -c` counts matching lines; `cut` extracts the first field (the IP), `sort -u` removes duplicates, `wc -l` counts them.

</details>

### Q14. What is `/dev/null` used for?

<details>
<summary>Answer</summary>

A device that discards everything written to it and returns end-of-file when read. Typical uses: hide output or errors (`find / -name x 2>/dev/null`), run a command only for its exit status (`grep -q` is better, but `> /dev/null 2>&1` is common), and empty a file (`cat /dev/null > file`).

</details>

### Q15. What is the difference between a terminal, a shell and a console?

<details>
<summary>Answer</summary>

A **terminal** (emulator) is the program that displays text and sends keystrokes — GNOME Terminal, Windows Terminal, or a pseudo-terminal over SSH. The **shell** is the command interpreter running inside it (bash, zsh). The **console** historically is the physical terminal attached to the machine; today the system's text console (`/dev/console`, virtual terminals with Ctrl+Alt+F1…).

</details>

## Advanced

### Q16. What happens when you type `ls -l /tmp` and press Enter?

<details>
<summary>Answer</summary>

The shell reads the line, splits it into words, performs expansions (variables, globs, aliases — `ls` may be an alias with `--color`), and looks up `ls`: function, builtin, or a file found by searching `PATH` (hash table first). It calls `fork()` to create a child process; the child sets up redirections and calls `execve("/usr/bin/ls", ["ls","-l","/tmp"], env)`. `ls` makes system calls (`openat`, `getdents64`, `statx`) to read the directory and file metadata, writes to stdout (the terminal), and exits with a status. The parent shell `wait()`s, stores the status in `$?`, and prints the prompt again.

</details>

### Q17. What is a system call? Give examples.

<details>
<summary>Answer</summary>

The controlled entry point from user space into the kernel, used whenever a program needs something only the kernel may do: files (`open`, `read`, `write`, `close`), processes (`fork`, `execve`, `exit`, `wait`), memory (`mmap`, `brk`), networking (`socket`, `connect`, `bind`), signals (`kill`). Library functions such as `printf` or Java's `FileInputStream` eventually make system calls; `strace` shows them.

</details>

### Q18. What is the difference between Linux and Unix?

<details>
<summary>Answer</summary>

Unix is the original operating system from Bell Labs (1969) and a family of certified systems (AIX, HP-UX, Solaris, macOS). Linux is an independent, Unix-like kernel written from scratch (Linus Torvalds, 1991), open source under the GPL, following the same design ideas and POSIX standards but not derived from Unix code. Commands and concepts are largely the same; details (options, init systems, paths) differ.

</details>
