# DSA Implementation Questions — Interview Questions

## Beginner

### Q1. Rotate an array to the right by k steps in place.

Example: `[1, 2, 3, 4, 5, 6, 7]`, k = 3 → `[5, 6, 7, 1, 2, 3, 4]`. Use O(1) extra space.

<details>
<summary>Answer</summary>

**Approach:** Reverse the whole array, then reverse the first k elements and the remaining n − k. Reduce k modulo n first (k may exceed n). Shifting one step at a time is O(n × k); a copy into a new array uses O(n) space.

```java
import java.util.Arrays;

public class RotateArray {

    static void rotate(int[] a, int k) {
        int n = a.length;
        k %= n;                                        // k ≥ n wraps around
        reverse(a, 0, n - 1);                          // 7 6 5 4 3 2 1
        reverse(a, 0, k - 1);                          // 5 6 7 | 4 3 2 1
        reverse(a, k, n - 1);                          // 5 6 7 | 1 2 3 4
    }

    static void reverse(int[] a, int i, int j) {
        while (i < j) {
            int t = a[i];
            a[i++] = a[j];
            a[j--] = t;
        }
    }

    public static void main(String[] args) {
        int[] a = {1, 2, 3, 4, 5, 6, 7}, b = {-1, -100, 3, 99}, c = {1, 2, 3};
        rotate(a, 3);
        rotate(b, 2);
        rotate(c, 10);
        System.out.println(Arrays.toString(a) + " " + Arrays.toString(b) + " " + Arrays.toString(c));
    }
}
```

**Output:**

```text
[5, 6, 7, 1, 2, 3, 4] [3, 99, -1, -100] [3, 1, 2]
```

**Time:** O(n) · **Space:** O(1)

</details>

### Q2. Reverse the order of words in a string.

Words are separated by one or more spaces; the result must have single spaces and no leading/trailing spaces. Example: `"  the sky  is   blue "` → `"blue is sky the"`.

<details>
<summary>Answer</summary>

**Approach:** Scan from the end, skipping spaces and copying each word into a `StringBuilder`. (`String.join(" ", reversed(s.trim().split("\\s+")))` also works, but interviewers often want the manual scan.)

```java
public class ReverseWords {

    static String reverseWords(String s) {
        StringBuilder sb = new StringBuilder();
        int i = s.length() - 1;
        while (i >= 0) {
            while (i >= 0 && s.charAt(i) == ' ') i--;          // skip spaces
            if (i < 0) break;
            int end = i;
            while (i >= 0 && s.charAt(i) != ' ') i--;          // find the word's start
            if (sb.length() > 0) sb.append(' ');
            sb.append(s, i + 1, end + 1);
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println("[" + reverseWords("  the sky  is   blue ") + "] [" + reverseWords("a good   example") + "] [" + reverseWords("   ") + "]");
    }
}
```

**Output:**

```text
[blue is sky the] [example good a] []
```

**Time:** O(n) · **Space:** O(n) for the result (strings are immutable in Java).

</details>

### Q3. Implement a generic resizable array with `add`, `get`, `set`, `removeAt` and `size`.

`add` must be amortized O(1); out-of-range indices must throw `IndexOutOfBoundsException`.

<details>
<summary>Answer</summary>

**Approach:** Keep an `Object[]` and a `size`. When full, allocate double the capacity and copy (amortized O(1) per add). `removeAt` shifts the tail left and clears the last slot so the object can be garbage-collected.

