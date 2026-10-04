# Debugging Transactions and JPA

**Module:** Debugging and Internal Behavior · **Interview priority:** Core

## How to Use This Topic

Each scenario: **Problem → Possible Causes → How to Diagnose → Fix → Prevention → Interview Explanation**. Background: [@Transactional](../../transactions/transactional-annotation/content.md), [Transactional Pitfalls](../../transactions/transactional-pitfalls/content.md), [Propagation](../../transactions/transaction-propagation/content.md), [Fetching and Lazy Loading](../../jpa-hibernate/fetching-and-lazy-loading/content.md), [N+1](../../jpa-hibernate/n-plus-one-problem/content.md).

Diagnostic toolbox for this whole topic:

```properties
logging.level.org.springframework.transaction.interceptor=TRACE   # "Getting transaction for [...]"
logging.level.org.springframework.orm.jpa.JpaTransactionManager=DEBUG
logging.level.org.hibernate.SQL=DEBUG                              # every SQL statement
logging.level.org.hibernate.orm.jdbc.bind=TRACE                    # bound parameters (dev only)
spring.jpa.properties.hibernate.generate_statistics=true          # per-session statement counts
```

## Why Is @Transactional Not Working?

### Problem

Partial data remains after a failure, or changes are not saved, as if there were no transaction.

### Possible Causes

1. **Self-invocation** — called via `this` from the same class.
2. **Private** (or `final`) method.
3. Object not a Spring bean (`new`), or called from `@PostConstruct`.
4. **Exception swallowed** inside the method → commit.
5. **Checked exception** → commit by default.
6. Wrong annotation import or **wrong transaction manager** (multiple data sources).
7. Work done on **another thread** (`@Async`, parallel streams).
8. Database/table without transactional support (MySQL MyISAM).
9. `readOnly = true` on a writing JPA method (changes not flushed).

### How to Diagnose

- Inside the method: `TransactionSynchronizationManager.isActualTransactionActive()`.
- Transaction TRACE logs: no "Getting transaction for [Class.method]" means no interception.
- Check the call path (who calls the method, through which reference).

### Fix

Call through another bean or annotate the entry point; make the method public on a bean; rethrow exceptions or `setRollbackOnly()`; `rollbackFor`; specify the manager; keep transactional work on the calling thread.

### Prevention

Integration tests that force a failure and assert rollback; lint/ArchUnit rules against `@Transactional` on private methods.

### Interview Explanation

"`@Transactional` works through a proxy, so it applies only to external calls on non-private methods of Spring beans, on the same thread, and rolls back only for unchecked exceptions that escape the method. When it 'doesn't work', one of those conditions is broken — most often self-invocation or a swallowed exception."

## Why Does a Transaction Roll Back Unexpectedly?

### Problem

The method returns normally, but nothing is saved and the caller gets `UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only` — or data disappears with no visible error.

### Possible Causes

1. An inner `@Transactional` (REQUIRED) method — including Spring Data repository methods — threw a runtime exception that the caller **caught**; the shared transaction was already marked rollback-only.
2. A runtime exception in a **synchronous event listener** that was caught.
3. A **flush-time** failure at commit (constraint violation, optimistic lock) after the method body finished.
4. Transaction **timeout** exceeded.
5. Test framework: `@Transactional` tests (`@DataJpaTest`) roll back by default at the end of each test.

### How to Diagnose

- Find the original exception in DEBUG logs (`JpaTransactionManager` logs "Participating transaction failed - marking existing transaction as rollback-only").
- Search for try/catch blocks around calls to transactional beans.
- Check whether the exception appears at commit (stack trace through `commit`/`flush`).

### Fix

Do not swallow exceptions from participating transactional calls; validate before calling instead of catching; make the inner call independent (`REQUIRES_NEW` or `noRollbackFor`) if its failure is acceptable; `saveAndFlush()` inside the `try` when you need to handle constraint violations; tune timeouts.

### Prevention

Avoid using exceptions for expected control flow inside transactions; use result objects for "soft" failures.

### Interview Explanation

"With REQUIRED propagation the inner and outer methods share one transaction. If the inner one throws, Spring marks the whole transaction rollback-only; catching the exception in the outer method doesn't undo that, so the commit becomes a rollback and Spring throws `UnexpectedRollbackException`."

## Why Does LazyInitializationException Occur?

### Problem

