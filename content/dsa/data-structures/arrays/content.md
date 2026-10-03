# Arrays

## Definition

An **array** stores elements of one type in a single **contiguous** block of memory, each identified by an integer **index** from 0 to length − 1. A **static array** has a fixed length; a **dynamic array** (Java's `ArrayList`) grows automatically by allocating a larger array and copying.

## Why It Matters

Arrays are the foundation of almost everything else: strings, matrices, heaps, hash tables, DP tables and adjacency lists are all built on them. Most interview problems give their input as an array, and array techniques — two pointers, sliding window, prefix sums, in-place rearrangement — are the most frequently tested skills.

## Core Concept

### Contiguous memory gives O(1) access

Because elements sit side by side and have equal size, the address of element i is computed directly:

```text
address(arr[i]) = baseAddress + i × elementSize
```

No searching is needed, so reading or writing `arr[i]` is **O(1)**. This is called **random access**. It is also why indexing starts at 0: index i is the offset from the start.

Contiguity has a second benefit: when the CPU loads one element, neighbouring elements arrive in the same cache line, so sequential scans are very fast in practice.

### The cost: fixed positions

Every element has a fixed slot. Inserting or deleting in the middle means **shifting** all later elements by one place — O(n) work. And a static array cannot grow; you must allocate a new one and copy.

### Static vs dynamic arrays

| | Static array (`int[]`) | Dynamic array (`ArrayList`) |
|---|------------------------|-----------------------------|
| Size | fixed at creation | grows (about 1.5× in Java) when full |
| Append | impossible beyond capacity | O(1) amortized |
| Memory | exactly n slots | n ≤ capacity; spare slots reserved |
| Element type in Java | primitives or references | references only (`int` is boxed) |

How growth stays cheap on average is explained in [Amortized Analysis](../../fundamentals/amortized-analysis/content.md).

## Visual Explanation

```text
index:     0     1     2     3     4
         ┌─────┬─────┬─────┬─────┬─────┐
arr  →   │ 10  │ 20  │ 30  │ 40  │ 50  │      one contiguous block
         └─────┴─────┴─────┴─────┴─────┘
address: 1000  1004  1008  1012  1016          int = 4 bytes → arr[3] at 1000 + 3×4
```

## Types

| Type | Description |
|------|-------------|
| One-dimensional | a single row of elements |
| Multi-dimensional | arrays of arrays — see [2D Arrays and Matrices](../matrices/content.md) |
| Static | fixed length (`int[]`) |
| Dynamic | resizable (`ArrayList`) |
| Sorted | elements kept in order — enables binary search, costs O(n) per insertion |

## Operations

### Traversal

Visit every element once, left to right (or right to left).

```java
static int sum(int[] arr) {
    int total = 0;
    for (int value : arr) {          // enhanced for: no index needed
        total += value;
    }
    return total;
}
```

**Time:** O(n) · **Space:** O(1)

### Access and update

```java
int third = arr[2];                  // O(1)
arr[2] = 99;                         // O(1)
// arr[arr.length] throws ArrayIndexOutOfBoundsException — valid indices are 0..length-1
```

**Time:** O(1) · **Space:** O(1)

### Search

- **Unsorted:** check each element — [Linear Search](../../algorithms/linear-search/content.md), O(n).
- **Sorted:** halve the range each step — [Binary Search](../../algorithms/binary-search/content.md), O(log n).

```java
static int indexOf(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) {
            return i;
        }
    }
    return -1;                       // convention for "not found"
}
```

**Time:** O(n) · **Space:** O(1)

### Insertion

To insert `value` at `index` in an array holding `size` elements (with spare capacity):

1. Check `size < capacity` and `0 ≤ index ≤ size`.
2. Shift elements from `size − 1` down to `index` one place right — **iterate from the end**, or you overwrite values before moving them.
3. Write `value` at `index`; increment `size`.

```java
// Returns the new size. Assumes arr.length > size.
static int insertAt(int[] arr, int size, int index, int value) {
    for (int i = size - 1; i >= index; i--) {
        arr[i + 1] = arr[i];
    }
    arr[index] = value;
    return size + 1;
}
```

**Time:** O(n − index): O(1) at the end, O(n) at the front · **Space:** O(1)

### Deletion

1. Check `0 ≤ index < size`.
2. Shift elements from `index + 1` to `size − 1` one place left (iterate forwards).
3. Decrement `size`.

```java
// Returns the new size.
static int deleteAt(int[] arr, int size, int index) {
    for (int i = index; i < size - 1; i++) {
        arr[i] = arr[i + 1];
    }
    return size - 1;
}
```

**Time:** O(n − index) · **Space:** O(1)

> [!TIP]
> If order does not matter, delete in O(1): copy the **last** element into the deleted slot and shrink the size.

### Rotation

Rotating left by k moves each element k places towards the front, wrapping around: `[1,2,3,4,5]` rotated left by 2 → `[3,4,5,1,2]`. Always reduce `k %= n` first.

| Method | Idea | Time | Space |
|--------|------|------|-------|
| One step at a time, k times | shift everything by one, k times | O(n × k) | O(1) |
| Extra array | `result[i] = arr[(i + k) % n]` | O(n) | O(n) |
| **Reversal** | reverse first k, reverse the rest, reverse all | O(n) | O(1) |

Why reversal works for left rotation: write the array as A B, where A is the first k elements. We want B A. Reversing each part gives Aᴿ Bᴿ; reversing the whole gives (Aᴿ Bᴿ)ᴿ = B A.

```java
static void rotateLeft(int[] arr, int k) {
    int n = arr.length;
    if (n == 0) {
        return;
    }
    k %= n;
    reverse(arr, 0, k - 1);
    reverse(arr, k, n - 1);
    reverse(arr, 0, n - 1);
}

static void reverse(int[] arr, int left, int right) {
    while (left < right) {
        int temp = arr[left];
        arr[left++] = arr[right];
        arr[right--] = temp;
    }
}
```

**Time:** O(n) · **Space:** O(1)

### Prefix and suffix arrays

A **prefix array** stores a running summary from the left; a **suffix array** from the right (here "suffix array" means suffix aggregates — not the string data structure of the same name).

```text
arr        = [3, 1, 4, 1, 5]
prefixSum  = [3, 4, 8, 9, 14]      prefixSum[i] = arr[0] + ... + arr[i]
suffixMax  = [5, 5, 5, 5, 5]       suffixMax[i] = max(arr[i..n-1])
```

Precomputing them in O(n) answers many later questions in O(1):

- Sum of `arr[l..r]` = `prefixSum[r] − prefixSum[l − 1]` (or use a length-(n + 1) prefix array with `prefix[0] = 0` to avoid the special case) — the [Prefix Sum](../../patterns/prefix-sum/content.md) pattern.
- "Is arr[i] greater than everything to its right?" → compare with `suffixMax[i + 1]`.
- "Combine information from the left and the right of i" → prefix[i − 1] with suffix[i + 1].

```java
static long[] prefixSums(int[] arr) {
    long[] prefix = new long[arr.length + 1];   // prefix[i] = sum of the first i elements
    for (int i = 0; i < arr.length; i++) {
        prefix[i + 1] = prefix[i] + arr[i];
    }
    return prefix;
}
```

**Time:** O(n) to build, O(1) per range-sum query · **Space:** O(n)

## Full Java Implementation

A minimal dynamic array of `int` showing growth, insertion, deletion and access with bounds checks:

```java
import java.util.Arrays;

public class DynamicIntArray {

    private int[] data;
    private int size;

    public DynamicIntArray() {
        data = new int[2];
    }

    public int get(int index) {
        checkIndex(index, size);
        return data[index];
    }

    public void add(int value) {
        insert(size, value);
    }

    public void insert(int index, int value) {
        checkIndex(index, size + 1);            // inserting at size == appending
        if (size == data.length) {
            data = Arrays.copyOf(data, data.length * 2);   // grow geometrically
        }
        for (int i = size - 1; i >= index; i--) {
            data[i + 1] = data[i];               // shift right, from the end
        }
        data[index] = value;
        size++;
    }

    public int removeAt(int index) {
        checkIndex(index, size);
        int removed = data[index];
        for (int i = index; i < size - 1; i++) {
            data[i] = data[i + 1];               // shift left
        }
        size--;
        return removed;
    }

    public int size() {
        return size;
    }

    private static void checkIndex(int index, int limit) {
        if (index < 0 || index >= limit) {
            throw new IndexOutOfBoundsException("index " + index + ", limit " + limit);
        }
    }

    @Override
    public String toString() {
        return Arrays.toString(Arrays.copyOf(data, size)) + " capacity=" + data.length;
    }

    public static void main(String[] args) {
        DynamicIntArray arr = new DynamicIntArray();
        arr.add(10);
        arr.add(20);
        arr.add(40);                             // triggers growth 2 -> 4
        System.out.println(arr);
        arr.insert(2, 30);
        System.out.println(arr);
        System.out.println("removed " + arr.removeAt(0) + " -> " + arr);
        System.out.println("get(1) = " + arr.get(1));
        try {
            arr.get(5);
        } catch (IndexOutOfBoundsException e) {
            System.out.println("error: " + e.getMessage());
        }
    }
}
```

**Output:**

```text
[10, 20, 40] capacity=4
[10, 20, 30, 40] capacity=4
removed 10 -> [20, 30, 40] capacity=4
get(1) = 30
error: index 5, limit 3
```

## Dry Run

Insert 30 at index 2 into `[10, 20, 40]` (size 3, capacity 4):

| Step | i | Action | Array |
|------|---|--------|-------|
| start | — | — | `[10, 20, 40, _]` |
| shift | 2 | `data[3] = data[2]` | `[10, 20, 40, 40]` |
| stop | 1 | `1 < index 2`, loop ends | `[10, 20, 40, 40]` |
| write | — | `data[2] = 30`, size = 4 | `[10, 20, 30, 40]` |

Had the loop run forwards (`i = index` upward), `data[3] = data[2]` would happen after `data[2]` was already overwritten — a classic bug.

## Complexity Summary

| Operation | Best | Average | Worst | Space |
|-----------|------|---------|-------|-------|
| Access / update by index | O(1) | O(1) | O(1) | O(1) |
| Search (unsorted) | O(1) | O(n) | O(n) | O(1) |
| Search (sorted, binary) | O(1) | O(log n) | O(log n) | O(1) |
| Insert at end (dynamic) | O(1) | O(1) amortized | O(n) resize | O(1) amortized |
| Insert / delete at index | O(1) at end | O(n) | O(n) at front | O(1) |
| Rotate by k (reversal) | O(n) | O(n) | O(n) | O(1) |
| Build prefix sums | O(n) | O(n) | O(n) | O(n) |

## Advantages

- O(1) random access by index.
- Compact memory (no per-element pointers) and excellent cache locality.
- Simple and supported directly by the language.

## Disadvantages

- Fixed size (static) or occasional O(n) copies (dynamic).
- O(n) insertion and deletion anywhere except the end.
- Searching an unsorted array is O(n).

## Comparison

| Operation | Array / `ArrayList` | Linked list | Hash set |
|-----------|--------------------|-------------|----------|
| Access by index | O(1) | O(n) | — |
| Insert / delete at front | O(n) | O(1) | — |
| Insert / delete in middle (position known) | O(n) | O(1) | — |
| Search by value | O(n), O(log n) if sorted | O(n) | O(1) average |
| Memory per element | lowest | + 1–2 references | + bucket overhead |

## Java Collections Equivalent

- `int[]`, `String[]` — static arrays.
- `ArrayList<E>` — dynamic array of objects.
- `Arrays` — sort, fill, copy, binary search, `toString`.
- Details and traps: [Java Toolkit: Arrays, ArrayList and LinkedList](../../fundamentals/java-arrays-and-lists/content.md).

## Real-World Applications

- Image pixels, audio samples, sensor readings — contiguous numeric data.
- Lookup tables indexed by a small integer (character counts, month names).
- The storage behind heaps, hash tables, stacks and queues.
- DP tables in nearly every dynamic programming solution.

## Common Mistakes

- Off-by-one: the last index is `length − 1`; loops use `i < n`, not `i <= n`.
- Shifting in the wrong direction during insertion (overwrites data).
- Forgetting `k %= n` in rotation, or not handling n = 0.
- Integer overflow when summing many large `int`s — use `long` for sums.
- Assuming `arr2 = arr1` copies the array — it copies the reference; use `arr1.clone()` or `Arrays.copyOf`.

## Key Takeaways

- Contiguous memory → O(1) index access and fast scans; fixed slots → O(n) middle insert/delete.
- Dynamic arrays grow geometrically → O(1) amortized append.
- Rotation in O(n) time and O(1) space with three reversals.
- Prefix/suffix arrays trade O(n) memory for O(1) answers about ranges and "everything to the left/right".
