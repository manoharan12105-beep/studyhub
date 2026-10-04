# Nested Classes — Interview Questions

## Conceptual

### Q1. What are the types of nested classes in Java?

<details>
<summary>Answer</summary>

Static nested classes (static members, no outer instance), inner classes (non-static members, tied to an outer instance), local classes (named classes inside a method or block), and anonymous classes (unnamed, declared and instantiated in one expression). Inner, local and anonymous classes can access the enclosing instance; local and anonymous classes can also capture effectively final local variables.

</details>

### Q2. What is the difference between a static nested class and an inner class?

<details>
<summary>Answer</summary>

A static nested class has no reference to an outer instance, is created with `new Outer.Nested()`, and can use the outer class's instance members only through an explicit object. An inner class instance is bound to an outer instance (`outer.new Inner()`), can use the outer object's members directly (via the hidden `Outer.this` reference), and keeps that outer object alive as long as it lives.

</details>

### Q3. When would you use an anonymous class instead of a lambda?

<details>
<summary>Answer</summary>

When the target is not a functional interface (an abstract class, or an interface with several abstract methods), when the implementation needs its own fields (state), or when `this` must refer to the implementing object rather than the enclosing instance. Otherwise lambdas are shorter and clearer.

</details>

### Q4. Why can local and anonymous classes only use effectively final local variables?

<details>
<summary>Answer</summary>

The class captures a **copy** of the local variable's value, because the object may outlive the method call whose stack frame holds the variable. If the variable could change afterwards, the copy and the original would disagree. Restricting capture to effectively final variables guarantees they are always the same.

</details>

### Q5. How can an inner class cause a memory leak?

<details>
<summary>Answer</summary>

Each inner-class object holds a hidden reference to its outer object. If an inner object is stored somewhere long-lived — a static collection, a listener registry, a background task — the outer object (and everything it references) stays reachable and cannot be garbage collected. Making the nested class `static` (and passing only what it needs) avoids this.

</details>

## Applied

### Q6. What does this print?

```java
public class ThisQuestion {

    private final String label = "outer";

    interface Labeled {
        String label();
    }

    Labeled anonymous() {
        return new Labeled() {
            private final String label = "anonymous";

            @Override
            public String label() {
                return this.label + "/" + ThisQuestion.this.label;
            }
        };
    }

    Labeled lambda() {
        return () -> this.label;
    }

    public static void main(String[] args) {
        ThisQuestion q = new ThisQuestion();
        System.out.println(q.anonymous().label());
        System.out.println(q.lambda().label());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
anonymous/outer
outer
```

In the anonymous class, `this` is the anonymous object (its own `label` field), and `ThisQuestion.this` is the enclosing object. In a lambda, `this` means the enclosing instance, so it reads the outer `label`.

</details>

### Q7. How do you instantiate this inner class from `main`?

```java
public class Bank {
    class Account {
        String id = "AC-1";
    }

    public static void main(String[] args) {
        // create an Account here
    }
}
```

<details>
<summary>Answer</summary>

`main` is static, so there is no `Bank` instance to bind to. Create one first: `Bank bank = new Bank(); Bank.Account account = bank.new Account();` — or in one line `new Bank().new Account()`. Writing `new Account()` directly in `main` does not compile. If `Account` does not need a `Bank` instance, declare it `static class Account` instead.

</details>
