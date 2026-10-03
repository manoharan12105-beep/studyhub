# Java Toolkit: Sorting, Comparable and Comparator

## Purpose

How to sort anything in Java: primitive arrays, object arrays, lists, and custom objects by one or several keys. Covers `Arrays.sort`, `Collections.sort`, `List.sort`, the `Comparable` and `Comparator` interfaces, comparator building methods, and the bugs that come from writing comparators by hand. For how sorting algorithms work, see the sorting topics starting at [Merge Sort](../../algorithms/merge-sort/content.md).

## What Each Sort Call Uses

| Call | Algorithm | Stable | Time | Extra space |
|------|-----------|--------|------|-------------|
| `Arrays.sort(int[] / long[] / double[] / char[])` | dual-pivot quick sort | no (irrelevant for primitives) | O(n log n) average and in practice | O(log n) |
| `Arrays.sort(T[])`, `Arrays.sort(T[], cmp)` | TimSort | yes | O(n log n) worst, O(n) on sorted input | up to O(n) |
| `Collections.sort(list)`, `list.sort(cmp)` | TimSort (on an array copy of the list) | yes | O(n log n) | O(n) |

> [!NOTE]
> Since Java 14 the primitive sort falls back to heap sort if the quick sort recursion goes too deep, which removes the O(n²) worst case in practice. Older JDKs could be forced into quadratic behaviour by adversarial input.

## `Comparable` — the Natural Order

A class implements `Comparable<T>` to define **one** natural ordering through `compareTo`:

```java
record Version(int major, int minor) implements Comparable<Version> {
    @Override
    public int compareTo(Version other) {
        if (major != other.major) {
            return Integer.compare(major, other.major);
        }
        return Integer.compare(minor, other.minor);
    }
}
```

The contract: return a **negative** number if `this` comes first, **zero** if equal in order, **positive** if `this` comes after. It must be consistent (if a < b and b < c then a < c) and should agree with `equals` when the objects go into `TreeSet`/`TreeMap`.

`String`, `Integer`, `Long`, `Character`, `LocalDate` and other standard classes are already `Comparable`.

## `Comparator` — Any Order You Need

A `Comparator<T>` is a separate object (often a lambda) that defines an ordering without changing the class. Use it for alternative orders, for classes you cannot modify, and for multi-key sorts.

| Building method | Meaning |
|-----------------|---------|
| `Comparator.comparingInt(Person::age)` | by an `int` key (no boxing) |
| `Comparator.comparing(Person::name)` | by any `Comparable` key |
| `.thenComparing(Person::name)` / `.thenComparingInt(...)` | tie-breaker |
| `.reversed()` | reverse the whole comparator built so far |
| `Comparator.reverseOrder()` / `naturalOrder()` | reverse/natural order of `Comparable` elements |
| `Comparator.nullsFirst(cmp)` | handle `null` values |
| `(a, b) -> Integer.compare(a[0], b[0])` | arrays such as `int[]` pairs |

> [!WARNING]
> `.reversed()` applies to **everything before it** in the chain. `comparing(A).thenComparing(B).reversed()` reverses both keys. To reverse only the first key, write `comparing(A, Comparator.reverseOrder()).thenComparing(B)`.

## Sorting Patterns Used in Interviews

| Task | Code |
|------|------|
| Intervals by start | `Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));` |
| Intervals by end (greedy scheduling) | `Arrays.sort(intervals, Comparator.comparingInt(a -> a[1]));` |
| Strings by length, then alphabetically | `list.sort(Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder()));` |
| Descending integers in a list | `list.sort(Comparator.reverseOrder());` |
| Indices by their values (argsort) | `Integer[] idx = …; Arrays.sort(idx, (i, j) -> Integer.compare(values[i], values[j]));` |
| Map entries by value, descending | `entries.sort(Map.Entry.<String, Integer>comparingByValue().reversed());` |

## Java Example

```java
import java.util.*;

public class SortingDemo {

    record Employee(String name, String dept, int salary) { }

    public static void main(String[] args) {
        List<Employee> staff = new ArrayList<>(List.of(
            new Employee("Ravi", "Eng", 90),
            new Employee("Anu", "Ops", 70),
            new Employee("Mei", "Eng", 120),
            new Employee("Joe", "Ops", 70),
            new Employee("Ola", "Eng", 90)));

        // Department ascending, then salary descending, then name ascending.
        staff.sort(Comparator.comparing(Employee::dept)
                .thenComparing(Employee::salary, Comparator.reverseOrder())
                .thenComparing(Employee::name));
        for (Employee e : staff) {
            System.out.print(e.name() + " ");
        }
        System.out.println();

        // Sort pairs by start, then by end.
        int[][] intervals = {{5, 8}, {1, 9}, {1, 3}, {2, 4}};
        Arrays.sort(intervals, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        System.out.println(Arrays.deepToString(intervals));

        // Argsort: indices ordered by the values they point to.
        int[] scores = {40, 10, 30, 20};
        Integer[] order = {0, 1, 2, 3};
        Arrays.sort(order, (i, j) -> Integer.compare(scores[i], scores[j]));
        System.out.println(Arrays.toString(order));
    }
}
```

**Output:**

```text
Mei Ola Ravi Anu Joe 
[[1, 3], [1, 9], [2, 4], [5, 8]]
[1, 3, 2, 0]
```

## Comparison

| | `Comparable` | `Comparator` |
|---|--------------|--------------|
| Where | inside the class (`compareTo`) | separate object / lambda (`compare`) |
| How many orders | one natural order | as many as you like |
| Used by | `Collections.sort(list)`, `TreeSet` with no comparator | `list.sort(cmp)`, `new TreeSet<>(cmp)`, `new PriorityQueue<>(cmp)` |
| Package | `java.lang` | `java.util` |

## Interview Traps

- **Subtraction comparators overflow:** `(a, b) -> a - b` breaks for values near `Integer.MIN_VALUE`/`MAX_VALUE`. Always `Integer.compare(a, b)` (or `Long.compare`).
- **Comparing `Integer` objects with `==`** inside a comparator compares references.
- **Inconsistent comparators** (e.g. returning random results or violating transitivity) can make TimSort throw `IllegalArgumentException: Comparison method violates its general contract!`.
- **Comparator returns 0 for distinct objects** → `TreeSet`/`TreeMap` drop one of them. Add tie-breakers.
- **Sorting `int[]` with a comparator** does not compile; box to `Integer[]` or sort and reverse.
- **Sorting a `List.of(...)`** throws `UnsupportedOperationException` (immutable); copy into an `ArrayList` first.

## Common Mistakes

- Using `.reversed()` at the end of a chain when only one key should be descending.
- Sorting inside a loop when one sort before the loop is enough.
- Forgetting that `Arrays.sort(arr, from, to)` excludes `to`.
- Assuming `Arrays.sort(int[])` is stable or "the same algorithm" as object sorting.

## Key Takeaways

- Primitives → dual-pivot quick sort; objects/lists → stable TimSort.
- `Comparable` = one natural order inside the class; `Comparator` = any order outside it.
- Build comparators with `comparing`, `comparingInt`, `thenComparing`, `reversed`, `reverseOrder`.
- Never compare by subtraction; add tie-breakers for sorted sets and maps.
