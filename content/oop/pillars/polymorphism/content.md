# Polymorphism

## Definition

**Polymorphism** ("many forms") means the same call can lead to different behaviour depending on the object or the arguments involved. Java has two kinds:

- **Compile-time (static) polymorphism** — **method overloading**: several methods share a name but differ in parameters, and the **compiler** picks one based on the argument types.
- **Runtime (dynamic) polymorphism** — **method overriding** + **dynamic method dispatch**: a subclass replaces an inherited instance method, and the **JVM** picks the implementation based on the **actual object** at runtime.

When interviewers say "polymorphism" without a qualifier, they usually mean runtime polymorphism: *one interface, many implementations, chosen by the object's real type.*

## Why It Matters

Without polymorphism, code that handles several kinds of things checks the kind explicitly:

```java
double area(Object shape) {
    if (shape instanceof Circle) {
        Circle c = (Circle) shape;
        return Math.PI * c.radius * c.radius;
    } else if (shape instanceof Rectangle) {
        Rectangle r = (Rectangle) shape;
        return r.width * r.height;
    }
    throw new IllegalArgumentException("unknown shape");   // and every new shape edits this method
}
```

With polymorphism each shape knows its own area, and the calling code never changes when a new shape is added:

```java
double total = 0;
for (Shape shape : shapes) {
    total += shape.area();      // the object decides which area() runs
}
```

This is how polymorphism supports the [Open/Closed Principle](../../design-principles/open-closed-principle/content.md) and why most design patterns (Strategy, State, Command, Observer, …) are built on it.

## Compile-Time Polymorphism

**Method overloading**: same method name, different parameter lists, in the same class (or inherited into it).

```java
static int add(int a, int b)          { return a + b; }
static double add(double a, double b) { return a + b; }
static int add(int a, int b, int c)   { return a + b + c; }
```

`add(1, 2)` → first; `add(1.5, 2)` → second; `add(1, 2, 3)` → third. The choice is made by the **compiler**, using the **static (declared) types** of the arguments, and is fixed in the bytecode. Full rules, including widening, boxing and varargs: [Method Overloading](../method-overloading/content.md).

## Runtime Polymorphism

**Method overriding**: a subclass provides its own implementation of an inherited instance method with the same signature. A reference of the superclass (or interface) type can point to any subclass object, and calling the method runs **the object's** version.

```java
abstract class Shape {
    abstract double area();

    String describe() {
        return getClass().getSimpleName() + " with area " + String.format("%.2f", area());
    }
}

class Circle extends Shape {
    private final double radius;

    Circle(double radius) {
        this.radius = radius;
    }

    @Override
    double area() {
        return Math.PI * radius * radius;
    }
}

class Rectangle extends Shape {
    private final double width;
    private final double height;

    Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    double area() {
        return width * height;
    }
}

public class RuntimePolymorphism {
    public static void main(String[] args) {
        Shape[] shapes = { new Circle(1), new Rectangle(2, 3), new Circle(0.5) };
        double total = 0;
        for (Shape shape : shapes) {
            System.out.println(shape.describe());
            total += shape.area();
        }
        System.out.printf("Total area: %.2f%n", total);
    }
}
```

**Output:**

```text
Circle with area 3.14
Rectangle with area 6.00
Circle with area 0.79
Total area: 9.93
```

Notice that `describe()` is written once in `Shape` and calls `area()`; each object supplies its own `area()`. Rules for valid overrides: [Method Overriding](../method-overriding/content.md).

## Dynamic Method Dispatch

**Dynamic method dispatch** is the mechanism behind runtime polymorphism: a call to an overridable instance method is resolved **at runtime** using the class of the object the reference points to.

How it works conceptually:

1. **Compile time:** the compiler looks at the **reference type** (`Shape`), checks that a method `area()` is accessible there, and records the chosen **signature** (`area()`) in the bytecode as a virtual call.
2. **Runtime:** the JVM takes the actual object (`Circle`), starts at its class, and walks **up** the hierarchy until it finds an implementation of that signature. The first one found runs.

```text
 call: shape.area()       reference type Shape, object type Circle

 Circle   ── has area()? yes → run Circle.area()
   ▲
 Shape    (not reached)
   ▲
 Object
```

JVMs implement this efficiently (for example with per-class method tables and inline caching), so a virtual call is cheap.

## Static Binding and Dynamic Binding

**Binding** is connecting a call to the method body that will execute.

