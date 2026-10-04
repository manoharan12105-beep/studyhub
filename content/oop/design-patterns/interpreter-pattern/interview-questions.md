# Interpreter — Interview Questions

## Conceptual

### Q1. What is the Interpreter pattern?

<details>
<summary>Answer</summary>

A behavioral pattern for evaluating sentences of a simple language. Each grammar rule becomes a class implementing a common `interpret`/`evaluate` method; terminal classes handle basic elements and non-terminal classes (like `And`, `Or`) combine sub-expressions. A sentence is an object tree evaluated recursively against a context.

</details>

### Q2. What is the difference between terminal and non-terminal expressions?

<details>
<summary>Answer</summary>

Terminal expressions are leaves that evaluate directly against the context (a number, a variable, "cart total > 1000"). Non-terminal expressions contain other expressions and combine their results (`And`, `Or`, `Not`, `Plus`).

</details>

### Q3. When should you not use Interpreter?

<details>
<summary>Answer</summary>

When the grammar is complex (too many classes, hard to maintain) or performance matters on large inputs. Then use a parser generator, an existing expression language or rule engine, or compile the expressions into a more efficient form.

</details>

### Q4. How is Interpreter related to Composite?

<details>
<summary>Answer</summary>

The abstract syntax tree is a Composite: non-terminal expressions hold child expressions of the same interface, and evaluation recurses through the tree. Interpreter adds the meaning — each node knows how to evaluate itself according to the grammar.

</details>
