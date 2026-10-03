# Linked List Techniques

## Definition

The standard algorithms for manipulating singly linked lists: **reversal** (iterative and recursive), finding the **middle**, **detecting and removing a cycle**, finding the **intersection** of two lists, **merging** sorted lists, checking for a **palindrome**, and **sorting** a list. They all run in O(n) or O(n log n) time with O(1) extra space (or O(n) recursion stack for the recursive variants) by rewiring `next` references instead of copying values.

## Why It Matters

These are among the most frequently asked interview problems, and they combine into harder ones: "palindrome list" = middle + reverse + compare; "sort list" = middle + merge; "reorder list" = middle + reverse + merge. Learn them as reusable building blocks.

## Prerequisites

- [Linked List](../linked-list/content.md) — nodes, dummy nodes, insertion/deletion.
- [Fast and Slow Pointers](../../patterns/fast-and-slow-pointers/content.md) — the pattern behind middle and cycle detection.

## Intuition

Each technique keeps a small number of pointers and moves them carefully:

| Technique | Pointers | Key idea |
|-----------|----------|----------|
| Reverse | `prev`, `current`, `next` | turn each arrow around, saving the successor first |
| Middle | `slow` (1 step), `fast` (2 steps) | when fast reaches the end, slow is halfway |
| Cycle | `slow`, `fast` | in a loop, the faster pointer catches the slower one |
| Intersection | `a`, `b` switch lists at the end | both walk lenA + lenB, so they align |
| Merge | `tail` of the result, heads of both lists | always attach the smaller head |

## How It Works

### Reverse (iterative)

1. `prev = null`, `current = head`.
2. While `current != null`: save `next = current.next`; set `current.next = prev`; advance `prev = current`, `current = next`.
3. `prev` is the new head.

### Reverse (recursive)

1. Base case: an empty or one-node list is already reversed.
2. Reverse everything after `head`; call the result `newHead`.
3. `head.next` is now the **tail** of the reversed rest — point it back: `head.next.next = head`, then `head.next = null`.
4. Return `newHead`.

### Middle node

Move `slow` one step and `fast` two steps while `fast != null && fast.next != null`. For even length this returns the **second** middle; use `fast.next != null && fast.next.next != null` to get the first middle (needed when splitting for merge sort).

### Cycle detection — Floyd's algorithm

1. Move `slow` by 1 and `fast` by 2. If `fast` reaches `null`, there is no cycle.
2. If they meet, there is a cycle (inside the loop the gap shrinks by 1 each step, so fast cannot jump over slow).
3. **Find the cycle start:** reset one pointer to `head`; move both one step at a time; they meet at the start of the cycle.
4. **Remove the cycle:** walk from the start node around the loop to its last node and set its `next` to `null`.

Why step 3 works: let the distance from head to cycle start be a, from cycle start to the meeting point be b, and the cycle length be L. Slow walked a + b; fast walked 2(a + b), which is a + b plus a whole number k of loops: a + b = kL. So a = kL − b: walking a steps from the meeting point lands exactly at the cycle start, as does walking a steps from the head.

### Intersection of two lists

Pointer `a` walks list A then continues at the head of B; pointer `b` walks B then A. Both travel lenA + lenB steps at most, so they arrive at the intersection node at the same time — or both reach `null` together if the lists do not intersect.

### Merge two sorted lists

Use a dummy head and a `tail`. Repeatedly attach the smaller of the two current heads, then append whatever remains. Taking from the first list on ties keeps the merge stable.

### Palindrome list

1. Find the middle.
2. Reverse the second half.
3. Compare the first half with the reversed second half.
4. (Optional but polite) reverse the second half back to restore the input.

### Sort a list — merge sort

Split at the middle, sort each half recursively, merge. Merge sort suits linked lists: splitting and merging need no extra arrays and no random access. Quick sort is a poor fit (pivot handling needs random access to be efficient).

## Visual Explanation

```text
Iterative reversal of 1 → 2 → 3 → null

start:      prev=null   cur=1 → 2 → 3 → null
step 1:     null ← 1    prev=1   cur=2 → 3 → null
step 2:     null ← 1 ← 2    prev=2   cur=3 → null
step 3:     null ← 1 ← 2 ← 3    prev=3   cur=null   → new head = 3

Cycle:   head → 1 → 2 → 3 → 4 → 5
                        ↑         │
                        └── 7 ← 6 ┘        a = 2 (head..3), L = 5
```

## Pseudocode

