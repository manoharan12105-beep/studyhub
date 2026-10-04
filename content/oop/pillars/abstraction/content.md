# Abstraction

## Definition

**Abstraction** means exposing **what** an object does while hiding **how** it does it. Callers work with a simplified model — a set of operations with clear meaning — and are shielded from implementation details that may change. In Java, abstraction is expressed through **interfaces**, **abstract classes**, and well-designed public methods that hide internal steps.

Interview version: *abstraction hides implementation complexity behind a contract; encapsulation hides data behind methods.*

## Why It Matters

- **Reduces what callers must know.** `paymentGateway.pay(order)` is easier to use correctly than the twelve steps of a card transaction.
- **Allows implementations to change.** If callers depend only on the contract, you can switch from one SMS provider to another without touching them.
- **Enables polymorphism.** An abstract type (`Shape`, `PaymentMethod`) can have many concrete implementations used interchangeably.
- **Makes testing possible.** Code that depends on an abstraction can be given a fake implementation in tests.

## Levels of Abstraction

Abstraction is relative: each layer hides the one below.

```text
 OrderService.placeOrder(cart)           ← business logic: "place an order"
      │ uses
 PaymentGateway.charge(amount)           ← "charge money", hides provider details
      │ uses
 HttpClient.post(url, body)              ← "send a request", hides sockets, TLS, retries
      │ uses
 Socket / OS networking                  ← bytes on the wire
```

A method should mostly work at **one** level. Mixing levels (business rules next to string-parsing of HTTP headers) makes code hard to read — see [Clean Code Principles](../../code-quality/clean-code-principles/content.md).

## Abstraction in Everyday Java

You already rely on abstractions constantly:

| You call | Hidden from you |
|----------|-----------------|
| `list.add(x)` | Array growth and copying in `ArrayList`, node linking in `LinkedList` |
| `map.get(key)` | Hashing, buckets, tree bins |
| `Files.readString(path)` | File handles, buffering, charset decoding |
| `System.out.println(x)` | Stream buffering, platform encoding |

## Abstract Classes

An **abstract class** is a class declared `abstract`. It represents an incomplete concept that subclasses complete.

```java
public class AbstractClassDemo {

    abstract static class Employee {
        private final String name;
        private final long baseSalary;

        protected Employee(String name, long baseSalary) {    // abstract classes can have constructors
            this.name = name;
            this.baseSalary = baseSalary;
        }

        abstract long bonus();                                 // no body: each kind decides

        final long totalPay() {                                // shared, fixed algorithm
            return baseSalary + bonus();
        }

        String name() {
            return name;
        }

        protected long baseSalary() {
            return baseSalary;
        }
    }

    static class Engineer extends Employee {
        Engineer(String name, long baseSalary) {
            super(name, baseSalary);
        }

        @Override
        long bonus() {
            return baseSalary() / 10;
        }
    }

    static class SalesPerson extends Employee {
        private final long salesAmount;

        SalesPerson(String name, long baseSalary, long salesAmount) {
            super(name, baseSalary);
            this.salesAmount = salesAmount;
        }

        @Override
        long bonus() {
            return salesAmount / 20;
        }
    }

    public static void main(String[] args) {
        Employee[] team = {
            new Engineer("Priya", 80_000),
            new SalesPerson("Karthik", 50_000, 400_000)
        };
        for (Employee e : team) {
            System.out.println(e.name() + ": " + e.totalPay());
        }
        // Employee e = new Employee("X", 1);   // compile-time error: Employee is abstract
    }
}
```

**Output:**

```text
Priya: 88000
Karthik: 70000
```

### Rules for abstract classes

| Rule | Detail |
|------|--------|
| Cannot be instantiated | `new Employee(...)` is a compile-time error — but a subclass object contains the abstract class's part |
| May have constructors | They run through `super(...)` from subclass constructors; often `protected` |
| May have fields, concrete methods, static methods, `final` methods | Unlike interfaces, abstract classes can hold instance state |
| May have **zero** abstract methods | Legal: `abstract` then just prevents direct instantiation |
| Concrete subclass must implement **all** abstract methods | Otherwise the subclass must also be declared `abstract` |
| Cannot be `final` | `abstract final class` is contradictory — compile-time error |

