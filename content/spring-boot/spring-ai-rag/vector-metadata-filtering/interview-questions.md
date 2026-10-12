# Metadata Filtering in Vector Search — Interview Questions

## Beginner

### Q1. Why do RAG systems need metadata filters?

**Style:** Why

<details>
<summary>Answer</summary>

Similarity search ignores who is asking and which documents are allowed or current. Filters restrict retrieval by metadata — tenant, permissions, product, version, language — so the model only sees documents the user may see and that apply to the question.

</details>

### Q2. Write a filter for "course is db-201 and level is beginner or intermediate".

**Style:** How

<details>
<summary>Answer</summary>

`course == 'db-201' && level in ['beginner', 'intermediate']`, or with the builder: `b.and(b.eq("course", "db-201"), b.in("level", "beginner", "intermediate")).build()`.

</details>

## Intermediate

### Q3. How can a filter expression be injected, and how do you prevent it?

**Style:** Scenario

<details>
<summary>Answer</summary>

When a filter string is concatenated from request data, input such as `acme' || tenant == 'globex` closes the quoted value and adds a condition, broadening the search to another tenant. Prevent it by building filters with `FilterExpressionBuilder` (values stay literals), taking identity from the authenticated principal, and validating any other values against strict patterns.

</details>

### Q4. How do you pass a different filter on each request through `RetrievalAugmentationAdvisor`?

**Style:** How

<details>
<summary>Answer</summary>

Set the advisor context parameter `VectorStoreDocumentRetriever.FILTER_EXPRESSION` on the request: `.advisors(a -> a.param(VectorStoreDocumentRetriever.FILTER_EXPRESSION, expression))`. A static filter (or a `Supplier`) can also be set on the retriever's builder. For `QuestionAnswerAdvisor` the key is `QuestionAnswerAdvisor.FILTER_EXPRESSION`.

</details>

## Advanced

### Q5. Shared index or one index per tenant?

**Style:** Compare

<details>
<summary>Answer</summary>

Shared index + tenant filter: simpler operations, one schema, efficient for many small tenants; risks are a missing filter leaking data and selective filters hurting approximate-search recall and latency. Per-tenant index/collection/table: strong isolation, easy deletion, per-tenant tuning; costs more operations and resources with many tenants. Many systems use a shared index with mandatory server-side filters and tests, and dedicate indexes to large or regulated tenants.

</details>
