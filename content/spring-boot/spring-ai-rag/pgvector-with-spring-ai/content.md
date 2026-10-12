# pgvector with Spring AI

**Module:** Spring AI: Embeddings and RAG · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

> [!NOTE]
> **Verification:** the configuration, defaults and SQL below were checked against the Spring AI 2.0.1 `PgVectorStore` and its auto-configuration properties. The application was **not** run against a PostgreSQL database with the pgvector extension for this lesson, so there is no captured output; behaviour is described as expected results.

## Learning Objectives

- Configure the pgvector store starter in a Spring Boot application.
- Know the table, index and distance defaults Spring AI uses, and when to change them.
- Decide between letting Spring AI create the schema and managing it with migrations.
- Avoid the common dimension, extension and index pitfalls.

## Definition

**pgvector** is a PostgreSQL extension that adds a `vector` column type, distance operators (`<=>` cosine, `<->` Euclidean, `<#>` negative inner product) and approximate indexes (HNSW, IVFFlat). Spring AI's `PgVectorStore` implements `VectorStore` on top of it with `JdbcTemplate`, storing each document as one row: id, text content, JSON metadata and the embedding.

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-vector-store-pgvector</artifactId>
</dependency>
```

## Why It Matters

Most Spring Boot teams already run PostgreSQL. pgvector keeps vectors next to relational data, inside existing backups, security and operations — often the simplest production vector store. Interviews ask how it is configured, which index and distance to use, and what breaks when the embedding model changes.

## How It Works

Defaults in Spring AI 2.0.1 (`spring.ai.vectorstore.pgvector.*`):

| Property | Default | Notes |
|----------|---------|-------|
| `initialize-schema` | `false` | When `true`, Spring AI runs the `CREATE EXTENSION`/`CREATE TABLE`/`CREATE INDEX` statements below |
| `schema-name` | `public` | |
| `table-name` | `vector_store` | |
| `id-type` | `uuid` | Also `text`, `integer`, `serial`, `bigserial` |
| `dimensions` | from the embedding model | Falls back to 1536 if the model cannot report its dimensions |
| `index-type` | `hnsw` | Also `ivfflat`, `none` |
| `distance-type` | `cosine-distance` | Also `euclidean-distance`, `negative-inner-product` |
| `remove-existing-vector-store-table` | `false` | Drops the table at startup — never in production |
| `schema-validation` | `false` | Validate an existing table's structure at startup |
| `max-document-batch-size` | 10000 | Rows per insert batch |

With `initialize-schema=true` and the defaults, the store executes the equivalent of:

```sql
-- Illustrative: the statements PgVectorStore issues (dimensions shown for a 1536-dimension model)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS hstore;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS public.vector_store (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    content text,
    metadata json,
    embedding vector(1536)
);
CREATE INDEX IF NOT EXISTS spring_ai_vector_index ON public.vector_store USING HNSW (embedding vector_cosine_ops);
```

A similarity search with cosine distance becomes, in essence:

```sql
-- Illustrative: shape of the search query (parameters bound by JdbcTemplate)
SELECT *, embedding <=> ? AS distance
FROM public.vector_store
WHERE embedding <=> ? < ?            -- distance limit derived from similarityThreshold
  AND <converted metadata filter>
ORDER BY distance
LIMIT ?;                              -- topK
```

Cosine distance = 1 − cosine similarity, so a similarity threshold of 0.75 corresponds to a distance below 0.25. Metadata filters are converted to SQL on the JSON `metadata` column.

## Example

```properties
# application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/studyai
spring.datasource.username=studyai
spring.datasource.password=${DB_PASSWORD}

spring.ai.model.embedding=openai
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.embedding.model=text-embedding-3-small

spring.ai.vectorstore.pgvector.initialize-schema=false
spring.ai.vectorstore.pgvector.table-name=course_chunks
spring.ai.vectorstore.pgvector.dimensions=1536
spring.ai.vectorstore.pgvector.index-type=hnsw
spring.ai.vectorstore.pgvector.distance-type=cosine-distance
spring.ai.vectorstore.pgvector.schema-validation=true
```

A Flyway migration owns the schema instead of `initialize-schema`:

```sql
-- V7__course_chunks.sql (illustrative migration)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS course_chunks (
    id uuid PRIMARY KEY,
    content text,
    metadata json,
    embedding vector(1536)
);
CREATE INDEX IF NOT EXISTS course_chunks_embedding_idx
    ON course_chunks USING hnsw (embedding vector_cosine_ops);
