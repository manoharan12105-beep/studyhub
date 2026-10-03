# Insertion Sort — Practice

### P1. Every element of an array of n = 10⁶ elements is at most 3 positions from its sorted position. What is insertion sort's running time?

**Difficulty:** Easy · **Pattern:** O(n + inversions)

- A) O(n²)
- B) O(n log n)
- C) O(n) — about 3n shifts at most
- D) O(n³)

<details>
<summary>Hint</summary>

How far can each key move left?

</details>

<details>
<summary>Answer</summary>

**Answer:** C) O(n) — about 3n shifts at most

**Explanation:** A key at most 3 places from its final position has at most 3 larger elements before it, so each insertion shifts at most 3 elements: O(n × 3) = O(n). This is why insertion sort is used for nearly-sorted data.

</details>

### P2. Insertion sort on a linked list

**Difficulty:** Medium · **Pattern:** Insert into a sorted dummy list

Sort a singly linked list using insertion sort and return the new head.

**Constraints:** 1 ≤ n ≤ 5000.

Example: `4 → 2 → 1 → 3` → `1 → 2 → 3 → 4`.

<details>
<summary>Hint</summary>

Build a new sorted list behind a dummy node. For each node of the input, walk the sorted list from the dummy to find where it belongs and splice it in.

</details>

<details>
<summary>Answer</summary>

```java
public class InsertionSortList {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    static ListNode sort(ListNode head) {
        ListNode dummy = new ListNode(0);              // head of the sorted list
        ListNode current = head;
        while (current != null) {
            ListNode next = current.next;              // save before relinking
            ListNode prev = dummy;
            while (prev.next != null && prev.next.val <= current.val) {   // <= keeps it stable
                prev = prev.next;
            }
            current.next = prev.next;
            prev.next = current;
            current = next;
        }
        return dummy.next;
    }

    public static void main(String[] args) {
        ListNode head = new ListNode(4);
        head.next = new ListNode(2);
        head.next.next = new ListNode(1);
        head.next.next.next = new ListNode(3);
        StringBuilder sb = new StringBuilder();
        for (ListNode n = sort(head); n != null; n = n.next) sb.append(n.val).append(n.next != null ? " -> " : "");
        System.out.println(sb);
    }
}
```

**Output:**

```text
1 -> 2 -> 3 -> 4
```

**Complexity:** O(n²) worst case, O(1) extra space. No shifting is needed, but finding each position is linear. ([Merge sort](../merge-sort/content.md) sorts a list in O(n log n).)

</details>

### P3. Binary insertion sort: comparisons vs moves

**Difficulty:** Medium · **Pattern:** Separate the two costs

Implement insertion sort that finds each insert position with binary search (inserting **after** equal elements to stay stable). Count comparisons and element moves on a reversed array of 8 elements, and explain why the time is still O(n²).

**Constraints:** 1 ≤ n ≤ 10⁴.

<details>
<summary>Hint</summary>

Use an upper-bound search on the sorted prefix `arr[0..i−1]`, then shift the elements between that position and i.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class BinaryInsertionSort {

    static int comparisons, moves;

    static void sort(int[] arr) {
        for (int i = 1; i < arr.length; i++) {
            int key = arr[i];
            int lo = 0, hi = i;                       // upper bound of key in arr[0..i-1]
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                comparisons++;
                if (arr[mid] > key) hi = mid; else lo = mid + 1;
            }
            for (int j = i; j > lo; j--) {            // shift arr[lo..i-1] right by one
                arr[j] = arr[j - 1];
                moves++;
            }
            arr[lo] = key;
        }
    }

    public static void main(String[] args) {
        int[] arr = {8, 7, 6, 5, 4, 3, 2, 1};
        sort(arr);
        System.out.println(Arrays.toString(arr) + " comparisons=" + comparisons + " moves=" + moves);
    }
}
```

**Output:**

```text
[1, 2, 3, 4, 5, 6, 7, 8] comparisons=17 moves=28
```

**Explanation:** Comparisons drop to O(n log n) in total (17 here, versus 28 for plain insertion sort on this input), but the shifts are still n(n − 1)/2 = 28, so the time remains O(n²). Binary insertion helps only when comparisons are much more expensive than moves (for example, comparing long strings).

</details>
