# Linked List Techniques — Practice

### P1. Length of the loop

**Difficulty:** Easy · **Pattern:** Floyd's cycle detection

Return the number of nodes in the cycle of a linked list, or 0 if it has no cycle.

**Constraints:** 0 ≤ n ≤ 10⁴; O(1) extra space.

Example: `1 → 2 → 3 → 4 → 5 → (back to 3)` → `3`.

<details>
<summary>Hint</summary>

Once slow and fast meet, they are both inside the loop. Walk once around it.

</details>

<details>
<summary>Answer</summary>

```java
public class LoopLength {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    static int loopLength(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {
                int length = 1;
                for (ListNode p = slow.next; p != slow; p = p.next) {
                    length++;
                }
                return length;
            }
        }
        return 0;
    }

    public static void main(String[] args) {
        ListNode[] nodes = new ListNode[5];
        for (int i = 0; i < 5; i++) nodes[i] = new ListNode(i + 1);
        for (int i = 0; i < 4; i++) nodes[i].next = nodes[i + 1];
        System.out.println(loopLength(nodes[0]));
        nodes[4].next = nodes[2];                  // 5 -> 3
        System.out.println(loopLength(nodes[0]));
        nodes[4].next = nodes[4];                  // self-loop on 5
        System.out.println(loopLength(nodes[0]));
    }
}
```

**Output:**

```text
0
3
1
```

**Complexity:** O(n) time, O(1) space.

</details>

### P2. Reverse a sub-list

**Difficulty:** Medium · **Pattern:** Reversal with reconnection

Reverse the nodes from position `left` to position `right` (1-indexed) in one pass and return the head.

**Constraints:** 1 ≤ left ≤ right ≤ n ≤ 500.

Example: `1 → 2 → 3 → 4 → 5`, left = 2, right = 4 → `1 → 4 → 3 → 2 → 5`.

<details>
<summary>Hint</summary>

Walk `before` to the node just before position `left` (use a dummy for left = 1). Then repeatedly take the node after the sub-list's first node and move it to the front of the sub-list.

</details>

<details>
<summary>Answer</summary>

**Approach:** Keep `before` fixed and `first` = the original first node of the range. Each step detaches `first.next` and inserts it right after `before`. After right − left steps the range is reversed and already connected at both ends.

```java
public class ReverseBetween {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    static ListNode reverseBetween(ListNode head, int left, int right) {
        ListNode dummy = new ListNode(0);
        dummy.next = head;
        ListNode before = dummy;
        for (int i = 1; i < left; i++) {
            before = before.next;
        }
        ListNode first = before.next;              // will end up last in the range
        for (int i = 0; i < right - left; i++) {
            ListNode moved = first.next;
            first.next = moved.next;
            moved.next = before.next;
            before.next = moved;
        }
        return dummy.next;
    }

    static ListNode build(int... values) {
        ListNode dummy = new ListNode(0), tail = dummy;
        for (int v : values) { tail.next = new ListNode(v); tail = tail.next; }
        return dummy.next;
    }

    static void print(ListNode head) {
        for (ListNode c = head; c != null; c = c.next) System.out.print(c.val + " ");
        System.out.println();
    }

    public static void main(String[] args) {
        print(reverseBetween(build(1, 2, 3, 4, 5), 2, 4));
        print(reverseBetween(build(3, 5), 1, 2));
    }
}
```

**Output:**

```text
1 4 3 2 5
5 3
```

**Complexity:** O(n) time, O(1) space.

</details>

### P3. Add two numbers stored as lists

**Difficulty:** Medium · **Pattern:** Simultaneous traversal with carry

Two non-negative integers are stored in linked lists with digits in **reverse** order (ones digit first). Return their sum as a list in the same format.

**Constraints:** each list has 1–100 nodes; no leading zeros except the number 0.

Example: `2 → 4 → 3` (342) + `5 → 6 → 4` (465) → `7 → 0 → 8` (807).

<details>
<summary>Hint</summary>

Add digit by digit like on paper, carrying into the next node. Continue while either list or the carry remains.

</details>

<details>
<summary>Answer</summary>

```java
public class AddTwoNumbers {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    static ListNode add(ListNode a, ListNode b) {
        ListNode dummy = new ListNode(0), tail = dummy;
        int carry = 0;
        while (a != null || b != null || carry != 0) {
            int sum = carry;
            if (a != null) { sum += a.val; a = a.next; }
            if (b != null) { sum += b.val; b = b.next; }
            tail.next = new ListNode(sum % 10);
            tail = tail.next;
            carry = sum / 10;
        }
        return dummy.next;
    }

    static ListNode build(int... digits) {
        ListNode dummy = new ListNode(0), tail = dummy;
        for (int d : digits) { tail.next = new ListNode(d); tail = tail.next; }
        return dummy.next;
    }

    static void print(ListNode head) {
        for (ListNode c = head; c != null; c = c.next) System.out.print(c.val + " ");
        System.out.println();
    }

    public static void main(String[] args) {
        print(add(build(2, 4, 3), build(5, 6, 4)));
        print(add(build(9, 9, 9), build(1)));          // 999 + 1 = 1000
    }
}
```

