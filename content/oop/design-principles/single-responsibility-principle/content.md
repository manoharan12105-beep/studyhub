# Single Responsibility Principle

## Definition

**The Single Responsibility Principle (SRP):** *a class should have one, and only one, reason to change.* A more precise reading: a class should be responsible to **one actor** — one group of people or one concern that requests changes to it. A "responsibility" is therefore a **reason to change**, not a single method.

## Why It Matters

When one class mixes several concerns, a change requested for one concern (say, the PDF layout) forces you to edit, re-test and redeploy code that also handles another (say, tax calculation). Mixed classes are larger, harder to understand, harder to test, and more likely to break something unrelated when edited. SRP keeps each change **local**.

## Bad Design

```java
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

class Invoice {
    private final String customer;
    private final List<long[]> lines = new ArrayList<>();      // {quantity, unitPricePaise}

    Invoice(String customer) {
        this.customer = customer;
    }

    void addLine(long quantity, long unitPricePaise) {
        lines.add(new long[] {quantity, unitPricePaise});
    }

    long totalWithGstPaise() {                                 // business rule: tax
        long subtotal = 0;
        for (long[] line : lines) {
            subtotal += line[0] * line[1];
        }
        return subtotal + subtotal * 18 / 100;
    }

    String toPrintableText() {                                 // presentation
        return "INVOICE for " + customer + "\nTotal: Rs " + totalWithGstPaise() / 100.0;
    }

    void saveToFile(String path) throws IOException {          // persistence
        try (FileWriter writer = new FileWriter(path)) {
            writer.write(toPrintableText());
        }
    }

    void emailTo(String address) {                             // delivery
        System.out.println("Connecting to SMTP server to send invoice to " + address);
    }
}
```

## Problem

`Invoice` has four reasons to change, each requested by a different party:

| Change request | Who asks | Code touched |
|----------------|----------|--------------|
| GST rate or rounding rules change | Finance | `totalWithGstPaise` |
| Invoice layout changes, or PDF is needed | Customers / design | `toPrintableText` |
| Invoices must be stored in a database | Operations | `saveToFile` |
| Use WhatsApp instead of email | Product | `emailTo` |

Consequences: every change risks breaking the others; testing the tax rule drags in file and SMTP code; two developers working on layout and storage edit the same file; reusing the tax calculation elsewhere is impossible without the I/O baggage.

## Refactored Design

Split by reason to change; keep a thin coordinator.

```text
 Invoice (data + tax rule)      InvoiceFormatter (layout)
 InvoiceRepository (storage)    InvoiceSender (delivery)
              ▲      ▲      ▲
              └── InvoiceService (coordinates the workflow)
```

## Java Example

