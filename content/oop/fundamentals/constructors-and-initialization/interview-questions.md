# Constructors and Initialization — Interview Questions

## Conceptual

### Q1. What is a constructor and how is it different from a method?

<details>
<summary>Answer</summary>

A constructor initialises a newly created object; `new` invokes it automatically. Differences from a method: its name must match the class, it has no return type, it is not inherited, it cannot be `static`, `final` or `abstract`, and it can only be called through `new`, `this(...)` or `super(...)`. A "constructor" written with `void` is actually a method.

</details>

### Q2. When does the compiler provide a default constructor?

<details>
<summary>Answer</summary>

Only when the class declares no constructor at all. The default constructor has no parameters, the same access level as the class, and a body that calls `super()`. Declaring any constructor — even a parameterised one — removes it, so `new X()` then fails to compile unless you write a no-arg constructor yourself.

</details>

### Q3. Are constructors inherited? Can they be overridden?

<details>
<summary>Answer</summary>

Neither. A constructor belongs to its class; a subclass must declare its own constructors and chain to the superclass with `super(...)` (explicitly or via the implicit `super()`). Since they are not inherited, overriding them is meaningless. They can be **overloaded** within one class.

</details>

### Q4. What is constructor chaining? What are the rules for `this()` and `super()`?

<details>
<summary>Answer</summary>

Constructor chaining is one constructor calling another — `this(...)` for the same class, `super(...)` for the direct superclass — so initialisation logic is written once.

Rules: the call must be the first statement; a constructor can have only one of the two; without either, the compiler inserts `super()`; the arguments cannot use instance fields or instance methods of the object being built; and the chain must not be recursive.

</details>

### Q5. What is the difference between a static block and an instance block?

<details>
<summary>Answer</summary>

A `static {}` block runs once, when the class is initialised (first active use), and can touch only static members. An instance block `{}` runs on every object creation, after the superclass constructor and before the rest of the constructor body, and can use instance members. Both run in textual order with the corresponding field initialisers.

</details>

### Q6. Why is it dangerous to call an overridable method from a constructor?

<details>
<summary>Answer</summary>

Method calls in a constructor are still dynamically dispatched. When a superclass constructor calls a method that a subclass overrides, the subclass version runs before the subclass's own fields are initialised, so it sees default values (`null`, `0`) and may crash or behave wrongly. Constructors should call only `private`, `final` or `static` methods.

</details>

### Q7. Can a constructor be private? Why would you do that?

<details>
<summary>Answer</summary>

Yes. A private constructor prevents instantiation from outside the class. It is used for utility classes with only static members, singletons, and classes that expose static factory methods (`Money.of(...)`) so they can validate, cache or return subclasses.

</details>

## Applied

### Q8. What does this print?

```java
class A {
    A() {
        System.out.println("A");
    }
}

class B extends A {
    B() {
        this(0);
        System.out.println("B");
    }

    B(int x) {
        System.out.println("B(int)");
    }
}

public class ChainQuestion {
    public static void main(String[] args) {
        new B();
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
A
B(int)
B
```

`B()` starts with `this(0)`, so it has no implicit `super()`. `B(int)` has no explicit call, so the compiler inserts `super()`, printing `A` first. Then `B(int)` prints, and finally the rest of `B()` runs. The superclass constructor runs exactly once.

</details>

### Q9. What does this print?

```java
public class StaticAndInstance {

    static int counter;

    static {
        counter = 10;
        System.out.println("static block, counter = " + counter);
    }

    {
        counter++;
        System.out.println("instance block, counter = " + counter);
    }

    StaticAndInstance() {
        System.out.println("constructor");
    }

    public static void main(String[] args) {
        System.out.println("main");
        new StaticAndInstance();
        new StaticAndInstance();
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
static block, counter = 10
main
instance block, counter = 11
constructor
instance block, counter = 12
constructor
```

The class containing `main` is initialised before `main` runs, so the static block prints first. Each `new` runs the instance block and then the constructor body; `counter` is static, so both objects increment the same variable.

</details>

### Q10. Why does this fail to compile, and what are two ways to fix it?

```java
class Account {
    Account(String id) { }
}

class SavingsAccount extends Account {
    SavingsAccount() { }   // compile-time error
}
```

<details>
<summary>Answer</summary>

`SavingsAccount()` gets an implicit `super()`, but `Account` has no no-arg constructor. Fixes: call an existing constructor explicitly — `SavingsAccount() { super("SAV-NEW"); }` (or take an id parameter and pass it on) — or add a no-arg constructor to `Account` if a default id genuinely makes sense. The first is usually right: the subclass should not weaken `Account`'s requirement for an id.

</details>
