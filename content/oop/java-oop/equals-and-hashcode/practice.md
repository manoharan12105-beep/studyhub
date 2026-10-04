# equals() and hashCode() — Practice

### P1. Which statement must hold?

**Difficulty:** Easy · **Type:** MCQ

- A) If `a.hashCode() == b.hashCode()`, then `a.equals(b)`
- B) If `a.equals(b)`, then `a.hashCode() == b.hashCode()`
- C) If `!a.equals(b)`, then `a.hashCode() != b.hashCode()`
- D) `hashCode()` must be unique for each object

<details>
<summary>Answer</summary>

**Answer:** B

**Explanation:** Equal objects must share a hash code. Unequal objects may collide, so A, C and D are not required.

</details>

### P2. Count the set

**Difficulty:** Easy · **Type:** Output-based

```java
import java.util.HashSet;
import java.util.Set;

public class StringSet {
    public static void main(String[] args) {
        Set<String> cities = new HashSet<>();
        cities.add("Madurai");
        cities.add(new String("Madurai"));
        cities.add("Trichy");
        cities.add("madurai");
        System.out.println(cities.size());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
3
```

**Explanation:** `String` compares by content, so the second "Madurai" is a duplicate even though it is a different object. Comparison is case-sensitive, so "madurai" is distinct.

</details>

### P3. Write equals and hashCode

**Difficulty:** Medium · **Type:** Coding

Write `equals` and `hashCode` for an immutable `final class Money` with fields `long amountPaise` and `String currency` (never null). Two `Money` objects are equal when both fields are equal.

<details>
<summary>Answer</summary>

```java
import java.util.Objects;

final class Money {
    private final long amountPaise;
    private final String currency;

    Money(long amountPaise, String currency) {
        this.amountPaise = amountPaise;
        this.currency = Objects.requireNonNull(currency);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Money)) {
            return false;
        }
        Money other = (Money) o;
        return amountPaise == other.amountPaise && currency.equals(other.currency);
    }

    @Override
    public int hashCode() {
        return 31 * Long.hashCode(amountPaise) + currency.hashCode();
    }
}
```

**Explanation:** Both methods use the same two fields. The class is `final`, so `instanceof` is safe. (A `record Money(long amountPaise, String currency)` would generate equivalent methods.)

</details>

### P4. Diagnose the bug

**Difficulty:** Medium · **Type:** Scenario

A developer caches computed prices in `Map<Cart, Long>`. After customers add items, the cache never hits and memory keeps growing. `Cart` overrides `equals`/`hashCode` using its item list. What is happening?

<details>
<summary>Answer</summary>

**Answer:** `Cart` is a mutable key. Adding items changes its hash code, so later lookups search a different bucket and miss; a new entry is inserted each time, while old entries become unreachable but still referenced by the map — a leak.

**Fix:** key the cache on an immutable snapshot (for example a record of the item ids and quantities, or a `List.copyOf` of immutable line values), or invalidate the entry before mutating the cart.

</details>

### P5. Symmetry check

**Difficulty:** Hard · **Type:** Code analysis

```java
final class CaseInsensitiveName {
    private final String value;

    CaseInsensitiveName(String value) {
        this.value = value;
    }

    @Override
    public boolean equals(Object o) {
        if (o instanceof CaseInsensitiveName) {
            return value.equalsIgnoreCase(((CaseInsensitiveName) o).value);
        }
        if (o instanceof String) {
            return value.equalsIgnoreCase((String) o);
        }
        return false;
    }

    @Override
    public int hashCode() {
        return value.toLowerCase().hashCode();
    }
}
```

Which rule of the `equals` contract does this break? Show a concrete case.

<details>
<summary>Hint</summary>

What does `String.equals` say when given a `CaseInsensitiveName`?

</details>

<details>
<summary>Answer</summary>

**Answer:** Symmetry. `new CaseInsensitiveName("Ravi").equals("RAVI")` is `true`, but `"RAVI".equals(new CaseInsensitiveName("Ravi"))` is `false`, because `String.equals` knows nothing about this class.

**Fix:** compare only with other `CaseInsensitiveName` objects. Interoperating with another type's `equals` is impossible unless both types agree. (Also consider using `toLowerCase(Locale.ROOT)` so the hash does not depend on the default locale.)

</details>