| | Static (early) binding | Dynamic (late) binding |
|--|------------------------|------------------------|
| When | Compile time | Runtime |
| Based on | Reference (declared) type | Actual object type |
| Applies to | `static` methods, `private` methods, constructors, field access, overload selection, `super.method()` calls | Overridable instance methods (not `private`, not `static`; `final` methods are also dispatched virtually but can never be overridden, so the result is the same) |
| Polymorphic | No | Yes |

> [!NOTE]
> Overload **selection** is always static, even for instance methods: the compiler chooses *which signature* using argument types. Overriding then chooses *which class's implementation of that signature* at runtime. Both steps happen on every instance-method call. Deeper treatment: [Binding and Method Resolution](../../java-oop/binding-and-method-resolution/content.md).

## Reference Type vs Object Type

`Animal a = new Dog();`

- **Reference type** (static type, declared type): `Animal` — what the **compiler** knows.
- **Object type** (runtime type, actual type): `Dog` — what the **object** really is.

| Question | Decided by | Example with `Animal a = new Dog()` |
|----------|-----------|-------------------------------------|
| Which methods can I call? | Reference type | `a.fetch()` does not compile if `Animal` has no `fetch()` |
| Which overload is chosen? | Reference (static) types of the arguments | `print(a)` picks `print(Animal)` even if `print(Dog)` exists |
| Which overridden instance method runs? | **Object type** | `a.sound()` runs `Dog.sound()` |
| Which field is read? | Reference type | `a.name` reads `Animal.name` |
| Which static method runs? | Reference type | `a.create()` runs `Animal.create()` |
| Can it be cast to `Dog`? | Checked by compiler (types related?) and by runtime (object really a `Dog`?) | `(Dog) a` succeeds |

## What the Compiler Knows vs What the Runtime Object Is

Use this two-step reasoning for every tricky polymorphism question.

### Example 1: method exists only in the subclass

```java
class Animal {
    void eat() {
        System.out.println("Animal eats");
    }
}

class Dog extends Animal {
    @Override
    void eat() {
        System.out.println("Dog eats");
    }

    void fetch() {
        System.out.println("Dog fetches");
    }
}

class Main {
    void run() {
        Animal a = new Dog();
        a.eat();          // Dog eats
        a.fetch();        // compile-time error: cannot find symbol fetch() in Animal
    }
}
```

| Step | Compiler knows | Runtime object is |
|------|----------------|-------------------|
| `a.eat()` | `Animal` has `eat()` → OK, call `eat()` | `Dog` → runs `Dog.eat()` |
| `a.fetch()` | `Animal` has no `fetch()` → **error** | (never runs) |

### Example 2: overload chosen by the compiler, override chosen at runtime

```java
class Animal {
    void greet(Animal other) {
        System.out.println("Animal greets an animal");
    }

    void greet(Dog other) {
        System.out.println("Animal greets a dog");
    }
}

class Dog extends Animal {
    @Override
    void greet(Animal other) {
        System.out.println("Dog greets an animal");
    }

    @Override
    void greet(Dog other) {
        System.out.println("Dog greets a dog");
    }
}

public class TwoStepResolution {
    public static void main(String[] args) {
        Animal a = new Dog();
        Animal b = new Dog();
        Dog d = new Dog();
        a.greet(b);
        a.greet(d);
    }
}
```

**Output:**

```text
Dog greets an animal
Dog greets a dog
```

| Call | Compiler knows (picks the signature) | Runtime object (picks the class) |
|------|--------------------------------------|----------------------------------|
| `a.greet(b)` | `b` is declared `Animal` → `greet(Animal)` | `a` is a `Dog` → `Dog.greet(Animal)` |
| `a.greet(d)` | `d` is declared `Dog` → `greet(Dog)` (most specific) | `a` is a `Dog` → `Dog.greet(Dog)` |

Even though `b` *is* a `Dog` at runtime, the first call still uses the `greet(Animal)` signature: **argument types are never re-examined at runtime**. Java dispatches dynamically only on the receiver object (single dispatch). Choosing behaviour by the runtime types of two objects needs a technique such as [Visitor](../../design-patterns/visitor-pattern/content.md) (double dispatch).

### Example 3: fields and static methods do not dispatch

```java
class Parent {
    String label = "Parent field";

    static String kind() {
        return "Parent static";
    }

    String show() {
        return "Parent instance";
    }
}

class Child extends Parent {
    String label = "Child field";

    static String kind() {
        return "Child static";
    }

    @Override
    String show() {
        return "Child instance";
    }
}

public class WhatDispatches {
    public static void main(String[] args) {
        Parent p = new Child();
        System.out.println(p.label);
        System.out.println(p.kind());
        System.out.println(p.show());
    }
}
```

