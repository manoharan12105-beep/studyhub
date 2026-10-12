# Embeddings and Semantic Similarity

**Module:** Spring AI: Embeddings and RAG · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain what an embedding is and why similar meanings produce nearby vectors.
- Compute cosine similarity and read similarity scores correctly.
- Use Spring AI's `EmbeddingModel` API and configure an embedding provider.
- Recognise the operational rules: one model per index, dimensions, cost and re-embedding.

## Definition

An **embedding** is a fixed-length array of numbers (a vector) that an **embedding model** produces for a piece of text. The model is trained so that texts with similar meaning get vectors that point in similar directions. **Semantic similarity** is measured by comparing vectors, most often with **cosine similarity**:

```text
cosine(a, b) = (a · b) / (|a| × |b|)        range −1 … 1; 1 = same direction
cosine distance = 1 − cosine similarity      what many vector databases store and sort by
```

In Spring AI, `EmbeddingModel` is the abstraction: `embed(String)` returns a `float[]`, `embed(List<String>)` embeds a batch in one call, and `dimensions()` reports the vector length.

## Why It Matters

Embeddings are the foundation of RAG, semantic search, deduplication, clustering and recommendation. Keyword search finds "index"; semantic search also finds "my query on a big table is slow". Interviewers expect you to explain the vector idea, the similarity measure and the practical traps (mixing models, re-embedding, cost).

## How It Works

```text
"Why is my query slow?" ──▶ EmbeddingModel ──▶ [0.012, −0.087, …, 0.034]   (for example 1536 numbers)
                                                         │ compare with stored vectors
                                                         ▼
                                       nearest vectors = most similar passages
```

| Concept | What to remember |
|---------|------------------|
| Dimensions | Fixed per model (for example 1536 for OpenAI `text-embedding-3-small`); stored vectors must have the same length |
| Same model for both sides | Documents and queries must be embedded by the **same** model and version; vectors from different models are not comparable |
| Normalisation | Many providers return unit-length vectors, so cosine similarity equals the dot product |
| Cost | Embedding is cheap per token but you pay for every document at ingestion and every query at search time |
| Chat vs embedding models | Separate models, often separate properties and pricing |

Spring Boot configuration for an OpenAI embedding model (2.0 property names):

```properties
spring.ai.model.embedding=openai
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.embedding.model=text-embedding-3-small
# Optional: request shorter vectors where the model supports it
spring.ai.openai.embedding.dimensions=1536
```

> [!NOTE]
> **Version note:** 1.x used `spring.ai.openai.embedding.options.model`; in 2.0 the `options.` segment is deprecated in favour of `spring.ai.openai.embedding.model` and `spring.ai.openai.embedding.dimensions`.

**Framework vs provider:** Spring AI provides the `EmbeddingModel` interface, batching and auto-configuration. The vector values, dimensions, maximum input length and price come from the provider's model.

## Example

The course's `KeywordEmbeddingModel` (see [The Practice Lab](../../spring-ai-foundations/spring-ai-practice-lab/content.md)) maps text onto seven topic dimensions — java, database, security, ai, testing, cooking, other — so the mechanics are visible:

```java
import java.util.Arrays;
import java.util.List;

import com.example.studyai.lab.KeywordEmbeddingModel;
import org.springframework.ai.embedding.EmbeddingModel;

public class EmbeddingDemo {

    static double cosine(float[] a, float[] b) {
        double dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public static void main(String[] args) {
        EmbeddingModel embeddingModel = new KeywordEmbeddingModel();
        System.out.println("Dimensions: " + embeddingModel.dimensions());

        String question = "Why is my Spring query slow on a large table?";
        List<String> passages = List.of(
                "A Spring bean calls a repository that runs the SQL query.",
                "An index speeds up a query on a large table.",
                "Store each password as a bcrypt hash, never in plain text.",
                "Bake the pasta in the oven for 20 minutes.");

        float[] q = embeddingModel.embed(question);
        System.out.println("Question vector: " + Arrays.toString(q));

        List<float[]> vectors = embeddingModel.embed(passages);     // one batch call
        for (int i = 0; i < passages.size(); i++) {
            System.out.printf("%.3f  %s%n", cosine(q, vectors.get(i)), passages.get(i));
        }
    }
}
```

