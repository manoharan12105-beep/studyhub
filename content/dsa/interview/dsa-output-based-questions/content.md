# DSA Output-Based Questions

## Definition

**Output-based questions** show a short Java program and ask what it prints (or whether it throws). They test whether you can execute code in your head **exactly** — including Java's rules for references, integer arithmetic, strings, collections and evaluation order — rather than what the code "seems" to do.

## Why It Matters

- They appear in written tests, online assessments and as quick interview checks.
- The same rules cause real bugs in DSA code: overflow in sums and comparators, aliasing of arrays, mutable keys in hash maps, `==` on objects.
- Tracing skill is what you use to dry-run your own solution before declaring it done.

## Core Concept

Most output questions hinge on one of a small set of rules:

| Rule | What to remember |
|------|------------------|
| Parameter passing | Java passes **copies of values**; for objects the value is a reference — you can change the object, not the caller's variable |
| Integer arithmetic | `int` overflow wraps silently; `/` truncates toward zero; `%` takes the dividend's sign; `char` arithmetic yields `int` |
| Strings | immutable — methods return new strings; `==` compares references (compile-time constants are interned) |
| Increment operators | `i++` yields the old value, `++i` the new one; operands evaluate left to right |
| Collections | `Arrays.asList` is fixed-size and writes through; `PriorityQueue` iteration is heap order; `List.remove(int)` vs `remove(Object)` |
| `equals` / `hashCode` | arrays use identity; mutating a key after insertion "loses" it |
| Boolean operators | `&&`/`||` short-circuit; `&`/`|` evaluate both sides |
| Recursion | statements after the recursive call run while the stack unwinds (reverse order) |

## How It Works

1. **Read the whole program first**; note types (`int` vs `long`, `Integer` vs `int`, arrays vs lists).
2. **Trace in a table**: one row per statement or loop iteration, one column per variable.
3. **Evaluate expressions left to right**, applying side effects (`i++`, `pop()`) in that order — string concatenation included.
4. **Check the edge rules** in the table above whenever an operation touches them.
5. **Write the exact output**, including spaces, brackets and line breaks, or name the exception.

Tracing a tiny recursive method:

```text
f(3): print [3] → f(2): print [2] → f(1): print [1] → f(0) returns
      ← print [1] ← print [2] ← print [3]
output: [3][2][1][1][2][3]
```

## Comparison

| Looks like | Actually |
|------------|----------|
| `a == b` for two `String`s with equal text | `true` only if they are the same object (e.g. both literals); use `equals` |
| `Math.abs(x) >= 0` always | false for `Integer.MIN_VALUE` |
| `(p, q) -> p - q` sorts ascending | breaks when the subtraction overflows; use `Integer.compare` |
| `pq.toString()` shows sorted order | shows the internal heap array; only `poll` order is sorted |

## Common Misconceptions

- **"Java passes objects by reference."** It passes references by value: reassigning a parameter never affects the caller.
- **"Overflow throws an exception."** Primitive `int`/`long` arithmetic wraps silently (use `Math.addExact` to get an exception).
- **"`HashSet<int[]>` finds equal arrays."** Arrays inherit identity `equals`/`hashCode`.

## Key Takeaways

- Trace with a table; evaluate left to right with side effects.
- Know the handful of Java rules behind most surprises: references by value, overflow, string identity, collection quirks, short-circuiting.
- Write the exact output, character for character.
