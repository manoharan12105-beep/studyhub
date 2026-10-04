# Constructors and Initialization

## Definition

A **constructor** is a special block of code that runs when an object is created with `new`. Its job is to put the new object into a **valid initial state**. It has the same name as the class, has **no return type**, and is not inherited. **Initialization blocks** (`{ … }` and `static { … }`) are additional code that runs during object creation and class loading respectively.

## Why It Matters

- A class that can be constructed in an invalid state (an `Account` with a negative balance, a `User` without an id) pushes validation onto every caller. The constructor is the one place guaranteed to run before anyone uses the object.
- Interviewers love **initialization-order** questions: static blocks, instance blocks, field initialisers, `this(...)`, `super(...)` and constructors across a class hierarchy. Getting the order right requires knowing the exact rules below.

## Constructors

### Rules

| Rule | Detail |
|------|--------|
| Name | Same as the class |
| Return type | None — not even `void`. `void Student() {}` is an ordinary **method** that happens to share the class name. |
| Modifiers | Access modifiers only (`public`, `protected`, package-private, `private`). Not `static`, `final`, `abstract` or `synchronized`. |
| Inheritance | Constructors are **not inherited** and cannot be overridden. Each class declares its own. |
| Overloading | Allowed — several constructors with different parameter lists. |
| Exceptions | May declare `throws`. Throwing from a constructor means no reference to the object is returned. |

### Default constructor

If a class declares **no constructor at all**, the compiler adds a **default constructor**: no parameters, same access as the class, body that just calls `super()`.

As soon as you declare **any** constructor, the default one is not generated:

```java
class Product {
    private final String name;

    Product(String name) {
        this.name = name;
    }
}

class Shop {
    Product p = new Product();      // compile-time error: no Product() constructor exists
}
```

### No-argument and parameterised constructors

```java
public class ConstructorKinds {

    static class Temperature {
        private final double celsius;

        Temperature() {                       // no-arg: a sensible default
            this(25.0);                       // delegate to the main constructor
        }

        Temperature(double celsius) {         // parameterised: validates input
            if (celsius < -273.15) {
                throw new IllegalArgumentException("below absolute zero: " + celsius);
            }
            this.celsius = celsius;
        }

        Temperature(Temperature other) {      // copy constructor
            this(other.celsius);
        }

        double celsius() {
            return celsius;
        }
    }

    public static void main(String[] args) {
        System.out.println(new Temperature().celsius());
        System.out.println(new Temperature(-10).celsius());
        System.out.println(new Temperature(new Temperature(37)).celsius());
        try {
            new Temperature(-300);
        } catch (IllegalArgumentException e) {
            System.out.println("Rejected: " + e.getMessage());
        }
    }
}
```

**Output:**

```text
25.0
-10.0
37.0
Rejected: below absolute zero: -300.0
```

A **copy constructor** takes another object of the same class and copies its state. Java has no built-in copy constructor; you write one when you need a copy (it is usually clearer than `clone()`).

### Private constructors

A `private` constructor stops other classes from calling `new`. Used for:

- **Utility classes** with only static methods (`private MathUtils() {}`), so nobody instantiates them.
- **Singletons** and **static factory methods** (`Money.of(…)`), where the class controls how instances are created. See [Singleton](../../design-patterns/singleton-pattern/content.md).

## Constructor Chaining

**Constructor chaining** means one constructor calling another, so the real initialisation logic is written once.

- `this(arguments)` calls another constructor **of the same class**.
- `super(arguments)` calls a constructor **of the direct superclass**.

Rules (Java 17):

1. `this(...)` or `super(...)` must be the **first statement** of a constructor.
2. A constructor can contain **one or the other, not both**.
3. If a constructor starts with neither, the compiler inserts `super();` — a call to the superclass's no-arg constructor. If the superclass has no accessible no-arg constructor, that is a compile-time error.
4. Arguments to `this(...)`/`super(...)` cannot refer to instance fields or instance methods of the object being created (it is not initialised yet); static members and parameters are fine.
5. Chains must not be cyclic: `A() { this(1); }` with `A(int x) { this(); }` is a compile-time error ("recursive constructor invocation").

```java
class Vehicle {
    private final String registration;

    Vehicle(String registration) {          // no no-arg constructor in Vehicle
        this.registration = registration;
    }
}

class Bike extends Vehicle {
    Bike() {                                // compile-time error: the implicit super() needs Vehicle()
    }
}
```

Fix: `Bike() { super("UNREGISTERED"); }` or call `super(registration)` from a `Bike(String registration)` constructor.

## `this` and `super`

| Keyword | As a reference | As a constructor call |
|---------|----------------|------------------------|
| `this` | Current object: `this.name`, `return this` | `this(...)` — another constructor of the same class |
| `super` | Superclass view of the current object: `super.describe()`, `super.field` | `super(...)` — a constructor of the direct superclass |

`super.method()` calls the superclass's version of an overridden method; it is how an override *extends* rather than replaces behaviour. More in [Inheritance](../../pillars/inheritance/content.md).

## Initialization Blocks

### Instance initialization blocks

An **instance initializer** `{ … }` runs every time an object is created, **before the constructor body** (after the superclass constructor finishes). The compiler effectively copies instance initialisers and field initialisers, in textual order, into each constructor that calls `super(...)` (explicitly or implicitly), right after that call. A constructor that starts with `this(...)` does not get a copy, so they run exactly once per object.

