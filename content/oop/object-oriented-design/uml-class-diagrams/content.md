# UML Class Diagrams

## Definition

The **Unified Modeling Language (UML)** is a standard visual notation for describing software. For object-oriented design the most used parts are:

- **Class diagrams** — the static structure: classes, interfaces, their attributes and operations, and the relationships between them.
- **Object diagrams** — a snapshot of specific objects and their links at one moment.

This topic uses plain-text diagrams so they can be read without any tool. The relationship arrows are also given in **PlantUML** text syntax, a common way to write UML as text.

## Why It Matters

- Design interviews expect a quick class diagram before code: it shows entities, responsibilities and relationships at a glance.
- Reading UML correctly (which end the diamond goes on, what a dashed arrow means) avoids miscommunication in design reviews and documentation.
- The diagram maps directly to Java: every box, arrow and multiplicity has a code equivalent.

## The Class Box

```text
┌──────────────────────────────┐
│         BankAccount          │   ← name (italic or {abstract} if abstract;
├──────────────────────────────┤      «interface» above the name for interfaces)
│ - accountNumber: String      │   ← attributes:  visibility name: Type
│ - balance: long              │
│ - {static} count: int        │   ← static members are underlined in UML;
├──────────────────────────────┤      written {static} in plain text
│ + deposit(amount: long): void│   ← operations:  visibility name(params): ReturnType
│ + withdraw(amount: long)     │
│ # audit(): void              │
│ + balance(): long            │
└──────────────────────────────┘
```

### Visibility

| Symbol | Meaning | Java |
|--------|---------|------|
| `+` | public | `public` |
| `-` | private | `private` |
| `#` | protected | `protected` |
| `~` | package | no modifier |

Diagrams usually show only the attributes and operations relevant to the discussion — not every getter.

### Abstract classes and interfaces

```text
┌──────────────────────────────┐    ┌──────────────────────────────┐
│         «interface»          │    │       {abstract} Shape       │
│        PaymentMethod         │    ├──────────────────────────────┤
├──────────────────────────────┤    │ + area(): double {abstract}  │
│ + pay(amount: long): String  │    │ + describe(): String         │
└──────────────────────────────┘    └──────────────────────────────┘
```

## Relationships

| Relationship | Meaning | Plain-text notation | PlantUML | Java |
|--------------|---------|--------------------|----------|------|
| **Association** | A knows / uses B structurally | `A ───── B` | `A -- B` | field of type B |
| **Directed association** | Only A navigates to B | `A ─────▶ B` | `A --> B` | field in A only |
| **Aggregation** | Whole has parts with independent lifecycle | `Whole ◇──── Part` | `Whole o-- Part` | field; parts passed in, may be shared |
| **Composition** | Whole owns parts; parts live and die with it | `Whole ◆──── Part` | `Whole *-- Part` | field; parts created and owned by the whole |
| **Generalization (inheritance)** | Subclass IS-A superclass | `Child ─────▷ Parent` | `Parent <\|-- Child` | `extends` |
| **Realization** | Class implements interface | `Impl - - - ▷ Interface` | `Interface <\|.. Impl` | `implements` |
| **Dependency** | A uses B temporarily | `A - - - -> B` | `A ..> B` | parameter, local variable, return type |

Rules that are often confused:

- The **diamond** sits at the **whole** (container) end, never at the part.
- The **hollow triangle** points to the **parent** / interface.
- **Dashed** lines mean weaker relationships: realization (with triangle) and dependency (with open arrow).

Concepts behind these relationships: [Association, Aggregation and Composition](../../relationships/object-relationships/content.md).

## Multiplicity

Multiplicity at each end of an association says how many objects take part.

| Notation | Meaning |
|----------|---------|
| `1` | Exactly one |
| `0..1` | Zero or one (optional) |
| `*` or `0..*` | Zero or more |
| `1..*` | One or more |
| `2..4` | Between two and four |

```text
 Customer 1 ────────── 0..* Order 1 ◆────────── 1..* OrderLine * ──────────▶ 1 Product
```

Read each end from the other side: "a customer has zero or more orders; an order belongs to exactly one customer; an order is composed of one or more lines; each line refers to exactly one product; a product may appear in many lines".

**Role names** label an end: `Employee "manager" 1 ──── 0..* "reports" Employee` (a self-association).

## A Complete Example: Library

```text
                 ┌─────────────────────────────────┐
                 │           «interface»           │
                 │           FinePolicy            │
                 ├─────────────────────────────────┤
                 │ + fineFor(daysLate: int): long  │
                 └────────────────▲────────────────┘
                                  ┆ (realization)
                   ┌──────────────┴──────────────┐
            StandardFinePolicy            StudentFinePolicy

 ┌────────────┐ 1      0..* ┌───────────────────────┐ 0..*    1 ┌─────────────┐
 │  Member    │─────────────│         Loan          │──────────▶│  BookCopy   │
 ├────────────┤             ├───────────────────────┤           ├─────────────┤
 │ - id       │             │ - issuedOn: Date      │           │ - barcode   │
 │ - name     │             │ - dueOn: Date         │           └──────┬──────┘
 └────────────┘             │ - returnedOn: Date    │                  │ *
                            ├───────────────────────┤                  │
                            │ + isOverdue(today)    │                1 ◆ (composition)
                            │ + fine(today, policy) │           ┌─────────────┐
                            └───────────┬───────────┘           │    Book     │
                                        ┆ uses (dependency)     ├─────────────┤
                                        └ - - - -> FinePolicy   │ - isbn      │
                                                                │ - title     │
                                                                └─────────────┘
```

