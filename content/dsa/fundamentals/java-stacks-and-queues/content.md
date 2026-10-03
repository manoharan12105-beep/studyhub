# Java Toolkit: Stack, Queue, Deque and PriorityQueue

## Purpose

How to get stack, queue, double-ended queue and priority-queue behaviour in Java: which interface to declare, which class to instantiate, what each operation costs, and the traps — chiefly the legacy `Stack` class and `PriorityQueue` iteration order. Theory: [Stack](../../data-structures/stack/content.md), [Queue](../../data-structures/queue/content.md), [Heap](../../data-structures/heap/content.md).

## `ArrayDeque` — the Default for Stacks and Queues

**Underlying structure:** a **circular array** with `head` and `tail` indices; it doubles when full. Both ends support O(1) amortized insertion and removal. It rejects `null` elements.

As a **stack** (LIFO):

| Method | Meaning | Cost |
|--------|---------|------|
| `push(x)` | add on top (front) | O(1) amortized |
| `pop()` | remove top; throws if empty | O(1) |
| `peek()` | read top; `null` if empty | O(1) |

As a **queue** (FIFO):

| Method | Meaning | Cost |
|--------|---------|------|
| `offer(x)` | add at the back | O(1) amortized |
| `poll()` | remove from the front; `null` if empty | O(1) |
| `peek()` | read the front; `null` if empty | O(1) |

As a **deque**: `offerFirst`, `offerLast`, `pollFirst`, `pollLast`, `peekFirst`, `peekLast` — all O(1) (amortized for offers). Monotonic queues use these.

```java
Deque<Integer> stack = new ArrayDeque<>();
Queue<Integer> queue = new ArrayDeque<>();
Deque<Integer> window = new ArrayDeque<>();   // used as a double-ended queue
```

> [!TIP]
> Declare the variable as `Deque` for a stack (so `push`/`pop` are available) and as `Queue` for a queue (so only queue operations are visible and you cannot accidentally `push`).

## `Stack` — Legacy, Know Why to Avoid It

`java.util.Stack` extends `Vector`: every method is `synchronized` (slower, unnecessary locking), and it inherits `get(i)`, `add(i, x)` and other list methods that break the stack abstraction. Its iteration order is bottom-to-top, the opposite of `ArrayDeque`'s. The Java documentation itself recommends `Deque` instead.

You may still meet `Stack` in older code and interviews; its `push`, `pop`, `peek`, `isEmpty` behave as expected (`pop`/`peek` throw `EmptyStackException` when empty).

## `Queue` Methods: Throwing vs Returning

| Action | Throws an exception on failure | Returns a special value |
|--------|-------------------------------|-------------------------|
| Insert | `add(x)` | `offer(x)` → `false` |
| Remove head | `remove()` → `NoSuchElementException` | `poll()` → `null` |
| Read head | `element()` → `NoSuchElementException` | `peek()` → `null` |

Interview code usually uses `offer` / `poll` / `peek` and checks `isEmpty()` first.

## `LinkedList` as a Queue

`LinkedList` also implements `Deque`, with O(1) operations at both ends, and it allows `null`. It allocates one node object per element, so `ArrayDeque` is faster and leaner. Use `LinkedList` only when you need `null` elements or list operations as well.

## `PriorityQueue`

**Underlying structure:** a **binary min-heap** stored in an array. The smallest element (by natural order or a comparator) is always at the head.

