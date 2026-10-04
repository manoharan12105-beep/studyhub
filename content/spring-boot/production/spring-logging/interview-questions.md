# Logging with SLF4J and Logback — Interview Questions

## Beginner

### Q1. What logging framework does Spring Boot use by default?

<details>
<summary>Answer</summary>

Logback, through `spring-boot-starter-logging`, with SLF4J as the API your code uses. Spring's own logging goes through `spring-jcl` and is routed to the same backend. Log4j2 can replace Logback by switching starters.

</details>

### Q2. What are the log levels, in order?

<details>
<summary>Answer</summary>

TRACE, DEBUG, INFO, WARN, ERROR (and OFF to disable). Enabling a level also enables all more severe levels. Spring Boot's default root level is INFO.

</details>

### Q3. How do you change the log level of a package?

<details>
<summary>Answer</summary>

With a property such as `logging.level.com.example.orders=DEBUG` (in a config file, environment variable `LOGGING_LEVEL_COM_EXAMPLE_ORDERS=DEBUG`, or command-line argument), or at runtime through Actuator's `/actuator/loggers/com.example.orders` endpoint.

</details>

## Intermediate

### Q4. Why use SLF4J instead of calling Logback directly?

<details>
<summary>Answer</summary>

SLF4J is a facade: code depends only on a stable API, and the logging backend can be chosen or changed at deployment without code changes. Libraries also log through it (or are bridged), so one configuration controls all logs.

</details>

### Q5. Why are placeholders (`{}`) preferred over string concatenation?

<details>
<summary>Answer</summary>

With placeholders, the message is formatted only if the level is enabled, avoiding string building and `toString()` calls for disabled DEBUG logs. They also keep the message template constant, which helps log aggregation and structured logging.

</details>

### Q6. What is MDC and how is it used for request tracing?

<details>
<summary>Answer</summary>

The Mapped Diagnostic Context is a thread-local map whose entries can be included in every log line (`%X{correlationId}` or JSON fields). A filter sets a correlation id per request (from a header or generated), all logs of that request include it, and it is removed in `finally`. Micrometer Tracing populates `traceId`/`spanId` automatically for distributed tracing.

</details>

## Advanced

### Q7. How would you design logging for a containerised Spring Boot service?

<details>
<summary>Answer</summary>

Log to stdout in structured JSON (`logging.structured.format.console=ecs` or `logstash`), let the platform ship logs to a central store, include service name, environment, trace/span ids and correlation ids, keep production at INFO with targeted DEBUG enabled temporarily via Actuator, mask sensitive data, avoid logging full payloads, and alert on ERROR rates together with metrics.

</details>

### Q8. A log statement `log.error("Failed: " + e.getMessage())` appears in code review. What do you say?

<details>
<summary>Answer</summary>

It loses the stack trace and exception type, and builds the string eagerly. Use `log.error("Payment failed for order {}", orderId, e)` — context via placeholders and the exception as the last argument. Also check the exception is not logged again by higher layers.

</details>
