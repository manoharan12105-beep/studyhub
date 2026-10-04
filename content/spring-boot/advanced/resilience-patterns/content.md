# Resilience: Retry, Circuit Breaker and Timeouts

**Module:** Advanced Spring · **Interview priority:** Frequently asked

## Definition

**Resilience** is a system's ability to keep working — possibly degraded — when its dependencies are slow or failing. Core patterns:

- **Timeout** — never wait forever for a remote call.
- **Retry** — repeat a failed call that is likely to succeed next time (transient errors), with backoff.
- **Circuit breaker** — stop calling a dependency that keeps failing, fail fast for a while, then test it again.
- **Bulkhead / concurrency limit** — cap concurrent calls so one slow dependency cannot consume all threads.
- **Fallback** — a degraded answer (cached data, default value, "try later") when the call fails.
- **Rate limiter** — cap the rate of calls.

## Why It Matters

- In service-oriented systems, the slowest dependency defines your availability; without timeouts and circuit breakers, one failing service causes **cascading failures**.
- "How would you handle a third-party API that is down?" is a frequent scenario question.

## Resilience Concepts

```text
request ──► [ rate limiter ] ──► [ bulkhead ] ──► [ circuit breaker ] ──► [ retry + backoff ] ──► [ timeout ] ──► remote call
                                                       │ open → fail fast → fallback
```

Order matters: the timeout applies to each attempt; retries happen inside the circuit breaker so repeated failures open it; the bulkhead limits total concurrency.

## Retry

Retry only when:

- The failure is **transient** — timeouts, connection resets, 503/429 — not validation errors (400) or "not found" (404).
- The operation is **idempotent**, or protected with an idempotency key — retrying a payment `POST` without one can charge twice.

Use **exponential backoff with jitter** (100 ms, 200 ms, 400 ms… ± random) to avoid synchronised retry storms, and a small maximum (2–3 retries). Retries multiply load: 3 layers × 3 retries = 27 calls to the bottom service.

### Spring Framework 7: built-in `@Retryable`

```java
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.resilience.annotation.EnableResilientMethods;
import org.springframework.resilience.annotation.Retryable;

public class RetryDemo {

    static class TransientGatewayException extends RuntimeException {
        TransientGatewayException(String message) {
            super(message);
        }
    }

    static class ShippingClient {
        private final AtomicInteger attempts = new AtomicInteger();

        public void resetAttempts() {                                 // access state through methods: the bean is a proxy
            attempts.set(0);
        }

        @Retryable(includes = TransientGatewayException.class, maxRetries = 3, delay = 50, multiplier = 2)
        public String createLabel(String orderId) {
            int attempt = attempts.incrementAndGet();
            System.out.println("  attempt " + attempt);
            if (attempt < 3) {
                throw new TransientGatewayException("503 from courier API");
            }
            return "LABEL-" + orderId;
        }

        @Retryable(includes = TransientGatewayException.class, maxRetries = 2, delay = 10)
        public String alwaysFails() {
            System.out.println("  attempt " + attempts.incrementAndGet());
            throw new TransientGatewayException("courier API down");
        }
    }

    @Configuration
    @EnableResilientMethods                     // Spring Framework 7: enables @Retryable and @ConcurrencyLimit
    static class Config {
        @Bean
        ShippingClient shippingClient() {
            return new ShippingClient();
        }
    }

    public static void main(String[] args) {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            ShippingClient client = context.getBean(ShippingClient.class);
            System.out.println("transient failures, then success:");
            System.out.println("  result: " + client.createLabel("ORD-7"));

            client.resetAttempts();
            System.out.println("permanent failure:");
            try {
                client.alwaysFails();
            } catch (RuntimeException e) {
                System.out.println("  gave up: " + e.getClass().getSimpleName()
                        + (e.getCause() != null ? " caused by " + e.getCause().getClass().getSimpleName() : ""));
            }
        }
    }
}
```

**Output:**

```text
transient failures, then success:
  attempt 1
  attempt 2
  attempt 3
  result: LABEL-ORD-7
permanent failure:
  attempt 1
  attempt 2
  attempt 3
  gave up: TransientGatewayException
```

