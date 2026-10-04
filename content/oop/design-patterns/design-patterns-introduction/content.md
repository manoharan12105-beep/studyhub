# Introduction to Design Patterns

## Definition

A **design pattern** is a named, reusable solution to a **recurring design problem** in a particular context. It is not finished code or a library; it is a description of how to arrange classes and objects — their roles, relationships and responsibilities — so that a known problem is solved with well-understood trade-offs.

The classic catalogue is the 23 patterns in *Design Patterns: Elements of Reusable Object-Oriented Software* (1994) by Gamma, Helm, Johnson and Vlissides — the **"Gang of Four" (GoF)**.

## Why It Matters

- **Shared vocabulary:** "use a decorator for caching" communicates a whole design in four words.
- **Proven trade-offs:** each pattern documents when it helps and what it costs.
- **Reading frameworks:** Java's standard library and Spring are full of patterns (`Iterator`, `InputStream` decorators, `Comparator` strategies, proxies, template methods); recognising them makes the APIs easier to understand.
- **Interviews:** "explain a pattern you used", "Singleton vs static class", "Strategy vs State", "which pattern would you use here?" are standard questions.

## How to Learn Patterns (and How Not To)

Learn each pattern **problem-first**:

1. What recurring **problem** does it solve?
2. Why does the **obvious solution** fail?
3. What is the **idea** (usually: encapsulate what varies, program to an interface, compose)?
4. What does it **cost**?
5. When would you **not** use it?

Do not memorise class diagrams as templates to paste into code. A design with more patterns is not a better design — see [OOP Anti-Patterns](../../code-quality/oop-anti-patterns/content.md).

## The Principles Behind Most Patterns

| Principle | How patterns use it |
|-----------|---------------------|
| **Encapsulate what varies** | Put the changing part (an algorithm, a creation decision, a state) behind an interface |
| **Program to an interface, not an implementation** | Clients depend on abstractions; implementations can be swapped |
| **Favour composition over inheritance** | Most patterns build behaviour by holding and delegating to objects |
| **Open/Closed, Dependency Inversion** | New behaviour is added as new classes; high-level code depends on abstractions |

See [SOLID Principles](../../design-principles/solid-principles/content.md).

## The Three Categories

| Category | Concern | Patterns |
|----------|---------|----------|
| **Creational** | How objects are created — hiding or controlling `new` | Singleton, Factory Method, Abstract Factory, Builder, Prototype |
| **Structural** | How classes and objects are **composed** into larger structures | Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy |
| **Behavioral** | How objects **communicate** and share responsibilities | Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor |

## Interview Priority in StudyHub

StudyHub marks each pattern so you can plan study time. The labels describe **how often a pattern is useful in typical Java interviews and backend work**, not verified statistics about any particular company.

| Priority | Patterns | Depth |
|----------|----------|-------|
| **Core interview** | Singleton, Factory Method, Abstract Factory, Builder, Adapter, Decorator, Facade, Proxy, Observer, Strategy, State, Command, Template Method | Full treatment, interview questions and practice |
| **Frequently useful** | Iterator, Composite, Chain of Responsibility | Full treatment and interview questions |
| **Advanced / awareness** | Prototype, Bridge, Flyweight, Interpreter, Mediator, Memento, Visitor | Problem, idea, Java example, trade-offs |

## How Each Pattern Topic Is Organised

Every pattern topic uses the same sections, in this order:

1. **Intent** — one or two sentences.
2. **The Problem** — the recurring design problem, in a concrete scenario.
3. **Why the Naive Solution Fails** — the obvious code and its cost.
4. **The Pattern Idea** — the key insight.
5. **Structure** — a text class diagram and the participants.
6. **Java Implementation** — a complete, runnable Java 17 program.
7. **Execution Flow** — what happens at runtime, step by step.
8. **Real-World Examples** — JDK, Spring and everyday systems.
9. **When to Use** / **When Not to Use**.
10. **Advantages** / **Disadvantages**.
11. **Related Patterns** — and how to tell them apart.
12. **SOLID Connection** — which principles the pattern supports.
13. **Common Mistakes**.
14. **Key Takeaways**.

Interview questions and practice are in the companion files.

## Quick Map: Problem → Pattern

| If the problem is… | Consider |
|--------------------|----------|
| Exactly one shared instance is required | Singleton (preferably managed by DI) |
| The caller should not know which concrete class to create | Factory Method |
| Families of related objects must be created consistently | Abstract Factory |
| An object has many optional parts / complex construction | Builder |
| New objects should be copies of a configured prototype | Prototype |
| An existing class has the wrong interface | Adapter |
| Two dimensions of variation would explode a hierarchy | Bridge |
| Part-whole trees should be treated uniformly | Composite |
| Add responsibilities to objects dynamically, in combinations | Decorator |
| A complex subsystem needs a simple entry point | Facade |
| Huge numbers of similar objects use too much memory | Flyweight |
| Control access to an object (lazy, remote, secured, cached) | Proxy |
| A request should pass along handlers until one deals with it | Chain of Responsibility |
| Requests should be objects (queue, log, undo) | Command |
| A small language/grammar must be evaluated | Interpreter |
| Traverse a collection without exposing its structure | Iterator |
| Many objects talk to each other in a tangled way | Mediator |
| Save and restore an object's state without breaking encapsulation | Memento |
| Many objects must react to changes in one object | Observer |
| Behaviour changes with the object's internal state | State |
| Choose an algorithm at runtime | Strategy |
| A fixed algorithm with customisable steps | Template Method |
| Add operations to a stable class hierarchy | Visitor |

Detailed side-by-side comparisons: [Design Pattern Comparisons](../design-pattern-comparisons/content.md).

## Patterns Beyond the GoF

Many other well-known patterns exist — Repository, Dependency Injection, MVC, Null Object, Value Object, Specification and more. Some appear in StudyHub where they illustrate OOP design (for example [Dependency Injection](../../design-principles/dependency-injection/content.md)), but this section covers the 23 GoF patterns.

## Common Misconceptions

- **"Patterns are code templates."** They are design ideas with many valid implementations.
- **"Good code uses many patterns."** Good code solves its problem simply; patterns appear where they fit.
- **"Patterns are language features."** Some are built into Java (iteration via `Iterable`, `Comparator` as a strategy), but the ideas are language-independent.
- **"I must know all 23 in depth."** Know the core ones deeply and the rest well enough to recognise them.

## Key Takeaways

- A design pattern is a named solution to a recurring design problem, with known trade-offs.
- GoF categories: creational (creating), structural (composing), behavioral (communicating).
- Most patterns apply three ideas: encapsulate what varies, program to interfaces, prefer composition.
- Learn problem-first; apply only when the problem is present.
