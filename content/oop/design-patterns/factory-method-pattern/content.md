# Factory Method

**Category:** Creational · **Interview priority:** Core

## Intent

Define an interface (a method) for **creating an object**, but let **subclasses decide which class to instantiate**. The factory method lets a class defer instantiation to subclasses, so the class's own logic works with the product only through its interface.

## The Problem

A document-export module has a fixed workflow — prepare data, create a writer, write a header and rows, close — but the writer differs by format: CSV, PDF, Excel. The workflow is the same; only **which object gets created** changes. New formats will be added over time.

## Why the Naive Solution Fails

```java
class ReportExporter {
    String export(String format, java.util.List<String> rows) {
        ReportWriter writer;
        if (format.equals("CSV")) {
            writer = new CsvWriter();
        } else if (format.equals("HTML")) {
            writer = new HtmlWriter();
        } else {
            throw new IllegalArgumentException(format);
        }
        return writer.write(rows);
    }
}

interface ReportWriter {
    String write(java.util.List<String> rows);
}

class CsvWriter implements ReportWriter {
    public String write(java.util.List<String> rows) {
        return String.join(",", rows);
    }
}

class HtmlWriter implements ReportWriter {
    public String write(java.util.List<String> rows) {
        return "<ul>" + rows.size() + " rows</ul>";
    }
}
```

- `ReportExporter` depends on **every** concrete writer class.
- Each new format means editing `ReportExporter` (violates the Open/Closed Principle).
- The creation `if/else` tends to be copied wherever writers are needed.

## The Pattern Idea

Move the `new` into an **overridable method** — the **factory method** — declared by the class that uses the product. The class codes its workflow against the product **interface**; each subclass overrides the factory method to create its specific product.

## Structure

```text
        ┌───────────────────────────────┐                 ┌───────────────────┐
        │ Creator (abstract)            │ ── creates ──▶  │ «interface»       │
        ├───────────────────────────────┤                 │ Product           │
        │ + operation()  // uses product│                 └────────▲──────────┘
        │ # createProduct(): Product    │ ← factory method          ┆
        └──────────────▲────────────────┘                  ┌────────┴────────┐
                       │                             ConcreteProductA  ConcreteProductB
          ┌────────────┴─────────────┐
   ConcreteCreatorA            ConcreteCreatorB
   createProduct() → new A     createProduct() → new B
```

| Participant | In the example |
|-------------|----------------|
| Product | `ReportWriter` |
| ConcreteProduct | `CsvWriter`, `HtmlWriter` |
| Creator | `ReportExporter` — workflow + abstract `createWriter()` |
| ConcreteCreator | `CsvReportExporter`, `HtmlReportExporter` |

## Java Implementation

```java
import java.util.List;

public class FactoryMethodDemo {

    // Product
    interface ReportWriter {
        String header(String title);
        String row(String value);
        String footer();
    }

    // Concrete products
    static class CsvWriter implements ReportWriter {
        public String header(String title) {
            return "# " + title + "\n";
        }

        public String row(String value) {
            return value + "\n";
        }

        public String footer() {
            return "";
        }
    }

    static class HtmlWriter implements ReportWriter {
        public String header(String title) {
            return "<h1>" + title + "</h1><ul>";
        }

        public String row(String value) {
            return "<li>" + value + "</li>";
        }

        public String footer() {
            return "</ul>";
        }
    }

    // Creator: owns the workflow, defers creation to subclasses
    abstract static class ReportExporter {
        final String export(String title, List<String> rows) {
            ReportWriter writer = createWriter();            // the factory method call
            StringBuilder out = new StringBuilder(writer.header(title));
            for (String value : rows) {
                out.append(writer.row(value));
            }
            return out.append(writer.footer()).toString();
        }

        protected abstract ReportWriter createWriter();      // the factory method
    }

    // Concrete creators
    static class CsvReportExporter extends ReportExporter {
        @Override
        protected ReportWriter createWriter() {
            return new CsvWriter();
        }
    }

    static class HtmlReportExporter extends ReportExporter {
        @Override
        protected ReportWriter createWriter() {
            return new HtmlWriter();
        }
    }

    public static void main(String[] args) {
        List<String> rows = List.of("Chennai 120", "Madurai 85");
        ReportExporter[] exporters = { new CsvReportExporter(), new HtmlReportExporter() };
        for (ReportExporter exporter : exporters) {
            System.out.println(exporter.export("Sales", rows));
        }
    }
}
```

