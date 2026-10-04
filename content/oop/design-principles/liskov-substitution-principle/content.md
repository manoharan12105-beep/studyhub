# Liskov Substitution Principle

## Definition

**The Liskov Substitution Principle (LSP)**, formulated by Barbara Liskov: *if `S` is a subtype of `T`, then objects of type `T` may be replaced by objects of type `S` without breaking the correctness of the program.* In practice: **any code written against a base type (class or interface) must keep working, unchanged and without surprises, when given any of its subtypes.**

LSP is about **behaviour**, not syntax. The Java compiler checks that an override has a compatible signature; it cannot check that the override keeps the promises the base type makes.

## Why It Matters

- Runtime polymorphism is only useful if callers can trust the base type's contract. If a subtype breaks it, every caller must start checking `instanceof` — and the [Open/Closed Principle](../open-closed-principle/content.md) collapses.
- Violations hide until runtime and appear far from their cause: a method that "worked for years" fails when someone passes a new subclass.
- LSP is the practical test for whether an IS-A relationship is real: "a square is a rectangle" sounds true in geometry, but may be false for **mutable rectangle objects**.

## The Contract a Subtype Must Honour

Think of every method as a contract with **preconditions** (what callers must ensure), **postconditions** (what the method guarantees), and the class's **invariants** (what is always true). A subtype must:

| Rule | Meaning | Violation example |
|------|---------|-------------------|
| **Preconditions cannot be strengthened** | Accept at least everything the base accepts | Base `withdraw(amount)` accepts any positive amount; subtype rejects amounts below 1,000 |
| **Postconditions cannot be weakened** | Guarantee at least what the base guarantees | Base `sort()` returns a sorted list; subtype returns it "mostly sorted" for speed |
| **Invariants must be preserved** | Keep every property the base type maintains | Base guarantees `balance >= 0`; subtype allows overdraft |
| **No new unexpected exceptions** | Throw only exceptions the contract allows | Override throws `UnsupportedOperationException` for an operation the base promises |
| **History constraint** | Do not allow state changes the base type forbids | Base `ImmutablePoint`; subtype adds setters |

The signature-level rules (covariant return types, no broader checked exceptions, no reduced visibility) are the part Java enforces at compile time; the behavioural rules above are your responsibility.

## Bad Design: Square Extends Rectangle

```java
public class LspViolationDemo {

    static class Rectangle {
        protected int width;
        protected int height;

        void setWidth(int width) {
            this.width = width;
        }

        void setHeight(int height) {
            this.height = height;
        }

        int area() {
            return width * height;
        }
    }

    static class Square extends Rectangle {          // "a square IS-A rectangle"
        @Override
        void setWidth(int side) {                     // keep the square's invariant: width == height
            this.width = side;
            this.height = side;
        }

        @Override
        void setHeight(int side) {
            this.width = side;
            this.height = side;
        }
    }

    // Client written against Rectangle, relying on its contract:
    // "setWidth changes only the width; setHeight changes only the height"
    static void resizeToBanner(Rectangle r) {
        r.setWidth(10);
        r.setHeight(2);
        System.out.println(r.getClass().getSimpleName() + " area = " + r.area() + " (expected 20)");
    }

    public static void main(String[] args) {
        resizeToBanner(new Rectangle());
        resizeToBanner(new Square());
    }
}
```

**Output:**

```text
Rectangle area = 20 (expected 20)
Square area = 4 (expected 20)
```

## Problem

| | What the compiler knows | What actually happens |
|--|------------------------|----------------------|
| `resizeToBanner(new Square())` | `Square` is a `Rectangle`; the call is type-correct | `setHeight(2)` also changes the width, so the client's postcondition (`area == width × height` as set) fails |

The subclass **weakened a postcondition** of `setWidth`/`setHeight` ("the other dimension is unchanged"). Every client written for rectangles is now potentially broken, and the only workaround — `if (r instanceof Square)` — spreads type checks through the code.

Geometry says a square is a rectangle; but a **mutable** `Rectangle` object promises independent width and height, which a square cannot honour. IS-A must hold for **behaviour**, not for dictionary definitions.

## Refactored Design

Do not put `Square` under a type whose contract it cannot keep. Model what both genuinely share — here, "has an area" — and make shapes immutable so no contract about independent setters exists.

```java
import java.util.List;

public class LspRefactoredDemo {

    interface Shape {
        int area();
    }

    record Rectangle(int width, int height) implements Shape {
        public int area() {
            return width * height;
        }

        Rectangle withWidth(int newWidth) {          // "changes" produce new objects
            return new Rectangle(newWidth, height);
        }
    }

    record Square(int side) implements Shape {
        public int area() {
            return side * side;
        }

        Rectangle toRectangle() {
            return new Rectangle(side, side);
        }
    }

    static int totalArea(List<Shape> shapes) {       // works for EVERY Shape, no type checks
        int total = 0;
        for (Shape shape : shapes) {
            total += shape.area();
        }
        return total;
    }

    public static void main(String[] args) {
        List<Shape> shapes = List.of(new Rectangle(10, 2), new Square(3));
        System.out.println(totalArea(shapes));
        System.out.println(new Square(3).toRectangle().withWidth(10).area());
    }
}
```

