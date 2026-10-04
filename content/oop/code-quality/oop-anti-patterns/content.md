# OOP Anti-Patterns

## Definition

An **anti-pattern** is a commonly used solution that looks reasonable but reliably produces bad consequences — the opposite of a design pattern. In object-oriented code, anti-patterns usually come from **over-using** good tools (inheritance, abstraction, design patterns, singletons) or from **under-using** OOP itself (objects as data bags, global state).

> [!IMPORTANT]
> Design patterns are **tools, not mandatory structures**. A design is not better because it contains more patterns, interfaces or layers; it is better when it solves the actual problem simply and can absorb likely change.

## Why It Matters

- Many legacy systems are hard to maintain not because they lack patterns but because patterns and abstractions were applied where they were not needed — or because one class grew to own everything.
- Interviewers ask "what are the disadvantages of Singleton?", "is inheritance always good?", "what is an anaemic domain model?" to see whether you understand trade-offs.

## Overusing Inheritance

**Symptom:** inheritance used for code reuse rather than true substitutability — `Stack extends ArrayList`, `Car extends Engine`, `AdminUser extends User` for a role that changes.

**Consequences:** fragile base classes, refused bequests, LSP violations, class explosions when variation has several dimensions.

**Better:** composition and interfaces; inheritance only for genuine, stable IS-A hierarchies designed for extension. See [Composition over Inheritance](../../relationships/composition-over-inheritance/content.md).

## Deep Inheritance Hierarchies

**Symptom:** `Entity → AuditedEntity → VersionedEntity → BaseCustomer → RetailCustomer → PremiumRetailCustomer`.

**Consequences:** understanding one method requires reading six classes; a change near the top affects everything below; `super` chains become hard to trace; tests need the whole stack.

**Better:** keep hierarchies shallow (often one or two levels); move cross-cutting concerns (auditing, versioning) into composed components or framework features; model variants as strategies or data.

## Singleton Abuse

**Symptom:** many classes reach global singletons through `X.getInstance()` — configuration, database access, caches, the "current user".

**Consequences:**

- **Hidden dependencies:** a method's signature does not reveal that it uses the database.
- **Global mutable state:** any code can change it; behaviour depends on call order.
- **Testability:** tests cannot substitute fakes easily, and state leaks between tests.
- **Concurrency:** shared mutable state across threads.
- **Inflexibility:** "there will only ever be one" often becomes false (two databases, multi-tenant configuration).

**Better:** create one instance in the composition root (or a container-managed singleton bean) and **inject** it. The object can still be single; it just is not globally reachable. See [Singleton](../../design-patterns/singleton-pattern/content.md) and [Dependency Injection](../../design-principles/dependency-injection/content.md).

## Global Mutable State

**Symptom:** `public static` mutable fields, static collections used as shared registries, static "context" objects.

```java
class AppState {
    static String currentUserId;                          // written by one request, read by another
    static java.util.List<String> pendingEmails = new java.util.ArrayList<>();
}
```

**Consequences:** races between threads, impossible-to-reproduce bugs, tests that pass alone and fail together, memory leaks from ever-growing static collections.

**Better:** pass state explicitly; keep request data in request-scoped objects; make shared data immutable; encapsulate truly shared state in a thread-safe object that is injected.

## Anaemic Domain Model

**Symptom:** domain classes contain only fields with getters and setters; all business rules live in "service" classes that manipulate them.

```java
class Account {                       // data only
    private long balance;
    long getBalance() { return balance; }
    void setBalance(long balance) { this.balance = balance; }
}

class AccountService {                // all rules outside the object
    void withdraw(Account account, long amount) {
        if (account.getBalance() < amount) {
            throw new IllegalStateException("insufficient funds");
        }
        account.setBalance(account.getBalance() - amount);
    }
}
```

**Consequences:** encapsulation is lost (anyone can call `setBalance(-5)`); rules get duplicated across services; the code is procedural with class syntax.

**Better:** put behaviour that concerns an object's own data **in the object** (`account.withdraw(amount)`); keep services for coordinating several objects and infrastructure.

*Nuance:* simple CRUD applications and DTOs at system boundaries are legitimately data-centred; the anti-pattern is applying that style to domains with real rules.

## God Object

**Symptom:** one class (`SystemManager`, `ApplicationController`, `CommonService`) that knows and does most things; many classes depend on it.

