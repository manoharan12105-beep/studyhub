# Classes and Objects — Practice

### P1. How many objects are created?

**Difficulty:** Easy · **Type:** MCQ

```java
Student s1 = new Student();
Student s2 = s1;
Student s3 = new Student();
Student s4 = null;
```

- A) 1
- B) 2
- C) 3
- D) 4

<details>
<summary>Answer</summary>

**Answer:** B) 2

**Explanation:** Only `new` creates objects. `s2 = s1` copies a reference; `s4` is a reference to nothing. Four reference variables, two objects.

</details>

### P2. Default values

**Difficulty:** Easy · **Type:** Output-based

```java
public class Defaults {
    int count;
    boolean active;
    String name;
    double rate;

    public static void main(String[] args) {
        Defaults d = new Defaults();
        System.out.println(d.count + " " + d.active + " " + d.name + " " + d.rate);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
0 false null 0.0
```

**Explanation:** Instance fields get default values: `0`, `false`, `null`, `0.0`.

</details>

### P3. Mutation through a parameter

**Difficulty:** Easy · **Type:** Output-based

```java
public class RenameDemo {

    static class Person {
        String name;

        Person(String name) {
            this.name = name;
        }
    }

    static void rename(Person p) {
        p.name = "Meena";
        p = new Person("Karthik");
    }

    public static void main(String[] args) {
        Person person = new Person("Divya");
        rename(person);
        System.out.println(person.name);
    }
}
```

<details>
<summary>Hint</summary>

Separate "changing the object" from "changing which object the local variable points to".

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
Meena
```

**Explanation:** `p.name = "Meena"` mutates the caller's object. `p = new Person(...)` rebinds only the method's local copy of the reference.

</details>

### P4. The missing `this`

**Difficulty:** Medium · **Type:** Code analysis

```java
class Employee {
    private String name;

    Employee(String name) {
        name = name;
    }

    String getName() {
        return name;
    }
}
```

What does `new Employee("Arun").getName()` return, and why?

<details>
<summary>Answer</summary>

**Answer:** `null`.

**Explanation:** Inside the constructor, the parameter `name` shadows the field. `name = name` assigns the parameter to itself, so the field keeps its default `null`. Fix: `this.name = name;`.

</details>

### P5. Fluent methods with `this`

**Difficulty:** Medium · **Type:** Coding

Write a class `Message` with private fields `to` and `body` and methods `to(String)` and `body(String)` that return the current object, so that `new Message().to("ops").body("disk full")` works. Add `toString()` returning `to: body`.

<details>
<summary>Answer</summary>

```java
class Message {
    private String to;
    private String body;

    Message to(String to) {
        this.to = to;
        return this;
    }

    Message body(String body) {
        this.body = body;
        return this;
    }

    @Override
    public String toString() {
        return to + ": " + body;
    }
}
```

**Explanation:** Returning `this` lets each call continue on the same object, the idea behind builders and `StringBuilder.append`.

</details>

### P6. Arrays of objects

**Difficulty:** Hard · **Type:** Output-based

```java
public class ArrayOfObjects {

    static class Cell {
        int value;
    }

    public static void main(String[] args) {
        Cell[] cells = new Cell[3];
        System.out.println(cells[0]);
        Cell shared = new Cell();
        cells[0] = shared;
        cells[1] = shared;
        cells[1].value = 7;
        System.out.println(cells[0].value);
        System.out.println(cells[2].value);
    }
}
```

<details>
<summary>Hint</summary>

What does `new Cell[3]` actually create?

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
null
7
```

Then the program terminates with a `NullPointerException`.

**Explanation:** `new Cell[3]` creates one **array** object whose three elements are references defaulted to `null` — no `Cell` objects are created. `cells[0]` and `cells[1]` both refer to `shared`, so the write through `cells[1]` is seen through `cells[0]`. `cells[2]` is still `null`, so reading `.value` throws.

</details>
