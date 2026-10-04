# @Async and @Scheduled — Practice

### P1. Return types

**Difficulty:** Easy · **Type:** MCQ

Which return type lets the caller obtain the result of an `@Async` method?

- A) `String`
- B) `CompletableFuture<String>`
- C) `Optional<String>`
- D) `List<String>`

<details>
<summary>Answer</summary>

**Answer:** B) `CompletableFuture<String>`

</details>

### P2. Jobs delayed

**Difficulty:** Medium · **Type:** Debugging

A nightly report job takes 40 minutes; during that time, a `fixedRate = 60_000` heartbeat job does not run. Why?

<details>
<summary>Answer</summary>

Spring Boot's default scheduler has one thread (`spring.task.scheduling.pool.size=1`), so the long job blocks all other scheduled methods. Increase the pool size or have the report job delegate its work to an async executor.

</details>

### P3. Duplicate emails

**Difficulty:** Medium · **Type:** Scenario

A daily "abandoned cart" email job sends each customer three emails after scaling to three pods. How do you fix it?

<details>
<summary>Answer</summary>

Ensure only one instance runs the job: add ShedLock (`@SchedulerLock(name = "abandonedCartEmails", lockAtMostFor = "PT30M")` with a JDBC/Redis lock provider), or move it to a Kubernetes CronJob. Also make the job idempotent by recording which carts were emailed.

</details>
