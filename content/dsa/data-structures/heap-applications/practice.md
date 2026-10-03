# Heap Applications — Practice

### P1. K-th largest in a stream

**Difficulty:** Easy · **Pattern:** Size-k min-heap

Design a class that is constructed with k and an initial array, and has `add(val)` which adds a number to the stream and returns the current k-th largest element.

**Constraints:** 1 ≤ k ≤ 10⁴; at least k elements exist whenever `add` returns.

Example: k = 3, initial `[4, 5, 8, 2]`; add 3 → 4, add 5 → 5, add 10 → 5, add 9 → 8.

<details>
<summary>Hint</summary>

Keep only the k largest values seen so far.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class KthLargestStream {

    private final PriorityQueue<Integer> heap = new PriorityQueue<>();
    private final int k;

    KthLargestStream(int k, int[] initial) {
        this.k = k;
        for (int x : initial) add(x);
    }

    int add(int value) {
        heap.offer(value);
        if (heap.size() > k) heap.poll();
        return heap.peek();
    }

    public static void main(String[] args) {
        KthLargestStream s = new KthLargestStream(3, new int[] {4, 5, 8, 2});
        System.out.println(s.add(3) + " " + s.add(5) + " " + s.add(10) + " " + s.add(9));
    }
}
```

**Output:**

```text
4 5 5 8
```

**Complexity:** O(log k) per `add`, O(k) space.

</details>

### P2. Sort a nearly sorted array

**Difficulty:** Medium · **Pattern:** Sliding heap of size k + 1

Every element is at most k positions away from its sorted position. Sort the array in O(n log k).

**Constraints:** 1 ≤ n ≤ 10⁵; 0 ≤ k < n.

Example: `[6, 5, 3, 2, 8, 10, 9]`, k = 3 → `[2, 3, 5, 6, 8, 9, 10]`.

<details>
<summary>Hint</summary>

The smallest remaining element must be among the next k + 1 elements.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class NearlySorted {

    static void sortKSorted(int[] arr, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        int write = 0;
        for (int x : arr) {
            heap.offer(x);
            if (heap.size() > k) {
                arr[write++] = heap.poll();     // the minimum of a (k + 1)-window is final
            }
        }
        while (!heap.isEmpty()) arr[write++] = heap.poll();
    }

    public static void main(String[] args) {
        int[] a = {6, 5, 3, 2, 8, 10, 9};
        sortKSorted(a, 3);
        System.out.println(Arrays.toString(a));
    }
}
```

**Output:**

```text
[2, 3, 5, 6, 8, 9, 10]
```

**Complexity:** O(n log k) time, O(k) space. Writing back into `arr` is safe because `write` never passes the read position.

</details>

### P3. Merge k sorted linked lists

**Difficulty:** Medium · **Pattern:** Heap of list heads

Merge k sorted linked lists into one sorted list and return its head.

**Constraints:** 0 ≤ k ≤ 10⁴; total nodes N ≤ 10⁴.

<details>
<summary>Hint</summary>

Same idea as merging arrays, but the "next element" is simply `node.next`.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class MergeKLists {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    static ListNode mergeK(ListNode[] lists) {
        PriorityQueue<ListNode> heap = new PriorityQueue<>((a, b) -> Integer.compare(a.val, b.val));
        for (ListNode head : lists) if (head != null) heap.offer(head);
        ListNode dummy = new ListNode(0), tail = dummy;
        while (!heap.isEmpty()) {
            ListNode smallest = heap.poll();
            tail.next = smallest;
            tail = smallest;
            if (smallest.next != null) heap.offer(smallest.next);
        }
        return dummy.next;
    }

    static ListNode build(int... values) {
        ListNode dummy = new ListNode(0), t = dummy;
        for (int v : values) { t.next = new ListNode(v); t = t.next; }
        return dummy.next;
    }

    public static void main(String[] args) {
        ListNode merged = mergeK(new ListNode[] {build(1, 4, 5), build(1, 3, 4), build(2, 6), null});
        StringBuilder sb = new StringBuilder();
        for (ListNode n = merged; n != null; n = n.next) sb.append(n.val).append(' ');
        System.out.println(sb.toString().trim());
    }
}
```

**Output:**

```text
1 1 2 3 4 4 5 6
```

**Complexity:** O(N log k) time, O(k) space. Divide-and-conquer pairwise merging has the same O(N log k) bound with no heap.

</details>

### P4. Maximise capital with at most k projects

**Difficulty:** Hard · **Pattern:** Two heaps (unlocked vs locked)

You start with capital `w`. Project i needs `capital[i]` to start and adds `profit[i]` to your capital when done. Choose at most k projects (one at a time) to maximise the final capital.

**Constraints:** 1 ≤ k, n ≤ 10⁵.

Example: k = 2, w = 0, profits `[1, 2, 3]`, capital `[0, 1, 1]` → do project 0 (w = 1), then project 2 (w = 4) → `4`.

<details>
<summary>Hint</summary>

At each step, among projects you can afford, the most profitable is always the right choice (it only increases what you can afford later). Sort projects by required capital; move newly affordable ones into a max-heap of profits.

</details>

<details>
<summary>Answer</summary>

**Approach:** Projects sorted by capital act as a "locked" queue; a max-heap holds "unlocked" profits. Each round, unlock everything affordable, then take the best profit. Greedy is safe because profits are non-negative: taking the largest available profit never reduces future options.

```java
import java.util.*;

