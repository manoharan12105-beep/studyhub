# Bellman–Ford Algorithm — Practice

### P1. After how many passes is Bellman–Ford guaranteed to have correct distances in a graph with 6 vertices and no negative cycles?

**Difficulty:** Easy · **Pattern:** Pass count

- A) 1
- B) 5
- C) 6
- D) 36

<details>
<summary>Hint</summary>

How many edges can a simple path in a 6-vertex graph have?

</details>

<details>
<summary>Answer</summary>

**Answer:** B) 5

**Explanation:** A shortest path without cycles has at most V − 1 = 5 edges, and pass i fixes every vertex whose shortest path has ≤ i edges. A 6th pass is used only to detect negative cycles.

</details>

### P2. Detect currency arbitrage

**Difficulty:** Hard · **Pattern:** Products → sums with logarithms, then negative-cycle detection

`rate[i][j]` units of currency j are obtained for one unit of currency i. An arbitrage exists if some cycle of exchanges multiplies your money by more than 1. Return `true` if an arbitrage exists.

**Constraints:** 2 ≤ n ≤ 50 currencies; all rates positive.

Example: rates USD→EUR 0.9, EUR→GBP 0.8, GBP→USD 1.5 → 0.9 × 0.8 × 1.5 = 1.08 > 1 → `true`.

<details>
<summary>Hint</summary>

A product of rates > 1 means the sum of their logarithms > 0, i.e. the sum of **−log(rate)** < 0: a negative cycle. Run Bellman–Ford from a virtual source connected to every currency (or start with all distances 0).

</details>

<details>
<summary>Answer</summary>

**Approach:** Edge weights w(i, j) = −ln(rate[i][j]). Initialising every distance to 0 is equivalent to adding a virtual source with 0-weight edges to all vertices, so any negative cycle is "reachable". A small epsilon guards against floating-point noise.

```java
public class Arbitrage {

    static boolean hasArbitrage(double[][] rate) {
        int n = rate.length;
        double[] dist = new double[n];                    // all 0: virtual source to every currency
        for (int pass = 0; pass < n; pass++) {            // n passes; an improvement on the last one means a cycle
            boolean changed = false;
            for (int i = 0; i < n; i++) {
                for (int j = 0; j < n; j++) {
                    if (i == j || rate[i][j] <= 0) continue;
                    double w = -Math.log(rate[i][j]);
                    if (dist[i] + w < dist[j] - 1e-12) {
                        dist[j] = dist[i] + w;
                        changed = true;
                    }
                }
            }
            if (!changed) return false;
            if (pass == n - 1) return true;               // still relaxing after n - 1 rounds
        }
        return false;
    }

    public static void main(String[] args) {
        double[][] profitable = {
            {1.0, 0.9, 0.0},     // USD -> EUR
            {0.0, 1.0, 0.8},     // EUR -> GBP
            {1.5, 0.0, 1.0}};    // GBP -> USD
        double[][] fair = {
            {1.0, 0.9, 0.0},
            {0.0, 1.0, 0.8},
            {1.25, 0.0, 1.0}};   // 0.9 × 0.8 × 1.25 = 0.9 < 1
        System.out.println(hasArbitrage(profitable) + " " + hasArbitrage(fair));
    }
}
```

**Output:**

```text
true false
```

**Complexity:** O(n³) time (n passes over n² possible edges), O(n) space.

</details>
