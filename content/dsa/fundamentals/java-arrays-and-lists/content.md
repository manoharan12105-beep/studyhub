# Java Toolkit: Arrays, ArrayList and LinkedList

## Purpose

The Java building blocks for sequences: built-in arrays, the `Arrays` utility class, `ArrayList` and `LinkedList`. For each: the underlying structure, the cost of the main operations, when to use it, and the traps that cost marks in interviews. The theory behind them is in [Arrays](../../data-structures/arrays/content.md) and [Linked List](../../data-structures/linked-list/content.md).

## Built-in Arrays

**Underlying structure:** one contiguous block of memory of fixed length. `int[]` stores the values themselves; `Integer[]` or `String[]` stores references to objects elsewhere on the heap.

```java
int[] counts = new int[26];             // all zeros (default values: 0, false, '\u0000', null)
int[] primes = {2, 3, 5, 7};
int[][] grid = new int[3][4];           // 3 rows, 4 columns
int length = primes.length;             // a field, not a method — no parentheses
```

| Operation | Cost |
|-----------|------|
| `arr[i]` read/write | O(1) |
| `arr.length` | O(1) |
| Resize | impossible — create a new array and copy (O(n)) |

**Use when** the size is known and fixed, for counting tables (`new int[26]` for letters), DP tables, and performance-critical code — primitives avoid boxing.

## The `Arrays` Utility Class

| Method | What it does | Cost |
|--------|--------------|------|
| `Arrays.sort(int[])` | dual-pivot quick sort, unstable | O(n log n) average |
| `Arrays.sort(T[], comparator)` | TimSort, stable | O(n log n) |
| `Arrays.sort(arr, from, to)` | sorts the range [from, to) | O(k log k) |
| `Arrays.binarySearch(arr, key)` | index if found, else `-(insertionPoint) - 1` | O(log n); array must be sorted |
| `Arrays.fill(arr, value)` | set every element | O(n) |
| `Arrays.copyOf(arr, newLength)` | copy, truncating or padding with defaults | O(newLength) |
| `Arrays.copyOfRange(arr, from, to)` | copy of [from, to) | O(to − from) |
| `Arrays.equals(a, b)` | element-wise equality | O(n) |
| `Arrays.toString(arr)` / `Arrays.deepToString(grid)` | readable output | O(n) |
| `Arrays.asList(a, b, c)` | fixed-size `List` view backed by the array | O(1) |
| `Arrays.stream(arr).sum()` | sum (fine for one-off use, not inside hot loops) | O(n) |

> [!WARNING]
> `Arrays.sort` on `int[]` cannot take a comparator. To sort integers in descending order or by a custom rule, use `Integer[]` with a comparator, or sort ascending and read backwards.

## `ArrayList`

**Underlying structure:** a dynamic array — an `Object[]` with spare capacity. When full, it grows to about 1.5× and copies (see [Amortized Analysis](../amortized-analysis/content.md)). Elements are objects, so `int` values are **boxed** into `Integer`.

| Operation | Cost |
|-----------|------|
| `get(i)`, `set(i, x)` | O(1) |
| `add(x)` at end | O(1) amortized |
| `add(i, x)`, `remove(i)` | O(n − i) — shifts the tail |
| `remove(Object)`, `contains(x)`, `indexOf(x)` | O(n) — linear scan |
| `size()`, `isEmpty()` | O(1) |
| `Collections.sort(list)` / `list.sort(cmp)` | O(n log n), stable |

**Use when** you need a growable sequence with index access — the default list in Java.
**Avoid when** you repeatedly insert/remove at the front (use `ArrayDeque`), or need frequent membership checks (use `HashSet`).

## `LinkedList`

**Underlying structure:** a doubly linked list with references to the first and last node. It implements both `List` and `Deque`.

| Operation | Cost |
|-----------|------|
| `addFirst`, `addLast`, `removeFirst`, `removeLast`, `peekFirst`, `peekLast` | O(1) |
| `get(i)`, `set(i, x)`, `add(i, x)`, `remove(i)` | O(n) — walks from the nearer end |
| Insert/remove at an `iterator`'s position | O(1) |
| `contains(x)` | O(n) |

**Use when** you need list behaviour with cheap removal through an iterator, or in the rare case the problem asks for it. **For stacks and queues, prefer `ArrayDeque`** — same O(1) operations, less memory per element (no node objects) and better cache behaviour.

> [!IMPORTANT]
> Interview problems about linked lists (reverse, detect cycle, merge) expect you to manipulate **your own** `ListNode` class, not `java.util.LinkedList`.

