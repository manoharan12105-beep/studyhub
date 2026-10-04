# Prototype — Interview Questions

## Conceptual

### Q1. What is the Prototype pattern?

<details>
<summary>Answer</summary>

A creational pattern in which new objects are created by copying an existing, configured instance through a copy operation, instead of instantiating a class and repeating its setup. Clients can copy objects they know only through an interface, often obtained from a registry of named prototypes.

</details>

### Q2. How does Prototype relate to `clone()` in Java?

<details>
<summary>Answer</summary>

`Object.clone()` with the `Cloneable` marker is Java's built-in copying mechanism and can implement Prototype, but it makes shallow copies by default, bypasses constructors, throws a checked exception and does not work well with `final` fields that need deep copies. Many developers implement Prototype with a `copy()` method backed by a copy constructor instead.

</details>

### Q3. What is the main risk when implementing Prototype?

<details>
<summary>Answer</summary>

Getting the copy depth wrong. A shallow copy shares mutable parts (lists, nested objects) between the prototype and its copies, so changing one copy silently changes others or the prototype itself. Each class must decide which parts to deep-copy and which can be safely shared (immutable values).

</details>

### Q4. When is Prototype preferable to a factory or builder?

<details>
<summary>Answer</summary>

When objects are expensive or tedious to configure and many similar ones are needed, when new variants should be added at runtime by registering configured instances rather than writing classes, or when code must duplicate objects known only through an abstraction.

</details>