```java
import java.util.Arrays;

public class DynamicArray<T> {

    private Object[] data = new Object[2];
    private int size;

    void add(T value) {
        if (size == data.length) data = Arrays.copyOf(data, data.length * 2);   // geometric growth
        data[size++] = value;
    }

    @SuppressWarnings("unchecked")
    T get(int i) {
        check(i);
        return (T) data[i];
    }

    void set(int i, T value) {
        check(i);
        data[i] = value;
    }

    @SuppressWarnings("unchecked")
    T removeAt(int i) {
        check(i);
        T old = (T) data[i];
        System.arraycopy(data, i + 1, data, i, size - i - 1);                  // shift left
        data[--size] = null;                                                    // avoid a stale reference
        return old;
    }

    int size() { return size; }

    private void check(int i) {
        if (i < 0 || i >= size) throw new IndexOutOfBoundsException("index " + i + ", size " + size);
    }

    @Override
    public String toString() { return Arrays.toString(Arrays.copyOf(data, size)); }

    public static void main(String[] args) {
        DynamicArray<Integer> arr = new DynamicArray<>();
        for (int i = 1; i <= 5; i++) arr.add(i);
        arr.set(0, 10);
        String before = arr.toString();
        int capacity = arr.data.length, removed = arr.removeAt(1);
        System.out.println(before + " capacity=" + capacity + " removed=" + removed + " " + arr + " size=" + arr.size());
        try {
            arr.get(4);
        } catch (IndexOutOfBoundsException e) {
            System.out.println(e.getMessage());
        }
    }
}
```

**Output:**

```text
[10, 2, 3, 4, 5] capacity=8 removed=2 [10, 3, 4, 5] size=4
index 4, size 4
```

**Time:** `add` amortized O(1) (O(n) when it resizes), `get`/`set` O(1), `removeAt` O(n − i) · **Space:** O(capacity)

</details>

## Intermediate

### Q4. Implement an LRU cache without `LinkedHashMap`.

`get(key)` returns the value or −1; `put(key, value)` inserts or updates; when the cache exceeds its capacity, evict the least recently used key. Both operations in O(1).

<details>
<summary>Answer</summary>

**Approach:** A `HashMap<Integer, Node>` finds nodes in O(1); a doubly linked list with sentinels keeps nodes in recency order (most recent at the front). Every access moves the node to the front; eviction removes the node before the tail sentinel. Invariant: the map and the list hold exactly the same keys.

```java
import java.util.*;

public class LruCache {

    static class Node {
        int key, value;
        Node prev, next;
        Node(int key, int value) { this.key = key; this.value = value; }
    }

    private final int capacity;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0), tail = new Node(0, 0);

    LruCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    int get(int key) {
        Node node = map.get(key);
        if (node == null) return -1;
        unlink(node);
        addFront(node);                                 // now most recently used
        return node.value;
    }

    void put(int key, int value) {
        Node node = map.get(key);
        if (node != null) {                             // update existing key
            node.value = value;
            unlink(node);
            addFront(node);
            return;
        }
        if (map.size() == capacity) {                   // evict least recently used
            Node lru = tail.prev;
            unlink(lru);
            map.remove(lru.key);
        }
        node = new Node(key, value);
        map.put(key, node);
        addFront(node);
    }

    private void unlink(Node n) {
        n.prev.next = n.next;
        n.next.prev = n.prev;
    }

    private void addFront(Node n) {
        n.next = head.next;
        n.prev = head;
        head.next.prev = n;
        head.next = n;
    }

    public static void main(String[] args) {
        LruCache c = new LruCache(2);
        c.put(1, 1);
        c.put(2, 2);
        StringBuilder out = new StringBuilder().append(c.get(1));
        c.put(3, 3);                                    // evicts 2
        out.append(' ').append(c.get(2));
        c.put(4, 4);                                    // evicts 1
        out.append(' ').append(c.get(1)).append(' ').append(c.get(3)).append(' ').append(c.get(4));
        System.out.println(out);
    }
}
```

**Output:**

```text
1 -1 -1 3 4
```

**Time:** O(1) average for both operations · **Space:** O(capacity)

</details>

### Q5. Design a set with O(1) `insert`, `remove` and `getRandom`.

`getRandom` returns each current element with equal probability.

<details>
<summary>Answer</summary>

