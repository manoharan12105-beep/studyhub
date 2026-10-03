# Java Toolkit: HashMap, HashSet, LinkedHashMap, TreeMap and TreeSet — Practice

### P1. Which collection returns keys in sorted order when iterated?

**Difficulty:** Easy · **Pattern:** Choosing the class

- A) `HashMap`
- B) `LinkedHashMap`
- C) `TreeMap`
- D) `HashSet`

<details>
<summary>Hint</summary>

Which one is built on a search tree?

</details>

<details>
<summary>Answer</summary>

**Answer:** C) `TreeMap`

**Explanation:** `TreeMap` is a red-black tree ordered by key. `LinkedHashMap` keeps insertion order, not sorted order; `HashMap`/`HashSet` promise no order.

</details>

### P2. What does this print?

**Difficulty:** Easy · **Pattern:** Set semantics

```java
Set<String> seen = new HashSet<>();
System.out.println(seen.add("x") + " " + seen.add("y") + " " + seen.add("x") + " " + seen.size());
```

- A) true true true 3
- B) true true false 2
- C) true true false 3
- D) false false true 2

<details>
<summary>Hint</summary>

What does `add` return when the element is already present?

</details>

<details>
<summary>Answer</summary>

**Answer:** B) true true false 2

**Explanation:** `add` returns `false` and changes nothing when the element exists.

</details>

### P3. Group words that are anagrams of each other. Example: `["eat","tea","tan","ate","nat","bat"]` → groups `[eat, tea, ate]`, `[tan, nat]`, `[bat]`.

**Difficulty:** Medium · **Pattern:** Canonical key + `computeIfAbsent`

<details>
<summary>Hint</summary>

Anagrams become identical after sorting their letters. Use that as a map key.

</details>

<details>
<summary>Answer</summary>

**Approach:** Key = the word's letters sorted. Group with `computeIfAbsent`. A `LinkedHashMap` keeps groups in first-seen order for predictable output.

```java
import java.util.*;

public class GroupAnagrams {

    static List<List<String>> group(String[] words) {
        Map<String, List<String>> groups = new LinkedHashMap<>();
        for (String word : words) {
            char[] letters = word.toCharArray();
            Arrays.sort(letters);
            String key = new String(letters);
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
        }
        return new ArrayList<>(groups.values());
    }

    public static void main(String[] args) {
        System.out.println(group(new String[] {"eat", "tea", "tan", "ate", "nat", "bat"}));
    }
}
```

**Output:**

```text
[[eat, tea, ate], [tan, nat], [bat]]
```

**Complexity:** O(n × L log L) for n words of length ≤ L; O(n × L) space. A 26-count signature instead of sorting gives O(n × L).

</details>

### P4. A `TreeSet<Task>` uses `Comparator.comparingInt(Task::priority)`. Tasks with equal priority keep disappearing. Why, and how do you fix it?

**Difficulty:** Medium · **Pattern:** Comparator consistency

<details>
<summary>Hint</summary>

How does a `TreeSet` decide two elements are duplicates?

</details>

<details>
<summary>Answer</summary>

**Answer:** `TreeSet` treats two elements as the same when the comparator returns 0. Tasks with equal priority compare as equal, so `add` rejects the second one.

**Fix:** add a tie-breaker that is unique per task: `Comparator.comparingInt(Task::priority).thenComparing(Task::id)`. Alternatively, use a `TreeMap<Integer, List<Task>>` keyed by priority.

</details>

### P5. Design a "time-slot booking" helper: `book(start, end)` returns `true` and records the booking only if [start, end) does not overlap any existing booking. Aim for O(log n) per call.

**Difficulty:** Hard · **Pattern:** TreeMap floor/ceiling

<details>
<summary>Hint</summary>

Only two existing bookings can conflict: the one starting just before `start` and the one starting at or after `start`.

</details>

<details>
<summary>Answer</summary>

**Approach:** Store bookings in a `TreeMap<start, end>`. The new interval overlaps a previous booking if that booking's end > start; it overlaps the next booking if that booking's start < end.

```java
import java.util.*;

public class SlotBooking {

    private final TreeMap<Integer, Integer> bookings = new TreeMap<>();

    boolean book(int start, int end) {
        Map.Entry<Integer, Integer> before = bookings.floorEntry(start);
        if (before != null && before.getValue() > start) {
            return false;
        }
        Map.Entry<Integer, Integer> after = bookings.ceilingEntry(start);
        if (after != null && after.getKey() < end) {
            return false;
        }
        bookings.put(start, end);
        return true;
    }

    public static void main(String[] args) {
        SlotBooking calendar = new SlotBooking();
        System.out.println(calendar.book(10, 20));   // free
        System.out.println(calendar.book(15, 25));   // overlaps [10, 20)
        System.out.println(calendar.book(20, 30));   // touches but does not overlap
        System.out.println(calendar.book(5, 11));    // overlaps [10, 20)
        System.out.println(calendar.book(5, 10));    // fits before 10
    }
}
```

**Output:**

```text
true
false
true
false
true
```

**Complexity:** O(log n) per `book`, O(n) space.

</details>

### P6. Count the number of distinct pairs (i < j) of points that lie on the same horizontal line, given points as `int[][]`. Why must you not use `int[]` as a map key, and what key do you use instead?

**Difficulty:** Hard · **Pattern:** Hash keys

<details>
<summary>Hint</summary>

Points on the same horizontal line share their y-coordinate. Count how many points share each y.

</details>

<details>
<summary>Answer</summary>

**Approach:** Count points per y-coordinate; a group of c points contributes c × (c − 1)/2 pairs. The key here is an `Integer` (y). If the key had to be a whole point, an `int[]` would fail because arrays use identity `equals`/`hashCode` — use a `record`, a `List<Integer>`, or encode as `long` (`(long) x << 32 | (y & 0xffffffffL)`).

```java
import java.util.*;

public class SameLinePairs {

    static long countPairs(int[][] points) {
        Map<Integer, Integer> perRow = new HashMap<>();
        for (int[] p : points) {
            perRow.merge(p[1], 1, Integer::sum);
        }
        long pairs = 0;
        for (int c : perRow.values()) {
            pairs += (long) c * (c - 1) / 2;
        }
        return pairs;
    }

    public static void main(String[] args) {
        int[][] points = {{0, 1}, {3, 1}, {5, 1}, {2, 4}, {7, 4}, {1, 9}};
        System.out.println(countPairs(points));
    }
}
```

**Output:**

```text
4
```

**Complexity:** O(n) average time, O(n) space. Three points at y = 1 give 3 pairs, two at y = 4 give 1.

</details>
