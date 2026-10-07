# Monolith, Modular Monolith and Microservices

**Module:** Foundations · **Interview priority:** Core

## What Is It?

Three ways to organise the code and deployment of a backend:

- **Monolith:** one codebase, built and deployed as one unit. Signup, upload, feed and likes are packages in the same application and call each other as ordinary function calls.
- **Modular monolith:** still one deployable, but split into modules with strict boundaries: each module owns its data and exposes a small internal API; other modules may not reach into its tables or classes.
- **Microservices:** many small services, each owning one business capability and its own data, deployed independently and communicating over the network (HTTP, gRPC or messages).

```text
Monolith / modular monolith                Microservices
┌──────────────────────────────┐           [upload svc ×2] ──┐
│ signup │ upload │ feed │ likes│            [feed svc ×10] ──┼── network calls (can be slow,
│   (function calls, one log)  │           [likes svc ×3]  ──┤    time out, fail halfway)
└──────────────┬───────────────┘           [notify svc ×2] ──┘
               ▼                            each with its own database
           one database
```

## Why It Exists

Every organisation must decide how to split work between code, teams and deployments. The choice affects how fast a team ships, how parts scale, and how failures spread.

## How It Works

### Why the monolith is the right start

- One codebase to build, test and deploy; one log to read when something breaks.
- Calls between parts are in-process: fast, no partial failures, simple transactions across features.
- Small teams move fastest with the least operational overhead.

Its costs grow with size: a change to the signup page redeploys everything, one module's memory leak takes down all features, and 40 engineers in one codebase block each other.

### The modular monolith: the middle ground

Enforce module boundaries inside one deployable (separate packages, internal APIs, one schema per module, no cross-module table access). You keep the simplicity of one deployment and one transaction boundary, and gain clean seams — a module with a clear API and its own data can later become a service with little rework.

### Two good reasons to split out a service

1. **Independent scaling or isolation.** The feed needs 10 instances, uploads need 2, and a monolith must scale everything to 10. Or a component has different resource needs (GPU transcoding) or failure risk that must not affect the rest.
2. **Team independence.** Many teams on one codebase queue up for releases and break each other's code. Services let each team own, deploy and operate its part.

### What microservices cost

| Cost | Why |
|------|-----|
| Network failures | Every call can be slow, time out or fail halfway; you need timeouts, retries, circuit breakers |
| Data consistency | No single database transaction across services; you need sagas and events ([Distributed Transactions](../../consistency-and-coordination/distributed-transactions-and-sagas/content.md)) |
| Debugging | One request touches many services' logs; you need distributed tracing |
| Operations | Many deployments, service discovery, API gateways, versioned APIs, monitoring per service |
| Latency | Network hops add milliseconds that in-process calls did not have |

## When to Use

- **Monolith / modular monolith:** new products, small teams, unclear domain boundaries, strong need for transactions across features.
- **Microservices:** large organisations with many teams, components with very different scaling or reliability needs, and the platform maturity (CI/CD, observability, on-call) to run them.

## When Not to Use

Do not adopt microservices because large companies use them. A five-person startup running 30 services spends more time debugging the network than building the product.

## Comparison

| Aspect | Monolith | Modular monolith | Microservices |
|--------|----------|------------------|---------------|
| Deployables | 1 | 1 | Many |
| Internal calls | Function calls | Function calls through module APIs | Network calls |
| Data | Shared database | One schema per module | Database per service |
| Scaling | Whole app | Whole app | Per service |
| Failure isolation | Low | Low–medium | High (if designed for it) |
| Transactions | Easy | Easy | Sagas / eventual consistency |
| Operational effort | Low | Low | High |
| Team autonomy | Low | Medium | High |

## Common Traps

> [!WARNING]
> **Common trap:** microservices sharing one database. Services that read and write each other's tables are a **distributed monolith**: all the network costs, none of the independence.

- **"Microservices are more scalable."** A monolith scales horizontally behind a load balancer too; microservices allow scaling *parts* independently.

## Interview Follow-up

- *"Would you start this design with microservices?"* Usually no: start with a (modular) monolith, and split a service when a measured scaling, isolation or team need appears — for example, a read-heavy feed service.

## Key Takeaways

- Monolith: simple and fast to build; everything scales and deploys together.
- Modular monolith: one deployable with strict module boundaries; the best default for most new systems.
- Microservices: independent scaling, deployment and ownership, paid for with network failures, distributed data and operational complexity.
- Split for a reason — independent scaling, isolation or team autonomy — not for fashion.
