# Fast Exponentiation — Practice

### P1. Implement pow(x, n)

**Difficulty:** Medium · **Pattern:** Binary exponentiation with a negative exponent

Compute xⁿ for a double x and an int n (possibly negative) in O(log |n|).

**Constraints:** −100 < x < 100; −2³¹ ≤ n ≤ 2³¹ − 1; x ≠ 0 or n > 0.

Example: (2.0, 10) → `1024.0`; (2.0, −2) → `0.25`.

<details>
<summary>Hint</summary>

xⁿ = (1/x)^(−n) for negative n. Store n in a `long` first: `−Integer.MIN_VALUE` does not fit in an `int`.

</details>

<details>
<summary>Answer</summary>

```java
public class PowXN {

    static double myPow(double x, int n) {
        long e = n;                                // widen before negating
        if (e < 0) {
            x = 1 / x;
            e = -e;
        }
        double result = 1;
        while (e > 0) {
            if ((e & 1) == 1) result *= x;
            x *= x;
            e >>= 1;
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(myPow(2.0, 10) + " " + myPow(2.0, -2) + " " + myPow(1.0, Integer.MIN_VALUE) + " " + myPow(-2.0, 3));
    }
}
```

**Output:**

```text
1024.0 0.25 1.0 -8.0
```

**Complexity:** O(log |n|) time, O(1) space.

</details>

### P2. Power with a huge exponent given as digits

**Difficulty:** Medium · **Pattern:** Exponent digit by digit: a^(10q + d) = (a^q)^10 × a^d

Compute aᵇ mod 1337, where b is a huge positive integer given as an array of decimal digits.

**Constraints:** 1 ≤ a ≤ 2³¹ − 1; 1 ≤ digits ≤ 2000.

Example: a = 2, b = [1, 0] → `1024`; a = 2147483647, b = [2, 0, 0] → `1198`.

<details>
<summary>Hint</summary>

Process the digits left to right. If the exponent read so far is q and the next digit is d, the new exponent is 10q + d, so the new value is (current)¹⁰ × a^d — two small modular powers per digit.

</details>

<details>
<summary>Answer</summary>

```java
public class SuperPow {

    static final int MOD = 1337;

    static int modPow(int a, int e) {
        int result = 1;
        a %= MOD;
        while (e > 0) {
            if ((e & 1) == 1) result = result * a % MOD;   // values < 1337, products fit in int
            a = a * a % MOD;
            e >>= 1;
        }
        return result;
    }

    static int superPow(int a, int[] b) {
        int result = 1;
        for (int d : b) result = modPow(result, 10) * modPow(a, d) % MOD;
        return result;
    }

    public static void main(String[] args) {
        System.out.println(superPow(2, new int[] {1, 0}) + " " + superPow(2147483647, new int[] {2, 0, 0}) + " " + superPow(1, new int[] {4, 3, 3, 8, 5, 2}));
    }
}
```

**Output:**

```text
1024 1198 1
```

**Complexity:** O(digits) time (each step is two O(log 10) powers), O(1) space.

</details>

### P3. Count walks of exactly k steps

**Difficulty:** Hard · **Pattern:** Matrix exponentiation of the adjacency matrix

In a directed graph with n nodes, count the walks from node u to node v that use exactly k edges (nodes and edges may repeat), mod 10⁹ + 7.

**Constraints:** 1 ≤ n ≤ 50; 1 ≤ k ≤ 10¹⁸.

Example: edges 0→1, 0→2, 1→2, 2→0; u = v = 0: k = 3 → `1` (0→1→2→0); k = 4 → `1` (0→2→0→2→0).

<details>
<summary>Hint</summary>

If A is the adjacency matrix, entry (u, v) of Aᵏ counts walks of length k from u to v (matrix multiplication sums over the middle node). A DP over k steps is O(k × n²) — too slow for k = 10¹⁸.

</details>

<details>
<summary>Answer</summary>

**Approach:** Raise A to the k-th power by squaring: O(n³ log k).

```java
public class CountWalks {

    static final long MOD = 1_000_000_007L;

    static long[][] multiply(long[][] x, long[][] y) {
        int n = x.length;
        long[][] z = new long[n][n];
        for (int i = 0; i < n; i++)
            for (int t = 0; t < n; t++) {
                if (x[i][t] == 0) continue;
                for (int j = 0; j < n; j++) z[i][j] = (z[i][j] + x[i][t] * y[t][j]) % MOD;
            }
        return z;
    }

    static long countWalks(int n, int[][] edges, int u, int v, long k) {
        long[][] base = new long[n][n], result = new long[n][n];
        for (int[] e : edges) base[e[0]][e[1]]++;
        for (int i = 0; i < n; i++) result[i][i] = 1;          // identity = A⁰
        while (k > 0) {
            if ((k & 1) == 1) result = multiply(result, base);
            base = multiply(base, base);
            k >>= 1;
        }
        return result[u][v];
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1}, {0, 2}, {1, 2}, {2, 0}};
        System.out.println(countWalks(3, edges, 0, 0, 3) + " " + countWalks(3, edges, 0, 0, 4) + " " + countWalks(3, edges, 0, 0, 30));
    }
}
```

**Output:**

```text
1 1 1897
```

**Complexity:** O(n³ log k) time, O(n²) space.

</details>
