# OOP Scenario-Based Questions — Interview Questions

## Beginner

### Q1. A `Student` class has public fields `marks` and `grade`, and several screens set them directly. Grades are sometimes wrong. What would you change?

**Style:** Placement-style · Frequently useful

<details>
<summary>Answer</summary>

Encapsulate: make the fields private and remove the ability to set `grade` at all. Provide `recordMarks(int marks)` that validates 0–100 and let the class compute the grade from the marks (or derive it in a `grade()` method). Screens can no longer produce inconsistent marks/grade pairs, and the grading rule lives in one place.

</details>

### Q2. You need `Car`, `Bike` and `Truck` classes that all have a registration number, an owner and a `serviceDue()` rule that differs per type. How would you structure them?

**Style:** Placement-style · Service-company-style

<details>
<summary>Answer</summary>

An abstract `Vehicle` class with the shared fields (registration, owner), a constructor that validates them, and an abstract `serviceDue()` method; `Car`, `Bike`, `Truck` extend it and implement the rule. This is a genuine IS-A family with shared state, so an abstract class fits. Code that schedules servicing works with `Vehicle` polymorphically.

</details>

### Q3. A `Rectangle` and a `Circle` both need an `area()`; a `Report` must sum areas of a list of shapes. Design it.

**Style:** Placement-style

<details>
<summary>Answer</summary>

`interface Shape { double area(); }` implemented by `Rectangle` and `Circle` (immutable value classes or records). `Report.totalArea(List<Shape> shapes)` loops and calls `area()`. New shapes need no change to `Report` — polymorphism instead of `instanceof` checks.

</details>

## Intermediate

### Q4. Which class should own "calculate the order total including discounts"?

**Style:** Backend interview · Frequently useful

<details>
<summary>Answer</summary>

`Order`, because it owns the lines (Information Expert): `order.total()` sums line amounts. Discounts that vary (coupon types, festival offers) are separate `Discount` strategies passed to or held by the order (or applied by a pricing service if they depend on external data like customer history). A controller or a generic `OrderManager` computing totals from getters is the wrong owner.

</details>

### Q5. Your `Employee` hierarchy has `Manager extends Employee`. Next quarter, employees can be promoted or demoted. Inheritance or composition?

**Style:** Backend interview

<details>
<summary>Answer</summary>

Composition. A role can change during an object's lifetime, but a class cannot. Give `Employee` a `Role` (or a set of responsibilities/permissions) that can be replaced: `employee.assignRole(new ManagerRole(team))`. Inheritance would force creating a new object on promotion and losing identity in other records.

</details>

### Q6. Three different payment providers must be supported, and more will come. Which pattern(s), and why?

**Style:** Backend interview · Product-company-style

<details>
<summary>Answer</summary>

Define your own `PaymentGateway` interface (what checkout needs: charge, refund). Implement one **Adapter** per provider around its SDK, translating requests, responses and errors. Choose the provider by configuration (a map or DI qualifier) — effectively **Strategy**. Checkout depends only on the interface (DIP), new providers are new adapters (OCP), and tests use a fake gateway.

</details>

### Q7. The checkout service calls inventory, payment, invoicing, shipping and email in one 200-line method. What would you do?

**Style:** Backend interview

<details>
<summary>Answer</summary>

Keep checkout as a thin **Facade**/application service that expresses the steps (`reserveStock`, `charge`, `createInvoice`, `ship`, `notify`) and delegates each to an injected collaborator with its own responsibility. Move side reactions that do not affect the result (email, analytics) to events (**Observer**). Handle failure compensation (release stock if payment fails) explicitly in the orchestrating method.

</details>

### Q8. A `ReportService` must output PDF today and Excel next month. How do you avoid editing it each time?

**Style:** Service-company-style · Backend interview

<details>
<summary>Answer</summary>

