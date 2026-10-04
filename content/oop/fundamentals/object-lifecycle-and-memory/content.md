# Object Lifecycle and Memory

## Definition

The **object lifecycle** is the sequence an object goes through: its class is loaded, the object is **created** (allocated and initialised), it is **used** through references, it becomes **unreachable** when no live reference leads to it, and the **garbage collector** eventually reclaims its memory. Conceptually, Java keeps **objects on the heap** and **method-local variables (including references) in stack frames**.

## Why It Matters

- It explains everyday behaviour: why `b = a` shares an object, why a local variable vanishes when its method returns while the object it pointed to may live on, and why Java has no `delete`.
- Interviews ask "stack vs heap", "when is an object eligible for garbage collection", "what is `finalize()`", and "can Java leak memory?".
- Lifetime is also a design concern: in **composition** the part lives and dies with the whole (see [Object Relationships](../../relationships/object-relationships/content.md)).

## Stack and Heap: The Conceptual Model

> [!NOTE]
> This is the model the Java language behaves *as if* it follows. The JVM is free to optimise (for example, the JIT compiler can avoid a heap allocation when an object never escapes a method), but such optimisations never change what your program observes.

| Area | What lives there | Lifetime | Shared between threads |
|------|------------------|----------|------------------------|
| **Stack** (one per thread) | One **frame** per active method call: parameters, local variables (primitive values and references) | Frame is discarded when the method returns | No |
| **Heap** | Every object and array, including their instance fields | Until unreachable and collected | Yes |
| **Class-level storage** | Loaded class metadata, method code, static fields | While the class is loaded | Yes |

```java
void placeOrder() {
    int quantity = 2;                          // primitive local: value in the frame
    Product pen = new Product("Pen", 30);      // reference in the frame, object on the heap
    Order order = new Order(pen, quantity);    // Order on the heap holds a reference to the Product
}
```

```text
 Stack (thread "main")              Heap
 ┌─ frame: placeOrder ───────┐
 │ quantity = 2              │      ┌──────────────────────┐
 │ pen   ●───────────────────┼─────▶│ Product "Pen", 30    │◀──┐
 │ order ●───────────────────┼──┐   └──────────────────────┘   │
 └───────────────────────────┘  │   ┌──────────────────────┐   │
 ┌─ frame: main ─────────────┐  └──▶│ Order                │   │
 │ ...                       │      │  product ●───────────┼───┘
 └───────────────────────────┘      │  quantity = 2        │
                                    └──────────────────────┘
```

When `placeOrder` returns, its frame — `quantity`, `pen`, `order` — is gone. The `Order` and `Product` objects are now unreachable (unless the method stored a reference somewhere else, such as in a field or a returned value), so they become eligible for garbage collection.

Key points:

- A **primitive field** lives inside its object on the heap; a **primitive local** lives in the frame.
- A **reference** is stored wherever its variable is: in a frame (local), in an object (field), or with the class (static field).
- Each thread has its own stack; all threads share the heap — the root of most concurrency problems ([OOP with Multithreading](../../applied-oop/oop-with-multithreading/content.md)).

## Stages of the Lifecycle

### 1. Class loading and initialisation

Before the first object of a class is created, the class is loaded, linked and initialised (static initialisers run). This happens once per class (per class loader).

### 2. Creation

`new` allocates memory, sets fields to default values, runs constructors and initialisers, and returns a reference. Details: [Constructors and Initialization](../constructors-and-initialization/content.md).

### 3. In use (reachable)

An object is **reachable** if a chain of references leads to it from a **GC root**:

- local variables and parameters in active stack frames of live threads,
- static fields of loaded classes,
- a few JVM-internal references (for example, objects referenced from native code).

### 4. Unreachable (eligible for garbage collection)

Typical ways an object becomes unreachable:

| Situation | Example |
|-----------|---------|
| Reference set to `null` | `order = null;` |
| Reference reassigned | `order = new Order();` (the old order is now unreachable if nothing else refers to it) |
| Variable goes out of scope | Method returns; local references disappear |
| **Island of isolation** | Two objects refer to each other but nothing reachable refers to either |

```text
 Island of isolation: a ⇄ b reference each other, but no root reaches them.

 root ✗        ┌─────┐  next   ┌─────┐
               │  a  │────────▶│  b  │
               │     │◀────────│     │
               └─────┘  prev   └─────┘      → both are eligible for collection
```

Java's collectors trace reachability from roots, so cycles are **not** a problem (unlike simple reference counting).

### 5. Garbage collection

