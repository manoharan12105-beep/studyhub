# Problem-Solving Framework — Practice

### P1. Write the clarifying questions

**Difficulty:** Easy · **Pattern:** Step 2 — clarify

Problem as given by an interviewer: *"Given a list of numbers, return the two numbers that add up to a target."* List the questions you would ask before designing anything, and say how each answer could change your solution.

<details>
<summary>Hint</summary>

Think about: sizes, value ranges, duplicates, sortedness, what to return, what if there is no answer or several answers.

</details>

<details>
<summary>Answer</summary>

| Question | Why it matters |
|----------|----------------|
| How large can the list be? | n ≤ 10³ allows O(n²); n ≤ 10⁶ needs O(n) or O(n log n). |
| Is the list sorted? | Sorted → two pointers in O(1) space; unsorted → hash map or sort first. |
| Return values or indices? | Indices rule out sorting unless original positions are carried along. |
| Can the same element be used twice? | Decides whether to look up before inserting into the map. |
| Can there be duplicates / negative numbers? | Affects map design (value → index may be overwritten) and overflow of sums. |
| Exactly one answer, several, or possibly none? | Return the first, all pairs (deduplicated), or a sentinel such as `[-1, -1]`. |
| Range of values and target? | `a + b` might overflow `int` → use `long`. |

</details>

### P2. Choose the edge cases

**Difficulty:** Easy · **Pattern:** Step 3 — examples

For *"return the length of the longest substring without repeating characters"*, list five test inputs that cover different edge cases, with expected outputs.

<details>
<summary>Hint</summary>

Cover: empty input, a single character, all characters equal, all distinct, and a repeat that lies **before** the current window start.

</details>

<details>
<summary>Answer</summary>

| Input | Expected | What it tests |
|-------|----------|---------------|
| `""` | 0 | empty input |
| `"a"` | 1 | single character |
| `"bbbb"` | 1 | every step shrinks the window |
| `"abcdef"` | 6 | window never shrinks |
| `"abba"` | 2 | the second `a` repeats a character that is already outside the window — `left` must not move backwards |

The last case catches the most common bug in the sliding-window solution ([Sliding Window](../../patterns/sliding-window/content.md)).

</details>

### P3. Find the bottleneck

**Difficulty:** Medium · **Pattern:** Step 5 — optimise

A brute force for *"given a sorted array and a target, count pairs i < j with a[i] + a[j] ≤ target"* uses two nested loops. Name the repeated work, propose two faster approaches, and give their complexities.

<details>
<summary>Hint</summary>

For a fixed i, the valid partners j form a contiguous block (the array is sorted). How far does that block reach, and how does its end move as i increases?

</details>

<details>
<summary>Answer</summary>

**Repeated work:** for every i the inner loop re-checks partners one by one, although sortedness already tells you that all j up to some boundary work and none beyond it — O(n²) in total.

**Faster approaches:**

1. **Binary search per i** — find the last j > i with a[j] ≤ target − a[i]; add j − i pairs. O(n log n) time, O(1) space ([Binary Search Pattern](../../patterns/binary-search-pattern/content.md)).
2. **Two pointers** — `left = 0`, `right = n − 1`; if a[left] + a[right] ≤ target, every index between them pairs with `left`, so add `right − left` and move `left`; otherwise move `right`. O(n) time, O(1) space ([Two Pointers](../../patterns/two-pointers/content.md)).

Both rely on sortedness; on unsorted input, sort first (O(n log n)).

</details>

### P4. Apply the whole framework

**Difficulty:** Medium · **Pattern:** All steps

Apply steps 1–9 to: *"Given two integer arrays, return their intersection, where each value appears as many times as it occurs in both."* Write the final Java method.

<details>
<summary>Hint</summary>

The brute force removes matched elements from one array as it scans the other. What should you remember about the first array so each lookup is O(1)? What changes if both arrays are already sorted?

</details>

<details>
<summary>Answer</summary>

1. **Understand:** for each value v, output it min(count in a, count in b) times.
2. **Clarify:** output order? (any — we return it sorted for readability). Sizes? (up to 10⁵ each; maybe one array is much smaller). Sorted inputs? (not guaranteed). Values range? (any `int`).
3. **Examples:** `[1, 2, 2, 1]`, `[2, 2]` → `[2, 2]`; `[4, 9, 5]`, `[9, 4, 9, 8, 4]` → `[4, 9]`; `[]`, `[1]` → `[]`.
4. **Brute force:** for each element of b, scan a for an unused equal element and mark it used — O(n × m).
5. **Optimise:** the repeated work is "find an unused equal element" → count a's values in a map, decrement on each match: O(n + m) time, O(min(n, m)) space if the map is built from the smaller array. If both are sorted: two pointers, O(n + m) time, O(1) extra space.
6. **Plan:** count the smaller array; scan the other; when a count is positive, output the value and decrement.
7. **Code:**

```java
import java.util.*;

public class ArrayIntersection {

    static List<Integer> intersect(int[] a, int[] b) {
        if (a.length > b.length) return intersect(b, a);       // build the map from the smaller array
        Map<Integer, Integer> count = new HashMap<>();
        for (int x : a) count.merge(x, 1, Integer::sum);
        List<Integer> result = new ArrayList<>();
        for (int y : b) {
            Integer c = count.get(y);
            if (c != null && c > 0) {
                result.add(y);
                count.put(y, c - 1);                            // each occurrence matches once
            }
        }
        Collections.sort(result);                               // any order is valid; sorted for display
        return result;
    }

    public static void main(String[] args) {
        System.out.println(intersect(new int[] {1, 2, 2, 1}, new int[] {2, 2}) + " " + intersect(new int[] {4, 9, 5}, new int[] {9, 4, 9, 8, 4}) + " "
                + intersect(new int[] {}, new int[] {1}));
    }
}
```

**Output:**

```text
[2, 2] [4, 9] []
```

8. **Test:** the three examples match; duplicates are matched at most min(count) times because counts are decremented.
9. **Analyse:** O(n + m) expected time (plus O(k log k) for the optional sort of k results), O(min(n, m)) extra space.

</details>
