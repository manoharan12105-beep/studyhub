# Object Lifecycle and Memory — Practice

### P1. Where does each value live?

**Difficulty:** Easy · **Type:** Conceptual

```java
class Invoice {
    static int count;          // (a)
    double amount;             // (b)

    void print() {
        int copies = 2;        // (c)
        Invoice self = this;   // (d) the variable self
    }
}
```

Say whether (a)–(d) live on the stack, on the heap inside an object, or with the class.

<details>
<summary>Answer</summary>

**Answer:** (a) with the class (one copy); (b) on the heap inside each `Invoice` object; (c) in the stack frame of `print`; (d) the reference variable is in the stack frame; the object it points to is on the heap.

**Explanation:** Locals are per call, instance fields are per object, static fields are per class.

</details>

### P2. Eligible objects

**Difficulty:** Easy · **Type:** MCQ

```java
Box x = new Box();
Box y = new Box();
x = y;
```

How many objects are eligible for garbage collection after the last line?

- A) 0
- B) 1
- C) 2
- D) It depends on `System.gc()`

<details>
<summary>Answer</summary>

**Answer:** B) 1

**Explanation:** The first `Box` lost its only reference when `x` was reassigned. `System.gc()` affects *when* collection happens, not eligibility.

</details>

### P3. Leak hunt

**Difficulty:** Medium · **Type:** Code analysis

```java
import java.util.*;

class AuditLog {
    private static final List<String> ENTRIES = new ArrayList<>();

    static void record(String entry) {
        ENTRIES.add(entry);
    }
}
```

`record` is called on every request of a server that runs for months. What will happen and how would you fix it?

<details>
<summary>Answer</summary>

**Answer:** The static list is a GC root that only grows, so memory grows without limit until `OutOfMemoryError`.

**Fix:** Do not keep the log in memory — write entries to a file or logging framework; or keep a bounded structure (for example the last 1,000 entries in an `ArrayDeque`, removing the oldest when full).

</details>

### P4. Order of cleanup

**Difficulty:** Medium · **Type:** Output-based

```java
public class TwoResources {

    static class Resource implements AutoCloseable {
        private final String name;

        Resource(String name) {
            this.name = name;
            System.out.println("open " + name);
        }

        @Override
        public void close() {
            System.out.println("close " + name);
        }
    }

    public static void main(String[] args) {
        try (Resource file = new Resource("file"); Resource socket = new Resource("socket")) {
            System.out.println("working");
        }
    }
}
```

<details>
<summary>Hint</summary>

Resources are closed in the reverse order of opening.

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
open file
open socket
working
close socket
close file
```

**Explanation:** try-with-resources closes resources in reverse declaration order, like unwinding a stack, so a resource that depends on an earlier one is closed first.

</details>

### P5. Island of isolation

**Difficulty:** Hard · **Type:** Code analysis

```java
class Person {
    Person friend;
}

class Party {
    static Person host;

    static void plan() {
        Person a = new Person();
        Person b = new Person();
        Person c = new Person();
        a.friend = b;
        b.friend = a;
        c.friend = a;
        host = c;
    }
}
```

After `Party.plan()` returns, which `Person` objects are eligible for garbage collection?

<details>
<summary>Hint</summary>

Start from the GC roots that remain after the method returns. Locals are gone; static fields are not.

</details>

<details>
<summary>Answer</summary>

**Answer:** None.

**Explanation:** The static field `host` (a GC root) references `c`; `c.friend` references `a`; `a.friend` references `b`. Every object is reachable. If `host` were set to `null`, all three would be eligible — including the `a ⇄ b` cycle.

</details>
