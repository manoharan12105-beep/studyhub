# Heap

## Definition

A **binary heap** is a **complete** binary tree that satisfies the **heap property**: in a **min-heap** every node is ≤ its children, so the minimum is at the root; in a **max-heap** every node is ≥ its children. Because it is complete, a heap is stored compactly in an array. It supports insert and remove-top in **O(log n)** and peek in **O(1)**, which makes it the standard implementation of a **priority queue**.

## Why It Matters

Many algorithms repeatedly need "the smallest (or largest) item so far": Dijkstra's and Prim's algorithms, event scheduling, merging k sorted lists, top-K queries, running medians, Huffman coding. Sorting after every insertion would cost O(n log n) each time; a heap does it in O(log n).

## Core Concept

### Heap property vs BST property

A heap is only **partially** ordered: a parent beats its children, but siblings and cousins are in no particular order. That weaker invariant is cheaper to maintain than a BST's full ordering, and it is exactly enough to find the top element instantly.

```text
min-heap                       NOT a BST: 8 and 5 are both under 3 in no left/right order
          1
        /   \
       3     2
      / \   /
     8   5 4
```

### Array representation

Store the nodes level by level. For index i (0-based):

```text
parent(i) = (i − 1) / 2       left(i) = 2i + 1       right(i) = 2i + 2

array: [1, 3, 2, 8, 5, 4]
index:  0  1  2  3  4  5
```

Completeness guarantees no gaps, and height = ⌊log₂ n⌋.

### The two repair operations

- **Sift up** (bubble up): a node smaller than its parent (min-heap) swaps with the parent until the property holds. Used after insertion.
- **Sift down** (heapify): a node larger than a child swaps with its **smaller** child until the property holds. Used after removing the root and when building a heap.

Both move along one root-to-leaf path: O(log n).

## Visual Explanation

```text
insert 0 into [1, 3, 2, 8, 5, 4]:

append at the end           sift up: 0 < 2 → swap        0 < 1 → swap
          1                          1                           0
        /   \                      /   \                       /   \
       3     2                    3     0                     3     1
      / \   / \                  / \   / \                   / \   / \
     8   5 4   0                8   5 4   2                 8   5 4   2

array: [0, 3, 1, 8, 5, 4, 2]
```

## Types

| Type | Root holds | Java |
|------|-----------|------|
| Min-heap | smallest | `new PriorityQueue<>()` |
| Max-heap | largest | `new PriorityQueue<>(Comparator.reverseOrder())` |
| d-ary heap | each node has d children (shallower tree) | not in JDK |
| Binomial / Fibonacci heap | support fast merging / decrease-key | theory; rarely in interviews |

## Operations

### Peek

Return `heap[0]`. **Time:** O(1).

### Insert (offer)

1. Append the value at the end (index `size`), keeping the tree complete.
2. Sift it up while it is smaller than its parent.

```java
void insert(int value) {
    heap[size] = value;              // assumes capacity is available
    int i = size++;
    while (i > 0 && heap[(i - 1) / 2] > heap[i]) {
        swap(i, (i - 1) / 2);
        i = (i - 1) / 2;
    }
}
```

**Time:** O(log n) · **Space:** O(1)

### Extract top (poll)

1. Save the root (the answer).
2. Move the **last** element to the root and shrink the size — the tree stays complete.
3. Sift the new root down, always swapping with the **smaller** child (so the new parent is ≤ both children).

```java
int extractMin() {
    int min = heap[0];
    heap[0] = heap[--size];
    siftDown(0);
    return min;
}

void siftDown(int i) {
    while (true) {
        int left = 2 * i + 1, right = left + 1, smallest = i;
        if (left < size && heap[left] < heap[smallest]) smallest = left;
        if (right < size && heap[right] < heap[smallest]) smallest = right;
        if (smallest == i) return;
        swap(i, smallest);
        i = smallest;
    }
}
```

**Time:** O(log n) · **Space:** O(1)

### Delete an arbitrary element