The **garbage collector (GC)** runs automatically and reclaims memory of unreachable objects. You cannot predict **when** a particular object is collected, or whether it is collected at all before the program ends.

- `System.gc()` is only a **request**; the JVM may ignore it.
- Modern JVMs use **generational** collection: most objects die young, so a small "young" area is collected frequently and cheaply; long-lived objects are promoted to an "old" area collected less often.

### 6. Finalisation (obsolete)

`Object.finalize()` was meant to run cleanup before collection. It is **deprecated** (since Java 9, and marked for removal since Java 18): it may run late or never, slows collection, and can resurrect objects. Use instead:

- **`try`-with-resources** and `AutoCloseable` for files, sockets, connections — deterministic cleanup at the end of a block.
- `java.lang.ref.Cleaner` as a last-resort safety net.

```java
public class TryWithResourcesDemo {

    static class Connection implements AutoCloseable {
        private final String name;

        Connection(String name) {
            this.name = name;
            System.out.println("open " + name);
        }

        void query() {
            System.out.println("query on " + name);
        }

        @Override
        public void close() {
            System.out.println("close " + name);
        }
    }

    public static void main(String[] args) {
        try (Connection db = new Connection("orders-db")) {
            db.query();
        }                                   // close() runs here, even if query() throws
        System.out.println("after block");
    }
}
```

**Output:**

```text
open orders-db
query on orders-db
close orders-db
after block
```

## Memory Errors

| Error | Cause | Typical trigger |
|-------|-------|-----------------|
| `StackOverflowError` | A thread's stack is full | Unbounded or very deep recursion, including accidental recursion (a `toString()` that calls itself through a cycle of objects) |
| `OutOfMemoryError: Java heap space` | The heap cannot fit a new object even after GC | Holding references to too much data, memory leaks |

```java
public class StackOverflowDemo {

    static int depth = 0;

    static void recurse() {
        depth++;
        recurse();                          // no base case
    }

    public static void main(String[] args) {
        try {
            recurse();
        } catch (StackOverflowError e) {
            System.out.println("StackOverflowError after many frames: " + (depth > 1000));
        }
    }
}
```

**Output:**

```text
StackOverflowError after many frames: true
```

(The exact depth depends on the JVM and stack size, so the program prints only whether it was large.)

## Memory Leaks in Java

Garbage collection removes **unreachable** objects. A Java memory leak is an object that is still **reachable** but no longer needed — the GC must keep it. Common causes:

- **Static collections that only grow:** `static Map<String, Session> sessions` never cleaned up.
- **Listeners/observers never unregistered:** the subject keeps a reference to every listener ([Observer](../../design-patterns/observer-pattern/content.md)).
- **Caches without eviction:** use a size limit (an LRU `LinkedHashMap`) or an expiring cache.
- **Inner-class references:** a non-static inner class object holds a reference to its outer object, keeping it alive ([Nested Classes](../../java-oop/nested-classes/content.md)).

## Comparison

| | Stack | Heap |
|--|-------|------|
| Holds | Frames: locals, parameters, return info | Objects and arrays |
| Managed by | Push/pop on method call/return | Garbage collector |
| Per thread? | Yes | Shared |
| Allocation cost | Very cheap | Cheap (bump allocation) but GC work later |
| Error when full | `StackOverflowError` | `OutOfMemoryError` |

## Real-World Examples

- A web request handler creates many short-lived objects (request, DTOs, strings); they die young and are collected cheaply.
- A server that caches every user it has ever seen in a static `HashMap` eventually fails with `OutOfMemoryError`.
- JDBC connections, file streams and HTTP clients are closed with try-with-resources, never left for the GC.

## Common Misconceptions

- **"Setting a reference to `null` frees the object."** It only removes one reference; collection happens later, and only if no other reference remains.
- **"`System.gc()` forces collection."** It is a hint.
- **"Java cannot leak memory."** Reachable-but-unused objects leak.
- **"Objects created in a method are on the stack."** Conceptually on the heap; only the reference variable is in the frame.
- **"Cyclic references prevent collection."** Tracing collectors handle cycles (islands of isolation are collected).
- **"`finalize()` is like a C++ destructor."** It was never guaranteed to run and is deprecated.

## Key Takeaways

- Locals and references live in stack frames; objects live on the heap; static fields live with the class.
- An object is eligible for GC when no chain of references from a GC root reaches it — including cycles.
- GC timing is not predictable; `System.gc()` is a request.
- Release external resources with try-with-resources, not `finalize()`.
- Java leaks happen through references you forgot to drop (static collections, listeners, caches).
