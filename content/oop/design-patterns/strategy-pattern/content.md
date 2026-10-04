# Strategy

**Category:** Behavioral · **Interview priority:** Core

## Intent

Define a **family of algorithms**, encapsulate each one in its own class, and make them **interchangeable**. Strategy lets the algorithm vary independently from the clients that use it — and be chosen at runtime.

## The Problem

A food-delivery app calculates the delivery fee in different ways:

- standard: ₹30 flat plus ₹8 per km,
- free delivery above an order value,
- surge pricing during peak hours (multiplier),
- partner restaurants with a fixed fee.

Product managers add and change fee rules frequently, run A/B tests, and pick rules per city.

## Why the Naive Solution Fails

```java
long deliveryFee(String rule, long orderValue, double km) {
    switch (rule) {
        case "STANDARD": return 30 + Math.round(8 * km);
        case "FREE_ABOVE_500": return orderValue >= 500 ? 0 : 30 + Math.round(8 * km);
        case "SURGE": return Math.round((30 + 8 * km) * 1.5);
        default: throw new IllegalArgumentException(rule);
    }
}
```

- Every new rule edits this method (OCP violation); the method grows without limit.
- Rules cannot be tested in isolation or reused (free-above-X uses standard pricing inside — duplicated).
- Choosing a rule per city or experiment means passing magic strings around.

## The Pattern Idea

Extract each algorithm into its own class behind a common interface (`DeliveryFeeStrategy`). The **context** (`Checkout`) holds a strategy and delegates the calculation to it. Clients (configuration, experiments) choose which strategy to give the context; new rules are new classes. In modern Java, a strategy interface with one method is a **functional interface**, so simple strategies can be lambdas.

## Structure

```text
 Checkout (Context)                    «interface» DeliveryFeeStrategy (Strategy)
 - feeStrategy ──────────────────────▶ + fee(orderValue, km): long
 + total(orderValue, km)                    ▲         ▲            ▲
                                            ┆         ┆            ┆
                                       Standard  FreeAbove     Surge (wraps another strategy)
                                       (ConcreteStrategies; or lambdas)
```

| Participant | In the example |
|-------------|----------------|
| Strategy | `DeliveryFeeStrategy` |
| ConcreteStrategy | `StandardFee`, `FreeAbove`, `SurgeFee`, lambdas |
| Context | `Checkout` — uses whichever strategy it was given |
| Client | Chooses the strategy (configuration, A/B test, city settings) |

## Java Implementation

```java
import java.util.Map;

public class StrategyDemo {

    @FunctionalInterface
    interface DeliveryFeeStrategy {
        long fee(long orderValue, double km);
    }

    static class StandardFee implements DeliveryFeeStrategy {
        public long fee(long orderValue, double km) {
            return 30 + Math.round(8 * km);
        }
    }

    static class FreeAbove implements DeliveryFeeStrategy {
        private final long threshold;
        private final DeliveryFeeStrategy otherwise;          // reuse another strategy

        FreeAbove(long threshold, DeliveryFeeStrategy otherwise) {
            this.threshold = threshold;
            this.otherwise = otherwise;
        }

        public long fee(long orderValue, double km) {
            return orderValue >= threshold ? 0 : otherwise.fee(orderValue, km);
        }
    }

    static class SurgeFee implements DeliveryFeeStrategy {
        private final DeliveryFeeStrategy base;
        private final double multiplier;

        SurgeFee(DeliveryFeeStrategy base, double multiplier) {
            this.base = base;
            this.multiplier = multiplier;
        }

        public long fee(long orderValue, double km) {
            return Math.round(base.fee(orderValue, km) * multiplier);
        }
    }

    // Context
    static class Checkout {
        private DeliveryFeeStrategy feeStrategy;

        Checkout(DeliveryFeeStrategy feeStrategy) {
            this.feeStrategy = feeStrategy;
        }

        void setFeeStrategy(DeliveryFeeStrategy feeStrategy) {   // can change at runtime
            this.feeStrategy = feeStrategy;
        }

        long total(long orderValue, double km) {
            return orderValue + feeStrategy.fee(orderValue, km);
        }
    }

    public static void main(String[] args) {
        DeliveryFeeStrategy standard = new StandardFee();
        Map<String, DeliveryFeeStrategy> byCity = Map.of(
            "Trichy", new FreeAbove(500, standard),
            "Chennai", standard,
            "Coimbatore", (value, km) -> 25                    // partner flat fee as a lambda
        );

        for (String city : new String[] {"Trichy", "Chennai", "Coimbatore"}) {
            Checkout checkout = new Checkout(byCity.get(city));
            System.out.println(city + ": 400 for 3 km = " + checkout.total(400, 3)
                    + ", 600 for 3 km = " + checkout.total(600, 3));
        }

        Checkout peak = new Checkout(standard);
        peak.setFeeStrategy(new SurgeFee(standard, 1.5));      // switched at runtime (peak hours)
        System.out.println("Peak: 400 for 3 km = " + peak.total(400, 3));
    }
}
```

