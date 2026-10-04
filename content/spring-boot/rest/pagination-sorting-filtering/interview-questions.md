# Pagination, Sorting and Filtering — Interview Questions

## Beginner

### Q1. How do you implement pagination in a Spring Boot REST API?

<details>
<summary>Answer</summary>

Accept a `Pageable` parameter in the controller (bound from `page`, `size`, `sort` query parameters), pass it to a Spring Data repository method such as `Page<Product> findByCategory(String category, Pageable pageable)`, map the entities to DTOs, and return a page DTO with content and metadata (page number, size, total elements, total pages). Configure a default and maximum page size.

</details>

### Q2. What is the difference between `Page` and `Slice`?

<details>
<summary>Answer</summary>

A `Page` contains the requested content plus total element and page counts, which requires an additional count query. A `Slice` only knows whether a next slice exists (it fetches one extra row), so it avoids the count query; it suits "load more"/infinite scrolling.

</details>

### Q3. How does a client request sorting?

<details>
<summary>Answer</summary>

With `sort` query parameters in the form `property,direction`, repeatable for multiple keys: `?sort=price,desc&sort=id,asc`. Spring Data resolves them into a `Sort` inside the `Pageable`.

</details>

## Intermediate

### Q4. Why should every paginated query have a unique sort key?

<details>
<summary>Answer</summary>

Databases do not guarantee order among rows with equal sort values, so with `ORDER BY price` alone, rows with the same price can switch places between page requests; some items appear on two pages and others on none. Adding a unique tie-breaker such as `id` makes the order deterministic.

</details>

### Q5. Why can offset pagination be slow for deep pages, and what is the alternative?

<details>
<summary>Answer</summary>

`OFFSET 500000` forces the database to produce and discard 500 000 rows before returning the page, so cost grows with depth; concurrent inserts also shift pages. Keyset (seek) pagination filters by the last seen sort key (`WHERE (created_at, id) < (?, ?)`) using an index, so every page costs the same and remains stable. Spring Data offers it through `ScrollPosition`/`Window`. It cannot jump to arbitrary page numbers.

</details>

### Q6. How do you protect a paginated endpoint from abuse?

<details>
<summary>Answer</summary>

Set `spring.data.web.pageable.max-page-size`, whitelist sortable properties (unknown or unindexed fields can error or cause full scans), validate filter values, and rate-limit expensive searches. Consider `Slice` or cached counts if the count query is expensive.

</details>

## Advanced

### Q7. Why does Spring Data warn when you return `Page` from a controller?

<details>
<summary>Answer</summary>

Since Spring Data 3.3, serialising `PageImpl` directly logs a warning because its JSON (a mirror of internal getters) is not a stable API contract and may change between versions. Return your own page DTO or `PagedModel`, or enable `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)` so pages are rendered through a stable DTO.

</details>

### Q8. A paginated endpoint uses `JOIN FETCH o.items` and Hibernate logs "firstResult/maxResults specified with collection fetch; applying in memory". What is happening?

<details>
<summary>Answer</summary>

With a collection fetch join, each order appears in several result rows, so SQL `LIMIT` cannot be applied per order. Hibernate loads **all** matching rows and paginates in memory — a memory and performance problem on large data. Fix: paginate the parent ids first (or paginate orders without the collection) and then fetch the collections for those ids in a second query, or use batch fetching (`@BatchSize`/`default_batch_fetch_size`) instead of a fetch join.

</details>
