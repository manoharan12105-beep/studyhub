# Monitoring Processes — Interview Questions

## Beginner

### Q1. How do you list all running processes?

<details>
<summary>Answer</summary>

`ps aux` or `ps -ef`. `top` or `htop` show them live. Add `| less` or filter with `pgrep` to find a specific one.

</details>

### Q2. What is the difference between `ps aux` and `ps -ef`?

<details>
<summary>Answer</summary>

Both list every process. `ps aux` (BSD syntax) shows user, PID, %CPU, %MEM, VSZ, RSS, state, start time and command. `ps -ef` (UNIX syntax) shows UID, PID, **PPID**, start time, terminal and full command. Use `aux` for resource usage and `-ef` for parent–child relationships.

</details>

### Q3. How do you find the PID of a process by name?

<details>
<summary>Answer</summary>

`pgrep name` (add `-a` to see the command line, `-f` to match the full command line), or `pidof name`. Avoid `ps aux | grep name`, which also matches the `grep` itself.

</details>

### Q4. How do you see which process is using the most CPU or memory?

<details>
<summary>Answer</summary>

Interactively with `top` (press `P` for CPU, `M` for memory) or `htop`. As a snapshot: `ps -eo pid,user,%cpu,%mem,comm --sort=-%cpu | head` (or `--sort=-%mem`).

</details>

## Intermediate

### Q5. What is load average, and how do you interpret it?

<details>
<summary>Answer</summary>

The average number of processes that are runnable or in uninterruptible sleep (`D`), over the last 1, 5 and 15 minutes. Compare it with the number of CPUs: on 8 cores, a load of 8 means fully used, 16 means processes are queueing. A high load with idle CPUs and high `wa` points to I/O waits rather than CPU pressure. A rising 1-minute value above the 15-minute value means the load is increasing.

</details>

### Q6. In `top`, what do `us`, `sy`, `wa` and `st` mean?

<details>
<summary>Answer</summary>

`us`: CPU time in user-space programs. `sy`: time in the kernel (system calls, drivers). `wa`: CPU idle while waiting for I/O to complete. `st`: steal time — CPU taken by the hypervisor for other virtual machines (a noisy-neighbour sign on cloud VMs).

</details>

### Q7. `free -h` shows only 200 MB free on a 16 GB server. Is it running out of memory?

<details>
<summary>Answer</summary>

Not necessarily. Linux uses otherwise idle RAM as file cache (`buff/cache`) and releases it when applications need memory. Look at the **available** column, swap activity (`vmstat 1` columns `si`/`so`), and the kernel log for OOM-killer messages. Low "free" with high "available" is healthy.

</details>

### Q8. What do VIRT, RES and SHR mean in `top`?

<details>
<summary>Answer</summary>

VIRT is the total virtual memory the process has mapped (including reserved but unused memory, libraries and memory-mapped files). RES (resident) is the part actually in physical RAM. SHR is the part of RES that is shared with other processes (e.g. libraries). RES is the best quick measure of real memory use; a JVM's VIRT is often much larger than its heap.

</details>

### Q9. How do you find all processes run by a particular user?

<details>
<summary>Answer</summary>

`ps -u alice -o pid,%cpu,%mem,cmd`, `pgrep -u alice -a`, or press `u` in `top` and type the name.

</details>

## Advanced

### Q10. Why can a process show more than 100 % CPU in `top`?

<details>
<summary>Answer</summary>

`top`'s per-process `%CPU` is relative to one CPU. A multi-threaded process running on several cores at once can use 250 % (2.5 cores). Press `I` in `top` to switch to "Irix mode off", which divides by the number of CPUs.

</details>

### Q11. Several JVMs run on a server. How do you identify which PID is the `inventory` service and check its memory?

<details>
<summary>Answer</summary>

All show as `java`, so match on the command line: `pgrep -af inventory` reveals the PID and arguments. Then `ps -o pid,rss,vsz,etime,cmd -p <pid>` for memory and uptime, `cat /proc/<pid>/status` (VmRSS, Threads), or `systemctl status inventory` if it is a systemd service (shows the main PID and the cgroup's memory). JDK tools (`jcmd <pid> GC.heap_info`) give heap details.

</details>

### Q12. How do you run a CPU-heavy batch job without slowing down a web server on the same machine?

<details>
<summary>Answer</summary>

Lower its priority: `nice -n 19 ./batch.sh` (or `renice` an existing PID); for I/O, `ionice -c3` (idle class). On systemd systems, run it with resource limits: `systemd-run --scope -p CPUQuota=50% -p MemoryMax=2G ./batch.sh`. Better still, schedule it off-peak or on another host.

</details>
