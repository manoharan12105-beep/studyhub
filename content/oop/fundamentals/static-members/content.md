# Static Members

## Definition

A member marked **`static`** belongs to the **class itself**, not to any object. There is exactly **one copy** of a static field, shared by all instances, and a static method runs **without an object** — it has no `this`. Members without `static` are **instance members**: one copy per object.

## Why It Matters

`static` is where Java departs most from "everything is an object". Interviewers test it constantly: why `main` is static, why a static method cannot use instance fields, what happens when a static method is "overridden", and why a static method call through a `null` reference does not throw. In design, `static` is useful for constants and pure helper functions but becomes a problem when it holds mutable shared state.

## Static Fields

A **static field** (class variable) is stored once per class. Every object sees the same value.

```java
public class StaticCounter {

    static class Ticket {
        private static int issued = 0;      // one copy, shared by all tickets
        private final int number;           // one copy per ticket

        Ticket() {
            issued++;
            number = issued;
        }

        int number() {
            return number;
        }

        static int issued() {
            return issued;
        }
    }

    public static void main(String[] args) {
        Ticket t1 = new Ticket();
        Ticket t2 = new Ticket();
        Ticket t3 = new Ticket();
        System.out.println(t1.number() + " " + t2.number() + " " + t3.number());
        System.out.println("Issued: " + Ticket.issued());
    }
}
```

**Output:**

```text
1 2 3
Issued: 3
```

```text
 Ticket class (loaded once)          heap
 ┌───────────────────────┐          ┌────────────┐ ┌────────────┐ ┌────────────┐
 │ static issued = 3     │          │ number = 1 │ │ number = 2 │ │ number = 3 │
 └───────────────────────┘          └────────────┘ └────────────┘ └────────────┘
                                         t1             t2             t3
```

### Constants: `static final`

`public static final double GST_RATE = 0.18;` — one shared, unchangeable value. Constants are named in `UPPER_SNAKE_CASE`. A `static final` field of primitive or `String` type initialised with a compile-time constant expression is a **compile-time constant**: the compiler copies its value into code that uses it.

> [!WARNING]
> `static final List<String> NAMES = new ArrayList<>();` is a constant **reference**, not a constant list — anyone can still call `NAMES.add(...)`. Use `List.of(...)` for a truly unmodifiable list. See [Immutability](../../java-oop/immutability/content.md).

## Static Methods

A **static method** is called on the class: `Math.max(3, 7)`, `Integer.parseInt("42")`, `Ticket.issued()`.

What a static method **can** use:

- Its parameters and local variables.
- Other static fields and static methods of the class.
- Instance members **of an object it has a reference to** (`order.total()`).

What it **cannot** use:

- Instance fields or instance methods **directly** (there is no current object to read them from).
- `this` or `super`.

```java
public class StaticRules {

    private int instanceValue = 5;
    private static int staticValue = 10;

    static void staticMethod() {
        System.out.println(staticValue);          // fine
        // System.out.println(instanceValue);     // compile-time error: non-static field from static context
        StaticRules obj = new StaticRules();
        System.out.println(obj.instanceValue);    // fine: accessed through an object
    }

    void instanceMethod() {
        System.out.println(instanceValue + staticValue);   // instance code can use both
    }

    public static void main(String[] args) {
        staticMethod();
        new StaticRules().instanceMethod();
    }
}
```

**Output:**

```text
10
5
15
```

### Why is `main` static?

The JVM starts the program before any object of your class exists. Making `main` static lets the JVM call it on the class without having to choose a constructor or create an instance.

### Static methods are hidden, not overridden

A subclass can declare a static method with the same signature as a superclass static method. This **hides** the parent's method; it does not override it. Which one runs is decided at **compile time** by the **reference type**, never by the object type:

```java
class Parent {
    static String who() {
        return "Parent.who";
    }
}

class Child extends Parent {
    static String who() {                 // hides Parent.who()
        return "Child.who";
    }
}

public class StaticHiding {
    public static void main(String[] args) {
        Parent p = new Child();
        System.out.println(p.who());      // reference type is Parent
        System.out.println(Child.who());
    }
}
```

