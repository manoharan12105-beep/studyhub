# OOP Interview Questions by Level — Interview Questions

## Beginner

### Q1. In one minute, explain object-oriented programming to an interviewer.

**Style:** Placement-style · Frequently useful

<details>
<summary>Answer</summary>

OOP organises a program as objects that combine data (fields) with the behaviour that works on that data (methods). Classes are the blueprints for objects. Objects hide their data and expose operations, collaborate by calling each other's methods, and can be substituted for each other through common types. The four pillars — encapsulation, abstraction, inheritance and polymorphism — describe how. The benefit is code that is easier to understand, change and extend as systems grow.

</details>

### Q2. Class vs object — give a real example.

**Style:** Placement-style

<details>
<summary>Answer</summary>

A class is the definition; an object is a runtime instance of it. `class BankAccount { private long balance; void deposit(long amt) {...} }` is written once; `new BankAccount()` creates as many accounts as needed, each with its own balance on the heap. A class is like an application form's template; each filled form is an object.

</details>

### Q3. Name and explain the four pillars with one Java example each.

**Style:** Placement-style · Service-company-style

<details>
<summary>Answer</summary>

- **Encapsulation:** private `balance` changed only through `deposit`/`withdraw` that validate input.
- **Abstraction:** a `PaymentMethod` interface with `pay(amount)`; callers do not know if it is UPI or card.
- **Inheritance:** `class SavingsAccount extends Account` reuses and specialises `Account`.
- **Polymorphism:** `Shape s = new Circle(); s.area()` runs `Circle`'s implementation; with `Square`, the same call runs `Square`'s.

</details>

### Q4. How does Java achieve encapsulation?

**Style:** Service-company-style

<details>
<summary>Answer</summary>

Private fields, plus public methods that control access and enforce rules (validation, invariants). Access modifiers (`private`, package-private, `protected`, `public`) control visibility; immutable classes and defensive copies prevent outside code from changing internal state through shared references.

</details>

### Q5. What is inheritance and which type does Java not support for classes?

**Style:** Placement-style

<details>
<summary>Answer</summary>

Inheritance lets a class acquire the accessible members of another with `extends`, modelling an IS-A relationship. Java supports single, multilevel and hierarchical inheritance of classes, but not multiple inheritance of classes (a class has one direct superclass) — it uses interfaces for multiple inheritance of type.

</details>

### Q6. Give an everyday example of polymorphism.

**Style:** Placement-style · Frequently useful

<details>
<summary>Answer</summary>

`List<String> names = new ArrayList<>();` — code that calls `names.add("x")` works the same whether the object is an `ArrayList` or a `LinkedList`; each class provides its own `add`. Overloaded `System.out.println(int)`/`println(String)` is the compile-time form.

</details>

### Q7. What is abstraction, in simple words?

**Style:** Placement-style

<details>
<summary>Answer</summary>

Showing only what an object does and hiding how it does it. A driver uses `accelerate()` and `brake()` without knowing the engine internals; in Java, an interface such as `PaymentGateway.charge(amount)` hides whether the implementation calls a bank API or a wallet.

</details>

## Intermediate

### Q8. Overloading vs overriding — state at least five differences.

**Style:** Service-company-style · Java interview

<details>
<summary>Answer</summary>

1. Overloading: same name, different parameter lists; overriding: same signature in a subclass.
2. Overloading is resolved at compile time (static types of arguments); overriding at runtime (object type).
3. Overloading needs no inheritance; overriding requires it (or an interface).
4. Overloading may change return type, access and exceptions freely; overriding needs the same or covariant return type, same or wider access, and no broader checked exceptions.
5. Static, private and final methods can be overloaded but not overridden.

</details>

### Q9. Abstract class vs interface — when do you choose which?

**Style:** Service-company-style · Backend interview

<details>
<summary>Answer</summary>

An abstract class can hold state, constructors and protected/final methods, and a class can extend only one. An interface defines a contract with no instance state, and a class can implement many. Choose an abstract class for a family of closely related classes sharing state and code (often with a template method); choose an interface for a capability or a contract callers depend on (`Comparable`, `PaymentGateway`). Commonly both: an interface for clients, an abstract base class for implementers.

</details>

### Q10. IS-A vs HAS-A — how do you decide?

**Style:** Placement-style · Frequently useful

