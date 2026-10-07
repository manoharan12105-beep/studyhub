# The CAP Theorem

**Module:** Consistency and Coordination · **Interview priority:** Core

## What Is It?

The **CAP theorem** is about a **distributed data system** — data replicated on several nodes that talk over a network. It considers three properties:

- **Consistency (C):** every read returns the most recent successful write (or an error). Formally this is **linearizability**: the system behaves as if there were a single copy of the data. This is *not* the "C" in ACID.
- **Availability (A):** every request sent to a non-failed node receives a non-error response — without the guarantee that it contains the latest write.
- **Partition tolerance (P):** the system keeps operating even when the network between nodes drops or delays messages, splitting nodes into groups that cannot communicate — a **network partition**.

The theorem: **when a network partition happens, a distributed system must choose between consistency and availability.** It cannot give every client both an always-successful answer and the latest data while its nodes cannot talk to each other.

## Why It Exists

Networks fail: cables are cut, switches misbehave, a region loses connectivity, a node pauses for a long garbage collection and looks dead. In any system spread over a network, partitions are not optional — they will happen. So the real question is not "which two of three?" but **"what does the system do during a partition?"**

## How It Works

### A partition, step by step

```text
Normal:      Client ──► Node 1 (balance = 100) ◄──replication──► Node 2 (balance = 100)

Partition:   Node 1  ✕✕✕ network split ✕✕✕  Node 2
             Alice withdraws 80 via Node 1 → Node 1 balance = 20 (Node 2 cannot hear about it)
             Bob asks Node 2 for the balance. What should Node 2 answer?
```

Node 2 has two choices:

- **Choose consistency (CP):** refuse — return an error or time out ("try again later") — because it cannot confirm it has the latest value. The answer is never wrong, but Node 2 is unavailable.
- **Choose availability (AP):** answer "100" — the last value it knows. Node 2 stays available, but the answer is stale; after the partition heals, the nodes reconcile (and may have to resolve conflicting writes).

There is no third option that is both always available and always current while the nodes cannot communicate.

### CP vs AP in practice

| | CP (consistency during partitions) | AP (availability during partitions) |
|---|-----------------------------------|-------------------------------------|
| During a partition | Some requests fail or wait | All non-failed nodes answer, possibly stale |
| After the partition | Nothing to reconcile | Replicas reconcile; concurrent writes may conflict |
| Good for | Balances, inventory decrements, seat booking, locks, leader election, configuration | Social feeds, likes, view counts, shopping-cart contents, DNS, product catalogues |
| Examples | Systems built on consensus (etcd, ZooKeeper), relational primaries that reject writes without a quorum, HBase | Cassandra and Dynamo-style stores at low consistency levels, DNS, CDN caches |

Many databases are **tunable**: Cassandra with `ONE` behaves AP; with `QUORUM` reads and writes it refuses requests that cannot reach a quorum, behaving more like CP for those operations. Real systems also choose **per feature**: a shop can be AP for browsing and CP for payment.

### Why "pick two" is misleading

The popular "choose any two of C, A and P" suggests three equal options, including **CA**. But a system that spans a network cannot opt out of partitions. A **CA** system is really a **single-node** (or single-site, partition-free) system: it is consistent and available only because it is not distributed. Once data is replicated across machines, P is a fact of life, and the choice is **C or A when a partition occurs**.

It is also binary only in theory: when there is **no** partition, a well-built system provides both consistency and availability. The trade-off that applies all the time is latency — see PACELC below.

### PACELC: the trade-off outside partitions

**PACELC** extends CAP: if there is a **P**artition, choose **A** or **C**; **E**lse (normal operation), choose **L**atency or **C**onsistency. Even without failures, strong consistency means waiting for replicas (often across zones or regions), which costs latency. DynamoDB-style systems are PA/EL (available and low-latency, eventually consistent); traditional consensus-backed stores are PC/EC.

**Think about it:** during a partition, an AP social network lets two users like the same post on different sides of the split. What happens when the partition heals?

<details>
<summary>Answer</summary>

Both sides accepted writes, so the replicas must reconcile. For likes this is easy if they are modelled as a set of (user, post) pairs or a counter CRDT: the union contains both likes and the count is correct. For data that cannot be merged (two different edits of one field), a conflict-resolution rule such as last-write-wins or a user prompt is needed. AP systems must design for this reconciliation.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "CAP means pick any two of three." Partitions are unavoidable in distributed systems; CAP says that **during a partition** you must give up either consistency or availability. CA only describes a non-distributed system.

- **"CAP is about capacity."** The C is consistency (linearizability).
- **"P means partitioning (sharding) data."** P is tolerance of **network partitions** — nodes losing contact — not data sharding.
- **"An AP system is never consistent."** It is consistent eventually, and often immediately when there is no partition.

## Interview Follow-up

- *"Instagram or a bank: CP or AP?"* Instagram's feed and likes: AP — showing a post a second late is fine; refusing to load the feed is not. A bank's balance check and transfer: CP — refusing temporarily is better than letting someone spend money twice.

## Key Takeaways

- CAP applies to replicated data over a network: Consistency (latest write), Availability (every request answered), Partition tolerance.
- Partitions will happen; during one, choose C (refuse or wait) or A (answer, possibly stale).
- "CA" just means not distributed. Choose CP or AP per feature, based on the cost of a wrong answer vs no answer.
- PACELC adds the everyday trade-off: latency vs consistency when there is no partition.