**Output:**

```text
Parent.who
Child.who
```

Full treatment: [Method Overriding](../../pillars/method-overriding/content.md) and [Binding and Method Resolution](../../java-oop/binding-and-method-resolution/content.md).

### Static call through a `null` reference

Because a static call is bound to the reference **type**, the reference value is never used:

```java
public class StaticViaNull {

    static String hello() {
        return "hello";
    }

    public static void main(String[] args) {
        StaticViaNull ref = null;
        System.out.println(ref.hello());   // no NullPointerException
    }
}
```

**Output:**

```text
hello
```

It compiles (with a warning in most IDEs) and runs. Always call static methods through the class name to avoid confusing readers.

## Static Blocks

`static { … }` runs once when the class is initialised; it is used to compute static fields that need more than one expression. Order rules are in [Constructors and Initialization](../constructors-and-initialization/content.md#initialization-order).

## Static Nested Classes

A `static` class declared inside another class does not need an instance of the outer class: `new Outer.Builder()`. It is the usual choice for helper types such as builders, nodes and map entries. Compared with inner classes in [Nested Classes](../../java-oop/nested-classes/content.md).

## Static Imports

`import static java.lang.Math.max;` lets you write `max(a, b)` instead of `Math.max(a, b)`. Use sparingly — overused, it hides where a method comes from. Common in tests (`assertEquals`).

## Static vs Instance

| Aspect | Static member | Instance member |
|--------|---------------|-----------------|
| Belongs to | The class | Each object |
| Copies | One per class | One per object |
| Access | `ClassName.member` | `reference.member` |
| `this` / `super` available | No | Yes |
| Can use instance members directly | No | Yes |
| Can use static members directly | Yes | Yes |
| Polymorphism | Hidden, bound at compile time | Instance methods overridden, bound at runtime |
| Initialised | When the class is initialised | When the object is created |

## When to Use Static

- **Constants:** `static final` values.
- **Stateless helper functions** whose result depends only on parameters: `Math.abs`, `Collections.sort`, `Objects.equals`.
- **Static factory methods:** `List.of`, `Optional.of`, `LocalDate.of`.
- **Per-class bookkeeping** that is genuinely shared, such as an id generator (thread safety needed in concurrent code).
- **Static nested classes** for helper types.

## When Not to Use Static

- **Mutable shared state** (`static List<Order> orders`): every part of the program can change it, concurrency becomes harder, and tests leak state into each other. This is the "global variable" problem — see [OOP Anti-Patterns](../../code-quality/oop-anti-patterns/content.md).
- **Behaviour that should vary by type.** Static methods cannot be overridden, so they block polymorphism.
- **Dependencies.** Calling `EmailSender.send(...)` statically everywhere hard-wires the dependency and makes it impossible to substitute a fake in tests. Inject an object instead — see [Dependency Injection](../../design-principles/dependency-injection/content.md).

## Common Misconceptions

- **"Static methods can be overridden."** They are hidden; the reference type decides which runs.
- **"A static method can never touch instance data."** It cannot use instance members *directly*, but it can through an object reference.
- **"`static final` means immutable."** It means the reference cannot be reassigned; the object it points to may still be mutable.
- **"Calling a static method on a `null` reference throws."** It does not; the call is bound to the type.
- **"Local variables can be static."** No; `static` applies to fields, methods, blocks and nested types only.
- **"Static members are not inherited."** Accessible static members are inherited in the sense that `Child.parentStaticMethod()` compiles, but there is still only one copy and no overriding.

## Key Takeaways

- Static = one per class, no `this`; instance = one per object.
- Static methods cannot use instance members directly; instance methods can use both.
- Static methods are hidden, not overridden, and bound by the reference type at compile time.
- Use static for constants, pure helpers and factories; avoid it for mutable shared state and swappable behaviour.
- `main` is static so the JVM can call it without creating an object.
