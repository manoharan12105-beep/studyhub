# Disaster Recovery, Backups, RPO and RTO — Interview Questions

## Beginner

### Q1. What are RPO and RTO?

**Style:** Direct

<details>
<summary>Answer</summary>

RPO (recovery point objective) is the maximum acceptable data loss measured in time — how far back the restored data may be. RTO (recovery time objective) is the maximum acceptable time to restore service after a disaster. RPO is about data, RTO about downtime.

</details>

### Q2. Why isn't replication enough for disaster recovery?

**Style:** Why

<details>
<summary>Answer</summary>

Replication copies every change, including accidental deletions, corrupted data, bad migrations and malicious changes, to all replicas almost instantly. Recovering from those requires independent point-in-time backups. Replication within one region also does not protect against losing the whole region.

</details>

## Intermediate

### Q3. Describe the four common disaster recovery strategies.

**Style:** Comparison

<details>
<summary>Answer</summary>

Backup and restore: only backups exist off-site; cheapest, with RPO and RTO of hours. Pilot light: data continuously replicated and minimal core infrastructure ready; RPO minutes, RTO tens of minutes or more. Warm standby: a scaled-down full environment always running; RPO seconds to minutes, RTO minutes. Multi-site active-active: full capacity serving in multiple regions; near-zero RPO and RTO at the highest cost and complexity.

</details>

### Q4. What is the 3-2-1 backup rule?

**Style:** Direct

<details>
<summary>Answer</summary>

Keep at least three copies of the data, on two different types of storage or services, with one copy off-site. Modern practice adds immutability or a separate account for at least one copy, so ransomware or a compromised credential cannot delete all backups.

</details>

### Q5. How does point-in-time recovery work?

**Style:** How

<details>
<summary>Answer</summary>

Take periodic full base backups and continuously archive the database's write-ahead log (or binlog). To recover, restore the most recent base backup before the target time and replay the archived log up to the exact moment needed — for example one second before an accidental `DROP TABLE` — giving an RPO of seconds.

</details>

## Advanced

### Q6. How would you choose RPO and RTO for different parts of an e-commerce system?

**Style:** Design

<details>
<summary>Answer</summary>

By business impact: orders and payments — RPO near zero (synchronous replication within the region, continuous log archiving, cross-region replica) and RTO of minutes (warm standby with tested failover). Product catalogue — RPO of hours is acceptable if it can be re-imported, RTO under an hour. Analytics and recommendations — RPO of a day and RTO of hours; can be rebuilt. Cost and complexity rise steeply as targets approach zero.

</details>

### Q7. Your backups have never been restored. What is the risk and what do you do?

**Style:** Debugging

<details>
<summary>Answer</summary>

They may be incomplete, corrupted, missing encryption keys or credentials, or take far longer to restore than the RTO allows — discovered only during a real disaster. Schedule regular automated restore tests into isolated environments, verify data integrity and application startup, measure restore duration against RTO, and run full DR drills periodically.

</details>
