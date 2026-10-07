# The Building Blocks of a System — Interview Questions

## Beginner

### Q1. Name the common building blocks of a scalable web system and what each does.

**Style:** Direct

<details>
<summary>Answer</summary>

Clients (start requests), DNS (name to IP), load balancer (spreads traffic over healthy servers), application servers exposing APIs (business logic), database (durable structured data), cache (fast access to hot data), object storage (large files), CDN (static content near users), message queue (asynchronous work), and monitoring/logging (visibility into behaviour and failures).

</details>

### Q2. Why should clients call an API instead of querying the database directly?

**Style:** Why

<details>
<summary>Answer</summary>

Security (no database credentials on clients; the API enforces authorisation), safety (clients cannot run arbitrary or destructive queries), decoupling (the schema can change behind a stable API), and scalability (the API layer is where caching, validation, rate limiting and load balancing happen). It also lets clients in any language use the same service over HTTP.

</details>

### Q3. What is the difference between a synchronous and an asynchronous call?

**Style:** Comparison

<details>
<summary>Answer</summary>

In a synchronous call the caller waits for the response before continuing, so the callee's latency and failures directly affect the caller. In an asynchronous call the caller hands off the work, typically via a message queue, and continues immediately; the work happens later and failures are retried without blocking the caller.

</details>

## Intermediate

### Q4. In checkout, which steps would you make asynchronous and why?

**Style:** Scenario

<details>
<summary>Answer</summary>

Keep payment authorisation and stock reservation synchronous because the user needs their outcome now and the order depends on them. Make receipt emails, warehouse notifications, loyalty points, analytics and recommendation updates asynchronous events: they can happen seconds later, and their failures should not fail the purchase.

</details>

### Q5. What problem does a CDN solve that an application cache does not?

**Style:** Comparison

<details>
<summary>Answer</summary>

Distance and bandwidth. An application cache (Redis) sits in your data centre and saves database work, but bytes still travel from your region to the user. A CDN caches content on edge servers close to users, cutting round-trip latency and offloading huge amounts of bandwidth (images, video, scripts) from your origin.

</details>

## Advanced

### Q6. Which building blocks would you start with for a new product with unknown traffic, and which would you add later?

**Style:** Design

<details>
<summary>Answer</summary>

Start with an application (behind a managed load balancer so scaling out is easy), one managed relational database with backups, object storage for files, and monitoring. Add a cache when measured read latency or database load requires it, read replicas when reads outgrow the primary, a queue when slow or failure-prone work appears in requests, a CDN when static or media traffic grows, and sharding only when data or writes outgrow one primary.

</details>
