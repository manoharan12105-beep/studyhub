# SOLID Principles — Interview Questions

## Conceptual

### Q1. What are the SOLID principles? Explain each in one line.

<details>
<summary>Answer</summary>

- **Single Responsibility:** a class should have one reason to change (one responsibility, serving one group of stakeholders).
- **Open/Closed:** software entities should be open for extension but closed for modification — add behaviour by adding code, not editing working code.
- **Liskov Substitution:** objects of a subtype must be usable wherever the base type is expected without breaking correctness.
- **Interface Segregation:** clients should not be forced to depend on methods they do not use; prefer small, focused interfaces.
- **Dependency Inversion:** high-level modules should not depend on low-level modules; both should depend on abstractions.

</details>

### Q2. Why are SOLID principles important?

<details>
<summary>Answer</summary>

They control the cost of change. Following them keeps changes local (SRP), lets new features arrive as new classes (OCP), makes polymorphic substitution safe (LSP), keeps dependencies narrow (ISP) and isolates business logic from infrastructure (DIP). The results are code that is easier to understand, extend and unit test, with fewer ripple effects and regressions.

</details>

### Q3. How do the SOLID principles relate to each other?

<details>
<summary>Answer</summary>

They reinforce one another. SRP leads to small classes, which naturally have small interfaces (ISP). OCP is usually achieved through abstractions and polymorphism — which requires subtypes to follow LSP — and those abstractions are what DIP tells you to depend on. DIP plus ISP create the seams that make code testable.

</details>

### Q4. Can following SOLID be harmful?

<details>
<summary>Answer</summary>

Yes, when applied mechanically. Creating interfaces, factories and layers for variations that never happen adds indirection, makes navigation harder and slows development — overengineering. The principles are heuristics; apply them where change is real or likely, and refactor toward them when a second variation appears, balancing with KISS and YAGNI.

</details>

### Q5. Which design patterns support which SOLID principles?

<details>
<summary>Answer</summary>

Strategy, Decorator, Observer and Template Method support the Open/Closed Principle (extension through new classes); Factory Method and Abstract Factory support Dependency Inversion (callers depend on product interfaces) and separate creation responsibility (SRP); Adapter and Facade support ISP and DIP by giving clients a narrow interface of their own over a third-party or complex subsystem.

</details>

## Applied

### Q6. A `ReportService` loads data with JDBC, calculates totals, formats a PDF and emails it. Which principles does it violate, and how would you refactor it?

<details>
<summary>Answer</summary>

It violates SRP (four reasons to change: data source, business rules, format, delivery) and DIP (high-level reporting logic depends directly on JDBC, a PDF library and SMTP). Adding Excel output would also mean editing it (OCP).

Refactor: `ReportDataSource` (interface; JDBC implementation), `ReportCalculator` (pure business logic), `ReportFormatter` interface (`PdfFormatter`, later `ExcelFormatter`), `ReportDelivery` interface (`EmailDelivery`). `ReportService` orchestrates them and receives the interfaces through its constructor. Each part can now change and be tested independently.

</details>

### Q7. In a code review, how would you spot SOLID violations quickly?

<details>
<summary>Answer</summary>

- **SRP:** a class name with "And"/"Manager"/"Util" doing unrelated work, many imports from different layers, methods that change for different stakeholders.
- **OCP:** `switch`/`if-else` chains on a type code repeated in several places.
- **LSP:** overrides that throw `UnsupportedOperationException`, do nothing, or require callers to check the concrete type.
- **ISP:** implementations with empty or throwing methods for parts of an interface they do not need.
- **DIP:** `new` of infrastructure classes (repositories, HTTP clients) inside business logic, static calls to databases, business code importing framework or vendor packages.

</details>