public class MaximizeCapital {

    static int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {
        int n = profits.length;
        Integer[] order = new Integer[n];
        for (int i = 0; i < n; i++) order[i] = i;
        Arrays.sort(order, Comparator.comparingInt(i -> capital[i]));
        PriorityQueue<Integer> available = new PriorityQueue<>(Comparator.reverseOrder());
        int next = 0;
        for (int round = 0; round < k; round++) {
            while (next < n && capital[order[next]] <= w) {
                available.offer(profits[order[next++]]);     // unlock affordable projects
            }
            if (available.isEmpty()) break;                  // nothing affordable: stop early
            w += available.poll();
        }
        return w;
    }

    public static void main(String[] args) {
        System.out.println(findMaximizedCapital(2, 0, new int[] {1, 2, 3}, new int[] {0, 1, 1}));
        System.out.println(findMaximizedCapital(3, 0, new int[] {1, 2, 3}, new int[] {0, 1, 2}));
    }
}
```

**Output:**

```text
4
6
```

**Complexity:** O(n log n + k log n) time, O(n) space.

</details>

### P5. Smallest range covering k sorted lists

**Difficulty:** Hard · **Pattern:** Merge-k heap + running maximum

Given k sorted lists, find the smallest range [a, b] that includes at least one number from each list (smaller width b − a wins; ties go to smaller a).

**Constraints:** 1 ≤ k ≤ 3500; each list has 1–50 elements.

Example: `[[4,10,15,24,26],[0,9,12,20],[5,18,22,30]]` → `[20, 24]`.

<details>
<summary>Hint</summary>

Keep one pointer per list. The current range is [min of pointed values, max of pointed values]. Only advancing the list holding the minimum can shrink the range.

</details>

<details>
<summary>Answer</summary>

**Approach:** A min-heap holds one element from each list; track the maximum of the heap separately. Record the range, pop the minimum, push the next element from that list (updating the maximum). Stop when a list runs out — no range can then include all lists with a larger minimum.

```java
import java.util.*;

public class SmallestRange {

    static int[] smallestRange(List<List<Integer>> lists) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));  // {value, list, index}
        int max = Integer.MIN_VALUE;
        for (int i = 0; i < lists.size(); i++) {
            int v = lists.get(i).get(0);
            heap.offer(new int[] {v, i, 0});
            max = Math.max(max, v);
        }
        int bestLow = 0, bestHigh = Integer.MAX_VALUE;
        while (true) {
            int[] top = heap.poll();
            if ((long) max - top[0] < (long) bestHigh - bestLow) {
                bestLow = top[0];
                bestHigh = max;
            }
            int list = top[1], next = top[2] + 1;
            if (next == lists.get(list).size()) break;     // this list is exhausted
            int v = lists.get(list).get(next);
            heap.offer(new int[] {v, list, next});
            max = Math.max(max, v);
        }
        return new int[] {bestLow, bestHigh};
    }

    public static void main(String[] args) {
        List<List<Integer>> lists = List.of(List.of(4, 10, 15, 24, 26), List.of(0, 9, 12, 20), List.of(5, 18, 22, 30));
        System.out.println(Arrays.toString(smallestRange(lists)));
    }
}
```

**Output:**

```text
[20, 24]
```

**Complexity:** O(N log k) time for N total elements, O(k) space.

</details>
