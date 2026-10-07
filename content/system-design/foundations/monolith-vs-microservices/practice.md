# Monolith, Modular Monolith and Microservices — Practice

### P1. Best starting point

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** architecture choice

A four-person startup is building a new marketplace with uncertain features. Which architecture fits best?

- A) 25 microservices on Kubernetes
- B) A modular monolith with one database
- C) A separate service per database table
- D) Serverless functions sharing one database without boundaries

<details>
<summary>Answer</summary>

**Answer:** B) A modular monolith with one database

Simple to operate and change, with clean boundaries for later extraction.

</details>

### P2. Reason to split

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** independent scaling

In a monolith, the feed endpoint handles 95 % of traffic and needs 20 instances; everything else would be fine on 3. What does this suggest?

<details>
<summary>Answer</summary>

The feed has a very different scaling profile, which is a good reason to extract it as its own service so it can scale (and be cached and tuned) independently while the rest of the monolith stays small.

</details>

### P3. Spot the anti-pattern

**Difficulty:** Medium · **Type:** Failure · **Concepts:** distributed monolith

The orders, payments and shipping services all read and write the same `orders` table. Deploying a schema change requires releasing all three together. Name the problem and a fix.

<details>
<summary>Answer</summary>

A distributed monolith (shared database coupling). Give each service ownership of its own data; others access it only through the owning service's API or by consuming its events, so schema changes stay inside one service.

</details>

### P4. Trade-off statement

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** microservices costs

Write a two-sentence interview answer to "What do microservices cost?".

<details>
<summary>Answer</summary>

"Every in-process call becomes a network call that can be slow or fail, so we need timeouts, retries, circuit breakers and tracing, and we lose cross-service transactions, so consistency becomes eventual with sagas and events. We also pay in operations — many deployments, versioned APIs, service discovery and per-service monitoring — so the split must buy us independent scaling or team autonomy we actually need."

</details>
