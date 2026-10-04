# Visitor

**Category:** Behavioral · **Interview priority:** Advanced / awareness

> [!NOTE]
> **Advanced topic.** Visitor is useful but rarely needed in everyday business code. Know the problem it solves (adding operations to a stable hierarchy), double dispatch, and its main drawback. Study [Polymorphism](../../pillars/polymorphism/content.md) and [Binding and Method Resolution](../../java-oop/binding-and-method-resolution/content.md) first.

## Intent

Represent an **operation to be performed on the elements of an object structure** as a separate object. Visitor lets you **define new operations without changing the classes** of the elements on which they operate.

## The Problem

A shop's cart contains different item types — `Book`, `Electronics`, `Grocery` — a **stable** set that rarely changes. But the business keeps adding **operations** over these items: GST calculation (different rate per type), shipping weight, export to the accounting format, a "festival discount eligibility" report.

## Why the Naive Solution Fails

- **Add a method to every item class for each operation** (`gst()`, `shippingWeight()`, `toAccountingCsv()`): item classes fill up with unrelated concerns (tax, logistics, accounting) and must be edited for every new operation.
- **`instanceof` chains in each operation:**

```java
long gst(Item item) {
    if (item instanceof Book) { /* 0% */ }
    else if (item instanceof Electronics) { /* 18% */ }
    else if (item instanceof Grocery) { /* 5% */ }
    // forgetting a type compiles fine and fails silently
}
```

## The Pattern Idea

Each element class gets **one** generic method, `accept(Visitor v)`, which calls back the visitor method **for its own type**: `v.visit(this)`. Each **operation** becomes a visitor class with one `visit` method per element type. Adding an operation means adding a visitor; element classes do not change.

### Double dispatch

Java chooses an overridden method by the runtime type of the **receiver** only (single dispatch). Visitor gets the operation to depend on **two** runtime types — the element and the visitor — in two steps:

1. `item.accept(visitor)` dispatches on the **element's** runtime type (the `Book` class's `accept` runs).
2. Inside, `Book.accept` calls `visitor.visitBook(this)`, which dispatches on the **visitor's** runtime type. (Many implementations name every method `visit` and rely on overloading instead: since `this` has the static type `Book` inside `Book`, the compiler selects `visit(Book)`.)

## Structure

```text
 «interface» CartItem (Element)              «interface» CartVisitor<R> (Visitor)
 + accept(CartVisitor<R>): R                 + visitBook(Book): R
      ▲          ▲            ▲              + visitElectronics(Electronics): R
    Book    Electronics    Grocery           + visitGrocery(Grocery): R
  accept(v) → v.visitBook(this)                    ▲                 ▲
                                            GstVisitor        WeightVisitor   (ConcreteVisitors = operations)
```

## Java Implementation

```java
import java.util.List;

public class VisitorDemo {

    interface CartVisitor<R> {
        R visitBook(Book book);
        R visitElectronics(Electronics item);
        R visitGrocery(Grocery item);
    }

    interface CartItem {
        <R> R accept(CartVisitor<R> visitor);
    }

    record Book(String title, long price, int grams) implements CartItem {
        public <R> R accept(CartVisitor<R> v) {
            return v.visitBook(this);
        }
    }

    record Electronics(String name, long price, int grams) implements CartItem {
        public <R> R accept(CartVisitor<R> v) {
            return v.visitElectronics(this);
        }
    }

    record Grocery(String name, long price, int grams, boolean perishable) implements CartItem {
        public <R> R accept(CartVisitor<R> v) {
            return v.visitGrocery(this);
        }
    }

    // Operation 1: GST (illustrative rates)
    static class GstVisitor implements CartVisitor<Long> {
        public Long visitBook(Book b) {
            return 0L;
        }

        public Long visitElectronics(Electronics e) {
            return e.price() * 18 / 100;
        }

        public Long visitGrocery(Grocery g) {
            return g.price() * 5 / 100;
        }
    }

    // Operation 2: shipping weight, with extra packaging for perishables
    static class ShippingWeightVisitor implements CartVisitor<Integer> {
        public Integer visitBook(Book b) {
            return b.grams();
        }

        public Integer visitElectronics(Electronics e) {
            return e.grams() + 300;                 // protective packaging
        }

        public Integer visitGrocery(Grocery g) {
            return g.perishable() ? g.grams() + 500 : g.grams();   // ice pack
        }
    }

    public static void main(String[] args) {
        List<CartItem> cart = List.of(
            new Book("Ponniyin Selvan", 900, 1200),
            new Electronics("Headphones", 2000, 250),
            new Grocery("Curd", 60, 500, true)
        );

        long gst = 0;
        int grams = 0;
        CartVisitor<Long> gstVisitor = new GstVisitor();
        CartVisitor<Integer> weightVisitor = new ShippingWeightVisitor();
        for (CartItem item : cart) {
            gst += item.accept(gstVisitor);          // double dispatch: item type, then visitor type
            grams += item.accept(weightVisitor);
        }
        System.out.println("GST: Rs " + gst);
        System.out.println("Shipping weight: " + grams + " g");
    }
}
```

