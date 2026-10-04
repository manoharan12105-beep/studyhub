# Java-Specific OOP

## Definition

**Core OOP** is the set of language-independent ideas — objects, classes, encapsulation, abstraction, inheritance, polymorphism, composition. **Java-specific OOP** is *how Java implements* those ideas: its keywords (`static`, `final`, `abstract`), its rules (single class inheritance, virtual-by-default methods, checked exceptions in method contracts), and its newer features (records, enums, sealed types, default methods). Interviews mix both, so keep them apart in your head: first the concept, then Java's mechanism and its rules.

## Why It Matters

- "Explain polymorphism" is a core-OOP question; "can a static method be overridden?" is a Java-rules question. Answering each at the right level sounds precise.
- Many traps come from Java's specific choices (fields are not polymorphic, `final` is not immutability, interface methods are public).

## Core OOP vs Java-Specific OOP

| Core OOP concept | Java mechanism | Java-specific rules to remember |
|------------------|----------------|---------------------------------|
| Class, object | `class`, `new`, constructors | Default constructor only if none declared; every class extends `Object` |
| Encapsulation | `private`, package-private, `protected`, `public` | Package-private is the default; `protected` includes the package |
| Abstraction | `abstract` classes, `interface` | Interfaces: default/static/private methods, constants are `public static final` |
| Inheritance | `extends` | One superclass only; constructors not inherited; `super(...)` first |
| Multiple inheritance of type | `implements` (many interfaces) | Default-method conflicts must be resolved explicitly |
| Runtime polymorphism | Overriding + dynamic dispatch | Instance methods are virtual by default; `static`, `private` and `final` are not overridable; fields are not polymorphic |
| Compile-time polymorphism | Overloading | Resolution: widening → boxing → varargs; return type not part of signature |
| Immutability | `final` fields, `final` classes, records | `final` reference ≠ immutable object |
| Value equality | `equals`/`hashCode` overrides | `==` compares references |
| Restricted hierarchies | `sealed` / `permits` / `non-sealed` (Java 17) | Permitted subclasses must be `final`, `sealed` or `non-sealed` |
| Data carriers | `record` (Java 16) | Implicitly `final`, fields `private final`, generated accessors/equals/hashCode/toString |
| Fixed sets of instances | `enum` | Constants are singletons; can have fields, constructors, methods |
| Errors as part of a contract | Checked exceptions (`throws`) | Overrides cannot add or broaden checked exceptions |

Things Java deliberately does **not** support: multiple inheritance of classes, operator overloading (except `+` for strings), destructors (garbage collection instead), pointer arithmetic, and methods outside classes.

## The `static` Keyword

`static` makes a member belong to the class rather than to an instance. Summary of the rules (full topic: [Static Members](../../fundamentals/static-members/content.md)):

- Static fields: one copy per class. Static methods: no `this`, cannot use instance members directly.
- Static methods are **hidden**, not overridden; calls bind to the reference type at compile time.
- Allowed on fields, methods, initialiser blocks and **nested** types; not on top-level classes, constructors or local variables.

## The `final` Keyword

`final` means "assigned or defined once". Its meaning depends on where it is used:

| Applied to | Meaning |
|------------|---------|
| Local variable / parameter | Cannot be reassigned after initialisation |
| Instance field | Must be assigned exactly once — at declaration, in an instance initialiser, or in **every** constructor (a *blank final*) |
| Static field | Must be assigned once — at declaration or in a static initialiser; `static final` = constant |
| Method | Cannot be overridden (can still be overloaded and inherited) |
| Class | Cannot be extended (`String`, `Integer`, all records) |

```java
import java.util.function.Supplier;

public class FinalUses {

    static final int MAX_USERS = 100;                 // constant

    private final String id;                          // blank final: assigned in the constructor

    FinalUses(String id) {
        this.id = id;
    }

    static Supplier<String> greeter(String name) {
        String greeting = "Hello, " + name;           // effectively final: never reassigned
        return () -> greeting;                        // lambdas may capture effectively final locals
    }

    static int sum(final int a, final int b) {
        // a = 5;                                     // not allowed: final parameter
        return a + b;
    }

    public static void main(String[] args) {
        FinalUses user = new FinalUses("U-1");
        System.out.println(user.id + " " + MAX_USERS);
        System.out.println(greeter("Selvi").get());
        System.out.println(sum(2, 3));
    }
}
```

**Output:**

```text
U-1 100
Hello, Selvi
5
```

**Effectively final:** a local variable that is never reassigned after initialisation, even without the keyword. Lambdas and anonymous/local classes can capture only final or effectively final locals.

