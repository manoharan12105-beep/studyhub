# Deadlock Detection and Recovery — Interview Questions

## Beginner

### Q1. How can an OS detect deadlock when each resource has a single instance?

**Style:** How

<details>
<summary>Answer</summary>

Maintain a **wait-for graph**: a node per process and an edge Pi → Pj when Pi waits for a resource held by Pj (obtained by collapsing the resource nodes out of the resource-allocation graph). Periodically search it for cycles; a cycle means the processes on it are deadlocked. Cycle detection takes O(n²) for n processes.

</details>

### Q2. What are the ways to recover from a deadlock?

**Style:** Direct

<details>
<summary>Answer</summary>

**Process termination:** abort all deadlocked processes, or abort them one at a time until the cycle disappears. **Resource preemption:** take resources away from selected victim processes, roll the victims back to a safe earlier state (or restart them) and give the resources to others.

</details>

## Intermediate

### Q3. How does the detection algorithm for multiple instances differ from the Banker's safety algorithm?

**Style:** Comparison

<details>
<summary>Answer</summary>

It uses each process's **current request** instead of Need (Max − Allocation), so it needs no advance maximum claims. It also marks processes holding no resources as finished from the start. A process left unfinished at the end is deadlocked. The safety algorithm asks "can everyone finish even in the worst case?"; detection asks "is anyone stuck right now?".

</details>

### Q4. How do you choose a victim process when recovering from deadlock?

**Style:** How

<details>
<summary>Answer</summary>

Minimise the cost of aborting or rolling back: prefer the lowest-priority process, the one that has done the least work (or has the most left), holds the fewest resources, needs the fewest resources to complete, or is a batch rather than an interactive process. Also count how many times a process has already been a victim, so the same one is not chosen every time (starvation).

</details>

### Q5. How often should deadlock detection run?

**Style:** Trade-off

<details>
<summary>Answer</summary>

It depends on how often deadlocks occur and how many processes they affect. Running it on every request that cannot be granted immediately finds deadlocks at once and identifies the process that closed the cycle, but costs a lot of CPU. Running it periodically (say every few minutes) or when CPU utilisation drops is cheap, but deadlocked processes stay stuck until the next run, and the cycle may have grown.

</details>

### Q6. Allocation: P0 (1, 0), P1 (0, 1), P2 (1, 0), P3 (0, 1). Request: P0 (0, 1), P1 (1, 0), P2 (0, 0), P3 (0, 0). Available (0, 0). Is there a deadlock?

**Style:** Calculation

<details>
<summary>Answer</summary>

Work (0, 0). P2 and P3 request nothing: P2 finishes → Work (1, 0); P3 finishes → Work (1, 1). Now P0 (0, 1) ≤ (1, 1) → Work (2, 1); P1 (1, 0) → Work (2, 2). **No deadlock** — P0 and P1 wait only temporarily for resources P2 and P3 will release.

</details>

## Advanced

### Q7. What issues arise with resource preemption as a recovery method?

**Style:** Follow-up

<details>
<summary>Answer</summary>

(1) **Victim selection** — which resources and processes to preempt at least cost. (2) **Rollback** — the victim cannot simply continue without the resource; it must return to a safe state, which requires checkpoints, or be restarted from scratch (total rollback). (3) **Starvation** — if cost is the only criterion, the same process may be preempted repeatedly; include the number of rollbacks in the cost.

</details>

### Q8. Why is detection and recovery the standard approach in databases but not for general OS resources?

**Style:** Why

<details>
<summary>Answer</summary>

Databases already have transactions: aborting a victim rolls back its changes cleanly, releases its locks, and the application can retry — recovery is cheap and safe, and deadlocks between transactions are common enough to need handling. Ordinary processes have no built-in rollback: killing one may leave files half-written and work lost, so OSes mostly rely on programmers to prevent deadlocks in their own code.

</details>
