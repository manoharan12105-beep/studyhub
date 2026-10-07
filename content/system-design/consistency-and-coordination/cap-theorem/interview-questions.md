# The CAP Theorem — Interview Questions

## Beginner

### Q1. What does the CAP theorem state?

**Style:** Direct

<details>
<summary>Answer</summary>

For a distributed system that replicates data over a network: when a network partition occurs (nodes cannot communicate), the system must choose between consistency — every read sees the latest write or gets an error — and availability — every request to a non-failed node gets a non-error response. It cannot guarantee both during the partition.

</details>

### Q2. What does partition tolerance mean?

**Style:** Direct

<details>
<summary>Answer</summary>

That the system continues to operate when the network between its nodes drops or delays messages, splitting nodes into groups that cannot talk to each other. It does not refer to partitioning (sharding) data.

</details>

### Q3. Is a bank's balance service CP or AP? What about a social feed?

**Style:** Scenario

<details>
<summary>Answer</summary>

Balance and transfers: CP — during a partition it is better to reject or delay a request than to show a wrong balance or allow double spending. Social feed and likes: AP — it is better to show slightly stale content than to fail to load; inconsistencies are reconciled after the partition.

</details>

## Intermediate

### Q4. Why is "pick any two of C, A, P" misleading?

**Style:** Trap

<details>
<summary>Answer</summary>

Because partition tolerance is not optional for a system distributed over a network — partitions will happen. The meaningful choice is what to sacrifice during a partition: consistency or availability. A "CA" system is one that never experiences partitions, which means a single node or a single site treated as one unit, i.e. not really distributed. Outside partitions, a system can be both consistent and available.

</details>

### Q5. Is the C in CAP the same as the C in ACID?

**Style:** Trap

<details>
<summary>Answer</summary>

No. CAP's consistency is linearizability: all clients see a single, up-to-date copy of the data. ACID's consistency means a transaction moves the database from one valid state to another, preserving constraints and invariants. A database can be ACID-consistent on one node while its replicas are not CAP-consistent.

</details>

### Q6. What happens in an AP system after a partition heals?

**Style:** What happens if

<details>
<summary>Answer</summary>

Replicas exchange the writes each side accepted and converge. Non-conflicting writes simply merge; conflicting writes to the same data must be resolved by a policy — last write wins, merging (set union, CRDTs), application logic or asking the user. Designs choose data models that merge cleanly where possible.

</details>

## Advanced

### Q7. What is PACELC?

**Style:** Direct

<details>
<summary>Answer</summary>

An extension of CAP: if there is a Partition, choose Availability or Consistency; Else, in normal operation, choose Latency or Consistency. It captures that strong consistency costs latency even without failures, because operations wait for replicas. For example, Dynamo-style stores are typically PA/EL, while consensus-based stores are PC/EC.

</details>

### Q8. Can one application be both CP and AP?

**Style:** Design

<details>
<summary>Answer</summary>

Yes — the choice is per operation or feature. An online store can serve product pages, recommendations and cart contents from AP stores and caches (stay up, accept staleness) while placing orders, decrementing stock and charging payments through CP paths that reject requests when they cannot reach a quorum or the primary. Many databases also offer per-request consistency levels.

</details>
