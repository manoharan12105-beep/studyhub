# Abstraction — Practice

### P1. Legal declarations

**Difficulty:** Easy · **Type:** MCQ

Which declaration compiles?

- A) `abstract final class Shape { }`
- B) `abstract class Shape { abstract void draw() { } }`
- C) `abstract class Shape { private abstract void draw(); }`
- D) `abstract class Shape { void draw() { } }`

<details>
<summary>Answer</summary>

**Answer:** D) `abstract class Shape { void draw() { } }`

**Explanation:** An abstract class may contain only concrete methods. A is contradictory, B gives an abstract method a body, C makes an abstract method private.

</details>

### P2. Must the subclass be abstract?

**Difficulty:** Easy · **Type:** Code analysis

```java
abstract class Appliance {
    abstract void turnOn();
    abstract void turnOff();
}

class Fan extends Appliance {
    @Override
    void turnOn() { }
}
```

Does this compile? If not, give two fixes.

<details>
<summary>Answer</summary>

**Answer:** No. `Fan` is concrete but does not implement `turnOff()`.

**Fixes:** implement `turnOff()` in `Fan`, or declare `Fan` as `abstract` (and implement `turnOff()` in a further subclass).

</details>

### P3. Constructor order with an abstract parent

**Difficulty:** Medium · **Type:** Output-based

```java
abstract class Notification {
    Notification() {
        System.out.println("Notification created");
    }

    abstract void send();
}

class EmailNotification extends Notification {
    EmailNotification() {
        System.out.println("Email created");
    }

    @Override
    void send() {
        System.out.println("Email sent");
    }
}

public class AbstractOrder {
    public static void main(String[] args) {
        Notification n = new EmailNotification();
        n.send();
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
Notification created
Email created
Email sent
```

**Explanation:** The abstract class's constructor runs first through the implicit `super()`.

</details>

### P4. Design an abstraction

**Difficulty:** Medium · **Type:** Design

An app generates reports as PDF and as Excel. Both need the same steps: load data, format a header, write rows, save. Only the header formatting and row writing differ. Design the classes.

<details>
<summary>Hint</summary>

Which steps are fixed and which vary? Where should the fixed order live?

</details>

<details>
<summary>Answer</summary>

**Answer:** An abstract class `ReportGenerator` with a `final generate()` method that calls `loadData()`, `writeHeader()`, `writeRows(data)` and `save()` in order. `writeHeader` and `writeRows` are `protected abstract`; `loadData` and `save` are shared concrete methods. `PdfReportGenerator` and `ExcelReportGenerator` implement the two abstract steps.

**Why:** the order of steps is written once and cannot be broken by subclasses (template method), while each format supplies only what differs. If formats later need to vary along another dimension (where to save), that part can be composed in as a separate interface rather than more subclasses.

</details>
