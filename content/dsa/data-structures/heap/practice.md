# Heap — Practice

### P1. Last stone weight

**Difficulty:** Easy · **Pattern:** Max-heap simulation

Each turn, take the two heaviest stones x ≤ y. If x == y both are destroyed; otherwise a stone of weight y − x remains. Return the weight of the last stone, or 0 if none remain.

**Constraints:** 1 ≤ n ≤ 30; 1 ≤ weight ≤ 1000.

Example: `[2, 7, 4, 1, 8, 1]` → `1`.

<details>
<summary>Hint</summary>

"Repeatedly take the largest" → max-heap.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class LastStone {

    static int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Comparator.reverseOrder());
        for (int s : stones) heap.offer(s);
        while (heap.size() > 1) {
            int y = heap.poll(), x = heap.poll();
            if (y != x) heap.offer(y - x);
        }
        return heap.isEmpty() ? 0 : heap.peek();
    }

    public static void main(String[] args) {
        System.out.println(lastStoneWeight(new int[] {2, 7, 4, 1, 8, 1}) + " " + lastStoneWeight(new int[] {3, 3}));
    }
}
```

**Output:**

```text
1 0
```

**Complexity:** O(n log n) time, O(n) space.

</details>

### P2. Is this array a max-heap?

**Difficulty:** Easy · **Pattern:** Array index formulas

Return `true` if the array represents a valid max-heap (0-based, children at 2i + 1 and 2i + 2).

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `[90, 15, 10, 7, 12, 2]` → `true`; `[9, 15, 10, 7, 12, 11]` → `false`.

<details>
<summary>Hint</summary>

Only non-leaf indices (0 to n/2 − 1) have children to compare.

</details>

<details>
<summary>Answer</summary>

```java
public class IsMaxHeap {

    static boolean isMaxHeap(int[] a) {
        for (int i = 0; i <= a.length / 2 - 1; i++) {
            int left = 2 * i + 1, right = left + 1;
            if (a[left] > a[i]) return false;
            if (right < a.length && a[right] > a[i]) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isMaxHeap(new int[] {90, 15, 10, 7, 12, 2}) + " " + isMaxHeap(new int[] {9, 15, 10, 7, 12, 11}));
    }
}
```

**Output:**

```text
true false
```

**Complexity:** O(n) time, O(1) space.

</details>

### P3. Minimum cost to connect ropes

**Difficulty:** Medium · **Pattern:** Greedy with a min-heap

Connecting two ropes of lengths a and b costs a + b and produces a rope of length a + b. Return the minimum total cost to connect all ropes into one.

**Constraints:** 1 ≤ n ≤ 10⁴; lengths ≤ 10⁴ (use `long` for the cost).

Example: `[4, 3, 2, 6]` → connect 2+3 (5), 4+5 (9), 6+9 (15) → `29`.

<details>
<summary>Hint</summary>

Every rope's length is paid once for each merge it takes part in. Merge the two shortest first — they should be counted the most times.

</details>

<details>
<summary>Answer</summary>

**Approach:** Repeatedly merge the two smallest lengths (the same greedy argument as Huffman coding — see [Greedy Algorithms](../../algorithms/greedy-algorithms/content.md)).

```java
import java.util.*;

public class ConnectRopes {

    static long minCost(int[] ropes) {
        PriorityQueue<Long> heap = new PriorityQueue<>();
        for (int r : ropes) heap.offer((long) r);
        long cost = 0;
        while (heap.size() > 1) {
            long merged = heap.poll() + heap.poll();
            cost += merged;
            heap.offer(merged);
        }
        return cost;
    }

    public static void main(String[] args) {
        System.out.println(minCost(new int[] {4, 3, 2, 6}) + " " + minCost(new int[] {5}));
    }
}
```

**Output:**

```text
29 0
```

**Complexity:** O(n log n) time, O(n) space.

</details>

### P4. Convert a min-heap array into a max-heap

**Difficulty:** Medium · **Pattern:** Bottom-up heapify

Given an array that is a valid min-heap, rearrange it in place into a valid max-heap in O(n).

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `[3, 5, 9, 6, 8, 20, 10, 12, 18, 9]` → one valid answer `[20, 18, 10, 12, 9, 9, 3, 5, 6, 8]`.

<details>
<summary>Hint</summary>

The existing order does not help. Run bottom-up max-heapify on the whole array.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class MinToMaxHeap {

    static void toMaxHeap(int[] a) {
        for (int i = a.length / 2 - 1; i >= 0; i--) siftDown(a, i);
    }

    static void siftDown(int[] a, int i) {
        while (true) {
            int left = 2 * i + 1, right = left + 1, largest = i;
            if (left < a.length && a[left] > a[largest]) largest = left;
            if (right < a.length && a[right] > a[largest]) largest = right;
            if (largest == i) return;
            int t = a[i]; a[i] = a[largest]; a[largest] = t;
            i = largest;
        }
    }

    public static void main(String[] args) {
        int[] a = {3, 5, 9, 6, 8, 20, 10, 12, 18, 9};
        toMaxHeap(a);
        System.out.println(Arrays.toString(a));
    }
}
```

**Output:**

```text
[20, 18, 10, 12, 9, 9, 3, 5, 6, 8]
```

**Complexity:** O(n) time, O(1) space.

</details>

### P5. K-th smallest element in a sorted matrix

**Difficulty:** Hard · **Pattern:** k-way merge with a heap

Each row and each column of an n × n matrix is sorted ascending. Return the k-th smallest element overall.

**Constraints:** 1 ≤ n ≤ 300; 1 ≤ k ≤ n².

Example: `[[1,5,9],[10,11,13],[12,13,15]]`, k = 8 → `13`.

<details>
<summary>Hint</summary>

Treat each row as a sorted list. Put the first element of every row into a min-heap; pop k − 1 times, each time pushing the next element of the popped element's row.

</details>

<details>
<summary>Answer</summary>

**Approach:** Flattening and sorting costs O(n² log n). The heap merge pops elements in global sorted order and only ever holds at most n entries. (An alternative is [Binary Search on Answer](../../patterns/binary-search-on-answer/content.md) over the value range: O(n log(max − min)).)

```java
import java.util.*;

public class KthSmallestMatrix {

    static int kthSmallest(int[][] m, int k) {
        int n = m.length;
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));  // {value, row, col}
        for (int r = 0; r < Math.min(n, k); r++) heap.offer(new int[] {m[r][0], r, 0});
        for (int i = 0; i < k - 1; i++) {
            int[] top = heap.poll();
            int r = top[1], c = top[2];
            if (c + 1 < n) heap.offer(new int[] {m[r][c + 1], r, c + 1});
        }
        return heap.peek()[0];
    }

    public static void main(String[] args) {
        int[][] m = {{1, 5, 9}, {10, 11, 13}, {12, 13, 15}};
        System.out.println(kthSmallest(m, 8) + " " + kthSmallest(m, 1) + " " + kthSmallest(m, 9));
    }
}
```

**Output:**

```text
13 1 15
```

**Complexity:** O(min(n, k) + k log min(n, k)) time, O(min(n, k)) space.

</details>