Introduce a `ReportFormatter` interface with `PdfFormatter` and `ExcelFormatter` implementations; `ReportService` receives a formatter (Strategy/DI). Next month's Excel support is a new class plus wiring. I would introduce the interface now because the second format is already planned — otherwise I would wait (YAGNI).

</details>

### Q9. Logging, caching and retry must be added around a remote client in some environments but not others. Design it.

**Style:** Product-company-style

<details>
<summary>Answer</summary>

Make the client implement an interface and write **Decorators** — `LoggingClient`, `CachingClient`, `RetryingClient` — each wrapping another implementation of the same interface. Compose per environment in configuration (cache outside retry). The real client stays unchanged and each concern is one small class.

</details>

## Advanced

### Q10. A colleague added `class ReadOnlyAccount extends Account` that throws on `withdraw`. Code that processes `List<Account>` now crashes. Diagnose and fix.

**Style:** Product-company-style · Advanced interview

<details>
<summary>Answer</summary>

LSP violation (refused bequest): `ReadOnlyAccount` cannot honour `Account`'s contract. Split capabilities: `Account` (balance, statement) and `WithdrawableAccount extends Account` (withdraw). Processes that withdraw accept `WithdrawableAccount`; the compiler then prevents passing a read-only account. Do not patch callers with `instanceof` checks.

</details>

### Q11. Order status logic is spread across `switch (status)` blocks in eight methods, and a new ON_HOLD status is requested. How do you refactor?

**Style:** Backend interview · Product-company-style

<details>
<summary>Answer</summary>

If statuses mostly gate allowed transitions, introduce an enum with a transition table and a single `order.moveTo(next)` that validates. If each status has significantly different behaviour across operations, apply the **State** pattern: one class per status implementing the operations, with defaults that reject invalid ones. Either way, ON_HOLD becomes a local change instead of edits to eight methods.

</details>

### Q12. Tests for `InvoiceService` are slow and flaky because it calls a tax API and uses `LocalDate.now()`. What design change makes it testable?

**Style:** Backend interview

<details>
<summary>Answer</summary>

Inject both dependencies: a `TaxRateProvider` interface (with the API client as one implementation) and a `java.time.Clock`. Tests pass a stub provider and `Clock.fixed(...)`. This is DIP plus constructor injection; it also isolates the domain from the external API's failures.

</details>

### Q13. A singleton `AppConfig.getInstance()` is used in 60 classes, and now each tenant needs different configuration. What is your plan?

**Style:** Advanced interview

<details>
<summary>Answer</summary>

Global access is the problem, not "one instance". Introduce a `ConfigProvider` interface, inject it into classes incrementally (initially backed by the existing singleton so behaviour is unchanged), then add a tenant-aware implementation resolved per request. Remove the static accessor once all callers are migrated. Do it in small, tested steps.

</details>

### Q14. Two services each need the other (`OrderService` ↔ `InventoryService`) and constructor injection fails with a circular dependency. What do you do?

**Style:** Backend interview · Advanced interview

<details>
<summary>Answer</summary>

Treat it as a design smell. Options: extract the shared logic into a third service both use; replace one direction with an event (inventory listens to `OrderPlaced`); or pass the needed data as method arguments instead of holding a reference. Switching to field or setter injection only hides the tangle.

</details>

### Q15. Design an extensible notification module (email, SMS, push; urgent vs normal; quiet hours).

**Style:** Product-company-style

<details>
<summary>Answer</summary>

- `NotificationChannel` interface with one implementation per channel (adapters over providers).
- `Notification` value (recipient, message, priority).
- A `NotificationService` that selects channels via a policy (`ChannelSelectionPolicy` — Strategy: urgent → SMS + push; normal → email).
- Cross-cutting rules as decorators on channels: `QuietHoursChannel`, `RetryingChannel`, `RateLimitedChannel`.
- Producers publish domain events; a listener converts events into notifications (Observer), so business modules do not depend on notification code.

Channels vary independently of policies — composition keeps combinations additive.

</details>
