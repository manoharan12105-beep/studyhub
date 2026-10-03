# Arrays — Practice

### P1. Second largest distinct value

**Difficulty:** Easy · **Pattern:** Single pass with two trackers

Return the second largest **distinct** value in an integer array, or `-1` if it does not exist.

**Constraints:** 1 ≤ n ≤ 10⁵; values fit in `int`, all ≥ 0.

Example: `[12, 35, 1, 10, 34, 1]` → `34`; `[7, 7, 7]` → `-1`.

<details>
<summary>Hint</summary>

Keep `largest` and `second` as you scan. A new maximum demotes the old one to `second`. Equal values must not become `second`.

</details>

<details>
<summary>Answer</summary>

**Approach:** Sorting works in O(n log n); one pass does it in O(n).

```java
public class SecondLargest {

    static int secondLargest(int[] arr) {
        int largest = -1;
        int second = -1;
        for (int value : arr) {
            if (value > largest) {
                second = largest;          // old maximum becomes the runner-up
                largest = value;
            } else if (value < largest && value > second) {
                second = value;            // strictly below largest: distinct
            }
        }
        return second;
    }

    public static void main(String[] args) {
        System.out.println(secondLargest(new int[] {12, 35, 1, 10, 34, 1}));
        System.out.println(secondLargest(new int[] {7, 7, 7}));
        System.out.println(secondLargest(new int[] {5}));
    }
}
```

**Output:**

```text
34
-1
-1
```

**Complexity:** O(n) time, O(1) space.

</details>

### P2. Move zeros to the end

**Difficulty:** Easy · **Pattern:** Write pointer (in-place)

Move all zeros to the end of the array **in place**, keeping the relative order of the non-zero elements.

**Constraints:** 1 ≤ n ≤ 10⁵. O(1) extra space.

Example: `[0, 1, 0, 3, 12]` → `[1, 3, 12, 0, 0]`.

<details>
<summary>Hint</summary>

Keep a `write` index for the next slot a non-zero value should go to.

</details>

<details>
<summary>Answer</summary>

**Approach:** Copy each non-zero value to `arr[write++]`; fill the remaining slots with zeros. Order is preserved because non-zero values are copied in their original order.

```java
import java.util.Arrays;

public class MoveZeros {

    static void moveZeros(int[] arr) {
        int write = 0;
        for (int value : arr) {
            if (value != 0) {
                arr[write++] = value;
            }
        }
        while (write < arr.length) {
            arr[write++] = 0;
        }
    }

    public static void main(String[] args) {
        int[] a = {0, 1, 0, 3, 12};
        moveZeros(a);
        System.out.println(Arrays.toString(a));
    }
}
```

**Output:**

```text
[1, 3, 12, 0, 0]
```

**Complexity:** O(n) time, O(1) space.

</details>

### P3. Leaders in an array

**Difficulty:** Medium · **Pattern:** Suffix maximum

An element is a **leader** if it is strictly greater than every element to its right. The last element is always a leader. Return the leaders in their original order.

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `[16, 17, 4, 3, 5, 2]` → `[17, 5, 2]`.

<details>
<summary>Hint</summary>

Brute force compares each element with all elements to its right: O(n²). Scan from the right while tracking the maximum seen so far.

</details>

<details>
<summary>Answer</summary>

**Approach:** Walking right to left, `maxRight` is the suffix maximum of everything already seen. An element is a leader exactly when it exceeds `maxRight`. Collect leaders, then reverse to restore original order.

```java
import java.util.*;

public class Leaders {

    static List<Integer> leaders(int[] arr) {
        List<Integer> result = new ArrayList<>();
        int maxRight = Integer.MIN_VALUE;
        for (int i = arr.length - 1; i >= 0; i--) {
            if (arr[i] > maxRight) {
                result.add(arr[i]);
                maxRight = arr[i];
            }
        }
        Collections.reverse(result);
        return result;
    }

    public static void main(String[] args) {
        System.out.println(leaders(new int[] {16, 17, 4, 3, 5, 2}));
        System.out.println(leaders(new int[] {5, 5}));
    }
}
```

**Output:**

```text
[17, 5, 2]
[5]
```

**Complexity:** O(n) time, O(1) extra space besides the output.

</details>

### P4. Product of array except self

**Difficulty:** Medium · **Pattern:** Prefix and suffix products

Return an array `answer` where `answer[i]` is the product of all elements except `arr[i]`, **without using division**.

**Constraints:** 2 ≤ n ≤ 10⁵; every prefix/suffix product fits in `int`.

Example: `[1, 2, 3, 4]` → `[24, 12, 8, 6]`.

