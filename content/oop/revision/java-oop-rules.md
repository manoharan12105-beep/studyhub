# Java Rules

The exact language rules behind OOP questions, grouped by feature. Concepts are in Core Concepts; this section is the checklist the compiler and JVM enforce.

## Constructors and Initialisation

- Name = class name, **no return type** (`void Foo()` is a method). Not inherited, not overridable; may be overloaded and `private`.
- Default (no-arg) constructor only if the class declares **no** constructor.
- `this(...)` or `super(...)` must be the **first** statement; only one of them; otherwise `super()` is inserted (compile error if the parent has no accessible no-arg constructor).
- Arguments to `this(...)`/`super(...)` cannot use instance members of the object being built.
- Order for `new Child()` (first use): parent static → child static → parent instance initialisers + constructor → child instance initialisers + constructor. Static parts run once.
- Field initialisers and instance blocks run in textual order, right after `super(...)`.
- A virtual call inside a superclass constructor reaches the subclass override on a half-built object.

## Access Modifiers

| Modifier | Class | Package | Subclass (other package) | World |
|----------|-------|---------|--------------------------|-------|
| `private` | ✓ | | | |
| package-private | ✓ | ✓ | | |
| `protected` | ✓ | ✓ | ✓ (via subclass-typed references) | |
| `public` | ✓ | ✓ | ✓ | ✓ |

- Top-level types: only `public` or package-private.
- Interface methods are implicitly `public` (or explicitly `private`); implementations must be `public`.

## Inheritance

- One direct superclass; any number of interfaces. Every class extends `Object`.
- Private members and constructors are not inherited; package-private members only within the package.
- Fields with the same name are **hidden**, chosen by reference type.
- `super.method()` reaches only one level up; no `super.super`.
- `final class` cannot be extended; `abstract final` is illegal.

## Overriding

- Same name and parameter types; return type same or a **subtype** (reference types only).
- Access same or **wider**; checked exceptions same, narrower, fewer or none.
- Cannot override `final`, `static` (hiding instead), or `private` (invisible) methods; static ↔ instance mixing is a compile error.
- Use `@Override`; `equals(MyType)` is an overload, not an override.

## Overloading

- Same name, different parameter lists; return type, names, access or `throws` alone do not distinguish.
- Resolution phases: exact/widening → boxing/unboxing → varargs; then most specific; else ambiguous (compile error).
- Widening beats boxing beats varargs; no narrowing in calls (`m(byte)` rejects `5`); `int` boxes only to `Integer`.
- `null` matches the most specific reference overload; unrelated types (`String` vs `StringBuilder`) → ambiguous.
- Only overloads visible in the reference type are candidates.

## Static

- One copy per class; no `this`/`super`; cannot use instance members directly.
- Static methods are hidden, bound by reference type; calling one through a `null` reference does not throw.
- `static` allowed on fields, methods, blocks, nested types — not top-level classes, constructors or locals.

## final

- Variable: assign once (blank finals must be assigned on every constructor path).
- Method: no overriding (still inherited, still overloadable).
- Class: no subclassing.
- Lambdas and local/anonymous classes capture only final or effectively final locals.

## Abstract Classes and Interfaces

- Abstract class: cannot be instantiated; may have constructors, state, zero abstract methods.
- Abstract methods: no body; not `private`, `static` or `final`.
- Concrete subclass must implement all abstract methods.
- Interface fields: `public static final`. Methods: abstract, `default`, `static` (not inherited by implementers), `private` (Java 9).
- Default conflicts: class wins → more specific interface wins → otherwise override (call `X.super.m()`).
- Functional interface: exactly one abstract method (public `Object` methods do not count).

## Casting and Types

- Upcast implicit; downcast explicit, checked at runtime (`ClassCastException`).
- Cast between unrelated classes, or from a `final` class to an interface it does not implement → compile error.
- `null instanceof X` is `false`; `instanceof` with pattern binding (Java 16) scopes the variable to where the test is true.
- Arrays are covariant (`ArrayStoreException`); generics are invariant.

## Object Methods

- `getClass`, `wait`, `notify`, `notifyAll` are `final`; `clone` and `finalize` are `protected`; `finalize` is deprecated.
- `clone()` needs `Cloneable`, is shallow, skips constructors.
- `Integer` caches −128…127 by default; compare wrappers with `equals`.

## Exceptions

- Checked: `Exception` except `RuntimeException` subclasses — handle or declare.
- Catch order: specific before general (otherwise unreachable-code compile error); multi-catch alternatives cannot be related.
- `finally` runs after `return` values are computed; `return` in `finally` swallows exceptions.
- try-with-resources closes in reverse order; close failures become suppressed exceptions.

## Records, Enums, Sealed

- Records: implicitly `final`; components → `private final` fields + accessors `x()`; no extra instance fields; compact constructor runs before field assignment.
- Enums: implicitly extend `Enum`; constructors private; can implement interfaces; `values()`, `valueOf()`, `ordinal()`.
- Sealed: permitted subclasses must be `final`, `sealed` or `non-sealed`, in the same module/package.
