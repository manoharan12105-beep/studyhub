# Dependency Inversion Principle — Practice

### P1. Which follows DIP?

**Difficulty:** Easy · **Type:** MCQ

- A) `class Billing { private final StripeClient stripe = new StripeClient(); }`
- B) `class Billing { private final PaymentGateway gateway; Billing(PaymentGateway gateway) { this.gateway = gateway; } }`
- C) `class Billing { void charge() { StripeClient.getInstance().charge(); } }`
- D) `class Billing extends StripeClient { }`

<details>
<summary>Answer</summary>

**Answer:** B

**Explanation:** `Billing` depends on an abstraction supplied from outside. A and C hard-wire a concrete vendor; D couples by inheritance.

</details>

### P2. Who owns the interface?

**Difficulty:** Medium · **Type:** Conceptual

A team puts `interface NotificationSender` in the package `com.shop.infrastructure.sms` next to `TwilioSmsSender`, and the domain package `com.shop.orders` imports it. Is the dependency inverted? What would you change?

<details>
<summary>Answer</summary>

**Answer:** Only partly. The domain now depends on the infrastructure package (where the interface lives), and the interface is likely shaped around SMS (`sendSms(phone, text)`).

**Change:** move the abstraction into the domain package and name it for the domain need (`OrderNotifier.orderPlaced(order)`); the infrastructure package implements it. Then the domain imports nothing from infrastructure.

</details>

### P3. Refactor

**Difficulty:** Medium · **Type:** Coding

```java
class AttendanceReport {
    String build() {
        java.time.LocalDate today = java.time.LocalDate.now();
        int present = new MySqlAttendanceDao().countPresent(today);
        return today + ": " + present + " present";
    }
}

class MySqlAttendanceDao {
    int countPresent(java.time.LocalDate date) {
        return 0;   // queries MySQL in real code
    }
}
```

Refactor `AttendanceReport` so it follows DIP and can be tested for any date.

<details>
<summary>Answer</summary>

```java
import java.time.Clock;
import java.time.LocalDate;

interface AttendanceSource {
    int countPresent(LocalDate date);
}

class AttendanceReport {
    private final AttendanceSource source;
    private final Clock clock;

    AttendanceReport(AttendanceSource source, Clock clock) {
        this.source = source;
        this.clock = clock;
    }

    String build() {
        LocalDate today = LocalDate.now(clock);
        return today + ": " + source.countPresent(today) + " present";
    }
}
```

**Explanation:** `MySqlAttendanceDao` implements `AttendanceSource`; tests pass a lambda (`date -> 42`) and `Clock.fixed(...)`. Both the database and the clock are details the report no longer controls.

</details>
