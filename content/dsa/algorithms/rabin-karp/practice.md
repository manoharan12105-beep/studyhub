# Rabin–Karp Algorithm — Practice

### P1. Find any of several equal-length patterns

**Difficulty:** Easy · **Pattern:** Rolling hash + hash set of patterns

Given a text and k patterns that all have length m, return the starting indices of windows equal to any pattern.

**Constraints:** 1 ≤ n ≤ 10⁵; 1 ≤ k ≤ 10³; 1 ≤ m ≤ 20.

Example: text `"thecatsatonthemat"`, patterns `["cat", "mat", "dog"]` → `[3, 14]`.

<details>
<summary>Hint</summary>

Store the patterns' hashes (and the patterns themselves, to verify). Roll one window hash across the text and look it up in the set — one pass instead of k searches.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class MultiPatternSearch {

    static List<Integer> search(String t, String[] patterns) {
        final long B = 256, M = 1_000_000_007L;
        int m = patterns[0].length(), n = t.length();
        Set<Long> hashes = new HashSet<>();
        Set<String> words = new HashSet<>(Arrays.asList(patterns));
        for (String p : patterns) {
            long h = 0;
            for (char c : p.toCharArray()) h = (h * B + c) % M;
            hashes.add(h);
        }
        List<Integer> result = new ArrayList<>();
        if (m > n) return result;
        long high = 1, h = 0;
        for (int k = 0; k < m - 1; k++) high = high * B % M;
        for (int k = 0; k < m; k++) h = (h * B + t.charAt(k)) % M;
        for (int i = 0; i + m <= n; i++) {
            if (hashes.contains(h) && words.contains(t.substring(i, i + m))) result.add(i);   // verify
            if (i + m < n) h = ((h - t.charAt(i) * high % M + M) % M * B + t.charAt(i + m)) % M;
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(search("thecatsatonthemat", new String[] {"cat", "mat", "dog"}));
    }
}
```

**Output:**

```text
[3, 14]
```

**Complexity:** O(k × m + n) expected time (the substring check runs only on hash hits), O(k × m) space.

</details>

### P2. Repeated DNA sequences

**Difficulty:** Medium · **Pattern:** Rolling hash over fixed-length windows

Return all 10-letter substrings that occur more than once in a DNA string (letters A, C, G, T), each listed once, in order of first repetition.

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `"AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"` → `["AAAAACCCCC", "CCCCCAAAAA"]`.

<details>
<summary>Hint</summary>

With 4 letters, 2 bits per letter encode a 10-letter window exactly in 20 bits — a perfect rolling hash with no collisions. Slide: shift left by 2, add the new letter, mask to 20 bits.

</details>

<details>
<summary>Answer</summary>

**Approach:** Because the encoding is exact (base 4, no modulus needed), equal codes mean equal strings — no verification step. Storing every substring in a set would also work but costs O(n × 10) in string building.

```java
import java.util.*;

public class RepeatedDna {

    static List<String> findRepeated(String s) {
        int[] code = new int[128];
        code['C'] = 1; code['G'] = 2; code['T'] = 3;
        Set<Integer> seen = new HashSet<>(), added = new HashSet<>();
        List<String> result = new ArrayList<>();
        int window = 0, mask = (1 << 20) - 1;
        for (int i = 0; i < s.length(); i++) {
            window = ((window << 2) | code[s.charAt(i)]) & mask;     // roll: drop the oldest letter
            if (i >= 9 && !seen.add(window) && added.add(window)) {
                result.add(s.substring(i - 9, i + 1));
            }
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(findRepeated("AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT") + " " + findRepeated("AAAAAAAAAAAAA"));
    }
}
```

**Output:**

```text
[AAAAACCCCC, CCCCCAAAAA] [AAAAAAAAAA]
```

**Complexity:** O(n) time, O(n) space.

</details>

### P3. Longest duplicate substring

**Difficulty:** Hard · **Pattern:** Binary search on length + rolling hash

Return any longest substring that occurs at least twice (occurrences may overlap), or `""` if none.

**Constraints:** 2 ≤ n ≤ 3 × 10⁴; lowercase letters.

Example: `"banana"` → `"ana"`; `"abcd"` → `""`.

<details>
<summary>Hint</summary>

If a duplicate of length L exists, one of length L − 1 exists too (drop a character from both copies) — the property is monotone, so binary search on L. For a fixed L, roll a hash over all windows and look for a repeated hash (verify to rule out collisions).

</details>

<details>
<summary>Answer</summary>

**Approach:** `check(L)` returns the start of a duplicated window of length L or −1, using a map from hash to the starts seen with that hash. Binary search the largest L with `check(L) ≠ −1`. See [Binary Search on Answer](../../patterns/binary-search-on-answer/content.md).

```java
import java.util.*;

public class LongestDuplicateSubstring {

    static final long B = 131, M = 1_000_000_007L;

    static int check(String s, int len) {
        long high = 1, h = 0;
        for (int k = 0; k < len - 1; k++) high = high * B % M;
        Map<Long, List<Integer>> starts = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            if (i >= len) h = (h - s.charAt(i - len) * high % M + M) % M;   // drop the leaving char
            h = (h * B + s.charAt(i)) % M;
            if (i >= len - 1) {
                int start = i - len + 1;
                List<Integer> list = starts.computeIfAbsent(h, k -> new ArrayList<>());
                for (int other : list) {
                    if (s.regionMatches(other, s, start, len)) return start;   // verified duplicate
                }
                list.add(start);
            }
        }
        return -1;
    }

    static String longestDupSubstring(String s) {
        int lo = 1, hi = s.length() - 1, bestStart = -1, bestLen = 0;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            int start = check(s, mid);
            if (start != -1) {
                bestStart = start;
                bestLen = mid;
                lo = mid + 1;                       // try longer
            } else {
                hi = mid - 1;
            }
        }
        return bestStart == -1 ? "" : s.substring(bestStart, bestStart + bestLen);
    }

    public static void main(String[] args) {
        System.out.println("[" + longestDupSubstring("banana") + "] [" + longestDupSubstring("abcd") + "] ["
                + longestDupSubstring("aaaaa") + "]");
    }
}
```

**Output:**

```text
[ana] [] [aaaa]
```

**Complexity:** O(n log n) expected time (log n binary-search steps, O(n) expected per check), O(n) space. A suffix array solves it in O(n log n) worst case but is far longer to write.

</details>
