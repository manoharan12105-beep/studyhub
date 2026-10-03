# Linked List

## Definition

A **linked list** is a linear data structure made of **nodes**, where each node holds a value and a reference (**pointer**) to the next node. The list is accessed through its first node, the **head**; the last node points to `null`. Unlike an array, nodes are not contiguous in memory, so the list can grow and shrink one node at a time without shifting anything.

## Why It Matters

Linked lists trade O(1) index access for O(1) insertion and deletion at a known position. They underpin stacks, queues, hash-table chaining, LRU caches and adjacency lists. In interviews they are the standard test of **pointer manipulation**: changing `next` references in the right order without losing part of the list.

## Core Concept

### The node

```java
class ListNode {
    int val;
    ListNode next;

    ListNode(int val) {
        this.val = val;
    }
}
```

A variable of type `ListNode` holds a **reference** to a node, not the node itself. `current = current.next` moves the reference; `current.next = other` rewires the list.

### Invariants

- `head` is the first node, or `null` for an empty list.
- Following `next` from `head` reaches every node exactly once and ends at `null` (for a non-circular list).
- Optionally, `tail` references the last node so appending is O(1).

### Why no O(1) index access

There is no address arithmetic: to reach position k you must follow k `next` references from the head. That is the fundamental trade-off against arrays.

## Visual Explanation

```text
Singly linked list:
head
 │
 ▼
[10 | •]──►[20 | •]──►[30 | •]──►[40 | null]
                                   ▲
                                  tail

Doubly linked list:
null ◄──[• | 10 | •]◄──►[• | 20 | •]◄──►[• | 30 | •]──► null
         head                             tail

Circular singly linked list:
   ┌──────────────────────────────────────┐
   ▼                                      │
[10 | •]──►[20 | •]──►[30 | •]──►[40 | •]─┘
```

## Types

| Type | Each node stores | Extra ability | Cost |
|------|------------------|---------------|------|
| **Singly** | value, `next` | simplest, least memory | cannot move backwards; deleting a node needs its predecessor |
| **Doubly** | value, `prev`, `next` | move both ways; delete a known node in O(1) | one more reference per node; more pointers to update |
| **Circular** | last node points back to the first (singly or doubly) | traverse from any node; round-robin scheduling | loops never hit `null` — stop when you return to the start |

## Operations

### Traversal and length

```java
static int length(ListNode head) {
    int count = 0;
    for (ListNode current = head; current != null; current = current.next) {
        count++;
    }
    return count;
}
```

**Time:** O(n) · **Space:** O(1)

### Insert at head

1. Create the node.
2. Point it at the current head.
3. Make it the new head.

```java
static ListNode insertAtHead(ListNode head, int value) {
    ListNode node = new ListNode(value);
    node.next = head;
    return node;                    // the new head
}
```

**Time:** O(1) · **Space:** O(1)

### Insert after a given node / at a position

To insert after node `prev`: set `node.next = prev.next` **first**, then `prev.next = node`. Reversing those two lines loses the rest of the list.

```java
static void insertAfter(ListNode prev, int value) {
    ListNode node = new ListNode(value);
    node.next = prev.next;          // 1. new node points to the old successor
    prev.next = node;               // 2. predecessor points to the new node
}
```

**Time:** O(1) once `prev` is known; O(k) to walk to position k · **Space:** O(1)

### Delete by value

Find the node **before** the one to delete and bypass it: `prev.next = prev.next.next`. A **dummy (sentinel) node** placed before the head removes the special case of deleting the head itself.

```java
static ListNode deleteFirst(ListNode head, int value) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode prev = dummy;
    while (prev.next != null && prev.next.val != value) {
        prev = prev.next;
    }
    if (prev.next != null) {
        prev.next = prev.next.next; // unlink; Java's garbage collector frees the node
    }
    return dummy.next;              // may differ from head if head was deleted
}
```

**Time:** O(n) · **Space:** O(1)

> [!TIP]
> Use a dummy node whenever the head might change (deleting, merging, partitioning). Return `dummy.next` at the end.

### Search

Walk the list comparing values: O(n). Sorting does not help — there is no binary search without random access.

### Doubly linked list operations

Deleting a node you hold a reference to is O(1), because the node knows its predecessor:

```java
// DNode has: int val; DNode prev, next;
static void unlink(DNode node) {
    if (node.prev != null) node.prev.next = node.next;
    if (node.next != null) node.next.prev = node.prev;
    node.prev = null;
    node.next = null;
}
```

Implementations often use **two sentinels** (`head` and `tail` dummies) so `prev` and `next` are never `null` — this is how an LRU cache's list is usually written.

### Circular list traversal

Stop when you get back to the starting node, not at `null`:

```java
static void printCircular(ListNode start) {
    if (start == null) return;
    ListNode current = start;
    do {
        System.out.print(current.val + " ");
        current = current.next;
    } while (current != start);
}
```

Problems that "go around in a circle" — round-robin turns, the Josephus problem — fit circular lists.

## Full Java Implementation

A singly linked list with head and tail references:

