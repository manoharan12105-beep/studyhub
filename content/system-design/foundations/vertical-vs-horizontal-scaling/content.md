# Vertical vs Horizontal Scaling

**Module:** Foundations · **Interview priority:** Core

## What Is It?

Two ways to get more capacity:

- **Vertical scaling (scale up):** make one machine bigger — more CPU cores, more RAM, faster disks and network.
- **Horizontal scaling (scale out):** add more machines and spread the work across them.

```text
Vertical                         Horizontal
┌──────────┐                     ┌────┐ ┌────┐ ┌────┐ ┌────┐
│          │                     │ S1 │ │ S2 │ │ S3 │ │ S4 │ … add an S5 when needed
│ one big  │                     └────┘ └────┘ └────┘ └────┘
│ server   │                        ▲ load balancer routes requests ▲
└──────────┘                        shared data lives outside the servers
```

## Why It Exists

Every system eventually outgrows its first machine. Choosing how to grow decides cost, the ceiling on growth, and what happens when a machine fails.

## How It Works

### Vertical scaling

- **No code changes:** stop the machine, resize it, start it again (sometimes even live).
- **Hard ceiling:** you cannot buy a bigger machine than the largest one sold.
- **Cost rises steeply near the top:** the largest instance types cost far more per unit of capacity; going from the second-largest to the largest can double the bill for a modest gain.
- **Still one machine:** it remains a single point of failure, and resizing usually needs a restart.

### Horizontal scaling

- **No practical ceiling:** need more? Add another server.
- **Redundancy for free:** losing one of ten servers removes 10 % of capacity, not 100 %.
- **Commodity hardware:** many small machines, often cheaper overall, and capacity can follow load up and down (autoscaling).
- **New problems it creates:**
  - Who routes traffic to which server? → a **load balancer**.
  - Where does shared data live? → a **shared database** (and later replicas or shards).
  - Where do sessions live? → servers must be **stateless** ([Stateless vs Stateful](../stateless-vs-stateful-services/content.md)).
  - How do the servers agree? → consistency and coordination problems appear for stateful parts.

### Scaling the database is harder than scaling the app

Stateless application servers scale out easily: they are interchangeable copies. Databases hold state, so scaling them out means **replication** (copies for reads and failover) and **sharding** (splitting data), each with its own trade-offs. This is why many systems scale the database vertically for as long as possible while scaling the application tier horizontally.

**Think about it:** an internal reporting tool with 50 users is slow. A consumer app expects to grow from 10,000 to 10 million users. Which scaling approach fits each?

<details>
<summary>Answer</summary>

The internal tool: vertical scaling (after checking queries and indexes). It is simple, needs no code change and 50 users will never outgrow a large machine. The consumer app: design for horizontal scaling from the start — stateless servers behind a load balancer and external state — because its growth will pass any single machine and it cannot afford one point of failure.

</details>

## When to Use

- **Vertical first** for quick relief, small or predictable workloads, and databases that are hard to distribute.
- **Horizontal** when one machine's ceiling, cost or failure risk is unacceptable, or load varies enough to benefit from autoscaling.
- **Both** in practice: scale out the stateless tier, scale up (then replicate and shard) the data tier.

## Comparison

| Aspect | Vertical | Horizontal |
|--------|----------|------------|
| How | Bigger machine | More machines |
| Code changes | None | Statelessness, load balancing, shared data |
| Upper limit | Largest machine available | Practically none |
| Cost curve | Steep at the top | Roughly linear |
| Failure | Single point of failure | Survives individual machine failures |
| Downtime to scale | Often a restart | None (add nodes live) |
| Best for | Databases, small apps, quick fixes | Stateless app tiers, large systems |

## Common Traps

> [!WARNING]
> **Common trap:** "Horizontal scaling is always better." It adds load balancing, state management and consistency problems. Scale up first when it is enough; scale out when you must.

## Interview Follow-up

- *"Why not just buy a bigger server?"* "We can, first: it is simple and needs no code changes. But it has a ceiling, gets expensive quickly, and is still one point of failure, so beyond that we scale horizontally."

## Key Takeaways

- Vertical: bigger machine; simple, but limited, steeply priced and a single point of failure.
- Horizontal: more machines; unlimited and redundant, but needs a load balancer, stateless servers and shared data.
- Scale stateless tiers out easily; scale databases up first, then replicate and shard.
