# Dirty Checking, Flush, save() and saveAndFlush() — Interview Questions

## Beginner

### Q1. What is dirty checking?

<details>
<summary>Answer</summary>

Hibernate's automatic detection of changes to managed entities. When an entity is loaded, a snapshot of its state is kept; at flush time Hibernate compares the current state with the snapshot and issues UPDATE statements for modified entities. That is why changing a managed entity inside a transaction updates the database without calling `save()`.

</details>

### Q2. What is the difference between `save()` and `saveAndFlush()`?

<details>
<summary>Answer</summary>

`save()` makes the entity managed (persist for new entities, merge otherwise); SQL is sent later at flush or commit. `saveAndFlush()` does the same and then flushes the persistence context immediately, so pending SQL — for all entities, not only this one — executes at that point. Neither commits the transaction.

</details>

### Q3. What is flushing, and how is it different from committing?

<details>
<summary>Answer</summary>

Flushing sends pending INSERT/UPDATE/DELETE statements to the database within the current transaction. Committing ends the transaction and makes the changes durable and visible to others. After a flush, a rollback still undoes everything.

</details>

## Intermediate

### Q4. When does Hibernate flush automatically?

<details>
<summary>Answer</summary>

In the default AUTO mode: before commit; before executing a JPQL/Criteria query that involves tables with pending changes; before native queries executed via the `EntityManager`; and immediately at `persist` when the id uses `IDENTITY` generation. Explicit `flush()`/`saveAndFlush()` also flush.

</details>

### Q5. How does Spring Data's `save()` decide between `persist` and `merge`?

<details>
<summary>Answer</summary>

Through `isNew`: if the entity has a `@Version` attribute of a wrapper type, it is new when that is null; otherwise when the id is null (or 0 for primitives); or by `Persistable.isNew()` if implemented. New → `persist` (returns the same instance); not new → `merge` (returns a managed copy).

</details>

### Q6. What does `@Transactional(readOnly = true)` change for JPA?

<details>
<summary>Answer</summary>

Spring sets the Hibernate session to read-only and the flush mode to MANUAL, so no dirty checking or flush happens at commit — saving CPU and memory (snapshots can be skipped) and preventing accidental writes. It can also route to a read replica with a routing data source and hints the JDBC driver. It does not stop explicit native updates.

</details>

## Advanced

### Q7. Why does saving an entity with a manually assigned UUID cause an extra SELECT?

<details>
<summary>Answer</summary>

With a non-null id and no version attribute, Spring Data considers the entity not new and calls `merge`, which must load the row to decide whether to update or insert. Fix: add a `@Version` field (null on new entities), or implement `Persistable<UUID>` with an `isNew` flag set to false after persist/load (e.g. via `@PostPersist`/`@PostLoad`).

</details>

### Q8. A `try { repo.save(user); } catch (DataIntegrityViolationException e) { … }` never catches duplicate emails; the exception appears later. Why?

<details>
<summary>Answer</summary>

`save()` only schedules the INSERT (unless the id is `IDENTITY`); the constraint violation is raised at flush, typically at commit after the method returns, outside the `try`. Use `saveAndFlush()` inside the `try`, or handle the exception at the caller or globally (409). Also note that after a failed flush the transaction is marked rollback-only.

</details>

### Q9. What is `@DynamicUpdate` and when is it useful?

<details>
<summary>Answer</summary>

A Hibernate annotation that generates UPDATE statements containing only the changed columns instead of all columns. Useful for wide tables, columns with large values, or reducing conflicts with triggers/column-level locking. The trade-off is that statements cannot be precomputed and cached, and batching identical statements is less effective.

</details>
