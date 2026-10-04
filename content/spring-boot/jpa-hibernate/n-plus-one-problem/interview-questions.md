# The N+1 Problem: Fetch Join and EntityGraph — Interview Questions

## Beginner

### Q1. What is the N+1 query problem?

<details>
<summary>Answer</summary>

Loading N parent entities with one query and then triggering one additional query per parent to load an association — typically by accessing a lazy collection or proxy inside a loop. The application runs N+1 queries where one or two would suffice, and performance degrades linearly with data size.

</details>

### Q2. How do you solve N+1 in Spring Data JPA?

<details>
<summary>Answer</summary>

Load the association together with the parents: a JPQL `join fetch`, an `@EntityGraph(attributePaths = …)` on the repository method, Hibernate batch fetching (`hibernate.default_batch_fetch_size` or `@BatchSize`), or a DTO projection query that selects exactly the required data.

</details>

### Q3. How do you detect N+1 queries?

<details>
<summary>Answer</summary>

Enable SQL logging (`logging.level.org.hibernate.SQL=DEBUG`) and look for repeated identical SELECTs, enable Hibernate statistics, assert query counts in tests, or use APM/tracing and database statistics (`pg_stat_statements`) in production.

</details>

## Intermediate

### Q4. Why does N+1 happen even though the application uses JPA?

<details>
<summary>Answer</summary>

JPA loads exactly what the mapping and the query specify. With LAZY associations (the right default), loading parents does not load children; each later access to an uninitialised collection or proxy issues its own SELECT. JPA cannot predict that code will loop over all parents and touch every association, so the fetch plan must be stated per use case.

</details>

### Q5. What is the difference between `JOIN FETCH` and `@EntityGraph`?

<details>
<summary>Answer</summary>

Both make Hibernate load the association in the same SQL query. `JOIN FETCH` is written inside JPQL; `@EntityGraph` declares the attributes to fetch on a repository method (including derived query methods) or via a named graph, without changing the query text. Their SQL and limitations (collection paging, multiple bags) are the same.

</details>

### Q6. Does making the association EAGER fix N+1?

<details>
<summary>Answer</summary>

No. EAGER loads the association every time, even when not needed, and for entities loaded by JPQL Hibernate satisfies EAGER associations with additional SELECTs after the main query — still N+1. Keep mappings LAZY and fetch explicitly.

</details>

## Advanced

### Q7. Why is a collection `JOIN FETCH` combined with `Pageable` dangerous?

<details>
<summary>Answer</summary>

A fetch join returns one row per child, so SQL `LIMIT/OFFSET` would cut parents in the middle of their children. Hibernate therefore loads all matching rows and paginates in memory (warning HHH90003004), which can load an entire table into the heap. Page the parent ids first and fetch collections for those ids, use batch fetching, or set `hibernate.query.fail_on_pagination_over_collection_fetch=true` to catch it early.

</details>

### Q8. What is `MultipleBagFetchException` and how do you resolve it?

<details>
<summary>Answer</summary>

Hibernate throws it when a query fetch-joins two or more collections mapped as bags (`List` without an order column), because it cannot correctly reconstruct multiple bags from a Cartesian product. Fix: fetch one collection per query (the persistence context merges them), map collections as `Set` (beware the Cartesian product size), or use batch fetching for the secondary collections.

</details>

### Q9. Why is batch fetching a good default safety net?

<details>
<summary>Answer</summary>

With `hibernate.default_batch_fetch_size` set (e.g. 50), the first lazy access loads the association for up to 50 pending parents with one `IN` query, so a loop over N parents costs about 1 + N/50 queries instead of N+1. It needs no query changes, works with pagination and with multiple collections, and avoids Cartesian products — though explicit fetch plans remain better for hot paths.

</details>
