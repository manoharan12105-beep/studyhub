# Nested Classes — Practice

### P1. Choose the kind

**Difficulty:** Easy · **Type:** MCQ

A `Node` class used only inside your `LinkedList` implementation stores a value and a `next` pointer and never touches the list's fields. Which kind of class fits best?

- A) Inner class
- B) Static nested class
- C) Anonymous class
- D) Separate public top-level class

<details>
<summary>Answer</summary>

**Answer:** B) Static nested class

**Explanation:** It needs no outer instance, so `static` avoids a hidden reference per node; keeping it nested (and private) hides an implementation detail.

</details>

### P2. Does it compile?

**Difficulty:** Medium · **Type:** Code analysis

```java
public class Outer {
    private int secret = 42;

    static class Nested {
        int read() {
            return secret;
        }
    }
}
```

<details>
<summary>Answer</summary>

**Answer:** No. `Nested` is static, so there is no `Outer` instance whose `secret` it could read. Either make `Nested` an inner class (remove `static`) or pass an `Outer` object: `int read(Outer o) { return o.secret; }` — accessing the private field through a reference is allowed because it is inside `Outer`'s body.

</details>

### P3. Anonymous class with state

**Difficulty:** Medium · **Type:** Output-based

```java
public class CounterQuestion {

    interface Counter {
        int next();
    }

    static Counter from(int start) {
        return new Counter() {
            private int value = start;

            @Override
            public int next() {
                return value++;
            }
        };
    }

    public static void main(String[] args) {
        Counter a = from(5);
        Counter b = from(5);
        a.next();
        a.next();
        System.out.println(a.next() + " " + b.next());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
7 5
```

**Explanation:** Each call to `from` creates a separate anonymous object with its own `value` field, initialised from the captured `start`. `a` has returned 5 and 6 and now returns 7; `b` returns its first value, 5.

</details>

### P4. Fix the leak

**Difficulty:** Hard · **Type:** Scenario

A `ReportScreen` object (which holds large tables of data) registers `new RefreshListener()` — an inner class — with an application-wide `EventBus` that lives for the whole program. Users open and close many report screens; memory keeps growing. Explain and fix.

<details>
<summary>Answer</summary>

**Answer:** Each `RefreshListener` holds a hidden reference to its `ReportScreen`. The long-lived `EventBus` keeps every listener, so every closed screen and its data stay reachable.

**Fix:** unregister the listener when the screen closes (the main fix), and make the listener a static nested class holding only what it needs — or a weak reference to the screen — so even a missed unregister does not retain the whole screen.

</details>
