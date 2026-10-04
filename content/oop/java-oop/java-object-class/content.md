# The Object Class

## Definition

`java.lang.Object` is the **root of every class hierarchy** in Java. Every class that does not explicitly extend another class extends `Object`, so every object — including arrays — has `Object`'s methods. Several of those methods (`equals`, `hashCode`, `toString`) define how objects are **compared**, **hashed** and **printed**, and are meant to be overridden.

## Why It Matters

- The default behaviour of `Object`'s methods (identity equality, `ClassName@1b6d3586` strings) is rarely what a value class needs.
- `==` vs `equals()`, identity vs equality, and `toString`/`getClass` questions appear in nearly every Java interview.
- Collections (`HashMap`, `HashSet`, `List.contains`) rely on `equals` and `hashCode` — getting them wrong causes silent bugs. The contract is covered in [equals() and hashCode()](../equals-and-hashcode/content.md).

## Methods of `Object`

| Method | Default behaviour | Override? |
|--------|-------------------|-----------|
| `boolean equals(Object o)` | `this == o` (identity) | Yes, for value-like classes |
| `int hashCode()` | An identity-based number, consistent for the object's lifetime | Yes, **whenever `equals` is overridden** |
| `String toString()` | `getClass().getName() + "@" + Integer.toHexString(hashCode())` | Yes, almost always useful |
| `final Class<?> getClass()` | The runtime class of the object | Cannot (final) |
| `protected Object clone()` | Field-by-field shallow copy if the class implements `Cloneable`; otherwise throws `CloneNotSupportedException` | Rarely; prefer copy constructors |
| `protected void finalize()` | Called by GC before reclaiming (maybe) | No — deprecated |
| `final void wait()`, `wait(long)`, `wait(long, int)` | Wait on the object's monitor | Cannot (final) |
| `final void notify()`, `notifyAll()` | Wake threads waiting on the monitor | Cannot (final) |

## Object Identity

Every object has an **identity**: it is a distinct thing in memory, separate from every other object, regardless of its field values. A reference variable points to one identity.

- `==` on references compares **identity**: do both references point to the same object?
- `equals()` compares **logical equality**: do the two objects represent the same value? (Only if the class overrides `equals`; otherwise it falls back to identity.)

## Reference Equality vs Logical Equality

```java
import java.util.Objects;

public class IdentityVsEquality {

    static class Point {
        private final int x;
        private final int y;

        Point(int x, int y) {
            this.x = x;
            this.y = y;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof Point)) {
                return false;
            }
            Point other = (Point) o;
            return x == other.x && y == other.y;
        }

        @Override
        public int hashCode() {
            return Objects.hash(x, y);
        }
    }

    static class Cell {               // does not override equals
        private final int row;

        Cell(int row) {
            this.row = row;
        }
    }

    public static void main(String[] args) {
        Point p1 = new Point(1, 2);
        Point p2 = new Point(1, 2);
        Point p3 = p1;

        System.out.println(p1 == p2);          // different objects
        System.out.println(p1.equals(p2));     // same value
        System.out.println(p1 == p3);          // same object

        Cell c1 = new Cell(5);
        Cell c2 = new Cell(5);
        System.out.println(c1.equals(c2));     // Object.equals: identity
    }
}
```

**Output:**

```text
false
true
true
false
```

## `==` vs `equals()`

| | `==` | `equals()` |
|--|------|-----------|
| Is | An operator | A method of `Object` |
| On primitives | Compares values | Not applicable (primitives have no methods) |
| On references | Compares identity (same object?) | Compares logical value — as defined by the class |
| Default for objects | — | Identity (same as `==`) unless overridden |
| Can be customised | No | Yes, by overriding |
| `null` | `ref == null` is safe | `ref.equals(x)` throws `NullPointerException` if `ref` is `null` — use `Objects.equals(a, b)` |

### Strings and `==`

String literals with the same text are **interned**: the JVM keeps one shared `String` object per literal in the string pool. That makes `==` *sometimes* appear to work, which is exactly why it is dangerous.

```java
public class StringIdentity {
    public static void main(String[] args) {
        String a = "chennai";
        String b = "chennai";                    // same pooled literal
        String c = new String("chennai");        // a new object
        String d = "chen" + "nai";               // compile-time constant: folded and pooled
        String part = "chen";
        String e = part + "nai";                 // computed at runtime: a new object

        System.out.println(a == b);
        System.out.println(a == c);
        System.out.println(a == d);
        System.out.println(a == e);
        System.out.println(a == e.intern());     // intern() returns the pooled instance
        System.out.println(a.equals(c) && a.equals(e));
    }
}
```

**Output:**

```text
true
false
true
false
true
true
```

Rule: **always compare strings with `equals`** (or `equalsIgnoreCase`).

### Wrapper caching and `==`

Autoboxing uses `Integer.valueOf`, which **caches** values from −128 to 127 (by default). So `==` on `Integer` objects compares identity and gives different answers depending on the value:

```java
public class IntegerCache {
    public static void main(String[] args) {
        Integer a = 127;
        Integer b = 127;
        Integer c = 128;
        Integer d = 128;
        System.out.println(a == b);          // cached: same object
        System.out.println(c == d);          // outside the default cache: different objects
        System.out.println(c.equals(d));     // value comparison
        int primitive = 128;
        System.out.println(c == primitive);  // unboxes c: numeric comparison
    }
}
```

**Output:**

```text
true
false
true
true
```

## `toString()`

`toString()` returns a text representation, used by `println`, string concatenation, logging and debuggers. The default (`Point@6d06d69c`) is the class name plus the hexadecimal hash code — useless for debugging.

