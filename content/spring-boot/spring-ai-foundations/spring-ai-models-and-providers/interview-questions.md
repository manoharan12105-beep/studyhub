# Chat Models, Embedding Models and Model Providers — Interview Questions

## Beginner

### Q1. What is the difference between a chat model and an embedding model?

**Style:** Comparison

<details>
<summary>Answer</summary>

A chat model takes messages and generates a message — text or tool calls — and is used for answering, summarising and extracting. An embedding model takes text and returns a fixed-length vector representing its meaning; it is used for similarity search, clustering and RAG retrieval. Embedding models cannot answer questions, and chat models are not used to compute similarity.

</details>

### Q2. What does a Spring AI starter such as `spring-ai-starter-model-openai` provide?

**Style:** Direct

<details>
<summary>Answer</summary>

The provider implementation module, its client library, the Spring Boot auto-configuration that creates model beans (chat, embedding, image, audio, moderation as supported), and the `spring.ai.<provider>.*` configuration properties.

</details>

## Intermediate

### Q3. Your application has both the OpenAI and the Ollama starters and fails at startup with "required a single bean, but 2 were found". Why, and how do you fix it?

**Style:** Debugging

<details>
<summary>Answer</summary>

Both starters auto-configure a model of the same type (for example two `EmbeddingModel` beans), and a component that needs exactly one — such as the pgvector store or the `ChatClient.Builder` — cannot choose. Select the provider per model type with `spring.ai.model.chat=…` and `spring.ai.model.embedding=…`, or define and qualify the beans yourself.

</details>

### Q4. Why must documents be re-embedded when you change the embedding model?

**Style:** Why

<details>
<summary>Answer</summary>

Each embedding model defines its own vector space; vectors from two models are not comparable, and the number of dimensions often differs (the vector column in pgvector has a fixed dimension). Mixing them makes similarity scores meaningless or fails on insert. Re-embed everything, ideally into a new index, and switch over when complete.

</details>

### Q5. How would you use an OpenAI-compatible provider that is not listed as a Spring AI module?

**Style:** How

<details>
<summary>Answer</summary>

Use the OpenAI module and point `spring.ai.openai.base-url` (and the API key and model name) at the compatible endpoint. Verify which features the provider actually implements — tool calling, streaming and structured output support vary.

</details>

### Q6. What changed in property names between Spring AI 1.x and 2.0?

**Style:** Direct

<details>
<summary>Answer</summary>

Model properties were flattened: `spring.ai.openai.chat.options.model` became `spring.ai.openai.chat.model`, and the same for embedding, image, audio and moderation (`spring.ai.openai.embedding.model`). The `.options.` forms are deprecated in 2.0. The top-level selection keys `spring.ai.model.chat`, `spring.ai.model.embedding` and similar decide which provider's auto-configuration is active.

</details>

## Advanced

### Q7. When would you choose a local model runtime such as Ollama over a cloud API?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When data must not leave your infrastructure, for offline development and tests, or when steady high volume makes owning hardware cheaper. The costs: you operate GPUs or accept slow CPU inference, local models are often smaller and less capable, and you handle scaling and upgrades yourself. Many teams use local models in development and cloud models in production, behind the same `ChatModel` interface.

</details>
