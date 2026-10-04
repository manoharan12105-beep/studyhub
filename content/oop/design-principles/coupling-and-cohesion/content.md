# Coupling and Cohesion

## Definition

- **Coupling** is the degree to which one module (class, package, service) depends on another. **Tight coupling** means a change in one forces changes in the other; **loose coupling** means they interact through small, stable interfaces and can change independently.
- **Cohesion** is the degree to which the elements **inside** a module belong together — work toward a single, well-defined purpose. **High cohesion** means everything in the class is about one thing; **low cohesion** means it is a grab bag.

The goal of object-oriented design is summed up as **low coupling, high cohesion**.

## Why It Matters

| | Tight coupling / low cohesion | Loose coupling / high cohesion |
|--|-------------------------------|--------------------------------|
| A change… | ripples across many classes | stays inside one class |
| Understanding a class… | requires reading its collaborators' internals | needs only its own code and its collaborators' interfaces |
| Testing… | needs many real collaborators | needs a few simple fakes |
| Reuse… | drags dependencies along | lifts out cleanly |

Every SOLID principle is, at heart, a rule for reducing coupling or increasing cohesion.

## Coupling

### Tight coupling

```java
class MySqlDatabase {
    String host = "localhost";                          // public state
    java.util.List<String> query(String sql) {
        return java.util.List.of("row1");
    }
}

class ReportGenerator {
    String generate() {
        MySqlDatabase db = new MySqlDatabase();          // creates a concrete dependency
        db.host = "reports-replica";                     // reaches into its internals
        return String.join(",", db.query("SELECT * FROM sales"));   // knows its query language
    }
}
```

`ReportGenerator` knows the concrete class, mutates its fields, and speaks SQL. Changing the database, its host configuration or its query API breaks the report.

### Kinds of coupling (strongest to weakest)

| Kind | Description | Example |
|------|-------------|---------|
| **Content** | One module modifies or relies on another's internals | Setting another object's public field; reflection into private state |
| **Common (global)** | Modules share global mutable data | A `static Map` used by everyone |
| **Control** | One module passes a flag telling another *how* to work | `process(order, true)` where `true` means "skip validation" |
| **Stamp** | Passing a whole object when only part is needed | `printLabel(customer)` that uses only the address |
| **Data** | Passing only the needed data through parameters | `printLabel(address)` |
| **Message** | Interaction only through method calls on an interface | `notifier.notify(event)` |

Aim for data and message coupling. Coupling is never zero — objects must collaborate — but it can be **narrow** (few, small dependencies) and **stable** (on abstractions that change rarely).

### How interfaces reduce coupling

Depending on an interface means depending only on **what** a collaborator does, not **who** it is or **how** it works:

```java
interface SalesDataSource {
    java.util.List<String> salesRows();
}

class ReportGenerator {
    private final SalesDataSource source;

    ReportGenerator(SalesDataSource source) {     // injected; any implementation works
        this.source = source;
    }

    String generate() {
        return String.join(",", source.salesRows());
    }
}
```

`ReportGenerator` now knows one method. The MySQL details, the replica host and the SQL live in a `MySqlSalesDataSource` implementation. This is the [Dependency Inversion Principle](../dependency-inversion-principle/content.md) in action.

### How composition affects coupling

- **Inheritance** couples a subclass to its superclass's implementation (protected fields, internal self-calls) — the tightest common coupling in OO code ([Fragile Base Class](../../pillars/inheritance/content.md#fragile-base-class-problem)).
- **Composition through an interface** couples only to the interface's contract, and the part can be replaced at runtime.
- **Composition with a concrete class created inside** (`new MySqlDatabase()`) still couples tightly; inject the part to loosen it.

### Other ways to lower coupling

- Hide data behind behaviour ([Encapsulation](../../pillars/encapsulation/content.md)); follow **Tell, Don't Ask** and the **Law of Demeter** ([Clean Code Principles](../../code-quality/clean-code-principles/content.md)).
- Pass only what is needed (data coupling over stamp coupling).
- Replace boolean control flags with separate methods or polymorphism.
- Use events ([Observer](../../design-patterns/observer-pattern/content.md)) or a [Mediator](../../design-patterns/mediator-pattern/content.md) when many objects would otherwise reference each other.

## Cohesion

### Low cohesion

```java
class Utils {
    static double gst(double amount) { return amount * 0.18; }
    static String toTitleCase(String s) { return s; }
    static boolean isValidPan(String pan) { return pan.length() == 10; }
    static void sendSlackAlert(String message) { }
}
```

Nothing in `Utils` relates to anything else. Every unrelated change lands in this file, everybody depends on it, and its name says nothing.

### Kinds of cohesion (weakest to strongest)

