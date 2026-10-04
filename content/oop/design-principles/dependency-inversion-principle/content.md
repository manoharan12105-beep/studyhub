# Dependency Inversion Principle

## Definition

**The Dependency Inversion Principle (DIP)** has two parts:

1. *High-level modules should not depend on low-level modules. Both should depend on abstractions.*
2. *Abstractions should not depend on details. Details should depend on abstractions.*

**High-level** modules contain the business policy (placing an order, approving a loan). **Low-level** modules contain mechanisms and details (MySQL access, SMTP, an HTTP client for a payment vendor). DIP says the business policy should define the abstraction it needs (`OrderRepository`, `PaymentGateway`), and the infrastructure should implement it — so the direction of source-code dependency points **toward** the policy, not away from it.

## Why It Matters

- **Stability:** business rules change for business reasons; databases, vendors and frameworks change for technical reasons. DIP stops technical changes from forcing edits to business code.
- **Testability:** business logic can be tested with fake implementations of its abstractions — no database or network.
- **Replaceability:** swap MySQL for PostgreSQL, one SMS vendor for another, by writing a new implementation.

## Bad Design

```java
class MySqlOrderRepository {
    void save(String orderId, long amountPaise) {
        System.out.println("INSERT INTO orders ... " + orderId);
    }
}

class SmsSender {
    void sendSms(String phone, String text) {
        System.out.println("SMS to " + phone + ": " + text);
    }
}

class OrderService {                                        // high-level policy
    private final MySqlOrderRepository repository = new MySqlOrderRepository();   // depends on a detail
    private final SmsSender sms = new SmsSender();                                 // depends on a detail

    void placeOrder(String orderId, long amountPaise, String phone) {
        if (amountPaise <= 0) {
            throw new IllegalArgumentException("invalid amount");
        }
        repository.save(orderId, amountPaise);
        sms.sendSms(phone, "Order " + orderId + " placed");
    }
}
```

```text
 OrderService ──────▶ MySqlOrderRepository      (policy depends on details:
      │                                           arrows point DOWN to infrastructure)
      └────────────▶ SmsSender
```

## Problem

- Moving to PostgreSQL or adding email notifications means **editing `OrderService`**, the class with the business rules.
- `OrderService` cannot be unit-tested without a database and an SMS gateway (or their console stand-ins here).
- The business module cannot be reused with different infrastructure.
- `OrderService` also decides **which** implementations to create — a second responsibility.

## Refactored Design

The high-level module **owns** the abstractions it needs; low-level modules implement them. Dependencies are **supplied from outside** (dependency injection).

```text
 ┌──────────── business (high level) ────────────┐
 │ OrderService ──▶ OrderRepository  (interface) │
 │              └─▶ OrderNotifier    (interface) │
 └──────────────────────▲────────────▲───────────┘
                        │            │   implements (arrows now point UP to the abstractions)
 ┌──────── infrastructure (low level) ───────────┐
 │ MySqlOrderRepository      SmsOrderNotifier    │
 └───────────────────────────────────────────────┘
```

That reversal of the arrow — infrastructure depends on business abstractions — is the "inversion".

## Java Example

```java
import java.util.ArrayList;
import java.util.List;

public class DependencyInversionDemo {

    // ---------- Abstractions owned by the business layer ----------
    interface OrderRepository {
        void save(String orderId, long amountPaise);
    }

    interface OrderNotifier {
        void orderPlaced(String orderId, String contact);
    }

    // ---------- High-level policy: depends only on abstractions ----------
    static class OrderService {
        private final OrderRepository repository;
        private final OrderNotifier notifier;

        OrderService(OrderRepository repository, OrderNotifier notifier) {   // injected
            this.repository = repository;
            this.notifier = notifier;
        }

        void placeOrder(String orderId, long amountPaise, String contact) {
            if (amountPaise <= 0) {
                throw new IllegalArgumentException("invalid amount");
            }
            repository.save(orderId, amountPaise);
            notifier.orderPlaced(orderId, contact);
        }
    }

    // ---------- Low-level details: implement the abstractions ----------
    static class MySqlOrderRepository implements OrderRepository {
        public void save(String orderId, long amountPaise) {
            System.out.println("MySQL: INSERT order " + orderId);
        }
    }

    static class SmsOrderNotifier implements OrderNotifier {
        public void orderPlaced(String orderId, String contact) {
            System.out.println("SMS to " + contact + ": order " + orderId + " placed");
        }
    }

    // A test double: same abstraction, no infrastructure
    static class InMemoryOrderRepository implements OrderRepository {
        final List<String> saved = new ArrayList<>();

        public void save(String orderId, long amountPaise) {
            saved.add(orderId);
        }
    }

    public static void main(String[] args) {
        // Production wiring (the "composition root" chooses the details)
        OrderService production = new OrderService(new MySqlOrderRepository(), new SmsOrderNotifier());
        production.placeOrder("ORD-1", 59_900, "+91-98xxxxxx01");

        // Test wiring: same business code, fake infrastructure
        InMemoryOrderRepository fakeRepo = new InMemoryOrderRepository();
        OrderService underTest = new OrderService(fakeRepo, (id, contact) -> { });   // lambda notifier
        underTest.placeOrder("ORD-2", 10_000, "test");
        System.out.println("Saved in memory: " + fakeRepo.saved);
    }
}
```