`LazyInitializationException: could not initialize proxy … - no session` or `failed to lazily initialize a collection of role …`.

### Possible Causes

1. A lazy association is accessed **after the transaction ended** — in the controller, during JSON serialisation, in a mapper outside the service transaction.
2. Entity passed to an **`@Async`** method or cached and used later.
3. `spring.jpa.open-in-view=false` (correct!) exposes code that relied on OSIV.
4. `toString()`/logging of entities outside the transaction.

### How to Diagnose

The stack trace shows where the access happened (controller, Jackson serializer, mapper). Check whether that code runs inside a `@Transactional` method.

### Fix

Fetch required associations in the query (`join fetch`, `@EntityGraph`), map to DTOs inside the transactional service, or use DTO projections. Do **not** switch to EAGER or enable `enable_lazy_load_no_trans`.

### Prevention

Return DTOs from services, keep OSIV disabled, write tests with OSIV disabled.

### Interview Explanation

"Lazy associations are loaded through the persistence context. After the transaction ends the entity is detached, so touching an uninitialised proxy fails. The fix is to load what the use case needs inside the transaction — fetch join or entity graph — and return DTOs."

## Why Is N+1 Happening?

### Problem

One request executes dozens or hundreds of similar SELECT statements; latency grows with the result size.

### Possible Causes

1. Lazy associations accessed in a loop (service, mapper, JSON serialisation).
2. **EAGER** `@ManyToOne`/`@OneToOne` mappings loaded through JPQL queries (one extra SELECT per row).
3. Open Session in View letting serialisation trigger lazy loads.
4. `toString`/`equals` touching associations.

### How to Diagnose

`org.hibernate.SQL=DEBUG` and look for repeated identical statements with different ids; Hibernate statistics (statement count per session); APM traces with many DB spans; a test asserting the query count.

### Fix

`JOIN FETCH`/`@EntityGraph` for the needed associations; `hibernate.default_batch_fetch_size` (e.g. 50) as a safety net; DTO projections for read endpoints; make to-one associations LAZY.

### Prevention

Query-count assertions in repository/service tests; code review of mappers; OSIV disabled.

### Interview Explanation

"JPA loads exactly what you ask for. A query loads N parents, and each lazy association touched in a loop issues its own SELECT. I detect it from SQL logs or statistics and fix it with a fetch join or entity graph, batch fetching, or a projection."

## Why Is a Query Unexpectedly Slow?

### Problem

An endpoint backed by a single query takes seconds, or got slower as data grew.

### Possible Causes

1. **Missing index** on filter/join/sort columns → full table scan.
2. Functions on indexed columns (`lower(email) = ?`, `cast`), leading-wildcard `LIKE '%term%'`.
3. **Deep offset pagination** (`OFFSET 500000`) or an expensive **count query** for `Page`.
4. Fetching too much: whole entities with large columns, collection fetch joins with pagination (in-memory paging), Cartesian products from multiple fetch joins.
5. N+1 disguised as "one slow request".
6. Lock waits (another transaction holds row locks), connection pool waits (`hikaricp.connections.pending`).
7. Stale statistics / bad plan; type mismatches preventing index use (comparing `varchar` with a numeric parameter).

### How to Diagnose

- Log the SQL and bound parameters; run **`EXPLAIN ANALYZE`** on the real database with real parameters.
- Check DB slow-query logs / `pg_stat_statements`, lock views, Hikari metrics.
- Measure separately: time waiting for a connection vs executing vs mapping.

### Fix

Add the right (composite) indexes; rewrite predicates to be index-friendly; keyset pagination or `Slice`; DTO projections; split fetches; fix lock contention (shorter transactions); refresh statistics.

### Prevention

Load tests with production-like data volumes; review execution plans for new queries; monitor slow queries.

### Interview Explanation

"I look at the actual SQL and its execution plan with `EXPLAIN ANALYZE`. Usual culprits are missing indexes, non-sargable predicates, deep offsets or count queries, fetching too much, or waiting — on locks or on the connection pool — rather than executing."

## Key Takeaways

- `@Transactional` failures = proxy conditions broken or exceptions not escaping.
- `UnexpectedRollbackException` = caught failure in a shared REQUIRED transaction.
- `LazyInitializationException` = access after the session closed; fetch in the query, return DTOs.
- N+1 and slow queries = read the SQL, count statements, `EXPLAIN ANALYZE`, then fetch plans, indexes and pagination strategy.
