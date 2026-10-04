# Bit Manipulation — Practice

### P1. Counting bits for 0 … n

**Difficulty:** Easy · **Pattern:** DP on the binary representation

Return an array `ans` of length n + 1 where `ans[i]` is the number of 1-bits in i. Aim for O(n) total, not O(n log n).

**Constraints:** 0 ≤ n ≤ 10⁵.

Example: n = 5 → `[0, 1, 1, 2, 1, 2]`.

<details>
<summary>Hint</summary>

`i >> 1` is i without its last bit, and it is smaller than i — its answer is already known. Add back the last bit `i & 1`.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class CountingBits {

    static int[] countBits(int n) {
        int[] ans = new int[n + 1];
        for (int i = 1; i <= n; i++) ans[i] = ans[i >> 1] + (i & 1);
        return ans;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(countBits(5)) + " " + Arrays.toString(countBits(0)));
    }
}
```

**Output:**

```text
[0, 1, 1, 2, 1, 2] [0]
```

**Complexity:** O(n) time, O(1) extra space besides the output. An equivalent recurrence is `ans[i] = ans[i & (i − 1)] + 1`.

</details>

### P2. Reverse the bits of a 32-bit integer

**Difficulty:** Easy · **Pattern:** Extract the low bit, append to the result

Reverse the 32 bits of `n` (treated as unsigned) and return the result as an `int`.

**Constraints:** n is any 32-bit value.

Example: `00000010100101000001111010011100` (43261596) → `00111001011110000010100101000000` (964176192).

<details>
<summary>Hint</summary>

Repeat 32 times: shift the result left, add `n & 1`, then shift `n` right with `>>>` (unsigned, so negative inputs work).

</details>

<details>
<summary>Answer</summary>

```java
public class ReverseBits {

    static int reverseBits(int n) {
        int result = 0;
        for (int i = 0; i < 32; i++) {
            result = (result << 1) | (n & 1);    // append the lowest bit of n
            n >>>= 1;                            // unsigned shift
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(reverseBits(43261596) + " " + (reverseBits(-3) == Integer.reverse(-3)) + " " + reverseBits(1));
    }
}
```

**Output:**

```text
964176192 true -2147483648
```

**Complexity:** O(32) = O(1) time and space. Reversing 1 moves its only bit to the sign position, giving `Integer.MIN_VALUE`.

</details>

### P3. Add two integers without + or −

**Difficulty:** Medium · **Pattern:** XOR = sum without carry, AND-shift = carry

Return a + b without using the `+` or `-` operators.

**Constraints:** −1000 ≤ a, b ≤ 1000.

Example: a = 1, b = 2 → `3`; a = −2, b = 3 → `1`.

<details>
<summary>Hint</summary>

Bit by bit, `a ^ b` is the sum ignoring carries, and `(a & b) << 1` is the carry. Repeat with (sum, carry) until the carry is 0.

</details>

<details>
<summary>Answer</summary>

**Approach:** Each round moves every carry one position left; after at most 32 rounds the carries fall off the word. Two's complement makes negatives work with no special case.

```java
public class AddWithoutPlus {

    static int getSum(int a, int b) {
        while (b != 0) {
            int carry = (a & b) << 1;
            a ^= b;                       // partial sum without carries
            b = carry;
        }
        return a;
    }

    public static void main(String[] args) {
        System.out.println(getSum(1, 2) + " " + getSum(-2, 3) + " " + getSum(-5, -7));
    }
}
```

**Output:**

```text
3 1 -12
```

**Complexity:** O(w) iterations at most (w = 32), O(1) space.

</details>

### P4. Bitwise AND of a range

**Difficulty:** Medium · **Pattern:** Common binary prefix

Return the bitwise AND of all integers in the inclusive range [left, right].

**Constraints:** 0 ≤ left ≤ right ≤ 2³¹ − 1.

Example: [5, 7] → `4`; [1, 2147483647] → `0`.

<details>
<summary>Hint</summary>

Looping over the range is up to 2³¹ steps. Any bit position where left and right differ takes both values somewhere inside the range, so it ANDs to 0. The answer is the common binary prefix of left and right, followed by zeros.

</details>

<details>
<summary>Answer</summary>

```java
public class RangeAnd {

    static int rangeBitwiseAnd(int left, int right) {
        int shift = 0;
        while (left != right) {          // strip differing low bits
            left >>= 1;
            right >>= 1;
            shift++;
        }
        return left << shift;
    }

    public static void main(String[] args) {
        System.out.println(rangeBitwiseAnd(5, 7) + " " + rangeBitwiseAnd(0, 0) + " " + rangeBitwiseAnd(1, Integer.MAX_VALUE) + " " + rangeBitwiseAnd(12, 15));
    }
}
```

**Output:**

```text
4 0 0 12
```

**Complexity:** O(log right) = O(32) time, O(1) space. 5 = `101`, 7 = `111`: common prefix `1`, then two zeros → `100` = 4.

</details>
