# Object Lifecycle and Memory — Interview Questions

## Conceptual

### Q1. What is stored on the stack and what on the heap in Java?

<details>
<summary>Answer</summary>

Each thread's stack holds one frame per active method call, containing parameters and local variables — primitive values and references. The heap holds all objects and arrays with their instance fields, and it is shared by all threads. Static fields belong to the class, not to a frame. So in `Car c = new Car();` inside a method, `c` (the reference) is in the frame and the `Car` object is on the heap.

</details>

### Q2. When is an object eligible for garbage collection?

<details>
<summary>Answer</summary>

When it is no longer reachable from any GC root — local variables of active frames, static fields, and JVM-internal roots. That happens when references are set to `null`, reassigned, or go out of scope, or when objects only reference each other (an island of isolation). Eligibility does not mean it will be collected at a particular time.

</details>

### Q3. Can you force garbage collection?

<details>
<summary>Answer</summary>

No. `System.gc()` and `Runtime.getRuntime().gc()` only suggest that the JVM run a collection; it may ignore the request. Programs must not depend on collection happening at a given time.

</details>

### Q4. What is `finalize()` and why should you not use it?

<details>
<summary>Answer</summary>

`finalize()` is a method of `Object` that the GC could call before reclaiming an object. It is deprecated (Java 9) and marked for removal (Java 18) because there is no guarantee when or whether it runs, it slows down GC, exceptions in it are ignored, and it can resurrect objects. Use try-with-resources with `AutoCloseable` for deterministic cleanup, and `Cleaner` only as a safety net.

</details>

### Q5. Can a Java program have a memory leak even though Java has a garbage collector?

<details>
<summary>Answer</summary>

Yes. The GC frees only unreachable objects. If the program keeps references to objects it no longer needs — an ever-growing static map, listeners never removed, a cache without eviction — those objects stay reachable and are never collected, so memory use grows until `OutOfMemoryError`.

</details>

### Q6. What is the difference between `StackOverflowError` and `OutOfMemoryError`?

<details>
<summary>Answer</summary>

`StackOverflowError` means one thread's stack ran out of space, almost always because of very deep or infinite recursion. `OutOfMemoryError` means the heap (or another JVM memory area) cannot satisfy an allocation even after GC, usually because too many objects are kept reachable. Both are `Error`s, not `Exception`s — applications normally should not try to recover from them.

</details>

## Applied

### Q7. How many objects are eligible for garbage collection after line 5?

```java
Order a = new Order();     // line 1
Order b = new Order();     // line 2
Order c = a;               // line 3
a = null;                  // line 4
b = c;                     // line 5
```

<details>
<summary>Answer</summary>

**One.** The first `Order` (created on line 1) is still referenced by `c` and, after line 5, by `b`. The second `Order` (line 2) lost its only reference when `b` was reassigned on line 5, so it is eligible. Setting `a` to `null` did not make anything eligible because `c` still held the first object.

</details>

### Q8. Two `Node` objects point to each other with `next` fields and nothing else references them. Will they be collected?

<details>
<summary>Answer</summary>

Yes, eventually. Java's garbage collectors trace reachability from GC roots instead of counting references, so a cycle that no root can reach is garbage like any other unreachable object. This is called an island of isolation.

</details>
