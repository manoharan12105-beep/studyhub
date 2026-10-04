# Interface Segregation Principle

## Definition

**The Interface Segregation Principle (ISP):** *clients should not be forced to depend on methods they do not use.* Prefer several small, client-specific interfaces over one large, general-purpose ("fat") interface.

## Why It Matters

A fat interface couples everything to everything:

- **Implementers** must provide methods that make no sense for them — usually by throwing `UnsupportedOperationException` or leaving them empty (which also breaks [Liskov Substitution](../liskov-substitution-principle/content.md)).
- **Clients** depend on methods they never call, so a change to an unrelated method forces them to recompile, re-test and possibly change.
- **Fakes** for tests must implement dozens of irrelevant methods.

## Bad Design

```java
interface PaymentProvider {
    String pay(long amountPaise);
    String refund(String paymentId, long amountPaise);
    String createSubscription(String plan);
    String convertToEmi(String paymentId, int months);
}

class CardProvider implements PaymentProvider {
    public String pay(long amountPaise) {
        return "card charged";
    }

    public String refund(String paymentId, long amountPaise) {
        return "card refunded";
    }

    public String createSubscription(String plan) {
        return "card mandate created";
    }

    public String convertToEmi(String paymentId, int months) {
        return "converted to EMI";
    }
}

class CashOnDelivery implements PaymentProvider {
    public String pay(long amountPaise) {
        return "collect cash at door";
    }

    public String refund(String paymentId, long amountPaise) {
        throw new UnsupportedOperationException("refund via bank transfer only");
    }

    public String createSubscription(String plan) {
        throw new UnsupportedOperationException("no subscriptions with cash");
    }

    public String convertToEmi(String paymentId, int months) {
        throw new UnsupportedOperationException("no EMI with cash");
    }
}
```

## Problem

- `CashOnDelivery` is forced to implement three methods it cannot support; callers may receive runtime exceptions from methods that look valid.
- The checkout screen only needs `pay`, but it depends on — and must be retested after changes to — subscription and EMI methods.
- Adding a new capability (say `payLater`) forces **every** provider to change.
- A test fake for checkout must implement all four methods.

## Refactored Design

Split by **client need** (role interfaces). A class implements only the roles it can fulfil.

```text
 Payable            Refundable           Subscribable          EmiConvertible
 pay()              refund()             createSubscription()  convertToEmi()
   ▲  ▲                ▲                     ▲                     ▲
   │  └───────────── CardProvider ───────────┴─────────────────────┘
   └── CashOnDelivery
```

## Java Example

```java
import java.util.List;

public class InterfaceSegregationDemo {

    interface Payable {
        String pay(long amountPaise);
    }

    interface Refundable {
        String refund(String paymentId, long amountPaise);
    }

    interface Subscribable {
        String createSubscription(String plan);
    }

    static class CardProvider implements Payable, Refundable, Subscribable {
        public String pay(long amountPaise) {
            return "card charged " + amountPaise;
        }

        public String refund(String paymentId, long amountPaise) {
            return "card refund " + amountPaise + " for " + paymentId;
        }

        public String createSubscription(String plan) {
            return "card mandate for " + plan;
        }
    }

    static class CashOnDelivery implements Payable {            // only what it can do
        public String pay(long amountPaise) {
            return "collect cash " + amountPaise;
        }
    }

    // Each client depends only on the role it needs
    static class Checkout {
        String complete(Payable method, long amountPaise) {
            return method.pay(amountPaise);
        }
    }

    static class ReturnsDesk {
        String processReturn(Refundable method, String paymentId, long amountPaise) {
            return method.refund(paymentId, amountPaise);
        }
    }

    public static void main(String[] args) {
        Checkout checkout = new Checkout();
        List<Payable> methods = List.of(new CardProvider(), new CashOnDelivery());
        for (Payable method : methods) {
            System.out.println(checkout.complete(method, 49_900));
        }

        ReturnsDesk desk = new ReturnsDesk();
        System.out.println(desk.processReturn(new CardProvider(), "PAY-77", 49_900));
        // desk.processReturn(new CashOnDelivery(), ...);   // does not compile: not Refundable
    }
}
```

**Output:**

```text
card charged 49900
collect cash 49900
card refund 49900 for PAY-77
```

### Why it is better

- No class implements a method it cannot honour; impossible calls are rejected at **compile time** instead of failing at runtime.
- Checkout's fake in a test implements one method.
- Adding `PayLater` adds one small interface; only providers supporting it change.

## Splitting Interfaces Well

- Split by **client role**, not arbitrarily by method count: what does *this* caller need?
- Interfaces can be **combined** where convenient: `interface FullServiceProvider extends Payable, Refundable, Subscribable { }`.
- Keep cohesive operations together: `open`/`read`/`close` of a stream belong in one interface because every client needs them together.

## Real-World Interpretation

- JDK: `Comparable`, `Runnable`, `AutoCloseable`, `Iterable` — tiny, single-purpose interfaces implemented by many unrelated classes. `java.util.function` has one-method interfaces for every shape of lambda.
- Collections: read-only access through `Iterable`/`Collection` parameters when a method only needs to read.
- Spring Data offers `Repository` (marker), `CrudRepository`, `PagingAndSortingRepository` — choose the narrowest one you need.
- Microservice APIs: separate client libraries per use case instead of one giant client.

## Benefits

- Implementations are honest: no fake or throwing methods.
- Clients are insulated from changes to methods they do not use.
- Small interfaces are easy to implement, mock and reuse.
- Combining small interfaces is easy; splitting a fat one later is hard.

## Misuse and Overengineering

- **One-method interfaces everywhere** for code with a single client and a single implementation add ceremony without benefit.
- **Splitting cohesive operations** (`open` in one interface, `close` in another) forces clients to depend on several interfaces to do one job.
- ISP is about **client needs**; if every client uses every method, a larger interface is fine.

## Common Misconceptions

- **"Every interface should have one method."** Interfaces should match what their clients use.
- **"ISP only matters for implementers."** It matters equally for clients, who should not depend on what they do not use.
- **"Throwing `UnsupportedOperationException` is an acceptable way to skip a method."** It is a sign the interface is too broad (and an LSP risk).

## Key Takeaways

- Clients should not depend on methods they do not use.
- Split fat interfaces into role interfaces; classes implement only the roles they can honour.
- Benefits: honest implementations, compile-time safety, smaller test fakes, isolation from unrelated changes.
- Don't over-split cohesive operations or create interfaces with no real clients.
