# Space Complexity — Practice

### P1. What is the auxiliary space of this method?

**Difficulty:** Easy · **Pattern:** Count allocations

```java
static int max(int[] arr) {
    int best = arr[0];
    for (int value : arr) {
        best = Math.max(best, value);
    }
    return best;
}
```

- A) O(1)
- B) O(log n)
- C) O(n)
- D) O(n²)

<details>
<summary>Hint</summary>

The input array does not count. What else is allocated?

</details>

<details>
<summary>Answer</summary>

**Answer:** A) O(1)

**Explanation:** Only `best` and the loop variable exist, regardless of n.

</details>

### P2. What is the auxiliary space of recursive binary search on n elements?

**Difficulty:** Easy · **Pattern:** Recursion depth

- A) O(1)
- B) O(log n)
- C) O(n)
- D) O(n log n)

<details>
<summary>Hint</summary>

How deep does the recursion go?

</details>

<details>
<summary>Answer</summary>

**Answer:** B) O(log n)

**Explanation:** Each call halves the range, so at most about log₂ n calls are active at once. The iterative version uses O(1).

</details>

### P3. What is the auxiliary space?

**Difficulty:** Medium · **Pattern:** Hidden copies

```java
static boolean isPalindrome(String s) {
    if (s.length() <= 1) {
        return true;
    }
    if (s.charAt(0) != s.charAt(s.length() - 1)) {
        return false;
    }
    return isPalindrome(s.substring(1, s.length() - 1));
}
```

- A) O(1)
- B) O(n)
- C) O(n log n)
- D) O(n²)

<details>
<summary>Hint</summary>

Count the recursion depth and what each level allocates and keeps alive.

</details>

<details>
<summary>Answer</summary>

**Answer:** D) O(n²)

**Explanation:** Depth is about n/2, and each level holds its own substring copy of length n, n − 2, n − 4, … while deeper calls run. Their sum is about n²/4 → O(n²). Passing indices (`left`, `right`) instead of substrings brings it down to O(n) stack, and an iterative two-pointer loop to O(1).

</details>

### P4. A solution sorts the input with `Arrays.sort(int[])` and then scans once. What is its auxiliary space?

**Difficulty:** Medium · **Pattern:** Library internals

- A) O(1) — sorting is always in place
- B) O(log n) for the sort's recursion, plus O(1) for the scan
- C) O(n) because sorting copies the array
- D) O(n log n)

<details>
<summary>Hint</summary>

`Arrays.sort` on a primitive array uses dual-pivot quick sort.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) O(log n) for the sort's recursion, plus O(1) for the scan

**Explanation:** Dual-pivot quick sort works in place but recurses, using O(log n) stack space. (`Arrays.sort` on **object** arrays and `Collections.sort` use TimSort, which needs up to O(n) extra space.) It also mutates the input, which you should mention.

</details>

### P5. Fibonacci with a memo array uses O(n) time and O(n) space. Rewrite it to use O(1) auxiliary space and state why it still works.

**Difficulty:** Hard · **Pattern:** Space optimisation

<details>
<summary>Hint</summary>

To compute F(i) you only need F(i − 1) and F(i − 2).

</details>

<details>
<summary>Answer</summary>

**Answer:** Keep only the last two values.

```java
public class FibConstantSpace {

    static long fib(int n) {
        if (n < 2) {
            return n;
        }
        long previous = 0;   // F(i - 2)
        long current = 1;    // F(i - 1)
        for (int i = 2; i <= n; i++) {
            long next = previous + current;
            previous = current;
            current = next;
        }
        return current;
    }

    public static void main(String[] args) {
        System.out.println(fib(10) + " " + fib(50));
    }
}
```

**Output:**

```text
55 12586269025
```

**Explanation:** Each state depends only on the two previous states, so older entries of the table are never read again. Time O(n), auxiliary space O(1). This "keep only the rows/values the transition reads" idea applies to many DP problems — see [Dynamic Programming](../../algorithms/dynamic-programming/content.md).

</details>
