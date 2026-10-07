# Disaster Recovery, Backups, RPO and RTO — Practice

### P1. RPO or RTO?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** RPO vs RTO

"We can lose at most 10 minutes of orders." This is a statement about:

- A) RTO
- B) RPO
- C) SLA latency
- D) Throughput

<details>
<summary>Answer</summary>

**Answer:** B) RPO

</details>

### P2. Compute the actual RPO

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** backup frequency

Full backups run every day at 02:00; there is no log archiving. Data is lost at 21:30 on a Wednesday. How much data is lost? What changes it to seconds?

<details>
<summary>Answer</summary>

Everything since 02:00 that day — **19.5 hours** of writes. Continuous write-ahead-log archiving (point-in-time recovery) or a replica in another region would reduce it to seconds or minutes.

</details>

### P3. Pick a strategy

**Difficulty:** Medium · **Type:** Design · **Concepts:** DR strategies

Match each system to a DR strategy: (a) an internal wiki, RTO 1 day; (b) a payments platform, RTO 5 minutes, RPO ~0; (c) a SaaS app, RTO 30 minutes, RPO 5 minutes, limited budget.

<details>
<summary>Answer</summary>

(a) Backup and restore. (b) Warm standby at minimum, likely multi-site active-active or synchronous cross-zone with rapid regional failover. (c) Pilot light (continuous data replication with infrastructure ready to scale up) or a small warm standby.

</details>

### P4. Ransomware

**Difficulty:** Hard · **Type:** Failure · **Concepts:** backup isolation

An attacker with admin credentials deletes production databases and every backup in the same cloud account. What design would have prevented losing everything?

<details>
<summary>Answer</summary>

Keep at least one backup copy immutable (object lock / write-once retention) and in a separate account or provider with separate credentials, so a compromise of the production account cannot delete it — the off-site, isolated part of the 3-2-1 rule. Also apply least privilege and require multiple approvals for destructive actions.

</details>
