# Signals: kill, killall and pkill — Practice

### P1. Default signal

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** kill default

Which signal does `kill 4242` send?

- A) SIGKILL
- B) SIGINT
- C) SIGTERM
- D) SIGHUP

<details>
<summary>Answer</summary>

**Answer:** C) SIGTERM

**Explanation:** `kill` without an option sends SIGTERM (15), a catchable request to terminate.

</details>

### P2. Signal numbers

**Difficulty:** Easy · **Type:** Output · **Concepts:** kill -l

What does this print?

```bash
kill -l 9 15 TERM
```

<details>
<summary>Answer</summary>

**Output:**

```text
KILL
TERM
15
```

`kill -l` translates numbers to names and names to numbers.

</details>

### P3. Exit code detective

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** 128 + N

A container exited with code 137. Another exited with 143. What happened to each?

<details>
<summary>Answer</summary>

137 = 128 + 9: killed by SIGKILL — very often the out-of-memory killer, or SIGKILL after a stop timeout. 143 = 128 + 15: terminated by SIGTERM, a normal stop request that the application did not handle with its own exit code.

</details>

### P4. Pause and resume

**Difficulty:** Medium · **Type:** Output · **Concepts:** SIGSTOP, SIGCONT

What does this print?

```bash
sleep 300 &
pid=$!
sleep 0.3
kill -STOP "$pid"
ps -o stat= -p "$pid" | cut -c1
kill -CONT "$pid"
ps -o stat= -p "$pid" | cut -c1
kill "$pid"
```

<details>
<summary>Answer</summary>

**Output:**

```text
T
S
```

Stopped after SIGSTOP, back to sleeping after SIGCONT.

</details>

### P5. Graceful first

**Difficulty:** Medium · **Type:** Script · **Concepts:** SIGTERM then SIGKILL

Write a snippet that sends SIGTERM to the PID in variable `pid`, waits up to 5 seconds for it to exit, and sends SIGKILL only if it is still running.

<details>
<summary>Answer</summary>

```bash
# Illustrative
kill "$pid"
for i in 1 2 3 4 5; do
    kill -0 "$pid" 2>/dev/null || exit 0
    sleep 1
done
echo "still alive after SIGTERM, forcing" >&2
kill -9 "$pid"
```

</details>

### P6. Trap output

**Difficulty:** Medium · **Type:** Output · **Concepts:** trap

What does this print?

```bash
bash -c 'trap "echo caught TERM; exit 3" TERM; kill -TERM $$; echo not reached'
echo "status $?"
```

<details>
<summary>Answer</summary>

**Output:**

```text
caught TERM
status 3
```

The inner shell sends SIGTERM to itself (`$$`), its trap runs and exits with 3, so "not reached" is never printed.

</details>

### P7. Uncatchable

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** SIGKILL, SIGSTOP

A script has `trap '' INT TERM HUP KILL`. Which signal still terminates it?

- A) SIGINT
- B) SIGTERM
- C) SIGHUP
- D) SIGKILL

<details>
<summary>Answer</summary>

**Answer:** D) SIGKILL

**Explanation:** SIGKILL cannot be caught or ignored — bash silently cannot trap it. The empty trap makes the script ignore INT, TERM and HUP.

</details>

### P8. Reload, don't restart

**Difficulty:** Medium · **Type:** Command · **Concepts:** SIGHUP

nginx's master process PID is stored in `/run/nginx.pid`. Make it re-read its configuration without dropping connections, using a signal.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo kill -HUP "$(cat /run/nginx.pid)"
```

Equivalent: `sudo systemctl reload nginx` or `sudo nginx -s reload`. Test the configuration first with `sudo nginx -t`.

</details>

### P9. Too broad

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** pkill safety

On a shared server, you want to stop your own stuck `python report.py` process. A colleague suggests `sudo pkill python`. What can go wrong, and what do you run instead?

<details>
<summary>Answer</summary>

It sends SIGTERM to every process named python, for every user — including system tools written in Python (e.g. package managers, cloud agents) and colleagues' jobs. Instead, preview and narrow: `pgrep -af 'report.py' -u "$USER"`, then `pkill -u "$USER" -f 'python report.py'`, or `kill <pid>` for the exact PID — no sudo needed for your own processes.

</details>

### P10. kill -9 had no effect

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** D state, zombies

After `kill -9 3120`, `ps -o pid,stat,cmd -p 3120` still shows the process with `STAT` = `D`. Explain and describe what you would investigate.

<details>
<summary>Answer</summary>

`D` (uninterruptible sleep) means the process is blocked inside a kernel I/O operation; the pending SIGKILL is acted on only when that operation returns. Investigate the I/O: which file or mount it uses (`ls -l /proc/3120/fd`, `cat /proc/3120/wchan`), `dmesg` for disk/NFS errors ("server not responding", I/O errors), and the health of the storage or network filesystem. Fixing or force-unmounting the hung mount (`umount -f`/`-l`), or a reboot, releases it.

</details>
