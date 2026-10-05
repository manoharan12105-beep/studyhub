# Signals: kill, killall and pkill — Interview Questions

## Beginner

### Q1. What is the difference between `kill` and `kill -9`?

<details>
<summary>Answer</summary>

`kill PID` sends `SIGTERM` (15), a request to terminate that the process can catch to shut down cleanly — finish requests, flush data, remove lock files — or even ignore. `kill -9 PID` sends `SIGKILL` (9), which cannot be caught: the kernel removes the process immediately with no cleanup, risking data loss and stale locks. Use `SIGTERM` first and `SIGKILL` only if the process does not exit.

</details>

### Q2. What is a signal?

<details>
<summary>Answer</summary>

An asynchronous notification sent to a process by the kernel, another process or the terminal, identified by a number and name (`SIGINT`, `SIGTERM`, `SIGHUP`…). The process can handle it with its own code, ignore it, or let the default action happen (terminate, core dump, stop, continue, ignore).

</details>

### Q3. Which signals cannot be caught or ignored?

<details>
<summary>Answer</summary>

`SIGKILL` (9) and `SIGSTOP` (19). This guarantees the system can always terminate or pause any process (subject to permissions).

</details>

### Q4. What signal does `Ctrl+C` send? And `Ctrl+Z`?

<details>
<summary>Answer</summary>

`Ctrl+C` sends `SIGINT` (2) to the foreground process group; `Ctrl+Z` sends `SIGTSTP` (20), which suspends it.

</details>

### Q5. What does `kill` send if you do not specify a signal?

<details>
<summary>Answer</summary>

`SIGTERM` (15).

</details>

## Intermediate

### Q6. What is the difference between SIGTERM and SIGKILL in terms of graceful vs forced termination?

<details>
<summary>Answer</summary>

SIGTERM is graceful: the application's handler runs, so it can stop accepting work, complete in-flight requests, commit or roll back transactions, flush logs and exit with a clean status. SIGKILL is forced: no user code runs; open files are closed by the kernel, but buffered data is lost, temporary and lock files remain, and work in progress is cut off. Service managers send SIGTERM, wait for a timeout, then send SIGKILL.

</details>

### Q7. What is SIGHUP used for?

<details>
<summary>Answer</summary>

Originally "hang-up": the terminal or modem line disconnected, so the session's processes are told to exit (default action terminate). By convention, daemons that have no terminal treat it as "reload your configuration" — e.g. `kill -HUP $(cat /run/nginx.pid)` or `systemctl reload`. `nohup` makes a command ignore it.

</details>

### Q8. What do exit codes 137 and 143 mean?

<details>
<summary>Answer</summary>

A process terminated by signal N gets status 128 + N. 137 = 128 + 9: killed by SIGKILL — in Docker/Kubernetes most often the out-of-memory killer (`OOMKilled`). 143 = 128 + 15: terminated by SIGTERM, e.g. by `docker stop` or a rolling deployment.

</details>

### Q9. What is the difference between `kill`, `killall` and `pkill`?

<details>
<summary>Answer</summary>

`kill` signals specific PIDs. `killall` signals all processes with an exact name (`killall nginx`). `pkill` signals processes matching a pattern on the name or, with `-f`, the full command line, with filters such as `-u user`. `pkill` and `killall` can hit more processes than intended — preview with `pgrep -a`.

</details>

### Q10. How do you check whether a process is still alive from a script?

<details>
<summary>Answer</summary>

`kill -0 PID` sends no signal but performs the existence and permission check; exit status 0 means the process exists. `ps -p PID >/dev/null` also works. Beware PID reuse when reading old PID files.

</details>

## Advanced

### Q11. `kill -9` did not remove a process. How is that possible?

<details>
<summary>Answer</summary>

It may be a zombie (already dead; only the parent's `wait()` removes the entry), in uninterruptible sleep (`D`, waiting on I/O such as a hung NFS mount — the signal is delivered when the I/O returns), you lack permission (another user's process: "Operation not permitted"), or you killed the wrong PID while a supervisor (systemd, Kubernetes) immediately restarted the service under a new PID.

</details>

### Q12. How does a Spring Boot application behave on SIGTERM vs SIGKILL?

<details>
<summary>Answer</summary>

On SIGTERM the JVM starts its shutdown sequence and runs shutdown hooks; Spring closes the application context, which (with `server.shutdown=graceful`) stops accepting new requests, lets active requests finish within a timeout, then destroys beans — closing connection pools, flushing logs. On SIGKILL none of this happens: in-flight requests fail, pools are not closed cleanly and messages may be processed twice or lost. That is why containers get a termination grace period before SIGKILL.

</details>

### Q13. How do you make a shell script clean up temporary files even when it is interrupted?

<details>
<summary>Answer</summary>

Register a trap: `tmp=$(mktemp); trap 'rm -f "$tmp"' EXIT` handles normal exit and errors; add `trap 'exit 130' INT` and `trap 'exit 143' TERM` so `Ctrl+C` and `kill` lead to the EXIT trap. Note that no trap can run on SIGKILL.

</details>
