# UML Class Diagrams — Interview Questions

## Conceptual

### Q1. What does a UML class diagram show?

<details>
<summary>Answer</summary>

The static structure of a system: classes and interfaces with their attributes and operations (with visibility), and the relationships between them — association, aggregation, composition, inheritance (generalization), realization and dependency — with multiplicities. It does not show runtime order of calls (that is a sequence diagram's job).

</details>

### Q2. How are aggregation and composition drawn and how do they differ?

<details>
<summary>Answer</summary>

Both are drawn as a line with a diamond at the whole's end: hollow (◇) for aggregation, filled (◆) for composition. Aggregation means the parts have an independent lifecycle and may be shared (team ◇ players); composition means the parts belong exclusively to the whole and live and die with it (order ◆ order lines).

</details>

### Q3. What do `+`, `-`, `#` and `~` mean in a class diagram?

<details>
<summary>Answer</summary>

Visibility: `+` public, `-` private, `#` protected, `~` package (Java's default access).

</details>

### Q4. What is the difference between realization and generalization?

<details>
<summary>Answer</summary>

Generalization is inheritance between classes (or between interfaces): a solid line with a hollow triangle pointing to the parent, Java `extends`. Realization is a class implementing an interface: a dashed line with a hollow triangle pointing to the interface, Java `implements`.

</details>

### Q5. How is a dependency different from an association?

<details>
<summary>Answer</summary>

An association is structural — the class holds a reference to the other in a field for its lifetime. A dependency is temporary use — the other class appears only as a parameter, local variable, return type or static call. Dependency is drawn as a dashed arrow; association as a solid line.

</details>

## Applied

### Q6. Translate this diagram into Java field declarations: `Department 1 ◆──── 1..* Team`, `Team 0..* ◇──── 0..* Employee`, `Employee ─────▷ Person`.

<details>
<summary>Answer</summary>

`Department` has `private final List<Team> teams` and creates its teams (composition; at least one team must be ensured by the constructor). `Team` has `private final Set<Employee> members`, with employees passed in from outside (aggregation; an employee can be in several teams). `class Employee extends Person`.

</details>

### Q7. Draw (in text) a class diagram for: "A `Cart` contains `CartItem`s; each item refers to a `Product`; checkout uses a `PaymentMethod` interface implemented by `Upi` and `Card`."

<details>
<summary>Answer</summary>

```text
 Cart 1 ◆────── 0..* CartItem * ──────▶ 1 Product
   ┆
   ┆ uses (dependency, at checkout)
   ▽
 «interface» PaymentMethod
      ▲            ▲
      ┆            ┆   (realization)
     Upi          Card
```

Cart owns its items (composition); items reference products that exist independently (association); checkout depends on the interface, and two classes realize it.

</details>
