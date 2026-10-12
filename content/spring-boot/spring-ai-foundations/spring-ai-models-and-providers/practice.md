# Chat Models, Embedding Models and Model Providers — Practice

### P1. Pick the model type

**Difficulty:** Easy · **Type:** MCQ

You want to find the five help articles most similar to a user's question. Which model type does the similarity step use?

- A) Chat model
- B) Embedding model
- C) Image model
- D) Moderation model

<details>
<summary>Answer</summary>

**Answer:** B) Embedding model

</details>

### P2. The 2.0 property name

**Difficulty:** Easy · **Type:** MCQ

Which property sets the OpenAI chat model name in Spring AI 2.0?

- A) `spring.ai.openai.chat.options.model`
- B) `spring.ai.openai.chat.model`
- C) `spring.ai.chat.openai.model`
- D) `spring.ai.model.chat`

<details>
<summary>Answer</summary>

**Answer:** B) `spring.ai.openai.chat.model`

**Explanation:** 2.0 flattened the properties; A is the deprecated 1.x form, and D selects the provider (`openai`, `anthropic`, …), not the model name.

</details>

### P3. Startup failure

**Difficulty:** Medium · **Type:** Debugging

A project adds `spring-ai-starter-vector-store-pgvector` and sets `spring.ai.model.embedding=none` to "save money". Startup fails. What is the message about, and what is the fix?

<details>
<summary>Answer</summary>

The pgvector auto-configuration needs an `EmbeddingModel` bean to embed documents and queries, and none exists, so startup reports that a bean of type `org.springframework.ai.embedding.EmbeddingModel` could not be found. Enable an embedding provider (for example `spring.ai.model.embedding=openai`) or define an `EmbeddingModel` bean. Embedding calls cost far less than chat calls, so disabling them is rarely the right saving.

</details>

### P4. Mixed providers

**Difficulty:** Medium · **Type:** Coding

Write the properties for an application that uses Anthropic for chat and OpenAI's `text-embedding-3-small` for embeddings, with keys from environment variables.

<details>
<summary>Answer</summary>

```properties
spring.ai.model.chat=anthropic
spring.ai.model.embedding=openai
spring.ai.anthropic.api-key=${ANTHROPIC_API_KEY}
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.embedding.model=text-embedding-3-small
```

</details>

### P5. Re-indexing decision

**Difficulty:** Hard · **Type:** Scenario

Your team switches from `text-embedding-ada-002` to `text-embedding-3-small` for better retrieval. The vector store holds 2 million chunks and the site must stay online. Outline a safe migration.

<details>
<summary>Answer</summary>

1. Create a new table or index for the new model (dimensions may differ; here both are 1536, but vectors are still not comparable).
2. Re-embed all chunks into the new index in batches, respecting rate limits, while the old index keeps serving.
3. Run the retrieval evaluation set against both indexes and compare quality.
4. Switch reads (and new writes) to the new index with a configuration flag; keep the old one for rollback until confident, then delete it.

</details>
