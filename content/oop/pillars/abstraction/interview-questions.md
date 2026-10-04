# Abstraction — Interview Questions

## Conceptual

### Q1. What is abstraction? How is it achieved in Java?

<details>
<summary>Answer</summary>

Abstraction is showing only the essential operations of an object and hiding how they are implemented. In Java it is achieved with interfaces (pure contracts), abstract classes (partial implementations with abstract methods), and in general by public methods that hide internal steps. Example: `List.add()` works the same for `ArrayList` and `LinkedList` even though their internals are completely different.

</details>

### Q2. Can an abstract class have a constructor? Why, if it cannot be instantiated?

<details>
<summary>Answer</summary>

Yes. Subclass objects contain the abstract class's fields, and those fields must be initialised. The abstract class's constructor runs through `super(...)` when a concrete subclass is instantiated. Constructors in abstract classes are often `protected` to signal that only subclasses use them.

</details>

### Q3. Can an abstract class have no abstract methods?

<details>
<summary>Answer</summary>

Yes. Declaring it `abstract` then simply prevents direct instantiation, for example a base class that is only meaningful through subclasses. (The reverse is not allowed: a class with an abstract method must be declared abstract.)

</details>

### Q4. Why can't an abstract method be private, static or final?

<details>
<summary>Answer</summary>

An abstract method exists to be implemented by subclasses. A private method is invisible to subclasses, a static method cannot be overridden (only hidden), and a final method cannot be overridden — so in all three cases no subclass could ever supply the body. The compiler rejects these combinations. For the same reason a class cannot be both `abstract` and `final`.

</details>

### Q5. What is the difference between abstraction and encapsulation?

<details>
<summary>Answer</summary>

Abstraction hides complexity: it defines what a type offers (`Vehicle.start()`) without exposing how. Encapsulation hides state: it keeps data private and lets it change only through validating methods (`fuelLevel` changed only by `refuel()`). Abstraction is a design-level concern about the contract; encapsulation is an implementation-level concern about protecting invariants. Good classes use both.

</details>

### Q6. Can we create an object of an abstract class?

<details>
<summary>Answer</summary>

Not directly — `new AbstractType()` does not compile. You can create an object of a concrete subclass, or of an anonymous subclass (`new AbstractType() { ...implement methods... }`), and refer to it through the abstract type.

</details>

## Applied

### Q7. What does this print?

```java
abstract class Beverage {
    Beverage() {
        System.out.println("Preparing " + name());
    }

    abstract String name();

    final void serve() {
        System.out.println("Serving " + name());
    }
}

class Coffee extends Beverage {
    private final String size = "large";

    @Override
    String name() {
        return size + " coffee";
    }
}

public class AbstractConstructor {
    public static void main(String[] args) {
        Beverage b = new Coffee();
        b.serve();
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
Preparing large coffee
Serving large coffee
```

Surprising detail: `size` is a `final` field initialised with a **compile-time constant** (`"large"`), so the compiler inlines the constant wherever `size` is read — `name()` sees `"large"` even before the field initialiser has run. If `size` were initialised with a non-constant expression (for example `new String("large")` or a method call), the first line would print `Preparing null coffee`. The general rule stands: do not call overridable methods from constructors.

</details>

### Q8. When would you introduce an abstraction, and when would you avoid one?

<details>
<summary>Answer</summary>

Introduce one when there are genuine alternative implementations (payment providers, storage back-ends), at boundaries to external systems you want to isolate or fake in tests, or when callers should not depend on details that are likely to change. Avoid one for a single implementation with no foreseeable variation and no testing need, or when the abstraction would leak details anyway. Speculative abstractions add indirection and often pick the wrong extension point.

</details>