**Approach:** An `ArrayList` gives O(1) random access for `getRandom`; a `HashMap<value, index>` gives O(1) membership. To remove in O(1), move the **last** element into the removed slot, update its index, and delete the last position. Invariant: `index.get(list.get(i)) == i` for every i.

```java
import java.util.*;

public class RandomizedSet {

    private final List<Integer> values = new ArrayList<>();
    private final Map<Integer, Integer> index = new HashMap<>();
    private final Random random = new Random(42);

    boolean insert(int v) {
        if (index.containsKey(v)) return false;
        index.put(v, values.size());
        values.add(v);
        return true;
    }

    boolean remove(int v) {
        Integer i = index.remove(v);
        if (i == null) return false;
        int last = values.remove(values.size() - 1);    // O(1): remove from the end
        if (i < values.size()) {                        // v was not the last: move last into its slot
            values.set(i, last);
            index.put(last, i);
        }
        return true;
    }

    int getRandom() { return values.get(random.nextInt(values.size())); }

    public static void main(String[] args) {
        RandomizedSet s = new RandomizedSet();
        boolean a = s.insert(1), b = s.remove(2), c = s.insert(2);
        int r = s.getRandom();
        boolean d = s.remove(1), e = s.insert(2);
        System.out.println(a + " " + b + " " + c + " " + (r == 1 || r == 2) + " " + d + " " + e + " " + s.getRandom());
    }
}
```

**Output:**

```text
true false true true true false 2
```

**Time:** O(1) average for all three · **Space:** O(n)

</details>

### Q6. Implement an iterator over a list of lists (2D vector), skipping empty rows.

`next()` returns elements row by row; `hasNext()` tells whether any element remains. Example: `[[1, 2], [3], [], [4]]` yields 1, 2, 3, 4.

<details>
<summary>Answer</summary>

**Approach:** Keep a row index and a column index. Before answering `hasNext` or `next`, advance past exhausted or empty rows. Do not copy everything into one list (O(total) extra space and up-front work).

```java
import java.util.*;

public class Vector2D implements Iterator<Integer> {

    private final int[][] rows;
    private int row = 0, col = 0;

    Vector2D(int[][] rows) { this.rows = rows; }

    private void skipEmpty() {
        while (row < rows.length && col == rows[row].length) {   // current row exhausted
            row++;
            col = 0;
        }
    }

    @Override
    public boolean hasNext() {
        skipEmpty();
        return row < rows.length;
    }

    @Override
    public Integer next() {
        if (!hasNext()) throw new NoSuchElementException();
        return rows[row][col++];
    }

    public static void main(String[] args) {
        Vector2D it = new Vector2D(new int[][] {{1, 2}, {3}, {}, {4}});
        StringBuilder sb = new StringBuilder();
        while (it.hasNext()) sb.append(it.next()).append(' ');
        System.out.println(sb.toString().trim() + " | " + new Vector2D(new int[][] {{}, {}}).hasNext());
    }
}
```

**Output:**

```text
1 2 3 4 | false
```

**Time:** O(1) amortized per call (each row is skipped once) · **Space:** O(1) extra

</details>

### Q7. Implement search suggestions: after each typed character, return up to three products with that prefix, in lexicographic order.

Example: products `["mobile", "mouse", "moneypot", "monitor", "mousepad"]`, typing `"mouse"` → `[[mobile, moneypot, monitor], [mobile, moneypot, monitor], [mouse, mousepad], [mouse, mousepad], [mouse, mousepad]]`.

<details>
<summary>Answer</summary>

**Approach:** Sort the products once. For each prefix, binary search the first product ≥ prefix (lower bound); the next up to three products that start with the prefix are the answer, because all strings with a given prefix are contiguous in sorted order. A trie with the three smallest words stored per node also works, using more memory.

