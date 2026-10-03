# Space Complexity

## Definition

**Space complexity** describes how much memory an algorithm uses as the input size n grows. **Auxiliary space** is the extra memory beyond the input itself — the number interviewers usually mean. An **in-place** algorithm uses only O(1) auxiliary space (sometimes O(log n) is also accepted, for the recursion stack).

## Why It Matters

Memory is limited, and memory use affects speed (allocation, garbage collection, cache misses). Many interview follow-ups are "can you do it in O(1) extra space?" — answering requires knowing exactly what your solution allocates, including the hidden recursion stack.

## Core Concept

### Total space vs auxiliary space

```text
Total space     = input space + auxiliary space
Auxiliary space = extra variables + extra structures + recursion stack
```

Reversing an array of n elements:

| Approach | Input | Auxiliary | Total |
|----------|-------|-----------|-------|
| Copy into a new array backwards | O(n) | O(n) | O(n) |
| Swap ends moving inward | O(n) | O(1) | O(n) |

Both are O(n) total, so "total space" hides the difference. That is why the convention is to report **auxiliary** space and say so.

> [!IMPORTANT]
> The output usually does not count as auxiliary space when the problem requires returning it (a list of all subsets must be stored somewhere). State this explicitly in an interview: "O(1) extra space, not counting the output."

### What uses memory

| Source | Space |
|--------|-------|
| A fixed number of primitive variables | O(1) |
| An array, list, set or map of n elements | O(n) |
| An n × m table (2D DP) | O(n × m) |
| A recursion that goes d levels deep | O(d) stack frames |
| `s.substring(...)`, `toCharArray()`, `split(...)` | a copy: O(length) |
| Boxed objects (`Integer` in collections) | O(n), but each element costs much more than an `int` |

### Recursion uses stack space

Each active recursive call keeps a stack frame (parameters, local variables, return address) until it returns. Space = maximum depth × frame size.

```java
// Depth n → O(n) auxiliary space, even though there are no arrays.
static int sum(int n) {
    if (n == 0) {
        return 0;
    }
    return n + sum(n - 1);
}
```

| Recursion | Max depth | Stack space |
|-----------|-----------|-------------|
| `sum(n)` above | n | O(n) |
| Binary search (recursive) | log n | O(log n) |
| Merge sort | log n | O(log n) stack + O(n) merge buffer = O(n) |
| Quick sort (average / worst) | log n / n | O(log n) / O(n) |
| DFS on a tree of height h | h | O(h): O(log n) balanced, O(n) skewed |

> [!WARNING]
> Java's default thread stack holds roughly 10⁴–10⁵ frames, depending on frame size and JVM settings. A recursion 10⁶ deep throws `StackOverflowError`. For deep inputs (long linked lists, skewed trees, big grids) use an iterative version with an explicit stack.

### Time–space trade-off

Using more memory often saves time:

| Problem | Less memory | More memory |
|---------|-------------|-------------|
| Duplicate check | sort in place, compare neighbours: O(n log n) time, O(1)–O(log n) space | hash set: O(n) time, O(n) space |
| Fibonacci(n) | plain recursion: O(2ⁿ) time, O(n) stack | memo table: O(n) time, O(n) space |
| Range sum queries | recompute: O(n) per query, O(1) space | prefix sums: O(1) per query, O(n) space |

Sometimes you get both: Fibonacci with two variables is O(n) time **and** O(1) space — the idea behind DP space optimisation.

### In-place algorithms

An algorithm is **in-place** if it transforms the input using O(1) auxiliary space (rearranging elements within the input itself).

| In-place | Not in-place |
|----------|--------------|
| Bubble, selection, insertion, heap sort | Merge sort (O(n) buffer) |
| Reversing an array by swapping | Counting sort (O(n + k) counts and output) |
| Quick sort (in place, but O(log n) stack on average) | Most hash-based solutions |

In-place algorithms **modify the input**. If the caller still needs the original, that is a problem — ask before mutating input in an interview.

## Java Example

Two ways to reverse an array, and a demonstration that deep recursion fails while the iterative version does not:

```java
import java.util.Arrays;

public class SpaceDemo {

    // O(n) auxiliary space: builds a second array.
    static int[] reversedCopy(int[] arr) {
        int[] result = new int[arr.length];
        for (int i = 0; i < arr.length; i++) {
            result[i] = arr[arr.length - 1 - i];
        }
        return result;
    }

    // O(1) auxiliary space: swaps in place.
    static void reverseInPlace(int[] arr) {
        int left = 0;
        int right = arr.length - 1;
        while (left < right) {
            int temp = arr[left];
            arr[left] = arr[right];
            arr[right] = temp;
            left++;
            right--;
        }
    }

    // O(n) stack space.
    static long sumRecursive(int n) {
        return n == 0 ? 0 : n + sumRecursive(n - 1);
    }

    // O(1) space.
    static long sumIterative(int n) {
        long total = 0;
        for (int i = 1; i <= n; i++) {
            total += i;
        }
        return total;
    }

    public static void main(String[] args) {
        int[] data = {1, 2, 3, 4, 5};
        System.out.println(Arrays.toString(reversedCopy(data)) + " original " + Arrays.toString(data));
        reverseInPlace(data);
        System.out.println(Arrays.toString(data));

        System.out.println(sumIterative(10_000_000));
        try {
            sumRecursive(10_000_000);
        } catch (StackOverflowError e) {
            System.out.println("recursive version: StackOverflowError");
        }
    }
}
```

**Output:**

```text
[5, 4, 3, 2, 1] original [1, 2, 3, 4, 5]
[5, 4, 3, 2, 1]
50000005000000
recursive version: StackOverflowError
```

## Common Misconceptions

- **"No arrays means O(1) space."** Recursion depth counts.
- **"In-place means no extra memory at all."** It means O(1) extra (a few variables); some definitions allow the O(log n) recursion stack, as in quick sort. Say which you mean.
- **"Space complexity includes the input."** By convention in interviews, report auxiliary space and say so.
- **"Strings are free to slice."** In Java, `substring` copies; repeated slicing in recursion multiplies memory.

## Key Takeaways

- Report **auxiliary** space; state whether the output is counted.
- Recursion costs O(max depth) stack space; very deep recursion overflows in Java.
- Time and space trade against each other (hash set vs sorting, memoization).
- In-place = O(1) extra space and modifies the input.
