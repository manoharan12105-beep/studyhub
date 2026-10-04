# Projections, Pagination, Sorting and Specifications — Interview Questions

## Beginner

### Q1. What is a projection in Spring Data JPA?

<details>
<summary>Answer</summary>

A way to return only some properties instead of whole entities: an interface with getters matching properties (Spring creates proxies), a class/record DTO, or a dynamic projection chosen by a `Class<T>` parameter. Projections select fewer columns and return unmanaged objects.

</details>

### Q2. How do you add pagination to a repository method?

<details>
<summary>Answer</summary>

Add a `Pageable` parameter and return `Page<T>`, `Slice<T>` or `List<T>`: `Page<Product> findByCategoryName(String name, Pageable pageable)`. Create the `Pageable` with `PageRequest.of(page, size, sort)` or let Spring MVC bind it from request parameters.

</details>

## Intermediate

### Q3. What is the difference between closed and open interface projections?

<details>
<summary>Answer</summary>

A closed projection only has getters that map directly to entity properties, so Spring Data can select just those columns. An open projection uses `@Value` SpEL expressions over the target entity, so Spring must load the whole entity — convenient but no performance gain.

</details>

### Q4. What are Specifications and when would you use them?

<details>
<summary>Answer</summary>

Reusable predicates built with the JPA Criteria API (`(root, query, cb) -> Predicate`) that can be combined with `and`/`or`/`allOf` and executed through `JpaSpecificationExecutor`. They suit search screens with many optional filters, where writing one query per combination is impractical.

</details>

### Q5. Why might `Page` be slower than `Slice`?

<details>
<summary>Answer</summary>

`Page` executes an additional count query to report total elements and pages; on large or complex filtered datasets that count can cost as much as the data query. `Slice` fetches one extra row to know if more data exists and skips the count.

</details>

## Advanced

### Q6. How does keyset scrolling (`Window`, `ScrollPosition`) differ from offset pagination?

<details>
<summary>Answer</summary>

Offset pagination skips N rows (`OFFSET`), which gets slower with depth and shifts when rows are inserted. Keyset scrolling remembers the sort key of the last row and continues with `WHERE key > last` using an index, so each window costs the same and results are stable; it cannot jump to arbitrary page numbers. Spring Data exposes it via `ScrollPosition.keyset()` and `Window<T>`.

</details>

### Q7. How do you make Specifications type-safe?

<details>
<summary>Answer</summary>

Generate the JPA static metamodel (`hibernate-jpamodelgen` annotation processor) and use `root.get(Product_.price)` instead of strings, so renamed fields break the build. Alternatively use Querydsl, which generates query types (`QProduct.product.price.gt(…)`).

</details>
