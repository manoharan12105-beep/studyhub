# Liskov Substitution Principle — Interview Questions

## Conceptual

### Q1. What is the Liskov Substitution Principle?

<details>
<summary>Answer</summary>

Objects of a subtype must be substitutable for objects of their base type without breaking the program's correctness. Any code written against the base type should work unchanged with every subtype. Concretely, a subtype must not strengthen preconditions, weaken postconditions, break invariants, or throw exceptions the base contract does not allow.

</details>

### Q2. Explain the Rectangle–Square problem.

<details>
<summary>Answer</summary>

If `Square extends Rectangle` and overrides `setWidth`/`setHeight` to keep both sides equal, code written for rectangles — "set width 10, height 2, expect area 20" — gets area 4 for a square. The subclass weakened the base's postcondition that setting one dimension leaves the other unchanged. Mathematically a square is a rectangle, but a mutable square object cannot honour a mutable rectangle's contract. Fixes: make shapes immutable and share only a `Shape` abstraction with `area()`, or do not relate them by inheritance.

</details>

### Q3. How can you detect an LSP violation in code?

<details>
<summary>Answer</summary>

Overrides that throw `UnsupportedOperationException` or do nothing; clients with `instanceof` checks to special-case a subtype; subclasses with extra input restrictions; documentation warning not to call some inherited method on a subtype; and contract tests written for the base type failing for a particular implementation.

</details>

### Q4. Why is LSP important for the Open/Closed Principle?

<details>
<summary>Answer</summary>

OCP lets you add behaviour by adding new subtypes that existing code uses through an abstraction. If a new subtype violates the abstraction's contract, the existing code must be modified to handle it specially — which is exactly what OCP tried to avoid. LSP is what makes extension through polymorphism safe.

</details>

### Q5. Does the Java compiler enforce LSP?

<details>
<summary>Answer</summary>

Only its syntactic part: overrides must have compatible signatures, covariant return types, no reduced visibility and no broader checked exceptions. The behavioural part — preconditions, postconditions, invariants, unchecked exceptions, side effects — cannot be checked by the compiler and must be ensured by design, documentation and contract tests.

</details>

### Q6. Can a subtype accept more inputs or guarantee more than the base type?

<details>
<summary>Answer</summary>

Yes. Weakening preconditions (accepting more) and strengthening postconditions (guaranteeing more) are both safe: any caller that satisfied the base's requirements is still satisfied. Only the opposite directions break substitution.

</details>

## Applied

### Q7. A `Bird` class has `fly()`. You need to add `Penguin`. What do you do?

<details>
<summary>Answer</summary>

Making `Penguin` extend `Bird` and throw from `fly()` violates LSP: code that makes all birds fly would crash. Reshape the abstraction around capabilities: `Bird` (common behaviour such as `eat`, `layEggs`) plus an interface `FlyingBird` (or `Flyer`) with `fly()`, implemented by `Sparrow` but not `Penguin`. Code that needs flight asks for a `FlyingBird`, so the compiler prevents the bad substitution.

</details>

### Q8. Scenario: an `InMemoryUserRepository` used in tests returns the same mutable object on every `findById`, while the real database repository returns a fresh copy. Tests pass, production fails. Which principle is involved?

<details>
<summary>Answer</summary>

LSP. Both classes implement `UserRepository`, but the fake does not honour the same behavioural contract (independent copies on each read), so code tested against it is not tested against the real contract. Define the contract explicitly and run the same contract test suite against both implementations; fix the fake to return copies.

</details>

### Q9. Does `Collections.unmodifiableList` (or `List.of`) violate LSP because `add` throws?

<details>
<summary>Answer</summary>

Formally no: the `List` interface documents `add` as an optional operation that may throw `UnsupportedOperationException`, so throwing is within the contract. But the weak contract is a design trade-off: code receiving a `List` cannot know whether it is modifiable, so failures surface at runtime. Many developers treat this as an example of how optional operations weaken substitutability; in your own designs, prefer separate read-only and mutable interfaces.

</details>
