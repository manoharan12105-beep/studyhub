# "Why?" Questions in OOP — Interview Questions

## Beginner

### Q1. Why do we need encapsulation at all?

**Style:** Placement-style · Frequently useful

<details>
<summary>Answer</summary>

Without it, any code can put an object into an invalid state (a negative balance, an end date before the start), and every caller must remember every rule. Encapsulation keeps data private and changes it only through methods that enforce the rules, so invariants hold everywhere and the internal representation can change without affecting callers.

</details>

### Q2. Why do we need interfaces?

**Style:** Placement-style · Backend interview

<details>
<summary>Answer</summary>

To let code depend on **what** something does rather than **which class** does it. A checkout that depends on `PaymentGateway` works with any provider and with a fake in tests; a class can play several roles (`Comparable`, `AutoCloseable`); and Java gets multiple inheritance of type without the diamond problems of multiple class inheritance.

</details>

### Q3. Why use abstract classes when interfaces exist?

**Style:** Service-company-style

<details>
<summary>Answer</summary>

Interfaces cannot hold instance state or constructors. When closely related classes share fields and code — and you want to enforce a fixed algorithm with `final` template methods and `protected` hooks — an abstract class removes duplication and guarantees initialisation through its constructor. Often an interface defines the type and an abstract class provides a skeletal implementation.

</details>

### Q4. Why does Java not support multiple inheritance of classes?

**Style:** Placement-style · Frequently useful

<details>
<summary>Answer</summary>

To avoid the diamond problem: if a class had two parents that both inherit and override a method from a common ancestor, it would be ambiguous which implementation to use, whether the object holds one or two copies of the ancestor's fields, and how constructors chain. Restricting classes to one parent keeps object layout and method lookup simple; interfaces (no instance state, explicit default-method conflict rules) provide multiple inheritance of type safely.

</details>

## Intermediate

### Q5. Why is composition often preferred over inheritance?

**Style:** Backend interview · Frequently useful

<details>
<summary>Answer</summary>

Inheritance couples a subclass to its parent's implementation (fragile base class), exposes every inherited method, is fixed at compile time and multiplies classes when behaviour varies along several dimensions. Composition depends only on the part's public interface, can change parts at runtime, combines variations additively, and is easier to test. Inheritance remains right for genuine, stable IS-A hierarchies designed for extension.

</details>

### Q6. Why must `equals()` and `hashCode()` be consistent?

**Style:** Java interview · Frequently useful

<details>
<summary>Answer</summary>

Hash-based collections use `hashCode` to pick a bucket and `equals` to confirm a match. If two equal objects had different hash codes, a `HashMap` lookup with an equal key would search the wrong bucket and miss, and a `HashSet` would store "duplicates". Hence the contract: equal objects must have equal hash codes.

</details>

### Q7. Why can't static methods be overridden?

**Style:** Java interview

<details>
<summary>Answer</summary>

Overriding relies on dynamic dispatch: the JVM chooses the implementation from the runtime object. A static method belongs to the class and is not invoked on an object, so there is no object to dispatch on — the call is bound at compile time to the declared type. A same-signature static method in a subclass therefore only hides the parent's.

</details>

### Q8. Why can't private methods be overridden?

**Style:** Java interview

<details>
<summary>Answer</summary>

A private method is not visible outside its class, so subclasses do not inherit it and cannot refer to it; a same-named method in a subclass is unrelated. This protects the parent's internal behaviour: code in the parent that calls its private helper can rely on exactly that helper running.

</details>

### Q9. Why are immutable objects useful?

**Style:** Java interview · Backend interview

<details>
<summary>Answer</summary>

They cannot change after construction, so they are thread-safe without locks, safe to share and cache, reliable as map keys (hash codes never change), validated once in the constructor, and free from aliasing surprises when passed around. The trade-off is creating new objects for each change (mitigated with builders or mutable companions like `StringBuilder`).

</details>

### Q10. Why is constructor injection preferred?

**Style:** Backend interview

<details>
<summary>Answer</summary>

Required dependencies are visible in the constructor and enforced at creation, so no half-initialised objects exist; fields can be `final` (immutable, thread-safe); unit tests can construct the class with fakes without a framework; and a long constructor exposes a class with too many responsibilities. Field injection hides dependencies and needs reflection.

</details>

### Q11. Why should overriding methods not throw broader checked exceptions?

**Style:** Java interview

<details>
<summary>Answer</summary>

Callers written against the parent type handle only the exceptions the parent declares. If a subclass could throw a new or broader checked exception, a caller using a parent reference would receive an exception it never had to handle — breaking substitutability. So overrides may throw the same, narrower or no checked exceptions.

</details>

### Q12. Why should you not call overridable methods from a constructor?

**Style:** Java interview · Advanced interview

<details>
<summary>Answer</summary>

The superclass constructor runs before subclass fields are initialised, but method calls are still dynamically dispatched. The subclass override then runs on a half-built object, seeing default values (`null`, `0`), which causes wrong results or `NullPointerException`s. Call only private, final or static methods from constructors.

</details>

## Advanced

### Q13. Why is the Liskov Substitution Principle important?

**Style:** Product-company-style · Backend interview

<details>
<summary>Answer</summary>

Polymorphic code works only if every subtype honours its base type's contract. If a subtype throws where the base promises to work, or changes behaviour callers rely on, every caller needs `instanceof` special cases, OCP breaks (new subtypes force edits), and bugs appear far from their cause. LSP is what makes extension through inheritance or interfaces safe.

</details>

### Q14. Why use design patterns?

**Style:** Backend interview

<details>
<summary>Answer</summary>

They are proven solutions to recurring design problems with known trade-offs, they give teams a shared vocabulary ("wrap it in a decorator"), and they encode principles — program to interfaces, prefer composition, encapsulate what varies — in reusable forms. They also make frameworks easier to understand because frameworks use them.

</details>

### Q15. Why can design patterns become overengineering?

**Style:** Product-company-style

<details>
<summary>Answer</summary>

Each pattern adds classes and indirection. When the problem it solves is absent — a factory with one product, a strategy with one algorithm, an abstract factory with one family — the cost remains without the benefit, and speculative extension points often anticipate the wrong change. Apply patterns when the problem appears, often by refactoring toward them.

</details>

### Q16. Why does Java dispatch only on the receiver and not on argument types?

**Style:** Advanced interview

<details>
<summary>Answer</summary>

Overload resolution is done at compile time from declared types, which keeps method selection predictable and checkable (including ambiguity errors) and keeps runtime dispatch cheap (one lookup on the receiver's class). Choosing by runtime types of several arguments (multiple dispatch) would need a runtime search on every call. When needed, double dispatch is emulated with patterns such as Visitor, or with pattern matching over sealed types.

</details>

### Q17. Why prefer depending on abstractions at system boundaries (database, external APIs)?

**Style:** Backend interview

<details>
<summary>Answer</summary>

Boundaries change for technical reasons (new vendor, new database, API versions) and are slow or unreliable in tests. Depending on an abstraction owned by the business code isolates those changes into one adapter class and lets tests use fast fakes. This is the Dependency Inversion Principle where it pays off most.

</details>