| Method | Cost |
|--------|------|
| `offer(x)` / `add(x)` | O(log n) |
| `poll()` | O(log n) |
| `peek()` | O(1) |
| `size()`, `isEmpty()` | O(1) |
| `remove(x)`, `contains(x)` | O(n) |
| `new PriorityQueue<>(collection)` | O(n) — bottom-up heapify |

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
PriorityQueue<int[]> byDistance = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
```

**Use for:** repeatedly taking the smallest/largest (Dijkstra, Prim, merge k sorted lists, top-K, scheduling, running median).
**Not for:** sorted iteration (use `TreeSet`/`TreeMap` or sort a list), searching for arbitrary elements, or frequent removal of arbitrary elements.

## Comparison

| Need | Use | Avoid |
|------|-----|-------|
| Stack | `Deque<T> s = new ArrayDeque<>()` | `Stack`, `ArrayList.remove(size - 1)` is fine but less clear |
| Queue | `Queue<T> q = new ArrayDeque<>()` | `ArrayList.remove(0)` (O(n)) |
| Deque / sliding-window max | `ArrayDeque` | |
| Smallest/largest repeatedly | `PriorityQueue` | sorting after every insert |
| Sorted order + removal of any element + floor/ceiling | `TreeMap` / `TreeSet` | `PriorityQueue` (O(n) removal) |

## Interview Traps

```java
import java.util.*;

public class QueueTraps {
    public static void main(String[] args) {
        // 1. PriorityQueue iteration order is heap order, NOT sorted order.
        PriorityQueue<Integer> pq = new PriorityQueue<>(List.of(5, 1, 4, 2, 3));
        System.out.println("toString: " + pq);
        StringBuilder sorted = new StringBuilder();
        while (!pq.isEmpty()) {
            sorted.append(pq.poll()).append(' ');   // poll repeatedly to get sorted order
        }
        System.out.println("polled:   " + sorted.toString().trim());

        // 2. Stack and ArrayDeque iterate in opposite orders.
        Stack<Integer> legacy = new Stack<>();
        Deque<Integer> modern = new ArrayDeque<>();
        for (int i = 1; i <= 3; i++) {
            legacy.push(i);
            modern.push(i);
        }
        System.out.println("Stack: " + legacy + "  ArrayDeque: " + modern);

        // 3. poll/peek return null on empty; pop throws.
        Deque<Integer> empty = new ArrayDeque<>();
        System.out.println("peek on empty: " + empty.peek());
        try {
            empty.pop();
        } catch (NoSuchElementException e) {
            System.out.println("pop on empty throws NoSuchElementException");
        }

        // 4. Comparator by subtraction can overflow; use Integer.compare.
        PriorityQueue<Integer> bad = new PriorityQueue<>((a, b) -> a - b);
        bad.offer(Integer.MIN_VALUE);
        bad.offer(1);
        PriorityQueue<Integer> good = new PriorityQueue<>(Integer::compare);
        good.offer(Integer.MIN_VALUE);
        good.offer(1);
        System.out.println("subtraction comparator head: " + bad.peek() + ", Integer.compare head: " + good.peek());
    }
}
```

**Output:**

```text
toString: [1, 2, 4, 5, 3]
polled:   1 2 3 4 5
Stack: [1, 2, 3]  ArrayDeque: [3, 2, 1]
peek on empty: null
pop on empty throws NoSuchElementException
subtraction comparator head: 1, Integer.compare head: -2147483648
```

`1 − Integer.MIN_VALUE` overflows to a negative number, so the subtraction comparator wrongly decides 1 < MIN_VALUE.

## Common Mistakes

- Printing or iterating a `PriorityQueue` and expecting sorted order.
- Using `Stack` or `ArrayList.remove(0)` in new code.
- `ArrayDeque.offer(null)` → `NullPointerException`.
- Forgetting that `PriorityQueue` is a **min**-heap by default.
- Updating a field of an object already inside a `PriorityQueue` — the heap is not re-ordered. Remove and re-insert, or insert a new entry and skip stale ones when polled (the standard Dijkstra trick).

## Key Takeaways

- `ArrayDeque` (circular array) is the default stack, queue and deque: O(1) amortized at both ends.
- `PriorityQueue` = binary min-heap: O(log n) offer/poll, O(1) peek, O(n) arbitrary remove; iteration is not sorted.
- Prefer `offer`/`poll`/`peek` (return special values) and check `isEmpty`.
- Compare with `Integer.compare`, never by subtraction.
