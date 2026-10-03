# Linear Search — Practice

### P1. Last occurrence

**Difficulty:** Easy · **Pattern:** Scan from the right

Return the index of the **last** occurrence of `target` in an unsorted array, or −1.

**Constraints:** 0 ≤ n ≤ 10⁵.

Example: `[4, 1, 4, 2, 4, 3]`, target 4 → `4`.

<details>
<summary>Hint</summary>

Scanning from the right lets you stop at the first match.

</details>

<details>
<summary>Answer</summary>

```java
public class LastOccurrence {

    static int lastIndexOf(int[] arr, int target) {
        for (int i = arr.length - 1; i >= 0; i--) {
            if (arr[i] == target) return i;
        }
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(lastIndexOf(new int[] {4, 1, 4, 2, 4, 3}, 4) + " " + lastIndexOf(new int[] {1, 2}, 9));
    }
}
```

**Output:**

```text
4 -1
```

**Complexity:** O(n) worst case, O(1) space.

</details>

### P2. Minimum and maximum with fewer comparisons

**Difficulty:** Medium · **Pattern:** Process elements in pairs

Find both the minimum and the maximum of an array using about 3n/2 comparisons instead of 2n.

**Constraints:** 1 ≤ n ≤ 10⁶.

Example: `[3, 5, 1, 8, 2, 9, 4]` → min 1, max 9.

<details>
<summary>Hint</summary>

Take elements two at a time. Compare them with each other first (1 comparison); then only the smaller can be a new minimum and only the larger a new maximum (2 more).

</details>

<details>
<summary>Answer</summary>

**Approach:** 3 comparisons per pair → about 3n/2 total, versus 2 per element (2n) for the naive scan. Both are O(n); the question tests careful reasoning about constants.

```java
public class MinMaxPairs {

    static int comparisons;

    static int[] minMax(int[] a) {
        int min, max, start;
        if (a.length % 2 == 1) {                 // odd length: first element initialises both
            min = max = a[0];
            start = 1;
        } else {
            comparisons++;
            if (a[0] < a[1]) { min = a[0]; max = a[1]; } else { min = a[1]; max = a[0]; }
            start = 2;
        }
        for (int i = start; i + 1 < a.length; i += 2) {
            int small = a[i], large = a[i + 1];
            comparisons++;
            if (small > large) { small = a[i + 1]; large = a[i]; }
            comparisons++;
            if (small < min) min = small;
            comparisons++;
            if (large > max) max = large;
        }
        return new int[] {min, max};
    }

    public static void main(String[] args) {
        int[] r = minMax(new int[] {3, 5, 1, 8, 2, 9, 4});
        System.out.println("min=" + r[0] + " max=" + r[1] + " comparisons=" + comparisons);
    }
}
```

**Output:**

```text
min=1 max=9 comparisons=9
```

**Complexity:** O(n) time with ⌈3n/2⌉ − 2 comparisons at most; O(1) space. (Naive: 2(n − 1) = 12 comparisons for n = 7.)

</details>

### P3. Majority element

**Difficulty:** Medium · **Pattern:** Boyer–Moore voting (single linear pass)

An element appears more than n/2 times. Find it in O(n) time and O(1) space.

**Constraints:** 1 ≤ n ≤ 5 × 10⁴; a majority element always exists.

Example: `[2, 2, 1, 1, 1, 2, 2]` → `2`.

<details>
<summary>Hint</summary>

Pair off each majority element against a different element. Because the majority has more than half, it cannot be cancelled out completely.

</details>

<details>
<summary>Answer</summary>

**Approach:** A hash-map count works in O(n) space; sorting and taking the middle works in O(n log n). Boyer–Moore keeps a `candidate` and a `count`: matching elements increment, others decrement, and at count 0 the next element becomes the candidate. Every decrement cancels one majority element against one non-majority element at most, so the majority survives.

```java
public class MajorityElement {

    static int majority(int[] nums) {
        int candidate = 0, count = 0;
        for (int x : nums) {
            if (count == 0) candidate = x;
            count += (x == candidate) ? 1 : -1;
        }
        return candidate;                 // valid because a majority is guaranteed
    }

    public static void main(String[] args) {
        System.out.println(majority(new int[] {2, 2, 1, 1, 1, 2, 2}) + " " + majority(new int[] {3, 2, 3}));
    }
}
```

**Output:**

```text
2 3
```

**Complexity:** O(n) time, O(1) space. If a majority is not guaranteed, make a second linear pass to verify the candidate's count.

</details>
