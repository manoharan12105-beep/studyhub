# Spring AI Production Interview Questions — Interview Questions

## Beginner

### Q1. Which provider errors should be retried?

**Style:** Direct

<details>
<summary>Answer</summary>

- **Retry** transient errors with backoff: timeouts, 5xx responses, and 429 (respecting `retry-after`).
- **Fail fast** on 400 (bad request) and 401/403 (key or permission). Alert on these.

The provider SDK may already retry. For example, `spring.ai.openai.chat.max-retries` defaults to 3. Know this before adding another layer.

</details>

### Q2. Where do AI costs come from?

**Style:** Concept

<details>
<summary>Answer</summary>

Input and output tokens on every model call. Input usually dominates, because each call resends:

- the system prompt;
- the history;
- the retrieved context;
- the tool definitions;
- in tool loops, the tool results.

Embedding calls and media generation add their own costs.

</details>

### Q3. Should prompts and replies be logged?

**Style:** Judgement

<details>
<summary>Answer</summary>

Not by default. They contain personal and confidential data.

- **Log metadata:** conversation id, model, token counts, latency and outcome.
- **Content logging:** Spring AI's observation content-logging properties (prompts, completions, tool content) default to false. Enable them only for debugging in non-production environments, with redaction and retention limits.

</details>

## Intermediate

### Q4. One user request makes 12 HTTP calls to the provider when it is down. Explain.

**Style:** Debugging

<details>
<summary>Answer</summary>

Retry layers multiply. The SDK made 1 + 3 attempts per call, and an `@Retryable(maxRetries = 2)` around the method made 3 calls: 3 × 4 = 12.

Keep retries in one layer, cap the total time, and add a fallback or circuit breaker.

</details>

### Q5. What do Spring AI observations give you?

**Style:** Direct

<details>
<summary>Answer</summary>

Micrometer observations for:

- the ChatClient (`spring.ai.chat.client`);
- each advisor (`spring.ai.advisor`);
- each tool (`spring.ai.tool`);
- each model call (`gen_ai.client.operation`).

There is also a token usage metric, `gen_ai.client.token.usage`. Export them to tracing and metrics backends to see latency per step, token use per model and tool failures.

</details>

### Q6. How do you test an AI feature in CI without a key?

**Style:** How

<details>
<summary>Answer</summary>

- **Unit tests** with a stub `ChatModel`: scripted replies and tool calls, with assertions on prompts and behaviour.
- **Integration tests** with a local stub HTTP server for provider errors and timeouts.
- **Evaluation** of quality with real models in a separate scheduled job, with thresholds on pass rates.

</details>

### Q7. How do you control output length and cost per request?

**Style:** How

<details>
<summary>Answer</summary>

- **Output token limit:** `spring.ai.openai.chat.max-completion-tokens`, or `spring.ai.anthropic.chat.max-tokens`.
- **Smaller input:** trim history, limit RAG topK and chunk size, and attach fewer tools.
- **Model routing:** send simple tasks to cheaper models.
- **Caching:** cache safe, repeated answers.
- **Budgets:** track usage per user and enforce limits.

Note: an advisor outside the tool loop sees usage accumulated across rounds.

</details>

## Advanced

### Q8. Map OWASP LLM risks to Spring defences.

**Style:** Design

<details>
<summary>Answer</summary>

| Risk | Spring defence |
|------|----------------|
| Prompt injection | Least-privilege tools; delimited untrusted input |
| Sensitive information disclosure | No secrets in prompts; per-user RAG filters; redacted logs |
| Improper output handling | Escape or validate model output before HTML, SQL or commands |
| Excessive agency | Few tools, authorisation in code, human approval |
| Unbounded consumption | Rate limits, token limits, timeouts |

Spring Security protects the endpoints, including MCP endpoints.

</details>

### Q9. A Spring AI MCP client gets 404 on `/mcp` from a Spring AI 2.0.1 server. Diagnose.

**Style:** Debugging

<details>
<summary>Answer</summary>

In the lesson's test, `spring.ai.mcp.server.protocol` was unset, so the server exposed the SSE endpoints rather than streamable HTTP. Setting `spring.ai.mcp.server.protocol=STREAMABLE` fixed it.

Also check:

- the endpoint path;
- Spring Security, which returns an authorisation failure rather than 404 (send credentials with an `McpSyncHttpClientRequestCustomizer`);
- that the server is up (an unavailable server failed client startup).

</details>

### Q10. Workflow or agent for a production feature?

**Style:** Judgement

<details>
<summary>Answer</summary>

Prefer a workflow when the steps are known. Use chaining, routing, parallelisation, orchestrator-workers or evaluator-optimizer, with code deciding control flow: it is predictable, testable and bounded in cost.

Use an agent only for open-ended tasks, and add:

- step and token limits;
- allow-listed tools;
- approval for irreversible actions;
- tracing;
- evaluations.

</details>

### Q11. How do you deploy a Spring AI service safely?

**Style:** Process

<details>
<summary>Answer</summary>

- **Secrets:** API keys from a secrets manager or environment.
- **Models:** pinned model versions.
- **Timeouts:** set for every call.
- **Concurrency:** virtual threads for blocking calls.
- **Shared state:** memory, caches and rate limits held in shared stores across instances.
- **Health:** based on recent call outcomes, not a paid probe call.
- **Control:** a kill switch or feature flag.
- **Rollout:** gradual, with evaluation and cost dashboards watched.
- **Shutdown:** graceful, for in-flight streams.

</details>
