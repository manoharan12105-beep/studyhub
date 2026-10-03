# Recursion

## Definition

**Recursion** is when a function solves a problem by calling itself on a **smaller instance** of the same problem. Every recursive function needs a **base case** (an input small enough to answer directly) and a **recursive case** (which reduces the input and combines the result). Each call gets its own **stack frame** on the **call stack**.

## Why It Matters

Recursion is the natural way to express problems that contain smaller copies of themselves: trees, divide and conquer, backtracking, and dynamic programming all start from a recursive formulation. Interviews test whether you can design the recursion (what does the function return? what is the base case?) and analyse its cost with a **recursion tree**.

## Prerequisites

- [Stack](../../data-structures/stack/content.md) — the call stack is a stack.
- [Recurrence Relations](../../fundamentals/recurrence-relations/content.md) — for the complexity.

## Intuition

To count the people in a queue from the back, you could ask the person in front of you "how many are ahead of you?" — they ask the next person, and so on, until the first person answers "zero". Each answer flows back with +1 added. Nobody needs to see the whole queue: each person trusts the answer of the smaller problem in front of them.

That trust — the **recursive leap of faith** — is the key skill: assume the call on the smaller input returns the right answer, and only make sure that (1) the base case is right and (2) you combine correctly.

## How It Works

### Designing a recursive function

1. **Define the function precisely** — what it takes and what it returns ("`sum(arr, i)` returns the sum of `arr[i..n−1]`").
2. **Base case(s)** — the smallest inputs, answered without recursion (`i == n` → 0).
3. **Recursive case** — express the answer for the current input using answers for strictly smaller inputs (`arr[i] + sum(arr, i + 1)`).
4. **Make progress** — every call must move toward a base case, or the recursion never ends.

### The call stack

Each call pushes a frame holding its parameters, local variables and return address. When a call returns, its frame is popped and the caller resumes. Recursion depth = maximum number of frames at once = stack space used.

```text
factorial(3)
  → 3 × factorial(2)            frames: [f(3)]
         → 2 × factorial(1)     frames: [f(3), f(2)]
                → 1              frames: [f(3), f(2), f(1)]   base case
         ← 2 × 1 = 2             frames: [f(3), f(2)]
  ← 3 × 2 = 6                    frames: [f(3)]
```

### The recursion tree

When a call makes several recursive calls, draw them as a tree: each node is a call, its children are the calls it makes. **Total time = sum of work over all nodes; space = depth of the tree.**

```text
fib(4)
├── fib(3)
│   ├── fib(2)
│   │   ├── fib(1)
│   │   └── fib(0)
│   └── fib(1)
└── fib(2)            ← computed again: overlapping subproblems
    ├── fib(1)
    └── fib(0)

9 calls for fib(4); the count grows about 1.6× per +1 in n → exponential
```

Repeated subtrees are the signal for [Dynamic Programming](../dynamic-programming/content.md): store each result once (memoization).

### Kinds of recursion

| Kind | Example | Calls per level |
|------|---------|-----------------|
| Linear (one call) | factorial, sum of a list, linked-list traversal | 1 |
| Binary / tree (several calls) | Fibonacci, tree traversals, merge sort | 2+ |
| Tail recursion (call is the last action) | `gcd(b, a % b)` | 1 — Java does **not** optimise tail calls, so it still uses stack frames |
| Mutual recursion | `isEven(n)` calls `isOdd(n − 1)` | — |
| Indirect, with backtracking | subsets, permutations | many |

## Visual Explanation

```text
sumArray([4, 1, 7], i = 0)

sum(0) = 4 + sum(1)
             sum(1) = 1 + sum(2)
                          sum(2) = 7 + sum(3)
                                       sum(3) = 0        ← base case (i == n)
                          sum(2) = 7
             sum(1) = 8
sum(0) = 12
```

## Pseudocode

```pseudocode
solve(problem):
    if problem is a base case:
        return direct answer
    smaller ← reduce(problem)
    partial ← solve(smaller)          // leap of faith
    return combine(problem, partial)
```

## Java Implementation

