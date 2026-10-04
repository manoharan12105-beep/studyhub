# OOP Output-Based Questions

## Definition

**Output-based questions** show a short Java program and ask what it prints — or whether it compiles, or which exception it throws. In OOP they test whether you apply Java's rules exactly: which constructor runs first, which overload the compiler picks, which override the JVM dispatches to, what a cast does, and how `equals`/`hashCode` behave.

## Why It Matters

- They are common in written tests and online assessments for Java roles, and as quick checks in technical rounds.
- Each question isolates one rule that real bugs come from (field hiding, static hiding, overloading surprises, half-constructed objects).

## How to Solve Them

For every method call, separate **what the compiler knows** from **what the runtime object is**:

| Step | Ask | Decided by |
|------|-----|-----------|
| 1 | Does it compile? Which methods are visible? | Reference (declared) type |
| 2 | Which overload? | Static types of the arguments (widening → boxing → varargs) |
| 3 | Static, private, or `super` call? | Bound at compile time — that exact method runs |
| 4 | Otherwise, which override? | Runtime class of the object |
| 5 | Field access? | Reference type (fields are never polymorphic) |

Other rules that decide many answers:

- Constructors run **top-down**; instance initialisers run after `super(...)`; static initialisers run once, on first use.
- A superclass constructor calling an overridden method runs the subclass version on a **half-built** object.
- `==` compares references; `equals` must be overridden (with `hashCode`) for value equality.
- A cast never changes the object; a wrong downcast throws `ClassCastException` at runtime.

The full procedure: [Binding and Method Resolution](../../java-oop/binding-and-method-resolution/content.md).

## Key Takeaways

- Write down declared types first; resolve overloads at compile time, overrides at runtime.
- Fields, static methods and private methods follow the reference/declaring type.
- Trace constructors top-down and watch for overridable calls inside them.
- Every answer in this bank was produced by compiling and running the program.
