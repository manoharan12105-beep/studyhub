# Monitoring Processes — Practice

### P1. Parent IDs

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ps -ef vs ps aux

You need to see each process's parent PID. Which command shows it by default?

- A) `ps aux`
- B) `ps -ef`
- C) `top`
- D) `pidof bash`

<details>
<summary>Answer</summary>

**Answer:** B) `ps -ef`

**Explanation:** `ps -ef` has a PPID column; `ps aux` does not (although `ps -eo pid,ppid,cmd` can add it).

</details>

### P2. Load and cores

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** load average

A server with 4 CPUs shows `load average: 7.80, 6.10, 3.20`. Is it overloaded? Is the load rising or falling?

<details>
<summary>Answer</summary>

Yes: on 4 cores, a load of 7.8 means about twice as many runnable (or I/O-blocked) processes as CPUs, so work is queueing. It is rising — the 1-minute average (7.80) is above the 5- and 15-minute averages.

</details>

### P3. Top memory consumers

**Difficulty:** Easy · **Type:** Command · **Concepts:** ps -o, --sort

Show the five processes using the most resident memory, with PID, user, %MEM and command name.

<details>
<summary>Answer</summary>

```bash
ps -eo pid,user,%mem,rss,comm --sort=-rss | head -n 6
```

`head -n 6` because the first line is the header.

</details>

### P4. Find the right Java

**Difficulty:** Medium · **Type:** Command · **Concepts:** pgrep -f

Three Java services run on the host. Print the PID and full command line of only the one started with `payment-service.jar`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
pgrep -af payment-service.jar
```

`-f` matches the full command line (the process name of all three is just `java`), `-a` prints it.

</details>

### P5. Reading top

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** wa, D state

`top` shows `%Cpu(s): 3.0 us, 2.0 sy, 0.0 ni, 15.0 id, 80.0 wa`. Users complain the application is slow. What is the bottleneck, and what would you check?

<details>
<summary>Answer</summary>

80 % `wa`: the CPUs are mostly idle waiting for I/O, so storage (or network storage) is the bottleneck, not the CPU. Check `iostat -x 1` for device utilisation and latency, `iotop` (or `pidstat -d`) for the process doing the I/O, `dmesg` for disk errors, free space with `df -h`, and whether a backup, log flood or database query is hammering the disk.

</details>

### P6. Count your processes

**Difficulty:** Medium · **Type:** Output · **Concepts:** pgrep -c

What does this print (assuming no other `sleep` processes are running)?

```bash
sleep 100 &
sleep 100 &
sleep 100 &
pgrep -c -x sleep
kill %1 %2 %3
```

<details>
<summary>Answer</summary>

**Output:**

```text
3
```

`-x` requires the whole process name to be exactly `sleep`.

</details>

### P7. Memory panic

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** free vs available

A junior engineer sees `free: 180Mi` and `buff/cache: 9.2Gi`, `available: 10Gi` on a 12 GB machine and wants to restart services to "free memory". What do you explain?

<details>
<summary>Answer</summary>

The system has about 10 GB available. Linux keeps file data in the page cache (`buff/cache`) to speed up disk access and drops it automatically when applications need memory. Restarting services would not help and would cause downtime. Watch `available`, swap activity and OOM-killer messages instead.

</details>

### P8. Polite batch job

**Difficulty:** Hard · **Type:** Command · **Concepts:** nice, renice

Start `./reindex.sh` at the lowest CPU priority, then later lower the priority of an already-running process with PID 5120 to nice 15.

<details>
<summary>Answer</summary>

```bash
# Illustrative
nice -n 19 ./reindex.sh
renice -n 15 -p 5120
```

Ordinary users can only make their own processes **nicer** (higher values); lowering the nice value below 0 requires root.

</details>
