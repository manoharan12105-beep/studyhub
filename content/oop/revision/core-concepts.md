# Core Concepts

The ideas behind every OOP topic, condensed. Comparisons are in Comparison Tables; Java's exact rules in Java Rules; principles and patterns in their own sections.

## Objects and Classes

- **Object** = state (fields) + behaviour (methods) + identity. **Class** = the blueprint. **Reference** = a handle to an object; `b = a` copies the reference, not the object.
- Java passes **everything by value**; for objects, the value is the reference — a method can mutate the caller's object but not rebind the caller's variable.
- `new` allocates on the heap, defaults all fields (`0`, `false`, `null`), runs constructors top-down, returns a reference. Locals get no defaults.
- **Static** members belong to the class (one copy, no `this`); instance members belong to each object.
- Objects become eligible for GC when unreachable from GC roots (locals of live frames, static fields) — cycles included. Leaks are reachable-but-unneeded objects.

## The Four Pillars

- **Encapsulation:** private state + behaviour that keeps it valid. Validate in constructors and mutators; copy mutable inputs/outputs; prefer intention-revealing methods over setters.
- **Abstraction:** expose *what*, hide *how* — interfaces, abstract classes, simple public methods. Abstraction hides complexity; encapsulation protects state.
- **Inheritance:** IS-A; reuse + substitutability. Constructors not inherited; private members not inherited (but present); single class inheritance; risk: fragile base class.
- **Polymorphism:** compile-time (overloading, by static argument types) and runtime (overriding + dynamic dispatch, by object type).

## How Java Resolves a Call

1. Compiler: search the **reference's declared type**, pick the overload by **declared argument types** (exact/widening → boxing → varargs → most specific), record the signature.
2. Runtime: static/private/`super` calls run exactly that method; other instance methods are looked up from the **object's class** upward; classes beat interface defaults.
3. Fields and static methods never dispatch on the object.

## Relationships

- **Association** (uses/knows), **aggregation** (weak HAS-A, independent lifecycle, shareable), **composition** (strong HAS-A, exclusive, lifetime bound), **dependency** (temporary use).
- Decide by lifecycle, sharing and identity in *your* domain. Prefer HAS-A unless IS-A is permanent and substitutable.

## The Java Object Model

- Every class extends `Object`: `equals`, `hashCode`, `toString`, `getClass`, `clone`, `wait/notify`.
- `==` = identity for references; `equals` = logical equality if overridden. Equal objects must have equal hash codes.
- Hash collections: `hashCode` picks the bucket, `equals` confirms. Never mutate key fields while inside.
- Sorted collections use `compareTo`/`Comparator`; `compare == 0` means duplicate.

## Immutability

- State cannot change after construction; "changes" return new objects. Gains: thread safety, safe sharing, stable hash codes, simpler reasoning.
- Recipe: final class, private final fields, no setters, validate in constructor, defensive copies, no `this` escape, withers.
- `final` reference ≠ immutable object; unmodifiable view ≠ copy; records are shallowly immutable.

## Modern Java OOP

- **Enums:** fixed singleton instances with fields, constructors, methods; can implement interfaces.
- **Records:** immutable carriers with generated constructor, accessors, `equals`/`hashCode`/`toString`; compact constructor for validation/copies.
- **Sealed types:** `permits` a fixed set of subtypes, each `final`, `sealed` or `non-sealed`; enables exhaustive handling.
- **Nested classes:** static nested (default choice), inner (needs outer instance; `Outer.this`; may leak outer), local, anonymous (one-off; `this` = anonymous object, unlike lambdas).

## OOP with the Java Platform

- **Collections:** lists use `equals`; hash sets/maps use `hashCode` + `equals`; sorted ones use ordering. `Comparable` = natural order inside the class; `Comparator` = external strategies.
- **Generics:** type-safe reuse; bounds (`T extends X`); wildcards with PECS (producer `extends`, consumer `super`); invariance; erasure limits.
- **Exceptions:** objects in a hierarchy; checked (must handle/declare) vs unchecked (`RuntimeException`); translate at boundaries and keep the cause.
- **Threads:** shared + mutable + uncoordinated = bugs; prefer confinement and immutability; encapsulate locks; compound actions inside the owning class.
- **Testing:** inject interfaces (and `Clock`) so collaborators can be faked; immutable values need no setup.

## Design

- **SOLID:** S one reason to change · O extend without modifying · L subtypes keep the contract · I small client-specific interfaces · D depend on abstractions owned by the policy.
- **Low coupling, high cohesion** — interfaces, injection, composition and encapsulation are the tools.
- **DI** supplies dependencies from outside (constructor first); **IoC** lets a framework drive creation and flow.
- **Designing classes:** requirements → entities → responsibilities (to the data owner) → relationships → abstractions where things vary or cross boundaries → check principles → scenarios.