<details>
<summary>Hint</summary>

answer[i] = (product of everything left of i) × (product of everything right of i).

</details>

<details>
<summary>Answer</summary>

**Approach:** Brute force multiplies n − 1 numbers for each i (O(n²)). Division fails with zeros. Instead, store prefix products in `answer`, then sweep from the right multiplying by a running suffix product — O(1) extra space.

```java
import java.util.Arrays;

public class ProductExceptSelf {

    static int[] productExceptSelf(int[] arr) {
        int n = arr.length;
        int[] answer = new int[n];
        answer[0] = 1;
        for (int i = 1; i < n; i++) {
            answer[i] = answer[i - 1] * arr[i - 1];   // product of arr[0..i-1]
        }
        int suffix = 1;                               // product of arr[i+1..n-1]
        for (int i = n - 1; i >= 0; i--) {
            answer[i] *= suffix;
            suffix *= arr[i];
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(productExceptSelf(new int[] {1, 2, 3, 4})));
        System.out.println(Arrays.toString(productExceptSelf(new int[] {-1, 1, 0, -3, 3})));
    }
}
```

**Output:**

```text
[24, 12, 8, 6]
[0, 0, 9, 0, 0]
```

**Complexity:** O(n) time, O(1) extra space (the output array does not count).

</details>

### P5. Missing number

**Difficulty:** Medium · **Pattern:** Math identity

An array contains n distinct numbers taken from 0, 1, …, n (so exactly one is missing). Find the missing number.

**Constraints:** 1 ≤ n ≤ 10⁶.

Example: `[3, 0, 1]` → `2`.

<details>
<summary>Hint</summary>

The sum 0 + 1 + … + n is known in advance.

</details>

<details>
<summary>Answer</summary>

**Approach:** Expected sum n(n + 1)/2 minus the actual sum. Use `long` to avoid overflow for large n. (XOR of all indices and values also works — see [Bit Manipulation](../../algorithms/bit-manipulation/content.md).)

```java
public class MissingNumber {

    static int missing(int[] arr) {
        long n = arr.length;
        long expected = n * (n + 1) / 2;
        long actual = 0;
        for (int value : arr) {
            actual += value;
        }
        return (int) (expected - actual);
    }

    public static void main(String[] args) {
        System.out.println(missing(new int[] {3, 0, 1}));
        System.out.println(missing(new int[] {0, 1}));
        System.out.println(missing(new int[] {9, 6, 4, 2, 3, 5, 7, 0, 1}));
    }
}
```

**Output:**

```text
2
2
8
```

**Complexity:** O(n) time, O(1) space. A hash set or sorting would also work but costs O(n) space or O(n log n) time.

</details>

### P6. First missing positive

**Difficulty:** Hard · **Pattern:** Index as hash (cyclic placement)

Given an unsorted integer array, return the smallest positive integer that does not appear in it, in O(n) time and O(1) extra space.

**Constraints:** 1 ≤ n ≤ 10⁵; values anywhere in the `int` range.

Example: `[3, 4, -1, 1]` → `2`; `[7, 8, 9]` → `1`.

<details>
<summary>Hint</summary>

The answer is always in 1..n + 1. Try to put each value v (1 ≤ v ≤ n) at index v − 1 by swapping.

</details>

<details>
<summary>Answer</summary>

**Approach:** A hash set gives O(n) time but O(n) space. To use O(1) space, use the array itself as the set: swap each value v in 1..n into slot v − 1 until the current slot holds a value that is out of range, already correct, or a duplicate. Then the first index i with `arr[i] != i + 1` gives the answer i + 1. Each swap puts one value into its final slot, so there are at most n swaps in total.

```java
public class FirstMissingPositive {

    static int firstMissingPositive(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            while (arr[i] >= 1 && arr[i] <= n && arr[arr[i] - 1] != arr[i]) {
                int target = arr[i] - 1;
                int temp = arr[target];
                arr[target] = arr[i];
                arr[i] = temp;
            }
        }
        for (int i = 0; i < n; i++) {
            if (arr[i] != i + 1) {
                return i + 1;
            }
        }
        return n + 1;
    }

    public static void main(String[] args) {
        System.out.println(firstMissingPositive(new int[] {3, 4, -1, 1}));
        System.out.println(firstMissingPositive(new int[] {7, 8, 9}));
        System.out.println(firstMissingPositive(new int[] {1, 2, 3}));
        System.out.println(firstMissingPositive(new int[] {1, 1}));
    }
}
```

**Output:**

```text
2
1
4
2
```

**Complexity:** O(n) time (at most n successful swaps overall), O(1) extra space. It modifies the input — mention this.

</details>
