# Radix Sort — Practice

### P1. How many counting-sort passes does base-10 LSD radix sort make for values up to 99,999, and how many in base 256 for 32-bit non-negative integers?

**Difficulty:** Easy · **Pattern:** Number of digits

- A) 5 and 4
- B) 6 and 32
- C) 5 and 32
- D) 99,999 and 256

<details>
<summary>Hint</summary>

One pass per digit: count the digits of the maximum in that base.

</details>

<details>
<summary>Answer</summary>

**Answer:** A) 5 and 4

**Explanation:** 99,999 has 5 decimal digits. A 32-bit integer has 4 bytes, and base 256 handles one byte per pass.

</details>

### P2. Sort fixed-length strings with LSD radix sort

**Difficulty:** Medium · **Pattern:** Radix over character positions

Sort an array of lowercase strings that all have the same length L, using LSD radix sort (one stable counting sort per character position, from the last to the first).

**Constraints:** 1 ≤ n ≤ 10⁵; 1 ≤ L ≤ 20.

Example: `["dab", "cab", "fad", "bad", "dad", "ebb", "ace", "add"]` → `[ace, add, bad, cab, dab, dad, ebb, fad]`.

<details>
<summary>Hint</summary>

Key for position p is `s.charAt(p) − 'a'` (26 buckets). Iterate p from L − 1 down to 0.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class LsdStrings {

    static void sort(String[] words, int length) {
        String[] buffer = new String[words.length];
        for (int p = length - 1; p >= 0; p--) {
            int[] start = new int[27];
            for (String w : words) start[w.charAt(p) - 'a' + 1]++;
            for (int c = 1; c < 27; c++) start[c] += start[c - 1];   // start[c] = words with smaller char
            for (String w : words) buffer[start[w.charAt(p) - 'a']++] = w;   // stable: left to right
            System.arraycopy(buffer, 0, words, 0, words.length);
        }
    }

    public static void main(String[] args) {
        String[] words = {"dab", "cab", "fad", "bad", "dad", "ebb", "ace", "add"};
        sort(words, 3);
        System.out.println(Arrays.toString(words));
    }
}
```

**Output:**

```text
[ace, add, bad, cab, dab, dad, ebb, fad]
```

**Complexity:** O(L × (n + 26)) time, O(n) space — linear in the total number of characters.

</details>

### P3. Radix sort with negative numbers

**Difficulty:** Medium · **Pattern:** Offset to non-negative

Sort an `int[]` that may contain negative values with radix sort.

**Constraints:** 1 ≤ n ≤ 10⁵; −10⁹ ≤ value ≤ 10⁹.

Example: `[-5, 3, -1, 0, 12, -100]` → `[-100, -5, -1, 0, 3, 12]`.

<details>
<summary>Hint</summary>

Subtract the minimum so every value is ≥ 0 (use `long`: the difference can reach 2 × 10⁹), sort, then add it back.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class RadixWithNegatives {

    static void sort(int[] arr) {
        long min = Arrays.stream(arr).min().getAsInt();
        long[] shifted = new long[arr.length];
        long max = 0;
        for (int i = 0; i < arr.length; i++) {
            shifted[i] = arr[i] - min;                       // now in [0, 2·10^9]
            max = Math.max(max, shifted[i]);
        }
        long[] out = new long[arr.length];
        for (long exp = 1; max / exp > 0; exp *= 10) {
            int[] count = new int[10];
            for (long x : shifted) count[(int) ((x / exp) % 10)]++;
            for (int d = 1; d < 10; d++) count[d] += count[d - 1];
            for (int i = shifted.length - 1; i >= 0; i--) {
                out[--count[(int) ((shifted[i] / exp) % 10)]] = shifted[i];
            }
            System.arraycopy(out, 0, shifted, 0, shifted.length);
        }
        for (int i = 0; i < arr.length; i++) arr[i] = (int) (shifted[i] + min);
    }

    public static void main(String[] args) {
        int[] a = {-5, 3, -1, 0, 12, -100};
        sort(a);
        System.out.println(Arrays.toString(a));
    }
}
```

**Output:**

```text
[-100, -5, -1, 0, 3, 12]
```

**Complexity:** O(d × (n + 10)) with d ≤ 10 digits for values up to 2 × 10⁹; O(n) space.

</details>
