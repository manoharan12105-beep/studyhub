# Queue — Practice

### P1. Count recent requests

**Difficulty:** Easy · **Pattern:** Queue as a time window

Design `RecentCounter` with `ping(t)`: record a request at time t (milliseconds) and return how many requests happened in the inclusive range [t − 3000, t]. Calls arrive with strictly increasing t.

**Constraints:** up to 10⁴ calls.

Example: ping(1) → 1, ping(100) → 2, ping(3001) → 3, ping(3002) → 3.

<details>
<summary>Hint</summary>

Old timestamps leave from the front in the same order they arrived.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class RecentCounter {

    private final Queue<Integer> times = new ArrayDeque<>();

    int ping(int t) {
        times.offer(t);
        while (times.peek() < t - 3000) {
            times.poll();                         // drop requests outside the window
        }
        return times.size();
    }

    public static void main(String[] args) {
        RecentCounter counter = new RecentCounter();
        for (int t : new int[] {1, 100, 3001, 3002}) {
            System.out.print(counter.ping(t) + " ");
        }
        System.out.println();
    }
}
```

**Output:**

```text
1 2 3 3
```

**Complexity:** O(1) amortized per call (each timestamp is added and removed once), O(w) space for w requests in the window.

</details>

### P2. Stack using one queue

**Difficulty:** Medium · **Pattern:** Rotate after push

Implement a LIFO stack (`push`, `pop`, `top`, `empty`) using only queue operations.

**Constraints:** at most 100 operations; `pop`/`top` called only on a non-empty stack.

<details>
<summary>Hint</summary>

After offering a new element, move every older element from the front to the back. The newest element is then at the front.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class StackUsingQueue {

    private final Queue<Integer> queue = new ArrayDeque<>();

    void push(int x) {
        queue.offer(x);
        for (int i = 0; i < queue.size() - 1; i++) {
            queue.offer(queue.poll());            // rotate older elements behind x
        }
    }

    int pop() {
        return queue.poll();
    }

    int top() {
        return queue.peek();
    }

    boolean empty() {
        return queue.isEmpty();
    }

    public static void main(String[] args) {
        StackUsingQueue s = new StackUsingQueue();
        s.push(1);
        s.push(2);
        s.push(3);
        System.out.println(s.pop() + " " + s.top() + " " + s.empty());
    }
}
```

**Output:**

```text
3 2 false
```

**Complexity:** `push` O(n), `pop`/`top` O(1). (The reverse problem, a queue from two stacks, is O(1) amortized — see [Amortized Analysis](../../fundamentals/amortized-analysis/content.md).)

</details>

### P3. Generate binary numbers 1 to n

**Difficulty:** Medium · **Pattern:** BFS-style generation

Return the binary representations of 1 to n as strings, using a queue rather than conversion functions.

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: n = 5 → `["1", "10", "11", "100", "101"]`.

<details>
<summary>Hint</summary>

Every binary number x generates x + "0" and x + "1" — the numbers 2x and 2x + 1.

</details>

<details>
<summary>Answer</summary>

**Approach:** Start with "1". Each dequeued string is the next number in order; enqueue its two children. The queue produces numbers level by level, which is increasing numeric order.

```java
import java.util.*;

public class BinaryNumbers {

    static List<String> generate(int n) {
        List<String> result = new ArrayList<>();
        Queue<String> queue = new ArrayDeque<>();
        queue.offer("1");
        while (result.size() < n) {
            String current = queue.poll();
            result.add(current);
            queue.offer(current + "0");
            queue.offer(current + "1");
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(generate(5));
    }
}
```

**Output:**

```text
[1, 10, 11, 100, 101]
```

**Complexity:** O(n log n) time and space — each string has O(log n) characters.

</details>

### P4. First non-repeating character in a stream

**Difficulty:** Medium · **Pattern:** Queue of candidates + counts

Characters arrive one at a time. After each one, output the first character so far that has appeared exactly once, or `#` if none.

**Constraints:** 1 ≤ length ≤ 10⁵, lowercase letters.

Example: stream `"aabc"` → `"a#bb"`.

<details>
<summary>Hint</summary>

Keep candidates in arrival order in a queue. Discard the front while its count is greater than 1.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class FirstNonRepeatingStream {

    static String process(String stream) {
        int[] counts = new int[26];
        Queue<Character> candidates = new ArrayDeque<>();
        StringBuilder out = new StringBuilder();
        for (char c : stream.toCharArray()) {
            counts[c - 'a']++;
            candidates.offer(c);
            while (!candidates.isEmpty() && counts[candidates.peek() - 'a'] > 1) {
                candidates.poll();                 // no longer unique; never will be again
            }
            out.append(candidates.isEmpty() ? '#' : candidates.peek());
        }
        return out.toString();
    }

    public static void main(String[] args) {
        System.out.println(process("aabc"));
        System.out.println(process("zz"));
    }
}
```

**Output:**

```text
a#bb
z#
```

**Complexity:** O(n) total time (each character enters and leaves the queue once), O(1) extra space for counts plus the queue.

</details>

### P5. Design a circular deque

**Difficulty:** Medium · **Pattern:** Circular array with two ends

Implement a fixed-capacity deque with `insertFront`, `insertLast`, `deleteFront`, `deleteLast`, `getFront`, `getRear`, `isEmpty`, `isFull`. Inserts/deletes return `false` when impossible; getters return `-1` when empty.

**Constraints:** 1 ≤ capacity ≤ 1000.

<details>
<summary>Hint</summary>

Track `front` and `size`. Inserting at the front moves `front` back by one: `(front − 1 + capacity) % capacity`.

</details>

<details>
<summary>Answer</summary>

```java
public class CircularDeque {

    private final int[] data;
    private int front = 0, size = 0;

    CircularDeque(int capacity) {
        data = new int[capacity];
    }

    boolean insertFront(int x) {
        if (isFull()) return false;
        front = (front - 1 + data.length) % data.length;   // + length avoids a negative index
        data[front] = x;
        size++;
        return true;
    }

    boolean insertLast(int x) {
        if (isFull()) return false;
        data[(front + size) % data.length] = x;
        size++;
        return true;
    }

    boolean deleteFront() {
        if (isEmpty()) return false;
        front = (front + 1) % data.length;
        size--;
        return true;
    }

    boolean deleteLast() {
        if (isEmpty()) return false;
        size--;
        return true;
    }

    int getFront() {
        return isEmpty() ? -1 : data[front];
    }

    int getRear() {
        return isEmpty() ? -1 : data[(front + size - 1) % data.length];
    }

    boolean isEmpty() {
        return size == 0;
    }

    boolean isFull() {
        return size == data.length;
    }

    public static void main(String[] args) {
        CircularDeque d = new CircularDeque(3);
        System.out.print(d.insertLast(1) + " " + d.insertLast(2) + " " + d.insertFront(3) + " " + d.insertFront(4) + " ");
        System.out.print(d.getRear() + " " + d.isFull() + " ");
        System.out.print(d.deleteLast() + " " + d.insertFront(4) + " ");
        System.out.println(d.getFront());
    }
}
```

**Output:**

```text
true true true false 2 true true true 4
```

**Complexity:** O(1) per operation, O(capacity) space.

</details>
