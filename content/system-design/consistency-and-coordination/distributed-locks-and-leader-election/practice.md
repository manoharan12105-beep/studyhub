# Distributed Locks and Leader Election — Practice

### P1. Majority

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** consensus quorum

How many node failures can a 5-node consensus cluster tolerate while still electing a leader? A 6-node cluster?

<details>
<summary>Answer</summary>

5 nodes: majority is 3 → tolerates **2** failures. 6 nodes: majority is 4 → also tolerates only **2**.

</details>

### P2. Fencing

**Difficulty:** Medium · **Type:** Output · **Concepts:** fencing tokens

Storage has accepted a write with token 41. Then writes arrive with tokens 40, 42 and 41. Which are accepted?

<details>
<summary>Answer</summary>

40 rejected (lower than 41). 42 accepted (highest seen becomes 42). The second 41 rejected (lower than 42).

</details>

### P3. Lock or not

**Difficulty:** Medium · **Type:** Design · **Concepts:** alternatives to locks

Ten instances each run a cron job at midnight that emails a daily summary. Users receive ten emails. Give two fixes.

<details>
<summary>Answer</summary>

(1) Run the job once: a lease-based lock or leader election in a consensus store, or a single dedicated scheduler. (2) Make it idempotent: record "summary sent for user X on date D" with a unique constraint before sending, so later runs skip users already handled.

</details>
