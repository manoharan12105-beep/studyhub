# Response Extraction, Metadata and Error Handling — Interview Questions

## Beginner

### Q1. What information does `ChatResponse` give you beyond the text?

**Style:** Direct

<details>
<summary>Answer</summary>

Per generation: the `AssistantMessage` (text and any tool calls) and generation metadata such as the finish reason and content filters. For the whole response: id, model, token `Usage` (prompt, completion, total), `RateLimit` information when the provider sends it, and extra metadata keys added by advisors.

</details>

### Q2. What does a finish reason of `LENGTH` mean?

**Style:** Direct

<details>
<summary>Answer</summary>

Generation stopped because it reached the output-token limit, so the answer is probably cut off. Increase the limit within budget, ask for a shorter answer, reduce input size, or tell the user the answer is incomplete. With the OpenAI module in 2.0.1 the value is reported upper-cased (`LENGTH`; a normal finish is `STOP`).

</details>

## Intermediate

### Q3. Name three ways a call can "succeed" but still give you an unusable answer.

**Style:** Scenario

<details>
<summary>Answer</summary>

The answer is truncated (finish reason `LENGTH`); the text is empty because the model returned a tool call that was not executed or a content filter blocked it; the text cannot be parsed into the expected structure or contains invalid values. Each needs a check after the call.

</details>

### Q4. Which exceptions does the OpenAI module throw in Spring AI 2.0 for a 429 and for a timeout?

**Style:** Direct

<details>
<summary>Answer</summary>

It uses the official `openai-java` SDK, so a rate limit surfaces as `com.openai.errors.RateLimitException` (after the SDK's own retries, `spring.ai.openai.max-retries`, default 3), and a timeout as `com.openai.errors.OpenAIIoException` with a `SocketTimeoutException` cause. Modules built on `spring-ai-retry` (such as Ollama) use Spring AI's `TransientAiException` / `NonTransientAiException` instead.

</details>

### Q5. How should a REST API report that the model provider is down?

**Style:** How

<details>
<summary>Answer</summary>

Catch provider exceptions in the service (or an adapter), log the real cause without sensitive prompt text, throw an application exception such as `AiUnavailableException`, and map it in a `@RestControllerAdvice` to a `503` `ProblemDetail` with a user-friendly message. Optionally return a fallback answer for selected endpoints. Never expose raw provider error bodies.

</details>

## Advanced

### Q6. With a module that uses `spring-ai-retry`, is a 429 retried by default?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Its response error handler treats 4xx codes as non-transient (`NonTransientAiException`) unless they are listed in `spring.ai.retry.on-http-codes` or `spring.ai.retry.on-client-errors=true`. Only 5xx codes default to `TransientAiException`, which the retry template retries. To retry rate limits you add `spring.ai.retry.on-http-codes=429` — and then rely on backoff so retries do not make the overload worse.

</details>

### Q7. How do you keep provider-specific exception handling from spreading through the codebase?

**Style:** Design

<details>
<summary>Answer</summary>

Put model calls behind a small adapter or service layer that catches provider exceptions (`com.openai.errors.*`, Spring AI retry exceptions) and translates them into a few application exceptions — unavailable, rate-limited, invalid request, bad output. Business code and controller advice depend only on those types, so changing providers changes one class.

</details>