Given its index: replace it with the last element, shrink, then sift **up or down** (the replacement may be smaller than the parent or larger than a child). O(log n) once the index is known — but finding the element is O(n) unless you also keep a value → index map (an "indexed heap"). This is why `PriorityQueue.remove(Object)` is O(n).

### Build heap (heapify an array) — O(n)

Sift down every non-leaf node, from the last one (index n/2 − 1) back to the root.

Why O(n) and not O(n log n): most nodes are near the bottom, where sift-down is short. About n/2 nodes are leaves (0 work), n/4 can move 1 level, n/8 can move 2 levels, and so on:

```text
total ≤ n/4·1 + n/8·2 + n/16·3 + …  =  n · Σ k/2^(k+1)  =  n · 1  →  O(n)
```

Inserting n elements one by one costs O(n log n), so prefer bottom-up heapify (`new PriorityQueue<>(collection)` does this).

### Heap sort

Build a max-heap, then repeatedly swap the root with the last element and sift down within the shrinking prefix: O(n log n), in place, not stable. Full treatment: [Heap Sort](../../algorithms/heap-sort/content.md).

### Priority queue

A **priority queue** is the ADT ("insert", "remove highest priority"); a binary heap is its usual data structure. Java's `PriorityQueue` is an array-based binary min-heap with an optional comparator. Applications — k-th largest, top K, running median, merging k sorted lists — are in [Heap Applications](../heap-applications/content.md).

## Full Java Implementation

```java
import java.util.*;

public class MinHeap {

    private int[] heap;
    private int size;

    public MinHeap(int capacity) {
        heap = new int[capacity];
    }

    // Bottom-up construction in O(n).
    public MinHeap(int[] values) {
        heap = Arrays.copyOf(values, Math.max(values.length, 1));
        size = values.length;
        for (int i = size / 2 - 1; i >= 0; i--) {
            siftDown(i);
        }
    }

    public void insert(int value) {
        if (size == heap.length) {
            heap = Arrays.copyOf(heap, heap.length * 2);
        }
        heap[size] = value;
        siftUp(size++);
    }

    public int peek() {
        if (size == 0) throw new NoSuchElementException("heap is empty");
        return heap[0];
    }

    public int extractMin() {
        int min = peek();
        heap[0] = heap[--size];
        siftDown(0);
        return min;
    }

    public int size() {
        return size;
    }

    private void siftUp(int i) {
        while (i > 0 && heap[parent(i)] > heap[i]) {
            swap(i, parent(i));
            i = parent(i);
        }
    }

    private void siftDown(int i) {
        while (true) {
            int left = 2 * i + 1, right = left + 1, smallest = i;
            if (left < size && heap[left] < heap[smallest]) smallest = left;
            if (right < size && heap[right] < heap[smallest]) smallest = right;
            if (smallest == i) return;
            swap(i, smallest);
            i = smallest;
        }
    }

    private static int parent(int i) {
        return (i - 1) / 2;
    }

    private void swap(int a, int b) {
        int temp = heap[a];
        heap[a] = heap[b];
        heap[b] = temp;
    }

    @Override
    public String toString() {
        return Arrays.toString(Arrays.copyOf(heap, size));
    }

    public static void main(String[] args) {
        MinHeap h = new MinHeap(4);
        for (int v : new int[] {5, 3, 8, 1, 9, 2}) {
            h.insert(v);
        }
        System.out.println("after inserts: " + h);
        System.out.print("extract order: ");
        while (h.size() > 0) {
            System.out.print(h.extractMin() + " ");
        }
        System.out.println();

        MinHeap built = new MinHeap(new int[] {9, 4, 7, 1, 8, 2, 3});
        System.out.println("heapified:     " + built + " min=" + built.peek());

        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        maxHeap.addAll(List.of(5, 3, 8, 1));
        System.out.println("JDK max-heap poll: " + maxHeap.poll() + " " + maxHeap.poll());
    }
}
```

**Output:**

```text
after inserts: [1, 3, 2, 5, 9, 8]
extract order: 1 2 3 5 8 9 
heapified:     [1, 4, 2, 9, 8, 7, 3] min=1
JDK max-heap poll: 8 5
```