`final` and immutability: a `final` field fixes the reference; the referenced object may still be mutable. See [Immutability](../immutability/content.md).

## The `abstract` Keyword

| Applied to | Meaning | Illegal combinations |
|------------|---------|----------------------|
| Class | Cannot be instantiated; may contain abstract methods | `abstract final` |
| Method | Declared without a body; subclasses must implement it | `abstract` with `private`, `static`, `final`, or a body |

Interface methods without a body are implicitly `abstract`. Full rules: [Abstraction](../../pillars/abstraction/content.md).

## `final` vs `finally` vs `finalize`

Three unrelated things with similar names — a classic interview question.

| | `final` | `finally` | `finalize()` |
|--|---------|-----------|--------------|
| What it is | A modifier keyword | A block of a `try` statement | A method of `Object` |
| Purpose | Prevent reassignment, overriding or extension | Run cleanup code whether or not an exception occurs | Hook the GC could call before reclaiming an object |
| Status | Core language | Core language (prefer try-with-resources for resources) | **Deprecated** (Java 9), marked for removal (Java 18) — do not use |

```java
public class FinallyDemo {

    static int divide(int a, int b) {
        try {
            return a / b;
        } catch (ArithmeticException e) {
            System.out.println("caught: " + e.getMessage());
            return -1;
        } finally {
            System.out.println("finally runs for " + a + "/" + b);   // runs even after return
        }
    }

    public static void main(String[] args) {
        System.out.println(divide(10, 2));
        System.out.println(divide(1, 0));
    }
}
```

**Output:**

```text
finally runs for 10/2
5
caught: / by zero
finally runs for 1/0
-1
```

`finally` runs after the `return` value is computed but before the method actually returns. It is skipped only in extreme cases (`System.exit`, the JVM crashing, an infinite loop in `try`). Avoid `return` inside `finally`: it silently discards exceptions and earlier return values.

## `this` and `super` — Summary

| | `this` | `super` |
|--|--------|---------|
| Reference | The current object | The current object viewed as its superclass |
| Call a constructor | `this(...)` — same class | `super(...)` — direct superclass |
| Access a member | `this.field`, `this.method()` | `super.field` (hidden field), `super.method()` (parent implementation) |
| In static context | Not available | Not available |
| Position as constructor call | First statement | First statement (only one of the two) |

## Virtual by Default

In Java, every non-`private`, non-`static`, non-`final` instance method can be overridden and is dispatched on the runtime object — you do not mark methods as "virtual". Consequences:

- Any public method of a non-final class is a potential override point. If a class is not designed for extension, make it `final` (or its methods `final`).
- A method called from a constructor can run a subclass override on a half-built object.

## Packages and Access

Packages are Java's unit of grouping and of **package-private** access (no modifier). A well-designed package exposes a few `public` types and keeps helpers package-private. Since Java 9, **modules** (`module-info.java`) add another layer: a `public` class is only accessible outside its module if its package is exported.

## Other Java-Specific OOP Features

| Feature | Covered in |
|---------|-----------|
| Static nested, inner, local and anonymous classes | [Nested Classes](../nested-classes/content.md) |
| Enums, records, sealed classes, pattern matching | [Modern Java OOP Features](../modern-java-oop/content.md) |
| Default, static and private interface methods; functional interfaces | [Interfaces](../../pillars/interfaces/content.md) |
| Generic classes and methods, bounded types, wildcards, PECS | [OOP with Generics](../../applied-oop/oop-with-generics/content.md) |
| Checked vs unchecked exceptions in class design | [OOP with Exceptions](../../applied-oop/oop-with-exceptions/content.md) |
| How the compiler and JVM choose a method | [Binding and Method Resolution](../binding-and-method-resolution/content.md) |

## Common Misconceptions

- **"`final` makes objects immutable."** It prevents reassignment of the variable.
- **"A `final` method cannot be inherited."** It is inherited; it cannot be overridden.
- **"`finally` always runs."** Not after `System.exit()` or a JVM crash.
- **"`finalize()` is Java's destructor."** It is deprecated and was never guaranteed to run.
- **"Java needs a `virtual` keyword for polymorphism."** Instance methods are virtual by default.
- **"Package-private and `protected` are the same."** `protected` also opens access to subclasses in other packages.

## Key Takeaways

- Separate the concept (core OOP) from Java's mechanism and rules.
- `static` = class-level; `final` = once (variable, method, class); `abstract` = incomplete, must be completed.
- `final` / `finally` / `finalize()` are unrelated; `finalize()` is deprecated.
- Java: single class inheritance, multiple interfaces, virtual-by-default instance methods, non-polymorphic fields and static methods.
- Effectively final locals can be captured by lambdas and inner classes.
