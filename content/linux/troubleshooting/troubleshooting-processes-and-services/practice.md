# Troubleshooting: CPU, Memory, Services, Ports and Logs — Practice

### P1. Reading the load

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** load average, nproc

`uptime` shows `load average: 3.90, 3.75, 3.60` and `nproc` prints `4`. What does this mean?

- A) The system is badly overloaded
- B) The CPUs are busy but work is not queuing much
- C) Four processes have crashed
- D) Memory is almost full

<details>
<summary>Answer</summary>

**Answer:** B) The CPUs are busy but work is not queuing much

**Explanation:** A load around the number of CPUs means they are fully used with little waiting. A load well above `nproc` (say 12 on 4 CPUs) means a queue.

</details>

### P2. Top memory consumers

**Difficulty:** Easy · **Type:** Command · **Concepts:** ps --sort

List the five processes using the most resident memory, showing PID, RSS and command name.

<details>
<summary>Answer</summary>

```bash
ps -eo pid,rss,comm --sort=-rss | head -6
```

`head -6` = the header plus five processes. In `top`, press `M` for the same ordering.

</details>

### P3. Port conflict in the lab

**Difficulty:** Medium · **Type:** Output · **Concepts:** EADDRINUSE

What does the last command print?

```bash
cd ~/linux-lab
python3 -m http.server 8080 --bind 127.0.0.1 > /dev/null 2>&1 &
sleep 1
python3 -m http.server 8080 --bind 127.0.0.1 2>&1 | tail -1
kill $!
```

<details>
<summary>Answer</summary>

**Output:**

```text
OSError: [Errno 98] Address already in use
```

The first server already listens on 127.0.0.1:8080, so the second one cannot bind the same address and port.

</details>

### P4. Identify the owner

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ss options

Which command shows the process that listens on TCP port 5432?

- A) `ss -tan | grep 5432`
- B) `sudo ss -ltnp | grep :5432`
- C) `netstat -r`
- D) `ps aux | grep 5432`

<details>
<summary>Answer</summary>

**Answer:** B) `sudo ss -ltnp | grep :5432`

**Explanation:** `-l` listening, `-t` TCP, `-n` numeric, `-p` process. Option A lacks `-p`; `ps` does not know about ports.

</details>

### P5. Failed service

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** systemctl status, exit codes

`systemctl status report.service` shows:

```text
Main PID: 3120 (code=exited, status=203/EXEC)
report.service: Failed at step EXEC spawning /opt/report/run.sh: Permission denied
```

What is wrong, and how do you fix it?

<details>
<summary>Answer</summary>

systemd could not execute `ExecStart`: the script is not executable (or lacks a valid shebang, or sits on a `noexec` mount).

```bash
# Illustrative
ls -l /opt/report/run.sh
sudo chmod 755 /opt/report/run.sh
head -1 /opt/report/run.sh        # must be e.g. #!/bin/bash
sudo systemctl restart report
```

</details>

### P6. Count the errors

**Difficulty:** Easy · **Type:** Command · **Concepts:** grep -c

In the lab, count how many lines of `app.log` contain `ERROR`, and show the last error line.

<details>
<summary>Answer</summary>

```bash
cd ~/linux-lab
grep -c ERROR app.log
grep ERROR app.log | tail -n 1
```

**Output:**

```text
3
2026-01-15 10:30:01 ERROR [payment] Order 1042 payment failed
```

</details>

### P7. Zombie army

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** zombies, parent process

`ps` shows 300 processes in state `Z`, all with PPID 1840 (`worker-manager`). `kill -9` on them does nothing. What do you do?

<details>
<summary>Answer</summary>

Zombies are finished processes waiting for their parent to collect their exit status; they cannot be killed. The bug is in PID 1840, which does not call `wait()`. Restart the parent (preferably via its service: `sudo systemctl restart worker-manager`); systemd then adopts and reaps the zombies. Report the bug to the developers.

</details>

### P8. Slow server investigation

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** structured diagnosis

Users report the API server is very slow right now. Outline your first five minutes of investigation, naming commands.

<details>
<summary>Answer</summary>

1. `uptime` and `nproc` — is the load high relative to CPUs?
2. `top` — CPU hogs (`P`), memory hogs (`M`), `%wa` for I/O wait, swap usage.
3. `free -h` — `available` memory and swap; `journalctl -k --since "1 hour ago" | grep -i oom`.
4. `df -h` — a full disk often causes slowness and errors.
5. `systemctl status api` and `journalctl -u api --since "15 min ago" -p warning` — application errors, timeouts to the database or other dependencies; `ss -s` or `ss -tan | wc -l` for connection floods.

Then act on the evidence (restart a leaking process, stop a runaway job, free disk), and record what you found.

</details>
