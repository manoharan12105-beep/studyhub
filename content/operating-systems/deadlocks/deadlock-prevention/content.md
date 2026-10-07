# Deadlock Prevention

**Module:** Deadlocks · **Interview priority:** Core

## Concept

**Deadlock prevention** designs the system so that **at least one of the [four necessary conditions](../deadlock-conditions/content.md) can never hold**. If one condition is impossible, deadlock is impossible — no run-time checks are needed.

## Why It Matters

Prevention is the approach programmers actually use: lock ordering, acquiring everything at once, and timeouts are everyday techniques in Java, database and kernel code. Each technique has a cost, and interviewers want both the technique and its downside.

## How It Works

### 1. Break mutual exclusion

Make resources **shareable** where possible:

- Read-only files and immutable data can be read by everyone at once.
- **Spooling**: processes write print jobs to disk; only a single printer daemon talks to the printer.

**Limit:** most resources (mutexes, writable records) are exclusive by nature, so this rarely applies.

### 2. Break hold and wait

Ensure a process never holds one resource while waiting for another:

- **All at once:** request every resource the process will need before it starts (or before a phase), and get either all or none.
- **Release before request:** a process may request new resources only when it holds none.

**Costs:** low resource utilisation (resources are held long before they are used), possible **starvation** of a process that needs many popular resources, and processes must know their needs in advance.

### 3. Break no preemption

Allow resources to be taken away:

- If a process holding resources requests one that is not available, it **releases everything it holds** and restarts the request later.
- Or the OS preempts the wanted resource from a process that is itself waiting.

**Limit:** works only for resources whose state can be saved and restored — CPU registers, memory pages — not for a half-printed page or a half-written record. In code: `tryLock` with timeout, then release and retry.

### 4. Break circular wait

Impose a **total order** on resource types and require every process to request resources in **increasing order**.

```text
 Number every resource:  disk = 1, printer = 2, scanner = 3
 Rule: a process holding resource k may request only resources numbered > k.
```

Why it works: a cycle P0 → P1 → … → P0 would need some process to wait for a lower-numbered resource while holding a higher one — forbidden by the rule.

This is the most practical technique: "always lock accounts in increasing id order", "always lock the parent before the child", the Linux kernel's documented lock ordering.

## Example

Bank transfers run in both directions at once. Locking `from` then `to` can deadlock (x → y and y → x). Locking the **smaller id first** breaks circular wait:

```java
public class LockOrderingDemo {

    static final class Account {
        final int id;
        int balance;

        Account(int id, int balance) {
            this.id = id;
            this.balance = balance;
        }
    }

    static void transfer(Account from, Account to, int amount) {
        Account first = from.id < to.id ? from : to;    // global order: smaller id first
        Account second = from.id < to.id ? to : from;
        synchronized (first) {
            synchronized (second) {
                from.balance -= amount;
                to.balance += amount;
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Account x = new Account(1, 1_000);
        Account y = new Account(2, 1_000);
        Thread forward = new Thread(() -> {
            for (int i = 0; i < 10_000; i++) {
                transfer(x, y, 1);
            }
        });
        Thread backward = new Thread(() -> {
            for (int i = 0; i < 10_000; i++) {
                transfer(y, x, 1);
            }
        });
        forward.start();
        backward.start();
        forward.join();
        backward.join();
        System.out.println("Finished without deadlock: x = " + x.balance + ", y = " + y.balance);
    }
}
```

**Output:**

```text
Finished without deadlock: x = 1000, y = 1000
```

Both threads always lock account 1 before account 2, so neither can hold 2 while waiting for 1. With `synchronized (from) { synchronized (to) { … } }` instead, this program can hang forever.

## Comparison

| Condition broken | Technique | Main cost |
|------------------|-----------|-----------|
| Mutual exclusion | Share resources, spooling | Rarely possible |
| Hold and wait | Request all at once / release before requesting | Low utilisation, starvation, needs advance knowledge |
| No preemption | Release on failure, preempt from waiters | Only for saveable resources; wasted work |
| Circular wait | Global resource ordering | Must define and follow the order everywhere |

Prevention vs [avoidance](../deadlock-avoidance/content.md): prevention fixes the **rules** in advance so deadlock can never happen; avoidance keeps normal rules but **checks each request** at run time.

## Important Points

- Prevention = make one Coffman condition impossible.
- Mutual exclusion usually cannot be removed.
- Hold and wait → all-or-nothing requests (wasteful).
- No preemption → release and retry (only for saveable state).
- Circular wait → global ordering: the practical favourite.
- Prevention is conservative: it can reduce concurrency and utilisation.

## Common Confusion

> [!WARNING]
> **Mixing prevention and avoidance.** Prevention restricts *how* requests can be made (static rules). Avoidance allows any request pattern but refuses a request at run time if it would lead to an unsafe state (Banker's algorithm).

- **Lock ordering must be global.** If one code path locks B then A "just this once", the guarantee is gone.

## Interview Perspective

- *"How can deadlocks be prevented?"* — one technique per condition, with its cost.
- *"How would you avoid deadlock in a money-transfer method?"* — lock by account id order.
- *"Why is breaking hold and wait inefficient?"* — resources sit idle while held; starvation.

## Quick Revision

- Break one condition → no deadlock.
- ME: share/spool. H&W: all at once. NP: release and retry. CW: global order.
- Lock ordering by id is the everyday fix.
- Prevention = static rules; avoidance = run-time checks.
