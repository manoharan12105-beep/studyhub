# UML Class Diagrams — Practice

### P1. Read the symbol

**Difficulty:** Easy · **Type:** MCQ

In a diagram, a dashed line with a hollow triangle points from `EmailSender` to `Notifier`. What does it mean?

- A) `EmailSender extends Notifier` (class inheritance)
- B) `EmailSender implements Notifier`
- C) `EmailSender` has a `Notifier` field
- D) `EmailSender` uses `Notifier` as a parameter

<details>
<summary>Answer</summary>

**Answer:** B

**Explanation:** Dashed + hollow triangle = realization (interface implementation).

</details>

### P2. Multiplicity

**Difficulty:** Easy · **Type:** Conceptual

Write the multiplicities for: a person has at most one passport, and a passport belongs to exactly one person; an author writes one or more books, and a book may have several authors.

<details>
<summary>Answer</summary>

**Answer:** `Person 1 ──── 0..1 Passport`; `Author 1..* ──── 1..* Book`.

**Explanation:** Read each end from the other class's point of view. The author–book relationship is many-to-many; it may later become an association class (for royalties or author order).

</details>

### P3. Diagram to code

**Difficulty:** Medium · **Type:** Coding

```text
 «interface» Shape { + area(): double }
 Circle ┄┄▷ Shape      Circle: - radius: double
 Drawing 1 ◆──── 0..* Shape
```

Write the Java skeleton.

<details>
<summary>Answer</summary>

```java
import java.util.ArrayList;
import java.util.List;

interface Shape {
    double area();
}

class Circle implements Shape {
    private final double radius;

    Circle(double radius) {
        this.radius = radius;
    }

    public double area() {
        return Math.PI * radius * radius;
    }
}

class Drawing {
    private final List<Shape> shapes = new ArrayList<>();   // composition: the drawing owns its shapes

    void addCircle(double radius) {
        shapes.add(new Circle(radius));
    }
}
```

**Explanation:** The realization becomes `implements`; composition is a private collection whose elements the drawing creates and does not share.

</details>

### P4. Fix the diagram

**Difficulty:** Medium · **Type:** Code analysis

A student drew `OrderLine ◆──── Order` (filled diamond next to `OrderLine`) and `Animal ───▷ Dog` (triangle at `Dog`). What is wrong?

<details>
<summary>Answer</summary>

**Answer:** The diamond belongs at the whole: `Order ◆──── OrderLine`. The triangle points to the parent: `Dog ───▷ Animal`.

</details>
