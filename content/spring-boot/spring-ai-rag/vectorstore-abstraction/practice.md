# Vector Stores: The VectorStore Abstraction — Practice

### P1. Default topK

**Difficulty:** Easy · **Type:** MCQ

What is `SearchRequest`'s default `topK`?

- A) 1
- B) 4
- C) 10
- D) Unlimited

<details>
<summary>Answer</summary>

**Answer:** B) 4

</details>

### P2. Predict the results

**Difficulty:** Easy · **Type:** Behavior

Three documents score 0.95, 0.89 and 0.10 for a query. The request uses `topK(2)` and `similarityThreshold(0.9)`. How many documents are returned?

<details>
<summary>Answer</summary>

One — only the 0.95 document passes the threshold.

</details>

### P3. Write the search

**Difficulty:** Medium · **Type:** Coding

Write a method that returns the ids of at most three documents with similarity of at least 0.7 for a question.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
List<String> relevantIds(VectorStore vectorStore, String question) {
    return vectorStore.similaritySearch(SearchRequest.builder()
                    .query(question)
                    .topK(3)
                    .similarityThreshold(0.7)
                    .build())
            .stream().map(Document::getId).toList();
}
```

</details>

### P4. Duplicates everywhere

**Difficulty:** Medium · **Type:** Debugging

A nightly job reads all course notes and calls `vectorStore.add(chunks)`. After a week, every search returns the same passage seven times. Why, and what are two fixes?

<details>
<summary>Answer</summary>

Each run adds new documents with new random ids, so every passage exists once per run. Fixes: delete the previous chunks of each source before adding (`vectorStore.delete("source == 'notes/jwt.md'")`), or give chunks deterministic ids (for example a hash of source + chunk index) so re-adding overwrites in stores that upsert — and only re-ingest changed files.

</details>

### P5. Store choice

**Difficulty:** Hard · **Type:** Design

A team runs PostgreSQL 17, expects 200,000 chunks, needs tenant filtering and wants minimal new infrastructure. Which store do you recommend and what do you verify first?

<details>
<summary>Answer</summary>

pgvector in the existing PostgreSQL: no new system, transactional backups, SQL-level tenancy columns and JSON metadata filters. Verify first: the pgvector extension is available in the managed database, the embedding dimension fits the index type (HNSW on `vector` supports up to 2,000 dimensions), memory for the HNSW index, query latency and recall with the tenant filter on realistic data.

</details>
