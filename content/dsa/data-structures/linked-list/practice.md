# Linked List — Practice

All solutions use this node class:

```java
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}
```

### P1. Delete a node given only that node

**Difficulty:** Easy · **Pattern:** Copy the successor

You are given a reference to a node in a singly linked list, but **not** to the head. The node is not the tail. Delete it from the list.

**Constraints:** the node is not the last node; 2 ≤ n ≤ 1000.

Example: list `4 → 5 → 1 → 9`, node = 5 → `4 → 1 → 9`.

<details>
<summary>Hint</summary>

You cannot reach the predecessor. Can you make this node look like its successor?

</details>

<details>
<summary>Answer</summary>

**Approach:** Copy the next node's value into this node, then unlink the next node.

```java
public class DeleteGivenNode {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    static void deleteNode(ListNode node) {
        node.val = node.next.val;
        node.next = node.next.next;
    }

    public static void main(String[] args) {
        ListNode head = new ListNode(4);
        head.next = new ListNode(5);
        head.next.next = new ListNode(1);
        head.next.next.next = new ListNode(9);
        deleteNode(head.next);
        for (ListNode c = head; c != null; c = c.next) {
            System.out.print(c.val + " ");
        }
        System.out.println();
    }
}
```

**Output:**

```text
4 1 9
```

**Complexity:** O(1) time and space. It cannot work for the tail — there is no successor to copy.

</details>

### P2. Remove all nodes with a given value

**Difficulty:** Easy · **Pattern:** Dummy node

Remove every node whose value equals `val` and return the new head.

**Constraints:** 0 ≤ n ≤ 10⁴.

Example: `1 → 2 → 6 → 3 → 6`, val = 6 → `1 → 2 → 3`; `7 → 7 → 7`, val = 7 → empty.

<details>
<summary>Hint</summary>

The head itself may need removing — possibly several times. A dummy node in front avoids special cases.

</details>

<details>
<summary>Answer</summary>

```java
public class RemoveElements {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    static ListNode removeElements(ListNode head, int val) {
        ListNode dummy = new ListNode(0);
        dummy.next = head;
        ListNode prev = dummy;
        while (prev.next != null) {
            if (prev.next.val == val) {
                prev.next = prev.next.next;      // skip it; do not advance prev
            } else {
                prev = prev.next;
            }
        }
        return dummy.next;
    }

    static ListNode build(int... values) {
        ListNode dummy = new ListNode(0), tail = dummy;
        for (int v : values) {
            tail.next = new ListNode(v);
            tail = tail.next;
        }
        return dummy.next;
    }

    static String show(ListNode head) {
        StringBuilder sb = new StringBuilder("[");
        for (ListNode c = head; c != null; c = c.next) {
            sb.append(c.val).append(c.next != null ? ", " : "");
        }
        return sb.append("]").toString();
    }

    public static void main(String[] args) {
        System.out.println(show(removeElements(build(1, 2, 6, 3, 6), 6)));
        System.out.println(show(removeElements(build(7, 7, 7), 7)));
    }
}
```

**Output:**

```text
[1, 2, 3]
[]
```

**Complexity:** O(n) time, O(1) space. Note that `prev` stays put after a removal, because the new `prev.next` must also be checked.

</details>

### P3. Remove duplicates from a sorted list

**Difficulty:** Medium · **Pattern:** Compare with next

The list is sorted. Delete nodes so that each value appears once.

**Constraints:** 0 ≤ n ≤ 300.

Example: `1 → 1 → 2 → 3 → 3` → `1 → 2 → 3`.

<details>
<summary>Hint</summary>

Duplicates are adjacent in a sorted list.

</details>

<details>
<summary>Answer</summary>

```java
public class DedupSortedList {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    static ListNode deleteDuplicates(ListNode head) {
        ListNode current = head;
        while (current != null && current.next != null) {
            if (current.next.val == current.val) {
                current.next = current.next.next;   // drop the duplicate, stay on current
            } else {
                current = current.next;
            }
        }
        return head;
    }

    public static void main(String[] args) {
        int[] values = {1, 1, 2, 3, 3, 3};
        ListNode dummy = new ListNode(0), tail = dummy;
        for (int v : values) {
            tail.next = new ListNode(v);
            tail = tail.next;
        }
        for (ListNode c = deleteDuplicates(dummy.next); c != null; c = c.next) {
            System.out.print(c.val + " ");
        }
        System.out.println();
    }
}
```

**Output:**

```text
1 2 3
```

**Complexity:** O(n) time, O(1) space.

</details>

