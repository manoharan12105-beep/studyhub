# Bucket Sort — Practice

### P1. Sort characters by frequency

**Difficulty:** Medium · **Pattern:** Buckets indexed by frequency

Rearrange a string so that characters appear in decreasing order of frequency (ties in any order).

**Constraints:** 1 ≤ n ≤ 5 × 10⁵; ASCII characters.

Example: `"tree"` → `"eert"` or `"eetr"`.

<details>
<summary>Hint</summary>

A frequency is between 1 and n. Use n + 1 buckets: bucket f holds the characters that occur f times.

</details>

<details>
<summary>Answer</summary>

**Approach:** Count frequencies (O(n)), drop each character into the bucket of its frequency, then read buckets from high to low. Sorting characters by count would be O(n + σ log σ) for σ distinct characters; buckets avoid the sort entirely.

```java
import java.util.*;

public class FrequencySort {

    static String frequencySort(String s) {
        int[] count = new int[128];
        for (char c : s.toCharArray()) count[c]++;
        List<List<Character>> buckets = new ArrayList<>();
        for (int i = 0; i <= s.length(); i++) buckets.add(new ArrayList<>());
        for (char c = 0; c < 128; c++) {
            if (count[c] > 0) buckets.get(count[c]).add(c);
        }
        StringBuilder sb = new StringBuilder();
        for (int f = s.length(); f >= 1; f--) {
            for (char c : buckets.get(f)) sb.append(String.valueOf(c).repeat(f));
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(frequencySort("tree") + " " + frequencySort("cccaaa") + " " + frequencySort("Aabb"));
    }
}
```

**Output:**

```text
eert aaaccc bbAa
```

**Complexity:** O(n) time (128 is a constant), O(n) space.

</details>

### P2. Sort scores spread uniformly over [0, 1000)

**Difficulty:** Medium · **Pattern:** Choosing bucket count and mapping

Ten million floating-point scores are uniformly distributed in [0, 1000). Write the bucket index formula for k = n buckets, state the expected running time, and say what happens if the scores are instead clustered in [990, 1000).

<details>
<summary>Hint</summary>

Map [0, 1000) linearly onto 0..k − 1.

</details>

<details>
<summary>Answer</summary>

**Answer:** `index = (int) (score / 1000.0 * k)`, which lies in 0..k − 1 because score < 1000.

- **Uniform data:** each bucket holds about one score on average; expected time O(n + k) = O(n).
- **Clustered in [990, 1000):** all scores fall into the last 1% of buckets — about 100 elements per non-empty bucket. Insertion sort on each costs about 100²/4 per bucket × n/100 buckets ≈ 25n, still linear but much slower; with heavier clustering (all in one bucket) it becomes O(n²). Fix: choose buckets from the observed min and max, or sort buckets with an O(m log m) algorithm.

</details>

### P3. Maximum gap

**Difficulty:** Hard · **Pattern:** Pigeonhole buckets

Return the maximum difference between successive elements in the **sorted** form of an unsorted array, in O(n) time. Return 0 if there are fewer than two elements.

**Constraints:** 1 ≤ n ≤ 10⁵; 0 ≤ values ≤ 10⁹.

Example: `[3, 6, 9, 1]` → sorted `[1, 3, 6, 9]` → `3`.

<details>
<summary>Hint</summary>

With n values in [min, max], the maximum gap is at least ⌈(max − min)/(n − 1)⌉. Use buckets of that width: no gap inside a bucket can be the answer, so you only need each bucket's min and max, and gaps between consecutive non-empty buckets.

</details>

<details>
<summary>Answer</summary>

**Approach:** Sorting gives O(n log n). The pigeonhole argument: n − 1 gaps sum to max − min, so the largest is at least the average. Buckets narrower than that average cannot contain the maximum gap internally — it must cross bucket boundaries. Keep only per-bucket min/max.

```java
import java.util.Arrays;

public class MaximumGap {

    static int maximumGap(int[] nums) {
        int n = nums.length;
        if (n < 2) return 0;
        int min = Arrays.stream(nums).min().getAsInt(), max = Arrays.stream(nums).max().getAsInt();
        if (min == max) return 0;
        int width = Math.max(1, (max - min) / (n - 1));          // bucket width ≤ average gap
        int count = (max - min) / width + 1;
        int[] bucketMin = new int[count], bucketMax = new int[count];
        Arrays.fill(bucketMin, Integer.MAX_VALUE);
        Arrays.fill(bucketMax, Integer.MIN_VALUE);
        for (int x : nums) {
            int b = (x - min) / width;
            bucketMin[b] = Math.min(bucketMin[b], x);
            bucketMax[b] = Math.max(bucketMax[b], x);
        }
        int best = 0, previousMax = min;
        for (int b = 0; b < count; b++) {
            if (bucketMin[b] == Integer.MAX_VALUE) continue;          // empty bucket
            best = Math.max(best, bucketMin[b] - previousMax);        // gap across buckets
            previousMax = bucketMax[b];
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(maximumGap(new int[] {3, 6, 9, 1}) + " " + maximumGap(new int[] {10}) + " " + maximumGap(new int[] {1, 1000000000}) + " " + maximumGap(new int[] {1, 3, 100}));
    }
}
```

**Output:**

```text
3 0 999999999 97
```

**Complexity:** O(n) time, O(n) space.

</details>
