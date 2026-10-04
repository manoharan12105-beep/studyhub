# Java-Specific OOP — Practice

### P1. Illegal combination

**Difficulty:** Easy · **Type:** MCQ

Which combination of modifiers is legal on a method?

- A) `abstract final`
- B) `abstract static`
- C) `public final`
- D) `private abstract`

<details>
<summary>Answer</summary>

**Answer:** C) `public final`

**Explanation:** An abstract method must be overridable, so it cannot be `final`, `static` or `private`.

</details>

### P2. Classify the question

**Difficulty:** Easy · **Type:** Conceptual

Label each as a core-OOP or Java-specific question: (a) "What is polymorphism?" (b) "Can an interface have private methods?" (c) "Why prefer composition over inheritance?" (d) "Are static methods inherited?"

<details>
<summary>Answer</summary>

**Answer:** (a) core OOP; (b) Java-specific (Java 9+); (c) core OOP (design); (d) Java-specific.

**Explanation:** Core questions apply to any OO language; Java-specific ones test Java's rules. Answer core questions with the concept first, then Java's mechanism.

</details>

### P3. finally with exceptions

**Difficulty:** Medium · **Type:** Output-based

```java
public class FinallyOrder {

    static void process(String input) {
        try {
            System.out.println("parsing " + input);
            int value = Integer.parseInt(input);
            System.out.println("value " + value);
        } catch (NumberFormatException e) {
            System.out.println("bad number");
        } finally {
            System.out.println("cleanup");
        }
    }

    public static void main(String[] args) {
        process("42");
        process("x");
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
parsing 42
value 42
cleanup
parsing x
bad number
cleanup
```

**Explanation:** `finally` runs after normal completion and after the catch block.

</details>

### P4. Capturing variables

**Difficulty:** Medium · **Type:** Code analysis

```java
import java.util.ArrayList;
import java.util.List;

class Capture {
    List<Runnable> tasks() {
        List<Runnable> tasks = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            tasks.add(() -> System.out.println(i));    // compile-time error
        }
        return tasks;
    }
}
```

Why does this not compile, and how do you fix it?

<details>
<summary>Answer</summary>

**Answer:** The loop variable `i` is reassigned by `i++`, so it is not effectively final and cannot be captured by the lambda. Fix: copy it into a new variable inside the loop — `int copy = i; tasks.add(() -> System.out.println(copy));` — each iteration creates a fresh effectively final `copy`. (An enhanced `for` over a collection works too, because its loop variable is a fresh variable per iteration.)

</details>
