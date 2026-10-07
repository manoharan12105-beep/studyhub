# Database Replication and Read Replicas — Interview Questions

## Beginner

### Q1. What is database replication and why use it?

**Style:** Direct

<details>
<summary>Answer</summary>

Keeping copies of the same data on multiple nodes. It removes the single point of failure (a replica can take over), improves availability, scales read throughput by spreading reads across copies, and places data close to users in other regions.

</details>

### Q2. In primary–replica replication, why do writes go only to the primary?

**Style:** Why

<details>
<summary>Answer</summary>

So every change has one authoritative order. If several copies accepted writes independently, concurrent writes could set different values on different nodes with no way to decide which is correct. With one writer, replicas apply the primary's changes in the same order and converge.

</details>

### Q3. Is replication a backup?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Replicas copy every change, including accidental deletes, bad migrations and corrupted data, within milliseconds. Backups are point-in-time snapshots (plus logs for point-in-time recovery) kept separately so you can restore data as it was before the mistake.

</details>

## Intermediate

### Q4. A user updates their profile and immediately sees the old version. Why, and how do you fix it?

**Style:** Scenario

<details>
<summary>Answer</summary>

Replication lag: the update went to the primary but the following read was served by a replica that had not applied it yet. Fix with read-your-writes routing — send that user's reads of data they recently changed to the primary for a short window, track the write's log position and read only from replicas that have reached it, or update the client's view directly from the write response.

</details>

### Q5. What happens during failover, and what can go wrong?

**Style:** What happens if

<details>
<summary>Answer</summary>

The system detects the primary's failure, picks the most up-to-date replica, promotes it, and redirects writes and other replicas to it. Risks: writes acknowledged by the old primary but not yet replicated are lost (with asynchronous replication); a falsely suspected primary that is still alive can cause split brain with two writers; clients may see errors while the switch completes; and the remaining replicas may need to be resynchronised.

</details>

### Q6. How do you add a new replica to a busy database?

**Style:** How

<details>
<summary>Answer</summary>

Take a consistent snapshot of the primary associated with a precise log position, restore it on the new node, then stream and apply all changes from the primary's log since that position until the replica catches up, after which it continues streaming like any other replica. No downtime is needed.

</details>

## Advanced

### Q7. How do you prevent split brain during failover?

**Style:** Design

<details>
<summary>Answer</summary>

Use a consensus-based coordinator (etcd, ZooKeeper, or the database's built-in consensus) so only one node can hold the leader role at a time, require a majority (quorum) to elect a leader, and fence the old primary — revoke its write access, shut it down (STONITH), or reject its writes using an increasing epoch or fencing token — so a primary that was only partitioned cannot keep accepting writes.

</details>

### Q8. You have three copies of your database. How should traffic use them?

**Style:** Design

<details>
<summary>Answer</summary>

Send all writes and freshness-critical reads to the primary; distribute other reads across the two replicas (and optionally the primary) through a read load balancer or data-source routing; keep at least enough spare capacity that losing one copy does not overload the others; use one replica as the failover target and possibly run backups or analytics against a replica to keep load off the primary.

</details>
