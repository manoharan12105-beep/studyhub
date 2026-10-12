# What Is Spring AI? — Interview Questions

## Beginner

### Q1. What is Spring AI?

**Style:** Direct

<details>
<summary>Answer</summary>

A Spring project that integrates Java applications with AI models through portable abstractions — `ChatModel`, `EmbeddingModel`, `ImageModel`, `VectorStore` and the fluent `ChatClient` — plus Spring Boot auto-configuration, configuration properties, observability and testing support. It does not provide or train models; it connects to providers such as OpenAI, Anthropic, Ollama or Google Gemini.

</details>

### Q2. Why use Spring AI instead of calling a provider's HTTP API directly?

**Style:** Why

<details>
<summary>Answer</summary>

The model call is a small part of an AI feature. Spring AI adds prompt construction and templates, mapping replies to Java types, conversation memory, tool calling, retrieval-augmented generation, Micrometer observations and a provider-neutral API, all configured the Spring Boot way. Calling the API directly means rebuilding each of those per provider. The trade-off: a provider-only feature may appear in the provider SDK before Spring AI exposes it.

</details>

### Q3. Name four building blocks of Spring AI and what each does.

**Style:** Direct

<details>
<summary>Answer</summary>

- `ChatModel` — provider-neutral interface for chat models.
- `ChatClient` — fluent API on top of `ChatModel` for prompts, advisors, tools and structured output.
- `VectorStore` — stores document embeddings and runs similarity search for RAG.
- Advisors — interceptors around a `ChatClient` call that add memory, retrieved context, logging or safety checks.

Others: `EmbeddingModel`, `PromptTemplate`, `ChatMemory`, `@Tool`, document readers and splitters.

</details>

## Intermediate

### Q4. What is the framework responsible for, and what is the model provider responsible for?

**Style:** Comparison

<details>
<summary>Answer</summary>

Spring AI owns the integration: request building, templates, the advisor chain, the tool-calling loop, memory, structured-output conversion, retries configuration and observability. The provider owns the model: its knowledge and quality, context window, token prices, rate limits and which features (tools, vision, JSON-schema output) it supports. A feature works only when both support it, and many bugs are diagnosed by asking which side failed.

</details>

### Q5. Describe what happens when you call `chatClient.prompt().user("...").call().content()`.

**Style:** How

<details>
<summary>Answer</summary>

`ChatClient` builds a request with the default and per-call messages and options, runs it through the advisor chain (memory, retrieval, logging, the auto-registered tool-calling advisor), and the last step calls `ChatModel.call(Prompt)`. The provider implementation sends the HTTP request. The `ChatResponse` returns through the advisors, and `content()` extracts the text of the first generation. Note that `call()` only selects the blocking mode; the request is sent when `content()` runs.

</details>

### Q6. Is switching from OpenAI to Anthropic "just a dependency change" with Spring AI?

**Style:** Trap

<details>
<summary>Answer</summary>

The code that uses `ChatClient` usually compiles unchanged, but behaviour does not automatically stay the same. Model names and options differ, provider-specific options must be rewritten, token limits and costs change, and prompts tuned for one model may perform worse on another. Portability reduces the code change; you still re-run your evaluation suite before switching.

</details>

## Advanced

### Q7. Where does Spring AI fit relative to Spring Boot, and why does that matter in production?

**Style:** Scenario

<details>
<summary>Answer</summary>

Spring AI is a set of libraries and Boot starters inside the application. Because it reuses Boot, production concerns follow existing practice: secrets come from externalized configuration, beans can be replaced for tests, Actuator and Micrometer export AI metrics and traces, and profiles switch providers per environment. Teams can apply the same security reviews, logging rules and deployment pipelines they already use for other Spring services.

</details>
