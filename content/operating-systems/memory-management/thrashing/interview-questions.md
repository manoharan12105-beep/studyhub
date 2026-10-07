# Thrashing — Interview Questions

## Beginner

### Q1. What is thrashing?

**Style:** Direct

<details>
<summary>Answer</summary>

A condition in which the system spends more time paging — swapping pages between memory and disk — than executing processes. Processes have fewer frames than the pages they actively use, so they fault continuously; each fault evicts a page that will be needed again soon. Throughput collapses and CPU utilisation drops.

</details>

### Q2. What causes thrashing?

**Style:** Why

<details>
<summary>Answer</summary>

Over-commitment of memory: the sum of the working sets of the running processes exceeds the available physical frames. This usually happens when the degree of multiprogramming is too high, or when one process suddenly needs much more memory. With global replacement, processes steal frames from each other, spreading the faults.

</details>

### Q3. What are the symptoms of thrashing?

**Style:** Debugging

<details>
<summary>Answer</summary>

Very high page-fault rate, constant disk or swap I/O, low CPU utilisation (much of it shown as I/O wait), very long response times and a system that barely responds to input. Tools such as `vmstat` on Linux show high swap-in/swap-out (si/so) values.

</details>

## Intermediate

### Q4. Why does CPU utilisation drop during thrashing, and why does adding processes make it worse?

**Style:** Why

<details>
<summary>Answer</summary>

Processes spend most of their time blocked, waiting for page reads from disk, so the CPU has nothing to run. A naive scheduler sees low CPU utilisation and admits more processes to use the idle CPU; each new process takes frames from the others, increasing everyone's fault rate — a vicious circle.

</details>

### Q5. Explain the working-set model.

**Style:** How

<details>
<summary>Answer</summary>

The working set of a process at time t is the set of distinct pages it referenced in the last Δ references (the working-set window). Its size, WSS, estimates how many frames the process needs for its current locality. The OS sums D = Σ WSS over all processes; if D exceeds the number of frames, it suspends a process to prevent thrashing; if D is well below, it can admit another. Δ must be large enough to cover a locality but not several.

</details>

### Q6. Reference string `1 2 1 3 4 4 3 2 5 5` and Δ = 4. What is the working set at time 6 and time 10?

**Style:** Calculation

<details>
<summary>Answer</summary>

At t = 6, the last four references are 1 3 4 4 → WS = **{1, 3, 4}**, WSS = 3. At t = 10, they are 3 2 5 5 → WS = **{2, 3, 5}**, WSS = 3.

</details>

### Q7. What is the page-fault-frequency (PFF) scheme?

**Style:** Direct

<details>
<summary>Answer</summary>

A thrashing-control method that monitors each process's page-fault rate. If the rate exceeds an upper threshold, the process gets an additional frame; if it falls below a lower threshold, a frame is taken away. If a process needs frames and none are free, a process is suspended. It controls thrashing directly, without tracking working sets.

</details>

## Advanced

### Q8. How does local versus global page replacement affect thrashing?

**Style:** Trade-off

<details>
<summary>Answer</summary>

With **global** replacement a process may take frames from any process, so one memory-hungry process can push others into thrashing. With **local** replacement each process replaces only its own pages, so a thrashing process cannot steal frames from others — but it still thrashes itself, and its disk traffic slows everyone's page-ins. Local replacement limits the spread; only giving processes enough frames (or running fewer of them) cures it.

</details>

### Q9. A server slows to a crawl every afternoon; CPU shows 5 % user time and 80 % I/O wait, and swap activity is high. What would you do?

**Style:** Scenario

<details>
<summary>Answer</summary>

It is thrashing. Identify the processes with the largest resident and swap usage (and whether something — a cron job, a cache, a memory leak — grows in the afternoon). Short term: stop or reschedule the extra workload, or restart the leaking process. Long term: limit memory per service (heap sizes, container limits), fix the leak or the access pattern, run fewer workloads on the host, or add RAM.

</details>
