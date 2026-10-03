# Backtracking — Practice

### P1. Letter combinations of a phone number

**Difficulty:** Medium · **Pattern:** One choice list per position

Each digit 2–9 maps to letters as on a phone keypad (2: abc, 3: def, 4: ghi, 5: jkl, 6: mno, 7: pqrs, 8: tuv, 9: wxyz). Return all letter strings a digit string could represent.

**Constraints:** 0 ≤ length ≤ 4.

Example: `"23"` → `[ad, ae, af, bd, be, bf, cd, ce, cf]`.

<details>
<summary>Hint</summary>

The state is the prefix built so far; the choices at position i are the letters of digit i.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class PhoneLetters {

    static final String[] KEYS = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};

    static List<String> combinations(String digits) {
        List<String> result = new ArrayList<>();
        if (!digits.isEmpty()) build(digits, 0, new StringBuilder(), result);
        return result;
    }

    private static void build(String digits, int pos, StringBuilder current, List<String> result) {
        if (pos == digits.length()) {
            result.add(current.toString());
            return;
        }
        for (char letter : KEYS[digits.charAt(pos) - '0'].toCharArray()) {
            current.append(letter);
            build(digits, pos + 1, current, result);
            current.deleteCharAt(current.length() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.println(combinations("23"));
        System.out.println(combinations("") + " " + combinations("79").size());
    }
}
```

**Output:**

```text
[ad, ae, af, bd, be, bf, cd, ce, cf]
[] 16
```

**Complexity:** O(4ⁿ × n) time (at most 4 letters per digit, O(n) to build each string), O(n) recursion depth.

</details>

### P2. Generate balanced parentheses

**Difficulty:** Medium · **Pattern:** Pruning by validity

Generate all strings of n pairs of balanced parentheses.

**Constraints:** 1 ≤ n ≤ 8.

Example: n = 3 → `[((())), (()()), (())(), ()(()), ()()()]`.

<details>
<summary>Hint</summary>

Generating all 2²ⁿ strings and filtering is wasteful. Add '(' while fewer than n are open; add ')' only while closes < opens — every prefix then stays valid.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class GenerateParentheses {

    static List<String> generate(int n) {
        List<String> result = new ArrayList<>();
        build(n, 0, 0, new StringBuilder(), result);
        return result;
    }

    private static void build(int n, int open, int close, StringBuilder current, List<String> result) {
        if (current.length() == 2 * n) {
            result.add(current.toString());
            return;
        }
        if (open < n) {
            current.append('(');
            build(n, open + 1, close, current, result);
            current.deleteCharAt(current.length() - 1);
        }
        if (close < open) {                          // never close more than opened
            current.append(')');
            build(n, open, close + 1, current, result);
            current.deleteCharAt(current.length() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.println(generate(3));
        System.out.println("n=4: " + generate(4).size());
    }
}
```

**Output:**

```text
[((())), (()()), (())(), ()(()), ()()()]
n=4: 14
```

**Complexity:** The number of results is the Catalan number Cₙ ≈ 4ⁿ / (n^1.5 √π); time O(n × Cₙ), space O(n).

</details>

### P3. Subsets with duplicates

**Difficulty:** Medium · **Pattern:** Sort + skip equal siblings

Return all distinct subsets of an array that may contain duplicates.

**Constraints:** 1 ≤ n ≤ 10.

Example: `[1, 2, 2]` → `[[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]`.

<details>
<summary>Hint</summary>

Sort. At one level of the recursion (the same `start`), using the second 2 instead of the first gives the same subsets — skip `nums[i]` if `i > start` and `nums[i] == nums[i − 1]`.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class SubsetsWithDuplicates {

    static List<List<Integer>> subsetsWithDup(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        build(nums, 0, new ArrayList<>(), result);
        return result;
    }

    private static void build(int[] nums, int start, List<Integer> current, List<List<Integer>> result) {
        result.add(new ArrayList<>(current));
        for (int i = start; i < nums.length; i++) {
            if (i > start && nums[i] == nums[i - 1]) continue;   // same value already tried at this level
            current.add(nums[i]);
            build(nums, i + 1, current, result);
            current.remove(current.size() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.println(subsetsWithDup(new int[] {2, 1, 2}));
    }
}
```

**Output:**

```text
[[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]
```

**Complexity:** O(n × 2ⁿ) time worst case, O(n) space besides the output.

</details>

### P4. Combination sum (unlimited reuse)

**Difficulty:** Medium · **Pattern:** Reuse allowed → recurse with the same start

Given distinct positive candidates and a target, return all unique combinations that sum to the target; each candidate may be used any number of times.

**Constraints:** 1 ≤ candidates ≤ 30; 1 ≤ target ≤ 40.

Example: `[2, 3, 6, 7]`, target 7 → `[[2, 2, 3], [7]]`.

<details>
<summary>Hint</summary>

Recurse with `i` (not `i + 1`) to allow reuse. Sort candidates and stop the loop as soon as a candidate exceeds the remaining target.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class CombinationSum {

    static List<List<Integer>> combinationSum(int[] candidates, int target) {
        Arrays.sort(candidates);
        List<List<Integer>> result = new ArrayList<>();
        build(candidates, 0, target, new ArrayList<>(), result);
        return result;
    }

    private static void build(int[] c, int start, int remaining, List<Integer> current, List<List<Integer>> result) {
        if (remaining == 0) {
            result.add(new ArrayList<>(current));
            return;
        }
        for (int i = start; i < c.length; i++) {
            if (c[i] > remaining) break;                 // sorted: all later candidates are too big
            current.add(c[i]);
            build(c, i, remaining - c[i], current, result);   // i, not i + 1: reuse allowed
            current.remove(current.size() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.println(combinationSum(new int[] {2, 3, 6, 7}, 7));
        System.out.println(combinationSum(new int[] {2, 3, 5}, 8));
    }
}
```

**Output:**

```text
[[2, 2, 3], [7]]
[[2, 2, 2, 2], [2, 3, 3], [3, 5]]
```

**Complexity:** Exponential in target / min(candidate); O(target / min) recursion depth. (If only the **number** of combinations is needed, use unbounded-knapsack DP instead — see [Knapsack DP](../knapsack-dp/content.md).)

</details>

### P5. Permutations with duplicates

**Difficulty:** Hard · **Pattern:** Skip an equal value whose twin is unused

Return all distinct permutations of an array that may contain duplicates.

**Constraints:** 1 ≤ n ≤ 8.

Example: `[1, 1, 2]` → `[[1, 1, 2], [1, 2, 1], [2, 1, 1]]`.

<details>
<summary>Hint</summary>

Sort. When choosing a value for the current position, skip `nums[i]` if it equals `nums[i − 1]` and `nums[i − 1]` is **not** used — that forces equal values to be placed in a fixed relative order.

</details>

<details>
<summary>Answer</summary>

**Approach:** Generating all n! permutations and deduplicating with a set wastes time. The skip rule allows the second copy of a value only after the first copy is already in the permutation, so each distinct arrangement is produced exactly once.

```java
import java.util.*;

public class PermutationsWithDuplicates {

    static List<List<Integer>> permuteUnique(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        build(nums, new boolean[nums.length], new ArrayList<>(), result);
        return result;
    }

    private static void build(int[] nums, boolean[] used, List<Integer> current, List<List<Integer>> result) {
        if (current.size() == nums.length) {
            result.add(new ArrayList<>(current));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1]) continue;   // equal twin must be placed first
            used[i] = true;
            current.add(nums[i]);
            build(nums, used, current, result);
            current.remove(current.size() - 1);
            used[i] = false;
        }
    }

    public static void main(String[] args) {
        System.out.println(permuteUnique(new int[] {1, 1, 2}));
        System.out.println(permuteUnique(new int[] {2, 2, 1, 1}).size());
    }
}
```

**Output:**

```text
[[1, 1, 2], [1, 2, 1], [2, 1, 1]]
6
```

**Complexity:** O(n × n!) worst case (all distinct), O(n) space. For `[2, 2, 1, 1]` there are 4! / (2! × 2!) = 6 distinct permutations.

</details>