**Output:**

```text
7 0 8
0 0 0 1
```

**Complexity:** O(max(m, n)) time, O(max(m, n)) space for the result. Numbers longer than `long` allows are no problem.

</details>

### P4. Odd–even rearrangement

**Difficulty:** Medium · **Pattern:** Two chains in one pass

Group all nodes at odd positions (1st, 3rd, …) followed by all nodes at even positions, keeping the relative order within each group. O(1) extra space.

**Constraints:** 0 ≤ n ≤ 10⁴.

Example: `1 → 2 → 3 → 4 → 5` → `1 → 3 → 5 → 2 → 4`.

<details>
<summary>Hint</summary>

Maintain the tail of the odd chain and the tail of the even chain; remember the even chain's head to attach at the end.

</details>

<details>
<summary>Answer</summary>

```java
public class OddEvenList {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    static ListNode oddEven(ListNode head) {
        if (head == null) {
            return null;
        }
        ListNode odd = head, even = head.next, evenHead = even;
        while (even != null && even.next != null) {
            odd.next = even.next;              // next odd node
            odd = odd.next;
            even.next = odd.next;              // next even node
            even = even.next;
        }
        odd.next = evenHead;
        return head;
    }

    public static void main(String[] args) {
        ListNode dummy = new ListNode(0), tail = dummy;
        for (int v = 1; v <= 5; v++) { tail.next = new ListNode(v); tail = tail.next; }
        for (ListNode c = oddEven(dummy.next); c != null; c = c.next) System.out.print(c.val + " ");
        System.out.println();
    }
}
```

**Output:**

```text
1 3 5 2 4
```

**Complexity:** O(n) time, O(1) space.

</details>

### P5. Reverse nodes in groups of k

**Difficulty:** Hard · **Pattern:** Repeated sub-list reversal

Reverse the list k nodes at a time. A final group with fewer than k nodes stays as it is. Only change links, not values.

**Constraints:** 1 ≤ k ≤ n ≤ 5000.

Example: `1 → 2 → 3 → 4 → 5`, k = 2 → `2 → 1 → 4 → 3 → 5`; k = 3 → `3 → 2 → 1 → 4 → 5`.

<details>
<summary>Hint</summary>

Before reversing a group, check that k nodes exist. Reverse the group with the standard three-pointer loop, then connect the previous group's tail to the new group head.

</details>

<details>
<summary>Answer</summary>

**Approach:** `groupPrev` is the node before the current group (a dummy at first). Find the k-th node; if missing, stop. Reverse the group with `prev` starting at the node *after* the group, so the reversed group's last node automatically points onward. Then link `groupPrev` to the new first node and move `groupPrev` to the group's old first node (now its last).

```java
public class ReverseKGroup {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    static ListNode reverseKGroup(ListNode head, int k) {
        ListNode dummy = new ListNode(0);
        dummy.next = head;
        ListNode groupPrev = dummy;
        while (true) {
            ListNode kth = groupPrev;
            for (int i = 0; i < k && kth != null; i++) {
                kth = kth.next;
            }
            if (kth == null) {
                break;                                  // fewer than k nodes left
            }
            ListNode groupNext = kth.next;
            ListNode prev = groupNext, current = groupPrev.next;
            while (current != groupNext) {              // reverse this group
                ListNode next = current.next;
                current.next = prev;
                prev = current;
                current = next;
            }
            ListNode oldFirst = groupPrev.next;
            groupPrev.next = kth;                       // kth is the new first
            groupPrev = oldFirst;                       // old first is the new last
        }
        return dummy.next;
    }

    static ListNode build(int n) {
        ListNode dummy = new ListNode(0), tail = dummy;
        for (int v = 1; v <= n; v++) { tail.next = new ListNode(v); tail = tail.next; }
        return dummy.next;
    }

    static void print(ListNode head) {
        for (ListNode c = head; c != null; c = c.next) System.out.print(c.val + " ");
        System.out.println();
    }

    public static void main(String[] args) {
        print(reverseKGroup(build(5), 2));
        print(reverseKGroup(build(5), 3));
        print(reverseKGroup(build(4), 1));
    }
}
```

**Output:**

```text
2 1 4 3 5
3 2 1 4 5
1 2 3 4
```

**Complexity:** O(n) time (each node is checked once by the k-step probe and reversed once), O(1) space.

</details>