**Output:**

```text
Trichy: 400 for 3 km = 454, 600 for 3 km = 600
Chennai: 400 for 3 km = 454, 600 for 3 km = 654
Coimbatore: 400 for 3 km = 425, 600 for 3 km = 625
Peak: 400 for 3 km = 481
```

(Standard fee for 3 km = 30 + 24 = 54; surge = round(54 × 1.5) = 81.)

## Execution Flow

1. The client selects a strategy (per city, experiment or time of day) and gives it to the context.
2. The context calls `feeStrategy.fee(...)` whenever it needs the result.
3. The strategy computes using only its inputs; it can be replaced without the context knowing.

## Real-World Examples

- `java.util.Comparator` passed to `Collections.sort`, `List.sort`, `TreeMap`, `PriorityQueue`.
- `java.util.function` interfaces (`Predicate`, `Function`) passed to stream operations.
- `ThreadPoolExecutor` rejection policies (`RejectedExecutionHandler`), `java.util.zip` compression levels.
- Spring: injecting one of several implementations of an interface (`PaymentGateway`, `PasswordEncoder`) is Strategy configured by the container.
- Pricing rules, tax rules, routing algorithms, validation rules, retry/backoff policies.

## When to Use

- Several variants of an algorithm exist and should be chosen at runtime or by configuration.
- A class has a big conditional selecting between behaviours.
- You want to test each algorithm in isolation and add new ones without touching the context.

## When Not to Use

- There is only one algorithm and no expected variation.
- The variants differ trivially (a single number) — a parameter or an enum field is simpler.
- The client must not be burdened with choosing — then encapsulate the choice in a factory or configuration.

## Advantages

- New algorithms without modifying the context (OCP).
- Each algorithm is isolated and testable (SRP).
- Runtime switching; composition instead of subclassing the context.
- Replaces conditionals with polymorphism; with lambdas, very little boilerplate.

## Disadvantages

- More classes (mitigated by lambdas for small strategies).
- Clients or configuration must know the strategies to choose one.
- All strategies must fit one interface; some may receive parameters they do not need.

## Related Patterns

- **State:** same structure; states switch themselves as the object's lifecycle changes, strategies are chosen by the client. See [Design Pattern Comparisons](../design-pattern-comparisons/content.md).
- **Template Method:** varies parts of an algorithm through **inheritance** (subclasses override steps); Strategy varies the whole algorithm through **composition** (swap the object).
- **Decorator:** `SurgeFee` above wraps another strategy — strategies can be decorated.
- **Factory:** often chooses which strategy to use.
- **Command:** encapsulates a request; Strategy encapsulates an algorithm.

## SOLID Connection

- **OCP:** new strategies extend behaviour without modifying the context — the textbook OCP example.
- **SRP:** each algorithm in its own class.
- **DIP:** the context depends on the strategy abstraction.
- **Composition over inheritance:** behaviour is plugged in, not inherited.

## Common Mistakes

- Choosing the strategy with a `switch` inside the context — the conditional just moves.
- Strategies that need access to the context's internals (consider passing a small parameter object).
- Creating a strategy hierarchy for a single algorithm.
- Mutable shared strategy objects used by several threads.

## Key Takeaways

- Strategy: interchangeable algorithms behind one interface; the context delegates.
- Chosen by the client or configuration, switchable at runtime; lambdas make simple strategies concise.
- `Comparator` is the JDK's everyday strategy.
- Strategy (composition, client chooses) vs State (states switch themselves) vs Template Method (inheritance).