```java
public class SinglyLinkedList {

    private static class Node {
        int val;
        Node next;

        Node(int val) {
            this.val = val;
        }
    }

    private Node head;
    private Node tail;
    private int size;

    public void addFirst(int val) {
        Node node = new Node(val);
        node.next = head;
        head = node;
        if (tail == null) {
            tail = node;                     // list was empty
        }
        size++;
    }

    public void addLast(int val) {
        Node node = new Node(val);
        if (tail == null) {
            head = tail = node;
        } else {
            tail.next = node;
            tail = node;
        }
        size++;
    }

    public void insertAt(int index, int val) {
        if (index < 0 || index > size) {
            throw new IndexOutOfBoundsException("index " + index);
        }
        if (index == 0) {
            addFirst(val);
            return;
        }
        if (index == size) {
            addLast(val);
            return;
        }
        Node prev = head;
        for (int i = 0; i < index - 1; i++) {
            prev = prev.next;
        }
        Node node = new Node(val);
        node.next = prev.next;
        prev.next = node;
        size++;
    }

    public boolean remove(int val) {
        Node dummy = new Node(0);
        dummy.next = head;
        Node prev = dummy;
        while (prev.next != null && prev.next.val != val) {
            prev = prev.next;
        }
        if (prev.next == null) {
            return false;
        }
        if (prev.next == tail) {
            tail = (prev == dummy) ? null : prev;   // removed the last node
        }
        prev.next = prev.next.next;
        head = dummy.next;
        size--;
        return true;
    }

    public int indexOf(int val) {
        int index = 0;
        for (Node current = head; current != null; current = current.next) {
            if (current.val == val) {
                return index;
            }
            index++;
        }
        return -1;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        for (Node current = head; current != null; current = current.next) {
            sb.append(current.val).append(" -> ");
        }
        return sb.append("null (size ").append(size).append(")").toString();
    }

    public static void main(String[] args) {
        SinglyLinkedList list = new SinglyLinkedList();
        list.addLast(20);
        list.addLast(40);
        list.addFirst(10);
        list.insertAt(2, 30);
        System.out.println(list);
        System.out.println("indexOf(30) = " + list.indexOf(30));
        list.remove(10);                      // head
        list.remove(40);                      // tail
        list.addLast(50);                     // tail must have been updated correctly
        System.out.println(list);
        System.out.println("remove(99) = " + list.remove(99));
    }
}
```

**Output:**

```text
10 -> 20 -> 30 -> 40 -> null (size 4)
indexOf(30) = 2
20 -> 30 -> 50 -> null (size 3)
remove(99) = false
```

## Dry Run

`insertAt(2, 30)` on `10 → 20 → 40`:

| Step | Action | State |
|------|--------|-------|
| 1 | `prev = head` (10); loop runs `index − 1 = 1` time → `prev` = 20 | prev at 20 |
| 2 | `node = 30`; `node.next = prev.next` (40) | 30 → 40, and 20 → 40 still |
| 3 | `prev.next = node` | 10 → 20 → 30 → 40 |

If step 3 ran before step 2, `prev.next` would already be 30 and `node.next = prev.next` would point 30 at itself, losing 40.

## Complexity Summary

| Operation | Singly (head + tail) | Doubly | Space |
|-----------|---------------------|--------|-------|
| Access k-th | O(n) | O(n) | O(1) |
| Insert / delete at head | O(1) | O(1) | O(1) |
| Insert at tail | O(1) | O(1) | O(1) |
| Delete at tail | O(n) | O(1) | O(1) |
| Insert after known node | O(1) | O(1) | O(1) |
| Delete known node | O(n) (find predecessor) | O(1) | O(1) |
| Search | O(n) | O(n) | O(1) |

Memory: O(n) total, with one (singly) or two (doubly) references of overhead per element.

## Advantages

- O(1) insertion/deletion at the ends and next to a known node — no shifting.
- Grows one node at a time; never needs a big copy.
- Splicing lists together is O(1) given the right nodes.

## Disadvantages

- O(n) access by index; no binary search.
- Extra memory per node for references.
- Poor cache locality: nodes are scattered in memory, so traversal is slower than an array scan in practice.

## Comparison

| | Array / `ArrayList` | Singly linked list | Doubly linked list |
|---|--------------------|--------------------|--------------------|
| Access by index | O(1) | O(n) | O(n) |
| Insert/delete at front | O(n) | O(1) | O(1) |
| Insert/delete at back | O(1) amortized | O(1) insert / O(n) delete | O(1) |
| Delete given node | O(n) | O(n) | O(1) |
| Memory per element | lowest | + 1 reference | + 2 references |
| Cache friendliness | excellent | poor | poor |

## Java Collections Equivalent

`java.util.LinkedList` is a **doubly** linked list implementing `List` and `Deque`. For stacks and queues prefer `ArrayDeque`; see [Java Toolkit: Arrays, ArrayList and LinkedList](../../fundamentals/java-arrays-and-lists/content.md). Interview problems use a hand-written `ListNode`.

## Real-World Applications

- LRU caches (hash map + doubly linked list).
- Hash table buckets (separate chaining).
- Undo/redo history, music playlists (doubly / circular lists).
- Memory allocators' free lists; adjacency lists in graphs.

## Common Mistakes

- Losing the rest of the list by updating `prev.next` before saving `prev.next` into the new node.
- Dereferencing `null`: check `current != null` (and `current.next != null` when you read `current.next.next`).
- Forgetting to update `head` when the first node is deleted — use a dummy node.
- Forgetting to update `tail` when the last node is deleted.
- Infinite loops on circular lists that test for `null`.

## Key Takeaways

- Nodes + `next` references; access by walking from the head (O(n)).
- O(1) insert/delete at a known position; save the successor before rewiring.
- Dummy nodes remove head special cases; doubly linked lists delete known nodes in O(1).
- Pointer-manipulation techniques (reverse, middle, cycles, merge) are in [Linked List Techniques](../linked-list-techniques/content.md).
