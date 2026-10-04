# Connection Pooling and HikariCP — Practice

### P1. Default pool size

**Difficulty:** Easy · **Type:** MCQ

What is HikariCP's default `maximumPoolSize`?

- A) 5
- B) 10
- C) 50
- D) Unlimited

<details>
<summary>Answer</summary>

**Answer:** B) 10

</details>

### P2. Capacity planning

**Difficulty:** Medium · **Type:** Scenario

PostgreSQL allows 200 connections; 15 are reserved for admin tools and migrations. You run up to 8 pods. What is the maximum safe pool size per pod?

<details>
<summary>Answer</summary>

(200 − 15) / 8 = 23.1 → at most 23 per pod (and in practice fewer, since a smaller pool is often faster). If autoscaling may reach more pods, divide by the maximum pod count.

</details>

### P3. Slow endpoint

**Difficulty:** Hard · **Type:** Debugging

`/api/orders/{id}/invoice` takes 8 s because it calls a PDF service inside a `@Transactional` method. During peaks, unrelated endpoints time out waiting for connections. Explain and fix.

<details>
<summary>Answer</summary>

Each invoice request holds a database connection for the whole 8 s remote call, starving the pool. Load the data in a short read-only transaction, end it, then call the PDF service outside any transaction (or asynchronously), and record the result in a separate short transaction.

</details>
