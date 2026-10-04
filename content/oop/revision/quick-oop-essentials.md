# OOP Essentials

The must-know facts, one line each.

## Four Pillars

- **Encapsulation** — private data + methods that keep it valid.
- **Abstraction** — expose what, hide how (interfaces, abstract classes).
- **Inheritance** — IS-A with `extends`; one superclass; constructors and private members not inherited.
- **Polymorphism** — overloading (compile time, by argument types) and overriding (runtime, by object type).

## Overloading vs Overriding

- Overloading: different parameters, any return type, resolved at compile time.
- Overriding: same signature, same/covariant return, same/wider access, no broader checked exceptions, resolved at runtime.
- static → hidden · private → not inherited · final → cannot override · constructors → never overridden.

## Reference Type vs Object Type

- Reference type decides **what compiles** and **which overload**.
- Object type decides **which override runs**.
- Fields and static methods follow the reference type.

## Upcasting / Downcasting

- Upcast: implicit, always safe, object unchanged.
- Downcast: explicit; compiler checks "possible", JVM checks "true" → `ClassCastException`.
- `instanceof` first; `null instanceof X` is false.

## equals / hashCode

- `==` identity; `equals` value (if overridden).
- Equal objects ⇒ equal hash codes; override both with the same fields.
- Hash collections: hashCode → bucket, equals → match. Do not mutate keys.

## Access Modifiers

- `private` < package-private < `protected` < `public`.
- `protected` = package + subclasses elsewhere. Top-level classes: public or package-private.

## Inheritance Rules

- Constructor order top-down; `super(...)`/`this(...)` first; implicit `super()`.
- Default constructor only if none declared.
- No multiple class inheritance; many interfaces.

## Interface Rules

- Fields `public static final`; methods abstract, default, static, private.
- Default conflict: class wins → more specific interface → else override.
- Functional interface = one abstract method → lambdas.

## Abstract Class Rules

- Cannot instantiate; may have constructors, state, zero abstract methods.
- Abstract method: no body, not private/static/final.

## Relationships

- Association (uses) · Aggregation ◇ (independent parts) · Composition ◆ (owned parts) · Dependency (temporary).
- Prefer HAS-A unless IS-A is permanent and substitutable.

## Immutability

- final class, private final fields, no setters, validate, copy mutables, withers.
- `final` reference ≠ immutable object.
