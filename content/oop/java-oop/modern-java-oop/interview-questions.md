# Modern Java OOP Features: Enums, Records and Sealed Classes — Interview Questions

## Conceptual

### Q1. What is a record? What does the compiler generate for it?

<details>
<summary>Answer</summary>

A record (Java 16) is a concise, final class for immutable data whose state is exactly its declared components. For `record Point(int x, int y)` the compiler generates `private final` fields, a canonical constructor, accessors `x()` and `y()`, and `equals`, `hashCode` and `toString` based on all components. You may add validation (compact constructor), methods, static members and interface implementations, but not extra instance fields or a superclass.

</details>

### Q2. Record vs regular class — when would you use each?

<details>
<summary>Answer</summary>

Use a record when the type is a transparent value or data carrier: DTOs, request/response bodies, keys, events, `Money`, `Range`. Use a regular class when the object has identity and a changing lifecycle (an `Order` that moves through statuses), needs to hide its representation, needs inheritance, or needs fields that are not part of its value.

</details>

### Q3. Can an enum have a constructor? Can it implement an interface? Extend a class?

<details>
<summary>Answer</summary>

It can have constructors, but they are implicitly `private` — only the constants call them. It can implement any number of interfaces. It cannot extend a class, because every enum implicitly extends `java.lang.Enum`.

</details>

### Q4. What is a sealed class and why use one?

<details>
<summary>Answer</summary>

A sealed class or interface (Java 17) restricts which classes may extend or implement it with a `permits` list; each permitted subclass must be `final`, `sealed` or `non-sealed`. It models closed sets of alternatives (payment results, shapes in a fixed geometry library), documents the design in code, and lets the compiler check exhaustiveness when handling all subtypes (fully with Java 21 `switch` patterns).

</details>

### Q5. Why is comparing enums with `==` safe?

<details>
<summary>Answer</summary>

Each enum constant is a single instance created once when the enum class is initialised, and the language guarantees no other instances can exist (no public constructors, reflection and deserialisation preserve the singletons). So `==` and `equals` give the same result, and `==` is also null-safe and checked at compile time for type compatibility.

</details>

### Q6. Are records immutable?

<details>
<summary>Answer</summary>

Shallowly. Their fields are `final` and there are no setters, but a component of a mutable type (a `List`, an array) can still be modified through the reference. Copy such components in a compact constructor, e.g. `items = List.copyOf(items);`.

</details>

## Applied

### Q7. What does this print?

```java
public class EnumQuestion {

    enum Level {
        LOW(1), MEDIUM(5), HIGH(10);

        private final int weight;

        Level(int weight) {
            this.weight = weight;
            System.out.println("creating " + name());
        }

        int weight() {
            return weight;
        }
    }

    public static void main(String[] args) {
        System.out.println("start");
        System.out.println(Level.HIGH.weight() + Level.LOW.weight());
        System.out.println(Level.valueOf("MEDIUM").compareTo(Level.HIGH));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
start
creating LOW
creating MEDIUM
creating HIGH
11
-1
```

All constants are created together, in declaration order, when `Level` is first used (not at program start). `compareTo` uses declaration order: `MEDIUM` (ordinal 1) minus `HIGH` (ordinal 2) gives −1.

</details>

### Q8. How would you model order statuses with allowed transitions (placed → shipped → delivered; placed → cancelled)?

<details>
<summary>Answer</summary>

An enum `OrderStatus` where each constant knows its allowed next states, for example via a method `boolean canMoveTo(OrderStatus next)` implemented with an `EnumSet` per constant (initialised in a static block or in constant-specific bodies). `Order.changeStatus(next)` checks `status.canMoveTo(next)` and throws `IllegalStateException` otherwise. If each status needs substantial behaviour (different pricing, notifications), the [State](../../design-patterns/state-pattern/content.md) pattern becomes a better fit.

</details>
