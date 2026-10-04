# Static Members — Practice

### P1. Which line does not compile?

**Difficulty:** Easy · **Type:** MCQ

```java
public class Counter {
    int count;
    static int total;

    static void report() {
        System.out.println(total);      // line A
        System.out.println(count);      // line B
    }

    void add() {
        count++;                        // line C
        total++;                        // line D
    }
}
```

- A) Line A
- B) Line B
- C) Line C
- D) Line D

<details>
<summary>Answer</summary>

**Answer:** B) Line B

**Explanation:** `report` is static and `count` is an instance field; there is no object to read it from. Instance methods (lines C and D) may use both kinds of members.

</details>

### P2. Shared or not?

**Difficulty:** Easy · **Type:** Output-based

```java
public class Scores {

    static int highest = 0;
    int score;

    Scores(int score) {
        this.score = score;
        if (score > highest) {
            highest = score;
        }
    }

    public static void main(String[] args) {
        Scores a = new Scores(40);
        Scores b = new Scores(75);
        Scores c = new Scores(60);
        System.out.println(a.score + " " + b.score + " " + c.score + " " + Scores.highest);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
40 75 60 75
```

**Explanation:** Each object has its own `score`; `highest` is shared and keeps the maximum seen so far.

</details>

### P3. Static through `null`

**Difficulty:** Medium · **Type:** Output-based

```java
public class NullStatic {

    static int value = 7;

    static int twice() {
        return value * 2;
    }

    public static void main(String[] args) {
        NullStatic n = null;
        System.out.println(n.value + " " + n.twice());
    }
}
```

<details>
<summary>Hint</summary>

How is a static member access bound?

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
7 14
```

**Explanation:** Static field and method accesses are resolved using the declared type `NullStatic`; the reference value is ignored, so no `NullPointerException` occurs.

</details>

### P4. Design review

**Difficulty:** Medium · **Type:** Scenario

A service stores the logged-in user in `public static User currentUser;` and many classes read and write it. A web server now handles many users at once. What goes wrong, and what would you do instead?

<details>
<summary>Answer</summary>

**Answer:** A static field is one value for the whole application, so concurrent requests overwrite each other's user — one customer could see another's data. It is also hard to test because every test shares it.

**Better design:** pass the user (or a request context object) explicitly to the code that needs it, or let the framework provide a per-request object. Keep `static` for constants and stateless helpers.

</details>

### P5. Hiding with a twist

**Difficulty:** Hard · **Type:** Output-based

```java
class Printer {
    static String type() {
        return "generic";
    }

    String describe() {
        return "Printer of type " + type();
    }
}

class LaserPrinter extends Printer {
    static String type() {
        return "laser";
    }
}

public class HidingTwist {
    public static void main(String[] args) {
        LaserPrinter laser = new LaserPrinter();
        System.out.println(laser.describe());
        System.out.println(LaserPrinter.type());
    }
}
```

<details>
<summary>Hint</summary>

Inside `Printer.describe()`, which class does the unqualified call `type()` refer to?

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
Printer of type generic
laser
```

**Explanation:** `describe()` is declared in `Printer`, so its call `type()` is compiled as `Printer.type()`. Static methods are never dispatched on the runtime object, so the hiding method in `LaserPrinter` is not used there. Had `type()` been an instance method overridden in `LaserPrinter`, the first line would say "laser".

</details>
