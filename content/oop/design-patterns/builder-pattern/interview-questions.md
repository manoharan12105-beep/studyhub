# Builder — Interview Questions

## Conceptual

### Q1. What is the Builder pattern and what problem does it solve?

<details>
<summary>Answer</summary>

A creational pattern that constructs a complex object step by step through a separate builder object and produces the finished object in a final `build()` call. It solves the telescoping-constructor problem (many optional parameters, unreadable positional arguments) and the JavaBean problem (objects in an incomplete, mutable state while setters are called), allowing immutable products with central validation.

</details>

### Q2. How do you implement a builder in Java?

<details>
<summary>Answer</summary>

Give the product private final fields and a private constructor taking the builder. Add a static nested `Builder` class with the same fields (required ones in its constructor or a static entry method, optional ones with defaults), fluent methods that set a field and return `this`, and a `build()` method that validates and calls the product's constructor, copying any mutable collections.

</details>

### Q3. Builder vs constructor vs setters — when to choose which?

<details>
<summary>Answer</summary>

Constructor (or record): few, mostly required parameters of distinct types. Setters: mutable objects without cross-field invariants, such as simple DTOs. Builder: many parameters, especially optional ones or several of the same type, when the product should be immutable or needs validation across fields.

</details>

### Q4. Builder vs Abstract Factory?

<details>
<summary>Answer</summary>

Abstract Factory creates families of related objects, each in one call, hiding which concrete classes are used. Builder focuses on assembling one complex object step by step, controlling how it is configured and validated. A factory answers "which classes?"; a builder answers "how is this one object put together?".

</details>

### Q5. Name builders in the JDK.

<details>
<summary>Answer</summary>

`StringBuilder` (builds an immutable `String`), `HttpRequest.newBuilder()` in `java.net.http`, `Stream.builder()`, `Locale.Builder`, `Calendar.Builder`.

</details>

## Applied

### Q6. How do you make required fields mandatory in a fluent builder?

<details>
<summary>Answer</summary>

Pass them to the builder's constructor or to a static factory that creates the builder (`HttpCall.to(url)`), and validate in `build()` for anything that depends on other fields. For many required fields, a "step builder" with interfaces for each step can enforce order at compile time, but it is more complex and rarely needed.

</details>

### Q7. Your `Order` has 12 fields set through setters and sometimes reaches the database half-filled. How can Builder help?

<details>
<summary>Answer</summary>

Replace public setters with an `Order.Builder` that collects values and validates all invariants (customer present, at least one line, totals consistent) in `build()`. The `Order` constructor is private and fields are final, so no code can obtain an incomplete order. Persisting then always receives valid objects.

</details>
