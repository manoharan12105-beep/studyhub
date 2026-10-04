# Interfaces

## Definition

An **interface** is a reference type that defines a **contract**: a set of methods that implementing classes promise to provide. A class **implements** an interface with `implements` and can implement **any number** of interfaces. Interfaces cannot hold instance state; since Java 8 they may contain `default` and `static` methods, and since Java 9 `private` methods.

## Why It Matters

- **Multiple inheritance of type:** a `SmartPhone` can be both a `Camera` and a `Phone`.
- **Loose coupling:** code depends on `PaymentGateway`, not on a specific provider class — the core of the [Dependency Inversion Principle](../../design-principles/dependency-inversion-principle/content.md).
- **Testability:** any interface can be implemented by a fake in tests.
- **Interview weight:** "abstract class vs interface", default-method conflicts, functional and marker interfaces are standard questions.

## Declaring and Implementing an Interface

```java
import java.util.List;

interface Discount {
    long apply(long amountPaise);        // implicitly public abstract
}

class FlatDiscount implements Discount {
    private final long offPaise;

    FlatDiscount(long offPaise) {
        this.offPaise = offPaise;
    }

    @Override
    public long apply(long amountPaise) {             // must be public
        return Math.max(0, amountPaise - offPaise);
    }
}

class PercentDiscount implements Discount {
    private final int percent;

    PercentDiscount(int percent) {
        this.percent = percent;
    }

    @Override
    public long apply(long amountPaise) {
        return amountPaise - amountPaise * percent / 100;
    }
}

public class InterfaceBasics {
    public static void main(String[] args) {
        List<Discount> offers = List.of(new FlatDiscount(5_000), new PercentDiscount(10));
        long cart = 40_000;
        for (Discount offer : offers) {
            System.out.println(offer.getClass().getSimpleName() + ": " + offer.apply(cart));
        }
    }
}
```

**Output:**

```text
FlatDiscount: 35000
PercentDiscount: 36000
```

Implementation methods must be `public`: interface methods are implicitly `public`, and an implementation cannot reduce visibility.

## What an Interface Can Contain

| Member | Since | Implicit modifiers | Notes |
|--------|-------|--------------------|-------|
| Abstract methods | 1.0 | `public abstract` | The contract |
| Constants (fields) | 1.0 | `public static final` | Must be initialised; no instance fields |
| `default` methods | 8 | `public` | Have a body; inherited by implementing classes; may be overridden |
| `static` methods | 8 | `public` (or `private`, Java 9) | Called as `InterfaceName.method()`; **not** inherited by implementing classes |
| `private` methods | 9 | — | Helpers shared by default/static methods; not visible to implementers |
| Nested types | 1.0 | `public static` | E.g. `Map.Entry` |

Not allowed: constructors, instance fields, instance initialiser blocks, `protected` members, `final` or `synchronized` methods.

## Multiple Inheritance Through Interfaces

```java
interface Camera {
    String takePhoto();
}

interface Phone {
    String call(String number);
}

class SmartPhone implements Camera, Phone {
    @Override
    public String takePhoto() {
        return "photo.jpg";
    }

    @Override
    public String call(String number) {
        return "calling " + number;
    }
}
```

A `SmartPhone` can be passed wherever a `Camera` or a `Phone` is expected. Because interfaces have no instance fields, the "two copies of the state" half of the diamond problem cannot occur. A class can both extend one class and implement many interfaces: `class SmartPhone extends Device implements Camera, Phone`.

## Default Methods

A **default method** has a body inside the interface. It was added in Java 8 mainly so that interfaces could **evolve**: `Collection` gained `stream()` and `Iterable` gained `forEach()` without breaking every existing implementation.

```java
interface Greeter {
    String name();

    default String greet() {                 // inherited by every implementer
        return "Hello, " + name();
    }
}
```

Implementing classes inherit `greet()` and may override it.

### Conflict resolution rules

When a class inherits the same default method from more than one place, Java applies three rules in order:

1. **Classes win.** A method declared in the class or inherited from a superclass takes priority over any interface default.
2. **The more specific interface wins.** If interface `B extends A` and both provide the method, `B`'s version is used.
3. **Otherwise the class must override** the method explicitly; it may call a particular parent with `InterfaceName.super.method()`.

