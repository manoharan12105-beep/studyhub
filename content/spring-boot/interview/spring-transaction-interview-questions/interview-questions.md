# Transaction Interview Questions — Interview Questions

## Beginner

### Q1. Where do you put `@Transactional` in a layered application, and why?

**Style:** Why

<details>
<summary>Answer</summary>

On service methods: each represents one business use case whose repository calls must succeed or fail together. Controllers would hold connections during web work, and repository-level transactions alone would commit each call separately.

</details>

### Q2. What does a transaction manager do in Spring?

**Style:** Direct

<details>
<summary>Answer</summary>

It begins, commits and rolls back transactions for a resource and binds the resource (JDBC connection, JPA `EntityManager`) to the current thread, so all repository calls in the transaction share it. Boot auto-configures `JpaTransactionManager` or `JdbcTransactionManager`.

</details>

### Q3. Which exceptions cause rollback by default?

**Style:** Direct

<details>
<summary>Answer</summary>

`RuntimeException` and `Error` (and their subclasses). Checked exceptions commit unless `rollbackFor` (or a global `rollbackOn` setting) says otherwise.

</details>

## Intermediate

### Q4. List the reasons a `@Transactional` method can run without the transaction you expected.

**Style:** Why

<details>
<summary>Answer</summary>

It is applied by a proxy, so it is skipped for self-invocation, private methods, objects not created by Spring, and code running on other threads; and it commits when exceptions are caught inside the method or are checked. A wrong transaction manager (multiple data sources) is another cause.

</details>

### Q5. Explain REQUIRED vs REQUIRES_NEW with a real example.

**Style:** Scenario

<details>
<summary>Answer</summary>

Placing an order (REQUIRED) calls stock and payment services that join the same transaction — all or nothing. An audit log of "order attempted" uses REQUIRES_NEW so it commits even if the order transaction rolls back. REQUIRES_NEW suspends the outer transaction and uses a second connection.

</details>

### Q6. What is `UnexpectedRollbackException`?

**Style:** Debugging

<details>
<summary>Answer</summary>

Thrown when the outer method tries to commit a transaction that a participating inner method already marked rollback-only (it threw a runtime exception that the outer method caught). Spring rolls back and signals that the commit did not happen.

</details>

### Q7. What are dirty reads, non-repeatable reads and phantom reads?

**Style:** Direct

<details>
<summary>Answer</summary>

Dirty read: seeing another transaction's uncommitted data. Non-repeatable read: re-reading a row gives a different value because another transaction committed an update. Phantom read: re-running a query returns different rows because another transaction committed inserts/deletes.

</details>

### Q8. Does `@Transactional` prevent two users from buying the last item twice?

**Style:** Scenario

<details>
<summary>Answer</summary>

Not by itself: at READ COMMITTED both transactions can read stock = 1 and both decrement it (lost update). Use an atomic conditional update (`stock = stock - 1 where stock >= 1`), optimistic locking with `@Version` and retry, or a pessimistic lock, plus a `CHECK (stock >= 0)` constraint.

</details>

## Advanced

### Q9. How does `@Transactional` find the connection used by `JdbcTemplate` or a repository inside the method?

**Style:** How

<details>
<summary>Answer</summary>

The transaction manager binds the connection (and the `EntityManager`) to the current thread via `TransactionSynchronizationManager` when the transaction starts. `JdbcTemplate` obtains connections through `DataSourceUtils`, and the shared `EntityManager` proxy looks up the thread-bound one, so they all use the transaction's resources until commit/rollback unbinds them.

</details>

### Q10. Why should you not call a slow external API inside a transaction?

**Style:** Why

<details>
<summary>Answer</summary>

The transaction holds a pooled connection and possibly row locks for the whole call, reducing throughput and risking pool exhaustion and lock contention; and the external side effect is not rolled back if the transaction fails later. Call it outside the transaction and record results in short transactions (with idempotency keys and compensations).

</details>

### Q11. A method annotated `@Transactional(propagation = REQUIRES_NEW)` is called from the same class. What happens?

**Style:** Behavior

<details>
<summary>Answer</summary>

Nothing special: the call bypasses the proxy, so no new transaction is created; the code runs in the caller's transaction (or none). Move it to another bean or use `TransactionTemplate` with REQUIRES_NEW.

</details>

### Q12. What is the default isolation level, and when would you change it in Spring?

**Style:** Direct

<details>
<summary>Answer</summary>

`Isolation.DEFAULT` uses the database default — READ COMMITTED on PostgreSQL/Oracle/SQL Server, REPEATABLE READ on MySQL InnoDB. Raise it only for specific transactions that need a consistent snapshot (reports: REPEATABLE READ, read-only) or protection from write skew (SERIALIZABLE with retries); set it on the method that starts the transaction.

</details>

### Q13. How would you design retries for optimistic-lock failures together with `@Transactional`?

**Style:** How

<details>
<summary>Answer</summary>

Place the retry outside the transactional boundary so each attempt runs a new transaction with fresh data: e.g. a `@Retryable(includes = ObjectOptimisticLockingFailureException.class)` method on another bean that calls the `@Transactional` service method, or advice ordering where the retry interceptor wraps the transaction interceptor.

</details>

### Q14. Under load, every request hangs for 30 seconds in a service that calls a `REQUIRES_NEW` method. What is happening?

**Style:** Scenario

<details>
<summary>Answer</summary>

A connection-pool deadlock: each thread holds a connection for the outer transaction and waits for a second one for the inner transaction. When all pool connections are held by outer transactions, every thread waits for a free connection that never comes until Hikari's 30-second `connection-timeout` fails it. Fix by sizing the pool for two connections per such request, or by avoiding `REQUIRES_NEW` on hot paths.

</details>
