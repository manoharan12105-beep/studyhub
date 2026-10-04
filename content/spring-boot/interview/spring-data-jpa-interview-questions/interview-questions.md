# Spring Data JPA and Hibernate Interview Questions — Interview Questions

## Beginner

### Q1. Explain JPA, Hibernate and Spring Data JPA in one sentence each.

**Style:** Comparison

<details>
<summary>Answer</summary>

JPA is the Jakarta specification for object-relational mapping (annotations, `EntityManager`, JPQL); Hibernate is the library that implements it and generates the SQL; Spring Data JPA generates repository implementations on top of the JPA `EntityManager`.

</details>

### Q2. What is an entity and what does it need?

**Style:** Direct

<details>
<summary>Answer</summary>

A class mapped to a table, annotated `@Entity`, with an `@Id`, a no-arg constructor (public or protected) and not final, so Hibernate can instantiate and proxy it.

</details>

### Q3. What does `JpaRepository` add over `CrudRepository`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`CrudRepository` provides basic CRUD. `JpaRepository` adds paging and sorting (via `ListPagingAndSortingRepository`), list-returning variants, JPA-specific operations such as `flush`, `saveAndFlush`, `saveAllAndFlush`, `deleteAllInBatch`, and `getReferenceById`.

</details>

### Q4. What is the difference between `findById` and `getReferenceById`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`findById` queries (or uses the persistence context) and returns `Optional` with the real entity or empty. `getReferenceById` returns a lazy proxy without querying; accessing a non-id field triggers the SELECT and throws `EntityNotFoundException` if the row does not exist. Use the reference to set foreign keys cheaply.

</details>

## Intermediate

### Q5. Why did my entity get updated without calling `save()`?

**Style:** Why

<details>
<summary>Answer</summary>

It was managed in an open transaction. Hibernate snapshots managed entities when loading them and, at flush/commit, compares current state with the snapshot (dirty checking) and issues UPDATEs for changes — no `save()` needed.

</details>

### Q6. A reviewer says "JPA should optimise this loop for us." Why is that wrong for N+1?

**Style:** Why

<details>
<summary>Answer</summary>

JPA does exactly what the mapping and query say: a query loads the parents; each lazy association accessed later (in a loop, a mapper or JSON serialisation) is loaded with its own SELECT. EAGER mappings also produce extra SELECTs for JPQL results. The query plan must explicitly fetch what the use case needs (fetch join, entity graph, batch fetching, projection).

</details>

### Q7. What is the owning side of a relationship and why does it matter?

**Style:** Why

<details>
<summary>Answer</summary>

The side without `mappedBy` — for one-to-many/many-to-one, the `@ManyToOne` side — controls the foreign key. Hibernate writes the relationship only from it, so adding a child only to the parent's collection leaves the foreign key null. Helper methods keep both sides in sync.

</details>

### Q8. When does Hibernate execute the SQL for `save()`?

**Style:** Behavior

<details>
<summary>Answer</summary>

Usually at flush — before commit, before a query that touches the affected tables, or on an explicit `flush()`/`saveAndFlush()`. With `IDENTITY` ids, the INSERT runs immediately at persist because Hibernate needs the generated key. `save()` on a non-new entity performs a `merge`, which may SELECT first.

</details>

### Q9. JPQL or native query — how do you choose?

**Style:** Comparison

<details>
<summary>Answer</summary>

JPQL by default: portable, validated at startup, entity-aware (fetch joins, constructor expressions). Native SQL when you need database-specific features (window functions, JSON operators, `FOR UPDATE SKIP LOCKED`, full-text search) or hand-tuned SQL, accepting runtime-only validation and dialect lock-in.

</details>

### Q10. A line removed from `order.getLines()` stays in the database. Which setting is missing, and how does it differ from `CascadeType.REMOVE`?

**Style:** Scenario

<details>
<summary>Answer</summary>

`orphanRemoval = true` is missing. `REMOVE` deletes children only when the parent is deleted; `orphanRemoval` also deletes a child as soon as it is removed from the parent's collection (or replaced in a one-to-one). Compositions often use `cascade = ALL, orphanRemoval = true`.

</details>

### Q11. How do you load an order with its items and products in one query, for a single order?

**Style:** How

<details>
<summary>Answer</summary>

`@EntityGraph(attributePaths = {"items", "items.product"}) Optional<Order> findWithItemsById(Long id)` or JPQL `select o from Order o join fetch o.items i join fetch i.product where o.id = :id`. For pages of orders, page the orders first and batch-fetch items.

</details>

## Advanced

### Q12. What happens if you modify a detached entity and call `save()`?

**Style:** Behavior

<details>
<summary>Answer</summary>

Spring Data sees a non-null id and calls `merge`: Hibernate loads the current row (SELECT), copies **all** fields of the detached object onto the managed instance (including fields the client did not intend to change — possibly nulls) and returns the managed copy; the UPDATE runs at commit. Without `@Version`, concurrent changes are silently overwritten.

</details>

### Q13. How would you prevent two users from overwriting each other's product edits?

**Style:** Scenario

<details>
<summary>Answer</summary>

Add `@Version` to the entity, include the version in the DTO/ETag, and on update compare it (or let Hibernate's version check fail). The second update gets `ObjectOptimisticLockingFailureException`, mapped to 409 (or 412 with `If-Match`), and the user reloads.

</details>

### Q14. Why does Hibernate warn "firstResult/maxResults specified with collection fetch; applying in memory"?

**Style:** Debugging

<details>
<summary>Answer</summary>

A paged query fetch-joins a collection, so SQL rows are per child, not per parent, and SQL `LIMIT` cannot be applied correctly. Hibernate loads all rows and pages in memory — dangerous for large data. Page parent ids first, then fetch collections for those ids, or use batch fetching.

</details>

### Q15. Why is `GenerationType.IDENTITY` bad for bulk inserts?

**Style:** Why

<details>
<summary>Answer</summary>

Hibernate needs the id at `persist()`, which IDENTITY only provides after executing the INSERT, so each insert runs immediately and JDBC batching is disabled. `SEQUENCE` with a pooled allocation size lets Hibernate assign ids in memory and batch inserts.

</details>

### Q16. What does `@Transactional(readOnly = true)` change for Hibernate?

**Style:** Behavior

<details>
<summary>Answer</summary>

Spring sets the session to read-only and flush mode to MANUAL: no dirty-checking snapshots or flushes, so less memory and CPU, and accidental modifications are not written. The JDBC connection is also marked read-only, which drivers or routing data sources can use.

</details>

### Q17. A report job loads 2 million rows and the JVM runs out of memory. What do you change?

**Style:** Scenario

<details>
<summary>Answer</summary>

Avoid keeping millions of managed entities in one persistence context: use projections, stream results (`Stream<T>` with a fetch size inside a read-only transaction) or keyset-paginate in chunks, and `clear()` the persistence context per chunk. For pure exports, use `JdbcTemplate` row callbacks or database-side export.

</details>

### Q18. How do Spring Data derived queries get their implementation?

**Style:** How

<details>
<summary>Answer</summary>

At startup, Spring Data creates a proxy for each repository interface backed by `SimpleJpaRepository`. For each query method, a `PartTree` parses the method name into subject, predicates and ordering against the entity's properties and builds a JPA Criteria query, executed through the `EntityManager` on each call. Invalid names fail at startup.

</details>
