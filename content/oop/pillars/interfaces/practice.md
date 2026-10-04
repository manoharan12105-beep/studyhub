# Interfaces — Practice

### P1. Implicit modifiers

**Difficulty:** Easy · **Type:** MCQ

In `interface Config { int TIMEOUT = 30; }`, what is `TIMEOUT`?

- A) An instance variable initialised to 30 in each implementing object
- B) A `public static final` constant
- C) A `private` field
- D) A compile-time error because interfaces cannot have fields

<details>
<summary>Answer</summary>

**Answer:** B) A `public static final` constant

**Explanation:** Every field declared in an interface is implicitly `public static final` and must be initialised.

</details>

### P2. Does it compile?

**Difficulty:** Easy · **Type:** Code analysis

```java
interface Shape {
    double area();
}

class Square implements Shape {
    private final double side = 2;

    double area() {
        return side * side;
    }
}
```

<details>
<summary>Answer</summary>

**Answer:** No. `Square.area()` is package-private, but it implements `Shape.area()`, which is implicitly `public`; an implementation cannot reduce visibility. Declare it `public double area()`.

</details>

### P3. Resolve the conflict

**Difficulty:** Medium · **Type:** Coding

```java
interface Printer {
    default String status() {
        return "printer ready";
    }
}

interface Scanner {
    default String status() {
        return "scanner ready";
    }
}

class OfficeMachine implements Printer, Scanner {
}
```

`OfficeMachine` does not compile. Fix it so `status()` returns `"printer ready; scanner ready"`.

<details>
<summary>Answer</summary>

```java
class OfficeMachine implements Printer, Scanner {
    @Override
    public String status() {
        return Printer.super.status() + "; " + Scanner.super.status();
    }
}
```

**Explanation:** Two unrelated defaults with the same signature force the class to override; `X.super.status()` selects each interface's version.

</details>

### P4. Static method access

**Difficulty:** Medium · **Type:** Output-based

```java
interface IdGenerator {
    String next();

    static IdGenerator prefixed(String prefix) {
        int[] counter = {0};
        return () -> prefix + (++counter[0]);
    }
}

public class StaticInterfaceMethod {
    public static void main(String[] args) {
        IdGenerator orders = IdGenerator.prefixed("ORD-");
        IdGenerator invoices = IdGenerator.prefixed("INV-");
        System.out.println(orders.next() + " " + orders.next() + " " + invoices.next());
    }
}
```

<details>
<summary>Hint</summary>

Each call to `prefixed` creates its own counter array captured by its own lambda.

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
ORD-1 ORD-2 INV-1
```

**Explanation:** The static factory returns a lambda implementing the single abstract method `next()`. Each generator captures a separate one-element array, so the counters are independent. (A captured local variable must be effectively final; mutating an array element is allowed because the array reference does not change.)

</details>

### P5. Choose the abstraction

**Difficulty:** Medium · **Type:** Scenario

For each, choose an interface or an abstract class and justify: (a) "anything that can be exported to CSV"; (b) a family of bank accounts that all hold an account number, balance and transaction list, with shared deposit logic; (c) a pricing rule that should be writable as a lambda.

<details>
<summary>Answer</summary>

**Answer:** (a) Interface — a capability unrelated classes may have (`CsvExportable`). (b) Abstract class — shared state and shared code with constructors; possibly implementing an `Account` interface for callers. (c) Functional interface — one abstract method, so `rule = price -> price * 90 / 100` works.

</details>

### P6. Functional or not?

**Difficulty:** Hard · **Type:** Conceptual

Which of these are functional interfaces?

```java
interface A {
    void run();
    default void log() { }
}

interface B {
    void run();
    boolean equals(Object other);
}

interface C {
    void run();
    void stop();
}

interface D extends A {
    static void help() { }
}
```

<details>
<summary>Answer</summary>

**Answer:** A, B and D. C is not.

**Explanation:** A has one abstract method (the default does not count). B's `equals(Object)` matches a public `Object` method, so it does not count. C has two abstract methods. D inherits exactly one abstract method from A and adds only a static method.

</details>
