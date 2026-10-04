# Designing Classes from Requirements — Interview Questions

## Conceptual

### Q1. How do you convert a problem statement into classes?

<details>
<summary>Answer</summary>

Clarify requirements and scope; list nouns as candidate entities and keep those with data or rules; list what each must know and do; assign each responsibility to the class that has the information it needs; decide relationships (prefer composition, inheritance only for real IS-A); introduce interfaces where behaviour varies or crosses an external boundary; inject those dependencies; check cohesion, coupling and SOLID; apply patterns where a known problem appears; then walk through use cases and extension scenarios before and while coding.

</details>

### Q2. How do you decide which class should own a responsibility?

<details>
<summary>Answer</summary>

Give it to the class that has the information needed to perform it (Information Expert). "Is the course full?" belongs to `Course`, which knows capacity and enrolment. Behaviour that varies independently (fee rules, notification channels) goes into separate strategy objects. Use-case coordination across several objects goes into a thin service. If a method mostly reads another object's getters, it probably belongs in that other object.

</details>

### Q3. When do you introduce an interface in a design?

<details>
<summary>Answer</summary>

When behaviour has real variants (several fee policies, payment methods), when code crosses a boundary to infrastructure or external systems (database, email, payment gateway) that you want to isolate or fake in tests, or when different clients need different views of an object (role interfaces). Not for every class by default.

</details>

### Q4. What mistakes do candidates commonly make in object-oriented design interviews?

<details>
<summary>Answer</summary>

Jumping to code or patterns without clarifying requirements; one god class (`SystemManager`) holding all logic; anaemic entities with only getters and setters; using inheritance for roles or variants that change (`AdminUser extends User`); `if/else` on type codes instead of polymorphism; ignoring concurrency where it obviously matters (booking the last seat); and not explaining trade-offs.

</details>

## Applied

### Q5. "Design a system where customers rate restaurants and see average ratings." Which classes would you start with and who computes the average?

<details>
<summary>Answer</summary>

`Customer`, `Restaurant`, `Review` (customer, restaurant, stars 1–5, comment, date) and a `ReviewService` for the use case "submit review" (validating one review per customer per restaurant). The average belongs to `Restaurant` (or a `RatingSummary` value it owns) because it has the data: it can keep a running count and sum, updated when a review is added, so reading the average is O(1). If ratings must be filtered (last 6 months), a dedicated `RatingCalculator` strategy is justified.

</details>

### Q6. Your design has `Order`, `Customer`, `Product` with only getters/setters and an `OrderManager` with 40 methods. What would you change?

<details>
<summary>Answer</summary>

Move behaviour to the objects that own the data: `Order.addItem`, `Order.total`, `Order.cancel` (with status rules), `Product.isAvailable(quantity)`. Split `OrderManager` by use case or responsibility (`CheckoutService`, `OrderCancellationService`), leaving them as thin coordinators that call rich domain objects and injected interfaces (payments, notifications, repositories).

</details>
