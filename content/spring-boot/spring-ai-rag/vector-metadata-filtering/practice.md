# Metadata Filtering in Vector Search — Practice

### P1. Predict the result

**Difficulty:** Easy · **Type:** Behavior

Documents: `a` (tenant acme, year 2026), `b` (tenant acme, year 2024), `c` (tenant globex, year 2026). Which match `tenant == 'acme' || year >= 2025`?

<details>
<summary>Answer</summary>

`a`, `b` and `c` — `a` and `b` by tenant, `c` by year.

</details>

### P2. Operator

**Difficulty:** Easy · **Type:** MCQ

Which operator excludes several values?

- A) `!=`
- B) `nin`
- C) `NOT in`
- D) `exclude`

<details>
<summary>Answer</summary>

**Answer:** B) `nin`

</details>

### P3. Build safely

**Difficulty:** Medium · **Type:** Coding

Using `FilterExpressionBuilder`, build "tenant equals the current user's tenant and visibility is public or the user's department".

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
var b = new FilterExpressionBuilder();
Filter.Expression scope = b.and(
        b.eq("tenant", user.tenantId()),
        b.in("visibility", "public", user.department())).build();
```

</details>

### P4. Find the leak

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
@GetMapping("/ask")
String ask(@RequestParam String q, @RequestParam String tenant) {
    return chatClient.prompt().user(q)
            .advisors(a -> a.param(QuestionAnswerAdvisor.FILTER_EXPRESSION, "tenant == '" + tenant + "'"))
            .call().content();
}
```

<details>
<summary>Answer</summary>

The tenant comes from a request parameter (any caller can choose another tenant) and is concatenated into the filter (injection: `x' || tenant != 'x` matches everything). Take the tenant from the authenticated principal and build the expression with `FilterExpressionBuilder`.

</details>

### P5. Fewer results than expected

**Difficulty:** Hard · **Type:** Debugging

On pgvector with an HNSW index, a search with `topK(5)` and a filter for a small tenant (0.1% of rows) often returns 0–2 documents, although the tenant has dozens of relevant chunks. Explain and suggest fixes.

<details>
<summary>Answer</summary>

Approximate HNSW search explores a limited candidate set and the filter is applied to those candidates; for a very selective filter most candidates are discarded, so fewer than five survive. Options: increase the index's search breadth (pgvector `hnsw.ef_search`, or iterative index scans in newer pgvector versions), add a B-tree/expression index so the planner can filter first for small tenants, partition or use per-tenant tables for large differences in tenant size, and measure recall with realistic filters.

</details>
