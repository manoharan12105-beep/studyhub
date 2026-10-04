# Association, Aggregation and Composition

## Definition

Objects rarely work alone; they hold references to other objects. OOP names these relationships by **how strongly** the objects are tied:

- **Association:** a general "knows about / works with" relationship between two classes (a `Teacher` teaches `Student`s).
- **Aggregation:** a special association expressing **HAS-A with weak ownership** — the whole groups parts that can exist independently (a `Department` has `Professor`s; professors exist without the department).
- **Composition:** a special association expressing **HAS-A with strong ownership** — the parts belong to exactly one whole and their lifetime depends on it (an `Order` has `OrderLine`s; lines make no sense without their order).

```text
  Association  ⊃  Aggregation  ⊃  Composition
  "uses/knows"    "has, loosely"   "owns, exclusively"
```

## Why It Matters

- Choosing the relationship decides **who creates** the related objects, **who may share** them, **who deletes** them, and how changes ripple.
- It is the vocabulary of class diagrams and of design interviews: "Is this an aggregation or a composition?", "IS-A or HAS-A?"
- Composition is the alternative to inheritance for reuse — see [Composition over Inheritance](../composition-over-inheritance/content.md).

## Association

An **association** is any structural relationship where one object holds a reference to another to collaborate with it, without implying ownership. It is described by **multiplicity** and **navigability**.

### Multiplicity

| Kind | Meaning | Example | Java shape |
|------|---------|---------|------------|
| **One-to-one** | Each A relates to at most one B, and vice versa | `Person` — `Passport` | `private Passport passport;` |
| **One-to-many** | One A relates to many B; each B to one A | `Customer` — `Order` | `private final List<Order> orders;` in `Customer`, `private Customer customer;` in `Order` |
| **Many-to-many** | Many A relate to many B | `Student` — `Course` | Lists on both sides, or (better) an association class `Enrollment` |

A many-to-many relationship often carries its own data (enrolment date, grade). Then the relationship deserves its own class:

```text
 Student 1 ──── * Enrollment * ──── 1 Course
                 (date, grade)
```

### Navigability

**Navigability** says which side can reach the other.

- **Unidirectional:** `Order` has a `Customer` reference, but `Customer` keeps no list of orders. Simpler; only one side to maintain.
- **Bidirectional:** both sides hold references. Convenient for navigation, but **both sides must be kept consistent**, and it is easy to forget one.

```java
import java.util.ArrayList;
import java.util.List;

public class BidirectionalAssociation {

    static class Teacher {
        private final String name;
        private final List<Student> students = new ArrayList<>();

        Teacher(String name) {
            this.name = name;
        }

        void addStudent(Student student) {
            if (!students.contains(student)) {
                students.add(student);
                student.setTeacher(this);          // keep the other side in sync
            }
        }

        List<Student> students() {
            return List.copyOf(students);
        }

        String name() {
            return name;
        }
    }

    static class Student {
        private final String name;
        private Teacher teacher;

        Student(String name) {
            this.name = name;
        }

        void setTeacher(Teacher teacher) {
            if (this.teacher != teacher) {
                this.teacher = teacher;
                teacher.addStudent(this);          // the guard conditions stop infinite recursion
            }
        }

        Teacher teacher() {
            return teacher;
        }

        @Override
        public String toString() {
            return name;
        }
    }

    public static void main(String[] args) {
        Teacher meena = new Teacher("Meena");
        Student arjun = new Student("Arjun");
        Student kavya = new Student("Kavya");

        meena.addStudent(arjun);                    // set from the teacher side
        kavya.setTeacher(meena);                    // set from the student side

        System.out.println(meena.name() + " teaches " + meena.students());
        System.out.println("Kavya's teacher: " + kavya.teacher().name());
    }
}
```

**Output:**

```text
Meena teaches [Arjun, Kavya]
Kavya's teacher: Meena
```

