# Embeddings and Semantic Similarity — Practice

### P1. Compute a cosine

**Difficulty:** Easy · **Type:** Conceptual

Compute the cosine similarity of `a = [1, 0]` and `b = [1, 1]`.

<details>
<summary>Answer</summary>

a · b = 1; |a| = 1; |b| = √2 ≈ 1.414. Cosine = 1 / 1.414 ≈ 0.707. Cosine distance ≈ 0.293.

</details>

### P2. Same model?

**Difficulty:** Easy · **Type:** MCQ

Documents were embedded with model A. Which model must embed the user's question?

- A) Any embedding model with the same dimensions
- B) The chat model
- C) Model A, same version
- D) The cheapest available model

<details>
<summary>Answer</summary>

**Answer:** C) Model A, same version

</details>

### P3. Predict the ranking

**Difficulty:** Medium · **Type:** Behavior

With the course's `KeywordEmbeddingModel` (dimensions java, database, security, ai, testing, cooking, other), rank these for the question "How do I mock a database in a JUnit test?": (a) "A mock replaces a dependency in a test.", (b) "An index speeds up a query.", (c) "Bake the pasta."

<details>
<summary>Answer</summary>

The question has database: 1, testing: 3 (mock, junit, test) → direction ≈ (0, 1, 0, 0, 3)/√10. (a) testing: 2 (mock, test) → cosine 3/√10 ≈ 0.949. (b) database: 2 (index, query) → 1/√10 ≈ 0.316. (c) cooking only → 0. Ranking: a, b, c.

</details>

### P4. Configure the provider

**Difficulty:** Easy · **Type:** Coding

Write the Spring Boot 4.1 / Spring AI 2.0 properties to use Ollama's `nomic-embed-text` for embeddings while chat uses OpenAI.

<details>
<summary>Answer</summary>

```properties
spring.ai.model.chat=openai
spring.ai.model.embedding=ollama
spring.ai.ollama.embedding.model=nomic-embed-text
spring.ai.openai.api-key=${OPENAI_API_KEY}
```

Both starters must be on the classpath; the selection properties decide which beans are created.

</details>

### P5. Silent quality drop

**Difficulty:** Hard · **Type:** Debugging

After a dependency upgrade, RAG answers became vague although no errors are logged. The team discovers the default embedding model changed in configuration. Explain the cause and the recovery plan.

<details>
<summary>Answer</summary>

Queries are now embedded with a different model than the stored documents, so similarity scores are meaningless (if dimensions happened to match, nothing fails). Pin the embedding model explicitly in configuration; record the model name with the index; re-embed all documents into a new table/index with the new model if you want to switch, verify retrieval with a labelled test set, then switch queries over; add a startup check comparing configured and stored model names.

</details>