```java
public class RecursionBasics {

    static long factorial(int n) {
        if (n <= 1) return 1;                    // base case
        return n * factorial(n - 1);             // recursive case: smaller input
    }

    // Sum of arr[i..n-1].
    static int sum(int[] arr, int i) {
        if (i == arr.length) return 0;
        return arr[i] + sum(arr, i + 1);
    }

    static int sumOfDigits(int n) {
        if (n < 10) return n;
        return n % 10 + sumOfDigits(n / 10);
    }

    static boolean isPalindrome(String s, int left, int right) {
        if (left >= right) return true;          // 0 or 1 characters left
        if (s.charAt(left) != s.charAt(right)) return false;
        return isPalindrome(s, left + 1, right - 1);
    }

    static int calls;

    static long fib(int n) {
        calls++;
        if (n < 2) return n;
        return fib(n - 1) + fib(n - 2);          // two calls → recursion tree
    }

    // Print n down to 1, then 1 up to n: code before the call runs on the way down, after it on the way up.
    static void downAndUp(int n, StringBuilder out) {
        if (n == 0) return;
        out.append(n).append(' ');
        downAndUp(n - 1, out);
        out.append(n).append(' ');
    }

    static int depth(int n) {                    // how deep can Java recurse here?
        try {
            return depth(n + 1);
        } catch (StackOverflowError e) {
            return n;
        }
    }

    public static void main(String[] args) {
        System.out.println("5! = " + factorial(5) + ", 20! = " + factorial(20));
        System.out.println("sum = " + sum(new int[] {4, 1, 7}, 0) + ", digit sum of 9875 = " + sumOfDigits(9875));
        System.out.println("racecar palindrome? " + isPalindrome("racecar", 0, 6) + ", ab? " + isPalindrome("ab", 0, 1));
        calls = 0;
        System.out.println("fib(4) = " + fib(4) + " using " + calls + " calls");
        StringBuilder sb = new StringBuilder();
        downAndUp(3, sb);
        System.out.println("down and up: " + sb.toString().trim());
        System.out.println("stack overflow happens after thousands of frames: " + (depth(0) > 1000));
    }
}
```

**Output:**

```text
5! = 120, 20! = 2432902008176640000
sum = 12, digit sum of 9875 = 29
racecar palindrome? true, ab? false
fib(4) = 3 using 9 calls
down and up: 3 2 1 1 2 3
stack overflow happens after thousands of frames: true
```

## Dry Run

`downAndUp(2)` — statements before the recursive call run while descending, statements after it while returning:

| Step | Frame | Action | Output |
|------|-------|--------|--------|
| 1 | n = 2 | print 2, call n = 1 | 2 |
| 2 | n = 1 | print 1, call n = 0 | 2 1 |
| 3 | n = 0 | base case, return | |
| 4 | n = 1 | print 1, return | 2 1 1 |
| 5 | n = 2 | print 2, return | 2 1 1 2 |

## Complexity Analysis

| Recursion | Recurrence | Time | Space (depth) |
|-----------|-----------|------|---------------|
| factorial, sum, digit sum | T(n) = T(n − 1) + O(1) | O(n) (digits: O(log n)) | O(n) |
| palindrome by indices | T(n) = T(n − 2) + O(1) | O(n) | O(n) |
| naive Fibonacci | T(n) = T(n − 1) + T(n − 2) + O(1) | O(φⁿ) ≈ O(1.618ⁿ) | O(n) |
| binary search (recursive) | T(n) = T(n/2) + O(1) | O(log n) | O(log n) |

Method: write the recurrence, then unroll it or draw the recursion tree (time = total work of all nodes; space = height). See [Recurrence Relations](../../fundamentals/recurrence-relations/content.md).

## Properties

- Every recursive solution can be rewritten iteratively with an explicit stack (and linear/tail recursion with a simple loop).
- Recursion uses O(depth) stack space even when it allocates nothing else.

## Variations

- **Head vs tail position:** work before the call (preorder-like) or after (postorder-like).
- **Accumulator parameters:** pass the partial result down (`sum(arr, i, acc)`) to make recursion tail-shaped.
- **Memoized recursion:** cache results → [Dynamic Programming](../dynamic-programming/content.md).
- **Backtracking:** recursion that builds candidates step by step and undoes choices → [Backtracking](../backtracking/content.md).

## Comparison

| | Recursion | Iteration |
|---|-----------|-----------|
| Code for trees, D&C, backtracking | short, natural | needs an explicit stack |
| Memory | O(depth) stack frames | O(1) for simple loops |
| Risk | `StackOverflowError` for deep inputs (≈ 10⁴–10⁵ frames by default) | none |
| Speed in Java | call overhead | slightly faster |

## Edge Cases

- Base case for the smallest valid input (empty array, n = 0, n = 1).
- Negative inputs that skip past the base case (e.g. `factorial(-1)` with `n == 0` as the only base case recurses forever) — guard them.
- Very deep recursion (linked list of 10⁶ nodes) — use iteration.

## Advantages

- Mirrors recursive structure (trees, nested data, divide and conquer) directly.
- Short, readable solutions; natural starting point for DP.

## Disadvantages

- Stack space O(depth); deep recursion overflows.
- Exponential time if subproblems overlap and are not memoized.
- Harder to debug for beginners.

## When to Use

- The input is recursive (trees, nested lists, expressions).
- The problem splits into smaller copies of itself (divide and conquer).
- You must explore all choices (backtracking) or define DP states.

**When not to use:** simple linear loops over large inputs, where recursion only adds stack risk.

## Common Mistakes

- Missing or unreachable base case → infinite recursion → `StackOverflowError`.
- Not making progress (calling with the same input).
- Forgetting to `return` the recursive result.
- Recomputing overlapping subproblems (naive Fibonacci) without memoization.
- Creating new strings/arrays in each call (`substring`) — hidden O(n) per call.

## Key Takeaways

- Base case + recursive case on a smaller input + trust the smaller call.
- Each active call is a stack frame: space = depth.
- Time = total work over the recursion tree; overlapping subtrees → memoize (DP).
- Java has no tail-call optimisation — prefer iteration for very deep linear recursion.
