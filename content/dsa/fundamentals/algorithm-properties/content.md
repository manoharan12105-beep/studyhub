# Algorithm Properties: Stable, In-Place, Adaptive, Online

## Definition

Beyond time and space, algorithms — especially sorting algorithms — are described by a few yes/no properties. A **stable** sort keeps equal elements in their original relative order. An **in-place** algorithm uses O(1) extra memory. An **adaptive** algorithm runs faster on input that is already partly ordered. An **online** algorithm can process input piece by piece as it arrives. **Comparison-based** algorithms learn about the data only by comparing pairs of elements.

## Why It Matters

These properties decide which algorithm is correct for a task, not just which is fastest. Sorting employees by department after sorting them by name only works with a stable sort. Interviewers commonly ask "is merge sort stable?", "why is quick sort not stable?", "can you sort faster than n log n?".

## Core Concept

### Stability

A sort is **stable** if, whenever two elements compare as equal, the one that came first in the input also comes first in the output.

```text
Input (name, grade):   (Asha, B)  (Ben, A)  (Chen, B)  (Dev, A)
Sort by grade:

Stable:                (Ben, A)  (Dev, A)  (Asha, B)  (Chen, B)    ← Ben before Dev, Asha before Chen (input order kept)
Unstable (possible):   (Dev, A)  (Ben, A)  (Chen, B)  (Asha, B)    ← equal grades reordered
```

**Why it matters — multi-key sorting:** to sort by grade, and by name within each grade, sort by name first, then *stable*-sort by grade. The second sort keeps the name order inside each grade.

**What makes a sort unstable:** swapping elements across long distances. Selection sort swaps the minimum into position i, possibly jumping it over an equal element. Merge sort is stable because on ties the merge takes from the **left** half first.

### In-place

An algorithm is **in-place** if it needs only O(1) auxiliary memory beyond the input (some texts also allow the O(log n) recursion stack). In-place algorithms modify the input. See [Space Complexity](../space-complexity/content.md).

### Adaptive

An **adaptive** algorithm exploits existing order. Insertion sort does about n + (number of inversions) work, so it is O(n) on sorted input. Merge sort as usually written is not adaptive (always Θ(n log n)); TimSort, used by Java for objects, is adaptive — it detects existing sorted runs.

An **inversion** is a pair (i, j) with i < j but a[i] > a[j]. A sorted array has 0 inversions; a reversed one has n(n − 1)/2.

### Online

An **online** algorithm handles each element as it arrives, without seeing the future. Insertion sort is online (insert each new element into the sorted prefix). Selection sort is not (it needs the global minimum of everything). Running medians with two heaps and streaming top-K with a heap are online algorithms.

### Comparison-based vs non-comparison

**Comparison-based** sorts only ask "is a < b?". Any comparison sort needs **Ω(n log n)** comparisons in the worst case:

- There are n! possible orderings of n distinct elements; the algorithm must distinguish all of them.
- Each comparison has two outcomes, so k comparisons can distinguish at most 2ᵏ cases.
- Need 2ᵏ ≥ n!, so k ≥ log₂(n!) ≈ n log₂ n − 1.44n = Ω(n log n).

**Non-comparison** sorts (counting, radix, bucket) beat this bound by using the values themselves as array indices, but only work for restricted inputs (small integer range, fixed-length keys, uniformly distributed values).

### Property table for sorting algorithms

| Algorithm | Stable | In-place | Adaptive | Comparison | Worst time |
|-----------|--------|----------|----------|------------|-----------|
| [Bubble sort](../../algorithms/bubble-sort/content.md) (with early exit) | Yes | Yes | Yes | Yes | O(n²) |
| [Selection sort](../../algorithms/selection-sort/content.md) | No | Yes | No | Yes | O(n²) |
| [Insertion sort](../../algorithms/insertion-sort/content.md) | Yes | Yes | Yes | Yes | O(n²) |
| [Merge sort](../../algorithms/merge-sort/content.md) | Yes | No (O(n)) | No | Yes | O(n log n) |
| [Quick sort](../../algorithms/quick-sort/content.md) | No | Yes (O(log n) stack avg) | No | Yes | O(n²) |
| [Heap sort](../../algorithms/heap-sort/content.md) | No | Yes | No | Yes | O(n log n) |
| [Counting sort](../../algorithms/counting-sort/content.md) | Yes (prefix-sum version) | No (O(n + k)) | — | No | O(n + k) |
| [Radix sort](../../algorithms/radix-sort/content.md) (LSD) | Yes | No | — | No | O(d × (n + b)) |
| [Bucket sort](../../algorithms/bucket-sort/content.md) | Yes if buckets use a stable sort | No | — | No | O(n²) (all in one bucket) |

Key: k = range of values, d = number of digits, b = base.

### Making any sort stable

Sort pairs (value, original index) and break ties by index. Costs O(n) extra memory.

### What Java uses

| Call | Algorithm | Stable |
|------|-----------|--------|
| `Arrays.sort(int[])` and other primitive arrays | Dual-pivot quick sort | No — but irrelevant, equal primitives are indistinguishable |
| `Arrays.sort(Object[])`, `Collections.sort`, `List.sort` | TimSort (merge + insertion hybrid) | Yes — guaranteed by the documentation |

## Java Example

Multi-key sorting relies on stability: sort by name, then stable-sort by grade.

```java
import java.util.*;

public class StabilityDemo {

    record Student(String name, char grade) { }

    public static void main(String[] args) {
        List<Student> students = new ArrayList<>(List.of(
            new Student("Chen", 'B'),
            new Student("Dev", 'A'),
            new Student("Asha", 'B'),
            new Student("Ben", 'A')));

        students.sort(Comparator.comparing(Student::name));    // first key: name
        students.sort(Comparator.comparing(Student::grade));   // stable: names stay sorted within a grade

        for (Student s : students) {
            System.out.print(s.grade() + ":" + s.name() + " ");
        }
        System.out.println();

        // Same result in one sort with a combined comparator:
        students.sort(Comparator.comparing(Student::grade).thenComparing(Student::name));
        System.out.println(students.get(0).name() + " first");
    }
}
```

**Output:**

```text
A:Ben A:Dev B:Asha B:Chen 
Ben first
```

## Common Misconceptions

- **"Stability matters for `int[]`."** Equal primitive values are indistinguishable, so stability only matters when elements carry other data.
- **"In-place means O(1) time."** It is about memory, not time.
- **"Nothing sorts faster than n log n."** Only comparison sorts are bound by Ω(n log n); counting and radix sort are linear for suitable inputs.
- **"Merge sort is stable no matter how it is written."** Only if ties take from the left half (`<=` in the merge).

## Key Takeaways

- Stable = equal keys keep input order; needed for multi-key sorting.
- In-place = O(1) extra memory (± recursion stack); adaptive = faster on nearly-sorted input; online = processes input as it arrives.
- Comparison sorts need Ω(n log n) comparisons; non-comparison sorts trade generality for linear time.
- Java: primitives → dual-pivot quick sort (unstable); objects → TimSort (stable).
