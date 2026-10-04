# Comparison Tables

Side-by-side references for the comparisons interviewers ask most. Each table keeps only the differences that matter.

## Class vs Object

| | Class | Object |
|--|-------|--------|
| What | Blueprint (type definition) | Runtime instance |
| Count | One per class | Any number |
| Memory | Class metadata, loaded once | Heap, one per instance |
| Example | `Student` | `new Student("Asha")` |

## Encapsulation vs Abstraction

| | Encapsulation | Abstraction |
|--|---------------|-------------|
| Hides | Data / state | Complexity / implementation |
| Question | Who may change this? | What does the caller need to know? |
| Tools | `private`, access modifiers, defensive copies | Interfaces, abstract classes, simple APIs |
| Level | Implementation inside a class | Design of the contract |

## Overloading vs Overriding

| | Overloading | Overriding |
|--|-------------|------------|
| Signature | Different parameters | Same parameters |
| Resolved | Compile time | Runtime |
| Inheritance needed | No | Yes |
| Return type | Free | Same or covariant |
| Access | Free | Same or wider |
| Checked exceptions | Free | Same, narrower or none |
| static / private / final | Can be overloaded | Cannot be overridden |

## Abstract Class vs Interface

| | Abstract class | Interface |
|--|----------------|-----------|
| Inheritance | `extends` one | `implements` many |
| Instance fields | Yes | No (constants only) |
| Constructors | Yes | No |
| Methods | Any kind and access | Abstract, default, static, private |
| Best for | Related classes sharing state/code | Capabilities and contracts |

## IS-A vs HAS-A

| | IS-A | HAS-A |
|--|------|-------|
| Java | `extends` / `implements` | A field |
| Coupling | To parent's implementation | To part's interface |
| Changeable at runtime | No | Yes |
| Test | "A truck is a vehicle" | "A car has an engine" |

## Association vs Aggregation vs Composition

| | Association | Aggregation | Composition |
|--|-------------|-------------|-------------|
| Ownership | None | Weak | Strong, exclusive |
| Part lifecycle | Independent | Independent | Bound to the whole |
| Sharing | Any | Allowed | Not shared |
| UML | Line / arrow | Hollow diamond ◇ | Filled diamond ◆ |
| Example | Doctor — Patient | Team ◇ Player | Order ◆ OrderLine |

## Inheritance vs Composition

| | Inheritance | Composition |
|--|-------------|-------------|
| Reuse style | White-box (sees protected internals) | Black-box (public interface) |
| Flexibility | Fixed at compile time | Swappable at runtime |
| Several dimensions | Class explosion | Combine parts |
| Main risk | Fragile base class, LSP | More forwarding code |

## `==` vs `equals()`

| | `==` | `equals()` |
|--|------|-----------|
| Primitives | Value comparison | Not applicable |
| References | Same object? | Same value? (if overridden) |
| Default for objects | — | Identity (`Object.equals`) |
| `null` safety | Safe | `null.equals(x)` throws — use `Objects.equals` |

## `equals()` vs `hashCode()`

| | `equals()` | `hashCode()` |
|--|-----------|--------------|
| Returns | `boolean` | `int` |
| Purpose | Logical equality | Bucket selection in hash collections |
| Contract | Reflexive, symmetric, transitive, consistent, non-null | Equal objects → equal hash codes |
| If only this is overridden | Hash collections miss equal keys | Equal-looking objects still unequal |

## Static Binding vs Dynamic Binding

| | Static (early) | Dynamic (late) |
|--|----------------|----------------|
| When | Compile time | Runtime |
| Based on | Declared type | Object's class |
| Applies to | Overload choice, static, private, constructors, `super.m()`, fields | Overridable instance methods |

## Compile-Time vs Runtime Polymorphism

| | Compile-time | Runtime |
|--|--------------|---------|
| Mechanism | Overloading | Overriding + dynamic dispatch |
| Decided by | Compiler | JVM |
| Purpose | Convenience (one name, many inputs) | Extensibility (new types, same callers) |

## Comparable vs Comparator

| | `Comparable` | `Comparator` |
|--|--------------|--------------|
| Method | `compareTo(T)` | `compare(T, T)` |
| Defined | Inside the class | Outside (object/lambda) |
| Orders | One natural order | Any number |
| Used by | `sort(list)`, `TreeSet<>()` | `list.sort(c)`, `new TreeSet<>(c)` |

## final vs Immutable

| | `final` | Immutable |
|--|---------|-----------|
| Fixes | The reference/variable | The object's state |
| Applies to | Variables, fields, methods, classes | Class design |
| `final List` can change? | Yes, contents can | — |
| Example | `final StringBuilder sb` | `String`, `LocalDate`, `List.of(...)` |

## Composition vs Aggregation

| | Composition | Aggregation |
|--|-------------|-------------|
| Whole deleted → parts | Gone (unreachable) | Survive |
| Who creates parts | Usually the whole | Usually outside, passed in |
| Example | House ◆ Room | Department ◇ Professor |

## Factory Method vs Abstract Factory

| | Factory Method | Abstract Factory |
|--|----------------|------------------|
| Creates | One product | A family of related products |
| Mechanism | Subclass overrides a creation method | Client receives a factory object |
| Easy to add | New creator/product | New family (new product kind is hard) |

## Adapter vs Facade

| | Adapter | Facade |
|--|---------|--------|
| Goal | Compatibility | Simplicity |
| Wraps | One class | A subsystem |
| Interface | Existing target interface | New simpler interface |

## Decorator vs Proxy

| | Decorator | Proxy |
|--|-----------|-------|
| Structure | Same interface, wraps one | Same interface, wraps one |
| Intent | Add behaviour | Control access |
| Composed by | Client, stackable | Usually framework/proxy itself |

## Strategy vs State

| | Strategy | State |
|--|----------|-------|
| Varies | Algorithm | Behaviour by lifecycle stage |
| Who switches | Client | The states |
| Awareness | Strategies independent | States know their successors |