<details>
<summary>Answer</summary>

Use IS-A (inheritance) only if the subtype is permanently a kind of the parent and can replace it everywhere (`SavingsAccount` is an `Account`). Use HAS-A (a field) when one object uses or contains another (`Car` has an `Engine`), or when the relationship is a role that can change. When unsure, prefer HAS-A: it is more flexible and less coupled.

</details>

### Q11. Explain association, aggregation and composition with examples.

**Style:** Service-company-style

<details>
<summary>Answer</summary>

Association: objects collaborate without ownership (doctor–patient). Aggregation: a whole groups parts that live independently and may be shared (team–players). Composition: a whole owns parts whose lifetime is bound to it (order–order lines). In UML: plain line, hollow diamond, filled diamond (at the whole).

</details>

### Q12. When is composition better than inheritance?

**Style:** Backend interview · Frequently useful

<details>
<summary>Answer</summary>

When you want to reuse behaviour without a true IS-A relationship, when behaviour should change at runtime, when variation happens along several dimensions (to avoid subclass explosion), and when the base class is not designed for extension (to avoid the fragile base class problem). Composition depends only on the part's interface, keeps encapsulation intact and is easier to test.

</details>

### Q13. `==` vs `equals()` — and what does `equals` do by default?

**Style:** Java interview · Placement-style

<details>
<summary>Answer</summary>

`==` compares primitive values or, for objects, references (same object?). `equals()` compares logical equality as defined by the class. `Object.equals` defaults to `==`; `String`, wrappers, collections and records override it to compare contents. Always compare strings with `equals`.

</details>

### Q14. Why must `hashCode()` be overridden with `equals()`?

**Style:** Java interview · Frequently useful

<details>
<summary>Answer</summary>

Because hash-based collections first use `hashCode` to find a bucket and only then `equals`. If equal objects had different hash codes, `HashSet` could store duplicates and `HashMap.get` with an equal key would miss. The contract: equal objects must have equal hash codes.

</details>

### Q15. Difference between `final`, `finally` and `finalize`?

**Style:** Placement-style · Service-company-style

<details>
<summary>Answer</summary>

`final` is a modifier (no reassignment, no overriding, no subclassing). `finally` is the block of a `try` that always runs for cleanup (except if the JVM exits). `finalize()` is a deprecated `Object` method the GC might call before collection; do not use it — use try-with-resources.

</details>

### Q16. What happens to static members with inheritance?

**Style:** Java interview

<details>
<summary>Answer</summary>

Accessible static members can be used through the subclass, but there is still one copy per declaring class. A static method with the same signature in a subclass hides, not overrides, the parent's; the reference type decides which runs. Static methods cannot use `this` or instance members directly.

</details>

### Q17. In what order do constructors run in a three-level hierarchy?

**Style:** Placement-style · Java interview

<details>
<summary>Answer</summary>

Top-down. `new C()` where `C extends B extends A`: static initialisers of A, B, C run once (first use); then for the object, `A`'s instance initialisers and constructor, then `B`'s, then `C`'s. Each constructor's first action is calling its superclass constructor (explicit `super(...)` or implicit `super()`).

</details>

### Q18. What is upcasting and downcasting? When does downcasting fail?

**Style:** Service-company-style · Java interview

<details>
<summary>Answer</summary>

Upcasting treats a subclass object as its parent type (`Animal a = new Dog();`) — implicit and safe. Downcasting converts back (`Dog d = (Dog) a;`) — explicit and checked at runtime; it throws `ClassCastException` if the object is not actually a `Dog`. The compiler rejects casts between unrelated classes. Use `instanceof` (with pattern matching) before downcasting.

</details>

## Advanced

### Q19. Explain dynamic method dispatch step by step.

**Style:** Product-company-style · Java interview

<details>
<summary>Answer</summary>

At compile time the compiler looks at the reference's declared type, chooses an accessible method signature (resolving overloads by the arguments' static types) and records it. At runtime the JVM takes the object's actual class and searches upward for the method that overrides that signature; that implementation runs. Static, private and `super` calls skip the runtime search.

</details>

### Q20. What is method hiding and how is it different from overriding?

**Style:** Java interview · Advanced interview

<details>
<summary>Answer</summary>

