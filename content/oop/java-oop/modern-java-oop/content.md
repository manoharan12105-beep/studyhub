# Modern Java OOP Features: Enums, Records and Sealed Classes

## Definition

Modern Java adds language features that express common OOP designs directly:

- **Enums** (Java 5): a type with a **fixed set of named instances**, which can have fields, constructors and methods.
- **Records** (Java 16): concise, **immutable data carriers** whose state is exactly their components.
- **Sealed classes and interfaces** (Java 17): hierarchies whose **permitted subtypes are listed**, so the compiler knows every possible subtype.
- **Pattern matching for `instanceof`** (Java 16): test and cast in one step.

> [!NOTE]
> StudyHub targets Java 17. Pattern matching for `switch` and record patterns became standard in **Java 21**; they are described in prose below but not used in code.

## Why It Matters

- Each feature replaces boilerplate that was error-prone: hand-written `equals`/`hashCode`, `int` constants for states, open hierarchies that callers had to guard with `else throw`.
- Backend Java code (Spring Boot 3 requires Java 17+) uses records for DTOs and enums for statuses daily; interviewers increasingly ask about them.

## Enums

An **enum** declares all of its instances up front. Each constant is a `public static final` instance of the enum type, created once when the enum class is initialised.

```java
public class EnumBasics {

    enum OrderStatus {
        PLACED, PACKED, SHIPPED, DELIVERED, CANCELLED;

        boolean isFinal() {
            return this == DELIVERED || this == CANCELLED;
        }
    }

    public static void main(String[] args) {
        OrderStatus status = OrderStatus.valueOf("SHIPPED");      // from a String
        System.out.println(status + " ordinal=" + status.ordinal() + " final=" + status.isFinal());

        for (OrderStatus s : OrderStatus.values()) {               // all constants, in order
            System.out.print(s.name().charAt(0));
        }
        System.out.println();

        switch (status) {                                          // enums work in switch
            case SHIPPED:
                System.out.println("Track your parcel");
                break;
            default:
                System.out.println("No tracking yet");
        }
    }
}
```

**Output:**

```text
SHIPPED ordinal=2 final=false
PPSDC
Track your parcel
```

Why enums beat `int`/`String` constants: **type safety** (a method taking `OrderStatus` cannot receive `42` or `"SHIPED"`), a built-in list of values, readable `toString`, and safe use with `==` (each constant is a single instance).

### Enums with fields, constructors and behaviour

Enum constructors are implicitly `private`; constants pass arguments to them.

```java
public class EnumWithBehaviour {

    enum DeliverySpeed {
        STANDARD(5, 0),
        EXPRESS(2, 4_900),
        SAME_DAY(0, 9_900);

        private final int days;
        private final long feePaise;

        DeliverySpeed(int days, long feePaise) {
            this.days = days;
            this.feePaise = feePaise;
        }

        int days() {
            return days;
        }

        long feePaise() {
            return feePaise;
        }
    }

    // Constant-specific bodies: each constant overrides an abstract method
    enum Operation {
        ADD {
            @Override
            int apply(int a, int b) {
                return a + b;
            }
        },
        MULTIPLY {
            @Override
            int apply(int a, int b) {
                return a * b;
            }
        };

        abstract int apply(int a, int b);
    }

    public static void main(String[] args) {
        for (DeliverySpeed speed : DeliverySpeed.values()) {
            System.out.println(speed + ": " + speed.days() + " days, fee " + speed.feePaise());
        }
        System.out.println(Operation.ADD.apply(3, 4) + " " + Operation.MULTIPLY.apply(3, 4));
    }
}
```

**Output:**

```text
STANDARD: 5 days, fee 0
EXPRESS: 2 days, fee 4900
SAME_DAY: 0 days, fee 9900
7 12
```

### Enum rules

