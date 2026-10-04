# Composition over Inheritance — Interview Questions

## Conceptual

### Q1. What does "favour composition over inheritance" mean?

<details>
<summary>Answer</summary>

When you want to reuse or vary behaviour, prefer giving a class a field of another type and delegating to it (HAS-A) over extending a class (IS-A). Composition couples you only to the part's public interface, allows the part to be swapped at runtime, and avoids class explosions. Inheritance is kept for genuine IS-A relationships with base classes designed for extension.

</details>

### Q2. Why is composition often preferred over inheritance?

<details>
<summary>Answer</summary>

- **Encapsulation:** the subclass in inheritance depends on superclass internals (fragile base class); composition uses only the public contract.
- **Flexibility:** composed parts can change at runtime; a superclass is fixed at compile time.
- **No unwanted API:** a subclass inherits every public method; a composing class exposes only what it chooses.
- **Combinations:** independent variations combine without multiplying subclasses.
- **Testability:** parts can be replaced with fakes.

</details>

### Q3. What is delegation?

<details>
<summary>Answer</summary>

Delegation is an object handing a request to another object it holds, optionally adding work before or after: `inbox.receive(msg)` checks for spam and then calls `delegate.receive(msg)`. It is how composition achieves reuse, and it is the mechanism behind Decorator, Proxy, Strategy and State.

</details>

### Q4. If composition is preferred, when would you still use inheritance?

<details>
<summary>Answer</summary>

When the subtype is truly and permanently a kind of the supertype and honours its whole contract (Liskov substitution), when the base class is designed for extension (abstract skeletal classes, framework hooks, template methods), and when the hierarchy is small and controlled by one team. Exception hierarchies and sealed variant hierarchies are good examples.

</details>

### Q5. Does composition lose polymorphism?

<details>
<summary>Answer</summary>

Not if it is combined with interfaces. Both the composed parts and the wrapper can implement interfaces: `SpamFilteringInbox implements Inbox` and holds an `Inbox`. Callers use the interface type and get runtime polymorphism without class inheritance.

</details>

## Applied

### Q6. A team wants `class AuditedList<E> extends ArrayList<E>` that logs every addition. What would you recommend?

<details>
<summary>Answer</summary>

Avoid extending `ArrayList`: its `addAll`, `add(int, E)` and other methods may or may not route through `add(E)`, and that is an implementation detail that can change, so logging could miss or double-count additions. Instead implement `List<E>` (or a narrower interface the callers actually need) by wrapping a `List<E>` and forwarding each method, logging in the mutating methods. The wrapper then works with any list implementation and is immune to `ArrayList` internals.

</details>

### Q7. A game has `Warrior`, `Archer`, `Mage`, and now needs warriors that can also cast spells and archers that can melee. The hierarchy is getting complicated. How would you redesign it?

<details>
<summary>Answer</summary>

Abilities are combinations, not a hierarchy. Model a `GameCharacter` that has a collection of `Ability` objects (an interface with `use(target)`), such as `MeleeAttack`, `RangedAttack`, `SpellCast`. Character "classes" become configurations (a factory or builder assembling abilities), and abilities can be gained or lost at runtime. This removes the need for `SpellcastingWarrior`-style subclasses.

</details>
