# Resilience: Retries, Timeouts and Fallbacks

**Module:** Spring AI: Production · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Classify model-provider failures as transient or permanent and decide what to retry.
- Know which retry layer each provider module uses in Spring AI 2.0, and how layers multiply.
- Add retries, fallbacks and concurrency limits with Spring Framework 7's `@Retryable` and `@ConcurrencyLimit`.
- Set timeouts and design graceful degradation for AI features.

## Definition

**Resilience** means an AI feature keeps behaving predictably when the model provider is slow, overloaded, rate-limiting or misconfigured. The tools are the same as for any remote service — timeouts, retries with backoff, fallbacks, concurrency limits, circuit breaking — applied with AI-specific knowledge: calls are slow and expensive, retries cost tokens, and some failures (bad key, invalid request, content filter) will never succeed on retry.

| Failure | Transient? | Action |
|---------|-----------|--------|
| 5xx, overloaded, network error, timeout | Yes | Retry with backoff, then fall back |
| 429 rate limit | Usually | Retry after the provider's delay; reduce concurrency |
| 401/403 bad or missing key | No | Fail fast, alert |
| 400 invalid request (context too long, bad schema) | No | Fix the request; don't retry |
| Content filter / refusal | No | Return a safe message |

## Why It Matters

Model APIs have far higher latency and failure rates than your database. Without timeouts, request threads pile up; without backoff, a rate-limit spike becomes a retry storm that costs money; without fallbacks, one provider incident takes your feature down. Interviewers ask "what happens when the LLM provider is down?" for every AI system design.

## How It Works

Retry layers in Spring AI 2.0.1:

| Provider module | Built-in retry | Configure with | Exceptions surfaced |
|-----------------|----------------|----------------|---------------------|
| OpenAI (`openai-java` SDK) | SDK retries, default 3; timeout default 60 s | `spring.ai.openai.chat.max-retries`, `spring.ai.openai.chat.timeout` | `com.openai.errors.*` (`RateLimitException`, `InternalServerException`, `OpenAIIoException`, …) |
| Modules built on `spring-ai-retry` (for example Ollama) | `RetryTemplate`: max-attempts 10, initial interval 2 s, multiplier 5; 4xx not retried | `spring.ai.retry.*` | `TransientAiException` / `NonTransientAiException` |

Against a local stub returning HTTP 500, the OpenAI module sent 4 requests (1 + 3 SDK retries) before throwing — see [Responses and Errors](../../spring-ai-chat-client/spring-ai-responses-and-errors/content.md).

**Retries multiply.** An application-level retry of 2 around an SDK retry of 3 means up to 3 × 4 = 12 provider requests per user request. Decide which layer owns retries; usually keep the provider's small built-in retry and add **fallbacks**, not more retries, at the application level.

Spring Framework 7 (Spring Boot 4) has resilience built in — no extra library:

```java
// Illustrative fragment
@Configuration
@EnableResilientMethods                           // activates @Retryable and @ConcurrencyLimit
class ResilienceConfig {
}

@Retryable(includes = TransientAiException.class, maxRetries = 2, delay = 500, multiplier = 2, jitter = 100)
@ConcurrencyLimit(10)                             // at most 10 concurrent calls from this method
public String ask(String question) { ... }
```

`@Retryable` defaults: 3 retries, 1 s delay, multiplier 1 (no growth), no jitter. `RetryTemplate` with `RetryPolicy.builder()` offers the same programmatically.

```properties
# OpenAI module: SDK-level limits
spring.ai.openai.chat.timeout=20s
spring.ai.openai.chat.max-retries=2

# spring-ai-retry based modules (for example Ollama)
spring.ai.retry.max-attempts=3
spring.ai.retry.backoff.initial-interval=1s
spring.ai.retry.backoff.multiplier=2
spring.ai.retry.backoff.max-interval=10s
spring.ai.retry.on-http-codes=429
```

## Example

A primary model behind `@Retryable`, a fallback model, and three scenarios: a brief blip, an outage and a bad API key. Each scripted `ChatModel` takes the next outcome from a queue (exception or reply), so the program runs offline:

```java
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.retry.NonTransientAiException;
import org.springframework.ai.retry.TransientAiException;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.resilience.annotation.EnableResilientMethods;
import org.springframework.resilience.annotation.Retryable;

public class ResilienceDemo {

    /** A provider stand-in: each call takes the next scripted outcome (an exception or a reply). */
    static ChatModel scripted(String name, Object... outcomes) {
        Deque<Object> queue = new ArrayDeque<>(List.of(outcomes));
        return prompt -> {
            Object next = queue.isEmpty() ? new TransientAiException("503 overloaded") : queue.poll();
            System.out.println("  " + name + " called -> " + (next instanceof RuntimeException e ? e.getMessage() : "ok"));
            if (next instanceof RuntimeException e) {
                throw e;
            }
            return new ChatResponse(List.of(new Generation(new AssistantMessage((String) next))));
        };
    }

    /** Calls the primary model; retries only transient failures, with exponential backoff. */
    static class PrimaryTutor {
        private final ChatClient chatClient;

        PrimaryTutor(ChatClient chatClient) {
            this.chatClient = chatClient;
        }

        @Retryable(includes = TransientAiException.class, maxRetries = 2, delay = 50, multiplier = 2)
        public String ask(String question) {
            return chatClient.prompt().user(question).call().content();
        }
    }

    /** Degrades gracefully: fallback model for outages, clear error for permanent failures. */
    static class TutorService {
        private final PrimaryTutor primary;
        private final ChatClient fallback;

        TutorService(PrimaryTutor primary, ChatClient fallback) {
            this.primary = primary;
            this.fallback = fallback;
        }

        String ask(String question) {
            try {
                return primary.ask(question);              // through the proxy, so @Retryable applies
            }
            catch (TransientAiException e) {
                System.out.println("  primary exhausted, using fallback model");
                return fallback.prompt().user(question).call().content();
            }
            catch (NonTransientAiException e) {
                return "The assistant is unavailable (" + e.getMessage() + ")";
            }
        }
    }

    static String scenario;

    @Configuration
    @EnableResilientMethods
    static class Config {
        @Bean
        PrimaryTutor primaryTutor() {
            ChatModel primary = switch (scenario) {
                case "blip" -> scripted("primary", new TransientAiException("503 overloaded"), "Recursion is a method calling itself.");
                case "outage" -> scripted("primary");
                default -> scripted("primary", new NonTransientAiException("401 invalid API key"));
            };
            return new PrimaryTutor(ChatClient.create(primary));
        }

        @Bean
        TutorService tutorService(PrimaryTutor primaryTutor) {
            ChatModel backup = scripted("backup", "Recursion: a function that calls itself.");
            return new TutorService(primaryTutor, ChatClient.create(backup));
        }
    }

    public static void main(String[] args) {
        for (String s : List.of("blip", "outage", "bad-key")) {
            scenario = s;
            System.out.println("Scenario: " + s);
            try (var context = new AnnotationConfigApplicationContext(Config.class)) {
                System.out.println("  answer: " + context.getBean(TutorService.class).ask("What is recursion?"));
            }
        }
    }
}
```

**Output:**

```text
Scenario: blip
  primary called -> 503 overloaded
  primary called -> ok
  answer: Recursion is a method calling itself.
Scenario: outage
  primary called -> 503 overloaded
  primary called -> 503 overloaded
  primary called -> 503 overloaded
  primary exhausted, using fallback model
  backup called -> ok
  answer: Recursion: a function that calls itself.
Scenario: bad-key
  primary called -> 401 invalid API key
  answer: The assistant is unavailable (401 invalid API key)
```

### Code walkthrough

- **Blip:** one transient failure, one retry, success — the user never noticed.
- **Outage:** the original call plus `maxRetries = 2` failed; `@Retryable` rethrew the last `TransientAiException`, and `TutorService` switched to the backup model.
- **Bad key:** `NonTransientAiException` is not in `includes`, so there was no retry — retrying a 401 only wastes time.
- `@Retryable` works through a Spring proxy. `TutorService` calls `PrimaryTutor` — another bean — which is why it applies; calling an annotated method from inside the same class would bypass the proxy and silently skip the retry ([Spring Proxies](../../advanced/spring-proxies/content.md)).
- With the OpenAI module the exceptions are SDK types, not `TransientAiException`: list `com.openai.errors.InternalServerException`, `RateLimitException` and `OpenAIIoException` in `includes`, or use a `predicate`.

## Common Mistakes and Troubleshooting

- **No timeout on a streaming or blocking call.** A hung provider holds threads (or virtual threads and connections) for minutes. Set the provider timeout and an overall request deadline.
- **Retrying permanent errors.** 400/401/403 and content-filter results never succeed on retry.
- **Stacked retries.** SDK retries × application retries × gateway retries — count the worst case.
- **Fallback to a different model without re-checking output.** Structured output formats, tool support and quality differ; test the fallback path.
- **Retrying non-idempotent tool side effects.** A retry of a whole tool-calling turn can repeat a write tool; make tools idempotent or retry only the model call.

## Production Considerations

- Degrade honestly: a cached answer, a smaller model, a search-results page, or a clear "try again later" are all better than a 500.
- Use `@ConcurrencyLimit` (or a bulkhead) to stay under provider rate limits and protect your own threads.
- Track error rates by type and provider; alert on 401/403 immediately — they mean a key or quota problem, not load.
- For repeated outages, a circuit breaker (for example Resilience4j) stops calling a failing provider for a while; Spring Framework 7 itself provides retry and concurrency limits, not circuit breaking.

## Common Interview Traps

- **"Just retry until it works."** Retries cost tokens and time; bound them and only for transient errors.
- **"Spring AI maps every provider error to `TransientAiException`."** In 2.0 the OpenAI module throws SDK exceptions.
- **"`@Retryable` needs Spring Retry."** Spring Framework 7 includes `@Retryable`, `RetryTemplate` and `@ConcurrencyLimit` (enabled by `@EnableResilientMethods`).

## Key Takeaways

- Retry transient failures only, with backoff and a bound; fail fast on permanent ones.
- Know your layers: OpenAI SDK retries (`spring.ai.openai.chat.max-retries`, default 3) vs `spring.ai.retry.*` for other modules — they multiply with your own.
- Spring Framework 7: `@EnableResilientMethods`, `@Retryable(includes = …)`, `@ConcurrencyLimit`.
- Always have timeouts and a tested fallback path.

## Official References

- [Spring Framework: Resilience Features](https://docs.spring.io/spring-framework/reference/core/resilience.html)
- [OpenAI Chat: configuration properties](https://docs.spring.io/spring-ai/reference/api/chat/openai-chat.html)
- Related: [Responses and Errors](../../spring-ai-chat-client/spring-ai-responses-and-errors/content.md) · [Resilience Patterns](../../advanced/resilience-patterns/content.md) · [Model Selection and Portability](../model-selection-and-portability/content.md)
