# equals() and hashCode()

## Definition

`equals(Object o)` decides whether two objects are **logically equal** — represent the same value. `hashCode()` returns an `int` summarising the object, used by hash-based collections (`HashMap`, `HashSet`, `HashTable`, `ConcurrentHashMap`) to find the right bucket quickly. The two methods form a **contract**: **objects that are equal must have equal hash codes.** Override both together, or neither.

## Why It Matters

- Value classes (`Money`, `Email`, `OrderId`) must be compared by value, not identity.
- `HashMap`/`HashSet` call `hashCode()` first and `equals()` second. If the two methods disagree, lookups silently fail, duplicates appear in sets, and cached values are never found.
- These are among the most-asked Java interview questions: the contract, "what if I override only one?", and mutable keys.

## The `equals` Contract

For non-null references `x`, `y`, `z`, `equals` must be:

| Property | Rule | Violation example |
|----------|------|-------------------|
| **Reflexive** | `x.equals(x)` is `true` | An `equals` that compares a `NaN` field with `==` |
| **Symmetric** | `x.equals(y)` ⇔ `y.equals(x)` | Parent and subclass comparing differently (shown below) |
| **Transitive** | `x.equals(y)` and `y.equals(z)` ⇒ `x.equals(z)` | "Equal within a tolerance of 0.1": 1.0 ≈ 1.08 ≈ 1.16, but 1.0 ≉ 1.16 |
| **Consistent** | Repeated calls give the same result while the compared fields do not change | Comparing against the current time or a remote lookup |
| **Non-null** | `x.equals(null)` is `false` (never throws) | `return this.id.equals(((Order) o).id)` without a type check |

## The `hashCode` Contract

1. **Consistent:** repeated calls on an unchanged object return the same value (within one run of the program).
2. **Equal objects ⇒ equal hash codes:** if `x.equals(y)`, then `x.hashCode() == y.hashCode()`. **This is the rule people break.**
3. **Unequal objects may share a hash code** (a collision). That is legal; good hash functions just make it rare, because collisions slow hash tables down.

Note the direction: equal hash codes do **not** imply equality.

## How `HashMap` Uses Both Methods

```text
 map.get(key)
   1. h = key.hashCode()              (then mixed by HashMap)
   2. bucket = h mapped to an index   → look only in that bucket
   3. for each entry in the bucket:
        if entry.hash == h && (entry.key == key || entry.key.equals(key))  → found
```

- If two equal keys produce **different** hash codes, the lookup searches the **wrong bucket** and never even calls `equals`.
- If `hashCode` is fine but `equals` is not overridden, the lookup reaches the right bucket but `equals` (identity) rejects the logically equal key.

`HashSet` is backed by a `HashMap` (elements are keys), so the same logic decides whether `add` treats an element as a duplicate. Internals of buckets, resizing and tree bins: [Java Maps and Sets](../../../dsa/fundamentals/java-maps-and-sets/content.md).

## Writing a Correct `equals` and `hashCode`

```java
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class CorrectEqualsHashCode {

    static final class Book {
        private final String isbn;          // identity of a book edition
        private final String title;

        Book(String isbn, String title) {
            this.isbn = Objects.requireNonNull(isbn);
            this.title = title;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {                        // 1. same object: fast path
                return true;
            }
            if (!(o instanceof Book)) {             // 2. type check (also handles null)
                return false;
            }
            Book other = (Book) o;                  // 3. cast
            return isbn.equals(other.isbn);         // 4. compare the significant fields
        }

        @Override
        public int hashCode() {
            return isbn.hashCode();                 // uses exactly the fields equals uses
        }

        @Override
        public String toString() {
            return title + " (" + isbn + ")";
        }
    }

    public static void main(String[] args) {
        Book first = new Book("978-0-13", "Algorithms");
        Book second = new Book("978-0-13", "Algorithms, 2nd print");
        Set<Book> shelf = new HashSet<>();
        shelf.add(first);
        shelf.add(second);                          // equal to first: not added
        System.out.println(first.equals(second) + " " + shelf.size());
        System.out.println(shelf.contains(new Book("978-0-13", "any title")));
    }
}
```

**Output:**

```text
true 1
true
```

Guidelines:

