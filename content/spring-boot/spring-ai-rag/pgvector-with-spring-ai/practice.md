# pgvector with Spring AI — Practice

### P1. Default table

**Difficulty:** Easy · **Type:** MCQ

Which table does `PgVectorStore` use by default?

- A) `documents`
- B) `spring_ai_vectors`
- C) `vector_store`
- D) `embeddings`

<details>
<summary>Answer</summary>

**Answer:** C) `vector_store`

</details>

### P2. Threshold to distance

**Difficulty:** Easy · **Type:** Conceptual

With cosine distance, what distance limit corresponds to `similarityThreshold(0.8)`?

<details>
<summary>Answer</summary>

Distance = 1 − similarity, so rows with cosine distance below 0.2.

</details>

### P3. Configure the store

**Difficulty:** Medium · **Type:** Coding

Write properties for a table `faq_chunks` with 768-dimension Ollama embeddings, cosine distance, HNSW, schema managed by migrations and validated at startup.

<details>
<summary>Answer</summary>

```properties
spring.ai.model.embedding=ollama
spring.ai.ollama.embedding.model=nomic-embed-text
spring.ai.vectorstore.pgvector.table-name=faq_chunks
spring.ai.vectorstore.pgvector.dimensions=768
spring.ai.vectorstore.pgvector.distance-type=cosine-distance
spring.ai.vectorstore.pgvector.index-type=hnsw
spring.ai.vectorstore.pgvector.initialize-schema=false
spring.ai.vectorstore.pgvector.schema-validation=true
```

The migration creates `faq_chunks` with `embedding vector(768)` and an HNSW index using `vector_cosine_ops`.

</details>

### P4. Startup error

**Difficulty:** Medium · **Type:** Debugging

The application fails at startup with `ERROR: type "vector" does not exist` while creating the table. What is missing?

<details>
<summary>Answer</summary>

The pgvector extension is not installed or not enabled in that database. Install the extension package on the server (or choose a managed PostgreSQL that offers pgvector) and run `CREATE EXTENSION IF NOT EXISTS vector;` — ideally in a migration executed by a user with the required privileges.

</details>

### P5. Slow queries

**Difficulty:** Hard · **Type:** Scenario

Searches take 2 seconds on 500,000 rows. `EXPLAIN` shows a sequential scan. The index was created with `vector_l2_ops`; the store uses the default distance type. Explain and fix.

<details>
<summary>Answer</summary>

The store searches with cosine distance (`<=>`), but the index supports Euclidean distance (`vector_l2_ops`, `<->`), so PostgreSQL cannot use it and scans every row. Create an HNSW index with `vector_cosine_ops` (or switch the store's distance type to `euclidean-distance` if that is intended), then re-check `EXPLAIN` and recall.

</details>