**Output:**

```text
Parent field
Parent static
Child instance
```

Only the instance method follows the object. The field and the static method follow the reference type.

## Upcasting, Downcasting and `instanceof`

- **Upcasting:** treating a subclass object as its superclass type — `Animal a = new Dog();`. Implicit and always safe.
- **Downcasting:** treating a superclass reference as a subclass type — `Dog d = (Dog) a;`. Needs an explicit cast and can fail at runtime with `ClassCastException`.
- **`instanceof`** checks the object type before downcasting; since Java 16, `if (a instanceof Dog dog)` checks and casts in one step.

Detailed rules and traps: [Upcasting and Downcasting](../upcasting-and-downcasting/content.md).

## Polymorphism Through Interfaces

Interfaces are the most common source of runtime polymorphism in real Java code:

```java
interface PaymentMethod {
    String pay(long amountPaise);
}

class UpiPayment implements PaymentMethod {
    public String pay(long amountPaise) {
        return "UPI collect request for " + amountPaise;
    }
}

class CardPayment implements PaymentMethod {
    public String pay(long amountPaise) {
        return "Card charged " + amountPaise;
    }
}
```

`checkout(PaymentMethod method)` works with any current or future payment method. `List<String> list = new ArrayList<>();` is the same idea from the standard library — "program to an interface". See [Interfaces](../interfaces/content.md).

## Where Polymorphism Appears

| Form | Example |
|------|---------|
| Polymorphic variable | `Shape s = new Circle(1);` |
| Polymorphic parameter | `void render(Shape s)` accepts any shape |
| Polymorphic return type | `Shape parse(String text)` returns a `Circle` or a `Rectangle` |
| Polymorphic collection | `List<Shape> shapes` holds mixed shapes |
| Polymorphic call inside the superclass | `Shape.describe()` calls the abstract `area()` (the basis of Template Method) |

## Constructors and Polymorphism

- Constructors are **not** polymorphic: they are not inherited, cannot be overridden, and `new Circle()` always runs `Circle`'s constructor.
- But calls **made inside** a constructor are dispatched dynamically. A superclass constructor that calls an overridable method runs the subclass override before the subclass fields are initialised. See [Constructors and Initialization](../../fundamentals/constructors-and-initialization/content.md#calling-overridable-methods-from-constructors).

## Comparison

| | Compile-time polymorphism | Runtime polymorphism |
|--|---------------------------|----------------------|
| Mechanism | Overloading | Overriding + dynamic dispatch |
| Decided by | Compiler, from static types of arguments | JVM, from the object's class |
| Methods involved | Same name, **different** parameter lists | Same name, **same** parameter list, in a subclass |
| Relationship needed | None (can be in one class) | Inheritance or interface implementation |
| Also called | Static binding, early binding | Dynamic binding, late binding |
| Purpose | Convenience: one name for related operations | Extensibility: new types without changing callers |

## Real-World Examples

- `List<String> names = new ArrayList<>();` — code using `names.add(...)` works unchanged if you switch to `LinkedList`.
- `Comparator<Employee>` — `Collections.sort(list, comparator)` calls `compare`, and each comparator object supplies different ordering.
- Logging frameworks: the application calls `logger.info(...)`; the configured implementation writes to console, file or a remote service.
- Spring injects whichever implementation of an interface is configured (`PaymentGateway` → a real gateway in production, a fake in tests).

## Common Misconceptions

- **"Overloading is runtime polymorphism."** Overload selection is entirely at compile time.
- **"The reference type decides which overridden method runs."** The reference type decides which methods **can** be called; the object type decides which override **runs**.
- **"Fields are polymorphic."** Field access uses the reference type.
- **"Static methods can be polymorphic."** They are hidden, not overridden.
- **"Runtime polymorphism checks argument runtime types."** Java dispatches dynamically only on the receiver; arguments are matched by their static types.
- **"Polymorphism requires inheritance of classes."** Interfaces provide it without class inheritance.

## Key Takeaways

- Two kinds: compile-time (overloading) and runtime (overriding + dynamic dispatch).
- Two questions per call: *the compiler* checks the reference type and fixes the signature; *the runtime* picks the implementation from the object's class.
- Only overridable instance methods dispatch dynamically; fields, static methods, private methods and constructors bind statically.
- Polymorphism replaces type checks with method calls and lets new types plug in without changing callers.
