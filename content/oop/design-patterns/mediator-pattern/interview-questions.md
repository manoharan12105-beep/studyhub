# Mediator — Interview Questions

## Conceptual

### Q1. What is the Mediator pattern?

<details>
<summary>Answer</summary>

A behavioral pattern in which a mediator object encapsulates how a set of objects interact. The objects (colleagues) do not reference each other; they notify the mediator, which coordinates the others. It turns a web of many-to-many dependencies into one-to-many, centralising interaction rules.

</details>

### Q2. Mediator vs Observer?

<details>
<summary>Answer</summary>

Observer lets a subject broadcast changes to any number of subscribers it does not know in detail; observers decide independently what to do. Mediator is a coordinator that knows all participants and contains the rules for how they react to each other. They are often combined: colleagues notify the mediator through an observer-style callback.

</details>

### Q3. Mediator vs Facade?

<details>
<summary>Answer</summary>

A facade provides a simplified interface to a subsystem for outside clients; subsystem classes do not know it exists and communication is one-directional. A mediator sits among peer objects that know it and communicate through it in both directions.

</details>

### Q4. What is the main risk of the Mediator pattern?

<details>
<summary>Answer</summary>

The mediator can accumulate too much logic and become a god object that is hard to maintain. Keep it focused on coordination; leave domain rules in domain objects, and split mediators by screen or workflow.

</details>
