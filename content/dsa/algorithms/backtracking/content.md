# Backtracking

## Definition

**Backtracking** builds a solution one decision at a time and explores every possible sequence of decisions with recursion: **choose** an option, **explore** further with that choice in place, then **undo** the choice and try the next option. It systematically walks a **decision tree**, and **prunes** branches that cannot lead to a valid solution. It generates subsets, permutations and combinations, and solves constraint puzzles.

## Why It Matters

Whenever a problem asks for **all** solutions ("all subsets", "all arrangements", "every way to…") or for one solution among exponentially many candidates (Sudoku, N-Queens), backtracking is the standard technique. Interviews test the template, correct undoing, duplicate handling, and estimating the exponential cost.

## Prerequisites

- [Recursion](../recursion/content.md)

## Intuition

Exploring a maze: at each junction, pick a corridor; if it dead-ends, walk back to the junction and try the next corridor. You never need a map of the whole maze — only the path you are currently on and which corridors you have tried at each junction. That path is the recursion stack; walking back is "undo".

## How It Works

### The template

```pseudocode
backtrack(state):
    if state is a complete solution:
        record a copy of it
        return
    for each choice available in state:
        if choice is valid (pruning):
            apply choice            // choose
            backtrack(state)        // explore
            remove choice           // undo
```

Three questions define every backtracking problem:

1. **What is the state?** (the partial solution: current subset, path, board)
2. **What are the choices at each step?** (include/exclude an element, which unused element goes next, which cell…)
3. **When is it complete, and which choices are invalid?** (base case and pruning)

### Decision tree

Each node is a partial solution; each edge is a choice; leaves are complete candidates. The algorithm is a depth-first traversal of this tree. Pruning cuts subtrees early.

### Subsets (include / exclude)

For each element: either include it or not → 2ⁿ leaves. Equivalent "start index" formulation: at each node, record the current subset, then try adding each element after the last one added.

### Permutations (pick an unused element)

At depth d, choose any element not yet used for position d; track `used[]` → n! leaves.

### Combinations (choose k of n)

Like subsets with a start index, but stop when the size reaches k; prune when not enough elements remain.

### Handling duplicates

With repeated values (`[1, 2, 2]`), identical branches produce identical results. **Sort first**, then at the same depth skip a value equal to the previous one (`i > start && nums[i] == nums[i − 1]`) — for permutations, skip when the previous equal element is not currently used.

## Visual Explanation

```text
Subsets of [1, 2, 3] (start-index form): every node is recorded

                       []
          /             |           \
        [1]            [2]          [3]
       /    \           |
   [1,2]   [1,3]      [2,3]
     |
  [1,2,3]

Permutations of [1, 2, 3]: choose an unused element at each level

                 _ _ _
        /          |          \
      1 _ _      2 _ _      3 _ _
      /   \      /   \      /   \
   1 2 _ 1 3 _ 2 1 _ 2 3 _ 3 1 _ 3 2 _
     |     |     |     |     |     |
   123   132   213   231   312   321
```

## Pseudocode

```pseudocode
subsets(nums, start, current, result):
    result.add(copy of current)
    for i from start to n − 1:
        current.add(nums[i])                    // choose
        subsets(nums, i + 1, current, result)   // explore
        current.removeLast()                    // undo
```

## Java Implementation

```java
import java.util.*;

public class Backtracking {

    static List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        buildSubsets(nums, 0, new ArrayList<>(), result);
        return result;
    }

    private static void buildSubsets(int[] nums, int start, List<Integer> current, List<List<Integer>> result) {
        result.add(new ArrayList<>(current));          // every node is a subset; copy it
        for (int i = start; i < nums.length; i++) {
            current.add(nums[i]);                      // choose
            buildSubsets(nums, i + 1, current, result); // explore
            current.remove(current.size() - 1);        // undo
        }
    }

    static List<List<Integer>> permutations(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        buildPermutations(nums, new boolean[nums.length], new ArrayList<>(), result);
        return result;
    }

    private static void buildPermutations(int[] nums, boolean[] used, List<Integer> current, List<List<Integer>> result) {
        if (current.size() == nums.length) {
            result.add(new ArrayList<>(current));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            current.add(nums[i]);
            buildPermutations(nums, used, current, result);
            current.remove(current.size() - 1);
            used[i] = false;
        }
    }

    static List<List<Integer>> combinations(int n, int k) {
        List<List<Integer>> result = new ArrayList<>();
        buildCombinations(1, n, k, new ArrayList<>(), result);
        return result;
    }

    private static void buildCombinations(int start, int n, int k, List<Integer> current, List<List<Integer>> result) {
        if (current.size() == k) {
            result.add(new ArrayList<>(current));
            return;
        }
        int needed = k - current.size();
        for (int value = start; value <= n - needed + 1; value++) {   // prune: enough numbers must remain
            current.add(value);
            buildCombinations(value + 1, n, k, current, result);
            current.remove(current.size() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.println("subsets " + subsets(new int[] {1, 2, 3}));
        System.out.println("permutations " + permutations(new int[] {1, 2, 3}));
        System.out.println("C(4,2) " + combinations(4, 2));
        System.out.println("counts: 2^4=" + subsets(new int[] {1, 2, 3, 4}).size() + " 4!=" + permutations(new int[] {1, 2, 3, 4}).size() + " C(5,3)=" + combinations(5, 3).size());
    }
}
```

