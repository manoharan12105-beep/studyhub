# Model Selection, Routing and Portability — Interview Questions

## Beginner

### Q1. How do you choose a model for a feature?

**Style:** How

<details>
<summary>Answer</summary>

Define the task and an evaluation set from real inputs, then compare candidates on quality (evaluation results), latency, cost for your token profile, context window, required capabilities (tools, structured output, vision) and data policy (retention, region, self-hosting). Pick the cheapest model that meets the quality bar.

</details>

### Q2. What does Spring AI make portable across providers?

**Style:** Direct

<details>
<summary>Answer</summary>

The programming model: `ChatClient`/`ChatModel`, portable `ChatOptions` fields, prompts and templates, advisors, chat memory, RAG, tool calling, embeddings and vector stores. Provider-specific options, exceptions, capabilities and output behaviour remain different.

</details>

## Intermediate

### Q3. How do you route different tasks to different models in Spring Boot?

**Style:** Design

<details>
<summary>Answer</summary>

Create one `ChatClient` bean per model/role (through `ChatClientBuilderConfigurer` when several `ChatModel` beans exist, or with different `defaultOptions` model names for one provider) and put a small gateway in front that maps tasks to clients. Services call the gateway with a task type; models and options live in configuration.

</details>

### Q4. A request sets `.options(ChatOptions.builder().maxTokens(100))` on a client whose `defaultOptions` set `temperature(0.0)`. What temperature is used?

**Style:** Behavior

<details>
<summary>Answer</summary>

Not the client's 0.0: in Spring AI 2.0.1 per-request options replace the client's default options; unset fields fall back to the `ChatModel`'s own defaults (from provider properties). Repeat `temperature(0.0)` in the request, or use a separate client for that variant.

</details>

## Advanced

### Q5. Your company must be able to switch LLM providers within a week. What architecture and practices make that realistic?

**Style:** Design

<details>
<summary>Answer</summary>

Use Spring AI's portable abstractions throughout; isolate provider-specific options and exception translation in one configuration/adapter layer; route through a task-based gateway; prefer prompt-based features that don't depend on one provider's special capabilities, or wrap those behind interfaces; keep evaluation sets per task and run them against the alternative provider regularly; avoid provider lock-in for embeddings by recording the embedding model and having a re-embedding job ready; and test the alternative in staging (tool calling, structured output, streaming, error handling) before you need it.

</details>
