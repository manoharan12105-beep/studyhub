# Monolith, Modular Monolith and Microservices — Interview Questions

## Beginner

### Q1. What is the difference between a monolith and microservices?

**Style:** Comparison

<details>
<summary>Answer</summary>

A monolith is one codebase deployed as one unit, with components calling each other in-process and usually sharing one database. Microservices split the system into small services, each owning a business capability and its own data, deployed independently and communicating over the network.

</details>

### Q2. What is a modular monolith?

**Style:** Direct

<details>
<summary>Answer</summary>

A single deployable application whose code is divided into modules with enforced boundaries: each module owns its data (its own schema or tables) and exposes a small internal API, and other modules cannot reach into its internals. It keeps the operational simplicity of a monolith while creating clean seams for extracting services later.

</details>

### Q3. Why do many teams start with a monolith?

**Style:** Why

<details>
<summary>Answer</summary>

It is simpler to build, test, deploy and debug: one codebase, one deployment, in-process calls without network failures, and ordinary database transactions across features. For a small team with an unclear domain, that speed matters more than independent scaling.

</details>

## Intermediate

### Q4. When would you split a service out of a monolith?

**Style:** Scenario

<details>
<summary>Answer</summary>

When there is a concrete reason: the part needs to scale very differently (a read-heavy feed needing ten times the instances), it has different resource needs or failure risk that must be isolated (GPU transcoding, a flaky third-party integration), or team size makes a shared codebase a bottleneck. The part should already have a clear boundary and own its data.

</details>

### Q5. What new problems do microservices introduce?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Network calls that can be slow or fail partially (needing timeouts, retries, circuit breakers), no cross-service ACID transactions (needing sagas and eventual consistency), harder debugging (distributed tracing, correlated logs), API versioning between services, service discovery, more deployments and infrastructure, and added latency per hop.

</details>

### Q6. What is a distributed monolith?

**Style:** Trap

<details>
<summary>Answer</summary>

A system split into services that cannot change or deploy independently — typically because they share a database, call each other synchronously in long chains, or must be released together. It has the network costs of microservices without their benefits.

</details>

## Advanced

### Q7. Two microservices need to update data atomically (order and payment). How do you handle it?

**Style:** Design

<details>
<summary>Answer</summary>

Avoid a distributed ACID transaction (two-phase commit is slow and fragile). Use a saga: the order service creates the order as PENDING and emits an event; the payment service charges and emits success or failure; the order service confirms or cancels (compensates). Use the transactional outbox so database writes and event publication cannot diverge, and idempotent handlers because events may be delivered twice.

</details>

### Q8. How does a modular monolith make a later move to microservices easier?

**Style:** How

<details>
<summary>Answer</summary>

Because the hard part of extraction — finding the boundary and untangling shared data — is already done. A module that owns its tables and is called only through its internal API can be moved to its own process: the internal API becomes a network API, the schema moves to its own database, and callers change in one place.

</details>
