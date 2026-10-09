# Java and Spring Boot Debugging Scenarios — Practice

### P1. Which scenario?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** classification

The app fails at startup with `Schema validation: missing column [paid_at] in table [orders]`. Which scenario is this?

- A) NullPointerException
- B) Configuration error (entity and schema out of sync)
- C) Concurrency defect
- D) Broken endpoint

<details>
<summary>Answer</summary>

**Answer:** B) Configuration error (entity and schema out of sync)

`ddl-auto: validate` found an entity field with no column; a migration is missing.

</details>

### P2. Rollback rule

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** @Transactional

`create()` is `@Transactional`; `orders.save(...)` succeeds, then `toResponse` throws a `NullPointerException`. How many rows remain?

<details>
<summary>Answer</summary>

Zero: the unchecked exception rolls the transaction back, including the save. Without `@Transactional` (the starter), the verified count was one.

</details>

### P3. Don't edit V1

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** Flyway

Claude proposes adding `paid_at` to `V1__create_orders.sql` "since it's simpler". Why is that wrong, and what do you do?

<details>
<summary>Answer</summary>

V1 has already run on existing databases; Flyway won't rerun it, and its checksum changes so validation fails on those databases. Add `V2__add_paid_at.sql` with `ALTER TABLE orders ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;`. orderdesk's `protect-files.sh` hook blocks edits to existing migrations for this reason.

</details>

### P4. 404 for an existing order

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** handler mapping

`POST /api/orders/1/pay` returns 404 with `NoResourceFoundException: No static resource api/orders/1/pay`. Order 1 exists. What is the first thing you check?

<details>
<summary>Answer</summary>

Whether the running build has a handler for that path and method (the controller mappings / deployed version). "No static resource" means no controller matched and Spring fell through to static resource handling — the path or method is the problem, not the order.

</details>

### P5. One green run

**Difficulty:** Medium · **Type:** Trade-off · **Concepts:** concurrency testing

A teammate's fix for the counter passes a test that increments from 2 threads × 10 times. Is that convincing?

<details>
<summary>Answer</summary>

No. Lost updates are timing-dependent; tiny workloads rarely collide. Reproduce with many threads and iterations (the verified demo used 8 × 25,000 and lost about 65 % of updates with `HashMap`), assert on totals, and prefer structurally safe code (`ConcurrentHashMap.merge`, `LongAdder`, or an atomic database update).

</details>

### P6. Proxy surprise

**Difficulty:** Hard · **Type:** Failure diagnosis · **Concepts:** Spring proxies

A developer moves the save into a private helper `saveAndRespond()` annotated `@Transactional`, called from `create()` (which no longer has the annotation). The stored-row bug comes back. Why?

<details>
<summary>Answer</summary>

Spring applies `@Transactional` through a proxy around the bean. A call from `create()` to another method of the same object doesn't go through the proxy, so no transaction starts (and the method is private, which proxies don't intercept anyway). Put `@Transactional` on the public method called from outside, or move the logic to a separate bean.

</details>

### P7. Order the evidence

**Difficulty:** Hard · **Type:** Workflow design · **Concepts:** method

For "search results contain other customers' orders", list the evidence you collect, in order, before changing code.

<details>
<summary>Answer</summary>

1. The exact request and response (input that triggers it).
2. The SQL actually executed for that input (read the DAO, or log it locally).
3. A failing MockMvc test with stored rows that the injection would expose.
4. Other places using the same concatenation pattern (search the code).
Then fix with parameters, rerun the test and full build, and assess what data could have been exposed.

</details>
