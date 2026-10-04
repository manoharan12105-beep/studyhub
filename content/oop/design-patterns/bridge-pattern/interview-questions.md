# Bridge — Interview Questions

## Conceptual

### Q1. What is the Bridge pattern?

<details>
<summary>Answer</summary>

A structural pattern that decouples an abstraction from its implementation so both can vary independently. The abstraction hierarchy holds a reference to an implementor interface and delegates low-level work to it, replacing one hierarchy of all combinations with two smaller hierarchies joined by composition.

</details>

### Q2. What problem does Bridge solve?

<details>
<summary>Answer</summary>

Class explosion when a type varies along two independent dimensions — for example notification kind × delivery channel, or shape × rendering API. With inheritance, every combination needs a class (m × n); with Bridge, you write m + n classes and combine them at runtime.

</details>

### Q3. Bridge vs Adapter?

<details>
<summary>Answer</summary>

Both use composition to connect two interfaces, but Adapter is applied after the fact to make an existing incompatible class fit an expected interface, while Bridge is designed up front to let an abstraction and its implementations evolve independently.

</details>

### Q4. Bridge vs Strategy?

<details>
<summary>Answer</summary>

Structurally similar — an object delegates to an interface. Strategy is behavioral: it swaps one algorithm inside a context. Bridge is structural: it separates two whole hierarchies (abstractions with their own subclasses, implementations with theirs) so they can be extended independently.

</details>
