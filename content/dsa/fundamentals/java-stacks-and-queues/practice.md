# Java Toolkit: Stack, Queue, Deque and PriorityQueue — Practice

### P1. Which declaration is the recommended way to get a stack in modern Java?

**Difficulty:** Easy · **Pattern:** Choosing the class

- A) `Stack<Integer> s = new Stack<>();`
- B) `Deque<Integer> s = new ArrayDeque<>();`
- C) `List<Integer> s = new LinkedList<>();`
- D) `Queue<Integer> s = new PriorityQueue<>();`

<details>
<summary>Hint</summary>

Which one is not synchronized and exposes only end operations?

</details>

<details>
<summary>Answer</summary>

**Answer:** B) `Deque<Integer> s = new ArrayDeque<>();`

**Explanation:** `ArrayDeque` gives O(1) amortized `push`/`pop`/`peek` without `Stack`'s synchronization overhead or inherited list methods. C works only as a list unless declared as `Deque`; D is a heap, not LIFO.

</details>

### P2. What does this print?

**Difficulty:** Easy · **Pattern:** Output prediction

```java
Queue<Integer> q = new ArrayDeque<>();
q.offer(1);
q.offer(2);
q.offer(3);
q.poll();
q.offer(4);
System.out.println(q.peek() + " " + q.size());
```

- A) 1 3
- B) 2 3
- C) 4 3
- D) 2 4

<details>
<summary>Hint</summary>

FIFO: `poll` removes the oldest element.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) 2 3

**Explanation:** After `poll` removes 1, the queue is [2, 3], then [2, 3, 4]. Head = 2, size = 3.

</details>

### P3. What does this print?

**Difficulty:** Medium · **Pattern:** Max-heap with comparator

```java
PriorityQueue<Integer> pq = new PriorityQueue<>(Comparator.reverseOrder());
for (int x : new int[] {3, 9, 1, 7}) {
    pq.offer(x);
}
pq.poll();
System.out.println(pq.peek());
```

- A) 1
- B) 3
- C) 7
- D) 9

<details>
<summary>Hint</summary>

`reverseOrder()` turns the min-heap into a max-heap.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) 7

**Explanation:** The max-heap's head is 9; after polling it, the next largest is 7.

</details>

### P4. A program keeps updating the `distance` field of objects already stored in a `PriorityQueue` ordered by distance. Why does it produce wrong results, and how is this usually fixed?

**Difficulty:** Medium · **Pattern:** Heap invariants

<details>
<summary>Hint</summary>

When does a heap restore its ordering?

</details>

<details>
<summary>Answer</summary>

**Answer:** A `PriorityQueue` only re-orders elements during `offer` and `poll`. Changing a key in place breaks the heap property silently, so `poll` may return the wrong element.

**Fix:** Insert a **new** entry (node, newDistance) instead of mutating, and when polling, skip entries whose distance is larger than the best known distance ("lazy deletion"). This is the standard Java Dijkstra implementation — see [Dijkstra](../../algorithms/dijkstra/content.md). Removing and re-inserting also works but `remove(Object)` is O(n).

</details>

### P5. Implement a function that reverses the first k elements of a queue, leaving the rest in order, using only a queue and a stack.

**Difficulty:** Medium · **Pattern:** Stack reverses order

<details>
<summary>Hint</summary>

Pop k elements into a stack, push them back to the queue's tail, then rotate the remaining n − k elements to the back.

</details>

<details>
<summary>Answer</summary>

**Approach:** The stack reverses the first k; moving the other n − k from front to back restores their position after the reversed block.

```java
import java.util.*;

public class ReverseFirstK {

    static void reverseFirstK(Queue<Integer> queue, int k) {
        if (k <= 0 || k > queue.size()) {
            return;
        }
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < k; i++) {
            stack.push(queue.poll());
        }
        while (!stack.isEmpty()) {
            queue.offer(stack.pop());
        }
        int rest = queue.size() - k;
        for (int i = 0; i < rest; i++) {
            queue.offer(queue.poll());
        }
    }

    public static void main(String[] args) {
        Queue<Integer> q = new ArrayDeque<>(List.of(1, 2, 3, 4, 5));
        reverseFirstK(q, 3);
        System.out.println(q);
    }
}
```

**Output:**

```text
[3, 2, 1, 4, 5]
```

**Complexity:** O(n) time, O(k) extra space.

</details>

### P6. Return the k most frequent words, highest frequency first; ties broken alphabetically. Explain the choice of heap ordering.

**Difficulty:** Hard · **Pattern:** Top K with a size-k heap

<details>
<summary>Hint</summary>

Keep a min-heap of size k whose head is the "worst" of the current top k. Define "worst" carefully for ties.

</details>

<details>
<summary>Answer</summary>

**Approach:** Count with a `HashMap`. Keep a heap of at most k words whose head is the weakest candidate: lower frequency first, and for equal frequency the alphabetically **later** word (it would be dropped first). After processing, poll everything and reverse.

```java
import java.util.*;

public class TopKFrequentWords {

    static List<String> topK(String[] words, int k) {
        Map<String, Integer> count = new HashMap<>();
        for (String w : words) {
            count.merge(w, 1, Integer::sum);
        }
        Comparator<String> weakestFirst = (a, b) -> {
            int byFreq = Integer.compare(count.get(a), count.get(b));
            return byFreq != 0 ? byFreq : b.compareTo(a);   // later word is weaker on ties
        };
        PriorityQueue<String> heap = new PriorityQueue<>(weakestFirst);
        for (String w : count.keySet()) {
            heap.offer(w);
            if (heap.size() > k) {
                heap.poll();                                // drop the weakest
            }
        }
        List<String> result = new ArrayList<>();
        while (!heap.isEmpty()) {
            result.add(heap.poll());
        }
        Collections.reverse(result);                        // strongest first
        return result;
    }

    public static void main(String[] args) {
        String[] words = {"java", "map", "heap", "java", "map", "tree", "java", "heap"};
        System.out.println(topK(words, 2));
        System.out.println(topK(words, 3));
    }
}
```

**Output:**

```text
[java, heap]
[java, heap, map]
```

**Complexity:** O(n + u log k) time for n words with u distinct, O(u) space. The pattern is covered in [Top K Elements](../../patterns/top-k-elements/content.md).

</details>
