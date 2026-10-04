# Composite — Interview Questions

## Conceptual

### Q1. What is the Composite pattern?

<details>
<summary>Answer</summary>

A structural pattern for part–whole trees: leaves and containers implement the same component interface, and containers hold children of that interface and implement operations by delegating to them. Clients treat single objects and groups uniformly — `item.price()` works for a product or a nested bundle.

</details>

### Q2. Where should child-management methods (`add`, `remove`) be declared?

<details>
<summary>Answer</summary>

Two options. On the component interface (transparency): clients treat all nodes the same, but leaves must reject `add`, which violates substitutability. Only on the composite (safety): the type system prevents adding children to leaves, at the cost of clients needing to know when they hold a composite. Most Java designs choose safety.

</details>

### Q3. Give real examples of Composite.

<details>
<summary>Answer</summary>

GUI containers holding components (which may be containers), file systems with directories and files, organisation charts, product bundles, menu hierarchies, arithmetic expression trees, and DOM trees in HTML/XML processing.

</details>

### Q4. Composite vs Decorator?

<details>
<summary>Answer</summary>

Both rely on a shared interface and recursive composition. A decorator wraps exactly one component to add responsibilities while keeping its interface. A composite holds any number of children and combines their results to represent a whole made of parts. They are often used together (decorating nodes of a composite tree).

</details>

## Applied

### Q5. How would you compute the total salary cost of a department that contains employees and sub-departments?

<details>
<summary>Answer</summary>

Define `OrgUnit` with `long totalSalaryCost()`. `Employee` (leaf) returns its salary; `Department` (composite) holds a list of `OrgUnit`s and returns the sum of its children's totals (plus any department-level costs). The finance report calls `headOffice.totalSalaryCost()` without caring about depth. Guard against cycles when adding units.

</details>
