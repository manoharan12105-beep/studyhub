# Open/Closed Principle

## Definition

**The Open/Closed Principle (OCP):** *software entities (classes, modules, functions) should be open for extension but closed for modification.* You should be able to add new behaviour by **adding new code** (a new class, a new implementation) rather than **editing existing, working code**.

## Why It Matters

Every edit to working code risks breaking it and forces re-testing everything that depends on it. In systems where new variants arrive regularly — payment methods, discount types, report formats, notification channels — code that must be edited for every variant becomes a bottleneck and a source of regressions. OCP turns "add a variant" into "add a class".

## Bad Design

```java
class DiscountCalculator {
    long discountPaise(String customerType, long amountPaise) {
        switch (customerType) {
            case "REGULAR":
                return 0;
            case "PREMIUM":
                return amountPaise * 10 / 100;
            case "EMPLOYEE":
                return amountPaise * 25 / 100;
            default:
                throw new IllegalArgumentException("unknown type " + customerType);
        }
    }
}
```

## Problem

- Adding a "STUDENT" discount means **editing** `DiscountCalculator`, re-testing every existing case, and redeploying it.
- The same `switch` on `customerType` tends to be **duplicated** elsewhere (loyalty points, free delivery), so each new type means hunting down every `switch`.
- The class grows without limit and mixes unrelated business rules.
- Customer types are strings, so typos compile.

## Refactored Design

Identify **what varies** (the discount rule) and put it behind an abstraction. The calculator depends on the abstraction and never changes when a new rule is added.

```text
 Checkout ──uses──▶ DiscountPolicy (interface)
                         ▲        ▲          ▲            ▲
                  NoDiscount  PercentageDiscount  FlatDiscount  (StudentDiscount — added later,
                                                                 no existing class edited)
```

## Java Example

```java
import java.util.List;

public class OpenClosedDemo {

    interface DiscountPolicy {                         // the extension point
        long discountPaise(long amountPaise);
        String name();
    }

    static class NoDiscount implements DiscountPolicy {
        public long discountPaise(long amountPaise) {
            return 0;
        }

        public String name() {
            return "regular";
        }
    }

    static class PercentageDiscount implements DiscountPolicy {
        private final String name;
        private final int percent;

        PercentageDiscount(String name, int percent) {
            this.name = name;
            this.percent = percent;
        }

        public long discountPaise(long amountPaise) {
            return amountPaise * percent / 100;
        }

        public String name() {
            return name;
        }
    }

    // Added later as a NEW class — Checkout and the other policies are untouched
    static class CappedStudentDiscount implements DiscountPolicy {
        public long discountPaise(long amountPaise) {
            return Math.min(amountPaise * 15 / 100, 20_000);   // 15%, at most Rs 200
        }

        public String name() {
            return "student";
        }
    }

    static class Checkout {                            // closed for modification
        long payablePaise(long amountPaise, DiscountPolicy policy) {
            return amountPaise - policy.discountPaise(amountPaise);
        }
    }

    public static void main(String[] args) {
        Checkout checkout = new Checkout();
        List<DiscountPolicy> policies = List.of(
            new NoDiscount(),
            new PercentageDiscount("premium", 10),
            new PercentageDiscount("employee", 25),
            new CappedStudentDiscount()
        );
        for (DiscountPolicy policy : policies) {
            System.out.println(policy.name() + ": " + checkout.payablePaise(200_000, policy));
        }
    }
}
```

**Output:**

```text
regular: 200000
premium: 180000
employee: 150000
student: 180000
```

### Why it is better

- The student discount was added without opening `Checkout` or any existing policy.
- Each rule lives in its own small class with its own tests.
- The choice of policy is made once (for example by a factory or configuration), not in scattered `switch` statements.

## Ways to Achieve OCP in Java

| Mechanism | Example |
|-----------|---------|
| Interface + implementations (Strategy) | `DiscountPolicy`, `Comparator`, `PaymentMethod` |
| Abstract class with hooks (Template Method) | `ReportGenerator` with abstract `writeBody()` |
| Decoration | Wrapping a `DataSource` with caching or logging ([Decorator](../../design-patterns/decorator-pattern/content.md)) |
| Event listeners | Adding an observer instead of editing the subject ([Observer](../../design-patterns/observer-pattern/content.md)) |
| Configuration / registration | A map from `CustomerType` to `DiscountPolicy` filled at startup; Spring injecting `List<DiscountPolicy>` |
| Enums with behaviour | Each constant overrides an abstract method (closed set, but no scattered `switch`) |

## Real-World Interpretation

- **Plugins and extensions:** IDE plugins, browser extensions and Java's `ServiceLoader` let others add features without changing the host.
- **Spring Boot:** declare a new `@Component` implementing `PaymentProvider`; a service that receives `List<PaymentProvider>` picks it up without being edited.
- **Servlet filters / middleware:** add a new filter to the chain instead of editing the request handler.

"Closed" does not mean frozen forever: bug fixes, refactoring and genuinely new requirements for the stable part still change it. OCP targets the **expected axis of variation**.

## Benefits

- New features carry less risk to existing behaviour.
- Smaller, cohesive classes per variant; easier unit tests.
- Parallel development: teams add variants independently.
- Removes duplicated `switch`/`if` chains on type codes.

## Misuse and Overengineering

- **Guessing the wrong axis:** adding extension points everywhere "just in case" creates abstractions nobody uses, while the real change arrives somewhere else.
- **Abstraction for a single variant:** an interface with one implementation and no foreseeable second one adds indirection without benefit.
- A practical rule: write the simple version first; when the **second** variant appears (or is concretely planned), refactor toward OCP along that axis.
- A `switch` over a **closed, stable** set (days of the week, or a sealed hierarchy handled exhaustively) is not a violation.

## Common Misconceptions

- **"OCP means you can never edit a class."** It means you should not need to edit it to add an expected kind of variation.
- **"OCP requires inheritance."** Composition with interfaces is the usual way.
- **"Every `if` statement violates OCP."** Only repeated branching on a type code that keeps growing.

## Key Takeaways

- Open for extension, closed for modification: add variants as new code.
- Find what varies, hide it behind an abstraction, depend on the abstraction.
- Strategy, Template Method, Decorator and Observer are standard OCP tools.
- Apply along real axes of change; avoid speculative extension points.
