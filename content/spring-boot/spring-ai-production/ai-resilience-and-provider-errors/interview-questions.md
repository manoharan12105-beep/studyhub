# Resilience: Retries, Timeouts and Fallbacks — Interview Questions

## Beginner

### Q1. Which model-provider errors should be retried?

**Style:** Direct

<details>
<summary>Answer</summary>

Transient ones: 5xx/overloaded responses, network errors, timeouts and usually 429 rate limits (after the indicated delay). Not permanent ones: 400 invalid requests (for example context too long), 401/403 authentication or permission errors, and content-filter refusals.

</details>

### Q2. What does Spring AI do when OpenAI returns HTTP 500 in 2.0.1?

**Style:** Behavior

<details>
<summary>Answer</summary>

The OpenAI module uses the official SDK's retry: by default 3 retries (4 requests in total, configurable with `spring.ai.openai.chat.max-retries`), then it throws `com.openai.errors.InternalServerException`. The timeout per request is `spring.ai.openai.chat.timeout` (default 60 s).

</details>

## Intermediate

### Q3. How do you add a retry around a model call in a Spring Boot 4 application without extra libraries?

**Style:** How

<details>
<summary>Answer</summary>

Enable `@EnableResilientMethods` and annotate a bean method with Spring Framework 7's `@Retryable(includes = …, maxRetries = …, delay = …, multiplier = …, jitter = …)`, listing only transient exception types for the provider in use. Call it through another bean (the proxy), not from the same class. `RetryTemplate` with `RetryPolicy.builder()` is the programmatic equivalent.

</details>

### Q4. Why can retries make an outage worse?

**Style:** Why

<details>
<summary>Answer</summary>

Retries multiply load exactly when the provider is struggling (retry storms), stack across layers (SDK × application × gateway), add latency for users and cost tokens for every attempt that partially ran. Bound retries, use exponential backoff with jitter, respect `retry-after`, limit concurrency, and fall back instead of retrying indefinitely.

</details>

## Advanced

### Q5. Design the failure handling for an AI assistant used by 5,000 concurrent users.

**Style:** Design

<details>
<summary>Answer</summary>

Timeouts on every provider call and an overall request deadline; one retry layer (the SDK's) with small bounds; `@ConcurrencyLimit` or a bulkhead sized to the provider's rate limits; a circuit breaker per provider so repeated failures switch quickly to a fallback (secondary provider or smaller model, tested for output compatibility) or a degraded mode (cached answers, search results, "try later"). Permanent errors fail fast and page on-call (401/403/quota). Metrics per error type and provider, user-facing 503 with a clear message, and idempotent tools so retried turns don't repeat side effects.

</details>
