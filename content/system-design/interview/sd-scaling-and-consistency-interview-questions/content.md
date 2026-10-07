# Interview Questions: Scaling and Consistency

**Module:** Interview Preparation · **Interview priority:** Core

## What Is It?

A mixed [question bank](interview-questions.md) covering the Scaling and Distribution and Consistency and Coordination modules: load balancing, replication and lag, multi-leader and leaderless stores, quorums, sharding, hot partitions, consistent hashing, capacity planning, CAP, consistency models, locks, leader election and distributed transactions.

## Why It Matters

These are the questions that separate memorised definitions from understanding: interviewers probe what happens **during failures** — a lagging replica, a network partition, a hot shard, a paused lock holder — and expect precise language (CAP's consistency is not ACID's; quorums need W + R > N).

## Core Concept

### Questions to ask yourself for any distributed component

1. How many copies, and who accepts writes?
2. What does a read return while copies disagree?
3. What happens when a node, a zone or the network between them fails?
4. How does data move when nodes are added or removed?
5. Where is the single point of failure or the hot spot?

### Where to revise

[Scaling and Distribution](../../scaling-and-distribution/load-balancing-fundamentals/content.md) and [Consistency and Coordination](../../consistency-and-coordination/cap-theorem/content.md) modules; the interactive replication, sharding, consistent-hashing, quorum and CAP simulations.

## Key Takeaways

- Always describe behaviour during failure, not just in normal operation.
- Use precise terms: linearizable vs eventual, W + R > N, fencing tokens, partition tolerance.
- Prefer designs that avoid coordination where the business allows it.
