# DSA Complexity Questions — Interview Questions

## Beginner

### Q1. Why is binary search O(log n)?

<details>
<summary>Answer</summary>

Each comparison discards half of the remaining range, and a range of n elements can only be halved about log₂ n times before one element is left.

After k steps at most n / 2ᵏ candidates remain; the search ends when n / 2ᵏ ≤ 1, i.e. k ≥ log₂ n. So a sorted array of 10⁹ elements needs at most about 30 comparisons. The iterative version uses O(1) extra space; the recursive one O(log n) stack. See [Binary Search](../../algorithms/binary-search/content.md).

</details>

### Q2. What is the time complexity of this loop, and why?

```java
for (int i = 0; i < n; i++)
    for (int j = 0; j < i; j++)
        count++;
```

<details>
<summary>Answer</summary>

O(n²). The inner loop runs i times for each i, so the total is 0 + 1 + … + (n − 1) = n(n − 1)/2.

Dropping the constant ½ and the lower-order term leaves Θ(n²). Halving the work does not change the growth rate.

</details>

### Q3. `ArrayList.add` sometimes copies the whole array. Why is it still called O(1)?

<details>
<summary>Answer</summary>

It is **amortized** O(1): when the array is full it grows by a constant factor (Java uses 1.5×), so expensive copies become geometrically rarer.

Over n appends with doubling, copies cost 1 + 2 + 4 + … + n < 2n element moves in total, plus n cheap writes — O(n) total, O(1) per append on average over the sequence. A single `add` can still take O(n) (worst case for one call). Growing by a fixed amount instead would make the total O(n²). See [Amortized Analysis](../../fundamentals/amortized-analysis/content.md).

</details>

### Q4. What is the space complexity of a recursive factorial?

```java
static long fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }
```

<details>
<summary>Answer</summary>

O(n). Although no arrays are allocated, there are n nested calls active at the deepest point, each with its own stack frame.

The iterative loop version uses O(1) space. Deep recursion (n ≈ 10⁵ or more) can also throw `StackOverflowError` in Java, a practical reason to prefer loops. See [Space Complexity](../../fundamentals/space-complexity/content.md).

</details>

### Q5. What is the difference between O, Ω and Θ?

<details>
<summary>Answer</summary>

O is an upper bound on growth, Ω a lower bound, Θ both at once (a tight bound).

`f(n) = O(g(n))` means f grows no faster than g up to a constant factor for large n; Ω means no slower; Θ means the same rate. These are about functions, not cases: "worst-case running time of insertion sort is Θ(n²)" and "best-case is Θ(n)" are both precise statements. Interview usage of "O" often means "tight bound", but be ready to distinguish. See [Asymptotic Notation](../../fundamentals/asymptotic-notation/content.md).

</details>

## Intermediate

### Q6. Why is merge sort O(n log n)?

<details>
<summary>Answer</summary>

The array is halved until pieces have size 1 — log₂ n levels — and merging all pieces on one level costs O(n) in total.

Recurrence: T(n) = 2T(n/2) + O(n). The recursion tree has log₂ n levels, each doing cn work, so T(n) = O(n log n) in the best, average and worst case alike. Space is O(n) for the merge buffer plus O(log n) stack. See [Merge Sort](../../algorithms/merge-sort/content.md).

</details>

### Q7. Why does building a heap from n elements take O(n), not O(n log n)?

<details>
<summary>Answer</summary>

Bottom-up heapify sifts down each internal node, and most nodes are near the bottom where sifting is cheap.

About n/2 nodes are leaves (0 work), n/4 can move down 1 level, n/8 two levels, and so on. Total work ≈ Σ (n / 2^(h+1)) × h = n × Σ h / 2^(h+1) ≤ n, i.e. O(n). Inserting elements one at a time with sift-up is O(n log n) in the worst case — the order of operations matters. See [Heap](../../data-structures/heap/content.md).

</details>

### Q8. Why is BFS O(V + E) and not O(V × E)?

<details>
<summary>Answer</summary>

Each vertex is enqueued and dequeued once (O(V)), and each vertex's adjacency list is scanned once when it is dequeued, so the edge scans add up to E (2E for undirected graphs).

The work is a **sum** over vertices of (1 + degree), not a product. With an adjacency matrix the scan of each vertex costs V, giving O(V²). See [BFS](../../algorithms/bfs/content.md).

</details>

### Q9. What is the complexity of naive recursive Fibonacci, and how does memoisation change it?