```java
import java.util.ArrayList;
import java.util.List;

public class SingleResponsibilityDemo {

    // 1. Business data and rules only
    static class Invoice {
        private final String customer;
        private final List<long[]> lines = new ArrayList<>();

        Invoice(String customer) {
            this.customer = customer;
        }

        void addLine(long quantity, long unitPricePaise) {
            lines.add(new long[] {quantity, unitPricePaise});
        }

        long subtotalPaise() {
            long subtotal = 0;
            for (long[] line : lines) {
                subtotal += line[0] * line[1];
            }
            return subtotal;
        }

        long totalWithGstPaise() {
            return subtotalPaise() + subtotalPaise() * 18 / 100;
        }

        String customer() {
            return customer;
        }
    }

    // 2. Presentation only
    static class InvoiceFormatter {
        String asText(Invoice invoice) {
            return "INVOICE for " + invoice.customer() + " | Total: Rs " + invoice.totalWithGstPaise() / 100.0;
        }
    }

    // 3. Persistence only (an interface so storage can change)
    interface InvoiceRepository {
        void save(String document);
    }

    static class InMemoryInvoiceRepository implements InvoiceRepository {
        final List<String> saved = new ArrayList<>();

        public void save(String document) {
            saved.add(document);
        }
    }

    // 4. Delivery only
    interface InvoiceSender {
        void send(String document, String recipient);
    }

    static class ConsoleEmailSender implements InvoiceSender {
        public void send(String document, String recipient) {
            System.out.println("Emailing to " + recipient + ": " + document);
        }
    }

    // Coordinator: knows the workflow, delegates every step
    static class InvoiceService {
        private final InvoiceFormatter formatter;
        private final InvoiceRepository repository;
        private final InvoiceSender sender;

        InvoiceService(InvoiceFormatter formatter, InvoiceRepository repository, InvoiceSender sender) {
            this.formatter = formatter;
            this.repository = repository;
            this.sender = sender;
        }

        void issue(Invoice invoice, String recipient) {
            String document = formatter.asText(invoice);
            repository.save(document);
            sender.send(document, recipient);
        }
    }

    public static void main(String[] args) {
        Invoice invoice = new Invoice("Saravana Stores");
        invoice.addLine(2, 50_000);
        invoice.addLine(1, 20_000);

        InMemoryInvoiceRepository repository = new InMemoryInvoiceRepository();
        InvoiceService service = new InvoiceService(new InvoiceFormatter(), repository, new ConsoleEmailSender());
        service.issue(invoice, "accounts@example.com");
        System.out.println("Saved documents: " + repository.saved.size());
    }
}
```

**Output:**

```text
Emailing to accounts@example.com: INVOICE for Saravana Stores | Total: Rs 1416.0
Saved documents: 1
```

### Why it is better

- A GST change touches only `Invoice`; a layout change touches only `InvoiceFormatter`.
- `Invoice` can be unit-tested with no files or network.
- Storage and delivery can be swapped (database, WhatsApp) by adding implementations.
- Each class is small enough to understand at a glance.

## Real-World Interpretation

In a typical Spring Boot backend, SRP shows up as layers: a **controller** handles HTTP, a **service** holds business rules, a **repository** handles persistence, a **mapper** converts between entities and DTOs. Inside the domain, classes like `PriceCalculator`, `TaxPolicy`, `InvoiceNumberGenerator` each have one job.

Heuristics to detect several responsibilities:

- The class description needs "and": "calculates the total **and** emails it **and** stores it".
- Imports from unrelated areas (`java.sql`, `javax.mail`, PDF library) in one class.
- Different teams or stakeholders request changes to the same class.
- Methods group into clusters that use disjoint sets of fields (low cohesion — see [Coupling and Cohesion](../coupling-and-cohesion/content.md)).

## Benefits

- Changes are localised and less risky.
- Smaller, focused classes are easier to read, name and test.
- Responsibilities can be reused independently (the tax rule in a quote screen).
- Parallel work causes fewer merge conflicts.

## Misuse and Overengineering

- **Splitting to absurdity:** one class per method (`InvoiceTotalCalculator`, `InvoiceTotalRounder`, `InvoiceTotalFormatter`…) scatters one concept across many files. If two pieces always change together for the same reason, they belong together.
- **Anaemic results:** stripping all behaviour out of `Invoice` into "service" classes leaves a data bag — SRP does not mean "data in one class, logic in another". Business rules about an invoice's own data belong in `Invoice`.
- **Confusing SRP with "do one thing" for functions:** methods should do one thing; classes should have one reason to change. A class may have many methods serving one responsibility.

## Common Misconceptions

- **"One class, one method."** One reason to change, possibly many methods.
- **"SRP is about size."** A large class can have one responsibility; a small class can mix two.
- **"Every SRP split needs an interface."** Introduce interfaces where implementations vary or need faking (storage, delivery), not for every class.

## Key Takeaways

- SRP: one reason to change — one actor or concern per class.
- Detect violations by asking who requests changes and what the class depends on.
- Split by reason to change; keep a thin coordinator for the workflow.
- Do not over-split: things that change together for the same reason stay together.
