# Consistent Hashing — Interview Questions

## Beginner

### Q1. What problem does consistent hashing solve?

**Style:** Why

<details>
<summary>Answer</summary>

With `hash(key) % N`, changing the number of nodes changes the assignment of most keys, which empties a distributed cache or forces most data to move in a sharded store. Consistent hashing places nodes and keys on a ring so that adding or removing a node only moves the keys in the affected arc — about 1/N of them.

</details>

### Q2. How does a key find its node on the hash ring?

**Style:** How

<details>
<summary>Answer</summary>

Hash the key to a position on the ring and walk clockwise to the first node position (wrapping around past the end). In code, keep node positions in a sorted map and take the first entry at or after the key's hash, or the first entry overall if none.

</details>

## Intermediate

### Q3. What are virtual nodes and why are they needed?

**Style:** Why

<details>
<summary>Answer</summary>

Each physical node is placed at many points on the ring. Without them, nodes own arcs of uneven size (unbalanced load), and a departing node's entire load moves to one neighbour. With many virtual nodes, each node owns many small arcs, load evens out, a failed node's keys spread across all others, and stronger machines can be given more points.

</details>

### Q4. Roughly what fraction of keys move when a 5th node joins a 4-node consistent-hash ring? With modulo hashing?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

Consistent hashing: about 1/5 (20 %) — the share the new node takes over. Modulo hashing (`% 4` to `% 5`): about 80 %, because a key stays only when both remainders match.

</details>

### Q5. How do Dynamo-style databases use the ring for replication?

**Style:** How

<details>
<summary>Answer</summary>

A key's coordinator is the first node clockwise from its hash, and its replicas are the next N − 1 distinct physical nodes clockwise (skipping virtual nodes of the same machine, and often spreading across racks or zones). Reads and writes then use quorums over those N replicas.

</details>

## Advanced

### Q6. Consistent hashing vs fixed hash slots (like Redis Cluster's 16,384 slots) — what are the trade-offs?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both limit data movement. Consistent hashing needs no central table — every client computes ownership from the node list — but balance depends on virtual-node counts and lookups are O(log V). Fixed slots hash keys into a fixed number of partitions and keep an explicit slot-to-node table: O(1) lookup, precise control over which slots move during rebalancing, but the table must be distributed and kept consistent, and the slot count is fixed up front.

</details>

### Q7. Does consistent hashing prevent hot keys?

**Style:** Trap

<details>
<summary>Answer</summary>

No. It balances the number of keys per node and limits movement, but a single extremely popular key still maps to one node (and its replicas). Hot keys need caching, key splitting or read replicas.

</details>
