# Deadlock Prevention — Interview Questions

## Beginner

### Q1. What is deadlock prevention?

**Style:** Direct

<details>
<summary>Answer</summary>

An approach that ensures deadlock can never occur by designing resource-allocation rules so that at least one of the four necessary conditions — mutual exclusion, hold and wait, no preemption, circular wait — can never hold. It works without run-time analysis of requests.

</details>

### Q2. How can each of the four deadlock conditions be prevented?

**Style:** How

<details>
<summary>Answer</summary>

- **Mutual exclusion:** make resources shareable (read-only data, spooling) — rarely possible.
- **Hold and wait:** require processes to request all resources at once, or to release all held resources before requesting new ones.
- **No preemption:** if a request cannot be satisfied, the process releases what it holds (or the OS preempts resources from waiting processes) and retries later.
- **Circular wait:** number all resource types and require requests in increasing order.

</details>

## Intermediate

### Q3. What are the drawbacks of preventing hold and wait?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Resources are allocated long before they are needed, so utilisation is low; a process needing several popular resources may wait indefinitely for all of them to be free at once (starvation); and processes must know their total needs in advance, which is often impossible.

</details>

### Q4. Why does ordering resources prevent circular wait?

**Style:** Why

<details>
<summary>Answer</summary>

If every process requests resources in strictly increasing order, a process waiting for resource j holds only resources numbered below j. In a cycle P0 → P1 → … → Pn → P0, the resource numbers would have to increase all the way around the cycle and come back to the start, which is impossible. So no cycle can form.

</details>

### Q5. How would you prevent deadlock in `transfer(from, to, amount)` when transfers run in both directions concurrently?

**Style:** Design

<details>
<summary>Answer</summary>

Lock the two accounts in a global order that does not depend on the transfer direction — for example always lock the account with the smaller id first, then the other. Both `transfer(x, y)` and `transfer(y, x)` then lock x before y, so one simply waits for the other instead of each holding one lock and waiting for the other. Alternatives: a single global lock (simple, less concurrency) or `tryLock` with timeout and retry.

</details>

### Q6. Why can't preemption be applied to every resource?

**Style:** Why

<details>
<summary>Answer</summary>

Preempting a resource means taking it away and later giving it back as if nothing happened, which requires saving and restoring its state. That is easy for the CPU (registers) and memory (pages to disk), but impossible for a printer halfway through a page, a tape, or a lock protecting a half-updated data structure — preempting those would corrupt output or data unless the whole operation is rolled back.

</details>

## Advanced

### Q7. What is the difference between deadlock prevention and deadlock avoidance?

**Style:** Comparison

<details>
<summary>Answer</summary>

Prevention imposes static rules on how resources may be requested so that one necessary condition is always false — deadlock is structurally impossible, but the rules can limit concurrency. Avoidance does not restrict request patterns; instead, the OS uses advance knowledge of each process's maximum needs and grants a request only if the resulting state is safe (Banker's algorithm). Avoidance allows more concurrency but needs that knowledge and a run-time check on every request.

</details>

### Q8. Can lock ordering be enforced when locks are acquired in different modules written by different teams?

**Style:** Scenario

<details>
<summary>Answer</summary>

Only with discipline and tooling: document a global lock hierarchy (for example: registry lock, then account locks by id, then audit lock), wrap lock acquisition in helpers that check the order, and use tools that detect order violations at run time (the Linux kernel's lockdep does exactly this). Reducing the number of locks a thread holds at once — or using a single coarser lock — makes ordering easier to keep.

</details>
