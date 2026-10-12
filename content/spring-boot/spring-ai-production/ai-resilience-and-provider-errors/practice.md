# Resilience: Retries, Timeouts and Fallbacks — Practice

### P1. Retry or not?

**Difficulty:** Easy · **Type:** MCQ

Which failure should **not** be retried?

- A) HTTP 503 from the provider
- B) A socket timeout
- C) HTTP 401 invalid API key
- D) HTTP 429 with a short retry-after

<details>
<summary>Answer</summary>

**Answer:** C) HTTP 401 invalid API key

</details>

### P2. Count the requests

**Difficulty:** Easy · **Type:** Conceptual

The OpenAI SDK retries 3 times by default. Your service adds `@Retryable(maxRetries = 2)` for `InternalServerException`. The provider returns 500 for everything. How many HTTP requests does one user request cause?

<details>
<summary>Answer</summary>

Each `ask` attempt makes 1 + 3 = 4 requests; `@Retryable` makes 1 + 2 = 3 attempts: 3 × 4 = 12 requests.

</details>

### P3. Configure a retry

**Difficulty:** Medium · **Type:** Coding

Write a method that retries an OpenAI chat call up to 2 times on rate limits and server errors, starting at 500 ms and doubling, with 100 ms jitter.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment — requires @EnableResilientMethods on a configuration class
@Retryable(includes = { RateLimitException.class, InternalServerException.class, OpenAIIoException.class },
        maxRetries = 2, delay = 500, multiplier = 2, jitter = 100)
public String summarise(String text) {
    return chatClient.prompt().user(u -> u.text("Summarise: {text}").param("text", text)).call().content();
}
```

The exception classes are in `com.openai.errors`. Consider lowering `spring.ai.openai.chat.max-retries` so the layers don't multiply.

</details>

### P4. The retry never happens

**Difficulty:** Medium · **Type:** Debugging

```java
// Illustrative fragment
@Service
class QuizService {
    public Quiz generate(String topic) {
        return callModel(topic);
    }

    @Retryable(includes = TransientAiException.class)
    Quiz callModel(String topic) { ... }
}
```

Transient failures are never retried. Give two reasons.

<details>
<summary>Answer</summary>

1. Self-invocation: `generate` calls `callModel` on `this`, bypassing the Spring proxy, so the annotation is ignored (move it to another bean or annotate the public entry point).
2. If the OpenAI module is used, failures are `com.openai.errors.*`, not `TransientAiException`, so `includes` never matches. Also check that `@EnableResilientMethods` is present.

</details>

### P5. Fallback surprises

**Difficulty:** Hard · **Type:** Scenario

During an outage, traffic fails over to a cheaper model. The quiz feature then throws JSON parsing errors. What went wrong and how do you prevent it?

<details>
<summary>Answer</summary>

The fallback model produces structured output differently (or worse), so `entity(Quiz.class)` fails. Fallbacks change behaviour, not just availability. Test the fallback path with the same evaluation and contract tests as the primary, use native structured output where both support it, validate and re-ask once, and if the fallback cannot meet the contract, degrade to a clear "quiz generation unavailable" instead.

</details>
