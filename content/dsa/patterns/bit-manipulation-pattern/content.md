# Bit Manipulation Pattern

## What Is the Pattern

The **bit manipulation pattern** answers questions by working on binary representations instead of values: cancelling pairs with XOR, counting bits per position, packing small sets into an integer mask, or isolating a distinguishing bit. It shines when a problem demands O(1) extra space or involves small sets.

Tiny example: in `[4, 1, 2, 1, 2]` every value appears twice except one. XOR of everything = 4 ^ 1 ^ 2 ^ 1 ^ 2 = 4, because each pair cancels (x ^ x = 0).

Operators, two's complement, Java details (`>>` vs `>>>`, shift masking) and the core tricks are in [Bit Manipulation](../../algorithms/bit-manipulation/content.md); subset DP over masks in [Bitmask DP](../../algorithms/bitmask-dp/content.md).

## Why It Works

- **XOR** is associative, commutative, `x ^ x = 0` and `x ^ 0 = x`: order does not matter and pairs vanish, leaving whatever appears an odd number of times.
- **Per-bit counting** treats each of the 32 bit positions independently: if every value appears k times except one, each bit's total count mod k is that bit of the unique value.
- **Masks** represent a subset of ≤ 32 (or 64) items in one integer, so "do these two sets intersect?" becomes a single `&` instead of a loop.
- **Lowest set bit** `x & −x` picks a bit where two different numbers differ, splitting a problem into two independent halves.

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Every element appears twice (or k times) except one/two" | XOR cancellation or per-bit counts |
| "O(1) extra space" with counting or uniqueness | bits replace a hash map |
| "Without using + / − / * / division" | build arithmetic from `&`, `^`, shifts |
| Sets over a small alphabet (26 letters) or small n (≤ 20) | encode as a mask; compare with `&` |
| "Power of two", "count of 1 bits", "Hamming distance", "reverse bits" | direct bit tricks |
| "Maximum XOR of a pair/subarray" | bit-by-bit greedy (often with a binary trie) |
| "All subsets" with n ≤ 20 | iterate masks 0 … 2ⁿ − 1 |

## Typical Problem Structure

- Input: an integer array, integers, or strings over a small alphabet.
- Output: one or two special values, a count, a maximum, or a boolean.
- Constraints: values fit in `int`/`long`; space limit O(1); n of a set ≤ 20–64 for masks.

## Template

```pseudocode
// XOR cancellation
x ← 0
for v in values: x ← x XOR v          // pairs cancel

// per-bit counting (each value appears k times except one)
for bit from 0 to 31:
    count ← number of values with this bit set
    if count mod k ≠ 0: set this bit in the answer

// set as a mask
mask ← 0
for item in set: mask ← mask OR (1 << index(item))
disjoint(a, b) ⇔ (a AND b) = 0
```

## Java Template

```java
public class BitPatternTemplates {

    static int letterMask(String word) {
        int mask = 0;
        for (char c : word.toCharArray()) mask |= 1 << (c - 'a');   // bit i = letter i present
        return mask;
    }

    static int uniqueAmongTriples(int[] a) {          // every value three times except one
        int result = 0;
        for (int bit = 0; bit < 32; bit++) {
            int count = 0;
            for (int v : a) count += (v >>> bit) & 1;
            if (count % 3 != 0) result |= 1 << bit;
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(Integer.toBinaryString(letterMask("cab")) + " " + ((letterMask("abc") & letterMask("xyz")) == 0) + " " + uniqueAmongTriples(new int[] {2, 2, 3, 2}));
    }
}
```

**Output:**

```text
111 true 3
```

## Example Problem

**Two values that appear once.** In an array, exactly two values appear once and all others appear exactly twice. Return the two values (in increasing order) using O(1) extra space. Example: `[1, 2, 1, 3, 2, 5]` → `[3, 5]`.

