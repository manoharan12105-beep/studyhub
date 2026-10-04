# Design Pattern Comparisons — Interview Questions

## Conceptual

### Q1. How do you decide which design pattern to use?

<details>
<summary>Answer</summary>

Start from the problem, not the pattern. Identify what varies (algorithm → Strategy; lifecycle behaviour → State; steps in a fixed process → Template Method; class to create → Factory; family of objects → Abstract Factory; complex construction → Builder), what structural problem exists (incompatible interface → Adapter; complex subsystem → Facade; extra behaviour → Decorator; access control → Proxy; trees → Composite), and what communication problem exists (one-to-many updates → Observer; tangled peers → Mediator; undo/queue → Command). Then check whether the problem is real today; if not, keep the simple design.

</details>

### Q2. Adapter, Decorator, Proxy and Facade all wrap something. How do they differ?

<details>
<summary>Answer</summary>

Adapter wraps one object and exposes a **different** interface that the client expects (compatibility). Decorator wraps one object with the **same** interface and adds behaviour (stackable). Proxy wraps one object with the **same** interface and controls access (lazy, security, remote, caching). Facade wraps a **whole subsystem** behind a new, simpler interface (convenience).

</details>

### Q3. Strategy vs State?

<details>
<summary>Answer</summary>

Both delegate to an interface held by a context. In Strategy, the client chooses an interchangeable algorithm and strategies are unaware of each other. In State, behaviour depends on the object's internal state, and the state objects themselves move the context to the next state as its lifecycle progresses.

</details>

### Q4. Factory Method vs Abstract Factory vs Builder?

<details>
<summary>Answer</summary>

Factory Method: a subclass decides which single product to create via an overridable method. Abstract Factory: an object that creates a family of related products that must be used together. Builder: assembles one complex object step by step with validation, typically ending in an immutable product. Factories answer "which class?"; Builder answers "how is it put together?".

</details>

### Q5. Observer vs Mediator?

<details>
<summary>Answer</summary>

Observer: a subject broadcasts changes to any subscribers through an interface and does not know how they react — one-way, one-to-many. Mediator: a central object knows all participants and encodes how they affect each other — two-way coordination that removes direct references between peers.

</details>

### Q6. Template Method vs Strategy?

<details>
<summary>Answer</summary>

Both vary parts of an algorithm. Template Method uses inheritance: a base class fixes the skeleton and subclasses override steps (decided at compile time). Strategy uses composition: the context receives an algorithm object that can be swapped at runtime and combined with others. Prefer Strategy when variations are independent or must change at runtime; Template Method when a fixed skeleton must be enforced and variants are few.

</details>

## Applied

### Q7. A teammate says "Spring's `@Transactional` is a Decorator." Do you agree?

<details>
<summary>Answer</summary>

Structurally it looks like one (same interface, wraps the bean, adds behaviour), but the usual classification is **Proxy**: the framework creates it transparently, clients do not know it is there, and its purpose is controlling how calls reach the target (inside a transaction). The distinction is intent — and acknowledging that the structures are identical shows understanding.

</details>

### Q8. For each requirement, name a pattern: (a) log every call to a payment client without changing it; (b) support three SMS vendors behind one interface; (c) a "place order" call that coordinates five services; (d) loan applications that behave differently when DRAFT, SUBMITTED, APPROVED.

<details>
<summary>Answer</summary>

(a) Decorator (or a logging proxy; both keep the interface). (b) Adapter per vendor, implementing your `SmsSender`. (c) Facade (an application service). (d) State.

</details>
