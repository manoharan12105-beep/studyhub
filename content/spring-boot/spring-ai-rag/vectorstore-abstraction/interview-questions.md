# Vector Stores: The VectorStore Abstraction — Interview Questions

## Beginner

### Q1. What does a vector store do?

**Style:** Direct

<details>
<summary>Answer</summary>

It stores documents with their embedding vectors and metadata, and answers nearest-neighbour queries: given a query vector, return the most similar stored documents, optionally filtered by metadata.

</details>

### Q2. What happens when you call `vectorStore.add(documents)` in Spring AI?

**Style:** Direct

<details>
<summary>Answer</summary>

Spring AI embeds each document's content with the configured `EmbeddingModel` (batched) and writes id, text, metadata and vector to the store. The application does not compute vectors itself.

</details>

## Intermediate

### Q3. Why can `similaritySearch` with `topK(5)` return fewer than five documents?

**Style:** Why

<details>
<summary>Answer</summary>

`topK` is a maximum. The similarity threshold drops weak matches, a metadata filter can exclude documents, and the store may simply contain fewer matching documents. Code must handle empty results.

</details>

### Q4. When is `SimpleVectorStore` appropriate?

**Style:** Scenario

<details>
<summary>Answer</summary>

Unit and integration tests, demos and very small prototypes. It keeps everything in memory, searches by linear scan and can save/load a JSON file. It has no durability, scaling or concurrency guarantees, so production uses a real store such as pgvector.

</details>

## Advanced

### Q5. How would you choose a vector store for a Spring Boot application?

**Style:** Design

<details>
<summary>Answer</summary>

Start from existing infrastructure: with PostgreSQL already in place, pgvector avoids a new system and keeps vectors next to relational data. Then check: expected vector count and dimensions (memory for HNSW), query latency and recall targets, metadata filter operators needed (tenancy, permissions), hybrid keyword + vector search, multi-tenancy model, backups and operations, managed vs self-hosted cost. Prototype with the `VectorStore` interface and Testcontainers, measure recall and latency on real data, then commit.

</details>