- **Hash map:** count occurrences — O(n) space.
- **Observation:** XOR of everything = a ^ b (pairs cancel). Since a ≠ b, a ^ b has at least one set bit; at that bit a and b differ. Split all numbers by that bit: a and b fall into different groups, and every pair lands in the same group. XOR each group separately.

```java
import java.util.Arrays;

public class TwoSingleNumbers {

    static int[] singleNumbers(int[] nums) {
        int xorAll = 0;
        for (int v : nums) xorAll ^= v;                // = a ^ b
        int diffBit = xorAll & -xorAll;                // lowest bit where a and b differ
        int a = 0, b = 0;
        for (int v : nums) {
            if ((v & diffBit) == 0) a ^= v;            // group without the bit
            else b ^= v;                               // group with the bit
        }
        return a < b ? new int[] {a, b} : new int[] {b, a};
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(singleNumbers(new int[] {1, 2, 1, 3, 2, 5})) + " " + Arrays.toString(singleNumbers(new int[] {-1, 0})) + " "
                + Arrays.toString(singleNumbers(new int[] {0, 1})));
    }
}
```

**Output:**

```text
[3, 5] [-1, 0] [0, 1]
```

## Dry Run

`[1, 2, 1, 3, 2, 5]`:

| Step | Value |
|------|-------|
| XOR of all | 1 ^ 2 ^ 1 ^ 3 ^ 2 ^ 5 = 3 ^ 5 = `011 ^ 101` = `110` (6) |
| diffBit = 6 & −6 | `010` (2) |
| Group with bit 1 clear | 1, 1, 5 → XOR = 5 |
| Group with bit 1 set | 2, 3, 2 → XOR = 3 |
| Result | [3, 5] |

`xorAll & −xorAll` also works for negative values and for `Integer.MIN_VALUE` (it returns that value itself, which is a valid single-bit mask).

## Common Mistakes

- Operator precedence: `(v & bit) == 0`, never `v & bit == 0`.
- Using `>>` when counting bits of negative numbers inside loops that expect termination (use `>>>` or a fixed 32-iteration loop).
- `1 << 31` is negative and `1 << 32 == 1` — use `1L << k` for 64-bit masks.
- Assuming XOR solves "appears three times" (it does not — use per-bit counts mod 3).
- Masks for more than 32/64 items — use `BitSet` or `long[]`.

## Variations

- **One unique among pairs:** XOR all.
- **One unique among triples:** per-bit counts mod 3 (or a two-variable state machine `ones`, `twos`).
- **Missing number in 0 … n:** XOR all indices and values.
- **Letter-set masks:** maximum product of word lengths with no shared letters; anagram-like checks.
- **Maximum XOR pair:** greedy from the highest bit with a binary [trie](../../data-structures/trie/content.md).
- **Subset enumeration:** masks 0 … 2ⁿ − 1; submasks via `s = (s − 1) & mask`.
- **Prefix XOR:** XOR of a subarray = `px[r + 1] ^ px[l]`, combined with a hash map like [prefix sums](../prefix-sum/content.md).

## Complexity

| Technique | Time | Space |
|-----------|------|-------|
| XOR of n values | O(n) | O(1) |
| Per-bit counting | O(32 n) | O(1) |
| Masks for n words of length L, pairwise check | O(n L + n²) | O(n) |
| All subsets of n items | O(2ⁿ × n) | O(1) besides output |

## When Not to Use It

- Clarity matters more than O(1) space — a `HashMap` count is easier to read and verify.
- Sets larger than 64 elements without `BitSet`.
- Problems about values rather than their bits (sums, ordering) unless a bit trick is clearly simpler.

## Key Takeaways

- Pairs cancel under XOR; k-fold repeats cancel with per-bit counts mod k.
- `x & −x` isolates a distinguishing bit; masks turn small-set operations into single instructions.
- Mind precedence, `>>>` vs `>>`, and `1L` for wide masks.
