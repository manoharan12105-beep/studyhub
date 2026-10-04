# Transaction Propagation — Interview Questions

## Beginner

### Q1. What is transaction propagation?

<details>
<summary>Answer</summary>

The rule that decides how a transactional method behaves when called with or without an existing transaction — join it, start a new one, suspend it, run without one, use a savepoint, or throw. It is configured with `@Transactional(propagation = …)`; the default is `REQUIRED`.

</details>

### Q2. What is the difference between REQUIRED and REQUIRES_NEW?

<details>
<summary>Answer</summary>

REQUIRED joins the caller's transaction (or starts one if there is none), so both commit or roll back together. REQUIRES_NEW suspends the caller's transaction and runs in a new, independent one with its own connection; its commit or rollback does not depend on the outer transaction.

</details>

### Q3. When would you use REQUIRES_NEW?

<details>
<summary>Answer</summary>

For records that must persist even if the main operation fails: audit logs, login-failure counters, payment attempt records, or allocating unique numbers. Use it sparingly because each use needs a second connection while the first is held.

</details>

## Intermediate

### Q4. What does `UnexpectedRollbackException` mean?

<details>
<summary>Answer</summary>

"Transaction silently rolled back because it has been marked as rollback-only." An inner method participating in the same (REQUIRED) transaction threw a rollback-triggering exception, which marked the shared transaction rollback-only; the outer method caught the exception and tried to commit. Spring rolls back and throws this exception so the caller knows the commit did not happen. Fix: don't swallow the exception, or make the inner work independent (REQUIRES_NEW/NESTED) if its failure is acceptable.

</details>

### Q5. Explain MANDATORY, NEVER, SUPPORTS and NOT_SUPPORTED.

<details>
<summary>Answer</summary>

MANDATORY requires an existing transaction and throws otherwise. NEVER requires that there is none and throws otherwise. SUPPORTS joins a transaction if present, otherwise runs non-transactionally. NOT_SUPPORTED suspends any existing transaction and always runs non-transactionally.

</details>

### Q6. What is NESTED propagation and how does it differ from REQUIRES_NEW?

<details>
<summary>Answer</summary>

NESTED creates a savepoint in the existing transaction: a failure rolls back to the savepoint while the outer transaction continues, but if the outer transaction rolls back, the nested work is lost too. REQUIRES_NEW is a separate transaction whose commit survives an outer rollback. NESTED uses one connection and needs savepoint support (JDBC transaction managers); `JpaTransactionManager` disables it by default.

</details>

## Advanced

### Q7. How can REQUIRES_NEW deadlock an application under load?

<details>
<summary>Answer</summary>

Each request holds one pooled connection for its outer transaction and requests a second for the REQUIRES_NEW call. If the pool size is N and N requests are in their outer transactions at once, all connections are taken and every thread waits for a second connection that never becomes free — a pool deadlock until timeouts fire. Size pools with this in mind, avoid REQUIRES_NEW on hot paths, or restructure (e.g. write the audit after the main transaction).

</details>

### Q8. A REQUIRES_NEW method in the same class does not create a new transaction. Why?

<details>
<summary>Answer</summary>

Propagation is applied by the transactional proxy. A call through `this` bypasses the proxy, so the annotation is ignored and the code simply runs in the caller's transaction. Move the method to a separate bean, or use `TransactionTemplate` with `PROPAGATION_REQUIRES_NEW`.

</details>

### Q9. Can the REQUIRES_NEW transaction read rows inserted by the outer transaction?

<details>
<summary>Answer</summary>

Not if they are uncommitted: it runs on a different connection, and under READ COMMITTED or stronger isolation it only sees committed data. It may even block if it tries to update rows the suspended outer transaction has locked — another deadlock source.

</details>
