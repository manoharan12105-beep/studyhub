# Deadlock Detection and Recovery

**Module:** Deadlocks · **Interview priority:** Frequently asked

## Concept

Instead of preventing or avoiding deadlocks, the system **allows** them to happen, **detects** them by examining who waits for whom, and then **recovers** by terminating processes or taking resources away.

## Why It Matters

Detection gives the highest resource utilisation — no restrictive rules, no advance knowledge — and is what databases actually do. Interviews ask how detection works for single and multiple instances, how often to run it, and how to choose a victim.

## How It Works

### Single instance of each resource: wait-for graph

Collapse the resource-allocation graph: draw an edge **Pi → Pj** if Pi is waiting for a resource held by Pj. A deadlock exists **if and only if the wait-for graph has a cycle**. Cycle detection costs O(n²) for n processes.

```text
 RAG:  P1 → R1 → P2 → R2 → P3 → R3 → P1
 Wait-for graph:  P1 → P2 → P3 → P1     cycle ⇒ deadlock
```

### Multiple instances: detection algorithm

Like the Banker's safety algorithm, but it uses the **current Request** of each process instead of Need (no maximum claims are required):

```pseudocode
Work = Available
Finish[i] = (Allocation[i] == 0)      // a process holding nothing cannot be in a deadlock
repeat:
    find i with Finish[i] == false and Request[i] ≤ Work
    if found: Work = Work + Allocation[i]; Finish[i] = true
until none found
every i with Finish[i] == false is deadlocked
```

It is optimistic: it assumes a process whose request can be met will finish and release everything. If that process later requests more, the next detection run will catch any deadlock.

### When to run detection

- **On every request that cannot be granted immediately** — catches deadlocks at once and identifies the culprit, but is expensive.
- **Periodically** (for example every few minutes) or **when CPU utilisation drops** sharply (a symptom of many blocked processes) — cheaper, but deadlocks persist until the next run and the cause is harder to pin down.

### Recovery option 1: terminate processes

- **Abort all deadlocked processes** — simple and certain, but all their work is lost.
- **Abort one at a time** until the cycle is gone — less loss, but detection must run after each abort.

Choosing the **victim**: lowest priority, least work done (or least remaining), fewest resources held, fewest needed to finish, interactive vs batch (prefer to keep interactive).

### Recovery option 2: preempt resources

Take resources from some processes and give them to others:

1. **Select a victim** — minimise cost (resources held, time consumed).
2. **Rollback** — return the victim to a safe earlier state (a checkpoint) or restart it completely.
3. **Avoid starvation** — the same process must not be chosen every time; count rollbacks in the cost.

Databases recover exactly this way: abort (roll back) one transaction, release its locks, and let the application retry.

## Example

Three resource types, all instances currently allocated (Available = (0, 0, 0)).

| Process | Allocation (A B C) | Request (A B C) |
|---------|--------------------|-----------------|
| P0 | 1 0 1 | 0 1 0 |
| P1 | 0 1 0 | 1 0 0 |
| P2 | 1 1 0 | 0 0 1 |
| P3 | 0 0 1 | 0 0 0 |

Detection: P0, P1, P2 cannot be satisfied with Work (0,0,0). **P3** requests nothing → finishes → Work (0, 0, 1). **P2** (0,0,1) ≤ (0,0,1) → Work (1, 1, 1). **P0** (0,1,0) → Work (2, 1, 2). **P1** (1,0,0) → Work (2, 2, 2). All finish: **no deadlock**.

Now P3 also requests (1, 0, 0) — one A. With Work (0, 0, 0), **no** request can be satisfied: P0 waits for B, P1, P2 and P3 for A or C, all held inside the group. **P0, P1, P2 and P3 are deadlocked.** Recovery: abort the cheapest victim, say P3 (lowest priority, least work); its C returns to Available (0, 0, 1), P2 can finish, and the rest follow.

## Comparison

| | Avoidance (Banker's) | Detection |
|---|----------------------|-----------|
| Matrix used | Need = Max − Allocation | Current Request |
| Advance knowledge | Maximum claims required | None |
| Question answered | "Could this request ever lead to deadlock?" | "Is there a deadlock right now?" |
| When it runs | Every request | On blocked requests or periodically |
| Deadlocks occur? | Never | Yes, then recovered |

## Important Points

- Single instance → wait-for graph; deadlock ⇔ cycle.
- Multiple instances → detection algorithm with the Request matrix; unfinished processes are deadlocked.
- Run detection on blocked requests (precise, costly) or periodically (cheap, delayed).
- Recovery: terminate (all or one at a time) or preempt with rollback; choose victims by cost and avoid starving the same victim.
- Databases detect deadlocks and abort one transaction.

## Common Confusion

> [!WARNING]
> **Using Need in the detection algorithm.** Detection uses what each process is **requesting now**, not its maximum remaining need. Using Need answers the avoidance question ("is the state safe?"), not "is there a deadlock?".

- **Aborting a process does not undo its effects automatically.** Files written or messages sent before the abort may need cleanup; this is why databases use transactions and rollback.

## Interview Perspective

- *"How does an OS detect deadlock?"* — wait-for graph for single instances, detection algorithm for multiple.
- *"How do you recover from deadlock?"* — termination vs preemption; victim selection; rollback; starvation.
- *"How often should detection run?"* — trade-off between cost and how long deadlocks persist.
- *"How do databases handle deadlocks?"* — detect via wait-for graph, abort a victim transaction, client retries.

## Quick Revision

- Wait-for graph: Pi → Pj; cycle ⇔ deadlock (single instances).
- Detection algorithm: like safety, but with Request; leftovers are deadlocked.
- Run on blocked requests or periodically.
- Recover: kill all / one by one, or preempt + rollback; pick cheap victims; avoid starving one.
