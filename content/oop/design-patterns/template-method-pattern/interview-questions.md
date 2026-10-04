# Template Method — Interview Questions

## Conceptual

### Q1. What is the Template Method pattern?

<details>
<summary>Answer</summary>

A behavioral pattern where a base class defines the skeleton of an algorithm in a (usually `final`) method and calls abstract or overridable step methods that subclasses implement. The structure and order stay fixed; only the steps vary. Example: an `importRows` method that reads, validates, converts and saves rows, with `validate`, `convert` and `save` implemented by each importer.

</details>

### Q2. What is a hook method?

<details>
<summary>Answer</summary>

A step in the template with a default (often empty) implementation that subclasses may override if they need to, such as `afterImport(summary)`. Abstract steps must be implemented; hooks are optional extension points.

</details>

### Q3. Why should the template method be `final`?

<details>
<summary>Answer</summary>

So subclasses cannot override the whole algorithm and change the order of steps or skip mandatory ones (validation, cleanup, transactions). They can only customise the designated steps.

</details>

### Q4. What is the "Hollywood principle"?

<details>
<summary>Answer</summary>

"Don't call us, we'll call you": the high-level component (the base class or framework) controls the flow and calls the low-level code (subclass steps, callbacks) when needed, rather than low-level code calling into the framework at arbitrary times. Template Method is a classic example; it is also a form of Inversion of Control.

</details>

### Q5. Template Method vs Strategy?

<details>
<summary>Answer</summary>

Template Method varies parts of an algorithm through inheritance — fixed per subclass at compile time. Strategy varies an algorithm by composing an object — swappable at runtime and combinable. Template Method is fine for a fixed skeleton with a few variants; Strategy scales better when steps vary independently.

</details>

## Applied

### Q6. Where in the JDK is Template Method used?

<details>
<summary>Answer</summary>

`AbstractList` (and `AbstractMap`, `AbstractSet`): you implement a few primitive methods like `get` and `size`, and many inherited methods are templates built on them. `InputStream.read(byte[], int, int)` is built on the abstract single-byte `read()`. `HttpServlet.service()` dispatches to `doGet`/`doPost`.

</details>
