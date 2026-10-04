# Problem-Solving Framework

## Definition

A **problem-solving framework** is a fixed sequence of steps for attacking an unfamiliar coding problem: understand it, clarify it, work examples, find a correct brute force, optimise it, plan, code, test and analyse. Following the same steps every time keeps you from coding the wrong problem, freezing on a blank page, or missing edge cases — and in an interview it makes your reasoning visible.

## Why It Matters

- Interviewers grade the **process** as much as the final code: clarifying questions, a stated brute force, a reasoned optimisation, tests and complexity.
- Most wrong answers come from misunderstanding the problem or skipping edge cases, not from not knowing an algorithm.
- A repeatable process reduces anxiety: there is always a next step.

## Core Concept

Separate **thinking** from **typing**. Code only after you know the algorithm, its complexity and how you will test it. Each step produces something concrete:

| Step | Output of the step |
|------|--------------------|
| 1. Understand | the problem restated in your own words |
| 2. Clarify | answers about input ranges, edge cases and output format |
| 3. Examples | 2–4 small examples, including edge cases, with expected answers |
| 4. Brute force | a correct (even slow) method and its complexity |
| 5. Optimise | the bottleneck identified and a faster idea (pattern) |
| 6. Plan | pseudocode or bullet steps, and the target complexity |
| 7. Code | clean Java, written from the plan |
| 8. Test | a dry run on an example and on edge cases |
| 9. Analyse | final time and space complexity, with justification |

## How It Works

### 1. Understand

Read the statement twice. Restate it: "Given …, return …". Identify the input type, the output type and what "valid" means.

### 2. Clarify

Ask about what the statement leaves open:

- **Sizes and ranges:** how large is n? Can values be negative, zero, duplicated, huge (overflow)?
- **Edge cases:** empty input, single element, all equal, no valid answer (return −1? empty list? throw?).
- **Output details:** any valid answer or a specific one? Order of results? Indices or values? 0- or 1-based?
- **Constraints on the solution:** in place? O(1) extra space? Can the input be modified?

The answer to "how large is n" decides the target complexity — see [Constraints and Complexity](../constraints-and-complexity/content.md).

### 3. Examples

Work a normal example by hand, then edge cases. Hand-solving often reveals the algorithm: notice what *you* did to find the answer.

### 4. Brute force

State the simplest correct method and its complexity, even if it is too slow. It proves you understand the problem, gives a fallback, and is the starting point for optimisation.

### 5. Optimise

Ask: **what work is repeated or unnecessary?** Then match it to a technique:

| Bottleneck in the brute force | Technique to try |
|-------------------------------|------------------|
| Searching for a partner / earlier element repeatedly | [hash map](../../patterns/hashing-pattern/content.md) |
| Recomputing sums over ranges | [prefix sums](../../patterns/prefix-sum/content.md) |
| Checking all pairs in sorted data | [two pointers](../../patterns/two-pointers/content.md) |
| Recomputing a window from scratch | [sliding window](../../patterns/sliding-window/content.md) |
| Linear search in sorted data or over a monotone answer | [binary search](../../patterns/binary-search-pattern/content.md), [on the answer](../../patterns/binary-search-on-answer/content.md) |
| Re-solving the same subproblem | [dynamic programming](../../patterns/dp-pattern/content.md) |
| Re-scanning for the next greater/smaller | [monotonic stack](../../patterns/monotonic-stack/content.md) |
| Repeatedly finding the min/max of a changing set | heap ([top K](../../patterns/top-k-elements/content.md)) |
| Trying all orders when one ordering rule suffices | [greedy](../../patterns/greedy-pattern/content.md) after sorting |

Also look for the **best conceivable runtime**: you must at least read the input (O(n)), so an O(n) idea cannot be beaten asymptotically. See [Brute Force to Optimal](../brute-force-to-optimal/content.md) for worked progressions.

### 6. Plan

Write short pseudocode. Decide data structures and variable names. Confirm the plan on your example before coding.

### 7. Code

Write Java from the plan. Habits that prevent bugs:

