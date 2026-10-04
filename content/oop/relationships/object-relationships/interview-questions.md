# Association, Aggregation and Composition — Interview Questions

## Conceptual

### Q1. What is the difference between association, aggregation and composition?

<details>
<summary>Answer</summary>

All three are relationships where one object refers to another. Association is the general case — objects collaborate without ownership (a doctor and a patient). Aggregation is a HAS-A relationship with weak ownership: the parts exist independently and can be shared (a team and its players). Composition is a HAS-A relationship with strong ownership: each part belongs to one whole and its lifetime is tied to it (an order and its order lines). In UML: plain line, hollow diamond, filled diamond.

</details>

### Q2. What is the difference between IS-A and HAS-A?

<details>
<summary>Answer</summary>

IS-A is inheritance (`extends`) or interface implementation — the subclass is a kind of the parent and can be substituted for it. HAS-A is association through a field — one object holds another and delegates to it. HAS-A is more flexible (the part can be swapped at runtime and only its public interface matters), so it is preferred unless the IS-A relationship is genuinely true and permanent.

</details>

### Q3. How do you implement composition in Java, given that Java has a garbage collector?

<details>
<summary>Answer</summary>

By design rather than by a language feature: the whole creates its parts (or takes exclusive ownership of them), stores them in private fields, never shares them, and does not leak references (no getters returning mutable parts; defensive copies; possibly a private nested part class). Then when the whole becomes unreachable, so do its parts, and the GC reclaims them together.

</details>

### Q4. What is a bidirectional association and what is its risk?

<details>
<summary>Answer</summary>

Both classes hold references to each other (a `Teacher` has a list of students; each `Student` has a teacher). The risk is inconsistency — updating one side and forgetting the other — and infinite recursion in naive `toString`, `equals` or `hashCode` implementations that follow both references. Keep updates in one method that maintains both sides, and prefer unidirectional associations when possible.

</details>

### Q5. How would you model a many-to-many relationship between students and courses?

<details>
<summary>Answer</summary>

Usually with an association class, `Enrollment`, holding a reference to one `Student` and one `Course` plus the relationship's own data (date, grade, status). Students and courses each relate one-to-many to enrollments. This avoids two parallel lists that must be kept in sync and gives the relationship a place for its data and rules (for example "a student cannot enrol twice in the same course").

</details>

## Applied

### Q6. Classify each relationship: (a) `Library`–`Book`, (b) `Book`–`Page`, (c) `Member`–`Book` while borrowed, (d) `ReportService`–`PdfWriter` used inside one method.

<details>
<summary>Answer</summary>

- (a) Aggregation in most systems: books are tracked independently and can be transferred to another library.
- (b) Composition: pages belong to one book and have no meaning without it.
- (c) Association — better modelled with a `Loan` class linking member, book copy and dates.
- (d) Dependency: a temporary use, not a stored reference.

The answers depend on the domain; a different system could reasonably classify (a) differently, and the justification (lifecycle, sharing) is what interviewers listen for.

</details>

### Q7. A `Car` class extends `Engine` so it can reuse `start()`. What is wrong and how do you fix it?

<details>
<summary>Answer</summary>

A car is not an engine, so the IS-A relationship is false: `Car` would expose every `Engine` method (`setFuelInjectionTiming`) and could be passed wherever an `Engine` is expected. Use composition: `Car` has a private `Engine` field and its `start()` delegates to `engine.start()` plus its own checks. As a bonus, the engine type can be swapped (petrol, electric) through an `Engine` interface.

</details>
