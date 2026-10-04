# DSA Implementation Questions

## Definition

**Implementation questions** ask you to write working code for a data structure, an API or an algorithm from a short specification: "Implement an LRU cache", "Design a set with O(1) insert, delete and random element", "Write an iterator over a 2D list". Unlike puzzle-style problems, the algorithmic idea is usually clear; the challenge is **correct, clean code** that meets stated complexity for every operation and handles edge cases.

## Why It Matters

- They are common in interviews because they mirror real engineering: combining standard structures to meet performance requirements.
- They test invariants (what must always be true about your fields), edge cases (empty, capacity 1, duplicates) and API discipline.
- Several classic questions (LRU, randomized set, iterators) appear again and again.

## Core Concept

Design with three questions before coding:

1. **Operations and required costs** — list each method with its target complexity.
2. **Which standard structures give those costs** — and how to combine them so every operation is covered:

| Need | Building block |
|------|----------------|
| O(1) lookup by key | `HashMap` |
| O(1) insertion/removal in the middle, given the node | doubly linked list with sentinels |
| O(1) random index access, O(1) removal by swapping with the last | array / `ArrayList` |
| Min/max repeatedly | heap (`PriorityQueue`) |
| Ordered keys, floor/ceiling | `TreeMap` |
| Prefix queries | trie |

3. **Invariants** — e.g. "the map and the list always contain the same keys", "index map stores each value's current position in the array".

## How It Works

1. Clarify the API: method names, return values for missing keys, capacity rules, thread safety (usually not required).
2. Write the fields and their invariants first.
3. Implement helper methods for the fiddly pointer updates (`addToFront`, `remove(node)`), then build public methods from them.
4. Walk through a short sequence of calls, updating the fields on paper.
5. State the complexity of every method.

## Java Example

A pattern that appears in several answers — a doubly linked list with two sentinel nodes, so insertions and removals never special-case `null`:

```java
public class SentinelList {

    static class Node {
        int key;
        Node prev, next;
        Node(int key) { this.key = key; }
    }

    private final Node head = new Node(-1), tail = new Node(-1);   // sentinels, never removed

    SentinelList() {
        head.next = tail;
        tail.prev = head;
    }

    void addFirst(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }

    void remove(Node node) {                    // O(1): neighbours always exist thanks to sentinels
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    public static void main(String[] args) {
        SentinelList list = new SentinelList();
        Node a = new Node(1), b = new Node(2), c = new Node(3);
        list.addFirst(a);
        list.addFirst(b);
        list.addFirst(c);                       // 3 2 1
        list.remove(b);                         // 3 1
        StringBuilder sb = new StringBuilder();
        for (Node x = list.head.next; x != list.tail; x = x.next) sb.append(x.key).append(' ');
        System.out.println(sb.toString().trim());
    }
}
```

**Output:**

```text
3 1
```

## Common Misconceptions

- **"Using `LinkedHashMap` is always acceptable for an LRU cache."** It is a fine first answer, but many interviewers then ask for the HashMap + doubly linked list version — know both.
- **"O(1) average is the same as O(1) worst case."** Hash-based designs are expected O(1); say so.
- **"The happy path is enough."** Capacity 1, updating an existing key, removing the last element, and empty structures are where implementations break.

## Key Takeaways

- List operations and target costs; combine standard structures to meet all of them.
- Write fields and invariants first; isolate pointer manipulation in helpers.
- Walk through a call sequence and state each method's complexity.