- Meaningful names (`left`, `right`, `windowSum`), small helper methods.
- Guard clauses for edge cases at the top.
- `long` when sums or products can exceed 2³¹ − 1.
- Avoid modifying the input unless allowed.

### 8. Test

Dry-run the code (not the idea) on the example, tracking variables in a table. Then edge cases: empty, one element, duplicates, negatives, maximum sizes (overflow, recursion depth).

### 9. Analyse

State time and space complexity and **why** (loop counts, recursion depth, data-structure costs). Mention trade-offs and what you would do with more time or different constraints.

## Visual Explanation

```text
 understand → clarify → examples → brute force → optimise → plan → code → test → analyse
     ▲                                  │            │                         │
     └──────── new information ─────────┴────────────┴──── bug found ──────────┘
```

The arrows back are normal: an example may change your understanding, and a failed test sends you back to the plan, not to random edits.

## Real-World Examples

Worked example — **find the numbers missing from 1 … n**. An array of length n contains values in 1 … n; some appear twice and some are missing. Return the missing values.

1. **Understand:** values are in range; return every value of 1 … n not present.
2. **Clarify:** order of output? (increasing). Can the array be modified? (yes). Extra space? (O(1) besides the output, as a follow-up).
3. **Examples:** `[4, 3, 2, 7, 8, 2, 3, 1]` → `[5, 6]`; `[1, 1]` → `[2]`; `[1]` → `[]`.
4. **Brute force:** for each v in 1 … n, scan the array — O(n²).
5. **Optimise:** the repeated work is the membership test → a boolean array/set gives O(n) time, O(n) space. For O(1) extra space, use the array itself as the "seen" table: values are valid indices, so mark index `v − 1` by making it negative.
6. **Plan:** for each value v (use |v|), negate `a[|v| − 1]` if positive; afterwards, indices still positive are missing values.
7. **Code / 8. Test:** below.
9. **Analyse:** O(n) time, O(1) extra space (the output list aside); the input is modified (restore by taking absolute values if needed).

## Java Example

```java
import java.util.*;

public class MissingNumbers {

    // Step 4: brute force, O(n²).
    static List<Integer> bruteForce(int[] a) {
        List<Integer> missing = new ArrayList<>();
        for (int v = 1; v <= a.length; v++) {
            boolean found = false;
            for (int x : a) if (x == v) { found = true; break; }
            if (!found) missing.add(v);
        }
        return missing;
    }

    // Step 5: O(n) time, O(1) extra space — the array marks which values were seen.
    static List<Integer> inPlace(int[] a) {
        for (int x : a) {
            int idx = Math.abs(x) - 1;
            if (a[idx] > 0) a[idx] = -a[idx];          // value idx + 1 has been seen
        }
        List<Integer> missing = new ArrayList<>();
        for (int i = 0; i < a.length; i++) {
            if (a[i] > 0) missing.add(i + 1);
            a[i] = Math.abs(a[i]);                     // restore the input
        }
        return missing;
    }

    public static void main(String[] args) {
        int[] a = {4, 3, 2, 7, 8, 2, 3, 1};
        System.out.println(bruteForce(a) + " " + inPlace(a) + " " + Arrays.toString(a));
        System.out.println(inPlace(new int[] {1, 1}) + " " + inPlace(new int[] {1}));
    }
}
```

**Output:**

```text
[5, 6] [5, 6] [4, 3, 2, 7, 8, 2, 3, 1]
[2] []
```

Both versions agree on every test, and the third value printed shows the input was restored.

## Common Misconceptions

- **"Jumping straight to the optimal solution looks better."** A stated brute force shows understanding and gives a safety net; interviewers expect it.
- **"Clarifying questions waste time."** Thirty seconds of questions prevent solving the wrong problem.
- **"Testing means running the code."** In an interview you test by dry-running your actual code on chosen inputs.
- **"Complexity is a formality at the end."** The target complexity, derived from constraints, should guide the design from step 5.

## Key Takeaways

- Understand → clarify → examples → brute force → optimise → plan → code → test → analyse.
- Optimise by naming the repeated work and matching it to a technique.
- Code from a plan, dry-run your real code, and justify the final complexity.
