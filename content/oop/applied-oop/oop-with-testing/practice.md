# OOP with Testing — Practice

### P1. Spot the seam

**Difficulty:** Easy · **Type:** MCQ

Which version of `ReportJob` can be unit-tested without a real database?

- A) `class ReportJob { private final Database db = new Database(); }`
- B) `class ReportJob { void run() { Database.getInstance().query(...); } }`
- C) `class ReportJob { private final ReportSource source; ReportJob(ReportSource source) { this.source = source; } }`
- D) `class ReportJob { static Database db; }`

<details>
<summary>Answer</summary>

**Answer:** C

**Explanation:** Only C receives its dependency as an interface through the constructor, so a test can pass a fake `ReportSource`.

</details>

### P2. Classify the doubles

**Difficulty:** Easy · **Type:** Conceptual

Classify: (a) an `InMemoryOrderRepository` backed by a `HashMap`; (b) a `PriceService` replacement whose `price()` always returns 100; (c) a `Notifier` replacement that records every message so the test can inspect them.

<details>
<summary>Answer</summary>

**Answer:** (a) fake, (b) stub, (c) spy.

**Explanation:** A fake works for real in a simplified way; a stub gives canned answers; a spy records interactions.

</details>

### P3. Make it testable

**Difficulty:** Medium · **Type:** Coding

```java
import java.util.Random;

class OtpService {
    String generate() {
        int code = new Random().nextInt(900_000) + 100_000;
        return String.valueOf(code);
    }
}
```

Redesign `OtpService` so a test can verify that it returns a 6-digit code built from a known random value.

<details>
<summary>Answer</summary>

```java
import java.util.function.IntSupplier;

class OtpService {
    private final IntSupplier randomBelow900000;

    OtpService(IntSupplier randomBelow900000) {
        this.randomBelow900000 = randomBelow900000;
    }

    String generate() {
        return String.valueOf(randomBelow900000.getAsInt() + 100_000);
    }
}
```

**Explanation:** Randomness becomes an injected dependency. Production: `new OtpService(() -> secureRandom.nextInt(900_000))`; test: `new OtpService(() -> 23_456)` and assert the result is `"123456"`.

</details>

### P4. Redesign for tests

**Difficulty:** Hard · **Type:** Design

`OrderService.placeOrder(cart)` validates stock by calling a static `InventoryDb.check()`, charges the card through `new PaymentClient()`, saves via `OrderDao.INSTANCE.save()`, and emails the customer with `EmailUtil.send()`. Propose a testable design and list the tests you would write.

<details>
<summary>Answer</summary>

**Design:** define interfaces `InventoryChecker`, `PaymentGateway`, `OrderRepository`, `Notifier`; inject all four through `OrderService`'s constructor; production wiring (manual or Spring) passes the real implementations.

**Tests (with fakes/stubs):**

1. Out-of-stock cart → order rejected, no payment attempted, nothing saved.
2. Payment declined → order not saved, no email sent, a clear exception or result.
3. Happy path → payment charged with the correct amount, order saved once, one confirmation email.
4. Repository failure after payment → the defined compensation (e.g. a refund request) happens.

**Why:** each collaborator becomes controllable, so every branch of `placeOrder` can be exercised in milliseconds without a database, gateway or mail server.

</details>
