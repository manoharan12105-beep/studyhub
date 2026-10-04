# Single Responsibility Principle — Interview Questions

## Conceptual

### Q1. What is the Single Responsibility Principle?

<details>
<summary>Answer</summary>

A class should have only one reason to change — it should be responsible to one actor or concern. For example, invoice tax rules, invoice layout and invoice storage change for different reasons and different stakeholders, so they belong in different classes.

</details>

### Q2. Does SRP mean a class should have only one method?

<details>
<summary>Answer</summary>

No. A responsibility is a reason to change, not an operation. An `Invoice` can have `addLine`, `subtotal`, `totalWithTax` and `applyDiscount` — all part of one responsibility (invoice calculation). What it should not also contain is PDF rendering or SMTP code.

</details>

### Q3. How do you identify that a class violates SRP?

<details>
<summary>Answer</summary>

Its description needs "and"; it imports from unrelated layers (database, mail, UI); different stakeholders request changes to it; its methods form groups that use different fields (low cohesion); unit tests need many unrelated mocks; and it changes very frequently for unrelated reasons.

</details>

### Q4. What are the benefits of SRP?

<details>
<summary>Answer</summary>

Changes stay local and less risky, classes are easier to understand and name, unit tests are simpler and faster, responsibilities can be reused independently, and teams working on different concerns conflict less.

</details>

### Q5. Can SRP be overdone?

<details>
<summary>Answer</summary>

Yes. Splitting code that always changes together scatters one concept across many tiny classes and increases indirection. Moving all behaviour out of domain objects into separate services creates an anaemic domain model. The test is the reason to change: split when parts change for different reasons, keep together when they change together.

</details>

## Applied

### Q6. A `UserController` validates input, hashes passwords, saves users with JDBC and sends welcome emails. How would you restructure it?

<details>
<summary>Answer</summary>

Keep the controller for HTTP concerns (parse request, return response). Move validation into a request validator (or the domain object's constructor), password hashing into a `PasswordHasher`, persistence into a `UserRepository` interface with a JDBC implementation, and the welcome email into a `WelcomeNotifier`. A `UserRegistrationService` coordinates: validate → hash → save → notify. Each piece now has one reason to change and can be tested alone.

</details>

### Q7. Scenario: the finance team wants rounding changed to the nearest rupee on invoices, but the operations team says the stored invoice files must keep paise. With a single `Invoice` class doing both, what goes wrong?

<details>
<summary>Answer</summary>

A change requested by one actor (finance) can break behaviour depended on by another (operations), because the same code path serves both — for instance, if storage reuses the rounded display total. This is exactly the risk SRP targets. Separate the calculation (exact amounts) from presentation/rounding policy and from storage, so each actor's requirement lives in its own class.

</details>
