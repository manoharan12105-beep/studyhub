# DSA Output-Based Questions — Interview Questions

## Beginner

### Q1. What does this print?

```java
public class ArrayParameter {

    static void change(int[] a) {
        a[0] = 99;
        a = new int[] {7, 7};
        a[1] = 42;
    }

    public static void main(String[] args) {
        int[] arr = {1, 2};
        change(arr);
        System.out.println(arr[0] + " " + arr[1]);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
99 2
```

`a` starts as a copy of the reference to `arr`, so `a[0] = 99` changes the caller's array. Reassigning `a` to a new array only changes the local copy; `a[1] = 42` writes into the new array, which the caller never sees.

</details>

### Q2. What does this print?

```java
public class ArithmeticRules {
    public static void main(String[] args) {
        System.out.println(7 / 2 + " " + 7 / 2.0 + " " + ('a' + 1) + " " + (char) ('a' + 1) + " " + -7 / 2 + " " + -7 % 3);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
3 3.5 98 b -3 -1
```

`7 / 2` is integer division (3); `7 / 2.0` is floating point. `'a' + 1` promotes the `char` to `int` (97 + 1 = 98); casting back gives `'b'`. Integer division truncates toward zero (−3.5 → −3), and `%` takes the sign of the dividend (−7 = −2 × 3 − 1).

</details>

### Q3. What does this print?

```java
public class StringImmutability {
    public static void main(String[] args) {
        String s = "java";
        s.toUpperCase();
        s.concat("!");
        String t = s.replace('a', 'o');
        System.out.println(s + " " + t);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
java jovo
```

Strings are immutable: `toUpperCase` and `concat` return new strings that are discarded here. Only `t` captures a result. Write `s = s.toUpperCase()` to keep a change.

</details>

### Q4. What does this print?

```java
public class Increments {
    public static void main(String[] args) {
        int i = 5;
        int a = i++ + ++i;
        int[] arr = {10, 20, 30};
        int k = 0;
        arr[k++] = arr[k] + 1;
        System.out.println(a + " " + i + " " + arr[0] + " " + k);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
12 7 21 1
```

Left to right: `i++` yields 5 (i becomes 6), `++i` makes i 7 and yields 7, so a = 12. In `arr[k++] = arr[k] + 1`, the left side's index is evaluated first (index 0, then k becomes 1), then the right side reads `arr[1]` = 20, so `arr[0]` = 21.

</details>

### Q5. What does this print?

```java
public class RecursionOrder {

    static void f(int n) {
        if (n == 0) return;
        System.out.print("[" + n + "]");
        f(n - 1);
        System.out.print("[" + n + "]");
    }

    public static void main(String[] args) {
        f(3);
        System.out.println();
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
[3][2][1][1][2][3]
```

The first print runs on the way down (3, 2, 1); the second runs as each call returns, in reverse order (1, 2, 3). This "before/after the recursive call" distinction is exactly preorder vs postorder in [Tree Traversals](../../data-structures/tree-traversals/content.md).

</details>

## Intermediate

### Q6. What does this print?

```java
public class Overflow {
    public static void main(String[] args) {
        System.out.println((Integer.MAX_VALUE + 1) + " " + Math.abs(Integer.MIN_VALUE) + " " + (Integer.MAX_VALUE + 1L));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
-2147483648 -2147483648 2147483648
```

`int` arithmetic wraps: MAX + 1 becomes MIN. `Math.abs(MIN_VALUE)` overflows the same way, because +2147483648 does not fit in an `int`. Adding `1L` makes the expression `long`, which has room. This is why sums of many `int`s should be accumulated in a `long`.

</details>

### Q7. What does this print?

```java
import java.util.*;

public class AsListView {
    public static void main(String[] args) {
        Integer[] arr = {3, 1, 2};
        List<Integer> list = Arrays.asList(arr);
        list.set(0, 9);
        System.out.println(arr[0] + " " + list);
        try {
            list.add(4);
        } catch (UnsupportedOperationException e) {
            System.out.println("cannot add");
        }
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
9 [9, 1, 2]
cannot add
```

`Arrays.asList` returns a fixed-size list **backed by the array**: `set` writes through to `arr`, but `add`/`remove` throw `UnsupportedOperationException`. Wrap it in `new ArrayList<>(…)` for a resizable copy.

</details>

### Q8. What does this print?

```java
import java.util.*;

public class HeapOrder {
    public static void main(String[] args) {
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        for (int x : new int[] {5, 1, 4, 2, 3}) pq.offer(x);
        System.out.print(pq + " ->");
        while (!pq.isEmpty()) System.out.print(" " + pq.poll());
        System.out.println();
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
[1, 2, 4, 5, 3] -> 1 2 3 4 5
```

`toString` (and iteration) shows the internal heap array, which only guarantees that each parent ≤ its children. Repeated `poll` returns elements in sorted order. See [Heap](../../data-structures/heap/content.md).

</details>

### Q9. What does this print?

