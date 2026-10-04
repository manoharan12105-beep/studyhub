# Fast and Slow Pointers — Practice

### P1. Is a linked list a palindrome?

**Difficulty:** Easy · **Pattern:** Middle + reverse the second half

Return whether the values of a singly linked list read the same forwards and backwards, using O(1) extra space.

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: 1 → 2 → 2 → 1 → `true`; 1 → 2 → `false`.

<details>
<summary>Hint</summary>

Find the middle with slow/fast, reverse the list from the middle on, and compare the two halves node by node.

</details>

<details>
<summary>Answer</summary>

```java
public class PalindromeList {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val, ListNode next) { this.val = val; this.next = next; }
    }

    static boolean isPalindrome(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        ListNode prev = null;                          // reverse from the middle
        while (slow != null) {
            ListNode next = slow.next;
            slow.next = prev;
            prev = slow;
            slow = next;
        }
        for (ListNode a = head, b = prev; b != null; a = a.next, b = b.next) {
            if (a.val != b.val) return false;
        }
        return true;
    }

    static ListNode of(int... v) {
        ListNode head = null;
        for (int i = v.length - 1; i >= 0; i--) head = new ListNode(v[i], head);
        return head;
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome(of(1, 2, 2, 1)) + " " + isPalindrome(of(1, 2)) + " " + isPalindrome(of(1, 2, 3, 2, 1)) + " " + isPalindrome(of(7)));
    }
}
```

**Output:**

```text
true false true true
```

**Complexity:** O(n) time, O(1) space. In an interview, mention that the list is modified and can be restored by reversing the second half again.

</details>

### P2. Maximum twin sum of a linked list

**Difficulty:** Medium · **Pattern:** Middle + reverse, then pair from both ends

For a list of even length n, node i and node n − 1 − i are twins. Return the maximum sum of a twin pair.

**Constraints:** n even, 2 ≤ n ≤ 10⁵.

Example: 5 → 4 → 2 → 1 → `6` (5 + 1 and 4 + 2 are both 6); 4 → 2 → 2 → 3 → `7`.

<details>
<summary>Hint</summary>

After reversing the second half, the twins line up: walk one pointer from the head and one from the reversed half's head together.

</details>

<details>
<summary>Answer</summary>

```java
public class MaxTwinSum {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val, ListNode next) { this.val = val; this.next = next; }
    }

    static int pairSum(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {   // slow stops at the start of the second half
            slow = slow.next;
            fast = fast.next.next;
        }
        ListNode prev = null;
        while (slow != null) {
            ListNode next = slow.next;
            slow.next = prev;
            prev = slow;
            slow = next;
        }
        int best = 0;
        for (ListNode a = head, b = prev; b != null; a = a.next, b = b.next) best = Math.max(best, a.val + b.val);
        return best;
    }

    static ListNode of(int... v) {
        ListNode head = null;
        for (int i = v.length - 1; i >= 0; i--) head = new ListNode(v[i], head);
        return head;
    }

    public static void main(String[] args) {
        System.out.println(pairSum(of(5, 4, 2, 1)) + " " + pairSum(of(4, 2, 2, 3)) + " " + pairSum(of(1, 100000)));
    }
}
```

**Output:**

```text
6 7 100001
```

**Complexity:** O(n) time, O(1) space. Copying values into an array also works with O(n) space.

</details>

### P3. Circular array loop

**Difficulty:** Medium · **Pattern:** Floyd on an implicit successor function

`nums` is circular; from index i you move `nums[i]` steps (forward if positive, backward if negative, wrapping around). Is there a cycle of length > 1 in which every move has the **same direction**?

**Constraints:** 1 ≤ n ≤ 5000; nums[i] ≠ 0, |nums[i]| ≤ 1000.

Example: `[2, -1, 1, 2, 2]` → `true` (0 → 2 → 3 → 0); `[-1, -2, -3, -4, -5, 6]` → `false`; `[1, -1, 5, 1, 4]` → `true` (3 → 4 → 3).

<details>
<summary>Hint</summary>

`next(i) = ((i + nums[i]) mod n + n) mod n`. From each start, run slow/fast but stop as soon as a step changes direction. A meeting point that is its own successor is a length-1 loop and does not count. Mark indices on failed walks so each index is explored once.

</details>

<details>
<summary>Answer</summary>

**Approach:** For start i with direction d = sign(nums[i]), advance slow once and fast twice while each visited index has the same sign. If they meet and the meeting index is not a self-loop, a valid cycle exists. Otherwise set every index on this path (same direction) to 0 so later starts stop immediately — total O(n).

```java
public class CircularArrayLoop {

    static int next(int[] a, int i) {
        int n = a.length;
        return ((i + a[i]) % n + n) % n;
    }

    static boolean circularArrayLoop(int[] a) {
        int n = a.length;
        for (int i = 0; i < n; i++) {
            if (a[i] == 0) continue;
            int slow = i, fast = i;
            // keep going while the next two steps of fast keep the start's direction
            while (a[next(a, fast)] * a[i] > 0 && a[next(a, next(a, fast))] * a[i] > 0) {
                slow = next(a, slow);
                fast = next(a, next(a, fast));
                if (slow == fast) {
                    if (slow == next(a, slow)) break;      // length-1 loop does not count
                    return true;
                }
            }
            int j = i, sign = a[i];                        // clear this failed path
            while (a[j] * sign > 0) {
                int nxt = next(a, j);
                a[j] = 0;
                j = nxt;
            }
        }
        return false;
    }

    public static void main(String[] args) {
        System.out.println(circularArrayLoop(new int[] {2, -1, 1, 2, 2}) + " " + circularArrayLoop(new int[] {-1, -2, -3, -4, -5, 6}) + " "
                + circularArrayLoop(new int[] {1, -1, 5, 1, 4}) + " " + circularArrayLoop(new int[] {1, 1}));
    }
}
```

**Output:**

```text
true false true true
```

**Complexity:** O(n) time (each index is cleared at most once after a failed walk), O(1) extra space. The input is modified; copy it first if that is not allowed.

</details>
