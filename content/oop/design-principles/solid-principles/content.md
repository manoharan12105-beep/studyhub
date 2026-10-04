# SOLID Principles

## Definition

**SOLID** is an acronym for five object-oriented design principles, popularised by Robert C. Martin, that help keep code easy to change:

| Letter | Principle | One-line meaning |
|--------|-----------|------------------|
| **S** | [Single Responsibility](../single-responsibility-principle/content.md) | A class should have **one reason to change** |
| **O** | [Open/Closed](../open-closed-principle/content.md) | Open for **extension**, closed for **modification** |
| **L** | [Liskov Substitution](../liskov-substitution-principle/content.md) | Subtypes must be **usable wherever their base type is expected**, without surprises |
| **I** | [Interface Segregation](../interface-segregation-principle/content.md) | Clients should not depend on **methods they do not use** |
| **D** | [Dependency Inversion](../dependency-inversion-principle/content.md) | Depend on **abstractions**, not on concrete details |

## Why It Matters

Software changes constantly: new payment methods, new report formats, new rules. The cost of a change depends on how many places it touches and how much it risks breaking. SOLID principles reduce both:

- **S** keeps each change local to one class.
- **O** lets new behaviour arrive as new code instead of edits to working code.
- **L** makes polymorphism safe, so new subtypes do not break old callers.
- **I** keeps dependencies narrow, so changes to unrelated features do not ripple.
- **D** isolates business logic from infrastructure, so databases, APIs and frameworks can change — and be faked in tests.

They are also the vocabulary interviewers use to discuss design: "Which principle does this violate?", "How would you refactor this to follow OCP?"

## How the Principles Fit Together

```text
                 Goal: code that is easy to change and test
                                   │
        ┌──────────────────────────┼──────────────────────────┐
   Small units                Safe extension             Stable dependencies
   S: one reason to change    O: add, don't modify        I: narrow interfaces
                              L: subtypes keep contracts  D: depend on abstractions
```

They reinforce each other:

- Following **S** produces small classes, which makes small interfaces (**I**) natural.
- **O** is usually achieved through polymorphism, which only works if subtypes obey **L**.
- **D** introduces the abstractions that **O** extends and that tests substitute.

## One Example, Five Principles

A notification feature that started as one class:

```java
class NotificationManager {
    void notifyCustomer(String customerId, String message, String channel) {
        // 1. loads the customer from MySQL with JDBC        ← persistence
        // 2. if channel == "EMAIL" ... else if "SMS" ...     ← channel selection
        // 3. formats the message as HTML or plain text       ← formatting
        // 4. writes an audit line to a file                  ← auditing
    }
}
```

| Principle | Violation here | Fix |
|-----------|----------------|-----|
| **S** | Persistence, channel logic, formatting and auditing change for different reasons | Separate `CustomerRepository`, `MessageFormatter`, `AuditLog`, channel classes |
| **O** | Adding WhatsApp means editing the `if/else` chain | `NotificationChannel` interface; new channel = new class |
| **L** | A `PushChannel` that throws for customers without the app breaks callers expecting delivery or a defined failure | Make the contract explicit (`supports(customer)`), or return a result instead of throwing |
| **I** | One `Channel` interface with `send`, `sendBulk`, `scheduleCampaign` forces SMS to fake campaign support | Split into `MessageSender` and `CampaignScheduler` |
| **D** | The manager creates a JDBC connection and concrete senders itself | Depend on `CustomerRepository` and `NotificationChannel` interfaces, injected through the constructor |

## SOLID and Design Patterns

Most patterns are concrete ways of applying these principles:

| Pattern | Principle it mainly supports |
|---------|------------------------------|
| [Strategy](../../design-patterns/strategy-pattern/content.md) | O (new algorithms without editing the context), D |
| [Decorator](../../design-patterns/decorator-pattern/content.md) | O (add behaviour by wrapping), S |
| [Factory Method](../../design-patterns/factory-method-pattern/content.md) / [Abstract Factory](../../design-patterns/abstract-factory-pattern/content.md) | D (callers depend on product interfaces), S (creation separated) |
| [Observer](../../design-patterns/observer-pattern/content.md) | O, D (subjects know only the observer interface) |
| [Adapter](../../design-patterns/adapter-pattern/content.md) | D, I (adapt third-party APIs to your own narrow interface) |
| [Template Method](../../design-patterns/template-method-pattern/content.md) | O (vary steps), but relies on inheritance — L matters |
| [Facade](../../design-patterns/facade-pattern/content.md) | I (a narrow interface over a complex subsystem) |

## SOLID and Testability

Classes that follow SOLID are small (S), extensible without edits (O), substitutable (L), have narrow dependencies (I) and receive abstractions (D) — exactly what a unit test needs to replace collaborators with fakes. See [OOP with Testing](../../applied-oop/oop-with-testing/content.md).

## Applying SOLID Pragmatically

SOLID principles are **heuristics, not laws**:

- Apply them where **change actually happens**. A tiny script or a class that has never changed does not need five interfaces.
- Prefer refactoring **when a second variation appears** ("rule of three" thinking) over guessing every future extension on day one.
- Over-application produces the opposite problem — dozens of one-method interfaces and indirection that makes code hard to follow. See [OOP Anti-Patterns](../../code-quality/oop-anti-patterns/content.md).
- Balance with **KISS** and **YAGNI** ([Clean Code Principles](../../code-quality/clean-code-principles/content.md)).

## Real-World Examples

- Spring Boot applications: controllers, services and repositories (S); services depend on repository interfaces injected by the container (D); new payment providers added as new beans implementing a common interface (O).
- The JDK's `java.util.function` interfaces are tiny and focused (I).
- `InputStream` subclasses can be used wherever an `InputStream` is expected (L) — `BufferedInputStream` wraps any of them (decorator, O).

## Common Misconceptions

- **"SRP means a class should have only one method."** It means one reason to change — one responsibility, which may need several methods.
- **"OCP means never editing existing code."** Bug fixes and refactoring are edits; OCP is about adding features without modifying stable code paths.
- **"LSP is just about inheritance syntax."** It is about behaviour: subtypes must honour the base type's contract.
- **"ISP means every interface must have one method."** It means interfaces sized to their clients' needs.
- **"DIP is the same as dependency injection."** DIP is a design principle about the direction of dependencies; DI is one technique for supplying them.
- **"SOLID always makes code better."** Applied blindly, it adds needless complexity.

## Key Takeaways

- S: one reason to change. O: extend without modifying. L: subtypes keep the contract. I: small, client-specific interfaces. D: depend on abstractions.
- Together they localise change, make extension safe and make code testable.
- Patterns are reusable ways to apply them; tests are a natural beneficiary.
- Apply them where change happens; avoid speculative abstraction.