- Decide which fields define **identity of value** (here only `isbn`) and use **the same fields** in both methods.
- `Objects.equals(a, b)` compares fields that may be `null`; `Objects.hash(f1, f2, …)` combines several fields (it allocates an array, so hand-written `31 * h + …` is faster in hot code).
- Compare `double`/`float` fields with `Double.compare`, not `==` (handles `NaN` and `-0.0`).
- Arrays: use `Arrays.equals` / `Arrays.hashCode` (arrays inherit identity-based methods).
- Making the class `final` (or using `getClass()`) avoids the subclass symmetry problem below.
- **Records** generate `equals`, `hashCode` and `toString` from all components — the simplest correct option for value types ([Modern Java OOP Features](../modern-java-oop/content.md)).

## Overriding `equals` Without `hashCode`

```java
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class EqualsWithoutHashCode {

    static class Employee {
        private final int id;

        Employee(int id) {
            this.id = id;
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Employee && ((Employee) o).id == id;
        }
        // hashCode NOT overridden: identity-based hash codes differ for equal employees
    }

    public static void main(String[] args) {
        Set<Employee> set = new HashSet<>();
        set.add(new Employee(7));
        set.add(new Employee(7));
        System.out.println("set size: " + set.size());

        Map<Employee, String> desks = new HashMap<>();
        desks.put(new Employee(7), "Desk 12");
        System.out.println("lookup: " + desks.get(new Employee(7)));

        System.out.println("equal? " + new Employee(7).equals(new Employee(7)));
    }
}
```

**Output:**

```text
set size: 2
lookup: null
equal? true
```

The two employees are equal, but their identity hash codes almost certainly differ, so they land in different buckets: the set keeps both, and the map lookup misses. (Strictly, two identity hash codes *could* collide, so these outputs are "almost always", not guaranteed — which is exactly why the bug is so hard to reproduce.)

## Overriding `hashCode` Without `equals`

Equal hash codes put two objects in the same bucket, but `Object.equals` (identity) still says they differ:

- `HashSet` keeps both "duplicates".
- `map.get(new Key(...))` finds the bucket and then fails the `equals` check → `null`.

It does not break the contract (unequal objects may share a hash code), but the class still behaves as identity-based in collections, which is rarely what the author intended.

## Mutable Keys

The hash code is computed when the key is **inserted**. If a field used by `hashCode` changes afterwards, the entry sits in the bucket for the **old** hash, and lookups with the new state search a different bucket.

```java
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class MutableKeyTrap {

    static class Seat {
        private String code;

        Seat(String code) {
            this.code = code;
        }

        void setCode(String code) {
            this.code = code;
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Seat && Objects.equals(((Seat) o).code, code);
        }

        @Override
        public int hashCode() {
            return Objects.hashCode(code);
        }
    }

    public static void main(String[] args) {
        Set<Seat> booked = new HashSet<>();
        Seat seat = new Seat("A1");
        booked.add(seat);

        seat.setCode("B7");                                     // mutate a field used by hashCode

        System.out.println(booked.contains(seat));              // searches the bucket for "B7"
        System.out.println(booked.contains(new Seat("A1")));    // right bucket, but equals fails
        System.out.println(booked.size());                      // the entry is still there
        System.out.println(booked.remove(seat));                // cannot even remove it
    }
}
```

**Output:**

```text
false
false
1
false
```

The entry is stranded: present in the set but unreachable through normal operations. Rules:

- Use **immutable** objects as map keys and set elements (`String`, `Integer`, records with immutable components, your own immutable value classes).
- If an object must be mutable, base `equals`/`hashCode` on fields that never change (such as an id), or do not put it in hash-based collections.

## `instanceof` vs `getClass()` in `equals` (Inheritance)

If a subclass adds a field to equality, `instanceof`-based `equals` breaks **symmetry**:

