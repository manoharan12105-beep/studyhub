# Common Mistakes

Mistakes that appear in code and in interview answers, each with the correction. Precise one-line wording for traps is in Quick Revision.

## Class Design

| Mistake | Correction |
|---------|------------|
| Public fields or a getter + setter for every field | Private state; intention-revealing methods; setters only where justified |
| Returning an internal mutable list or storing the caller's list | `List.copyOf` in and out, or unmodifiable views |
| Validation left to callers | Validate in constructors and mutators |
| All rules in "service" classes; entities as data bags | Put behaviour with the data it uses (avoid the anaemic model) |
| One huge `Manager`/`Utils` class | Split by responsibility; group helpers by concept |
| Boolean flags selecting behaviour | Separate methods, enums or strategies |
| Long lists of primitive parameters | Value objects and parameter objects |

## Inheritance and Polymorphism

| Mistake | Correction |
|---------|------------|
| Inheriting to reuse code (`Stack extends ArrayList`) | Compose and delegate |
| Subclass overrides a method only to throw or do nothing | Reshape the hierarchy (LSP); role interfaces |
| Calling overridable methods from a constructor | Only private/final/static calls in constructors |
| Same-named field in a subclass expecting polymorphism | Fields are hidden; use methods |
| `equals(MyType other)` without `@Override` | `public boolean equals(Object o)` + `hashCode` |
| Static method "overriding" | It is hiding; bound by reference type |
| `instanceof` chains to choose behaviour | Move behaviour into the types |
| Frequent downcasting | Usually a missing method in the abstraction |

## Equality, Collections, Generics

| Mistake | Correction |
|---------|------------|
| `==` on strings or wrappers | `equals` / `Objects.equals` |
| Overriding only `equals` or only `hashCode` | Override both, same fields |
| Mutating fields used as hash/sort keys | Immutable keys; remove → change → re-add |
| Comparator returning 0 for distinct items in a `TreeSet`/`TreeMap` | Add tie-breakers |
| `a - b` in comparators | `Integer.compare` / `Comparator.comparingInt` |
| `list.remove(1)` on `List<Integer>` expecting value removal | `remove(Integer.valueOf(1))` |
| Assigning `List<Integer>` to `List<Number>` | `List<? extends Number>` (PECS) |
| Modifying a list inside for-each | `Iterator.remove()` / `removeIf` |

## Immutability and Concurrency

| Mistake | Correction |
|---------|------------|
| Thinking `final` makes an object immutable | `final` fixes the reference only |
| Records with mutable components assumed immutable | Copy in the compact constructor |
| Mutable request data in singleton services | Keep services stateless; pass data as parameters |
| Synchronised methods but leaked internal objects | Return snapshots; keep locks private |
| Check-then-act from outside a thread-safe class | Atomic methods inside the owner (`merge`, `computeIfAbsent`) |
| Double-checked locking without `volatile` | Add `volatile` or use the holder idiom / enum |

## Exceptions

| Mistake | Correction |
|---------|------------|
| `catch (Exception e) { }` | Catch what you can handle; let the rest propagate |
| Wrapping without the cause | `new DomainException("msg", e)` |
| Leaking vendor/SQL exceptions from services | Translate at the boundary |
| Overrides adding checked exceptions | Not allowed; design abstraction-level exceptions |
| `return` in `finally` | Never — it swallows exceptions |

## Design Principles and Patterns

| Mistake | Correction |
|---------|------------|
| Interfaces and factories for things that never vary | YAGNI; abstract at real variation points and boundaries |
| Choosing a pattern first, then the problem | Start from the problem |
| Singleton for convenient global access | One instance, injected |
| `new` of infrastructure inside business logic | Depend on injected abstractions (DIP) |
| Field injection | Constructor injection |
| Mixing up Strategy/State, Decorator/Proxy, Adapter/Facade | Compare by intent, not structure |
| Over-splitting classes "for SRP" | Keep together what changes together |