**Output:**

```text
GST: Rs 363
Shipping weight: 2750 g
```

(GST: 0 + 360 + 3 = 363. Weight: 1200 + 550 + 1000 = 2750.) A new "accounting export" operation is one new visitor class; item classes are untouched.

### The trade-off

| Change | With Visitor | With methods on each element class |
|--------|--------------|------------------------------------|
| Add a new **operation** | Easy: one new visitor | Hard: edit every element class |
| Add a new **element type** | Hard: edit every visitor (and the interface) | Easy: one new class |

Choose Visitor only when the **element hierarchy is stable** and **operations change often**.

### Modern Java alternative

With a **sealed** interface (Java 17) and pattern matching for `switch` (Java 21), an operation can be written as one exhaustive `switch` over the permitted types; the compiler reports missing cases. This gives the same "add operations without touching elements" benefit with less boilerplate. See [Modern Java OOP Features](../../java-oop/modern-java-oop/content.md).

## Execution Flow

1. The client iterates the structure and calls `item.accept(visitor)`.
2. The element's `accept` calls the visitor method for its own type, passing itself.
3. The visitor performs the operation for that type and returns a result (or accumulates state).

## Real-World Examples

- `java.nio.file.FileVisitor` with `Files.walkFileTree(path, visitor)` — `visitFile`, `preVisitDirectory`, `postVisitDirectory`.
- `javax.lang.model.element.ElementVisitor` in annotation processing; compilers' abstract-syntax-tree visitors (type checking, code generation, optimisation passes).
- Document converters that walk a document tree (paragraph, table, image nodes) to render HTML, PDF or Markdown.

## When to Use

- The element hierarchy is stable, but many unrelated operations must be performed on it.
- You want to keep operations (tax, export, rendering) out of the element classes.
- Operations need to accumulate state while traversing a structure (often a Composite).

## When Not to Use

- Element types change frequently — every visitor must be updated.
- Only one or two operations exist — put them in the classes (polymorphism).
- Operations need private state of the elements — Visitor pushes elements to expose more data.

## Advantages

- New operations without modifying element classes (OCP along the operations axis).
- Related behaviour for one operation is gathered in one visitor (SRP).
- Visitors can accumulate results across a structure.

## Disadvantages

- Adding an element type breaks every visitor.
- Boilerplate (`accept` in every element, a method per type in every visitor).
- Can weaken encapsulation (elements expose data for visitors).
- Double dispatch is unfamiliar to many developers.

## Related Patterns

- **Composite:** visitors frequently traverse composite trees.
- **Interpreter:** operations over an expression tree are often visitors.
- **Iterator:** traverses elements; Visitor performs type-specific operations on them.

## SOLID Connection

- **OCP** for new operations (but closed in the other direction — adding element types).
- **SRP:** each operation lives in its own visitor.

## Common Mistakes

- Using Visitor when element types change often.
- Putting `instanceof` checks inside visitors, defeating double dispatch.
- Forgetting that `accept` must call the type-specific method with `this` (a generic `visit(CartItem)` loses the type).

## Key Takeaways

- Visitor puts operations in separate classes; elements implement `accept(visitor)` → `visitor.visitX(this)`.
- Double dispatch selects behaviour by both element type and visitor type.
- Easy to add operations, hard to add element types — use it only for stable hierarchies.
- Sealed types + `switch` patterns (Java 21) are a modern alternative.