```java
interface Wifi {
    default String connect() {
        return "Wi-Fi";
    }
}

interface Bluetooth {
    default String connect() {
        return "Bluetooth";
    }
}

interface FastWifi extends Wifi {
    @Override
    default String connect() {
        return "Fast Wi-Fi";
    }
}

class Device {
    public String connect() {
        return "Device default";
    }
}

class Laptop implements Wifi, Bluetooth {
    @Override
    public String connect() {                         // rule 3: must resolve the conflict
        return Wifi.super.connect() + " + " + Bluetooth.super.connect();
    }
}

class Router implements Wifi, FastWifi { }            // rule 2: FastWifi is more specific

class Tablet extends Device implements Wifi { }       // rule 1: the class method wins

public class DefaultConflicts {
    public static void main(String[] args) {
        System.out.println(new Laptop().connect());
        System.out.println(new Router().connect());
        System.out.println(new Tablet().connect());
    }
}
```

**Output:**

```text
Wi-Fi + Bluetooth
Fast Wi-Fi
Device default
```

If `Laptop` did not override `connect()`, compilation would fail ("inherits unrelated defaults for connect()"). Note that `X.super.method()` can name only a **direct** superinterface of the class.

## Static Interface Methods

Static methods hold helpers and factories related to the interface: `Comparator.comparing(...)`, `List.of(...)`, `Map.entry(...)`.

```java
interface Temperature {
    double celsius();

    static Temperature ofFahrenheit(double f) {
        double c = (f - 32) * 5 / 9;
        return () -> c;                      // a lambda implementing the single abstract method
    }
}
```

Unlike static methods of classes, interface static methods are **not inherited** by implementing classes or sub-interfaces: you must call `Temperature.ofFahrenheit(98.6)`, never `SomeImpl.ofFahrenheit(...)`.

## Private Interface Methods

Java 9 allows `private` (and `private static`) methods in interfaces so default methods can share code without exposing it:

```java
interface Formatter {
    default String bold(String text) {
        return wrap("**", text);
    }

    default String italic(String text) {
        return wrap("_", text);
    }

    private String wrap(String marker, String text) {   // helper hidden from implementers
        return marker + text + marker;
    }
}
```

## Functional Interfaces

A **functional interface** has exactly **one abstract method** (default and static methods do not count, and neither do abstract re-declarations of public `Object` methods such as `equals`). Its instances can be created with **lambdas** and **method references**.

```java
@FunctionalInterface
interface PriceRule {
    long apply(long pricePaise);
}

class Pricing {
    static final PriceRule FESTIVE = price -> price * 90 / 100;     // a lambda implements apply()
    static final PriceRule ROUND_DOWN = price -> price / 100 * 100;
}
```

`@FunctionalInterface` is optional but makes the compiler reject a second abstract method. The JDK provides general ones in `java.util.function`: `Function<T, R>`, `Predicate<T>`, `Supplier<T>`, `Consumer<T>`, `BiFunction<T, U, R>`, plus older ones such as `Runnable` and `Comparator<T>`.

Functional interfaces are where OOP and functional style meet: a lambda is a compact implementation of a one-method interface — the same idea as the [Strategy](../../design-patterns/strategy-pattern/content.md) pattern without a named class.

## Marker Interfaces

A **marker interface** has **no methods**; implementing it labels the class with a capability that other code checks.

| Marker | Meaning |
|--------|---------|
| `java.io.Serializable` | Instances may be serialised by Java serialisation |
| `java.lang.Cloneable` | `Object.clone()` may copy this object (otherwise it throws `CloneNotSupportedException`) |
| `java.util.RandomAccess` | List supports fast index access; algorithms may choose index-based loops |

Annotations (`@Entity`, `@Deprecated`) are the modern alternative for metadata. A marker interface still has one advantage: it is a **type**, so a method can require it at compile time (`void save(Serializable s)`).

## Interface Constants

Fields in interfaces are implicitly `public static final`:

```java
interface Limits {
    int MAX_LOGIN_ATTEMPTS = 5;         // public static final
}
```

Implementing an interface only to inherit its constants (the "constant interface" anti-pattern) leaks implementation details into your class's public type. Prefer constants in a final class with a private constructor, or an `enum`, and use them via the class name or a static import.

## Interface Inheritance

An interface can **extend one or more interfaces** (`extends`, not `implements`):