**Output:**

```text
Dimensions: 7
Question vector: [0.4472136, 0.8944272, 0.0, 0.0, 0.0, 0.0, 0.0]
0.949  A Spring bean calls a repository that runs the SQL query.
0.894  An index speeds up a query on a large table.
0.000  Store each password as a bcrypt hash, never in plain text.
0.000  Bake the pasta in the oven for 20 minutes.
```

### Code walkthrough

- The question contains one "java" word (Spring) and two "database" words (query, table), giving the unit vector `[0.447, 0.894, 0, …]`.
- The first passage mixes Spring and SQL words like the question, so it scores highest; the index passage is pure database and scores slightly lower; unrelated passages score 0.
- Swap in a real `EmbeddingModel` bean (OpenAI, Ollama, …) and the code is unchanged — only the numbers change. A real model also understands "big" ≈ "large" and "slow" ≈ "performance", which this keyword toy cannot.
- `embed(List<String>)` sends a batch; for many documents Spring AI vector stores batch automatically.

### What text gets embedded?

For a `Document`, provider embedding models embed its formatted content according to a metadata mode; the OpenAI model's `spring.ai.openai.embedding.metadata-mode` defaults to `embed`. With `MetadataMode.EMBED`, a document with metadata `course: security-201` is formatted as:

```text
course: security-201

Access tokens expire after 15 minutes.
```

Metadata values therefore influence the vector. Keep embed-visible metadata meaningful, or exclude keys from embedding (`Document` metadata is still available for filtering either way).

## Common Mistakes and Troubleshooting

- **Changing the embedding model without re-embedding.** Old and new vectors are not comparable; search quality collapses silently. Re-embed everything (a new index or table), then switch.
- **Dimension mismatch.** Storing 3072-dimension vectors in a column created for 1536 fails at insert time; set the store's dimensions from the model.
- **Treating the score as a probability.** 0.82 is not "82% correct". Thresholds are model-specific; calibrate on your data ([Retrieval Quality](../retrieval-quality/content.md)).
- **Embedding huge documents whole.** Models have input limits and one vector cannot represent a whole manual; split first ([Text Splitting](../text-splitting-and-chunking/content.md)).
- **Embedding secrets or personal data** without considering that the provider receives the text.

## Production Considerations

- Store the embedding model name and version with each index; check it at startup.
- Batch embedding calls during ingestion and respect provider rate limits.
- Cache query embeddings for repeated questions if the traffic pattern justifies it.
- Embedding calls are observed like chat calls, including token usage — track ingestion cost separately from chat cost ([Observability](../../spring-ai-production/spring-ai-observability/content.md)).
- Local models (Ollama) avoid sending documents to a third party, at the cost of hosting.

## Common Interview Traps

- **"Embeddings understand the question."** They map text to vectors; the chat model does the reasoning.
- **"Any two embedding models can share an index."** Never — same model and version for documents and queries.
- **"Higher dimensions are always better."** They cost more storage and memory; quality depends on the model, not only the size.

## Key Takeaways

- Embedding = text → fixed-length vector; similar meaning → similar direction.
- Cosine similarity compares direction; distance = 1 − similarity.
- `EmbeddingModel.embed(...)`, `dimensions()`; configure with `spring.ai.model.embedding` and provider properties.
- One embedding model per index; changing it means re-embedding.

## Official References

- [Embeddings API](https://docs.spring.io/spring-ai/reference/api/embeddings.html)
- [OpenAI Embeddings](https://docs.spring.io/spring-ai/reference/api/embeddings/openai-embeddings.html)
- Related: [Vector Stores](../vectorstore-abstraction/content.md) · [The Practice Lab](../../spring-ai-foundations/spring-ai-practice-lab/content.md) · [RAG Architecture](../rag-architecture/content.md)