**Output:**

```text
# Sales
Chennai 120
Madurai 85

<h1>Sales</h1><ul><li>Chennai 120</li><li>Madurai 85</li></ul>
```

(The blank line comes from `println` after the CSV text, which already ends with a newline.)

Adding PDF means adding `PdfWriter` and `PdfReportExporter`; `ReportExporter.export` is never edited.

### Related variants you will hear about

**Simple Factory** (not a GoF pattern): one class or static method that centralises the `if/else`:

```java
final class WriterFactory {
    private WriterFactory() { }

    static ReportWriter forFormat(String format) {
        switch (format) {
            case "CSV": return new CsvWriter();
            case "HTML": return new HtmlWriter();
            default: throw new IllegalArgumentException("unknown format " + format);
        }
    }
}
```

It does not remove the conditional, but it puts it in **one** place so clients depend only on `ReportWriter`. A registry (`Map<String, Supplier<ReportWriter>>`) removes the conditional too.

**Static factory methods** (a naming convention, also not the GoF pattern): `List.of(...)`, `Integer.valueOf(...)`, `LocalDate.of(...)`, `Optional.empty()` — static methods used instead of constructors. They can have descriptive names, return cached instances or subtypes, and hide implementation classes.

| | Factory Method (GoF) | Simple Factory | Static factory method |
|--|----------------------|----------------|-----------------------|
| Creation decided by | Subclass overriding a method | A conditional in one factory | The class's own static method |
| Extensible without editing | Yes (new subclass) | No (edit the factory) unless registry-based | No |
| Typical use | Frameworks with customisable steps | Central creation by type key | Named constructors, caching (`valueOf`) |

## Execution Flow

1. Client calls `export(...)` on a `CsvReportExporter` (seen as `ReportExporter`).
2. `export` calls `createWriter()` — dynamically dispatched to `CsvReportExporter.createWriter()`, which returns a `CsvWriter`.
3. `export` uses the writer only through the `ReportWriter` interface.

## Real-World Examples

- `java.util.Collection.iterator()` — each collection class creates its own `Iterator` implementation; code using `iterator()` never knows which.
- `java.net.URLStreamHandler.openConnection(URL)` — handler subclasses decide which `URLConnection` to create.
- Frameworks with "create" hooks: a test framework's `createTestInstance()`, Spring's `AbstractBeanFactory#createBean` internals.
- Static factory methods everywhere: `Calendar.getInstance()`, `NumberFormat.getCurrencyInstance()`, `List.of`.

## When to Use

- A class has a reusable workflow but the **exact product** must vary by subclass/context.
- You are building a framework or library and want users to **plug in** their own product types.
- You want to keep creation logic out of client code and localise it.

## When Not to Use

- Only one product type exists and no variation is expected — call `new`.
- The variation does not justify a parallel creator hierarchy; a simple factory, a `Supplier<Product>` parameter, or dependency injection is lighter.

## Advantages

- Clients depend on the product interface, not concrete classes (DIP).
- New products are added without modifying the creator's workflow (OCP).
- Creation code lives in one place per variant (SRP).

## Disadvantages

- Adds a creator subclass per product (parallel hierarchies).
- Uses inheritance; composition alternatives (passing a `Supplier<ReportWriter>` into the exporter) are often simpler in modern Java.

## Related Patterns

- **Abstract Factory** often uses several factory methods, one per product in a family.
- **Template Method:** the creator's workflow is a template method; the factory method is one of its steps.
- **Prototype** creates products by copying instead of subclassing creators.
- **Builder** focuses on step-by-step construction of one complex object, not on choosing the class.

## SOLID Connection

- **OCP:** new product types without editing the creator.
- **DIP:** the creator's logic depends on the product abstraction.
- **SRP:** creation responsibility is separated from usage.

## Common Mistakes

- Calling a static method with a `switch` "Factory Method" in an interview without noting it is a simple factory — fine to use, but name it correctly.
- Returning concrete types from the factory method, which defeats the purpose.
- Putting the factory method in the product instead of the creator.
- Creating a factory for a single class "for flexibility" (YAGNI).

## Key Takeaways

- Factory Method: an overridable creation method; subclasses choose the concrete product.
- Clients and the creator's workflow use only the product interface.
- Simple factories and static factory methods are related idioms, not the same GoF pattern.
- In modern Java, passing a `Supplier` or injecting a factory is often a lighter alternative.
