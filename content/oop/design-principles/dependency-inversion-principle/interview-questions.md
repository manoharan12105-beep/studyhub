# Dependency Inversion Principle — Interview Questions

## Conceptual

### Q1. What is the Dependency Inversion Principle?

<details>
<summary>Answer</summary>

High-level modules (business policy) should not depend on low-level modules (database, messaging, vendor APIs); both should depend on abstractions. And abstractions should not depend on details; details should depend on abstractions. In practice the business layer defines interfaces like `OrderRepository` and infrastructure classes implement them, so source dependencies point toward the business code.

</details>

### Q2. What exactly is "inverted"?

<details>
<summary>Answer</summary>

The direction of the source-code dependency. In a naive layered design, `OrderService` imports `MySqlOrderRepository`, so business code depends on infrastructure. With DIP, `OrderService` depends on its own `OrderRepository` interface, and `MySqlOrderRepository` imports and implements that interface — infrastructure now depends on the business layer. Ownership of the abstraction moves to the high-level module.

</details>

### Q3. What is the difference between DIP, DI and IoC?

<details>
<summary>Answer</summary>

DIP is a design principle about dependency direction (depend on abstractions owned by the policy). Dependency Injection is a technique: supply an object's dependencies from outside, usually via its constructor, instead of creating them inside. Inversion of Control is the broader idea that a framework controls object creation and calls your code; a DI container like Spring is an IoC container that performs DI. DI is the usual way to implement DIP, and Spring is a convenient (not required) way to do DI.

</details>

### Q4. How does DIP help unit testing?

<details>
<summary>Answer</summary>

Because business classes depend on interfaces passed in from outside, tests can pass fakes or mocks (an in-memory repository, a recording notifier) and test the business rules quickly and deterministically, without databases, networks or vendor sandboxes.

</details>

### Q5. Can an abstraction violate DIP?

<details>
<summary>Answer</summary>

Yes, if it depends on details: an interface method taking a `java.sql.Connection`, returning a vendor SDK type, or declaring vendor-specific exceptions. Then every client is coupled to that technology through the "abstraction". Abstractions should be expressed in domain terms.

</details>

## Applied

### Q6. Your `LoanApprovalService` calls `new CibilScoreApiClient().fetchScore(pan)` directly. Apply DIP.

<details>
<summary>Answer</summary>

Define, in the loan domain, `interface CreditScoreProvider { int scoreFor(String pan); }`. `LoanApprovalService` takes a `CreditScoreProvider` in its constructor and uses only that. A `CibilCreditScoreProvider` adapter in the infrastructure layer implements it using the API client and translates its errors into a domain exception. Tests use a stub provider returning chosen scores, and adding a second bureau means a new adapter, not changes to the approval rules.

</details>

### Q7. Is creating `UserService` and `UserServiceImpl` for every service applying DIP?

<details>
<summary>Answer</summary>

Not necessarily. DIP is about the high-level module depending on abstractions it owns at volatile boundaries. If nothing ever substitutes `UserServiceImpl` and the interface simply mirrors it, the pair adds ceremony without inverting anything important. It can still be justified (framework proxies, module APIs, multiple implementations), but the boundaries where DIP really pays are persistence, external services, time and messaging.

</details>