<details>
<summary>Answer</summary>

Naive: exponential, Θ(φⁿ) ≈ O(1.618ⁿ) calls, often quoted as O(2ⁿ) as an upper bound. With memoisation: O(n) time and O(n) space.

Naive `fib(n)` calls `fib(n − 1)` and `fib(n − 2)`, so the call count satisfies the Fibonacci recurrence itself and grows like φⁿ; the same values are recomputed many times. Memoisation computes each of the n values once. Keeping only the last two values gives O(n) time, O(1) space. See [Dynamic Programming](../../algorithms/dynamic-programming/content.md).

</details>

### Q10. What is the complexity of building a string with `s += piece` in a loop of n iterations?

<details>
<summary>Answer</summary>

O(n²) characters copied (for pieces of constant length), because `String` is immutable: each `+=` creates a new string and copies everything so far.

Copies cost 1 + 2 + … + n = O(n²). `StringBuilder.append` is amortized O(1) per character (its buffer grows geometrically like `ArrayList`), so the loop becomes O(n). See [Strings](../../data-structures/strings/content.md).

</details>

### Q11. What does it cost to sort n strings of length up to L?

<details>
<summary>Answer</summary>

O(n log n × L) in the worst case: a comparison sort makes O(n log n) comparisons, and comparing two strings can take O(L).

The "O(n log n)" rule assumes O(1) comparisons. For strings sharing long prefixes, L matters. Radix sort (LSD) on fixed-length strings costs O(n × L) with a small alphabet. See [Radix Sort](../../algorithms/radix-sort/content.md).

</details>

## Advanced

### Q12. This sliding-window code has a `while` inside a `for`. Why is it O(n)?

```java
static int longestWithin(int[] a, long limit) {      // longest subarray with sum ≤ limit (values ≥ 0)
    int left = 0, best = 0;
    long sum = 0;
    for (int right = 0; right < a.length; right++) {
        sum += a[right];
        while (sum > limit) sum -= a[left++];
        best = Math.max(best, right - left + 1);
    }
    return best;
}
```

<details>
<summary>Answer</summary>

Because `left` only moves forward and never exceeds n = `a.length`, the `while` body runs at most n times **in total** across all iterations of the `for` loop.

Total work = n iterations of the outer loop + at most n increments of `left` = O(n). This is an amortized argument: one iteration may shrink many times, but the shrinks are "paid for" by earlier expansions. The same reasoning bounds monotonic stacks and two-pointer scans. See [Sliding Window](../../patterns/sliding-window/content.md).

</details>

### Q13. Why is Dijkstra with a binary heap O((V + E) log V)?

<details>
<summary>Answer</summary>

Every successful relaxation pushes an entry into the heap (at most E pushes), and every vertex is popped and processed once with its edges scanned once; each heap operation costs O(log of heap size).

With lazy deletion the heap can hold up to E entries, so operations cost O(log E). Since E ≤ V², log E ≤ 2 log V, which is O(log V). Total: O((V + E) log V). A Fibonacci heap improves decrease-key to O(1) amortized, giving O(E + V log V), mostly of theoretical interest. See [Dijkstra](../../algorithms/dijkstra/content.md).

</details>

### Q14. Why is quick sort O(n log n) on average when its worst case is O(n²)?

<details>
<summary>Answer</summary>

With random pivots, a pivot is "good" (in the middle half of the values) half the time, and a good pivot shrinks the larger side to at most 3/4 of the elements; so each element passes through only O(log n) partitions on average.

Each partitioning level costs O(n) overall, and the expected recursion depth is O(log n), giving O(n log n) expected time. A cleaner proof: two elements are compared only if one of them is the first pivot chosen from the range between them; summing these probabilities gives about 2n ln n ≈ 1.39 n log₂ n expected comparisons. The O(n²) case needs consistently bad pivots, which random selection makes vanishingly unlikely.

</details>

### Q15. 0/1 knapsack DP runs in O(n × W). Why is it called pseudo-polynomial?

<details>
<summary>Answer</summary>

Because W is a numeric **value**, not an input size: writing W takes only about log₂ W bits, so O(n × W) is exponential in the number of input bits.

Doubling the number of digits of W squares its value and the running time with it. With W = 10⁹ the table is infeasible even for small n, while the input itself is tiny. Knapsack is NP-hard; the DP is efficient only when W is small. See [Knapsack DP](../../algorithms/knapsack-dp/content.md).

</details>
