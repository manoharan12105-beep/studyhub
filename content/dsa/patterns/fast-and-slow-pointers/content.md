# Fast and Slow Pointers

## What Is the Pattern

**Fast and slow pointers** (Floyd's tortoise and hare) move two pointers through a sequence at different speeds — usually slow by one step and fast by two. Because of the speed difference:

- if the sequence **ends**, fast reaches the end first, and slow is at the **middle**;
- if the sequence **loops**, fast eventually laps slow and they **meet** inside the cycle.

The sequence can be a linked list, or any function x → f(x) applied repeatedly (array indices, digit transformations).

Tiny example: list 1 → 2 → 3 → 4 → 5. After two moves, slow is at 3 and fast at 5 (no next) — 3 is the middle.

## Why It Works

- **Middle:** after k steps slow has moved k nodes and fast 2k, so when fast reaches the end (≈ n), slow is at ≈ n/2.
- **Cycle meeting:** once both are inside a cycle of length C, the gap between them shrinks by 1 every step (fast gains one node per step), so they meet within C steps.
- **Cycle entrance:** let μ = distance from the start to the cycle entrance. At the meeting point slow has walked μ + a, fast 2(μ + a), and fast's extra distance μ + a is a multiple of C. So walking μ more steps from the meeting point lands on the entrance — the same μ steps a pointer from the start takes. Restart one pointer at the head and move both by one; they meet at the entrance.

All of this uses O(1) memory, where a visited `HashSet` would use O(n). Detailed mechanics: [Linked List Techniques](../../data-structures/linked-list-techniques/content.md).

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| Linked list + "middle", "cycle", "loop", "where does the cycle begin" | the classic uses |
| "Without extra space" / "O(1) memory" with a linked list | replaces a visited set |
| Repeatedly applying a function: "keep replacing the number by …", "follow the index stored at a[i]" | the values form an implicit linked list that must eventually cycle |
| Array of n + 1 values in [1, n], find the repeat, cannot modify the array | indices as `next` pointers → cycle entrance = duplicate |
| "Split a list in half" (palindrome check, merge sort on lists, reorder) | slow finds the middle |

## Typical Problem Structure

- Input: the head of a singly linked list, or an array/number whose values define a successor function.
- Output: a node (middle, cycle start), a boolean (has cycle, is palindrome), or a value (the duplicate, cycle length).
- Constraints often forbid modifying the input or using O(n) extra memory.

## Template

```pseudocode
// middle (second middle for even length)
slow ← head; fast ← head
while fast ≠ null and fast.next ≠ null:
    slow ← slow.next; fast ← fast.next.next
return slow

// cycle entrance
slow ← start; fast ← start
repeat: slow ← next(slow); fast ← next(next(fast)) until slow = fast   // (stop with "no cycle" if fast hits the end)
slow ← start
while slow ≠ fast: slow ← next(slow); fast ← next(fast)
return slow
```

## Java Template

```java
public class FastSlowTemplates {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    static ListNode middle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;                                   // second middle when the length is even
    }

    static ListNode cycleStart(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {                        // inside the cycle
                slow = head;
                while (slow != fast) {
                    slow = slow.next;
                    fast = fast.next;
                }
                return slow;                           // entrance
            }
        }
        return null;                                   // fast reached the end: no cycle
    }

    public static void main(String[] args) {
        ListNode[] nodes = new ListNode[6];
        for (int i = 0; i < 6; i++) nodes[i] = new ListNode(i);
        for (int i = 0; i < 5; i++) nodes[i].next = nodes[i + 1];
        System.out.print("middle " + middle(nodes[0]).val);
        nodes[5].next = nodes[2];                      // 0→1→2→3→4→5→2…
        System.out.println(", cycle starts at " + cycleStart(nodes[0]).val);
    }
}
```

**Output:**

```text
middle 3, cycle starts at 2
```

## Example Problem

**Find the duplicate number.** An array of n + 1 integers contains values in 1 … n, so at least one value repeats; exactly one value is repeated (possibly several times). Find it without modifying the array and with O(1) extra space. Example: `[1, 3, 4, 2, 2]` → `2`.

- **Brute force:** compare all pairs, O(n²); or sort (modifies the array); or a `HashSet` (O(n) space).
- **Observation:** treat index i as a node with an edge to `a[i]`. Index 0 is never a target (values ≥ 1), so start there. Two indices point to the duplicate value, so the walk from 0 enters a cycle whose **entrance** is the duplicate.
- **Pattern:** cycle entrance with Floyd's algorithm on `next(i) = a[i]`.

```java
public class FindDuplicateFloyd {

    static int findDuplicate(int[] a) {
        int slow = a[0], fast = a[a[0]];
        while (slow != fast) {                         // phase 1: meet inside the cycle
            slow = a[slow];
            fast = a[a[fast]];
        }
        slow = 0;
        while (slow != fast) {                         // phase 2: walk to the entrance
            slow = a[slow];
            fast = a[fast];
        }
        return slow;
    }

    public static void main(String[] args) {
        System.out.println(findDuplicate(new int[] {1, 3, 4, 2, 2}) + " " + findDuplicate(new int[] {3, 1, 3, 4, 2}) + " " + findDuplicate(new int[] {2, 2, 2, 2, 2}));
    }
}
```

**Output:**

```text
2 3 2
```

## Dry Run

`a = [1, 3, 4, 2, 2]`; the walk from index 0 is 0 → 1 → 3 → 2 → 4 → 2 → 4 … (entrance 2, cycle {2, 4}).

| Step | slow | fast |
|------|------|------|
| start | a[0] = 1 | a[a[0]] = a[1] = 3 |
| 1 | a[1] = 3 | a[a[3]] = a[2] = 4 |
| 2 | a[3] = 2 | a[a[4]] = a[2] = 4 |
| 3 | a[2] = 4 | a[a[4]] = 4 → meet at 4 |
| phase 2 | 0 → a[0] = 1 → a[1] = 3 → a[3] = 2 | 4 → a[4] = 2 → a[2] = 4 → a[4] = 2 |

After three phase-2 steps both are at 2 — the duplicate.

## Common Mistakes

- Loop condition `fast.next != null` without first checking `fast != null` (NullPointerException on even-length lists).
- Starting fast one step ahead in one phase but not accounting for it in the other.
- Comparing node **values** instead of node references when detecting a cycle in a list with repeated values.
- In the array version, starting at an index that can be inside the cycle (index 0 is safe only because values are ≥ 1).

## Variations

- **First vs second middle:** `while (fast.next != null && fast.next.next != null)` stops at the first middle.
- **Cycle length:** after meeting, keep one pointer fixed and count steps until the other returns.
- **Happy number / digit sequences:** cycle detection on `next(x) = sum of squared digits`.
- **Palindrome list:** find the middle, reverse the second half, compare, restore.
- **k-th node from the end:** a fixed gap of k between two pointers moving at the same speed.

## Complexity

| Task | Time | Space |
|------|------|-------|
| Middle | O(n) | O(1) |
| Cycle detection | O(μ + C) = O(n) | O(1) |
| Cycle entrance | O(n) | O(1) |

## When Not to Use It

- When O(n) extra memory is allowed and clarity matters more — a `HashSet` of visited nodes is simpler.
- Random access is available (an array with known length) — the middle is just `n / 2`.
- Graphs where nodes have several successors — cycle detection there needs [DFS colouring](../../algorithms/cycle-detection/content.md).

## Key Takeaways

- Slow ×1, fast ×2: fast at the end → slow at the middle; they meet → there is a cycle.
- Reset one pointer to the start and move both ×1 → they meet at the cycle entrance.
- Works on any repeated function, not just linked lists; O(1) extra space.
