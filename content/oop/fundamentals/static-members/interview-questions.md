# Static Members — Interview Questions

## Conceptual

### Q1. What does the `static` keyword mean in Java?

<details>
<summary>Answer</summary>

`static` makes a member belong to the class rather than to instances. A static field has one copy shared by all objects; a static method can be called with the class name and has no `this`. It can be applied to fields, methods, initialisation blocks and nested classes — not to top-level classes, constructors or local variables.

</details>

### Q2. Why can't a static method access instance variables directly?

<details>
<summary>Answer</summary>

Instance variables exist per object, and a static method is not invoked on any object, so there is no "current object" whose field it could read. It can access instance data only through an explicit object reference (`order.total()`).

</details>

### Q3. Why is the `main` method static?

<details>
<summary>Answer</summary>

So the JVM can call it before any object exists. If `main` were an instance method, the JVM would first need to create an instance, and it would not know which constructor or arguments to use.

</details>

### Q4. Can a static method be overridden?

<details>
<summary>Answer</summary>

No. Declaring a static method with the same signature in a subclass **hides** the superclass method. The call is bound at compile time using the reference type, so `Parent p = new Child(); p.staticMethod()` runs `Parent`'s version. Overriding requires runtime dispatch on the object type, which only instance methods get. (A static method also cannot hide an instance method, nor can an instance method override a static one — both are compile-time errors.)

</details>

### Q5. Can we use `this` or `super` inside a static method?

<details>
<summary>Answer</summary>

No. Both refer to the current object, and static methods have none. The compiler reports "non-static variable this cannot be referenced from a static context".

</details>

### Q6. When should you avoid static?

<details>
<summary>Answer</summary>

Avoid it for mutable shared state (it behaves like a global variable: hidden coupling, thread-safety problems, tests that affect each other), for behaviour that subclasses or alternative implementations might need to change (static methods cannot be overridden), and for dependencies such as database or email access (static calls cannot be swapped for fakes in tests without special tools). Prefer instance methods on injected objects there.

</details>

## Applied

### Q7. What does this print?

```java
public class SharedCount {

    static int count = 0;
    int id;

    SharedCount() {
        count++;
        id = count;
    }

    public static void main(String[] args) {
        SharedCount a = new SharedCount();
        SharedCount b = new SharedCount();
        a.count = 10;
        SharedCount c = new SharedCount();
        System.out.println(a.id + " " + b.id + " " + c.id + " " + b.count);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
1 2 11 11
```

`count` is static, so `a.count = 10` changes the single shared variable (accessing it through `a` is legal but misleading). The third constructor increments it to 11. `b.count` reads the same variable.

</details>

### Q8. What does this print?

```java
class Base {
    static void greet() {
        System.out.println("Base static");
    }

    void hello() {
        System.out.println("Base instance");
    }
}

class Sub extends Base {
    static void greet() {
        System.out.println("Sub static");
    }

    @Override
    void hello() {
        System.out.println("Sub instance");
    }
}

public class HideVsOverride {
    public static void main(String[] args) {
        Base ref = new Sub();
        ref.greet();
        ref.hello();
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
Base static
Sub instance
```

`greet` is static: bound at compile time to the reference type `Base`. `hello` is an instance method overridden in `Sub`: dispatched at runtime to the object type `Sub`.

</details>

### Q9. A class `DateUtils` has only static methods. How do you stop people from creating `DateUtils` objects?

<details>
<summary>Answer</summary>

Declare a private constructor: `private DateUtils() { }`. Code outside the class cannot call it, and since a constructor is declared, no default constructor is generated. Many codebases also make the class `final` to make the intent explicit. (Making it `abstract` is a weaker trick: it can still be subclassed.)

</details>