Hiding happens with static methods (and fields): a subclass declares a member with the same name, and the reference type at compile time decides which is used. Overriding applies to instance methods and is decided by the object's runtime type. `Parent p = new Child(); p.staticM()` → `Parent.staticM()`; `p.instanceM()` → `Child.instanceM()`.

</details>

### Q21. Static vs dynamic binding — which members bind statically?

**Style:** Java interview

<details>
<summary>Answer</summary>

Statically: overload selection, static methods, private methods, constructors, `super.method()` calls and field access. Dynamically: overridable instance methods. Static binding uses declared types; dynamic binding uses the object's class.

</details>

### Q22. What are covariant return types?

**Style:** Java interview

<details>
<summary>Answer</summary>

An overriding method may return a subtype of the overridden method's return type: `Document copy()` in the parent and `Invoice copy()` in `Invoice extends Document`. Callers through the parent type still get a `Document`; callers through `Invoice` get an `Invoice` without casting. It applies to reference types only.

</details>

### Q23. Explain the Liskov Substitution Principle with an example of a violation.

**Style:** Product-company-style · Backend interview

<details>
<summary>Answer</summary>

Subtypes must be usable wherever their base type is expected without breaking correctness. Violation: `FixedDepositAccount extends Account` overriding `withdraw` to throw — any code processing `Account`s breaks. Another: a mutable `Square extends Rectangle` whose `setWidth` also changes the height. Fix by reshaping abstractions (a `WithdrawableAccount` interface; immutable shapes sharing only `Shape`).

</details>

### Q24. What is the Dependency Inversion Principle, and how is it different from dependency injection?

**Style:** Backend interview

<details>
<summary>Answer</summary>

DIP: high-level policy and low-level details should both depend on abstractions, and the abstraction belongs to the policy (`OrderService` owns `OrderRepository`; the JPA class implements it). Dependency injection is a technique for supplying an object's dependencies from outside (usually via the constructor). DI is the common way to implement DIP; Spring automates DI.

</details>

### Q25. How do you design a truly immutable class?

**Style:** Java interview · Frequently useful

<details>
<summary>Answer</summary>

Make the class `final`, all fields `private final`, provide no setters, validate everything in the constructor, defensively copy mutable inputs (`List.copyOf`), never return mutable internals, do not let `this` escape the constructor, and return new instances for "changes". Records cover most of this; mutable components still need copying.

</details>

### Q26. Which design patterns have you used, and why?

**Style:** Backend interview · Product-company-style

<details>
<summary>Answer</summary>

Answer with real problems, not a list. For example: "Strategy for delivery-fee rules that differ by city — new rules are new classes; Adapter to wrap an SMS vendor SDK behind our `SmsSender` interface; Builder for immutable request objects with many optional fields; Observer (Spring events) so order shipping did not depend on notifications." Mention a trade-off for each.

</details>

### Q27. Why is constructor injection preferred over field injection?

**Style:** Backend interview

<details>
<summary>Answer</summary>

Dependencies are explicit in the constructor, fields can be `final`, the object is complete after construction, unit tests can call the constructor with fakes without a container, and circular dependencies fail fast. Field injection hides dependencies and needs reflection.

</details>

### Q28. What are the problems with deep inheritance hierarchies, and what do you do instead?

**Style:** Product-company-style

<details>
<summary>Answer</summary>

Behaviour is spread across many levels, changes ripple downward, fragile base classes and LSP violations multiply, and combining features causes class explosions. Prefer shallow hierarchies, interfaces for types, and composition (strategies, decorators) for varying behaviour.

</details>

### Q29. How do equals/hashCode behave for JPA-style entities loaded twice?

**Style:** Backend interview · Advanced interview

<details>
<summary>Answer</summary>

Two loads produce two distinct objects for the same row, so identity-based `equals` treats them as different. Base `equals`/`hashCode` on a stable identifier (a business key or id), ensuring the value does not change while the object is in a hash-based collection; be careful with ids generated only on save.

</details>

### Q30. How do you make a class thread-safe from an OOP-design perspective?

**Style:** Advanced interview · Backend interview

<details>
<summary>Answer</summary>

Minimise shared mutable state: prefer immutability and thread confinement; encapsulate any shared mutable state behind methods that coordinate access with a single (preferably private) lock or delegate to concurrent utilities; put compound actions inside the class; never leak internal mutable objects; and remember that composing thread-safe parts does not make an invariant across them thread-safe.

</details>
