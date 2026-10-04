# Java-Specific OOP — Interview Questions

## Conceptual

### Q1. What is the difference between `final`, `finally` and `finalize()`?

<details>
<summary>Answer</summary>

`final` is a modifier: a final variable cannot be reassigned, a final method cannot be overridden, a final class cannot be extended. `finally` is the block of a `try` statement that runs whether or not an exception occurred, used for cleanup. `finalize()` is a deprecated method of `Object` that the garbage collector might call before reclaiming an object; it is unreliable and should not be used — use try-with-resources instead.

</details>

### Q2. What are the uses of the `final` keyword?

<details>
<summary>Answer</summary>

- Variables and parameters: assign once.
- Instance fields: assigned exactly once by the end of construction (blank finals must be assigned in every constructor); gives visibility guarantees across threads.
- Static fields: constants when combined with `static`.
- Methods: cannot be overridden.
- Classes: cannot be subclassed (`String`, wrappers, records).

</details>

### Q3. What is an effectively final variable?

<details>
<summary>Answer</summary>

A local variable or parameter that is never reassigned after initialisation, even though it is not declared `final`. Lambdas, local classes and anonymous classes may capture only final or effectively final locals, because they capture the variable's value, and allowing later reassignment would make the captured copy and the variable disagree.

</details>

### Q4. Does `finally` run if there is a `return` in the `try` block?

<details>
<summary>Answer</summary>

Yes. The return value is computed, then the `finally` block runs, then the method returns. If the `finally` block itself executes a `return`, it overrides the earlier return value (and swallows any exception), which is why `return` in `finally` is considered a bug. `finally` does not run if the JVM stops — for example `System.exit()` or a crash.

</details>

### Q5. Which OOP features does Java deliberately not support, and why?

<details>
<summary>Answer</summary>

Multiple inheritance of classes (to avoid the diamond problem; interfaces give multiple inheritance of type), operator overloading (to keep code readable; only `+` on strings is built in), destructors (memory is managed by the garbage collector; resources use try-with-resources), and pointer arithmetic (for memory safety). Everything must live inside classes, though primitives and static members mean Java is not purely object-oriented.

</details>

### Q6. Can a `final` method be overloaded? Inherited?

<details>
<summary>Answer</summary>

Yes to both. `final` only prevents overriding. Subclasses inherit the final method and can declare overloads with different parameter lists.

</details>

## Applied

### Q7. What does this print?

```java
public class FinallyReturn {

    static int compute() {
        int x = 1;
        try {
            x = 2;
            return x;
        } finally {
            x = 3;
            System.out.println("finally sets x = " + x);
        }
    }

    public static void main(String[] args) {
        System.out.println(compute());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
finally sets x = 3
2
```

The value 2 is captured as the return value when `return x` executes. The `finally` block then runs and changes the local variable, but that does not change the already-captured return value (it would if `x` referred to a mutable object that `finally` modified).

</details>

### Q8. Why does this fail to compile?

```java
class Counter {
    private final int start;

    Counter(boolean fromZero) {      // compile-time error
        if (fromZero) {
            start = 0;
        }
    }
}
```

<details>
<summary>Answer</summary>

`start` is a blank final field, and Java requires it to be definitely assigned on every path through every constructor. When `fromZero` is `false`, it would remain unassigned ("variable start might not have been initialized"). Fix with an `else` branch or assign in all cases.

</details>