```java
interface Readable {
    String read();
}

interface Writable {
    void write(String data);
}

interface ReadWritable extends Readable, Writable {
    default void copyTo(Writable target) {
        target.write(read());
    }
}
```

A class implementing `ReadWritable` must implement both `read()` and `write()`. Real example: `List extends SequencedCollection extends Collection extends Iterable` (Java 21; in Java 17 `List extends Collection`).

## Interface Segregation

Prefer **several small, focused interfaces** over one large interface. A class should not be forced to implement methods it cannot support (throwing `UnsupportedOperationException` is a warning sign). Example: split `Machine { print(); scan(); fax(); }` into `Printer`, `Scanner`, `Fax`. Full treatment: [Interface Segregation Principle](../../design-principles/interface-segregation-principle/content.md).

## Programming to an Interface

Declare variables, parameters and return types using the **interface** whenever callers do not need the concrete class:

```java
List<String> names = new ArrayList<>();          // not ArrayList<String> names
Map<String, Integer> stock = new HashMap<>();

void notifyUsers(Collection<User> users) { }      // accepts lists, sets, queues
```

Benefits: the implementation can change in one place (`new LinkedList<>()`), and callers can pass any compatible collection. This is the code-level form of depending on abstractions.

## Abstract Class vs Interface

| Aspect | Abstract class | Interface |
|--------|----------------|-----------|
| Keyword to use | `extends` (one only) | `implements` (many); interfaces `extend` many interfaces |
| Instance fields (state) | Yes | No (only `public static final` constants) |
| Constructors | Yes | No |
| Method kinds | Abstract, concrete, static, final, private | Abstract, default, static, private |
| Member access modifiers | Any | Methods public or private; fields public |
| Multiple inheritance | No | Yes, of type |
| Relationship expressed | IS-A with shared implementation ("is a kind of") | CAN-DO / capability ("can be compared", "can be sent") |
| Adding a new method later | Add a concrete method; subclasses unaffected | Add a `default` method; implementers unaffected (unless a conflict) |
| Can be instantiated | No | No |
| Typical examples | `AbstractList`, `HttpServlet`, `InputStream` | `List`, `Comparable`, `Runnable`, `AutoCloseable` |

### When to use an abstract class

- Several closely related classes share **state** (fields) and **code**, and you want to write that code once.
- You need **constructors** to enforce that shared state is initialised.
- You want non-public members (`protected` hooks) or `final` methods that fix an algorithm (template method).

### When to use an interface

- You are defining a **capability** that unrelated classes may have (`Comparable`, `AutoCloseable`).
- A class may need **several** such types.
- You want callers to depend on a contract, with implementations swappable and fakeable.
- You want lambdas (one abstract method).

### Combining both

A common design is **interface + skeletal abstract class**: the interface is the type callers use; an abstract class implements the boring parts so implementers have less to write. The JDK does this with `List` + `AbstractList`, `Map` + `AbstractMap`. Implementers can still choose to implement the interface directly.

## Real-World Examples

- `Comparable<T>` (natural order) and `Comparator<T>` (custom order) — see [OOP with Collections](../../applied-oop/oop-with-collections/content.md).
- `Runnable`/`Callable` for tasks, `AutoCloseable` for try-with-resources.
- Spring Data repositories, JDBC `Connection`, servlet `Filter` — all interfaces with vendor implementations.

## Common Misconceptions

- **"Interfaces cannot contain method bodies."** Default, static and private methods have bodies (Java 8/9+).
- **"Interface fields can be instance variables."** All interface fields are `public static final`.
- **"Static interface methods are inherited."** They must be called through the interface name.
- **"Default methods made interfaces the same as abstract classes."** Interfaces still have no instance state or constructors, and a class can still extend only one class.
- **"A functional interface must be annotated."** The annotation is optional; one abstract method is what matters.
- **"Implementing methods can keep default (package) access."** They must be `public`.

## Key Takeaways

- An interface is a contract; a class may implement many, giving multiple inheritance of type.
- Members: abstract methods (implicitly public), constants (public static final), default, static and private methods.
- Default conflicts: class wins → more specific interface wins → otherwise override and choose with `X.super.m()`.
- Functional interface = exactly one abstract method → lambdas. Marker interface = no methods → a type-level tag.
- Abstract class for shared state and code in a family; interface for capabilities and swappable contracts — often both together.