### Rules for abstract methods

- Declared with `abstract` and **no body**: `abstract long bonus();`
- Only allowed inside an abstract class (or implicitly in an interface).
- Cannot be `private` (could not be implemented), `static` (cannot be overridden) or `final` (cannot be overridden) — each is a compile-time error.
- If a class has even one abstract method, the class must be declared `abstract`.

### Anonymous subclasses

An abstract class can be instantiated **through an anonymous subclass** that supplies the missing methods:

```java
Employee contractor = new Employee("Guest", 30_000) {
    @Override
    long bonus() {
        return 0;
    }
};
```

This creates an object of an unnamed subclass, not of `Employee` itself. See [Nested Classes](../../java-oop/nested-classes/content.md).

## Abstract Classes and the Template Method

`totalPay()` above shows a common shape: the abstract class fixes the **algorithm** (`base + bonus`) and leaves one **step** (`bonus`) to subclasses. Making the algorithm `final` stops subclasses from breaking it. This is the [Template Method](../../design-patterns/template-method-pattern/content.md) pattern.

## Interfaces as Abstraction

An **interface** is a pure contract: method signatures that implementing classes must provide (plus, since Java 8, default and static methods). A class can implement many interfaces, and interfaces hold no instance state.

```java
interface SmsSender {
    void send(String phoneNumber, String text);
}
```

Code that depends on `SmsSender` does not know or care which provider class implements it. Full details, default-method rules and the complete abstract-class-vs-interface comparison: [Interfaces](../interfaces/content.md).

## Abstraction vs Encapsulation

| | Abstraction | Encapsulation |
|--|-------------|---------------|
| Hides | Complexity / implementation | Data / internal state |
| Answers | "What can I do with this?" | "Who is allowed to change this?" |
| Achieved with | Interfaces, abstract classes, simple public APIs | `private` fields, access modifiers, defensive copies |
| Design or implementation level | Mainly design (the shape of a type's contract) | Mainly implementation (inside a class) |
| Example | `Vehicle.start()` regardless of petrol, diesel or EV | `fuelLevel` private; changed only by `refuel()` and `drive()` |

The two reinforce each other: an abstraction is only reliable if its implementation is encapsulated.

## Real-World Examples

- **JDBC:** your code uses `Connection`, `PreparedStatement`, `ResultSet` interfaces; MySQL, PostgreSQL and Oracle drivers supply the implementations.
- **Collections:** `List`, `Set`, `Map` interfaces with many implementations; `AbstractList` is an abstract class that implements most of `List` given `get` and `size`.
- **Spring repositories:** you depend on a `UserRepository` interface; the framework provides the implementation.
- **Payment integrations:** a `PaymentGateway` interface with Razorpay-, Stripe- or bank-specific adapters.

## When Abstraction Hurts

Abstraction has a cost: more types, more indirection, harder navigation.

- An interface with **exactly one implementation** that will never vary, and is never faked in tests, may be noise.
- **Leaky abstractions** force callers to know the hidden details anyway (an `Repository` that requires callers to manage database transactions themselves).
- **Speculative abstraction** ("we might need another database one day") often guesses the wrong extension point. See [OOP Anti-Patterns](../../code-quality/oop-anti-patterns/content.md).

Introduce an abstraction when there are real variations, a boundary to an external system, or a testing need.

## Common Misconceptions

- **"Abstraction = abstract classes."** Abstract classes are one tool; interfaces and well-named methods are others.
- **"An abstract class must have an abstract method."** It may have none.
- **"Abstract classes cannot have constructors."** They can, and subclasses call them.
- **"Abstraction and encapsulation are the same thing."** One hides complexity, the other protects state.
- **"More abstraction is always better design."** Unneeded layers make code harder to follow.

## Key Takeaways

- Abstraction exposes a simple contract and hides implementation details.
- Abstract classes: can't be instantiated; may have constructors, state, concrete and abstract methods; subclasses must implement all abstract methods or be abstract.
- Abstract methods can't be `private`, `static` or `final`; `abstract final` classes are illegal.
- Interfaces are the purest form of abstraction in Java; see the Interfaces topic for the full comparison.
- Abstract for real variation and boundaries, not speculation.
