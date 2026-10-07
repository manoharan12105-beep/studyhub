# What Is Deadlock? — Interview Questions

## Beginner

### Q1. What is a deadlock?

**Style:** Direct

<details>
<summary>Answer</summary>

A state in which a set of processes are permanently blocked because each is holding a resource and waiting for another resource held by a different process in the same set. Since every process waits for another, none can continue or release its resources.

</details>

### Q2. Give a simple example of a deadlock.

**Style:** Scenario

<details>
<summary>Answer</summary>

Thread T1 locks mutex A and then tries to lock B; at the same time thread T2 locks B and then tries to lock A. T1 waits for T2 to release B, T2 waits for T1 to release A — both wait forever. Real-world analogy: two cars meeting in the middle of a one-lane bridge.

</details>

### Q3. What are the ways to handle deadlocks?

**Style:** Direct

<details>
<summary>Answer</summary>

1. **Prevention** — ensure at least one of the four necessary conditions can never hold.
2. **Avoidance** — examine each request and grant it only if the system remains in a safe state (Banker's algorithm).
3. **Detection and recovery** — allow deadlocks, detect them periodically, then recover by terminating or rolling back processes or preempting resources.
4. **Ignoring** — assume they are rare and let users restart (the "ostrich algorithm"), which most general-purpose OSes do for application-level locks.

</details>

## Intermediate

### Q4. What is a resource-allocation graph?

**Style:** Direct

<details>
<summary>Answer</summary>

A directed graph with process nodes and resource nodes (each resource showing its number of instances). A request edge P → R means P is waiting for R; an assignment edge R → P means P holds an instance of R. It is used to reason about and detect deadlocks: deadlock requires a cycle.

</details>

### Q5. Does a cycle in the resource-allocation graph always mean deadlock?

**Style:** Trap

<details>
<summary>Answer</summary>

Only if every resource type in the cycle has a single instance. With multiple instances, a cycle means a deadlock is possible but not certain: a process outside the cycle holding an instance may finish, release it, and let a process in the cycle continue. No cycle, however, always means no deadlock.

</details>

### Q6. What is the difference between deadlock and starvation?

**Style:** Comparison

<details>
<summary>Answer</summary>

In deadlock, processes are blocked waiting for each other in a cycle, and none can ever proceed without outside intervention. In starvation, a process is able to proceed but keeps being passed over by the scheduler or allocator (for example a low-priority process). Deadlock involves a group and a circular wait; starvation can affect a single process and is fixed by fairness mechanisms such as aging.

</details>

### Q7. What is livelock?

**Style:** Direct

<details>
<summary>Answer</summary>

A situation where processes are not blocked — they keep running and changing state — but make no progress because each keeps reacting to the other. Example: two threads that each release their lock and retry when they detect a conflict, in perfect lockstep, forever. Randomised back-off breaks the symmetry.

</details>

## Advanced

### Q8. Why do most operating systems ignore deadlocks instead of preventing or avoiding them?

**Style:** Why

<details>
<summary>Answer</summary>

Prevention restricts how programs may use resources and lowers utilisation; avoidance needs every process's maximum resource needs in advance and runs a check on every request, which is expensive and impractical for general programs. Deadlocks in application code are relatively rare, so the cost of handling them everywhere outweighs the benefit. The OS prevents deadlock inside its own kernel (with lock ordering), and leaves application-level deadlocks to programmers — while systems where they are common, like databases, implement detection.

</details>

### Q9. How does a database handle two transactions that update the same rows in opposite order?

**Style:** Scenario

<details>
<summary>Answer</summary>

It uses detection and recovery. When a transaction has waited for a lock longer than a short threshold (PostgreSQL's `deadlock_timeout`, 1 s by default), the database builds a wait-for graph; if it finds a cycle, it aborts one transaction (`ERROR: deadlock detected`) so the others can continue. The application should retry the aborted transaction, and prevent repeats by updating rows in a consistent order.

</details>