```pseudocode
reverse(head):
    prev ← null, cur ← head
    while cur ≠ null:
        next ← cur.next
        cur.next ← prev
        prev ← cur
        cur ← next
    return prev

cycleStart(head):
    slow ← fast ← head
    while fast ≠ null and fast.next ≠ null:
        slow ← slow.next; fast ← fast.next.next
        if slow = fast:
            slow ← head
            while slow ≠ fast: slow ← slow.next; fast ← fast.next
            return slow
    return null
```

## Java Implementation

```java
public class LinkedListTechniques {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    static ListNode reverse(ListNode head) {
        ListNode prev = null, current = head;
        while (current != null) {
            ListNode next = current.next;   // save before overwriting
            current.next = prev;
            prev = current;
            current = next;
        }
        return prev;
    }

    static ListNode reverseRecursive(ListNode head) {
        if (head == null || head.next == null) {
            return head;
        }
        ListNode newHead = reverseRecursive(head.next);
        head.next.next = head;              // the old next is now the tail; point it back
        head.next = null;
        return newHead;
    }

    static ListNode middle(ListNode head) {         // second middle for even length
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }

    static ListNode cycleStart(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {
                slow = head;
                while (slow != fast) {
                    slow = slow.next;
                    fast = fast.next;
                }
                return slow;
            }
        }
        return null;
    }

    static void removeCycle(ListNode head) {
        ListNode start = cycleStart(head);
        if (start == null) {
            return;
        }
        ListNode last = start;
        while (last.next != start) {
            last = last.next;
        }
        last.next = null;
    }

    static ListNode intersection(ListNode headA, ListNode headB) {
        ListNode a = headA, b = headB;
        while (a != b) {
            a = (a == null) ? headB : a.next;
            b = (b == null) ? headA : b.next;
        }
        return a;                                    // intersection node, or null
    }

    static ListNode merge(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(0), tail = dummy;
        while (l1 != null && l2 != null) {
            if (l1.val <= l2.val) {                  // <= keeps the merge stable
                tail.next = l1;
                l1 = l1.next;
            } else {
                tail.next = l2;
                l2 = l2.next;
            }
            tail = tail.next;
        }
        tail.next = (l1 != null) ? l1 : l2;
        return dummy.next;
    }

    static boolean isPalindrome(ListNode head) {
        ListNode secondHalf = reverse(middle(head));
        ListNode p = head, q = secondHalf;
        boolean result = true;
        while (q != null) {
            if (p.val != q.val) {
                result = false;
                break;
            }
            p = p.next;
            q = q.next;
        }
        reverse(secondHalf);                         // restore the input
        return result;
    }

    static ListNode sort(ListNode head) {
        if (head == null || head.next == null) {
            return head;
        }
        ListNode slow = head, fast = head.next;      // slow ends at the FIRST middle
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        ListNode right = slow.next;
        slow.next = null;                            // cut into two halves
        return merge(sort(head), sort(right));
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
        StringBuilder sb = new StringBuilder();
        for (ListNode c = head; c != null; c = c.next) {
            sb.append(c.val).append(c.next != null ? "->" : "");
        }
        return sb.length() == 0 ? "empty" : sb.toString();
    }

    public static void main(String[] args) {
        System.out.println("reverse:   " + show(reverse(build(1, 2, 3, 4))));
        System.out.println("recursive: " + show(reverseRecursive(build(1, 2, 3, 4))));
        System.out.println("middle:    " + middle(build(1, 2, 3, 4, 5)).val + " and " + middle(build(1, 2, 3, 4)).val);

        ListNode cyc = build(1, 2, 3, 4, 5, 6, 7);
        ListNode node3 = cyc.next.next, node7 = node3.next.next.next.next;
        node7.next = node3;                          // 7 -> 3 creates a loop
        System.out.println("cycle start: " + cycleStart(cyc).val);
        removeCycle(cyc);
        System.out.println("after removal: " + show(cyc));

        ListNode common = build(8, 9);
        ListNode a = build(1, 2);
        a.next.next = common;
        ListNode b = build(5);
        b.next = common;
        System.out.println("intersection: " + intersection(a, b).val + ", none: " + intersection(build(1), build(2)));

        System.out.println("merge:  " + show(merge(build(1, 3, 5), build(2, 3, 6))));
        ListNode pal = build(1, 2, 3, 2, 1);
        System.out.println("palindrome: " + isPalindrome(pal) + " " + isPalindrome(build(1, 2)) + ", input kept: " + show(pal));
        System.out.println("sort:   " + show(sort(build(4, 1, 3, 9, 2, 2))));
    }
}
```

