# OOP Anti-Patterns — Interview Questions

## Conceptual

### Q1. What is an anti-pattern? Give OOP examples.

<details>
<summary>Answer</summary>

A commonly used solution that seems reasonable but reliably causes problems. OOP examples: god objects, anaemic domain models, overusing or deeply nesting inheritance, singleton abuse and global mutable state, excessive abstraction and interfaces, premature or inappropriate design patterns, and overengineering for imagined requirements.

</details>

### Q2. What is an anaemic domain model? Why is it considered an anti-pattern?

<details>
<summary>Answer</summary>

Domain classes contain only data with getters and setters, while all business rules live in service classes. It loses encapsulation (any code can set invalid state), scatters and duplicates rules, and turns OO code into procedural code. It is acceptable for simple CRUD or boundary DTOs, but domains with rules benefit from behaviour living in the objects (`account.withdraw(amount)`).

</details>

### Q3. What are the problems with the Singleton pattern?

<details>
<summary>Answer</summary>

Global access hides dependencies; mutable singletons are global state (order-dependent behaviour, thread-safety problems); they are hard to replace in tests; they make "only one" a permanent assumption; and lazy, thread-safe initialisation is easy to get wrong. A single instance created once and injected (e.g. a Spring singleton bean) keeps the benefit without global access.

</details>

### Q4. Why can design patterns become overengineering?

<details>
<summary>Answer</summary>

Each pattern adds classes and indirection to solve a specific problem. Applied before that problem exists — a factory for one product, a strategy with one algorithm, abstract factories with one family — they add cost without benefit, and often guess the wrong axis of change. Patterns should be introduced when their problem appears, or refactored toward when a second variation arrives.

</details>

### Q5. Why are deep inheritance hierarchies a problem?

<details>
<summary>Answer</summary>

Behaviour is spread over many levels, so understanding or changing one method requires reading the whole chain; changes near the top ripple to every subclass; fragile base class and LSP problems multiply; and combinations of features lead to class explosions. Shallow hierarchies plus composition are easier to reason about.

</details>

## Applied

### Q6. A codebase has `IUserService`/`UserServiceImpl`, `IUserDao`/`UserDaoImpl`, `IUserMapper`/`UserMapperImpl` — each interface with exactly one implementation, each layer forwarding calls. Is this good design?

<details>
<summary>Answer</summary>

Usually it is excessive abstraction: the interfaces do not decouple anything because nothing varies and the layers add no logic. It slows navigation and multiplies edits. Keep interfaces where they pay off — the persistence boundary (fakeable in tests, swappable store), external integrations, or module APIs — and collapse pass-through layers. If a framework requires interfaces (for some proxy mechanisms), that is a justified exception.

</details>

### Q7. Your team's `AppContext` class has static fields for the current user, tenant and a cache, accessed everywhere. What risks do you point out and what do you propose?

<details>
<summary>Answer</summary>

Global mutable state: concurrent requests overwrite each other's user and tenant; tests interfere with each other; dependencies are invisible; the cache can grow without limit. Propose request-scoped context objects passed explicitly (or provided by the framework per request), an injected, bounded, thread-safe cache component, and removing static access step by step.

</details>
