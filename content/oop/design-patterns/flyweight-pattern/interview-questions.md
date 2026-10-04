# Flyweight — Interview Questions

## Conceptual

### Q1. What is the Flyweight pattern?

<details>
<summary>Answer</summary>

A structural pattern that reduces memory by sharing objects. State common to many objects (intrinsic) is stored once in immutable shared flyweights obtained from a factory; state unique to each use (extrinsic) is stored separately or passed in. Thousands of seats can share four seat-category objects.

</details>

### Q2. What is the difference between intrinsic and extrinsic state?

<details>
<summary>Answer</summary>

Intrinsic state is independent of context and can be shared — a character's glyph shape, a seat category's price and colour. Extrinsic state depends on context and differs per use — the character's position in the document, the seat's row and number. Only intrinsic state lives in the flyweight.

</details>

### Q3. Where does Java use Flyweight?

<details>
<summary>Answer</summary>

`Integer.valueOf` (and other wrapper `valueOf` methods) return cached instances for small values; string literals are shared through the string pool and `String.intern()`; `Boolean.TRUE`/`FALSE` and enum constants are shared instances.

</details>

### Q4. Why must flyweights be immutable?

<details>
<summary>Answer</summary>

They are shared by many contexts. If one context could modify a flyweight, the change would appear in every other context using it, and concurrent modification would cause thread-safety problems. Immutable flyweights are safe to share across objects and threads.

</details>
