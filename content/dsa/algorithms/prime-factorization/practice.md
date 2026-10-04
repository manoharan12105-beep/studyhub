# Prime Factorization — Practice

### P1. Ugly number

**Difficulty:** Easy · **Pattern:** Divide out allowed primes

An ugly number is a positive integer whose prime factors are only 2, 3 and 5. Return whether n is ugly.

**Constraints:** −2³¹ ≤ n ≤ 2³¹ − 1.

Example: 6 → `true`; 14 → `false` (factor 7); 1 → `true` (no prime factors).

<details>
<summary>Hint</summary>

Divide out every 2, 3 and 5. The number is ugly exactly when 1 remains.

</details>

<details>
<summary>Answer</summary>

```java
public class UglyNumber {

    static boolean isUgly(int n) {
        if (n <= 0) return false;
        for (int p : new int[] {2, 3, 5}) {
            while (n % p == 0) n /= p;
        }
        return n == 1;
    }

    public static void main(String[] args) {
        System.out.println(isUgly(6) + " " + isUgly(14) + " " + isUgly(1) + " " + isUgly(0));
    }
}
```

**Output:**

```text
true false true false
```

**Complexity:** O(log n) time, O(1) space.

</details>

### P2. Trailing zeros of n!

**Difficulty:** Easy · **Pattern:** Legendre's formula

Return the number of trailing zeros in n!.

**Constraints:** 0 ≤ n ≤ 10⁹.

Example: 5 → `1` (120); 25 → `6`.

<details>
<summary>Hint</summary>

Each trailing zero is a factor 10 = 2 × 5. Factors of 2 are more plentiful, so count the exponent of 5 in n!: ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + ….

</details>

<details>
<summary>Answer</summary>

**Approach:** Computing n! is impossible for large n. Multiples of 5 contribute one 5, multiples of 25 one more, and so on.

```java
public class FactorialZeros {

    static int trailingZeroes(int n) {
        int count = 0;
        while (n > 0) {
            n /= 5;                 // adds ⌊n/5⌋, then ⌊n/25⌋, ...
            count += n;
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(trailingZeroes(5) + " " + trailingZeroes(25) + " " + trailingZeroes(0) + " " + trailingZeroes(1_000_000_000));
    }
}
```

**Output:**

```text
1 6 0 249999998
```

**Complexity:** O(log₅ n) time, O(1) space.

</details>

### P3. Largest component connected by common factors

**Difficulty:** Hard · **Pattern:** Factorisation + union-find

There is an edge between two numbers if they share a factor greater than 1. Return the size of the largest connected component.

**Constraints:** 1 ≤ n ≤ 2 × 10⁴; 1 ≤ values ≤ 10⁵; values distinct.

Example: `[4, 6, 15, 35]` → `4`; `[20, 50, 9, 63]` → `2`.

<details>
<summary>Hint</summary>

Comparing all pairs is O(n²) gcd calls. Instead, union each number with its **prime factors** (as nodes); two numbers sharing a prime end up in the same set. Factorise with an SPF table.

</details>

<details>
<summary>Answer</summary>

**Approach:** Build an SPF table up to max value. For each number, union it with each of its distinct prime factors (use the value itself as the node id; DSU over 0 … max). Finally count, per root, how many input numbers it contains. Uses [Disjoint Set Union](../../data-structures/disjoint-set-union/content.md).

```java
import java.util.*;

public class LargestComponentByFactor {

    static int[] parent;

    static int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];              // path halving
            x = parent[x];
        }
        return x;
    }

    static int largestComponentSize(int[] nums) {
        int max = Arrays.stream(nums).max().getAsInt();
        int[] spf = new int[max + 1];
        for (int i = 2; i <= max; i++) {
            if (spf[i] == 0) for (int m = i; m <= max; m += i) if (spf[m] == 0) spf[m] = i;
        }
        parent = new int[max + 1];
        for (int i = 0; i <= max; i++) parent[i] = i;
        for (int v : nums) {
            for (int x = v; x > 1; ) {
                int p = spf[x];
                parent[find(v)] = find(p);              // union v with its prime p
                while (x % p == 0) x /= p;
            }
        }
        Map<Integer, Integer> size = new HashMap<>();
        int best = 0;
        for (int v : nums) best = Math.max(best, size.merge(find(v), 1, Integer::sum));
        return best;
    }

    public static void main(String[] args) {
        System.out.println(largestComponentSize(new int[] {4, 6, 15, 35}) + " " + largestComponentSize(new int[] {20, 50, 9, 63}) + " "
                + largestComponentSize(new int[] {2, 3, 6, 7, 4, 12, 21, 39}));
    }
}
```

**Output:**

```text
4 2 8
```

**Complexity:** O(M log log M) for the SPF table plus O(n log M) unions (each number has O(log M) prime factors); with path halving alone each DSU operation is O(log M) amortized, and near O(1) if union by rank is added. O(M) space.

</details>
