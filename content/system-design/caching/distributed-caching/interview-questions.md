# Distributed Caching — Interview Questions

## Beginner

### Q1. What is the difference between a local cache and a distributed cache?

**Style:** Comparison

<details>
<summary>Answer</summary>

A local cache lives in each application process's memory: extremely fast, but every server has its own copy, copies can disagree, capacity is limited by each server and contents are lost on restart. A distributed cache is a shared cluster (Redis, Memcached) all servers use: one consistent copy per key, capacity that scales with nodes and survives app restarts, at the cost of a network round trip.

</details>

## Intermediate

### Q2. Why is modulo hashing a problem when resizing a cache cluster?

**Style:** Why

<details>
<summary>Answer</summary>

With `hash(key) % N`, changing N changes the node for most keys (moving from 4 to 5 nodes remaps about 80 %). Those keys miss on their new nodes, the hit ratio collapses and the database absorbs the traffic. Consistent hashing or hash slots move only the share of keys the new node takes over.

</details>

### Q3. How does Redis Cluster distribute keys?

**Style:** How

<details>
<summary>Answer</summary>

It maps every key to one of 16,384 hash slots using CRC16 of the key modulo 16384, and assigns ranges of slots to primary nodes, each with replicas. Clients learn the slot map and send commands to the right node. Resharding moves slots between nodes. Hash tags (the part of the key inside braces) force related keys into the same slot so multi-key operations work.

</details>

### Q4. When would you choose Memcached over Redis?

**Style:** Comparison

<details>
<summary>Answer</summary>

For simple key-value caching of strings or serialised objects at large scale where you want multi-threaded performance and no persistence or replication features — Memcached is lean and easy to scale with client-side consistent hashing. Choose Redis when you need data structures (sorted sets, hashes, streams), persistence, built-in replication and failover, or uses beyond caching such as rate limiting and locks.

</details>

## Advanced

### Q5. What can go wrong when a cache primary fails over to its replica?

**Style:** What happens if

<details>
<summary>Answer</summary>

Replication is asynchronous, so the last writes acknowledged by the old primary may be missing on the promoted replica — a cache can lose recent entries or counter increments, and a lock held in Redis may be lost. Clients may also briefly get errors during the switch. Acceptable for cached data that can be reloaded; not acceptable for the only copy of important data.

</details>

### Q6. Design a two-level cache for product data, and explain how you keep it consistent.

**Style:** Design

<details>
<summary>Answer</summary>

Level 1: an in-process cache per app server with a short TTL (a few seconds) for the hottest products. Level 2: a Redis cluster with a longer TTL. Reads check L1, then L2, then the database, filling both on the way back. On product updates, delete the key in Redis and broadcast an invalidation over pub/sub so every server drops its L1 copy; the short L1 TTL bounds staleness if a message is lost.

</details>
