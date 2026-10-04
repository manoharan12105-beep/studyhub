# Introduction to Design Patterns — Interview Questions

## Conceptual

### Q1. What is a design pattern?

<details>
<summary>Answer</summary>

A general, reusable solution to a commonly occurring design problem in a given context — a description of classes, objects, their roles and relationships, not finished code. Patterns give developers a shared vocabulary and capture known trade-offs. The best-known catalogue is the Gang of Four's 23 patterns.

</details>

### Q2. What are the three categories of GoF design patterns?

<details>
<summary>Answer</summary>

Creational patterns deal with object creation (Singleton, Factory Method, Abstract Factory, Builder, Prototype). Structural patterns deal with composing classes and objects into larger structures (Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy). Behavioral patterns deal with communication and responsibility between objects (Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor).

</details>

### Q3. Why use design patterns?

<details>
<summary>Answer</summary>

They provide tested solutions to recurring problems, make designs easier to communicate ("this is an adapter"), encourage flexible structures that follow principles like programming to interfaces and composition over inheritance, and make existing frameworks easier to understand because they use the same patterns.

</details>

### Q4. Can design patterns be harmful?

<details>
<summary>Answer</summary>

Yes, when applied without the problem they solve. Each pattern adds classes and indirection; using a factory for one product, a strategy with one algorithm, or a singleton for convenience adds complexity, hides dependencies or creates global state. Patterns are tools: introduce them when the problem appears, often by refactoring.

</details>

### Q5. Which design patterns have you seen in the Java standard library?

<details>
<summary>Answer</summary>

Iterator (`Iterator`/`Iterable`), Decorator (`BufferedInputStream` wrapping an `InputStream`, `Collections.unmodifiableList`), Strategy (`Comparator`), Factory methods (`List.of`, `Calendar.getInstance`, `NumberFormat.getInstance`), Builder (`StringBuilder`, `HttpRequest.newBuilder()`), Adapter (`Arrays.asList`, `InputStreamReader` adapting bytes to characters), Proxy (`java.lang.reflect.Proxy`), Template Method (`AbstractList` implementing most of `List` around `get` and `size`), Observer-style listeners in UI toolkits, and Flyweight-like caching in `Integer.valueOf`.

</details>
