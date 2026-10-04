# OOP Scenario-Based Questions

## Definition

**Scenario-based questions** describe a realistic situation — a feature request, a bug, a code-review finding — and ask what you would design or change: *Which class should own this responsibility? Inheritance or composition? Which pattern, and why? How would you design this system?* There is rarely a single correct answer; interviewers assess the **reasoning** and the **trade-offs** you mention.

## Why It Matters

- Backend and product-company interviews use scenarios to see how you apply OOP beyond definitions.
- Placement interviews increasingly include a short "design this" question after the basics.

## How to Answer a Scenario

1. **Restate and clarify** — scope, scale, what changes often.
2. **Name the responsibilities** and who owns the data each needs.
3. **Propose a design** — classes, relationships, interfaces where variation or boundaries exist.
4. **Justify with principles** — SRP, OCP, DIP, composition over inheritance, encapsulation.
5. **State a trade-off or alternative** — what you would do if requirements grew, and what you chose *not* to build.

A good answer sounds like: "I would put the fare rule behind a `FareStrategy` because fares differ by city and change often (OCP). The ride itself stays simple. If there were only one fare rule, I would not add the interface yet."

See [Designing Classes from Requirements](../../object-oriented-design/designing-classes/content.md) for the full design process and the [Design Problems](../../design-problems/parking-lot-design/content.md) for worked systems.

## Key Takeaways

- Clarify → responsibilities → design → principles → trade-offs.
- Justify each interface or pattern with a concrete variation or boundary.
- Saying what you would *not* build (YAGNI) is part of a strong answer.
