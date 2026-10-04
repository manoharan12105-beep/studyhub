# Open/Closed Principle — Interview Questions

## Conceptual

### Q1. Explain the Open/Closed Principle with an example.

<details>
<summary>Answer</summary>

Classes should be open for extension but closed for modification: you add new behaviour by writing new code rather than editing working code. Example: instead of a `DiscountCalculator` with a `switch` on customer type that must be edited for every new type, define a `DiscountPolicy` interface; each discount is a class, and the checkout depends only on the interface. A new student discount is a new class; nothing existing is touched.

</details>

### Q2. How is OCP typically achieved in Java?

<details>
<summary>Answer</summary>

Through abstractions and polymorphism: interfaces with multiple implementations (Strategy), abstract classes with overridable hooks (Template Method), wrappers (Decorator), listeners (Observer), and registration/configuration that maps keys to implementations (including Spring injecting all beans of an interface type).

</details>

### Q3. Does following OCP mean you never modify existing code?

<details>
<summary>Answer</summary>

No. Bug fixes, refactoring and changes to the stable core still require edits. OCP is about the anticipated axis of variation: adding another payment method, report format or rule should not require editing the classes that use them.

</details>

### Q4. What is the relationship between OCP and the Liskov Substitution Principle?

<details>
<summary>Answer</summary>

OCP relies on substituting new implementations for an abstraction without changing the client. That only works if every implementation honours the abstraction's contract — which is LSP. A new subclass that throws unexpectedly or changes the meaning of a method forces clients to add special cases, breaking OCP again.

</details>

### Q5. When can applying OCP be overengineering?

<details>
<summary>Answer</summary>

When extension points are added for variations that never come — interfaces with one implementation, factories for one product, plug-in systems for a fixed feature. They add indirection and maintenance cost. Prefer to introduce the abstraction when a second real variant appears or is concretely planned.

</details>

## Applied

### Q6. Your shipping module has `if (courier.equals("BLUEDART")) {...} else if ("DTDC") {...}` in three methods: rate calculation, label generation and tracking URL. How do you refactor it?

<details>
<summary>Answer</summary>

Introduce a `CourierService` interface with `rateFor(Parcel)`, `label(Shipment)` and `trackingUrl(String awb)`. Implement `BlueDartCourier`, `DtdcCourier`, etc. A registry (a `Map<CourierCode, CourierService>` built once, possibly by Spring injection) returns the right implementation. The three methods collapse into calls on the interface; adding a courier means adding one class and registering it.

</details>

### Q7. Is a `switch` on an enum always an OCP violation?

<details>
<summary>Answer</summary>

No. If the set of values is genuinely closed and stable (days of the week, a sealed result type handled exhaustively), a `switch` is clear and the compiler can check coverage. It becomes a problem when the set keeps growing and the same `switch` is repeated in many places — then each new value forces edits everywhere, and moving the behaviour into the type (polymorphism, enum constant methods) is better.

</details>
