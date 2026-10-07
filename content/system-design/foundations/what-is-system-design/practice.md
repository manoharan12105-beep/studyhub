# What Is System Design? — Practice

### P1. Definition

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** system design

Which statement best describes system design?

- A) Writing the fastest possible algorithm for each feature
- B) Choosing components and how they connect so the system meets its goals as it grows
- C) Drawing UML class diagrams for every class
- D) Picking the newest technologies available

<details>
<summary>Answer</summary>

**Answer:** B) Choosing components and how they connect so the system meets its goals as it grows

Algorithms and class diagrams belong to low-level design; technology choice is only a means to an end.

</details>

### P2. Waiting time

**Difficulty:** Easy · **Type:** Estimation · **Concepts:** throughput, queues

One counter serves each customer in 3 minutes. Ten customers arrive at the same moment. How long does the 10th customer wait before being served, and how long until they leave?

<details>
<summary>Answer</summary>

They wait for the 9 people ahead: 9 × 3 = **27 minutes**, then are served for 3 minutes and leave after **30 minutes**. A second counter roughly halves the wait, which is why adding servers (horizontal scaling) reduces queueing.

</details>

### P3. Single point of failure

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** single point of failure

A startup runs its web app, PostgreSQL database and uploaded images on one virtual machine. Which event takes everything down?

- A) A spike of 2× normal traffic for one minute
- B) The machine's disk fails
- C) A user uploads a large image
- D) A slow SQL query

<details>
<summary>Answer</summary>

**Answer:** B) The machine's disk fails

The machine is a single point of failure: the application, the data and the files all depend on it.

</details>

### P4. Order of fixes

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** scaling order

An API's latency rises as users grow. In what order would you consider: (a) adding servers behind a load balancer, (b) fixing a missing index on the hottest query, (c) moving to a larger machine? Explain.

<details>
<summary>Answer</summary>

**(b) → (c) → (a).** Make the work cheaper first: a missing index can cut a query from seconds to milliseconds at no cost. Then a bigger machine buys time with no code or architecture change. Add servers when one machine is not enough or one machine is too risky, because horizontal scaling requires a load balancer, stateless servers and shared data.

</details>

### P5. New failure modes

**Difficulty:** Medium · **Type:** Failure · **Concepts:** trade-offs

For each change, name one failure mode it introduces: (a) a Redis cache in front of the database, (b) a read replica, (c) a load balancer.

<details>
<summary>Answer</summary>

(a) Stale data, or a stampede of database queries when the cache is empty or restarts. (b) Replication lag: reads from the replica may miss recent writes. (c) The load balancer is a new single point of failure unless it is redundant, and a wrong health-check setting can remove healthy servers.

</details>
