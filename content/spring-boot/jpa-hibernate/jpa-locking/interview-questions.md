# Optimistic and Pessimistic Locking — Interview Questions

## Beginner

### Q1. What is the difference between optimistic and pessimistic locking?

<details>
<summary>Answer</summary>

Optimistic locking takes no locks; it stores a version per row and makes each UPDATE conditional on the version read earlier, failing with an exception if someone else changed the row. Pessimistic locking locks the row in the database when reading (`SELECT … FOR UPDATE`), so other transactions wait. Optimistic suits low contention; pessimistic suits hot rows with frequent conflicts.

</details>

### Q2. How do you enable optimistic locking in JPA?

<details>
<summary>Answer</summary>

Add a `@Version` field (`long`, `Integer`, `Instant`…) to the entity. Hibernate increments it on each update and adds `AND version = ?` to the WHERE clause; a stale update throws `OptimisticLockException`, translated by Spring to `ObjectOptimisticLockingFailureException`.

</details>

### Q3. What is a lost update?

<details>
<summary>Answer</summary>

Two transactions read the same value, both modify it in memory and write it back; the second write overwrites the first, so one change disappears without any error. It occurs under the default READ COMMITTED isolation when using read-modify-write logic.

</details>

## Intermediate

### Q4. How would you handle an optimistic locking failure?

<details>
<summary>Answer</summary>

For automated operations (stock decrement, counters), retry the whole transaction a few times with a short backoff — from outside the failed transaction, because it is rollback-only. For user edits, return 409 Conflict (or 412 with ETags) and let the user reload and re-apply their change.

</details>

### Q5. How do you apply a pessimistic lock with Spring Data JPA?

<details>
<summary>Answer</summary>

Annotate a repository method with `@Lock(LockModeType.PESSIMISTIC_WRITE)` (or `PESSIMISTIC_READ`), call it inside a `@Transactional` method, and keep that transaction short. Add a lock timeout hint (`jakarta.persistence.lock.timeout`) and lock rows in a consistent order to avoid deadlocks.

</details>

### Q6. Why doesn't `synchronized` on the service method prevent overselling?

<details>
<summary>Answer</summary>

It only serialises threads within one JVM. With several instances behind a load balancer, or other processes writing to the same database, requests still race. Also the lock is released when the method returns, possibly before the transaction commits. Concurrency control must happen in the database (versions, row locks, atomic updates, constraints).

</details>

## Advanced

### Q7. How would you handle concurrent stock updates during a flash sale?

<details>
<summary>Answer</summary>

Use an atomic conditional update (`update product set stock = stock - :q where id = :id and stock >= :q`) and treat 0 updated rows as "sold out", backed by a `CHECK (stock >= 0)` constraint. Optimistic locking would cause a storm of retries on the hot row; pessimistic locking serialises buyers but holds locks. At very high scale, reserve stock in Redis (atomic `DECR`) or a queue and reconcile with the database asynchronously.

</details>

### Q8. Why is an optimistic lock exception sometimes thrown only at commit, and what does that mean for error handling?

<details>
<summary>Answer</summary>

The version check runs when the UPDATE is executed — at flush, which usually happens at commit after the service method's code finished. A `try/catch` inside the method does not see it. Handle it at the caller (around the transactional boundary) or flush explicitly inside the method if you need to react there.

</details>

### Q9. What is `SKIP LOCKED` used for?

<details>
<summary>Answer</summary>

`SELECT … FOR UPDATE SKIP LOCKED` locks the selected rows but skips rows already locked by others instead of waiting. Several workers can poll the same job table and each claims different jobs without blocking — a common way to build a database-backed queue or outbox processor.

</details>