```java
@Override
public String toString() {
    return "Point(" + x + ", " + y + ")";
}
```

Guidelines:

- Include the fields that identify the object's state; omit secrets (passwords, tokens) — `toString` output ends up in logs.
- Do not let `toString` call methods that may fail or be slow.
- Beware of cycles: if `A.toString()` prints its `B` and `B.toString()` prints its `A`, you get `StackOverflowError`.
- Records generate a `toString` automatically: `Point[x=1, y=2]`.

## `getClass()`

`getClass()` returns the **runtime class** of the object as a `Class` object — the real type, not the reference type.

```java
public class GetClassDemo {

    static class Animal { }

    static class Dog extends Animal { }

    public static void main(String[] args) {
        Animal a = new Dog();
        System.out.println(a.getClass().getSimpleName());
        System.out.println(a.getClass() == Dog.class);
        System.out.println(a.getClass() == Animal.class);
        System.out.println(a instanceof Animal);
    }
}
```

**Output:**

```text
Dog
true
false
true
```

| | `obj.getClass() == X.class` | `obj instanceof X` |
|--|-----------------------------|--------------------|
| Matches subclasses | No — exact class only | Yes |
| With `null` | `NullPointerException` (on `obj.getClass()`) | `false` |
| Typical use | Strict `equals` that never treats a subclass as equal | Casting, type checks, most `equals` methods |

`X.class` is a **class literal** — the `Class` object for `X`, available without an instance.

## `clone()` — Awareness

`Object.clone()` creates a **shallow copy**: a new object whose fields are copies of the original's field values. For reference fields, that means the copy **shares** the same referenced objects.

Requirements and quirks:

- The class must implement the **marker interface** `Cloneable`; otherwise `Object.clone()` throws `CloneNotSupportedException` (a checked exception).
- `clone()` is `protected` in `Object`; to make it callable you override it as `public` (usually with a covariant return type).
- It creates the object **without running a constructor**, so constructor validation is skipped, and `final` fields that need deep copies cannot be reassigned.

```java
import java.util.ArrayList;
import java.util.List;

public class ShallowCloneDemo {

    static class Playlist implements Cloneable {
        String name;
        List<String> songs = new ArrayList<>();

        @Override
        public Playlist clone() {
            try {
                return (Playlist) super.clone();       // shallow: songs list is shared
            } catch (CloneNotSupportedException e) {
                throw new AssertionError(e);           // cannot happen: we implement Cloneable
            }
        }
    }

    public static void main(String[] args) {
        Playlist original = new Playlist();
        original.name = "Morning";
        original.songs.add("Song A");

        Playlist copy = original.clone();
        copy.name = "Evening";                         // String reference replaced: independent
        copy.songs.add("Song B");                      // same list object: visible in both

        System.out.println(original.name + " " + original.songs);
        System.out.println(copy.name + " " + copy.songs);
    }
}
```

**Output:**

```text
Morning [Song A, Song B]
Evening [Song A, Song B]
```

| Shallow copy | Deep copy |
|--------------|-----------|
| Copies field values; referenced objects are shared | Recursively copies referenced mutable objects |
| Fast, but changes to shared parts are visible in both | Independent copies |
| `Object.clone()` default | Must be written by hand |

**Prefer a copy constructor or static factory** (`new Playlist(other)`, `Playlist.copyOf(other)`): they run normal validation, work with `final` fields, and make deep-copy decisions explicit. The [Prototype](../../design-patterns/prototype-pattern/content.md) pattern discusses copying further.

## `hashCode()` in Brief

`hashCode()` returns an `int` used by hash-based collections to choose a bucket. The rule that matters most: **equal objects must have equal hash codes**, so whenever you override `equals`, override `hashCode` too. The full contract, mutable keys and `HashMap` behaviour: [equals() and hashCode()](../equals-and-hashcode/content.md).

## `wait`, `notify`, `notifyAll` — Awareness

Every object has an intrinsic **monitor** (lock). `wait()` releases the lock and suspends the thread until `notify()`/`notifyAll()` is called on the same object; all three must be called while holding the object's lock (inside `synchronized`), otherwise `IllegalMonitorStateException`. They are low-level; modern code usually uses `java.util.concurrent` utilities. See [OOP with Multithreading](../../applied-oop/oop-with-multithreading/content.md).

## Real-World Examples

- Logging frameworks call `toString()` on every object you log.
- `HashMap<Customer, Account>` calls `hashCode()` then `equals()` on keys.
- JPA/Hibernate entities need carefully designed `equals`/`hashCode`, because objects loaded in different sessions are different identities representing the same row.
- `ArrayList.contains(x)` and `indexOf(x)` call `equals`.

## Common Misconceptions

- **"`==` compares strings by content."** It compares references; pooled literals make it look correct by accident.
- **"`equals` compares values by default."** `Object.equals` compares identity.
- **"`hashCode` is the memory address."** It is an identity-based number; it is not specified to be an address, and it never changes for the object's lifetime.
- **"`clone()` makes an independent copy."** The default is shallow.
- **"`getClass()` returns the declared type."** It returns the runtime class.
- **"`Integer` values can be compared with `==`."** Only works reliably within the cache range; use `equals` or unbox.

## Key Takeaways

- Every class extends `Object`, inheriting `equals`, `hashCode`, `toString`, `getClass`, `clone`, `wait/notify`.
- `==` = identity for references; `equals` = logical equality if overridden.
- Override `toString` for readable logs; override `equals` and `hashCode` together.
- `getClass()` gives the exact runtime class; `instanceof` also matches subclasses.
- `clone()` is shallow, skips constructors and needs `Cloneable`; prefer copy constructors.
- Compare strings and wrappers with `equals`, never `==`.