| Rule | Detail |
|------|--------|
| Implicitly `final` (unless constants have bodies) and extend `java.lang.Enum` | Cannot extend another class; **can implement interfaces** |
| Constructors are `private` | Cannot `new` an enum |
| Constants are created once | Safe to compare with `==`; singletons per constant |
| Built-in methods | `values()`, `valueOf(String)`, `name()`, `ordinal()`, `compareTo` (by declaration order) |
| `valueOf` with an unknown name | Throws `IllegalArgumentException` |
| Specialised collections | `EnumSet` (bit-vector set), `EnumMap` (array-backed map) — very fast |

Avoid storing `ordinal()` in databases or files: reordering constants changes it. Store `name()` or an explicit code field.

An enum with a single constant is the simplest thread-safe, serialisation-safe singleton — see [Singleton](../../design-patterns/singleton-pattern/content.md).

## Records

A **record** declares a class whose state is a fixed list of **components**:

```java
record Point(int x, int y) { }
```

The compiler generates:

- `private final` fields `x` and `y`;
- a **canonical constructor** `Point(int x, int y)`;
- accessor methods `x()` and `y()` (not `getX()`);
- `equals`, `hashCode` (based on all components) and `toString` (`Point[x=1, y=2]`).

```java
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class RecordDemo {

    record Money(long paise, String currency) {
        Money {                                                  // compact canonical constructor
            if (paise < 0) {
                throw new IllegalArgumentException("negative amount");
            }
            currency = currency.toUpperCase();                   // normalise before fields are assigned
        }

        Money plus(Money other) {                                // records can have methods
            if (!currency.equals(other.currency)) {
                throw new IllegalArgumentException("currency mismatch");
            }
            return new Money(paise + other.paise, currency);
        }

        static Money rupees(long rupees) {                       // and static factories
            return new Money(rupees * 100, "INR");
        }
    }

    record Basket(String owner, List<String> items) {
        Basket {
            items = List.copyOf(items);                          // defensive copy: records are only shallowly immutable
        }
    }

    public static void main(String[] args) {
        Money a = new Money(5_000, "inr");
        Money b = Money.rupees(50);
        System.out.println(a + " " + a.equals(b) + " " + a.paise());

        Set<Money> unique = new HashSet<>(List.of(a, b));
        System.out.println(unique.size());
        System.out.println(a.plus(b));

        Basket basket = new Basket("Ishaan", List.of("milk", "bread"));
        System.out.println(basket);
    }
}
```

**Output:**

```text
Money[paise=5000, currency=INR] true 5000
1
Money[paise=10000, currency=INR]
Basket[owner=Ishaan, items=[milk, bread]]
```

### Record rules

| Allowed | Not allowed |
|---------|-------------|
| Implementing interfaces | Extending another class (records implicitly extend `java.lang.Record`) |
| Static fields and static methods | Additional **instance** fields beyond the components |
| Instance methods, nested types | Being extended (records are implicitly `final`) |
| Compact or explicit canonical constructors; extra constructors that delegate with `this(...)` | Setters that change components (fields are `final`) |
| Overriding accessors, `equals`, `hashCode`, `toString` | Instance initialiser blocks |

**Use records for:** DTOs, API request/response bodies, values (`Money`, `Range`), map keys, events, multiple return values. **Do not use** them for entities with a lifecycle that must change state, or where you need to hide representation (accessors expose every component).

## Sealed Classes and Interfaces

A **sealed** type lists exactly which classes may extend or implement it:

```java
sealed interface Shape permits Circle, Square, Rectangle { }

final class Circle implements Shape { /* ... */ }
final class Square implements Shape { /* ... */ }
non-sealed class Rectangle implements Shape { /* ... */ }   // re-opens this branch
```

Every permitted subclass must declare one of:

| Modifier | Meaning |
|----------|---------|
| `final` | The branch ends here |
| `sealed … permits …` | The branch continues with its own fixed list |
| `non-sealed` | The branch is open again; anyone may extend it |

Rules: permitted subclasses must be in the same module (or, without modules, the same package) as the sealed type; the `permits` clause can be omitted if they are declared in the same source file.

### Why seal a hierarchy?

- **Domain modelling:** a payment result is *exactly* `Success`, `Declined` or `Pending`. Sealing documents and enforces that.
- **Exhaustiveness:** code that handles "all shapes" can be checked by the compiler, which is impossible with an open hierarchy.
- **Controlled extension** of a library type without making it fully `final`.

