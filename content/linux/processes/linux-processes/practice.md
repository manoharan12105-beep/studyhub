# Processes and the Process Lifecycle — Practice

### P1. Read the state

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** process states

`ps` shows `STAT` = `T` for a process. What does it mean?

- A) Terminated
- B) Stopped (paused)
- C) Thread
- D) Timer running

<details>
<summary>Answer</summary>

**Answer:** B) Stopped (paused)

**Explanation:** `T` means stopped by a signal such as `SIGSTOP` or `Ctrl+Z` (`SIGTSTP`). It can continue with `SIGCONT`, `fg` or `bg`. A terminated process that is not yet reaped shows `Z`.

</details>

### P2. Parent and child

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** PID, PPID

You run `java -jar app.jar` in a bash shell whose PID is 2205. The Java process gets PID 2290. What is the Java process's PPID? What happens to the Java process's PPID if you close the terminal and Java keeps running (for example under `nohup`)?

<details>
<summary>Answer</summary>

PPID 2205 (bash). If bash exits and Java survives, Java becomes an orphan and is re-parented to PID 1 (or a subreaper such as `systemd --user`), so its PPID changes to that process.

</details>

### P3. Exit status of a child

**Difficulty:** Easy · **Type:** Output · **Concepts:** exit, $?

What does this print?

```bash
bash -c 'exit 7'
echo $?
```

<details>
<summary>Answer</summary>

**Output:**

```text
7
```

The parent shell collected the child's exit status with `wait()` and stored it in `$?`.

</details>

### P4. Kill the zombie?

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** zombie processes

`ps` shows `[worker] <defunct>` with state `Z`, PPID 3100. Which action actually removes it?

- A) `kill -9` the zombie's PID
- B) `kill -STOP` the zombie's PID
- C) Make process 3100 reap its children, or restart it
- D) Reboot is the only way

<details>
<summary>Answer</summary>

**Answer:** C) Make process 3100 reap its children, or restart it

**Explanation:** A zombie is already dead, so signals sent to it have no effect. When the parent calls `wait()` — or exits, so that PID 1 adopts and reaps the zombie — the entry disappears.

</details>

### P5. Load without CPU

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** D state, load average

`uptime` shows a load average of 25 on an 8-core server, yet `top` shows CPUs 90 % idle. Many processes are in state `D`. What is likely happening, and what do you check next?

<details>
<summary>Answer</summary>

The load average counts runnable **and** uninterruptible (`D`) processes. Idle CPUs with many `D` processes point to processes blocked on I/O — a slow or failing disk, an overloaded storage array, or an unresponsive NFS mount. Check `iostat -x` / `vmstat` (high `wa`), `dmesg` for disk or NFS errors, and which mounts the stuck processes use (`ls -l /proc/<pid>/cwd`, `cat /proc/<pid>/wchan`).

</details>

### P6. Count processes by state

**Difficulty:** Medium · **Type:** Command · **Concepts:** ps, sort, uniq

Write a pipeline that counts how many processes are in each state letter (R, S, D, …) on the system.

<details>
<summary>Answer</summary>

```bash
ps -eo stat= | cut -c1 | sort | uniq -c | sort -rn
```

`stat=` suppresses the header; `cut -c1` keeps only the state letter without modifiers such as `s` or `+`. Typically most processes are `S`.

</details>

### P7. Thread or process?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** threads

A Spring Boot application shows as one line in `ps aux` but `top -H` lists 60 entries for it. Explain.

<details>
<summary>Answer</summary>

The JVM is one process (one PID, one address space) containing many threads: HTTP worker threads, garbage-collector threads, JIT compiler threads and others. `ps aux` lists processes; `top -H` (or `ps -eLf`) lists threads, each with its own thread ID.

</details>

### P8. Why fork then exec?

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** fork/exec and redirection

Explain how the shell runs `sort data.txt > sorted.txt` in terms of fork, exec and file descriptors.

<details>
<summary>Answer</summary>

Bash calls `fork()`. In the child it opens `sorted.txt` for writing (truncating it) and makes it file descriptor 1 (`dup2`), then calls `execve("/usr/bin/sort", ["sort", "data.txt"])`. `sort` inherits FD 1 already pointing at the file, so it writes there without knowing about redirection. The parent bash calls `wait()` and stores the exit status in `$?`.

</details>
