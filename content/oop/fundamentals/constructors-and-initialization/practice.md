# Constructors and Initialization — Practice

### P1. Which of these declares a constructor of class `Book`?

**Difficulty:** Easy · **Type:** MCQ

- A) `void Book() { }`
- B) `public Book(String title) { }`
- C) `static Book() { }`
- D) `public Book Book() { return this; }`

<details>
<summary>Answer</summary>

**Answer:** B) `public Book(String title) { }`

**Explanation:** A constructor has no return type. A and D are methods named `Book`; C is invalid because constructors cannot be `static`.

</details>

### P2. Does it compile?

**Difficulty:** Easy · **Type:** Code analysis

```java
class Laptop {
    Laptop(String brand) { }
}

class Store {
    Laptop laptop = new Laptop();
}
```

<details>
<summary>Answer</summary>

**Answer:** No.

**Explanation:** Declaring `Laptop(String)` means the compiler does not add a default constructor, so `new Laptop()` has no matching constructor.

</details>

### P3. Order inside one class

**Difficulty:** Medium · **Type:** Output-based

```java
public class OrderInOneClass {

    private int x = log("field x");

    {
        log("instance block");
    }

    private int y = log("field y");

    OrderInOneClass() {
        log("constructor");
    }

    static int log(String message) {
        System.out.println(message);
        return 0;
    }

    public static void main(String[] args) {
        new OrderInOneClass();
    }
}
```

<details>
<summary>Hint</summary>

Field initialisers and instance blocks run together, in the order they appear in the source.

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
field x
instance block
field y
constructor
```

**Explanation:** After the implicit `super()`, instance field initialisers and instance blocks run in textual order, then the constructor body.

</details>

### P4. Three-level chain

**Difficulty:** Medium · **Type:** Output-based

```java
class Animal {
    Animal() {
        System.out.println("Animal");
    }
}

class Mammal extends Animal {
    Mammal() {
        System.out.println("Mammal");
    }
}

class Dog extends Mammal {
    Dog() {
        System.out.println("Dog");
    }
}

public class ThreeLevels {
    public static void main(String[] args) {
        new Dog();
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
Animal
Mammal
Dog
```

**Explanation:** Each constructor first calls its superclass constructor (implicit `super()`), so bodies complete from the top of the hierarchy down.

</details>

### P5. Half-built object

**Difficulty:** Hard · **Type:** Output-based

```java
class Shape {
    Shape() {
        System.out.println("area = " + area());
    }

    double area() {
        return 0;
    }
}

class Square extends Shape {
    private final double side;

    Square(double side) {
        this.side = side;
    }

    @Override
    double area() {
        return side * side;
    }
}

public class HalfBuilt {
    public static void main(String[] args) {
        Square s = new Square(3);
        System.out.println("later area = " + s.area());
    }
}
```

<details>
<summary>Hint</summary>

When does `this.side = side` run relative to `Shape()`?

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
area = 0.0
later area = 9.0
```

**Explanation:** `Shape()` runs first and calls `area()`, which dispatches to `Square.area()`. At that moment `side` still has its default `0.0` — even though it is `final`. After construction completes, `area()` returns 9.0.

</details>

### P6. Write the constructors

**Difficulty:** Medium · **Type:** Coding

Write a class `Rectangle` with private final `width` and `height`. Provide: `Rectangle(double width, double height)` that rejects non-positive values; `Rectangle(double side)` for squares; and a copy constructor. Write the validation only once.

<details>
<summary>Hint</summary>

Let the other constructors chain to the two-argument one with `this(...)`.

</details>

<details>
<summary>Answer</summary>

```java
class Rectangle {
    private final double width;
    private final double height;

    Rectangle(double width, double height) {
        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException("sides must be positive");
        }
        this.width = width;
        this.height = height;
    }

    Rectangle(double side) {
        this(side, side);
    }

    Rectangle(Rectangle other) {
        this(other.width, other.height);
    }
}
```

**Explanation:** Every path goes through the validating constructor, so no `Rectangle` can exist with invalid sides.

</details>
