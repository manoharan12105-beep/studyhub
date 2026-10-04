# Factory Method — Interview Questions

## Conceptual

### Q1. What is the Factory Method pattern?

<details>
<summary>Answer</summary>

A creational pattern where a class declares a method for creating an object (the factory method) and subclasses override it to decide which concrete class to instantiate. The class's other logic works with the product only through its interface. Example: `ReportExporter.export()` calls the abstract `createWriter()`; `CsvReportExporter` returns a `CsvWriter`.

</details>

### Q2. What problem does it solve?

<details>
<summary>Answer</summary>

It removes direct dependencies on concrete classes from code that uses objects, and it avoids `if/else` chains on type whenever an object is created. New product types can be added by adding classes rather than editing existing workflow code (Open/Closed Principle).

</details>

### Q3. What is the difference between Factory Method and a Simple Factory?

<details>
<summary>Answer</summary>

A Simple Factory is one class or static method containing the conditional that picks a concrete class — it centralises creation but must be edited for each new type. Factory Method (GoF) uses inheritance: creation is an overridable method, and each subclass decides the product, so new types are added through new subclasses. Simple factories are often perfectly adequate; the GoF version suits frameworks where users extend a base class.

</details>

### Q4. What are static factory methods and why use them instead of constructors?

<details>
<summary>Answer</summary>

Static methods that return instances, such as `Integer.valueOf`, `List.of`, `LocalDate.of`, `Optional.empty()`. Advantages: descriptive names (`fromCelsius`, `ofSeconds`), they can return cached instances, return a subtype or a hidden implementation class, and decide at runtime what to return. Downsides: classes without public constructors cannot be subclassed, and they are less discoverable than constructors. They are a creation idiom rather than the GoF Factory Method.

</details>

### Q5. Factory Method vs Abstract Factory?

<details>
<summary>Answer</summary>

Factory Method creates one product through an overridable method, using inheritance. Abstract Factory is an object with several creation methods that produce a **family** of related products that must be used together (for example a button, checkbox and dialog of the same theme), chosen by composition — the client receives a factory object. An abstract factory is often implemented with factory methods.

</details>

## Applied

### Q6. Where does the JDK use Factory Method?

<details>
<summary>Answer</summary>

`Collection.iterator()` is a factory method: `ArrayList`, `HashSet`, `ArrayDeque` each create their own iterator type, and code written against `Iterable` uses the `Iterator` interface. Static factory methods such as `Calendar.getInstance()` and `NumberFormat.getInstance()` choose implementation classes based on locale and settings.

</details>

### Q7. In modern Java, how could you get the same flexibility without subclassing the creator?

<details>
<summary>Answer</summary>

Pass the creation strategy in: `new ReportExporter(CsvWriter::new)` where the exporter holds a `Supplier<ReportWriter>`, or inject a `ReportWriterFactory` interface. This uses composition instead of inheritance, avoids a parallel creator hierarchy, and lets the product type be chosen at runtime or configured by a DI container.

</details>
