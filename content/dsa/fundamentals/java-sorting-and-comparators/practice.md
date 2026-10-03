# Java Toolkit: Sorting, Comparable and Comparator — Practice

### P1. Which call sorts a `List<String>` by length, shortest first?

**Difficulty:** Easy · **Pattern:** Comparator basics

- A) `list.sort(Comparator.comparingInt(String::length));`
- B) `Collections.sort(list);`
- C) `list.sort(Comparator.reverseOrder());`
- D) `Arrays.sort(list, String::length);`

<details>
<summary>Hint</summary>

The natural order of strings is alphabetical.

</details>

<details>
<summary>Answer</summary>

**Answer:** A) `list.sort(Comparator.comparingInt(String::length));`

**Explanation:** B sorts alphabetically, C reverse-alphabetically, and D does not compile (`Arrays.sort` takes an array, and `String::length` is not a `Comparator`).

</details>

### P2. What does this print?

**Difficulty:** Easy · **Pattern:** Stable sort output

```java
List<String> words = new ArrayList<>(List.of("bb", "a", "cc", "d"));
words.sort(Comparator.comparingInt(String::length));
System.out.println(words);
```

- A) [a, d, bb, cc]
- B) [d, a, cc, bb]
- C) [a, bb, cc, d]
- D) [a, d, cc, bb]

<details>
<summary>Hint</summary>

`List.sort` is stable.

</details>

<details>
<summary>Answer</summary>

**Answer:** A) [a, d, bb, cc]

**Explanation:** Length-1 words keep their original order (a before d), as do length-2 words (bb before cc).

</details>

### P3. A team sorts by `comparing(Player::score).thenComparing(Player::name).reversed()`. They wanted score descending but name ascending. What do they get, and how do they fix it?

**Difficulty:** Medium · **Pattern:** reversed() scope

<details>
<summary>Hint</summary>

What does `reversed()` apply to?

</details>

<details>
<summary>Answer</summary>

**Answer:** `reversed()` reverses the whole chain, so names are also descending within equal scores.

**Fix:** `Comparator.comparing(Player::score, Comparator.reverseOrder()).thenComparing(Player::name)` — or `comparingInt(Player::score).reversed().thenComparing(Player::name)`, where `reversed()` comes before the tie-breaker is added.

</details>

### P4. Sort an array of meetings `int[][]` so that earlier end times come first, and among equal end times, later start times come first.

**Difficulty:** Medium · **Pattern:** Two-key comparator on arrays

<details>
<summary>Hint</summary>

Compare `a[1]` with `b[1]`; on a tie, compare `b[0]` with `a[0]`.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class SortMeetings {
    public static void main(String[] args) {
        int[][] meetings = {{1, 4}, {3, 4}, {0, 2}, {2, 6}};
        Arrays.sort(meetings, (a, b) -> a[1] != b[1]
                ? Integer.compare(a[1], b[1])
                : Integer.compare(b[0], a[0]));
        System.out.println(Arrays.deepToString(meetings));
    }
}
```

**Output:**

```text
[[0, 2], [3, 4], [1, 4], [2, 6]]
```

**Complexity:** O(n log n). Swapping the argument order (`b[0], a[0]`) reverses only that key.

</details>

### P5. Given non-negative integers, arrange them to form the largest possible number, returned as a string. Example: `[3, 30, 34, 5, 9]` → `"9534330"`. Explain why the comparator is correct and handle `[0, 0]`.

**Difficulty:** Hard · **Pattern:** Custom ordering by concatenation

<details>
<summary>Hint</summary>

Put a before b when the string a + b is larger than b + a.

</details>

<details>
<summary>Answer</summary>

**Approach:** Sort the numbers as strings with `(a, b) -> (b + a).compareTo(a + b)`. This ordering is transitive (it is equivalent to comparing a/(10^len(a) − 1) with b/(10^len(b) − 1)), so sorting is valid, and any adjacent pair out of this order could be swapped to make the result larger. If the first string is `"0"`, every number is 0 — return `"0"` rather than `"00"`.

```java
import java.util.*;

public class LargestNumber {

    static String largest(int[] nums) {
        String[] parts = new String[nums.length];
        for (int i = 0; i < nums.length; i++) {
            parts[i] = String.valueOf(nums[i]);
        }
        Arrays.sort(parts, (a, b) -> (b + a).compareTo(a + b));
        if (parts[0].equals("0")) {
            return "0";
        }
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            sb.append(p);
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(largest(new int[] {3, 30, 34, 5, 9}));
        System.out.println(largest(new int[] {10, 2}));
        System.out.println(largest(new int[] {0, 0}));
    }
}
```

**Output:**

```text
9534330
210
0
```

**Complexity:** O(n log n × L) where L is the number of digits (each comparison builds strings of length ≤ 2L).

</details>
