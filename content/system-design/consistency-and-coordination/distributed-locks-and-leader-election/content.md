# Distributed Locks and Leader Election

**Module:** Consistency and Coordination · **Interview priority:** Awareness

> [!NOTE]
> **Awareness topic.** Interviews expect you to know when these are needed and their pitfalls, not to implement consensus. Learn [Consistency Models](../consistency-models/content.md) first.

## What Is It?

- A **distributed lock** ensures that only one process, across many machines, does something at a time: run tonight's billing job, process one order, rebuild one cache key.
- **Leader election** chooses one node among several to act as the leader — the database primary, the scheduler that assigns work, the partition owner — and picks a new one when it fails.

Both are the same core problem: **getting several machines to agree that exactly one of them holds a role**, even when machines crash and networks partition.

## Why It Exists

With stateless, horizontally scaled services, every instance runs the same code. Without coordination, a cron job runs once per instance, two workers process the same payment, and two database nodes both accept writes as "primary" (split brain).

## How It Works

### Locks are leases, not forever

A lock held by a process that then crashes would block everyone forever, so distributed locks are **leases** with an expiry: "worker 7 holds `lock:billing` for 30 seconds". The holder must finish or renew before expiry; if it dies, the lease expires and someone else can take it.

```text
SET lock:billing worker-7 NX PX 30000     # Redis: set only if absent, expire in 30 s → "OK" or nil
... do the work, renewing if needed ...
release only if the value is still worker-7 (check-and-delete atomically, e.g. a Lua script)
```

### The pause problem and fencing tokens

Leases expire based on time, and a process can pause unexpectedly (a long garbage collection, a VM freeze, a slow network) **without knowing**:

```text
Worker A takes the lease (token 33) → A pauses for 40 s → lease expires
Worker B takes the lease (token 34) → B writes to storage
Worker A wakes up, still believes it holds the lock → A writes to storage → corruption
```

The fix is a **fencing token**: a number that increases every time the lock is granted. Every write to the protected resource carries the token, and the resource **rejects tokens lower than the highest it has seen** (A's 33 is rejected after B's 34). A lock alone cannot be fully safe; the resource must check.

### Where locks and elections should come from

| Option | Notes |
|--------|-------|
| **Consensus systems** — etcd, ZooKeeper, Consul | Built on Raft/Zab: a majority must agree, leases with sessions, monotonically increasing revision numbers usable as fencing tokens. The right tool for leader election and correctness-critical locks |
| **Database** | Row locks, `SELECT … FOR UPDATE SKIP LOCKED` for job queues, PostgreSQL advisory locks — simple when everything already uses one database |
| **Redis** | Fast and convenient (`SET NX PX`) for **efficiency** locks (avoid duplicate work where an occasional duplicate is harmless). With asynchronous replication, a failover can lose a lock, so it is not suitable alone for correctness-critical mutual exclusion |
| **Platform features** | Kubernetes leases, managed scheduler singletons |

### Leader election

Candidates try to acquire a lease on a well-known key in a consensus store; the winner becomes leader and renews the lease; followers watch the key and campaign when it disappears. Consensus requires a **majority**, so a cluster of 3 tolerates 1 failure and a cluster of 5 tolerates 2 — and a minority side of a partition cannot elect a leader, which prevents two leaders at once (split brain).

**Think about it:** do you need a distributed lock to ensure each order is processed only once by a pool of queue consumers?

<details>
<summary>Answer</summary>

Usually not. Better: make processing **idempotent** (record processed order IDs with a unique constraint) and let the queue deliver each message to one consumer at a time (visibility timeouts, partition ownership). Locks add latency and new failure modes; idempotency handles duplicates that occur anyway ([Idempotency](../../reliability/idempotency-in-distributed-systems/content.md)).

</details>

## When Not to Use

Avoid distributed locks on hot request paths and wherever idempotency, unique constraints, conditional writes (compare-and-set) or single-partition ownership solve the problem. Every lock is a potential bottleneck and source of stalls.

## Common Traps

> [!WARNING]
> **Common trap:** "A Redis lock with an expiry guarantees mutual exclusion." Process pauses, clock issues and failover can let two holders act at once. Use fencing tokens at the resource, or a consensus-based system for correctness-critical cases.

## Interview Follow-up

- *"How do you make sure a scheduled job runs once across 10 instances?"* A lease-based lock or leader election in a consensus store (or a single scheduler), plus an idempotent job so an accidental second run is harmless.

## Key Takeaways

- Distributed locks and leader election make exactly one process or node hold a role across machines.
- Locks are leases that expire; paused holders can outlive their lease, so protect resources with fencing tokens.
- Use consensus systems (etcd, ZooKeeper) for leader election and correctness; Redis locks for efficiency only.
- Prefer idempotency, conditional writes and partition ownership over locks where possible.
