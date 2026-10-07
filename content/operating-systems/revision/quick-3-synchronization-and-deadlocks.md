# Block 3: Synchronization and Deadlocks

Block 3 of 5, about ten minutes.

## 1. Races and Critical Sections (2 min)

- Race: shared data + concurrent access + a write + no sync. `count++` = load, add, store → lost updates. Check-then-act is a race too.
- Critical section: entry → CS → exit → remainder.
- Requirements: **mutual exclusion · progress · bounded waiting**.
- Peterson: `flag[i] = true; turn = j; while (flag[j] && turn == j);` Hardware: test-and-set, CAS.

## 2. Mutex and Semaphore (3 min)

```text
Mutex      lock/unlock, OWNER unlocks, one holder, reentrant variants
Semaphore  wait(P): S−−, block if none · signal(V): S++, wake one · NO owner
           counting (N resources) · binary (0/1) · init 0 = "wait for event"
```

- Binary semaphore ≠ mutex (no owner, no reentrancy, no priority inheritance).
- Producer–consumer: `empty = N`, `full = 0`, `mutex = 1`; wait(empty/full) **before** wait(mutex).
- S = 10, 6 waits, 4 signals → **8**.

## 3. Deadlock (3 min)

- Deadlock = each process in a set waits for a resource held by another in the set.
- **Mutual exclusion · hold and wait · no preemption · circular wait** — all four necessary.
- RAG cycle: deadlock if single instances; maybe if multiple.
- Prevention: break one condition — **global lock order** is the practical one.
- Avoidance: grant only if **safe**; unsafe ≠ deadlock. Detection: wait-for graph / Request matrix. Recovery: kill or preempt + rollback.

## 4. Banker's Drill (2 min)

One resource, 10 units. Max: P0 7, P1 4, P2 6. Allocated: P0 3, P1 2, P2 2. Safe? Grant P2 two more units?

<details>
<summary>Answer</summary>

Available 3; Need 4, 2, 4. P1 → 5, P2 → 7, P0 → 10: **safe** ⟨P1, P2, P0⟩.
P2 +2 → Available 1, Needs 4, 2, 2 → nobody fits → **unsafe → wait**.

</details>
