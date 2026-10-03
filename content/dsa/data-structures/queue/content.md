# Queue

## Definition

A **queue** is a linear abstract data type that follows **FIFO** — first in, first out. Elements join at the **rear** (**enqueue** / `offer`) and leave from the **front** (**dequeue** / `poll`). A **deque** (double-ended queue) allows both operations at both ends. A **priority queue** removes the highest-priority element instead of the oldest.

## Why It Matters

Queues model anything processed in arrival order: print jobs, requests to a server, messages between services, and — central to DSA — the frontier of **breadth-first search**, which explores a graph level by level. Deques power sliding-window algorithms; priority queues power Dijkstra, Prim, scheduling and top-K problems.

## Core Concept

| Operation | Meaning | Java `Queue` method |
|-----------|---------|---------------------|
| enqueue | add at the rear | `offer(x)` |
| dequeue | remove from the front | `poll()` (returns `null` if empty) |
| front | read the front | `peek()` |
| isEmpty / size | | `isEmpty()`, `size()` |

The invariant: elements leave in the same order they arrived. That order is exactly what makes BFS visit vertices in increasing distance from the source.

### Why a plain array is a poor queue

If the front is index 0, every dequeue shifts all elements left — O(n). If instead you advance a `front` index, the free slots before it are wasted and the array "runs out" while half empty. The fix is the **circular queue**: indices wrap around with modulo.

## Visual Explanation

```text
Simple queue:      front                    rear
                     ↓                        ↓
         dequeue ← [ 10 ][ 20 ][ 30 ][ 40 ] ← enqueue

Circular queue (capacity 5) after enqueue 1..5, dequeue twice, enqueue 6, 7:

index:     0     1     2     3     4
         [ 6 ] [ 7 ] [ 3 ] [ 4 ] [ 5 ]
                       ↑
                     front = 2, size = 5 → rear slot = (front + size) % 5 = 2 (full)

Deque:   addFirst/pollFirst ⇄ [ 10 ][ 20 ][ 30 ] ⇄ addLast/pollLast
```

## Types

| Type | Behaviour | Typical implementation | Use |
|------|-----------|------------------------|-----|
| Simple queue | FIFO | linked list, or circular array | BFS, buffering |
| **Circular queue** | FIFO in a fixed array; indices wrap | array + `front` + `size` | bounded buffers, streaming |
| **Deque** | insert/remove at both ends | circular array (`ArrayDeque`) or doubly linked list | sliding windows, 0-1 BFS, palindromes |
| **Priority queue** | remove min (or max) first | binary heap (`PriorityQueue`) | Dijkstra, scheduling, top K |
| **Monotonic queue** | deque kept sorted by evicting dominated elements | `ArrayDeque` of indices | sliding-window max/min |

## Operations

### Circular queue

Keep `front` (index of the first element) and `size`. The rear slot is `(front + size) % capacity`.

1. **Enqueue:** if `size == capacity` → full; else write at `(front + size) % capacity`, `size++`.
2. **Dequeue:** if `size == 0` → empty; else read `data[front]`, `front = (front + 1) % capacity`, `size--`.

Tracking `size` explicitly avoids the classic ambiguity where `front == rear` could mean both "empty" and "full".

```java
int[] data = new int[5];
int front = 0, size = 0;

boolean enqueue(int x) {
    if (size == data.length) return false;          // full
    data[(front + size) % data.length] = x;
    size++;
    return true;
}

Integer dequeue() {
    if (size == 0) return null;                     // empty
    int value = data[front];
    front = (front + 1) % data.length;
    size--;
    return value;
}
```

**Time:** O(1) each · **Space:** O(capacity)

### Linked-list queue

Enqueue at the **tail**, dequeue at the **head** — both O(1) with head and tail references. (Dequeuing at the tail would need the predecessor: O(n) in a singly linked list.)

### Deque

`ArrayDeque` supports `offerFirst/offerLast`, `pollFirst/pollLast`, `peekFirst/peekLast` in O(1) amortized. A deque can act as a stack, a queue, or both at once.

### Priority queue (overview)

A priority queue is an ADT, usually implemented with a binary **heap**: `offer` and `poll` are O(log n), `peek` O(1). It is not FIFO — equal-priority elements come out in no guaranteed order. Full treatment: [Heap](../heap/content.md).

### Monotonic queue (overview)

A deque whose elements stay in decreasing (or increasing) order: before adding a new element, remove from the back every element it dominates; remove from the front elements that left the window. Each index enters and leaves once, so a sliding-window maximum over n elements costs O(n). Full treatment: [Monotonic Queue](../../patterns/monotonic-queue/content.md).

## Full Java Implementation

A generic circular queue that grows when full, plus a BFS-style use of a queue:

```java
import java.util.*;

public class QueueDemo {

    static class CircularQueue<T> {
        private Object[] data = new Object[2];
        private int front = 0;
        private int size = 0;

        void offer(T value) {
            if (size == data.length) {
                grow();
            }
            data[(front + size) % data.length] = value;
            size++;
        }

        @SuppressWarnings("unchecked")
        T poll() {
            if (size == 0) {
                return null;
            }
            T value = (T) data[front];
            data[front] = null;                            // let the garbage collector reclaim it
            front = (front + 1) % data.length;
            size--;
            return value;
        }

        @SuppressWarnings("unchecked")
        T peek() {
            return size == 0 ? null : (T) data[front];
        }

        boolean isEmpty() {
            return size == 0;
        }

        private void grow() {
            Object[] bigger = new Object[data.length * 2];
            for (int i = 0; i < size; i++) {
                bigger[i] = data[(front + i) % data.length];   // unwrap into order
            }
            data = bigger;
            front = 0;
        }
    }

    public static void main(String[] args) {
        CircularQueue<Integer> q = new CircularQueue<>();
        q.offer(1);
        q.offer(2);
        System.out.print(q.poll() + " ");           // front moves to index 1
        q.offer(3);                                 // wraps to index 0
        q.offer(4);                                 // full -> grows, order preserved
        while (!q.isEmpty()) {
            System.out.print(q.poll() + " ");
        }
        System.out.println();

        // Level-by-level processing: the queue holds the current frontier.
        Map<Integer, List<Integer>> children = Map.of(1, List.of(2, 3), 2, List.of(4, 5), 3, List.of(6));
        Queue<Integer> frontier = new ArrayDeque<>(List.of(1));
        int level = 0;
        while (!frontier.isEmpty()) {
            int count = frontier.size();             // nodes on this level
            List<Integer> thisLevel = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                int node = frontier.poll();
                thisLevel.add(node);
                frontier.addAll(children.getOrDefault(node, List.of()));
            }
            System.out.println("level " + level++ + ": " + thisLevel);
        }
    }
}
```

**Output:**

```text
1 2 3 4 
level 0: [1]
level 1: [2, 3]
level 2: [4, 5, 6]
```

## Dry Run

Circular queue of capacity 4 (fixed, no growth):

| Operation | front | size | Array | Returned |
|-----------|-------|------|-------|----------|
| offer 10 | 0 | 1 | `[10, _, _, _]` | |
| offer 20 | 0 | 2 | `[10, 20, _, _]` | |
| offer 30 | 0 | 3 | `[10, 20, 30, _]` | |
| poll | 1 | 2 | `[_, 20, 30, _]` | 10 |
| offer 40 | 1 | 3 | `[_, 20, 30, 40]` | slot (1+2)%4 = 3 |
| offer 50 | 1 | 4 | `[50, 20, 30, 40]` | slot (1+3)%4 = 0 — wrapped |
| offer 60 | 1 | 4 | unchanged | full → rejected |
| poll | 2 | 3 | `[50, _, 30, 40]` | 20 |

## Complexity Summary

| Operation | Circular array | Linked list | `ArrayDeque` | `PriorityQueue` |
|-----------|----------------|-------------|--------------|-----------------|
| enqueue / offer | O(1) (amortized if growing) | O(1) | O(1) amortized | O(log n) |
| dequeue / poll | O(1) | O(1) | O(1) | O(log n) |
| peek | O(1) | O(1) | O(1) | O(1) |
| search | O(n) | O(n) | O(n) | O(n) |

## Advantages

- O(1) enqueue and dequeue; preserves arrival order.
- Circular arrays reuse memory without shifting.

## Disadvantages

- Only the front is accessible; searching is O(n).
- Fixed-capacity circular queues can fill up.

## Comparison

| Need | Structure |
|------|-----------|
| Process in arrival order | queue |
| Process most recent first | stack |
| Add/remove at both ends | deque |
| Process smallest/largest first | priority queue |
| Max/min of a sliding window | monotonic deque |

## Java Collections Equivalent

- `Queue<T> q = new ArrayDeque<>()` — `offer`, `poll`, `peek`.
- `Deque<T> d = new ArrayDeque<>()` — both ends.
- `PriorityQueue<T>` — heap-ordered.
- `LinkedList` also implements `Queue`/`Deque` (allows `null`, more memory).

Method families (`add`/`remove`/`element` throw; `offer`/`poll`/`peek` return special values) are covered in [Java Toolkit: Stack, Queue, Deque and PriorityQueue](../../fundamentals/java-stacks-and-queues/content.md).

## Real-World Applications

- Request queues in web servers; message queues between services.
- Keyboard and network buffers (circular buffers).
- CPU round-robin scheduling.
- BFS: shortest paths in unweighted graphs, level-order traversal.

## Common Mistakes

- Using `ArrayList.remove(0)` as dequeue (O(n)).
- In a circular queue, forgetting `% capacity` on one of the index updates.
- Not distinguishing full from empty when only `front` and `rear` are stored.
- In BFS, not capturing `queue.size()` **before** the level loop (the size changes as children are added).
- Expecting FIFO order among equal elements in a `PriorityQueue`.

## Key Takeaways

- FIFO: offer at the rear, poll from the front, both O(1).
- Circular arrays (with `front` + `size`) make array queues O(1) without shifting.
- Deque = both ends; priority queue = heap order; monotonic queue = sliding-window extremes.
- In Java use `ArrayDeque` for queues and deques, `PriorityQueue` for priorities.