### P4. Remove the n-th node from the end in one pass

**Difficulty:** Medium · **Pattern:** Two pointers with a fixed gap

Remove the n-th node from the end of the list and return the head, traversing the list only once.

**Constraints:** 1 ≤ n ≤ list length ≤ 30.

Example: `1 → 2 → 3 → 4 → 5`, n = 2 → `1 → 2 → 3 → 5`.

<details>
<summary>Hint</summary>

Two-pass: compute the length, then walk to position length − n. One pass: move a `fast` pointer n + 1 steps ahead of `slow` (both starting at a dummy node), then move both until `fast` is null.

</details>

<details>
<summary>Answer</summary>

**Approach:** With a gap of n + 1 nodes, when `fast` falls off the end, `slow` is just **before** the node to remove. The dummy handles removing the head (n = length).

```java
public class RemoveNthFromEnd {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    static ListNode removeNthFromEnd(ListNode head, int n) {
        ListNode dummy = new ListNode(0);
        dummy.next = head;
        ListNode fast = dummy, slow = dummy;
        for (int i = 0; i <= n; i++) {
            fast = fast.next;                   // gap of n + 1
        }
        while (fast != null) {
            fast = fast.next;
            slow = slow.next;
        }
        slow.next = slow.next.next;
        return dummy.next;
    }

    static ListNode build(int... values) {
        ListNode dummy = new ListNode(0), tail = dummy;
        for (int v : values) {
            tail.next = new ListNode(v);
            tail = tail.next;
        }
        return dummy.next;
    }

    static void print(ListNode head) {
        for (ListNode c = head; c != null; c = c.next) {
            System.out.print(c.val + " ");
        }
        System.out.println("|");
    }

    public static void main(String[] args) {
        print(removeNthFromEnd(build(1, 2, 3, 4, 5), 2));
        print(removeNthFromEnd(build(1, 2), 2));      // removes the head
        print(removeNthFromEnd(build(1), 1));         // list becomes empty
    }
}
```

**Output:**

```text
1 2 3 5 |
2 |
|
```

**Complexity:** O(L) time in one pass, O(1) space.

</details>

### P5. Copy a list with random pointers

**Difficulty:** Hard · **Pattern:** Interleave copies (or hash map)

Each node has `next` and `random` (which may point to any node or `null`). Return a deep copy: new nodes only, with the same `next`/`random` structure.

**Constraints:** 0 ≤ n ≤ 1000.

<details>
<summary>Hint</summary>

A `HashMap<original, copy>` makes it easy in O(n) space. For O(1) extra space, insert each copy right after its original: then `original.random.next` is the copy of the random target.

</details>

<details>
<summary>Answer</summary>

**Approach (O(1) extra space):**

1. Interleave: A → A' → B → B' → …
2. Set randoms: `copy.random = original.random == null ? null : original.random.next`.
3. Separate the two lists, restoring the original.

```java
import java.util.*;

public class CopyRandomList {

    static class Node {
        int val;
        Node next, random;
        Node(int val) { this.val = val; }
    }

    static Node copyRandomList(Node head) {
        for (Node c = head; c != null; c = c.next.next) {          // 1. interleave
            Node copy = new Node(c.val);
            copy.next = c.next;
            c.next = copy;
        }
        for (Node c = head; c != null; c = c.next.next) {          // 2. random pointers
            c.next.random = (c.random == null) ? null : c.random.next;
        }
        Node dummy = new Node(0), copyTail = dummy;
        for (Node c = head; c != null; c = c.next) {               // 3. separate
            Node copy = c.next;
            c.next = copy.next;                                     // restore original
            copyTail.next = copy;
            copyTail = copy;
        }
        return dummy.next;
    }

    public static void main(String[] args) {
        Node a = new Node(7), b = new Node(13), c = new Node(11);
        a.next = b; b.next = c;
        b.random = a; c.random = c; a.random = null;
        Node copy = copyRandomList(a);
        List<String> out = new ArrayList<>();
        for (Node x = copy; x != null; x = x.next) {
            out.add(x.val + "(random=" + (x.random == null ? "null" : x.random.val) + ")");
        }
        System.out.println(out);
        System.out.println("distinct objects: " + (copy != a && copy.next != b) + ", original intact: " + (a.next == b));
    }
}
```

**Output:**

```text
[7(random=null), 13(random=7), 11(random=11)]
distinct objects: true, original intact: true
```

**Complexity:** O(n) time, O(1) extra space (besides the copy). The hash-map version is simpler to write and also O(n) time, with O(n) extra space.

</details>
