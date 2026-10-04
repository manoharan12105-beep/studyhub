# Abstract Factory

**Category:** Creational · **Interview priority:** Core

## Intent

Provide an interface for creating **families of related or dependent objects** without specifying their concrete classes, so that the objects a client uses always belong to the **same family**.

## The Problem

An invoicing service runs in several countries. For each country it needs a **set** of collaborating objects that must match each other:

- a `TaxCalculator` (India: GST; UAE: VAT),
- an `InvoiceFormatter` (India: shows GSTIN and HSN codes; UAE: shows TRN),
- a `CurrencyFormatter` (₹ vs AED).

Mixing them — an Indian GST calculator with a UAE invoice layout — would produce legally wrong invoices. New countries will be added.

## Why the Naive Solution Fails

```java
class InvoiceService {
    String issue(String country, long amount) {
        long tax;
        String layout;
        if (country.equals("IN")) {
            tax = amount * 18 / 100;
            layout = "GST INVOICE";
        } else if (country.equals("AE")) {
            tax = amount * 5 / 100;
            layout = "TAX INVOICE (VAT)";
        } else {
            throw new IllegalArgumentException(country);
        }
        return layout + " total=" + (amount + tax);
    }
}
```

- Country checks are repeated for every product (tax, layout, currency) and in every class that needs them.
- Nothing guarantees consistency: one `if` could be updated for a new country while another is forgotten.
- Every new country edits the service (OCP violation).

## The Pattern Idea

Create one **factory interface** with a creation method per product in the family. Each **concrete factory** creates the whole matching family. The client receives one factory and uses only abstract product interfaces, so it can never mix families.

## Structure

```text
            ┌─────────────────────────────┐
            │ «interface» ComplianceKit   │  ← abstract factory
            ├─────────────────────────────┤
            │ + taxCalculator()           │
            │ + invoiceFormatter()        │
            └───────▲───────────────▲─────┘
                    ┆               ┆
          IndiaComplianceKit    UaeComplianceKit      ← concrete factories
             │        │            │        │
             ▼        ▼            ▼        ▼
          GstTax  GstInvoiceFmt  VatTax  VatInvoiceFmt  ← concrete products

 «interface» TaxCalculator        «interface» InvoiceFormatter   ← abstract products
 Client (InvoiceService) ──uses──▶ ComplianceKit, TaxCalculator, InvoiceFormatter
```

| Participant | In the example |
|-------------|----------------|
| AbstractFactory | `ComplianceKit` |
| ConcreteFactory | `IndiaComplianceKit`, `UaeComplianceKit` |
| AbstractProduct | `TaxCalculator`, `InvoiceFormatter` |
| ConcreteProduct | `GstCalculator`, `GstInvoiceFormatter`, `VatCalculator`, `VatInvoiceFormatter` |
| Client | `InvoiceService` |

## Java Implementation

```java
public class AbstractFactoryDemo {

    // ---------- Abstract products ----------
    interface TaxCalculator {
        long taxPaise(long amountPaise);
    }

    interface InvoiceFormatter {
        String format(String customer, long amountPaise, long taxPaise);
    }

    // ---------- Abstract factory ----------
    interface ComplianceKit {
        TaxCalculator taxCalculator();
        InvoiceFormatter invoiceFormatter();
    }

    // ---------- India family ----------
    static class GstCalculator implements TaxCalculator {
        public long taxPaise(long amountPaise) {
            return amountPaise * 18 / 100;
        }
    }

    static class GstInvoiceFormatter implements InvoiceFormatter {
        public String format(String customer, long amountPaise, long taxPaise) {
            return "GST INVOICE | " + customer + " | taxable Rs " + amountPaise / 100
                    + " | GST Rs " + taxPaise / 100 + " | GSTIN 33ABCDE1234F1Z5";
        }
    }

    static class IndiaComplianceKit implements ComplianceKit {
        public TaxCalculator taxCalculator() {
            return new GstCalculator();
        }

        public InvoiceFormatter invoiceFormatter() {
            return new GstInvoiceFormatter();
        }
    }

    // ---------- UAE family ----------
    static class VatCalculator implements TaxCalculator {
        public long taxPaise(long amountFils) {
            return amountFils * 5 / 100;
        }
    }

    static class VatInvoiceFormatter implements InvoiceFormatter {
        public String format(String customer, long amountFils, long taxFils) {
            return "TAX INVOICE | " + customer + " | net AED " + amountFils / 100
                    + " | VAT AED " + taxFils / 100 + " | TRN 100234567800003";
        }
    }

    static class UaeComplianceKit implements ComplianceKit {
        public TaxCalculator taxCalculator() {
            return new VatCalculator();
        }

        public InvoiceFormatter invoiceFormatter() {
            return new VatInvoiceFormatter();
        }
    }

    // ---------- Client: knows only abstractions ----------
    static class InvoiceService {
        private final TaxCalculator tax;
        private final InvoiceFormatter formatter;

        InvoiceService(ComplianceKit kit) {           // one kit → a consistent family
            this.tax = kit.taxCalculator();
            this.formatter = kit.invoiceFormatter();
        }

        String issue(String customer, long amount) {
            return formatter.format(customer, amount, tax.taxPaise(amount));
        }
    }

    public static void main(String[] args) {
        System.out.println(new InvoiceService(new IndiaComplianceKit()).issue("Kaveri Traders", 1_000_000));
        System.out.println(new InvoiceService(new UaeComplianceKit()).issue("Gulf Spices LLC", 1_000_000));
    }
}
```

