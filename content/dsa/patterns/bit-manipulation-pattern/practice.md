# Bit Manipulation Pattern — Practice

### P1. Hamming distance

**Difficulty:** Easy · **Pattern:** XOR then count set bits

Return the number of bit positions at which two non-negative integers differ.

**Constraints:** 0 ≤ x, y ≤ 2³¹ − 1.

Example: x = 1, y = 4 → `2` (`001` vs `100`).

<details>
<summary>Hint</summary>

`x ^ y` has a 1 exactly where the bits differ. Count its 1s with Kernighan's loop.

</details>

<details>
<summary>Answer</summary>

```java
public class HammingDistance {

    static int hammingDistance(int x, int y) {
        int diff = x ^ y, count = 0;
        while (diff != 0) {
            diff &= diff - 1;                          // drop the lowest set bit
            count++;
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(hammingDistance(1, 4) + " " + hammingDistance(3, 1) + " " + (hammingDistance(93, 73) == Integer.bitCount(93 ^ 73)));
    }
}
```

**Output:**

```text
2 1 true
```

**Complexity:** O(number of differing bits) ≤ O(32) time, O(1) space.

</details>

### P2. Maximum product of lengths of two words with no common letters

**Difficulty:** Medium · **Pattern:** Letter-set masks compared with `&`

Return the maximum `length(a) × length(b)` over pairs of words that share no letter, or 0.

**Constraints:** 2 ≤ n ≤ 1000; word length ≤ 1000; lowercase letters.

Example: `["abcw", "baz", "foo", "bar", "xtfn", "abcdef"]` → `16` (`"abcw"`, `"xtfn"`); `["a", "aa", "aaa", "aaaa"]` → `0`.

<details>
<summary>Hint</summary>

Comparing letters of every pair costs O(n² × L). Precompute a 26-bit mask per word; two words share no letter iff `mask[i] & mask[j] == 0`.

</details>

<details>
<summary>Answer</summary>

```java
public class MaxProductWordLengths {

    static int maxProduct(String[] words) {
        int n = words.length;
        int[] mask = new int[n];
        for (int i = 0; i < n; i++)
            for (char c : words[i].toCharArray()) mask[i] |= 1 << (c - 'a');
        int best = 0;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++)
                if ((mask[i] & mask[j]) == 0) best = Math.max(best, words[i].length() * words[j].length());
        return best;
    }

    public static void main(String[] args) {
        System.out.println(maxProduct(new String[] {"abcw", "baz", "foo", "bar", "xtfn", "abcdef"}) + " " + maxProduct(new String[] {"a", "ab", "abc", "d", "cd", "bcd", "abcd"}) + " "
                + maxProduct(new String[] {"a", "aa", "aaa", "aaaa"}));
    }
}
```

**Output:**

```text
16 4 0
```

**Complexity:** O(n × L + n²) time, O(n) space.

</details>

### P3. Minimum bit flips so that a OR b equals c

**Difficulty:** Medium · **Pattern:** Independent per-bit decisions

Flipping one bit of a or b costs 1. Return the minimum flips so that `(a | b) == c`.

**Constraints:** 1 ≤ a, b, c ≤ 10⁹.

Example: a = 2, b = 6, c = 5 → `3`; a = 4, b = 2, c = 7 → `1`.

<details>
<summary>Hint</summary>

Each bit position is independent. If c's bit is 1, you need at least one of a, b to have it (1 flip if both are 0). If c's bit is 0, both must be 0 (flip each one that is 1).

</details>

<details>
<summary>Answer</summary>

```java
public class MinFlipsOr {

    static int minFlips(int a, int b, int c) {
        int flips = 0;
        for (int bit = 0; bit < 31; bit++) {
            int x = (a >> bit) & 1, y = (b >> bit) & 1, z = (c >> bit) & 1;
            if (z == 1) flips += (x | y) == 0 ? 1 : 0;   // need one of them on
            else flips += x + y;                         // both must be off
        }
        return flips;
    }

    public static void main(String[] args) {
        System.out.println(minFlips(2, 6, 5) + " " + minFlips(4, 2, 7) + " " + minFlips(1, 2, 3));
    }
}
```

**Output:**

```text
3 1 0
```

**Complexity:** O(31) = O(1) time and space. A one-line version: `Integer.bitCount((a | b) ^ c) + Integer.bitCount(a & b & ~c)`.

</details>
