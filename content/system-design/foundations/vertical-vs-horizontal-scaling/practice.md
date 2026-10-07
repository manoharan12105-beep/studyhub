# Vertical vs Horizontal Scaling — Practice

### P1. Which is vertical?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** scaling types

Which change is vertical scaling?

- A) Adding three more web servers behind the load balancer
- B) Moving the database from 16 GB to 128 GB of RAM
- C) Splitting users across four database shards
- D) Adding two read replicas

<details>
<summary>Answer</summary>

**Answer:** B) Moving the database from 16 GB to 128 GB of RAM

The others add machines (horizontal).

</details>

### P2. Failure impact

**Difficulty:** Easy · **Type:** Failure · **Concepts:** redundancy

System A runs on one 64-core server. System B runs on eight 8-core servers behind a load balancer. One machine fails in each. What capacity remains?

<details>
<summary>Answer</summary>

A: 0 % — the whole system is down. B: 7/8 = 87.5 % of capacity remains, and the load balancer stops sending traffic to the failed server.

</details>

### P3. What has to change

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** prerequisites for scale-out

An app stores user sessions in server memory and uploaded files on the server's local disk. List what must change before you can add a second server.

<details>
<summary>Answer</summary>

Move sessions to a shared store (Redis) or use signed tokens; move uploads to object storage (or a shared file service); put a load balancer in front; make sure scheduled jobs do not run twice (or run them in one place); and ensure configuration does not depend on one host. The servers must become interchangeable.

</details>

### P4. Choose the approach

**Difficulty:** Medium · **Type:** Trade-off · **Concepts:** when to scale up

A PostgreSQL primary is at 80 % CPU and the next machine size is available at 2× the cost. Sharding would take three months of work. What do you recommend now and later?

<details>
<summary>Answer</summary>

Now: scale up (and look for expensive queries, missing indexes and reads that could move to replicas or a cache) — it buys time immediately with no code change. Later: plan read replicas and caching first; shard only if write load or data size will exceed the largest practical machine.

</details>
