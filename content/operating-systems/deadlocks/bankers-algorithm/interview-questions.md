# Banker's Algorithm — Interview Questions

## Beginner

### Q1. What is the Banker's algorithm?

**Style:** Direct

<details>
<summary>Answer</summary>

A deadlock-avoidance algorithm for systems with multiple instances of each resource type. Each process declares its maximum need; before granting any request, the OS pretends to allocate it and runs a safety check. The request is granted only if the resulting state is safe — some order exists in which every process can obtain its remaining need and finish. Otherwise the process waits.

</details>

### Q2. What data structures does the Banker's algorithm use?

**Style:** Direct

<details>
<summary>Answer</summary>

For n processes and m resource types: **Available** (m) — free instances; **Max** (n × m) — maximum demand of each process; **Allocation** (n × m) — instances currently held; **Need** (n × m) — remaining possible request, computed as Need = Max − Allocation.

</details>

### Q3. Why is it called the Banker's algorithm?

**Style:** Why

<details>
<summary>Answer</summary>

It models a banker who has given customers credit limits (Max). The banker lends money (resources) only if, after the loan, the cash left is still enough to satisfy the remaining limits of customers in some order, so every customer can eventually be paid in full and repay. It never lets the bank reach a state where it could be unable to satisfy everyone.

</details>

## Intermediate

### Q4. Explain the safety algorithm.

**Style:** How

<details>
<summary>Answer</summary>

Set Work = Available and Finish[i] = false for all i. Repeatedly find a process with Finish[i] = false and Need[i] ≤ Work (component-wise). Pretend it runs to completion: Work = Work + Allocation[i], Finish[i] = true, and add it to the safe sequence. When no such process remains, the state is safe if every Finish[i] is true. Time complexity O(m × n²).

</details>

### Q5. Describe the resource-request algorithm.

**Style:** How

<details>
<summary>Answer</summary>

When process i requests vector Request: (1) if Request > Need[i], raise an error — it exceeded its declared maximum; (2) if Request > Available, the process waits; (3) otherwise pretend to allocate (Available −= Request, Allocation[i] += Request, Need[i] −= Request) and run the safety algorithm. If the new state is safe, grant; if not, restore the old state and make the process wait.

</details>

### Q6. Two resource types. Allocation: P0 (1, 0), P1 (0, 1), P2 (1, 1). Max: P0 (2, 2), P1 (1, 2), P2 (3, 1). Available (1, 1). Is the state safe?

**Style:** Calculation

<details>
<summary>Answer</summary>

Need: P0 (1, 2), P1 (1, 1), P2 (2, 0).
Work (1, 1): P0 (1, 2) no; P1 (1, 1) yes → Work (1, 2); P2 (2, 0) no; P0 (1, 2) yes → Work (2, 2); P2 (2, 0) yes → Work (3, 3).
**Safe**, sequence **⟨P1, P0, P2⟩**. Final Work (3, 3) equals the totals.

</details>

### Q7. When a process finishes in the safety algorithm, why do we add its Allocation (not its Need) to Work?

**Style:** Trap

<details>
<summary>Answer</summary>

Because a finishing process returns what it actually holds. In the safety check we assume it first receives its remaining Need from Work, runs to completion, and then releases everything — its original Allocation plus the Need it just borrowed. The net change to Work is +Allocation[i]: −Need[i] (lent) + Need[i] + Allocation[i] (returned).

</details>

## Advanced

### Q8. Two resource types. Allocation: P0 (1, 0), P1 (1, 1), P2 (0, 1). Max: P0 (3, 2), P1 (2, 3), P2 (2, 2). Available (1, 0). Safe or unsafe? Does unsafe mean deadlocked?

**Style:** Calculation

<details>
<summary>Answer</summary>

Need: P0 (2, 2), P1 (1, 2), P2 (2, 1). With Work (1, 0) no process's need fits — every one needs at least one unit of the second type. **Unsafe.** It is not necessarily a deadlock: if, say, P1 finishes without requesting its full maximum and releases (1, 1), others can proceed. But the OS cannot guarantee it, so the Banker's algorithm would never have allowed this state.

</details>

### Q9. What are the limitations of the Banker's algorithm?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Processes must declare maximum needs in advance, which is rarely possible; the number of processes and resources is assumed fixed; processes must release resources in finite time; every request costs an O(m × n²) safety check; and it is conservative — it can refuse requests that would never actually have led to deadlock, lowering utilisation. For these reasons general-purpose OSes do not use it.

</details>
