# Connection Pooling and Database Bottlenecks — Practice

### P1. Little's law

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** pool sizing

A service runs 800 queries/s with an average duration of 10 ms. How many connections are busy on average?

<details>
<summary>Answer</summary>

800 × 0.010 = **8 connections**. A pool of about 12–16 leaves headroom for spikes.

</details>

### P2. Diagnose

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** pool exhaustion

Database CPU is 15 %, but requests time out waiting for a connection. Which is the most likely cause?

- A) The database needs more CPU cores
- B) Connections are held for a long time, for example while calling a slow external API inside a transaction
- C) The network is too fast
- D) The pool is too large

<details>
<summary>Answer</summary>

**Answer:** B) Connections are held for a long time, for example while calling a slow external API inside a transaction

</details>

### P3. Budget

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** connection budget

The database supports 400 connections; keep 50 in reserve. Each instance's pool is 15. How many instances can autoscaling add before exceeding the budget, and what changes if PgBouncer multiplexes clients onto 100 server connections?

<details>
<summary>Answer</summary>

(400 − 50) ÷ 15 = 23.3 → **23 instances**. With PgBouncer in transaction-pooling mode, instances connect to PgBouncer (which accepts thousands of client connections) and the database sees at most 100 server connections, so instance count is no longer limited by `max_connections`.

</details>

### P4. N+1

**Difficulty:** Medium · **Type:** Design · **Concepts:** batching

A page shows 50 orders and, for each, the customer's name. It runs 51 queries. Rewrite the data access.

<details>
<summary>Answer</summary>

Fetch the 50 orders, collect their distinct customer IDs, and load all customers in one query (`SELECT id, name FROM customers WHERE id IN (…)`), or join orders and customers in a single query: 1–2 queries instead of 51.

</details>
