# Load-Balancing Algorithms

**Module:** Scaling and Distribution · **Interview priority:** Core

## What Is It?

A **load-balancing algorithm** is the rule a load balancer uses to pick a backend server for each new connection or request. Some algorithms are **static** (decided by a fixed rule, ignoring current load) and some are **dynamic** (using live information such as open connections or response times).

## Why It Exists

Servers differ in size, requests differ in cost, and clients differ in where they are and whether they need to return to the same server. One rule cannot be best for all of these, so balancers offer several.

## How It Works

### The algorithms

| Algorithm | Picks | Good for | Weakness |
|-----------|-------|----------|----------|
| **Round robin** | The next server in turn: S1, S2, S3, S1… | Identical servers, similar short requests | Ignores capacity and current load: a 4 GB and a 16 GB server get the same share |
| **Weighted round robin** | Turns in proportion to weights: with weights 1:2:3, S3 gets 3 of every 6 requests | Mixed server sizes; canary releases (weight 1 of 20 to the new version) | Weights must be maintained; still ignores live load |
| **Least connections** | The server with the fewest open connections | **Long-lived or uneven** connections: WebSockets, streaming, slow reports | A connection count does not show how heavy each connection is |
| **Weighted least connections** | Fewest connections relative to weight | Mixed sizes + uneven requests | More state to track |
| **Least response time** | The lowest recent average latency (often combined with fewest connections) | Latency-sensitive services: search, trading | Must keep computing averages; a short spike skews it |
| **IP hash / consistent hashing** | `hash(client IP or key)` decides the server | Same client → same server (affinity), cache locality | Uneven if a few clients dominate; adding a server remaps clients (unless consistent hashing) |
| **Geo-based** | The server or region nearest the user | Global apps | VPNs mislead it; needs per-region data and capacity |
| **Random / power of two choices** | Pick two servers at random, use the less loaded | Large fleets with many balancers | Slightly less even than perfect knowledge, but no shared state |

### Least connections, worked

S1 and S2 have each received 7 requests. S1 has finished 3 of them (4 still open); S2 has finished none (7 open). Round robin would send the next request to whichever is next in turn; least connections sends it to **S1**. The balancer keeps these counts itself because every connection passes through it.

### Weighted round robin, worked

Weights S1 = 1, S2 = 2, S3 = 3. Over 6 requests, S1 gets 1, S2 gets 2 and S3 gets 3 — a **proportional share**, not "everything to the heaviest server". Smooth implementations interleave them (for example S3, S2, S1, S3, S2, S3) rather than sending three in a row to S3.

### Affinity without sticky servers

IP hash keeps a user on one server so in-memory session data is found — but it inherits the problems of [sticky sessions](../../foundations/stateless-vs-stateful-services/content.md): uneven load, and users lose their session when their server dies or the pool changes. Modern designs make servers stateless (sessions in Redis or signed tokens such as JWTs), so any algorithm works and affinity is needed only for performance (cache locality), where consistent hashing limits remapping.

### Real balancers combine signals

Production balancers often blend algorithms — for example least outstanding requests with weights, plus health and latency penalties, plus slow-start that gives a newly added server a gradually increasing share so it is not overwhelmed while its caches are cold.

**Think about it:** a chat service uses round robin for WebSocket connections. After a few hours, one server has 40,000 connections and another 8,000. How did that happen, and what should change?

<details>
<summary>Answer</summary>

Round robin spreads **new** connections evenly but ignores how long they last. Servers that were in the pool longest (or that got clients who stay connected longer) accumulate connections, and servers added later start empty. Use least connections so each new connection goes to the server holding the fewest, plus slow-start for new servers.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "Least connections is for sticky sessions." Least connections balances by open connection count and suits long-lived connections; stickiness (affinity) comes from hashing or cookies.

- **"Weighted round robin sends all traffic to the strongest server."** It sends each server a share proportional to its weight.

## Interview Follow-up

- *"Which algorithm for your design?"* Stateless REST API on identical instances: round robin or least outstanding requests. WebSockets: least connections. Mixed instance sizes: weighted variants. Cache-heavy backends: consistent hashing on the key.

## Key Takeaways

- Static: round robin, weighted round robin, hashing. Dynamic: least connections, least response time, power of two choices.
- Weighted algorithms give proportional shares; least connections suits long-lived or uneven connections.
- IP hashing gives affinity but brings sticky-session problems; prefer stateless servers.
- Real balancers combine algorithms with health, latency and slow-start.
