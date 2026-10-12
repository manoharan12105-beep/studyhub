# Vector Stores: The VectorStore Abstraction

**Module:** Spring AI: Embeddings and RAG · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Describe what a vector store does and what Spring AI's `VectorStore` interface offers.
- Add, search and delete documents, and read scores and metadata from results.
- Use `SimpleVectorStore` for tests and prototypes and know why it is not a production store.
- Choose a production vector store with the right questions.

## Definition

A **vector store** (vector database) stores documents together with their embeddings and answers **nearest-neighbour** queries: "which stored vectors are most similar to this query vector?". Spring AI's `VectorStore` interface hides the database behind one API:

| Method | Purpose |
|--------|---------|
| `add(List<Document>)` | Embeds each document with the configured `EmbeddingModel` and stores it |
| `similaritySearch(String)` / `similaritySearch(SearchRequest)` | Embeds the query and returns the nearest documents, each with a score |
| `delete(List<String> ids)` / `delete(Filter.Expression)` / `delete(String filter)` | Removes documents by id or by metadata filter |
| `getNativeClient()` | Access to the underlying client for store-specific features |

A `Document` has an `id`, `text`, a `metadata` map and, in search results, a `score` (higher = more similar).

## Why It Matters

Every RAG feature reads from a vector store and every ingestion job writes to one. The abstraction lets you prototype with an in-memory store, test with Testcontainers, and run PostgreSQL/pgvector, Redis, Elasticsearch, MongoDB Atlas, Qdrant, Milvus, Weaviate, Pinecone, Neo4j and others in production without changing application code — as long as you understand what the abstraction does *not* hide (index types, filter support, consistency, cost).

## How It Works

```text
add(documents) ──▶ EmbeddingModel.embed(texts) ──▶ store (id, text, metadata, vector)

similaritySearch(query, topK, threshold, filter)
   ──▶ EmbeddingModel.embed(query)
   ──▶ database nearest-neighbour search + metadata filter
   ──▶ List<Document> with getScore()
```

`SearchRequest` options:

| Option | Default | Meaning |
|--------|---------|---------|
| `query` | — | The text to embed and search for |
| `topK` | 4 | Maximum number of results |
| `similarityThreshold` | 0.0 (`SIMILARITY_THRESHOLD_ACCEPT_ALL`) | Minimum score; results below it are dropped |
| `filterExpression` | none | Metadata filter, as a string or `Filter.Expression` ([Metadata Filtering](../vector-metadata-filtering/content.md)) |

Spring Boot auto-configures a `VectorStore` bean when a store starter (for example `spring-ai-starter-vector-store-pgvector`) and an `EmbeddingModel` are present. `SimpleVectorStore` has no starter; create it yourself.

## Example

`SimpleVectorStore` keeps vectors in a map in memory and can save to and load from a JSON file:

```java
import java.io.File;
import java.util.List;
import java.util.Map;

import com.example.studyai.lab.KeywordEmbeddingModel;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;

public class VectorStoreDemo {

    static void search(VectorStore store, String query) {
        List<Document> results = store.similaritySearch(SearchRequest.builder()
                .query(query).topK(2).similarityThreshold(0.5).build());
        System.out.println("Query: " + query);
        for (Document d : results) {
            System.out.printf("  %-7s score=%.3f course=%s%n", d.getId(), d.getScore(), d.getMetadata().get("course"));
        }
    }

    public static void main(String[] args) {
        KeywordEmbeddingModel embeddingModel = new KeywordEmbeddingModel();
        SimpleVectorStore store = SimpleVectorStore.builder(embeddingModel).build();

        store.add(List.of(
                new Document("db-1", "An index speeds up a query on a large table.", Map.of("course", "db-201")),
                new Document("spr-1", "A Spring bean calls a repository that runs the SQL query.", Map.of("course", "spring-301")),
                new Document("sec-1", "A JWT token proves who the caller is.", Map.of("course", "security-201"))));
        search(store, "Why is my Spring query slow on a large table?");

        store.delete(List.of("spr-1"));
        search(store, "Why is my Spring query slow on a large table?");

        File file = new File("vector-store.json");
        store.save(file);
        SimpleVectorStore reloaded = SimpleVectorStore.builder(embeddingModel).build();
        reloaded.load(file);
        System.out.println("Reloaded from file:");
        search(reloaded, "token security");
        file.delete();
    }
}
```

