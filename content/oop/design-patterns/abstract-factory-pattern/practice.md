# Abstract Factory — Practice

### P1. Recognise the need

**Difficulty:** Easy · **Type:** MCQ

Which situation most clearly calls for Abstract Factory?

- A) Creating one `Logger` object
- B) Choosing between quick sort and merge sort at runtime
- C) Creating matching `Button`, `TextField` and `Dialog` objects for a selected theme
- D) Building a `Pizza` with many optional toppings

<details>
<summary>Answer</summary>

**Answer:** C

**Explanation:** Several products must belong to the same family. B is Strategy; D is Builder.

</details>

### P2. Extend with a family

**Difficulty:** Medium · **Type:** Coding

Add a `SingaporeComplianceKit` (GST 9%, invoice header "TAX INVOICE (SG GST)") to the lesson's design without editing existing classes.

<details>
<summary>Answer</summary>

```java
class SgGstCalculator implements TaxCalculator {
    public long taxPaise(long amountCents) {
        return amountCents * 9 / 100;
    }
}

class SgInvoiceFormatter implements InvoiceFormatter {
    public String format(String customer, long amountCents, long taxCents) {
        return "TAX INVOICE (SG GST) | " + customer + " | SGD " + amountCents / 100 + " | GST SGD " + taxCents / 100;
    }
}

class SingaporeComplianceKit implements ComplianceKit {
    public TaxCalculator taxCalculator() {
        return new SgGstCalculator();
    }

    public InvoiceFormatter invoiceFormatter() {
        return new SgInvoiceFormatter();
    }
}
```

**Explanation:** A new family is purely additive; `InvoiceService` is unchanged. (The 9% rate is for illustration; check current rates in real systems.)

</details>

### P3. Product or family?

**Difficulty:** Hard · **Type:** Scenario

Product management asks to add an e-invoice QR code generator to every country's compliance kit. What changes, and what does this reveal about the pattern?

<details>
<summary>Answer</summary>

**Answer:** Add `QrCodeGenerator qrCodeGenerator()` to `ComplianceKit`, a new abstract product, and an implementation in **every** concrete kit (or a default method returning a "not required" generator where a country has no QR mandate).

**What it reveals:** Abstract Factory is open for new families but closed for new product kinds — each new kind touches all families. If product kinds change often, consider injecting products separately or a registry per product type.

</details>
