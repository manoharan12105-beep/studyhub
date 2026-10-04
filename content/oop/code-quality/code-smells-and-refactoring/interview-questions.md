# Code Smells and Refactoring — Interview Questions

## Conceptual

### Q1. What is a code smell? What is refactoring?

<details>
<summary>Answer</summary>

A code smell is a surface characteristic of code that often indicates a deeper design problem, such as a very long method, a god class or repeated `switch` statements. Refactoring is restructuring code without changing its external behaviour, in small steps verified by tests, to remove such problems and make the code easier to understand and change.

</details>

### Q2. What is the difference between Shotgun Surgery and Divergent Change?

<details>
<summary>Answer</summary>

Shotgun Surgery: one logical change requires many small edits across many classes — a responsibility is scattered. Divergent Change: one class is edited for many unrelated reasons — several responsibilities are packed together. The fixes are opposite moves: gather scattered behaviour into one class (Move Method/Field) versus split a class by reason to change (Extract Class).

</details>

### Q3. What is Feature Envy and how do you fix it?

<details>
<summary>Answer</summary>

A method that uses another object's data more than its own — typically many getter calls on a parameter — indicates the behaviour belongs to that other class. Fix it with Move Method (and then make the other class's fields private), which also increases cohesion and reduces coupling.

</details>

### Q4. What is Primitive Obsession? Give an example and a fix.

<details>
<summary>Answer</summary>

Using primitives or strings for domain concepts: `String email`, `double amount`, `String status`. Validation and formatting are then repeated everywhere, invalid values circulate, and same-typed parameters can be swapped. Fix: introduce small immutable value objects (`Email`, `Money`, `PhoneNumber`) or enums that validate on construction and carry related behaviour.

</details>

### Q5. Why should refactoring be done in small steps with tests?

<details>
<summary>Answer</summary>

Because the goal is to change structure without changing behaviour. Small steps keep each change easy to verify; running tests after each step catches mistakes immediately, when the cause is obvious. Large rewrites mix structural and behavioural changes, making regressions likely and hard to trace.

</details>

## Applied

### Q6. You find this pattern in five classes: `if (type.equals("GOLD")) ... else if (type.equals("SILVER")) ...`. Which smells are present and how would you refactor?

<details>
<summary>Answer</summary>

Switch-heavy design (repeated conditionals on a type code), Primitive Obsession (type as a string) and Shotgun Surgery (a new tier needs five edits). Refactor in steps: replace the string with an enum `Tier`; move each branch into the enum (fields or constant-specific methods) or into a `TierPolicy` interface with one class per tier; replace each conditional with a call to the polymorphic method. A new tier then means one new constant or class.

</details>

### Q7. A legacy 3,000-line `OrderManager` has no tests. How would you start improving it?

<details>
<summary>Answer</summary>

First add characterization tests around the most important behaviours (inputs → current outputs), introducing seams if needed (extract interfaces for the database and gateways so tests can use fakes). Then extract one cohesive responsibility at a time — for example pricing — into a new class, delegate to it from `OrderManager`, run tests, commit. Repeat for payments, notifications, persistence. Prioritise the parts that change most often; do not attempt a big-bang rewrite.

</details>
