# Disaster Recovery, Backups, RPO and RTO

**Module:** Reliability and Resilience · **Interview priority:** Core

## What Is It?

**Disaster recovery (DR)** is the plan for restoring service and data after an event that redundancy within the system cannot absorb: a region outage, data corruption, a destructive bug, ransomware, an accidental mass deletion. Two numbers define every DR plan:

- **RPO — recovery point objective:** the maximum acceptable **data loss**, measured in time. RPO = 5 minutes means you may lose at most the last 5 minutes of writes.
- **RTO — recovery time objective:** the maximum acceptable **downtime** before service is restored. RTO = 1 hour means the system must be back within an hour.

```text
          last good copy                 disaster                  service restored
 ────────────●───────────────────────────────✕──────────────────────────●──────────►
             │◄──── data lost (≤ RPO) ──────►│◄──── downtime (≤ RTO) ───►│
```

## Why It Exists

High availability handles routine failures (a server, a zone). It does not help when the failure is replicated everywhere — a bad `DELETE`, corrupted data, a compromised account wiping resources — or when an entire region is lost. Only independent copies and a practised recovery procedure do.

## How It Works

### Backups vs replication

| | Replication | Backups |
|---|-------------|---------|
| Purpose | Availability, read scaling, failover | Recovery from loss, corruption and mistakes |
| Copies a mistake? | Yes, within milliseconds | No — older backups stay intact |
| Point in time | Only "now" | Many points in time (and continuous logs) |
| Restore speed | Instant failover | Minutes to hours |

You need both. See [Database Replication](../../scaling-and-distribution/database-replication/content.md).

### Backup essentials

- **Full + incremental/continuous:** periodic full snapshots plus continuous write-ahead-log or binlog archiving enable **point-in-time recovery** (restore to 10:41:59, just before the bad command).
- **3-2-1 rule:** at least **3** copies, on **2** different media or services, **1** off-site (another region or account). Keep some copies **immutable** or in a separate account so an attacker or a buggy script cannot delete them too.
- **Encrypt** backups and control who can restore.
- **Test restores regularly.** A backup that has never been restored is a hope, not a backup. Measure how long restores take — that is part of your RTO.

### The four DR strategies

| Strategy | What runs in the DR region | Typical RPO | Typical RTO | Cost |
|----------|----------------------------|-------------|-------------|------|
| **Backup and restore** | Nothing; backups copied there | Hours (since the last backup) | Hours to a day | Lowest |
| **Pilot light** | Core data replicated continuously; minimal infrastructure off or tiny | Minutes | Tens of minutes to hours (scale up, switch) | Low |
| **Warm standby** | A scaled-down but running copy of the full system | Seconds to minutes | Minutes | Medium |
| **Multi-site active-active** | Full production in two or more regions serving traffic | Near zero | Near zero (seconds) | Highest — and the hardest data consistency problems |

Choose per system by asking what an hour of downtime and an hour of lost data cost the business. Payments might need warm standby or active-active; an internal reporting tool might accept backup and restore.

### Recovery is a process

A DR plan includes who declares a disaster, runbooks for each step (restore data, redeploy infrastructure from code, switch DNS or global load balancing, verify integrity), communication to users, and regular **DR drills** that measure actual RPO and RTO.

**Think about it:** a database uses synchronous replication to a replica in another zone and takes nightly snapshots. At 15:00 a faulty migration corrupts the orders table. What are your RPO and RTO for this scenario?

<details>
<summary>Answer</summary>

Replication copied the corruption instantly, so it does not help. With only nightly snapshots, restoring loses everything since last night — RPO up to ~15 hours — and RTO is the restore time plus repairing data. With continuous log archiving (point-in-time recovery), you could restore to 14:59:59, giving an RPO of seconds; RTO still depends on how fast a restore runs, which drills must measure.

</details>

## Comparison

| | RPO | RTO |
|---|-----|-----|
| Measures | Data loss (how far back) | Downtime (how long) |
| Driven by | Backup frequency, replication mode | Restore speed, automation, standby readiness |
| Improved by | Continuous log shipping, synchronous replication | Warm standby, infrastructure as code, practised runbooks |

## Common Traps

> [!WARNING]
> **Common trap:** "Replicas are our backup." Replication copies deletions and corruption. Keep independent, point-in-time, off-site, tested backups.

## Interview Follow-up

- *"What are RPO and RTO for your design, and how do you meet them?"* State numbers per data store (for example orders: RPO 1 min via continuous archiving and cross-region replica; RTO 30 min via warm standby and runbooks), and say how often you test them.

## Key Takeaways

- RPO = maximum data loss (time); RTO = maximum downtime.
- Replication is for availability; backups (point-in-time, 3-2-1, immutable, off-site) are for recovery.
- DR strategies from cheap to expensive: backup and restore, pilot light, warm standby, multi-site active-active.
- Test restores and failovers regularly; untested recovery plans fail when needed.
