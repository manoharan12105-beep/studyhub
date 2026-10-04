# Sliding Window — Practice

### P1. Maximum average of k consecutive values

**Difficulty:** Easy · **Pattern:** Fixed window

Return the maximum average of any contiguous subarray of length exactly k.

**Constraints:** 1 ≤ k ≤ n ≤ 10⁵; −10⁴ ≤ values ≤ 10⁴.

Example: `[1, 12, -5, -6, 50, 3]`, k = 4 → `12.75` ((12 − 5 − 6 + 50) / 4).

<details>
<summary>Hint</summary>

Maximising the average of fixed-length windows is the same as maximising their sum. Slide the sum.

</details>

<details>
<summary>Answer</summary>

```java
public class MaxAverageWindow {

    static double findMaxAverage(int[] a, int k) {
        long sum = 0;
        for (int i = 0; i < k; i++) sum += a[i];
        long best = sum;
        for (int i = k; i < a.length; i++) {
            sum += a[i] - a[i - k];
            best = Math.max(best, sum);
        }
        return (double) best / k;                      // divide once at the end
    }

    public static void main(String[] args) {
        System.out.println(findMaxAverage(new int[] {1, 12, -5, -6, 50, 3}, 4) + " " + findMaxAverage(new int[] {5}, 1));
    }
}
```

**Output:**

```text
12.75 5.0
```

**Complexity:** O(n) time, O(1) space. Negative values are fine here because the window size is fixed — no shrinking decision is needed.

</details>

### P2. Does s2 contain a permutation of s1?

**Difficulty:** Medium · **Pattern:** Fixed window with character counts

Return true if some substring of `s2` is a rearrangement of `s1`.

**Constraints:** 1 ≤ |s1|, |s2| ≤ 10⁴; lowercase letters.

Example: `s1 = "ab"`, `s2 = "eidbaooo"` → `true` (`"ba"`); `s2 = "eidboaoo"` → `false`.

<details>
<summary>Hint</summary>

A permutation of s1 is a window of length |s1| with exactly the same letter counts. Keep `need[26]` and a counter of how many letters currently have matching counts, updating it as one letter enters and one leaves.

</details>

<details>
<summary>Answer</summary>

**Approach:** `diff[c]` = count in window − count in s1. Track `zeros` = number of letters with `diff[c] == 0`; the window is a permutation when `zeros == 26`. Each slide changes two entries, so O(1) per step instead of comparing 26 counts.

```java
public class PermutationInString {

    static boolean checkInclusion(String s1, String s2) {
        int m = s1.length();
        if (m > s2.length()) return false;
        int[] diff = new int[26];
        for (int i = 0; i < m; i++) {
            diff[s1.charAt(i) - 'a']--;
            diff[s2.charAt(i) - 'a']++;
        }
        int zeros = 0;
        for (int d : diff) if (d == 0) zeros++;
        for (int right = m; ; right++) {
            if (zeros == 26) return true;
            if (right == s2.length()) return false;
            zeros -= change(diff, s2.charAt(right) - 'a', +1);       // entering letter
            zeros -= change(diff, s2.charAt(right - m) - 'a', -1);   // leaving letter
        }
    }

    // Applies delta to diff[c]; returns how much the count of zeros decreased (−1, 0 or 1).
    static int change(int[] diff, int c, int delta) {
        int before = diff[c] == 0 ? 1 : 0;
        diff[c] += delta;
        int after = diff[c] == 0 ? 1 : 0;
        return before - after;
    }

    public static void main(String[] args) {
        System.out.println(checkInclusion("ab", "eidbaooo") + " " + checkInclusion("ab", "eidboaoo") + " " + checkInclusion("adc", "dcda"));
    }
}
```

**Output:**

```text
true false true
```

**Complexity:** O(|s1| + |s2|) time, O(1) space (26 counters).

</details>

### P3. Minimum window containing all characters

**Difficulty:** Hard · **Pattern:** Variable window, shrink while valid

Return the shortest substring of `s` that contains every character of `t` (with multiplicity), or `""`.

**Constraints:** 1 ≤ |s|, |t| ≤ 10⁵; ASCII letters.

Example: `s = "ADOBECODEBANC"`, `t = "ABC"` → `"BANC"`.

<details>
<summary>Hint</summary>

Keep `need[c]` = how many more of c the window still needs, and `missing` = total characters still needed. Expand right; when `missing` hits 0 the window is valid — record it and shrink from the left until it becomes invalid again.

</details>

<details>
<summary>Answer</summary>

**Approach:** Validity is monotone: adding characters never makes a valid window invalid. So for each `right`, the best `left` only moves forward.

```java
public class MinimumWindowSubstring {

    static String minWindow(String s, String t) {
        int[] need = new int[128];
        for (char c : t.toCharArray()) need[c]++;
        int missing = t.length(), left = 0, bestStart = 0, bestLen = Integer.MAX_VALUE;
        for (int right = 0; right < s.length(); right++) {
            if (need[s.charAt(right)]-- > 0) missing--;          // this character was still needed
            while (missing == 0) {                               // valid: record and shrink
                if (right - left + 1 < bestLen) {
                    bestLen = right - left + 1;
                    bestStart = left;
                }
                if (++need[s.charAt(left++)] > 0) missing++;     // removed a needed character
            }
        }
        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLen);
    }

    public static void main(String[] args) {
        System.out.println(minWindow("ADOBECODEBANC", "ABC") + " [" + minWindow("a", "aa") + "] " + minWindow("aa", "aa"));
    }
}
```

**Output:**

```text
BANC [] aa
```

**Complexity:** O(|s| + |t|) time, O(1) space (128 counters). Characters not in t go negative in `need` and never affect `missing`.

</details>
