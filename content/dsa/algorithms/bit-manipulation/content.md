# Bit Manipulation

## Definition

**Bit manipulation** works directly on the binary representation of integers using the bitwise operators AND `&`, OR `|`, XOR `^`, NOT `~` and the shifts `<<`, `>>`, `>>>`. Each operator runs in O(1) on a machine word (32 bits for Java `int`, 64 for `long`), so a set of up to 64 flags can be stored, combined and tested in constant time.

## Why It Matters

- Many interview questions have a short bitwise solution: find the element that appears once, check a power of two, count set bits, generate all subsets.
- Bitmasks represent sets compactly — the basis of [Bitmask DP](../bitmask-dp/content.md) and fast N-Queens.
- Understanding two's complement explains overflow, negative shifts and why `Math.abs(Integer.MIN_VALUE)` is negative.

## Prerequisites

- [Time Complexity](../../fundamentals/time-complexity/content.md)
- Binary numbers (place values 1, 2, 4, 8, …)

## Intuition

An `int` is 32 switches. AND keeps a switch on only where **both** inputs are on; OR where **either** is; XOR where they **differ**; NOT flips every switch. Shifting left by k multiplies by 2ᵏ (switches move to higher place values); shifting right divides by 2ᵏ.

XOR has the property that makes many puzzles work: `x ^ x = 0` and `x ^ 0 = x`, and it is commutative and associative. XOR-ing a list where every value appears twice except one cancels the pairs and leaves the single value.

## How It Works

### Operators

| Operator | Meaning | Example (4-bit view) |
|----------|---------|----------------------|
| `a & b` | 1 where both are 1 | 1100 & 1010 = 1000 |
| `a \| b` | 1 where either is 1 | 1100 \| 1010 = 1110 |
| `a ^ b` | 1 where they differ | 1100 ^ 1010 = 0110 |
| `~a` | flip every bit | ~1100 = 0011 (in 4 bits) |
| `a << k` | shift left, fill with 0 | 0011 << 2 = 1100 |
| `a >> k` | arithmetic right shift: fill with the sign bit | (−8) >> 1 = −4 |
| `a >>> k` | logical right shift: fill with 0 | (−1) >>> 28 = 15 |

### Two's complement

Java stores negative integers in **two's complement**: `−x = ~x + 1`. The top bit is the sign bit. Ranges: `int` −2³¹ … 2³¹ − 1. Consequences:

- `~x = −x − 1`, so `~0 = −1` (all ones).
- `Integer.MIN_VALUE` has no positive counterpart: `−Integer.MIN_VALUE == Integer.MIN_VALUE`.
- `x & −x` isolates the **lowest set bit** (because `−x` flips every bit above it).

### Core tricks

| Task | Expression | Why |
|------|------------|-----|
| Test bit i | `(x >> i) & 1` or `(x & (1 << i)) != 0` | move bit i to position 0 / mask it |
| Set bit i | `x \| (1 << i)` | OR with a single 1 |
| Clear bit i | `x & ~(1 << i)` | AND with all ones except bit i |
| Toggle bit i | `x ^ (1 << i)` | XOR flips |
| Lowest set bit | `x & −x` | two's complement |
| Clear lowest set bit | `x & (x − 1)` | `x − 1` flips the lowest 1 and the zeros below it |
| Power of two (x > 0) | `(x & (x − 1)) == 0` | exactly one set bit |
| Count set bits | loop `x &= x − 1` | one iteration per set bit (Kernighan) |
| Multiply / divide by 2ᵏ | `x << k`, `x >> k` | `>>` rounds toward −∞ for negatives (unlike `/`) |
| All subsets of n items | `for mask in 0 … 2ⁿ − 1` | bit i of mask = item i chosen |

### Java specifics

