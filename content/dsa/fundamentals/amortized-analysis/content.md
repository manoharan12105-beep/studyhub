# Amortized Analysis

## Definition

**Amortized analysis** gives the average cost per operation over a **worst-case sequence** of operations. Some individual operations may be expensive, but if they are rare enough, the total cost of n operations divided by n is small. Unlike average-case analysis, it makes **no assumption about random input** — it is a guarantee for every sequence.

## Why It Matters

`ArrayList.add` sometimes copies the entire array, which is O(n). Yet everyone says appending is O(1). Both statements are correct once you know the word "amortized". Interviewers ask about it directly ("why is `ArrayList.add` O(1)?") and indirectly whenever a solution has a loop whose inner work is "sometimes big".

## Core Concept

### The dynamic array example

An `ArrayList` stores elements in an array with spare capacity. When it is full, it allocates a bigger array and copies everything over.

Suppose the capacity **doubles** each time it fills, starting at 1. Appending n = 16 elements:

| Append # | Capacity before | Resize? | Elements copied |
|----------|-----------------|---------|-----------------|
| 1 | 0→1 | allocate | 0 |
| 2 | 1 | yes → 2 | 1 |
| 3 | 2 | yes → 4 | 2 |
| 4 | 4 | no | 0 |
| 5 | 4 | yes → 8 | 4 |
| 6–8 | 8 | no | 0 |
| 9 | 8 | yes → 16 | 8 |
| 10–16 | 16 | no | 0 |

Copies = 1 + 2 + 4 + 8 = 15 < 16. In general the copies form a geometric series 1 + 2 + 4 + … + n/2 < n. So n appends cost n writes + fewer than n copies < **3n** → **O(1) amortized per append**, even though a single append can cost O(n).

> [!NOTE]
> Java's `ArrayList` grows by about 1.5× (new capacity = old + old/2), not 2×. Any constant growth factor greater than 1 gives the same geometric-series argument and O(1) amortized append. Growing by a **fixed amount** (e.g. +10 each time) does not: it costs O(n²) for n appends.

### Three ways to argue it

| Method | Idea | Dynamic array argument |
|--------|------|------------------------|
| **Aggregate** | Total cost of n operations ÷ n | Total < 3n → 3 per append |
| **Accounting (banker's)** | Charge each cheap operation a little extra and save the surplus as "credit" to pay for later expensive ones | Charge 3 per append: 1 to write, 2 saved. When the array of size k doubles, the k/2 elements added since the last resize have saved k credits — exactly enough to copy all k elements |
| **Potential** | Define a potential function Φ of the structure's state; amortized cost = actual cost + ΔΦ | Φ = 2 × size − capacity |

Interviews rarely need the potential method; the aggregate argument is usually enough.

### Amortized vs average case vs worst case

| Term | Averages over | Guarantee |
|------|---------------|-----------|
| Worst case (per operation) | nothing — the single most expensive call | strongest per-call bound |
| Amortized | a sequence of operations on the same structure | total for any sequence of n operations ≤ n × amortized cost |
| Average case | random inputs from an assumed distribution | expected cost, only if the assumption holds |

`HashMap.put` is O(1) **average** (depends on hashing spreading keys) **and amortized** (resizing is occasional). Two different reasons, both needed.

### Other amortized structures and patterns

| Structure / pattern | Expensive step | Why it amortizes |
|---------------------|----------------|------------------|
| `ArrayList.add`, `StringBuilder.append` | resize and copy | geometric growth |
| `HashMap.put` | rehash all entries | capacity doubles at load factor 0.75 |
| Queue using two stacks | moving the whole in-stack to the out-stack | each element is moved at most once |
| Monotonic stack | popping many elements in one step | each element is pushed once and popped at most once → O(n) total |
| Two pointers / sliding window | inner `while` runs many times | the pointer only moves forward, at most n steps in total |
| Union-Find with path compression and union by rank | long `find` path | paths flatten; O(α(n)) amortized, effectively constant |

> [!TIP]
> The "each element is pushed/moved/visited at most once" argument is the most useful amortized reasoning in interviews. When your loop has an inner `while`, ask: *what is the total number of iterations across the whole run?*

## Java Example

Counting how many element copies a doubling array performs, and a queue built from two stacks:

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class AmortizedDemo {

    // Minimal dynamic array that doubles; counts copies made during resizes.
    static class IntArrayList {
        private int[] data = new int[1];
        private int size = 0;
        long copies = 0;

        void add(int value) {
            if (size == data.length) {
                int[] bigger = new int[data.length * 2];
                for (int i = 0; i < size; i++) {
                    bigger[i] = data[i];
                    copies++;
                }
                data = bigger;
            }
            data[size++] = value;
        }
    }

    // FIFO queue from two LIFO stacks: each element moves from inbox to outbox at most once.
    static class TwoStackQueue {
        private final Deque<Integer> inbox = new ArrayDeque<>();
        private final Deque<Integer> outbox = new ArrayDeque<>();

        void offer(int value) {
            inbox.push(value);
        }

        int poll() {
            if (outbox.isEmpty()) {
                while (!inbox.isEmpty()) {
                    outbox.push(inbox.pop());   // reverses order, so the oldest is on top
                }
            }
            return outbox.pop();
        }
    }

    public static void main(String[] args) {
        for (int n : new int[] {16, 1_000, 1_000_000}) {
            IntArrayList list = new IntArrayList();
            for (int i = 0; i < n; i++) {
                list.add(i);
            }
            System.out.println("n=" + n + " copies=" + list.copies + " copies/n=" + String.format("%.2f", (double) list.copies / n));
        }

        TwoStackQueue queue = new TwoStackQueue();
        queue.offer(1);
        queue.offer(2);
        queue.offer(3);
        System.out.print(queue.poll() + " ");
        queue.offer(4);
        System.out.println(queue.poll() + " " + queue.poll() + " " + queue.poll());
    }
}
```

**Output:**

```text
n=16 copies=15 copies/n=0.94
n=1000 copies=1023 copies/n=1.02
n=1000000 copies=1048575 copies/n=1.05
1 2 3 4
```

The copies per element stay below 2 no matter how large n gets — constant amortized cost.

## Common Misconceptions

- **"Amortized means average over random inputs."** No randomness is involved; it holds for every sequence.
- **"Amortized O(1) means every call is fast."** One call can be O(n). That matters for real-time systems where a single slow call is unacceptable.
- **"Any resizing strategy is fine."** Growing by a constant amount gives O(n) amortized per append; growth must be by a constant *factor*.
- **"A nested while loop is always O(n²)."** Not if the inner work, summed over the whole run, is bounded by n.

## Key Takeaways

- Amortized cost = total cost of a worst-case sequence ÷ number of operations.
- Doubling (any factor > 1) makes dynamic-array append O(1) amortized because copies form a geometric series.
- Amortized ≠ average case: no probability assumption.
- "Each element is processed at most once" bounds monotonic stacks, two pointers, sliding windows and two-stack queues at O(n) total.