**Output:**

```text
MySQL: INSERT order ORD-1
SMS to +91-98xxxxxx01: order ORD-1 placed
Saved in memory: [ORD-2]
```

### Why it is better

- `OrderService` compiles and runs without any database or SMS code.
- Switching to PostgreSQL or email is a new implementation plus a one-line wiring change.
- The abstractions are shaped by what the **business** needs (`orderPlaced`), not by what a vendor offers (`sendSms(phone, text)`).

## Abstractions Should Not Depend on Details

The second rule is easy to miss. An interface such as

```java
interface OrderRepository {
    void save(java.sql.Connection connection, String orderId);   // leaks JDBC into the abstraction
}
```

is not a real abstraction: every implementation and every caller is tied to JDBC. Abstractions should speak the language of the domain (`save(Order order)`), and exceptions should be domain-level ([OOP with Exceptions](../../applied-oop/oop-with-exceptions/content.md#abstraction-and-exceptions)).

## DIP vs Dependency Injection vs Inversion of Control

| Term | What it is | Level |
|------|-----------|-------|
| **Dependency Inversion Principle** | Design rule: policy and details both depend on abstractions; abstractions belong to the policy | Architecture / design |
| **Dependency Injection** | Technique: an object receives its dependencies from outside (constructor, setter) instead of creating them | Code |
| **Inversion of Control** | General idea: a framework or container calls your code and controls object creation and flow, not your code | Framework |

DI is the most common way to **implement** DIP; a DI container (Spring) is an **IoC** mechanism that automates DI. Full treatment: [Dependency Injection](../dependency-injection/content.md).

## Real-World Interpretation

- **Layered / hexagonal architecture:** the domain layer defines ports (`PaymentGateway`, `OrderRepository`); adapters in the infrastructure layer implement them (Razorpay adapter, JPA repository).
- **Spring Boot:** services depend on interfaces; Spring injects the concrete beans. Spring Data generates repository implementations behind interfaces your code defines.
- **JDBC itself:** your code depends on the `java.sql` interfaces; vendors supply drivers that implement them.

## Benefits

- Business logic isolated from volatile technical details.
- Unit tests with fakes; fast and deterministic.
- Implementations replaceable and combinable (decorators for caching, logging, retries).
- Teams can build business logic and infrastructure in parallel against agreed interfaces.

## Misuse and Overengineering

- **Interfaces for everything:** abstracting stable, simple value classes or utility code (`LocalDate`, `String` handling) adds nothing.
- **Mirror interfaces:** `UserService` + `UserServiceImpl` where the interface just copies the class and nobody ever substitutes it — often ceremony, though it may be justified by framework proxies or module boundaries.
- **Wrong ownership:** an interface defined in the infrastructure package and imported by the domain does not invert anything.
- Apply DIP at **boundaries that change or need faking**: persistence, external services, time, messaging.

## Common Misconceptions

- **"DIP means using interfaces."** It means the dependency direction points toward the policy; interfaces are the tool.
- **"DIP and DI are the same."** DIP is the principle; DI is a technique to satisfy it.
- **"You need Spring for DIP."** Plain constructors and a `main` method that wires objects are enough.
- **"Low-level modules are less important."** "Low-level" means closer to I/O and details, not less valuable.

## Key Takeaways

- High-level policy and low-level details both depend on abstractions; the abstraction belongs to the policy.
- Abstractions speak the domain's language and must not leak details (JDBC types, vendor exceptions).
- Supply implementations from outside (DI) at a composition root.
- Gains: replaceable infrastructure, testable business logic, stable core.
- Apply at volatile boundaries, not to every class.