**Consequences:** every change touches it; merge conflicts; impossible to test; low cohesion, high coupling.

**Better:** split by responsibility, move behaviour to data owners, connect through narrow interfaces. See [Code Smells and Refactoring](../code-smells-and-refactoring/content.md).

## Excessive Abstraction

**Symptom:** layers and interfaces with no variation behind them: `IUserService` → `UserServiceImpl` → `IUserDao` → `UserDaoImpl` → `AbstractBaseDao` → `GenericDaoSupport`, all for a single database table, each layer just forwarding calls.

**Consequences:** navigating the code means jumping through many files to find the one line that does something; changes need edits in every layer; new team members are slowed down.

**Better:** introduce abstractions at real boundaries (persistence, external services) and real variation points; let simple code stay simple.

## Excessive Interfaces

**Symptom:** an interface for every class, including value objects and stable utilities; interfaces with exactly one implementation that will never have a second and are never faked in tests.

**Consequences:** doubled file count, indirection, and "Go to implementation" fatigue — without any decoupling benefit.

**Better:** create an interface when there are multiple implementations, an external boundary, a need for a test double, or a module API to stabilise.

## Overengineering

**Symptom:** frameworks inside the application ("rule engine", "plugin system", generic configurable workflow) built before a second use case exists; configuration options nobody uses.

**Consequences:** time spent building and maintaining unused flexibility; the real future requirement often does not fit the guessed extension points.

**Better:** YAGNI and KISS — build for current requirements with clean, tested code that is easy to refactor when the next requirement arrives ([Clean Code Principles](../clean-code-principles/content.md)).

## Premature Design Patterns

**Symptom:** starting from "which patterns can I use?" rather than "what problem do I have?" — a Factory for one product, a Strategy with one strategy, an Observer with one listener, a Builder for a two-field object.

**Consequences:** more classes and indirection than the problem needs; readers search for a reason that does not exist.

**Better:** write the straightforward version; refactor **toward** a pattern when its problem appears (a second algorithm, a second product family, a telescoping constructor).

## Inappropriate Design Patterns

**Symptom:** a pattern applied to a problem it does not fit:

| Misapplication | Problem |
|----------------|---------|
| Singleton for "services" just to share them | Global state; use DI instead |
| Visitor for a hierarchy whose types change often | Every new type edits every visitor |
| Observer chains for a strict, ordered workflow | Hidden control flow, hard to debug; a direct call is clearer |
| Template Method when steps vary independently | Subclass explosion; use Strategy/composition |
| Abstract Factory with only one product family | Two levels of indirection for nothing |

**Better:** know each pattern's **intent, applicability and costs** (see the [Design Patterns](../../design-patterns/design-patterns-introduction/content.md) topics) and compare alternatives ([Design Pattern Comparisons](../../design-patterns/design-pattern-comparisons/content.md)).

## Summary

| Anti-pattern | Root cause | Remedy |
|--------------|-----------|--------|
| Overusing inheritance | Reuse via IS-A | Composition, interfaces |
| Deep hierarchies | Layering features by subclassing | Shallow hierarchies, composed concerns |
| Singleton abuse / global state | Convenience of global access | Single instance + dependency injection |
| Anaemic domain model | Data and behaviour separated | Behaviour in the data owner |
| God object | Responsibilities accumulated | Extract classes by responsibility |
| Excessive abstraction / interfaces | Abstraction without variation | Abstract at boundaries and variation points |
| Overengineering, premature patterns | Designing for imagined futures | YAGNI, KISS, refactor when needed |
| Inappropriate patterns | Pattern chosen before the problem | Start from the problem; compare options |

## Common Misconceptions

- **"More patterns = better design."** Patterns add structure that must pay for itself.
- **"Singleton is always an anti-pattern."** A single instance is sometimes right; *global access* to mutable state is the problem.
- **"Interfaces are always good."** They are good where they decouple something real.
- **"Anaemic models are always wrong."** Fine for simple CRUD and boundary DTOs; harmful for rich domains.

## Key Takeaways

- Anti-patterns come from overusing good tools or skipping OOP's core idea (objects owning behaviour).
- Prefer composition over deep/reuse-driven inheritance.
- Avoid global mutable state; single instances are fine when injected.
- Put behaviour with data; split god objects.
- Abstract and apply patterns only where a real problem or variation exists — patterns are tools, not requirements.
