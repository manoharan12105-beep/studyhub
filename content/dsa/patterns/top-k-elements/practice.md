# Top K Elements — Practice

### P1. The k weakest rows

**Difficulty:** Easy · **Pattern:** Size-k max-heap by (strength, index)

Each row of a binary matrix has all its 1s (soldiers) before its 0s. Row i is weaker than row j if it has fewer soldiers, or the same number and i < j. Return the indices of the k weakest rows, weakest first.

**Constraints:** 2 ≤ rows, cols ≤ 100; 1 ≤ k ≤ rows.

Example: `[[1,1,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,1,0,0,0],[1,1,1,1,1]]`, k = 3 → `[2, 0, 3]`.

<details>
<summary>Hint</summary>

Strength = number of 1s (binary search for the first 0, since 1s come first). Keep the k weakest in a max-heap ordered by (strength, index) so the strongest of them can be evicted.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class KWeakestRows {

    static int[] kWeakestRows(int[][] mat, int k) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((x, y) -> x[0] != y[0] ? Integer.compare(y[0], x[0]) : Integer.compare(y[1], x[1]));
        for (int i = 0; i < mat.length; i++) {
            int lo = 0, hi = mat[i].length;
            while (lo < hi) {                              // first 0 = number of soldiers
                int mid = (lo + hi) >>> 1;
                if (mat[i][mid] == 0) hi = mid;
                else lo = mid + 1;
            }
            heap.offer(new int[] {lo, i});
            if (heap.size() > k) heap.poll();              // evict the strongest of the candidates
        }
        int[] result = new int[k];
        for (int j = k - 1; j >= 0; j--) result[j] = heap.poll()[1];   // heap pops strongest first
        return result;
    }

    public static void main(String[] args) {
        int[][] mat = {{1, 1, 0, 0, 0}, {1, 1, 1, 1, 0}, {1, 0, 0, 0, 0}, {1, 1, 0, 0, 0}, {1, 1, 1, 1, 1}};
        System.out.println(Arrays.toString(kWeakestRows(mat, 3)));
    }
}
```

**Output:**

```text
[2, 0, 3]
```

**Complexity:** O(R log C + R log k) time, O(k) space.

</details>

### P2. Rearrange a string so no two neighbours are equal

**Difficulty:** Medium · **Pattern:** Max-heap by remaining count + greedy

Rearrange the letters of `s` so that no two adjacent characters are the same; return any valid result or `""` if impossible.

**Constraints:** 1 ≤ |s| ≤ 500; lowercase letters.

Example: `"aab"` → `"aba"`; `"aaab"` → `""`.

<details>
<summary>Hint</summary>

Impossible exactly when some letter occurs more than ⌈n/2⌉ times. Otherwise repeatedly place the most frequent remaining letter that differs from the last one placed: pop the top two from a max-heap, place both, push them back with decreased counts.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class ReorganizeString {

    static String reorganizeString(String s) {
        int[] count = new int[26];
        for (char c : s.toCharArray()) count[c - 'a']++;
        PriorityQueue<int[]> heap = new PriorityQueue<>((x, y) -> x[1] != y[1] ? y[1] - x[1] : x[0] - y[0]);
        for (int c = 0; c < 26; c++) {
            if (count[c] > (s.length() + 1) / 2) return "";
            if (count[c] > 0) heap.offer(new int[] {c, count[c]});
        }
        StringBuilder sb = new StringBuilder();
        while (heap.size() >= 2) {                         // place the two most frequent, different letters
            int[] first = heap.poll(), second = heap.poll();
            sb.append((char) ('a' + first[0])).append((char) ('a' + second[0]));
            if (--first[1] > 0) heap.offer(first);
            if (--second[1] > 0) heap.offer(second);
        }
        if (!heap.isEmpty()) sb.append((char) ('a' + heap.poll()[0]));   // at most one copy remains
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(reorganizeString("aab") + " [" + reorganizeString("aaab") + "] " + reorganizeString("aaabbc"));
    }
}
```

**Output:**

```text
aba [] ababac
```

**Complexity:** O(n log 26) = O(n) time, O(26) space. The feasibility check guarantees the last remaining letter has a count of exactly 1 and differs from the previous character.

</details>

### P3. Minimum cost to hire k workers

**Difficulty:** Hard · **Pattern:** Sort by ratio + max-heap of the k smallest qualities

Worker i has `quality[i]` and minimum wage `wage[i]`. A group of exactly k workers must be paid in proportion to quality, and each must get at least their minimum wage. Return the least total cost.

**Constraints:** 1 ≤ k ≤ n ≤ 10⁴.

Example: quality `[10, 20, 5]`, wage `[70, 50, 30]`, k = 2 → `105.00000`.

<details>
<summary>Hint</summary>

In any group, the pay per unit of quality is set by the worker with the highest wage/quality ratio r; total = r × (sum of qualities). Sort workers by r. When worker i is the "captain" (highest ratio so far), pick the k − 1 smallest qualities among earlier workers plus i's — a max-heap of size k on quality keeps the smallest sum.

</details>

<details>
<summary>Answer</summary>

**Approach:** Scan workers in increasing ratio; keep a max-heap of qualities and their running sum; once the heap holds k workers, cost = ratio × sum. Evicting the largest quality keeps the sum minimal for future captains.

```java
import java.util.*;

public class HireKWorkers {

    static double mincostToHireWorkers(int[] quality, int[] wage, int k) {
        int n = quality.length;
        Integer[] order = new Integer[n];
        for (int i = 0; i < n; i++) order[i] = i;
        Arrays.sort(order, Comparator.comparingDouble(i -> (double) wage[i] / quality[i]));
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());   // largest quality on top
        long sum = 0;
        double best = Double.MAX_VALUE;
        for (int i : order) {
            heap.offer(quality[i]);
            sum += quality[i];
            if (heap.size() > k) sum -= heap.poll();
            if (heap.size() == k) best = Math.min(best, sum * ((double) wage[i] / quality[i]));
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(String.format(Locale.ROOT, "%.5f %.5f", mincostToHireWorkers(new int[] {10, 20, 5}, new int[] {70, 50, 30}, 2),
                mincostToHireWorkers(new int[] {3, 1, 10, 10, 1}, new int[] {4, 8, 2, 2, 7}, 3)));
    }
}
```

**Output:**

```text
105.00000 30.66667
```

**Complexity:** O(n log n) time, O(n) space.

</details>
