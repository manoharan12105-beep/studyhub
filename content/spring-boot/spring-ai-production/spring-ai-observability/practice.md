# Observability: Metrics and Traces for AI Calls — Practice

### P1. Token metric

**Difficulty:** Easy · **Type:** MCQ

Which metric carries token usage?

- A) `spring.ai.chat.client`
- B) `gen_ai.client.token.usage`
- C) `spring.ai.tool`
- D) `http.server.requests`

<details>
<summary>Answer</summary>

**Answer:** B) `gen_ai.client.token.usage`

</details>

### P2. Read the trace

**Difficulty:** Easy · **Type:** Behavior

A trace shows: `spring.ai.chat.client` → `Tool Calling Advisor` → three model-call spans and two `spring.ai.tool` spans. How many model calls and tool executions happened?

<details>
<summary>Answer</summary>

Three model calls and two tool executions: call → tool → call → tool → call (final answer).

</details>

### P3. Expose metrics

**Difficulty:** Easy · **Type:** Coding

Write the properties to expose health and Prometheus endpoints and sample 20% of traces, keeping AI content out of telemetry.

<details>
<summary>Answer</summary>

```properties
management.endpoints.web.exposure.include=health,prometheus
management.tracing.sampling.probability=0.2
spring.ai.chat.client.observations.log-prompt=false
spring.ai.chat.client.observations.log-completion=false
spring.ai.tools.observations.include-content=false
```

The content settings are already `false` by default; stating them documents the decision.

</details>

### P4. Missing spans

**Difficulty:** Medium · **Type:** Debugging

Traces show `http.server.requests` for the endpoint but no `spring.ai.*` spans. The service builds its client with `ChatClient.create(openAiChatModel)`. Explain and fix.

<details>
<summary>Answer</summary>

`ChatClient.create(model)` uses a no-op observation registry, so ChatClient and advisor observations are not recorded. Inject the auto-configured `ChatClient.Builder` (or use `ChatClientBuilderConfigurer` for several models) so the application's `ObservationRegistry` is used.

</details>

### P5. Cardinality explosion

**Difficulty:** Hard · **Type:** Scenario

After adding a custom observation convention that puts `conversationId` and the first 50 characters of the question into low-cardinality keys, the metrics backend runs out of memory. What went wrong and what is the correct design?

<details>
<summary>Answer</summary>

Low-cardinality keys become metric tags; unique conversation ids and question text create a new series per request, and the question text also leaks user content. Keep only bounded values (model, feature, operation, outcome) as low-cardinality keys; put the conversation id as a high-cardinality key (trace attribute only) or in logs; never put user text into tags.

</details>
