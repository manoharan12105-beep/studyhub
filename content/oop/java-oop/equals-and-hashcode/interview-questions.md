# equals() and hashCode() — Interview Questions

## Conceptual

### Q1. What is the contract between `equals()` and `hashCode()`?

<details>
<summary>Answer</summary>

If two objects are equal according to `equals`, they must return the same `hashCode`. `hashCode` must also be consistent across calls while the object's relevant fields do not change. The reverse is not required: unequal objects may share a hash code. Additionally, `equals` itself must be reflexive, symmetric, transitive, consistent, and return `false` for `null`.

</details>

### Q2. What happens if you override `equals()` but not `hashCode()`?

<details>
<summary>Answer</summary>

Equal objects will usually have different (identity-based) hash codes, so hash-based collections put them in different buckets. A `HashSet` can contain two equal elements, and `map.get(equalKey)` returns `null` even though an equal key is present. The bug is intermittent because identity hash codes can occasionally collide.

</details>

### Q3. What happens if you override `hashCode()` but not `equals()`?

<details>
<summary>Answer</summary>

The contract is not violated, but equality is still identity-based: two logically equal objects land in the same bucket, and then `Object.equals` rejects them. Sets keep both, and lookups with a new but equal key fail. The class behaves as if neither method were overridden, only with more collisions.

</details>

### Q4. Why should map keys be immutable?

<details>
<summary>Answer</summary>

The map stores an entry in the bucket chosen by the key's hash code at insertion time. If a field used by `hashCode` changes afterwards, the entry stays in the old bucket while lookups compute the new hash and search elsewhere — the entry becomes unreachable (cannot be found or removed), effectively a memory leak and a logic bug. Immutable keys cannot change, so this cannot happen.

</details>

### Q5. How does `HashMap.get()` find a value?

<details>
<summary>Answer</summary>

It computes the key's `hashCode`, mixes it, maps it to a bucket index, then scans the entries in that bucket (a short list or, for large buckets, a balanced tree), comparing stored hash values first and then calling `equals` on candidate keys. The value of the first key that is equal is returned; if none matches, `null`. Average time O(1) with a good hash function.

</details>

### Q6. Should `equals` use `instanceof` or `getClass()`?

<details>
<summary>Answer</summary>

Use `instanceof` when the class is `final` or when subclasses must not change the definition of equality; it also handles `null` and allows proxies/subclasses that add no state to compare equal. Use `getClass()` when subclasses may add fields to equality, so that objects of different classes are never equal and symmetry holds — at the cost of treating harmless subclasses as unequal. Often the best solution is to avoid inheritance for value classes (final classes, records, composition).

</details>

### Q7. Why must `equals` take an `Object` parameter?

<details>
<summary>Answer</summary>

To override `Object.equals(Object)`. A method `equals(Employee e)` is an overload; collections and `Objects.equals` call `equals(Object)`, which still uses identity. The `@Override` annotation catches this mistake at compile time.

</details>

## Applied

### Q8. What does this print?

```java
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class MutableKeyQuestion {

    static class Key {
        int id;

        Key(int id) {
            this.id = id;
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Key && ((Key) o).id == id;
        }

        @Override
        public int hashCode() {
            return Objects.hash(id);
        }
    }

    public static void main(String[] args) {
        Map<Key, String> map = new HashMap<>();
        Key k = new Key(1);
        map.put(k, "one");
        k.id = 2;
        System.out.println(map.get(k) + " " + map.get(new Key(1)) + " " + map.containsValue("one"));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
null null true
```

After the mutation, `map.get(k)` looks in the bucket for hash(2), where the entry is not stored. `map.get(new Key(1))` reaches the right bucket but the stored key now has id 2, so `equals` fails. `containsValue` scans every entry without hashing keys, so it still finds `"one"`.

</details>

### Q9. Two `Customer` objects loaded from the database in different requests represent the same row. How should their `equals`/`hashCode` be designed?

<details>
<summary>Answer</summary>

Base equality on a stable business or database identifier (for example `customerId`), not on all fields (names and addresses change) and not on identity (two loads produce two objects). The id must not change while the object sits in a hash-based collection. If ids are generated only on save, newly created objects need care — for example, use a natural key assigned at creation, or a UUID generated in the constructor.

</details>

### Q10. What does this print, and why?

```java
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ArrayKeys {
    public static void main(String[] args) {
        Set<int[]> arrays = new HashSet<>();
        arrays.add(new int[] {1, 2});
        System.out.println(arrays.contains(new int[] {1, 2}));

        Set<List<Integer>> lists = new HashSet<>();
        lists.add(List.of(1, 2));
        System.out.println(lists.contains(List.of(1, 2)));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
false
true
```

Arrays inherit `equals` and `hashCode` from `Object`, so two arrays with the same contents are different keys. `List` implementations override both by contents. Use lists (or wrap arrays in a value class using `Arrays.equals`/`Arrays.hashCode`) as keys.

</details>