## Comparison

| Need | Best choice | Why |
|------|-------------|-----|
| Fixed size, primitives | `int[]` | no boxing, fastest |
| Growable list, random access | `ArrayList` | O(1) `get`, amortized O(1) append |
| Stack / queue / deque | `ArrayDeque` | O(1) at both ends |
| Remove from the middle while iterating | `LinkedList` with `ListIterator`, or `removeIf` on `ArrayList` | |
| Fixed list of constants | `List.of(...)` | immutable |

## Interview Traps

### `remove(int)` vs `remove(Object)`

`List<Integer>` has both `remove(int index)` and `remove(Object o)`. `list.remove(1)` removes the element **at index 1**, not the value 1.

### Comparing `Integer` with `==`

`==` compares references. Java caches `Integer` objects only from −128 to 127, so `==` happens to work for small values and fails for larger ones. Use `.equals()` or compare `int`s.

### Removing inside a for-each loop

Modifying a list while iterating it with for-each throws `ConcurrentModificationException`. Use `list.removeIf(...)` or an explicit `Iterator` with `it.remove()`.

### `Arrays.asList` and `List.of`

`Arrays.asList` returns a **fixed-size** list (`set` works, `add`/`remove` throw `UnsupportedOperationException`); `List.of` is fully **immutable** and rejects `null`. Wrap in `new ArrayList<>(...)` for a modifiable copy. Also, `Arrays.asList(intArray)` gives a `List<int[]>` with one element, not a list of numbers.

### Copying 2D arrays

`grid.clone()` copies only the outer array; rows are shared. Copy each row.

```java
import java.util.*;

public class ListTraps {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>(List.of(10, 1, 20, 1));
        list.remove(1);                          // removes index 1 (the value 1)
        System.out.println(list);
        list.remove(Integer.valueOf(1));         // removes the value 1
        System.out.println(list);

        Integer a = 127, b = 127, c = 1000, d = 1000;
        System.out.println((a == b) + " " + (c == d) + " " + c.equals(d));

        List<Integer> nums = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));
        nums.removeIf(x -> x % 2 == 0);          // safe removal while iterating
        System.out.println(nums);

        try {
            for (Integer x : nums) {
                if (x == 1) {
                    nums.remove(x);
                }
            }
        } catch (ConcurrentModificationException e) {
            System.out.println("ConcurrentModificationException");
        }

        List<Integer> fixed = Arrays.asList(3, 1, 2);
        fixed.set(0, 9);                         // allowed
        try {
            fixed.add(4);
        } catch (UnsupportedOperationException e) {
            System.out.println("asList is fixed-size: " + fixed);
        }

        int[][] grid = {{1, 2}, {3, 4}};
        int[][] shallow = grid.clone();
        shallow[0][0] = 99;                      // also changes grid[0][0]
        System.out.println(grid[0][0]);

        int[] sorted = {1, 3, 5, 7};
        System.out.println(Arrays.binarySearch(sorted, 5) + " " + Arrays.binarySearch(sorted, 4));
    }
}
```

**Output:**

```text
[10, 20, 1]
[10, 20]
true false true
[1, 3, 5]
ConcurrentModificationException
asList is fixed-size: [9, 1, 2]
99
2 -3
```

`binarySearch` returned −3 for the missing 4: insertion point 2 → −(2) − 1 = −3.

> [!NOTE]
> Removing during a for-each does not *always* throw — removing the second-to-last element can end the loop silently before the check runs. Never rely on it either way.

## Common Mistakes

- `arr.length()` (wrong) vs `arr.length` vs `str.length()` vs `list.size()`.
- Calling `list.contains` inside a loop — O(n²) overall; use a `HashSet`.
- `ArrayList.remove(0)` in a loop to simulate a queue — O(n) per call; use `ArrayDeque.poll()`.
- Using `LinkedList.get(i)` in a loop — O(n²).
- Forgetting that `Arrays.sort(int[])` gives no comparator option.

## Key Takeaways

- Arrays: fixed size, O(1) access, primitives without boxing.
- `ArrayList`: dynamic array — O(1) get, amortized O(1) append, O(n) insert/remove in the middle and `contains`.
- `LinkedList`: doubly linked — O(1) at the ends, O(n) by index; prefer `ArrayDeque` for stacks and queues.
- Traps: `remove(int)` vs `remove(Object)`, `Integer ==`, removal during for-each, fixed-size `Arrays.asList`.