`maxRetries = 2` means one initial attempt plus two retries; after the last failure the original exception is rethrown. Attributes include `delay`, `multiplier`, `maxDelay`, `jitter`, `includes`/`excludes` and `timeout`. `@ConcurrencyLimit(10)` (same package) is a simple bulkhead. On Spring Boot 3 / Framework 6, use **Spring Retry** (`@EnableRetry`, `@Retryable(retryFor = …, backoff = @Backoff(...))`) or **Resilience4j**.

Like all proxy-based annotations, `@Retryable` does not apply to self-invocation. Put retries **outside** `@Transactional` methods — retrying inside a rolled-back transaction cannot succeed.

## Circuit Breaker Awareness

```text
          failures exceed threshold
CLOSED ──────────────────────────────► OPEN  (calls fail fast, fallback used)
  ▲                                      │ wait duration elapses
  │ trial calls succeed                  ▼
  └───────────────────────────────── HALF_OPEN (a few trial calls allowed)
                                         │ trial calls fail
                                         └──────────► OPEN
```

- **Closed:** calls pass; failures/slow calls are counted over a sliding window.
- **Open:** calls are rejected immediately (no waiting on a dead dependency), fallback returns cached/default data.
- **Half-open:** after a wait, a limited number of calls test whether the dependency recovered.

In Spring Boot, the standard library is **Resilience4j** (`resilience4j-spring-boot3`, or Spring Cloud CircuitBreaker):

```java
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import java.time.Duration;
import java.util.function.Supplier;

class ExchangeRateClient {
    private final CircuitBreaker breaker = CircuitBreaker.of("exchangeRates", CircuitBreakerConfig.custom()
            .failureRateThreshold(50)                          // open when ≥ 50 % of calls fail
            .slidingWindowSize(20)
            .waitDurationInOpenState(Duration.ofSeconds(30))
            .permittedNumberOfCallsInHalfOpenState(3)
            .build());

    double usdToInr(Supplier<Double> remoteCall, double cachedRate) {
        try {
            return breaker.executeSupplier(remoteCall);
        } catch (RuntimeException e) {                         // includes CallNotPermittedException when open
            return cachedRate;                                 // fallback: last known value
        }
    }
}
```

With the Spring Boot integration this is usually declarative: `@CircuitBreaker(name = "exchangeRates", fallbackMethod = "cachedRate")` plus `resilience4j.circuitbreaker.instances.exchangeRates.*` properties.

## Timeouts

Every outbound call needs connect and read timeouts — default HTTP clients may wait minutes:

```java
import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

class HttpClients {
    static RestClient courierClient() {
        HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(3));
        return RestClient.builder().baseUrl("https://api.courier.example").requestFactory(factory).build();
    }
}
```

Since Boot 3.4, Spring Boot can also apply default connect/read timeouts to its auto-configured `RestClient.Builder`/`RestTemplateBuilder` through configuration properties. Timeouts should be shorter than the caller's own deadline.

## Retry vs Circuit Breaker

| | Retry | Circuit breaker |
|--|-------|-----------------|
| Assumes | Failure is brief | Failure may last |
| Effect on dependency | More calls | Fewer calls (gives it time to recover) |
| Effect on caller | Higher latency, possible success | Fast failure + fallback |
| Use together | Retry inside the breaker: a few retries for blips, breaker for outages | |

## Common Mistakes

- Retrying non-idempotent operations or client errors (400/401/404).
- Retrying without backoff/jitter, or with too many attempts (retry storms).
- No timeouts at all; timeouts longer than the caller's timeout.
- Retrying inside a transaction or around self-invoked methods.
- Fallbacks that hide outages without metrics/alerts.

## Common Interview Traps

- **"Retry fixes failures."** It fixes transient failures and amplifies load during real outages; circuit breakers and timeouts are needed too.
- **"A circuit breaker retries calls."** It stops calls; retries are a separate pattern.
- **"Resilience4j is required for retries in Spring."** Spring Framework 7 has `@Retryable`; Spring Retry and Resilience4j are alternatives.

## Key Takeaways

- Timeouts everywhere; retry transient, idempotent failures with exponential backoff + jitter; circuit breakers to fail fast during outages; bulkheads to contain slowness; fallbacks for degraded service.
- Framework 7: `@EnableResilientMethods` + `@Retryable`/`@ConcurrencyLimit`; Resilience4j for circuit breakers, rate limiters and bulkheads.
- Proxy-based: no self-invocation; retry outside transactions.
