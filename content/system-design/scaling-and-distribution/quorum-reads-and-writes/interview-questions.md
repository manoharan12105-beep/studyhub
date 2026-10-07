# Quorum Reads and Writes — Interview Questions

## Beginner

### Q1. What is a quorum in a replicated database?

**Style:** Direct

<details>
<summary>Answer</summary>

The minimum number of replicas that must respond for an operation to succeed: W acknowledgements for a write and R responses for a read, out of N replicas holding the data. Choosing W and R trades latency and availability against freshness.

</details>

### Q2. Why does W + R > N ensure reads see the latest write?

**Style:** Why

<details>
<summary>Answer</summary>

Because any set of W replicas and any set of R replicas drawn from N must share at least one replica when W + R > N (they cannot fit in N without overlapping). That shared replica holds the latest successful write, and the read returns the newest version among its responses.

</details>

## Intermediate

### Q3. With N = 3, compare W = 2/R = 2 with W = 1/R = 1.

**Style:** Comparison

<details>
<summary>Answer</summary>

W = 2, R = 2: 4 > 3, so reads see the latest write; each operation waits for two replicas and tolerates one failure. W = 1, R = 1: 2 ≤ 3, so reads may miss the latest write (eventual consistency), but operations are faster and work while two replicas are down.

</details>

### Q4. How many replica failures can writes and reads tolerate?

**Style:** Direct

<details>
<summary>Answer</summary>

Writes succeed while at least W replicas respond, so they tolerate N − W failures; reads tolerate N − R. With N = 5, W = 3, R = 3, each tolerates 2 failures.

</details>

### Q5. Is "more than N/2 for reads and writes" the same rule as W + R > N?

**Style:** Trap

<details>
<summary>Answer</summary>

Majority reads and writes always satisfy W + R > N, but the general rule is broader: W = N with R = 1 (or W = 1 with R = N) also guarantees overlap without either being a majority. The majority version is a special, balanced case.

</details>

## Advanced

### Q6. Why might a quorum system still return stale data even when W + R > N?

**Style:** Debugging

<details>
<summary>Answer</summary>

With sloppy quorums and hinted handoff, writes may be acknowledged by nodes outside the key's normal replica set, so the overlap guarantee breaks until hints are delivered; concurrent writes resolved by last-write-wins can discard the newer one because of clock skew; a failed write (fewer than W acks) may remain on some replicas and be read later; and replica restores from old data can reintroduce stale versions.

</details>

### Q7. Which consistency levels would you use in Cassandra for a payment status and for page-view logging?

**Style:** Scenario

<details>
<summary>Answer</summary>

Payment status: `QUORUM` (or `LOCAL_QUORUM` within the region) for both writes and reads with replication factor 3, so reads see the latest successful write. Page-view logging: write with `ONE` for lowest latency and highest availability; analytical reads can use `ONE` and tolerate slight staleness.

</details>
