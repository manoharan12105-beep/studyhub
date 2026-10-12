# Response Extraction, Metadata and Error Handling — Practice

### P1. Where is the token count?

**Difficulty:** Easy · **Type:** MCQ

Which expression returns the total tokens of a call?

- A) `response.getResult().getOutput().getTokens()`
- B) `response.getMetadata().getUsage().getTotalTokens()`
- C) `response.getResults().size()`
- D) `response.getMetadata().getRateLimit().getTokensLimit()`

<details>
<summary>Answer</summary>

**Answer:** B) `response.getMetadata().getUsage().getTotalTokens()`

**Explanation:** D is the provider's rate-limit information, not this call's usage.

</details>

### P2. Truncated answer

**Difficulty:** Easy · **Type:** MCQ

An answer ends mid-sentence and the finish reason is `LENGTH`. What is the most direct fix?

- A) Raise the temperature
- B) Increase the output-token limit or ask for a shorter answer
- C) Add more retries
- D) Switch from `call()` to `stream()`

<details>
<summary>Answer</summary>

**Answer:** B) Increase the output-token limit or ask for a shorter answer

</details>

### P3. Read the code

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
String text = chatClient.prompt().user(q).call().content();
return ResponseEntity.ok(text.trim());
```

Which failure modes does this miss?

<details>
<summary>Answer</summary>

`text` may be `null` (NullPointerException on `trim()`), the answer may be truncated (no finish-reason check), a content filter may have blocked it, and provider exceptions propagate as a generic 500. Use `chatResponse()`, check text and finish reason, and map exceptions to a clear status.

</details>

### P4. Exception mapping

**Difficulty:** Medium · **Type:** Coding

Write a `@RestControllerAdvice` method that maps an application `AiRateLimitedException` to HTTP 429 with a `Retry-After: 30` header and a `ProblemDetail` body.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
@ExceptionHandler(AiRateLimitedException.class)
ResponseEntity<ProblemDetail> rateLimited(AiRateLimitedException ex) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS,
            "Too many requests to the assistant. Please retry shortly.");
    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header(HttpHeaders.RETRY_AFTER, "30")
            .body(problem);
}
```

</details>

### P5. Retry configuration trap

**Difficulty:** Hard · **Type:** Debugging

An Ollama-backed service sits behind a gateway that sometimes returns 429. The team set `spring.ai.retry.max-attempts=5`, but logs show only one attempt before `NonTransientAiException`. Explain and fix.

<details>
<summary>Answer</summary>

`max-attempts` only applies to transient errors. The `spring-ai-retry` error handler classifies 4xx responses, including 429, as `NonTransientAiException` unless they are listed in `spring.ai.retry.on-http-codes` (or `on-client-errors=true`). Add `spring.ai.retry.on-http-codes=429` and keep exponential backoff (`spring.ai.retry.backoff.*`) so retries spread out.

</details>
