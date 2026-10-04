# Logging with SLF4J and Logback — Practice

### P1. Which levels appear?

**Difficulty:** Easy · **Type:** MCQ

With `logging.level.com.example=WARN`, which calls in `com.example.OrderService` produce output?

- A) Only `log.warn`
- B) `log.warn` and `log.error`
- C) `log.info`, `log.warn` and `log.error`
- D) All levels

<details>
<summary>Answer</summary>

**Answer:** B) `log.warn` and `log.error`

</details>

### P2. Fix the log line

**Difficulty:** Easy · **Type:** Code analysis

```java
log.debug("Cart: " + cart.toString() + " user token: " + token);
```

<details>
<summary>Answer</summary>

Do not log the token at all; use a placeholder for the cart and log only safe, relevant fields: `log.debug("Cart {} has {} items", cart.id(), cart.size());`.

</details>

### P3. Production incident

**Difficulty:** Medium · **Type:** Scenario

Users report intermittent failures on `/api/checkout`. Logs are at INFO and show nothing useful. How do you investigate without redeploying?

<details>
<summary>Answer</summary>

Use Actuator's loggers endpoint to set `com.example.checkout` (and maybe `org.hibernate.SQL`) to DEBUG temporarily, search logs by correlation/trace id of failing requests, correlate with metrics (error rate, latency) and traces, then reset the level to INFO.

</details>
