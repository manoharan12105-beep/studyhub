# Interfaces — Interview Questions

## Conceptual

### Q1. What is the difference between an abstract class and an interface?

<details>
<summary>Answer</summary>

An abstract class can have instance fields, constructors, and methods with any access level, including concrete, final and abstract ones; a class can extend only one. An interface has no instance state or constructors; its methods are abstract, default, static or private, its fields are `public static final`; a class can implement many. Use an abstract class when related classes share state and code; use an interface to define a capability or contract that unrelated classes can implement and that callers depend on. They are often combined (`List` + `AbstractList`).

</details>

### Q2. Why were default methods introduced in Java 8?

<details>
<summary>Answer</summary>

To let interfaces evolve without breaking existing implementations. Before Java 8, adding a method to `Collection` (for example `stream()`) would have broken every class implementing it. A default method supplies a body, so old implementations inherit it, and new ones can override it. They also allow small reusable behaviour (like `Comparator.reversed()`).

</details>

### Q3. A class implements two interfaces that both have a default method `hello()`. What happens?

<details>
<summary>Answer</summary>

If neither interface extends the other and no superclass provides `hello()`, the class does not compile until it overrides `hello()`. Inside the override it can call a specific version with `InterfaceA.super.hello()`. The full rules: a method from the class hierarchy beats interface defaults; a more specific (sub-)interface beats its parent; otherwise the class must resolve the conflict explicitly.

</details>

### Q4. Can an interface have static methods? Are they inherited?

<details>
<summary>Answer</summary>

Yes, since Java 8. They are not inherited by implementing classes or sub-interfaces; they must be called with the interface name, for example `Comparator.naturalOrder()`. This avoids conflicts when a class implements several interfaces with static methods of the same name.

</details>

### Q5. What is a functional interface?

<details>
<summary>Answer</summary>

An interface with exactly one abstract method, such as `Runnable`, `Comparator<T>`, `Function<T, R>` or `Predicate<T>`. Default and static methods, and abstract re-declarations of public `Object` methods, do not count. Instances can be created with lambdas or method references. `@FunctionalInterface` makes the compiler enforce the single-abstract-method rule but is optional.

</details>

### Q6. What is a marker interface? Give examples.

<details>
<summary>Answer</summary>

An interface with no methods, used to tag a class with a capability that other code checks: `Serializable` (may be serialised), `Cloneable` (`Object.clone()` is allowed), `RandomAccess` (fast indexed access). Annotations are the modern alternative for metadata, but a marker interface is a real type, so it can be required by a method signature at compile time.

</details>

### Q7. Can an interface extend a class? Can it extend multiple interfaces?

<details>
<summary>Answer</summary>

An interface cannot extend a class. It can extend any number of interfaces: `interface ReadWritable extends Readable, Writable`. Implementing classes must then implement the abstract methods of all of them.

</details>

### Q8. Why must a method implementing an interface method be public?

<details>
<summary>Answer</summary>

Interface methods (other than private helper methods) are implicitly `public`. An implementation is an override, and overrides cannot reduce visibility. Leaving out `public` makes the method package-private, which is narrower, so the compiler rejects it.

</details>

### Q9. What does "program to an interface" mean?

<details>
<summary>Answer</summary>

Declare variables, parameters and return types with the most general type that offers what you need — usually an interface — instead of a concrete class: `List<Order> orders = new ArrayList<>();`, `void send(Notifier notifier)`. The calling code then works with any implementation, so implementations can be changed or replaced by fakes in tests without editing callers.

</details>

## Applied

### Q10. What does this print?

```java
interface Animal {
    default String sound() {
        return "generic sound";
    }
}

interface Dog extends Animal {
    @Override
    default String sound() {
        return "woof";
    }
}

class Pet {
    public String sound() {
        return "pet sound";
    }
}

class Labrador implements Animal, Dog { }

class Puppy extends Pet implements Dog { }

public class DefaultRules {
    public static void main(String[] args) {
        System.out.println(new Labrador().sound());
        System.out.println(new Puppy().sound());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
woof
pet sound
```

`Labrador` gets `Dog`'s default because `Dog` is more specific than `Animal`. `Puppy` gets `Pet.sound()` because a method inherited from a class always wins over interface defaults.

</details>

### Q11. When would you choose an abstract class over an interface in a real project?

<details>
<summary>Answer</summary>

When a family of closely related classes shares real state and code that needs initialising — for example several report generators that all hold a data source, a formatter and common step logic, with a fixed order of steps. The abstract class can hold the fields, a protected constructor, `final` template methods and protected hooks. I would still often expose an interface (`ReportGenerator`) as the type callers depend on, and have the abstract class implement it, so callers are not tied to the base class.

</details>
