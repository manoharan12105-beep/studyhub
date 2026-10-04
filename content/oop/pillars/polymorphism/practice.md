# Polymorphism — Practice

### P1. Which decides what runs?

**Difficulty:** Easy · **Type:** MCQ

For `Shape s = new Square(); s.draw();` where `Square` overrides `draw()`, what decides which `draw()` runs?

- A) The reference type `Shape`
- B) The object type `Square`
- C) The order the classes were compiled
- D) Whichever `draw()` is declared first in the source

<details>
<summary>Answer</summary>

**Answer:** B) The object type `Square`

**Explanation:** Overridden instance methods are dispatched dynamically on the runtime class of the object.

</details>

### P2. Compile or not?

**Difficulty:** Easy · **Type:** Code analysis

```java
class Bird {
    void fly() { }
}

class Penguin extends Bird {
    void swim() { }
}

class Zoo {
    void run() {
        Bird b = new Penguin();
        b.fly();
        b.swim();
    }
}
```

Does `Zoo` compile?

<details>
<summary>Answer</summary>

**Answer:** No — `b.swim()` fails.

**Explanation:** The compiler checks members against the reference type `Bird`, which has no `swim()`. The runtime object being a `Penguin` does not matter at compile time. (Separately, a `Penguin` inheriting `fly()` hints at a design problem — see the Liskov Substitution Principle.)

</details>

### P3. Inherited method calling an override

**Difficulty:** Medium · **Type:** Output-based

```java
class Report {
    String title() {
        return "Report";
    }

    String render() {
        return "[" + title() + "]";
    }
}

class SalesReport extends Report {
    @Override
    String title() {
        return "Sales";
    }
}

public class RenderQuestion {
    public static void main(String[] args) {
        Report r = new SalesReport();
        System.out.println(r.render());
        System.out.println(new Report().render());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
[Sales]
[Report]
```

**Explanation:** `render()` is inherited, but `title()` inside it is a virtual call on `this`, which is a `SalesReport` in the first case.

</details>

### P4. Static, field and instance together

**Difficulty:** Medium · **Type:** Output-based

```java
class X {
    int n = 1;

    static String s() {
        return "X.s";
    }

    String i() {
        return "X.i";
    }
}

class Y extends X {
    int n = 2;

    static String s() {
        return "Y.s";
    }

    @Override
    String i() {
        return "Y.i";
    }
}

public class ThreeKinds {
    public static void main(String[] args) {
        X ref = new Y();
        System.out.println(ref.n + " " + ref.s() + " " + ref.i());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
1 X.s Y.i
```

**Explanation:** Field and static method bind to the reference type `X`; only the instance method dispatches to `Y`.

</details>

### P5. Overload chosen statically, override dynamically

**Difficulty:** Hard · **Type:** Output-based

```java
class Shape {
    String collide(Shape other) {
        return "Shape-Shape";
    }

    String collide(Circle other) {
        return "Shape-Circle";
    }
}

class Circle extends Shape {
    @Override
    String collide(Shape other) {
        return "Circle-Shape";
    }

    @Override
    String collide(Circle other) {
        return "Circle-Circle";
    }
}

public class CollideQuestion {
    public static void main(String[] args) {
        Shape s1 = new Circle();
        Shape s2 = new Circle();
        Circle c = new Circle();
        System.out.println(s1.collide(s2));
        System.out.println(s1.collide(c));
        System.out.println(new Shape().collide(c));
    }
}
```

<details>
<summary>Hint</summary>

Pick the signature from the argument's declared type first; then pick the class from the receiver's object type.

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
Circle-Shape
Circle-Circle
Shape-Circle
```

**Explanation:** `s2` is declared `Shape`, so `collide(Shape)` is chosen even though `s2` is a `Circle`; the receiver is a `Circle`, so `Circle.collide(Shape)` runs. `c` is declared `Circle`, so `collide(Circle)` is chosen. In the last call the receiver is a plain `Shape`.

</details>

### P6. Design with polymorphism

**Difficulty:** Medium · **Type:** Design

A notification module sends messages by email, SMS and push. Today the code has `switch (channel)` in three places (send, cost estimate, retry policy). Sketch a polymorphic design.

<details>
<summary>Answer</summary>

Define an interface `NotificationChannel` with `void send(Message m)`, `long costPaise(Message m)` and `int maxRetries()`. Implement `EmailChannel`, `SmsChannel` and `PushChannel`. The service holds the channels (for example a `Map<ChannelType, NotificationChannel>` or a list) and calls the interface methods.

**Why:** all three `switch` statements collapse into one class per channel. Adding WhatsApp adds one class; no existing `switch` must be found and edited.

</details>
