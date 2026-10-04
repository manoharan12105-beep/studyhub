# SOLID and Design Principles

The principles that guide class design, each with its test question, typical violation and fix.

## SOLID

| Principle | Test question | Typical violation | Typical fix |
|-----------|---------------|-------------------|-------------|
| **Single Responsibility** | Does this class have more than one reason to change? | `Invoice` that calculates, formats, saves and emails | Split by reason to change; thin coordinator |
| **Open/Closed** | Does adding a variant mean editing working code? | `switch` on a type code in many places | Interface + implementations (Strategy, Decorator, Observer) |
| **Liskov Substitution** | Can every subtype replace the base type without surprises? | `Square extends Rectangle` with setters; overrides that throw | Reshape abstractions (by capability, immutability, composition) |
| **Interface Segregation** | Are clients forced to depend on methods they don't use? | Fat interface; implementers throwing `UnsupportedOperationException` | Role interfaces sized to clients |
| **Dependency Inversion** | Does business policy depend on infrastructure details? | `new MySqlRepository()` inside a service | Policy-owned interface, implementation injected |

LSP contract rules: do not strengthen preconditions, weaken postconditions, break invariants or throw unexpected exceptions.

## Coupling and Cohesion

- Aim for **low coupling** (few, narrow, stable dependencies) and **high cohesion** (each class one focused purpose).
- Coupling from strongest to weakest: content → common (global) → control (flags) → stamp → data → message.
- Cohesion from weakest to strongest: coincidental (`Utils`) → logical → temporal → procedural → communicational → sequential → functional.

## Dependency Injection and IoC

- DI: dependencies supplied from outside — **constructor** (required, `final`, testable), setter (optional), field (avoid).
- Composition root: one place that knows concrete classes (`main` or the container).
- IoC: the framework controls creation and flow; DI is IoC applied to dependencies; DIP decides what to depend on.
- Spring singleton beans are shared across threads — keep services stateless.

## Composition over Inheritance

- Inherit only for permanent, substitutable IS-A with base classes designed for extension.
- Otherwise hold parts behind interfaces and delegate; vary behaviour by swapping parts.
- Signals to switch: subclass explosion, overriding to disable behaviour, roles that change, extending library classes.

## Clean Code Principles

| Principle | Short form | Bend it when… |
|-----------|-----------|---------------|
| Meaningful names | Names reveal intent | Tiny scopes (`i`, `e`) |
| Small classes / methods | One responsibility; one level of abstraction | A clear linear algorithm reads better whole |
| Tell, Don't Ask | Ask objects to act, not for their data | Queries and reports |
| Law of Demeter | Talk to immediate friends only | Fluent APIs, builders, streams, value objects |
| Avoid boolean flags | Separate methods / enums / strategies | One obvious flag |
| Parameter objects | Group data that travels together | 2–3 distinct parameters |
| Defensive programming | Fail fast, guard clauses, self-validating types | Private methods behind validated boundaries |
| DRY | One place per piece of knowledge | Look-alike code that changes for different reasons |
| KISS / YAGNI | Simplest thing for today | — (they balance SOLID's extensibility) |

## Smells → Refactorings

| Smell | Refactoring |
|-------|-------------|
| God class, divergent change | Extract Class by responsibility |
| Long method | Extract Method |
| Long parameter list, data clumps | Introduce Parameter Object / value object |
| Feature envy | Move Method to the data owner |
| Shotgun surgery | Move Method/Field to gather the rule |
| Primitive obsession | Replace Primitive with Value Object / Enum |
| Switch on type code | Replace Conditional with Polymorphism |
| Refused bequest | Replace Inheritance with Delegation |

## Anti-Patterns

- Overused or deep inheritance; singleton abuse and global mutable state; anaemic domain model; god object.
- Excessive abstraction and interfaces without variation; premature or inappropriate patterns; overengineering.
- Patterns are tools — introduce them when their problem appears.

## Designing Classes

1. Clarify requirements and scope.
2. Nouns → candidate entities; keep those with data or rules.
3. Assign each responsibility to the class with the information.
4. Choose relationships by lifecycle and substitutability.
5. Interfaces where behaviour varies or crosses a boundary; inject them.
6. Check SRP, coupling, cohesion, testability; walk through scenarios and extensions.