```java
public class SealedDemo {

    sealed interface PaymentResult permits Success, Declined, Pending { }

    record Success(String transactionId) implements PaymentResult { }    // records are final

    record Declined(String reason) implements PaymentResult { }

    record Pending(int retryAfterSeconds) implements PaymentResult { }

    static String describe(PaymentResult result) {
        if (result instanceof Success s) {
            return "Paid, txn " + s.transactionId();
        } else if (result instanceof Declined d) {
            return "Declined: " + d.reason();
        } else if (result instanceof Pending p) {
            return "Retry in " + p.retryAfterSeconds() + "s";
        }
        throw new AssertionError("unreachable: sealed hierarchy");
    }

    public static void main(String[] args) {
        System.out.println(describe(new Success("TXN-88")));
        System.out.println(describe(new Declined("insufficient balance")));
        System.out.println(describe(new Pending(30)));
    }
}
```

**Output:**

```text
Paid, txn TXN-88
Declined: insufficient balance
Retry in 30s
```

In **Java 21**, the same logic is written as a `switch` with type patterns (`case Success s -> …`), and because `PaymentResult` is sealed, the compiler verifies that all three cases are covered — no `default` or `AssertionError` needed. Record patterns (`case Success(String id) -> …`) can also deconstruct records directly.

### Sealed hierarchies vs polymorphism

| Approach | Best when |
|----------|-----------|
| Polymorphic method in each subclass (`shape.area()`) | New **types** are added often; the set of **operations** is stable |
| Sealed hierarchy + pattern matching | The set of **types** is fixed; new **operations** are added often, outside the types (e.g. a reporting module) |

This is the classic trade-off also addressed by the [Visitor](../../design-patterns/visitor-pattern/content.md) pattern.

## Pattern Matching for `instanceof`

`if (obj instanceof Customer c && c.isActive())` tests, casts and binds `c` in one step; the binding is in scope only where the test is known to be true. Details: [Upcasting and Downcasting](../../pillars/upcasting-and-downcasting/content.md#pattern-matching-for-instanceof-java-16).

## Comparison

| | Class | Enum | Record | Sealed type |
|--|-------|------|--------|-------------|
| Instances | Unlimited | Fixed, declared constants | Unlimited | Depends on subclasses |
| Mutable state | Your choice | Possible but discouraged | No (fields final) | Your choice |
| Generated `equals`/`hashCode` | No | Identity (fine: one instance per constant) | Yes, by components | No |
| Can be extended | Yes (unless final) | No | No | Only by permitted subclasses |
| Typical use | Entities, services | Statuses, types, fixed options | DTOs, values, keys | Closed domain alternatives |

## Real-World Examples

- `java.time.DayOfWeek`, `Month`, `TimeUnit`, `RoundingMode` are enums.
- Spring Boot applications commonly use records for request/response DTOs and configuration properties.
- Sealed interfaces model API results and commands (`sealed interface Command permits Create, Update, Delete`).

## Common Misconceptions

- **"Enums are just named integers."** Each constant is an object that can hold data and behaviour.
- **"Records are fully immutable."** Shallowly: copy mutable components in the compact constructor.
- **"Records have getters named `getX()`."** Accessors are named after the component: `x()`.
- **"Records can have extra instance fields."** Only static fields; state is exactly the components.
- **"Sealed means final."** Sealed allows a listed set of subclasses; `non-sealed` can reopen a branch.
- **"Pattern matching for `switch` works in Java 17."** It was a preview there; standard from Java 21.

## Key Takeaways

- Enums: fixed set of singleton instances with fields, constructors, methods and constant-specific behaviour; can implement interfaces.
- Records: concise immutable carriers with generated constructor, accessors, `equals`/`hashCode`/`toString`; validate and copy in a compact constructor.
- Sealed types: list permitted subtypes; each must be `final`, `sealed` or `non-sealed`; enable exhaustive handling.
- Choose polymorphism when types grow, sealed + patterns when operations grow.
