# Sieve of Eratosthenes — Practice

### P1. Count primes below n

**Difficulty:** Easy · **Pattern:** Sieve, then count

Return the number of primes strictly less than n.

**Constraints:** 0 ≤ n ≤ 5 × 10⁶.

Example: n = 10 → `4` (2, 3, 5, 7); n = 0 → `0`.

<details>
<summary>Hint</summary>

Trial division for every number is O(n √n) ≈ 10¹⁰ at the upper limit. Sieve once up to n − 1.

</details>

<details>
<summary>Answer</summary>

```java
public class CountPrimes {

    static int countPrimes(int n) {
        if (n < 3) return 0;
        boolean[] composite = new boolean[n];
        int count = 0;
        for (int i = 2; i < n; i++) {
            if (composite[i]) continue;
            count++;
            for (long m = (long) i * i; m < n; m += i) composite[(int) m] = true;
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(countPrimes(10) + " " + countPrimes(0) + " " + countPrimes(2) + " " + countPrimes(5_000_000));
    }
}
```

**Output:**

```text
4 0 0 348513
```

**Complexity:** O(n log log n) time, O(n) space. Counting during the sieve loop avoids a second pass.

</details>

### P2. Closest prime pair in a range

**Difficulty:** Medium · **Pattern:** Sieve + scan consecutive primes

Return the two primes p < q in [left, right] with the smallest gap q − p (the smallest p on ties), or `[-1, -1]` if fewer than two primes exist.

**Constraints:** 1 ≤ left ≤ right ≤ 10⁶.

Example: [10, 19] → `[11, 13]`; [4, 6] → `[-1, -1]`.

<details>
<summary>Hint</summary>

Sieve up to `right`, then walk the primes in [left, right] in order; the closest pair is always two **consecutive** primes. A gap of 2 cannot be beaten (except 2, 3), so you may stop early.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class ClosestPrimes {

    static int[] closestPrimes(int left, int right) {
        boolean[] composite = new boolean[right + 1];
        composite[0] = true;
        if (right >= 1) composite[1] = true;
        for (int p = 2; (long) p * p <= right; p++) {
            if (!composite[p]) for (int m = p * p; m <= right; m += p) composite[m] = true;
        }
        int prev = -1, bestGap = Integer.MAX_VALUE;
        int[] best = {-1, -1};
        for (int i = left; i <= right; i++) {
            if (composite[i]) continue;
            if (prev != -1 && i - prev < bestGap) {
                bestGap = i - prev;
                best = new int[] {prev, i};
                if (bestGap <= 2) break;                   // cannot do better
            }
            prev = i;
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(closestPrimes(10, 19)) + " " + Arrays.toString(closestPrimes(4, 6)) + " " + Arrays.toString(closestPrimes(1, 3)));
    }
}
```

**Output:**

```text
[11, 13] [-1, -1] [2, 3]
```

**Complexity:** O(right log log right) time, O(right) space.

</details>

### P3. Primes in a range with huge bounds

**Difficulty:** Hard · **Pattern:** Segmented sieve

Count the primes in [L, R].

**Constraints:** 1 ≤ L ≤ R ≤ 10¹²; R − L ≤ 10⁶.

Example: [1, 10] → `4`; [100, 200] → `21`.

<details>
<summary>Hint</summary>

A sieve up to 10¹² is impossible. But every composite in [L, R] has a prime factor ≤ √R ≤ 10⁶. Sieve the small primes up to √R, then use each to cross out its multiples inside a boolean array for [L, R] only (index x − L).

</details>

<details>
<summary>Answer</summary>

**Approach:** For each small prime p, the first multiple to cross in the segment is max(p², ⌈L / p⌉ × p). Starting at p² keeps p itself from being crossed when p lies inside [L, R].

```java
import java.util.*;

public class SegmentedSieve {

    static int countPrimes(long low, long high) {
        int limit = (int) Math.sqrt((double) high) + 1;
        boolean[] small = new boolean[limit + 1];           // true = composite
        List<Integer> primes = new ArrayList<>();
        for (int p = 2; p <= limit; p++) {
            if (small[p]) continue;
            primes.add(p);
            for (long m = (long) p * p; m <= limit; m += p) small[(int) m] = true;
        }
        boolean[] composite = new boolean[(int) (high - low + 1)];   // index x − low
        for (int p : primes) {
            long start = Math.max((long) p * p, (low + p - 1) / p * p);
            for (long m = start; m <= high; m += p) composite[(int) (m - low)] = true;
        }
        int count = 0;
        for (long x = low; x <= high; x++) {
            if (x >= 2 && !composite[(int) (x - low)]) count++;
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(countPrimes(1, 10) + " " + countPrimes(100, 200) + " " + countPrimes(1_000_000_000_000L, 1_000_000_001_000L));
    }
}
```

**Output:**

```text
4 21 37
```

**Complexity:** O(√R log log R + (R − L) log log R) time, O(√R + (R − L)) space.

</details>
