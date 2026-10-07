# Redundancy, High Availability and Failover

**Module:** Reliability and Resilience · **Interview priority:** Core

## What Is It?

- **Redundancy:** having more than one of a component, so another can do the work if one fails.
- **High availability (HA):** designing so the service stays up a very high fraction of the time (99.9 %, 99.99 %), usually with redundancy plus fast, automatic recovery. Brief interruptions during failover are allowed.
- **Fault tolerance:** continuing to operate **without interruption** when a component fails — users notice nothing. Stronger and more expensive than HA.
- **Failover:** switching work from a failed component to a standby.

## Why It Exists

Every component eventually fails. Redundancy removes single points of failure; failover makes the spare take over; automation makes it fast enough to meet the SLO — at 99.99 % there are only about 4 minutes of downtime per month, less than the time a person needs to respond to a page ([SLA, SLO, SLI](../../foundations/sla-slo-sli-and-availability/content.md)).

## How It Works

### Active-passive vs active-active

| | Active-passive (hot standby) | Active-active |
|---|------------------------------|---------------|
| Normal operation | One node serves; the standby waits (receiving replicated data) | All nodes serve traffic |
| On failure | Detect → promote the standby → redirect traffic (seconds to minutes) | Remaining nodes absorb the load immediately |
| Capacity use | Standby capacity is idle (you pay for it) | All capacity is used; must keep headroom to absorb a failed node's share |
| Complexity | Simpler for stateful systems (one writer) | Easy for stateless services; hard for stateful data (conflicts) |
| Typical use | Primary databases, legacy systems | Stateless app servers, multi-zone load balancers, multi-region read paths |

Variants: **warm standby** (running but scaled down) and **cold standby** (resources created only when needed) trade cost against recovery time.

### Redundancy at each layer

| Layer | Redundancy | Failover mechanism |
|-------|-----------|--------------------|
| DNS | Two providers or a multi-site managed DNS | Resolvers try the other name servers |
| Load balancer | Multi-zone managed LB, or an active-passive pair with a floating IP (VRRP) | The standby takes over the virtual IP |
| App servers | N + 1 or more instances across zones | Health checks remove failed instances |
| Cache | Primary + replica per shard | Automatic promotion (Sentinel / cluster failover) |
| Database | Primary + replicas, preferably in other zones | Automated promotion ([Replication](../../scaling-and-distribution/database-replication/content.md)) |
| Data centre / region | Multiple zones; a second region for DR | Zone: automatic; region: DNS/global LB switch, often deliberate |

**Availability zones** are separate data centres within a region with independent power and networking but low latency between them — the standard unit of redundancy for HA.

### How failover works and what goes wrong

1. **Detection:** heartbeats or health checks miss for a threshold — too sensitive causes false failovers, too slow lengthens outages.
2. **Decision:** a coordinator (ideally consensus-based) decides the old node is dead.
3. **Promotion:** the standby takes the role (and the data must be current enough).
4. **Redirection:** clients reach the new node (floating IP, DNS change, service discovery update, connection retry).

Pitfalls:

- **Split brain:** the old primary was only unreachable, not dead, and keeps accepting writes while the new one does too. Prevent with quorum-based decisions and fencing (cut off the old node). See [Leader Election](../../consistency-and-coordination/distributed-locks-and-leader-election/content.md).
- **Data loss:** with asynchronous replication, the newest writes may not have reached the standby.
- **Untested failover:** the standby has outdated config, too little capacity or expired credentials. Test failovers regularly.
- **Capacity:** after losing one of three zones, the remaining two must carry all the load.

**Think about it:** a team runs two app servers, each at 70 % CPU at peak, as "redundant". One fails at peak. What happens?

<details>
<summary>Answer</summary>

The survivor must handle both servers' load — 140 % of its capacity — so it overloads, slows and probably fails too. Redundancy requires **spare capacity**: with N servers, each should run at most about (N − 1)/N of its safe limit at peak (N + 1 sizing), for example three servers at around 45–50 %, or autoscaling fast enough to cover the gap.

</details>

## Comparison

| | High availability | Fault tolerance |
|---|-------------------|-----------------|
| Goal | Minimise downtime | No interruption at all |
| User impact on failure | Brief errors or retries during failover | None |
| Approach | Redundancy + fast automatic failover | Fully redundant, lock-step or active-active everything |
| Cost | Moderate | High |

## Common Traps

> [!WARNING]
> **Common trap:** "Two of everything means we're highly available." Without spare capacity, automated failover, independent failure domains (different zones) and regular failover tests, the second copy may not save you.

## Interview Follow-up

- *"How do you make your database highly available?"* A primary with a synchronous or semi-synchronous replica in another zone, automated failover through a consensus-based manager, fencing of the old primary, connection retries in clients, plus backups for disasters.

## Key Takeaways

- Redundancy removes SPOFs; failover moves work to the spare; automation makes it fast.
- Active-passive is simpler for stateful systems; active-active uses all capacity and suits stateless tiers.
- Spread redundancy across availability zones, keep spare capacity, and test failovers.
- Guard against split brain and know how much data asynchronous failover can lose.
