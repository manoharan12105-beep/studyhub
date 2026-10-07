# Multi-Leader and Leaderless Replication — Interview Questions

## Beginner

### Q1. What is multi-leader replication and when is it used?

**Style:** Direct

<details>
<summary>Answer</summary>

A setup where more than one node accepts writes — usually a leader in each data centre — and leaders replicate changes to each other asynchronously. It is used for multi-region applications that need low-latency local writes and continued operation when regions lose contact, and for offline-capable or collaborative applications.

</details>

## Intermediate

### Q2. What are the ways to resolve write conflicts in multi-leader systems?

**Style:** How

<details>
<summary>Answer</summary>

Last write wins by timestamp (simple but discards data and depends on clocks), a deterministic priority such as the higher replica ID wins, merging values (data-type specific), conflict-free replicated data types (CRDTs) that merge automatically, or recording both versions and asking the user to resolve them. Avoiding conflicts by routing each record's writes to one home leader is often best.

</details>

### Q3. How does leaderless replication work?

**Style:** How

<details>
<summary>Answer</summary>

Each key is stored on N replicas. Clients or a coordinator send writes to all N and consider them successful after W acknowledgements, and send reads to several replicas, waiting for R responses and returning the newest version. Missed updates are fixed by read repair, hinted handoff and background anti-entropy. There is no leader, so there is no failover step.

</details>

### Q4. Why is last-write-wins dangerous?

**Style:** Why

<details>
<summary>Answer</summary>

It silently discards all but one of the concurrent writes, and it relies on timestamps from different machines whose clocks drift, so the "last" write may actually have happened earlier. Data loss happens without errors, so it should be used only where losing a concurrent update is acceptable.

</details>

## Advanced

### Q5. What are read repair and hinted handoff?

**Style:** Direct

<details>
<summary>Answer</summary>

Read repair: when a read sees replicas returning different versions, the coordinator writes the newest version back to the stale replicas. Hinted handoff: when a replica is unavailable during a write, another node stores the write with a hint and forwards it once the replica recovers. Both help leaderless stores converge; anti-entropy with Merkle trees catches what they miss.

</details>

### Q6. How would you design a collaborative text editor where users edit offline?

**Style:** Design

<details>
<summary>Answer</summary>

Treat each device as a leader that applies edits locally and syncs later, and represent the document with a CRDT (or operational transformation via a central server) so concurrent edits merge deterministically without losing characters. Each edit carries a unique ID and causal metadata; sync exchanges missing operations; the result converges on all devices regardless of order.

</details>
