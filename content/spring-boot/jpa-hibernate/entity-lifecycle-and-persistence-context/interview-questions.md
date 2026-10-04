# Entity Lifecycle and the Persistence Context — Interview Questions

## Beginner

### Q1. What are the entity lifecycle states in JPA?

<details>
<summary>Answer</summary>

Transient (new object not associated with a persistence context), managed (associated with an open persistence context; changes are tracked and flushed), detached (has an identity but its persistence context is closed or it was evicted; changes are not tracked) and removed (scheduled for deletion at flush).

</details>

### Q2. What is the persistence context?

<details>
<summary>Answer</summary>

The set of managed entity instances belonging to an `EntityManager`. It guarantees one Java object per database row within its scope, acts as a first-level cache, records original snapshots for dirty checking, and queues SQL until flush. In Spring it lives for the duration of a transaction.

</details>

### Q3. What is the difference between `persist` and `merge`?

<details>
<summary>Answer</summary>

`persist` makes the passed (new) instance itself managed and schedules an INSERT; it fails for detached instances. `merge` copies the state of the passed (detached or new) instance onto a managed instance — loading it first if needed — and returns that managed instance; the argument remains detached.

</details>

## Intermediate

### Q4. What is the first-level cache?

<details>
<summary>Answer</summary>

The persistence context acting as a cache: `find` for an id already loaded returns the same object without SQL. It is mandatory, per `EntityManager` (per transaction in Spring), and not shared between transactions or threads, so it does not reduce load across requests — that would be the optional second-level cache.

</details>

### Q5. What is the difference between `find` and `getReference`?

<details>
<summary>Answer</summary>

`find` returns the actual entity (from the context or by selecting it), or `null` if it does not exist. `getReference` returns a proxy without querying; the SELECT runs on first access of a non-id property, and if the row is missing, an `EntityNotFoundException` is thrown then. `getReference` (Spring Data `getReferenceById`) is useful for setting foreign keys without loading the target: `order.setCustomer(customerRepository.getReferenceById(7L))`.

</details>

### Q6. Why does modifying an entity returned by a service method not update the database?

<details>
<summary>Answer</summary>

When the `@Transactional` service method returns, the transaction commits and the persistence context closes, so the entity becomes detached. Changes to detached entities are not tracked. Perform the modification inside a transactional method that loads the entity, or merge the detached object in a new transaction.

</details>

## Advanced

### Q7. In Spring, how can a singleton service safely hold an `EntityManager` field when persistence contexts are per transaction?

<details>
<summary>Answer</summary>

`@PersistenceContext` injects a shared, thread-safe proxy (created by `SharedEntityManagerCreator`). Each call on it looks up the `EntityManager` bound to the current thread's transaction through `TransactionSynchronizationManager` (or creates a temporary one if there is no transaction). So the field is shared, but the underlying persistence contexts are not.

</details>

### Q8. What is the second-level cache, and when would you use it?

<details>
<summary>Answer</summary>

A Hibernate cache shared by all sessions of an `EntityManagerFactory`, backed by a provider such as Ehcache/Caffeine (JCache) or Infinispan, enabled per entity (`@Cacheable`/`@Cache`) with concurrency strategies (read-only, read-write…). Use it for read-mostly reference data loaded by id. Avoid it for frequently updated data, and in multi-instance deployments use a clustered/invalidating provider, or the caches will serve stale data.

</details>

### Q9. A batch job processing 1 million rows in one transaction runs out of memory. Why, and how do you fix it?

<details>
<summary>Answer</summary>

Every loaded entity stays managed in the persistence context with its snapshot, so memory grows with each row and dirty checking at flush becomes slower. Process in chunks: `flush()` and `clear()` the `EntityManager` every N entities (matching the JDBC batch size), or use smaller transactions per chunk, stream with a read-only query, or use bulk SQL/JPQL updates where possible.

</details>
