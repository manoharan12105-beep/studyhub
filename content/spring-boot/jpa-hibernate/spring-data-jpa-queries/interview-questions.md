# Derived Queries, JPQL, @Query and Native SQL — Interview Questions

## Beginner

### Q1. What is a derived query method?

<details>
<summary>Answer</summary>

A repository method whose query Spring Data generates from its name, such as `findByEmailAndActiveTrue` or `countByStatus`. Spring Data parses the subject (`find…By`, `count…By`, `exists…By`, `delete…By`), the property expressions and operators, and ordering/limiting keywords into a query when the application starts.

</details>

### Q2. What is the difference between JPQL and SQL?

<details>
<summary>Answer</summary>

JPQL queries entities and their mapped fields and navigates associations (`select o from Order o join o.customer c`); it is database-independent and translated into SQL by the JPA provider. SQL queries tables and columns directly and may use database-specific syntax.

</details>

### Q3. When do you use `@Query`?

<details>
<summary>Answer</summary>

When a derived method name would be too long or cannot express the query: joins and fetch joins, aggregates and grouping, constructor (DTO) expressions, subqueries, bulk updates/deletes (`@Modifying`), or native SQL with `nativeQuery = true`.

</details>

## Intermediate

### Q4. What does `@Modifying` do, and what are its pitfalls?

<details>
<summary>Answer</summary>

It marks a `@Query` as an UPDATE/DELETE (or DDL) executed with `executeUpdate`, returning the affected row count; it must run in a transaction. Bulk statements bypass the persistence context: managed entities are not updated, cascades and lifecycle callbacks do not run, and `@Version` is not incremented unless the query does it. Use `clearAutomatically = true` (and `flushAutomatically = true`) to avoid stale state.

</details>

### Q5. When would you choose a native query over JPQL?

<details>
<summary>Answer</summary>

For database-specific features — window functions, CTEs, JSON operators, full-text search, `ILIKE`, `FOR UPDATE SKIP LOCKED`, query hints — or hand-tuned reporting SQL. The costs are loss of portability, no startup validation, a separate count query for paging, and the need to keep column names in sync with mappings.

</details>

### Q6. Is `deleteByStatus(Status s)` efficient for deleting 50 000 rows?

<details>
<summary>Answer</summary>

No. Derived delete methods first load the matching entities and then remove each one individually (so cascades and callbacks run), producing many statements and a large persistence context. Use a `@Modifying @Query("delete from Order o where o.status = :s")` bulk delete instead, accepting that it bypasses cascades and callbacks.

</details>

### Q7. How does Spring Data JPA protect against SQL injection?

<details>
<summary>Answer</summary>

Derived queries and `@Query` parameters (`:name`, `?1`) are bound as JDBC prepared-statement parameters, never concatenated into the SQL text. Injection becomes possible only when developers build query strings manually (e.g. `createQuery("… where name = '" + input + "'")`) or concatenate user input into sort clauses or native SQL.

</details>

## Advanced

### Q8. When are derived queries and `@Query` JPQL validated?

<details>
<summary>Answer</summary>

At application startup, when the repository proxy is created: derived method names are parsed against the entity's properties, and JPQL strings are parsed by Hibernate. Errors such as a misspelled property fail startup, which makes them safe to refactor. Native queries are not validated until execution.

</details>

### Q9. Why might a native query that works in production fail in tests (or vice versa)?

<details>
<summary>Answer</summary>

Tests often run on H2 while production uses PostgreSQL or MySQL, and native SQL is dialect-specific (`ILIKE`, JSON functions, `LIMIT` vs `FETCH FIRST`, quoting, case sensitivity). Run integration tests against the real database engine using Testcontainers.

</details>
