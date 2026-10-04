# Pagination, Sorting and Filtering — Practice

### P1. Default page index

**Difficulty:** Easy · **Type:** MCQ

With Spring Data defaults, which request returns the **first** 10 products?

- A) `?page=1&size=10`
- B) `?page=0&size=10`
- C) `?offset=1&limit=10`
- D) `?start=0&count=10`

<details>
<summary>Answer</summary>

**Answer:** B) `?page=0&size=10`

**Explanation:** Page numbers are zero-based unless `spring.data.web.pageable.one-indexed-parameters=true`.

</details>

### P2. Duplicate items

**Difficulty:** Medium · **Type:** Debugging

Users report that some products appear on both page 1 and page 2 of `?sort=price,asc`. Why, and what is the fix?

<details>
<summary>Answer</summary>

Many products share the same price, and the database may order ties differently in each query. Add a unique tie-breaker: `sort=price,asc&sort=id,asc` (or append `id` in the service).

</details>

### P3. Count is slow

**Difficulty:** Medium · **Type:** Scenario

An activity-feed endpoint on a 200-million-row table takes 4 s, of which 3.5 s is the `count(*)` query. The mobile app only shows "load more". What do you change?

<details>
<summary>Answer</summary>

Return a `Slice` (no count query), and better, switch to keyset pagination on `(created_at, id)` with an index, so each "load more" seeks directly after the last item.

</details>

### P4. Sort injection

**Difficulty:** Medium · **Type:** Design

How would you allow sorting only by `name`, `price` and `createdAt` in a product search API?

<details>
<summary>Answer</summary>

Validate `pageable.getSort()` in the controller or service against a whitelist; reject others with 400. Optionally map API names to entity properties and rebuild the `Sort`, appending `id` as a tie-breaker. Make sure those columns are indexed where needed.

</details>
