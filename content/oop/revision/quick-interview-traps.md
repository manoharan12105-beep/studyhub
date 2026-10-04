# Last-Minute Traps

Say these precisely.

## Say It Precisely

- Constructors are **not inherited** and **not overridden**.
- Static methods are **hidden**, not overridden.
- Private methods are **not overridden** (not even inherited).
- Final methods **are inherited**, cannot be overridden.
- A `final` reference does **not** make the object immutable.
- `==` compares **references**; use `equals` for values.
- `equals` **without** `hashCode` breaks `HashMap`/`HashSet`.
- `hashCode` **without** `equals` still treats equal-looking objects as different.
- Overloading is resolved at **compile time** (declared argument types).
- Overriding is resolved at **runtime** (object type).
- Reference type decides what **compiles**; object type decides which override **runs**.
- Fields are **not polymorphic**.
- Upcasting is implicit and safe; downcasting can throw **`ClassCastException`**.
- Java has no multiple inheritance of **classes**; it has multiple inheritance of **type** (interfaces).
- Interfaces **can** have method bodies (default, static, private).
- An abstract class **can** have zero abstract methods and **can** have constructors.
- A class can implement **many** interfaces.
- Composition is HAS-A delegation, **not** inheritance.
- Singleton = global state: hidden dependencies, hard to test — **inject** a single instance instead.
- Superclass constructors calling overridden methods see **uninitialised** subclass fields.

## Quick Checks Before Answering an Output Question

1. Declared types of receiver and arguments?
2. Which overloads are visible in the declared type?
3. Static / private / `super` call? → bound at compile time.
4. Otherwise → object's class decides.
5. Constructors: top-down; field initialisers after `super(...)`.
6. Exception paths: which `catch` first? `finally` always (unless JVM exits).

## Process for Design Questions

- Clarify → entities → responsibilities → relationships → abstractions → principles → trade-offs.
- Justify every interface or pattern with a real variation or boundary.
- Mention concurrency where shared resources exist (last seat, last spot, account balance).