- Shift distances are taken **mod 32** for `int` (mod 64 for `long`): `1 << 33 == 2`. Use `1L << k` for k ≥ 31.
- `>>>` exists because `>>` preserves the sign; use `>>>` to treat an `int` as unsigned (e.g. `(lo + hi) >>> 1`).
- Library helpers: `Integer.bitCount`, `Integer.highestOneBit`, `Integer.lowestOneBit`, `Integer.numberOfTrailingZeros`, `Integer.numberOfLeadingZeros`, `Integer.reverse`, `Integer.toBinaryString` (and `Long.` versions). Know the manual technique; use the library in real code.
- Precedence trap: `==` binds tighter than `&`, so `x & 1 == 0` does not compile for `int` — write `(x & 1) == 0`.

## Visual Explanation

```text
x       = 12 = 0000 1100
x − 1   = 11 = 0000 1011      lowest 1 becomes 0, zeros below become 1
x & x−1 =  8 = 0000 1000      lowest set bit cleared

−x      = −12 = 1111 0100     (~x + 1)
x & −x  =  4 = 0000 0100      lowest set bit isolated

subsets of {a, b, c}:
mask: 000 001 010 011 100 101 110 111
set:  {}  {a} {b} {a,b} {c} {a,c} {b,c} {a,b,c}
```

## Pseudocode

```pseudocode
countSetBits(x):            // Kernighan
    count ← 0
    while x ≠ 0:
        x ← x AND (x − 1)   // remove the lowest set bit
        count ← count + 1
    return count

singleNumber(a):            // every value twice except one
    r ← 0
    for v in a: r ← r XOR v
    return r
```

## Java Implementation

```java
import java.util.*;

public class BitManipulation {

    static boolean isPowerOfTwo(int x) { return x > 0 && (x & (x - 1)) == 0; }

    static int countSetBits(int x) {                     // Kernighan: one loop per set bit
        int count = 0;
        while (x != 0) {
            x &= x - 1;
            count++;
        }
        return count;
    }

    static int singleNumber(int[] a) {                   // pairs cancel: v ^ v = 0
        int r = 0;
        for (int v : a) r ^= v;
        return r;
    }

    static List<List<Character>> subsets(char[] items) {
        List<List<Character>> all = new ArrayList<>();
        int n = items.length;
        for (int mask = 0; mask < (1 << n); mask++) {
            List<Character> subset = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                if ((mask & (1 << i)) != 0) subset.add(items[i]);
            }
            all.add(subset);
        }
        return all;
    }

    public static void main(String[] args) {
        System.out.println("13 in binary: " + Integer.toBinaryString(13));
        System.out.println("-5 in binary: " + Integer.toBinaryString(-5));
        System.out.println("-5 >> 1 = " + (-5 >> 1) + ", -5 >>> 28 = " + (-5 >>> 28) + ", 1 << 33 = " + (1 << 33));
        System.out.println("12 & -12 = " + (12 & -12) + ", 12 & 11 = " + (12 & 11));
        System.out.println("power of two: 16 " + isPowerOfTwo(16) + ", 12 " + isPowerOfTwo(12) + ", 0 " + isPowerOfTwo(0));
        System.out.println("set bits in 29: " + countSetBits(29) + " (library: " + Integer.bitCount(29) + ")");
        int x = 8;
        x |= 1 << 1;                                     // set bit 1   → 10
        System.out.print("set: " + x);
        x &= ~(1 << 3);                                  // clear bit 3 → 2
        System.out.print(", clear: " + x);
        x ^= 1;                                          // toggle bit 0 → 3
        System.out.println(", toggle: " + x + ", bit 2 of 5: " + ((5 >> 2) & 1));
        System.out.println("subsets: " + subsets(new char[] {'a', 'b', 'c'}));
        System.out.println("single number: " + singleNumber(new int[] {4, 1, 2, 1, 2}));
        System.out.println("-7 / 2 = " + (-7 / 2) + ", -7 >> 1 = " + (-7 >> 1));
    }
}
```

**Output:**

```text
13 in binary: 1101
-5 in binary: 11111111111111111111111111111011
-5 >> 1 = -3, -5 >>> 28 = 15, 1 << 33 = 2
12 & -12 = 4, 12 & 11 = 8
power of two: 16 true, 12 false, 0 false
set bits in 29: 4 (library: 4)
set: 10, clear: 2, toggle: 3, bit 2 of 5: 1
subsets: [[], [a], [b], [a, b], [c], [a, c], [b, c], [a, b, c]]
single number: 4
-7 / 2 = -3, -7 >> 1 = -4
```