```java
import java.util.*;

public class SearchSuggestions {

    static List<List<String>> suggestedProducts(String[] products, String searchWord) {
        String[] sorted = products.clone();
        Arrays.sort(sorted);
        List<List<String>> result = new ArrayList<>();
        StringBuilder prefix = new StringBuilder();
        for (char ch : searchWord.toCharArray()) {
            prefix.append(ch);
            String p = prefix.toString();
            int lo = 0, hi = sorted.length;
            while (lo < hi) {                            // first product ≥ p
                int mid = (lo + hi) >>> 1;
                if (sorted[mid].compareTo(p) < 0) lo = mid + 1;
                else hi = mid;
            }
            List<String> top = new ArrayList<>();
            for (int i = lo; i < Math.min(lo + 3, sorted.length) && sorted[i].startsWith(p); i++) top.add(sorted[i]);
            result.add(top);
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(suggestedProducts(new String[] {"mobile", "mouse", "moneypot", "monitor", "mousepad"}, "mouse"));
        System.out.println(suggestedProducts(new String[] {"havana"}, "tatiana"));
    }
}
```

**Output:**

```text
[[mobile, moneypot, monitor], [mobile, moneypot, monitor], [mouse, mousepad], [mouse, mousepad], [mouse, mousepad]]
[[], [], [], [], [], [], []]
```

**Time:** O(n log n × L) to sort plus O(L × log n × L) for the searches (string comparisons cost O(L)) · **Space:** O(n) for the sorted copy

</details>

## Advanced

### Q8. Implement an LFU cache with O(1) `get` and `put`.

Evict the key with the lowest use count; among ties, the least recently used. `get` and `put` both count as uses.

<details>
<summary>Answer</summary>

**Approach:** Three maps: key → value, key → frequency, and frequency → keys in recency order (`LinkedHashSet`, oldest first). Track `minFreq`. On each use, move the key from its frequency bucket to the next one; if the old bucket was the minimum and is now empty, increment `minFreq`. A new key always has frequency 1, so `minFreq` resets to 1 on insertion.

```java
import java.util.*;

public class LfuCache {

    private final int capacity;
    private int minFreq = 0;
    private final Map<Integer, Integer> values = new HashMap<>(), freq = new HashMap<>();
    private final Map<Integer, LinkedHashSet<Integer>> buckets = new HashMap<>();

    LfuCache(int capacity) { this.capacity = capacity; }

    private void touch(int key) {                       // one more use of key
        int f = freq.get(key);
        freq.put(key, f + 1);
        buckets.get(f).remove(key);
        if (f == minFreq && buckets.get(f).isEmpty()) minFreq++;
        buckets.computeIfAbsent(f + 1, k -> new LinkedHashSet<>()).add(key);   // newest at the end
    }

    int get(int key) {
        if (!values.containsKey(key)) return -1;
        touch(key);
        return values.get(key);
    }

    void put(int key, int value) {
        if (capacity == 0) return;
        if (values.containsKey(key)) {
            values.put(key, value);
            touch(key);
            return;
        }
        if (values.size() == capacity) {                // evict: lowest freq, oldest within it
            int victim = buckets.get(minFreq).iterator().next();
            buckets.get(minFreq).remove(victim);
            values.remove(victim);
            freq.remove(victim);
        }
        values.put(key, value);
        freq.put(key, 1);
        buckets.computeIfAbsent(1, k -> new LinkedHashSet<>()).add(key);
        minFreq = 1;
    }

    public static void main(String[] args) {
        LfuCache c = new LfuCache(2);
        c.put(1, 1);
        c.put(2, 2);
        StringBuilder out = new StringBuilder().append(c.get(1));        // key 1: freq 2
        c.put(3, 3);                                                      // evicts key 2 (freq 1)
        out.append(' ').append(c.get(2)).append(' ').append(c.get(3));   // key 3: freq 2
        c.put(4, 4);                                                      // tie at freq 2: evict 1 (older use)
        out.append(' ').append(c.get(1)).append(' ').append(c.get(3)).append(' ').append(c.get(4));
        System.out.println(out);
    }
}
```

**Output:**

```text
1 -1 3 -1 3 4
```

**Time:** O(1) average for both operations · **Space:** O(capacity)

