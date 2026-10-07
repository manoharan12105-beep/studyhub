# Redundancy, High Availability and Failover — Interview Questions

## Beginner

### Q1. What is the difference between high availability and fault tolerance?

**Style:** Comparison

<details>
<summary>Answer</summary>

High availability minimises downtime: redundant components and automatic failover restore service quickly, but users may see brief errors during the switch. Fault tolerance means the system keeps working with no interruption when a component fails, typically through fully redundant, simultaneously active components — more expensive.

</details>

### Q2. What is failover?

**Style:** Direct

<details>
<summary>Answer</summary>

The process of detecting that a component has failed and shifting its work to a standby or another active component — promoting a database replica, moving a virtual IP to a standby load balancer, or removing a failed server from a pool.

</details>

## Intermediate

### Q3. Compare active-passive and active-active redundancy.

**Style:** Comparison

<details>
<summary>Answer</summary>

Active-passive: one node serves while a standby waits with replicated state; on failure the standby is promoted, taking seconds to minutes, and standby capacity sits idle. Active-active: all nodes serve traffic, so a failure only reduces capacity and recovery is immediate; it requires spare headroom and is easy for stateless services but hard for stateful data because concurrent writers can conflict.

</details>

### Q4. What is split brain and how do you prevent it?

**Style:** How

<details>
<summary>Answer</summary>

Two nodes simultaneously believing they are the primary — usually because the old primary was partitioned rather than dead — and both accepting writes, causing divergent data. Prevent it by requiring a majority (quorum) to elect a primary, fencing the old primary (revoke access, power it off, reject its writes with fencing tokens), and using consensus-based coordination for leadership.

</details>

### Q5. Why spread replicas across availability zones?

**Style:** Why

<details>
<summary>Answer</summary>

Zones have independent power, cooling and networking, so a fault in one (a power failure, a network outage) is unlikely to affect another, while latency between zones is low enough for synchronous replication. Replicas in one zone or one rack fail together and give little real redundancy.

</details>

## Advanced

### Q6. Your failover drill revealed the standby database could not handle production load. What should change?

**Style:** Debugging

<details>
<summary>Answer</summary>

Size the standby like the primary (instance type, storage IOPS, connection limits), keep its configuration in sync through infrastructure as code, ensure its caches and statistics are warm or account for a warm-up period, include it in capacity planning, and run failover drills regularly so drift is caught before a real incident.

</details>

### Q7. How do you decide how sensitive failure detection should be?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Short timeouts and low thresholds detect failures quickly but cause false positives during brief network blips or GC pauses, triggering unnecessary failovers (which themselves carry risk, such as data loss or split brain). Long ones avoid false alarms but extend outages. Choose based on the SLO and the cost of a failover, use multiple signals (heartbeats plus health checks from several observers), and require consecutive failures.

</details>
