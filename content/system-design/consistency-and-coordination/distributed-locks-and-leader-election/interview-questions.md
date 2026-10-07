# Distributed Locks and Leader Election — Interview Questions

## Beginner

### Q1. Why do distributed systems need locks or leader election?

**Style:** Why

<details>
<summary>Answer</summary>

Because many identical instances run the same code. Some actions must be done by exactly one of them — running a scheduled job, being the database primary, assigning partitions, processing a specific resource — and without coordination they run multiple times or conflict (duplicate work, double charges, split brain).

</details>

## Intermediate

### Q2. Why must a distributed lock have an expiry?

**Style:** Why

<details>
<summary>Answer</summary>

If the holder crashes or is partitioned away while holding a lock without expiry, nobody else can ever acquire it. A lease with a time-to-live lets the lock be reclaimed; the holder renews it while working. The cost is that a slow or paused holder can lose the lease without noticing.

</details>

### Q3. What is a fencing token?

**Style:** Direct

<details>
<summary>Answer</summary>

A monotonically increasing number issued with each lock grant. The client includes it in every write to the protected resource, and the resource rejects writes carrying a token lower than the highest it has seen. It prevents a client whose lease expired during a pause from corrupting data after another client has taken the lock.

</details>

### Q4. How does leader election typically work in practice?

**Style:** How

<details>
<summary>Answer</summary>

Nodes compete to create or acquire a lease on a known key in a consensus-backed store (etcd, ZooKeeper, Consul, Kubernetes leases). The winner is leader and keeps renewing; others watch the key and campaign when the lease expires. Because the store requires a majority, only one leader can be elected at a time, and a minority partition cannot elect its own.

</details>

## Advanced

### Q5. Is a Redis `SET NX PX` lock safe for protecting payments?

**Style:** Trap

<details>
<summary>Answer</summary>

Not on its own. A process pause can outlast the lease, letting two holders act; with asynchronous Redis replication, a primary failover can lose the lock key; and clock or timing assumptions can be violated. For correctness, protect the resource with fencing tokens or conditional writes, use a consensus-based lock service, or better, design the payment operation to be idempotent with unique constraints so duplicates are impossible.

</details>

### Q6. Why do consensus clusters use an odd number of nodes like 3 or 5?

**Style:** Why

<details>
<summary>Answer</summary>

Decisions need a majority. A 3-node cluster needs 2 votes and tolerates 1 failure; 4 nodes need 3 votes and still tolerate only 1, so the extra node adds cost without extra fault tolerance. 5 nodes tolerate 2 failures. Odd sizes give the best tolerance per node and avoid even splits during partitions.

</details>
