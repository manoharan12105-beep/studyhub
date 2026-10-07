# What Is System Design? — Interview Questions

## Beginner

### Q1. What is a system, and what is system design?

**Style:** Direct

<details>
<summary>Answer</summary>

A system is a set of components working together toward a common goal. System design is choosing those components (servers, databases, caches, queues, load balancers), deciding where each lives and how they communicate, so the system meets both its functional goal and its quality goals (scale, latency, availability, cost) as load and data grow.

</details>

### Q2. Why can't we just run a working application on one big server forever?

**Style:** Why

<details>
<summary>Answer</summary>

Three reasons. Capacity: one machine has a ceiling of CPU, memory, disk and network, and the biggest machines cost disproportionately more. Availability: if that machine fails, everything is down; it is a single point of failure. Geography: one machine is far from most users, so latency is high for them. Past a point you need several machines, which brings load balancing, shared data and consistency problems.

</details>

### Q3. What is a single point of failure? Give an example.

**Style:** Direct

<details>
<summary>Answer</summary>

A component whose failure alone takes the whole system down. Example: one server holding the application, the database and the uploaded files; its disk dies and both the service and the data are gone. Fixes add redundancy: several app servers behind a load balancer, a database replica, files in replicated object storage, and a redundant load balancer.

</details>

## Intermediate

### Q4. A product on one server goes from 100 to 10,000 daily users and slows down. Walk through the problems you expect and their fixes, in order.

**Style:** Scenario

<details>
<summary>Answer</summary>

1. CPU and memory saturate, so latency climbs: first check for cheap wins (slow queries, missing indexes), then scale vertically, then add app servers behind a load balancer.
2. Adding servers exposes in-memory sessions: move them to a shared store so servers are stateless.
3. The database becomes the hot spot as every server queries it: add indexes, then a cache for popular reads.
4. The single machine holding data is a single point of failure: add a replica and move files to object storage, and keep backups.

The order follows the principle "make the work cheaper, then the machine bigger, then add machines", because each step adds complexity.

</details>

### Q5. "Every fix creates a new problem." Explain with three examples.

**Style:** Trade-off

<details>
<summary>Answer</summary>

Adding a load balancer spreads traffic but the balancer itself can fail, so it needs redundancy. Adding a cache cuts database load but can serve stale data, so you need TTLs or invalidation. Adding a read replica spreads reads but replicas lag, so a user may not see their own write. A strong design names each new failure mode and how it is handled.

</details>

### Q6. Why do system design interviews focus on trade-offs rather than one correct architecture?

**Style:** Why

<details>
<summary>Answer</summary>

Because there is rarely one correct architecture: the right design depends on requirements such as scale, read/write mix, consistency needs, latency and budget. Interviewers want to see that you derive components from requirements, compare options, state costs and failure modes, and adapt when requirements change. A memorised diagram without reasons shows none of that.

</details>

## Advanced

### Q7. Map each step of growing a bank (faster cashier, bigger desk, second counter, shared ledger, greeter) to a system design concept, and name the problem each step created.

**Style:** Follow-up

<details>
<summary>Answer</summary>

- Faster cashier → optimising the code (better algorithms, queries). Limited by how fast one person can work.
- Bigger desk and counting machine → vertical scaling. Has a ceiling and keeps one point of failure.
- Second counter → horizontal scaling. Created inconsistent records because each counter kept its own ledger.
- Shared ledger → a central (or distributed) database. Left load uneven because customers queued at the nearest counter.
- Greeter → a load balancer with health checks. Now the greeter is a single point of failure unless there are two.

</details>

### Q8. The team proposes ten microservices, Kafka and three databases for a product with 500 users. How do you respond?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Ask what requirement each component serves. At 500 users a single application with one relational database, backups and perhaps a replica meets the needs at a fraction of the cost and operational effort. Each extra component adds network calls that can fail, more deployments, more monitoring and harder debugging. Keep the design simple, keep modules cleanly separated so parts can be split out later, and add components when a measured requirement (load, team size, isolation) demands them.

</details>
