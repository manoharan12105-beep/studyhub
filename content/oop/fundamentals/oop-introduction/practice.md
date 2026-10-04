# Introduction to Object-Oriented Programming — Practice

### P1. Which of these is an object rather than a class?

**Difficulty:** Easy · **Type:** MCQ

- A) `Student`
- B) `new Student("Asha")`
- C) `String`
- D) `ArrayList`

<details>
<summary>Answer</summary>

**Answer:** B) `new Student("Asha")`

**Explanation:** `Student`, `String` and `ArrayList` are names of classes (blueprints). `new Student("Asha")` creates an instance at runtime.

</details>

### P2. State, behaviour or identity?

**Difficulty:** Easy · **Type:** Conceptual

For a `Car` object, classify each: (a) `speed = 60`, (b) `accelerate()`, (c) the fact that your car and your neighbour's identical car are different cars.

<details>
<summary>Answer</summary>

**Answer:** (a) state, (b) behaviour, (c) identity.

**Explanation:** Fields hold state, methods are behaviour, and identity distinguishes two objects even when every field is equal.

</details>

### P3. Match each pillar to the problem it addresses

**Difficulty:** Easy · **Type:** Conceptual

Pillars: encapsulation, abstraction, inheritance, polymorphism. Problems: (1) the same fields and methods copied into `Car`, `Bike` and `Bus`; (2) outside code setting `balance` to a negative value; (3) a long `if (type == ...)` chain deciding how to draw each shape; (4) callers depending on how a class stores its data internally.

<details>
<summary>Hint</summary>

Two pillars are about hiding, two about substituting one type for another.

</details>

<details>
<summary>Answer</summary>

**Answer:** (1) inheritance, (2) encapsulation, (3) polymorphism, (4) abstraction.

**Explanation:** Shared members belong in a superclass (or a shared component); private fields stop invalid writes; dynamic dispatch replaces type checks; a stable public interface hides internal representation.

</details>

### P4. Spot the procedural design

**Difficulty:** Medium · **Type:** Code analysis

```java
class Rectangle {
    public double width;
    public double height;
}

class GeometryUtils {
    static double area(Rectangle r) {
        return r.width * r.height;
    }

    static void resize(Rectangle r, double factor) {
        r.width = r.width * factor;
        r.height = r.height * factor;
    }
}
```

What makes this procedural even though it uses classes, and how would you make it object-oriented?

<details>
<summary>Hint</summary>

Who owns the data, and who owns the behaviour?

</details>

<details>
<summary>Answer</summary>

**Answer:** `Rectangle` is a data bag with public fields; all behaviour lives in a static utility that reaches into it. Nothing stops `r.width = -5`.

**Better design:** make the fields `private`, validate them in the constructor, and move `area()` and `resize(factor)` into `Rectangle` as instance methods that reject invalid values. The data and its rules then live together.

</details>

### P5. Identify classes from a requirement

**Difficulty:** Medium · **Type:** Design

"Customers place orders containing several products. Each order has a status (placed, shipped, delivered) and a total that includes tax." List the candidate classes and say which class should compute the total.

<details>
<summary>Hint</summary>

Underline the nouns. Then ask: which object has all the data the total needs?

</details>

<details>
<summary>Answer</summary>

**Answer:** `Customer`, `Order`, `OrderLine` (product + quantity), `Product`, and an `OrderStatus` enum. `Order` computes the total because it owns the lines; each `OrderLine` computes its own amount from its product's price and its quantity. Tax could be delegated to a `TaxPolicy` if rules vary by region.

**Explanation:** Responsibility follows data ownership. Putting the total in a separate `OrderCalculator` that reads every line's internals would pull logic away from the data.

</details>

### P6. True or false: "Java is not purely object-oriented because it supports inheritance only from one class."

**Difficulty:** Medium · **Type:** Conceptual

<details>
<summary>Answer</summary>

**Answer:** False.

**Explanation:** Single class inheritance has nothing to do with purity. Java is not purely object-oriented because primitive types are not objects and static members can be used without objects.

</details>
