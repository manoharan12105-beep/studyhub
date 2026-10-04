# Factory Method — Practice

### P1. Identify the factory method

**Difficulty:** Easy · **Type:** MCQ

In `abstract class Game { void start() { Board b = createBoard(); b.setup(); } abstract Board createBoard(); }`, which element is the factory method?

- A) `start()`
- B) `createBoard()`
- C) `Board`
- D) `setup()`

<details>
<summary>Answer</summary>

**Answer:** B) `createBoard()`

**Explanation:** It is the overridable method that decides which `Board` is created; `start()` is the workflow that uses it.

</details>

### P2. Add a product

**Difficulty:** Medium · **Type:** Coding

Using the `ReportExporter` design from the lesson, add a Markdown export (rows as `- value` bullet points under a `# Title` heading) without modifying any existing class.

<details>
<summary>Answer</summary>

```java
class MarkdownWriter implements ReportWriter {
    public String header(String title) {
        return "# " + title + "\n";
    }

    public String row(String value) {
        return "- " + value + "\n";
    }

    public String footer() {
        return "";
    }
}

class MarkdownReportExporter extends ReportExporter {
    @Override
    protected ReportWriter createWriter() {
        return new MarkdownWriter();
    }
}
```

**Explanation:** One new product and one new creator; the export workflow is untouched — the Open/Closed Principle in action.

</details>

### P3. Choose the creation approach

**Difficulty:** Hard · **Type:** Scenario

A payment module must create a `PaymentProcessor` from a configuration value ("razorpay", "stripe", "mock"), chosen at application startup. Would you use GoF Factory Method, a simple factory, or dependency injection? Justify.

<details>
<summary>Answer</summary>

**Answer:** A simple factory or registry at startup (or DI configuration) — not GoF Factory Method.

**Why:** The choice depends on a runtime configuration value, not on which subclass of some creator you are in. A registry `Map<String, Supplier<PaymentProcessor>>` (or a DI container selecting a bean by property) creates the right processor once, and the rest of the code receives a `PaymentProcessor` through injection. The GoF Factory Method fits when a framework's base class defers product creation to subclasses.

</details>
