# Visitor — Interview Questions

## Conceptual

### Q1. What is the Visitor pattern?

<details>
<summary>Answer</summary>

A behavioral pattern that separates operations from the classes of an object structure. Each element implements `accept(visitor)`, which calls the visitor's method for that element's type; each operation is a visitor class with one method per element type. New operations are added as new visitors without modifying element classes.

</details>

### Q2. What is double dispatch, and how does Visitor achieve it in Java?

<details>
<summary>Answer</summary>

Selecting behaviour based on the runtime types of two objects. Java dispatches dynamically only on the receiver. Visitor uses two calls: `element.accept(visitor)` dispatches on the element's runtime type; inside, `visitor.visitBook(this)` (or an overload chosen by the static type of `this`) dispatches on the visitor's runtime type. Together, the executed code depends on both types.

</details>

### Q3. What is the main drawback of Visitor?

<details>
<summary>Answer</summary>

Adding a new element type requires adding a method to the visitor interface and updating every visitor. Visitor makes adding operations easy and adding types hard — the opposite trade-off of ordinary polymorphism — so it suits only stable element hierarchies. It also adds boilerplate and can push elements to expose internal data.

</details>

### Q4. Where is Visitor used in the JDK?

<details>
<summary>Answer</summary>

`java.nio.file.FileVisitor` with `Files.walkFileTree`, and the `javax.lang.model` element and type visitors used in annotation processing. Compilers and code-analysis tools also traverse syntax trees with visitors.

</details>

### Q5. How do sealed classes and pattern matching relate to Visitor?

<details>
<summary>Answer</summary>

A sealed hierarchy lists all its subtypes, so an operation can be written as one exhaustive `switch` over them (pattern matching for `switch`, standard in Java 21), and the compiler reports missing cases — the same benefit as Visitor (operations outside the classes, compile-time completeness) with far less boilerplate.

</details>