```java
import java.util.Objects;

class Product {
    protected final String sku;

    Product(String sku) {
        this.sku = sku;
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof Product && ((Product) o).sku.equals(sku);
    }

    @Override
    public int hashCode() {
        return sku.hashCode();
    }
}

class DiscountedProduct extends Product {
    private final int discountPercent;

    DiscountedProduct(String sku, int discountPercent) {
        super(sku);
        this.discountPercent = discountPercent;
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof DiscountedProduct
                && super.equals(o)
                && ((DiscountedProduct) o).discountPercent == discountPercent;
    }

    @Override
    public int hashCode() {
        return Objects.hash(sku, discountPercent);   // also differs from Product's hash code
    }
}

public class SymmetryBroken {
    public static void main(String[] args) {
        Product plain = new Product("SKU-1");
        Product discounted = new DiscountedProduct("SKU-1", 10);
        System.out.println(plain.equals(discounted));     // Product's equals: only SKU
        System.out.println(discounted.equals(plain));     // plain is not a DiscountedProduct
    }
}
```

**Output:**

```text
true
false
```

`plain.equals(discounted)` is `true` but the reverse is `false`, and the two equal objects (by `plain`'s view) have different hash codes. Options:

| Approach | Effect | Trade-off |
|----------|--------|-----------|
| `getClass() != o.getClass()` check | Objects of different classes are never equal → symmetric | A harmless subclass (e.g. a framework proxy) is never equal to its parent |
| `instanceof` + make the class (or `equals`) `final` | Subclasses cannot change equality | Subclasses cannot add fields to equality |
| Composition instead of inheritance | `DiscountedProduct` *has a* `Product` and a discount | Usually the cleanest model |

There is no way to extend an instantiable class, add a value field to `equals`, and keep the full contract with `instanceof`. Favour composition, or `final` value classes.

## `equals` Consistent with `compareTo`

Sorted collections (`TreeSet`, `TreeMap`) use `compareTo`/`compare` **instead of** `equals`. If `compareTo` returns 0 for objects that are not `equals`, hash-based and sorted collections disagree:

```java
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

public class EqualsVsCompareTo {
    public static void main(String[] args) {
        BigDecimal a = new BigDecimal("2.0");
        BigDecimal b = new BigDecimal("2.00");
        System.out.println(a.equals(b) + " " + a.compareTo(b));   // equals also compares scale

        Set<BigDecimal> hashed = new HashSet<>(Set.of(a, b));
        Set<BigDecimal> sorted = new TreeSet<>(Set.of(a, b));
        System.out.println(hashed.size() + " " + sorted.size());
    }
}
```

**Output:**

```text
false 0
2 1
```

Details in [OOP with Collections](../../applied-oop/oop-with-collections/content.md).

## Identity vs Equality — Choosing

| Use identity (`==`, default `equals`) for | Use value equality (override) for |
|------------------------------------------|-----------------------------------|
| Entities whose identity matters even if fields match: a specific `Thread`, a `Socket`, a GUI window | Values: `Money`, `Email`, `DateRange`, `Coordinate`, ids |
| Objects that are never compared or used as keys | Objects used as map keys or set elements by value |

For **entities** with an id (a `Customer` stored in a database), equality is usually based on the id alone — and must be designed with care when ids are assigned late (for example, on first save).

## Real-World Examples

- `String`, `Integer`, `LocalDate`, `List`, `Set`, `Map` all override `equals`/`hashCode` by value. Two `ArrayList`s with the same elements in the same order are equal.
- `HashMap<String, Integer>` word counters rely on `String`'s value equality.
- A cache keyed by a mutable request object silently stops hitting after the request is modified.

## Common Misconceptions

- **"Equal hash codes mean equal objects."** Collisions are allowed.
- **"Overriding `equals` is enough for `HashMap`."** `hashCode` must agree, or lookups miss.
- **"`equals(MyType other)` overrides `equals`."** It overloads; the parameter must be `Object`. Use `@Override`.
- **"`hashCode` must be unique."** It must be consistent with `equals`; uniqueness is neither required nor possible in general.
- **"Records need hand-written `equals`."** They generate value-based `equals`/`hashCode` (shallow: a mutable component can still change).

## Key Takeaways

- Contract: reflexive, symmetric, transitive, consistent, `x.equals(null) == false`.
- Equal objects must have equal hash codes; override both together, using the same fields.
- `HashMap`/`HashSet`: `hashCode` picks the bucket, `equals` confirms the match.
- Never mutate fields used in `hashCode`/`equals` while the object is a key or set element.
- Subclasses adding fields to equality break symmetry with `instanceof`; prefer `final` value classes, `getClass()`, records or composition.
- Sorted collections use `compareTo`; keep it consistent with `equals`.