**Output:**

```text
reverse:   4->3->2->1
recursive: 4->3->2->1
middle:    3 and 3
cycle start: 3
after removal: 1->2->3->4->5->6->7
intersection: 8, none: null
merge:  1->2->3->3->5->6
palindrome: true false, input kept: 1->2->3->2->1
sort:   1->2->2->3->4->9
```

## Dry Run

Floyd's cycle detection on `1 → 2 → 3 → 4 → 5 → 6 → 7 → (back to 3)`:

| Step | slow | fast | Note |
|------|------|------|------|
| 0 | 1 | 1 | start |
| 1 | 2 | 3 | |
| 2 | 3 | 5 | |
| 3 | 4 | 7 | |
| 4 | 5 | 4 | fast went 7 → 3 → 4 |
| 5 | 6 | 6 | **meet** at 6 |
| reset | 1 (head) | 6 | move both by 1 |
| 1 | 2 | 7 | |
| 2 | 3 | 3 | **meet** at 3 = cycle start |

Check with the formula: a = 2 steps (1 → 3), meeting point b = 3 steps past the start (3 → 6), L = 5; a + b = 5 = 1 × L ✓.

## Complexity Analysis

| Technique | Time | Space | Why |
|-----------|------|-------|-----|
| Reverse (iterative) | O(n) | O(1) | each node visited once |
| Reverse (recursive) | O(n) | O(n) | one stack frame per node |
| Middle | O(n) | O(1) | fast covers the list once |
| Cycle detect / start / remove | O(n) | O(1) | slow enters the loop within a steps; fast catches it within L steps |
| Intersection | O(m + n) | O(1) | each pointer walks both lists at most once |
| Merge two sorted | O(m + n) | O(1) | each node attached once |
| Palindrome | O(n) | O(1) | middle + reverse + compare |
| Merge sort on list | O(n log n) | O(log n) recursion | log n levels, O(n) merging per level |

## Variations

- **Reverse a sub-range** (positions m..n) or **reverse in groups of k** — reuse the reversal loop and reconnect the ends.
- **Reorder list** L0 → Ln → L1 → Ln−1 …: middle + reverse second half + alternate merge.
- **Merge k sorted lists** — heap of k heads: see [Heap Applications](../heap-applications/content.md).
- **Cycle detection in other "next" functions** — a sequence where each value determines the next (finding a duplicate in an array, happy numbers) — see [Fast and Slow Pointers](../../patterns/fast-and-slow-pointers/content.md).

## Comparison

| Problem | Hash-set approach | Pointer approach |
|---------|-------------------|------------------|
| Detect cycle | store visited nodes: O(n) time, O(n) space | Floyd: O(n) time, O(1) space |
| Intersection | store nodes of A, scan B: O(m + n), O(m) space | switch heads: O(m + n), O(1) space |
| Palindrome | copy values to an array: O(n) space | reverse half: O(1) space (mutates temporarily) |

The pointer approaches are what interviewers usually want as the follow-up.

## Edge Cases

- Empty list and single-node list for every technique.
- Even vs odd length for middle and palindrome.
- Cycle that starts at the head; a self-loop (node points to itself).
- Lists of different lengths for intersection and merge; one list empty.

## Advantages

- O(1) extra space for nearly every technique.
- Building blocks combine into many harder problems.

## Disadvantages

- Easy to lose nodes or create accidental cycles with a wrong assignment order.
- Palindrome and some other tricks mutate the input temporarily.

## When to Use

- "In O(1) extra space" + linked list → pointer techniques instead of hash sets or arrays.
- "Middle", "k-th from end", "cycle", "loop" → fast/slow or fixed-gap pointers.
- "Sort a linked list" in O(n log n) → merge sort.

## Common Mistakes

- Overwriting `current.next` before saving it during reversal.
- Using the wrong middle for splitting: with the second middle, a 2-node list never splits and merge sort recurses forever.
- Checking only `fast != null` and then reading `fast.next.next` → `NullPointerException`.
- Forgetting `head.next = null` in recursive reversal → a 2-node cycle.
- Comparing node **values** instead of node **references** when looking for the intersection.

## Key Takeaways

- Reverse: save next, flip, advance — three pointers.
- Fast/slow pointers find middles and cycles; resetting one to head finds the cycle start because a = kL − b.
- Switching heads aligns two lists for intersection; dummy + tail merges sorted lists.
- Palindrome = middle + reverse + compare; sort = middle + merge sort.
