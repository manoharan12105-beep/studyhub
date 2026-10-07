# Clarifying Requirements — Practice

### P1. First move

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** clarification

The prompt is "Design a ride-hailing app". What is the best first step?

- A) Draw the microservices
- B) Choose between PostgreSQL and Cassandra
- C) Ask about scale, core features, latency and consistency needs
- D) Estimate the number of Kafka partitions

<details>
<summary>Answer</summary>

**Answer:** C) Ask about scale, core features, latency and consistency needs

Every later choice depends on these answers.

</details>

### P2. Read or write heavy?

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** read/write ratio

Classify as read-heavy or write-heavy: (a) URL shortener redirects, (b) IoT temperature sensors reporting every second, (c) news website, (d) application log collection.

<details>
<summary>Answer</summary>

(a) Read-heavy, (b) write-heavy, (c) read-heavy, (d) write-heavy.

</details>

### P3. Turn answers into decisions

**Difficulty:** Medium · **Type:** Design · **Concepts:** requirements to design

A food-delivery app tells you: order placement must never be lost; restaurant menus change rarely and are read constantly; the delivery map must update every few seconds. Give one design decision for each.

<details>
<summary>Answer</summary>

Orders: write to a durable, replicated relational database inside a transaction, with an idempotency key so retries do not create duplicates. Menus: cache aggressively (and serve images from a CDN) with a TTL or invalidation on edit. Map updates: push location updates over WebSockets (or poll every few seconds), store only the latest position in a fast key-value store, and accept slight staleness.

</details>

### P4. Assumption under silence

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** stating assumptions

The interviewer says "you decide" when you ask about traffic for a URL shortener. Write the assumption you would state and one consequence.

<details>
<summary>Answer</summary>

For example: "I'll assume 100 million new links per month and a 100:1 read-to-write ratio." Consequence: about 40 writes/s and about 4,000 redirects/s on average, so redirects dominate — I'll cache hot short codes and serve redirects from stateless servers behind a load balancer.

</details>
