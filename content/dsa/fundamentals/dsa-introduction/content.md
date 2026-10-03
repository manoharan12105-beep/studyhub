# Introduction to Data Structures and Algorithms

## Definition

A **data structure** is a way of organising data in memory so that certain operations on it are efficient. An **algorithm** is a finite, well-defined sequence of steps that turns an input into the required output. Choosing a data structure decides which operations are cheap; the algorithm decides which operations you perform and in what order.

## Why It Matters

The same problem can take a millisecond or an hour depending on these two choices.

Example: you have 1,000,000 user ids and must answer "is id X registered?" 100,000 times.

| Approach | Work per query | Total work (approx.) |
|----------|----------------|----------------------|
| Unsorted array, check every element | up to 1,000,000 comparisons | 10¹¹ comparisons — far too slow |
| Sorted array + binary search | about 20 comparisons | 2 × 10⁶ comparisons |
| Hash set | about 1 hash + 1 comparison on average | about 10⁵ operations |

Nothing changed except how the data was stored and searched. That is the whole subject in one table, and it is why interviews test it: the question is rarely "can you solve it" but "can you solve it efficiently and explain why your choice is efficient".

## Core Concept

### Data structure

A data structure has two sides:

- **Logical view** — what operations it offers (add, remove, find, get the minimum…).
- **Physical layout** — how the elements sit in memory (one contiguous block, nodes connected by references, a tree of nodes…).

The layout determines the cost of each operation:

| Layout | Strength | Weakness |
|--------|----------|----------|
| Contiguous block (array) | Element `i` is found directly by address arithmetic → O(1) access | Inserting in the middle shifts every later element → O(n) |
| Linked nodes (linked list) | Inserting next to a known node only rewires references → O(1) | Reaching element `i` means walking `i` nodes → O(n) |
| Hash table | Find by key in O(1) on average | No ordering; worst case O(n) when many keys collide |
| Balanced search tree | Sorted order, find/insert/delete in O(log n) | More memory and constant work per operation than a hash table |

No structure is best at everything. Every choice is a trade-off between operations.

### Algorithm

An algorithm must be:

1. **Correct** — produces the right output for every valid input, including edge cases.
2. **Finite** — always stops.
3. **Unambiguous** — each step has exactly one meaning.
4. **Efficient** — uses acceptable time and memory for the input sizes you expect.

Efficiency is measured with **time complexity** and **space complexity**: how the work and memory grow as the input grows. See [Time Complexity](../time-complexity/content.md).

### Data structure vs. algorithm

| Aspect | Data structure | Algorithm |
|--------|----------------|-----------|
| What it is | An organisation of data | A procedure on data |
| Question it answers | "How is the data stored?" | "What steps solve the problem?" |
| Examples | Array, hash map, heap, graph | Binary search, merge sort, Dijkstra |
| Measured by | Cost of each operation, memory used | Total running time and memory |

They are inseparable in practice. Dijkstra's algorithm is fast *because* it uses a heap; binary search works *because* the array is sorted.

### Abstract Data Type (ADT)

An **abstract data type** describes *what* operations exist and how they behave, without saying *how* they are implemented. A data structure is a concrete implementation of an ADT.

| ADT (the contract) | Operations | Possible implementations |
|--------------------|-----------|--------------------------|
| List | get(i), add, remove, size | Dynamic array, linked list |
| Stack | push, pop, peek (last in, first out) | Array, linked list |
| Queue | offer, poll, peek (first in, first out) | Circular array, linked list |
| Priority queue | insert, remove-min/max | Binary heap, balanced BST |
| Map | put, get, remove by key | Hash table, balanced BST |
| Set | add, remove, contains | Hash table, balanced BST |

Java mirrors this split exactly: `List`, `Queue`, `Deque`, `Map` and `Set` are **interfaces** (the ADT), while `ArrayList`, `LinkedList`, `ArrayDeque`, `HashMap` and `TreeMap` are **classes** (the data structures).

```java
import java.util.*;

public class AdtDemo {
    public static void main(String[] args) {
        // Program to the ADT (interface); the implementation can change without touching the rest of the code.
        List<Integer> list = new ArrayList<>();
        list.add(10);
        list.add(20);

        Map<String, Integer> ages = new TreeMap<>();   // TreeMap keeps keys sorted
        ages.put("ravi", 21);
        ages.put("anu", 22);

        Deque<Integer> stack = new ArrayDeque<>();     // Deque used as a stack
        stack.push(1);
        stack.push(2);

        System.out.println(list + " " + ages + " top=" + stack.peek());
    }
}
```

**Output:**

```text
[10, 20] {anu=22, ravi=21} top=2
```

> [!TIP]
> In interviews, first say which **ADT** the problem needs ("I need a map from value to index"), then choose the **implementation** ("a `HashMap`, because I only need lookups, not order"). It shows you separate the requirement from the tool.

## How It Works

How a problem turns into a data structure + algorithm choice:

1. List the operations the problem needs and how often each happens (e.g. "insert n times, ask for the minimum n times").
2. Pick the structure that makes the most frequent operations cheapest (minimum repeatedly → heap).
3. Design the algorithm as a sequence of those operations.
4. Estimate total cost = Σ (number of calls × cost per call).
5. Compare against the input size in the constraints. If it is too slow, change the structure or the algorithm.

## Types

| Classification | Meaning | Examples |
|----------------|---------|----------|
| Linear | Elements form a sequence; each has at most one predecessor and one successor | Array, linked list, stack, queue |
| Non-linear | Elements branch or connect arbitrarily | Tree, heap, trie, graph |
| Static | Size fixed at creation | Java array `int[]` |
| Dynamic | Grows and shrinks at run time | `ArrayList`, linked list, `HashMap` |
| Primitive | Built into the language | `int`, `char`, `boolean` |
| Non-primitive | Built from primitives | Everything in this section |

Algorithms are usually grouped by **technique**: brute force, divide and conquer, greedy, dynamic programming, backtracking, graph traversal. Each has its own topic in this section.

## Real-World Examples

- **Browser history:** a stack — Back pops the last page.
- **Printer jobs, message queues:** a queue — first come, first served.
- **Autocomplete:** a trie — all words sharing a typed prefix.
- **Maps and navigation:** a graph with Dijkstra-style shortest paths.
- **Database indexes:** B-trees (balanced search trees) — sorted, range queries.
- **Caches:** hash map + linked list (LRU cache).

## Common Misconceptions

- **"A faster computer removes the need for good algorithms."** Going from O(n²) to O(n log n) on 10⁶ items is a factor of about 50,000; hardware upgrades give factors of 2–10.
- **"Hash maps are always O(1)."** Only on average, assuming a good hash function. The worst case is O(n) (Java 8+ improves heavily-colliding buckets to O(log n) by converting them to trees).
- **"The ADT and the data structure are the same thing."** A stack is an ADT; an array-backed stack and a linked-list stack are two data structures implementing it.
- **"DSA is memorising solutions."** Interviews reward recognising which structure and technique fit, and justifying the cost — the solution follows from that.

## Key Takeaways

- Data structure = how data is organised; algorithm = the steps performed on it.
- Every structure makes some operations cheap and others expensive; choose by the operations the problem uses most.
- ADT = contract (`List`, `Map`); data structure = implementation (`ArrayList`, `HashMap`).
- Judge a solution by total cost (calls × cost per call) against the input constraints.
