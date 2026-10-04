# Exceptions in Spring Boot — Practice

### P1. Checked or unchecked?

**Difficulty:** Easy · **Type:** MCQ

Which exception is unchecked?

- A) `java.io.IOException`
- B) `java.sql.SQLException`
- C) `org.springframework.dao.DataIntegrityViolationException`
- D) `java.lang.Exception`

<details>
<summary>Answer</summary>

**Answer:** C) `org.springframework.dao.DataIntegrityViolationException`

**Explanation:** It extends `DataAccessException`, a `RuntimeException`.

</details>

### P2. Default response

**Difficulty:** Easy · **Type:** Behavior

A controller throws `IllegalStateException("Inventory DB password expired")` and no handler exists. What status and body does a JSON client get with Boot defaults? Is the message visible?

<details>
<summary>Answer</summary>

500 with a body containing `timestamp`, `status`, `error` ("Internal Server Error") and `path`. The message is not included (`server.error.include-message=never` by default) — which is good here, since it reveals internal details.

</details>

### P3. Lost cause

**Difficulty:** Medium · **Type:** Code analysis

```java
try {
    gateway.charge(order);
} catch (GatewayTimeoutException e) {
    throw new PaymentFailedException("Payment failed");
}
```

What is lost, and how do you fix it?

<details>
<summary>Answer</summary>

The original exception and its stack trace, so logs cannot show the real cause. Pass it as the cause: `throw new PaymentFailedException("Payment failed", e);` (with a constructor accepting `Throwable cause`).

</details>

### P4. Design the hierarchy

**Difficulty:** Medium · **Type:** Design

List the custom exceptions (with target HTTP status) you would create for an order service handling: order not found, cancelling a shipped order, duplicate order number, payment provider down.

<details>
<summary>Answer</summary>

`OrderNotFoundException extends ResourceNotFoundException` → 404; `OrderNotCancellableException extends BusinessRuleException` → 409 or 422; `DuplicateOrderException extends DuplicateResourceException` → 409; `PaymentProviderUnavailableException extends ExternalServiceException` → 503 (or 502). All extend a common `ApplicationException` (unchecked) with an error code.

</details>