**Output:**

```text
subsets [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
permutations [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
C(4,2) [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]
counts: 2^4=16 4!=24 C(5,3)=10
```

## Dry Run

`buildSubsets([1, 2, 3])` — first steps:

| Call (start, current) | Records | Loop choice | After undo |
|-----------------------|---------|-------------|------------|
| (0, []) | [] | add 1 → recurse | [] |
| (1, [1]) | [1] | add 2 → recurse | [1] |
| (2, [1, 2]) | [1, 2] | add 3 → recurse | [1, 2] |
| (3, [1, 2, 3]) | [1, 2, 3] | loop empty, return | — |
| back in (1, [1]) | | add 3 → recurse | [1] |
| (3, [1, 3]) | [1, 3] | return | — |
| back in (0, []) | | add 2 → … | [] |

## Complexity Analysis

| Problem | Number of results | Time | Extra space |
|---------|-------------------|------|-------------|
| Subsets | 2ⁿ | O(n × 2ⁿ) — copying each result costs O(n) | O(n) recursion + path |
| Permutations | n! | O(n × n!) | O(n) |
| Combinations C(n, k) | C(n, k) | O(k × C(n, k)) | O(k) |
| General search, depth d, branching b | up to bᵈ | O(bᵈ) nodes, less with pruning | O(d) |

The output size itself is exponential, so no algorithm listing all results can be polynomial. Pruning reduces the constant (or the base), not the worst-case class.

## Properties

- Depth-first, uses O(depth) memory for the current path.
- Finds **all** solutions, or stops at the first one if the function returns a boolean.
- Correctness depends on undoing **exactly** what was done.

## Variations

- **Return on first solution:** make the function return `boolean` and stop when it returns `true` (Sudoku, maze).
- **Counting solutions:** return counts instead of collecting lists.
- **Bitmask state:** use an `int` mask instead of a `used[]` array for small n.
- **Swap-based permutations:** permute in place by swapping `nums[start]` with each later element.
- **Constraint problems:** [Backtracking Problems](../backtracking-problems/content.md) — N-Queens, Sudoku, mazes, word search.

## Comparison

| | Backtracking | Dynamic programming | Greedy |
|---|--------------|---------------------|--------|
| Explores | all choices (with pruning) | each subproblem once | one choice per step |
| Output | all solutions or one | best value / count | one solution |
| Time | exponential | polynomial in the number of states | usually O(n log n) |
| Use when | you need every solution, or no structure allows DP/greedy | overlapping subproblems | greedy choice property holds |

If the question asks for the **number** of ways or the **best** value and subproblems overlap, try DP first; if it asks to **list** every way, backtracking is unavoidable.

## Edge Cases

- Empty input: subsets → `[[]]`; permutations → `[[]]`.
- Duplicates in the input (sort + skip).
- k = 0 or k = n in combinations.

## Advantages

- Simple, general template for exhaustive search.
- Pruning can make large search spaces practical.

## Disadvantages

- Exponential time; only viable for small n (≈ 20 for subsets, ≈ 10 for permutations).
- Bugs from forgetting to undo or from not copying the current path.

## When to Use

- "Generate all…", "list every…", "find all combinations/permutations/partitions".
- Constraint satisfaction: puzzles, placements, colourings.
- Small n (constraints like n ≤ 15–20) — a strong hint that exponential search is intended.

## Common Mistakes

- Adding `current` itself to the result instead of a **copy** (all results end up empty).
- Forgetting to undo (`remove`, `used[i] = false`).
- Using `remove(Integer)` vs `remove(int)` incorrectly on a `List<Integer>` — remove by index (`size() − 1`).
- Not sorting before skipping duplicates.

## Key Takeaways

- Choose → explore → undo, over a decision tree.
- Subsets 2ⁿ (start index), permutations n! (`used[]`), combinations C(n, k) (start index + size limit).
- Copy the path when recording; sort and skip equal neighbours to avoid duplicates.
- Exponential by nature — prune invalid branches early.
