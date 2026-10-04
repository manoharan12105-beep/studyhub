# OOP Interview Traps

## Definition

An **interview trap** is a statement that sounds right but is wrong (or only half right), and that interviewers use to check precise understanding. This topic collects the classic Java OOP traps. Each question states the trap, gives the correct rule, and proves it with a short example or a precise reason.

## Why It Matters

- One imprecise sentence ("static methods are overridden") can undo an otherwise good interview.
- The traps cluster around a few rules: constructors, static/private/final methods, reference vs object type, equality, interfaces, and singletons.

## The Rules Behind the Traps

| Area | Precise rule |
|------|--------------|
| Constructors | Not inherited, not overridden; superclass constructor runs first |
| Static methods | Hidden, not overridden; bound by reference type |
| Private methods | Not inherited, so not overridden; calls inside the class bind statically |
| Final | Final methods cannot be overridden; a final reference does not make the object immutable |
| Equality | `==` = identity for references; `equals` must be overridden together with `hashCode` |
| Binding | Overloads chosen at compile time; overrides at runtime |
| Types | Reference type decides what you can call; object type decides which override runs |
| Interfaces | Can have default, static and private methods; a class can implement many |
| Abstract classes | May have zero abstract methods; may have constructors |

## Key Takeaways

- Say "hidden", not "overridden", for static methods and fields.
- Say "reference type decides what compiles; object type decides which override runs".
- Say "final reference", not "immutable", unless the object's class is immutable.
- Always pair `equals` with `hashCode`.