Equivalent PlantUML text:

```text
interface FinePolicy {
  +fineFor(daysLate: int): long
}
class StandardFinePolicy
class StudentFinePolicy
FinePolicy <|.. StandardFinePolicy
FinePolicy <|.. StudentFinePolicy
Member "1" -- "0..*" Loan
Loan "0..*" --> "1" BookCopy
Book "1" *-- "*" BookCopy
Loan ..> FinePolicy
```

Reading it: a member has any number of loans; each loan is for exactly one book copy; a book (title/ISBN) is composed of its physical copies; a loan computes its fine using a `FinePolicy` passed in (dependency); two policies implement the interface.

## From Diagram to Java

```java
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

interface FinePolicy {                                   // «interface»
    long fineFor(int daysLate);
}

class StandardFinePolicy implements FinePolicy {         // realization
    public long fineFor(int daysLate) {
        return daysLate * 200L;
    }
}

class Book {
    private final String isbn;
    private final String title;
    private final List<BookCopy> copies = new ArrayList<>();   // composition: Book creates its copies

    Book(String isbn, String title) {
        this.isbn = isbn;
        this.title = title;
    }

    BookCopy addCopy(String barcode) {
        BookCopy copy = new BookCopy(barcode, this);
        copies.add(copy);
        return copy;
    }
}

class BookCopy {
    private final String barcode;
    private final Book book;

    BookCopy(String barcode, Book book) {
        this.barcode = barcode;
        this.book = book;
    }
}

class Member {
    private final String id;
    private final List<Loan> loans = new ArrayList<>();       // association 1 → 0..*

    Member(String id) {
        this.id = id;
    }
}

class Loan {
    private final BookCopy copy;                              // directed association → 1
    private final LocalDate dueOn;

    Loan(BookCopy copy, LocalDate dueOn) {
        this.copy = copy;
        this.dueOn = dueOn;
    }

    long fine(LocalDate today, FinePolicy policy) {           // dependency: parameter only
        long daysLate = ChronoUnit.DAYS.between(dueOn, today);
        return daysLate > 0 ? policy.fineFor((int) daysLate) : 0;
    }
}
```

| UML element | Java |
|-------------|------|
| Class box | `class` with fields and methods |
| `«interface»` | `interface` |
| `{abstract}` | `abstract class` / `abstract` method |
| Attribute `- x: T` | `private T x;` |
| Association / aggregation / composition | A field (a collection for `*`) — the difference is who creates, shares and owns the objects |
| Generalization | `extends` |
| Realization | `implements` |
| Dependency | Parameter, local variable, return type, static call |
| Multiplicity `0..1` | A field that may be `null` (or `Optional` from a getter) |
| Multiplicity `*` | `List`, `Set` or `Map` |

## Object Diagrams

An **object diagram** shows concrete instances and links at a moment in time — useful for explaining an example scenario or a tricky state. Object names are written `name: Class` (underlined in UML) with actual values:

```text
 ┌───────────────────┐         ┌──────────────────────────┐        ┌──────────────────┐
 │ arun: Member      │─────────│ loan7: Loan              │───────▶│ copy3: BookCopy  │
 │ id = "M-12"       │         │ dueOn = 2026-02-10       │        │ barcode = "B-3"  │
 └───────────────────┘         └──────────────────────────┘        └────────┬─────────┘
                                                                            │
                                                                   ┌────────┴─────────┐
                                                                   │ algo: Book       │
                                                                   │ title = "Algorithms"│
                                                                   └──────────────────┘
```

## Drawing a Class Diagram in an Interview

1. Boxes for the main entities with 2–4 key attributes each.
2. The main operations (responsibilities), not every getter.
3. Relationships with multiplicities; diamonds only where ownership matters.
4. Interfaces for variation points, with realizations.
5. Keep it to one screen; add detail only when asked.

## Common Misconceptions

- **"The diamond goes at the part end."** It goes at the whole.
- **"Inheritance arrows point to the subclass."** The triangle points to the superclass.
- **"Every field must appear in the diagram."** Show what explains the design.
- **"Aggregation and composition look different in Java."** Both are fields; the difference is ownership and lifecycle.
- **"UML requires special software."** Plain text, a whiteboard or PlantUML text is enough.

## Key Takeaways

- Class box = name, attributes (`visibility name: Type`), operations (`visibility name(params): Return`).
- Visibility: `+` public, `-` private, `#` protected, `~` package.
- Relationships: association line/arrow, aggregation ◇ and composition ◆ at the whole, inheritance ▷ to the parent, realization dashed ▷ to the interface, dependency dashed arrow.
- Multiplicities `1`, `0..1`, `*`, `1..*` map to fields and collections.
- Object diagrams show instances and links for a specific scenario.
