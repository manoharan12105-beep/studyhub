# Block 1: Foundations

Block 1 of 6, about ten minutes. Read all six blocks for an hour's revision, or only the blocks you need.

## 1. What Design Is (2 min)

- System = components + a goal. Design = choosing components and connections so the system meets functional goals **and** quality targets as it grows.
- Scale in order: **cheaper work → bigger machine → more machines**. Each fix creates a new problem: name it.
- The $10 server's three failures: CPU/RAM (→ load balancer + servers), database overload (→ cache), machine death (→ replica + object storage).

## 2. Requirements and Altitude (2 min)

- HLD = components, flow, trade-offs. LLD = classes, functions. Say which first.
- Functional = features. Non-functional = numbers for latency, availability, durability, scale, consistency, security, cost. Every component serves a non-functional requirement.
- Five questions: users/growth · read vs write · what can't be lost · latency per path · cost. Missing answer → state an assumption and its consequence.

## 3. Numbers (3 min)

```text
RPS = DAU × actions ÷ 86,400   ·   1 M/day ≈ 12/s   ·   peak ≈ 3× (state it)
Storage = items × size × retention × 3 replicas   ·   1 GB/s = 8 Gbps
99.9 % ≈ 43 min/month   ·   99.99 % ≈ 4.3 min/month   ·   series multiplies down
```

Every estimate ends with "so…": "so writes fit one primary", "so we need a CDN".

## 4. Shapes of Systems (3 min)

- Data-intensive (move data → indexes, caches, replicas) vs compute-intensive (calculate → workers, GPUs, queues). Judge per feature.
- Building blocks: client, DNS, LB, app/API, DB, cache, object storage, CDN, queue, monitoring. Sync when the answer is needed now; async otherwise.
- Monolith → **modular monolith (default)** → microservices only for independent scaling, isolation or team autonomy.
- Vertical (simple, ceiling, SPOF) vs horizontal (unlimited, needs LB + stateless + shared data). Databases: scale up first.
- Stateless servers: sessions in Redis or tokens. Sticky sessions = uneven load + lost sessions.
