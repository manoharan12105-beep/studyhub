# Redundancy, High Availability and Failover — Practice

### P1. Which is active-active?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** redundancy modes

Which setup is active-active?

- A) A primary database with an idle standby that is promoted on failure
- B) Six stateless API servers behind a load balancer, all serving traffic
- C) A backup tape stored offsite
- D) A cold standby server that is started manually

<details>
<summary>Answer</summary>

**Answer:** B) Six stateless API servers behind a load balancer, all serving traffic

</details>

### P2. Headroom

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** N+1 capacity

Peak load needs 600 units of capacity; each server provides 100 at its safe limit. How many servers do you need to survive one server failure? To survive losing one of three zones (servers spread evenly)?

<details>
<summary>Answer</summary>

One server failure: 6 needed after the failure → **7 servers**. One zone of three lost: the remaining two-thirds must provide 600 → 900 total → **9 servers** (3 per zone).

</details>

### P3. Failover risks

**Difficulty:** Medium · **Type:** Failure · **Concepts:** failover pitfalls

A database fails over automatically after the primary misses 2 heartbeats (1 s apart) during a 3-second network blip. Afterwards both old and new primaries accept writes. Name the problem and two fixes.

<details>
<summary>Answer</summary>

Split brain caused by over-sensitive detection. Fixes: require a quorum decision (and more consecutive failures or multiple observers) before failing over, and fence the old primary so it cannot accept writes once a new one is elected.

</details>