Use them rarely: code shared by all constructors is usually clearer in a private method or in one constructor that the others chain to.

### Static initialization blocks

A **static initializer** `static { … }` runs **once**, when the class is initialised — before its first instance is created, its first static method is called, or a non-constant static field is accessed. Static field initialisers and static blocks run in textual order. Typical use: building a lookup table or loading configuration into static fields.

## Initialization Order

### Single class

For `new C()` the first time `C` is used:

1. **Static** field initialisers and `static` blocks of `C`, in textual order (once per class).
2. Fields defaulted (`0`, `false`, `null`).
3. Constructor called → implicit or explicit `super(...)` runs first (here: `Object`).
4. **Instance** field initialisers and instance blocks, in textual order.
5. The rest of the constructor body.

### With inheritance

For `new Child()` when neither class has been initialised yet:

```text
1. Parent static initialisation       (superclass is initialised before subclass)
2. Child static initialisation
3. Parent instance initialisers + Parent constructor body
4. Child  instance initialisers + Child  constructor body
```

Steps 1–2 happen once per class; steps 3–4 happen for every object.

```java
class Parent {
    static {
        System.out.println("1. Parent static block");
    }

    {
        System.out.println("3. Parent instance block");
    }

    Parent() {
        System.out.println("4. Parent constructor");
    }
}

class Child extends Parent {
    static {
        System.out.println("2. Child static block");
    }

    private final String label = initLabel();

    {
        System.out.println("6. Child instance block");
    }

    Child() {
        super();                                        // explicit here; the compiler would add it anyway
        System.out.println("7. Child constructor");
    }

    private String initLabel() {
        System.out.println("5. Child field initialiser");
        return "child";
    }
}

public class InitOrder {
    public static void main(String[] args) {
        System.out.println("main starts");
        new Child();
        System.out.println("--- second object ---");
        new Child();
    }
}
```

**Output:**

```text
main starts
1. Parent static block
2. Child static block
3. Parent instance block
4. Parent constructor
5. Child field initialiser
6. Child instance block
7. Child constructor
--- second object ---
3. Parent instance block
4. Parent constructor
5. Child field initialiser
6. Child instance block
7. Child constructor
```

Note that the static blocks run **after** "main starts": classes are initialised lazily, on first active use, not when the program starts. (Static blocks of the class containing `main` would run before `main`, because calling `main` is the first use of that class.)

## Calling Overridable Methods from Constructors

A superclass constructor runs **before** the subclass's fields are initialised. If it calls a method that the subclass overrides, the override runs on a half-built object:

```java
class Base {
    Base() {
        describe();                       // dynamic dispatch, even inside a constructor
    }

    void describe() {
        System.out.println("Base");
    }
}

class Derived extends Base {
    private String name = "Derived";

    @Override
    void describe() {
        System.out.println("name = " + name);
    }
}

public class ConstructorPolymorphism {
    public static void main(String[] args) {
        new Derived();
    }
}
```

**Output:**

```text
name = null
```

`name` is still `null` because `Derived`'s field initialiser has not run yet. Rule of thumb: **constructors should only call `private`, `final` or `static` methods** (which cannot be overridden).

## Comparison

| | Constructor | Method |
|--|------------|--------|
| Name | Must equal the class name | Any name (can even equal the class name) |
| Return type | None | Required (`void` or a type) |
| Called | Automatically by `new` (or via `this(...)`/`super(...)`) | Explicitly, any number of times |
| Inherited | No | Yes (if accessible) |
| Can be `static`/`final`/`abstract` | No | Yes |

| | Instance initializer `{}` | Static initializer `static {}` | Constructor |
|--|---------------------------|--------------------------------|-------------|
| Runs | Every object creation | Once, when the class initialises | Every object creation |
| Can access instance members | Yes | No | Yes |
| Can take parameters | No | No | Yes |

## Real-World Examples

- `new ArrayList<>(existingList)` is a copy constructor; `new ArrayList<>(100)` sets the initial capacity.
- `Integer.valueOf(42)`, `List.of(...)`, `LocalDate.of(2026, 1, 15)` are **static factory methods** — alternatives to public constructors with descriptive names and caching.
- Frameworks such as Spring prefer **constructor injection**: dependencies are passed into the constructor, so the object is complete when created. See [Dependency Injection](../../design-principles/dependency-injection/content.md).

## Common Misconceptions

- **"Constructors are inherited."** They are not. A subclass must declare its own and chain to a superclass constructor.
- **"The default constructor always exists."** Only when you declare no constructor at all.
- **"A constructor creates the object."** `new` allocates the object; the constructor initialises it.
- **"Instance blocks run before the superclass constructor."** They run after `super(...)` returns, before the rest of the constructor body.
- **"Static blocks run when the program starts."** They run when the class is first initialised.
- **"`void ClassName()` is a constructor."** It is a method; the class still gets a default constructor if no real one is declared.

## Key Takeaways

- Constructors establish a valid initial state; validate there.
- No return type, not inherited, can be overloaded, can be private.
- `this(...)` / `super(...)` must be first, and only one of them; otherwise `super()` is inserted.
- Order: static (parent → child, once) → for each object: parent instance init + constructor → child instance init + constructor.
- Instance initialisers and field initialisers run in textual order, after `super(...)`.
- Never call overridable methods from a constructor.