```java
import java.util.*;

public class ArrayKeys {
    public static void main(String[] args) {
        Set<int[]> arrays = new HashSet<>();
        arrays.add(new int[] {1, 2});
        Set<List<Integer>> lists = new HashSet<>();
        lists.add(List.of(1, 2));
        System.out.println(arrays.contains(new int[] {1, 2}) + " " + lists.contains(List.of(1, 2)));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
false true
```

Arrays do not override `equals`/`hashCode`, so two arrays with the same contents are different keys. `List` implementations compare element by element. Use `List<Integer>`, a `String` key, or an encoded `long` for composite keys.

</details>

### Q10. What does this print?

```java
import java.util.*;

public class DequeEnds {
    public static void main(String[] args) {
        Deque<Integer> d = new ArrayDeque<>();
        d.push(1);
        d.push(2);
        d.offer(3);
        d.offerFirst(4);
        String contents = d.toString();
        int front = d.pop(), back = d.pollLast();
        System.out.println(contents + " " + front + " " + back + " " + d);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
[4, 2, 1, 3] 4 3 [2, 1]
```

`push` and `offerFirst` add at the **front**; `offer` adds at the **back**. So the deque is 4, 2, 1, 3. `pop` removes from the front (4) — `push`/`pop` treat the front as the top of a stack — and `pollLast` removes from the back (3), leaving `[2, 1]`.

> [!NOTE]
> The contents are captured in a variable before `pop` on purpose. Writing `d + " " + d.pop()` in one expression is fragile: compilers before JDK 19 could call `d.toString()` after evaluating `d.pop()`, so the printed contents depended on the compiler version.

</details>

### Q11. What does this print?

```java
public class StringIdentity {
    public static void main(String[] args) {
        String a = "ab";
        String b = "a" + "b";
        String part = "a";
        String c = part + "b";
        System.out.println((a == b) + " " + (a == c) + " " + a.equals(c) + " " + (a == c.intern()));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
true false true true
```

`"a" + "b"` is a compile-time constant, so it is the same interned literal as `"ab"`. `part + "b"` is computed at run time and creates a new object, so `==` is false while `equals` is true. `intern()` returns the pooled instance. Always compare string contents with `equals`.

</details>

## Advanced

### Q12. What does this print?

```java
import java.util.*;

public class MutableKey {
    public static void main(String[] args) {
        List<Integer> key = new ArrayList<>(List.of(1, 2));
        Map<List<Integer>, String> map = new HashMap<>();
        map.put(key, "x");
        key.add(3);
        System.out.println(map.get(key) + " " + map.get(List.of(1, 2)) + " " + map.size());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
null null 1
```

The entry was stored under the hash of `[1, 2]`. After mutation, `get(key)` hashes `[1, 2, 3]` and looks in a different bucket; `get(List.of(1, 2))` finds the right bucket but the stored key now equals `[1, 2, 3]`, not `[1, 2]`. The entry is unreachable but still counted. Never mutate an object while it is a key in a hash-based collection.

</details>

### Q13. What does this print?

```java
import java.util.Arrays;

public class BinarySearchResult {
    public static void main(String[] args) {
        int[] a = {1, 3, 5, 7};
        System.out.println(Arrays.binarySearch(a, 4) + " " + Arrays.binarySearch(a, 7) + " " + Arrays.binarySearch(a, 0) + " " + Arrays.binarySearch(a, 9));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
-3 3 -1 -5
```

When the key is found, its index is returned (7 → 3). Otherwise the result is `−(insertionPoint) − 1`: 4 would go at index 2 → −3; 0 at index 0 → −1; 9 at index 4 → −5. The encoding keeps "not found" negative even when the insertion point is 0. Decode with `ip = −result − 1`.

</details>

### Q14. What does this print?

```java
public class ShortCircuit {
    public static void main(String[] args) {
        int x = 0;
        System.out.println(x != 0 && 10 / x > 1);
        try {
            System.out.println(x != 0 & 10 / x > 1);
        } catch (ArithmeticException e) {
            System.out.println("ArithmeticException");
        }
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
false
ArithmeticException
```

`&&` stops as soon as the left side is false, so the division never happens. `&` on booleans evaluates **both** sides, so `10 / 0` throws. Guards like `i < n && a[i] > 0` rely on short-circuiting.

</details>

### Q15. What does this print?

```java
import java.util.*;

public class OverflowingComparator {
    public static void main(String[] args) {
        Integer[] v = {Integer.MIN_VALUE, 1, 0};
        Integer[] w = v.clone();
        Arrays.sort(v, (p, q) -> p - q);
        Arrays.sort(w, Integer::compare);
        System.out.println(Arrays.toString(v) + " " + Arrays.toString(w));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
[0, 1, -2147483648] [-2147483648, 0, 1]
```

`1 − Integer.MIN_VALUE` overflows to a negative number, so the subtraction comparator claims 1 < MIN_VALUE, while `MIN_VALUE − 0` says MIN_VALUE < 0 — an inconsistent ordering, and the sort produces a wrong result. `Integer.compare` never overflows. The same bug appears in heap and `TreeMap` comparators. See [Java Sorting and Comparators](../../fundamentals/java-sorting-and-comparators/content.md).

</details>
