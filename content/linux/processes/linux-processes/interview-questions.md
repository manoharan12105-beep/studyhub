# Processes and the Process Lifecycle — Interview Questions

## Beginner

### Q1. What is the difference between a program and a process?

<details>
<summary>Answer</summary>

A program is an executable file stored on disk. A process is a running instance of a program, with its own PID, memory, open files, environment, working directory and user identity. One program can run as many processes at once.

</details>

### Q2. What are PID and PPID?

<details>
<summary>Answer</summary>

PID is the unique number the kernel assigns to a process. PPID is the PID of its parent — the process that created it. `ps -o pid,ppid,cmd` shows both; `echo $$` prints the current shell's PID.

</details>

### Q3. What are the main process states in Linux?

<details>
<summary>Answer</summary>

`R` running or runnable (in the run queue), `S` interruptible sleep (waiting for an event), `D` uninterruptible sleep (waiting for I/O, cannot be interrupted), `T` stopped (by `SIGSTOP`/`Ctrl+Z` or a debugger), `Z` zombie (exited, not yet reaped by its parent).

</details>

### Q4. What is a daemon?

<details>
<summary>Answer</summary>

A long-running background service process with no controlling terminal, usually started at boot by systemd and running as a dedicated user — e.g. `sshd`, `cron`, `nginx`. Names traditionally end in `d`.

</details>

### Q5. What is PID 1?

<details>
<summary>Answer</summary>

The first user-space process, started by the kernel at boot: the init system (systemd on most distributions). It starts services, adopts orphaned processes and reaps them. If it exits, the kernel panics.

</details>

## Intermediate

### Q6. What is a zombie process, and how do you get rid of it?

<details>
<summary>Answer</summary>

A process that has exited but whose parent has not yet called `wait()` to read its exit status, so a process-table entry remains (`Z`, `<defunct>`). It uses no CPU or memory, only a PID. You cannot kill it — it is already dead. Make the parent reap it (some programs reap on `SIGCHLD`), fix the parent's bug, or terminate the parent; the zombie is then adopted by PID 1, which reaps it immediately.

</details>

### Q7. What is an orphan process?

<details>
<summary>Answer</summary>

A process whose parent has exited while it is still running. The kernel re-parents it to PID 1 (or to the nearest subreaper, such as a `systemd --user` instance or a container's init), which will reap it when it finishes. Orphans are normal — daemons are often deliberately orphaned.

</details>

### Q8. Explain fork and exec.

<details>
<summary>Answer</summary>

`fork()` creates a child process as a copy of the parent (copy-on-write memory, new PID). `exec()` replaces the program running in a process with another one, keeping the PID and open file descriptors. A shell runs a command with fork + exec, configuring redirections and pipes in the child in between, then `wait()`s for it.

</details>

### Q9. What is the difference between a process and a thread?

<details>
<summary>Answer</summary>

Processes have separate address spaces; threads within one process share memory and file descriptors but have their own stacks and registers. Threads are cheaper to create and communicate through shared memory (with synchronisation), but a crash in one thread usually kills the whole process. On Linux both are tasks scheduled by the kernel; `ps -eLf` or `top -H` show threads.

</details>

## Advanced

### Q10. What does the `D` state mean, and why can't you kill such a process?

<details>
<summary>Answer</summary>

Uninterruptible sleep: the process is inside a kernel operation, typically waiting for disk or network-filesystem I/O, that must not be interrupted. Signals — including `SIGKILL` — are delivered only when it returns from that operation. Many `D` processes indicate a storage problem: a failing disk, a hung NFS server, or an overloaded I/O system. They also raise the load average without using CPU.

</details>

### Q11. A server has thousands of zombie processes. What is the risk and what do you do?

<details>
<summary>Answer</summary>

Each zombie holds a PID; enough of them can exhaust the PID limit (`/proc/sys/kernel/pid_max`), after which no new process can start. Find the parent: `ps -eo pid,ppid,stat,cmd | awk '$3 ~ /Z/'` and look at the PPID. Send the parent `SIGCHLD` (some programs reap then), restart it, or fix its code to `wait()` for children. Killing the zombies themselves does nothing.

</details>

### Q12. Why does a shell use fork followed by exec instead of a single "spawn" call?

<details>
<summary>Answer</summary>

Between the two calls the child is still running the shell's code, so it can rearrange its own state for the new program: redirect file descriptors (`> file`, `2>&1`), connect pipes, change directory, set environment variables, reset signal handlers, apply limits. `exec` then starts the program with that prepared environment. (`posix_spawn` exists as an optimised combined call, but the model is the same.)

</details>
