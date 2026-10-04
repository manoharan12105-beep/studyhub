# DSA Complexity Questions

## Definition

**Complexity questions** ask you to state and **justify** the time or space cost of an algorithm, a data-structure operation or a piece of code: "Why is binary search O(log n)?", "What is the complexity of this nested loop?", "Why is building a heap O(n)?" The justification — counting steps, solving a recurrence, or an amortized argument — matters more than the final symbol.

## Why It Matters

- Every coding answer ends with "what is the complexity?"; a wrong or unjustified answer undermines a correct solution.
- Complexity reasoning decides which approach to pursue in the first place ([Constraints and Complexity](../../problem-solving/constraints-and-complexity/content.md)).
- Follow-ups probe precision: average vs worst vs amortized, time vs space, the cost of library calls.

## Core Concept

Four tools cover almost every question:

| Tool | Use it for | Example |
|------|-----------|---------|
| **Counting iterations** | loops, nested loops with dependent bounds | `for i, for j < i` → Σ i = n(n − 1)/2 = O(n²) |
| **Halving / doubling** | the problem size shrinks by a constant factor | binary search: n → n/2 → … → 1 in log₂ n steps |
| **Recurrences** | recursion | T(n) = 2T(n/2) + O(n) → O(n log n) ([Recurrence Relations](../../fundamentals/recurrence-relations/content.md)) |
| **Amortized arguments** | occasional expensive steps | each element pushed/popped once → O(n) total ([Amortized Analysis](../../fundamentals/amortized-analysis/content.md)) |

And three precision rules:

- Say **which case**: best, average (expected), worst, or amortized.
- Count **hidden costs**: `String` concatenation, `substring`, `contains` on a list, sorting inside a loop, recursion stack space.
- Name **all parameters**: O(V + E), O(n × m), O(n log k) — not just "O(n)".

## How It Works

1. Identify the input size parameters.
2. Find the dominant work: the innermost loop, the recursion, or the most expensive data-structure call.
3. Count it with the right tool (sum, halving, recurrence, amortization).
4. Drop constants and lower-order terms; keep every independent parameter.
5. State space separately: extra arrays, maps, recursion depth, output size.

Notation (O, Ω, Θ) is defined in [Asymptotic Notation](../../fundamentals/asymptotic-notation/content.md); a table of standard costs is in the [Complexity Reference](../../fundamentals/complexity-reference/content.md).

## Common Misconceptions

- **"Two nested loops are always O(n²)."** If the inner pointer never resets (two pointers, sliding window), the total is O(n).
- **"Recursion depth doesn't count as space."** Each active call uses a stack frame: recursive DFS on a path is O(n) space.
- **"Hash map operations are O(1), period."** Expected O(1); worst case O(log n) per bucket in Java 8+ (O(n) in simpler implementations).
- **"The base of the logarithm matters."** Bases differ only by a constant factor (log₂ n = log₁₀ n / log₁₀ 2), so O(log n) ignores the base.

## Key Takeaways

- Justify with counting, halving, recurrences or amortization.
- State the case (average/worst/amortized) and all parameters.
- Remember hidden costs and recursion space.
