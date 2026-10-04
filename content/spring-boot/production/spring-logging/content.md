# Logging with SLF4J and Logback

**Module:** Production Spring Boot · **Interview priority:** Frequently asked

## Definition

- **Logging** records what an application does — requests, decisions, failures — for debugging, auditing and monitoring.
- **SLF4J** (Simple Logging Facade for Java) is the logging **API** your code calls (`Logger`, `LoggerFactory`).
- **Logback** is the default logging **implementation** in Spring Boot (from `spring-boot-starter-logging`), which formats and writes log events to the console, files or other appenders. Log4j2 is the main alternative.
- **Log levels** classify events by severity: `TRACE` < `DEBUG` < `INFO` < `WARN` < `ERROR` (plus `OFF`).

## Why It Matters

- In production, logs (with metrics and traces) are how you find out what went wrong at 2 a.m.
- Interviewers ask about levels, the facade pattern, parameterised logging, MDC/correlation ids and what must never be logged.

## Logging

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    void place(long orderId, long customerId, int items) {
        log.info("Placing order {} for customer {} with {} items", orderId, customerId, items);   // placeholders
        try {
            charge(orderId);
        } catch (IllegalStateException e) {
            log.error("Payment failed for order {}", orderId, e);   // exception as LAST argument → stack trace
            throw e;
        }
        log.debug("Order {} placed", orderId);                     // only when DEBUG is enabled
    }

    private void charge(long orderId) {
    }
}
```

- **Placeholders `{}`** avoid building strings when the level is disabled and keep messages structured. Avoid `"Order " + id` concatenation.
- Pass the **exception as the last argument** to get the stack trace.
- With Lombok, `@Slf4j` generates the `log` field.

## Log Levels

| Level | Use | Production default |
|-------|-----|-------------------|
| `ERROR` | Something failed and needs attention (unexpected exception, data inconsistency) | On |
| `WARN` | Unexpected but handled; may need attention (retry succeeded, deprecated config, slow call) | On |
| `INFO` | Important business/lifecycle events (startup, order placed, job finished) | On (Boot default level) |
| `DEBUG` | Detailed diagnostic information for developers | Off |
| `TRACE` | Very fine-grained (every step, SQL parameters) | Off |

Setting a level enables it **and all more severe levels**.

```properties
logging.level.root=INFO
logging.level.com.example.shop=DEBUG
logging.level.org.hibernate.SQL=DEBUG                 # SQL statements
logging.level.org.hibernate.orm.jdbc.bind=TRACE       # SQL parameter values (never in production)
logging.level.org.springframework.security=DEBUG      # security decisions
```

Levels can be changed **at runtime** through Actuator's `/actuator/loggers/{name}` endpoint (POST `{"configuredLevel":"DEBUG"}`), without a restart.

## SLF4J

SLF4J is a **facade**: your code depends only on the API; the binding decides the implementation at runtime. Libraries using other APIs (Commons Logging via `spring-jcl`, java.util.logging, Log4j 1 API) are routed to the same backend with bridges, so all logs share one configuration and format.

```text
your code ──► SLF4J API ──► Logback (default)  ─► console / file / JSON appenders
Spring    ──► spring-jcl ─┘
Hibernate ──► JBoss Logging ─┘
```

## Logback Awareness

Spring Boot configures Logback with sensible defaults (console pattern with timestamp, level, PID, thread, logger, message). Customise with properties first:

```properties
logging.file.name=logs/shop.log                 # also write to a file (rolled by size/date)
logging.logback.rollingpolicy.max-file-size=50MB
logging.logback.rollingpolicy.max-history=14
logging.pattern.console=%d{ISO8601} %-5level [%X{correlationId}] %logger{36} - %msg%n
logging.structured.format.console=ecs           # Boot 3.4+: JSON logs (ecs, logstash, gelf)
```

For advanced setups use `logback-spring.xml` (not `logback.xml`), which supports `<springProfile name="prod">` and `<springProperty>`.

**Structured (JSON) logging** is preferred in containers: log aggregators (ELK/OpenSearch, Loki, Datadog, CloudWatch) index fields instead of parsing text. In containers, log to **stdout**; the platform collects it.

## MDC and Correlation IDs

The **Mapped Diagnostic Context** (`org.slf4j.MDC`) attaches key/value pairs to every log line written by the current thread — e.g. a correlation id set in a filter (see [Filters and Interceptors](../../spring-mvc/filters-and-interceptors/content.md)) or the user id. With Micrometer Tracing, Spring Boot adds `traceId` and `spanId` automatically, linking logs to distributed traces. Clear MDC values at the end of the request (threads are pooled).

## What Not to Log

- Passwords, tokens (JWT, refresh, API keys), session ids, OTPs.
- Full card numbers, CVV, Aadhaar/PAN, health data — mask or omit personal data.
- Entire request/response bodies by default.
- Logging in tight loops (cost and noise).

Logging exceptions: log once, where it is handled — not at every layer it passes through.

## Common Mistakes

- `System.out.println` in production code (no levels, no format, no routing).
- String concatenation in log calls; `log.error(e.getMessage())` losing the stack trace.
- DEBUG enabled in production for all packages → huge volume, cost, and leaked data.
- Logging and rethrowing at every layer → duplicate stack traces.
- Using `logback.xml` and wondering why `<springProfile>` does not work.

## Common Interview Traps

- **"SLF4J is a logging framework."** It is a facade/API; Logback (or Log4j2) does the actual logging.
- **"Setting DEBUG shows only debug messages."** It shows DEBUG and everything more severe.
- **"Logging is free."** I/O, serialisation and storage cost real money and latency; levels and sampling matter.

## Key Takeaways

- Code against SLF4J; Boot uses Logback by default; configure with `logging.*` properties or `logback-spring.xml`.
- Levels: TRACE < DEBUG < INFO < WARN < ERROR; Boot default INFO; change at runtime via Actuator.
- Use placeholders, pass exceptions last, add correlation/trace ids via MDC, emit JSON in containers, never log secrets.
