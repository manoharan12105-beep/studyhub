# Strong vs Eventual Consistency

**Module:** Consistency and Coordination · **Interview priority:** Core

## What Is It?

A **consistency model** is the contract a replicated system offers about what reads can return after writes. The two ends of the spectrum:

- **Strong consistency (linearizability):** once a write completes, every later read — from any client, any replica — returns that write or a newer one. The system behaves as if there were one copy.
- **Eventual consistency:** if no new writes arrive, all replicas eventually converge to the same value; in the meantime, reads may return stale or out-of-order data.

Between them sit useful **session guarantees** that fix the anomalies users actually notice.

## Why It Exists

Strong consistency requires coordination — waiting for a leader or a quorum, sometimes across regions — which costs latency and, during partitions, availability ([CAP](../cap-theorem/content.md)). Eventual consistency is fast and available but can surprise users. Knowing the in-between models lets you buy exactly the guarantee each feature needs.

## How It Works

### The models, strongest to weakest

| Model | Guarantee | Example of what it prevents |
|-------|-----------|-----------------------------|
| **Linearizable (strong)** | Reads see the latest completed write, globally, in real-time order | Two people both booking the last seat |
| **Sequential** | All clients see operations in the same order (not necessarily real-time) | Clients disagreeing about the order of events |
| **Causal** | Operations that are causally related are seen in order by everyone; unrelated ones may differ | A reply appearing before the question |
| **Read-your-writes** | A client always sees its own earlier writes | My comment disappearing after I post it |
| **Monotonic reads** | A client never sees older data after seeing newer data | A count going 12 → 10 on refresh |
| **Eventual** | Replicas converge if writes stop | — (only convergence) |

The middle three are often called **session guarantees**: they hold per client session and are cheap to provide (route a user's reads to the primary after their writes, or pin a user to one replica).

### Choosing per feature

| Feature | Model | Why |
|---------|-------|-----|
| Account balance before a withdrawal, seat booking, inventory decrement, unique usernames | Strong | A stale read causes a wrong, costly decision |
| My profile edits, my posts | Read-your-writes | Users must see their own changes; others can lag |
| Comment threads, chat | Causal (at least per conversation) | Replies must follow what they reply to |
| Like counts, view counts, follower counts, feeds, recommendations | Eventual | Seconds of staleness are invisible to users |

### How systems provide strong consistency

- A **single leader** serving reads and writes for each item (reads from the primary, or from replicas only after confirming they are up to date).
- **Consensus** protocols (Raft, Paxos) that commit each write on a majority before acknowledging — used by etcd, ZooKeeper, CockroachDB, Spanner.
- **Quorums** with W + R > N (close to strong, with edge cases — see [Quorum Reads and Writes](../../scaling-and-distribution/quorum-reads-and-writes/content.md)).

Each costs at least one round trip to a leader or majority on every strong operation.

### Eventual consistency done well

- Bound staleness (replication lag alerts, TTLs) and tell users when something is "processing".
- Use data types that merge cleanly (sets, counters, CRDTs) so convergence does not lose writes.
- Add session guarantees where users would notice.
- Enforce invariants at a single strongly consistent point (the checkout, the payment) even if browsing is eventual.

**Think about it:** a user changes their password, then logs in from another device a second later. Which consistency guarantee does this need?

<details>
<summary>Answer</summary>

Strong consistency for credential checks (or at least that the login reads from the primary/leader). Read-your-writes is not enough because the second device is a different session. If an old password still works for seconds after a change — especially after a suspected compromise — that is a security problem.

</details>

## Comparison

| | Strong | Eventual |
|---|--------|----------|
| Read returns | The latest write | Possibly stale |
| Latency | Higher (coordination) | Lower |
| Availability during partitions | Lower (CP) | Higher (AP) |
| Developer effort | Simpler reasoning | Must handle stale reads and conflicts |
| Typical uses | Money, inventory, locks, identity | Feeds, counters, caches, analytics, search indexes |

## Common Traps

> [!WARNING]
> **Common trap:** "Eventual consistency means data might be lost." It means reads may be stale for a while; with proper conflict handling, all acknowledged writes are preserved and replicas converge.

## Interview Follow-up

- *"Where would you accept eventual consistency in your design?"* Name specific features (likes, feeds, search index, view counts) and where you insist on strong consistency (payments, stock, unique constraints), with the mechanism for each.

## Key Takeaways

- Strong (linearizable): reads always see the latest write; costs latency and availability.
- Eventual: replicas converge; reads can be stale; fast and available.
- Session guarantees — read-your-writes, monotonic reads, causal — fix most user-visible anomalies cheaply.
- Choose per feature: strong where a stale read causes a wrong decision, eventual where it does not.
