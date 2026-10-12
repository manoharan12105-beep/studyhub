# pgvector with Spring AI — Interview Questions

## Beginner

### Q1. What do you need to use pgvector from Spring AI?

**Style:** Direct

<details>
<summary>Answer</summary>

PostgreSQL with the pgvector extension installed, the `spring-ai-starter-vector-store-pgvector` starter, a configured `DataSource`, and an `EmbeddingModel` bean. Spring Boot then auto-configures a `PgVectorStore` as the `VectorStore`. The table is created by migrations or by setting `spring.ai.vectorstore.pgvector.initialize-schema=true`.

</details>

### Q2. What are the default index and distance types?

**Style:** Direct

<details>
<summary>Answer</summary>

HNSW index and cosine distance (operator `<=>`, operator class `vector_cosine_ops`), on table `public.vector_store` with UUID ids.

</details>

## Intermediate

### Q3. Why might you keep `initialize-schema=false` in production?

**Style:** Why

<details>
<summary>Answer</summary>

Schema changes should be versioned and reviewed (Flyway/Liquibase), the application's database user often lacks rights to create extensions, and DDL at startup across several instances can race. Migrations create the extension, table and index; `schema-validation=true` makes the application fail fast on mismatches.

</details>

### Q4. You switch to an embedding model with 3072 dimensions. What happens and what do you do?

**Style:** Scenario

<details>
<summary>Answer</summary>

Inserts and queries fail because the column is `vector(1536)` (pgvector reports a dimension mismatch), and HNSW/IVFFlat indexes on `vector` support at most 2,000 dimensions. Either request shorter embeddings from the model (if it supports a `dimensions` option) or use half-precision vectors; create a new table/column, re-embed all documents, verify retrieval, then switch.

</details>

## Advanced

### Q5. How do you scale and tune pgvector search?

**Style:** Design

<details>
<summary>Answer</summary>

Measure first: recall against exact search and latency at realistic data size and filters. Keep the HNSW index in memory (size ≈ vectors × dimensions × 4 bytes plus graph overhead); tune `m`/`ef_construction` at build time and `hnsw.ef_search` at query time for the recall/latency trade-off; index frequently filtered metadata; build indexes after bulk loads; consider partitioning by tenant for very uneven tenants; use read replicas for query load. Only move to a dedicated vector database if measurements show PostgreSQL cannot meet the targets.

</details>
