# HLD vs LLD — Interview Questions

## Beginner

### Q1. What is the difference between high-level and low-level design?

**Style:** Comparison

<details>
<summary>Answer</summary>

High-level design describes the system's major components (load balancers, services, databases, caches, queues), how requests and data flow between them, and how the system scales and survives failures. Low-level design describes the inside of one component: classes, interfaces, methods, data structures and the rules they enforce. HLD answers "can this system meet its goals?"; LLD answers "is this component correct and maintainable?".

</details>

### Q2. You are asked to "design an in-memory cache". Do you start with load balancers and replicas?

**Style:** Scenario

<details>
<summary>Answer</summary>

No. That is a low-level design question: discuss the class API (`get`, `put`, capacity), the data structures (a hash map plus a doubly linked list for O(1) LRU), eviction, and thread safety. Servers and replication only come in if the interviewer extends it into a distributed cache.

</details>

## Intermediate

### Q3. In an HLD interview, when is it worth going into low-level detail?

**Style:** How

<details>
<summary>Answer</summary>

When the detail decides whether the design works: the shard key (it decides hot spots and which queries stay on one shard), the ID-generation scheme for a URL shortener (collisions, coordination), the cache key and TTL (staleness), or the message key (ordering). Go deep on those few points and keep the rest at component level.

</details>

### Q4. How would you approach "design a rate limiter", which could be HLD or LLD?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Ask which they want. For HLD: where the limiter sits (API gateway or middleware), where counters live (Redis shared by all gateway nodes), the algorithm, what happens when Redis is unavailable (fail open or closed), and response headers (`429`, `Retry-After`). For LLD: a `RateLimiter` interface, a `TokenBucket` class with capacity, refill rate and last-refill timestamp, and thread safety.

</details>

## Advanced

### Q5. What goes wrong when a candidate answers an HLD question at LLD altitude?

**Style:** Trade-off

<details>
<summary>Answer</summary>

They spend the time on classes and method names that the interviewer did not ask about, and never reach requirements, estimates, data storage, scaling and failure handling — the parts being assessed. The interviewer then has no evidence of the candidate's architecture reasoning. Stating the altitude first and checking it with the interviewer avoids this.

</details>