</details>

### Q9. Implement a snapshot array.

`set(index, value)`, `snap()` returns a snapshot id (0, 1, 2, …), and `get(index, snapId)` returns the value at that index when that snapshot was taken. Copying the whole array on each snap is too slow for 5 × 10⁴ elements and calls.

<details>
<summary>Answer</summary>

**Approach:** For each index store only its **changes** as (snapId, value) pairs, appended in increasing snapId order. `get` binary searches the last change with snapId ≤ the requested one. Repeated sets within the same snapshot overwrite the last pair.

```java
import java.util.*;

public class SnapshotArray {

    private final List<List<int[]>> history = new ArrayList<>();   // per index: {snapId, value}
    private int snapId = 0;

    SnapshotArray(int length) {
        for (int i = 0; i < length; i++) {
            List<int[]> h = new ArrayList<>();
            h.add(new int[] {0, 0});                    // initial value 0
            history.add(h);
        }
    }

    void set(int index, int value) {
        List<int[]> h = history.get(index);
        int[] last = h.get(h.size() - 1);
        if (last[0] == snapId) last[1] = value;         // same snapshot: overwrite
        else h.add(new int[] {snapId, value});
    }

    int snap() { return snapId++; }

    int get(int index, int id) {
        List<int[]> h = history.get(index);
        int lo = 0, hi = h.size() - 1;
        while (lo < hi) {                               // last entry with snapId ≤ id
            int mid = (lo + hi + 1) >>> 1;
            if (h.get(mid)[0] <= id) lo = mid;
            else hi = mid - 1;
        }
        return h.get(lo)[1];
    }

    public static void main(String[] args) {
        SnapshotArray a = new SnapshotArray(3);
        a.set(0, 5);
        int s0 = a.snap();
        a.set(0, 6);
        int v = a.get(0, s0);
        int s1 = a.snap();
        System.out.println(s0 + " " + v + " " + s1 + " " + a.get(0, s1) + " " + a.get(1, s0));
    }
}
```

**Output:**

```text
0 5 1 6 0
```

**Time:** `set` and `snap` O(1), `get` O(log changes of that index) · **Space:** O(length + number of sets)

</details>

### Q10. Evaluate an arithmetic expression with `+ − * /` and no parentheses.

Integer division truncates toward zero; spaces may appear anywhere. Example: `"3+2*2"` → 7; `" 3+5 / 2 "` → 5.

<details>
<summary>Answer</summary>

**Approach:** Scan once, building each number. Keep `result` (sum of finished terms) and `last` (the current term, which `*` and `/` may still modify). On `+`/`−`, add `last` to `result` and start a new term (`±num`); on `*`/`/`, update `last` in place. This respects precedence with O(1) extra space; an explicit stack of terms is an equivalent, slightly simpler-to-explain alternative.

```java
public class Calculator {

    static int calculate(String s) {
        long result = 0, last = 0, num = 0;
        char op = '+';                                  // operator before the current number
        for (int i = 0; i <= s.length(); i++) {
            char c = i < s.length() ? s.charAt(i) : '+';   // sentinel flushes the last number
            if (c == ' ') continue;
            if (Character.isDigit(c)) {
                num = num * 10 + (c - '0');
                continue;
            }
            switch (op) {
                case '+' -> { result += last; last = num; }
                case '-' -> { result += last; last = -num; }
                case '*' -> last *= num;
                case '/' -> last /= num;               // truncates toward zero, also for negative terms
            }
            op = c;
            num = 0;
        }
        return (int) (result + last);
    }

    public static void main(String[] args) {
        System.out.println(calculate("3+2*2") + " " + calculate(" 3/2 ") + " " + calculate(" 3+5 / 2 ") + " " + calculate("14-3/2") + " " + calculate("2*3-8/3*3"));
    }
}
```

**Output:**

```text
7 1 5 13 0
```

**Time:** O(n) · **Space:** O(1)

</details>