**Output:**

```text
29
30
```

Every `Shape` honours the only promise `Shape` makes (`area()` returns its area), so any subtype can be substituted. Code that needs to stretch a shape works with `Rectangle`s explicitly.

## Second Example: Refused Bequest

```java
class Account {
    protected long balance;

    void deposit(long amount) {
        balance += amount;
    }

    void withdraw(long amount) {
        balance -= amount;
    }
}

class FixedDepositAccount extends Account {
    @Override
    void withdraw(long amount) {
        throw new UnsupportedOperationException("FD cannot be withdrawn before maturity");
    }
}
```

`Account` promises that `withdraw` works (given funds). A `FixedDepositAccount` breaks that promise, so any code that processes a list of `Account`s — an ATM, a monthly fee job — may crash. The subclass inherits a method it must refuse (a **refused bequest**).

**Fix:** split the abstraction by capability so each type promises only what it can do.

```java
interface Account {
    long balance();
    void deposit(long amount);
}

interface WithdrawableAccount extends Account {
    void withdraw(long amount);
}

// SavingsAccount implements WithdrawableAccount; FixedDepositAccount implements only Account.
// ATM code accepts WithdrawableAccount, so the compiler now prevents the bad substitution.
```

This also applies the [Interface Segregation Principle](../interface-segregation-principle/content.md).

## Third Example: Strengthened Precondition

```java
class ShippingCalculator {
    /** Works for any weight > 0 kg. */
    long costPaise(double weightKg) {
        return Math.round(weightKg * 5_000);
    }
}

class ExpressShippingCalculator extends ShippingCalculator {
    @Override
    long costPaise(double weightKg) {
        if (weightKg > 10) {                       // new restriction the base never had
            throw new IllegalArgumentException("express limited to 10 kg");
        }
        return Math.round(weightKg * 9_000);
    }
}
```

A caller that validated input according to `ShippingCalculator`'s documentation ("any weight > 0") can now fail. Options: make the limit part of the **base** contract (for example a `maxWeightKg()` method or a `supports(parcel)` check callers use), or do not make express a subtype of an unlimited calculator.

## How to Check Substitutability

1. Write down the base type's contract: what each method requires, guarantees and never does.
2. For each subtype, ask: does it accept every input the base accepts? Guarantee every result the base guarantees? Keep every invariant? Throw only allowed exceptions?
3. **Contract tests:** write one test suite against the base type (or interface) and run it against every implementation — a failure is an LSP violation.

Warning signs in code:

- Overrides that throw `UnsupportedOperationException` or do nothing.
- Clients containing `instanceof` checks to special-case a subtype.
- Documentation like "do not call `x()` on a `Y`".
- A subclass that must override most inherited methods to make them behave.

## Real-World Interpretation

- **Collections:** `List.add` is documented as an *optional operation* that may throw `UnsupportedOperationException`, so unmodifiable lists (`List.of(...)`) technically honour the documented contract. Still, code receiving a `List` cannot know whether `add` works — a known design trade-off in the JDK, and a reminder that weak contracts push checks onto callers.
- **`java.sql.Timestamp extends java.util.Date`:** its own documentation states that `Timestamp.equals` is not symmetric with `Date.equals` and recommends not treating a `Timestamp` as a generic `Date` — a documented substitution problem.
- **Repositories in tests:** an `InMemoryOrderRepository` used as a fake must behave like the real one (unique ids, returning copies) or tests pass while production fails.

## Benefits

- Polymorphic code can trust abstractions; no `instanceof` special cases.
- New subtypes can be added safely (OCP works).
- Contract tests catch broken implementations early.
- Hierarchies reflect real behavioural relationships, which keeps designs honest.

## Misuse and Overengineering

- LSP does **not** forbid subtypes from adding behaviour or being more lenient (accepting more inputs, guaranteeing more).
- It does not require every hierarchy to be an interface split into tiny pieces; split only when a subtype genuinely cannot honour the contract.
- Do not "fix" violations by adding `canX()` flags to every base type unless the capability really varies; prefer separate abstractions.

## Common Misconceptions

- **"If it compiles, substitution is safe."** The compiler checks signatures, not behaviour.
- **"LSP is only about inheritance."** It applies to every interface implementation too.
- **"Real-world IS-A guarantees LSP."** Only if the type's behaviour, not just its definition, matches.
- **"Throwing `UnsupportedOperationException` is a fine way to opt out."** It breaks callers unless the base contract explicitly allows it.

## Key Takeaways

- Subtypes must be usable anywhere the base type is, without breaking callers.
- Don't strengthen preconditions, weaken postconditions, break invariants, or throw unexpected exceptions.
- The Square/Rectangle problem comes from **mutable** contracts that the subtype cannot keep.
- Fix violations by reshaping abstractions (by capability, immutability, composition), not by adding `instanceof` checks.
- Use contract tests to verify every implementation.
