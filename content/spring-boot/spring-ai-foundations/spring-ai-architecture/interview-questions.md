# Spring AI Architecture and Core Abstractions — Interview Questions

## Beginner

### Q1. What is the difference between `ChatModel` and `ChatClient`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`ChatModel` is the low-level, provider-neutral interface with `call(Prompt)` and `stream(Prompt)`; you build the `Prompt` yourself and get a `ChatResponse`. `ChatClient` is a fluent API built on top of a `ChatModel`: it builds prompts from `system()`/`user()` and templates, runs the advisor chain (memory, RAG, logging, the tool-calling loop) and converts responses to `String`, `ChatResponse` or entities. Application code normally uses `ChatClient`.

</details>

### Q2. What does a `Prompt` contain?

**Style:** Direct

<details>
<summary>Answer</summary>

A list of `Message`s — each with a role (`SYSTEM`, `USER`, `ASSISTANT`, `TOOL`) and content — and optional `ChatOptions` such as model name, temperature, top-p and max tokens.

</details>

### Q3. What is inside a `ChatResponse`?

**Style:** Direct

<details>
<summary>Answer</summary>

One or more `Generation`s, each holding an `AssistantMessage` (text and possibly tool calls) and generation metadata such as the finish reason, plus `ChatResponseMetadata` with the model id, token usage and provider-specific or advisor-added keys.

</details>

## Intermediate

### Q4. Describe the common shape shared by Spring AI model types.

**Style:** How

<details>
<summary>Answer</summary>

`Model<TReq, TRes>` has `TRes call(TReq)`. A `ModelRequest` exposes `getInstructions()` and `getOptions()`; a `ModelResponse` exposes `getResult()`, `getResults()` and `getMetadata()`. `ChatModel` (Prompt → ChatResponse), `EmbeddingModel` (EmbeddingRequest → EmbeddingResponse), `ImageModel`, `TranscriptionModel`, `TextToSpeechModel` and `ModerationModel` all follow it.

</details>

### Q5. When would you call `ChatModel` directly?

**Style:** Scenario

<details>
<summary>Answer</summary>

When you need full control over the exact messages and options and do not want advisors: writing framework or library code, implementing a custom loop (for example user-controlled tool execution with `ToolCallingManager`), or wrapping a model in another abstraction. For ordinary features, `ChatClient` gives the same power with less code.

</details>

### Q6. Where do you configure timeouts versus a default system instruction?

**Style:** How

<details>
<summary>Answer</summary>

Transport concerns — API key, base URL, retries, timeouts — belong to the model/provider layer (properties or model options). Behaviour — default system text, advisors, default tools — belongs to the `ChatClient` you build from `ChatClient.Builder`. Several `ChatClient` beans can share one `ChatModel` with different behaviours.

</details>

## Advanced

### Q7. What changed in Spring AI 2.0 about tool execution at the `ChatModel` level, and why?

**Style:** What happens internally

<details>
<summary>Answer</summary>

In 1.x each `ChatModel` implementation ran its own internal tool-execution loop. In 2.0 that loop was removed: `ChatModel.call` returns the model's tool-call request without executing it, and the loop lives in `ToolCallingAdvisor`, which `ChatClient` auto-registers. Moving it into the advisor chain lets memory, logging, observability and custom advisors compose with the loop through advisor ordering, instead of being hidden inside each provider.

</details>

### Q8. Why are options immutable in 2.0, and how do you change one value?

**Style:** Why

<details>
<summary>Answer</summary>

Immutable options are safe to share between threads and between requests, and merging defaults with per-request values becomes predictable. `copy()` and setters were removed; call `options.mutate()`, change the field on the builder and `build()` a new instance. With `ChatClient`, pass a builder to `.options(...)` and only the fields you set override the defaults.

</details>
