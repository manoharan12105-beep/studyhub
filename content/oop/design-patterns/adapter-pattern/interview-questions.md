# Adapter — Interview Questions

## Conceptual

### Q1. What is the Adapter pattern?

<details>
<summary>Answer</summary>

A structural pattern that lets classes with incompatible interfaces work together. An adapter implements the interface the client expects (the target) and translates each call into calls on an existing class (the adaptee). Example: an `AcmeSmsAdapter` implements your `SmsSender` interface by building the vendor's request object and mapping its status code back to a boolean.

</details>

### Q2. What is the difference between an object adapter and a class adapter?

<details>
<summary>Answer</summary>

An object adapter holds a reference to the adaptee and delegates (composition); it works with any adaptee instance, including final classes and subclasses. A class adapter extends the adaptee and implements the target (inheritance); in Java it works only for a non-final class, adapts one class, and exposes the adaptee's public methods. Object adapters are preferred.

</details>

### Q3. Adapter vs Facade?

<details>
<summary>Answer</summary>

Adapter makes an existing interface conform to another existing interface that clients already expect — usually one class adapted to one target. Facade creates a new, simpler interface over a complex subsystem of many classes to make it easier to use. Adapter is about compatibility; Facade is about simplification.

</details>

### Q4. Adapter vs Decorator?

<details>
<summary>Answer</summary>

Both wrap an object. An adapter changes the interface (the wrapper's interface differs from the wrapped object's). A decorator keeps the same interface and adds behaviour, so decorators can be stacked and used wherever the original is used.

</details>

### Q5. Give Java standard library examples of Adapter.

<details>
<summary>Answer</summary>

`InputStreamReader` (adapts `InputStream` bytes to a `Reader` of characters), `OutputStreamWriter`, `Arrays.asList` (adapts an array to `List`), and `Collections.enumeration` (adapts a `Collection` to the legacy `Enumeration` interface).

</details>

## Applied

### Q6. Your service calls three different courier APIs directly in many places. How would Adapter help?

<details>
<summary>Answer</summary>

Define a `CourierService` interface in your domain with the operations you need (`quote`, `book`, `track`) using your own types. Write one adapter per courier that translates to its API and maps its errors and statuses to yours. The rest of the code depends only on `CourierService`; adding or replacing a courier is a new adapter, and tests use a fake courier.

</details>