**Output:**

```text
GST INVOICE | Kaveri Traders | taxable Rs 10000 | GST Rs 1800 | GSTIN 33ABCDE1234F1Z5
TAX INVOICE | Gulf Spices LLC | net AED 10000 | VAT AED 500 | TRN 100234567800003
```

(The GSTIN and TRN are illustrative placeholders, not real registrations; actual tax rules are more detailed than one flat rate.)

Adding Singapore means writing a `SingaporeComplianceKit` and its products. `InvoiceService` does not change, and it cannot accidentally combine products from two countries.

## Execution Flow

1. At startup, configuration picks the concrete factory for the deployment's country (often the only `if`/map lookup left in the system).
2. The factory is passed (injected) into `InvoiceService`.
3. `InvoiceService` asks the factory for each product it needs and uses them through their interfaces.

## Real-World Examples

- UI toolkits with look-and-feel families (Swing's pluggable look-and-feel creates matching component UI delegates).
- `javax.xml.parsers.DocumentBuilderFactory` and `TransformerFactory` — obtain implementation families without naming vendor classes.
- Database access layers that create matching connection, statement and dialect objects per database vendor.
- Cloud SDK abstractions creating matching storage, queue and key-management clients per provider.

## When to Use

- The system must work with **one of several families** of related products, chosen by configuration or environment.
- Products of a family **must be used together** and mixing them would be a bug.
- You want to hide concrete product classes from client code.

## When Not to Use

- Only one family exists and no second is realistically planned (YAGNI).
- Products are independent — a separate factory or injection per product is simpler.
- The **set of product types** changes often: adding a new product to the family means changing the factory interface and **every** concrete factory.

## Advantages

- Guarantees consistent families.
- Clients depend only on abstract factories and products (DIP).
- Switching families is a one-line change where the factory is chosen.
- New families can be added without touching clients (OCP for families).

## Disadvantages

- Many interfaces and classes (products × families).
- Adding a new **kind of product** forces changes in all factories (closed for that axis).
- Can be over-engineering for small variations.

## Related Patterns

- Concrete factories are often implemented with **Factory Methods** and are frequently single instances (**Singleton**, or a single injected bean).
- **Builder** constructs one complex object step by step; Abstract Factory returns several related objects immediately.
- **Prototype** can implement a factory by cloning prototypical products.
- **Bridge** can use an abstract factory to create the right implementation side.

## SOLID Connection

- **DIP:** the client depends on `ComplianceKit` and product interfaces only.
- **OCP:** new families extend the system without modifying clients.
- **SRP:** the knowledge "which classes belong together" lives in the factory, not scattered across clients.

## Common Mistakes

- Using an abstract factory for a single product (that is just a factory).
- Letting clients bypass the factory with `new GstCalculator()`, reintroducing mixed families.
- Putting the country `if/else` inside every factory method instead of choosing a factory once.
- Ignoring the cost of adding a new product type to every family.

## Key Takeaways

- Abstract Factory = one interface creating a family of related products; one concrete factory per family.
- Clients use only abstractions, so families cannot be mixed.
- Easy to add families; hard to add product kinds.
- Choose the factory once (configuration/DI) and inject it.