```

The application code only sees `VectorStore`:

```java
// Illustrative fragment
@Service
class CourseRetrieval {
    private final VectorStore vectorStore;     // a PgVectorStore, auto-configured

    CourseRetrieval(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    List<Document> search(String tenant, String question) {
        var b = new FilterExpressionBuilder();
        return vectorStore.similaritySearch(SearchRequest.builder()
                .query(question).topK(5).similarityThreshold(0.7)
                .filterExpression(b.eq("tenant", tenant).build())
                .build());
    }
}
```

**Expected result:** at startup the auto-configured `PgVectorStore` validates `course_chunks` (because `schema-validation=true`) and fails fast if the table or the vector dimension does not match; `similaritySearch` embeds the question, runs one SQL query with the cosine operator, the distance limit and the tenant condition, and returns at most five documents with scores.

For integration tests, Spring AI's Testcontainers support (`spring-ai-spring-boot-testcontainers`) can start a `pgvector/pgvector` PostgreSQL container with `@ServiceConnection` ([Testing AI Services](../../spring-ai-production/testing-ai-services/content.md)).

### Code walkthrough

- The schema is created by a migration so production never depends on application start-up DDL, and changes are reviewed.
- `dimensions` matches the embedding model; changing models means a new table (or column) and re-embedding.
- `schema-validation=true` turns a silent mismatch into a startup failure.
- The tenant filter is built with `FilterExpressionBuilder`, never by string concatenation ([Metadata Filtering](../vector-metadata-filtering/content.md)).

## Common Mistakes and Troubleshooting

- **`type "vector" does not exist`.** The extension is not installed in the database; install pgvector (or use a managed PostgreSQL that provides it) and `CREATE EXTENSION vector`.
- **`expected 1536 dimensions, not 3072`.** The column was created for a different embedding model. Create a new table for the new model and re-ingest.
- **Index won't build for large dimensions.** pgvector's HNSW and IVFFlat indexes on the `vector` type support up to 2,000 dimensions; larger embeddings need a model with configurable shorter output (for example `dimensions=1536`) or pgvector's half-precision types.
- **`remove-existing-vector-store-table=true` left in configuration.** The table is dropped on every start.
- **Mismatched distance and index operator class.** Searching with cosine distance needs a `vector_cosine_ops` index, otherwise PostgreSQL falls back to a sequential scan.
- **Slow filtered searches.** Add indexes for frequently filtered metadata keys and test approximate-search recall with filters.

## Production Considerations

- Memory: HNSW indexes are fastest when they fit in RAM; estimate vectors × dimensions × 4 bytes plus index overhead.
- Tune HNSW (`m`, `ef_construction` at build time; `hnsw.ef_search` at query time) only after measuring recall and latency.
- Backups and point-in-time recovery cover vectors with the rest of the database.
- Large ingestion: build the index after bulk loading, or expect slower inserts.
- Keep chunk text, metadata and vectors in the same transaction boundary as related business data only when you need it — most ingestion runs as a separate job.

## Common Interview Traps

- **"pgvector computes embeddings."** Spring AI calls the embedding model; pgvector stores and searches vectors.
- **"Cosine similarity is stored."** The query sorts by cosine **distance** (`<=>`), smaller = more similar; Spring AI converts thresholds and scores.
- **"`initialize-schema` is on by default."** It defaults to `false` in Spring AI 2.0.

## Key Takeaways

- `spring-ai-starter-vector-store-pgvector` + a `DataSource` + an `EmbeddingModel` → an auto-configured `PgVectorStore`.
- Defaults: table `vector_store`, UUID ids, HNSW index, cosine distance, schema not initialised.
- Own the schema with migrations; set dimensions to the embedding model; enable schema validation.
- Index operator class must match the distance type; HNSW on `vector` supports up to 2,000 dimensions.

## Official References

- [PGvector Vector Store](https://docs.spring.io/spring-ai/reference/api/vectordbs/pgvector.html)
- [pgvector project](https://github.com/pgvector/pgvector)
- Related: [Vector Stores](../vectorstore-abstraction/content.md) · [Metadata Filtering](../vector-metadata-filtering/content.md) · [Spring AI Deployment](../../spring-ai-production/spring-ai-deployment/content.md)