## Dry Run

Bottom-up heapify of `[9, 4, 7, 1, 8, 2, 3]` (n = 7, last non-leaf index 2):

| i | Node | Children | Action | Array |
|---|------|----------|--------|-------|
| 2 | 7 | 2, 3 | swap with 2 | `[9, 4, 2, 1, 8, 7, 3]` |
| 1 | 4 | 1, 8 | swap with 1 | `[9, 1, 2, 4, 8, 7, 3]` |
| 0 | 9 | 1, 2 | swap with 1 → index 1 | `[1, 9, 2, 4, 8, 7, 3]` |
| 1 | 9 | 4, 8 | swap with 4 → index 3 (leaf) | `[1, 4, 2, 9, 8, 7, 3]` |

## Complexity Summary

| Operation | Best | Average | Worst | Space |
|-----------|------|---------|-------|-------|
| Peek | O(1) | O(1) | O(1) | O(1) |
| Insert | O(1) | O(1) average for random input* | O(log n) | O(1) |
| Extract top | O(log n) | O(log n) | O(log n) | O(1) |
| Delete at known index | O(1) | O(log n) | O(log n) | O(1) |
| Search / delete by value | O(n) | O(n) | O(n) | O(1) |
| Build heap (bottom-up) | O(n) | O(n) | O(n) | O(1) in place |
| n inserts one by one | O(n) | O(n log n) | O(n log n) | — |

\* A random new element usually stops sifting up after a few levels; interviews quote O(log n) for insert.

## Advantages

- O(1) access to the min/max; O(log n) updates.
- Compact array storage with no pointers; cache-friendly.
- O(n) construction from an existing array.

## Disadvantages

- No efficient search, no sorted iteration, no access to anything but the top.
- Arbitrary removal or priority change needs O(n) search unless indices are tracked.
- Not stable: equal priorities come out in no guaranteed order.

## Comparison

| | Binary heap | Balanced BST (`TreeMap`/`TreeSet`) | Sorted array |
|---|-------------|-----------------------------------|--------------|
| Get min/max | O(1) | O(log n) | O(1) |
| Insert | O(log n) | O(log n) | O(n) |
| Remove min/max | O(log n) | O(log n) | O(1) at the end, O(n) at the front |
| Remove arbitrary | O(n) | O(log n) | O(n) |
| Sorted iteration | O(n log n) | O(n) | O(n) |
| Build from n items | O(n) | O(n log n) | O(n log n) |

Use a heap when you only need the extreme element; use a `TreeMap`/`TreeSet` when you also need removal of arbitrary items or ordered navigation.

## Java Collections Equivalent

`PriorityQueue<E>`: `offer`, `poll`, `peek` (min-heap by default; pass a comparator for max-heap or custom priority). Traps (iteration is not sorted, `remove(Object)` is O(n), mutating elements breaks the heap) are in [Java Toolkit: Stack, Queue, Deque and PriorityQueue](../../fundamentals/java-stacks-and-queues/content.md).

## Real-World Applications

- Operating-system and job schedulers (highest-priority job next).
- Shortest-path and spanning-tree algorithms (Dijkstra, Prim).
- Event-driven simulations (next event by time).
- Streaming statistics: top K, running median.
- Huffman coding (repeatedly merge the two least frequent symbols).

## Common Mistakes

- Swapping with *any* smaller child during sift-down instead of the **smallest** child (breaks the property for the other child).
- Wrong index formulas when mixing 0-based and 1-based arrays (1-based: children 2i and 2i + 1, parent i/2).
- Building a heap with n inserts (O(n log n)) when bottom-up heapify (O(n)) is available.
- Expecting a heap's array or `PriorityQueue.toString()` to be sorted.
- Forgetting that `PriorityQueue` is a **min**-heap by default.

## Key Takeaways

- Complete binary tree + heap property; stored in an array (children 2i + 1, 2i + 2).
- Insert = append + sift up; extract = move last to root + sift down; both O(log n).
- Build heap bottom-up in O(n).
- Heaps implement priority queues; they give the extreme element fast but nothing else.