(A full version would also remove the student from a previous teacher's list when the teacher changes.) Prefer **unidirectional** associations unless both directions are genuinely needed.

## Aggregation

**Aggregation** is a HAS-A relationship where the whole **does not own** the parts' lifetime:

- Parts are typically **created outside** and **passed in**.
- Parts may be **shared** by several wholes.
- Destroying (discarding) the whole does **not** destroy the parts.

Examples: `Department` – `Professor`, `Playlist` – `Song`, `Team` – `Player`, `Library` – `Member`.

```java
import java.util.ArrayList;
import java.util.List;

class Professor {
    private final String name;

    Professor(String name) {
        this.name = name;
    }

    String name() {
        return name;
    }
}

class Department {
    private final String title;
    private final List<Professor> faculty = new ArrayList<>();

    Department(String title) {
        this.title = title;
    }

    void addFaculty(Professor professor) {    // created elsewhere, only referenced here
        faculty.add(professor);
    }
}
```

The same `Professor` object can be added to a `Department` and to a `ResearchGroup`. If the department is closed, the professors still exist.

## Composition

**Composition** is a HAS-A relationship with **strong ownership**:

- The whole typically **creates** its parts (or takes exclusive ownership of them).
- A part belongs to **exactly one** whole at a time and is **not shared**.
- The part's lifetime is **bound** to the whole: when the whole is gone, the parts are gone (or meaningless).
- The whole usually does **not expose** its parts for outside modification.

Examples: `Order` – `OrderLine`, `House` – `Room`, `Car` – `Engine` (in a model where an engine is not tracked independently), `Document` – `Paragraph`.

```java
import java.util.ArrayList;
import java.util.List;

public class CompositionDemo {

    static class Order {
        private final String id;
        private final List<OrderLine> lines = new ArrayList<>();   // parts owned by the order

        Order(String id) {
            this.id = id;
        }

        void addLine(String product, int quantity, long unitPricePaise) {
            lines.add(new OrderLine(product, quantity, unitPricePaise));  // the whole creates its parts
        }

        long totalPaise() {
            long total = 0;
            for (OrderLine line : lines) {
                total += line.amountPaise();
            }
            return total;
        }

        int lineCount() {
            return lines.size();                   // the lines themselves are never handed out
        }

        // Part type: private, so no other class can create or hold an OrderLine
        private static final class OrderLine {
            private final String product;
            private final int quantity;
            private final long unitPricePaise;

            private OrderLine(String product, int quantity, long unitPricePaise) {
                this.product = product;
                this.quantity = quantity;
                this.unitPricePaise = unitPricePaise;
            }

            long amountPaise() {
                return quantity * unitPricePaise;
            }
        }
    }

    public static void main(String[] args) {
        Order order = new Order("ORD-7");
        order.addLine("Notebook", 3, 6_000);
        order.addLine("Pen", 10, 1_000);
        System.out.println(order.lineCount() + " lines, total " + order.totalPaise());
    }
}
```

**Output:**

```text
2 lines, total 28000
```

> [!NOTE]
> Java has garbage collection, so "the part dies with the whole" means: nothing else holds a reference to the part, so when the whole becomes unreachable, the parts become unreachable too. Java does not **enforce** composition — it is a design decision you implement by creating parts inside the whole, not sharing them, and not leaking references (defensive copies, private part types).

## Dependency

The weakest relationship: one class **uses** another temporarily — as a method parameter, a local variable or a return type — without storing a reference in a field.

```java
class InvoicePrinter {
    String print(Invoice invoice) {       // depends on Invoice only during this call
        return "Invoice " + invoice.number();
    }
}
```

UML draws dependency as a dashed arrow. Dependencies on concrete classes are what [Dependency Injection](../../design-principles/dependency-injection/content.md) and the [Dependency Inversion Principle](../../design-principles/dependency-inversion-principle/content.md) manage.

## UML Notation

```text
 Association      Teacher ────────────▶ Student        (arrow = navigable direction)
 Aggregation      Department ◇───────── Professor      (hollow diamond at the WHOLE)
 Composition      Order      ◆───────── OrderLine      (filled diamond at the WHOLE)
 Inheritance      Truck ──────────────▷ Vehicle        (hollow triangle at the PARENT)
 Realization      Upi   - - - - - - - ▷ PaymentMethod  (dashed line, hollow triangle)
 Dependency       Printer - - - - - - > Invoice        (dashed arrow)

 Multiplicity:    Customer 1 ──────── 0..* Order
```

More in [UML Class Diagrams](../../object-oriented-design/uml-class-diagrams/content.md).

## IS-A vs HAS-A

| | IS-A | HAS-A |
|--|------|-------|
| Relationship | Inheritance / interface implementation | Association (aggregation, composition) |
| Java | `extends`, `implements` | A field referencing another object |
| Test sentence | "A `Truck` **is a** `Vehicle`" | "A `Car` **has an** `Engine`" |
| Coupling | Strong (to the parent's implementation) | Weaker (to the part's public interface) |
| Can change at runtime | No — type is fixed | Yes — replace the part |
| Example | `ArrayList` IS-A `List` | `HashSet` HAS-A `HashMap` internally |

Wrong choices to recognise: `Car extends Engine` (a car is not an engine), `Stack extends ArrayList` (a stack is not a general list).

## Association vs Aggregation vs Composition

| Aspect | Association | Aggregation | Composition |
|--------|-------------|-------------|-------------|
| Meaning | Knows/uses | Has (weak) | Owns (strong) |
| Ownership | None | Whole groups parts, does not own them | Whole owns parts exclusively |
| Lifecycle | Independent | Independent | Part's lifetime bound to the whole |
| Sharing | Any | Part may belong to several wholes | Part belongs to one whole |
| Who creates the part | Anyone | Usually outside, passed in | Usually the whole |
| UML | Plain line/arrow | Hollow diamond ◇ | Filled diamond ◆ |
| Example | `Doctor` — `Patient` | `Team` — `Player` | `House` — `Room` |

### Deciding between aggregation and composition

Ask:

1. **If the whole is deleted, should the part be deleted too?** Yes → composition.
2. **Can the part belong to two wholes at once?** Yes → aggregation.
3. **Does the part have an identity of its own that the system tracks?** Yes → usually aggregation.

The answer depends on the **domain**, not on the nouns. In a car-rental system an `Engine` may be tracked separately (serial number, servicing) — aggregation. In a racing game, an engine is just part of a car — composition.

## Real-World Examples

- **E-commerce:** `Cart` ◆ `CartItem` (composition); `CartItem` → `Product` (association: products exist independently).
- **University:** `University` ◆ `Department` (composition: departments do not exist outside their university); `Department` ◇ `Professor` (aggregation).
- **Java collections:** `HashSet` is implemented by composition with a private `HashMap`.
- **Persistence (JPA):** "cascade delete" and "orphan removal" settings are how ORMs express composition semantics.

## Common Misconceptions

- **"Aggregation and composition are the same in Java code."** The syntax (a field) is the same; the difference is who creates, shares and outlives whom.
- **"Composition means the part is created with `new` inside the constructor."** That is common, but the defining property is exclusive ownership and bound lifetime.
- **"Bidirectional associations are always better."** They double the maintenance; use them only when both directions are needed.
- **"HAS-A always means composition."** HAS-A covers both aggregation and composition.
- **"Every relationship must be classified precisely."** In practice, the important decisions are ownership, sharing and lifecycle; the label follows from them.

## Key Takeaways

- Association = objects collaborate; described by multiplicity and navigability.
- Aggregation = weak HAS-A; independent parts, can be shared; hollow diamond.
- Composition = strong HAS-A; exclusive parts, bound lifetime; filled diamond.
- Dependency = temporary use (parameter, local); dashed arrow.
- IS-A uses `extends`/`implements`; HAS-A uses fields. Prefer HAS-A unless IS-A is genuinely true.
- Decide by lifecycle, sharing and identity in **your** domain.
