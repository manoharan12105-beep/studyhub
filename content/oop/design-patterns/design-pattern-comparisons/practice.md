# Design Pattern Comparisons — Practice

### P1. Wrapper quiz

**Difficulty:** Easy · **Type:** MCQ

A class implements `ReportService`, holds another `ReportService`, and returns cached results for repeated requests before delegating. Which description fits best?

- A) Adapter — it changes the interface
- B) Facade — it simplifies a subsystem
- C) Decorator or caching proxy — same interface, wraps one object
- D) Composite — it holds children

<details>
<summary>Answer</summary>

**Answer:** C

**Explanation:** Same interface and one wrapped object; whether you call it a decorator (adds caching behaviour) or a caching proxy (controls access) depends on how it is used — explain the intent.

</details>

### P2. Name the pattern

**Difficulty:** Medium · **Type:** Scenario

Name one pattern for each and the deciding reason:

1. Tax calculation differs per country, chosen from configuration at startup.
2. A shipment's behaviour changes as it moves from BOOKED to IN_TRANSIT to DELIVERED.
3. A third-party maps SDK must be used through your `GeoService` interface.
4. Ten widgets on a form enable and disable each other.
5. Users can undo the last five edits to a timetable.

<details>
<summary>Answer</summary>

1. **Strategy** — interchangeable algorithms chosen by the client/configuration.
2. **State** — behaviour depends on lifecycle; states drive transitions.
3. **Adapter** — make an existing API match an interface you already defined.
4. **Mediator** — many-to-many interactions centralised.
5. **Command** (+ **Memento**) — operations as objects with undo history.

</details>

### P3. Defend a choice

**Difficulty:** Hard · **Type:** Design

A developer used Template Method for report generation: `ReportGenerator` with subclasses `PdfSalesReport`, `ExcelSalesReport`, `PdfStockReport`, `ExcelStockReport`, and now needs CSV output and an "Attendance" report. Critique the design and propose a better one.

<details>
<summary>Answer</summary>

**Critique:** two independent dimensions (report content × output format) are encoded in one inheritance hierarchy, so every new format or report multiplies subclasses: 3 reports × 3 formats = 9 classes.

**Better:** keep a template (or service) for the fixed workflow, but compose the two dimensions — a `ReportContent` strategy (sales, stock, attendance) and a `ReportFormatter` strategy (PDF, Excel, CSV). This is Strategy for each dimension, or Bridge if the report abstraction holds a formatter implementation. The result is 3 + 3 classes, combined at runtime.

</details>
