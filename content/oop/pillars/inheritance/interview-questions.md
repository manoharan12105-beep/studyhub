# Inheritance — Interview Questions

## Conceptual

### Q1. What is inheritance? Why is it used?

<details>
<summary>Answer</summary>

Inheritance lets a class extend another class, acquiring its accessible fields and methods and optionally overriding methods. It models an IS-A relationship (`Truck extends Vehicle`). It is used to reuse shared behaviour and, more importantly, to make subclasses substitutable for the superclass so code can work with the general type polymorphically.

</details>

### Q2. What types of inheritance does Java support?

<details>
<summary>Answer</summary>

Single (one parent), multilevel (a chain), and hierarchical (many children of one parent) for classes. Multiple inheritance of classes is not allowed; a class can implement multiple interfaces, which gives multiple inheritance of type (and, through default methods, of behaviour with explicit conflict resolution). Hybrid inheritance is possible only by combining classes with interfaces.

</details>

### Q3. Why doesn't Java support multiple inheritance of classes?

<details>
<summary>Answer</summary>

To avoid the diamond problem: if a class could extend two classes that both inherit from a common ancestor and both override the same method, it would be ambiguous which method to run, whether the object holds one or two copies of the ancestor's fields, and how the ancestor's constructor chain should run. Restricting classes to one parent keeps object layout and method lookup simple. Interfaces have no instance state, and default-method conflicts must be resolved explicitly by the implementing class, so multiple interface inheritance is safe.

</details>

### Q4. Are private members inherited?

<details>
<summary>Answer</summary>

No. Private fields and methods are not inherited — the subclass cannot refer to them by name. The private fields do still exist inside every subclass object (they are part of the superclass portion of the object), and inherited public/protected methods can use them. A subclass method with the same name as a private superclass method is a new method, not an override.

</details>

### Q5. What are the uses of the `super` keyword?

<details>
<summary>Answer</summary>

`super(args)` calls a superclass constructor (first statement only). `super.method()` calls the superclass's implementation of a method — typically from an override to extend rather than replace behaviour. `super.field` reads a superclass field hidden by a same-named subclass field. `super` cannot be used in static contexts, and `super.super` does not exist.

</details>

### Q6. What is the difference between method overriding and method hiding?

<details>
<summary>Answer</summary>

Overriding applies to instance methods: the subclass replaces the implementation and the runtime object type decides which runs (dynamic dispatch). Hiding applies to static methods (and to fields): the subclass declares a member with the same name and the compile-time reference type decides which one is used. `Parent p = new Child();` → `p.instanceMethod()` runs `Child`'s version; `p.staticMethod()` and `p.field` use `Parent`'s.

</details>

### Q7. What is the fragile base class problem?

<details>
<summary>Answer</summary>

When a subclass relies on how its superclass is implemented — for example, that `addAll` internally calls `add` — a change to the superclass that keeps its public behaviour the same can still break the subclass. The subclass is coupled to internals that were never part of the contract. Remedies: prefer composition and delegation, design classes explicitly for inheritance (documenting self-use), or make classes and methods `final`.

</details>

### Q8. When should you use inheritance, and when should you avoid it?

<details>
<summary>Answer</summary>

Use it for a genuine, stable IS-A relationship where the subclass can be substituted for the superclass everywhere, especially when the base class is designed for extension (abstract base classes, framework hooks). Avoid it for mere code reuse, for HAS-A or role relationships, when the subclass would need to disable inherited behaviour, when extending classes you do not control, and when variation happens along several independent dimensions. Composition is the usual alternative.

</details>

## Applied

### Q9. What does this print?

```java
class A {
    int value = 10;

    int getValue() {
        return value;
    }
}

class B extends A {
    int value = 20;

    @Override
    int getValue() {
        return value;
    }
}

public class HidingQuestion {
    public static void main(String[] args) {
        A obj = new B();
        System.out.println(obj.value + " " + obj.getValue());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
10 20
```

Fields are resolved by the reference type (`A`), so `obj.value` is `A`'s field. `getValue()` is overridden, so the runtime type `B` decides, and inside `B.getValue()` the name `value` refers to `B`'s field.

</details>

### Q10. Does this compile? If not, why?

```java
class Base {
    public void show() { }
}

class Derived extends Base {
    void show() { }   // compile-time error
}
```

<details>
<summary>Answer</summary>

No. An override cannot reduce visibility. `Base.show()` is public; `Derived.show()` is package-private. Code holding a `Base` reference must be able to call `show()` on any `Base`, including a `Derived`, so weaker access would break substitutability. Making it `public` fixes it.

</details>

### Q11. A `Manager` is an `Employee`, so a colleague writes `class Manager extends Employee`. Next year, managers can step down to individual contributors. What is the problem and what would you do?

<details>
<summary>Answer</summary>

Type is permanent for an object's lifetime, but "manager" is a role that changes. With inheritance, demoting someone means creating a new `Employee` object and copying data, breaking identity and references (payroll records, reports). Model the role with composition: `Employee` has a `Role` (or a set of roles/responsibilities), and promotions change the role field. Use inheritance only for classifications that never change for an object.

</details>