**Output:**

```text
Query: Why is my Spring query slow on a large table?
  spr-1   score=0.949 course=spring-301
  db-1    score=0.894 course=db-201
Query: Why is my Spring query slow on a large table?
  db-1    score=0.894 course=db-201
Reloaded from file:
Query: token security
  sec-1   score=1.000 course=security-201
```

### Code walkthrough

- `add` embedded the three documents; the ids were chosen by us (without an id, Spring AI generates a random UUID).
- Results come sorted by score; `sec-1` was below the 0.5 threshold for the SQL question and was dropped even though `topK` allowed two results.
- After `delete(List.of("spr-1"))` only `db-1` matched.
- `save`/`load` wrote and read the vectors as JSON — useful for tests and small demos, not for concurrent production use.

### In a Spring Boot application

```java
// Illustrative fragment
@Service
class CourseSearch {
    private final VectorStore vectorStore;      // auto-configured from the store starter

    CourseSearch(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    List<Document> search(String question) {
        return vectorStore.similaritySearch(SearchRequest.builder()
                .query(question).topK(5).similarityThreshold(0.6).build());
    }
}
```

## Common Mistakes and Troubleshooting

- **Using `SimpleVectorStore` in production.** It is in memory, does a linear scan, and has no concurrency, replication or durability guarantees.
- **Expecting `topK` results.** The threshold and filters can return fewer — or none. Handle empty results.
- **Random ids on re-ingestion.** Running the same ingestion twice stores duplicates. Use deterministic ids or delete by source first ([Ingestion Pipeline](../document-ingestion-pipeline/content.md)).
- **Assuming every store supports every filter operator.** Filter expressions are translated per store; check the store's documentation.
- **Comparing scores across stores.** Stores compute and convert distances differently; calibrate thresholds per store and model.

## Production Considerations

- Choose by: existing infrastructure (PostgreSQL → pgvector), scale (millions of vectors, memory), filtering needs, hybrid (keyword + vector) search, managed vs self-hosted, backups.
- Approximate indexes (HNSW, IVF) trade a little recall for speed; measure recall on your data.
- Vector stores are observed (`VectorStoreObservationContext`): measure query latency and result counts.
- Keep the embedding model name with the data; a model change means a new collection/table.

## Common Interview Traps

- **"The vector store creates the embeddings."** Spring AI calls the `EmbeddingModel` before writing; most stores only store and search vectors.
- **"A vector database replaces the relational database."** It stores retrieval data; source of truth and transactions usually stay in your main database.
- **"Similarity search is exact."** Production indexes are approximate.

## Key Takeaways

- `VectorStore`: `add`, `similaritySearch(SearchRequest)`, `delete` — one API over many databases.
- `SearchRequest`: query, topK (default 4), similarityThreshold (default 0.0), filter.
- `SimpleVectorStore` for tests and demos only.
- Pick the production store for your infrastructure, scale and filtering needs.

## Official References

- [Vector Databases](https://docs.spring.io/spring-ai/reference/api/vectordbs.html)
- [Simple Vector Store](https://docs.spring.io/spring-ai/reference/api/vectordbs.html)
- Related: [Embeddings and Semantic Similarity](../embeddings-and-semantic-similarity/content.md) · [pgvector with Spring AI](../pgvector-with-spring-ai/content.md) · [QuestionAnswerAdvisor](../../spring-ai-tools-and-advisors/question-answer-advisor/content.md)