The last line shows that `/` truncates toward zero while `>>` rounds toward −∞ for negative numbers.

## Dry Run

Kernighan's count on x = 29 = `11101`:

| Iteration | x (binary) | x − 1 | x & (x − 1) | count |
|-----------|------------|-------|-------------|-------|
| 1 | 11101 | 11100 | 11100 | 1 |
| 2 | 11100 | 11011 | 11000 | 2 |
| 3 | 11000 | 10111 | 10000 | 3 |
| 4 | 10000 | 01111 | 00000 | 4 |

Four iterations for four set bits — not 32.

## Complexity Analysis

| Operation | Time | Notes |
|-----------|------|-------|
| `&`, `\|`, `^`, `~`, shifts | O(1) | one machine instruction on a word |
| Kernighan bit count | O(number of set bits) ≤ O(w) | w = 32 or 64 |
| `Integer.bitCount` | O(1) | constant number of word operations (often a single CPU instruction) |
| XOR of n values | O(n) time, O(1) space | |
| All subsets of n items | O(2ⁿ × n) | 2ⁿ masks, n bits checked each |

## Properties

- XOR: `x ^ x = 0`, `x ^ 0 = x`, commutative, associative, and self-inverse (`a ^ b ^ b = a`).
- `x & (x − 1)` removes the lowest set bit; `x & −x` keeps only it.
- A bitmask with n bits names one of 2ⁿ subsets; mask order 0 … 2ⁿ − 1 lists every subset once.

## Variations

- **Gray code:** `i ^ (i >> 1)` — consecutive values differ in one bit.
- **Submask enumeration:** `for (s = mask; s > 0; s = (s − 1) & mask)`.
- **Bitsets** (`java.util.BitSet`, `long[]`) — process 64 flags per operation.
- **XOR prefix:** `p[i] = a[0] ^ … ^ a[i−1]`; XOR of a range is `p[r + 1] ^ p[l]` (like prefix sums).

## Comparison

| Task | Bitwise | Alternative |
|------|---------|-------------|
| Element appearing once (others twice) | XOR all, O(1) space | `HashSet`, O(n) space |
| Set of ≤ 64 flags | one `long`, O(1) union/intersection | `boolean[]` or `Set`, O(n) |
| Parity / power of two | O(1) | loop dividing by 2, O(log x) |

## Edge Cases

- Negative numbers: `>>` keeps the sign; use `>>>` for unsigned behaviour.
- `1 << 31` is `Integer.MIN_VALUE` (negative); `1 << 32` is 1 (distance mod 32). Use `1L << k` for bits ≥ 31.
- `isPowerOfTwo(0)` must be false — the `x > 0` check is required.
- `Math.abs(Integer.MIN_VALUE)` overflows and stays negative.

## Advantages

- Constant-time set operations and very low memory.
- Elegant O(1)-space solutions to counting/cancellation puzzles.

## Disadvantages

- Hard to read; comments are essential.
- Limited to the word size (32/64 elements) without bitsets.

## When to Use

- Problems stating "every element appears twice/three times except …", "without extra space", "without + or −".
- Sets over a small universe (n ≤ 20–64): subsets, masks, visited flags.
- Low-level tasks: flags, permissions, hashing, compact encodings.

## Common Mistakes

- Missing parentheses: `(x & 1) == 0`, not `x & 1 == 0`.
- Using `>>` where an unsigned shift `>>>` is needed (infinite loops on negative inputs).
- `1 << i` overflowing for i ≥ 31 — use `1L << i` with `long` masks.
- Assuming `x >> 1` equals `x / 2` for negative x.

## Key Takeaways

- Know the six operators and two's complement (`−x = ~x + 1`).
- Core tricks: test/set/clear/toggle bit i, `x & (x − 1)`, `x & −x`, XOR cancellation.
- Bitmasks represent subsets; iterate masks 0 … 2ⁿ − 1 to enumerate them.
