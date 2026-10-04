# Modular Arithmetic — Practice

### P1. Count good digit strings

**Difficulty:** Medium · **Pattern:** Counting + modular exponentiation

A digit string of length n is **good** if digits at even indices (0-based) are even (0, 2, 4, 6, 8) and digits at odd indices are prime (2, 3, 5, 7). Return the number of good strings mod 10⁹ + 7.

**Constraints:** 1 ≤ n ≤ 10¹⁵.

Example: n = 1 → `5`; n = 4 → `400`; n = 50 → `564908303`.

<details>
<summary>Hint</summary>

There are ⌈n/2⌉ even positions with 5 choices each and ⌊n/2⌋ odd positions with 4 choices each. With n up to 10¹⁵ you need O(log n) exponentiation, reducing mod p at every multiply.

</details>

<details>
<summary>Answer</summary>

```java
public class CountGoodNumbers {

    static final long MOD = 1_000_000_007L;

    static long modPow(long b, long e) {
        long r = 1;
        b %= MOD;
        for (; e > 0; e >>= 1, b = b * b % MOD) {
            if ((e & 1) == 1) r = r * b % MOD;
        }
        return r;
    }

    static long countGoodNumbers(long n) {
        return modPow(5, (n + 1) / 2) * modPow(4, n / 2) % MOD;
    }

    public static void main(String[] args) {
        System.out.println(countGoodNumbers(1) + " " + countGoodNumbers(4) + " " + countGoodNumbers(50));
    }
}
```

**Output:**

```text
5 400 564908303
```

**Complexity:** O(log n) time, O(1) space.

</details>

### P2. Remove the shortest subarray to make the sum divisible by p

**Difficulty:** Medium · **Pattern:** Prefix sums modulo p + hash map

Remove the shortest (possibly empty, but not the whole array) contiguous subarray so that the sum of the remaining elements is divisible by p. Return its length, or −1.

**Constraints:** 1 ≤ n ≤ 10⁵; 1 ≤ values ≤ 10⁹; 1 ≤ p ≤ 10⁹.

Example: `[3, 1, 4, 2]`, p = 6 → `1` (remove 4); `[6, 3, 5, 2]`, p = 9 → `2`; `[1, 2, 3]`, p = 3 → `0`.

<details>
<summary>Hint</summary>

Let r = total mod p. You need a subarray whose sum ≡ r (mod p). With prefix sums mod p, a subarray (j, i] works when `(prefix[i] − prefix[j]) mod p = r`, i.e. `prefix[j] = (prefix[i] − r) mod p` — normalise the negative value. Keep the latest index of each prefix value.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class MakeSumDivisible {

    static int minSubarray(int[] nums, int p) {
        long total = 0;
        for (int v : nums) total += v;
        int need = (int) (total % p);
        if (need == 0) return 0;
        Map<Integer, Integer> last = new HashMap<>();
        last.put(0, -1);                                   // empty prefix
        int prefix = 0, best = nums.length;
        for (int i = 0; i < nums.length; i++) {
            prefix = (int) ((prefix + (long) nums[i]) % p);
            int want = Math.floorMod(prefix - need, p);    // avoid a negative key
            Integer j = last.get(want);
            if (j != null) best = Math.min(best, i - j);
            last.put(prefix, i);                           // latest index gives the shortest subarray
        }
        return best == nums.length ? -1 : best;
    }

    public static void main(String[] args) {
        System.out.println(minSubarray(new int[] {3, 1, 4, 2}, 6) + " " + minSubarray(new int[] {6, 3, 5, 2}, 9) + " "
                + minSubarray(new int[] {1, 2, 3}, 3) + " " + minSubarray(new int[] {1, 2, 3}, 7));
    }
}
```

**Output:**

```text
1 2 0 -1
```

**Complexity:** O(n) time and space. Without `floorMod`, `prefix − need` can be negative and the lookup silently fails. The answer may not be the whole array, hence `best == n` maps to −1.

</details>

### P3. Count distinct anagrams of a sentence

**Difficulty:** Hard · **Pattern:** Multinomial coefficients with modular inverses

Words are separated by single spaces. Return how many distinct strings can be formed by permuting the letters **within each word** (word order fixed), mod 10⁹ + 7.

**Constraints:** 1 ≤ length ≤ 10⁵.

Example: `"too hot"` → `18` (3 × 6); `"aa"` → `1`.

<details>
<summary>Hint</summary>

For one word of length L with letter counts c₁, c₂, …, the count is L! / (c₁! c₂! …). Under a modulus, divide by multiplying with inverse factorials. Multiply the words' results together.

</details>

<details>
<summary>Answer</summary>

```java
public class CountAnagrams {

    static final long MOD = 1_000_000_007L;

    static long modPow(long b, long e) {
        long r = 1;
        b %= MOD;
        for (; e > 0; e >>= 1, b = b * b % MOD) {
            if ((e & 1) == 1) r = r * b % MOD;
        }
        return r;
    }

    static int countAnagrams(String s) {
        int n = s.length();
        long[] fact = new long[n + 1], invFact = new long[n + 1];
        fact[0] = 1;
        for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % MOD;
        invFact[n] = modPow(fact[n], MOD - 2);              // Fermat inverse
        for (int i = n; i > 0; i--) invFact[i - 1] = invFact[i] * i % MOD;

        long result = 1;
        for (String word : s.split(" ")) {
            int[] count = new int[26];
            for (char c : word.toCharArray()) count[c - 'a']++;
            long ways = fact[word.length()];
            for (int c : count) ways = ways * invFact[c] % MOD;   // divide by c! via its inverse
            result = result * ways % MOD;
        }
        return (int) result;
    }

    public static void main(String[] args) {
        System.out.println(countAnagrams("too hot") + " " + countAnagrams("aa") + " " + countAnagrams("abc def"));
    }
}
```

**Output:**

```text
18 1 36
```

**Complexity:** O(n + log MOD) time, O(n) space.

</details>
