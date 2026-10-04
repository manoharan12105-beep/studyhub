# Inheritance — Practice

### P1. Identify the inheritance type

**Difficulty:** Easy · **Type:** MCQ

`class Animal {}`, `class Dog extends Animal {}`, `class Cat extends Animal {}`, `class Puppy extends Dog {}`. Which types of inheritance appear?

- A) Single only
- B) Hierarchical and multilevel
- C) Multiple and multilevel
- D) Hybrid with multiple inheritance

<details>
<summary>Answer</summary>

**Answer:** B) Hierarchical and multilevel

**Explanation:** `Dog` and `Cat` both extend `Animal` (hierarchical); `Puppy → Dog → Animal` is a chain (multilevel). No class has two parents.

</details>

### P2. Which line fails to compile?

**Difficulty:** Easy · **Type:** Code analysis

```java
class Account {
    private double balance;
    protected String owner;
}

class Savings extends Account {
    void show() {
        System.out.println(owner);       // line 1
        System.out.println(balance);     // line 2
    }
}
```

<details>
<summary>Answer</summary>

**Answer:** Line 2.

**Explanation:** `balance` is private to `Account` and therefore not inherited by name. `owner` is protected and accessible in the subclass.

</details>

### P3. super in a chain

**Difficulty:** Medium · **Type:** Output-based

```java
class Base {
    String greet() {
        return "Base";
    }
}

class Middle extends Base {
    @Override
    String greet() {
        return "Middle>" + super.greet();
    }
}

class Leaf extends Middle {
    @Override
    String greet() {
        return "Leaf>" + super.greet();
    }
}

public class SuperChain {
    public static void main(String[] args) {
        Base b = new Leaf();
        System.out.println(b.greet());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
Leaf>Middle>Base
```

**Explanation:** Dynamic dispatch selects `Leaf.greet()`. Each `super.greet()` calls the version one level up, so the calls chain to the top.

</details>

### P4. Fields vs methods

**Difficulty:** Medium · **Type:** Output-based

```java
class Shape {
    String name = "shape";

    String name() {
        return name;
    }
}

class Circle extends Shape {
    String name = "circle";
}

public class FieldsVsMethods {
    public static void main(String[] args) {
        Circle c = new Circle();
        Shape s = c;
        System.out.println(c.name + " " + s.name + " " + c.name());
    }
}
```

<details>
<summary>Hint</summary>

`Circle` does not override `name()`. Which class's field does `Shape.name()` read?

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
circle shape shape
```

**Explanation:** `c.name` uses reference type `Circle`; `s.name` uses `Shape`. `name()` is inherited from `Shape`, and code inside `Shape` refers to `Shape`'s field — hidden fields are never dispatched dynamically.

</details>

### P5. Fragile base class

**Difficulty:** Hard · **Type:** Output-based

```java
import java.util.ArrayList;
import java.util.List;

class Library {
    protected final List<String> books = new ArrayList<>();

    void add(String title) {
        books.add(title);
    }

    void addTwice(String title) {
        add(title);
        add(title);
    }
}

class LoggingLibrary extends Library {
    int logged = 0;

    @Override
    void add(String title) {
        logged++;
        super.add(title);
    }

    @Override
    void addTwice(String title) {
        logged += 2;
        super.addTwice(title);
    }
}

public class FragilePractice {
    public static void main(String[] args) {
        LoggingLibrary lib = new LoggingLibrary();
        lib.addTwice("Thirukkural");
        lib.add("Ponniyin Selvan");
        System.out.println(lib.books.size() + " " + lib.logged);
    }
}
```

<details>
<summary>Hint</summary>

Follow the call from `super.addTwice` — which `add` does it call?

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
3 5
```

**Explanation:** `LoggingLibrary.addTwice` adds 2, then `Library.addTwice` calls `add` twice — dynamically dispatched to the override, which adds 1 each time (total 4). The final `add` adds 1 more: 5 logged for 3 books. The subclass silently depends on the base class calling `add` internally.

</details>

### P6. Redesign with composition

**Difficulty:** Hard · **Type:** Design

Rewrite `LoggingLibrary` from P5 so that it counts each book exactly once regardless of how `Library` implements `addTwice`.

<details>
<summary>Hint</summary>

Stop extending `Library`; hold one and forward to it.

</details>

<details>
<summary>Answer</summary>

```java
class LoggingLibraryV2 {
    private final Library library = new Library();
    private int logged = 0;

    void add(String title) {
        logged++;
        library.add(title);
    }

    void addTwice(String title) {
        logged += 2;
        library.addTwice(title);     // Library's internal calls go to Library.add, not to ours
    }

    int logged() {
        return logged;
    }
}
```

**Explanation:** With composition, `Library`'s internal self-calls stay inside `Library`, so `LoggingLibraryV2` depends only on the documented effect of each method. Ideally both classes would implement a shared interface so callers can use either.

</details>
