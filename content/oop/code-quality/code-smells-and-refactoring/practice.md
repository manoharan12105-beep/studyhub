# Code Smells and Refactoring — Practice

### P1. Name the smell

**Difficulty:** Easy · **Type:** MCQ

Every time the GST rate changes, developers edit `CartService`, `InvoicePrinter`, `QuoteController` and `RefundService`. Which smell is this?

- A) Divergent Change
- B) Shotgun Surgery
- C) Refused Bequest
- D) Long Parameter List

<details>
<summary>Answer</summary>

**Answer:** B) Shotgun Surgery

**Explanation:** One change touches many classes. Gather the tax rule in a single `TaxPolicy`.

</details>

### P2. Match smells to refactorings

**Difficulty:** Easy · **Type:** Conceptual

Match: (1) Data Clumps, (2) Feature Envy, (3) Refused Bequest, (4) Long Method — with (a) Move Method, (b) Extract Method, (c) Introduce Parameter Object, (d) Replace Inheritance with Delegation.

<details>
<summary>Answer</summary>

**Answer:** 1-c, 2-a, 3-d, 4-b.

</details>

### P3. Spot the smells

**Difficulty:** Medium · **Type:** Code analysis

```java
class ReportUtil {
    static String make(String n, String e, String p, String c, String s, boolean pdf, boolean mail) {
        String body = "Name: " + n + "\nEmail: " + e + "\nPhone: " + p + "\nCity: " + c + "\nState: " + s;
        if (pdf) {
            body = "<pdf>" + body + "</pdf>";
        }
        if (mail) {
            System.out.println("mailing to " + e);
        }
        return body;
    }
}
```

List at least four smells.

<details>
<summary>Answer</summary>

**Answer:**

1. Long Parameter List with Data Clumps (name/email/phone and city/state travel together → `Contact`, `Address`).
2. Primitive Obsession (email and phone as strings).
3. Boolean flag parameters (control coupling: format and delivery chosen by flags).
4. Low cohesion / Divergent Change: formatting, PDF conversion and mailing in one method of a `Util` class.
5. Meaningless names (`make`, `n`, `e`).

**Refactoring:** a `ContactReport` built from a `Contact` value object; a `ReportFormat` strategy (text/PDF); a separate `ReportMailer`.

</details>

### P4. Refactor the hierarchy

**Difficulty:** Hard · **Type:** Design

`class ReadOnlyFile extends File` overrides `write()` and `delete()` to throw. Several services iterate `List<File>` and call `write()`. Describe a step-by-step refactoring.

<details>
<summary>Answer</summary>

1. Introduce `interface ReadableFile { byte[] read(); String name(); }` and `interface WritableFile extends ReadableFile { void write(byte[] data); void delete(); }`.
2. Make `File` implement `WritableFile`.
3. Change `ReadOnlyFile` to stop extending `File`; implement `ReadableFile` by delegating to a wrapped `File` (Replace Inheritance with Delegation).
4. Change services that write to accept `List<WritableFile>`; services that only read accept `List<? extends ReadableFile>`.
5. Run tests after each step.

**Result:** the compiler prevents writing to read-only files instead of a runtime exception (fixing the Refused Bequest / LSP violation).

</details>