| Kind | Elements are together because… | Example |
|------|-------------------------------|---------|
| **Coincidental** | No reason | `Utils`, `Helper`, `Misc` |
| **Logical** | They are the same *kind* of thing | `AllValidators` validating unrelated entities |
| **Temporal** | They run at the same time | `StartupTasks` doing config, cache warm-up and email |
| **Procedural** | They run in a sequence | Steps of a workflow with unrelated data |
| **Communicational** | They work on the same data | Methods reading/writing one `Order` |
| **Sequential** | Output of one is input of the next | Parse → validate → transform a file |
| **Functional** | All contribute to one well-defined task | `PasswordHasher`, `TaxCalculator`, `Invoice` |

Aim for functional (or at least communicational) cohesion.

### Measuring cohesion informally

- Can you describe the class in one sentence **without "and"**?
- Do most methods use most fields? Groups of methods that each use a separate subset of fields suggest the class should split.
- Is the class named after a specific concept (`ShoppingCart`) rather than a vague role (`Manager`, `Processor`, `Utils`)?

## Why Loose Coupling and High Cohesion Go Together

Splitting a low-cohesion class along its responsibilities **raises cohesion** (each new class is focused) and, if the pieces talk through narrow interfaces, **keeps coupling low**. Merging unrelated responsibilities does the opposite: one class touches many collaborators (high coupling) and contains unrelated code (low cohesion). Good design moves related things together and unrelated things apart.

```text
 Low cohesion, high coupling           High cohesion, low coupling
 ┌───────────────────────┐             ┌─────────┐   ┌─────────┐
 │ OrderManager          │──▶ DB       │ Order   │   │ Pricing │
 │  pricing, tax, email, │──▶ SMTP     └────┬────┘   └────┬────┘
 │  storage, PDF         │──▶ PDF lib       │ interfaces  │
 └───────────────────────┘             ┌────▼────┐   ┌────▼────┐
                                       │ OrderRepo│  │ Notifier│
                                       └─────────┘   └─────────┘
```

## Refactoring Tightly Coupled Code: Example

```java
import java.util.ArrayList;
import java.util.List;

public class LooseCouplingDemo {

    // Abstractions the business code depends on
    interface StockChecker {
        boolean inStock(String sku, int quantity);
    }

    interface OrderEvents {
        void orderAccepted(String sku, int quantity);
    }

    // High cohesion: only order-acceptance rules
    static class OrderDesk {
        private final StockChecker stock;
        private final OrderEvents events;

        OrderDesk(StockChecker stock, OrderEvents events) {
            this.stock = stock;
            this.events = events;
        }

        boolean accept(String sku, int quantity) {
            if (quantity <= 0 || !stock.inStock(sku, quantity)) {
                return false;
            }
            events.orderAccepted(sku, quantity);
            return true;
        }
    }

    public static void main(String[] args) {
        List<String> log = new ArrayList<>();
        OrderDesk desk = new OrderDesk(
            (sku, qty) -> sku.startsWith("BOOK") && qty <= 5,         // any stock implementation
            (sku, qty) -> log.add(sku + " x" + qty)                    // any event handler
        );
        System.out.println(desk.accept("BOOK-1", 2));
        System.out.println(desk.accept("PEN-9", 1));
        System.out.println(desk.accept("BOOK-2", 9));
        System.out.println(log);
    }
}
```

**Output:**

```text
true
false
false
[BOOK-1 x2]
```

`OrderDesk` knows nothing about warehouses, databases or messaging; it knows two one-method interfaces. Each can be implemented, replaced or faked independently.

## Real-World Examples

- Microservices communicate through APIs and events instead of sharing databases — avoiding common coupling between services.
- Spring's layered applications keep controllers, services and repositories cohesive and connected through interfaces.
- `java.util.Collections`'s static helpers are cohesive around one concept (operations on collections), unlike a project-wide `Utils`.

## Common Misconceptions

- **"Loose coupling means no dependencies."** It means few, narrow, stable dependencies.
- **"Adding interfaces always reduces coupling."** An interface that mirrors a concrete class's every detail (or leaks its types) still couples tightly.
- **"High cohesion means small classes."** It means focused classes; size follows.
- **"Utility classes are fine as long as methods are static."** Static helpers grouped by nothing are coincidental cohesion; group helpers by concept.

## Key Takeaways

- Coupling = dependency between modules; cohesion = relatedness within a module. Aim for low coupling and high cohesion.
- Prefer data/message coupling via interfaces; avoid content, global and control coupling.
- Prefer functional cohesion; split classes whose methods use disjoint state or need "and" to describe.
- Interfaces, dependency injection, composition and encapsulation are the main tools.
- Every SOLID principle is a specific way to lower coupling or raise cohesion.
